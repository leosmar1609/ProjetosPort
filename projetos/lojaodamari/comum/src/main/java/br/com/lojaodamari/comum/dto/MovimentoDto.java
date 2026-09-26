package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.TipoMovimento;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// uma linha do histórico do estoque
public record MovimentoDto(
        Long id,
        TipoMovimento tipo,
        Long produtoId,
        String produtoNome,
        BigDecimal quantidade,
        BigDecimal saldoDepois,
        String observacao,
        String usuarioNome,
        LocalDateTime dataHora
) {
}
