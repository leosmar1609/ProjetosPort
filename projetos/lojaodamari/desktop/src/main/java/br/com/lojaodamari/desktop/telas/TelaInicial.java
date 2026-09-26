package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.Config;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.local.ServidorLocal;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.layout.VBox;
import javafx.scene.text.TextAlignment;

// tela de abertura: liga o servidor da loja por dentro enquanto mostra o que está acontecendo, e depois vai pro login
public class TelaInicial extends VBox {

    private final Label mensagem = Ui.rotulo("", "login-lado-texto");
    private final ProgressBar barra = new ProgressBar(ProgressBar.INDETERMINATE_PROGRESS);
    private final Button tentar = Ui.botao("Tentar de novo", this::ligar);

    public TelaInicial() {
        Label nome = Ui.rotulo("LojãoDaMari", "login-lado-titulo");
        mensagem.setWrapText(true);
        mensagem.setMaxWidth(460);
        mensagem.setTextAlignment(TextAlignment.CENTER);
        barra.setPrefWidth(320);
        tentar.setVisible(false);
        getChildren().addAll(nome, mensagem, barra, tentar);
        setSpacing(16);
        setAlignment(Pos.CENTER);
        setPadding(new Insets(48));
        getStyleClass().add("login-fundo");
        ligar();
    }

    private void ligar() {
        tentar.setVisible(false);
        barra.setVisible(true);
        mensagem.setText(Config.servidorRemoto() ? "Conectando no servidor da loja em " + Config.servidor() + "..."
                : ServidorLocal.primeiraVez() ? "Primeira vez neste computador: criando o banco e a loja de exemplo. Leva uns 30 segundos."
                : "Abrindo o banco de dados da loja...");
        // o servidor leva alguns segundos pra subir: roda fora da thread da tela pra janela não congelar
        Thread.ofVirtual().start(() -> {
            try {
                ServidorLocal.preparar();
                Platform.runLater(App::mostrarLogin);
            } catch (Exception e) {
                e.printStackTrace();
                Platform.runLater(() -> {
                    barra.setVisible(false);
                    tentar.setVisible(true);
                    mensagem.setText("Não consegui abrir o banco da loja: " + causa(e)
                            + "\nO registro completo fica em " + Config.pasta().resolve("lojaodamari.log"));
                });
            }
        });
    }

    // a mensagem que interessa costuma estar no fundo da pilha de erros do Spring
    private static String causa(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
    }
}
