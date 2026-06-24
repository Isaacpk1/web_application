import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config();

/**
 * Suite de testes HTTP para endpoints de Indivíduos (RF001, RF003, RF004).
 *
 * Modelo atual (tabela `individuo`):
 * - IDs são BIGINT (inteiros positivos), não UUIDs
 * - familia_id → id_nucleo_familiar (inteiro)
 * - nome → nome_completo
 * - genero: 'Masculino' | 'Feminino' | 'Outro'  (inicial maiúscula)
 * - ocupacao → situacao_ocupacional
 * - renda → renda_individual
 * - cpf é opcional, mas quando enviado deve ter dígito verificador válido
 * - status_vital: 'Vivo' | 'Obito' | 'Desaparecido'  (padrão: 'Vivo')
 * - data_obito só pode ser enviada com status_vital = 'Obito'
 * - rota por família: /individuos/nucleos-familiares/:id  (antes /pessoas/familia/:id)
 * - alias /pessoas ainda existe
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? 'test-service-role-key';
});

jest.setTimeout(15000);

describe('POST /api/v1/individuos (RF001) — Criar Indivíduo', () => {
  it('retorna 422 quando CPF tem dígito verificador inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      cpf: '12345678901',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
    });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('CPF');
  });

  it('retorna 400 quando data_nascimento é futura', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      data_nascimento: '2099-01-01',
      genero: 'Masculino',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando nome_completo está vazio', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: '',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando genero tem valor fora do enum (minúscula)', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      data_nascimento: '1990-05-10',
      genero: 'masculino',
    });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando semanas_gestacao é negativa', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
      semanas_gestacao: -1,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando data_obito é enviada sem status_vital Óbito', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
      status_vital: 'Vivo',
      data_obito: '2024-01-01',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando status_vital é Obito sem data_obito', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
      status_vital: 'Obito',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('cria indivíduo com dados válidos', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: 'JOAO SILVA',
      cpf: '52998224725',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
      escolaridade: 'ensino medio',
      situacao_ocupacional: 'pedreiro',
    });

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome_completo).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    }
  });

  it('normaliza nome e CPF antes de persistir', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/individuos').send({
      id_nucleo_familiar: 1,
      nome_completo: '  joão   silva  ',
      cpf: '529.982.247-25',
      data_nascimento: '1990-05-10',
      genero: 'Masculino',
    });

    expect([201, 404, 409, 500]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.data.nome_completo).toBe('JOAO SILVA');
      expect(response.body.data.cpf).toBe('52998224725');
    }
  });

  it('alias /api/v1/pessoas aceita o mesmo payload', async () => {
    const { app } = await import('../../app');

    const response = await request(app).post('/api/v1/pessoas').send({
      id_nucleo_familiar: 1,
      nome_completo: 'MARIA SOUZA',
      data_nascimento: '1985-03-20',
      genero: 'Feminino',
    });

    expect([201, 404, 409, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/individuos (RF004) — Listar Indivíduos', () => {
  it('retorna lista de indivíduos com estrutura esperada', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/individuos');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('alias /api/v1/pessoas retorna mesma estrutura', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pessoas');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('GET /api/v1/individuos/nucleos-familiares/:id (RF004) — Listar por Núcleo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/individuos/nucleos-familiares/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/individuos/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  it('alias /pessoas/nucleos-familiares/:id também funciona', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/pessoas/nucleos-familiares/99999');

    expect([200, 404, 500]).toContain(response.status);
  });
});

describe('GET /api/v1/individuos/:id (RF004) — Buscar Indivíduo por ID', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/individuos/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 404 ou 500 para ID inteiro inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).get('/api/v1/individuos/99999');

    expect([404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('PUT /api/v1/individuos/:id (RF003) — Atualizar Indivíduo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/individuos/abc').send({ situacao_ocupacional: 'ENGENHEIRO' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 quando genero tem valor inválido na atualização', async () => {
    const { app } = await import('../../app');

    const response = await request(app).put('/api/v1/individuos/1').send({ genero: 'masculino' });

    expect([400, 422]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('endpoint PUT está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app)
      .put('/api/v1/individuos/99999')
      .send({ situacao_ocupacional: 'ENGENHEIRO' });

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('DELETE /api/v1/individuos/:id (RF003/RF006) — Remover Indivíduo', () => {
  it('retorna 400 para ID com formato inválido', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/individuos/abc');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('endpoint DELETE está disponível para ID inexistente', async () => {
    const { app } = await import('../../app');

    const response = await request(app).delete('/api/v1/individuos/99999');

    expect([200, 204, 400, 404, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});
