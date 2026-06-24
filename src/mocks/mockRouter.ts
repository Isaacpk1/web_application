import { Request, Response, Router } from 'express';

import { formatError, formatSuccess } from '../views/responseFormatter';
import { mockStore } from './mockStore';

/**
 * MODO MOCK — autenticação e dados falsos para desenvolvimento/testes.
 *
 * @remarks
 * Ativado quando `MOCK_AUTH=true`. Emula o contrato da API real para que o
 * frontend funcione sem usuário no Supabase nem dados no banco. Quando o flag
 * está desligado, nada disto é montado e a API real é usada normalmente.
 */
export const isMockMode = (): boolean => process.env.MOCK_AUTH === 'true';

/** Credenciais do login de teste (administrador). */
export const MOCK_CREDENTIALS = {
  email: 'admin@georisco.sp.gov.br',
  senha: 'georisco123',
};

/** Credenciais do login de teste (agente de campo — usado no fluxo /agente/cadastro). */
export const MOCK_AGENTE_CREDENTIALS = {
  email: 'agente@georisco.sp.gov.br',
  senha: 'agente123',
};

const MOCK_LOGINS = [
  {
    credentials: MOCK_CREDENTIALS,
    token: 'mock-token-georisco-dev',
    usuario: { id: 'mock-user-0001', email: MOCK_CREDENTIALS.email, nome: 'Administrador (Mock)', role: 'admin' },
  },
  {
    credentials: MOCK_AGENTE_CREDENTIALS,
    token: 'mock-token-georisco-agente',
    usuario: { id: 'mock-user-0002', email: MOCK_AGENTE_CREDENTIALS.email, nome: 'Agente de Campo (Mock)', role: 'agente' },
  },
];

/* ---------------------------------------------------------------------------
   Auth mock — POST /login, POST /logout
   --------------------------------------------------------------------------- */
const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response): void => {
  const { email, senha } = req.body ?? {};
  const emailNorm = String(email).trim().toLowerCase();

  const match = MOCK_LOGINS.find(
    (login) => login.credentials.email === emailNorm && login.credentials.senha === String(senha),
  );

  if (!match) {
    res.status(401).json(formatError('Credenciais invalidas (modo mock)', 401));
    return;
  }

  res.status(200).json(
    formatSuccess({ token: match.token, usuario: match.usuario }, 'Login realizado com sucesso (mock)'),
  );
});

authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.status(200).json(formatSuccess(null, 'Logout realizado com sucesso (mock)'));
});

/* ---------------------------------------------------------------------------
   Data mock — endpoints consumidos pelas telas (mesmo contrato da API real)
   --------------------------------------------------------------------------- */
const dataRouter = Router();
// As rotas locais de desenvolvimento sao abertas para facilitar a validacao
// direta no navegador. O mock nunca acessa dados reais.

// Análise de Dados — /cadastros/busca usa o endpoint real (ver cadastroBuscaRoutes.ts),
// nao o mock, para refletir os cadastros de verdade feitos no fluxo do agente.

// Busca paginada de famílias (usada pela tela /familias)
dataRouter.get('/cadastros/busca', (req: Request, res: Response): void => {
  const { nome, cpf, bairro, nivel_risco, page: pageStr, limit: limitStr } = req.query;
  const result = mockStore.search({
    nome:        nome        ? String(nome)        : undefined,
    cpf:         cpf         ? String(cpf)         : undefined,
    bairro:      bairro      ? String(bairro)      : undefined,
    nivel_risco: nivel_risco ? String(nivel_risco) : undefined,
    page:  Number(pageStr  || 1),
    limit: Number(limitStr || 10),
  });

  const resultados = result.resultados.map((r) => ({
    id:               r.id,
    nome_familia:     r.nome_familia,
    nome_responsavel: r.nome_responsavel,
    cpf:              r.cpf,
    bairro:           r.bairro,
    nivel_risco:      r.nivel_risco,
    qtd_membros:      r.qtd_membros,
    cadastro_completo: r.cadastro_completo,
    data_cadastro:    r.ultima_visita,
  }));

  res.status(200).json(
    formatSuccess(
      { resultados, total: result.total, page: result.page, limit: result.limit },
      'Busca realizada com sucesso (mock)',
    ),
  );
});

// Completude dos cadastros
dataRouter.get('/completude', (req: Request, res: Response): void => {
  const aba = req.query.aba ? String(req.query.aba) : '';
  const todas = mockStore.filter({}).map((f) => {
    const preenchidos = [
      f.nome_responsavel,
      f.cpf_responsavel,
      f.telefone,
      f.renda_familiar > 0,
      f.bairro,
      f.imovel?.logradouro,
      f.imovel?.numero,
      f.imovel?.cep,
      f.data_nascimento_responsavel,
      f.genero_responsavel,
    ].filter(Boolean).length;
    return {
      id: f.id,
      nome_familia: f.nome_familia,
      nome_responsavel: f.nome_responsavel,
      data_cadastro: f.created_at,
      campos_preenchidos: preenchidos,
      campos_total: 10,
      completo: f.cadastro_completo,
      nivel_risco: f.nivel_risco,
    };
  });

  const total = todas.length;
  const completos = todas.filter((i) => i.completo).length;
  const incompletos = total - completos;
  const taxa = total > 0 ? Math.round((completos / total) * 100) : 0;

  const items =
    aba === 'completos' ? todas.filter((i) => i.completo)
    : aba === 'incompletos' ? todas.filter((i) => !i.completo)
    : todas;

  res.status(200).json(
    formatSuccess({ stats: { total, completos, incompletos, taxa }, items }, 'Completude calculada (mock)'),
  );
});

// Mapa de risco — todos os pontos com coordenadas e nível de risco
dataRouter.get('/cadastros/mapa', (req: Request, res: Response): void => {
  const { bairro, nivel_risco, genero, tipo_construcao } = req.query;
  let lista = mockStore.filter({
    bairro: bairro ? String(bairro) : undefined,
    nivel_risco: nivel_risco ? String(nivel_risco) : undefined,
  });
  if (genero) lista = lista.filter((f) => f.genero_responsavel === String(genero));
  if (tipo_construcao) lista = lista.filter((f) => f.imovel?.tipo_construcao === String(tipo_construcao));
  const pontos = lista.map((f) => ({
    lat: f.latitude,
    lng: f.longitude,
    nivel_risco: f.nivel_risco,
    nome_familia: f.nome_familia,
    bairro: f.bairro,
    responsavel: f.nome_responsavel,
  }));
  res.status(200).json(formatSuccess({ total: pontos.length, pontos }, 'Pontos do mapa (mock)'));
});

// Cadastro — leitura para visualização/edição
dataRouter.get('/familias/:id', (req: Request, res: Response): void => {
  const familia = mockStore.getFamilia(String(req.params.id));
  if (!familia) {
    res.status(404).json(formatError('Familia nao encontrada', 404));
    return;
  }
  res.status(200).json(formatSuccess(familia, 'Familia encontrada com sucesso (mock)'));
});

dataRouter.get('/imoveis/familia/:familiaId', (req: Request, res: Response): void => {
  res.status(200).json(
    formatSuccess(mockStore.getImovelByFamilia(String(req.params.familiaId)), 'Imoveis listados (mock)'),
  );
});

dataRouter.get('/vulnerabilidades/familia/:familiaId', (req: Request, res: Response): void => {
  res.status(200).json(
    formatSuccess(mockStore.getVulnByFamilia(String(req.params.familiaId)), 'Vulnerabilidades listadas (mock)'),
  );
});

// Cadastro — criação (3 passos) e edição
dataRouter.post('/familias', (req: Request, res: Response): void => {
  const familia = mockStore.createFamilia(req.body ?? {});
  res.status(201).json(formatSuccess(familia, 'Familia cadastrada com sucesso (mock)'));
});

dataRouter.put('/familias/:id', (req: Request, res: Response): void => {
  const familia = mockStore.updateFamilia(String(req.params.id), req.body ?? {});
  if (!familia) {
    res.status(404).json(formatError('Familia nao encontrada', 404));
    return;
  }
  res.status(200).json(formatSuccess(familia, 'Familia atualizada com sucesso (mock)'));
});

dataRouter.post('/imoveis', (req: Request, res: Response): void => {
  const imovel = mockStore.upsertImovel(String(req.body?.familia_id), req.body ?? {});
  if (!imovel) {
    res.status(404).json(formatError('Familia nao encontrada para vincular o imovel', 404));
    return;
  }
  res.status(201).json(formatSuccess(imovel, 'Imovel cadastrado com sucesso (mock)'));
});

dataRouter.post('/vulnerabilidades', (req: Request, res: Response): void => {
  const vuln = mockStore.upsertVulnerabilidade(String(req.body?.nucleo_familiar_id), req.body ?? {});
  if (!vuln) {
    res.status(404).json(formatError('Nucleo familiar nao encontrado', 404));
    return;
  }
  res.status(201).json(formatSuccess(vuln, 'Vulnerabilidade cadastrada com sucesso (mock)'));
});

export { authRouter as mockAuthRoutes, dataRouter as mockApiRoutes };
