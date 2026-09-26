package br.com.lojaodamari.comum.dto;

import java.util.Map;

// formato único de erro da API: codigo pra usar no if, mensagem pra mostrar, campos com o erro de cada campo
public record ErroDto(
        int status,
        String codigo,
        String mensagem,
        Map<String, String> campos
) {
}
