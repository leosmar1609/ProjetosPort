package br.com.lojaodamari.servidor.web;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.servidor.seguranca.Perfis;
import br.com.lojaodamari.servidor.servico.CatalogoServico;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// cadastro de produtos, seções e fornecedores. qualquer usuário logado consulta, só gerência altera
@RestController
@RequestMapping("/api")
@Tag(name = "Catálogo", description = "Produtos, seções e fornecedores")
public class CatalogoControlador {

    private final CatalogoServico catalogo;

    public CatalogoControlador(CatalogoServico catalogo) {
        this.catalogo = catalogo;
    }

    @GetMapping("/produtos")
    public List<ProdutoDto> produtos() {
        return catalogo.listarProdutos();
    }

    // GET /api/produtos/busca?termo=arroz -> busca por nome no caixa
    @GetMapping("/produtos/busca")
    public List<ProdutoDto> buscar(@RequestParam String termo) {
        return catalogo.buscar(termo);
    }

    @GetMapping("/produtos/{id}")
    public ProdutoDto produto(@PathVariable Long id) {
        return catalogo.produto(id);
    }

    @PostMapping("/produtos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.GERENCIA)
    public ProdutoDto criar(@Valid @RequestBody ProdutoForm form) {
        return catalogo.criarProduto(form);
    }

    @PutMapping("/produtos/{id}")
    @PreAuthorize(Perfis.GERENCIA)
    public ProdutoDto editar(@PathVariable Long id, @Valid @RequestBody ProdutoForm form) {
        return catalogo.editarProduto(id, form);
    }

    @GetMapping("/secoes")
    public List<SecaoDto> secoes() {
        return catalogo.listarSecoes();
    }

    // POST /api/secoes {"nome": "Pet shop"}
    @PostMapping("/secoes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.GERENCIA)
    public SecaoDto criarSecao(@RequestBody Map<String, String> corpo) {
        return catalogo.criarSecao(corpo.get("nome"));
    }

    @GetMapping("/fornecedores")
    public List<FornecedorDto> fornecedores() {
        return catalogo.listarFornecedores();
    }

    @PostMapping("/fornecedores")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.GERENCIA)
    public FornecedorDto criarFornecedor(@Valid @RequestBody FornecedorForm form) {
        return catalogo.salvarFornecedor(null, form);
    }

    @PutMapping("/fornecedores/{id}")
    @PreAuthorize(Perfis.GERENCIA)
    public FornecedorDto editarFornecedor(@PathVariable Long id, @Valid @RequestBody FornecedorForm form) {
        return catalogo.salvarFornecedor(id, form);
    }
}
