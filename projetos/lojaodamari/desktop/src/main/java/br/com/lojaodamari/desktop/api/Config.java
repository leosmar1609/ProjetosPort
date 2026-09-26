package br.com.lojaodamari.desktop.api;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

// configuração deste computador: endereço do servidor e número do caixa.
// fica em ~/.lojaodamari/desktop.properties, assim cada máquina do mercado lembra que caixa ela é
public final class Config {

    private static final Path PASTA = Path.of(System.getProperty("user.home"), ".lojaodamari");
    private static final Path ARQUIVO = PASTA.resolve("desktop.properties");
    private static final Properties PROPS = new Properties();
    // endereço do servidor que o app ligou por dentro (definido na partida)
    private static String servidorLocal;

    static {
        if (Files.exists(ARQUIVO)) {
            try (Reader r = Files.newBufferedReader(ARQUIVO)) {
                PROPS.load(r);
            } catch (IOException e) {
                System.err.println("não consegui ler " + ARQUIVO + ": " + e.getMessage());
            }
        }
    }

    private Config() {
    }

    // endereço do servidor: o de outra máquina (se configurado) ou o que o app ligou aqui dentro.
    // -Dlojao.servidor=... na linha de comando ganha do arquivo
    public static String servidor() {
        String valor = System.getProperty("lojao.servidor", PROPS.getProperty("servidor"));
        if (valor == null || valor.isBlank()) valor = servidorLocal != null ? servidorLocal : "http://localhost:8080";
        return valor.endsWith("/") ? valor.substring(0, valor.length() - 1) : valor.trim();
    }

    // com "servidor=http://ip:8080" no arquivo, este computador é só um caixa: não liga servidor próprio
    public static boolean servidorRemoto() {
        String valor = System.getProperty("lojao.servidor", PROPS.getProperty("servidor"));
        return valor != null && !valor.isBlank();
    }

    public static void definirServidor(String url) {
        servidorLocal = url;
    }

    // pasta dos dados e configurações deste computador (~/.lojaodamari)
    public static Path pasta() {
        return PASTA;
    }

    public static int numeroCaixa() {
        try {
            return Integer.parseInt(PROPS.getProperty("caixa", "1"));
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    public static String ultimoLogin() {
        return PROPS.getProperty("ultimoLogin", "");
    }

    public static void lembrarCaixa(int numero) {
        salvar("caixa", String.valueOf(numero));
    }

    public static void lembrarLogin(String login) {
        salvar("ultimoLogin", login);
    }

    private static void salvar(String chave, String valor) {
        PROPS.setProperty(chave, valor);
        try {
            Files.createDirectories(ARQUIVO.getParent());
            try (Writer w = Files.newBufferedWriter(ARQUIVO)) {
                PROPS.store(w, "LojãoDaMari - configuração deste computador");
            }
        } catch (IOException e) {
            System.err.println("não consegui salvar " + ARQUIVO + ": " + e.getMessage());
        }
    }
}
