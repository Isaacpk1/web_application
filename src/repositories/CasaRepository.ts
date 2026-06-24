import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined } from '../helpers/objects';
import { CreateCasaDTO } from '../models/dto/CreateCasaDTO';
import { UpdateCasaDTO } from '../models/dto/UpdateCasaDTO';
import { Casa } from '../models/domain/Casa';
import { Casa as CasaRow } from '../database/SupabaseSchema';

export class CasaRepository {
  async findAll(): Promise<Casa[]> {
    const { data, error } = await supabase.from('casa').select('*');
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toCasa(row));
  }

  async findById(id: number): Promise<Casa | null> {
    const { data, error } = await supabase.from('casa').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data ? this.toCasa(data) : null;
  }

  async create(payload: CreateCasaDTO): Promise<Casa> {
    const { data, error } = await supabase
      .from('casa')
      .insert({
        id_setor: payload.id_setor,
        coordenada_lat: payload.coordenada_lat,
        coordenada_long: payload.coordenada_long,
        logradouro: payload.logradouro,
        numero: payload.numero,
        observacao: payload.observacao ?? null,
        bairro: payload.bairro,
        cep: payload.cep ?? null,
        tipo_construcao: payload.tipo_construcao,
        uso_imovel: payload.uso_imovel,
        status_imovel: payload.status_imovel ?? 'Sadio',
        data_interdicao: payload.data_interdicao ?? null,
      })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toCasa(data);
  }

  async update(id: number, payload: UpdateCasaDTO): Promise<Casa> {
    const { data, error } = await supabase
      .from('casa')
      .update(
        pickDefined(payload, [
          'id_setor', 'coordenada_lat', 'coordenada_long', 'logradouro',
          'numero', 'observacao', 'bairro', 'cep',
          'tipo_construcao', 'uso_imovel', 'status_imovel', 'data_interdicao',
        ]),
      )
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toCasa(data);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('casa').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }

  private toCasa(row: CasaRow): Casa {
    return {
      id: row.id,
      id_setor: row.id_setor,
      coordenada_lat: Number(row.coordenada_lat),
      coordenada_long: Number(row.coordenada_long),
      logradouro: row.logradouro,
      numero: row.numero,
      observacao: row.observacao,
      bairro: row.bairro,
      cep: row.cep,
      tipo_construcao: row.tipo_construcao as Casa['tipo_construcao'],
      uso_imovel: row.uso_imovel as Casa['uso_imovel'],
      status_imovel: row.status_imovel as Casa['status_imovel'],
      data_interdicao: row.data_interdicao,
    };
  }
}
