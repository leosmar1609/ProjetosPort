package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.MovimentoEstoque;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

// histórico do estoque
public interface MovimentoEstoqueRepositorio extends JpaRepository<MovimentoEstoque, Long> {

    @EntityGraph(attributePaths = {"produto", "usuario"})
    List<MovimentoEstoque> findTop100ByProdutoIdOrderByDataHoraDescIdDesc(Long produtoId);

    @EntityGraph(attributePaths = {"produto", "usuario"})
    List<MovimentoEstoque> findTop200ByOrderByDataHoraDescIdDesc();
}
