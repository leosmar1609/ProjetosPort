package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;

// faturamento e margem bruta (%) de uma seção
public record VendaSecaoDto(
        String secao,
        BigDecimal faturamento,
        BigDecimal margemBruta
) {
}
