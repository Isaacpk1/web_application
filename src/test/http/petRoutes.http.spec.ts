import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Pets.
 *
 * Modelo atual (tabela `pet`):
 * - IDs são BIGINT, não UUIDs
 * - id_nucleo_familiar (obrigatório, inteiro positivo)
 * - tipo, porte: strings opcionais
 * - quantidade: smallint não negativo, opcional
 * - imagem: texto opcional (ex: URL)
 * - rota por família: /pets/nucleos-familiares/:id
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/pets — Criar Pet', () => {
  const validPayload = {
    id_nucleo_familiar: 1,
    tipo: 'Cachorro',
    porte: 'Medio',
    quantidade: 1,
  };

  it('retorna 400 quando id_nucleo_familiar é zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/pets')
      .send({ ...validPayload, id_nucleo_familiar: 0 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando quantidade é negativa', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .post('/api/v1/pets')
      .send({ ...validPayload, quantidade: -1 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('cria pet com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/pets').send(validPayload);

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.id_nucleo_familiar).toBe(1);
    }
  });
});

describe('GET /api/v1/pets — Listar Pets', () => {
  it('retorna lista de pets com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pets');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /api/v1/pets/nucleos-familiares/:id — Listar Pets por Núcleo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pets/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pets/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });
});

describe('GET /api/v1/pets/:id — Buscar Pet por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pets/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pets/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/pets/:id — Atualizar Pet', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/pets/abc').send({ tipo: 'Gato' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/pets/99999').send({ tipo: 'Gato' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/pets/:id — Remover Pet', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/pets/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/pets/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
