package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.Fornecedor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

// acesso aos fornecedores
public interface FornecedorRepositorio extends JpaRepository<Fornecedor, Long> {

    List<Fornecedor> findAllByOrderByNome();
}
