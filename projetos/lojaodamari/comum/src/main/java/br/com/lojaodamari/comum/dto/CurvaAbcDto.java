package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;
import java.util.List;

// curva ABC do período
public record CurvaAbcDto(
        int dias,
        BigDecimal faturamentoTotal,
        int quantidadeA,
        int quantidadeB,
        int quantidadeC,
        List<ItemAbcDto> itens
) {
}
