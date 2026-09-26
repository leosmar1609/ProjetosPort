package br.com.lojaodamari.comum.dto;

// token JWT que vai em todas as próximas requisições, mais os dados de quem entrou
public record LoginResposta(
        String token,
        UsuarioDto usuario
) {
}
