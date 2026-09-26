package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.MovimentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;

// sangrias e suprimentos
public interface MovimentoCaixaRepositorio extends JpaRepository<MovimentoCaixa, Long> {
}
