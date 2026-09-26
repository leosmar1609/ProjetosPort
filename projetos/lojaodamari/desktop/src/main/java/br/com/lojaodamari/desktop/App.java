package br.com.lojaodamari.desktop;

import br.com.lojaodamari.desktop.api.Sessao;
import br.com.lojaodamari.desktop.local.ServidorLocal;
import br.com.lojaodamari.desktop.telas.JanelaPrincipal;
import br.com.lojaodamari.desktop.telas.TelaInicial;
import br.com.lojaodamari.desktop.telas.TelaLogin;
import java.util.List;
import javafx.application.Application;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.text.Font;
import javafx.stage.Stage;

// a janela do app. começa ligando o servidor da loja (tela inicial), passa pelo login e vai pra janela principal
public class App extends Application {

    public static final String CSS = App.class.getResource("app.css").toExternalForm();
    private static Stage palco;

    @Override
    public void start(Stage stage) {
        palco = stage;
        // fontes que vão junto no app: Barlow Condensed (preços e títulos) e IBM Plex Mono (códigos e cupom)
        for (String fonte : List.of("BarlowCondensed-Bold", "BarlowCondensed-ExtraBold", "IBMPlexMono-Regular", "IBMPlexMono-SemiBold")) {
            Font.loadFont(App.class.getResourceAsStream("fontes/" + fonte + ".ttf"), 14);
        }
        stage.setTitle("LojãoDaMari");
        // mesmo ícone do executável (empacotamento/lojaodamari.png)
        stage.getIcons().add(new Image(App.class.getResourceAsStream("icone.png")));
        stage.setMinWidth(1180);
        stage.setMinHeight(720);
        mostrar(new TelaInicial());
        stage.show();
    }

    // fechou a janela: desliga o servidor que o app ligou por dentro (grava tudo no banco antes) e encerra
    @Override
    public void stop() {
        ServidorLocal.parar();
        System.exit(0);
    }

    // servidor pronto: vai pro login
    public static void mostrarLogin() {
        mostrar(new TelaLogin());
    }

    public static Stage palco() {
        return palco;
    }

    // troca o conteúdo da janela inteira
    public static void mostrar(Parent raiz) {
        if (palco.getScene() == null) {
            Scene cena = new Scene(raiz, 1366, 800);
            cena.getStylesheets().add(CSS);
            palco.setScene(cena);
        } else {
            palco.getScene().setRoot(raiz);
        }
    }

    public static void entrou() {
        mostrar(new JanelaPrincipal());
        palco.setMaximized(true);
    }

    // sessão expirou ou a pessoa clicou em sair
    public static void voltarAoLogin(String aviso) {
        Sessao.encerrar();
        TelaLogin login = new TelaLogin();
        if (aviso != null) login.avisar(aviso);
        mostrar(login);
    }
}
