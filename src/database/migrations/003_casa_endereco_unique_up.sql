-- Garante que a RPC criar_cadastro_completo possa reutilizar casas pelo
-- endereco normalizado via ON CONFLICT (id_setor, bairro, logradouro, numero).
CREATE UNIQUE INDEX IF NOT EXISTS uq_casa_endereco
    ON casa(id_setor, bairro, logradouro, numero);
