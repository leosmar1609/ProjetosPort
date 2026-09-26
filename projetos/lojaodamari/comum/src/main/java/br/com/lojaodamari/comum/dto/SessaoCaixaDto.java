package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.FormaPagamento;
import br.com.lojaodamari.comum.enums.StatusSessao;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

// o turno do caixa com os totais. dinheiroEsperado = fundo + dinheiro recebido - troco + suprimentos - sangrias
public record SessaoCaixaDto(
        Long id,
        int numeroCaixa,
        String operadorNome,
        StatusSessao status,
        LocalDateTime abertaEm,
        LocalDateTime fechadaEm,
        BigDecimal fundoTroco,
        int quantidadeVendas,
        BigDecimal totalVendas,
        Map<FormaPagamento, BigDecimal> totalPorForma,
        BigDecimal sangrias,
        BigDecimal suprimentos,
        BigDecimal dinheiroEsperado,
        BigDecimal dinheiroContado,
        BigDecimal diferenca
) {
}
