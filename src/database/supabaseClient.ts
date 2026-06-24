import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';
import { Database } from './SupabaseSchema';

/**
 * Cliente tipado do Supabase usado pelos repositories da aplicacao.
 *
 * @remarks
 * A instancia usa as variaveis carregadas em `env` e o contrato `Database`
 * para oferecer tipagem das tabelas declaradas em `SupabaseSchema`.
 *
 * @returns Instancia configurada do Supabase pronta para consultas e mutacoes.
 *
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('individuo').select('*');
 * ```
 */
/** Cliente com service role — usado pelos repositories (acesso total). */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey);

/** Cliente com anon key — usado exclusivamente para autenticacao de usuarios. */
export const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey);
