package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.Produto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// acesso aos produtos. o EntityGraph já traz seção e fornecedor junto, sem uma consulta extra por produto
public interface ProdutoRepositorio extends JpaRepository<Produto, Long> {

    Optional<Produto> findByEan(String ean);

    Optional<Produto> findByPlu(String plu);

    boolean existsByEanAndIdNot(String ean, Long id);

    boolean existsByPluAndIdNot(String plu, Long id);

    @EntityGraph(attributePaths = {"secao", "fornecedor"})
    List<Produto> findAllByOrderByNome();

    // busca pelo nome no caixa: só produto ativo, no máximo o tamanho da página
    @EntityGraph(attributePaths = {"secao", "fornecedor"})
    @Query("select p from Produto p where p.ativo = true and lower(p.nome) like lower(concat('%', :termo, '%')) order by p.nome")
    List<Produto> buscarPorNome(@Param("termo") String termo, Pageable pagina);
}
