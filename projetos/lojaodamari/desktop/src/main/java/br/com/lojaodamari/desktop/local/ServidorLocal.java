package br.com.lojaodamari.desktop.local;

import br.com.lojaodamari.desktop.api.Config;
import br.com.lojaodamari.servidor.LojaoServidor;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.ServerSocket;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

// liga o servidor da loja dentro do próprio app, assim o usuário abre um programa só.
// se este computador for só um caixa ligado num servidor de outra máquina, nada disso roda
public final class ServidorLocal {

    private static final int PORTA_PADRAO = 8080;
    private static ConfigurableApplicationContext contexto;

    private ServidorLocal() {
    }

    // o que aconteceu na partida, pra tela inicial explicar
    public enum Situacao { REMOTO, JA_RODANDO, LIGADO }

    // decide o modo e, se precisar, liga o servidor. demora uns segundos (e mais na primeira vez, que cria a loja de exemplo)
    public static Situacao preparar() throws Exception {
        if (Config.servidorRemoto()) return Situacao.REMOTO;
        String local = "http://localhost:" + PORTA_PADRAO;
        // já tem um servidor da loja aqui (outro app aberto ou o servidor avulso): usa ele
        if (respondendo(local)) {
            Config.definirServidor(local);
            return Situacao.JA_RODANDO;
        }
        int porta = portaLivre(PORTA_PADRAO) ? PORTA_PADRAO : 0;
        Path pasta = Config.pasta();
        Files.createDirectories(pasta.resolve("dados"));
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));

        SpringApplication app = new SpringApplication(LojaoServidor.class);
        app.setRegisterShutdownHook(false);
        // parâmetros de linha de comando: perfil local, pasta dos dados e porta. o servidor.properties da pasta
        // de dados pode sobrescrever o banco (pra quem quiser MySQL)
        contexto = app.run(
                "--spring.profiles.active=local",
                "--lojao.pasta=" + pasta.toString().replace('\\', '/'),
                "--server.port=" + porta,
                "--spring.config.additional-location=optional:file:" + pasta.resolve("servidor.properties").toString().replace('\\', '/'));
        String portaReal = contexto.getEnvironment().getProperty("local.server.port", String.valueOf(PORTA_PADRAO));
        Config.definirServidor("http://localhost:" + portaReal);
        return Situacao.LIGADO;
    }

    // primeira vez neste computador? (a tela inicial avisa que vai demorar um pouco mais)
    public static boolean primeiraVez() {
        return !Config.servidorRemoto() && !Files.exists(Config.pasta().resolve("dados").resolve("lojaodamari.mv.db"));
    }

    // chamado ao fechar o app: desliga o servidor com calma (termina as gravações no banco)
    public static void parar() {
        if (contexto != null) {
            contexto.close();
            contexto = null;
        }
    }

    public static boolean ligadoAqui() {
        return contexto != null;
    }

    private static boolean portaLivre(int porta) {
        try (ServerSocket s = new ServerSocket(porta)) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private static boolean respondendo(String base) {
        try {
            HttpURLConnection c = (HttpURLConnection) URI.create(base + "/api/saude").toURL().openConnection();
            c.setConnectTimeout(800);
            c.setReadTimeout(800);
            return c.getResponseCode() == 200;
        } catch (IOException e) {
            return false;
        }
    }
}
