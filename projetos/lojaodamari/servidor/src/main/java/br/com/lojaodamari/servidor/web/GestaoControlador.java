package br.com.lojaodamari.servidor.web;

import br.com.lojaodamari.comum.dto.*;
import br.com.lojaodamari.servidor.erro.ExcecaoNegocio;
import br.com.lojaodamari.servidor.seguranca.Perfis;
import br.com.lojaodamari.servidor.seguranca.UsuarioLogado;
import br.com.lojaodamari.servidor.servico.CompraServico;
import br.com.lojaodamari.servidor.servico.RelatorioServico;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// compras e relatórios: a parte de gestão da loja
@RestController
@RequestMapping("/api")
@Tag(name = "Gestão", description = "Compras e relatórios")
public class GestaoControlador {

    private final CompraServico compras;
    private final RelatorioServico relatorios;
    private final Clock relogio;

    public GestaoControlador(CompraServico compras, RelatorioServico relatorios, Clock relogio) {
        this.compras = compras;
        this.relatorios = relatorios;
        this.relogio = relogio;
    }

    @GetMapping("/compras/sugestao")
    @PreAuthorize(Perfis.ESTOQUE)
    public List<SugestaoCompraDto> sugestao() {
        return compras.sugestao();
    }

    @GetMapping("/compras/pedidos")
    @PreAuthorize(Perfis.ESTOQUE)
    public List<PedidoCompraDto> pedidos() {
        return compras.listar();
    }

    @GetMapping("/compras/pedidos/{id}")
    @PreAuthorize(Perfis.ESTOQUE)
    public PedidoCompraDto pedido(@PathVariable Long id) {
        return compras.buscar(id);
    }

    @PostMapping("/compras/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Perfis.ESTOQUE)
    public PedidoCompraDto criarPedido(@Valid @RequestBody PedidoCompraForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return compras.criar(form, quem.id());
    }

    // enviar e cancelar é decisão de gasto: só gerência
    @PostMapping("/compras/pedidos/{id}/enviar")
    @PreAuthorize(Perfis.GERENCIA)
    public PedidoCompraDto enviar(@PathVariable Long id) {
        return compras.enviar(id);
    }

    @PostMapping("/compras/pedidos/{id}/cancelar")
    @PreAuthorize(Perfis.GERENCIA)
    public PedidoCompraDto cancelar(@PathVariable Long id) {
        return compras.cancelar(id);
    }

    // receber é com o estoquista, que confere a mercadoria na doca
    @PostMapping("/compras/pedidos/{id}/receber")
    @PreAuthorize(Perfis.ESTOQUE)
    public PedidoCompraDto receber(@PathVariable Long id, @Valid @RequestBody RecebimentoForm form, @AuthenticationPrincipal UsuarioLogado quem) {
        return compras.receber(id, form, quem.id());
    }

    // GET /api/relatorios/dia?data=2026-09-25 (sem data = hoje)
    @GetMapping("/relatorios/dia")
    @PreAuthorize(Perfis.GERENCIA)
    public ResumoDiaDto dia(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        LocalDate hoje = LocalDate.now(relogio);
        LocalDate dia = data == null ? hoje : data;
        if (dia.isAfter(hoje)) {
            throw ExcecaoNegocio.invalido("data_futura", "Não dá para ver o relatório de um dia que ainda não chegou.");
        }
        return relatorios.resumoDia(dia);
    }

    // GET /api/relatorios/curva-abc?dias=30
    @GetMapping("/relatorios/curva-abc")
    @PreAuthorize(Perfis.GERENCIA)
    public CurvaAbcDto curvaAbc(@RequestParam(defaultValue = "30") int dias) {
        if (dias < 1 || dias > 365) {
            throw ExcecaoNegocio.invalido("periodo_invalido", "Escolha um período de 1 a 365 dias.");
        }
        return relatorios.curvaAbc(dias);
    }
}
