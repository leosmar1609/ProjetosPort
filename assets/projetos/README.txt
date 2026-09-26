Coloque aqui as imagens (screenshots/mockups) dos seus projetos reais.

Formato recomendado:
- JPG ou PNG, proporção 16:10 (ex: 1600x1000px), até ~400kb cada (use squoosh.app ou tinypng.com pra comprimir).

Como usar cada imagem no site:
1. Salve o arquivo aqui, ex: assets/projetos/loja-nova-estacao.jpg
2. Abra o index.html, vá até a seção "projetos" (Ctrl+F por "imagem do projeto")
3. Em cada card, troque:

   <div class="project-media">
     <svg>...</svg>
     <span>imagem do projeto</span>
   </div>

   por:

   <div class="project-media">
     <img src="assets/projetos/loja-nova-estacao.jpg" alt="Loja Nova Estação — site institucional">
   </div>

4. Edite também o texto de .project-tag, o <h3> (nome do projeto) e o <p> (descrição) do mesmo card.
