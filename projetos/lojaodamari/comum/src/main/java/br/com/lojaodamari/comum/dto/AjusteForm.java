package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// resultado da contagem de inventário: o sistema passa a ter a quantidade contada
public record AjusteForm(
        @NotNull Long produtoId,
        @NotNull @DecimalMin("0") BigDecimal quantidadeContada,
        @Size(max = 200) String observacao
) {
}
