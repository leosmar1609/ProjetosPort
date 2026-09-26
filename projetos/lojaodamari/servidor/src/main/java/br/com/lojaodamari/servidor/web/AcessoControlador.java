package br.com.lojaodamari.servidor.web;

import br.com.lojaodamari.comum.dto.LoginForm;
import br.com.lojaodamari.comum.dto.LoginResposta;
import br.com.lojaodamari.comum.dto.UsuarioDto;
import br.com.lojaodamari.comum.dto.UsuarioForm;
import br.com.lojaodamari.servidor.seguranca.Perfis;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import br.com.lojaodamari.servidor.servico.AcessoServico;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// login e cadastro de usuários
@RestController
@RequestMapping("/api")
@Tag(name = "Acesso", description = "Login e usuários")
public class AcessoControlador {

    private final AcessoServico acesso;

    public AcessoControlador(AcessoServico acesso) {
        this.acesso = acesso;
    }

    // POST /api/auth/login -> token pra usar nas outras rotas
    @PostMapping("/auth/login")
    public LoginResposta entrar(@Valid @RequestBody LoginForm form) {
        return acesso.entrar(form);
    }

    // GET /api/auth/eu -> quem é o dono do token (o app usa pra conferir se o token ainda vale)
    @GetMapping("/auth/eu")
    public UsuarioLogado eu(@AuthenticationPrincipal UsuarioLogado quem) {
        return quem;
    }

    // GET /api/saude -> o app confere se o servidor está no ar antes do login
    @GetMapping("/saude")
    public Map<String, String> saude() {
        return Map.of("status", "ok");
    }

    @GetMapping("/usuarios")
    @PreAuthorize(Perfis.ADMIN)
    public List<UsuarioDto> listar() {
        return acesso.listar();
    }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.ADMIN)
    public UsuarioDto criar(@Valid @RequestBody UsuarioForm form) {
        return acesso.criar(form);
    }

    @PutMapping("/usuarios/{id}")
    @PreAuthorize(Perfis.ADMIN)
    public UsuarioDto editar(@PathVariable Long id, @Valid @RequestBody UsuarioForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return acesso.editar(id, form, quem);
    }
}
