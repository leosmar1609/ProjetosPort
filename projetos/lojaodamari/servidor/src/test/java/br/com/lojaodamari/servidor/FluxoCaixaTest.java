package br.com.lojaodamari.servidor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.*;
import br.com.lojaodamari.servidor.dominio.Usuario;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import br.com.lojaodamari.servidor.servico.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

// o caixa de ponta a ponta, com banco H2 de verdade: abrir, passar itens, cancelar, pagar, finalizar e conferir o estoque
@SpringBootTest
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class FluxoCaixaTest {

    @Autowired AcessoServico acesso;
    @Autowired CatalogoServico catalogo;
    @Autowired EstoqueServico estoque;
    @Autowired CaixaServico caixa;
    @Autowired VendaServico vendas;
    @Autowired UsuarioRepositorio usuarios;
    @Autowired PasswordEncoder senhas;

    UsuarioLogado operador;
    UsuarioLogado estoquista;
    ProdutoDto arroz;
    ProdutoDto carne;
    final AutorizacaoForm fiscal = new AutorizacaoForm("carlos", "fiscal123");

    // loja mínima: operador, fiscal, estoquista, um produto por unidade e um por peso, com dois lotes de arroz
    @BeforeEach
    void preparar() {
        operador = logado(usuario("marina", Perfil.OPERADOR, "caixa123"));
        usuario("carlos", Perfil.FISCAL, "fiscal123");
        estoquista = logado(usuario("joana", Perfil.ESTOQUISTA, "estoque123"));
        SecaoDto mercearia = catalogo.criarSecao("Mercearia");
        SecaoDto acougue = catalogo.criarSecao("Açougue");
        arroz = catalogo.criarProduto(new ProdutoForm("Arroz 5kg", "7891000100103", null, Unidade.UN, mercearia.id(), null, false,
                new BigDecimal("27.90"), null, null, null, BigDecimal.TEN, true));
        carne = catalogo.criarProduto(new ProdutoForm("Carne Moída", null, "00201", Unidade.KG, acougue.id(), null, false,
                new BigDecimal("39.90"), null, null, null, BigDecimal.ONE, true));
        LocalDate hoje = LocalDate.now();
        estoque.entrada(new EntradaForm(arroz.id(), BigDecimal.valueOf(5), new BigDecimal("20.00"), hoje.plusDays(10), "NF 1"), estoquista.id());
        estoque.entrada(new EntradaForm(arroz.id(), BigDecimal.valueOf(10), new BigDecimal("23.00"), hoje.plusDays(90), "NF 2"), estoquista.id());
        estoque.entrada(new EntradaForm(carne.id(), new BigDecimal("8"), new BigDecimal("28.00"), hoje.plusDays(3), null), estoquista.id());
        caixa.abrir(new AberturaCaixaForm(3, new BigDecimal("200.00")), operador);
    }

    @Test
    void vendaCompletaComTrocoBaixaEstoquePeloLoteQueVenceAntes() {
        VendaDto v = vendas.iniciar(operador);
        vendas.adicionarItem(v.id(), new AdicionarItemForm("7891000100103", null, BigDecimal.valueOf(2)), operador);
        String etiqueta = CodigoBarras.etiquetaBalanca("00201", new BigDecimal("32.72"));
        v = vendas.adicionarItem(v.id(), new AdicionarItemForm(etiqueta, null, null), operador);

        assertThat(v.itens()).hasSize(2);
        assertThat(v.itens().get(1).quantidade()).isEqualByComparingTo("0.820");
        assertThat(v.total()).isEqualByComparingTo("88.52");

        v = vendas.pagar(v.id(), new PagamentoForm(FormaPagamento.DINHEIRO, new BigDecimal("100.00")), operador);
        assertThat(v.troco()).isEqualByComparingTo("11.48");
        v = vendas.finalizar(v.id(), new FinalizarVendaForm("529.982.247-25"), operador);

        assertThat(v.status()).isEqualTo(StatusVenda.CONCLUIDA);
        assertThat(catalogo.produto(arroz.id()).estoqueAtual()).isEqualByComparingTo("13");
        // os 2 sacos saíram do lote que vence em 10 dias, não do que vence em 90
        assertThat(estoque.lotes(arroz.id())).extracting(LoteDto::saldo).usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("3"), new BigDecimal("10"));

        String cupom = vendas.cupom(v.id()).texto();
        assertThat(cupom).contains("TROCO R$", "11,48", "529.***.***-25");
        assertThat(cupom.lines()).allMatch(l -> l.length() <= 40);
    }

    @Test
    void cartaoNaoPodePassarDoTotalESoDinheiroGeraTroco() {
        VendaDto v = vendas.iniciar(operador);
        vendas.adicionarItem(v.id(), new AdicionarItemForm("7891000100103", null, null), operador);
        assertThatThrownBy(() -> vendas.pagar(v.id(), new PagamentoForm(FormaPagamento.CREDITO, new BigDecimal("50.00")), operador))
                .isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("Só dinheiro gera troco");

        vendas.pagar(v.id(), new PagamentoForm(FormaPagamento.PIX, new BigDecimal("10.00")), operador);
        assertThatThrownBy(() -> vendas.finalizar(v.id(), new FinalizarVendaForm(null), operador))
                .isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("Ainda falta receber R$ 17,90");
    }

    @Test
    void cancelarItemExigeSenhaDeQuemPodeAutorizar() {
        VendaDto v = vendas.iniciar(operador);
        vendas.adicionarItem(v.id(), new AdicionarItemForm("7891000100103", null, null), operador);
        assertThatThrownBy(() -> vendas.cancelarItem(v.id(), 1, new AutorizacaoForm("joana", "estoque123"), operador))
                .isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("não tem perfil para autorizar");
        assertThatThrownBy(() -> vendas.cancelarItem(v.id(), 1, new AutorizacaoForm("carlos", "errada"), operador))
                .isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("incorretos");

        VendaDto depois = vendas.cancelarItem(v.id(), 1, fiscal, operador);
        assertThat(depois.itens().getFirst().cancelado()).isTrue();
        assertThat(depois.total()).isEqualByComparingTo("0");
    }

    @Test
    void produtoPorPesoSemPesoEhRecusadoEVendaAbertaEhRetomada() {
        VendaDto v = vendas.iniciar(operador);
        assertThatThrownBy(() -> vendas.adicionarItem(v.id(), new AdicionarItemForm("00201", null, null), operador))
                .isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("vendido por quilo");
        // se o app fechar e abrir de novo, "iniciar" devolve a mesma venda em vez de criar outra
        assertThat(vendas.iniciar(operador).id()).isEqualTo(v.id());
    }

    @Test
    void fechamentoConfereODinheiroDaGaveta() {
        VendaDto v = vendas.iniciar(operador);
        vendas.adicionarItem(v.id(), new AdicionarItemForm("7891000100103", null, null), operador);
        vendas.pagar(v.id(), new PagamentoForm(FormaPagamento.DINHEIRO, new BigDecimal("50.00")), operador);
        vendas.finalizar(v.id(), new FinalizarVendaForm(null), operador);
        caixa.sangria(new MovimentoCaixaForm(new BigDecimal("100.00"), "cofre", fiscal), operador);

        // gaveta: 200 de fundo + 27,90 da venda - 100 da sangria = 127,90. contou 125,00 -> faltam 2,90
        SessaoCaixaDto fechado = caixa.fechar(new FechamentoCaixaForm(new BigDecimal("125.00")), operador);
        assertThat(fechado.dinheiroEsperado()).isEqualByComparingTo("127.90");
        assertThat(fechado.diferenca()).isEqualByComparingTo("-2.90");
        assertThat(fechado.status()).isEqualTo(StatusSessao.FECHADA);
    }

    private Usuario usuario(String login, Perfil perfil, String senha) {
        Usuario u = new Usuario();
        u.setLogin(login);
        u.setNome(login);
        u.setPerfil(perfil);
        u.setSenhaHash(senhas.encode(senha));
        u.setAtivo(true);
        u.setCriadoEm(LocalDateTime.now());
        return usuarios.save(u);
    }

    private static UsuarioLogado logado(Usuario u) {
        return new UsuarioLogado(u.getId(), u.getNome(), u.getLogin(), u.getPerfil());
    }
}
