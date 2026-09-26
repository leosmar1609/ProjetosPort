package br.com.lojaodamari.comum.dto;

import br.com.lojaodamari.comum.enums.Perfil;
import jakarta.validation.constraints.*;

// cadastro/edição de usuário. na edição a senha pode vir vazia pra manter a atual
public record UsuarioForm(
        @NotBlank @Size(max = 80) String nome,
        @NotBlank @Pattern(regexp = "[a-z0-9._]{3,30}", message = "use de 3 a 30 letras minúsculas, números, ponto ou _") String login,
        @Size(min = 6, max = 60, message = "a senha precisa ter pelo menos 6 caracteres") String senha,
        @NotNull Perfil perfil,
        boolean ativo
) {
}
