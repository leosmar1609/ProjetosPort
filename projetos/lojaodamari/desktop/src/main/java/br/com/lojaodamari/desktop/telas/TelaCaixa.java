package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.api.ApiException;
import br.com.lojaodamari.desktop.api.Config;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javafx.application.Platform;
import javafx.beans.property.ReadOnlyObjectWrapper;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.geometry.Side;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.*;
import javafx.scene.shape.Circle;
import tools.jackson.core.type.TypeReference;

// o PDV: abre o caixa, passa os itens, recebe e imprime o cupom. pensado pra usar só com teclado e leitor de código
public class TelaCaixa implements Tela {

    private static final Pattern MULTIPLICADOR = Pattern.compile("^(\\d{1,3})\\s*[*xX]\\s*(.+)$");

    private final StackPane raiz = new StackPane();
    private final BorderPane pdv = new BorderPane();
    private final VBox abertura = new VBox();

    private final TableView<ItemVendaDto> tabela = new TableView<>();
    private final Label numeroCupom = Ui.rotulo("", "mono", "dica");
    private final Label totalItens = Ui.rotulo("0 itens", "dica");
    private final Label total = Ui.rotulo("0,00", "etiqueta-total");
    private final Label ultimo = Ui.rotulo("Caixa livre", "etiqueta-ultimo");
    private final TextField leitor = new TextField();
    private final Label mensagem = Ui.rotulo("", "msg-erro");
    private final Label infoSessao = Ui.rotulo("", "dica");
    private final Button finalizar = Ui.botao("Finalizar venda", this::finalizar);
    private final FlowPane hortifruti = new FlowPane(8, 8);
    private final ContextMenu sugestoes = new ContextMenu();

    private SessaoCaixaDto sessao;
    private VendaDto venda;
    private List<ProdutoDto> catalogo = List.of();
    private int quantidadePendente = 1;

    public TelaCaixa() {
        montarPdv();
        montarAbertura();
        raiz.getChildren().addAll(pdv, abertura);
        pdv.setVisible(false);
        abertura.setVisible(false);
    }

    @Override
    public String titulo() {
        return sessao == null ? "Caixa" : String.format("Caixa %02d", sessao.numeroCaixa());
    }

    @Override
    public String subtitulo() {
        if (sessao == null) return "Abra o caixa para começar a vender";
        return venda != null && !venda.itens().isEmpty() ? "Venda em andamento" : "Caixa livre";
    }

    @Override
    public Parent conteudo() {
        return raiz;
    }

    // ao entrar na tela: tem caixa aberto? então carrega o catálogo e retoma a venda que ficou aberta
    @Override
    public void aoMostrar() {
        Tarefa.executar(() -> Api.get("/caixa/atual", SessaoCaixaDto.class), s -> {
            sessao = s;
            mostrarPdv();
            carregarCatalogo();
            Tarefa.executar(() -> Api.get("/vendas/em-andamento", VendaDto.class), v -> {
                venda = v;
                atualizarCupom();
                if (!v.itens().isEmpty()) {
                    ItemVendaDto u = v.itens().getLast();
                    ultimo.setText(u.descricao() + " · " + Formato.quantidade(u.quantidade(), u.unidade()) + "   " + Formato.dinheiro(u.total()));
                }
                if (!v.itens().isEmpty()) sucesso("Venda retomada: ela estava aberta quando o caixa foi fechado ou reiniciado.");
            }, e -> atualizarCupom());
        }, e -> {
            if ("caixa_fechado".equals(e.codigo())) mostrarAbertura();
            else Dialogos.erro(e);
        });
    }

    // ---------------- montagem da tela ----------------

    private void montarPdv() {
        // cupom (esquerda)
        TableColumn<ItemVendaDto, String> seq = coluna("#", 56, i -> String.format("%03d", i.sequencia()));
        TableColumn<ItemVendaDto, ItemVendaDto> descricao = new TableColumn<>("Descrição");
        descricao.setCellValueFactory(c -> new ReadOnlyObjectWrapper<>(c.getValue()));
        descricao.setCellFactory(c -> new TableCell<>() {
            @Override
            protected void updateItem(ItemVendaDto i, boolean vazio) {
                super.updateItem(i, vazio);
                if (vazio || i == null) {
                    setGraphic(null);
                    return;
                }
                Label nome = Ui.rotulo(i.descricao(), "descricao");
                HBox topo = Ui.linha(8, nome);
                if (i.promocao()) topo.getChildren().add(Ui.pill("oferta", "acento"));
                VBox v = new VBox(0, topo, Ui.rotulo(i.codigo(), "codigo-pequeno"));
                v.setAlignment(Pos.CENTER_LEFT);
                setGraphic(v);
            }
        });
        descricao.setPrefWidth(320);
        TableColumn<ItemVendaDto, String> qtd = coluna("Qtd", 110, i -> Formato.quantidade(i.quantidade(), i.unidade()));
        TableColumn<ItemVendaDto, String> unit = coluna("Unit.", 100, i -> Formato.numero(i.precoUnitario(), 2));
        TableColumn<ItemVendaDto, String> tot = coluna("Total", 110, i -> i.cancelado() ? "cancelado" : Formato.numero(i.total(), 2));
        qtd.getStyleClass().add("direita");
        unit.getStyleClass().add("direita");
        tot.getStyleClass().add("direita");
        tabela.getColumns().addAll(List.of(seq, descricao, qtd, unit, tot));
        tabela.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        tabela.getStyleClass().add("tabela-cupom");
        tabela.setPlaceholder(new VBox(6, Ui.icone(Ui.ICONE_CODIGO, 40), Ui.rotulo("Caixa livre", "titulo-card"),
                Ui.rotulo("Passe um código de barras ou digite o nome do produto.", "dica")) {{
            setAlignment(Pos.CENTER);
        }});
        tabela.setRowFactory(t -> new TableRow<>() {
            @Override
            protected void updateItem(ItemVendaDto i, boolean vazio) {
                super.updateItem(i, vazio);
                getStyleClass().remove("cancelado");
                if (!vazio && i != null && i.cancelado()) getStyleClass().add("cancelado");
            }
        });
        // clicar no cupom não pode roubar o foco do leitor por muito tempo
        tabela.setOnMouseClicked(e -> Platform.runLater(leitor::requestFocus));
        VBox.setVgrow(tabela, Priority.ALWAYS);

        HBox cabecalhoCupom = Ui.linha(10, Ui.titulo("Cupom"), Ui.espaco(), numeroCupom);
        cabecalhoCupom.getStyleClass().add("cupom-cabecalho");
        cabecalhoCupom.setPadding(new Insets(0, 0, 10, 0));
        HBox rodapeCupom = Ui.linha(10, totalItens, Ui.espaco(), Ui.rotulo("Selecione um item e aperte F4 para cancelar", "dica"));
        VBox cupom = Ui.card(cabecalhoCupom, tabela, rodapeCupom);
        HBox.setHgrow(cupom, Priority.ALWAYS);

        // etiqueta de preço com o total (direita)
        Label moeda = Ui.rotulo("R$", "etiqueta-moeda");
        HBox valor = new HBox(6, moeda, total);
        valor.setAlignment(Pos.BASELINE_LEFT);
        Region divisor = new Region();
        divisor.getStyleClass().add("etiqueta-divisor");
        divisor.setMinHeight(1);
        VBox etiqueta = new VBox(0, Ui.rotulo("TOTAL A PAGAR", "etiqueta-rotulo"), valor, divisor, ultimo);
        VBox.setMargin(divisor, new Insets(6, 0, 8, 0));
        etiqueta.getStyleClass().add("etiqueta");
        etiqueta.setPadding(new Insets(16, 20, 16, 20));
        Circle furo = new Circle(7);
        furo.getStyleClass().add("furo");
        StackPane etiquetaComFuro = new StackPane(etiqueta, furo);
        StackPane.setAlignment(furo, Pos.TOP_RIGHT);
        StackPane.setMargin(furo, new Insets(16, 18, 0, 0));

        // leitor e teclas
        leitor.getStyleClass().add("leitor");
        leitor.setPromptText("Código, nome ou 3*código");
        leitor.setOnAction(e -> lerLeitor());
        mensagem.setWrapText(true);
        GridPane teclas = new GridPane();
        teclas.setHgap(8);
        String[][] definicao = {{"Quantidade", "F2"}, {"Cancelar item", "F4"}, {"Cancelar venda", "F8"}};
        Runnable[] acoes = {this::pedirQuantidade, this::cancelarItem, this::cancelarVenda};
        for (int i = 0; i < definicao.length; i++) {
            Button b = Ui.botao(definicao[i][0], acoes[i]);
            b.getStyleClass().add("tecla");
            b.setGraphic(Ui.rotulo(definicao[i][1], "tecla-atalho"));
            b.setMaxWidth(Double.MAX_VALUE);
            b.setFocusTraversable(false);
            GridPane.setHgrow(b, Priority.ALWAYS);
            teclas.add(b, i, 0);
        }
        finalizar.getStyleClass().add("grande");
        finalizar.setMaxWidth(Double.MAX_VALUE);
        finalizar.setGraphic(Ui.rotulo("F10", "tecla-atalho"));
        finalizar.setContentDisplay(ContentDisplay.RIGHT);
        finalizar.setFocusTraversable(false);
        VBox leitorCard = Ui.card(leitor, mensagem, teclas, finalizar);
        leitorCard.setSpacing(10);

        // hortifruti pesado no caixa
        VBox hortiCard = Ui.card(Ui.rotulo("HORTIFRUTI NA BALANÇA", "rotulo-secao"), hortifruti);
        hortiCard.setSpacing(10);

        // turno
        Button sangria = Ui.botaoSecundario("Sangria", this::sangria);
        Button suprimento = Ui.botaoSecundario("Suprimento", this::suprimento);
        Button fechar = Ui.botaoPerigo("Fechar caixa", this::fecharCaixa);
        for (Button b : List.of(sangria, suprimento, fechar)) b.setFocusTraversable(false);
        VBox caixaCard = Ui.card(Ui.rotulo("TURNO", "rotulo-secao"), infoSessao, Ui.linha(8, sangria, suprimento, Ui.espaco(), fechar));
        caixaCard.setSpacing(8);

        VBox lado = new VBox(14, etiquetaComFuro, leitorCard, hortiCard, caixaCard);
        lado.setPrefWidth(430);
        lado.setMinWidth(400);
        ScrollPane rolagem = new ScrollPane(lado);
        rolagem.setFitToWidth(true);
        rolagem.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        rolagem.setMinWidth(420);

        HBox corpo = new HBox(20, cupom, rolagem);
        corpo.setPadding(new Insets(22, 28, 22, 28));
        pdv.setCenter(corpo);

        // sugestões da busca por nome: cai direto no primeiro item pra dar pra escolher com as setas
        sugestoes.setOnShown(e -> Platform.runLater(() -> {
            if (!sugestoes.getItems().isEmpty() && sugestoes.getSkin() != null) {
                sugestoes.getSkin().getNode().lookup(".menu-item").requestFocus();
            }
        }));
    }

    private void montarAbertura() {
        TextField numero = new TextField(String.valueOf(Config.numeroCaixa()));
        TextField fundo = new TextField("200,00");
        Label erro = Ui.rotulo("", "erro-campo");
        erro.setWrapText(true);
        Button abrir = Ui.botao("Abrir caixa", () -> {
            Integer n;
            try {
                n = Integer.parseInt(numero.getText().trim());
            } catch (NumberFormatException ex) {
                n = null;
            }
            BigDecimal f = Formato.lerNumero(fundo.getText());
            if (n == null || n < 1 || n > 99) {
                erro.setText("O número do caixa vai de 1 a 99.");
                return;
            }
            if (f == null || f.signum() < 0) {
                erro.setText("Informe o fundo de troco que está na gaveta, ex: 200,00.");
                return;
            }
            int numeroCaixa = n;
            Tarefa.executar(() -> Api.post("/caixa/abrir", new AberturaCaixaForm(numeroCaixa, f), SessaoCaixaDto.class), s -> {
                Config.lembrarCaixa(numeroCaixa);
                aoMostrar();
            }, ex -> erro.setText(ex.getMessage()));
        });
        abrir.getStyleClass().add("grande");
        abrir.setMaxWidth(Double.MAX_VALUE);
        fundo.setOnAction(e -> abrir.fire());
        numero.getStyleClass().add("campo-grande");
        fundo.getStyleClass().add("campo-grande");

        VBox card = Ui.card(
                Ui.titulo("Caixa fechado"),
                Ui.rotulo("Confira o dinheiro da gaveta e abra o caixa para começar o turno.", "dica"),
                Ui.rotulo("Número do caixa", "rotulo-campo"), numero,
                Ui.rotulo("Fundo de troco na gaveta (R$)", "rotulo-campo"), fundo,
                erro, abrir);
        card.setMaxWidth(440);
        card.setSpacing(10);
        card.setPadding(new Insets(28));
        abertura.getChildren().add(card);
        abertura.setAlignment(Pos.CENTER);
    }

    private void mostrarPdv() {
        abertura.setVisible(false);
        pdv.setVisible(true);
        atualizarSessao();
        janela().ifPresent(JanelaPrincipal::atualizarTitulo);
        Platform.runLater(leitor::requestFocus);
    }

    private void mostrarAbertura() {
        sessao = null;
        venda = null;
        pdv.setVisible(false);
        abertura.setVisible(true);
        janela().ifPresent(JanelaPrincipal::atualizarTitulo);
    }

    // catálogo em memória: a busca por nome e a decisão "é por peso?" ficam instantâneas. o preço quem define é o servidor
    private void carregarCatalogo() {
        Tarefa.executar(() -> Api.get("/produtos", new TypeReference<List<ProdutoDto>>() {}), lista -> {
            catalogo = lista.stream().filter(ProdutoDto::ativo).toList();
            hortifruti.getChildren().clear();
            catalogo.stream().filter(p -> "Hortifruti".equals(p.secaoNome())).forEach(p -> {
                Button b = new Button(p.nome() + "\n" + Formato.dinheiro(p.precoAtual()) + (p.unidade() == Unidade.KG ? "/kg" : "/un"));
                b.getStyleClass().addAll("botao", "balanca");
                b.setPrefWidth(122);
                b.setFocusTraversable(false);
                b.setOnAction(e -> escolher(p, quantidadePendente));
                hortifruti.getChildren().add(b);
            });
        });
    }

    // ---------------- passar itens ----------------

    // o que chegou do leitor (ou foi digitado): código, "3*código" ou parte do nome
    private void lerLeitor() {
        String texto = leitor.getText().trim();
        if (texto.isEmpty()) return;
        int quantidade = quantidadePendente;
        Matcher m = MULTIPLICADOR.matcher(texto);
        if (m.matches()) {
            quantidade = Integer.parseInt(m.group(1));
            texto = m.group(2).trim();
        }
        if (texto.matches("\\d+")) {
            String codigo = texto;
            // PLU de produto pesado: abre a balança antes de mandar
            Optional<ProdutoDto> pesado = catalogo.stream().filter(p -> codigo.equals(p.plu()) && p.unidade() == Unidade.KG).findFirst();
            if (codigo.length() == 5 && pesado.isPresent()) {
                escolher(pesado.get(), quantidade);
            } else {
                enviarItem(new AdicionarItemForm(codigo, null, BigDecimal.valueOf(quantidade)));
            }
            return;
        }
        List<ProdutoDto> achados = buscar(texto);
        if (achados.isEmpty()) {
            erro("Nenhum produto com \"" + texto + "\" no nome.");
        } else if (achados.size() == 1) {
            escolher(achados.getFirst(), quantidade);
        } else {
            int q = quantidade;
            sugestoes.getItems().clear();
            achados.stream().limit(8).forEach(p -> {
                MenuItem item = new MenuItem(p.nome() + "   " + Formato.dinheiro(p.precoAtual()) + (p.unidade() == Unidade.KG ? "/kg" : ""));
                item.setOnAction(e -> escolher(p, q));
                sugestoes.getItems().add(item);
            });
            sugestoes.show(leitor, Side.BOTTOM, 0, 4);
            mensagem.setText("");
        }
    }

    private List<ProdutoDto> buscar(String termo) {
        String t = semAcento(termo);
        return catalogo.stream().filter(p -> semAcento(p.nome()).contains(t)).toList();
    }

    private static String semAcento(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
    }

    // produto escolhido na busca ou nas teclas de hortifruti. por peso abre a balança
    private void escolher(ProdutoDto p, int quantidade) {
        if (p.unidade() == Unidade.KG) {
            Dialogos.pedirNumero(p.nome(), Formato.dinheiro(p.precoAtual()) + " o quilo · PLU " + p.plu() + "\nColoque na balança e confira o peso.",
                    "Peso (kg)", "", v -> v.signum() <= 0 || v.compareTo(BigDecimal.valueOf(50)) > 0 ? "O peso vai de 0,001 a 50 kg." : null)
                    .ifPresentOrElse(peso -> enviarItem(new AdicionarItemForm(null, p.id(), peso)), () -> leitor.requestFocus());
        } else {
            enviarItem(new AdicionarItemForm(null, p.id(), BigDecimal.valueOf(quantidade)));
        }
    }

    // manda o item pro servidor. se ainda não tem venda aberta, abre antes (o servidor devolve a que já existir)
    private void enviarItem(AdicionarItemForm form) {
        leitor.setDisable(true);
        Tarefa.executar(() -> {
            VendaDto v = venda != null ? venda : Api.post("/vendas", null, VendaDto.class);
            return Api.post("/vendas/" + v.id() + "/itens", form, VendaDto.class);
        }, v -> {
            venda = v;
            ItemVendaDto novo = v.itens().getLast();
            ultimo.setText(novo.descricao() + " · " + Formato.quantidade(novo.quantidade(), novo.unidade()) + "   " + Formato.dinheiro(novo.total()));
            mensagem.setText("");
            limparLeitor();
            atualizarCupom();
        }, e -> {
            leitor.setDisable(false);
            erro(e.getMessage());
            leitor.selectAll();
            leitor.requestFocus();
        });
    }

    private void limparLeitor() {
        leitor.setDisable(false);
        leitor.clear();
        quantidadePendente = 1;
        leitor.setPromptText("Código, nome ou 3*código");
        leitor.requestFocus();
    }

    // redesenha o cupom e o total
    private void atualizarCupom() {
        List<ItemVendaDto> itens = venda == null ? List.of() : venda.itens();
        tabela.setItems(FXCollections.observableArrayList(itens));
        if (!itens.isEmpty()) tabela.scrollTo(itens.size() - 1);
        BigDecimal t = venda == null ? BigDecimal.ZERO : venda.total();
        total.setText(Formato.numero(t, 2));
        long validos = itens.stream().filter(i -> !i.cancelado()).count();
        totalItens.setText(validos + (validos == 1 ? " item" : " itens"));
        numeroCupom.setText(venda == null ? "" : String.format("Nº %06d", venda.numero()));
        finalizar.setDisable(t.signum() <= 0);
        janela().ifPresent(JanelaPrincipal::atualizarTitulo);
    }

    private void atualizarSessao() {
        if (sessao == null) return;
        infoSessao.setText(String.format("Caixa %02d · aberto às %s · %d vendas · %s", sessao.numeroCaixa(), Formato.hora(sessao.abertaEm()),
                sessao.quantidadeVendas(), Formato.dinheiro(sessao.totalVendas())));
    }

    private void recarregarSessao() {
        Tarefa.executar(() -> Api.get("/caixa/atual", SessaoCaixaDto.class), s -> {
            sessao = s;
            atualizarSessao();
        }, e -> {
        });
    }

    // ---------------- teclas ----------------

    @Override
    public void tecla(KeyEvent e) {
        if (!pdv.isVisible()) return;
        KeyCode k = e.getCode();
        if (k == KeyCode.F2) pedirQuantidade();
        else if (k == KeyCode.F4) cancelarItem();
        else if (k == KeyCode.F8) cancelarVenda();
        else if (k == KeyCode.F10) finalizar();
        else if (k == KeyCode.ESCAPE && leitor.isFocused()) limparLeitor();
        else return;
        e.consume();
    }

    private void pedirQuantidade() {
        Dialogos.pedirNumero("Quantidade", "Quantas unidades do próximo item?", "Quantidade", "2",
                v -> v.stripTrailingZeros().scale() > 0 || v.intValue() < 1 || v.intValue() > 999 ? "Use um número inteiro de 1 a 999." : null)
                .ifPresent(v -> {
                    quantidadePendente = v.intValue();
                    leitor.setPromptText(quantidadePendente + " × passe o produto");
                    sucesso("O próximo item entra com " + quantidadePendente + " unidades.");
                });
        leitor.requestFocus();
    }

    // cancela o item selecionado (ou o último, se nenhum estiver selecionado), com a senha do fiscal
    private void cancelarItem() {
        if (venda == null) return;
        ItemVendaDto alvo = tabela.getSelectionModel().getSelectedItem();
        if (alvo == null || alvo.cancelado()) {
            alvo = venda.itens().stream().filter(i -> !i.cancelado()).reduce((a, b) -> b).orElse(null);
        }
        if (alvo == null) {
            erro("Não há item para cancelar.");
            return;
        }
        ItemVendaDto item = alvo;
        Dialogos.autorizacao("Cancelar item", String.format("%03d · %s · %s", item.sequencia(), item.descricao(), Formato.dinheiro(item.total())))
                .ifPresent(aut -> Tarefa.executar(() -> Api.post("/vendas/" + venda.id() + "/itens/" + item.sequencia() + "/cancelar", aut, VendaDto.class), v -> {
                    venda = v;
                    atualizarCupom();
                    sucesso("Item cancelado. Ele continua no cupom riscado, como pede o fisco.");
                }));
        leitor.requestFocus();
    }

    private void cancelarVenda() {
        if (venda == null || venda.itens().isEmpty()) return;
        Dialogos.autorizacao("Cancelar venda", "Os " + venda.itens().size() + " itens deste cupom serão descartados.")
                .ifPresent(aut -> Tarefa.executar(() -> Api.post("/vendas/" + venda.id() + "/cancelar", aut, VendaDto.class), v -> {
                    venda = null;
                    atualizarCupom();
                    ultimo.setText("Venda cancelada");
                    sucesso("Venda cancelada.");
                }));
        leitor.requestFocus();
    }

    // pagamento e cupom. depois da venda concluída o caixa fica livre pra próxima
    private void finalizar() {
        if (venda == null || venda.total().signum() <= 0) return;
        new DialogoPagamento(venda).mostrar().ifPresent(concluida -> {
            new DialogoCupom(concluida).mostrar();
            venda = null;
            atualizarCupom();
            ultimo.setText(concluida.troco().signum() > 0 ? "Troco da última venda: " + Formato.dinheiro(concluida.troco()) : "Caixa livre");
            mensagem.setText("");
            recarregarSessao();
            carregarCatalogo();
        });
        leitor.requestFocus();
    }

    // ---------------- turno ----------------

    private void sangria() {
        Dialogos.pedirNumero("Sangria", "Retirada de dinheiro da gaveta para o cofre.", "Valor (R$)", "",
                v -> v.signum() <= 0 ? "Informe um valor maior que zero." : null).ifPresent(valor ->
                Dialogos.autorizacao("Autorizar sangria", Formato.dinheiro(valor) + " saindo do caixa").ifPresent(aut ->
                        Tarefa.executar(() -> Api.post("/caixa/sangria", new MovimentoCaixaForm(valor, "Sangria para o cofre", aut), SessaoCaixaDto.class), s -> {
                            sessao = s;
                            atualizarSessao();
                            sucesso("Sangria de " + Formato.dinheiro(valor) + " registrada.");
                        })));
        leitor.requestFocus();
    }

    private void suprimento() {
        Dialogos.pedirNumero("Suprimento", "Dinheiro colocado na gaveta para troco.", "Valor (R$)", "",
                v -> v.signum() <= 0 ? "Informe um valor maior que zero." : null).ifPresent(valor ->
                Tarefa.executar(() -> Api.post("/caixa/suprimento", new MovimentoCaixaForm(valor, "Suprimento de troco", null), SessaoCaixaDto.class), s -> {
                    sessao = s;
                    atualizarSessao();
                    sucesso("Suprimento de " + Formato.dinheiro(valor) + " registrado.");
                }));
        leitor.requestFocus();
    }

    // fechamento às cegas: o operador conta a gaveta sem ver quanto o sistema espera. o resultado aparece depois
    private void fecharCaixa() {
        if (venda != null && !venda.itens().isEmpty()) {
            erro("Tem uma venda em andamento. Finalize ou cancele antes de fechar o caixa.");
            return;
        }
        Dialogos.pedirNumero("Fechar caixa", "Conte o dinheiro da gaveta (com o fundo de troco) e digite o total.", "Dinheiro contado (R$)", "",
                v -> v.signum() < 0 ? "O valor não pode ser negativo." : null).ifPresent(contado ->
                Tarefa.executar(() -> Api.post("/caixa/fechar", new FechamentoCaixaForm(contado), SessaoCaixaDto.class), s -> {
                    mostrarResultadoFechamento(s);
                    mostrarAbertura();
                }));
    }

    private void mostrarResultadoFechamento(SessaoCaixaDto s) {
        Dialog<Void> d = Dialogos.novo(String.format("Caixa %02d fechado", s.numeroCaixa()), s.quantidadeVendas() + " vendas no turno, total de " + Formato.dinheiro(s.totalVendas()) + ".");
        GridPane g = Dialogos.grade();
        int linha = 0;
        g.addRow(linha++, Ui.rotulo("Fundo de troco", "dica"), Ui.rotulo(Formato.dinheiro(s.fundoTroco())));
        for (var e : s.totalPorForma().entrySet()) g.addRow(linha++, Ui.rotulo(e.getKey().descricao(), "dica"), Ui.rotulo(Formato.dinheiro(e.getValue())));
        g.addRow(linha++, Ui.rotulo("Suprimentos", "dica"), Ui.rotulo(Formato.dinheiro(s.suprimentos())));
        g.addRow(linha++, Ui.rotulo("Sangrias", "dica"), Ui.rotulo("- " + Formato.dinheiro(s.sangrias())));
        g.addRow(linha++, Ui.rotulo("Dinheiro esperado na gaveta", "dica"), Ui.rotulo(Formato.dinheiro(s.dinheiroEsperado()), "valor-grande"));
        g.addRow(linha++, Ui.rotulo("Dinheiro contado", "dica"), Ui.rotulo(Formato.dinheiro(s.dinheiroContado()), "valor-grande"));
        int sinal = s.diferenca().signum();
        Label dif = Ui.pill(sinal == 0 ? "Caixa bateu" : (sinal > 0 ? "Sobrou " : "Faltou ") + Formato.dinheiro(s.diferenca().abs()), sinal == 0 ? "ok" : "ruim");
        g.addRow(linha, Ui.rotulo("Diferença", "dica"), dif);
        d.getDialogPane().setContent(g);
        d.getDialogPane().getButtonTypes().add(new ButtonType("Entendi", ButtonBar.ButtonData.OK_DONE));
        d.showAndWait();
    }

    // ---------------- apoio ----------------

    private void erro(String texto) {
        mensagem.getStyleClass().setAll("label", "msg-erro");
        mensagem.setText(texto);
    }

    private void sucesso(String texto) {
        mensagem.getStyleClass().setAll("label", "msg-ok");
        mensagem.setText(texto);
    }

    private Optional<JanelaPrincipal> janela() {
        return raiz.getScene() != null && raiz.getScene().getRoot() instanceof JanelaPrincipal j ? Optional.of(j) : Optional.empty();
    }

    private static <T> TableColumn<T, String> coluna(String titulo, double largura, java.util.function.Function<T, String> valor) {
        TableColumn<T, String> c = new TableColumn<>(titulo);
        c.setCellValueFactory(d -> new ReadOnlyObjectWrapper<>(valor.apply(d.getValue())));
        c.setPrefWidth(largura);
        c.setSortable(false);
        return c;
    }
}
