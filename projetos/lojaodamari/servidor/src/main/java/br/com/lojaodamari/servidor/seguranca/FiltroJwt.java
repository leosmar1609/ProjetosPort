package br.com.lojaodamari.servidor.seguranca;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

// lê o "Authorization: Bearer ..." de cada requisição e diz pro Spring Security quem é e qual o perfil (ROLE_GERENTE etc.)
@Component
public class FiltroJwt extends OncePerRequestFilter {

    private final TokenServico tokens;

    public FiltroJwt(TokenServico tokens) {
        this.tokens = tokens;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain cadeia) throws ServletException, IOException {
        String cabecalho = req.getHeader("Authorization");
        if (cabecalho != null && cabecalho.startsWith("Bearer ")) {
            tokens.ler(cabecalho.substring(7)).ifPresent(u -> {
                var autenticacao = new UsernamePasswordAuthenticationToken(u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.perfil().name())));
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            });
        }
        cadeia.doFilter(req, res);
    }
}
