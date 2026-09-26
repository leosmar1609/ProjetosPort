package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.StatusPedido;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// pedido de compra completo
public record PedidoCompraDto(
        Long id,
        String numero,
        Long fornecedorId,
        String fornecedorNome,
        StatusPedido status,
        LocalDateTime criadoEm,
        LocalDateTime enviadoEm,
        LocalDateTime recebidoEm,
        LocalDate previsaoEntrega,
        String notaFiscal,
        List<ItemPedidoDto> itens,
        BigDecimal total
) {
}
