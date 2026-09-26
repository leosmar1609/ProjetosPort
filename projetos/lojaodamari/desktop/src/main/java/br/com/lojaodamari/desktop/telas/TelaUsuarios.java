package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.UsuarioDto;
import br.com.lojaodamari.comum.dto.UsuarioForm;
import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Tabelas;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.StringConverter;
import tools.jackson.core.type.TypeReference;

// equipe da loja: quem entra no sistema e com qual perfil
public class TelaUsuarios implements Tela {

    private final VBox raiz = new VBox(14);
    private final TableView<UsuarioDto> tabela = Tabelas.nova("Nenhum usuário.");

    public TelaUsuarios() {
        tabela.getColumns().addAll(List.of(
                Tabelas.texto("Nome", 240, UsuarioDto::nome),
                Tabelas.texto("Login", 160, UsuarioDto::login),
                Tabelas.texto("Perfil", 180, u -> u.perfil().descricao()),
                Tabelas.componente("Status", 110, u -> Ui.pill(u.ativo() ? "Ativo" : "Desativado", u.ativo() ? "ok" : "neutro"))));
        tabela.setRowFactory(t -> {
            TableRow<UsuarioDto> r = new TableRow<>();
            r.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !r.isEmpty()) editar(r.getItem());
            });
            return r;
        });
        Label perfis = Ui.rotulo("Operador: só o caixa. Fiscal: caixa e autoriza cancelamento e sangria. Estoquista: estoque e compras. "
                + "Gerente: tudo menos usuários. Administrador: tudo.", "dica");
        perfis.setWrapText(true);
        VBox card = Ui.card(tabela);
        VBox.setVgrow(tabela, Priority.ALWAYS);
        VBox.setVgrow(card, Priority.ALWAYS);
        raiz.getChildren().addAll(Ui.linha(10, perfis, Ui.espaco(), Ui.botao("+ Novo usuário", () -> editar(null))), card);
        raiz.setPadding(new Insets(22, 28, 22, 28));
    }

    @Override
    public String titulo() {
        return "Usuários";
    }

    @Override
    public String subtitulo() {
        return "Equipe e perfis de acesso";
    }

    @Override
    public Parent conteudo() {
        return raiz;
    }

    @Override
    public void aoMostrar() {
        Tarefa.executar(() -> Api.get("/usuarios", new TypeReference<List<UsuarioDto>>() {}), l -> tabela.setItems(FXCollections.observableArrayList(l)));
    }

    private void editar(UsuarioDto u) {
        TextField nome = new TextField(u == null ? "" : u.nome());
        TextField login = new TextField(u == null ? "" : u.login());
        PasswordField senha = new PasswordField();
        senha.setPromptText(u == null ? "mínimo 6 caracteres" : "deixe vazio para manter");
        ComboBox<Perfil> perfil = new ComboBox<>(FXCollections.observableArrayList(Perfil.values()));
        perfil.setValue(u == null ? Perfil.OPERADOR : u.perfil());
        perfil.setConverter(new StringConverter<>() {
            @Override
            public String toString(Perfil p) {
                return p == null ? "" : p.descricao();
            }

            @Override
            public Perfil fromString(String s) {
                return null;
            }
        });
        CheckBox ativo = new CheckBox("Pode entrar no sistema");
        ativo.setSelected(u == null || u.ativo());
        for (Control c : List.of(nome, login, senha, perfil)) c.setPrefWidth(300);
        GridPane g = Dialogos.grade();
        g.addRow(0, new Label("Nome"), nome);
        g.addRow(1, new Label("Login"), login);
        g.addRow(2, new Label("Senha"), senha);
        g.addRow(3, new Label("Perfil"), perfil);
        g.addRow(4, new Label(""), ativo);
        Dialogos.formulario(u == null ? "Novo usuário" : "Editar " + u.nome(), "O login usa letras minúsculas, números, ponto ou _.", g, "Salvar", () -> {
            var form = new UsuarioForm(nome.getText().trim(), login.getText().trim().toLowerCase(), senha.getText().isEmpty() ? null : senha.getText(), perfil.getValue(), ativo.isSelected());
            return () -> u == null ? Api.post("/usuarios", form, UsuarioDto.class) : Api.put("/usuarios/" + u.id(), form, UsuarioDto.class);
        }, salvo -> aoMostrar());
    }
}
