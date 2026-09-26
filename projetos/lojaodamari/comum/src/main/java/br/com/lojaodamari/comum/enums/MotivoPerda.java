package br.com.lojaodamari.comum.enums;

// por que o produto saiu do estoque sem ser vendido
public enum MotivoPerda {
    VENCIMENTO("Vencimento"),
    AVARIA("Avaria"),
    FURTO("Furto"),
    OUTRO("Outro");

    private final String descricao;

    MotivoPerda(String descricao) {
        this.descricao = descricao;
    }

    public String descricao() {
        return descricao;
    }
}
