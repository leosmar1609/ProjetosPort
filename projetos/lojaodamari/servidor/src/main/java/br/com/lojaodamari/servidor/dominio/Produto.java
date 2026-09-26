package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.Unidade;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

// produto da loja. o @Version impede que dois caixas salvem o mesmo produto por cima um do outro
@Entity
@Table(name = "produto")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String ean;

    private String plu;

    @Enumerated(EnumType.STRING)
    private Unidade unidade;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "secao_id")
    private Secao secao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "producao_propria")
    private boolean producaoPropria;

    @Column(name = "preco_venda")
    private BigDecimal precoVenda;

    @Column(name = "preco_promocional")
    private BigDecimal precoPromocional;

    @Column(name = "promocao_inicio")
    private LocalDate promocaoInicio;

    @Column(name = "promocao_fim")
    private LocalDate promocaoFim;

    @Column(name = "custo_medio")
    private BigDecimal custoMedio;

    @Column(name = "estoque_atual")
    private BigDecimal estoqueAtual;

    @Column(name = "estoque_minimo")
    private BigDecimal estoqueMinimo;

    private boolean ativo;

    @Version
    private int versao;

    // promoção vale se tiver preço promocional e hoje estiver dentro do período (datas vazias = sem limite)
    public boolean emPromocao(LocalDate dia) {
        if (precoPromocional == null) return false;
        boolean comecou = promocaoInicio == null || !dia.isBefore(promocaoInicio);
        boolean naoAcabou = promocaoFim == null || !dia.isAfter(promocaoFim);
        return comecou && naoAcabou;
    }

    // preço que o caixa cobra hoje
    public BigDecimal precoAtual(LocalDate dia) {
        return emPromocao(dia) ? precoPromocional : precoVenda;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEan() {
        return ean;
    }

    public void setEan(String ean) {
        this.ean = ean;
    }

    public String getPlu() {
        return plu;
    }

    public void setPlu(String plu) {
        this.plu = plu;
    }

    public Unidade getUnidade() {
        return unidade;
    }

    public void setUnidade(Unidade unidade) {
        this.unidade = unidade;
    }

    public Secao getSecao() {
        return secao;
    }

    public void setSecao(Secao secao) {
        this.secao = secao;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public boolean isProducaoPropria() {
        return producaoPropria;
    }

    public void setProducaoPropria(boolean producaoPropria) {
        this.producaoPropria = producaoPropria;
    }

    public BigDecimal getPrecoVenda() {
        return precoVenda;
    }

    public void setPrecoVenda(BigDecimal precoVenda) {
        this.precoVenda = precoVenda;
    }

    public BigDecimal getPrecoPromocional() {
        return precoPromocional;
    }

    public void setPrecoPromocional(BigDecimal precoPromocional) {
        this.precoPromocional = precoPromocional;
    }

    public LocalDate getPromocaoInicio() {
        return promocaoInicio;
    }

    public void setPromocaoInicio(LocalDate promocaoInicio) {
        this.promocaoInicio = promocaoInicio;
    }

    public LocalDate getPromocaoFim() {
        return promocaoFim;
    }

    public void setPromocaoFim(LocalDate promocaoFim) {
        this.promocaoFim = promocaoFim;
    }

    public BigDecimal getCustoMedio() {
        return custoMedio;
    }

    public void setCustoMedio(BigDecimal custoMedio) {
        this.custoMedio = custoMedio;
    }

    public BigDecimal getEstoqueAtual() {
        return estoqueAtual;
    }

    public void setEstoqueAtual(BigDecimal estoqueAtual) {
        this.estoqueAtual = estoqueAtual;
    }

    public BigDecimal getEstoqueMinimo() {
        return estoqueMinimo;
    }

    public void setEstoqueMinimo(BigDecimal estoqueMinimo) {
        this.estoqueMinimo = estoqueMinimo;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public int getVersao() {
        return versao;
    }

    public void setVersao(int versao) {
        this.versao = versao;
    }
}
