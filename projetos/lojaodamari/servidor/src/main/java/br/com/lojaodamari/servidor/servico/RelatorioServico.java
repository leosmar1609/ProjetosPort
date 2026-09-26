package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.comum.enums.ClasseAbc;
import br.com.lojaodamari.comum.enums.FormaPagamento;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// números da loja. as consultas são SQL direto (JdbcTemplate) porque é agregação pura, sem regra de entidade
@Service
public class RelatorioServico {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final JdbcTemplate jdbc;
    private final Clock relogio;

    public RelatorioServico(JdbcTemplate jdbc, Clock relogio) {
        this.jdbc = jdbc;
        this.relogio = relogio;
    }

    // painel de um dia. se for hoje, compara com o mesmo dia da semana passada só até o horário de agora
    @Transactional(readOnly = true)
    public ResumoDiaDto resumoDia(LocalDate dia) {
        LocalDateTime agora = LocalDateTime.now(relogio);
        boolean parcial = dia.equals(agora.toLocalDate());
        LocalDateTime inicio = dia.atStartOfDay();
        LocalDateTime fim = parcial ? agora : dia.plusDays(1).atStartOfDay();
        LocalDate diaComparacao = dia.minusWeeks(1);
        LocalDateTime inicioComp = diaComparacao.atStartOfDay();
        LocalDateTime fimComp = parcial ? agora.minusWeeks(1) : diaComparacao.plusDays(1).atStartOfDay();

        Totais atual = totais(inicio, fim);
        Totais comparacao = totais(inicioComp, fimComp);
        long itens = jdbc.queryForObject("SELECT COUNT(*) FROM item_venda i JOIN venda v ON v.id = i.venda_id "
                + "WHERE v.status = 'CONCLUIDA' AND i.cancelado = FALSE AND v.concluida_em >= ? AND v.concluida_em < ?", Long.class, inicio, fim);

        return new ResumoDiaDto(dia, diaComparacao, parcial, atual.faturamento, comparacao.faturamento, atual.cupons, comparacao.cupons,
                atual.ticket(), comparacao.ticket(),
                atual.cupons == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(itens).divide(BigDecimal.valueOf(atual.cupons), 1, RoundingMode.HALF_UP),
                porHora(inicio, fim, inicioComp, diaComparacao.plusDays(1).atStartOfDay()), porSecao(inicio, fim), porForma(inicio, fim), porOperador(inicio, fim));
    }

    private record Totais(BigDecimal faturamento, int cupons) {
        BigDecimal ticket() {
            return cupons == 0 ? BigDecimal.ZERO : faturamento.divide(BigDecimal.valueOf(cupons), 2, RoundingMode.HALF_UP);
        }
    }

    private Totais totais(LocalDateTime inicio, LocalDateTime fim) {
        return jdbc.queryForObject("SELECT COUNT(*) AS qtd, COALESCE(SUM(total), 0) AS total FROM venda WHERE status = 'CONCLUIDA' AND concluida_em >= ? AND concluida_em < ?",
                (rs, n) -> new Totais(rs.getBigDecimal("total"), rs.getInt("qtd")), inicio, fim);
    }

    // faturamento de cada hora. a comparação mostra o dia inteiro da semana passada, pra dar pra ver o resto do dia
    private List<VendaHoraDto> porHora(LocalDateTime inicio, LocalDateTime fim, LocalDateTime inicioComp, LocalDateTime fimComp) {
        String sql = "SELECT HOUR(concluida_em) AS hora, SUM(total) AS total, COUNT(*) AS qtd FROM venda "
                + "WHERE status = 'CONCLUIDA' AND concluida_em >= ? AND concluida_em < ? GROUP BY HOUR(concluida_em)";
        Map<Integer, BigDecimal[]> horas = new TreeMap<>();
        jdbc.query(sql, rs -> {
            horas.computeIfAbsent(rs.getInt("hora"), h -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            horas.get(rs.getInt("hora"))[0] = rs.getBigDecimal("total");
            horas.get(rs.getInt("hora"))[1] = BigDecimal.valueOf(rs.getInt("qtd"));
        }, inicio, fim);
        jdbc.query(sql, rs -> {
            horas.computeIfAbsent(rs.getInt("hora"), h -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            horas.get(rs.getInt("hora"))[2] = rs.getBigDecimal("total");
        }, inicioComp, fimComp);
        return horas.entrySet().stream().map(e -> new VendaHoraDto(e.getKey(), e.getValue()[0], e.getValue()[1].intValue(), e.getValue()[2])).toList();
    }

    // faturamento por seção e margem bruta (quanto sobrou depois do custo congelado no item)
    private List<VendaSecaoDto> porSecao(LocalDateTime inicio, LocalDateTime fim) {
        return jdbc.query("SELECT s.nome AS secao, SUM(i.total) AS total, SUM(i.total - i.custo_unitario * i.quantidade) AS lucro "
                        + "FROM item_venda i JOIN venda v ON v.id = i.venda_id JOIN produto p ON p.id = i.produto_id JOIN secao s ON s.id = p.secao_id "
                        + "WHERE v.status = 'CONCLUIDA' AND i.cancelado = FALSE AND v.concluida_em >= ? AND v.concluida_em < ? "
                        + "GROUP BY s.nome ORDER BY SUM(i.total) DESC",
                (rs, n) -> {
                    BigDecimal total = rs.getBigDecimal("total");
                    BigDecimal margem = total.signum() == 0 ? BigDecimal.ZERO : rs.getBigDecimal("lucro").multiply(CEM).divide(total, 1, RoundingMode.HALF_UP);
                    return new VendaSecaoDto(rs.getString("secao"), total.setScale(2, RoundingMode.HALF_UP), margem);
                }, inicio, fim);
    }

    // quanto entrou em cada forma. no dinheiro desconto o troco que saiu da gaveta
    private List<VendaFormaDto> porForma(LocalDateTime inicio, LocalDateTime fim) {
        Map<FormaPagamento, VendaFormaDto> mapa = new EnumMap<>(FormaPagamento.class);
        jdbc.query("SELECT p.forma, SUM(p.valor) AS total, COUNT(DISTINCT p.venda_id) AS qtd FROM pagamento p JOIN venda v ON v.id = p.venda_id "
                + "WHERE v.status = 'CONCLUIDA' AND v.concluida_em >= ? AND v.concluida_em < ? GROUP BY p.forma", rs -> {
            FormaPagamento forma = FormaPagamento.valueOf(rs.getString("forma"));
            mapa.put(forma, new VendaFormaDto(forma, rs.getBigDecimal("total"), rs.getInt("qtd")));
        }, inicio, fim);
        BigDecimal troco = jdbc.queryForObject("SELECT COALESCE(SUM(troco), 0) FROM venda WHERE status = 'CONCLUIDA' AND concluida_em >= ? AND concluida_em < ?",
                BigDecimal.class, inicio, fim);
        mapa.computeIfPresent(FormaPagamento.DINHEIRO, (k, v) -> new VendaFormaDto(k, v.total().subtract(troco), v.quantidade()));
        return mapa.values().stream().sorted(Comparator.comparing(VendaFormaDto::total).reversed()).toList();
    }

    private List<VendaOperadorDto> porOperador(LocalDateTime inicio, LocalDateTime fim) {
        return jdbc.query("SELECT u.nome, COUNT(*) AS qtd, SUM(v.total) AS total FROM venda v JOIN usuario u ON u.id = v.operador_id "
                        + "WHERE v.status = 'CONCLUIDA' AND v.concluida_em >= ? AND v.concluida_em < ? GROUP BY u.nome ORDER BY SUM(v.total) DESC",
                (rs, n) -> new VendaOperadorDto(rs.getString("nome"), rs.getInt("qtd"), rs.getBigDecimal("total")), inicio, fim);
    }

    // curva ABC: ordena os produtos pelo faturamento e acumula. até 80% é A, até 95% é B, o resto é C
    @Transactional(readOnly = true)
    public CurvaAbcDto curvaAbc(int dias) {
        LocalDateTime desde = LocalDate.now(relogio).minusDays(dias).atStartOfDay();
        List<Object[]> linhas = jdbc.query("SELECT p.id, p.nome, s.nome AS secao, SUM(i.total) AS total FROM item_venda i JOIN venda v ON v.id = i.venda_id "
                        + "JOIN produto p ON p.id = i.produto_id JOIN secao s ON s.id = p.secao_id "
                        + "WHERE v.status = 'CONCLUIDA' AND i.cancelado = FALSE AND v.concluida_em >= ? GROUP BY p.id, p.nome, s.nome ORDER BY SUM(i.total) DESC",
                (rs, n) -> new Object[]{rs.getLong("id"), rs.getString("nome"), rs.getString("secao"), rs.getBigDecimal("total")}, desde);
        BigDecimal total = linhas.stream().map(l -> (BigDecimal) l[3]).reduce(BigDecimal.ZERO, BigDecimal::add);
        List<ItemAbcDto> itens = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;
        int[] contagem = new int[3];
        for (int i = 0; i < linhas.size(); i++) {
            Object[] l = linhas.get(i);
            BigDecimal fat = (BigDecimal) l[3];
            BigDecimal pct = total.signum() == 0 ? BigDecimal.ZERO : fat.multiply(CEM).divide(total, 2, RoundingMode.HALF_UP);
            // a classe olha o acumulado ANTES do produto: o item que cruza os 80% ainda é A
            ClasseAbc classe = acumulado.compareTo(BigDecimal.valueOf(80)) < 0 ? ClasseAbc.A : acumulado.compareTo(BigDecimal.valueOf(95)) < 0 ? ClasseAbc.B : ClasseAbc.C;
            acumulado = acumulado.add(pct).min(CEM);
            contagem[classe.ordinal()]++;
            itens.add(new ItemAbcDto(i + 1, (Long) l[0], (String) l[1], (String) l[2], fat.setScale(2, RoundingMode.HALF_UP), pct, acumulado, classe));
        }
        return new CurvaAbcDto(dias, total.setScale(2, RoundingMode.HALF_UP), contagem[0], contagem[1], contagem[2], itens);
    }
}
