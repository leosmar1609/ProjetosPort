package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Unidade;
import java.math.BigDecimal;

// uma linha do cupom. item cancelado continua aparecendo, riscado
public record ItemVendaDto(
        Long id,
        int sequencia,
        Long produtoId,
        String codigo,
        String descricao,
        Unidade unidade,
        BigDecimal quantidade,
        BigDecimal precoUnitario,
        BigDecimal total,
        boolean promocao,
        boolean cancelado
) {
}
