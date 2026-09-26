package br.com.lojaodamari.desktop;

import javafx.application.Application;

// ponto de entrada do app. fica separado da classe Application porque, rodando fora do sistema de módulos,
// o Java só aceita abrir o JavaFX se o main não estiver na própria classe que estende Application
public final class Iniciar {

    public static void main(String[] args) {
        Application.launch(App.class, args);
    }
}
