package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.SituacaoEstoque;
import br.com.lojaodamari.comum.enums.Unidade;
import java.math.BigDecimal;
import java.time.LocalDate;

// produto com tudo que as telas precisam: preço atual (com promoção), margem, estoque e situação
public record ProdutoDto(
        Long id,
        String nome,
        String ean,
        String plu,
        Unidade unidade,
        Long secaoId,
        String secaoNome,
        Long fornecedorId,
        String fornecedorNome,
        boolean producaoPropria,
        BigDecimal precoVenda,
        BigDecimal precoPromocional,
        LocalDate promocaoInicio,
        LocalDate promocaoFim,
        BigDecimal precoAtual,
        boolean emPromocao,
        BigDecimal custoMedio,
        BigDecimal margem,
        BigDecimal estoqueAtual,
        BigDecimal estoqueMinimo,
        LocalDate proximaValidade,
        Integer diasParaVencer,
        SituacaoEstoque situacao,
        boolean ativo
) {
}
