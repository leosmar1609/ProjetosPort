package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Unidade;
import java.math.BigDecimal;

// item do pedido com o que já chegou
public record ItemPedidoDto(
        Long produtoId,
        String produtoNome,
        Unidade unidade,
        BigDecimal quantidade,
        BigDecimal custoUnitario,
        BigDecimal quantidadeRecebida,
        BigDecimal subtotal
) {
}
