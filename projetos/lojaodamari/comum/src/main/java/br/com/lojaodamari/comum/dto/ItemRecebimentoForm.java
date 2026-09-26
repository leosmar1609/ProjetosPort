package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

// o que chegou de cada item, com a validade do lote
public record ItemRecebimentoForm(
        @NotNull Long produtoId,
        @NotNull @DecimalMin("0") BigDecimal quantidadeRecebida,
        @NotNull @DecimalMin("0.01") BigDecimal custoUnitario,
        LocalDate validade
) {
}
