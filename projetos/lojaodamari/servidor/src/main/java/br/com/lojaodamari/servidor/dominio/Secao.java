package br.com.lojaodamari.servidor.dominio;

import jakarta.persistence.*;

// seção da loja
@Entity
@Table(name = "secao")
public class Secao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}
