package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.FormaPagamento;
import java.math.BigDecimal;

// quanto entrou em cada forma de pagamento
public record VendaFormaDto(
        FormaPagamento forma,
        BigDecimal total,
        int quantidade
) {
}
