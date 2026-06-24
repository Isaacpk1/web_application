import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined } from '../helpers/objects';
import { CreateCadastradorDTO } from '../models/dto/CreateCadastradorDTO';
import { UpdateCadastradorDTO } from '../models/dto/UpdateCadastradorDTO';
import { Cadastrador } from '../models/domain/Cadastrador';

export class CadastradorRepository {
  async findAll(): Promise<Cadastrador[]> {
    const { data, error } = await supabase.from('cadastrador').select('*');
    if (error) throwDatabaseError(error);
    return data ?? [];
  }
  async findById(id: number): Promise<Cadastrador | null> {
    const { data, error } = await supabase.from('cadastrador').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data;
  }
  async create(payload: CreateCadastradorDTO): Promise<Cadastrador> {
    const { data, error } = await supabase.from('cadastrador').insert({ nome: payload.nome, documento: payload.documento }).select('*').single();
    if (error) throwDatabaseError(error);
    return data;
  }
  async update(id: number, payload: UpdateCadastradorDTO): Promise<Cadastrador> {
    const { data, error } = await supabase
      .from('cadastrador')
      .update(pickDefined(payload, ['nome', 'documento']))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return data;
  }
  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('cadastrador').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }
}
