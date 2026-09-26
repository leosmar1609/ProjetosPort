package br.com.lojaodamari.servidor.seguranca;

import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.servidor.dominio.Usuario;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import java.time.Clock;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// gera e confere o token JWT. o token leva id, nome e perfil, assim não preciso ir no banco a cada requisição
@Service
public class TokenServico {

    private static final String EMISSOR = "lojaodamari";

    private final Algorithm algoritmo;
    private final JWTVerifier verificador;
    private final Duration validade;
    private final Clock relogio;

    public TokenServico(@Value("${lojao.jwt.segredo}") String segredo, @Value("${lojao.jwt.horas:12}") long horas, Clock relogio) {
        if (segredo.length() < 32) {
            throw new IllegalStateException("lojao.jwt.segredo precisa ter pelo menos 32 caracteres");
        }
        this.algoritmo = Algorithm.HMAC256(segredo);
        this.verificador = JWT.require(algoritmo).withIssuer(EMISSOR).build();
        this.validade = Duration.ofHours(horas);
        this.relogio = relogio;
    }

    // token de um turno de trabalho (12h por padrão)
    public String gerar(Usuario usuario) {
        return JWT.create()
                .withIssuer(EMISSOR)
                .withSubject(usuario.getLogin())
                .withClaim("id", usuario.getId())
                .withClaim("nome", usuario.getNome())
                .withClaim("perfil", usuario.getPerfil().name())
                .withIssuedAt(relogio.instant())
                .withExpiresAt(relogio.instant().plus(validade))
                .sign(algoritmo);
    }

    // token inválido, vencido ou adulterado vira vazio (a requisição segue como não autenticada)
    public Optional<UsuarioLogado> ler(String token) {
        try {
            DecodedJWT jwt = verificador.verify(token);
            return Optional.of(new UsuarioLogado(jwt.getClaim("id").asLong(), jwt.getClaim("nome").asString(),
                    jwt.getSubject(), Perfil.valueOf(jwt.getClaim("perfil").asString())));
        } catch (JWTVerificationException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
