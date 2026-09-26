package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;

// faturamento de uma hora do dia, com a mesma hora do dia de comparação
public record VendaHoraDto(
        int hora,
        BigDecimal faturamento,
        int cupons,
        BigDecimal faturamentoComparacao
) {
}
