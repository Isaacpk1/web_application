import { Router } from 'express';

import { CasaController } from '../controllers/CasaController';

const router = Router();
const casaController = new CasaController();

/**
 * @swagger
 * /casas:
 *   get:
 *     summary: Lista todos os casas
 *     tags: [Apoio - Imóveis]
 *     responses:
 *       200:
 *         description: Imoveis listados com sucesso.
 */
router.get('/', casaController.findAll);

/**
 * @swagger
 * /casas/nucleos-familiares/{nucleoFamiliarId}:
 *   get:
 *     summary: Lista casas por nucleoFamiliar
 *     tags: [Apoio - Imóveis]
 *     parameters:
 *       - in: path
 *         name: nucleoFamiliarId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Imoveis da nucleoFamiliar listados com sucesso.
 */
router.get('/nucleos-familiares/:nucleoFamiliarId', casaController.findByNucleoFamiliarId);

/**
 * @swagger
 * /casas/{id}:
 *   get:
 *     summary: Busca um casa por ID
 *     tags: [Apoio - Imóveis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Casa encontrado com sucesso.
 */
router.get('/:id', casaController.findById);

/**
 * @swagger
 * /casas:
 *   post:
 *     summary: Cria um novo casa
 *     tags: [Apoio - Imóveis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCasa'
 *     responses:
 *       201:
 *         description: Casa cadastrado com sucesso.
 */
router.post('/', casaController.create);

/**
 * @swagger
 * /casas/{id}:
 *   put:
 *     summary: Atualiza um casa
 *     tags: [Apoio - Imóveis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCasa'
 *     responses:
 *       200:
 *         description: Casa atualizado com sucesso.
 */
router.put('/:id', casaController.update);

/**
 * @swagger
 * /casas/{id}:
 *   delete:
 *     summary: Remove um casa
 *     tags: [Apoio - Imóveis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Casa removido com sucesso.
 */
router.delete('/:id', casaController.delete);

export { router as casaRoutes };
