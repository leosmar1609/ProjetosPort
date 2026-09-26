package br.com.lojaodamari.servidor;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// ponto de partida do servidor
@SpringBootApplication
public class LojaoServidor {

    public static void main(String[] args) {
        // a loja trabalha no horário de Brasília, independente de onde o servidor estiver rodando
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
        SpringApplication.run(LojaoServidor.class, args);
    }
}
