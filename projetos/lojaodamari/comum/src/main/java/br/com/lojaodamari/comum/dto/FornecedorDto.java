package br.com.lojaodamari.comum.dto;

// fornecedor e em quantos dias ele costuma entregar
public record FornecedorDto(
        Long id,
        String nome,
        String cnpj,
        String telefone,
        String email,
        int prazoEntregaDias
) {
}
