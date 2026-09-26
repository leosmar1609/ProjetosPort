package br.com.lojaodamari.servidor.repositorio;

import br.com.lojaodamari.comum.enums.StatusPedido;
import br.com.lojaodamari.servidor.dominio.PedidoCompra;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

// pedidos de compra
public interface PedidoCompraRepositorio extends JpaRepository<PedidoCompra, Long> {

    @EntityGraph(attributePaths = "fornecedor")
    List<PedidoCompra> findAllByOrderByCriadoEmDesc();

    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    List<PedidoCompra> findByStatusIn(Collection<StatusPedido> status);
}
