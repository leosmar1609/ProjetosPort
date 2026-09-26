package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.servidor.dominio.Lote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// acesso aos lotes
public interface LoteRepositorio extends JpaRepository<Lote, Long> {

    // lotes com saldo na ordem que devem sair: primeiro o que vence antes (FEFO). lote sem validade vai por último
    @Query("select l from Lote l where l.produto.id = :produtoId and l.saldo > 0 "
            + "order by case when l.validade is null then 1 else 0 end, l.validade, l.id")
    List<Lote> lotesComSaldo(@Param("produtoId") Long produtoId);

    // próxima validade de cada produto, numa consulta só (produtoId, data)
    @Query("select l.produto.id, min(l.validade) from Lote l where l.saldo > 0 and l.validade is not null group by l.produto.id")
    List<Object[]> proximasValidades();
}
