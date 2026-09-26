package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.StatusSessao;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// turno de um operador num caixa
@Entity
@Table(name = "sessao_caixa")
public class SessaoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_caixa")
    private int numeroCaixa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operador_id")
    private Usuario operador;

    @Enumerated(EnumType.STRING)
    private StatusSessao status;

    @Column(name = "aberta_em")
    private LocalDateTime abertaEm;

    @Column(name = "fechada_em")
    private LocalDateTime fechadaEm;

    @Column(name = "fundo_troco")
    private BigDecimal fundoTroco;

    @Column(name = "dinheiro_contado")
    private BigDecimal dinheiroContado;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getNumeroCaixa() {
        return numeroCaixa;
    }

    public void setNumeroCaixa(int numeroCaixa) {
        this.numeroCaixa = numeroCaixa;
    }

    public Usuario getOperador() {
        return operador;
    }

    public void setOperador(Usuario operador) {
        this.operador = operador;
    }

    public StatusSessao getStatus() {
        return status;
    }

    public void setStatus(StatusSessao status) {
        this.status = status;
    }

    public LocalDateTime getAbertaEm() {
        return abertaEm;
    }

    public void setAbertaEm(LocalDateTime abertaEm) {
        this.abertaEm = abertaEm;
    }

    public LocalDateTime getFechadaEm() {
        return fechadaEm;
    }

    public void setFechadaEm(LocalDateTime fechadaEm) {
        this.fechadaEm = fechadaEm;
    }

    public BigDecimal getFundoTroco() {
        return fundoTroco;
    }

    public void setFundoTroco(BigDecimal fundoTroco) {
        this.fundoTroco = fundoTroco;
    }

    public BigDecimal getDinheiroContado() {
        return dinheiroContado;
    }

    public void setDinheiroContado(BigDecimal dinheiroContado) {
        this.dinheiroContado = dinheiroContado;
    }
}
