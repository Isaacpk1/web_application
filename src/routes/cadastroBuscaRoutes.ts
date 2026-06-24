import { Router } from 'express';

import { CadastroBuscaController } from '../controllers/CadastroBuscaController';
import { CadastroMapaController } from '../controllers/CadastroMapaController';

const router = Router();
const controller = new CadastroBuscaController();
const mapaController = new CadastroMapaController();

/**
 * @swagger
 * /cadastros/busca:
 *   get:
 *     summary: Busca paginada de cadastros (nucleo familiar + casa + responsavel)
 *     tags: [Apoio - Cadastros]
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema: { type: string }
 *       - in: query
 *         name: cpf
 *         schema: { type: string }
 *       - in: query
 *         name: bairro
 *         schema: { type: string }
 *       - in: query
 *         name: nivel_risco
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pagina de cadastros encontrada com sucesso.
 */
router.get('/busca', controller.buscar);

/**
 * @swagger
 * /cadastros/mapa:
 *   get:
 *     summary: Pontos georreferenciados para o mapa de risco
 *     tags: [Apoio - Cadastros]
 *     parameters:
 *       - in: query
 *         name: bairro
 *         schema: { type: string }
 *       - in: query
 *         name: nivel_risco
 *         schema: { type: string, enum: [MUITO_ALTO, ALTO, MEDIO, BAIXO] }
 *       - in: query
 *         name: genero
 *         schema: { type: string }
 *       - in: query
 *         name: tipo_construcao
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pontos do mapa carregados com sucesso
 */
router.get('/mapa', mapaController.listar);

export { router as cadastroBuscaRoutes };
