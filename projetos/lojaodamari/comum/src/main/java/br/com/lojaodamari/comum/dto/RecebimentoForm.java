package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;

// recebimento do pedido: vira entrada de estoque, lote por lote
public record RecebimentoForm(
        @Size(max = 60) String notaFiscal,
        @NotEmpty @Valid List<ItemRecebimentoForm> itens
) {
}
