import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined, withDefaults } from '../helpers/objects';
import { CreateIndividuoDTO } from '../models/dto/CreateIndividuoDTO';
import { UpdateIndividuoDTO } from '../models/dto/UpdateIndividuoDTO';
import { Individuo } from '../models/domain/Individuo';
import { Individuo as IndividuoRow, IndividuoInsert } from '../database/SupabaseSchema';

const individuoCreateDefaults: Partial<IndividuoInsert> = {
  apelido: null,
  nome_social: null,
  cor_raca: null,
  uf: null,
  estado_civil: null,
  profissao: null,
  nome_mae: null,
  nome_pai: null,
  grau_parentesco: null,
  escolaridade: null,
  situacao_ocupacional: null,
  cpf: null,
  doc_estrangeiro: null,
  rg: null,
  nis: null,
  telefone: null,
  email: null,
  status_vital: 'Vivo',
  data_obito: null,
  semanas_gestacao: null,
};

export class IndividuoRepository {
  async findAll(): Promise<Individuo[]> {
    const { data, error } = await supabase.from('individuo').select('*');
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toIndividuo(row));
  }

  async findById(id: number): Promise<Individuo | null> {
    const { data, error } = await supabase.from('individuo').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data ? this.toIndividuo(data) : null;
  }

  async findByNucleoFamiliarId(idNucleoFamiliar: number): Promise<Individuo[]> {
    const { data, error } = await supabase.from('individuo').select('*').eq('id_nucleo_familiar', idNucleoFamiliar);
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toIndividuo(row));
  }

  async existsByCpfOrNis(cpf?: string | null, nis?: string | null, excludeId?: number): Promise<boolean> {
    const filters = [cpf ? `cpf.eq.${cpf}` : null, nis ? `nis.eq.${nis}` : null].filter(Boolean).join(',');
    if (!filters) return false;

    let query = supabase.from('individuo').select('id').or(filters).limit(1);
    if (excludeId !== undefined) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) throwDatabaseError(error);
    return (data ?? []).length > 0;
  }

  async create(payload: CreateIndividuoDTO): Promise<Individuo> {
    const insertPayload = withDefaults(payload as IndividuoInsert, individuoCreateDefaults);
    const { data, error } = await supabase.from('individuo').insert(insertPayload).select('*').single();
    if (error) throwDatabaseError(error);
    return this.toIndividuo(data);
  }

  async update(id: number, payload: UpdateIndividuoDTO): Promise<Individuo> {
    const { data, error } = await supabase
      .from('individuo')
      .update(
        pickDefined(payload, [
          'id_nucleo_familiar', 'nome_completo', 'apelido', 'nome_social', 'data_nascimento',
          'genero', 'cor_raca', 'uf', 'estado_civil', 'profissao', 'nome_mae', 'nome_pai',
          'grau_parentesco', 'escolaridade', 'situacao_ocupacional', 'cpf', 'doc_estrangeiro',
          'rg', 'nis', 'telefone', 'email', 'status_vital', 'data_obito', 'semanas_gestacao',
        ]),
      )
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toIndividuo(data);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('individuo').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }

  private toIndividuo(row: IndividuoRow): Individuo {
    return {
      ...row,
      genero: row.genero as Individuo['genero'],
      cor_raca: row.cor_raca as Individuo['cor_raca'],
      estado_civil: row.estado_civil as Individuo['estado_civil'],
      status_vital: row.status_vital as Individuo['status_vital'],
      semanas_gestacao: row.semanas_gestacao === null ? null : Number(row.semanas_gestacao),
    };
  }
}
