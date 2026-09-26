package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.StatusVenda;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// a venda inteira como o caixa enxerga: itens, pagamentos e quanto falta
public record VendaDto(
        Long id,
        long numero,
        Long sessaoId,
        int numeroCaixa,
        String operadorNome,
        StatusVenda status,
        List<ItemVendaDto> itens,
        List<PagamentoDto> pagamentos,
        BigDecimal total,
        BigDecimal totalPago,
        BigDecimal faltaPagar,
        BigDecimal troco,
        String cpf,
        LocalDateTime iniciadaEm,
        LocalDateTime concluidaEm
) {
}
