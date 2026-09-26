package br.com.lojaodamari.desktop.telas;

import javafx.scene.Parent;
import javafx.scene.input.KeyEvent;

// o que toda tela do menu tem que ter. a janela principal cuida do resto (menu, topo, atalhos)
public interface Tela {

    String titulo();

    String subtitulo();

    Parent conteudo();

    // chamado toda vez que a tela aparece: bom lugar pra recarregar os dados
    default void aoMostrar() {
    }

    // teclas de atalho (F2, F10...) chegam aqui enquanto a tela está aberta
    default void tecla(KeyEvent e) {
    }
}
