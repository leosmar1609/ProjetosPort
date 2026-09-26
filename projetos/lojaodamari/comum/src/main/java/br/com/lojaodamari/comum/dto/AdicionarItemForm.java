package br.com.lojaodamari.comum.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// passar um item: pelo código lido no leitor (EAN, etiqueta de balança) ou pelo id escolhido na busca
public record AdicionarItemForm(
        @Size(max = 20) String codigo,
        Long produtoId,
        @DecimalMin("0.001") BigDecimal quantidade
) {
}
