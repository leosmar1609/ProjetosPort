package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.FormaPagamento;
import java.math.BigDecimal;

// pagamento já lançado
public record PagamentoDto(
        FormaPagamento forma,
        BigDecimal valor
) {
}
