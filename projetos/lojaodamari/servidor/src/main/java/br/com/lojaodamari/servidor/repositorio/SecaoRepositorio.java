package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.Secao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

// acesso às seções da loja
public interface SecaoRepositorio extends JpaRepository<Secao, Long> {

    List<Secao> findAllByOrderByNome();

    boolean existsByNomeIgnoreCase(String nome);
}
