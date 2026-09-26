package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// item de um pedido de compra
public record ItemPedidoForm(
        @NotNull Long produtoId,
        @NotNull @DecimalMin("0.001") BigDecimal quantidade,
        @NotNull @DecimalMin("0.01") BigDecimal custoUnitario
) {
}
