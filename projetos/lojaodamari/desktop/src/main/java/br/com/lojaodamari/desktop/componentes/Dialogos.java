package br.com.lojaodamari.desktop.componentes;

import br.com.lojaodamari.comum.dto.AutorizacaoForm;
import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.ApiException;
import br.com.lojaodamari.desktop.util.Formato;
import java.math.BigDecimal;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.stage.Modality;

// caixas de diálogo do app: erro, confirmação, senha do fiscal e pedir um valor
public final class Dialogos {

    private Dialogos() {
    }

    // prepara qualquer Dialog com o visual do app e a janela principal como dona
    public static <T> Dialog<T> novo(String titulo, String subtitulo) {
        Dialog<T> d = new Dialog<>();
        d.initOwner(App.palco());
        d.initModality(Modality.WINDOW_MODAL);
        d.setTitle(titulo);
        d.setHeaderText(null);
        d.getDialogPane().getStylesheets().add(App.CSS);
        d.getDialogPane().getStyleClass().add("dialogo");
        Label t = Ui.rotulo(titulo, "dialogo-titulo");
        VBox cabecalho = new VBox(4, t);
        if (subtitulo != null) {
            Label s = Ui.rotulo(subtitulo, "dialogo-sub");
            s.setWrapText(true);
            cabecalho.getChildren().add(s);
        }
        cabecalho.setPadding(new Insets(20, 22, 4, 22));
        d.getDialogPane().setHeader(cabecalho);
        return d;
    }

    public static void erro(ApiException e) {
        erro(e.getMessage());
    }

    public static void erro(String mensagem) {
        Dialog<Void> d = novo("Não deu certo", null);
        Label l = new Label(mensagem);
        l.setWrapText(true);
        l.setMaxWidth(420);
        d.getDialogPane().setContent(padding(l));
        d.getDialogPane().getButtonTypes().add(new ButtonType("Entendi", ButtonBar.ButtonData.OK_DONE));
        d.showAndWait();
    }

    public static boolean confirmar(String titulo, String mensagem, String textoBotao) {
        Dialog<ButtonType> d = novo(titulo, mensagem);
        ButtonType sim = new ButtonType(textoBotao, ButtonBar.ButtonData.OK_DONE);
        d.getDialogPane().getButtonTypes().addAll(new ButtonType("Voltar", ButtonBar.ButtonData.CANCEL_CLOSE), sim);
        return d.showAndWait().filter(b -> b == sim).isPresent();
    }

    // o fiscal digita login e senha no caixa. volta vazio se a pessoa desistir
    public static Optional<AutorizacaoForm> autorizacao(String operacao, String detalhe) {
        Dialog<AutorizacaoForm> d = novo(operacao, detalhe + "\nChame o fiscal de caixa para autorizar.");
        TextField login = new TextField();
        login.setPromptText("login do fiscal");
        PasswordField senha = new PasswordField();
        senha.setPromptText("senha");
        GridPane g = grade();
        g.addRow(0, new Label("Fiscal"), login);
        g.addRow(1, new Label("Senha"), senha);
        d.getDialogPane().setContent(g);
        ButtonType ok = new ButtonType("Autorizar", ButtonBar.ButtonData.OK_DONE);
        d.getDialogPane().getButtonTypes().addAll(new ButtonType("Voltar", ButtonBar.ButtonData.CANCEL_CLOSE), ok);
        Node botao = d.getDialogPane().lookupButton(ok);
        botao.disableProperty().bind(login.textProperty().isEmpty().or(senha.textProperty().isEmpty()));
        d.setResultConverter(b -> b == ok ? new AutorizacaoForm(login.getText().trim(), senha.getText()) : null);
        Platform.runLater(login::requestFocus);
        return d.showAndWait();
    }

    // pede um número (dinheiro, peso, quantidade). o validador devolve a mensagem de erro ou null se estiver ok
    public static Optional<BigDecimal> pedirNumero(String titulo, String subtitulo, String rotulo, String inicial, Function<BigDecimal, String> validador) {
        Dialog<BigDecimal> d = novo(titulo, subtitulo);
        TextField campo = new TextField(inicial);
        campo.getStyleClass().add("campo-grande");
        Label erro = Ui.rotulo("", "erro-campo");
        VBox box = new VBox(8, Ui.rotulo(rotulo, "rotulo-campo"), campo, erro);
        box.setPadding(new Insets(8, 22, 8, 22));
        box.setMinWidth(380);
        d.getDialogPane().setContent(box);
        ButtonType ok = new ButtonType("Confirmar", ButtonBar.ButtonData.OK_DONE);
        d.getDialogPane().getButtonTypes().addAll(new ButtonType("Voltar", ButtonBar.ButtonData.CANCEL_CLOSE), ok);
        Button botao = (Button) d.getDialogPane().lookupButton(ok);
        botao.addEventFilter(javafx.event.ActionEvent.ACTION, ev -> {
            BigDecimal v = Formato.lerNumero(campo.getText());
            String problema = v == null ? "Digite um número. Use vírgula para os centavos." : validador.apply(v);
            if (problema != null) {
                erro.setText(problema);
                ev.consume();
            }
        });
        d.setResultConverter(b -> b == ok ? Formato.lerNumero(campo.getText()) : null);
        Platform.runLater(() -> {
            campo.requestFocus();
            campo.selectAll();
        });
        return d.showAndWait();
    }

    // formulário padrão: "preparar" confere os campos (lança IllegalArgumentException com a mensagem se algo estiver errado)
    // e devolve a chamada ao servidor. o diálogo só fecha quando o servidor aceitar; se recusar, a mensagem aparece embaixo
    public static <T> void formulario(String titulo, String subtitulo, Node conteudo, String textoBotao,
                                      Supplier<Callable<T>> preparar, Consumer<T> sucesso) {
        Dialog<Void> d = novo(titulo, subtitulo);
        Label erro = Ui.rotulo("", "erro-campo");
        erro.setWrapText(true);
        erro.setMaxWidth(520);
        VBox corpo = new VBox(6, conteudo, erro);
        corpo.setPadding(new Insets(0, 0, 4, 0));
        d.getDialogPane().setContent(corpo);
        ButtonType ok = new ButtonType(textoBotao, ButtonBar.ButtonData.OK_DONE);
        d.getDialogPane().getButtonTypes().addAll(new ButtonType("Voltar", ButtonBar.ButtonData.CANCEL_CLOSE), ok);
        Button botao = (Button) d.getDialogPane().lookupButton(ok);
        botao.addEventFilter(javafx.event.ActionEvent.ACTION, ev -> {
            ev.consume();
            Callable<T> chamada;
            try {
                chamada = preparar.get();
            } catch (IllegalArgumentException e) {
                erro.setPadding(new Insets(0, 22, 0, 22));
                erro.setText(e.getMessage());
                return;
            }
            botao.setDisable(true);
            Tarefa.executar(chamada, r -> {
                d.close();
                sucesso.accept(r);
            }, e -> {
                botao.setDisable(false);
                erro.setPadding(new Insets(0, 22, 0, 22));
                erro.setText(e.getMessage());
            });
        });
        d.showAndWait();
    }

    // lê um campo numérico obrigatório dentro do "preparar" do formulário
    public static BigDecimal numeroObrigatorio(TextField campo, String nome) {
        BigDecimal v = Formato.lerNumero(campo.getText());
        if (v == null) throw new IllegalArgumentException("Preencha " + nome + " com um número (vírgula para os centavos).");
        return v;
    }

    public static GridPane grade() {
        GridPane g = new GridPane();
        g.setHgap(12);
        g.setVgap(10);
        g.setPadding(new Insets(8, 22, 8, 22));
        return g;
    }

    private static Node padding(Node n) {
        VBox v = new VBox(n);
        v.setPadding(new Insets(8, 22, 8, 22));
        return v;
    }
}
