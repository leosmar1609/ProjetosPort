package br.com.lojaodamari.servidor.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;

// item de um pedido de compra
@Entity
@Table(name = "item_pedido")
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id")
    private PedidoCompra pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    private BigDecimal quantidade;

    @Column(name = "custo_unitario")
    private BigDecimal custoUnitario;

    @Column(name = "quantidade_recebida")
    private BigDecimal quantidadeRecebida;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PedidoCompra getPedido() {
        return pedido;
    }

    public void setPedido(PedidoCompra pedido) {
        this.pedido = pedido;
    }

    public Produto getProduto() {
        return produto;
    }

    public void setProduto(Produto produto) {
        this.produto = produto;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getCustoUnitario() {
        return custoUnitario;
    }

    public void setCustoUnitario(BigDecimal custoUnitario) {
        this.custoUnitario = custoUnitario;
    }

    public BigDecimal getQuantidadeRecebida() {
        return quantidadeRecebida;
    }

    public void setQuantidadeRecebida(BigDecimal quantidadeRecebida) {
        this.quantidadeRecebida = quantidadeRecebida;
    }
}
