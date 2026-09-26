package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;

// fechar a venda. o CPF na nota é opcional
public record FinalizarVendaForm(
        @Size(max = 14) String cpf
) {
}
