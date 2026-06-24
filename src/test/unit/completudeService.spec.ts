import { supabase } from '../../database/supabaseClient';
import { CompletudeItem, CompletudeRepository } from '../../repositories/CompletudeRepository';
import { CompletudeService } from '../../services/CompletudeService';

jest.mock('../../database/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const setor = { id: 1, nome_regiao: 'NORTE', tipo_risco: 'Deslizamento', grau_risco: 'Alto' };
const casaCompleta = {
  id: 1, id_setor: 1, logradouro: 'Rua A', numero: '100', bairro: 'Centro', cep: '01234-000',
  coordenada_lat: -23.5, coordenada_long: -46.6, observacao: null,
  tipo_construcao: 'Alvenaria', uso_imovel: 'Residencial', status_imovel: 'Sadio', data_interdicao: null,
};
const nucleoCompleto = {
  id: 1, nome_nucleo: 'Familia Silva', id_casa: 1, id_chefe_familia: 10,
  id_cadastrador: 5, renda_familiar_total: 1800, observacao: null,
  tempo_residencia_domicilio: null, tempo_residencia_area: null, tempo_residencia_municipio: null,
};
const chefeCompleto = {
  id: 10, id_nucleo_familiar: 1, nome_completo: 'Joao Silva', cpf: '52998224725',
  telefone: '11999999999', genero: 'Masculino', apelido: null, nome_social: null,
  data_nascimento: '1990-05-10', cor_raca: null, uf: null, estado_civil: null,
  profissao: null, nome_mae: null, nome_pai: null, grau_parentesco: null,
  escolaridade: null, situacao_ocupacional: null, doc_estrangeiro: null, rg: null,
  nis: null, email: null, status_vital: 'Vivo', data_obito: null, semanas_gestacao: null,
};

function mockSupabase(
  nucleos: unknown[] = [nucleoCompleto],
  casas: unknown[] = [casaCompleta],
  setores: unknown[] = [setor],
  individuos: unknown[] = [chefeCompleto],
) {
  const mk = (data: unknown[]) => ({ select: jest.fn().mockResolvedValue({ data, error: null }) });
  (supabase.from as jest.Mock)
    .mockReturnValueOnce(mk(nucleos))
    .mockReturnValueOnce(mk(casas))
    .mockReturnValueOnce(mk(setores))
    .mockReturnValueOnce(mk(individuos));
}

// ── CompletudeRepository ──────────────────────────────────────────────────────

describe('CompletudeRepository', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna completo=true e campos_preenchidos=10 quando todos os campos estao preenchidos', async () => {
    mockSupabase();
    const items = await new CompletudeRepository().listar();

    expect(items).toHaveLength(1);
    expect(items[0].completo).toBe(true);
    expect(items[0].campos_preenchidos).toBe(10);
    expect(items[0].campos_total).toBe(10);
  });

  it('conta campos faltantes corretamente', async () => {
    const semCpfETelefone = { ...chefeCompleto, cpf: null, telefone: null };
    mockSupabase([nucleoCompleto], [casaCompleta], [setor], [semCpfETelefone]);
    const items = await new CompletudeRepository().listar();

    expect(items[0].campos_preenchidos).toBe(8);
    expect(items[0].completo).toBe(false);
  });

  it('retorna completo=false quando nucleo nao tem chefe', async () => {
    const semChefe = { ...nucleoCompleto, id_chefe_familia: null };
    mockSupabase([semChefe], [casaCompleta], [setor], [chefeCompleto]);
    const items = await new CompletudeRepository().listar();

    expect(items[0].completo).toBe(false);
    expect(items[0].nome_responsavel).toBeNull();
  });

  it('retorna completo=false quando casa sem cep', async () => {
    const casaSemCep = { ...casaCompleta, cep: null };
    mockSupabase([nucleoCompleto], [casaSemCep], [setor], [chefeCompleto]);
    const items = await new CompletudeRepository().listar();

    expect(items[0].campos_preenchidos).toBe(9);
    expect(items[0].completo).toBe(false);
  });

  it('mapeia grau_risco para nivel_risco corretamente', async () => {
    const casos = [
      { grau_risco: 'Muito Alto', esperado: 'MUITO_ALTO' },
      { grau_risco: 'Alto', esperado: 'ALTO' },
      { grau_risco: 'Médio', esperado: 'MEDIO' },
      { grau_risco: 'Baixo', esperado: 'BAIXO' },
    ];

    for (const { grau_risco, esperado } of casos) {
      mockSupabase([nucleoCompleto], [casaCompleta], [{ ...setor, grau_risco }], [chefeCompleto]);
      const items = await new CompletudeRepository().listar();
      expect(items[0].nivel_risco).toBe(esperado);
    }
  });

  it('usa BAIXO como nivel_risco quando setor nao tem grau_risco', async () => {
    mockSupabase([nucleoCompleto], [casaCompleta], [{ ...setor, grau_risco: null }], [chefeCompleto]);
    const items = await new CompletudeRepository().listar();
    expect(items[0].nivel_risco).toBe('BAIXO');
  });

  it('retorna shape correto com nome_familia e nome_responsavel', async () => {
    mockSupabase();
    const items = await new CompletudeRepository().listar();

    expect(items[0]).toMatchObject({
      id: 1,
      nome_familia: 'Familia Silva',
      nome_responsavel: 'Joao Silva',
      data_cadastro: null,
    });
  });
});

// ── CompletudeService ─────────────────────────────────────────────────────────

const makeItem = (completo: boolean): CompletudeItem => ({
  id: Math.random(),
  nome_familia: 'Familia',
  nome_responsavel: 'Responsavel',
  data_cadastro: null,
  campos_preenchidos: completo ? 10 : 6,
  campos_total: 10,
  completo,
  nivel_risco: 'ALTO',
});

describe('CompletudeService', () => {
  const makeRepository = (items: CompletudeItem[]) =>
    ({ listar: jest.fn().mockResolvedValue(items) }) as unknown as jest.Mocked<CompletudeRepository>;

  it('retorna todos os itens quando aba nao e fornecida', async () => {
    const items = [makeItem(true), makeItem(false), makeItem(false)];
    const result = await new CompletudeService(makeRepository(items)).listar();

    expect(result.items).toHaveLength(3);
  });

  it('filtra apenas completos quando aba=completos', async () => {
    const items = [makeItem(true), makeItem(false), makeItem(true)];
    const result = await new CompletudeService(makeRepository(items)).listar('completos');

    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => i.completo)).toBe(true);
  });

  it('filtra apenas incompletos quando aba=incompletos', async () => {
    const items = [makeItem(true), makeItem(false), makeItem(false)];
    const result = await new CompletudeService(makeRepository(items)).listar('incompletos');

    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => !i.completo)).toBe(true);
  });

  it('calcula stats corretamente independente da aba', async () => {
    const items = [makeItem(true), makeItem(false), makeItem(true)];
    const result = await new CompletudeService(makeRepository(items)).listar('incompletos');

    expect(result.stats.total).toBe(3);
    expect(result.stats.completos).toBe(2);
    expect(result.stats.incompletos).toBe(1);
    expect(result.stats.taxa).toBe(67);
  });

  it('retorna taxa 0 quando nao ha itens', async () => {
    const result = await new CompletudeService(makeRepository([])).listar();

    expect(result.stats.taxa).toBe(0);
    expect(result.stats.total).toBe(0);
  });

  it('arredonda taxa percentual corretamente', async () => {
    const items = [makeItem(true), makeItem(false), makeItem(false)];
    const result = await new CompletudeService(makeRepository(items)).listar();

    expect(result.stats.taxa).toBe(33);
  });
});
