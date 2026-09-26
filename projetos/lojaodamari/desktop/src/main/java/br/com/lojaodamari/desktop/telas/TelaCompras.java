package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.comum.enums.StatusPedido;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.api.Sessao;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Tabelas;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import tools.jackson.core.type.TypeReference;

// o que comprar (sugestão por giro e prazo do fornecedor), os pedidos e o recebimento da mercadoria
public class TelaCompras implements Tela {

    private final VBox raiz = new VBox();
    private final VBox sugestoes = new VBox(16);
    private final TableView<PedidoCompraDto> pedidos = Tabelas.nova("Nenhum pedido de compra ainda.");
    private final boolean gerencia = Sessao.pode(Perfil.GERENTE, Perfil.ADMIN);

    public TelaCompras() {
        Label explicacao = Ui.rotulo("Entra na lista o que está abaixo do mínimo ou vai acabar antes da próxima entrega. A quantidade cobre o prazo de entrega do fornecedor "
                + "mais 7 dias de venda, pelo giro médio dos últimos 30 dias. Produção própria e produto que já está num pedido aberto ficam de fora.", "dica");
        explicacao.setWrapText(true);
        explicacao.setMaxWidth(900);
        explicacao.setMinHeight(Region.USE_PREF_SIZE);
        ScrollPane rolagem = new ScrollPane(sugestoes);
        rolagem.setFitToWidth(true);
        VBox abaSugestao = new VBox(14, explicacao, rolagem);
        VBox.setVgrow(rolagem, Priority.ALWAYS);
        abaSugestao.setPadding(new Insets(14, 0, 0, 0));

        pedidos.getColumns().addAll(List.of(
                Tabelas.texto("Pedido", 100, PedidoCompraDto::numero),
                Tabelas.texto("Fornecedor", 230, PedidoCompraDto::fornecedorNome),
                Tabelas.componente("Situação", 120, p -> Ui.pill(nomeStatus(p.status()), switch (p.status()) {
                    case RASCUNHO -> "neutro";
                    case ENVIADO -> "aviso";
                    case RECEBIDO -> "ok";
                    case CANCELADO -> "ruim";
                })),
                Tabelas.texto("Criado", 110, p -> Formato.dataHora(p.criadoEm())),
                Tabelas.texto("Previsão", 100, p -> Formato.data(p.previsaoEntrega())),
                Tabelas.numero("Itens", 60, p -> String.valueOf(p.itens().size())),
                Tabelas.numero("Total", 110, p -> Formato.dinheiro(p.total())),
                Tabelas.texto("Nota fiscal", 110, p -> p.notaFiscal() == null ? "—" : p.notaFiscal())));
        pedidos.setRowFactory(t -> {
            TableRow<PedidoCompraDto> r = new TableRow<>();
            r.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !r.isEmpty()) verItens(r.getItem());
            });
            return r;
        });
        HBox acoes = Ui.linha(10, Ui.rotulo("Selecione um pedido:", "dica"));
        if (gerencia) acoes.getChildren().add(Ui.botao("Enviar ao fornecedor", () -> comSelecionado(this::enviar)));
        acoes.getChildren().addAll(Ui.botao("Receber mercadoria", () -> comSelecionado(this::receber)), Ui.botaoSecundario("Ver itens", () -> comSelecionado(this::verItens)));
        if (gerencia) acoes.getChildren().add(Ui.botaoPerigo("Cancelar pedido", () -> comSelecionado(this::cancelar)));
        VBox cardPedidos = Ui.card(pedidos);
        VBox.setVgrow(pedidos, Priority.ALWAYS);
        VBox abaPedidos = new VBox(12, acoes, cardPedidos);
        VBox.setVgrow(cardPedidos, Priority.ALWAYS);
        abaPedidos.setPadding(new Insets(14, 0, 0, 0));

        TabPane abas = new TabPane(new Tab("Sugestão de compra", abaSugestao), new Tab("Pedidos", abaPedidos));
        abas.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        VBox.setVgrow(abas, Priority.ALWAYS);
        raiz.getChildren().add(abas);
        raiz.setPadding(new Insets(14, 28, 22, 28));
    }

    @Override
    public String titulo() {
        return "Compras";
    }

    @Override
    public String subtitulo() {
        return "Sugestão de pedido por fornecedor e recebimento";
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
        Tarefa.executar(() -> Api.get("/compras/sugestao", new TypeReference<List<SugestaoCompraDto>>() {}), this::desenharSugestoes);
        Tarefa.executar(() -> Api.get("/compras/pedidos", new TypeReference<List<PedidoCompraDto>>() {}), l -> pedidos.setItems(FXCollections.observableArrayList(l)));
    }

    // um card por fornecedor, com a tabela do que pedir e o botão que vira pedido
    private void desenharSugestoes(List<SugestaoCompraDto> lista) {
        sugestoes.getChildren().clear();
        if (lista.isEmpty()) {
            sugestoes.getChildren().add(Ui.card(Ui.titulo("Nada para comprar agora"), Ui.rotulo("Todos os produtos estão acima do mínimo e duram até a próxima entrega.", "dica")));
            return;
        }
        for (SugestaoCompraDto s : lista) {
            TableView<ItemSugestaoDto> t = Tabelas.nova("");
            t.getColumns().addAll(List.of(
                    Tabelas.texto("Produto", 240, ItemSugestaoDto::produtoNome),
                    Tabelas.numero("Estoque", 100, i -> Formato.quantidade(i.estoqueAtual().max(BigDecimal.ZERO), i.unidade())),
                    Tabelas.numero("Mínimo", 90, i -> Formato.quantidade(i.estoqueMinimo(), i.unidade())),
                    Tabelas.numero("Vende por dia", 110, i -> Formato.numero(i.giroDiario(), 1) + " " + i.unidade().name().toLowerCase()),
                    Tabelas.componente("Dura", 120, i -> {
                        if (i.coberturaDias() == null) return Ui.pill("sem giro", "neutro");
                        double dias = i.coberturaDias().doubleValue();
                        return Ui.pill(dias < 1 ? "acaba hoje" : Formato.numero(i.coberturaDias(), 1) + " dias", dias < 1 ? "ruim" : dias < s.prazoEntregaDias() + 1 ? "aviso" : "ok");
                    }),
                    Tabelas.numero("Pedir", 100, i -> Formato.quantidade(i.quantidadeSugerida(), i.unidade())),
                    Tabelas.numero("Custo estimado", 120, i -> Formato.dinheiro(i.custoEstimado()))));
            t.setItems(FXCollections.observableArrayList(s.itens()));
            t.setFixedCellSize(40);
            t.setPrefHeight(38 + 40 * s.itens().size());
            t.setMinHeight(t.getPrefHeight());
            Button gerar = Ui.botao("Gerar pedido", () -> gerarPedido(s));
            HBox cabecalho = Ui.linha(10, new VBox(2, Ui.titulo(s.fornecedorNome()),
                            Ui.rotulo(s.itens().size() + (s.itens().size() == 1 ? " produto" : " produtos") + " · entrega em " + s.prazoEntregaDias()
                                    + (s.prazoEntregaDias() == 1 ? " dia" : " dias") + " · estimado " + Formato.dinheiro(s.totalEstimado()), "subtitulo-card")),
                    Ui.espaco(), gerar);
            sugestoes.getChildren().add(Ui.card(cabecalho, t));
        }
    }

    private void gerarPedido(SugestaoCompraDto s) {
        List<ItemPedidoForm> itens = s.itens().stream().map(i -> new ItemPedidoForm(i.produtoId(), i.quantidadeSugerida(), i.custoUnitario())).toList();
        Tarefa.executar(() -> Api.post("/compras/pedidos", new PedidoCompraForm(s.fornecedorId(), itens), PedidoCompraDto.class), p -> {
            carregar();
            Dialogos.confirmar("Pedido " + p.numero() + " criado", "Ficou como rascunho, no valor de " + Formato.dinheiro(p.total()) + ". "
                    + (gerencia ? "Envie ao fornecedor na aba Pedidos." : "O gerente precisa enviar ao fornecedor."), "Entendi");
        });
    }

    private void comSelecionado(java.util.function.Consumer<PedidoCompraDto> acao) {
        PedidoCompraDto p = pedidos.getSelectionModel().getSelectedItem();
        if (p == null) Dialogos.erro("Selecione um pedido na tabela primeiro.");
        else acao.accept(p);
    }

    private void enviar(PedidoCompraDto p) {
        Tarefa.executar(() -> Api.post("/compras/pedidos/" + p.id() + "/enviar", null, PedidoCompraDto.class), r -> carregar());
    }

    private void cancelar(PedidoCompraDto p) {
        if (Dialogos.confirmar("Cancelar " + p.numero(), "O pedido de " + p.fornecedorNome() + " não vai mais ser recebido.", "Cancelar pedido")) {
            Tarefa.executar(() -> Api.post("/compras/pedidos/" + p.id() + "/cancelar", null, PedidoCompraDto.class), r -> carregar());
        }
    }

    // conferência na doca: quanto chegou de cada item, custo da nota e validade do lote
    private void receber(PedidoCompraDto p) {
        if (p.status() != StatusPedido.ENVIADO) {
            Dialogos.erro("Só dá para receber pedido enviado. Este está " + nomeStatus(p.status()).toLowerCase() + ".");
            return;
        }
        GridPane g = Dialogos.grade();
        g.addRow(0, Ui.rotulo("PRODUTO", "rotulo-secao"), Ui.rotulo("PEDIDO", "rotulo-secao"), Ui.rotulo("CHEGOU", "rotulo-secao"),
                Ui.rotulo("CUSTO (R$)", "rotulo-secao"), Ui.rotulo("VALIDADE", "rotulo-secao"));
        List<TextField> recebidos = new ArrayList<>();
        List<TextField> custos = new ArrayList<>();
        List<DatePicker> validades = new ArrayList<>();
        int linha = 1;
        for (ItemPedidoDto i : p.itens()) {
            TextField qtd = new TextField(Formato.numero(i.quantidade(), i.unidade().name().equals("KG") ? 3 : 0));
            TextField custo = new TextField(Formato.numero(i.custoUnitario(), 2));
            DatePicker validade = new DatePicker(LocalDate.now().plusDays(30));
            qtd.setPrefWidth(90);
            custo.setPrefWidth(90);
            validade.setPrefWidth(140);
            recebidos.add(qtd);
            custos.add(custo);
            validades.add(validade);
            g.addRow(linha++, Ui.rotulo(i.produtoNome()), Ui.rotulo(Formato.quantidade(i.quantidade(), i.unidade()), "dica"), qtd, custo, validade);
        }
        TextField nota = new TextField();
        nota.setPromptText("número da NF-e");
        g.addRow(linha, Ui.rotulo("Nota fiscal"), nota);
        Dialogos.formulario("Receber " + p.numero(), p.fornecedorNome() + ". Item que não veio fica com 0. Cada item recebido vira um lote no estoque.", g, "Confirmar recebimento", () -> {
            List<ItemRecebimentoForm> itens = new ArrayList<>();
            for (int k = 0; k < p.itens().size(); k++) {
                itens.add(new ItemRecebimentoForm(p.itens().get(k).produtoId(), Dialogos.numeroObrigatorio(recebidos.get(k), "a quantidade recebida"),
                        Dialogos.numeroObrigatorio(custos.get(k), "o custo"), validades.get(k).getValue()));
            }
            var form = new RecebimentoForm(nota.getText().isBlank() ? null : nota.getText().trim(), itens);
            return () -> Api.post("/compras/pedidos/" + p.id() + "/receber", form, PedidoCompraDto.class);
        }, r -> carregar());
    }

    private void verItens(PedidoCompraDto p) {
        TableView<ItemPedidoDto> t = Tabelas.nova("");
        t.getColumns().addAll(List.of(
                Tabelas.texto("Produto", 240, ItemPedidoDto::produtoNome),
                Tabelas.numero("Pedido", 100, i -> Formato.quantidade(i.quantidade(), i.unidade())),
                Tabelas.numero("Recebido", 100, i -> Formato.quantidade(i.quantidadeRecebida(), i.unidade())),
                Tabelas.numero("Custo", 90, i -> Formato.dinheiro(i.custoUnitario())),
                Tabelas.numero("Subtotal", 110, i -> Formato.dinheiro(i.subtotal()))));
        t.setItems(FXCollections.observableArrayList(p.itens()));
        t.setPrefSize(680, 320);
        VBox corpo = new VBox(t);
        corpo.setPadding(new Insets(0, 22, 8, 22));
        Dialog<Void> d = Dialogos.novo(p.numero() + " · " + p.fornecedorNome(), nomeStatus(p.status()) + " · total " + Formato.dinheiro(p.total()));
        d.getDialogPane().setContent(corpo);
        d.getDialogPane().getButtonTypes().add(new ButtonType("Fechar", ButtonBar.ButtonData.CANCEL_CLOSE));
        d.showAndWait();
    }

    private static String nomeStatus(StatusPedido s) {
        return switch (s) {
            case RASCUNHO -> "Rascunho";
            case ENVIADO -> "Enviado";
            case RECEBIDO -> "Recebido";
            case CANCELADO -> "Cancelado";
        };
    }
}
