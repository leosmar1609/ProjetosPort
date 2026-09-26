package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.LoginForm;
import br.com.lojaodamari.comum.dto.LoginResposta;
import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.api.Config;
import br.com.lojaodamari.desktop.api.Sessao;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.util.Map;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.*;

// tela de entrada: à esquerda a marca, à direita o login. antes de tudo confere se o servidor responde
public class TelaLogin extends HBox {

    private final TextField login = new TextField(Config.ultimoLogin());
    private final PasswordField senha = new PasswordField();
    private final Label mensagem = Ui.rotulo("", "msg-erro");
    private final Label servidor = Ui.rotulo("conferindo servidor...", "chip");
    private final Button entrar = Ui.botao("Entrar", this::entrar);

    public TelaLogin() {
        // lado da marca
        Label nome = Ui.rotulo("LojãoDaMari", "login-lado-titulo");
        Label texto = Ui.rotulo("Caixa, estoque, compras e os números da loja no mesmo sistema.", "login-lado-texto");
        texto.setWrapText(true);
        texto.setMaxWidth(420);
        VBox marca = new VBox(10, Ui.espaco(), nome, texto, Ui.espaco());
        marca.getStyleClass().add("login-fundo");
        marca.setPadding(new Insets(48));
        marca.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(marca, Priority.ALWAYS);
        marca.setMaxWidth(Double.MAX_VALUE);

        // formulário
        login.setPromptText("seu login");
        senha.setPromptText("sua senha");
        login.setOnAction(e -> senha.requestFocus());
        senha.setOnAction(e -> entrar());
        entrar.getStyleClass().add("grande");
        entrar.setMaxWidth(Double.MAX_VALUE);
        mensagem.setWrapText(true);

        HBox titulo = new HBox(Ui.rotulo("Lojão", "marca-grande"), Ui.rotulo("DaMari", "marca-grande-acento"));
        VBox form = new VBox(10,
                titulo,
                Ui.rotulo("Entre com o login da loja", "subtitulo-card"),
                new Region(),
                Ui.rotulo("Usuário", "rotulo-campo"), login,
                Ui.rotulo("Senha", "rotulo-campo"), senha,
                mensagem, entrar,
                new Region(),
                servidor);
        form.setPadding(new Insets(36));
        form.setMaxWidth(400);
        form.setMinWidth(400);
        form.setMaxHeight(Region.USE_PREF_SIZE);
        form.getStyleClass().add("login-card");

        StackPane lado = new StackPane(form);
        lado.setPadding(new Insets(40));
        lado.setMinWidth(520);
        getChildren().addAll(marca, lado);

        conferirServidor();
        Platform.runLater(() -> (login.getText().isBlank() ? login : senha).requestFocus());
    }

    public void avisar(String texto) {
        mensagem.setText(texto);
    }

    // mostra embaixo do login se o servidor está no ar, pra ninguém ficar tentando senha à toa
    private void conferirServidor() {
        Tarefa.executar(() -> Api.get("/saude", Map.class), ok -> {
            servidor.setText("● servidor conectado · " + Config.servidor());
            servidor.getStyleClass().add("online");
        }, e -> servidor.setText("● sem servidor em " + Config.servidor()));
    }

    private void entrar() {
        if (login.getText().isBlank() || senha.getText().isEmpty()) {
            mensagem.setText("Preencha usuário e senha.");
            return;
        }
        entrar.setDisable(true);
        mensagem.setText("");
        Tarefa.executar(() -> Api.post("/auth/login", new LoginForm(login.getText().trim(), senha.getText()), LoginResposta.class), r -> {
            Sessao.iniciar(r);
            Config.lembrarLogin(r.usuario().login());
            App.entrou();
        }, e -> {
            entrar.setDisable(false);
            mensagem.setText(e.getMessage());
            senha.clear();
            senha.requestFocus();
        });
    }
}
