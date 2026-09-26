package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.StatusPedido;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.servidor.dominio.*;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.FornecedorRepositorio;
import br.com.lojaodamari.servidor.repositorio.PedidoCompraRepositorio;
import br.com.lojaodamari.servidor.repositorio.ProdutoRepositorio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// sugestão de compra, pedidos e recebimento de mercadoria
@Service
public class CompraServico {

    // quantos dias de venda o pedido deve cobrir depois que a mercadoria chega
    private static final int DIAS_COBERTURA = 7;
    private static final int DIAS_GIRO = 30;

    private final ProdutoRepositorio produtos;
    private final FornecedorRepositorio fornecedores;
    private final PedidoCompraRepositorio pedidos;
    private final UsuarioRepositorio usuarios;
    private final EstoqueServico estoque;
    private final JdbcTemplate jdbc;
    private final Clock relogio;

    public CompraServico(ProdutoRepositorio produtos, FornecedorRepositorio fornecedores, PedidoCompraRepositorio pedidos, UsuarioRepositorio usuarios,
                         EstoqueServico estoque, JdbcTemplate jdbc, Clock relogio) {
        this.produtos = produtos;
        this.fornecedores = fornecedores;
        this.pedidos = pedidos;
        this.usuarios = usuarios;
        this.estoque = estoque;
        this.jdbc = jdbc;
        this.relogio = relogio;
    }

    // o que comprar de cada fornecedor. entra na lista quem está abaixo do mínimo ou vai acabar antes da próxima entrega.
    // quantidade = giro × (prazo de entrega + 7 dias) + mínimo - estoque. produto que já está num pedido aberto fica de fora
    @Transactional(readOnly = true)
    public List<SugestaoCompraDto> sugestao() {
        Map<Long, BigDecimal> giro = giroDiario();
        Set<Long> jaPedidos = pedidos.findByStatusIn(List.of(StatusPedido.RASCUNHO, StatusPedido.ENVIADO)).stream()
                .flatMap(p -> p.getItens().stream()).map(i -> i.getProduto().getId()).collect(Collectors.toSet());

        Map<Fornecedor, List<ItemSugestaoDto>> porFornecedor = new TreeMap<>(Comparator.comparing(Fornecedor::getNome));
        for (Produto p : produtos.findAllByOrderByNome()) {
            if (!p.isAtivo() || p.isProducaoPropria() || p.getFornecedor() == null || jaPedidos.contains(p.getId())) continue;
            BigDecimal g = giro.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal saldo = p.getEstoqueAtual().max(BigDecimal.ZERO);
            BigDecimal cobertura = g.signum() == 0 ? null : saldo.divide(g, 1, RoundingMode.HALF_UP);
            int prazo = p.getFornecedor().getPrazoEntregaDias();
            boolean abaixo = p.getEstoqueAtual().compareTo(p.getEstoqueMinimo()) < 0;
            boolean acabaAntes = cobertura != null && cobertura.compareTo(BigDecimal.valueOf(prazo + 2L)) < 0;
            if (!abaixo && !acabaAntes) continue;

            BigDecimal quantidade = g.multiply(BigDecimal.valueOf(prazo + DIAS_COBERTURA)).add(p.getEstoqueMinimo()).subtract(saldo)
                    .setScale(0, RoundingMode.CEILING);
            if (quantidade.signum() <= 0) continue;
            BigDecimal custo = p.getCustoMedio().setScale(2, RoundingMode.HALF_UP);
            porFornecedor.computeIfAbsent(p.getFornecedor(), f -> new ArrayList<>()).add(new ItemSugestaoDto(p.getId(), p.getNome(), p.getUnidade(),
                    p.getEstoqueAtual(), p.getEstoqueMinimo(), g.setScale(1, RoundingMode.HALF_UP), cobertura, quantidade, custo,
                    custo.multiply(quantidade).setScale(2, RoundingMode.HALF_UP)));
        }
        return porFornecedor.entrySet().stream().map(e -> {
            var itens = e.getValue().stream().sorted(Comparator.comparing(i -> i.coberturaDias() == null ? BigDecimal.valueOf(999) : i.coberturaDias())).toList();
            BigDecimal total = itens.stream().map(ItemSugestaoDto::custoEstimado).reduce(BigDecimal.ZERO, BigDecimal::add);
            return new SugestaoCompraDto(e.getKey().getId(), e.getKey().getNome(), e.getKey().getPrazoEntregaDias(), itens, total);
        }).toList();
    }

    // média vendida por dia nos últimos 30 dias, por produto
    private Map<Long, BigDecimal> giroDiario() {
        Map<Long, BigDecimal> giro = new HashMap<>();
        jdbc.query("SELECT i.produto_id, SUM(i.quantidade) AS qtd FROM item_venda i JOIN venda v ON v.id = i.venda_id "
                        + "WHERE v.status = 'CONCLUIDA' AND i.cancelado = FALSE AND v.concluida_em >= ? GROUP BY i.produto_id",
                rs -> {
                    giro.put(rs.getLong("produto_id"), rs.getBigDecimal("qtd").divide(BigDecimal.valueOf(DIAS_GIRO), 3, RoundingMode.HALF_UP));
                }, LocalDateTime.now(relogio).minusDays(DIAS_GIRO));
        return giro;
    }

    @Transactional(readOnly = true)
    public List<PedidoCompraDto> listar() {
        return pedidos.findAllByOrderByCriadoEmDesc().stream().map(Mapeador::pedido).toList();
    }

    @Transactional(readOnly = true)
    public PedidoCompraDto buscar(Long id) {
        return Mapeador.pedido(carregar(id));
    }

    // cria o pedido como rascunho. todos os itens precisam ser do mesmo fornecedor
    @Transactional
    public PedidoCompraDto criar(PedidoCompraForm f, Long usuarioId) {
        Fornecedor fornecedor = fornecedores.findById(f.fornecedorId())
                .orElseThrow(() -> ExcecaoNegocio.invalido("fornecedor_invalido", "Fornecedor não encontrado."));
        PedidoCompra pedido = new PedidoCompra();
        pedido.setFornecedor(fornecedor);
        pedido.setStatus(StatusPedido.RASCUNHO);
        pedido.setCriadoEm(LocalDateTime.now(relogio));
        pedido.setCriadoPor(usuarios.getReferenceById(usuarioId));
        Set<Long> vistos = new HashSet<>();
        for (ItemPedidoForm i : f.itens()) {
            if (!vistos.add(i.produtoId())) {
                throw ExcecaoNegocio.invalido("item_repetido", "Um produto aparece duas vezes no pedido. Junte as quantidades numa linha só.");
            }
            Produto p = produtos.findById(i.produtoId()).orElseThrow(() -> ExcecaoNegocio.invalido("produto_invalido", "Produto " + i.produtoId() + " não encontrado."));
            if (p.getFornecedor() == null || !p.getFornecedor().getId().equals(fornecedor.getId())) {
                throw ExcecaoNegocio.invalido("fornecedor_diferente", p.getNome() + " não é fornecido por " + fornecedor.getNome() + ".");
            }
            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProduto(p);
            item.setQuantidade(p.getUnidade() == Unidade.UN ? i.quantidade().setScale(0, RoundingMode.CEILING).setScale(3) : i.quantidade().setScale(3, RoundingMode.HALF_UP));
            item.setCustoUnitario(i.custoUnitario());
            item.setQuantidadeRecebida(BigDecimal.ZERO);
            pedido.getItens().add(item);
        }
        return Mapeador.pedido(pedidos.save(pedido));
    }

    // envia pro fornecedor. a previsão de entrega sai do prazo cadastrado
    @Transactional
    public PedidoCompraDto enviar(Long id) {
        PedidoCompra p = carregar(id);
        exigirStatus(p, StatusPedido.RASCUNHO, "enviado");
        p.setStatus(StatusPedido.ENVIADO);
        p.setEnviadoEm(LocalDateTime.now(relogio));
        p.setPrevisaoEntrega(LocalDate.now(relogio).plusDays(p.getFornecedor().getPrazoEntregaDias()));
        return Mapeador.pedido(p);
    }

    // mercadoria chegou: cada item recebido vira um lote no estoque, com a validade informada
    @Transactional
    public PedidoCompraDto receber(Long id, RecebimentoForm f, Long usuarioId) {
        PedidoCompra pedido = carregar(id);
        exigirStatus(pedido, StatusPedido.ENVIADO, "recebido");
        Map<Long, ItemPedido> itens = pedido.getItens().stream().collect(Collectors.toMap(i -> i.getProduto().getId(), i -> i));
        boolean chegouAlgo = false;
        for (ItemRecebimentoForm r : f.itens()) {
            ItemPedido item = itens.get(r.produtoId());
            if (item == null) {
                throw ExcecaoNegocio.invalido("item_fora_do_pedido", "O produto " + r.produtoId() + " não está neste pedido.");
            }
            if (r.quantidadeRecebida().signum() == 0) continue;
            if (r.validade() != null && r.validade().isBefore(LocalDate.now(relogio))) {
                throw ExcecaoNegocio.invalido("lote_vencido", item.getProduto().getNome() + " chegou com validade vencida. Recuse o item (quantidade 0).");
            }
            item.setQuantidadeRecebida(r.quantidadeRecebida());
            item.setCustoUnitario(r.custoUnitario());
            estoque.registrarEntrada(item.getProduto(), r.quantidadeRecebida().setScale(3, RoundingMode.HALF_UP), r.custoUnitario(), r.validade(), f.notaFiscal(),
                    usuarioId, "Recebimento " + Mapeador.numeroPedido(pedido.getId()) + (f.notaFiscal() == null ? "" : " · NF " + f.notaFiscal()));
            chegouAlgo = true;
        }
        if (!chegouAlgo) {
            throw ExcecaoNegocio.invalido("nada_recebido", "Nenhum item com quantidade recebida. Se nada chegou, cancele o pedido.");
        }
        pedido.setStatus(StatusPedido.RECEBIDO);
        pedido.setRecebidoEm(LocalDateTime.now(relogio));
        pedido.setNotaFiscal(f.notaFiscal());
        return Mapeador.pedido(pedido);
    }

    @Transactional
    public PedidoCompraDto cancelar(Long id) {
        PedidoCompra p = carregar(id);
        if (p.getStatus() == StatusPedido.RECEBIDO || p.getStatus() == StatusPedido.CANCELADO) {
            throw ExcecaoNegocio.invalido("pedido_encerrado", "Esse pedido já foi " + (p.getStatus() == StatusPedido.RECEBIDO ? "recebido" : "cancelado") + ".");
        }
        p.setStatus(StatusPedido.CANCELADO);
        return Mapeador.pedido(p);
    }

    private PedidoCompra carregar(Long id) {
        return pedidos.findById(id).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("pedido_nao_encontrado", "Pedido não encontrado."));
    }

    private static void exigirStatus(PedidoCompra p, StatusPedido esperado, String acao) {
        if (p.getStatus() != esperado) {
            throw ExcecaoNegocio.invalido("status_invalido", "Só pedido " + esperado.name().toLowerCase() + " pode ser " + acao + ". Este está " + p.getStatus().name().toLowerCase() + ".");
        }
    }
}
