package br.com.lojaodamari.servidor.seguranca;

import br.com.lojaodamari.comum.enums.Perfil;

// quem está fazendo a requisição, lido do token. as rotas recebem isso com @AuthenticationPrincipal
public record UsuarioLogado(Long id, String nome, String login, Perfil perfil) {
}
