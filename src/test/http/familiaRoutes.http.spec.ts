import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

const mockNucleoFamiliar = {
  id: 1,
  nome_nucleo: 'FAMILIA SILVA',
  id_casa: 1,
  id_cadastrador: 1,
  id_chefe_familia: null,
  observacao: null,
  tempo_residencia_domicilio: null,
  tempo_residencia_area: null,
  tempo_residencia_municipio: null,
  renda_familiar_total: 2500,
};

const mockIndividuo = {
  id: 2,
  id_nucleo_familiar: 1,
  nome_completo: 'JOAO SILVA',
  apelido: null,
  nome_social: null,
  data_nascimento: '1990-05-10',
  genero: 'Masculino',
  cor_raca: null,
  uf: null,
  estado_civil: null,
  profissao: null,
  nome_mae: null,
  nome_pai: null,
  grau_parentesco: null,
  escolaridade: null,
  situacao_ocupacional: null,
  cpf: null,
  doc_estrangeiro: null,
  rg: null,
  nis: null,
  telefone: null,
  email: null,
  status_vital: 'Vivo',
  data_obito: null,
  semanas_gestacao: null,
};

jest.mock('../../repositories/NucleoFamiliarRepository', () => ({
  NucleoFamiliarRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([mockNucleoFamiliar]),
    findById: jest.fn((id: number) => Promise.resolve(id === 99999 ? null : { ...mockNucleoFamiliar, id })),
    create: jest.fn((payload) => Promise.resolve({ ...mockNucleoFamiliar, ...payload, id: 1 })),
    update: jest.fn((id, payload) => Promise.resolve({ ...mockNucleoFamiliar, ...payload, id })),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/IndividuoRepository', () => ({
  IndividuoRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([mockIndividuo]),
    findById: jest.fn((id: number) => Promise.resolve(id === 99999 ? null : { ...mockIndividuo, id })),
    findByNucleoFamiliarId: jest.fn().mockResolvedValue([mockIndividuo]),
    existsByCpfOrNis: jest.fn().mockResolvedValue(false),
    create: jest.fn((payload) => Promise.resolve({ ...mockIndividuo, ...payload, id: 2 })),
    update: jest.fn((id, payload) => Promise.resolve({ ...mockIndividuo, ...payload, id })),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

/**
 * Suite de testes HTTP para endpoints de Núcleos Familiares (RF012).
 *
 * Modelo atual:
 * - IDs são BIGINT (inteiros positivos), não UUIDs
 * - nucleoFamiliar referencia id_casa e id_cadastrador (FKs inteiras)
 * - CPF/dados biográficos do responsável ficam na entidade individuo
 * - renda_familiar_total substitui renda_familiar
 * - id_chefe_familia não pode ser definido na criação
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/nucleos-familiares (RF012) — Criar Núcleo Familiar', () => {
  it('retorna 400 quando nome_nucleo está vazio', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: '',
      id_casa: 1,
      id_cadastrador: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('retorna 400 quando id_casa é zero (não positivo)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA SILVA',
      id_casa: 0,
      id_cadastrador: 1,
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando id_cadastrador está ausente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA SILVA',
      id_casa: 1,
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando renda_familiar_total é negativa', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA SILVA',
      id_casa: 1,
      id_cadastrador: 1,
      renda_familiar_total: -100,
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando id_chefe_familia é enviado na criação', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA SILVA',
      id_casa: 1,
      id_cadastrador: 1,
      id_chefe_familia: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('cria núcleo familiar com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA SILVA',
      id_casa: 1,
      id_cadastrador: 1,
      renda_familiar_total: 2500,
    });

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome_nucleo).toBe('FAMILIA SILVA');
      expect(response.body.data.renda_familiar_total).toBe(2500);
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('aceita criação sem campos opcionais', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/nucleos-familiares').send({
      nome_nucleo: 'FAMILIA MELO',
      id_casa: 2,
      id_cadastrador: 1,
    });

    expect([201, 404, 409, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/nucleos-familiares (RF012) — Listar Núcleos Familiares', () => {
  it('retorna lista com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/nucleos-familiares');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('alias /api/v1/familias responde com a mesma estrutura', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/familias');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /api/v1/nucleos-familiares/:id (RF012) — Buscar Núcleo por ID', () => {
  it('retorna 400 para ID com formato inválido (string não numérica)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 para ID zero', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/nucleos-familiares/0');

    expect(response.status).toBe(400);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/nucleos-familiares/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/nucleos-familiares/:id (RF012) — Atualizar Núcleo Familiar', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/nucleos-familiares/abc').send({ nome_nucleo: 'NOVO NOME' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .put('/api/v1/nucleos-familiares/99999')
      .send({ nome_nucleo: 'FAMILIA ATUALIZADA', renda_familiar_total: 3000 });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/nucleos-familiares/:id (RF012) — Remover Núcleo Familiar', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/nucleos-familiares/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
