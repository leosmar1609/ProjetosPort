package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.MotivoPerda;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// baixa de produto que saiu sem ser vendido
public record PerdaForm(
        @NotNull Long produtoId,
        @NotNull @DecimalMin("0.001") BigDecimal quantidade,
        @NotNull MotivoPerda motivo,
        @Size(max = 200) String observacao
) {
}
