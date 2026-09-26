package br.com.lojaodamari.servidor.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// lote de um produto. saldo é quanto ainda sobra dele
@Entity
@Table(name = "lote")
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @Column(name = "quantidade_inicial")
    private BigDecimal quantidadeInicial;

    private BigDecimal saldo;

    @Column(name = "custo_unitario")
    private BigDecimal custoUnitario;

    private LocalDate validade;

    @Column(name = "nota_fiscal")
    private String notaFiscal;

    @Column(name = "recebido_em")
    private LocalDateTime recebidoEm;

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

    public BigDecimal getQuantidadeInicial() {
        return quantidadeInicial;
    }

    public void setQuantidadeInicial(BigDecimal quantidadeInicial) {
        this.quantidadeInicial = quantidadeInicial;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }

    public BigDecimal getCustoUnitario() {
        return custoUnitario;
    }

    public void setCustoUnitario(BigDecimal custoUnitario) {
        this.custoUnitario = custoUnitario;
    }

    public LocalDate getValidade() {
        return validade;
    }

    public void setValidade(LocalDate validade) {
        this.validade = validade;
    }

    public String getNotaFiscal() {
        return notaFiscal;
    }

    public void setNotaFiscal(String notaFiscal) {
        this.notaFiscal = notaFiscal;
    }

    public LocalDateTime getRecebidoEm() {
        return recebidoEm;
    }

    public void setRecebidoEm(LocalDateTime recebidoEm) {
        this.recebidoEm = recebidoEm;
    }
}
