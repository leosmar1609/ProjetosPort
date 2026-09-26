package br.com.lojaodamari.servidor.erro;

import br.com.lojaodamari.comum.dto.ErroDto;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

// transforma qualquer erro no mesmo formato ErroDto, assim o app desktop só precisa entender um jeito
@RestControllerAdvice
public class TratadorErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorErros.class);

    // regra de negócio: sai com o status e a mensagem que eu defini
    @ExceptionHandler(ExcecaoNegocio.class)
    ResponseEntity<ErroDto> negocio(ExcecaoNegocio e) {
        return resposta(e.status(), e.codigo(), e.getMessage(), null);
    }

    // @Valid falhou: devolvo a mensagem de cada campo, pra tela marcar o campo certo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroDto> validacao(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        String primeiro = campos.entrySet().stream().findFirst().map(c -> c.getKey() + ": " + c.getValue()).orElse("dados inválidos");
        return resposta(HttpStatus.UNPROCESSABLE_CONTENT, "dados_invalidos", "Confira os dados. " + primeiro, campos);
    }

    // JSON quebrado ou com tipo errado (texto onde era número, enum que não existe)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErroDto> jsonInvalido(HttpMessageNotReadableException e) {
        return resposta(HttpStatus.BAD_REQUEST, "json_invalido", "O corpo da requisição não está no formato esperado.", null);
    }

    // parâmetro da URL no formato errado (ex: data=ontem)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErroDto> parametroInvalido(MethodArgumentTypeMismatchException e) {
        return resposta(HttpStatus.BAD_REQUEST, "parametro_invalido", "O parâmetro " + e.getName() + " está num formato inválido.", null);
    }

    // logado, mas sem o perfil necessário
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErroDto> semPermissao(AccessDeniedException e) {
        return resposta(HttpStatus.FORBIDDEN, "sem_permissao", "Seu perfil não tem acesso a esta função.", null);
    }

    // dois computadores salvaram o mesmo registro ao mesmo tempo: o segundo precisa recarregar
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ErroDto> concorrencia(ObjectOptimisticLockingFailureException e) {
        return resposta(HttpStatus.CONFLICT, "alterado_por_outro", "Esse registro foi alterado em outro computador agora. Atualize a tela e tente de novo.", null);
    }

    // chave única ou chave estrangeira do banco barrou (ex: EAN repetido)
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErroDto> integridade(DataIntegrityViolationException e) {
        log.warn("violação de integridade: {}", e.getMostSpecificCause().getMessage());
        return resposta(HttpStatus.CONFLICT, "conflito_de_dados", "Já existe um registro com esses dados, ou ele está em uso.", null);
    }

    // rota que não existe
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErroDto> rotaInexistente(NoResourceFoundException e) {
        return resposta(HttpStatus.NOT_FOUND, "rota_nao_encontrada", "Essa rota não existe: /" + e.getResourcePath(), null);
    }

    // qualquer outra coisa é bug: loga completo e responde sem vazar detalhe
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErroDto> inesperado(Exception e) {
        log.error("erro inesperado", e);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "erro_interno", "Erro no servidor. Tente de novo em instantes.", null);
    }

    private ResponseEntity<ErroDto> resposta(HttpStatus status, String codigo, String mensagem, Map<String, String> campos) {
        return ResponseEntity.status(status).body(new ErroDto(status.value(), codigo, mensagem, campos));
    }
}
