package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// fechamento: quanto de dinheiro o operador contou na gaveta
public record FechamentoCaixaForm(
        @NotNull @DecimalMin("0") BigDecimal dinheiroContado
) {
}
