package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Unidade;
import java.math.BigDecimal;

// um produto na sugestão de compra, com o motivo (giro e cobertura)
public record ItemSugestaoDto(
        Long produtoId,
        String produtoNome,
        Unidade unidade,
        BigDecimal estoqueAtual,
        BigDecimal estoqueMinimo,
        BigDecimal giroDiario,
        BigDecimal coberturaDias,
        BigDecimal quantidadeSugerida,
        BigDecimal custoUnitario,
        BigDecimal custoEstimado
) {
}
