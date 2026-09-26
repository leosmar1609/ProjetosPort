package br.com.lojaodamari.desktop.componentes;

import java.util.function.Function;
import javafx.beans.property.ReadOnlyObjectWrapper;
import javafx.scene.Node;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;

// atalhos pra montar colunas de tabela sem repetir a mesma fábrica de célula em toda tela
public final class Tabelas {

    private Tabelas() {
    }

    // coluna de texto
    public static <T> TableColumn<T, String> texto(String titulo, double largura, Function<T, String> valor) {
        TableColumn<T, String> c = new TableColumn<>(titulo);
        c.setCellValueFactory(d -> new ReadOnlyObjectWrapper<>(valor.apply(d.getValue())));
        c.setPrefWidth(largura);
        return c;
    }

    // coluna de número alinhada à direita
    public static <T> TableColumn<T, String> numero(String titulo, double largura, Function<T, String> valor) {
        TableColumn<T, String> c = texto(titulo, largura, valor);
        c.getStyleClass().add("direita");
        return c;
    }

    // coluna que desenha um componente (etiqueta, barra, duas linhas de texto)
    public static <T> TableColumn<T, T> componente(String titulo, double largura, Function<T, Node> desenho) {
        TableColumn<T, T> c = new TableColumn<>(titulo);
        c.setCellValueFactory(d -> new ReadOnlyObjectWrapper<>(d.getValue()));
        c.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(T item, boolean vazio) {
                super.updateItem(item, vazio);
                setText(null);
                setGraphic(vazio || item == null ? null : desenho.apply(item));
            }
        });
        c.setPrefWidth(largura);
        c.setSortable(false);
        return c;
    }

    public static <T> TableView<T> nova(String vazio) {
        TableView<T> t = new TableView<>();
        t.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        t.setPlaceholder(Ui.rotulo(vazio, "dica"));
        return t;
    }
}
