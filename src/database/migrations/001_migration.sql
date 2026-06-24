-- =====================================================================
-- Migration: criação do schema completo (PostgreSQL)
-- Inclui normalização de tipos/graus de risco e seed dos setores IPT.
-- Ordem respeita dependências de FK. Para reverter, use o bloco DOWN.
-- =====================================================================

-- ============================= UP ====================================

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SETOR / RISCO
-- =====================================================================

CREATE TABLE setor (
    id                SERIAL PRIMARY KEY,
    codigo_setor      VARCHAR(30) NOT NULL,
    numero_moradias   INTEGER     NOT NULL DEFAULT 0,
    endereco          TEXT,
    bairro            VARCHAR(120),
    denominacao       VARCHAR(180),
    observacao        TEXT,
    ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_setor_codigo_setor UNIQUE (codigo_setor),
    CONSTRAINT ck_setor_numero_moradias CHECK (numero_moradias >= 0)
);

CREATE TABLE tipo_risco (
    id             SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    descricao      TEXT,
    ativo          BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_tipo_risco_nome UNIQUE (nome)
);

CREATE TABLE grau_risco (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(10)  NOT NULL,
    nome            VARCHAR(100) NOT NULL,
    ordem_exibicao  SMALLINT,
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_grau_risco_codigo UNIQUE (codigo),
    CONSTRAINT uq_grau_risco_nome UNIQUE (nome)
);

CREATE TABLE setor_tipo_risco (
    id              SERIAL PRIMARY KEY,
    id_setor        INTEGER   NOT NULL,
    id_tipo_risco   INTEGER   NOT NULL,
    id_grau_risco   INTEGER   NOT NULL,
    observacao      TEXT,
    ativo           BOOLEAN   NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_setor_tipo_risco_setor
        FOREIGN KEY (id_setor)
        REFERENCES setor(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_setor_tipo_risco_tipo_risco
        FOREIGN KEY (id_tipo_risco)
        REFERENCES tipo_risco(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_setor_tipo_risco_grau_risco
        FOREIGN KEY (id_grau_risco)
        REFERENCES grau_risco(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_setor_tipo_risco UNIQUE (id_setor, id_tipo_risco)
);

CREATE TRIGGER trg_setor_atualizado_em
BEFORE UPDATE ON setor
FOR EACH ROW
EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_tipo_risco_atualizado_em
BEFORE UPDATE ON tipo_risco
FOR EACH ROW
EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_grau_risco_atualizado_em
BEFORE UPDATE ON grau_risco
FOR EACH ROW
EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_setor_tipo_risco_atualizado_em
BEFORE UPDATE ON setor_tipo_risco
FOR EACH ROW
EXECUTE FUNCTION set_atualizado_em();

COMMENT ON TABLE setor IS 'Setores do Plano Municipal de Redução de Riscos importados da planilha IPT.';
COMMENT ON TABLE tipo_risco IS 'Domínio de tipos/processos de risco.';
COMMENT ON TABLE grau_risco IS 'Domínio de graus de risco.';
COMMENT ON TABLE setor_tipo_risco IS 'Associação N:N entre setor, tipo de risco e grau de risco.';

-- =====================================================================
-- DEMAIS ENTIDADES
-- =====================================================================

CREATE TABLE casa (
    id               SERIAL PRIMARY KEY,
    id_setor         INTEGER       NOT NULL,
    coordenada_lat   DECIMAL(10,7) NOT NULL,
    coordenada_long  DECIMAL(10,7) NOT NULL,
    -- Endereco canonico da residencia. Os campos sao obrigatorios porque
    -- compoem a identidade da casa usada na prevencao de duplicidades.
    logradouro       VARCHAR(255) NOT NULL,
    numero           VARCHAR(20)  NOT NULL,
    observacao       VARCHAR(255),
    bairro           VARCHAR(120) NOT NULL,
    cep              VARCHAR(9),
    tipo_construcao  VARCHAR(20) CHECK (tipo_construcao IN ('Madeira','Alvenaria','Misto')),
    uso_imovel       VARCHAR(20) CHECK (uso_imovel IN ('Residencial','Comercial','Misto')),
    status_imovel    VARCHAR(20) CHECK (status_imovel IN ('Sadio','Interditado','Destruido')),
    data_interdicao  DATE,

    CONSTRAINT fk_casa_setor
        FOREIGN KEY (id_setor)
        REFERENCES setor(id),

    -- Uma casa e identificada pelo setor e endereco normalizado pelo backend.
    -- CEP fica fora da chave pois pode nao estar disponivel no atendimento.
    CONSTRAINT uq_casa_endereco UNIQUE (id_setor, bairro, logradouro, numero)
);

CREATE TABLE cadastrador (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(150) NOT NULL,
    documento  VARCHAR(50)  NOT NULL,
    email      VARCHAR(150),

    CONSTRAINT uq_cadastrador_documento UNIQUE (documento)
);

CREATE UNIQUE INDEX uq_cadastrador_email_lower
    ON cadastrador (LOWER(email));

-- nucleo_familiar referencia casa e, depois, individuo via id_chefe_familia.
-- id_chefe_familia é NULL para permitir o cadastro inicial: cria-se o núcleo,
-- depois os indivíduos, e por fim define-se o chefe.
CREATE TABLE nucleo_familiar (
    id                          SERIAL PRIMARY KEY,
    nome_nucleo                 VARCHAR(150) NOT NULL,
    id_casa                     INTEGER      NOT NULL,
    id_cadastrador              INTEGER,
    id_chefe_familia            INTEGER,
    observacao                  VARCHAR(255),
    tempo_residencia_domicilio  INTEGER,
    tempo_residencia_area       INTEGER,
    tempo_residencia_municipio  INTEGER,
    renda_familiar_total        DECIMAL(12,2),

    CONSTRAINT fk_nucleo_casa
        FOREIGN KEY (id_casa)
        REFERENCES casa(id),

    CONSTRAINT fk_nucleo_cadastrador
        FOREIGN KEY (id_cadastrador)
        REFERENCES cadastrador(id)
);

CREATE TABLE individuo (
    id                    SERIAL PRIMARY KEY,
    id_nucleo_familiar    INTEGER      NOT NULL,
    nome_completo         VARCHAR(200) NOT NULL,
    apelido               VARCHAR(100),
    nome_social           VARCHAR(200),
    data_nascimento       DATE,
    genero                VARCHAR(20) CHECK (genero IN ('Masculino','Feminino','Outro')),
    cor_raca              VARCHAR(20) CHECK (cor_raca IN ('Branco','Preto','Pardo','Amarelo','Indigena')),
    uf                    CHAR(2),
    estado_civil          VARCHAR(20) CHECK (estado_civil IN ('Solteiro','Casado','Viuvo','Divorciado')),
    profissao             VARCHAR(120),
    nome_mae              VARCHAR(200),
    nome_pai              VARCHAR(200),
    grau_parentesco       VARCHAR(50),
    escolaridade          VARCHAR(60),
    situacao_ocupacional  VARCHAR(60),
    -- CPF/NIS sao opcionais: a ausencia de documento nunca impede o cadastro.
    -- Quando informados, o banco e a fonte de verdade para sua unicidade,
    -- inclusive sob requisicoes concorrentes.
    cpf                   VARCHAR(11),
    doc_estrangeiro       VARCHAR(50),
    rg                    VARCHAR(20),
    nis                   VARCHAR(11),
    telefone              VARCHAR(20),
    email                 VARCHAR(150),
    status_vital          VARCHAR(20) NOT NULL CHECK (status_vital IN ('Vivo','Obito','Desaparecido')),
    data_obito            DATE,
    semanas_gestacao      INTEGER,

    CONSTRAINT fk_individuo_nucleo
        FOREIGN KEY (id_nucleo_familiar)
        REFERENCES nucleo_familiar(id),

    CONSTRAINT uq_individuo_cpf UNIQUE (cpf),
    CONSTRAINT uq_individuo_nis UNIQUE (nis),
    CONSTRAINT ck_individuo_cpf_formato
        CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_individuo_nis_formato
        CHECK (nis IS NULL OR nis ~ '^[0-9]{11}$')
);

-- Agora que individuo existe, adiciona a FK do chefe no núcleo.
ALTER TABLE nucleo_familiar
    ADD CONSTRAINT fk_nucleo_chefe
    FOREIGN KEY (id_chefe_familia)
    REFERENCES individuo(id);

-- Uma mesma pessoa responsavel nao pode abrir dois nucleos para a mesma casa.
-- NULL continua permitido durante o fluxo de criacao, antes de definir o chefe.
ALTER TABLE nucleo_familiar
    ADD CONSTRAINT uq_nucleo_casa_chefe
    UNIQUE (id_casa, id_chefe_familia);

CREATE TABLE pet (
    id                  SERIAL PRIMARY KEY,
    id_nucleo_familiar  INTEGER NOT NULL,
    tipo                VARCHAR(50),
    porte               VARCHAR(50),
    imagem              VARCHAR(255),
    quantidade          INTEGER,

    CONSTRAINT fk_pet_nucleo
        FOREIGN KEY (id_nucleo_familiar)
        REFERENCES nucleo_familiar(id)
);

CREATE TABLE vulnerabilidade (
    id                    SERIAL PRIMARY KEY,
    tipo_vulnerabilidade  VARCHAR(50) NOT NULL,

    CONSTRAINT uq_vulnerabilidade_tipo UNIQUE (tipo_vulnerabilidade),
    CONSTRAINT ck_vulnerabilidade_tipo CHECK (
        tipo_vulnerabilidade IN (
            'Idoso',
            'Gestante',
            'PCD',
            'Lactante',
            'DoencaCronica',
            'Crianca'
        )
    )
);

CREATE TABLE individuo_vulnerabilidade (
    id_individuo        INTEGER NOT NULL,
    id_vulnerabilidade  INTEGER NOT NULL,

    PRIMARY KEY (id_individuo, id_vulnerabilidade),

    CONSTRAINT fk_iv_individuo
        FOREIGN KEY (id_individuo)
        REFERENCES individuo(id),

    CONSTRAINT fk_iv_vulnerabilidade
        FOREIGN KEY (id_vulnerabilidade)
        REFERENCES vulnerabilidade(id)
);

-- Registra a chave de uma tentativa de envio para que o frontend nao crie
-- outro cadastro ao repetir a mesma requisicao.
CREATE TABLE cadastro_requisicao (
    id                  UUID PRIMARY KEY,
    id_cadastrador      INTEGER NOT NULL,
    nucleo_familiar_id  INTEGER,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cadastro_requisicao_cadastrador
        FOREIGN KEY (id_cadastrador)
        REFERENCES cadastrador(id),

    CONSTRAINT fk_cadastro_requisicao_nucleo
        FOREIGN KEY (nucleo_familiar_id)
        REFERENCES nucleo_familiar(id)
);

-- =====================================================================
-- ÍNDICES
-- =====================================================================

CREATE INDEX idx_setor_bairro
    ON setor(bairro);

CREATE INDEX idx_setor_denominacao
    ON setor(denominacao);

CREATE INDEX idx_setor_tipo_risco_setor
    ON setor_tipo_risco(id_setor);

CREATE INDEX idx_setor_tipo_risco_tipo_risco
    ON setor_tipo_risco(id_tipo_risco);

CREATE INDEX idx_setor_tipo_risco_grau_risco
    ON setor_tipo_risco(id_grau_risco);

CREATE INDEX idx_casa_setor
    ON casa(id_setor);

CREATE INDEX idx_nucleo_casa
    ON nucleo_familiar(id_casa);

CREATE INDEX idx_nucleo_cadastrador
    ON nucleo_familiar(id_cadastrador);

CREATE INDEX idx_nucleo_chefe_familia
    ON nucleo_familiar(id_chefe_familia);

CREATE INDEX idx_individuo_nucleo
    ON individuo(id_nucleo_familiar);

CREATE INDEX idx_pet_nucleo
    ON pet(id_nucleo_familiar);

CREATE INDEX idx_cadastro_requisicao_cadastrador
    ON cadastro_requisicao(id_cadastrador);

-- =====================================================================
-- SEEDS: domínios de risco
-- =====================================================================

-- Identidade unica do ambiente de demonstracao. A senha pertence apenas ao
-- provedor de autenticacao/mock, nunca a esta tabela.
INSERT INTO cadastrador (nome, documento, email) VALUES
    ('Agente de Campo (Mock)', '000.000-0', 'agente@georisco.sp.gov.br')
ON CONFLICT (documento) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email;

INSERT INTO vulnerabilidade (tipo_vulnerabilidade) VALUES
    ('Idoso'),
    ('Gestante'),
    ('PCD'),
    ('Lactante'),
    ('DoencaCronica'),
    ('Crianca')
ON CONFLICT (tipo_vulnerabilidade) DO NOTHING;

INSERT INTO tipo_risco (nome, descricao) VALUES
    ('Deslizamento', 'Processo de instabilidade ou movimentação de massa em encosta.'),
    ('Enxurrada', 'Processo associado a escoamento superficial intenso.'),
    ('Solapamento de margem', 'Processo de erosão ou instabilidade de margem.')
ON CONFLICT (nome) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    ativo = TRUE,
    atualizado_em = CURRENT_TIMESTAMP;

INSERT INTO grau_risco (codigo, nome, ordem_exibicao) VALUES
    ('SM', 'Setor de Monitoramento-SM', 1),
    ('R3', 'Risco Alto-R3', 3),
    ('R4', 'Risco Muito Alto-R4', 4)
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    ordem_exibicao = EXCLUDED.ordem_exibicao,
    ativo = TRUE,
    atualizado_em = CURRENT_TIMESTAMP;

-- =====================================================================
-- SEED: setores documentados na planilha IPT
-- Fonte: Plan1, linhas 4 a 90.
-- Quando o processo vem composto, como 'Deslizamento/Enxurrada',
-- a migration cria um vínculo para cada tipo de risco no mesmo setor.
-- =====================================================================

WITH dados (
    codigo_setor,
    processo,
    grau_risco,
    numero_moradias,
    endereco,
    bairro,
    denominacao
) AS (
    VALUES
    ('STA-A1-01', 'Deslizamento', 'Risco Alto-R3', 112, 'Rua Pintassilva', 'Parque Miami', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-02', 'Deslizamento', 'Risco Alto-R3', 44, 'Rua Cassioporé', 'Parque Miami', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-03', 'Deslizamento', 'Risco Alto-R3', 249, 'Rua Upariquera', 'Parque Miami', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-04', 'Deslizamento', 'Risco Alto-R3', 47, 'Rua Rio Oiapoque', 'Parque Miami', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-05', 'Deslizamento', 'Risco Alto-R3', 6, 'Rua Rio Vermelho', 'Jardim Riviera', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-06', 'Deslizamento', 'Setor de Monitoramento-SM', 3785, 'Estrada do Pedroso, Rua Rio Oiapoque, Rua Rio Jaguaribe', 'Parque Miami/Jardim Riviera', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A1-07', 'Deslizamento', 'Risco Muito Alto-R4', 68, 'Rua Rio Oiapoque', 'Parque Miami', 'Pq. Pedroso - Pq. Miami - Jd. Riviera'),
    ('STA-A2-01', 'Deslizamento', 'Setor de Monitoramento-SM', 179, 'Rua Tatupeba, Rua Jacaretinga', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Tatupeba'),
    ('STA-A3-01', 'Deslizamento/Enxurrada', 'Setor de Monitoramento-SM', 1133, 'Rua Flamingo, Rua Peixe Boi, Rua Cervo do Pantanal', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cervo do Pantanal'),
    ('STA-A3-02', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 62, 'Rua Arara Azul', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cervo do Pantanal'),
    ('STA-A3-03', 'Enxurrada', 'Risco Alto-R3', 1, 'Rua Arara Azul', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cervo do Pantanal'),
    ('STA-A3-04', 'Deslizamento', 'Risco Muito Alto-R4', 2, 'Rua Arara Azul', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cervo do Pantanal'),
    ('STA-A4-A1', 'Deslizamento', 'Setor de Monitoramento-SM', 520, 'Rua Maracajá, Rua Macaco Prego', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Maracajá'),
    ('STA-A4-02', 'Deslizamento', 'Risco Alto-R3', 4, 'Rua Calimico', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Maracajá'),
    ('STA-A5-01', 'Deslizamento', 'Setor de Monitoramento-SM', 525, 'Rua Boto Cachimbo, Rua Gavião Real', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Jubarte'),
    ('STA-A6-01', 'Deslizamento', 'Setor de Monitoramento-SM', 503, 'Rua Garça Branca, Rua Maritaca e Rua Pavão', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cuitelão'),
    ('STA-A6-02', 'Deslizamento', 'Risco Alto-R3', 46, 'Rua Cuitelão', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cuitelão'),
    ('STA-A6-03', 'Deslizamento', 'Risco Alto-R3', 2, 'Rua Paturi', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Cuitelão'),
    ('STA-A7-01', 'Deslizamento', 'Setor de Monitoramento-SM', 1071, 'Rua Harpia, Rua Jacutinga, Rua Sanhaço, Rua Condor', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Harpia'),
    ('STA-A7-02', 'Deslizamento', 'Risco Alto-R3', 8, 'Rua Pavão', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Harpia'),
    ('STA-A7-03', 'Deslizamento', 'Risco Alto-R3', 2, 'Rua Sanhaço', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Harpia'),
    ('STA-A7-04', 'Deslizamento', 'Risco Alto-R3', 2, 'Rua Sanhaço', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Harpia'),
    ('STA-A8-01', 'Deslizamento', 'Setor de Monitoramento-SM', 792, 'Rua Sagui da Serra, Rua Pintassilgo, Rua Jaguatirica', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Sagui da Serra'),
    ('STA-A8-02', 'Deslizamento', 'Risco Alto-R3', 4, 'Rua Sagui da Serra', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Sagui da Serra'),
    ('STA-A8-03', 'Deslizamento', 'Risco Alto-R3', 3, 'Rua Jaguatirica', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Sagui da Serra'),
    ('STA-A8-04', 'Deslizamento', 'Risco Alto-R3', 2, 'Rua Bicudo', 'Recreio da Borda do Campo', 'Recreio da Borda do Campo - R. Sagui da Serra'),
    ('STA-B1-01', 'Deslizamento', 'Setor de Monitoramento-SM', 2223, 'Rua Quaresmeira, Rua Tipuana, Rua Caboatã', 'Jardim Irene', 'Jardim Irene'),
    ('STA-B1-02', 'Deslizamento', 'Risco Alto-R3', 5, 'Rua Vasco da Gama', 'Jardim Irene', 'Jardim Irene'),
    ('STA-B1-03', 'Deslizamento', 'Risco Muito Alto-R4', 17, 'Rua Cajá', 'Jardim Irene', 'Jardim Irene'),
    ('STA-B1-04', 'Deslizamento', 'Risco Alto-R3', 45, 'Rua Ypê Branco, Rua Brejaúva', 'Jardim Irene', 'Jardim Irene'),
    ('STA-B1-05', 'Deslizamento', 'Risco Muito Alto-R4', 14, 'Rua Brejaúva, Rua Caminho dos Vianas', 'Jardim Irene', 'Jardim Irene'),
    ('STA-B2-01', 'Deslizamento', 'Setor de Monitoramento-SM', 338, 'Rua Ramalho Ortigão, Avenida Maurício de Medeiros', 'Jardim Irene', 'Jd. Irene – R. Romano Tognato'),
    ('STA-B2-02', 'Deslizamento', 'Risco Alto-R3', 49, 'Avenida Maurício de Medeiros', 'Jardim Irene', 'Jd. Irene – R. Romano Tognato'),
    ('STA-B3-01', 'Deslizamento', 'Setor de Monitoramento-SM', 905, 'Rua João de Barros, Rua Eucalipto, Rua Arco Íris', 'Cata Preta', 'Cata Preta'),
    ('STA-B3-02', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 983, 'Rua do Lago, Rua Eucalipto, Rua da Maré', 'Cata Preta', 'Cata Preta'),
    ('STA-B4-01', 'Deslizamento', 'Setor de Monitoramento-SM', 109, 'Rua Nossa Senhora das Graças', 'Sítio dos Vianas', 'Sítio das Vianas'),
    ('STA-B4-02', 'Deslizamento', 'Risco Alto-R3', 2, 'Rua Nossa Senhora das Graças', 'Sítio dos Vianas', 'Sítio das Vianas'),
    ('STA-C1-01', 'Enxurrada', 'Risco Muito Alto-R4', 94, 'Rua dos Missionários, Rua Toledana', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-02', 'Deslizamento', 'Setor de Monitoramento-SM', 1370, 'Rua Renascer, Rua Tropical, Rua da Praça, Rua da Glória', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-03', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 10, 'Rua dos Missionários', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-04', 'Deslizamento', 'Risco Alto-R3', 199, 'Rua dos Missionários', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-05', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 64, 'Rua Renascer', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-06', 'Deslizamento', 'Risco Alto-R3', 26, 'Travessa da Rua Nova Sião', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-07', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 29, 'Rua Paradiso', 'Jardim Santo André', 'Missionários'),
    ('STA-C1-08', 'Deslizamento', 'Risco Muito Alto-R4', 55, 'Rua dos Missionários', 'Jardim Santo André', 'Missionários'),
    ('STA-C2-01', 'Deslizamento/Enxurrada', 'Setor de Monitoramento-SM', 73, 'Rua Cazuza', 'Jardim Santo André', 'Cruzados – Núcleo Pulmão'),
    ('STA-C2-02', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 36, 'Rua Tom Jobim', 'Jardim Santo André', 'Cruzados – Núcleo Pulmão'),
    ('STA-C3-01', 'Deslizamento', 'Setor de Monitoramento-SM', 192, 'Rua Beth Carvalho, Rua São José', 'Jardim Santo André', 'Cruzados II'),
    ('STA-C3-02', 'Deslizamento', 'Risco Alto-R3', 610, 'Rua da Paz, Rua São José', 'Jardim Santo André', 'Cruzados II'),
    ('STA-C4-01', 'Deslizamento', 'Setor de Monitoramento-SM', 66, 'Rua dos Missionários', 'Jardim Santo André', 'Rua Beth Carvalho – Missionários'),
    ('STA-C4-02', 'Deslizamento', 'Risco Muito Alto-R4', 155, 'Rua dos Campineiros, Rua dos Maronitas, Rua Beth Carvalho', 'Jardim Santo André', 'Rua Beth Carvalho – Missionários'),
    ('STA-D1-01', 'Deslizamento', 'Risco Alto-R3', 64, 'Rua dos Dominicanos', 'Jardim Santo André', 'Jd. Santo André'),
    ('STA-D1-02', 'Deslizamento', 'Setor de Monitoramento-SM', 95, 'Rua Cruz de Malta, Rua dos Dominicanos', 'Jardim Santo André', 'Jd. Santo André'),
    ('STA-D2-01', 'Deslizamento', 'Setor de Monitoramento-SM', 167, 'Rua Lamartine, Rua Dezesseis', 'Condominio Maracanã', 'Lamartine'),
    ('STA-D2-02', 'Deslizamento', 'Risco Alto-R3', 170, 'Rua Lamartine', 'Condominio Maracanã', 'Lamartine'),
    ('STA-D2-03', 'Deslizamento', 'Risco Alto-R3', 35, 'Rua Dezesseis', 'Condominio Maracanã', 'Lamartine'),
    ('STA-D2-04', 'Deslizamento', 'Risco Muito Alto-R4', 6, 'Rua Dezesseis', 'Condominio Maracanã', 'Lamartine'),
    ('STA-D2-05', 'Enxurrada', 'Risco Alto-R3', 18, 'Rua Dezesseis', 'Condominio Maracanã', 'Lamartine'),
    ('STA-D3-01', 'Solapamento de margem', 'Setor de Monitoramento-SM', 24, 'Rua Hamurabi', 'Vila Suiça', 'Vila Suíça'),
    ('STA-D3-02', 'Deslizamento', 'Risco Alto-R3', 5, 'Rua Barão de Loreto', 'Condominio Maracanã', 'Vila Suíça'),
    ('STA-D3-03', 'Deslizamento', 'Setor de Monitoramento-SM', 681, 'Rua Hamurabi, Rua Nautilus', 'Vila Suiça', 'Vila Suíça'),
    ('STA-D4-01', 'Deslizamento', 'Setor de Monitoramento-SM', 244, 'Rua Gregório de matos, Rua Serra da Canastra', 'Condominio Maracanã', 'Condomínio Maracanã'),
    ('STA-D4-02', 'Deslizamento', 'Risco Alto-R3', 8, 'Rua Gregório de matos', 'Condominio Maracanã', 'Condomínio Maracanã'),
    ('STA-D5-01', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 137, 'Rua Maria José Stein', 'Condominio Maracanã', 'Vista Alegre – Kibon'),
    ('STA-D5-02', 'Deslizamento/Enxurrada', 'Setor de Monitoramento-SM', 2229, 'Rua do Porto, Rua Luiz A. Lamouche Barbosa, Rua Gilvan F. de Moraes', 'Condominio Maracanã', 'Vista Alegre – Kibon'),
    ('STA-D5-03', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 100, 'Rua Maria José da Silva', 'Condominio Maracanã', 'Vista Alegre – Kibon'),
    ('STA-D5-04', 'Deslizamento/Enxurrada', 'Risco Muito Alto-R4', 59, 'Rua Oswaldo Silva', 'Condominio Maracanã', 'Vista Alegre – Kibon'),
    ('STA-D6-01', 'Deslizamento', 'Setor de Monitoramento-SM', 13, 'Rua Benedito Calixto, Rua Candido Mota', 'Condominio Maracanã', 'Jd. Carla'),
    ('STA-D6-02', 'Deslizamento', 'Risco Alto-R3', 3, 'Rua Campos Negreiros', 'Condominio Maracanã', 'Jd. Carla'),
    ('STA-D7-01', 'Deslizamento', 'Setor de Monitoramento-SM', 397, 'Rua Alberto Zirlis', 'Vila Lutécia', 'Alberto Zirlis'),
    ('STA-D7-02', 'Deslizamento', 'Risco Alto-R3', 25, 'Rua Alberto Zirlis', 'sem localização', 'Alberto Zirlis'),
    ('STA-D7-03', 'Deslizamento/Enxurrada', 'Risco Alto-R3', 10, 'Rua Alberto Zirlis', 'sem localização', 'Alberto Zirlis'),
    ('STA-D7-04', 'Deslizamento', 'Risco Alto-R3', 35, 'Rua Alberto Zirlis', 'sem localização', 'Alberto Zirlis'),
    ('STA-D7-05', 'Deslizamento', 'Risco Alto-R3', 10, 'Rua Alberto Zirlis, Rua Lutécia', 'Vila Lutécia', 'Alberto Zirlis'),
    ('STA-E1-01', 'Deslizamento', 'Risco Alto-R3', 20, 'Rua Pernambuco', 'Cidade São Jorge', 'Espírito Santo'),
    ('STA-E1-02', 'Deslizamento', 'Risco Alto-R3', 29, 'Rua Pernambuco', 'Cidade São Jorge', 'Espírito Santo'),
    ('STA-E1-03', 'Deslizamento', 'Risco Muito Alto-R4', 1, 'Rua Pernambuco', 'Cidade São Jorge', 'Espírito Santo'),
    ('STA-E1-04', 'Deslizamento', 'Setor de Monitoramento-SM', 140, 'Rua Pernambuco', 'Cidade São Jorge', 'Espírito Santo'),
    ('STA-E2-01', 'Deslizamento', 'Setor de Monitoramento-SM', 23, 'Rua Tarumã', 'Jardim Alzira Franco', 'Jd. Alzira Franco II'),
    ('STA-E2-02', 'Deslizamento', 'Setor de Monitoramento-SM', 21, 'Rua Verde Mar', 'Jardim Alzira Franco', 'Jd. Alzira Franco II'),
    ('STA-E2-03', 'Deslizamento', 'Risco Alto-R3', 4, 'Rua Malaia', 'Jardim Alzira Franco', 'Jd. Alzira Franco II'),
    ('STA-E3-01', 'Deslizamento', 'Setor de Monitoramento-SM', 84, 'Avenida Marginal Córrego Taióca', 'Jardim Las Vegas', 'Jd. Cristiane'),
    ('STA-E3-02', 'Solapamento de margem', 'Risco Alto-R3', 47, 'Avenida Marginal Córrego Taióca', 'Jardim Las Vegas', 'Jd. Cristiane'),
    ('STA-F1-01', 'Deslizamento', 'Setor de Monitoramento-SM', 99, 'Rua José Carlos Pace, Rua Valeriano Correia Gonçalves', 'Recreio da Borda do Campo', 'Chácara Carreira'),
    ('STA-F1-02', 'Deslizamento', 'Risco Alto-R3', 1, 'Rua José Carlos Pace', 'Chácara Carreira', 'Chácara Carreira'),
    ('STA-F1-03', 'Deslizamento', 'Risco Alto-R3', 6, 'Rua José Carlos Pace', 'Chácara Carreira', 'Chácara Carreira'),
    ('STA-F2-01', 'Deslizamento', 'Setor de Monitoramento-SM', 29, 'Rua Rabique, Travessa Alto da Serra', 'Recreio da Borda do Campo', 'Paranapiacaba')
),
upsert_setor AS (
    INSERT INTO setor (
        codigo_setor,
        numero_moradias,
        endereco,
        bairro,
        denominacao
    )
    SELECT
        codigo_setor,
        numero_moradias,
        endereco,
        bairro,
        denominacao
    FROM dados
    ON CONFLICT (codigo_setor) DO UPDATE SET
        numero_moradias = EXCLUDED.numero_moradias,
        endereco = EXCLUDED.endereco,
        bairro = EXCLUDED.bairro,
        denominacao = EXCLUDED.denominacao,
        ativo = TRUE,
        atualizado_em = CURRENT_TIMESTAMP
    RETURNING id, codigo_setor
)
INSERT INTO setor_tipo_risco (
    id_setor,
    id_tipo_risco,
    id_grau_risco
)
SELECT
    s.id,
    tr.id,
    gr.id
FROM dados d
JOIN upsert_setor s
    ON s.codigo_setor = d.codigo_setor
CROSS JOIN LATERAL regexp_split_to_table(d.processo, '/') AS processo(nome_risco)
JOIN tipo_risco tr
    ON tr.nome = BTRIM(processo.nome_risco)
JOIN grau_risco gr
    ON gr.nome = d.grau_risco
ON CONFLICT (id_setor, id_tipo_risco) DO UPDATE SET
    id_grau_risco = EXCLUDED.id_grau_risco,
    ativo = TRUE,
    atualizado_em = CURRENT_TIMESTAMP;

-- Cadastro composto atomico. A funcao e chamada pelo repository via RPC;
-- qualquer erro aborta toda a transacao, inclusive a reserva idempotente.
CREATE OR REPLACE FUNCTION criar_cadastro_completo(
    p_chave_idempotencia UUID,
    p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_casa JSONB := p_payload->'casa';
    v_nucleo JSONB := p_payload->'nucleo_familiar';
    v_membro JSONB;
    v_pet JSONB;
    v_casa_id INTEGER;
    v_nucleo_id INTEGER;
    v_individuo_id INTEGER;
    v_responsavel_id INTEGER;
    v_responsavel JSONB;
    v_indice INTEGER := 0;
    v_vulnerabilidade TEXT;
    v_existente INTEGER;
BEGIN
    SELECT nucleo_familiar_id INTO v_existente
    FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
    IF FOUND THEN
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;

    INSERT INTO cadastro_requisicao (id, id_cadastrador)
    VALUES (p_chave_idempotencia, (v_nucleo->>'id_cadastrador')::INTEGER)
    ON CONFLICT (id) DO NOTHING;

    IF NOT FOUND THEN
        SELECT nucleo_familiar_id INTO v_existente
        FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;

    INSERT INTO casa (
        id_setor, coordenada_lat, coordenada_long, logradouro, numero, bairro,
        observacao, cep, tipo_construcao, uso_imovel, status_imovel, data_interdicao
    ) VALUES (
        (v_casa->>'id_setor')::INTEGER, (v_casa->>'coordenada_lat')::DECIMAL,
        (v_casa->>'coordenada_long')::DECIMAL, UPPER(BTRIM(v_casa->>'logradouro')),
        UPPER(BTRIM(v_casa->>'numero')), UPPER(BTRIM(v_casa->>'bairro')),
        NULLIF(v_casa->>'observacao', ''), NULLIF(v_casa->>'cep', ''),
        v_casa->>'tipo_construcao', v_casa->>'uso_imovel',
        COALESCE(v_casa->>'status_imovel', 'Sadio'), NULLIF(v_casa->>'data_interdicao', '')::DATE
    ) ON CONFLICT (id_setor, bairro, logradouro, numero)
    DO UPDATE SET id = casa.id
    RETURNING id INTO v_casa_id;

    v_responsavel := p_payload->'individuos'->((p_payload->>'responsavel_indice')::INTEGER);
    SELECT nf.id INTO v_existente
    FROM nucleo_familiar nf
    JOIN individuo i ON i.id = nf.id_chefe_familia
    WHERE nf.id_casa = v_casa_id
      AND i.nome_completo = UPPER(BTRIM(v_responsavel->>'nome_completo'))
      AND i.data_nascimento = (v_responsavel->>'data_nascimento')::DATE;
    IF FOUND THEN
        RAISE EXCEPTION 'Possivel duplicidade: responsavel ja cadastrado neste endereco'
          USING ERRCODE = '23505';
    END IF;

    INSERT INTO nucleo_familiar (
        nome_nucleo, id_casa, id_cadastrador, observacao,
        tempo_residencia_domicilio, tempo_residencia_area,
        tempo_residencia_municipio, renda_familiar_total
    ) VALUES (
        UPPER(BTRIM(v_nucleo->>'nome_nucleo')), v_casa_id,
        (v_nucleo->>'id_cadastrador')::INTEGER, NULLIF(v_nucleo->>'observacao', ''),
        NULLIF(v_nucleo->>'tempo_residencia_domicilio', '')::INTEGER,
        NULLIF(v_nucleo->>'tempo_residencia_area', '')::INTEGER,
        NULLIF(v_nucleo->>'tempo_residencia_municipio', '')::INTEGER,
        COALESCE((v_nucleo->>'renda_familiar_total')::DECIMAL, 0)
    ) RETURNING id INTO v_nucleo_id;

    FOR v_membro IN SELECT value FROM jsonb_array_elements(p_payload->'individuos') LOOP
        INSERT INTO individuo (id_nucleo_familiar, nome_completo, data_nascimento, genero, cpf, nis, status_vital)
        VALUES (
            v_nucleo_id, UPPER(BTRIM(v_membro->>'nome_completo')),
            (v_membro->>'data_nascimento')::DATE, v_membro->>'genero',
            NULLIF(regexp_replace(COALESCE(v_membro->>'cpf',''), '\D', '', 'g'), ''),
            NULLIF(regexp_replace(COALESCE(v_membro->>'nis',''), '\D', '', 'g'), ''),
            COALESCE(v_membro->>'status_vital', 'Vivo')
        ) RETURNING id INTO v_individuo_id;

        IF v_indice = (p_payload->>'responsavel_indice')::INTEGER THEN
            v_responsavel_id := v_individuo_id;
        END IF;
        FOR v_vulnerabilidade IN
            SELECT value FROM jsonb_array_elements_text(
                COALESCE(p_payload->'vulnerabilidades_por_individuo'->v_indice::TEXT, '[]'::JSONB)
            )
        LOOP
            INSERT INTO individuo_vulnerabilidade (id_individuo, id_vulnerabilidade)
            VALUES (v_individuo_id, v_vulnerabilidade::INTEGER)
            ON CONFLICT DO NOTHING;
        END LOOP;
        v_indice := v_indice + 1;
    END LOOP;

    UPDATE nucleo_familiar SET id_chefe_familia = v_responsavel_id WHERE id = v_nucleo_id;

    FOR v_pet IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'pets', '[]'::JSONB)) LOOP
        INSERT INTO pet (id_nucleo_familiar, tipo, porte, quantidade, imagem)
        VALUES (v_nucleo_id, NULLIF(v_pet->>'tipo', ''), NULLIF(v_pet->>'porte', ''),
                NULLIF(v_pet->>'quantidade', '')::INTEGER, NULLIF(v_pet->>'imagem', ''));
    END LOOP;

    UPDATE cadastro_requisicao SET nucleo_familiar_id = v_nucleo_id WHERE id = p_chave_idempotencia;
    RETURN jsonb_build_object('nucleo_familiar_id', v_nucleo_id, 'reutilizado', FALSE);
END;
$$;

-- Contrato de leitura consumido pela API. Mantem o modelo normalizado no
-- banco, mas entrega aos clientes o resumo de risco por setor.
CREATE VIEW setor_api AS
SELECT
    s.id,
    COALESCE(s.denominacao, s.codigo_setor) AS nome_regiao,
    STRING_AGG(DISTINCT tr.nome, ', ' ORDER BY tr.nome) AS tipo_risco,
    CASE MAX(gr.ordem_exibicao)
        WHEN 4 THEN 'Muito Alto'
        WHEN 3 THEN 'Alto'
        WHEN 2 THEN 'Médio'
        ELSE 'Baixo'
    END AS grau_risco
FROM setor s
LEFT JOIN setor_tipo_risco str
    ON str.id_setor = s.id AND str.ativo = TRUE
LEFT JOIN tipo_risco tr
    ON tr.id = str.id_tipo_risco AND tr.ativo = TRUE
LEFT JOIN grau_risco gr
    ON gr.id = str.id_grau_risco AND gr.ativo = TRUE
WHERE s.ativo = TRUE
GROUP BY s.id, s.codigo_setor, s.denominacao;
