package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.ClasseAbc;
import java.math.BigDecimal;

// um produto na curva ABC
public record ItemAbcDto(
        int posicao,
        Long produtoId,
        String produtoNome,
        String secao,
        BigDecimal faturamento,
        BigDecimal percentual,
        BigDecimal percentualAcumulado,
        ClasseAbc classe
) {
}
