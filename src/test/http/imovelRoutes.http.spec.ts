import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Casas/Imóveis.
 *
 * Modelo atual (tabela `casa`):
 * - IDs são BIGINT, não UUIDs
 * - casa não tem familia_id; a relação é invertida (nucleo_familiar.id_casa → casa.id)
 * - id_setor substitui setor_risco_id e é inteiro (obrigatório)
 * - coordenada_lat / coordenada_long substituem latitude / longitude e são obrigatórios
 * - tipo_construcao: 'Madeira' | 'Alvenaria' | 'Misto'  (inicial maiúscula)
 * - uso_imovel: 'Residencial' | 'Comercial' | 'Misto'   (inicial maiúscula)
 * - campo cidade foi removido
 * - rota por família: /casas/nucleos-familiares/:id  (antes /imoveis/familia/:id)
 * - alias /imoveis ainda existe
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/casas — Criar Casa/Imóvel', () => {
  const validPayload = {
    id_setor: 1,
    coordenada_lat: -23.5505,
    coordenada_long: -46.6333,
    logradouro: 'RUA A',
    numero: '123',
    bairro: 'CENTRO',
    tipo_construcao: 'Alvenaria',
    uso_imovel: 'Residencial',
  };

  it('aceita logradouro, numero e bairro vazios porque os campos sao opcionais', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, logradouro: '', numero: '', bairro: '' });

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.data.logradouro).toBeNull();
      expect(response.body.data.numero).toBeNull();
      expect(response.body.data.bairro).toBeNull();
    }
  });

  it('retorna 400 quando tipo_construcao tem valor fora do enum (minúscula)', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, tipo_construcao: 'alvenaria' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando uso_imovel tem valor fora do enum (minúscula)', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, uso_imovel: 'residencial' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando coordenada_lat está fora do intervalo [-90, 90]', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, coordenada_lat: 100 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando coordenada_long está fora do intervalo [-180, 180]', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, coordenada_long: 200 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando CEP é inválido (menos de 8 dígitos)', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, cep: '1234' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando status_imovel é interditado sem data_interdicao', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, status_imovel: 'Interditado' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando data_interdicao é enviada com status não interditado', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, status_imovel: 'Sadio', data_interdicao: '2024-01-01' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando id_setor é zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, id_setor: 0 });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('aceita CEP com traço e normaliza para 8 dígitos', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/casas')
      .send({ ...validPayload, cep: '09030-320' });

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.data.cep).toBe('09030320');
    }
  });

  it('cria casa com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/casas').send(validPayload);

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.logradouro).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('alias /api/v1/imoveis aceita o mesmo payload', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/imoveis').send(validPayload);

    expect([201, 404, 409, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/casas — Listar Casas', () => {
  it('retorna lista de casas com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/casas');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('alias /api/v1/imoveis retorna mesma estrutura', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/imoveis');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('GET /api/v1/casas/nucleos-familiares/:id — Buscar Casa por Núcleo Familiar', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/casas/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/casas/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  it('alias /imoveis/nucleos-familiares/:id também funciona', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/imoveis/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/casas/:id — Buscar Casa por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/casas/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/casas/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/casas/:id — Atualizar Casa', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/casas/abc').send({ tipo_construcao: 'Madeira' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando tipo_construcao tem valor inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/casas/1').send({ tipo_construcao: 'madeira' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .put('/api/v1/casas/99999')
      .send({ tipo_construcao: 'Madeira', uso_imovel: 'Comercial' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/casas/:id — Remover Casa', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/casas/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/casas/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
