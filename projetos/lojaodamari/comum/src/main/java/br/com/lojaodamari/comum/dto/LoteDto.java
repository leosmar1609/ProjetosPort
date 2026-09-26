package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// um lote que entrou no estoque, com validade própria
public record LoteDto(
        Long id,
        BigDecimal quantidadeInicial,
        BigDecimal saldo,
        BigDecimal custoUnitario,
        LocalDate validade,
        String notaFiscal,
        LocalDateTime recebidoEm
) {
}
