package br.com.lojaodamari.desktop.api;

import java.util.Map;

// erro vindo do servidor (ou da falta dele). a mensagem já vem pronta pra mostrar na tela
public class ApiException extends RuntimeException {

    private final int status;
    private final String codigo;
    private final Map<String, String> campos;

    public ApiException(int status, String codigo, String mensagem, Map<String, String> campos) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
        this.campos = campos == null ? Map.of() : campos;
    }

    public int status() {
        return status;
    }

    public String codigo() {
        return codigo;
    }

    public Map<String, String> campos() {
        return campos;
    }
}
