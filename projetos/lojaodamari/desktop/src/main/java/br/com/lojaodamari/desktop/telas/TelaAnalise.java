package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.componentes.Tabelas;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import javafx.collections.FXCollections;
import javafx.geometry.HPos;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.XYChart;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.Duration;
import tools.jackson.core.type.TypeReference;

// os números da loja num dia: faturamento, horários, seções, formas de pagamento, curva ABC e fechamento dos caixas
public class TelaAnalise implements Tela {

    private static final DateTimeFormatter DIA_SEMANA = DateTimeFormatter.ofPattern("EEE dd/MM", Locale.of("pt", "BR"));

    private final ScrollPane raiz = new ScrollPane();
    private final DatePicker data = new DatePicker(LocalDate.now());
    private final HBox numeros = new HBox(14);
    private final CategoryAxis eixoHora = new CategoryAxis();
    private final NumberAxis eixoValor = new NumberAxis();
    private final BarChart<String, Number> grafico = new BarChart<>(eixoHora, eixoValor);
    private final Label subGrafico = Ui.rotulo("", "subtitulo-card");
    private final VBox secoes = new VBox(8);
    private final VBox formas = new VBox(8);
    private final TableView<VendaOperadorDto> operadores = Tabelas.nova("Sem vendas no dia.");
    private final TableView<ItemAbcDto> abc = Tabelas.nova("Sem vendas no período.");
    private final Label resumoAbc = Ui.rotulo("", "subtitulo-card");
    private final TableView<SessaoCaixaDto> fechamentos = Tabelas.nova("Nenhum caixa aberto nesse dia.");

    public TelaAnalise() {
        data.setOnAction(e -> carregar());
        data.setDayCellFactory(p -> new DateCell() {
            @Override
            public void updateItem(LocalDate d, boolean vazio) {
                super.updateItem(d, vazio);
                setDisable(vazio || d.isAfter(LocalDate.now()));
            }
        });
        HBox filtro = Ui.linha(10, Ui.rotulo("Dia", "rotulo-campo"), data, Ui.botaoSecundario("Hoje", () -> data.setValue(LocalDate.now())),
                Ui.botaoSecundario("Atualizar", this::carregar));

        // faturamento por hora: hoje x mesmo dia da semana passada
        grafico.setAnimated(false);
        grafico.setCategoryGap(10);
        grafico.setBarGap(2);
        grafico.setLegendVisible(true);
        grafico.setPrefHeight(300);
        eixoValor.setTickLabelFormatter(new NumberAxis.DefaultFormatter(eixoValor, "R$ ", null));
        eixoValor.setForceZeroInRange(true);
        VBox cardGrafico = Ui.card(Ui.titulo("Faturamento por hora"), subGrafico, grafico);
        HBox.setHgrow(cardGrafico, Priority.ALWAYS);
        cardGrafico.setPrefWidth(760);

        VBox cardSecoes = Ui.card(Ui.titulo("Por seção"), Ui.rotulo("Faturamento e margem bruta do dia", "subtitulo-card"), secoes);
        cardSecoes.setPrefWidth(460);
        cardSecoes.setMinWidth(420);

        abc.getColumns().addAll(List.of(
                Tabelas.numero("#", 44, i -> String.valueOf(i.posicao())),
                Tabelas.texto("Produto", 220, ItemAbcDto::produtoNome),
                Tabelas.texto("Seção", 130, ItemAbcDto::secao),
                Tabelas.numero("Faturamento", 120, i -> Formato.dinheiro(i.faturamento())),
                Tabelas.componente("Acumulado", 170, i -> barra(i.percentualAcumulado().doubleValue() / 100, 80, Formato.percentual(i.percentualAcumulado()))),
                Tabelas.componente("Classe", 70, i -> {
                    Label l = Ui.pill(i.classe().name(), "classe-" + i.classe().name());
                    l.getStyleClass().add("classe-" + i.classe().name());
                    return l;
                })));
        abc.setPrefHeight(420);
        VBox cardAbc = Ui.card(Ui.linha(10, Ui.titulo("Curva ABC · 30 dias"), Ui.espaco(), resumoAbc), abc);
        HBox.setHgrow(cardAbc, Priority.ALWAYS);

        operadores.getColumns().addAll(List.of(
                Tabelas.texto("Operador", 170, VendaOperadorDto::operador),
                Tabelas.numero("Cupons", 80, o -> String.valueOf(o.cupons())),
                Tabelas.numero("Faturamento", 120, o -> Formato.dinheiro(o.faturamento()))));
        operadores.setPrefHeight(170);
        VBox lateral = new VBox(16, Ui.card(Ui.titulo("Formas de pagamento"), formas), Ui.card(Ui.titulo("Por operador"), operadores));
        lateral.setPrefWidth(460);
        lateral.setMinWidth(420);

        fechamentos.getColumns().addAll(List.of(
                Tabelas.texto("Caixa", 70, s -> String.format("%02d", s.numeroCaixa())),
                Tabelas.texto("Operador", 170, SessaoCaixaDto::operadorNome),
                Tabelas.texto("Turno", 140, s -> Formato.hora(s.abertaEm()) + " – " + (s.fechadaEm() == null ? "aberto" : Formato.hora(s.fechadaEm()))),
                Tabelas.numero("Vendas", 80, s -> String.valueOf(s.quantidadeVendas())),
                Tabelas.numero("Total", 120, s -> Formato.dinheiro(s.totalVendas())),
                Tabelas.numero("Dinheiro esperado", 140, s -> Formato.dinheiro(s.dinheiroEsperado())),
                Tabelas.numero("Contado", 110, s -> s.dinheiroContado() == null ? "—" : Formato.dinheiro(s.dinheiroContado())),
                Tabelas.componente("Diferença", 150, s -> {
                    if (s.diferenca() == null) return Ui.pill("Em andamento", "neutro");
                    int sinal = s.diferenca().signum();
                    return Ui.pill(sinal == 0 ? "Bateu" : (sinal > 0 ? "Sobrou " : "Faltou ") + Formato.dinheiro(s.diferenca().abs()), sinal == 0 ? "ok" : "ruim");
                })));
        fechamentos.setPrefHeight(200);
        VBox cardFechamentos = Ui.card(Ui.titulo("Fechamento dos caixas"), fechamentos);

        VBox corpo = new VBox(18, filtro, numeros, new HBox(16, cardGrafico, cardSecoes), new HBox(16, cardAbc, lateral), cardFechamentos);
        corpo.setPadding(new Insets(22, 28, 28, 28));
        raiz.setContent(corpo);
        raiz.setFitToWidth(true);
    }

    @Override
    public String titulo() {
        return "Análise";
    }

    @Override
    public String subtitulo() {
        return "Desempenho da loja";
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
        LocalDate dia = data.getValue() == null ? LocalDate.now() : data.getValue();
        Tarefa.executar(() -> Api.get("/relatorios/dia?data=" + dia, ResumoDiaDto.class), this::desenharDia);
        Tarefa.executar(() -> Api.get("/relatorios/curva-abc?dias=30", CurvaAbcDto.class), c -> {
            abc.setItems(FXCollections.observableArrayList(c.itens().stream().limit(15).toList()));
            resumoAbc.setText(c.quantidadeA() + " de " + c.itens().size() + " produtos fazem 80% do faturamento");
        });
        Tarefa.executar(() -> Api.get("/caixa/sessoes?data=" + dia, new TypeReference<List<SessaoCaixaDto>>() {}), l -> fechamentos.setItems(FXCollections.observableArrayList(l)));
    }

    private void desenharDia(ResumoDiaDto r) {
        String comparacao = "vs. " + r.dataComparacao().format(DIA_SEMANA) + (r.parcial() ? " até esta hora" : "");
        numeros.getChildren().setAll(
                numero("Faturamento", Formato.dinheiro(r.faturamento()), r.faturamento(), r.faturamentoComparacao(), comparacao, true),
                numero("Cupons", String.valueOf(r.cupons()), BigDecimal.valueOf(r.cupons()), BigDecimal.valueOf(r.cuponsComparacao()), comparacao, false),
                numero("Ticket médio", Formato.dinheiro(r.ticketMedio()), r.ticketMedio(), r.ticketMedioComparacao(), comparacao, false),
                Ui.numero("Itens por cupom", Formato.numero(r.itensPorCupom(), 1), "média do dia"));
        HBox.setHgrow(numeros.getChildren().getFirst(), Priority.SOMETIMES);

        // gráfico por hora, das 7h às 21h, sempre com as mesmas colunas
        subGrafico.setText((r.parcial() ? "Hoje até agora" : Formato.data(r.data())) + " comparado com " + r.dataComparacao().format(DIA_SEMANA) + " (dia inteiro)");
        XYChart.Series<String, Number> atual = new XYChart.Series<>();
        atual.setName(r.parcial() ? "Hoje" : r.data().format(DIA_SEMANA));
        XYChart.Series<String, Number> anterior = new XYChart.Series<>();
        anterior.setName(r.dataComparacao().format(DIA_SEMANA));
        for (int h = 7; h <= 21; h++) {
            int hora = h;
            VendaHoraDto v = r.porHora().stream().filter(x -> x.hora() == hora).findFirst().orElse(new VendaHoraDto(h, BigDecimal.ZERO, 0, BigDecimal.ZERO));
            atual.getData().add(new XYChart.Data<>(h + "h", v.faturamento()));
            anterior.getData().add(new XYChart.Data<>(h + "h", v.faturamentoComparacao()));
        }
        grafico.getData().setAll(List.of(atual, anterior));
        for (int i = 0; i < atual.getData().size(); i++) {
            var a = atual.getData().get(i);
            var b = anterior.getData().get(i);
            int cupons = r.porHora().stream().filter(x -> (x.hora() + "h").equals(a.getXValue())).mapToInt(VendaHoraDto::cupons).findFirst().orElse(0);
            dica(a.getNode(), a.getXValue() + " · " + atual.getName() + "\n" + Formato.dinheiro((BigDecimal) a.getYValue()) + " em " + cupons + " cupons");
            dica(b.getNode(), b.getXValue() + " · " + anterior.getName() + "\n" + Formato.dinheiro((BigDecimal) b.getYValue()));
        }

        // seções: barra proporcional ao faturamento, margem ao lado
        secoes.getChildren().clear();
        BigDecimal maior = r.porSecao().stream().map(VendaSecaoDto::faturamento).max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
        GridPane gradeSecoes = gradeDeBarras(4);
        gradeSecoes.add(Ui.rotulo("margem", "dica"), 3, 0);
        int linha = 1;
        for (VendaSecaoDto s : r.porSecao()) {
            gradeSecoes.addRow(linha++, textoFixo(s.secao(), null), barraFluida(s.faturamento().doubleValue() / maior.doubleValue()),
                    textoFixo(Formato.dinheiro(s.faturamento()), "mono"), textoFixo(Formato.percentual(s.margemBruta()), "mono"));
        }
        secoes.getChildren().add(r.porSecao().isEmpty() ? Ui.rotulo("Sem vendas no dia.", "dica") : gradeSecoes);

        // formas de pagamento
        formas.getChildren().clear();
        BigDecimal soma = r.porForma().stream().map(VendaFormaDto::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        GridPane gradeFormas = gradeDeBarras(4);
        linha = 0;
        for (VendaFormaDto f : r.porForma()) {
            double fracao = soma.signum() == 0 ? 0 : f.total().doubleValue() / soma.doubleValue();
            String pct = soma.signum() == 0 ? "" : f.total().multiply(BigDecimal.valueOf(100)).divide(soma, 0, RoundingMode.HALF_UP) + "%";
            gradeFormas.addRow(linha++, textoFixo(f.forma().descricao(), null), barraFluida(fracao),
                    textoFixo(Formato.dinheiro(f.total()), "mono"), textoFixo(pct, "mono"));
        }
        formas.getChildren().add(r.porForma().isEmpty() ? Ui.rotulo("Sem vendas no dia.", "dica") : gradeFormas);
        operadores.setItems(FXCollections.observableArrayList(r.porOperador()));
    }

    // card de número com a variação em relação ao dia de comparação (verde subiu, vermelho caiu)
    private VBox numero(String rotulo, String valor, BigDecimal atual, BigDecimal anterior, String comparacao, boolean destaque) {
        VBox tile = Ui.numero(rotulo, valor, null, destaque ? "hero" : "");
        if (anterior != null && anterior.signum() > 0) {
            double p = atual.subtract(anterior).doubleValue() / anterior.doubleValue() * 100;
            Label delta = Ui.rotulo((p >= 0 ? "▲ " : "▼ ") + Formato.numero(BigDecimal.valueOf(Math.abs(p)), 1) + "%", p >= 0 ? "subiu" : "desceu");
            tile.getChildren().add(Ui.linha(6, delta, Ui.rotulo(comparacao, "tile-apoio")));
        } else {
            tile.getChildren().add(Ui.rotulo("sem vendas para comparar", "tile-apoio"));
        }
        return tile;
    }

    // barrinha horizontal com o valor escrito ao lado (o texto nunca vai dentro da cor)
    private static Node barra(double fracao, double largura, String texto) {
        Region cheio = new Region();
        cheio.getStyleClass().add("barra-secao");
        double w = Math.max(3, largura * Math.max(0, Math.min(1, fracao)));
        cheio.setPrefSize(w, 14);
        cheio.setMaxSize(w, 14);
        cheio.setMinSize(w, 14);
        Region trilho = new Region();
        trilho.setMinWidth(largura - w);
        Label valor = Ui.rotulo(texto, "mono");
        valor.setMinWidth(Region.USE_PREF_SIZE);
        HBox h = Ui.linha(8, new HBox(cheio, trilho), valor);
        h.setAlignment(Pos.CENTER_LEFT);
        return h;
    }

    // grade das barras: nome | barra | valor | extra. só a coluna da barra estica ou encolhe,
    // as de texto ficam do tamanho do texto, então nada passa da borda do quadro
    private static GridPane gradeDeBarras(int colunas) {
        GridPane g = new GridPane();
        g.setHgap(10);
        g.setVgap(8);
        for (int i = 0; i < colunas; i++) {
            ColumnConstraints c = new ColumnConstraints();
            if (i == 1) {
                c.setHgrow(Priority.ALWAYS);
                c.setMinWidth(40);
            } else {
                c.setMinWidth(Region.USE_PREF_SIZE);
                if (i > 1) c.setHalignment(HPos.RIGHT);
            }
            g.getColumnConstraints().add(c);
        }
        return g;
    }

    // barra que ocupa a fração da largura que a coluna tiver no momento (acompanha o tamanho da janela)
    private static Node barraFluida(double fracao) {
        double f = Math.max(0, Math.min(1, fracao));
        Region cheio = new Region();
        cheio.getStyleClass().add("barra-secao");
        cheio.setMinHeight(14);
        cheio.setMaxHeight(14);
        StackPane trilho = new StackPane(cheio);
        StackPane.setAlignment(cheio, Pos.CENTER_LEFT);
        trilho.setMinWidth(0);
        trilho.setPrefWidth(40);
        cheio.maxWidthProperty().bind(trilho.widthProperty().multiply(f).add(f > 0 ? 3 : 0));
        return trilho;
    }

    private static Label textoFixo(String texto, String classe) {
        Label l = classe == null ? Ui.rotulo(texto) : Ui.rotulo(texto, classe);
        l.setMinWidth(Region.USE_PREF_SIZE);
        return l;
    }

    private static void dica(Node no, String texto) {
        if (no == null) return;
        Tooltip t = new Tooltip(texto);
        t.setShowDelay(Duration.millis(80));
        Tooltip.install(no, t);
    }
}
