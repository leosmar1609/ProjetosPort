package br.com.lojaodamari.desktop.api;

import br.com.lojaodamari.comum.dto.ErroDto;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.json.JsonMapper;

// conversa com o servidor por HTTP + JSON. toda chamada leva o token de quem está logado
public final class Api {

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private static final JsonMapper JSON = JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

    private Api() {
    }

    public static <T> T get(String caminho, Class<T> tipo) {
        return enviar(requisicao(caminho).GET(), JSON.constructType(tipo));
    }

    public static <T> T get(String caminho, TypeReference<T> tipo) {
        return enviar(requisicao(caminho).GET(), JSON.getTypeFactory().constructType(tipo));
    }

    public static <T> T post(String caminho, Object corpo, Class<T> tipo) {
        return enviar(requisicao(caminho).POST(corpo(corpo)), JSON.constructType(tipo));
    }

    public static <T> T put(String caminho, Object corpo, Class<T> tipo) {
        return enviar(requisicao(caminho).PUT(corpo(corpo)), JSON.constructType(tipo));
    }

    public static <T> T delete(String caminho, Class<T> tipo) {
        return enviar(requisicao(caminho).DELETE(), JSON.constructType(tipo));
    }

    private static HttpRequest.Builder requisicao(String caminho) {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(Config.servidor() + "/api" + caminho))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json");
        if (Sessao.token() != null) b.header("Authorization", "Bearer " + Sessao.token());
        return b;
    }

    private static HttpRequest.BodyPublisher corpo(Object corpo) {
        return HttpRequest.BodyPublishers.ofString(corpo == null ? "{}" : JSON.writeValueAsString(corpo), StandardCharsets.UTF_8);
    }

    // manda, espera e converte. erro do servidor vira ApiException com a mensagem que ele mandou
    private static <T> T enviar(HttpRequest.Builder req, JavaType tipo) {
        HttpResponse<String> resposta;
        try {
            resposta = HTTP.send(req.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new ApiException(0, "sem_conexao", "Não consegui falar com o servidor em " + Config.servidor() + ". Confira se ele está ligado e se a rede está funcionando.", null);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(0, "interrompido", "A operação foi interrompida.", null);
        }
        if (resposta.statusCode() >= 400) {
            ErroDto erro;
            try {
                erro = JSON.readValue(resposta.body(), ErroDto.class);
            } catch (RuntimeException e) {
                erro = new ErroDto(resposta.statusCode(), "erro_http", "O servidor respondeu com erro " + resposta.statusCode() + ".", null);
            }
            throw new ApiException(resposta.statusCode(), erro.codigo(), erro.mensagem(), erro.campos());
        }
        if (resposta.body() == null || resposta.body().isBlank()) return null;
        return JSON.readValue(resposta.body(), tipo);
    }
}
