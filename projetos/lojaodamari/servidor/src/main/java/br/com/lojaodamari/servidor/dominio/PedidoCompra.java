package br.com.lojaodamari.servidor.dominio;

import br.com.lojaodamari.comum.enums.StatusPedido;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// pedido de compra pro fornecedor
@Entity
@Table(name = "pedido_compra")
public class PedidoCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @Enumerated(EnumType.STRING)
    private StatusPedido status;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @Column(name = "enviado_em")
    private LocalDateTime enviadoEm;

    @Column(name = "recebido_em")
    private LocalDateTime recebidoEm;

    @Column(name = "previsao_entrega")
    private LocalDate previsaoEntrega;

    @Column(name = "nota_fiscal")
    private String notaFiscal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id")
    private Usuario criadoPor;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<ItemPedido> itens = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public StatusPedido getStatus() {
        return status;
    }

    public void setStatus(StatusPedido status) {
        this.status = status;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public LocalDateTime getEnviadoEm() {
        return enviadoEm;
    }

    public void setEnviadoEm(LocalDateTime enviadoEm) {
        this.enviadoEm = enviadoEm;
    }

    public LocalDateTime getRecebidoEm() {
        return recebidoEm;
    }

    public void setRecebidoEm(LocalDateTime recebidoEm) {
        this.recebidoEm = recebidoEm;
    }

    public LocalDate getPrevisaoEntrega() {
        return previsaoEntrega;
    }

    public void setPrevisaoEntrega(LocalDate previsaoEntrega) {
        this.previsaoEntrega = previsaoEntrega;
    }

    public String getNotaFiscal() {
        return notaFiscal;
    }

    public void setNotaFiscal(String notaFiscal) {
        this.notaFiscal = notaFiscal;
    }

    public Usuario getCriadoPor() {
        return criadoPor;
    }

    public void setCriadoPor(Usuario criadoPor) {
        this.criadoPor = criadoPor;
    }

    public List<ItemPedido> getItens() {
        return itens;
    }

    public void setItens(List<ItemPedido> itens) {
        this.itens = itens;
    }
}
