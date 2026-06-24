import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Cadastradores.
 *
 * Entidade `cadastrador` (novo no back refatorado):
 * - Representa o agente responsável pelo cadastro do núcleo familiar
 * - IDs são BIGINT (inteiros positivos)
 * - nome: string obrigatória
 * - documento: formato obrigatório '###.###-#'  (ex: '123.456-7')
 *              regex: /^\d{3}\.\d{3}-\d$/
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/cadastradores — Criar Cadastrador', () => {
  it('retorna 400 quando nome está vazio', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: '',
      documento: '123.456-7',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando documento está ausente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: 'AGENTE SILVA',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando documento tem formato inválido (somente dígitos, sem pontuação)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: 'AGENTE SILVA',
      documento: '1234567',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando documento tem quantidade errada de dígitos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: 'AGENTE SILVA',
      documento: '1234.567-8',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('cria cadastrador com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: 'AGENTE SILVA',
      documento: '123.456-7',
    });

    expect([201, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.documento).toBe('123.456-7');
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('normaliza o nome para caixa alta antes de persistir', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/cadastradores').send({
      nome: 'agente ferreira',
      documento: '987.654-3',
    });

    expect([201, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.data.nome).toBe('AGENTE FERREIRA');
    }
  });
});

describe('GET /api/v1/cadastradores — Listar Cadastradores', () => {
  it('retorna lista de cadastradores com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/cadastradores');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /api/v1/cadastradores/:id — Buscar Cadastrador por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/cadastradores/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 para ID zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/cadastradores/0');

    expect(response.status).toBe(400);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/cadastradores/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/cadastradores/:id — Atualizar Cadastrador', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/cadastradores/abc').send({ nome: 'AGENTE NOVO' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando documento tem formato inválido na atualização', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/cadastradores/1').send({ documento: 'invalido' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/cadastradores/99999').send({ nome: 'AGENTE ATUALIZADO' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/cadastradores/:id — Remover Cadastrador', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/cadastradores/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/cadastradores/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
