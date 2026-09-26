package br.com.lojaodamari.servidor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.lojaodamari.comum.enums.Perfil;
import br.com.lojaodamari.servidor.dominio.Usuario;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

// a API vista de fora: login, token, perfis e formato dos erros
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SegurancaApiTest {

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepositorio usuarios;
    @Autowired PasswordEncoder senhas;
    @Autowired JsonMapper json;

    @BeforeEach
    void preparar() {
        for (var dados : new Object[][]{{"marina", Perfil.OPERADOR}, {"paulo", Perfil.GERENTE}}) {
            Usuario u = new Usuario();
            u.setLogin((String) dados[0]);
            u.setNome((String) dados[0]);
            u.setPerfil((Perfil) dados[1]);
            u.setSenhaHash(senhas.encode("senha123"));
            u.setAtivo(true);
            u.setCriadoEm(LocalDateTime.now());
            usuarios.save(u);
        }
    }

    @Test
    void semTokenRespondeNaoAutenticado() throws Exception {
        mvc.perform(get("/api/produtos")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.codigo").value("nao_autenticado"));
    }

    @Test
    void senhaErradaNaoEntregaSeOLoginExiste() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"login\":\"marina\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.mensagem").value("Usuário ou senha incorretos."));
    }

    @Test
    void operadorNaoVeRelatorioMasGerenteVe() throws Exception {
        mvc.perform(get("/api/relatorios/dia").header("Authorization", "Bearer " + token("marina")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.codigo").value("sem_permissao"));
        mvc.perform(get("/api/relatorios/dia").header("Authorization", "Bearer " + token("paulo")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cupons").value(0));
    }

    @Test
    void validacaoDevolveOErroDeCadaCampo() throws Exception {
        mvc.perform(post("/api/caixa/abrir").header("Authorization", "Bearer " + token("marina"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"numeroCaixa\":0,\"fundoTroco\":-5}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.codigo").value("dados_invalidos"))
                .andExpect(jsonPath("$.campos.numeroCaixa").exists())
                .andExpect(jsonPath("$.campos.fundoTroco").exists());
    }

    @Test
    void jsonQuebradoViraErroClaro() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{login:"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("json_invalido"));
    }

    private String token(String login) throws Exception {
        String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"" + login + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("token").asString();
    }
}
