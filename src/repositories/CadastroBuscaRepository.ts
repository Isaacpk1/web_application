import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { Casa, Individuo, NucleoFamiliar, SetorApi } from '../database/SupabaseSchema';

export interface CadastroBuscaFiltro {
  nome?: string;
  cpf?: string;
  bairro?: string;
  nivel_risco?: string;
  page?: number;
  limit?: number;
}

export interface CadastroBuscaResultado {
  id: number;
  nome_familia: string;
  nome_responsavel: string | null;
  codigo_setor: string | null;
  cpf: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  nivel_risco: string;
  prioridade_vulnerabilidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  renda_familiar: number | null;
  qtd_membros: number;
  cadastro_completo: boolean;
}

export interface CadastroBuscaPagina {
  total: number;
  page: number;
  limit: number;
  stats: {
    prioridade_alta: number;
    cadastros_completos: number;
  };
  resultados: CadastroBuscaResultado[];
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

const GRAU_RISCO_PARA_NIVEL: Record<string, string> = {
  'Muito Alto': 'MUITO_ALTO',
  Alto: 'ALTO',
  Médio: 'MEDIO',
  Baixo: 'BAIXO',
};

const NIVEL_PARA_PRIORIDADE: Record<string, 'ALTA' | 'MEDIA' | 'BAIXA'> = {
  MUITO_ALTO: 'ALTA',
  ALTO: 'ALTA',
  MEDIO: 'MEDIA',
  BAIXO: 'BAIXA',
};

export class CadastroBuscaRepository {
  /**
   * Junta nucleo_familiar + casa + setor + individuo em memoria.
   * Dataset deste projeto e pequeno o suficiente para nao precisar de
   * joins no banco; evita depender de relacionamentos do PostgREST.
   */
  async buscar(filtro: CadastroBuscaFiltro): Promise<CadastroBuscaPagina> {
    const [
      { data: nucleos, error: nucleosError },
      { data: casas, error: casasError },
      { data: setores, error: setoresError },
      { data: individuos, error: individuosError },
    ] = await Promise.all([
      supabase.from('nucleo_familiar').select('*'),
      supabase.from('casa').select('*'),
      supabase.from('setor_api').select('*'),
      supabase.from('individuo').select('*'),
    ]);

    if (nucleosError) throwDatabaseError(nucleosError);
    if (casasError) throwDatabaseError(casasError);
    if (setoresError) throwDatabaseError(setoresError);
    if (individuosError) throwDatabaseError(individuosError);

    const casaPorId = new Map<number, Casa>((casas ?? []).map((casa) => [casa.id, casa]));
    const setorPorId = new Map<number, SetorApi>((setores ?? []).map((setor) => [setor.id, setor]));

    const individuosPorNucleo = new Map<number, Individuo[]>();
    for (const individuo of individuos ?? []) {
      const lista = individuosPorNucleo.get(individuo.id_nucleo_familiar) ?? [];
      lista.push(individuo);
      individuosPorNucleo.set(individuo.id_nucleo_familiar, lista);
    }

    let resultados = (nucleos ?? []).map((nucleo) => this.toResultado(nucleo, casaPorId, setorPorId, individuosPorNucleo));
    resultados = this.aplicarFiltros(resultados, filtro);

    const total = resultados.length;
    const stats = {
      prioridade_alta: resultados.filter((r) => r.prioridade_vulnerabilidade === 'ALTA').length,
      cadastros_completos: resultados.filter((r) => r.cadastro_completo).length,
    };
    const page = Math.max(1, filtro.page ?? 1);
    const limit = Math.max(1, filtro.limit ?? 5);
    const inicio = (page - 1) * limit;

    return { total, page, limit, stats, resultados: resultados.slice(inicio, inicio + limit) };
  }

  private toResultado(
    nucleo: NucleoFamiliar,
    casaPorId: Map<number, Casa>,
    setorPorId: Map<number, SetorApi>,
    individuosPorNucleo: Map<number, Individuo[]>,
  ): CadastroBuscaResultado {
    const casa = casaPorId.get(nucleo.id_casa);
    const setor = casa ? setorPorId.get(casa.id_setor) : undefined;
    const membros = individuosPorNucleo.get(nucleo.id) ?? [];
    const chefe = nucleo.id_chefe_familia != null ? membros.find((m) => m.id === nucleo.id_chefe_familia) : undefined;

    const nivelRisco = (setor?.grau_risco && GRAU_RISCO_PARA_NIVEL[setor.grau_risco]) || 'BAIXO';

    return {
      id: nucleo.id,
      nome_familia: nucleo.nome_nucleo,
      nome_responsavel: chefe?.nome_completo ?? null,
      codigo_setor: setor?.codigo_setor ?? null,
      cpf: chefe?.cpf ?? null,
      logradouro: casa?.logradouro ?? null,
      numero: casa?.numero ?? null,
      bairro: casa?.bairro ?? null,
      nivel_risco: nivelRisco,
      prioridade_vulnerabilidade: NIVEL_PARA_PRIORIDADE[nivelRisco] ?? 'BAIXA',
      renda_familiar: nucleo.renda_familiar_total,
      qtd_membros: membros.length,
      cadastro_completo: nucleo.id_chefe_familia != null && membros.length > 0,
    };
  }

  private aplicarFiltros(resultados: CadastroBuscaResultado[], filtro: CadastroBuscaFiltro): CadastroBuscaResultado[] {
    let filtrados = resultados;

    if (filtro.nome) {
      const termo = filtro.nome.toLowerCase();
      filtrados = filtrados.filter(
        (r) => r.nome_familia.toLowerCase().includes(termo) || (r.nome_responsavel ?? '').toLowerCase().includes(termo),
      );
    }
    if (filtro.cpf) {
      const termo = onlyDigits(filtro.cpf);
      filtrados = filtrados.filter((r) => onlyDigits(r.cpf ?? '').includes(termo));
    }
    if (filtro.bairro) {
      const termo = filtro.bairro.toLowerCase();
      filtrados = filtrados.filter((r) => (r.bairro ?? '').toLowerCase().includes(termo));
    }
    if (filtro.nivel_risco) {
      filtrados = filtrados.filter((r) => r.nivel_risco === filtro.nivel_risco);
    }

    return filtrados;
  }
}
