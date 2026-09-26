package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.AutorizacaoForm;
import br.com.lojaodamari.comum.dto.LoginForm;
import br.com.lojaodamari.comum.dto.LoginResposta;
import br.com.lojaodamari.comum.dto.UsuarioDto;
import br.com.lojaodamari.comum.dto.UsuarioForm;
import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.servidor.dominio.Usuario;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import br.com.lojaodamari.servidor.seguranca.TokenServico;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// login, usuários e a autorização do fiscal no caixa
@Service
public class AcessoServico {

    private final UsuarioRepositorio usuarios;
    private final PasswordEncoder senhas;
    private final TokenServico tokens;
    private final Clock relogio;

    public AcessoServico(UsuarioRepositorio usuarios, PasswordEncoder senhas, TokenServico tokens, Clock relogio) {
        this.usuarios = usuarios;
        this.senhas = senhas;
        this.tokens = tokens;
        this.relogio = relogio;
    }

    // confere login e senha. a mensagem de erro é a mesma pros dois casos, pra não entregar quais logins existem
    @Transactional(readOnly = true)
    public LoginResposta entrar(LoginForm form) {
        Usuario u = usuarios.findByLogin(form.login().trim().toLowerCase())
                .filter(x -> senhas.matches(form.senha(), x.getSenhaHash()))
                .orElseThrow(() -> new ExcecaoNegocio(HttpStatus.UNAUTHORIZED, "login_invalido", "Usuário ou senha incorretos."));
        if (!u.isAtivo()) {
            throw new ExcecaoNegocio(HttpStatus.UNAUTHORIZED, "usuario_inativo", "Esse usuário está desativado. Fale com o administrador.");
        }
        return new LoginResposta(tokens.gerar(u), Mapeador.usuario(u));
    }

    // fiscal ou gerente digita login e senha no caixa do operador pra liberar a operação
    @Transactional(readOnly = true)
    public Usuario autorizar(AutorizacaoForm form, String operacao) {
        if (form == null) {
            throw ExcecaoNegocio.proibido("autorizacao_necessaria", operacao + " precisa da senha do fiscal de caixa.");
        }
        Usuario u = usuarios.findByLogin(form.login().trim().toLowerCase())
                .filter(x -> x.isAtivo() && senhas.matches(form.senha(), x.getSenhaHash()))
                .orElseThrow(() -> ExcecaoNegocio.proibido("autorizacao_negada", "Login ou senha do fiscal incorretos."));
        if (!u.getPerfil().podeAutorizar()) {
            throw ExcecaoNegocio.proibido("autorizacao_negada", u.getNome() + " não tem perfil para autorizar. Chame um fiscal ou o gerente.");
        }
        return u;
    }

    @Transactional(readOnly = true)
    public List<UsuarioDto> listar() {
        return usuarios.findAllByOrderByNome().stream().map(Mapeador::usuario).toList();
    }

    // cadastro de usuário novo: senha obrigatória, login único
    @Transactional
    public UsuarioDto criar(UsuarioForm form) {
        String login = form.login().trim().toLowerCase();
        if (usuarios.existsByLogin(login)) {
            throw ExcecaoNegocio.conflito("login_em_uso", "Já existe um usuário com o login " + login + ".");
        }
        if (form.senha() == null || form.senha().isBlank()) {
            throw ExcecaoNegocio.invalido("senha_obrigatoria", "Defina uma senha para o usuário novo.");
        }
        Usuario u = new Usuario();
        u.setCriadoEm(LocalDateTime.now(relogio));
        preencher(u, form, login);
        return Mapeador.usuario(usuarios.save(u));
    }

    // edição: senha vazia mantém a atual. o admin não pode se desativar nem tirar o próprio perfil de admin
    @Transactional
    public UsuarioDto editar(Long id, UsuarioForm form, UsuarioLogado quem) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("usuario_nao_encontrado", "Usuário não encontrado."));
        String login = form.login().trim().toLowerCase();
        if (usuarios.existsByLoginAndIdNot(login, id)) {
            throw ExcecaoNegocio.conflito("login_em_uso", "Já existe um usuário com o login " + login + ".");
        }
        if (id.equals(quem.id()) && (!form.ativo() || form.perfil() != Perfil.ADMIN)) {
            throw ExcecaoNegocio.invalido("nao_pode_se_rebaixar", "Você não pode desativar nem tirar o perfil de administrador da sua própria conta.");
        }
        preencher(u, form, login);
        return Mapeador.usuario(u);
    }

    private void preencher(Usuario u, UsuarioForm form, String login) {
        u.setNome(form.nome().trim());
        u.setLogin(login);
        u.setPerfil(form.perfil());
        u.setAtivo(form.ativo());
        if (form.senha() != null && !form.senha().isBlank()) {
            u.setSenhaHash(senhas.encode(form.senha()));
        }
    }
}
