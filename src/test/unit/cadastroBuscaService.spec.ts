import { supabase } from '../../database/supabaseClient';
import { CadastroBuscaRepository, CadastroBuscaResultado } from '../../repositories/CadastroBuscaRepository';
import { CadastroBuscaService } from '../../services/CadastroBuscaService';

jest.mock('../../database/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const setor = { id: 1, nome_regiao: 'NORTE', tipo_risco: 'Deslizamento', grau_risco: 'Alto' };
const casa = {
  id: 1, id_setor: 1, bairro: 'Centro', cep: '01234-000',
  logradouro: 'Rua A', numero: '100', coordenada_lat: -23.5, coordenada_long: -46.6,
  observacao: null, tipo_construcao: 'Alvenaria', uso_imovel: 'Residencial',
  status_imovel: 'Sadio', data_interdicao: null,
};
const nucleo = {
  id: 1, nome_nucleo: 'Familia Silva', id_casa: 1, id_chefe_familia: 10,
  id_cadastrador: 5, renda_familiar_total: 1800, observacao: null,
  tempo_residencia_domicilio: null, tempo_residencia_area: null, tempo_residencia_municipio: null,
};
const chefe = {
  id: 10, id_nucleo_familiar: 1, nome_completo: 'Joao Silva', cpf: '529.982.247-25',
  telefone: '11999999999', genero: 'Masculino', apelido: null, nome_social: null,
  data_nascimento: '1990-05-10', cor_raca: null, uf: null, estado_civil: null,
  profissao: null, nome_mae: null, nome_pai: null, grau_parentesco: null,
  escolaridade: null, situacao_ocupacional: null, doc_estrangeiro: null, rg: null,
  nis: null, email: null, status_vital: 'Vivo', data_obito: null, semanas_gestacao: null,
};

function mockSupabase(
  nucleos: unknown[] = [nucleo],
  casas: unknown[] = [casa],
  setores: unknown[] = [setor],
  individuos: unknown[] = [chefe],
) {
  const mk = (data: unknown[]) => ({ select: jest.fn().mockResolvedValue({ data, error: null }) });
  (supabase.from as jest.Mock)
    .mockReturnValueOnce(mk(nucleos))
    .mockReturnValueOnce(mk(casas))
    .mockReturnValueOnce(mk(setores))
    .mockReturnValueOnce(mk(individuos));
}

// ── CadastroBuscaRepository ───────────────────────────────────────────────────

describe('CadastroBuscaRepository', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna resultado com shape correto e nivel_risco mapeado', async () => {
    mockSupabase();
    const resultado = await new CadastroBuscaRepository().buscar({});

    expect(resultado.resultados).toHaveLength(1);
    const r: CadastroBuscaResultado = resultado.resultados[0];
    expect(r.nome_familia).toBe('Familia Silva');
    expect(r.nome_responsavel).toBe('Joao Silva');
    expect(r.bairro).toBe('Centro');
    expect(r.nivel_risco).toBe('ALTO');
    expect(r.prioridade_vulnerabilidade).toBe('ALTA');
    expect(r.qtd_membros).toBe(1);
    expect(r.cadastro_completo).toBe(true);
  });

  it('filtra por nome na familia e no responsavel', async () => {
    const nucleo2 = { ...nucleo, id: 2, nome_nucleo: 'Familia Oliveira', id_chefe_familia: 20 };
    const chefe2 = { ...chefe, id: 20, id_nucleo_familiar: 2, nome_completo: 'Maria Lima' };

    mockSupabase([nucleo, nucleo2], [casa], [setor], [chefe, chefe2]);
    const r1 = await new CadastroBuscaRepository().buscar({ nome: 'Silva' });
    expect(r1.resultados.map((r) => r.nome_familia)).toContain('Familia Silva');
    expect(r1.resultados.map((r) => r.nome_responsavel)).not.toContain('Maria Lima');

    mockSupabase([nucleo, nucleo2], [casa], [setor], [chefe, chefe2]);
    const r2 = await new CadastroBuscaRepository().buscar({ nome: 'lima' });
    expect(r2.resultados).toHaveLength(1);
    expect(r2.resultados[0].nome_responsavel).toBe('Maria Lima');
  });

  it('filtra por cpf ignorando mascara', async () => {
    mockSupabase();
    const com = await new CadastroBuscaRepository().buscar({ cpf: '529.982.247-25' });
    expect(com.resultados).toHaveLength(1);

    mockSupabase();
    const sem = await new CadastroBuscaRepository().buscar({ cpf: '52998224725' });
    expect(sem.resultados).toHaveLength(1);

    mockSupabase();
    const nenhum = await new CadastroBuscaRepository().buscar({ cpf: '00000000000' });
    expect(nenhum.resultados).toHaveLength(0);
  });

  it('filtra por bairro de forma case-insensitive', async () => {
    mockSupabase();
    const r = await new CadastroBuscaRepository().buscar({ bairro: 'centro' });
    expect(r.resultados).toHaveLength(1);

    mockSupabase();
    const nenhum = await new CadastroBuscaRepository().buscar({ bairro: 'sul' });
    expect(nenhum.resultados).toHaveLength(0);
  });

  it('filtra por nivel_risco exato', async () => {
    mockSupabase();
    const alto = await new CadastroBuscaRepository().buscar({ nivel_risco: 'ALTO' });
    expect(alto.resultados).toHaveLength(1);

    mockSupabase();
    const baixo = await new CadastroBuscaRepository().buscar({ nivel_risco: 'BAIXO' });
    expect(baixo.resultados).toHaveLength(0);
  });

  it('pagina corretamente', async () => {
    const nucleos = [1, 2, 3].map((i) => ({ ...nucleo, id: i, nome_nucleo: `Familia ${i}` }));
    const casas = [1, 2, 3].map((i) => ({ ...casa, id: i }));
    const setores = [setor];
    const individuos = [1, 2, 3].map((i) => ({ ...chefe, id: i + 10, id_nucleo_familiar: i }));

    mockSupabase(nucleos, casas, setores, individuos);
    const pg1 = await new CadastroBuscaRepository().buscar({ page: 1, limit: 2 });
    expect(pg1.total).toBe(3);
    expect(pg1.resultados).toHaveLength(2);
    expect(pg1.page).toBe(1);

    mockSupabase(nucleos, casas, setores, individuos);
    const pg2 = await new CadastroBuscaRepository().buscar({ page: 2, limit: 2 });
    expect(pg2.resultados).toHaveLength(1);
  });

  it('marca cadastro_completo como false quando sem chefe', async () => {
    const semChefe = { ...nucleo, id_chefe_familia: null };
    mockSupabase([semChefe], [casa], [setor], [chefe]);
    const r = await new CadastroBuscaRepository().buscar({});
    expect(r.resultados[0].cadastro_completo).toBe(false);
  });
});

// ── CadastroBuscaService ──────────────────────────────────────────────────────

describe('CadastroBuscaService', () => {
  it('converte page e limit de string para numero e delega ao repository', async () => {
    const repository = { buscar: jest.fn().mockResolvedValue({ total: 0, page: 1, limit: 5, resultados: [] }) } as unknown as jest.Mocked<CadastroBuscaRepository>;
    const service = new CadastroBuscaService(repository);

    await service.buscar({ page: '2', limit: '10', nome: 'Silva', cpf: '123', bairro: 'Centro', nivel_risco: 'ALTO' });

    expect(repository.buscar).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      nome: 'Silva',
      cpf: '123',
      bairro: 'Centro',
      nivel_risco: 'ALTO',
    });
  });

  it('ignora parametros nao string mantendo undefined no filtro', async () => {
    const repository = { buscar: jest.fn().mockResolvedValue({ total: 0, page: 1, limit: 5, resultados: [] }) } as unknown as jest.Mocked<CadastroBuscaRepository>;
    const service = new CadastroBuscaService(repository);

    await service.buscar({ nome: 42, page: undefined });

    expect(repository.buscar).toHaveBeenCalledWith(expect.objectContaining({ nome: undefined }));
  });
});
