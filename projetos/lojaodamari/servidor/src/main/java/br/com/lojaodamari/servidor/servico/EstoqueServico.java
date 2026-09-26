package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.SituacaoEstoque;
import br.com.lojaodamari.comum.enums.TipoMovimento;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.servidor.dominio.*;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.LoteRepositorio;
import br.com.lojaodamari.servidor.repositorio.MovimentoEstoqueRepositorio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// tudo que mexe na quantidade em estoque passa por aqui e deixa um movimento registrado
@Service
public class EstoqueServico {

    private final CatalogoServico catalogo;
    private final LoteRepositorio lotes;
    private final MovimentoEstoqueRepositorio movimentos;
    private final UsuarioRepositorio usuarios;
    private final Clock relogio;

    public EstoqueServico(CatalogoServico catalogo, LoteRepositorio lotes, MovimentoEstoqueRepositorio movimentos, UsuarioRepositorio usuarios, Clock relogio) {
        this.catalogo = catalogo;
        this.lotes = lotes;
        this.movimentos = movimentos;
        this.usuarios = usuarios;
        this.relogio = relogio;
    }

    // entrada de mercadoria: cria o lote e recalcula o custo médio ponderado
    @Transactional
    public ProdutoDto entrada(EntradaForm f, Long usuarioId) {
        Produto p = catalogo.buscarProduto(f.produtoId());
        BigDecimal quantidade = quantidadeValida(p, f.quantidade());
        if (f.validade() != null && f.validade().isBefore(LocalDate.now(relogio))) {
            throw ExcecaoNegocio.invalido("lote_vencido", "A validade do lote já passou. Não dá para dar entrada em produto vencido.");
        }
        registrarEntrada(p, quantidade, f.custoUnitario(), f.validade(), f.notaFiscal(), usuarioId, "Entrada de mercadoria" + (f.notaFiscal() == null ? "" : " · NF " + f.notaFiscal()));
        return catalogo.produto(p.getId());
    }

    // usado pela entrada manual e pelo recebimento do pedido de compra
    void registrarEntrada(Produto p, BigDecimal quantidade, BigDecimal custo, LocalDate validade, String nota, Long usuarioId, String observacao) {
        BigDecimal saldoAntes = p.getEstoqueAtual().max(BigDecimal.ZERO);
        BigDecimal novoCusto = p.getCustoMedio().multiply(saldoAntes).add(custo.multiply(quantidade))
                .divide(saldoAntes.add(quantidade), 4, RoundingMode.HALF_UP);
        p.setCustoMedio(novoCusto);
        p.setEstoqueAtual(p.getEstoqueAtual().add(quantidade));

        Lote l = new Lote();
        l.setProduto(p);
        l.setQuantidadeInicial(quantidade);
        l.setSaldo(quantidade);
        l.setCustoUnitario(custo);
        l.setValidade(validade);
        l.setNotaFiscal(nota);
        l.setRecebidoEm(LocalDateTime.now(relogio));
        lotes.save(l);
        registrarMovimento(p, TipoMovimento.ENTRADA, quantidade, observacao, usuarioId, null);
    }

    // perda (vencimento, avaria, furto): sai dos lotes que vencem antes
    @Transactional
    public ProdutoDto perda(PerdaForm f, Long usuarioId) {
        Produto p = catalogo.buscarProduto(f.produtoId());
        BigDecimal quantidade = quantidadeValida(p, f.quantidade());
        if (quantidade.compareTo(p.getEstoqueAtual()) > 0) {
            throw ExcecaoNegocio.invalido("perda_maior_que_estoque", "A perda é maior do que o estoque do sistema (" + p.getEstoqueAtual().stripTrailingZeros().toPlainString() + "). Faça um ajuste de inventário.");
        }
        consumirLotes(p, quantidade);
        p.setEstoqueAtual(p.getEstoqueAtual().subtract(quantidade));
        String obs = "Perda: " + f.motivo().descricao() + (f.observacao() == null || f.observacao().isBlank() ? "" : " · " + f.observacao().trim());
        registrarMovimento(p, TipoMovimento.PERDA, quantidade.negate(), obs, usuarioId, null);
        return catalogo.produto(p.getId());
    }

    // inventário: o estoque passa a ser o que foi contado. sobra vira lote sem validade, falta sai dos lotes
    @Transactional
    public ProdutoDto ajuste(AjusteForm f, Long usuarioId) {
        Produto p = catalogo.buscarProduto(f.produtoId());
        BigDecimal contada = p.getUnidade() == Unidade.UN ? inteiro(f.quantidadeContada()) : f.quantidadeContada().setScale(3, RoundingMode.HALF_UP);
        BigDecimal diferenca = contada.subtract(p.getEstoqueAtual());
        if (diferenca.signum() == 0) {
            throw ExcecaoNegocio.invalido("sem_diferenca", "A quantidade contada é igual à do sistema. Nada para ajustar.");
        }
        if (diferenca.signum() < 0) {
            consumirLotes(p, diferenca.negate());
        } else {
            Lote l = new Lote();
            l.setProduto(p);
            l.setQuantidadeInicial(diferenca);
            l.setSaldo(diferenca);
            l.setCustoUnitario(p.getCustoMedio());
            l.setRecebidoEm(LocalDateTime.now(relogio));
            lotes.save(l);
        }
        p.setEstoqueAtual(contada);
        String obs = "Inventário" + (f.observacao() == null || f.observacao().isBlank() ? "" : " · " + f.observacao().trim());
        registrarMovimento(p, TipoMovimento.AJUSTE, diferenca, obs, usuarioId, null);
        return catalogo.produto(p.getId());
    }

    // baixa da venda concluída. o estoque pode ficar negativo (vendeu o que o sistema não tinha): aparece como ruptura
    void baixarVenda(Venda v) {
        for (ItemVenda i : v.getItens()) {
            if (i.isCancelado()) continue;
            Produto p = i.getProduto();
            consumirLotes(p, i.getQuantidade());
            p.setEstoqueAtual(p.getEstoqueAtual().subtract(i.getQuantidade()));
            registrarMovimento(p, TipoMovimento.VENDA, i.getQuantidade().negate(), "Cupom " + v.getId(), v.getOperador().getId(), v.getId());
        }
    }

    // tira a quantidade dos lotes na ordem de validade (FEFO). o que não couber nos lotes só baixa do total
    private void consumirLotes(Produto p, BigDecimal quantidade) {
        BigDecimal falta = quantidade;
        for (Lote l : lotes.lotesComSaldo(p.getId())) {
            if (falta.signum() <= 0) break;
            BigDecimal tirar = l.getSaldo().min(falta);
            l.setSaldo(l.getSaldo().subtract(tirar));
            falta = falta.subtract(tirar);
        }
    }

    private void registrarMovimento(Produto p, TipoMovimento tipo, BigDecimal quantidade, String obs, Long usuarioId, Long vendaId) {
        MovimentoEstoque m = new MovimentoEstoque();
        m.setProduto(p);
        m.setTipo(tipo);
        m.setQuantidade(quantidade);
        m.setSaldoDepois(p.getEstoqueAtual());
        m.setObservacao(obs);
        m.setUsuario(usuarioId == null ? null : usuarios.getReferenceById(usuarioId));
        m.setVendaId(vendaId);
        m.setDataHora(LocalDateTime.now(relogio));
        movimentos.save(m);
    }

    // produto por unidade não aceita quantidade quebrada
    private static BigDecimal quantidadeValida(Produto p, BigDecimal q) {
        return p.getUnidade() == Unidade.UN ? inteiro(q) : q.setScale(3, RoundingMode.HALF_UP);
    }

    private static BigDecimal inteiro(BigDecimal q) {
        if (q.stripTrailingZeros().scale() > 0) {
            throw ExcecaoNegocio.invalido("quantidade_fracionada", "Esse produto é vendido por unidade. Use uma quantidade inteira.");
        }
        return q.setScale(3, RoundingMode.UNNECESSARY);
    }

    @Transactional(readOnly = true)
    public List<LoteDto> lotes(Long produtoId) {
        catalogo.buscarProduto(produtoId);
        return lotes.lotesComSaldo(produtoId).stream().map(Mapeador::lote).toList();
    }

    @Transactional(readOnly = true)
    public List<MovimentoDto> movimentos(Long produtoId) {
        var lista = produtoId == null ? movimentos.findTop200ByOrderByDataHoraDescIdDesc() : movimentos.findTop100ByProdutoIdOrderByDataHoraDescIdDesc(produtoId);
        return lista.stream().map(Mapeador::movimento).toList();
    }

    // números do topo da tela de estoque
    @Transactional(readOnly = true)
    public ResumoEstoqueDto resumo() {
        List<ProdutoDto> todos = catalogo.listarProdutos().stream().filter(ProdutoDto::ativo).toList();
        int abaixo = (int) todos.stream().filter(p -> p.estoqueAtual().compareTo(p.estoqueMinimo()) < 0).count();
        int ruptura = (int) todos.stream().filter(p -> p.situacao() == SituacaoEstoque.RUPTURA).count();
        int vencendo = (int) todos.stream().filter(p -> p.diasParaVencer() != null && p.diasParaVencer() <= 7).count();
        BigDecimal valor = todos.stream().filter(p -> p.estoqueAtual().signum() > 0)
                .map(p -> p.estoqueAtual().multiply(p.custoMedio())).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
        return new ResumoEstoqueDto(todos.size(), abaixo, ruptura, vencendo, valor);
    }
}
