package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.StatusVenda;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// uma venda do caixa. itens e pagamentos são salvos junto com ela (cascade)
@Entity
@Table(name = "venda")
public class Venda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sessao_id")
    private SessaoCaixa sessao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operador_id")
    private Usuario operador;

    @Enumerated(EnumType.STRING)
    private StatusVenda status;

    private BigDecimal total;

    private BigDecimal troco;

    private String cpf;

    @Column(name = "iniciada_em")
    private LocalDateTime iniciadaEm;

    @Column(name = "concluida_em")
    private LocalDateTime concluidaEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelada_por_id")
    private Usuario canceladaPor;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequencia")
    private List<ItemVenda> itens = new ArrayList<>();

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<Pagamento> pagamentos = new ArrayList<>();

    // soma dos itens que não foram cancelados
    public BigDecimal calcularTotal() {
        return itens.stream().filter(i -> !i.isCancelado()).map(ItemVenda::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal totalPago() {
        return pagamentos.stream().map(Pagamento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

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

    public Usuario getOperador() {
        return operador;
    }

    public void setOperador(Usuario operador) {
        this.operador = operador;
    }

    public StatusVenda getStatus() {
        return status;
    }

    public void setStatus(StatusVenda status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getTroco() {
        return troco;
    }

    public void setTroco(BigDecimal troco) {
        this.troco = troco;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public LocalDateTime getIniciadaEm() {
        return iniciadaEm;
    }

    public void setIniciadaEm(LocalDateTime iniciadaEm) {
        this.iniciadaEm = iniciadaEm;
    }

    public LocalDateTime getConcluidaEm() {
        return concluidaEm;
    }

    public void setConcluidaEm(LocalDateTime concluidaEm) {
        this.concluidaEm = concluidaEm;
    }

    public Usuario getCanceladaPor() {
        return canceladaPor;
    }

    public void setCanceladaPor(Usuario canceladaPor) {
        this.canceladaPor = canceladaPor;
    }

    public List<ItemVenda> getItens() {
        return itens;
    }

    public void setItens(List<ItemVenda> itens) {
        this.itens = itens;
    }

    public List<Pagamento> getPagamentos() {
        return pagamentos;
    }

    public void setPagamentos(List<Pagamento> pagamentos) {
        this.pagamentos = pagamentos;
    }
}
