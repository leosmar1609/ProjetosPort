package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

// entrada manual de mercadoria (um lote)
public record EntradaForm(
        @NotNull Long produtoId,
        @NotNull @DecimalMin("0.001") BigDecimal quantidade,
        @NotNull @DecimalMin("0.01") BigDecimal custoUnitario,
        LocalDate validade,
        @Size(max = 60) String notaFiscal
) {
}
