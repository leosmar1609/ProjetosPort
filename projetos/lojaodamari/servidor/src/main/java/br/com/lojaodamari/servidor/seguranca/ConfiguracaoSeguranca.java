package br.com.lojaodamari.servidor.seguranca;

import br.com.lojaodamari.comum.dto.ErroDto;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

// regras de acesso: só login, saúde e documentação são públicos. o resto exige token, e cada rota diz os perfis com @PreAuthorize
@Configuration
@EnableMethodSecurity
public class ConfiguracaoSeguranca {

    @Bean
    SecurityFilterChain filtros(HttpSecurity http, FiltroJwt filtroJwt, JsonMapper json) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/auth/login", "/api/saude", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> escreverErro(res, json, HttpStatus.UNAUTHORIZED, "nao_autenticado", "Sua sessão expirou ou você não entrou. Faça login de novo."))
                        .accessDeniedHandler((req, res, ex) -> escreverErro(res, json, HttpStatus.FORBIDDEN, "sem_permissao", "Seu perfil não tem acesso a esta função.")))
                .addFilterBefore(filtroJwt, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // senha guardada com BCrypt
    @Bean
    PasswordEncoder codificadorSenha() {
        return new BCryptPasswordEncoder();
    }

    // 401 e 403 saem no mesmo formato de erro do resto da API
    private static void escreverErro(HttpServletResponse res, JsonMapper json, HttpStatus status, String codigo, String mensagem) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        json.writeValue(res.getOutputStream(), new ErroDto(status.value(), codigo, mensagem, null));
    }
}
