@echo off
rem entra na pasta do projeto, assim funciona com clique duplo ou de qualquer terminal
cd /d "%~dp0"
rem sobe só o servidor, separado do app (o app já liga um servidor por dentro; isto é pra quando ele roda em outra máquina). sem parâmetro usa o MySQL; "iniciar-servidor.cmd h2" roda sem MySQL (banco num arquivo)
rem o trustStoreType faz o Java usar os certificados do Windows (resolve antivírus que inspeciona HTTPS, como o Kaspersky)
set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
call .\mvnw.cmd -q install -DskipTests
if "%1"=="h2" (
  java -jar servidor\target\servidor-1.0.0-exec.jar --spring.profiles.active=h2
) else (
  java -jar servidor\target\servidor-1.0.0-exec.jar
)
