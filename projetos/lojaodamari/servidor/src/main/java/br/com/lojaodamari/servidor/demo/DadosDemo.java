package br.com.lojaodamari.servidor.demo;

import br.com.lojaodamari.comum.dto.EntradaForm;
import br.com.lojaodamari.comum.dto.ItemPedidoForm;
import br.com.lojaodamari.comum.dto.PedidoCompraForm;
import br.com.lojaodamari.comum.enums.FormaPagamento;
import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.servidor.dominio.*;
import br.com.lojaodamari.servidor.repositorio.*;
import br.com.lojaodamari.servidor.servico.CodigoBarras;
import br.com.lojaodamari.servidor.servico.CompraServico;
import br.com.lojaodamari.servidor.servico.EstoqueServico;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

// dados de exemplo pra loja já abrir funcionando: usuários, produtos com lote e validade e 35 dias de vendas.
// só roda com o banco vazio (sem nenhum usuário) e com lojao.demo.ativo=true
@Component
@ConditionalOnProperty(name = "lojao.demo.ativo", havingValue = "true")
public class DadosDemo implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosDemo.class);
    private static final int DIAS_HISTORICO = 35;
    // tamanho da loja: multiplica estoque, mínimo, giro e cupons juntos, pra tudo continuar coerente
    private static final int ESCALA = 3;

    private final UsuarioRepositorio usuarios;
    private final SecaoRepositorio secoes;
    private final FornecedorRepositorio fornecedores;
    private final ProdutoRepositorio produtos;
    private final EstoqueServico estoque;
    private final CompraServico compras;
    private final PasswordEncoder senhas;
    private final JdbcTemplate jdbc;
    private final DataSource dataSource;
    private final TransactionTemplate transacao;
    private final Clock relogio;
    private final Random sorte = new Random(2026);

    public DadosDemo(UsuarioRepositorio usuarios, SecaoRepositorio secoes, FornecedorRepositorio fornecedores, ProdutoRepositorio produtos,
                     EstoqueServico estoque, CompraServico compras, PasswordEncoder senhas, JdbcTemplate jdbc, DataSource dataSource,
                     TransactionTemplate transacao, Clock relogio) {
        this.usuarios = usuarios;
        this.secoes = secoes;
        this.fornecedores = fornecedores;
        this.produtos = produtos;
        this.estoque = estoque;
        this.compras = compras;
        this.senhas = senhas;
        this.jdbc = jdbc;
        this.dataSource = dataSource;
        this.transacao = transacao;
        this.relogio = relogio;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) return;
        log.info("banco vazio: criando dados de demonstração da LojãoDaMari...");
        long inicio = System.currentTimeMillis();
        Map<String, Usuario> equipe = transacao.execute(t -> criarEquipe());
        List<Produto> catalogo = transacao.execute(t -> criarCatalogo(equipe.get("joana")));
        transacao.executeWithoutResult(t -> criarPedidoAberto(catalogo, equipe.get("paulo")));
        int vendasCriadas = transacao.execute(t -> criarHistorico(catalogo, equipe));
        log.info("dados de demonstração prontos em {} s: {} produtos e {} vendas", (System.currentTimeMillis() - inicio) / 1000, catalogo.size(), vendasCriadas);
    }

    // equipe da loja. as senhas estão no README
    private Map<String, Usuario> criarEquipe() {
        Map<String, Usuario> m = new LinkedHashMap<>();
        Object[][] pessoas = {
                {"mari", "Mariana Lopes", Perfil.ADMIN, "mari123"},
                {"paulo", "Paulo Henrique", Perfil.GERENTE, "gerente123"},
                {"carlos", "Carlos Eduardo", Perfil.FISCAL, "fiscal123"},
                {"joana", "Joana Ribeiro", Perfil.ESTOQUISTA, "estoque123"},
                {"marina", "Marina Souza", Perfil.OPERADOR, "caixa123"},
                {"bruno", "Bruno Almeida", Perfil.OPERADOR, "caixa123"},
                {"leticia", "Letícia Campos", Perfil.OPERADOR, "caixa123"},
        };
        for (Object[] p : pessoas) {
            Usuario u = new Usuario();
            u.setLogin((String) p[0]);
            u.setNome((String) p[1]);
            u.setPerfil((Perfil) p[2]);
            u.setSenhaHash(senhas.encode((String) p[3]));
            u.setAtivo(true);
            u.setCriadoEm(LocalDateTime.now(relogio).minusDays(60));
            m.put(u.getLogin(), usuarios.save(u));
        }
        return m;
    }

    // um produto de exemplo: nome, seção, preço, custo, unidade, estoque, mínimo, dias de validade, giro/dia, PLU
    private record Modelo(String nome, String secao, String preco, String custo, Unidade unidade, double estoque, double minimo, int validade, double giro, String plu) {
    }

    private static final List<Modelo> MODELOS = List.of(
            new Modelo("Arroz Tipo 1 5kg", "Mercearia", "27.90", "21.40", Unidade.UN, 64, 40, 210, 14, null),
            new Modelo("Feijão Carioca 1kg", "Mercearia", "8.49", "6.10", Unidade.UN, 22, 35, 160, 12, null),
            new Modelo("Açúcar Refinado 1kg", "Mercearia", "4.99", "3.60", Unidade.UN, 80, 30, 300, 9, null),
            new Modelo("Café Torrado 500g", "Mercearia", "18.90", "13.80", Unidade.UN, 41, 25, 120, 8, null),
            new Modelo("Óleo de Soja 900ml", "Mercearia", "7.49", "5.60", Unidade.UN, 58, 30, 240, 10, null),
            new Modelo("Macarrão Espaguete 500g", "Mercearia", "4.29", "2.90", Unidade.UN, 95, 40, 330, 11, null),
            new Modelo("Farinha de Trigo 1kg", "Mercearia", "5.79", "4.10", Unidade.UN, 37, 20, 150, 5, null),
            new Modelo("Leite Condensado 395g", "Mercearia", "6.99", "4.90", Unidade.UN, 44, 20, 280, 6, null),
            new Modelo("Molho de Tomate 340g", "Mercearia", "2.99", "1.90", Unidade.UN, 120, 50, 200, 13, null),
            new Modelo("Sal Refinado 1kg", "Mercearia", "2.49", "1.40", Unidade.UN, 60, 20, 700, 3, null),
            new Modelo("Refrigerante Cola 2L", "Bebidas", "9.99", "6.90", Unidade.UN, 72, 48, 95, 22, null),
            new Modelo("Água Mineral 1,5L", "Bebidas", "2.99", "1.50", Unidade.UN, 140, 60, 300, 25, null),
            new Modelo("Suco de Uva Integral 1L", "Bebidas", "14.90", "9.80", Unidade.UN, 18, 12, 180, 3, null),
            new Modelo("Cerveja Pilsen Lata 350ml", "Bebidas", "3.99", "2.70", Unidade.UN, 0, 96, 150, 40, null),
            new Modelo("Leite Integral 1L", "Frios e laticínios", "5.49", "4.20", Unidade.UN, 86, 60, 4, 30, null),
            new Modelo("Iogurte Natural 170g", "Frios e laticínios", "3.29", "2.10", Unidade.UN, 34, 24, 6, 9, null),
            new Modelo("Queijo Muçarela", "Frios e laticínios", "49.90", "34.00", Unidade.KG, 18, 8, 21, 3.2, "00101"),
            new Modelo("Presunto Cozido", "Frios e laticínios", "36.90", "24.50", Unidade.KG, 11, 6, 15, 2.4, "00102"),
            new Modelo("Manteiga 200g", "Frios e laticínios", "12.90", "9.40", Unidade.UN, 26, 15, 60, 4, null),
            new Modelo("Requeijão Cremoso 200g", "Frios e laticínios", "8.99", "6.20", Unidade.UN, 9, 15, 25, 5, null),
            new Modelo("Banana Prata", "Hortifruti", "6.99", "3.90", Unidade.KG, 42, 25, 5, 9, "00401"),
            new Modelo("Tomate", "Hortifruti", "8.49", "4.80", Unidade.KG, 27, 20, 6, 8, "00402"),
            new Modelo("Batata", "Hortifruti", "5.99", "3.10", Unidade.KG, 65, 30, 20, 10, "00403"),
            new Modelo("Cebola", "Hortifruti", "4.99", "2.60", Unidade.KG, 38, 20, 25, 6, "00404"),
            new Modelo("Maçã Gala", "Hortifruti", "11.90", "7.20", Unidade.KG, 16, 15, 12, 4, "00405"),
            new Modelo("Alface Crespa", "Hortifruti", "3.49", "1.60", Unidade.UN, 24, 20, 3, 11, "00406"),
            new Modelo("Pão Francês", "Padaria", "16.90", "7.80", Unidade.KG, 14, 6, 1, 11, "00301"),
            new Modelo("Bolo de Fubá", "Padaria", "14.90", "6.50", Unidade.UN, 6, 4, 3, 3, "00302"),
            new Modelo("Carne Moída", "Açougue", "39.90", "28.00", Unidade.KG, 21, 10, 3, 6, "00201"),
            new Modelo("Frango Inteiro", "Açougue", "13.90", "9.20", Unidade.KG, 34, 15, 7, 7, "00202"),
            new Modelo("Linguiça Toscana", "Açougue", "24.90", "16.50", Unidade.KG, 7, 8, 9, 3, "00203"),
            new Modelo("Detergente 500ml", "Limpeza", "2.79", "1.70", Unidade.UN, 130, 50, 720, 9, null),
            new Modelo("Sabão em Pó 1,6kg", "Limpeza", "22.90", "16.40", Unidade.UN, 23, 15, 540, 3, null),
            new Modelo("Água Sanitária 2L", "Limpeza", "6.49", "4.10", Unidade.UN, 31, 20, 360, 4, null),
            new Modelo("Papel Higiênico 12 rolos", "Higiene", "21.90", "15.20", Unidade.UN, 19, 15, 900, 5, null),
            new Modelo("Creme Dental 90g", "Higiene", "4.99", "2.90", Unidade.UN, 48, 25, 540, 6, null),
            new Modelo("Sabonete 85g", "Higiene", "2.49", "1.30", Unidade.UN, 88, 40, 720, 8, null),
            new Modelo("Shampoo 350ml", "Higiene", "16.90", "10.40", Unidade.UN, 14, 10, 600, 2, null));

    private static final Map<String, String> FORNECEDOR_DA_SECAO = Map.of(
            "Mercearia", "Distribuidora Paulista", "Bebidas", "Bebidas Vale", "Frios e laticínios", "Laticínios Serra Azul",
            "Hortifruti", "Ceasa · Box 214", "Açougue", "Frigorífico Boa Carne", "Limpeza", "Casa Limpa Distribuidora", "Higiene", "Casa Limpa Distribuidora");

    // seções, fornecedores e produtos. o estoque inicial entra como lote de verdade (com validade), pelo mesmo serviço da tela
    private List<Produto> criarCatalogo(Usuario estoquista) {
        Map<String, Secao> porNome = new HashMap<>();
        for (String nome : List.of("Mercearia", "Bebidas", "Frios e laticínios", "Hortifruti", "Padaria", "Açougue", "Limpeza", "Higiene")) {
            Secao s = new Secao();
            s.setNome(nome);
            porNome.put(nome, secoes.save(s));
        }
        Map<String, Fornecedor> forn = new HashMap<>();
        Object[][] dados = {
                {"Distribuidora Paulista", "12.345.678/0001-90", "(11) 3456-7890", 3}, {"Bebidas Vale", "23.456.789/0001-01", "(11) 2345-6789", 2},
                {"Laticínios Serra Azul", "34.567.890/0001-12", "(35) 3222-1100", 2}, {"Ceasa · Box 214", null, "(11) 3643-3700", 1},
                {"Frigorífico Boa Carne", "45.678.901/0001-23", "(11) 4567-8901", 1}, {"Casa Limpa Distribuidora", "56.789.012/0001-34", "(11) 5678-9012", 4}};
        for (Object[] d : dados) {
            Fornecedor f = new Fornecedor();
            f.setNome((String) d[0]);
            f.setCnpj((String) d[1]);
            f.setTelefone((String) d[2]);
            f.setPrazoEntregaDias((Integer) d[3]);
            forn.put(f.getNome(), fornecedores.save(f));
        }

        LocalDate hoje = LocalDate.now(relogio);
        List<Produto> lista = new ArrayList<>();
        for (int i = 0; i < MODELOS.size(); i++) {
            Modelo m = MODELOS.get(i);
            Produto p = new Produto();
            p.setNome(m.nome());
            p.setSecao(porNome.get(m.secao()));
            p.setFornecedor(m.secao().equals("Padaria") ? null : forn.get(FORNECEDOR_DA_SECAO.get(m.secao())));
            p.setProducaoPropria(m.secao().equals("Padaria"));
            p.setUnidade(m.unidade());
            p.setPlu(m.plu());
            p.setEan(m.plu() == null ? CodigoBarras.comDigito("78910" + String.format("%07d", 40317 + i * 263)) : null);
            p.setPrecoVenda(new BigDecimal(m.preco()));
            p.setCustoMedio(BigDecimal.ZERO);
            p.setEstoqueAtual(BigDecimal.ZERO.setScale(3));
            p.setEstoqueMinimo(BigDecimal.valueOf(m.minimo() * ESCALA).setScale(3, RoundingMode.HALF_UP));
            p.setAtivo(true);
            if (m.nome().startsWith("Café")) {
                // promoção da semana, pra aparecer no caixa e no cupom
                p.setPrecoPromocional(new BigDecimal("16.90"));
                p.setPromocaoInicio(hoje.minusDays(2));
                p.setPromocaoFim(hoje.plusDays(5));
            }
            produtos.save(p);
            if (m.estoque() > 0) {
                // estoque em dois lotes: o mais antigo vence antes, o mais novo 40% depois
                BigDecimal total = BigDecimal.valueOf(m.estoque() * ESCALA);
                BigDecimal primeiro = m.unidade() == Unidade.UN ? total.multiply(BigDecimal.valueOf(0.4)).setScale(0, RoundingMode.HALF_UP) : total.multiply(BigDecimal.valueOf(0.4)).setScale(3, RoundingMode.HALF_UP);
                BigDecimal custo = new BigDecimal(m.custo());
                if (primeiro.signum() > 0) {
                    estoque.entrada(new EntradaForm(p.getId(), primeiro, custo, hoje.plusDays(m.validade()), "NF 48" + (100 + i)), estoquista.getId());
                }
                BigDecimal segundo = total.subtract(primeiro);
                if (segundo.signum() > 0) {
                    estoque.entrada(new EntradaForm(p.getId(), segundo, custo.multiply(BigDecimal.valueOf(1.02)).setScale(2, RoundingMode.HALF_UP),
                            hoje.plusDays(Math.round(m.validade() * 1.4) + 1), "NF 49" + (100 + i)), estoquista.getId());
                }
            } else {
                p.setCustoMedio(new BigDecimal(m.custo()));
            }
            lista.add(p);
        }
        return lista;
    }

    // um pedido já enviado pro laticínio, pra dar pra testar o recebimento
    private void criarPedidoAberto(List<Produto> catalogo, Usuario gerente) {
        Produto requeijao = catalogo.stream().filter(p -> p.getNome().startsWith("Requeijão")).findFirst().orElseThrow();
        Produto manteiga = catalogo.stream().filter(p -> p.getNome().startsWith("Manteiga")).findFirst().orElseThrow();
        var pedido = compras.criar(new PedidoCompraForm(requeijao.getFornecedor().getId(), List.of(
                new ItemPedidoForm(requeijao.getId(), BigDecimal.valueOf(36), new BigDecimal("6.20")),
                new ItemPedidoForm(manteiga.getId(), BigDecimal.valueOf(24), new BigDecimal("9.40")))), gerente.getId());
        compras.enviar(pedido.id());
    }

    // ---------------- histórico de vendas ----------------

    // quanto cada hora vende em relação às outras (7h até 21h) e cada dia da semana (segunda até domingo)
    private static final double[] PESO_HORA = {1.2, 2.1, 2.6, 3.1, 4.2, 4.6, 3.5, 2.8, 2.9, 3.6, 5.2, 6.8, 6.1, 4.3, 2.4};
    private static final double[] PESO_DIA = {0.8, 0.85, 0.95, 0.95, 1.1, 1.3, 0.9};

    // gera as vendas dos últimos dias direto por SQL em lote (bem mais rápido que salvar entidade por entidade)
    private int criarHistorico(List<Produto> catalogo, Map<String, Usuario> equipe) {
        LocalDateTime agora = LocalDateTime.now(relogio);
        List<Usuario> operadores = List.of(equipe.get("bruno"), equipe.get("leticia"), equipe.get("marina"));
        long fiscalId = equipe.get("carlos").getId();
        double somaGiro = catalogo.stream().mapToDouble(this::giroDe).sum();

        List<Object[]> sessoes = new ArrayList<>();
        List<Object[]> vendas = new ArrayList<>();
        List<Object[]> itens = new ArrayList<>();
        List<Object[]> pagamentos = new ArrayList<>();
        long idSessao = 0, idVenda = 0, idItem = 0, idPagamento = 0;

        for (int d = DIAS_HISTORICO; d >= 0; d--) {
            LocalDate dia = agora.toLocalDate().minusDays(d);
            boolean hoje = d == 0;
            int cuponsDoDia = (int) Math.round(48 * ESCALA * PESO_DIA[dia.getDayOfWeek().getValue() - 1] * (0.92 + sorte.nextDouble() * 0.16));
            // hoje só dois caixas estão abertos (Bruno e Letícia); o caixa 03 fica pra quem for testar como Marina
            int caixasDoDia = hoje ? 2 : 3;
            long[] sessaoDoCaixa = new long[caixasDoDia];
            BigDecimal[] dinheiroDoCaixa = new BigDecimal[caixasDoDia];
            for (int c = 0; c < caixasDoDia; c++) {
                sessaoDoCaixa[c] = ++idSessao;
                dinheiroDoCaixa[c] = BigDecimal.ZERO;
            }

            for (int n = 0; n < cuponsDoDia; n++) {
                int hora = 7 + sortearIndice(PESO_HORA);
                LocalDateTime quando = dia.atTime(hora, sorte.nextInt(60), sorte.nextInt(60));
                if (hoje && !quando.isBefore(agora)) continue;
                int caixa = sorte.nextInt(caixasDoDia);
                long vendaId = ++idVenda;

                int qtdItens = 1 + (int) Math.min(17, Math.abs(sorte.nextGaussian() * 5 + 5));
                BigDecimal total = BigDecimal.ZERO;
                boolean cancelaUm = sorte.nextDouble() < 0.03;
                for (int s = 1; s <= qtdItens; s++) {
                    Produto p = sortearProduto(catalogo, somaGiro);
                    BigDecimal qtd = p.getUnidade() == Unidade.KG
                            ? BigDecimal.valueOf(0.18 + sorte.nextDouble() * 1.6).setScale(3, RoundingMode.HALF_UP)
                            : BigDecimal.valueOf(sorte.nextDouble() < 0.75 ? 1 : 2 + sorte.nextInt(3)).setScale(3);
                    BigDecimal preco = p.getPrecoVenda();
                    BigDecimal custo = p.getCustoMedio().multiply(BigDecimal.valueOf(0.97 + sorte.nextDouble() * 0.03)).setScale(4, RoundingMode.HALF_UP);
                    BigDecimal valor = preco.multiply(qtd).setScale(2, RoundingMode.HALF_UP);
                    boolean cancelado = cancelaUm && s == qtdItens && qtdItens > 1;
                    if (!cancelado) total = total.add(valor);
                    itens.add(new Object[]{++idItem, vendaId, s, p.getId(), p.getEan() != null ? p.getEan() : p.getPlu(), p.getNome(), p.getUnidade().name(),
                            qtd, preco, custo, valor, false, cancelado, cancelado ? fiscalId : null});
                }

                FormaPagamento forma = sortearForma();
                BigDecimal pago = total;
                if (forma == FormaPagamento.DINHEIRO) {
                    pago = arredondarNota(total);
                    dinheiroDoCaixa[caixa] = dinheiroDoCaixa[caixa].add(total);
                }
                pagamentos.add(new Object[]{++idPagamento, vendaId, forma.name(), pago});
                String cpf = sorte.nextDouble() < 0.3 ? cpfAleatorio() : null;
                vendas.add(new Object[]{vendaId, sessaoDoCaixa[caixa], operadores.get(caixa).getId(), "CONCLUIDA", total, pago.subtract(total), cpf,
                        Timestamp.valueOf(quando.minusSeconds(40 + qtdItens * 6L)), Timestamp.valueOf(quando), null});
            }

            for (int c = 0; c < caixasDoDia; c++) {
                BigDecimal fundo = new BigDecimal("200.00");
                boolean aberta = hoje;
                // num dia qualquer o caixa 2 fechou com R$ 3,50 faltando, pra aparecer no relatório de fechamento
                BigDecimal diferenca = d == 4 && c == 1 ? new BigDecimal("-3.50") : BigDecimal.ZERO;
                sessoes.add(new Object[]{sessaoDoCaixa[c], c + 1, operadores.get(c).getId(), aberta ? "ABERTA" : "FECHADA",
                        Timestamp.valueOf(dia.atTime(6, 50 + c)), aberta ? null : Timestamp.valueOf(dia.atTime(22, 10 + c)), fundo,
                        aberta ? null : fundo.add(dinheiroDoCaixa[c]).add(diferenca)});
            }
        }

        jdbc.batchUpdate("INSERT INTO sessao_caixa (id, numero_caixa, operador_id, status, aberta_em, fechada_em, fundo_troco, dinheiro_contado) VALUES (?,?,?,?,?,?,?,?)", sessoes);
        jdbc.batchUpdate("INSERT INTO venda (id, sessao_id, operador_id, status, total, troco, cpf, iniciada_em, concluida_em, cancelada_por_id) VALUES (?,?,?,?,?,?,?,?,?,?)", vendas);
        for (int i = 0; i < itens.size(); i += 2000) {
            jdbc.batchUpdate("INSERT INTO item_venda (id, venda_id, sequencia, produto_id, codigo, descricao, unidade, quantidade, preco_unitario, custo_unitario, total, promocao, cancelado, cancelado_por_id) "
                    + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", itens.subList(i, Math.min(i + 2000, itens.size())));
        }
        jdbc.batchUpdate("INSERT INTO pagamento (id, venda_id, forma, valor) VALUES (?,?,?,?)", pagamentos);
        continuarContagem("sessao_caixa", idSessao);
        continuarContagem("venda", idVenda);
        continuarContagem("item_venda", idItem);
        continuarContagem("pagamento", idPagamento);
        return vendas.size();
    }

    // como os ids foram colocados na mão, avisa o banco de onde continuar a numeração automática
    private void continuarContagem(String tabela, long ultimoId) {
        String banco;
        try (var conexao = dataSource.getConnection()) {
            banco = conexao.getMetaData().getDatabaseProductName();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        if (banco.toLowerCase().contains("h2")) {
            jdbc.execute("ALTER TABLE " + tabela + " ALTER COLUMN id RESTART WITH " + (ultimoId + 1));
        } else {
            jdbc.execute("ALTER TABLE " + tabela + " AUTO_INCREMENT = " + (ultimoId + 1));
        }
    }

    private double giroDe(Produto p) {
        return MODELOS.stream().filter(m -> m.nome().equals(p.getNome())).findFirst().map(Modelo::giro).orElse(1.0) * ESCALA;
    }

    // produto sorteado proporcional ao giro (leite e cerveja aparecem bem mais que sal), assim a sugestão de compra bate com o estoque
    private Produto sortearProduto(List<Produto> catalogo, double somaGiro) {
        double alvo = sorte.nextDouble() * somaGiro;
        for (Produto p : catalogo) {
            alvo -= giroDe(p);
            if (alvo <= 0) return p;
        }
        return catalogo.getLast();
    }

    private int sortearIndice(double[] pesos) {
        double alvo = sorte.nextDouble() * Arrays.stream(pesos).sum();
        for (int i = 0; i < pesos.length; i++) {
            alvo -= pesos[i];
            if (alvo <= 0) return i;
        }
        return pesos.length - 1;
    }

    private FormaPagamento sortearForma() {
        double x = sorte.nextDouble();
        if (x < 0.34) return FormaPagamento.DEBITO;
        if (x < 0.60) return FormaPagamento.CREDITO;
        if (x < 0.82) return FormaPagamento.PIX;
        if (x < 0.96) return FormaPagamento.DINHEIRO;
        return FormaPagamento.VALE_ALIMENTACAO;
    }

    // o cliente paga em dinheiro com a nota "redonda" acima do total
    private BigDecimal arredondarNota(BigDecimal total) {
        for (int nota : new int[]{5, 10, 20, 50, 100, 200}) {
            if (total.compareTo(BigDecimal.valueOf(nota)) <= 0) return BigDecimal.valueOf(nota).setScale(2);
        }
        return total.divide(BigDecimal.valueOf(50), 0, RoundingMode.CEILING).multiply(BigDecimal.valueOf(50)).setScale(2);
    }

    // CPF com dígitos verificadores válidos
    private String cpfAleatorio() {
        int[] d = new int[11];
        for (int i = 0; i < 9; i++) d[i] = sorte.nextInt(10);
        for (int t = 9; t <= 10; t++) {
            int soma = 0;
            for (int i = 0; i < t; i++) soma += d[i] * (t + 1 - i);
            d[t] = (soma * 10) % 11 % 10;
        }
        StringBuilder sb = new StringBuilder();
        for (int x : d) sb.append(x);
        return sb.toString();
    }
}
