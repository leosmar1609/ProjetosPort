package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.comum.enums.StatusSessao;
import br.com.lojaodamari.servidor.dominio.SessaoCaixa;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

// turnos de caixa
public interface SessaoCaixaRepositorio extends JpaRepository<SessaoCaixa, Long> {

    @EntityGraph(attributePaths = "operador")
    Optional<SessaoCaixa> findFirstByOperadorIdAndStatus(Long operadorId, StatusSessao status);

    boolean existsByNumeroCaixaAndStatus(int numeroCaixa, StatusSessao status);

    @EntityGraph(attributePaths = "operador")
    List<SessaoCaixa> findByAbertaEmGreaterThanEqualAndAbertaEmLessThanOrderByAbertaEm(LocalDateTime inicio, LocalDateTime fim);
}
