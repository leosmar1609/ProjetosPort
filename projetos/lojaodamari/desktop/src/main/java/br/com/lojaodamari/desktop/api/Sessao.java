package br.com.lojaodamari.desktop.api;

import br.com.lojaodamari.comum.dto.LoginResposta;
import br.com.lojaodamari.comum.dto.UsuarioDto;
import br.com.lojaodamari.comum.enums.Perfil;
import java.util.Set;

// quem está logado neste computador agora
public final class Sessao {

    private static String token;
    private static UsuarioDto usuario;

    private Sessao() {
    }

    public static void iniciar(LoginResposta resposta) {
        token = resposta.token();
        usuario = resposta.usuario();
    }

    public static void encerrar() {
        token = null;
        usuario = null;
    }

    public static String token() {
        return token;
    }

    public static UsuarioDto usuario() {
        return usuario;
    }

    // atalho pra decidir o que aparece no menu. espelha as regras do servidor (quem manda de verdade é ele)
    public static boolean pode(Perfil... perfis) {
        return usuario != null && Set.of(perfis).contains(usuario.perfil());
    }
}
