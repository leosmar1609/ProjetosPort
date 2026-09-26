-- estrutura inicial do banco. o Flyway roda isso uma vez e anota que já rodou
-- (escrito pra funcionar igual no MySQL e no H2 em modo MySQL, que é o que os testes usam)

-- quem usa o sistema. a senha fica só como hash BCrypt
CREATE TABLE usuario (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  login VARCHAR(30) NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL,
  perfil VARCHAR(20) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL
);

-- seções da loja (Mercearia, Açougue...)
CREATE TABLE secao (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE fornecedor (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(120),
  prazo_entrega_dias INT NOT NULL DEFAULT 2
);

-- produto. estoque_atual pode ficar negativo quando vende mais do que o sistema tinha (vira ruptura pra conferir)
-- versao é o controle de concorrência: dois caixas mexendo no mesmo produto ao mesmo tempo não se atropelam
CREATE TABLE produto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  ean VARCHAR(13) UNIQUE,
  plu VARCHAR(5) UNIQUE,
  unidade VARCHAR(2) NOT NULL,
  secao_id BIGINT NOT NULL,
  fornecedor_id BIGINT,
  producao_propria BOOLEAN NOT NULL DEFAULT FALSE,
  preco_venda DECIMAL(12,2) NOT NULL,
  preco_promocional DECIMAL(12,2),
  promocao_inicio DATE,
  promocao_fim DATE,
  custo_medio DECIMAL(12,4) NOT NULL DEFAULT 0,
  estoque_atual DECIMAL(14,3) NOT NULL DEFAULT 0,
  estoque_minimo DECIMAL(14,3) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  versao INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_produto_secao FOREIGN KEY (secao_id) REFERENCES secao(id),
  CONSTRAINT fk_produto_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id)
);
CREATE INDEX idx_produto_nome ON produto(nome);

-- cada entrada vira um lote com validade própria. a venda consome primeiro o lote que vence antes
CREATE TABLE lote (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id BIGINT NOT NULL,
  quantidade_inicial DECIMAL(14,3) NOT NULL,
  saldo DECIMAL(14,3) NOT NULL,
  custo_unitario DECIMAL(12,4) NOT NULL,
  validade DATE,
  nota_fiscal VARCHAR(60),
  recebido_em TIMESTAMP NOT NULL,
  CONSTRAINT fk_lote_produto FOREIGN KEY (produto_id) REFERENCES produto(id)
);
CREATE INDEX idx_lote_produto_validade ON lote(produto_id, validade);

-- histórico de tudo que mexeu no estoque. quantidade positiva entra, negativa sai
CREATE TABLE movimento_estoque (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id BIGINT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  quantidade DECIMAL(14,3) NOT NULL,
  saldo_depois DECIMAL(14,3) NOT NULL,
  observacao VARCHAR(200),
  usuario_id BIGINT,
  venda_id BIGINT,
  data_hora TIMESTAMP NOT NULL,
  CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produto(id),
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);
CREATE INDEX idx_mov_produto_data ON movimento_estoque(produto_id, data_hora);

-- turno de um operador num caixa
CREATE TABLE sessao_caixa (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_caixa INT NOT NULL,
  operador_id BIGINT NOT NULL,
  status VARCHAR(10) NOT NULL,
  aberta_em TIMESTAMP NOT NULL,
  fechada_em TIMESTAMP,
  fundo_troco DECIMAL(12,2) NOT NULL,
  dinheiro_contado DECIMAL(12,2),
  CONSTRAINT fk_sessao_operador FOREIGN KEY (operador_id) REFERENCES usuario(id)
);
CREATE INDEX idx_sessao_status ON sessao_caixa(status);

-- sangria (tirou dinheiro da gaveta) e suprimento (colocou troco)
CREATE TABLE movimento_caixa (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sessao_id BIGINT NOT NULL,
  tipo VARCHAR(12) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  motivo VARCHAR(120),
  usuario_id BIGINT NOT NULL,
  autorizado_por_id BIGINT,
  data_hora TIMESTAMP NOT NULL,
  CONSTRAINT fk_movcaixa_sessao FOREIGN KEY (sessao_id) REFERENCES sessao_caixa(id)
);

-- venda. o número do cupom é o próprio id
CREATE TABLE venda (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sessao_id BIGINT NOT NULL,
  operador_id BIGINT NOT NULL,
  status VARCHAR(10) NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  troco DECIMAL(12,2) NOT NULL DEFAULT 0,
  cpf VARCHAR(11),
  iniciada_em TIMESTAMP NOT NULL,
  concluida_em TIMESTAMP,
  cancelada_por_id BIGINT,
  CONSTRAINT fk_venda_sessao FOREIGN KEY (sessao_id) REFERENCES sessao_caixa(id),
  CONSTRAINT fk_venda_operador FOREIGN KEY (operador_id) REFERENCES usuario(id)
);
CREATE INDEX idx_venda_status_data ON venda(status, concluida_em);

-- item do cupom. guardo preço e custo do momento da venda, assim a margem do relatório não muda
-- quando o preço do produto mudar depois
CREATE TABLE item_venda (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  venda_id BIGINT NOT NULL,
  sequencia INT NOT NULL,
  produto_id BIGINT NOT NULL,
  codigo VARCHAR(20),
  descricao VARCHAR(120) NOT NULL,
  unidade VARCHAR(2) NOT NULL,
  quantidade DECIMAL(14,3) NOT NULL,
  preco_unitario DECIMAL(12,2) NOT NULL,
  custo_unitario DECIMAL(12,4) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  promocao BOOLEAN NOT NULL DEFAULT FALSE,
  cancelado BOOLEAN NOT NULL DEFAULT FALSE,
  cancelado_por_id BIGINT,
  CONSTRAINT fk_item_venda FOREIGN KEY (venda_id) REFERENCES venda(id),
  CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES produto(id)
);
CREATE INDEX idx_item_venda ON item_venda(venda_id);

CREATE TABLE pagamento (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  venda_id BIGINT NOT NULL,
  forma VARCHAR(20) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES venda(id)
);
CREATE INDEX idx_pagamento_venda ON pagamento(venda_id);

-- pedido de compra pro fornecedor
CREATE TABLE pedido_compra (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fornecedor_id BIGINT NOT NULL,
  status VARCHAR(10) NOT NULL,
  criado_em TIMESTAMP NOT NULL,
  enviado_em TIMESTAMP,
  recebido_em TIMESTAMP,
  previsao_entrega DATE,
  nota_fiscal VARCHAR(60),
  criado_por_id BIGINT,
  CONSTRAINT fk_pedido_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id)
);

CREATE TABLE item_pedido (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT NOT NULL,
  produto_id BIGINT NOT NULL,
  quantidade DECIMAL(14,3) NOT NULL,
  custo_unitario DECIMAL(12,4) NOT NULL,
  quantidade_recebida DECIMAL(14,3) NOT NULL DEFAULT 0,
  CONSTRAINT fk_itemped_pedido FOREIGN KEY (pedido_id) REFERENCES pedido_compra(id),
  CONSTRAINT fk_itemped_produto FOREIGN KEY (produto_id) REFERENCES produto(id)
);
