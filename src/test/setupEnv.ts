import dotenv from 'dotenv';

dotenv.config();

/**
 * Configura variaveis de ambiente usadas pelos testes automatizados.
 *
 * @remarks
 * Carrega o .env antes de definir fallbacks para que credenciais reais do
 * Supabase (SUPABASE_URL, SUPABASE_KEY) sejam usadas quando disponiveis.
 * Quando a suite de integracao real nao esta habilitada e o .env nao possui
 * as variaveis, define credenciais falsas para permitir que o cliente Supabase
 * seja instanciado sem chamadas reais (util em testes unitarios com mocks).
 *
 * MOCK_AUTH é sempre desligado em testes: os testes HTTP usam jest.mock() para
 * isolar repositorios e precisam que as rotas reais sejam montadas (sem o
 * mockAuthMiddleware que bloqueia todos os /api/v1 com 401 sem Bearer token).
 */
if (process.env.RUN_SUPABASE_INTEGRATION !== 'true') {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
}

process.env.MOCK_AUTH = 'false';
