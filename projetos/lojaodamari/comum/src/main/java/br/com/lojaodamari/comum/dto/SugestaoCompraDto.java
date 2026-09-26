package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;
import java.util.List;

// sugestão de compra agrupada por fornecedor
public record SugestaoCompraDto(
        Long fornecedorId,
        String fornecedorNome,
        int prazoEntregaDias,
        List<ItemSugestaoDto> itens,
        BigDecimal totalEstimado
) {
}
