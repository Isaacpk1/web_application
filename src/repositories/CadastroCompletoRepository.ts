import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { CreateCadastroCompletoDTO } from '../models/dto/CreateCadastroCompletoDTO';

export class CadastroCompletoRepository {
  async criar(chaveIdempotencia: string, payload: CreateCadastroCompletoDTO): Promise<unknown> {
    const client = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
    };
    const { data, error } = await client.rpc('criar_cadastro_completo', {
      p_chave_idempotencia: chaveIdempotencia,
      p_payload: payload,
    });
    if (error) throwDatabaseError(error);
    return data;
  }
}
