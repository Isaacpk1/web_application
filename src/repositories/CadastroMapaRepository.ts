import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { Casa, Individuo, SetorApi } from '../database/SupabaseSchema';

export interface CadastroMapaFiltro {
  bairro?: string;
  nivel_risco?: string;
  genero?: string;
  tipo_construcao?: string;
}

export interface MapaPonto {
  id: number;
  lat: number;
  lng: number;
  nivel_risco: string;
  nome_familia: string;
  bairro: string | null;
  responsavel: string | null;
}

const GRAU_RISCO_PARA_NIVEL: Record<string, string> = {
  'Muito Alto': 'MUITO_ALTO',
  Alto: 'ALTO',
  Médio: 'MEDIO',
  Baixo: 'BAIXO',
};

function throwIfQueryFailed(...errors: Array<{ message: string } | null>): void {
  const error = errors.find(Boolean);
  if (error) throwDatabaseError(error);
}

function matchesFilter(filtro: CadastroMapaFiltro, casa: Casa, nivelRisco: string, chefe?: Individuo): boolean {
  const bairroConfere = !filtro.bairro || casa.bairro.toLowerCase().includes(filtro.bairro.toLowerCase());
  const riscoConfere = !filtro.nivel_risco || nivelRisco === filtro.nivel_risco;
  const construcaoConfere = !filtro.tipo_construcao || casa.tipo_construcao === filtro.tipo_construcao;
  const generoConfere = !filtro.genero || chefe?.genero === filtro.genero;
  return bairroConfere && riscoConfere && construcaoConfere && generoConfere;
}

export class CadastroMapaRepository {
  // Orquestra quatro leituras e filtros independentes; as regras foram
  // extraidas acima, mas a coordenacao continua naturalmente ramificada.
  // eslint-disable-next-line complexity
  async listar(filtro: CadastroMapaFiltro): Promise<MapaPonto[]> {
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

    throwIfQueryFailed(nucleosError, casasError, setoresError, individuosError);

    const casaPorId = new Map<number, Casa>((casas ?? []).map((c) => [c.id, c]));
    const setorPorId = new Map<number, SetorApi>((setores ?? []).map((s) => [s.id, s]));

    const individuoPorId = new Map<number, Individuo>((individuos ?? []).map((i) => [i.id, i]));

    const pontos: MapaPonto[] = [];

    for (const nucleo of nucleos ?? []) {
      const casa = casaPorId.get(nucleo.id_casa);
      if (!casa || !casa.coordenada_lat || !casa.coordenada_long) continue;

      const setor = setorPorId.get(casa.id_setor);
      const chefe =
        nucleo.id_chefe_familia != null ? individuoPorId.get(nucleo.id_chefe_familia) : undefined;

      const nivelRisco = (setor?.grau_risco && GRAU_RISCO_PARA_NIVEL[setor.grau_risco]) || 'BAIXO';

      if (!matchesFilter(filtro, casa, nivelRisco, chefe)) continue;

      pontos.push({
        id: nucleo.id,
        lat: casa.coordenada_lat,
        lng: casa.coordenada_long,
        nivel_risco: nivelRisco,
        nome_familia: nucleo.nome_nucleo,
        bairro: casa.bairro ?? null,
        responsavel: chefe?.nome_completo ?? null,
      });
    }

    return pontos;
  }
}
