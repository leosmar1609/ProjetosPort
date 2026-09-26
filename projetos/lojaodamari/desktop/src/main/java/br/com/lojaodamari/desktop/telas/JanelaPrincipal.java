package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.Config;
import br.com.lojaodamari.desktop.api.Sessao;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Ui;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Supplier;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.*;
import javafx.util.Duration;

// janela depois do login: menu à esquerda (só o que o perfil pode usar), topo com título e relógio, tela no meio
public class JanelaPrincipal extends BorderPane {

    private record Item(String nome, String icone, Supplier<Tela> criar, Perfil... perfis) {
    }

    private final Map<String, Tela> abertas = new LinkedHashMap<>();
    private final List<Button> botoes = new ArrayList<>();
    private final Label titulo = Ui.rotulo("", "topo-titulo");
    private final Label subtitulo = Ui.rotulo("", "topo-sub");
    private final Label relogio = Ui.rotulo("", "chip");
    private final VBox centro = new VBox();
    private Tela atual;

    public JanelaPrincipal() {
        List<Item> itens = List.of(
                new Item("Caixa", Ui.ICONE_CAIXA, TelaCaixa::new, Perfil.OPERADOR, Perfil.FISCAL, Perfil.GERENTE, Perfil.ADMIN),
                new Item("Estoque", Ui.ICONE_ESTOQUE, TelaEstoque::new, Perfil.ESTOQUISTA, Perfil.FISCAL, Perfil.GERENTE, Perfil.ADMIN),
                new Item("Produtos", Ui.ICONE_PRODUTOS, TelaProdutos::new, Perfil.GERENTE, Perfil.ADMIN),
                new Item("Compras", Ui.ICONE_COMPRAS, TelaCompras::new, Perfil.ESTOQUISTA, Perfil.GERENTE, Perfil.ADMIN),
                new Item("Análise", Ui.ICONE_ANALISE, TelaAnalise::new, Perfil.GERENTE, Perfil.ADMIN),
                new Item("Usuários", Ui.ICONE_USUARIOS, TelaUsuarios::new, Perfil.ADMIN));

        // menu lateral
        StackPane selo = new StackPane(Ui.icone(Ui.ICONE_CARRINHO, 20));
        selo.getStyleClass().add("selo-marca");
        selo.setMinSize(36, 36);
        selo.setMaxSize(36, 36);
        HBox marca = Ui.linha(10, selo, new HBox(Ui.rotulo("Lojão", "marca"), Ui.rotulo("DaMari", "marca-acento")));
        VBox menu = new VBox(4);
        List<Item> permitidos = itens.stream().filter(i -> Sessao.pode(i.perfis())).toList();
        for (Item i : permitidos) {
            Button b = new Button(i.nome(), Ui.icone(i.icone(), 20));
            b.getStyleClass().add("menu-item");
            b.setMaxWidth(Double.MAX_VALUE);
            b.setOnAction(e -> abrir(i));
            botoes.add(b);
            menu.getChildren().add(b);
        }
        Label nome = Ui.rotulo(Sessao.usuario().nome(), "rodape-nome");
        Label perfil = Ui.rotulo(Sessao.usuario().perfil().descricao(), "rodape-lateral");
        Button sair = new Button("Sair", Ui.icone(Ui.ICONE_SAIR, 18));
        sair.getStyleClass().add("menu-item");
        sair.setMaxWidth(Double.MAX_VALUE);
        sair.setOnAction(e -> {
            if (Dialogos.confirmar("Sair do sistema", "Quem entrar depois vai precisar do próprio login.", "Sair")) App.voltarAoLogin(null);
        });
        VBox lateral = new VBox(22, marca, menu, Ui.espaco(), new VBox(2, nome, perfil), sair);
        lateral.getStyleClass().add("lateral");
        lateral.setPadding(new Insets(20, 14, 16, 14));
        lateral.setPrefWidth(224);
        setLeft(lateral);

        // topo
        Label servidor = Ui.rotulo("● " + Config.servidor().replace("http://", ""), "chip", "online");
        HBox topo = new HBox(16, new VBox(0, titulo, subtitulo), Ui.espaco(), servidor, relogio);
        topo.setAlignment(Pos.CENTER_LEFT);
        topo.getStyleClass().add("topo");
        topo.setPadding(new Insets(14, 28, 14, 28));
        centro.getChildren().add(topo);
        setCenter(centro);

        atualizarRelogio();
        Timeline t = new Timeline(new KeyFrame(Duration.seconds(20), e -> atualizarRelogio()));
        t.setCycleCount(Timeline.INDEFINITE);
        t.play();

        // atalhos de teclado vão pra tela aberta (o caixa usa F2, F4, F8, F10...)
        addEventFilter(KeyEvent.KEY_PRESSED, e -> {
            if (atual != null) atual.tecla(e);
        });

        if (!permitidos.isEmpty()) abrir(permitidos.getFirst());
    }

    // abre uma tela do menu. a tela é criada uma vez e reaproveitada (o caixa não perde a venda ao trocar de tela)
    private void abrir(Item item) {
        Tela t = abertas.computeIfAbsent(item.nome(), n -> item.criar().get());
        atual = t;
        for (Button b : botoes) {
            b.getStyleClass().remove("ativo");
            if (b.getText().equals(item.nome())) b.getStyleClass().add("ativo");
        }
        titulo.setText(t.titulo());
        subtitulo.setText(t.subtitulo());
        Parent conteudo = t.conteudo();
        VBox.setVgrow(conteudo, Priority.ALWAYS);
        if (centro.getChildren().size() > 1) centro.getChildren().set(1, conteudo);
        else centro.getChildren().add(conteudo);
        t.aoMostrar();
    }

    // a tela pode trocar o próprio título (ex: "Caixa 03")
    public void atualizarTitulo() {
        if (atual != null) {
            titulo.setText(atual.titulo());
            subtitulo.setText(atual.subtitulo());
        }
    }

    private void atualizarRelogio() {
        relogio.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("EEE, dd/MM · HH:mm", Locale.of("pt", "BR"))));
    }
}
