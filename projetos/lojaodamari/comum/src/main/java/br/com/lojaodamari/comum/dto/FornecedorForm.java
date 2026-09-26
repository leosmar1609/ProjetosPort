package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;

// cadastro/edição de fornecedor
public record FornecedorForm(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 18) String cnpj,
        @Size(max = 20) String telefone,
        @Size(max = 120) String email,
        @Min(0) @Max(60) int prazoEntregaDias
) {
}
