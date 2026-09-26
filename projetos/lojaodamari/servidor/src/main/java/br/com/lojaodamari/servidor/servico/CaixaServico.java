package br.com.lojaodamari.servidor.servico;

import br.com.lojaodamari.comum.dto.AberturaCaixaForm;
import br.com.lojaodamari.comum.dto.FechamentoCaixaForm;
import br.com.lojaodamari.comum.dto.MovimentoCaixaForm;
import br.com.lojaodamari.comum.dto.SessaoCaixaDto;
import br.com.lojaodamari.comum.enums.FormaPagamento;
import br.com.lojaodamari.comum.enums.StatusSessao;
import br.com.lojaodamari.comum.enums.StatusVenda;
import br.com.lojaodamari.servidor.dominio.MovimentoCaixa;
import br.com.lojaodamari.servidor.dominio.SessaoCaixa;
import br.com.lojaodamari.servidor.dominio.TipoMovimentoCaixa;
import br.com.lojaodamari.servidor.dominio.Usuario;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.repositorio.MovimentoCaixaRepositorio;
import br.com.lojaodamari.servidor.repositorio.SessaoCaixaRepositorio;
import br.com.lojaodamari.servidor.repositorio.UsuarioRepositorio;
import br.com.lojaodamari.servidor.repositorio.VendaRepositorio;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// o turno do operador no caixa: abrir, sangria, suprimento e fechar conferindo a gaveta
@Service
public class CaixaServico {

    private final SessaoCaixaRepositorio sessoes;
    private final MovimentoCaixaRepositorio movimentos;
    private final VendaRepositorio vendas;
    private final UsuarioRepositorio usuarios;
    private final AcessoServico acesso;
    private final JdbcTemplate jdbc;
    private final Clock relogio;

    public CaixaServico(SessaoCaixaRepositorio sessoes, MovimentoCaixaRepositorio movimentos, VendaRepositorio vendas, UsuarioRepositorio usuarios,
                        AcessoServico acesso, JdbcTemplate jdbc, Clock relogio) {
        this.sessoes = sessoes;
        this.movimentos = movimentos;
        this.vendas = vendas;
        this.usuarios = usuarios;
        this.acesso = acesso;
        this.jdbc = jdbc;
        this.relogio = relogio;
    }

    // abre o caixa. um operador só tem um caixa aberto, e um caixa só tem um operador por vez
    @Transactional
    public SessaoCaixaDto abrir(AberturaCaixaForm f, UsuarioLogado quem) {
        if (sessoes.findFirstByOperadorIdAndStatus(quem.id(), StatusSessao.ABERTA).isPresent()) {
            throw ExcecaoNegocio.conflito("operador_com_caixa_aberto", "Você já tem um caixa aberto. Feche ele antes de abrir outro.");
        }
        if (sessoes.existsByNumeroCaixaAndStatus(f.numeroCaixa(), StatusSessao.ABERTA)) {
            throw ExcecaoNegocio.conflito("caixa_em_uso", "O caixa " + f.numeroCaixa() + " já está aberto com outro operador.");
        }
        SessaoCaixa s = new SessaoCaixa();
        s.setNumeroCaixa(f.numeroCaixa());
        s.setOperador(usuarios.getReferenceById(quem.id()));
        s.setStatus(StatusSessao.ABERTA);
        s.setAbertaEm(LocalDateTime.now(relogio));
        s.setFundoTroco(f.fundoTroco());
        sessoes.save(s);
        return resumo(s);
    }

    // o caixa aberto de quem está logado (o app chama ao entrar, pra saber se mostra a abertura ou o PDV)
    @Transactional(readOnly = true)
    public SessaoCaixaDto atual(UsuarioLogado quem) {
        return resumo(sessaoAberta(quem.id()));
    }

    public SessaoCaixa sessaoAberta(Long operadorId) {
        return sessoes.findFirstByOperadorIdAndStatus(operadorId, StatusSessao.ABERTA)
                .orElseThrow(() -> ExcecaoNegocio.naoEncontrado("caixa_fechado", "Você não tem caixa aberto. Abra o caixa para começar a vender."));
    }

    // sangria: tira dinheiro da gaveta (vai pro cofre). precisa do fiscal e não pode tirar mais do que tem
    @Transactional
    public SessaoCaixaDto sangria(MovimentoCaixaForm f, UsuarioLogado quem) {
        SessaoCaixa s = sessaoAberta(quem.id());
        Usuario fiscal = acesso.autorizar(f.autorizacao(), "A sangria");
        SessaoCaixaDto atual = resumo(s);
        if (f.valor().compareTo(atual.dinheiroEsperado()) > 0) {
            throw ExcecaoNegocio.invalido("sangria_maior_que_gaveta", "A gaveta deveria ter " + Dinheiro.formatar(atual.dinheiroEsperado()) + ". Não dá para tirar mais do que isso.");
        }
        registrar(s, TipoMovimentoCaixa.SANGRIA, f, quem, fiscal);
        return resumo(s);
    }

    // suprimento: coloca troco na gaveta
    @Transactional
    public SessaoCaixaDto suprimento(MovimentoCaixaForm f, UsuarioLogado quem) {
        SessaoCaixa s = sessaoAberta(quem.id());
        registrar(s, TipoMovimentoCaixa.SUPRIMENTO, f, quem, null);
        return resumo(s);
    }

    // fecha o turno com o dinheiro contado. a diferença (sobra ou falta) fica registrada
    @Transactional
    public SessaoCaixaDto fechar(FechamentoCaixaForm f, UsuarioLogado quem) {
        SessaoCaixa s = sessaoAberta(quem.id());
        if (vendas.findFirstBySessaoIdAndStatus(s.getId(), StatusVenda.ABERTA).isPresent()) {
            throw ExcecaoNegocio.invalido("venda_em_andamento", "Tem uma venda em andamento. Finalize ou cancele antes de fechar o caixa.");
        }
        s.setDinheiroContado(f.dinheiroContado());
        s.setFechadaEm(LocalDateTime.now(relogio));
        s.setStatus(StatusSessao.FECHADA);
        return resumo(s);
    }

    // turnos de um dia, pro gerente conferir os fechamentos
    @Transactional(readOnly = true)
    public List<SessaoCaixaDto> doDia(LocalDate dia) {
        return sessoes.findByAbertaEmGreaterThanEqualAndAbertaEmLessThanOrderByAbertaEm(dia.atStartOfDay(), dia.plusDays(1).atStartOfDay())
                .stream().map(this::resumo).toList();
    }

    private void registrar(SessaoCaixa s, TipoMovimentoCaixa tipo, MovimentoCaixaForm f, UsuarioLogado quem, Usuario autorizou) {
        MovimentoCaixa m = new MovimentoCaixa();
        m.setSessao(s);
        m.setTipo(tipo);
        m.setValor(f.valor());
        m.setMotivo(f.motivo());
        m.setUsuario(usuarios.getReferenceById(quem.id()));
        m.setAutorizadoPor(autorizou);
        m.setDataHora(LocalDateTime.now(relogio));
        movimentos.save(m);
    }

    // totais do turno. dinheiro na gaveta = fundo + dinheiro recebido - troco dado + suprimentos - sangrias
    public SessaoCaixaDto resumo(SessaoCaixa s) {
        Map<String, Object> vendasTurno = jdbc.queryForMap(
                "SELECT COUNT(*) AS qtd, COALESCE(SUM(total), 0) AS total, COALESCE(SUM(troco), 0) AS troco FROM venda WHERE sessao_id = ? AND status = 'CONCLUIDA'", s.getId());
        Map<FormaPagamento, BigDecimal> porForma = new EnumMap<>(FormaPagamento.class);
        jdbc.query("SELECT p.forma, SUM(p.valor) AS total FROM pagamento p JOIN venda v ON v.id = p.venda_id "
                + "WHERE v.sessao_id = ? AND v.status = 'CONCLUIDA' GROUP BY p.forma", rs -> {
            porForma.put(FormaPagamento.valueOf(rs.getString("forma")), rs.getBigDecimal("total"));
        }, s.getId());
        BigDecimal troco = decimal(vendasTurno.get("troco"));
        porForma.computeIfPresent(FormaPagamento.DINHEIRO, (k, v) -> v.subtract(troco));

        BigDecimal sangrias = somaMovimento(s.getId(), TipoMovimentoCaixa.SANGRIA);
        BigDecimal suprimentos = somaMovimento(s.getId(), TipoMovimentoCaixa.SUPRIMENTO);
        BigDecimal esperado = s.getFundoTroco().add(porForma.getOrDefault(FormaPagamento.DINHEIRO, BigDecimal.ZERO)).add(suprimentos).subtract(sangrias);
        BigDecimal diferenca = s.getDinheiroContado() == null ? null : s.getDinheiroContado().subtract(esperado);

        return new SessaoCaixaDto(s.getId(), s.getNumeroCaixa(), s.getOperador().getNome(), s.getStatus(), s.getAbertaEm(), s.getFechadaEm(),
                s.getFundoTroco(), ((Number) vendasTurno.get("qtd")).intValue(), decimal(vendasTurno.get("total")), porForma,
                sangrias, suprimentos, esperado, s.getDinheiroContado(), diferenca);
    }

    private BigDecimal somaMovimento(Long sessaoId, TipoMovimentoCaixa tipo) {
        return jdbc.queryForObject("SELECT COALESCE(SUM(valor), 0) FROM movimento_caixa WHERE sessao_id = ? AND tipo = ?", BigDecimal.class, sessaoId, tipo.name());
    }

    private static BigDecimal decimal(Object o) {
        return o instanceof BigDecimal b ? b : new BigDecimal(o.toString());
    }
}
