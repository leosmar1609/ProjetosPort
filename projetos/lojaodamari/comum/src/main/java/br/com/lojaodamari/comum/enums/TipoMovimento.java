package br.com.lojaodamari.comum.enums;

// tudo que mexe no estoque vira um movimento, assim dá pra saber de onde veio cada número
public enum TipoMovimento {
    ENTRADA, VENDA, CANCELAMENTO_VENDA, PERDA, AJUSTE
}
