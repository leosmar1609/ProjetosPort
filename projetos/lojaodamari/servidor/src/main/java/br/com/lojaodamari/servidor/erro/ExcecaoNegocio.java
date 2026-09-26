package br.com.lojaodamari.servidor.erro;

import org.springframework.http.HttpStatus;

// erro que eu lanço de propósito quando uma regra da loja não deixa seguir.
// o código é estável (o app usa pra decidir o que fazer), a mensagem é pra mostrar pro usuário
public class ExcecaoNegocio extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    public ExcecaoNegocio(HttpStatus status, String codigo, String mensagem) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
    }

    public HttpStatus status() {
        return status;
    }

    public String codigo() {
        return codigo;
    }

    // atalhos pros casos mais comuns
    public static ExcecaoNegocio naoEncontrado(String codigo, String mensagem) {
        return new ExcecaoNegocio(HttpStatus.NOT_FOUND, codigo, mensagem);
    }

    public static ExcecaoNegocio invalido(String codigo, String mensagem) {
        return new ExcecaoNegocio(HttpStatus.UNPROCESSABLE_CONTENT, codigo, mensagem);
    }

    public static ExcecaoNegocio conflito(String codigo, String mensagem) {
        return new ExcecaoNegocio(HttpStatus.CONFLICT, codigo, mensagem);
    }

    public static ExcecaoNegocio proibido(String codigo, String mensagem) {
        return new ExcecaoNegocio(HttpStatus.FORBIDDEN, codigo, mensagem);
    }
}
