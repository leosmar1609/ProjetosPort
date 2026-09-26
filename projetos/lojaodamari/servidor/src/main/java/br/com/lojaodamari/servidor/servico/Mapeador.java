package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.SituacaoEstoque;
import br.com.lojaodamari.comum.enums.StatusVenda;
import br.com.lojaodamari.servidor.dominio.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;

// converte entidade em DTO. fica tudo aqui pra regra de "como mostrar" não se espalhar pelos serviços
public final class Mapeador {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private Mapeador() {
    }

    public static UsuarioDto usuario(Usuario u) {
        return new UsuarioDto(u.getId(), u.getNome(), u.getLogin(), u.getPerfil(), u.isAtivo());
    }

    public static SecaoDto secao(Secao s) {
        return new SecaoDto(s.getId(), s.getNome());
    }

    public static FornecedorDto fornecedor(Fornecedor f) {
        return new FornecedorDto(f.getId(), f.getNome(), f.getCnpj(), f.getTelefone(), f.getEmail(), f.getPrazoEntregaDias());
    }

    // produto com preço do dia, margem e situação calculados. proximaValidade vem de fora (uma consulta pra todos)
    public static ProdutoDto produto(Produto p, LocalDate hoje, LocalDate proximaValidade) {
        BigDecimal preco = p.precoAtual(hoje);
        Integer dias = proximaValidade == null ? null : (int) ChronoUnit.DAYS.between(hoje, proximaValidade);
        return new ProdutoDto(p.getId(), p.getNome(), p.getEan(), p.getPlu(), p.getUnidade(),
                p.getSecao().getId(), p.getSecao().getNome(),
                p.getFornecedor() == null ? null : p.getFornecedor().getId(), p.getFornecedor() == null ? null : p.getFornecedor().getNome(),
                p.isProducaoPropria(), p.getPrecoVenda(), p.getPrecoPromocional(), p.getPromocaoInicio(), p.getPromocaoFim(),
                preco, p.emPromocao(hoje), p.getCustoMedio().setScale(2, RoundingMode.HALF_UP), margem(preco, p.getCustoMedio()),
                p.getEstoqueAtual(), p.getEstoqueMinimo(), proximaValidade, dias, situacao(p, dias), p.isAtivo());
    }

    // margem bruta em %: quanto do preço sobra depois do custo
    public static BigDecimal margem(BigDecimal preco, BigDecimal custo) {
        if (preco.signum() == 0) return BigDecimal.ZERO;
        return preco.subtract(custo).multiply(CEM).divide(preco, 1, RoundingMode.HALF_UP);
    }

    // do mais grave pro mais leve: sem estoque, vence em 2 dias, abaixo do mínimo, vence em 7 dias
    public static SituacaoEstoque situacao(Produto p, Integer diasParaVencer) {
        if (p.getEstoqueAtual().signum() <= 0) return SituacaoEstoque.RUPTURA;
        if (diasParaVencer != null && diasParaVencer <= 2) return SituacaoEstoque.VENCE_LOGO;
        if (p.getEstoqueAtual().compareTo(p.getEstoqueMinimo()) < 0) return SituacaoEstoque.ABAIXO_MINIMO;
        if (diasParaVencer != null && diasParaVencer <= 7) return SituacaoEstoque.VENCENDO;
        return SituacaoEstoque.NORMAL;
    }

    public static LoteDto lote(Lote l) {
        return new LoteDto(l.getId(), l.getQuantidadeInicial(), l.getSaldo(), l.getCustoUnitario().setScale(2, RoundingMode.HALF_UP),
                l.getValidade(), l.getNotaFiscal(), l.getRecebidoEm());
    }

    public static MovimentoDto movimento(MovimentoEstoque m) {
        return new MovimentoDto(m.getId(), m.getTipo(), m.getProduto().getId(), m.getProduto().getNome(), m.getQuantidade(),
                m.getSaldoDepois(), m.getObservacao(), m.getUsuario() == null ? null : m.getUsuario().getNome(), m.getDataHora());
    }

    // venda com os totais que o caixa precisa: quanto falta e o troco
    public static VendaDto venda(Venda v) {
        BigDecimal total = v.calcularTotal();
        BigDecimal pago = v.totalPago();
        BigDecimal falta = total.subtract(pago).max(BigDecimal.ZERO);
        BigDecimal troco = v.getStatus() == StatusVenda.CONCLUIDA ? v.getTroco() : pago.subtract(total).max(BigDecimal.ZERO);
        return new VendaDto(v.getId(), v.getId(), v.getSessao().getId(), v.getSessao().getNumeroCaixa(), v.getOperador().getNome(),
                v.getStatus(),
                v.getItens().stream().sorted(Comparator.comparingInt(ItemVenda::getSequencia)).map(Mapeador::item).toList(),
                v.getPagamentos().stream().map(p -> new PagamentoDto(p.getForma(), p.getValor())).toList(),
                total, pago, falta, troco, v.getCpf(), v.getIniciadaEm(), v.getConcluidaEm());
    }

    public static ItemVendaDto item(ItemVenda i) {
        return new ItemVendaDto(i.getId(), i.getSequencia(), i.getProduto().getId(), i.getCodigo(), i.getDescricao(), i.getUnidade(),
                i.getQuantidade(), i.getPrecoUnitario(), i.getTotal(), i.isPromocao(), i.isCancelado());
    }

    public static PedidoCompraDto pedido(PedidoCompra p) {
        var itens = p.getItens().stream().map(i -> new ItemPedidoDto(i.getProduto().getId(), i.getProduto().getNome(), i.getProduto().getUnidade(),
                i.getQuantidade(), i.getCustoUnitario().setScale(2, RoundingMode.HALF_UP), i.getQuantidadeRecebida(),
                i.getQuantidade().multiply(i.getCustoUnitario()).setScale(2, RoundingMode.HALF_UP))).toList();
        BigDecimal total = itens.stream().map(ItemPedidoDto::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PedidoCompraDto(p.getId(), numeroPedido(p.getId()), p.getFornecedor().getId(), p.getFornecedor().getNome(), p.getStatus(),
                p.getCriadoEm(), p.getEnviadoEm(), p.getRecebidoEm(), p.getPrevisaoEntrega(), p.getNotaFiscal(), itens, total);
    }

    public static String numeroPedido(Long id) {
        return String.format("PC-%05d", id);
    }
}
