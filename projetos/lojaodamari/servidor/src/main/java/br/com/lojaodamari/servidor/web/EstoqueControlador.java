package br.com.lojaodamari.servidor.web;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.servidor.seguranca.Perfis;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import br.com.lojaodamari.servidor.servico.EstoqueServico;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// entrada, perda, inventário, lotes e histórico do estoque
@RestController
@RequestMapping("/api/estoque")
@Tag(name = "Estoque", description = "Entradas, perdas, inventário e validade")
public class EstoqueControlador {

    private final EstoqueServico estoque;

    public EstoqueControlador(EstoqueServico estoque) {
        this.estoque = estoque;
    }

    @GetMapping("/resumo")
    @PreAuthorize(Perfis.ESTOQUE_LEITURA)
    public ResumoEstoqueDto resumo() {
        return estoque.resumo();
    }

    @PostMapping("/entradas")
    @PreAuthorize(Perfis.ESTOQUE)
    public ProdutoDto entrada(@Valid @RequestBody EntradaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return estoque.entrada(form, quem.id());
    }

    @PostMapping("/perdas")
    @PreAuthorize(Perfis.ESTOQUE)
    public ProdutoDto perda(@Valid @RequestBody PerdaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return estoque.perda(form, quem.id());
    }

    @PostMapping("/ajustes")
    @PreAuthorize(Perfis.ESTOQUE)
    public ProdutoDto ajuste(@Valid @RequestBody AjusteForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return estoque.ajuste(form, quem.id());
    }

    // GET /api/estoque/produtos/5/lotes -> lotes com saldo, na ordem em que vão sair
    @GetMapping("/produtos/{id}/lotes")
    @PreAuthorize(Perfis.ESTOQUE_LEITURA)
    public List<LoteDto> lotes(@PathVariable Long id) {
        return estoque.lotes(id);
    }

    // GET /api/estoque/movimentos?produtoId=5 -> histórico (sem produtoId, os 200 últimos da loja)
    @GetMapping("/movimentos")
    @PreAuthorize(Perfis.ESTOQUE_LEITURA)
    public List<MovimentoDto> movimentos(@RequestParam(required = false) Long produtoId) {
        return estoque.movimentos(produtoId);
    }
}
