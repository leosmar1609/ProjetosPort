# Digitalle — site de portfólio e orçamento

Site de Leonardo de Souza Marcos (LM) para apresentar serviços e receber pedidos de orçamento.

## Estrutura

```
index.html            página única do site (+ a "página do projeto", que abre por cima)
css/styles.css        estilos
js/projetos.js        LISTA DOS PROJETOS: textos, imagens, galeria e demonstração de cada um
js/vitrine.js         monta os cards, os filtros e a página do projeto (não precisa mexer)
js/script.js          menu mobile, animações de entrada e o botão de orçamento via WhatsApp
assets/projetos/      capas e telas da galeria de cada projeto
demos/                versões de demonstração dos sistemas, que rodam direto no navegador
servir.mjs            servidorzinho para ver o site no seu computador
ver-site.cmd          abre o site em http://localhost:8080
```

## Ver o site no seu computador

Dê dois cliques em **`ver-site.cmd`**. Ele abre o navegador em http://localhost:8080 (deixe a janela
preta aberta enquanto estiver olhando; feche para parar).

> Abrir o `index.html` direto (duplo clique) mostra o site, mas as **demonstrações ao vivo** não
> funcionam assim: elas precisam ser servidas por http, como acontece quando o site está publicado.

## Editar textos e contatos

- WhatsApp: procure por `5511979934136` no `js/script.js` (usado no orçamento e no botão
  "Quero um projeto assim" de cada projeto).
- E-mail: procure por `leo.marcos6440@gmail.com`.
- Instagram: no rodapé do `index.html`, procure por `Instagram (em breve)`. Quando criar a conta, troque `href="#"` pelo link do perfil e apague `aria-disabled="true"` e `onclick="return false;"`.

## Projetos (cards + página de cada projeto)

Todos os projetos ficam em **`js/projetos.js`**. Cada bloco `{ ... }` vira um card na seção Projetos e
uma página que abre ao clicar, com endereço próprio (ex.: `seusite.com/#projeto/cristiano-barbearia`,
dá para mandar esse link direto para um cliente).

A página do projeto tem:
- **Ao vivo**: o sistema funcionando dentro de uma moldura de celular, totem ou navegador (campo `demo`);
- **Galeria**: carrossel com as telas e legendas (campo `galeria`);
- resumo, o desafio, o que entrega, tecnologias e o botão de WhatsApp.

**Adicionar um projeto:** copie um bloco inteiro em `js/projetos.js`, troque `slug` (sem espaço nem
acento), textos e imagens. A ordem da lista é a ordem dos cards. `tipo` define o filtro
(`site`, `desktop`, `analytics`, `api`). Projeto sem demonstração: apague o campo `demo` (fica só a galeria).

**Imagens:** coloque em `assets/projetos/<slug>/`, de preferência 1600×1000 (16:10), em WebP ou JPG
comprimido ([squoosh.app](https://squoosh.app)).

### Demonstrações ao vivo (`demos/`)

São os próprios sistemas, compilados num modo em que tudo roda no navegador com dados de exemplo
(nada vai para banco nenhum; o que o visitante faz fica só no navegador dele).

| Pasta | Projeto | Como gerar de novo (rodar dentro da pasta do projeto) |
|---|---|---|
| `demos/cristiano-barbearia` | Cristiano Barbearia | `$env:DEMO_OUT="$HOME/Desktop/PORT/demos/cristiano-barbearia"; npm run build:demo` |
| `demos/cristiano-analytics` | Cristiano Analytics | `$env:DEMO_OUT="$HOME/Desktop/PORT/demos/cristiano-analytics"; npm run build:demo` |
| `demos/lous-garden-totem` | Lou's Garden (totem) | `$env:DEMO_OUT="$HOME/Desktop/PORT/demos/lous-garden-totem"; npm run build:demo` |
| `demos/financas-analytics` | Painel Financeiro | `npm run build:demo` |

(Os comandos com `$env:` são para o PowerShell, o terminal padrão do VS Code no Windows.)

Login da demonstração do barbeiro: **demo / demo1234**. A página do projeto já entra sozinha.

## Publicar o site (deixar no ar, com link pra colocar no Instagram)

Qualquer uma dessas opções é gratuita:

**Netlify Drop (mais simples)**
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta inteira do projeto (com index.html, css, js, assets)
3. Pronto — você recebe um link público na hora (dá pra configurar um domínio próprio depois)

**GitHub Pages**
1. Crie um repositório no GitHub e suba estes arquivos
2. Nas configurações do repositório, ative "GitHub Pages" apontando pra branch principal
3. O site fica em `https://seu-usuario.github.io/nome-do-repositorio`

**Vercel**
1. Acesse https://vercel.com, crie uma conta
2. "Add New Project" → importe a pasta/repositório
3. Deploy automático, com link público

Depois de publicado, é só colocar o link na bio do Instagram.

> Publique o site **na raiz do domínio** (ex.: `digitalle.com.br` ou `algo.netlify.app`). A demonstração do
> Painel Financeiro espera estar em `/demos/financas-analytics`; no GitHub Pages com nome de repositório
> no endereço ela não abre (as outras funcionam).
