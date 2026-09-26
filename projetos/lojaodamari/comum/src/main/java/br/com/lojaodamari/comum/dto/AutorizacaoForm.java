package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;

// login e senha do fiscal ou gerente pra liberar cancelamento e sangria no caixa
public record AutorizacaoForm(
        @NotBlank String login,
        @NotBlank String senha
) {
}
