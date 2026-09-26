package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Unidade;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

// cadastro/edição de produto. o custo não entra aqui: ele sai das entradas de mercadoria (custo médio)
public record ProdutoForm(
        @NotBlank @Size(max = 120) String nome,
        @Pattern(regexp = "\\d{8}|\\d{13}", message = "o EAN precisa ter 8 ou 13 dígitos") String ean,
        @Pattern(regexp = "\\d{5}", message = "o PLU precisa ter 5 dígitos") String plu,
        @NotNull Unidade unidade,
        @NotNull Long secaoId,
        Long fornecedorId,
        boolean producaoPropria,
        @NotNull @DecimalMin("0.01") BigDecimal precoVenda,
        @DecimalMin("0.01") BigDecimal precoPromocional,
        LocalDate promocaoInicio,
        LocalDate promocaoFim,
        @NotNull @DecimalMin("0") BigDecimal estoqueMinimo,
        boolean ativo
) {
}
