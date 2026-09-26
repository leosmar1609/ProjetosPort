package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.MotivoPerda;
import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.comum.enums.SituacaoEstoque;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.api.Sessao;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Tabelas;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.StringConverter;
import tools.jackson.core.type.TypeReference;

// posição do estoque: o que está acabando, o que está vencendo, e as ações de entrada, perda e inventário
public class TelaEstoque implements Tela {

    private final VBox raiz = new VBox(18);
    private final HBox numeros = new HBox(14);
    private final TextField busca = new TextField();
    private final ComboBox<String> secao = new ComboBox<>();
    private final ToggleGroup filtro = new ToggleGroup();
    private final TableView<ProdutoDto> tabela = Tabelas.nova("Nenhum produto com esses filtros.");
    private List<ProdutoDto> produtos = List.of();

    public TelaEstoque() {
        busca.setPromptText("Buscar por nome ou código");
        busca.textProperty().addListener((o, a, n) -> filtrar());
        HBox.setHgrow(busca, Priority.ALWAYS);
        secao.setOnAction(e -> filtrar());
        HBox segmentos = new HBox();
        String[][] opcoes = {{"Todos", "todos"}, {"Precisa de atenção", "atencao"}, {"Vence em 7 dias", "validade"}};
        for (int i = 0; i < opcoes.length; i++) {
            ToggleButton b = new ToggleButton(opcoes[i][0]);
            b.setUserData(opcoes[i][1]);
            b.setToggleGroup(filtro);
            if (i == 0) b.getStyleClass().add("primeiro");
            if (i == opcoes.length - 1) b.getStyleClass().add("ultimo");
            segmentos.getChildren().add(b);
        }
        filtro.getToggles().getFirst().setSelected(true);
        filtro.selectedToggleProperty().addListener((o, antes, agora) -> {
            if (agora == null) antes.setSelected(true);
            filtrar();
        });

        HBox barra = Ui.linha(10, busca, secao, segmentos);
        if (Sessao.pode(Perfil.ESTOQUISTA, Perfil.GERENTE, Perfil.ADMIN)) {
            barra.getChildren().addAll(Ui.botao("+ Entrada", this::entrada), Ui.botaoSecundario("Perda", this::perda), Ui.botaoSecundario("Inventário", this::ajuste));
        }

        tabela.getColumns().addAll(List.of(
                Tabelas.componente("Produto", 250, p -> duasLinhas(p.nome(), p.ean() != null ? p.ean() : "PLU " + p.plu())),
                Tabelas.texto("Seção", 140, ProdutoDto::secaoNome),
                Tabelas.componente("Estoque", 190, this::nivel),
                Tabelas.numero("Mínimo", 110, p -> Formato.quantidade(p.estoqueMinimo(), p.unidade())),
                Tabelas.componente("Próxima validade", 150, p -> p.proximaValidade() == null ? Ui.rotulo("—", "dica")
                        : duasLinhas(Formato.data(p.proximaValidade()), p.diasParaVencer() <= 0 ? "vence hoje" : p.diasParaVencer() == 1 ? "amanhã" : "em " + p.diasParaVencer() + " dias")),
                Tabelas.numero("Custo", 90, p -> Formato.dinheiro(p.custoMedio())),
                Tabelas.numero("Preço", 90, p -> Formato.dinheiro(p.precoAtual())),
                Tabelas.numero("Margem", 80, p -> Formato.percentual(p.margem())),
                Tabelas.componente("Situação", 170, p -> Ui.pill(p.situacao()))));
        tabela.setRowFactory(t -> {
            TableRow<ProdutoDto> linha = new TableRow<>();
            linha.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !linha.isEmpty()) detalhe(linha.getItem());
            });
            return linha;
        });
        VBox cardTabela = Ui.card(tabela, Ui.rotulo("Clique duas vezes num produto para ver os lotes e o histórico.", "dica"));
        VBox.setVgrow(tabela, Priority.ALWAYS);
        VBox.setVgrow(cardTabela, Priority.ALWAYS);

        raiz.getChildren().addAll(numeros, barra, cardTabela);
        raiz.setPadding(new Insets(22, 28, 22, 28));
    }

    @Override
    public String titulo() {
        return "Estoque";
    }

    @Override
    public String subtitulo() {
        return "Posição atual e validade dos lotes";
    }

    @Override
    public Parent conteudo() {
        return raiz;
    }

    @Override
    public void aoMostrar() {
        carregar();
    }

    private void carregar() {
        Tarefa.executar(() -> Api.get("/estoque/resumo", ResumoEstoqueDto.class), r -> numeros.getChildren().setAll(
                Ui.numero("Abaixo do mínimo", String.valueOf(r.abaixoMinimo()), r.emRuptura() + " em ruptura (sem estoque)", r.abaixoMinimo() > 0 ? "ruim" : ""),
                Ui.numero("Vencem em até 7 dias", String.valueOf(r.vencendo()), "coloque na frente da gôndola", r.vencendo() > 0 ? "aviso" : ""),
                Ui.numero("Valor em estoque", Formato.dinheiro(r.valorEmCusto()), "a preço de custo médio"),
                Ui.numero("Produtos ativos", String.valueOf(r.totalProdutos()), "no cadastro")));
        Tarefa.executar(() -> Api.get("/produtos", new TypeReference<List<ProdutoDto>>() {}), lista -> {
            produtos = lista.stream().filter(ProdutoDto::ativo).toList();
            String escolhida = secao.getValue();
            List<String> secoes = produtos.stream().map(ProdutoDto::secaoNome).distinct().sorted().toList();
            secao.getItems().setAll("Todas as seções");
            secao.getItems().addAll(secoes);
            secao.setValue(escolhida != null && secao.getItems().contains(escolhida) ? escolhida : "Todas as seções");
            filtrar();
        });
    }

    // aplica busca, seção e situação. o que precisa de atenção sobe pro topo
    private void filtrar() {
        String termo = busca.getText() == null ? "" : busca.getText().trim().toLowerCase();
        String sec = secao.getValue();
        String modo = filtro.getSelectedToggle() == null ? "todos" : (String) filtro.getSelectedToggle().getUserData();
        List<ProdutoDto> lista = produtos.stream()
                .filter(p -> termo.isEmpty() || p.nome().toLowerCase().contains(termo) || (p.ean() != null && p.ean().contains(termo)) || (p.plu() != null && p.plu().contains(termo)))
                .filter(p -> sec == null || sec.startsWith("Todas") || sec.equals(p.secaoNome()))
                .filter(p -> switch (modo) {
                    case "atencao" -> p.situacao() != SituacaoEstoque.NORMAL;
                    case "validade" -> p.diasParaVencer() != null && p.diasParaVencer() <= 7;
                    default -> true;
                })
                .sorted(Comparator.comparingInt((ProdutoDto p) -> -p.situacao().gravidade()).thenComparing(ProdutoDto::nome))
                .toList();
        tabela.setItems(FXCollections.observableArrayList(lista));
    }

    // barrinha de nível: cheia no dobro do mínimo. laranja abaixo do mínimo, vermelha sem estoque
    private Node nivel(ProdutoDto p) {
        double referencia = p.estoqueMinimo().doubleValue() * 2;
        double fracao = referencia <= 0 ? 1 : Math.max(0, Math.min(1, p.estoqueAtual().doubleValue() / referencia));
        Region fundo = new Region();
        fundo.getStyleClass().add("barra-fundo");
        fundo.setPrefSize(70, 6);
        fundo.setMaxSize(70, 6);
        Region cheio = new Region();
        String cor = p.estoqueAtual().signum() <= 0 ? "-cor-ruim" : p.estoqueAtual().compareTo(p.estoqueMinimo()) < 0 ? "-cor-aviso" : "-cor-ok";
        cheio.setStyle("-fx-background-color: " + cor + "; -fx-background-radius: 3;");
        cheio.setPrefSize(70 * fracao, 6);
        cheio.setMaxSize(70 * fracao, 6);
        StackPane barra = new StackPane(fundo, cheio);
        StackPane.setAlignment(cheio, Pos.CENTER_LEFT);
        barra.setMaxSize(70, 6);
        return Ui.linha(8, barra, Ui.rotulo(Formato.quantidade(p.estoqueAtual().max(BigDecimal.ZERO), p.unidade())));
    }

    private static Node duasLinhas(String principal, String apoio) {
        VBox v = new VBox(0, Ui.rotulo(principal), Ui.rotulo(apoio, "codigo-pequeno"));
        v.setAlignment(Pos.CENTER_LEFT);
        return v;
    }

    // ---------------- ações ----------------

    private ComboBox<ProdutoDto> escolhaProduto() {
        ComboBox<ProdutoDto> c = new ComboBox<>(FXCollections.observableArrayList(produtos));
        c.setConverter(new StringConverter<>() {
            @Override
            public String toString(ProdutoDto p) {
                return p == null ? "" : p.nome() + " · " + Formato.quantidade(p.estoqueAtual(), p.unidade());
            }

            @Override
            public ProdutoDto fromString(String s) {
                return null;
            }
        });
        c.setPrefWidth(360);
        c.setVisibleRowCount(14);
        ProdutoDto selecionado = tabela.getSelectionModel().getSelectedItem();
        if (selecionado != null) c.setValue(selecionado);
        return c;
    }

    private void entrada() {
        ComboBox<ProdutoDto> produto = escolhaProduto();
        TextField quantidade = new TextField();
        TextField custo = new TextField();
        DatePicker validade = new DatePicker(LocalDate.now().plusDays(30));
        TextField nota = new TextField();
        produto.valueProperty().addListener((o, a, p) -> {
            if (p != null) custo.setText(Formato.numero(p.custoMedio(), 2));
        });
        if (produto.getValue() != null) custo.setText(Formato.numero(produto.getValue().custoMedio(), 2));
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Produto"), produto);
        g.addRow(1, new Label("Quantidade"), quantidade);
        g.addRow(2, new Label("Custo unitário (R$)"), custo);
        g.addRow(3, new Label("Validade do lote"), validade);
        g.addRow(4, new Label("Nota fiscal"), nota);
        Dialogos.formulario("Entrada de mercadoria", "Cada entrada vira um lote com validade própria. O custo médio do produto é recalculado.", g, "Lançar entrada", () -> {
            if (produto.getValue() == null) throw new IllegalArgumentException("Escolha o produto.");
            var form = new EntradaForm(produto.getValue().id(), Dialogos.numeroObrigatorio(quantidade, "a quantidade"),
                    Dialogos.numeroObrigatorio(custo, "o custo"), validade.getValue(), nota.getText().isBlank() ? null : nota.getText().trim());
            return () -> Api.post("/estoque/entradas", form, ProdutoDto.class);
        }, p -> carregar());
    }

    private void perda() {
        ComboBox<ProdutoDto> produto = escolhaProduto();
        TextField quantidade = new TextField();
        ComboBox<MotivoPerda> motivo = new ComboBox<>(FXCollections.observableArrayList(MotivoPerda.values()));
        motivo.setValue(MotivoPerda.VENCIMENTO);
        motivo.setConverter(new StringConverter<>() {
            @Override
            public String toString(MotivoPerda m) {
                return m == null ? "" : m.descricao();
            }

            @Override
            public MotivoPerda fromString(String s) {
                return null;
            }
        });
        TextField observacao = new TextField();
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Produto"), produto);
        g.addRow(1, new Label("Quantidade"), quantidade);
        g.addRow(2, new Label("Motivo"), motivo);
        g.addRow(3, new Label("Observação"), observacao);
        Dialogos.formulario("Registrar perda", "Produto que saiu sem ser vendido. Sai primeiro dos lotes que vencem antes.", g, "Registrar perda", () -> {
            if (produto.getValue() == null) throw new IllegalArgumentException("Escolha o produto.");
            var form = new PerdaForm(produto.getValue().id(), Dialogos.numeroObrigatorio(quantidade, "a quantidade"), motivo.getValue(), observacao.getText());
            return () -> Api.post("/estoque/perdas", form, ProdutoDto.class);
        }, p -> carregar());
    }

    private void ajuste() {
        ComboBox<ProdutoDto> produto = escolhaProduto();
        TextField contada = new TextField();
        Label sistema = Ui.rotulo("", "dica");
        produto.valueProperty().addListener((o, a, p) -> sistema.setText(p == null ? "" : "O sistema tem " + Formato.quantidade(p.estoqueAtual(), p.unidade())));
        if (produto.getValue() != null) sistema.setText("O sistema tem " + Formato.quantidade(produto.getValue().estoqueAtual(), produto.getValue().unidade()));
        TextField observacao = new TextField("Contagem de inventário");
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Produto"), produto);
        g.addRow(1, new Label(""), sistema);
        g.addRow(2, new Label("Quantidade contada"), contada);
        g.addRow(3, new Label("Observação"), observacao);
        Dialogos.formulario("Inventário", "O estoque do sistema passa a ser o que foi contado na prateleira e no depósito.", g, "Ajustar estoque", () -> {
            if (produto.getValue() == null) throw new IllegalArgumentException("Escolha o produto.");
            var form = new AjusteForm(produto.getValue().id(), Dialogos.numeroObrigatorio(contada, "a quantidade contada"), observacao.getText());
            return () -> Api.post("/estoque/ajustes", form, ProdutoDto.class);
        }, p -> carregar());
    }

    // lotes (na ordem em que vão sair) e o histórico de movimentos do produto
    private void detalhe(ProdutoDto p) {
        TableView<LoteDto> lotes = Tabelas.nova("Nenhum lote com saldo.");
        lotes.getColumns().addAll(List.of(
                Tabelas.texto("Validade", 110, l -> Formato.data(l.validade())),
                Tabelas.numero("Saldo", 110, l -> Formato.quantidade(l.saldo(), p.unidade())),
                Tabelas.numero("Entrou", 110, l -> Formato.quantidade(l.quantidadeInicial(), p.unidade())),
                Tabelas.numero("Custo", 90, l -> Formato.dinheiro(l.custoUnitario())),
                Tabelas.texto("Nota", 100, l -> l.notaFiscal() == null ? "—" : l.notaFiscal()),
                Tabelas.texto("Recebido", 110, l -> Formato.dataHora(l.recebidoEm()))));
        TableView<MovimentoDto> movimentos = Tabelas.nova("Sem movimentos.");
        movimentos.getColumns().addAll(List.of(
                Tabelas.texto("Quando", 110, m -> Formato.dataHora(m.dataHora())),
                Tabelas.texto("Tipo", 100, m -> m.tipo().name().charAt(0) + m.tipo().name().substring(1).toLowerCase().replace('_', ' ')),
                Tabelas.numero("Qtd", 100, m -> (m.quantidade().signum() > 0 ? "+" : "") + Formato.quantidade(m.quantidade(), p.unidade())),
                Tabelas.numero("Saldo", 100, m -> Formato.quantidade(m.saldoDepois(), p.unidade())),
                Tabelas.texto("Detalhe", 220, m -> m.observacao() == null ? "" : m.observacao()),
                Tabelas.texto("Quem", 120, m -> m.usuarioNome() == null ? "" : m.usuarioNome())));
        lotes.setPrefHeight(360);
        movimentos.setPrefHeight(360);
        TabPane abas = new TabPane(new Tab("Lotes", lotes), new Tab("Histórico", movimentos));
        abas.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        abas.setPrefWidth(760);
        VBox corpo = new VBox(abas);
        corpo.setPadding(new Insets(0, 22, 8, 22));
        Dialog<Void> d = Dialogos.novo(p.nome(), "Estoque " + Formato.quantidade(p.estoqueAtual(), p.unidade()) + " · mínimo " + Formato.quantidade(p.estoqueMinimo(), p.unidade())
                + " · custo médio " + Formato.dinheiro(p.custoMedio().setScale(2, RoundingMode.HALF_UP)));
        d.getDialogPane().setContent(corpo);
        d.getDialogPane().getButtonTypes().add(new ButtonType("Fechar", ButtonBar.ButtonData.CANCEL_CLOSE));
        Tarefa.executar(() -> Api.get("/estoque/produtos/" + p.id() + "/lotes", new TypeReference<List<LoteDto>>() {}), l -> lotes.setItems(FXCollections.observableArrayList(l)));
        Tarefa.executar(() -> Api.get("/estoque/movimentos?produtoId=" + p.id(), new TypeReference<List<MovimentoDto>>() {}), m -> movimentos.setItems(FXCollections.observableArrayList(m)));
        d.showAndWait();
    }
}
