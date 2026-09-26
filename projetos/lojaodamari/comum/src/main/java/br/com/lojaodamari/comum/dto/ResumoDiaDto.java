package br.com.lojaodamari.comum.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// painel do dia. a comparação é com o mesmo dia da semana passada, até o mesmo horário
public record ResumoDiaDto(
        LocalDate data,
        LocalDate dataComparacao,
        boolean parcial,
        BigDecimal faturamento,
        BigDecimal faturamentoComparacao,
        int cupons,
        int cuponsComparacao,
        BigDecimal ticketMedio,
        BigDecimal ticketMedioComparacao,
        BigDecimal itensPorCupom,
        List<VendaHoraDto> porHora,
        List<VendaSecaoDto> porSecao,
        List<VendaFormaDto> porForma,
        List<VendaOperadorDto> porOperador
) {
}
