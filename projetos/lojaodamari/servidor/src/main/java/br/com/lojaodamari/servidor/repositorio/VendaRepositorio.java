package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.comum.enums.StatusVenda;
import br.com.lojaodamari.servidor.dominio.Venda;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// vendas
public interface VendaRepositorio extends JpaRepository<Venda, Long> {

    Optional<Venda> findFirstBySessaoIdAndStatus(Long sessaoId, StatusVenda status);
}
