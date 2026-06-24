import { supabase } from '../../database/supabaseClient';
import { CadastroMapaRepository } from '../../repositories/CadastroMapaRepository';
import { CadastroMapaService } from '../../services/CadastroMapaService';

jest.mock('../../database/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const setor = { id: 1, nome_regiao: 'NORTE', tipo_risco: 'Deslizamento', grau_risco: 'Alto' };
const casa = {
  id: 1, id_setor: 1, bairro: 'Centro', cep: '01234-000',
  logradouro: 'Rua A', numero: '100', tipo_construcao: 'Alvenaria',
  coordenada_lat: -23.6639, coordenada_long: -46.5383,
  observacao: null, uso_imovel: 'Residencial', status_imovel: 'Sadio', data_interdicao: null,
};
const nucleo = {
  id: 1, nome_nucleo: 'Familia Silva', id_casa: 1, id_chefe_familia: 10,
  id_cadastrador: 5, renda_familiar_total: 1800, observacao: null,
  tempo_residencia_domicilio: null, tempo_residencia_area: null, tempo_residencia_municipio: null,
};
const chefe = {
  id: 10, id_nucleo_familiar: 1, nome_completo: 'Joao Silva', cpf: '52998224725',
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

// ── CadastroMapaRepository ────────────────────────────────────────────────────

describe('CadastroMapaRepository', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna ponto com shape correto', async () => {
    mockSupabase();
    const pontos = await new CadastroMapaRepository().listar({});

    expect(pontos).toHaveLength(1);
    expect(pontos[0]).toMatchObject({
      lat: -23.6639,
      lng: -46.5383,
      nivel_risco: 'ALTO',
      nome_familia: 'Familia Silva',
      bairro: 'Centro',
      responsavel: 'Joao Silva',
    });
  });

  it('exclui casas sem coordenadas', async () => {
    const casaSemCoord = { ...casa, coordenada_lat: 0, coordenada_long: 0 };
    mockSupabase([nucleo], [casaSemCoord], [setor], [chefe]);
    const pontos = await new CadastroMapaRepository().listar({});
    expect(pontos).toHaveLength(0);
  });

  it('exclui casas com coordenadas nulas', async () => {
    const casaNula = { ...casa, coordenada_lat: null, coordenada_long: null };
    mockSupabase([nucleo], [casaNula], [setor], [chefe]);
    const pontos = await new CadastroMapaRepository().listar({});
    expect(pontos).toHaveLength(0);
  });

  it('filtra por bairro de forma case-insensitive e parcial', async () => {
    mockSupabase();
    const r = await new CadastroMapaRepository().listar({ bairro: 'centro' });
    expect(r).toHaveLength(1);

    mockSupabase();
    const nenhum = await new CadastroMapaRepository().listar({ bairro: 'jardins' });
    expect(nenhum).toHaveLength(0);
  });

  it('filtra por nivel_risco exato', async () => {
    mockSupabase();
    const alto = await new CadastroMapaRepository().listar({ nivel_risco: 'ALTO' });
    expect(alto).toHaveLength(1);

    mockSupabase();
    const baixo = await new CadastroMapaRepository().listar({ nivel_risco: 'BAIXO' });
    expect(baixo).toHaveLength(0);
  });

  it('filtra por tipo_construcao', async () => {
    mockSupabase();
    const r = await new CadastroMapaRepository().listar({ tipo_construcao: 'Alvenaria' });
    expect(r).toHaveLength(1);

    mockSupabase();
    const nenhum = await new CadastroMapaRepository().listar({ tipo_construcao: 'Madeira' });
    expect(nenhum).toHaveLength(0);
  });

  it('filtra por genero do chefe de familia', async () => {
    mockSupabase();
    const masc = await new CadastroMapaRepository().listar({ genero: 'Masculino' });
    expect(masc).toHaveLength(1);

    mockSupabase();
    const fem = await new CadastroMapaRepository().listar({ genero: 'Feminino' });
    expect(fem).toHaveLength(0);
  });

  it('exibe responsavel nulo quando nucleo nao tem chefe', async () => {
    const semChefe = { ...nucleo, id_chefe_familia: null };
    mockSupabase([semChefe], [casa], [setor], [chefe]);
    const pontos = await new CadastroMapaRepository().listar({});
    expect(pontos[0].responsavel).toBeNull();
  });
});

// ── CadastroMapaService ───────────────────────────────────────────────────────

describe('CadastroMapaService', () => {
  it('retorna total e pontos agrupados', async () => {
    const repository = {
      listar: jest.fn().mockResolvedValue([
        { lat: -23.6, lng: -46.5, nivel_risco: 'ALTO', nome_familia: 'Familia A', bairro: 'Centro', responsavel: 'Maria' },
      ]),
    } as unknown as jest.Mocked<CadastroMapaRepository>;

    const result = await new CadastroMapaService(repository).listar({});

    expect(result.total).toBe(1);
    expect(result.pontos).toHaveLength(1);
  });

  it('passa filtros parseados ao repository', async () => {
    const repository = { listar: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<CadastroMapaRepository>;

    await new CadastroMapaService(repository).listar({
      bairro: 'Centro', nivel_risco: 'ALTO', genero: 'Feminino', tipo_construcao: 'Alvenaria',
    });

    expect(repository.listar).toHaveBeenCalledWith({
      bairro: 'Centro', nivel_risco: 'ALTO', genero: 'Feminino', tipo_construcao: 'Alvenaria',
    });
  });

  it('ignora parametros nao string mantendo undefined no filtro', async () => {
    const repository = { listar: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<CadastroMapaRepository>;

    await new CadastroMapaService(repository).listar({ bairro: 123, nivel_risco: null });

    expect(repository.listar).toHaveBeenCalledWith(expect.objectContaining({ bairro: undefined, nivel_risco: undefined }));
  });
});
