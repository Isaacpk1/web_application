import { Router } from 'express';
import { CadastroCompletoController } from '../controllers/CadastroCompletoController';
const router = Router();
/** @swagger
 * /cadastros-completos:
 *   post:
 *     summary: Cria um cadastro familiar de forma atomica e idempotente
 *     tags: [Cadastro completo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCadastroCompleto'
 *     responses:
 *       201: { description: Cadastro criado ou resultado de reenvio retornado }
 *       400: { description: Payload ou chave de idempotencia invalida }
 *       409: { description: CPF, NIS ou responsavel duplicado }
 */
router.post('/', new CadastroCompletoController().criar);
export { router as cadastroCompletoRoutes };
