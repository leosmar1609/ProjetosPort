package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.servidor.dominio.Fornecedor;
import br.com.lojaodamari.servidor.dominio.Produto;
import br.com.lojaodamari.servidor.dominio.Secao;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.FornecedorRepositorio;
import br.com.lojaodamari.servidor.repositorio.LoteRepositorio;
import br.com.lojaodamari.servidor.repositorio.ProdutoRepositorio;
import br.com.lojaodamari.servidor.repositorio.SecaoRepositorio;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// produtos, seções e fornecedores
@Service
public class CatalogoServico {

    private final ProdutoRepositorio produtos;
    private final SecaoRepositorio secoes;
    private final FornecedorRepositorio fornecedores;
    private final LoteRepositorio lotes;
    private final Clock relogio;

    public CatalogoServico(ProdutoRepositorio produtos, SecaoRepositorio secoes, FornecedorRepositorio fornecedores, LoteRepositorio lotes, Clock relogio) {
        this.produtos = produtos;
        this.secoes = secoes;
        this.fornecedores = fornecedores;
        this.lotes = lotes;
        this.relogio = relogio;
    }

    // todos os produtos, já com a próxima validade de cada um (uma consulta só pros lotes)
    @Transactional(readOnly = true)
    public List<ProdutoDto> listarProdutos() {
        LocalDate hoje = LocalDate.now(relogio);
        Map<Long, LocalDate> validades = proximasValidades();
        return produtos.findAllByOrderByNome().stream().map(p -> Mapeador.produto(p, hoje, validades.get(p.getId()))).toList();
    }

    // busca por nome no caixa (até 8 resultados)
    @Transactional(readOnly = true)
    public List<ProdutoDto> buscar(String termo) {
        if (termo == null || termo.trim().length() < 2) return List.of();
        LocalDate hoje = LocalDate.now(relogio);
        return produtos.buscarPorNome(termo.trim(), PageRequest.of(0, 8)).stream().map(p -> Mapeador.produto(p, hoje, null)).toList();
    }

    @Transactional(readOnly = true)
    public ProdutoDto produto(Long id) {
        Produto p = buscarProduto(id);
        return Mapeador.produto(p, LocalDate.now(relogio), proximasValidades().get(id));
    }

    public Produto buscarProduto(Long id) {
        return produtos.findById(id).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("produto_nao_encontrado", "Produto não encontrado."));
    }

    @Transactional
    public ProdutoDto criarProduto(ProdutoForm form) {
        Produto p = new Produto();
        p.setCustoMedio(BigDecimal.ZERO);
        p.setEstoqueAtual(BigDecimal.ZERO.setScale(3));
        preencher(p, form, null);
        return Mapeador.produto(produtos.save(p), LocalDate.now(relogio), null);
    }

    @Transactional
    public ProdutoDto editarProduto(Long id, ProdutoForm form) {
        Produto p = buscarProduto(id);
        preencher(p, form, id);
        return Mapeador.produto(p, LocalDate.now(relogio), proximasValidades().get(id));
    }

    // regras do cadastro: EAN com dígito certo, código único, produto por peso precisa de PLU, promoção coerente
    private void preencher(Produto p, ProdutoForm f, Long id) {
        String ean = vazioParaNulo(f.ean());
        String plu = vazioParaNulo(f.plu());
        if (ean == null && plu == null) {
            throw ExcecaoNegocio.invalido("sem_codigo", "Informe o EAN (código de barras) ou o PLU do produto.");
        }
        if (f.unidade() == Unidade.KG && plu == null) {
            throw ExcecaoNegocio.invalido("plu_obrigatorio", "Produto vendido por peso precisa de PLU, que é o código usado na balança.");
        }
        if (ean != null && !CodigoBarras.digitoValido(ean)) {
            throw ExcecaoNegocio.invalido("ean_invalido", "O dígito verificador do EAN não confere. Confira os números na embalagem.");
        }
        if (ean != null && ean.charAt(0) == '2' && ean.length() == 13) {
            throw ExcecaoNegocio.invalido("ean_reservado", "EAN começando com 2 é reservado para as etiquetas da balança.");
        }
        if (ean != null && produtos.existsByEanAndIdNot(ean, id == null ? -1L : id)) {
            throw ExcecaoNegocio.conflito("ean_em_uso", "Já existe outro produto com o EAN " + ean + ".");
        }
        if (plu != null && produtos.existsByPluAndIdNot(plu, id == null ? -1L : id)) {
            throw ExcecaoNegocio.conflito("plu_em_uso", "Já existe outro produto com o PLU " + plu + ".");
        }
        if (f.precoPromocional() != null && f.precoPromocional().compareTo(f.precoVenda()) >= 0) {
            throw ExcecaoNegocio.invalido("promocao_invalida", "O preço promocional precisa ser menor que o preço normal.");
        }
        if (f.promocaoInicio() != null && f.promocaoFim() != null && f.promocaoFim().isBefore(f.promocaoInicio())) {
            throw ExcecaoNegocio.invalido("promocao_invalida", "O fim da promoção vem antes do início.");
        }
        Secao secao = secoes.findById(f.secaoId()).orElseThrow(() -> ExcecaoNegocio.invalido("secao_invalida", "Seção não encontrada."));
        Fornecedor fornecedor = f.fornecedorId() == null ? null
                : fornecedores.findById(f.fornecedorId()).orElseThrow(() -> ExcecaoNegocio.invalido("fornecedor_invalido", "Fornecedor não encontrado."));

        p.setNome(f.nome().trim());
        p.setEan(ean);
        p.setPlu(plu);
        p.setUnidade(f.unidade());
        p.setSecao(secao);
        p.setFornecedor(fornecedor);
        p.setProducaoPropria(f.producaoPropria());
        p.setPrecoVenda(f.precoVenda());
        p.setPrecoPromocional(f.precoPromocional());
        p.setPromocaoInicio(f.precoPromocional() == null ? null : f.promocaoInicio());
        p.setPromocaoFim(f.precoPromocional() == null ? null : f.promocaoFim());
        p.setEstoqueMinimo(f.estoqueMinimo());
        p.setAtivo(f.ativo());
    }

    @Transactional(readOnly = true)
    public List<SecaoDto> listarSecoes() {
        return secoes.findAllByOrderByNome().stream().map(Mapeador::secao).toList();
    }

    @Transactional
    public SecaoDto criarSecao(String nome) {
        if (nome == null || nome.isBlank()) throw ExcecaoNegocio.invalido("nome_obrigatorio", "Informe o nome da seção.");
        if (secoes.existsByNomeIgnoreCase(nome.trim())) throw ExcecaoNegocio.conflito("secao_existe", "Já existe a seção " + nome.trim() + ".");
        Secao s = new Secao();
        s.setNome(nome.trim());
        return Mapeador.secao(secoes.save(s));
    }

    @Transactional(readOnly = true)
    public List<FornecedorDto> listarFornecedores() {
        return fornecedores.findAllByOrderByNome().stream().map(Mapeador::fornecedor).toList();
    }

    @Transactional
    public FornecedorDto salvarFornecedor(Long id, FornecedorForm form) {
        Fornecedor f = id == null ? new Fornecedor()
                : fornecedores.findById(id).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("fornecedor_nao_encontrado", "Fornecedor não encontrado."));
        f.setNome(form.nome().trim());
        f.setCnpj(vazioParaNulo(form.cnpj()));
        f.setTelefone(vazioParaNulo(form.telefone()));
        f.setEmail(vazioParaNulo(form.email()));
        f.setPrazoEntregaDias(form.prazoEntregaDias());
        return Mapeador.fornecedor(fornecedores.save(f));
    }

    // produtoId -> próxima validade entre os lotes com saldo
    public Map<Long, LocalDate> proximasValidades() {
        Map<Long, LocalDate> mapa = new HashMap<>();
        for (Object[] linha : lotes.proximasValidades()) {
            Object data = linha[1];
            mapa.put((Long) linha[0], data instanceof Date d ? d.toLocalDate() : (LocalDate) data);
        }
        return mapa;
    }

    private static String vazioParaNulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
