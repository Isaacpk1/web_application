import { app } from './app';
import { env } from './config/env';

/**
 * Inicializa o servidor HTTP da WebAPI.
 *
 * @remarks
 * Usa a porta configurada nas variaveis de ambiente validadas pelo modulo `env`.
 * Este arquivo atua como ponto de entrada da aplicacao em execucao local ou deploy.
 */
const server = app.listen(env.port, () => {
  console.log(`Servidor rodando na porta ${env.port}`);
});

// Mantem o processo Node ativo enquanto o servidor HTTP estiver aceitando requisicoes.
server.ref();

server.on('error', (error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
});
