import path from 'path';

import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiSpec } from './docs/openapi';
import { cors } from './middlewares/cors';
import { isMockMode, mockAuthRoutes, mockApiRoutes } from './mocks/mockRouter';
import { router } from './routes';
import { formatError, formatSuccess } from './views/responseFormatter';

const app = express();
// Na Vercel o handler e empacotado em `api/`; os templates sao incluidos a
// partir da raiz do projeto. No servidor compilado local, permanecem em dist.
const runningOnVercel = Boolean(process.env.VERCEL);
const publicDir = runningOnVercel
  ? path.join(process.cwd(), 'public')
  : path.join(__dirname, '../public');
const viewsDir = runningOnVercel
  ? path.join(process.cwd(), 'src', 'views')
  : path.join(__dirname, 'views');

app.set('view engine', 'ejs');
app.set('views', viewsDir);

app.use(cors);
app.use(express.json());
app.use(express.static(publicDir, { index: false }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(formatSuccess({ status: 'ok' }, 'Servidor operacional'));
});

app.get('/openapi.json', (_req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

if (isMockMode()) {
  app.use('/api/v1/auth', mockAuthRoutes);
  app.use('/api/v1', mockApiRoutes);
}

app.use('/api/v1', router);

/* ── Rotas de página (EJS) ── */
app.get('/login', (_req: Request, res: Response) => {
  res.render('login', { title: 'GeoRisco — Entrar' });
});

app.get('/', (_req: Request, res: Response) => {
  res.redirect('/login');
});

app.get('/admin/analise-dados', (_req: Request, res: Response) => {
  res.render('analise-dados', { title: 'GeoRisco — Análise de Dados' });
});

app.get('/familias', (_req: Request, res: Response) => {
  res.render('familias', { title: 'GeoRisco — Cadastro de Famílias' });
});

app.get('/mapa', (_req: Request, res: Response) => {
  res.render('mapa', { title: 'GeoRisco — Mapa de Risco' });
});

app.get('/completude', (_req: Request, res: Response) => {
  res.render('completude', { title: 'GeoRisco — Acompanhamento de Completude' });
});

app.get('/relatorios', (_req: Request, res: Response) => {
  res.render('relatorios', { title: 'GeoRisco — Relatórios' });
});

app.get('/agente/cadastro', (_req: Request, res: Response) => {
  res.render('agente-cadastro', { title: 'GeoRisco — Cadastro de Família' });
});

app.get('/cadastro', (_req: Request, res: Response) => {
  res.redirect('/agente/cadastro');
});

app.use((_req: Request, res: Response) => {
  res.status(404).json(formatError('Rota nao encontrada', 404));
});

export { app };
