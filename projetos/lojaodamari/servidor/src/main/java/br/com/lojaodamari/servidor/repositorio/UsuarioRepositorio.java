package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// acesso à tabela de usuários
public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByLogin(String login);

    boolean existsByLoginAndIdNot(String login, Long id);

    boolean existsByLogin(String login);

    List<Usuario> findAllByOrderByNome();
}
