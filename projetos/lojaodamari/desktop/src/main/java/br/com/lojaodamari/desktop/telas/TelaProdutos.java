package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.Unidade;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Tabelas;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.StringConverter;
import tools.jackson.core.type.TypeReference;

// cadastro de produtos (preço, promoção, códigos) e de fornecedores. só a gerência entra aqui
public class TelaProdutos implements Tela {

    private final VBox raiz = new VBox(16);
    private final TextField busca = new TextField();
    private final TableView<ProdutoDto> produtos = Tabelas.nova("Nenhum produto.");
    private final TableView<FornecedorDto> fornecedores = Tabelas.nova("Nenhum fornecedor.");
    private List<ProdutoDto> todos = List.of();
    private List<SecaoDto> secoes = List.of();
    private List<FornecedorDto> listaFornecedores = List.of();

    public TelaProdutos() {
        busca.setPromptText("Buscar produto");
        busca.textProperty().addListener((o, a, n) -> filtrar());
        HBox.setHgrow(busca, Priority.ALWAYS);
        Button novo = Ui.botao("+ Novo produto", () -> editarProduto(null));
        Button editar = Ui.botaoSecundario("Editar", () -> {
            ProdutoDto p = produtos.getSelectionModel().getSelectedItem();
            if (p != null) editarProduto(p);
        });
        Button novaSecao = Ui.botaoSecundario("Nova seção", this::novaSecao);

        produtos.getColumns().addAll(List.of(
                Tabelas.texto("Produto", 240, ProdutoDto::nome),
                Tabelas.texto("Código", 140, p -> p.ean() != null ? p.ean() : "PLU " + p.plu()),
                Tabelas.texto("Seção", 130, ProdutoDto::secaoNome),
                Tabelas.texto("Fornecedor", 170, p -> p.producaoPropria() ? "Produção própria" : p.fornecedorNome() == null ? "—" : p.fornecedorNome()),
                Tabelas.texto("Un.", 50, p -> p.unidade().name().toLowerCase()),
                Tabelas.numero("Preço", 90, p -> Formato.dinheiro(p.precoVenda())),
                Tabelas.componente("Promoção", 170, p -> p.precoPromocional() == null ? Ui.rotulo("—", "dica")
                        : Ui.pill(Formato.dinheiro(p.precoPromocional()) + (p.promocaoFim() == null ? "" : " até " + Formato.diaMes(p.promocaoFim())), p.emPromocao() ? "acento" : "neutro")),
                Tabelas.numero("Custo médio", 100, p -> Formato.dinheiro(p.custoMedio())),
                Tabelas.numero("Margem", 80, p -> Formato.percentual(p.margem())),
                Tabelas.componente("Status", 90, p -> Ui.pill(p.ativo() ? "Ativo" : "Inativo", p.ativo() ? "ok" : "neutro"))));
        produtos.setRowFactory(t -> {
            TableRow<ProdutoDto> r = new TableRow<>();
            r.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !r.isEmpty()) editarProduto(r.getItem());
            });
            return r;
        });
        VBox abaProdutos = new VBox(12, Ui.linha(10, busca, novaSecao, editar, novo), Ui.card(produtos));
        VBox.setVgrow(abaProdutos.getChildren().get(1), Priority.ALWAYS);
        VBox.setVgrow(produtos, Priority.ALWAYS);
        abaProdutos.setPadding(new Insets(14, 0, 0, 0));

        fornecedores.getColumns().addAll(List.of(
                Tabelas.texto("Fornecedor", 260, FornecedorDto::nome),
                Tabelas.texto("CNPJ", 170, f -> f.cnpj() == null ? "—" : f.cnpj()),
                Tabelas.texto("Telefone", 150, f -> f.telefone() == null ? "—" : f.telefone()),
                Tabelas.texto("E-mail", 220, f -> f.email() == null ? "—" : f.email()),
                Tabelas.numero("Prazo de entrega", 130, f -> f.prazoEntregaDias() + (f.prazoEntregaDias() == 1 ? " dia" : " dias"))));
        fornecedores.setRowFactory(t -> {
            TableRow<FornecedorDto> r = new TableRow<>();
            r.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !r.isEmpty()) editarFornecedor(r.getItem());
            });
            return r;
        });
        VBox abaFornecedores = new VBox(12, Ui.linha(10, Ui.rotulo("O prazo de entrega entra na conta da sugestão de compra.", "dica"), Ui.espaco(),
                Ui.botao("+ Novo fornecedor", () -> editarFornecedor(null))), Ui.card(fornecedores));
        VBox.setVgrow(abaFornecedores.getChildren().get(1), Priority.ALWAYS);
        VBox.setVgrow(fornecedores, Priority.ALWAYS);
        abaFornecedores.setPadding(new Insets(14, 0, 0, 0));

        TabPane abas = new TabPane(new Tab("Produtos", abaProdutos), new Tab("Fornecedores", abaFornecedores));
        abas.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        VBox.setVgrow(abas, Priority.ALWAYS);
        raiz.getChildren().add(abas);
        raiz.setPadding(new Insets(14, 28, 22, 28));
    }

    @Override
    public String titulo() {
        return "Produtos";
    }

    @Override
    public String subtitulo() {
        return "Cadastro, preços, promoções e fornecedores";
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
        Tarefa.executar(() -> Api.get("/produtos", new TypeReference<List<ProdutoDto>>() {}), l -> {
            todos = l;
            filtrar();
        });
        Tarefa.executar(() -> Api.get("/secoes", new TypeReference<List<SecaoDto>>() {}), l -> secoes = l);
        Tarefa.executar(() -> Api.get("/fornecedores", new TypeReference<List<FornecedorDto>>() {}), l -> {
            listaFornecedores = l;
            fornecedores.setItems(FXCollections.observableArrayList(l));
        });
    }

    private void filtrar() {
        String t = busca.getText() == null ? "" : busca.getText().trim().toLowerCase();
        produtos.setItems(FXCollections.observableArrayList(todos.stream()
                .filter(p -> t.isEmpty() || p.nome().toLowerCase().contains(t) || (p.ean() != null && p.ean().contains(t)) || (p.plu() != null && p.plu().contains(t))).toList()));
    }

    // formulário do produto (novo quando p é nulo)
    private void editarProduto(ProdutoDto p) {
        TextField nome = new TextField(p == null ? "" : p.nome());
        TextField ean = new TextField(p == null || p.ean() == null ? "" : p.ean());
        TextField plu = new TextField(p == null || p.plu() == null ? "" : p.plu());
        ComboBox<Unidade> unidade = new ComboBox<>(FXCollections.observableArrayList(Unidade.values()));
        unidade.setValue(p == null ? Unidade.UN : p.unidade());
        unidade.setConverter(conversor(u -> u == Unidade.KG ? "Quilo (kg), pesado na balança" : "Unidade (un)", ""));
        ComboBox<SecaoDto> secao = new ComboBox<>(FXCollections.observableArrayList(secoes));
        secao.setConverter(conversor(SecaoDto::nome, "Escolha a seção"));
        secoes.stream().filter(s -> p != null && s.id().equals(p.secaoId())).findFirst().ifPresent(secao::setValue);
        ComboBox<FornecedorDto> fornecedor = new ComboBox<>(FXCollections.observableArrayList(listaFornecedores));
        fornecedor.getItems().addFirst(null);
        fornecedor.setConverter(conversor(FornecedorDto::nome, "Sem fornecedor"));
        listaFornecedores.stream().filter(f -> p != null && f.id().equals(p.fornecedorId())).findFirst().ifPresent(fornecedor::setValue);
        CheckBox propria = new CheckBox("Produção própria (padaria, rotisseria)");
        propria.setSelected(p != null && p.producaoPropria());
        TextField preco = new TextField(p == null ? "" : Formato.numero(p.precoVenda(), 2));
        TextField minimo = new TextField(p == null ? "" : Formato.numero(p.estoqueMinimo(), p.unidade() == Unidade.KG ? 3 : 0));
        TextField promo = new TextField(p == null || p.precoPromocional() == null ? "" : Formato.numero(p.precoPromocional(), 2));
        DatePicker inicio = new DatePicker(p == null ? null : p.promocaoInicio());
        DatePicker fim = new DatePicker(p == null ? null : p.promocaoFim());
        CheckBox ativo = new CheckBox("Ativo (aparece no caixa)");
        ativo.setSelected(p == null || p.ativo());
        for (Control c : List.of(nome, ean, plu, unidade, secao, fornecedor, preco, minimo, promo)) c.setPrefWidth(320);

        GridPane g = Dialogos.grade();
        int l = 0;
        g.addRow(l++, new Label("Nome"), nome);
        g.addRow(l++, new Label("EAN (código de barras)"), ean);
        g.addRow(l++, new Label("PLU (balança)"), plu);
        g.addRow(l++, new Label("Vendido por"), unidade);
        g.addRow(l++, new Label("Seção"), secao);
        g.addRow(l++, new Label("Fornecedor"), fornecedor);
        g.addRow(l++, new Label(""), propria);
        g.addRow(l++, new Label("Preço de venda (R$)"), preco);
        g.addRow(l++, new Label("Estoque mínimo"), minimo);
        g.addRow(l++, Ui.rotulo("PROMOÇÃO (OPCIONAL)", "rotulo-secao"), new Label(""));
        g.addRow(l++, new Label("Preço promocional (R$)"), promo);
        g.addRow(l++, new Label("De / até"), Ui.linha(8, inicio, fim));
        g.addRow(l, new Label(""), ativo);

        Dialogos.formulario(p == null ? "Novo produto" : "Editar produto", "O custo não é digitado aqui: ele sai das entradas de mercadoria.", g, "Salvar", () -> {
            if (secao.getValue() == null) throw new IllegalArgumentException("Escolha a seção.");
            BigDecimal precoPromo = promo.getText().isBlank() ? null : Dialogos.numeroObrigatorio(promo, "o preço promocional");
            var form = new ProdutoForm(nome.getText().trim(), vazio(ean.getText()), vazio(plu.getText()), unidade.getValue(), secao.getValue().id(),
                    fornecedor.getValue() == null ? null : fornecedor.getValue().id(), propria.isSelected(),
                    Dialogos.numeroObrigatorio(preco, "o preço"), precoPromo, inicio.getValue(), fim.getValue(),
                    Dialogos.numeroObrigatorio(minimo, "o estoque mínimo"), ativo.isSelected());
            return () -> p == null ? Api.post("/produtos", form, ProdutoDto.class) : Api.put("/produtos/" + p.id(), form, ProdutoDto.class);
        }, salvo -> carregar());
    }

    private void editarFornecedor(FornecedorDto f) {
        TextField nome = new TextField(f == null ? "" : f.nome());
        TextField cnpj = new TextField(f == null || f.cnpj() == null ? "" : f.cnpj());
        TextField telefone = new TextField(f == null || f.telefone() == null ? "" : f.telefone());
        TextField email = new TextField(f == null || f.email() == null ? "" : f.email());
        TextField prazo = new TextField(f == null ? "2" : String.valueOf(f.prazoEntregaDias()));
        for (TextField c : List.of(nome, cnpj, telefone, email, prazo)) c.setPrefWidth(320);
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Nome"), nome);
        g.addRow(1, new Label("CNPJ"), cnpj);
        g.addRow(2, new Label("Telefone"), telefone);
        g.addRow(3, new Label("E-mail"), email);
        g.addRow(4, new Label("Prazo de entrega (dias)"), prazo);
        Dialogos.formulario(f == null ? "Novo fornecedor" : "Editar fornecedor", null, g, "Salvar", () -> {
            int dias;
            try {
                dias = Integer.parseInt(prazo.getText().trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("O prazo de entrega é um número de dias.");
            }
            var form = new FornecedorForm(nome.getText().trim(), cnpj.getText(), telefone.getText(), email.getText(), dias);
            return () -> f == null ? Api.post("/fornecedores", form, FornecedorDto.class) : Api.put("/fornecedores/" + f.id(), form, FornecedorDto.class);
        }, salvo -> carregar());
    }

    private void novaSecao() {
        TextField nome = new TextField();
        nome.setPrefWidth(300);
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Nome da seção"), nome);
        Dialogos.formulario("Nova seção", "Ex: Pet shop, Congelados, Bazar.", g, "Criar seção",
                () -> () -> Api.post("/secoes", Map.of("nome", nome.getText()), SecaoDto.class), s -> carregar());
    }

    private static String vazio(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    // texto de cada opção do ComboBox. opção vazia (null) mostra o textoNulo
    private static <T> StringConverter<T> conversor(Function<T, String> texto, String textoNulo) {
        return new StringConverter<>() {
            @Override
            public String toString(T t) {
                return t == null ? textoNulo : texto.apply(t);
            }

            @Override
            public T fromString(String s) {
                return null;
            }
        };
    }
}
