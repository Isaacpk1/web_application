import { Router } from 'express';

import { CompletudeController } from '../controllers/CompletudeController';

const router = Router();
const controller = new CompletudeController();

/**
 * @swagger
 * /completude:
 *   get:
 *     summary: Índice de completude dos cadastros por núcleo familiar
 *     tags: [Apoio - Cadastros]
 *     parameters:
 *       - in: query
 *         name: aba
 *         schema:
 *           type: string
 *           enum: [completos, incompletos]
 *         description: Filtra por status de completude
 *     responses:
 *       200:
 *         description: Completude calculada com sucesso
 */
router.get('/', controller.listar);

export { router as completudeRoutes };
