package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;

// pedido de compra novo
public record PedidoCompraForm(
        @NotNull Long fornecedorId,
        @NotEmpty @Valid List<ItemPedidoForm> itens
) {
}
