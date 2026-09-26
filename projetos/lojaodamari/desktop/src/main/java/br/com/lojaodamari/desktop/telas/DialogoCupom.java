package br.com.lojaodamari.desktop.telas;

import br.com.lojaodamari.comum.dto.CupomDto;
import br.com.lojaodamari.comum.dto.VendaDto;
import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.Api;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import br.com.lojaodamari.desktop.util.Formato;
import br.com.lojaodamari.desktop.util.Tarefa;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.print.PrinterJob;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;

// mostra o cupom do jeito que sai na impressora térmica, com o botão de imprimir de verdade
public class DialogoCupom {

    private final Dialog<Void> dialogo;
    private final Text texto = new Text("carregando cupom...");

    public DialogoCupom(VendaDto venda) {
        String sub = venda.troco().signum() > 0 ? "Troco: " + Formato.dinheiro(venda.troco()) : "Sem troco.";
        dialogo = Dialogos.novo("Venda concluída", sub + " O estoque já foi atualizado.");
        texto.getStyleClass().add("papel-texto");
        VBox papel = new VBox(texto);
        papel.getStyleClass().add("papel");
        ScrollPane rolagem = new ScrollPane(papel);
        rolagem.setPrefViewportHeight(460);
        rolagem.setFitToWidth(true);
        VBox conteudo = new VBox(rolagem);
        conteudo.setPadding(new Insets(8, 22, 8, 22));
        dialogo.getDialogPane().setContent(conteudo);

        ButtonType imprimir = new ButtonType("Imprimir", ButtonBar.ButtonData.LEFT);
        ButtonType nova = new ButtonType("Nova venda", ButtonBar.ButtonData.OK_DONE);
        dialogo.getDialogPane().getButtonTypes().addAll(imprimir, nova);
        // imprimir não fecha o diálogo: dá pra imprimir a segunda via
        dialogo.getDialogPane().lookupButton(imprimir).addEventFilter(ActionEvent.ACTION, e -> {
            e.consume();
            imprimir();
        });

        Tarefa.executar(() -> Api.get("/vendas/" + venda.id() + "/cupom", CupomDto.class), c -> texto.setText(c.texto()));
    }

    public void mostrar() {
        dialogo.showAndWait();
    }

    // manda pra impressora escolhida no Windows (a térmica do caixa, se estiver instalada)
    private void imprimir() {
        PrinterJob job = PrinterJob.createPrinterJob();
        if (job == null) {
            Dialogos.erro("Nenhuma impressora instalada neste computador.");
            return;
        }
        if (job.showPrintDialog(App.palco())) {
            Text copia = new Text(texto.getText());
            copia.setStyle("-fx-font-family: 'IBM Plex Mono'; -fx-font-size: 9px;");
            if (job.printPage(copia)) job.endJob();
            else Dialogos.erro("A impressora não aceitou o cupom. Confira se ela está ligada e com papel.");
        }
    }
}
