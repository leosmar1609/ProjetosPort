package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;

// números do topo da tela de estoque
public record ResumoEstoqueDto(
        int totalProdutos,
        int abaixoMinimo,
        int emRuptura,
        int vencendo,
        BigDecimal valorEmCusto
) {
}
