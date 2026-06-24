import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined } from '../helpers/objects';
import { CreateVulnerabilidadeDTO } from '../models/dto/CreateVulnerabilidadeDTO';
import { UpdateVulnerabilidadeDTO } from '../models/dto/UpdateVulnerabilidadeDTO';
import { IndividuoVulnerabilidade, Vulnerabilidade } from '../models/domain/Vulnerabilidade';

/**
 * Repository das tabelas `vulnerabilidade` e `individuo_vulnerabilidade`.
 */
export class VulnerabilidadeRepository {
  async findAll(): Promise<Vulnerabilidade[]> {
    const { data, error } = await supabase.from('vulnerabilidade').select('*');
    if (error) throwDatabaseError(error);
    return data ?? [];
  }

  async findById(id: number): Promise<Vulnerabilidade | null> {
    const { data, error } = await supabase.from('vulnerabilidade').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data;
  }

  async findByIndividuoId(idIndividuo: number): Promise<Vulnerabilidade[]> {
    const { data: links, error } = await supabase
      .from('individuo_vulnerabilidade')
      .select('id_vulnerabilidade')
      .eq('id_individuo', idIndividuo);
    if (error) throwDatabaseError(error);
    const ids = (links ?? []).map((link) => link.id_vulnerabilidade);
    if (ids.length === 0) return [];
    const { data, error: vulnerabilidadeError } = await supabase.from('vulnerabilidade').select('*').in('id', ids);
    if (vulnerabilidadeError) throwDatabaseError(vulnerabilidadeError);
    return data ?? [];
  }

  async create(payload: CreateVulnerabilidadeDTO): Promise<Vulnerabilidade> {
    const { data, error } = await supabase
      .from('vulnerabilidade')
      .insert({ tipo_vulnerabilidade: payload.tipo_vulnerabilidade })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return data;
  }

  async update(id: number, payload: UpdateVulnerabilidadeDTO): Promise<Vulnerabilidade> {
    const { data, error } = await supabase
      .from('vulnerabilidade')
      .update(pickDefined(payload, ['tipo_vulnerabilidade']))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('vulnerabilidade').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }

  async associate(link: IndividuoVulnerabilidade): Promise<IndividuoVulnerabilidade> {
    const { data, error } = await supabase
      .from('individuo_vulnerabilidade')
      .insert({ id_individuo: link.id_individuo, id_vulnerabilidade: link.id_vulnerabilidade })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return data;
  }

  async disassociate(link: IndividuoVulnerabilidade): Promise<void> {
    const { error } = await supabase
      .from('individuo_vulnerabilidade')
      .delete()
      .eq('id_individuo', link.id_individuo)
      .eq('id_vulnerabilidade', link.id_vulnerabilidade);
    if (error) throwDatabaseError(error);
  }
}
