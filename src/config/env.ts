import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuracoes obrigatorias para inicializar a WebAPI.
 *
 * @remarks
 * Os valores sao lidos das variaveis de ambiente e usados pelos modulos de
 * servidor e conexao com Supabase.
 */
interface EnvConfig {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  supabaseStorageBucket: string;
}

/**
 * Busca uma variavel de ambiente obrigatoria.
 *
 * @remarks
 * Permite nomes alternativos para manter compatibilidade com ambientes que
 * usam chaves legadas, como DATABASE_KEY ou SUPABASE_KEY.
 *
 * @param name - Nome principal da variavel de ambiente.
 * @param fallbackNames - Nomes alternativos aceitos quando o principal nao existe.
 * @returns Valor encontrado na primeira variavel disponivel.
 * @throws Error quando nenhum dos nomes informados possui valor.
 */
function requireEnv(name: string, fallbackNames: string[] = []): string {
  const value = [name, ...fallbackNames].map((envName) => process.env[envName]).find((envValue) => envValue);

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${[name, ...fallbackNames].join(' ou ')}`);
  }

  return value;
}

/**
 * Configuracao validada e normalizada da aplicacao.
 *
 * @remarks
 * A porta assume 3000 quando PORT nao esta definida; as credenciais Supabase
 * continuam obrigatorias para evitar inicializacao com acesso incompleto.
 */
export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY', ['DATABASE_KEY', 'SUPABASE_KEY']),
  supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'cadastro-imagens',
};
