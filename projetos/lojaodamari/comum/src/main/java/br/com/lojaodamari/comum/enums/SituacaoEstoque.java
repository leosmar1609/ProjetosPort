package br.com.lojaodamari.comum.enums;

// situação do produto na gôndola, do pior pro melhor. a tela pinta a etiqueta de acordo
public enum SituacaoEstoque {
    RUPTURA("Ruptura", 3),
    VENCE_LOGO("Vence em até 2 dias", 3),
    ABAIXO_MINIMO("Abaixo do mínimo", 2),
    VENCENDO("Vence em até 7 dias", 2),
    NORMAL("Normal", 0);

    private final String descricao;
    private final int gravidade;

    SituacaoEstoque(String descricao, int gravidade) {
        this.descricao = descricao;
        this.gravidade = gravidade;
    }

    public String descricao() {
        return descricao;
    }

    public int gravidade() {
        return gravidade;
    }
}
