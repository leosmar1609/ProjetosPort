package br.com.lojaodamari.comum.enums;

// quem é quem na loja. cada perfil libera um pedaço do sistema
public enum Perfil {
    OPERADOR("Operador de caixa"),
    FISCAL("Fiscal de caixa"),
    ESTOQUISTA("Estoquista"),
    GERENTE("Gerente"),
    ADMIN("Administrador");

    private final String descricao;

    Perfil(String descricao) {
        this.descricao = descricao;
    }

    public String descricao() {
        return descricao;
    }

    // fiscal, gerente e admin podem autorizar cancelamento e sangria no caixa
    public boolean podeAutorizar() {
        return this == FISCAL || this == GERENTE || this == ADMIN;
    }
}
