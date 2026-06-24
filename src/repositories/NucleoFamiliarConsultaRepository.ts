import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';

export class NucleoFamiliarConsultaRepository {
  async findCasaIdByNucleoFamiliarId(nucleoFamiliarId: number): Promise<number | null> {
    const { data, error } = await supabase
      .from('nucleo_familiar')
      .select('id_casa')
      .eq('id', nucleoFamiliarId)
      .maybeSingle();

    if (error) throwDatabaseError(error);

    return data?.id_casa ?? null;
  }

  async findSetorIdByNucleoFamiliarId(nucleoFamiliarId: number): Promise<number | null> {
    const casaId = await this.findCasaIdByNucleoFamiliarId(nucleoFamiliarId);
    if (!casaId) return null;

    const { data, error } = await supabase.from('casa').select('id_setor').eq('id', casaId).maybeSingle();

    if (error) throwDatabaseError(error);

    return data?.id_setor ?? null;
  }
}
