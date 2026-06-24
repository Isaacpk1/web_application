import { payloadSchemas } from '../../docs/zodSchemas';

describe('payloadSchemas', () => {
  it('exige nome e documento ao criar cadastrador', () => {
    expect(payloadSchemas.createCadastrador.safeParse({ nome: 'Agente' }).success).toBe(false);
    expect(payloadSchemas.createCadastrador.safeParse({ nome: 'Agente', documento: '123.456-7' }).success).toBe(true);
    expect(payloadSchemas.createCadastrador.safeParse({ nome: 'Agente', documento: 'IF 123.456-7' }).success).toBe(false);
    expect(payloadSchemas.createCadastrador.safeParse({ nome: 'Agente', documento: '1234567' }).success).toBe(false);
  });

  it('aceita criar setor sem grau de risco', () => {
    expect(payloadSchemas.createSetor.safeParse({ nome_regiao: 'Vila Palmares', tipo_risco: 'Deslizamento' }).success).toBe(true);
  });

  it('rejeita grau de risco fora do CHECK do banco', () => {
    expect(payloadSchemas.createSetor.safeParse({ nome_regiao: 'Vila Palmares', tipo_risco: 'Deslizamento', grau_risco: 'Severo' }).success).toBe(false);
  });

  it('aceita o id do cadastrador informado pelo frontend', () => {
    const nucleo = payloadSchemas.createNucleoFamiliar.parse({
      nome_nucleo: 'Familia',
      id_casa: 1,
      id_cadastrador: 999,
    });

    expect(nucleo.id_cadastrador).toBe(999);
  });

  it('nao permite alterar quem realizou o cadastro', () => {
    const payload = payloadSchemas.updateNucleoFamiliar.parse({ id_cadastrador: 999 });
    expect(payload).not.toHaveProperty('id_cadastrador');
  });
});
