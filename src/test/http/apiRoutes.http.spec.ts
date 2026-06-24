import request from 'supertest';

jest.mock('../../repositories/CadastradorRepository', () => ({
  CadastradorRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 5, nome: 'Agente Silva', documento: '123.456-7' }]),
    findById: jest.fn().mockResolvedValue({ id: 5, nome: 'Agente Silva', documento: '123.456-7' }),
    create: jest.fn().mockResolvedValue({ id: 5, nome: 'Agente Silva', documento: '123.456-7' }),
    update: jest.fn().mockResolvedValue({ id: 5, nome: 'Agente Silva', documento: '123.456-7' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/CasaRepository', () => ({
  CasaRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 3, logradouro: 'RUA A', bairro: 'CENTRO' }]),
    findById: jest.fn().mockResolvedValue({ id: 3, logradouro: 'RUA A', bairro: 'CENTRO' }),
    create: jest.fn().mockResolvedValue({ id: 3, logradouro: 'RUA A', bairro: 'CENTRO' }),
    update: jest.fn().mockResolvedValue({ id: 3, logradouro: 'RUA A', bairro: 'CENTRO' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/NucleoFamiliarRepository', () => ({
  NucleoFamiliarRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 1, nome_nucleo: 'Familia Silva' }]),
    findById: jest.fn().mockResolvedValue({ id: 1, nome_nucleo: 'Familia Silva' }),
    create: jest.fn().mockResolvedValue({ id: 1, nome_nucleo: 'Familia Silva' }),
    update: jest.fn().mockResolvedValue({ id: 1, nome_nucleo: 'Familia Silva' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/IndividuoRepository', () => ({
  IndividuoRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 2, nome_completo: 'Joao Silva' }]),
    findById: jest.fn().mockResolvedValue({ id: 2, nome_completo: 'Joao Silva' }),
    findByNucleoFamiliarId: jest.fn().mockResolvedValue([{ id: 2, nome_completo: 'Joao Silva' }]),
    existsByCpfOrNis: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue({ id: 2, nome_completo: 'Joao Silva' }),
    update: jest.fn().mockResolvedValue({ id: 2, nome_completo: 'Joao Silva' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/SetorRepository', () => ({
  SetorRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 4, nome_regiao: 'VILA PALMARES', grau_risco: 'Alto' }]),
    findById: jest.fn().mockResolvedValue({ id: 4, nome_regiao: 'VILA PALMARES', grau_risco: 'Alto' }),
    create: jest.fn().mockResolvedValue({ id: 4, nome_regiao: 'VILA PALMARES', grau_risco: 'Alto' }),
    update: jest.fn().mockResolvedValue({ id: 4, nome_regiao: 'VILA PALMARES', grau_risco: 'Alto' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/VulnerabilidadeRepository', () => ({
  VulnerabilidadeRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([{ id: 6, tipo_vulnerabilidade: 'Gestante' }]),
    findById: jest.fn().mockResolvedValue({ id: 6, tipo_vulnerabilidade: 'Gestante' }),
    findByIndividuoId: jest.fn().mockResolvedValue([{ id: 6, tipo_vulnerabilidade: 'Gestante' }]),
    create: jest.fn().mockResolvedValue({ id: 6, tipo_vulnerabilidade: 'Gestante' }),
    update: jest.fn().mockResolvedValue({ id: 6, tipo_vulnerabilidade: 'Gestante' }),
    delete: jest.fn().mockResolvedValue(undefined),
    associate: jest.fn().mockResolvedValue({ id_individuo: 2, id_vulnerabilidade: 6 }),
    disassociate: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../repositories/NucleoFamiliarConsultaRepository', () => ({
  NucleoFamiliarConsultaRepository: jest.fn().mockImplementation(() => ({
    findCasaIdByNucleoFamiliarId: jest.fn().mockResolvedValue(3),
    findSetorIdByNucleoFamiliarId: jest.fn().mockResolvedValue(4),
  })),
}));

import { app } from '../../app';

describe('API routes - black-box HTTP contract', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/casas retorna lista de casas com contrato esperado', async () => {
    const response = await request(app).get('/api/v1/casas');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Imoveis listados com sucesso',
      data: [{ id: 3, logradouro: 'RUA A', bairro: 'CENTRO' }],
    });
  });

  it('POST /api/v1/cadastradores cria cadastrador e retorna 201', async () => {
    const response = await request(app).post('/api/v1/cadastradores').send({ nome: 'Agente Silva', documento: '123.456-7' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { nome: 'Agente Silva', documento: '123.456-7' },
    });
  });

  it('GET /api/v1/individuos/2 retorna individuo com contrato padronizado', async () => {
    const response = await request(app).get('/api/v1/individuos/2');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { id: 2, nome_completo: 'Joao Silva' },
    });
  });

  it('POST /api/v1/nucleos-familiares cria nucleo familiar e responde 201', async () => {
    const response = await request(app).post('/api/v1/nucleos-familiares').send({ observacao: 'FICHA-001', nome_nucleo: 'Familia Silva', id_casa: 3, id_cadastrador: 5, renda_familiar_total: 1500 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { nome_nucleo: 'Familia Silva' },
    });
  });

  it('GET /api/v1/setores/4 retorna setor com contrato esperado', async () => {
    const response = await request(app).get('/api/v1/setores/4');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 4, nome_regiao: 'VILA PALMARES' });
  });

  it('GET /api/v1/vulnerabilidades/6 retorna vulnerabilidade com contrato esperado', async () => {
    const response = await request(app).get('/api/v1/vulnerabilidades/6');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 6, tipo_vulnerabilidade: 'Gestante' });
  });
});