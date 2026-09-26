package br.com.lojaodamari.servidor.servico;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

// formatação de dinheiro e CPF que aparece em mensagens e no cupom
public final class Dinheiro {

    private static final Locale BRASIL = Locale.of("pt", "BR");

    private Dinheiro() {
    }

    // "R$ 1.234,50"
    public static String formatar(BigDecimal valor) {
        // o Java usa espaço não separável depois do R$; troco por espaço comum pra não quebrar em tela nenhuma
        return NumberFormat.getCurrencyInstance(BRASIL).format(valor.setScale(2, RoundingMode.HALF_UP)).replace((char) 160, ' ');
    }

    // "1.234,50" (sem o R$, pro cupom alinhado)
    public static String numero(BigDecimal valor) {
        NumberFormat f = NumberFormat.getNumberInstance(BRASIL);
        f.setMinimumFractionDigits(2);
        f.setMaximumFractionDigits(2);
        return f.format(valor);
    }

    // valida CPF pelos dois dígitos verificadores. aceita com ou sem pontuação
    public static boolean cpfValido(String cpf) {
        if (cpf == null) return false;
        String d = cpf.replaceAll("\\D", "");
        if (d.length() != 11 || d.chars().distinct().count() == 1) return false;
        for (int t = 9; t <= 10; t++) {
            int soma = 0;
            for (int i = 0; i < t; i++) soma += (d.charAt(i) - '0') * (t + 1 - i);
            int digito = (soma * 10) % 11 % 10;
            if (digito != d.charAt(t) - '0') return false;
        }
        return true;
    }
}
