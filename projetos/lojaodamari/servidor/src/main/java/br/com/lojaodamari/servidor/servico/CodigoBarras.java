package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import java.math.BigDecimal;

// entende o que o leitor de código de barras mandou.
// três formatos:
//   EAN-13 ou EAN-8   -> produto industrializado (7891000403174)
//   13 dígitos com 2  -> etiqueta da balança do açougue/padaria: 2 + PLU(5) + valor em centavos(6) + dígito
//   5 dígitos         -> PLU digitado no caixa (hortifruti pesado na hora)
public final class CodigoBarras {

    // o que a leitura virou
    public sealed interface Leitura permits Ean, Balanca, Plu {
    }

    public record Ean(String codigo) implements Leitura {
    }

    public record Balanca(String plu, BigDecimal valorTotal) implements Leitura {
    }

    public record Plu(String plu) implements Leitura {
    }

    private CodigoBarras() {
    }

    // interpreta o código ou explica por que não deu
    public static Leitura interpretar(String bruto) {
        String codigo = bruto == null ? "" : bruto.trim();
        if (!codigo.matches("\\d+")) {
            throw ExcecaoNegocio.invalido("codigo_invalido", "O código precisa ter só números.");
        }
        if (codigo.length() == 5) {
            return new Plu(codigo);
        }
        if (codigo.length() != 8 && codigo.length() != 13) {
            throw ExcecaoNegocio.invalido("codigo_invalido", "Código com " + codigo.length() + " dígitos. O EAN tem 8 ou 13, e o PLU tem 5.");
        }
        if (!digitoValido(codigo)) {
            throw ExcecaoNegocio.invalido("digito_invalido", "O dígito verificador não confere. Passe o produto de novo ou digite o código com atenção.");
        }
        if (codigo.length() == 13 && codigo.charAt(0) == '2') {
            BigDecimal valor = new BigDecimal(codigo.substring(6, 12)).movePointLeft(2);
            return new Balanca(codigo.substring(1, 6), valor);
        }
        return new Ean(codigo);
    }

    // dígito verificador GTIN: da direita pra esquerda (sem o último), pesos 3 e 1 alternados
    public static boolean digitoValido(String codigo) {
        if (codigo == null || !codigo.matches("\\d{8}|\\d{13}")) return false;
        return calcularDigito(codigo.substring(0, codigo.length() - 1)) == codigo.charAt(codigo.length() - 1) - '0';
    }

    // completa um código com o dígito certo (usado pra gerar etiqueta e dados de exemplo)
    public static String comDigito(String semDigito) {
        return semDigito + calcularDigito(semDigito);
    }

    // monta a etiqueta que a balança imprimiria pra esse PLU e valor
    public static String etiquetaBalanca(String plu, BigDecimal valorTotal) {
        String centavos = String.format("%06d", valorTotal.movePointRight(2).intValueExact());
        return comDigito("2" + plu + centavos);
    }

    private static int calcularDigito(String numeros) {
        int soma = 0;
        for (int i = numeros.length() - 1, peso = 3; i >= 0; i--, peso = peso == 3 ? 1 : 3) {
            soma += (numeros.charAt(i) - '0') * peso;
        }
        return (10 - soma % 10) % 10;
    }
}
