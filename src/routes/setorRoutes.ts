import { Router } from 'express';

import { SetorController } from '../controllers/SetorController';

const router = Router();
const setorController = new SetorController();

/**
 * @swagger
 * /setores:
 *   get:
 *     summary: Lista setores de risco
 *     tags: [Apoio - Setores de Risco]
 *     responses:
 *       200:
 *         description: Setores de risco listados com sucesso.
 */
router.get('/', setorController.findAll);

/**
 * @swagger
 * /setores/nucleos-familiares/{nucleoFamiliarId}:
 *   get:
 *     summary: Lista setores de risco por nucleoFamiliar
 *     tags: [Apoio - Setores de Risco]
 *     parameters:
 *       - in: path
 *         name: nucleoFamiliarId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Setores da nucleoFamiliar listados com sucesso.
 */
router.get('/nucleos-familiares/:nucleoFamiliarId', setorController.findByNucleoFamiliarId);

/**
 * @swagger
 * /setores/{id}:
 *   get:
 *     summary: Busca um setor de risco por ID
 *     tags: [Apoio - Setores de Risco]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Setor de risco encontrado com sucesso.
 */
router.get('/:id', setorController.findById);

/**
 * @swagger
 * /setores:
 *   post:
 *     summary: Cria um setor de risco
 *     tags: [Apoio - Setores de Risco]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSetor'
 *     responses:
 *       201:
 *         description: Setor de risco cadastrado com sucesso.
 */
router.post('/', setorController.create);

/**
 * @swagger
 * /setores/{id}:
 *   put:
 *     summary: Atualiza um setor de risco
 *     tags: [Apoio - Setores de Risco]
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
 *             $ref: '#/components/schemas/UpdateSetor'
 *     responses:
 *       200:
 *         description: Setor de risco atualizado com sucesso.
 */
router.put('/:id', setorController.update);

/**
 * @swagger
 * /setores/{id}:
 *   delete:
 *     summary: Remove um setor de risco
 *     tags: [Apoio - Setores de Risco]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Setor de risco removido com sucesso.
 */
router.delete('/:id', setorController.delete);

export { router as setorRoutes };
