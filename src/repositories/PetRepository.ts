import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { pickDefined } from '../helpers/objects';
import { CreatePetDTO } from '../models/dto/CreatePetDTO';
import { UpdatePetDTO } from '../models/dto/UpdatePetDTO';
import { Pet } from '../models/domain/Pet';

export class PetRepository {
  async findAll(): Promise<Pet[]> {
    const { data, error } = await supabase.from('pet').select('*');
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toPet(row));
  }

  async findById(id: number): Promise<Pet | null> {
    const { data, error } = await supabase.from('pet').select('*').eq('id', id).maybeSingle();
    if (error) throwDatabaseError(error);
    return data ? this.toPet(data) : null;
  }

  async findByNucleoFamiliarId(idNucleoFamiliar: number): Promise<Pet[]> {
    const { data, error } = await supabase.from('pet').select('*').eq('id_nucleo_familiar', idNucleoFamiliar);
    if (error) throwDatabaseError(error);
    return (data ?? []).map((row) => this.toPet(row));
  }

  async create(payload: CreatePetDTO): Promise<Pet> {
    const { data, error } = await supabase
      .from('pet')
      .insert({
        id_nucleo_familiar: payload.id_nucleo_familiar,
        tipo: payload.tipo ?? null,
        porte: payload.porte ?? null,
        imagem: payload.imagem ?? null,
        quantidade: payload.quantidade ?? null,
      })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toPet(data);
  }

  async update(id: number, payload: UpdatePetDTO): Promise<Pet> {
    const { data, error } = await supabase
      .from('pet')
      .update(pickDefined(payload, ['id_nucleo_familiar', 'tipo', 'porte', 'imagem', 'quantidade']))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    return this.toPet(data);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('pet').delete().eq('id', id);
    if (error) throwDatabaseError(error);
  }

  private toPet(row: Record<string, unknown>): Pet {
    return {
      id: row['id'] as number,
      id_nucleo_familiar: row['id_nucleo_familiar'] as number,
      tipo: (row['tipo'] as string | null) ?? null,
      porte: (row['porte'] as string | null) ?? null,
      imagem: (row['imagem'] as string | null) ?? null,
      quantidade: row['quantidade'] === null ? null : Number(row['quantidade']),
    };
  }
}
