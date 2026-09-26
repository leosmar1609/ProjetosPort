package br.com.lojaodamari.servidor.seguranca;

// expressões de @PreAuthorize num lugar só, pra não espalhar texto de perfil pelas rotas
public final class Perfis {

    public static final String CAIXA = "hasAnyRole('OPERADOR','FISCAL','GERENTE','ADMIN')";
    public static final String ESTOQUE_LEITURA = "hasAnyRole('ESTOQUISTA','FISCAL','GERENTE','ADMIN')";
    public static final String ESTOQUE = "hasAnyRole('ESTOQUISTA','GERENTE','ADMIN')";
    public static final String GERENCIA = "hasAnyRole('GERENTE','ADMIN')";
    public static final String ADMIN = "hasRole('ADMIN')";

    private Perfis() {
    }
}
