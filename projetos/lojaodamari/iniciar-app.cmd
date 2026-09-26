@echo off
rem entra na pasta do projeto, assim funciona com clique duplo ou de qualquer terminal
cd /d "%~dp0"
rem abre o app desktop. ele liga o servidor da loja por dentro, não precisa abrir mais nada
set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
call .\mvnw.cmd -q install -DskipTests
call .\mvnw.cmd -q -pl desktop javafx:run
