-- Banco da Prazo API. Rode com: npm run criar-schema
CREATE DATABASE IF NOT EXISTS prazo_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prazo_api;

-- Chaves de API. Só o hash SHA-256 fica guardado; a chave em si aparece uma vez, na criação.
CREATE TABLE IF NOT EXISTS chaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  hash CHAR(64) NOT NULL UNIQUE,
  prefixo VARCHAR(12) NOT NULL,
  plano VARCHAR(20) NOT NULL DEFAULT 'gratis',
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chaves_email (email)
);

-- Uma linha por cliente por dia. "identificador" é "chave:<id>" ou "ip:<hash do IP>".
CREATE TABLE IF NOT EXISTS uso_diario (
  identificador VARCHAR(80) NOT NULL,
  dia DATE NOT NULL,
  total INT NOT NULL DEFAULT 0,
  PRIMARY KEY (identificador, dia)
);
