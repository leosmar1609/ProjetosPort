package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;

// sangria (tirar dinheiro da gaveta) ou suprimento (colocar troco). sangria precisa de autorização
public record MovimentoCaixaForm(
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @Size(max = 120) String motivo,
        @Valid AutorizacaoForm autorizacao
) {
}
