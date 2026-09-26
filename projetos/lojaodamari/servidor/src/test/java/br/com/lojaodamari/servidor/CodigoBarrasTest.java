package br.com.lojaodamari.servidor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.servico.CodigoBarras;
import br.com.lojaodamari.servidor.servico.Dinheiro;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

// testes da leitura de código de barras e da validação de CPF (sem Spring, direto nas funções)
class CodigoBarrasTest {

    @Test
    void confereDigitoVerificadorDeEansReais() {
        assertThat(CodigoBarras.digitoValido("7891000100103")).isTrue();
        assertThat(CodigoBarras.digitoValido("7891000100104")).isFalse();
        assertThat(CodigoBarras.digitoValido("96385074")).isTrue();
    }

    @Test
    void entendeEtiquetaDeBalancaComOValorEmbutido() {
        String etiqueta = CodigoBarras.etiquetaBalanca("00201", new BigDecimal("32.72"));
        var leitura = CodigoBarras.interpretar(etiqueta);
        assertThat(leitura).isEqualTo(new CodigoBarras.Balanca("00201", new BigDecimal("32.72")));
    }

    @Test
    void cincoDigitosEhPlu() {
        assertThat(CodigoBarras.interpretar("00401")).isEqualTo(new CodigoBarras.Plu("00401"));
    }

    @Test
    void recusaCodigoComDigitoErradoOuTamanhoEstranho() {
        assertThatThrownBy(() -> CodigoBarras.interpretar("7891000100104")).isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("dígito verificador");
        assertThatThrownBy(() -> CodigoBarras.interpretar("123")).isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("3 dígitos");
        assertThatThrownBy(() -> CodigoBarras.interpretar("78910abc")).isInstanceOf(ExcecaoNegocio.class).hasMessageContaining("só números");
    }

    @Test
    void validaCpfPelosDigitos() {
        assertThat(Dinheiro.cpfValido("529.982.247-25")).isTrue();
        assertThat(Dinheiro.cpfValido("52998224726")).isFalse();
        assertThat(Dinheiro.cpfValido("111.111.111-11")).isFalse();
    }
}
