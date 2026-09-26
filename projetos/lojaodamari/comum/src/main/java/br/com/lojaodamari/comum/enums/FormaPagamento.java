package br.com.lojaodamari.comum.enums;

// formas de pagamento aceitas no caixa. só dinheiro pode passar do total (gera troco)
public enum FormaPagamento {
    DINHEIRO("Dinheiro"),
    PIX("Pix"),
    DEBITO("Débito"),
    CREDITO("Crédito"),
    VALE_ALIMENTACAO("Vale-alimentação");

    private final String descricao;

    FormaPagamento(String descricao) {
        this.descricao = descricao;
    }

    public String descricao() {
        return descricao;
    }
}
