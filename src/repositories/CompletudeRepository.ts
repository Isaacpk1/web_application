import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { Casa, Individuo, NucleoFamiliar, SetorApi } from '../database/SupabaseSchema';

export interface CompletudeItem {
  id: number;
  nome_familia: string;
  nome_responsavel: string | null;
  data_cadastro: string | null;
  campos_preenchidos: number;
  campos_total: number;
  completo: boolean;
  nivel_risco: string;
}

const CAMPOS_TOTAL = 10;

const GRAU_RISCO_PARA_NIVEL: Record<string, string> = {
  'Muito Alto': 'MUITO_ALTO',
  Alto: 'ALTO',
  Médio: 'MEDIO',
  Baixo: 'BAIXO',
};

function contarCampos(
  nucleo: NucleoFamiliar,
  casa: Casa | undefined,
  chefe: Individuo | undefined,
  qtdMembros: number,
): number {
  return [
    nucleo.id_chefe_familia != null,
    nucleo.renda_familiar_total != null,
    nucleo.id_cadastrador != null,
    qtdMembros > 0,
    Boolean(casa?.logradouro),
    Boolean(casa?.numero),
    Boolean(casa?.bairro),
    Boolean(casa?.cep),
    Boolean(chefe?.cpf),
    Boolean(chefe?.telefone),
  ].filter(Boolean).length;
}

export class CompletudeRepository {
  async listar(): Promise<CompletudeItem[]> {
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

    const casaPorId = new Map<number, Casa>((casas ?? []).map((c) => [c.id, c]));
    const setorPorId = new Map<number, SetorApi>((setores ?? []).map((s) => [s.id, s]));

    const individuosPorNucleo = new Map<number, Individuo[]>();
    for (const ind of individuos ?? []) {
      const lista = individuosPorNucleo.get(ind.id_nucleo_familiar) ?? [];
      lista.push(ind);
      individuosPorNucleo.set(ind.id_nucleo_familiar, lista);
    }

    return (nucleos ?? []).map((nucleo) => {
      const casa = casaPorId.get(nucleo.id_casa);
      const setor = casa ? setorPorId.get(casa.id_setor) : undefined;
      const membros = individuosPorNucleo.get(nucleo.id) ?? [];
      const chefe =
        nucleo.id_chefe_familia != null ? membros.find((m) => m.id === nucleo.id_chefe_familia) : undefined;

      const camposPreenchidos = contarCampos(nucleo, casa, chefe, membros.length);
      const nivelRisco = (setor?.grau_risco && GRAU_RISCO_PARA_NIVEL[setor.grau_risco]) || 'BAIXO';

      return {
        id: nucleo.id,
        nome_familia: nucleo.nome_nucleo,
        nome_responsavel: chefe?.nome_completo ?? null,
        data_cadastro: null,
        campos_preenchidos: camposPreenchidos,
        campos_total: CAMPOS_TOTAL,
        completo: camposPreenchidos === CAMPOS_TOTAL,
        nivel_risco: nivelRisco,
      };
    });
  }
}
