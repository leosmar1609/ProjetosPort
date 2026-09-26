@echo off
rem entra na pasta do projeto, assim funciona com clique duplo ou de qualquer terminal
cd /d "%~dp0"
rem gera o executável na pasta dist, com o Java e o servidor da loja dentro (roda em computador sem Java e sem MySQL):
rem   dist\LojaoDaMari\LojaoDaMari.exe   -> o sistema inteiro num programa só
rem   dist\LojaoDaMari.zip               -> a mesma pasta compactada, pronta pra copiar pra outro computador
setlocal
set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT

rem o jpackage vem com o JDK: procura no JAVA_HOME e depois na pasta padrão do JDK 25
set JPACKAGE=jpackage
if exist "%ProgramFiles%\Java\jdk-25\bin\jpackage.exe" set JPACKAGE="%ProgramFiles%\Java\jdk-25\bin\jpackage.exe"
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\jpackage.exe" set JPACKAGE="%JAVA_HOME%\bin\jpackage.exe"

echo [1/3] compilando...
call .\mvnw.cmd -q install -DskipTests || exit /b 1
if exist dist rmdir /s /q dist

echo [2/3] montando o executavel...
copy /y desktop\target\desktop-1.0.0.jar desktop\target\pacote\ >nul
%JPACKAGE% --type app-image --name LojaoDaMari --app-version 1.0.0 --vendor LojaoDaMari ^
  --description "Sistema do supermercado LojaoDaMari" --icon empacotamento\lojaodamari.ico ^
  --input desktop\target\pacote --main-jar desktop-1.0.0.jar --main-class br.com.lojaodamari.desktop.Iniciar ^
  --java-options "-Duser.timezone=America/Sao_Paulo" ^
  --dest dist
if not exist dist\LojaoDaMari\LojaoDaMari.exe (echo Falhou ao montar o executavel. & exit /b 1)

echo [3/3] compactando...
powershell -NoProfile -Command "Compress-Archive -Force -Path dist\LojaoDaMari -DestinationPath dist\LojaoDaMari.zip"

echo.
echo Pronto: dist\LojaoDaMari\LojaoDaMari.exe (e dist\LojaoDaMari.zip pra levar pra outro computador)
