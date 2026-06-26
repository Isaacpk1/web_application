import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

type AdminClient = ReturnType<typeof createClient<any>>;

function requireEnv(name: string, fallbackNames: string[] = []): string {
  const value = [name, ...fallbackNames].map((envName) => process.env[envName]).find(Boolean);

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${[name, ...fallbackNames].join(' ou ')}`);
  }

  return value;
}

async function findUserByEmail(supabaseAdmin: AdminClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', ['DATABASE_KEY', 'SUPABASE_KEY']);
  const email = requireEnv('ADMIN_EMAIL').trim().toLowerCase();
  const password = requireEnv('ADMIN_PASSWORD');
  const nome = process.env.ADMIN_NAME?.trim() || 'Administrador';

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existingUser = await findUserByEmail(supabaseAdmin, email);
  const userMetadata = { role: 'admin', nome };

  if (existingUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: {
        ...existingUser.user_metadata,
        ...userMetadata,
      },
    });

    if (error) throw error;

    console.log(`Admin atualizado: ${data.user.email}`);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) throw error;

  console.log(`Admin criado: ${data.user.email}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha ao criar admin: ${message}`);
  process.exitCode = 1;
});
