package br.com.lojaodamari.desktop.util;

import br.com.lojaodamari.desktop.App;
import br.com.lojaodamari.desktop.api.ApiException;
import br.com.lojaodamari.desktop.componentes.Dialogos;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import javafx.application.Platform;

// roda a chamada ao servidor fora da thread da tela (pra janela não travar) e volta pra tela com o resultado
public final class Tarefa {

    private static final ExecutorService FILA = Executors.newVirtualThreadPerTaskExecutor();

    private Tarefa() {
    }

    // erro vira caixa de mensagem
    public static <T> void executar(Callable<T> chamada, Consumer<T> sucesso) {
        executar(chamada, sucesso, Dialogos::erro);
    }

    // erro vai pra quem chamou decidir (ex: mostrar embaixo do campo). sessão expirada volta pro login sempre
    public static <T> void executar(Callable<T> chamada, Consumer<T> sucesso, Consumer<ApiException> falha) {
        FILA.submit(() -> {
            try {
                T resultado = chamada.call();
                Platform.runLater(() -> sucesso.accept(resultado));
            } catch (ApiException e) {
                Platform.runLater(() -> {
                    if (e.status() == 401 && !"login_invalido".equals(e.codigo()) && !"usuario_inativo".equals(e.codigo())) {
                        App.voltarAoLogin("Sua sessão expirou. Entre de novo.");
                    } else {
                        falha.accept(e);
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
                Platform.runLater(() -> falha.accept(new ApiException(0, "erro_app", "Erro inesperado no app: " + e.getMessage(), null)));
            }
        });
    }
}
