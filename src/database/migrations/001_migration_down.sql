-- Migration DOWN correspondente a 001_migration.sql
DROP INDEX IF EXISTS idx_pet_nucleo;
DROP INDEX IF EXISTS idx_individuo_nucleo;
DROP INDEX IF EXISTS idx_nucleo_chefe_familia;
DROP INDEX IF EXISTS idx_nucleo_cadastrador;
DROP INDEX IF EXISTS idx_nucleo_casa;
DROP INDEX IF EXISTS idx_casa_setor;
DROP INDEX IF EXISTS idx_cadastro_requisicao_cadastrador;
DROP INDEX IF EXISTS idx_setor_tipo_risco_grau_risco;
DROP INDEX IF EXISTS idx_setor_tipo_risco_tipo_risco;
DROP INDEX IF EXISTS idx_setor_tipo_risco_setor;
DROP INDEX IF EXISTS idx_setor_denominacao;
DROP INDEX IF EXISTS idx_setor_bairro;

DROP VIEW IF EXISTS setor_api;
DROP FUNCTION IF EXISTS criar_cadastro_completo(UUID, JSONB);

DROP TABLE IF EXISTS individuo_vulnerabilidade;
DROP TABLE IF EXISTS vulnerabilidade;
DROP TABLE IF EXISTS cadastro_requisicao;
DROP TABLE IF EXISTS pet;

ALTER TABLE IF EXISTS nucleo_familiar
    DROP CONSTRAINT IF EXISTS fk_nucleo_chefe;

DROP TABLE IF EXISTS individuo;
DROP TABLE IF EXISTS nucleo_familiar;
DROP TABLE IF EXISTS cadastrador;
DROP TABLE IF EXISTS casa;
DROP TABLE IF EXISTS setor_tipo_risco;
DROP TABLE IF EXISTS grau_risco;
DROP TABLE IF EXISTS tipo_risco;
DROP TABLE IF EXISTS setor;

DROP FUNCTION IF EXISTS set_atualizado_em();

