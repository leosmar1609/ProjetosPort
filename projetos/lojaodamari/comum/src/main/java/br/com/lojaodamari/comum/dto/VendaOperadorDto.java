package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;

// vendas de cada operador no dia
public record VendaOperadorDto(
        String operador,
        int cupons,
        BigDecimal faturamento
) {
}
