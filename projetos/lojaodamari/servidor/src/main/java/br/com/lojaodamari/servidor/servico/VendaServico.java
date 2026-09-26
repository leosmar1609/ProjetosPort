package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.FormaPagamento;
import br.com.lojaodamari.comum.enums.StatusVenda;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.servidor.dominio.*;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.ProdutoRepositorio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import br.com.lojaodamari.servidor.repositorio.VendaRepositorio;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// a venda no caixa, do primeiro item até o cupom
@Service
public class VendaServico {

    private final VendaRepositorio vendas;
    private final ProdutoRepositorio produtos;
    private final UsuarioRepositorio usuarios;
    private final CaixaServico caixa;
    private final EstoqueServico estoque;
    private final AcessoServico acesso;
    private final Clock relogio;

    public VendaServico(VendaRepositorio vendas, ProdutoRepositorio produtos, UsuarioRepositorio usuarios, CaixaServico caixa,
                        EstoqueServico estoque, AcessoServico acesso, Clock relogio) {
        this.vendas = vendas;
        this.produtos = produtos;
        this.usuarios = usuarios;
        this.caixa = caixa;
        this.estoque = estoque;
        this.acesso = acesso;
        this.relogio = relogio;
    }

    // começa uma venda. se o app fechou no meio de uma venda, devolve a que ficou aberta em vez de criar outra
    @Transactional
    public VendaDto iniciar(UsuarioLogado quem) {
        SessaoCaixa s = caixa.sessaoAberta(quem.id());
        Venda v = vendas.findFirstBySessaoIdAndStatus(s.getId(), StatusVenda.ABERTA).orElseGet(() -> {
            Venda nova = new Venda();
            nova.setSessao(s);
            nova.setOperador(usuarios.getReferenceById(quem.id()));
            nova.setStatus(StatusVenda.ABERTA);
            nova.setTotal(BigDecimal.ZERO);
            nova.setTroco(BigDecimal.ZERO);
            nova.setIniciadaEm(LocalDateTime.now(relogio));
            return vendas.save(nova);
        });
        return Mapeador.venda(v);
    }

    // venda aberta do caixa de quem está logado, se tiver (o app usa pra retomar depois de reiniciar)
    @Transactional(readOnly = true)
    public VendaDto emAndamento(UsuarioLogado quem) {
        SessaoCaixa s = caixa.sessaoAberta(quem.id());
        return vendas.findFirstBySessaoIdAndStatus(s.getId(), StatusVenda.ABERTA).map(Mapeador::venda)
                .orElseThrow(() -> ExcecaoNegocio.naoEncontrado("sem_venda_aberta", "Nenhuma venda em andamento."));
    }

    @Transactional(readOnly = true)
    public VendaDto buscar(Long id) {
        return Mapeador.venda(carregar(id));
    }

    // passa um item: pelo código do leitor ou pelo produto escolhido na busca
    @Transactional
    public VendaDto adicionarItem(Long vendaId, AdicionarItemForm f, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        LocalDate hoje = LocalDate.now(relogio);

        Produto p;
        String codigo;
        BigDecimal quantidade;
        BigDecimal totalFixo = null;

        if (f.produtoId() != null) {
            p = produtos.findById(f.produtoId()).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("produto_nao_encontrado", "Produto não encontrado."));
            codigo = p.getEan() != null ? p.getEan() : p.getPlu();
            quantidade = quantidadeDigitada(p, f.quantidade());
        } else if (f.codigo() != null && !f.codigo().isBlank()) {
            switch (CodigoBarras.interpretar(f.codigo())) {
                case CodigoBarras.Ean ean -> {
                    p = produtos.findByEan(ean.codigo()).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("produto_nao_encontrado", "Nenhum produto com o código " + ean.codigo() + "."));
                    codigo = ean.codigo();
                    quantidade = quantidadeDigitada(p, f.quantidade());
                }
                case CodigoBarras.Plu plu -> {
                    p = produtos.findByPlu(plu.plu()).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("produto_nao_encontrado", "Nenhum produto com o PLU " + plu.plu() + "."));
                    codigo = plu.plu();
                    quantidade = quantidadeDigitada(p, f.quantidade());
                }
                case CodigoBarras.Balanca etiqueta -> {
                    // a etiqueta já traz o valor. a quantidade (peso) sai dividindo pelo preço do quilo
                    p = produtos.findByPlu(etiqueta.plu()).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("produto_nao_encontrado", "A etiqueta é do PLU " + etiqueta.plu() + ", que não está cadastrado."));
                    codigo = f.codigo().trim();
                    totalFixo = etiqueta.valorTotal();
                    quantidade = p.getUnidade() == Unidade.KG
                            ? totalFixo.divide(p.precoAtual(hoje), 3, RoundingMode.HALF_UP)
                            : totalFixo.divide(p.precoAtual(hoje), 0, RoundingMode.HALF_UP).setScale(3);
                }
            }
        } else {
            throw ExcecaoNegocio.invalido("item_sem_codigo", "Passe o código de barras ou escolha o produto na busca.");
        }

        if (!p.isAtivo()) {
            throw ExcecaoNegocio.invalido("produto_inativo", p.getNome() + " está desativado no cadastro e não pode ser vendido.");
        }
        BigDecimal preco = p.precoAtual(hoje);
        ItemVenda item = new ItemVenda();
        item.setVenda(v);
        item.setSequencia(v.getItens().size() + 1);
        item.setProduto(p);
        item.setCodigo(codigo);
        item.setDescricao(p.getNome());
        item.setUnidade(p.getUnidade());
        item.setQuantidade(quantidade);
        item.setPrecoUnitario(preco);
        item.setCustoUnitario(p.getCustoMedio());
        item.setTotal(totalFixo != null ? totalFixo : preco.multiply(quantidade).setScale(2, RoundingMode.HALF_UP));
        item.setPromocao(p.emPromocao(hoje));
        v.getItens().add(item);
        // mudou o total: pagamentos lançados antes deixam de valer
        v.getPagamentos().clear();
        v.setTotal(v.calcularTotal());
        // grava agora pra o item novo já voltar com id
        vendas.flush();
        return Mapeador.venda(v);
    }

    // cancela um item com a senha do fiscal. o item continua no cupom, marcado como cancelado
    @Transactional
    public VendaDto cancelarItem(Long vendaId, int sequencia, AutorizacaoForm autorizacao, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        ItemVenda item = v.getItens().stream().filter(i -> i.getSequencia() == sequencia).findFirst()
                .orElseThrow(() -> ExcecaoNegocio.naoEncontrado("item_nao_encontrado", "Não existe o item " + sequencia + " neste cupom."));
        if (item.isCancelado()) {
            throw ExcecaoNegocio.invalido("item_ja_cancelado", "Esse item já foi cancelado.");
        }
        Usuario fiscal = acesso.autorizar(autorizacao, "Cancelar item");
        item.setCancelado(true);
        item.setCanceladoPor(fiscal);
        v.getPagamentos().clear();
        v.setTotal(v.calcularTotal());
        return Mapeador.venda(v);
    }

    // lança um pagamento. só dinheiro pode passar do que falta (a diferença vira troco)
    @Transactional
    public VendaDto pagar(Long vendaId, PagamentoForm f, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        BigDecimal total = v.calcularTotal();
        if (total.signum() == 0) {
            throw ExcecaoNegocio.invalido("venda_vazia", "Passe pelo menos um item antes de receber.");
        }
        BigDecimal falta = total.subtract(v.totalPago());
        if (falta.signum() <= 0) {
            throw ExcecaoNegocio.invalido("venda_ja_paga", "A venda já está paga. Finalize para imprimir o cupom.");
        }
        if (f.forma() != FormaPagamento.DINHEIRO && f.valor().compareTo(falta) > 0) {
            throw ExcecaoNegocio.invalido("valor_maior_que_falta", "Em " + f.forma().descricao() + " o valor não pode passar do que falta (" + Dinheiro.formatar(falta) + "). Só dinheiro gera troco.");
        }
        Pagamento p = new Pagamento();
        p.setVenda(v);
        p.setForma(f.forma());
        p.setValor(f.valor().setScale(2, RoundingMode.HALF_UP));
        v.getPagamentos().add(p);
        return Mapeador.venda(v);
    }

    // desfaz os pagamentos lançados (o cliente mudou de ideia sobre a forma)
    @Transactional
    public VendaDto limparPagamentos(Long vendaId, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        v.getPagamentos().clear();
        return Mapeador.venda(v);
    }

    // fecha a venda: confere que está paga, grava o troco e baixa o estoque
    @Transactional
    public VendaDto finalizar(Long vendaId, FinalizarVendaForm f, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        BigDecimal total = v.calcularTotal();
        if (total.signum() == 0) {
            throw ExcecaoNegocio.invalido("venda_vazia", "A venda não tem itens. Cancele a venda em vez de finalizar.");
        }
        BigDecimal pago = v.totalPago();
        if (pago.compareTo(total) < 0) {
            throw ExcecaoNegocio.invalido("pagamento_incompleto", "Ainda falta receber " + Dinheiro.formatar(total.subtract(pago)) + ".");
        }
        String cpf = f == null || f.cpf() == null || f.cpf().isBlank() ? null : f.cpf().replaceAll("\\D", "");
        if (cpf != null && !Dinheiro.cpfValido(cpf)) {
            throw ExcecaoNegocio.invalido("cpf_invalido", "Esse CPF não é válido. Confira os números ou deixe em branco.");
        }
        v.setTotal(total);
        v.setTroco(pago.subtract(total));
        v.setCpf(cpf);
        v.setStatus(StatusVenda.CONCLUIDA);
        v.setConcluidaEm(LocalDateTime.now(relogio));
        estoque.baixarVenda(v);
        return Mapeador.venda(v);
    }

    // cancela a venda inteira (antes de finalizar), com a senha do fiscal
    @Transactional
    public VendaDto cancelar(Long vendaId, AutorizacaoForm autorizacao, UsuarioLogado quem) {
        Venda v = vendaAbertaDoOperador(vendaId, quem);
        Usuario fiscal = acesso.autorizar(autorizacao, "Cancelar a venda");
        v.setStatus(StatusVenda.CANCELADA);
        v.setCanceladaPor(fiscal);
        v.getPagamentos().clear();
        return Mapeador.venda(v);
    }

    // cupom em texto de 40 colunas, do jeito que sai na impressora térmica
    @Transactional(readOnly = true)
    public CupomDto cupom(Long vendaId) {
        Venda v = carregar(vendaId);
        if (v.getStatus() != StatusVenda.CONCLUIDA) {
            throw ExcecaoNegocio.invalido("venda_nao_concluida", "O cupom só sai depois que a venda é finalizada.");
        }
        return new CupomDto(Cupom.montar(v));
    }

    private Venda carregar(Long id) {
        return vendas.findById(id).orElseThrow(() -> ExcecaoNegocio.naoEncontrado("venda_nao_encontrada", "Venda " + id + " não encontrada."));
    }

    // só o operador dono do caixa mexe na venda, e só enquanto ela está aberta
    private Venda vendaAbertaDoOperador(Long id, UsuarioLogado quem) {
        Venda v = carregar(id);
        if (!v.getOperador().getId().equals(quem.id())) {
            throw ExcecaoNegocio.proibido("venda_de_outro_caixa", "Essa venda é de outro caixa.");
        }
        if (v.getStatus() != StatusVenda.ABERTA) {
            throw ExcecaoNegocio.invalido("venda_encerrada", "Essa venda já foi " + (v.getStatus() == StatusVenda.CONCLUIDA ? "finalizada" : "cancelada") + ".");
        }
        return v;
    }

    // quantidade que veio do caixa: por unidade tem que ser inteira; por quilo tem que vir o peso
    private static BigDecimal quantidadeDigitada(Produto p, BigDecimal q) {
        if (p.getUnidade() == Unidade.KG) {
            if (q == null || q.signum() <= 0) {
                throw ExcecaoNegocio.invalido("peso_obrigatorio", p.getNome() + " é vendido por quilo. Coloque na balança e informe o peso.");
            }
            if (q.compareTo(BigDecimal.valueOf(50)) > 0) {
                throw ExcecaoNegocio.invalido("peso_invalido", "Peso acima de 50 kg. Confira a balança.");
            }
            return q.setScale(3, RoundingMode.HALF_UP);
        }
        BigDecimal quantidade = q == null ? BigDecimal.ONE : q;
        if (quantidade.stripTrailingZeros().scale() > 0) {
            throw ExcecaoNegocio.invalido("quantidade_fracionada", p.getNome() + " é vendido por unidade. Use uma quantidade inteira.");
        }
        if (quantidade.compareTo(BigDecimal.valueOf(999)) > 0) {
            throw ExcecaoNegocio.invalido("quantidade_invalida", "Quantidade acima de 999. Confira o que foi digitado.");
        }
        return quantidade.setScale(3, RoundingMode.UNNECESSARY);
    }

    // monta o texto do cupom
    static final class Cupom {

        private static final int LARGURA = 40;
        private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        static String montar(Venda v) {
            List<String> l = new ArrayList<>();
            l.add(centro("LOJÃODAMARI SUPERMERCADO"));
            l.add(centro("Rua das Gôndolas, 123 · São Paulo/SP"));
            l.add("-".repeat(LARGURA));
            l.add(linha("CUPOM " + String.format("%06d", v.getId()) + " · CAIXA " + String.format("%02d", v.getSessao().getNumeroCaixa()), v.getConcluidaEm().format(DATA)));
            l.add(v.getCpf() == null ? "CONSUMIDOR NÃO IDENTIFICADO" : linha("CPF DO CONSUMIDOR", v.getCpf().substring(0, 3) + ".***.***-" + v.getCpf().substring(9)));
            l.add("-".repeat(LARGURA));
            l.add(linha("ITEM DESCRIÇÃO", "VALOR"));
            for (ItemVenda i : v.getItens()) {
                l.add(corta(String.format("%03d %s%s", i.getSequencia(), i.getDescricao(), i.isPromocao() ? " *PROMO" : "")));
                String qtd = i.getUnidade() == Unidade.KG
                        ? i.getQuantidade().setScale(3, RoundingMode.HALF_UP).toPlainString().replace('.', ',') + " KG"
                        : i.getQuantidade().stripTrailingZeros().toPlainString() + " UN";
                l.add(linha("    " + qtd + " x " + Dinheiro.numero(i.getPrecoUnitario()), i.isCancelado() ? "CANCELADO" : Dinheiro.numero(i.getTotal())));
            }
            l.add("-".repeat(LARGURA));
            long qtdItens = v.getItens().stream().filter(i -> !i.isCancelado()).count();
            l.add(linha("QTD. ITENS", String.valueOf(qtdItens)));
            l.add(linha("TOTAL R$", Dinheiro.numero(v.getTotal())));
            for (Pagamento p : v.getPagamentos()) l.add(linha(p.getForma().descricao().toUpperCase(), Dinheiro.numero(p.getValor())));
            if (v.getTroco().signum() > 0) l.add(linha("TROCO R$", Dinheiro.numero(v.getTroco())));
            l.add("-".repeat(LARGURA));
            l.add(centro("Operador(a): " + v.getOperador().getNome()));
            l.add(centro("Obrigado e volte sempre!"));
            return String.join("\n", l);
        }

        private static String linha(String esquerda, String direita) {
            int espaco = LARGURA - direita.length() - 1;
            String e = esquerda.length() > espaco ? esquerda.substring(0, espaco) : esquerda;
            return e + " ".repeat(LARGURA - e.length() - direita.length()) + direita;
        }

        private static String centro(String texto) {
            String t = corta(texto);
            int esquerda = (LARGURA - t.length()) / 2;
            return " ".repeat(esquerda) + t;
        }

        private static String corta(String texto) {
            return texto.length() > LARGURA ? texto.substring(0, LARGURA) : texto;
        }
    }
}
