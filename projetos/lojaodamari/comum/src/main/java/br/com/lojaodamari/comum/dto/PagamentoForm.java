package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.FormaPagamento;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// um pagamento lançado na venda
public record PagamentoForm(
        @NotNull FormaPagamento forma,
        @NotNull @DecimalMin("0.01") BigDecimal valor
) {
}
