package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// abertura do caixa: qual caixa e quanto de troco tem na gaveta
public record AberturaCaixaForm(
        @NotNull @Min(1) @Max(99) Integer numeroCaixa,
        @NotNull @DecimalMin("0") BigDecimal fundoTroco
) {
}
