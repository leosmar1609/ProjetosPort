# Ferramentas de mockup para o portfólio

Kit usado pra gerar os prints "bonitos" (com moldura de navegador ou janela, fundo suave e a
assinatura "digitalle") que entram nos cards de projeto do site. Guardado aqui pra reusar
quando você tiver projetos reais pra fotografar.

## Site ou sistema web

1. Tire a screenshot da página (precisa do Microsoft Edge instalado):
   ```
   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=1600,1000 --screenshot="C:\caminho\screenshot.png" "file:///C:/caminho/para/seu/site/index.html"
   ```
   (pode ser um arquivo local com `file:///...` ou uma URL publicada, `https://...`)

2. Copie `presentation-site.html` pra uma pasta de trabalho, junto com o `screenshot.png` gerado.

3. Edite no `presentation-site.html`:
   - `<b>Nome do projeto</b>` e a categoria acima
   - o texto dentro de `.url-pill` (o "endereço" que aparece na barra do navegador)

4. Gere a versão final:
   ```
   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=1600,1000 --screenshot="C:\caminho\final.png" "file:///C:/caminho/de/trabalho/presentation-site.html"
   ```

5. Copie o `final.png` pra `assets/projetos/` do site principal e aponte o card pra ele.

## App desktop (Java/Swing)

1. Compile o app normalmente (`compilar.bat` dentro do projeto do app).

2. Compile o `CapturarPrint.java` (deste kit) contra as classes já compiladas do app:
   ```
   javac -cp "C:\caminho\do\app\bin" -d . CapturarPrint.java
   ```
   > Esse utilitário assume um app com uma classe `JanelaPrincipal` no pacote raiz do projeto
   > (é como o VendaClara é organizado). Ajuste o import no topo do `CapturarPrint.java` se o
   > seu projeto usar outro nome de pacote/classe.

3. Rode, apontando pro arquivo de saída:
   ```
   java -cp ".;C:\caminho\do\app\bin" CapturarPrint "C:\caminho\screenshot.png"
   ```
   Isso abre o app de verdade por um instante, tira a foto da janela real (com a decoração do
   Windows) e fecha sozinho.

4. Se sobrar alguma sujeira/artefato na borda da imagem, corte alguns pixels com:
   ```
   powershell -ExecutionPolicy Bypass -File crop.ps1 -InputPath "screenshot.png" -OutputPath "screenshot-limpo.png" -Left 3 -Top 3 -Right 8 -Bottom 3
   ```

5. Copie `presentation-app.html` pra sua pasta de trabalho junto com a screenshot, edite o nome/
   categoria do projeto e o `src` da imagem, e gere a versão final do mesmo jeito do passo 4 do
   fluxo de sites acima.

## Dica

Os dois templates usam janela de 1600×1000 (proporção 16:10), que é o mesmo formato dos slots
de imagem nos cards de projeto do site (`.project-media`). Gerando nesse tamanho, a imagem final
encaixa sem cortar nem esticar.
