package br.com.lojaodamari.desktop.componentes;

import br.com.lojaodamari.comum.enums.SituacaoEstoque;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.shape.SVGPath;

// peças de tela que se repetem: botões, títulos, cards de número, etiquetas de situação e ícones
public final class Ui {

    private Ui() {
    }

    // desenhos dos ícones (traço 24x24, mesmo estilo em todo o app)
    public static final String ICONE_CAIXA = "M3 4h18v12H3zM7 20h10M12 16v4M7 8h4M7 11h2";
    public static final String ICONE_ESTOQUE = "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8";
    public static final String ICONE_PRODUTOS = "M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 7.5h.01";
    public static final String ICONE_COMPRAS = "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z";
    public static final String ICONE_ANALISE = "M4 20V10M10 20V4M16 20v-7M22 20H2";
    public static final String ICONE_USUARIOS = "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75";
    public static final String ICONE_SAIR = "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9";
    public static final String ICONE_CODIGO = "M4 6v12M7 6v12M11 6v12M14 6v12M17 6v12M20 6v12";
    public static final String ICONE_CARRINHO = "M3 9h18M5 9v11h14V9M8 9V5h8v4M9 14h6";

    public static Node icone(String caminho, double tamanho) {
        SVGPath p = new SVGPath();
        p.setContent(caminho);
        p.getStyleClass().add("icone");
        double escala = tamanho / 24.0;
        p.setScaleX(escala);
        p.setScaleY(escala);
        StackPane s = new StackPane(p);
        s.setMinSize(tamanho, tamanho);
        s.setMaxSize(tamanho, tamanho);
        return s;
    }

    public static Button botao(String texto, Runnable acao) {
        Button b = new Button(texto);
        b.getStyleClass().add("botao");
        b.setOnAction(e -> acao.run());
        return b;
    }

    public static Button botaoSecundario(String texto, Runnable acao) {
        Button b = botao(texto, acao);
        b.getStyleClass().add("secundario");
        return b;
    }

    public static Button botaoPerigo(String texto, Runnable acao) {
        Button b = botao(texto, acao);
        b.getStyleClass().add("perigo");
        return b;
    }

    public static Label rotulo(String texto, String... classes) {
        Label l = new Label(texto);
        l.getStyleClass().addAll(classes);
        return l;
    }

    public static Label titulo(String texto) {
        return rotulo(texto, "titulo-card");
    }

    public static Region espaco() {
        Region r = new Region();
        HBox.setHgrow(r, Priority.ALWAYS);
        VBox.setVgrow(r, Priority.ALWAYS);
        return r;
    }

    // card branco com borda, o bloco básico de todas as telas
    public static VBox card(Node... filhos) {
        VBox v = new VBox(12, filhos);
        v.getStyleClass().add("card");
        v.setPadding(new Insets(16, 18, 16, 18));
        return v;
    }

    // card de número: rótulo, valor grande e uma linha de apoio embaixo
    public static VBox numero(String rotulo, String valor, String apoio, String... classes) {
        Label r = rotulo(rotulo, "tile-rotulo");
        Label v = rotulo(valor, "tile-valor");
        v.getStyleClass().addAll(classes);
        VBox box = new VBox(2, r, v);
        if (apoio != null) {
            Label a = rotulo(apoio, "tile-apoio");
            a.setWrapText(true);
            box.getChildren().add(a);
        }
        box.getStyleClass().add("card");
        box.setPadding(new Insets(14, 18, 14, 18));
        HBox.setHgrow(box, Priority.ALWAYS);
        box.setMaxWidth(Double.MAX_VALUE);
        return box;
    }

    // etiqueta colorida de estado (ok, aviso, ruim). a cor nunca vai sozinha: sempre tem o texto junto
    public static Label pill(String texto, String tipo) {
        Label l = new Label(texto);
        l.getStyleClass().addAll("pill", tipo);
        l.setMinWidth(Region.USE_PREF_SIZE);
        return l;
    }

    public static Label pill(SituacaoEstoque s) {
        String tipo = switch (s) {
            case RUPTURA, VENCE_LOGO -> "ruim";
            case ABAIXO_MINIMO, VENCENDO -> "aviso";
            case NORMAL -> "ok";
        };
        return pill(s.descricao(), tipo);
    }

    public static HBox linha(double espaco, Node... filhos) {
        HBox h = new HBox(espaco, filhos);
        h.setAlignment(Pos.CENTER_LEFT);
        return h;
    }

}
