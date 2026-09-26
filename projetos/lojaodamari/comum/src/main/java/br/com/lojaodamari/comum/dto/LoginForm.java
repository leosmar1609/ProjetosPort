package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;

// o que o app manda pra entrar no sistema
public record LoginForm(
        @NotBlank String login,
        @NotBlank String senha
) {
}
