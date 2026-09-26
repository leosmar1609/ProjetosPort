-- Rode este script inteiro no MySQL Workbench (botão do raio ⚡, ou Ctrl+Shift+Enter)
-- conectado no seu servidor local. Ele cria o banco "fisio_agendamento" e todas as tabelas.

CREATE DATABASE IF NOT EXISTS fisio_agendamento
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fisio_agendamento;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('fisio','paciente') NOT NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  problema_relatado TEXT,
  foto_url VARCHAR(255),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS codigos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  tipo ENUM('sessao_unica','pacote','continuo') NOT NULL,
  quantidade_sessoes INT NULL,
  validade DATE NULL,
  observacao TEXT,
  usado_por INT NULL,
  usado_em DATETIME NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codigos_usado_por FOREIGN KEY (usado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS disponibilidade_padrao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dia_semana TINYINT NOT NULL COMMENT '0=domingo ... 6=sábado',
  hora_inicio VARCHAR(5) NOT NULL,
  hora_fim VARCHAR(5) NOT NULL,
  duracao_minutos INT NOT NULL DEFAULT 50,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  hora VARCHAR(5) NOT NULL COMMENT 'formato HH:MM',
  duracao_minutos INT NOT NULL DEFAULT 50,
  status ENUM('livre','ocupado','bloqueado') NOT NULL DEFAULT 'livre',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_horarios_data_hora (data, hora)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  horario_id INT NOT NULL,
  codigo_id INT NOT NULL,
  numero_sessao INT NOT NULL,
  status ENUM('agendada','concluida','cancelada') NOT NULL DEFAULT 'agendada',
  lembrete_24h_enviado_em DATETIME NULL,
  lembrete_1h_enviado_em DATETIME NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessoes_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_sessoes_horario FOREIGN KEY (horario_id) REFERENCES horarios(id),
  CONSTRAINT fk_sessoes_codigo FOREIGN KEY (codigo_id) REFERENCES codigos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mensagens_contato (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(30),
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
