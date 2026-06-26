import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined } from '../helpers/objects';
import { CreateNucleoFamiliarDTO } from '../models/dto/CreateNucleoFamiliarDTO';
import { UpdateNucleoFamiliarDTO } from '../models/dto/UpdateNucleoFamiliarDTO';
import { NucleoFamiliar } from '../models/domain/NucleoFamiliar';
import { NucleoFamiliar as NucleoFamiliarRow } from '../database/SupabaseSchema';

export class NucleoFamiliarRepository {
  async findAll(): Promise<NucleoFamiliar[]> {
    const { data, error } = await supabase.from('nucleo_familiar').select('*');
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toNucleoFamiliar(row));
  }

  async findById(id: number): Promise<NucleoFamiliar | null> {
    const { data, error } = await supabase.from('nucleo_familiar').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data ? this.toNucleoFamiliar(data) : null;
  }

  async create(payload: CreateNucleoFamiliarDTO): Promise<NucleoFamiliar> {
    const { data, error } = await supabase
      .from('nucleo_familiar')
      .insert({
        nome_nucleo: payload.nome_nucleo,
        id_casa: payload.id_casa,
        id_cadastrador: payload.id_cadastrador,
        id_chefe_familia: payload.id_chefe_familia ?? null,
        observacao: payload.observacao ?? null,
        tempo_residencia_domicilio: payload.tempo_residencia_domicilio ?? null,
        tempo_residencia_area: payload.tempo_residencia_area ?? null,
        tempo_residencia_municipio: payload.tempo_residencia_municipio ?? null,
        renda_familiar_total: payload.renda_familiar_total ?? null,
      })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toNucleoFamiliar(data);
  }

  async update(id: number, payload: UpdateNucleoFamiliarDTO): Promise<NucleoFamiliar> {
    const { data, error } = await supabase
      .from('nucleo_familiar')
      .update(
        pickDefined(payload, [
          'nome_nucleo', 'id_casa', 'id_chefe_familia', 'observacao',
          'tempo_residencia_domicilio', 'tempo_residencia_area',
          'tempo_residencia_municipio', 'renda_familiar_total',
        ]),
      )
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toNucleoFamiliar(data);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('nucleo_familiar').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }

  private toNucleoFamiliar(row: NucleoFamiliarRow): NucleoFamiliar {
    return {
      id: row.id,
      nome_nucleo: row.nome_nucleo,
      id_casa: row.id_casa,
      id_cadastrador: row.id_cadastrador,
      id_chefe_familia: row.id_chefe_familia,
      observacao: row.observacao,
      tempo_residencia_domicilio: row.tempo_residencia_domicilio === null ? null : Number(row.tempo_residencia_domicilio),
      tempo_residencia_area: row.tempo_residencia_area === null ? null : Number(row.tempo_residencia_area),
      tempo_residencia_municipio: row.tempo_residencia_municipio === null ? null : Number(row.tempo_residencia_municipio),
      renda_familiar_total: row.renda_familiar_total === null ? null : Number(row.renda_familiar_total),
    };
  }
}
