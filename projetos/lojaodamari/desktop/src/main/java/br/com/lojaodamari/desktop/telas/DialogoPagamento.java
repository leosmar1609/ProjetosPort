package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.FinalizarVendaForm;
import br.com.lojaodamari.comum.dto.PagamentoDto;
import br.com.lojaodamari.comum.dto.PagamentoForm;
import br.com.lojaodamari.comum.dto.VendaDto;
import br.com.lojaodamari.comum.enums.FormaPagamento;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.componentes.Ui;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import java.math.BigDecimal;
import java.util.Optional;
import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.layout.*;

// tela de receber: dá pra dividir entre várias formas. só dinheiro passa do total, e aí aparece o troco
public class DialogoPagamento {

    private final Dialog<VendaDto> dialogo;
    private final ToggleGroup formas = new ToggleGroup();
    private final TextField valor = new TextField();
    private final TextField cpf = new TextField();
    private final VBox lancados = new VBox(4);
    private final Label falta = Ui.rotulo("", "valor-grande");
    private final Label troco = Ui.rotulo("", "valor-grande");
    private final Label erro = Ui.rotulo("", "erro-campo");
    private final Button concluir;
    private VendaDto venda;
    private VendaDto concluida;

    public DialogoPagamento(VendaDto venda) {
        this.venda = venda;
        dialogo = Dialogos.novo("Pagamento", "Total da venda: " + Formato.dinheiro(venda.total()));

        // formas de pagamento
        FlowPane botoes = new FlowPane(8, 8);
        for (FormaPagamento f : FormaPagamento.values()) {
            ToggleButton b = new ToggleButton(f.descricao());
            b.getStyleClass().setAll("toggle-button", "forma-pagamento");
            b.setUserData(f);
            b.setToggleGroup(formas);
            b.setPrefWidth(150);
            if (f == FormaPagamento.DINHEIRO) b.setSelected(true);
            botoes.getChildren().add(b);
        }
        // não deixa ficar sem forma escolhida
        formas.selectedToggleProperty().addListener((o, antes, agora) -> {
            if (agora == null) antes.setSelected(true);
            else Platform.runLater(() -> {
                valor.requestFocus();
                valor.selectAll();
            });
        });

        valor.getStyleClass().add("campo-grande");
        valor.setOnAction(e -> lancar());
        Button lancar = Ui.botaoSecundario("Lançar", this::lancar);
        HBox.setHgrow(valor, Priority.ALWAYS);
        HBox linhaValor = Ui.linha(8, valor, lancar);

        Hyperlink limpar = new Hyperlink("Desfazer pagamentos lançados");
        limpar.setOnAction(e -> Tarefa.executar(() -> Api.delete("/vendas/" + this.venda.id() + "/pagamentos", VendaDto.class), this::atualizar));

        VBox resumoFalta = new VBox(0, Ui.rotulo("Falta pagar", "dica"), falta);
        VBox resumoTroco = new VBox(0, Ui.rotulo("Troco", "dica"), troco);
        resumoFalta.getStyleClass().add("resumo-pagamento");
        resumoTroco.getStyleClass().add("resumo-pagamento");
        HBox.setHgrow(resumoFalta, Priority.ALWAYS);
        HBox.setHgrow(resumoTroco, Priority.ALWAYS);
        resumoFalta.setMaxWidth(Double.MAX_VALUE);
        resumoTroco.setMaxWidth(Double.MAX_VALUE);
        troco.setStyle("-fx-text-fill: -cor-ok;");

        cpf.setPromptText("000.000.000-00");
        cpf.textProperty().addListener((o, a, n) -> {
            String m = Formato.mascaraCpf(n);
            if (!m.equals(n)) Platform.runLater(() -> {
                cpf.setText(m);
                cpf.positionCaret(m.length());
            });
        });

        VBox conteudo = new VBox(12,
                Ui.rotulo("Forma de pagamento", "rotulo-campo"), botoes,
                Ui.rotulo("Valor", "rotulo-campo"), linhaValor,
                lancados, limpar,
                new HBox(10, resumoFalta, resumoTroco),
                Ui.rotulo("CPF na nota (opcional)", "rotulo-campo"), cpf,
                erro);
        conteudo.setPadding(new Insets(8, 22, 8, 22));
        conteudo.setPrefWidth(560);
        erro.setWrapText(true);
        dialogo.getDialogPane().setContent(conteudo);

        ButtonType tipoConcluir = new ButtonType("Concluir venda", ButtonBar.ButtonData.OK_DONE);
        dialogo.getDialogPane().getButtonTypes().addAll(new ButtonType("Voltar ao cupom", ButtonBar.ButtonData.CANCEL_CLOSE), tipoConcluir);
        concluir = (Button) dialogo.getDialogPane().lookupButton(tipoConcluir);
        // concluir chama o servidor: seguro o fechamento do diálogo até a resposta voltar
        concluir.addEventFilter(ActionEvent.ACTION, e -> {
            e.consume();
            finalizar();
        });
        dialogo.setResultConverter(b -> concluida);
        atualizar(venda);
        Platform.runLater(() -> {
            valor.requestFocus();
            valor.selectAll();
        });
    }

    public Optional<VendaDto> mostrar() {
        return dialogo.showAndWait();
    }

    private FormaPagamento formaEscolhida() {
        return (FormaPagamento) formas.getSelectedToggle().getUserData();
    }

    private void lancar() {
        BigDecimal v = Formato.lerNumero(valor.getText());
        if (v == null || v.signum() <= 0) {
            erro.setText("Digite o valor recebido. Use vírgula para os centavos.");
            return;
        }
        erro.setText("");
        Tarefa.executar(() -> Api.post("/vendas/" + venda.id() + "/pagamentos", new PagamentoForm(formaEscolhida(), v), VendaDto.class),
                this::atualizar, e -> erro.setText(e.getMessage()));
    }

    private void finalizar() {
        erro.setText("");
        concluir.setDisable(true);
        String documento = cpf.getText().isBlank() ? null : cpf.getText();
        Tarefa.executar(() -> Api.post("/vendas/" + venda.id() + "/finalizar", new FinalizarVendaForm(documento), VendaDto.class), v -> {
            concluida = v;
            dialogo.setResult(v);
            dialogo.close();
        }, e -> {
            concluir.setDisable(false);
            erro.setText(e.getMessage());
        });
    }

    // redesenha com o que o servidor devolveu: lista de pagamentos, quanto falta e troco
    private void atualizar(VendaDto v) {
        venda = v;
        lancados.getChildren().clear();
        for (PagamentoDto p : v.pagamentos()) {
            HBox linha = Ui.linha(10, Ui.rotulo(p.forma().descricao()), Ui.espaco(), Ui.rotulo(Formato.dinheiro(p.valor()), "mono"));
            linha.setStyle("-fx-border-color: transparent transparent -cor-linha transparent; -fx-border-style: dashed; -fx-padding: 4 0;");
            lancados.getChildren().add(linha);
        }
        falta.setText(Formato.dinheiro(v.faltaPagar()));
        troco.setText(Formato.dinheiro(v.troco()));
        concluir.setDisable(v.faltaPagar().signum() > 0);
        valor.setText(v.faltaPagar().signum() > 0 ? Formato.numero(v.faltaPagar(), 2) : "");
        if (v.faltaPagar().signum() == 0) Platform.runLater(concluir::requestFocus);
    }
}
