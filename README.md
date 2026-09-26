# Cadência — site de portfólio e orçamento

Site de Leonardo de Souza Marcos (LM) para apresentar serviços e receber pedidos de orçamento.

## Estrutura

```
index.html          página única do site
css/styles.css       estilos
js/script.js          menu mobile, animações de entrada e o botão de orçamento via WhatsApp
assets/projetos/      onde ficam as imagens dos projetos (veja o README.txt lá dentro)
```

## Ver o site no seu computador

Basta abrir o `index.html` duas vezes clicando nele — funciona sem precisar instalar nada.

## Editar textos e contatos

- WhatsApp: procure por `5511994608491` no `index.html` e no `js/script.js` e troque pelo seu número (padrão: DDI+DDD+número, só dígitos).
- E-mail: procure por `leo.marcos6440@gmail.com`.
- Instagram: no rodapé do `index.html`, procure por `Instagram (em breve)` — quando criar a conta, troque `href="#"` pelo link do perfil e apague `aria-disabled="true"` e `onclick="return false;"`.
- Projetos reais: veja a seção **Como subir as imagens dos projetos** abaixo.

## Como subir as imagens dos projetos

**Passo 1 — prepare a imagem**
Print de tela ou mockup do projeto, formato JPG ou PNG, de preferência na proporção 16:10 (ex: 1600×1000px). Se o arquivo for muito grande (+1MB), comprima antes em [squoosh.app](https://squoosh.app) ou [tinypng.com](https://tinypng.com) — o site carrega mais rápido.

**Passo 2 — coloque o arquivo na pasta certa**
Copie a imagem (arrastando pelo Explorador de Arquivos mesmo) para dentro de `assets/projetos/`. Dê um nome simples, sem espaço ou acento, ex: `loja-nova-estacao.jpg`.

**Passo 3 — edite o index.html**
Abra o `index.html` com o Bloco de Notas, VS Code ou outro editor de texto. Use Ctrl+F e procure por `imagem do projeto` — cada ocorrência é um card de projeto. Você vai ver um bloco assim:

```html
<div class="project-media">
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">...</svg>
  <span>imagem do projeto</span>
</div>
```

Apague o `<svg>` e o `<span>` e coloque sua imagem no lugar:

```html
<div class="project-media">
  <img src="assets/projetos/loja-nova-estacao.jpg" alt="Loja Nova Estação — site institucional">
</div>
```

**Passo 4 — atualize o texto do card**
Logo abaixo, no mesmo card, troque:
- `.project-tag` → categoria do projeto (ex: "Site institucional", "E-commerce", "Sistema para comércio")
- `<h3>Nome do projeto</h3>` → o nome real
- `<p>Breve descrição...</p>` → uma frase sobre o que foi entregue

Repita os passos 1 a 4 para cada projeto que quiser adicionar. Se precisar de mais cards além dos 4 que já existem, copie um bloco `<div class="project-card reveal">...</div>` inteiro (incluindo a tag de abertura e fechamento) e cole logo depois de um existente, dentro da `<div class="grid-2">`.

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
