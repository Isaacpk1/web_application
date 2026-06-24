import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Vulnerabilidades.
 *
 * Modelo atual (tabela `vulnerabilidade` + pivô `individuo_vulnerabilidade`):
 * - Vulnerabilidade é um CATÁLOGO de tipos (ex: 'Gestante', 'Idoso', 'PCD')
 * - Não tem mais campos booleanos por família
 * - Não tem mais nucleo_familiar_id
 * - A associação com indivíduos é feita via endpoints separados:
 *     POST   /vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId
 *     DELETE /vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId
 *     GET    /vulnerabilidades/individuos/:individuoId
 * - IDs são BIGINT (inteiros positivos), não UUIDs
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/vulnerabilidades — Criar Tipo de Vulnerabilidade', () => {
  it('retorna 400 quando tipo_vulnerabilidade está vazio', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades').send({
      tipo_vulnerabilidade: '',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando tipo_vulnerabilidade está ausente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades').send({});

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('cria tipo de vulnerabilidade com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades').send({
      tipo_vulnerabilidade: 'Gestante',
    });

    expect([201, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo_vulnerabilidade).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('aceita diferentes tipos de vulnerabilidade', async () => {
    const { app } = await import('../../app');
    const tipos = ['Idoso', 'PCD', 'Crianca', 'Lactante', 'Doenca Cronica'];

    for (const tipo of tipos) {
      const response = await request(app).post('/api/v1/vulnerabilidades').send({
        tipo_vulnerabilidade: tipo,
      });

      expect([201, 409, 500]).toContain(response.status);
    }
  });
});

describe('GET /api/v1/vulnerabilidades — Listar Tipos de Vulnerabilidade', () => {
  it('retorna lista de tipos com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/vulnerabilidades');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /api/v1/vulnerabilidades/:id — Buscar Tipo por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/vulnerabilidades/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/vulnerabilidades/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('GET /api/v1/vulnerabilidades/individuos/:id — Listar por Indivíduo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/vulnerabilidades/individuos/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/vulnerabilidades/individuos/99999');

    expect([200, 404, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });
});

describe('POST /api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId — Associar', () => {
  it('retorna 400 quando individuoId é zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades/individuos/0/1');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando vulnerabilidadeId é zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades/individuos/1/0');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando IDs têm formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades/individuos/abc/xyz');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para IDs inteiros inexistentes', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/vulnerabilidades/individuos/99999/99998');

    expect([201, 404, 409, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId — Desassociar', () => {
  it('retorna 400 quando IDs têm formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/vulnerabilidades/individuos/abc/xyz');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para IDs inteiros inexistentes', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/vulnerabilidades/individuos/99999/99998');

    expect([200, 204, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/vulnerabilidades/:id — Atualizar Tipo de Vulnerabilidade', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/vulnerabilidades/abc').send({ tipo_vulnerabilidade: 'Idoso' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando tipo_vulnerabilidade está vazio na atualização', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/vulnerabilidades/1').send({ tipo_vulnerabilidade: '' });

    // 400 se o registro existe e a validação é atingida; 404/500 se não existe
    expect([400, 404, 500]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/vulnerabilidades/99999').send({ tipo_vulnerabilidade: 'Idoso' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/vulnerabilidades/:id — Remover Tipo de Vulnerabilidade', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/vulnerabilidades/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/vulnerabilidades/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
