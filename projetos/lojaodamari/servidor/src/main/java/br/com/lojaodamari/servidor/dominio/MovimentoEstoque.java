package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.TipoMovimento;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// uma linha do histórico do estoque
@Entity
@Table(name = "movimento_estoque")
public class MovimentoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @Enumerated(EnumType.STRING)
    private TipoMovimento tipo;

    private BigDecimal quantidade;

    @Column(name = "saldo_depois")
    private BigDecimal saldoDepois;

    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "venda_id")
    private Long vendaId;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Produto getProduto() {
        return produto;
    }

    public void setProduto(Produto produto) {
        this.produto = produto;
    }

    public TipoMovimento getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimento tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getSaldoDepois() {
        return saldoDepois;
    }

    public void setSaldoDepois(BigDecimal saldoDepois) {
        this.saldoDepois = saldoDepois;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getVendaId() {
        return vendaId;
    }

    public void setVendaId(Long vendaId) {
        this.vendaId = vendaId;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }
}
