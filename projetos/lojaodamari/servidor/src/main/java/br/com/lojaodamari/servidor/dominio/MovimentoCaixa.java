package br.com.lojaodamari.servidor.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// sangria ou suprimento feito durante o turno
@Entity
@Table(name = "movimento_caixa")
public class MovimentoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sessao_id")
    private SessaoCaixa sessao;

    @Enumerated(EnumType.STRING)
    private TipoMovimentoCaixa tipo;

    private BigDecimal valor;

    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autorizado_por_id")
    private Usuario autorizadoPor;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SessaoCaixa getSessao() {
        return sessao;
    }

    public void setSessao(SessaoCaixa sessao) {
        this.sessao = sessao;
    }

    public TipoMovimentoCaixa getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimentoCaixa tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Usuario getAutorizadoPor() {
        return autorizadoPor;
    }

    public void setAutorizadoPor(Usuario autorizadoPor) {
        this.autorizadoPor = autorizadoPor;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }
}
