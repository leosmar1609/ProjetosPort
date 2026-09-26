package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Perfil;

// usuário do sistema (a senha nunca sai do servidor)
public record UsuarioDto(
        Long id,
        String nome,
        String login,
        Perfil perfil,
        boolean ativo
) {
}
