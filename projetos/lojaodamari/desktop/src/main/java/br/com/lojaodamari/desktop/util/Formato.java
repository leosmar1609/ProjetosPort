package br.com.lojaodamari.desktop.util;

import br.com.lojaodamari.comum.enums.Unidade;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// como número, dinheiro e data aparecem na tela (tudo no padrão brasileiro)
public final class Formato {

    private static final Locale BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private Formato() {
    }

    // R$ 1.234,56
    public static String dinheiro(BigDecimal v) {
        if (v == null) return "—";
        return NumberFormat.getCurrencyInstance(BR).format(v.setScale(2, RoundingMode.HALF_UP)).replace((char) 160, ' ');
    }

    // 1.234,56 (sem R$)
    public static String numero(BigDecimal v, int casas) {
        if (v == null) return "—";
        NumberFormat f = NumberFormat.getNumberInstance(BR);
        f.setMinimumFractionDigits(casas);
        f.setMaximumFractionDigits(casas);
        return f.format(v);
    }

    // quantidade com a unidade: "3 un" ou "0,845 kg"
    public static String quantidade(BigDecimal q, Unidade u) {
        if (q == null) return "—";
        if (u != Unidade.KG) return numero(q, 0) + " un";
        NumberFormat f = NumberFormat.getNumberInstance(BR);
        f.setMinimumFractionDigits(0);
        f.setMaximumFractionDigits(3);
        return f.format(q) + " kg";
    }

    public static String percentual(BigDecimal v) {
        return v == null ? "—" : numero(v, 1) + "%";
    }

    public static String data(LocalDate d) {
        return d == null ? "—" : d.format(DATA);
    }

    // 30/09, pra caber em etiqueta
    public static String diaMes(LocalDate d) {
        return d == null ? "—" : d.format(DateTimeFormatter.ofPattern("dd/MM"));
    }

    public static String dataHora(LocalDateTime d) {
        return d == null ? "—" : d.format(DATA_HORA);
    }

    public static String hora(LocalDateTime d) {
        return d == null ? "—" : d.format(HORA);
    }

    // lê o que a pessoa digitou: aceita "1.234,56", "1234,56" e "1234.56"
    public static BigDecimal lerNumero(String texto) {
        if (texto == null || texto.isBlank()) return null;
        String t = texto.trim().replace("R$", "").replace(" ", "");
        if (t.contains(",")) t = t.replace(".", "").replace(",", ".");
        try {
            return new BigDecimal(t);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // máscara de CPF enquanto digita: 000.000.000-00
    public static String mascaraCpf(String texto) {
        String d = texto.replaceAll("\\D", "");
        if (d.length() > 11) d = d.substring(0, 11);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < d.length(); i++) {
            if (i == 3 || i == 6) sb.append('.');
            if (i == 9) sb.append('-');
            sb.append(d.charAt(i));
        }
        return sb.toString();
    }
}
