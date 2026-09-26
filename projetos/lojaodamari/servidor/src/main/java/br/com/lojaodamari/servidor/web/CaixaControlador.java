package br.com.lojaodamari.servidor.web;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.servidor.seguranca.Perfis;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import br.com.lojaodamari.servidor.servico.CaixaServico;
import br.com.lojaodamari.servidor.servico.VendaServico;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// caixa e venda: tudo que o PDV usa
@RestController
@RequestMapping("/api")
@Tag(name = "Caixa", description = "Turno do caixa e vendas")
public class CaixaControlador {

    private final CaixaServico caixa;
    private final VendaServico vendas;

    public CaixaControlador(CaixaServico caixa, VendaServico vendas) {
        this.caixa = caixa;
        this.vendas = vendas;
    }

    @PostMapping("/caixa/abrir")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.CAIXA)
    public SessaoCaixaDto abrir(@Valid @RequestBody AberturaCaixaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return caixa.abrir(form, quem);
    }

    // GET /api/caixa/atual -> 404 caixa_fechado quando o operador ainda não abriu
    @GetMapping("/caixa/atual")
    @PreAuthorize(Perfis.CAIXA)
    public SessaoCaixaDto atual(@AuthenticationPrincipal UsuarioLogado quem) {
        return caixa.atual(quem);
    }

    @PostMapping("/caixa/sangria")
    @PreAuthorize(Perfis.CAIXA)
    public SessaoCaixaDto sangria(@Valid @RequestBody MovimentoCaixaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return caixa.sangria(form, quem);
    }

    @PostMapping("/caixa/suprimento")
    @PreAuthorize(Perfis.CAIXA)
    public SessaoCaixaDto suprimento(@Valid @RequestBody MovimentoCaixaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return caixa.suprimento(form, quem);
    }

    @PostMapping("/caixa/fechar")
    @PreAuthorize(Perfis.CAIXA)
    public SessaoCaixaDto fechar(@Valid @RequestBody FechamentoCaixaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return caixa.fechar(form, quem);
    }

    // GET /api/caixa/sessoes?data=2026-09-25 -> fechamentos do dia, pro gerente conferir diferença de caixa
    @GetMapping("/caixa/sessoes")
    @PreAuthorize(Perfis.GERENCIA)
    public List<SessaoCaixaDto> sessoes(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return caixa.doDia(data);
    }

    @PostMapping("/vendas")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto iniciar(@AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.iniciar(quem);
    }

    @GetMapping("/vendas/em-andamento")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto emAndamento(@AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.emAndamento(quem);
    }

    @GetMapping("/vendas/{id}")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto venda(@PathVariable Long id) {
        return vendas.buscar(id);
    }

    @PostMapping("/vendas/{id}/itens")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto adicionarItem(@PathVariable Long id, @Valid @RequestBody AdicionarItemForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.adicionarItem(id, form, quem);
    }

    @PostMapping("/vendas/{id}/itens/{sequencia}/cancelar")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto cancelarItem(@PathVariable Long id, @PathVariable int sequencia, @Valid @RequestBody AutorizacaoForm autorizacao,
                                 @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.cancelarItem(id, sequencia, autorizacao, quem);
    }

    @PostMapping("/vendas/{id}/pagamentos")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto pagar(@PathVariable Long id, @Valid @RequestBody PagamentoForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.pagar(id, form, quem);
    }

    @DeleteMapping("/vendas/{id}/pagamentos")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto limparPagamentos(@PathVariable Long id, @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.limparPagamentos(id, quem);
    }

    @PostMapping("/vendas/{id}/finalizar")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto finalizar(@PathVariable Long id, @Valid @RequestBody FinalizarVendaForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.finalizar(id, form, quem);
    }

    @PostMapping("/vendas/{id}/cancelar")
    @PreAuthorize(Perfis.CAIXA)
    public VendaDto cancelar(@PathVariable Long id, @Valid @RequestBody AutorizacaoForm autorizacao, @AuthenticationPrincipal UsuarioLogado quem) {
        return vendas.cancelar(id, autorizacao, quem);
    }

    @GetMapping("/vendas/{id}/cupom")
    @PreAuthorize(Perfis.CAIXA)
    public CupomDto cupom(@PathVariable Long id) {
        return vendas.cupom(id);
    }
}
