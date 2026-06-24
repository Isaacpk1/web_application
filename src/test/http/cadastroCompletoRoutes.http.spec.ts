import request from 'supertest';

const payload = {
  casa: {
    id_setor: 1, coordenada_lat: -23.66, coordenada_long: -46.52,
    logradouro: 'Rua A', numero: '1', bairro: 'Centro',
    tipo_construcao: 'Alvenaria', uso_imovel: 'Residencial',
  },
  nucleo_familiar: { nome_nucleo: 'Familia Silva', id_cadastrador: 1 },
  individuos: [{ nome_completo: 'Ana Silva', data_nascimento: '1990-01-01', genero: 'Feminino' }],
  responsavel_indice: 0,
};

describe('POST /api/v1/cadastros-completos', () => {
  it('padroniza erro de payload invalido', async () => {
    const { app } = await import('../../app');
    const response = await request(app).post('/api/v1/cadastros-completos').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, statusCode: 400 });
  });

  it('exige Idempotency-Key antes de chamar o banco', async () => {
    const { app } = await import('../../app');
    const response = await request(app).post('/api/v1/cadastros-completos').send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, statusCode: 400 });
    expect(response.body.error).toMatch(/Idempotency-Key/);
  });
});
