package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.Unidade;
import jakarta.persistence.*;
import java.math.BigDecimal;

// uma linha do cupom, com preço e custo congelados no momento da venda
@Entity
@Table(name = "item_venda")
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venda_id")
    private Venda venda;

    private int sequencia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    private String codigo;

    private String descricao;

    @Enumerated(EnumType.STRING)
    private Unidade unidade;

    private BigDecimal quantidade;

    @Column(name = "preco_unitario")
    private BigDecimal precoUnitario;

    @Column(name = "custo_unitario")
    private BigDecimal custoUnitario;

    private BigDecimal total;

    private boolean promocao;

    private boolean cancelado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Venda getVenda() {
        return venda;
    }

    public void setVenda(Venda venda) {
        this.venda = venda;
    }

    public int getSequencia() {
        return sequencia;
    }

    public void setSequencia(int sequencia) {
        this.sequencia = sequencia;
    }

    public Produto getProduto() {
        return produto;
    }

    public void setProduto(Produto produto) {
        this.produto = produto;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Unidade getUnidade() {
        return unidade;
    }

    public void setUnidade(Unidade unidade) {
        this.unidade = unidade;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }

    public void setPrecoUnitario(BigDecimal precoUnitario) {
        this.precoUnitario = precoUnitario;
    }

    public BigDecimal getCustoUnitario() {
        return custoUnitario;
    }

    public void setCustoUnitario(BigDecimal custoUnitario) {
        this.custoUnitario = custoUnitario;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public boolean isPromocao() {
        return promocao;
    }

    public void setPromocao(boolean promocao) {
        this.promocao = promocao;
    }

    public boolean isCancelado() {
        return cancelado;
    }

    public void setCancelado(boolean cancelado) {
        this.cancelado = cancelado;
    }

    public Usuario getCanceladoPor() {
        return canceladoPor;
    }

    public void setCanceladoPor(Usuario canceladoPor) {
        this.canceladoPor = canceladoPor;
    }
}
