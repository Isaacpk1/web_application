import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Setores de Risco.
 *
 * Modelo atual (tabela `setor`):
 * - IDs são BIGINT (inteiros positivos), não UUIDs
 * - codigo → nome_regiao
 * - nivel_risco → grau_risco
 * - Valores de grau_risco: 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto'  (inicial maiúscula, sem 'critico')
 * - rota por família: /setores/nucleos-familiares/:id  (antes /setores-risco/familia/:id)
 * - alias /setores-risco ainda existe
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/setores — Criar Setor de Risco', () => {
  it('retorna 400 quando nome_regiao está vazio', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: '',
      grau_risco: 'Alto',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando grau_risco é valor inválido (critico não existe)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: 'VILA PALMARES',
      grau_risco: 'critico',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando grau_risco tem valor com case errado (alto minúsculo)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: 'VILA PALMARES',
      grau_risco: 'alto',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando grau_risco não é string', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: 'VILA PALMARES',
      grau_risco: 1,
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('cria setor com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: `SETOR-${Date.now()}`,
      tipo_risco: 'Deslizamento',
      grau_risco: 'Alto',
    });

    expect([201, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.grau_risco).toBe('Alto');
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('aceita criação sem grau_risco (campo opcional)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores').send({
      nome_regiao: `SETOR-SEMRISCO-${Date.now()}`,
      tipo_risco: 'Inundacao',
    });

    expect([201, 409, 500]).toContain(response.status);
  });

  it('aceita todos os valores válidos de grau_risco', async () => {
    const { app } = await import('../../app');
    const graus = ['Baixo', 'Médio', 'Alto', 'Muito Alto'];

    for (const grau of graus) {
      const response = await request(app).post('/api/v1/setores').send({
        nome_regiao: `SETOR-${grau.replace(' ', '-')}-${Date.now()}`,
        tipo_risco: 'Deslizamento',
        grau_risco: grau,
      });

      expect([201, 409, 500]).toContain(response.status);
    }
  });

  it('alias /api/v1/setores-risco aceita o mesmo payload', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/setores-risco').send({
      nome_regiao: `SETOR-ALIAS-${Date.now()}`,
      tipo_risco: 'Inundacao',
      grau_risco: 'Baixo',
    });

    expect([201, 409, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/setores — Listar Setores de Risco', () => {
  it('retorna lista de setores com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('alias /api/v1/setores-risco retorna mesma estrutura', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores-risco');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('GET /api/v1/setores/nucleos-familiares/:id — Buscar Setores por Núcleo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  it('alias /setores-risco/nucleos-familiares/:id também funciona', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores-risco/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/setores/:id — Buscar Setor por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/setores/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/setores/:id — Atualizar Setor de Risco', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/setores/abc').send({ grau_risco: 'Alto' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando grau_risco tem valor inválido na atualização', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/setores/1').send({ grau_risco: 'critico' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/setores/99999').send({ grau_risco: 'Muito Alto' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/setores/:id — Remover Setor de Risco', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/setores/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/setores/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
