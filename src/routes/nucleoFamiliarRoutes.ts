import { Router } from 'express';

import { NucleoFamiliarController } from '../controllers/NucleoFamiliarController';

const router = Router();
const nucleoFamiliarController = new NucleoFamiliarController();

/**
 * @swagger
 * /nucleos-familiares:
 *   get:
 *     summary: Lista todos os nucleos familiares
 *     tags: [RF012 - Nucleo Familiar]
 *     responses:
 *       200:
 *         description: Nucleos familiares listados com sucesso.
 *   post:
 *     summary: Cria um nucleo familiar
 *     tags: [RF012 - Nucleo Familiar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNucleoFamiliar'
 *     responses:
 *       201:
 *         description: Nucleo familiar cadastrado com sucesso.
 */
router.get('/', nucleoFamiliarController.findAll);
router.post('/', nucleoFamiliarController.create);

/**
 * @swagger
 * /nucleos-familiares/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *         format: int64
 *   get:
 *     summary: Busca um nucleo familiar por ID
 *     tags: [RF012 - Nucleo Familiar]
 *     responses:
 *       200:
 *         description: Nucleo familiar encontrado com sucesso.
 *       404:
 *         description: Nucleo familiar nao encontrado.
 *   put:
 *     summary: Atualiza um nucleo familiar
 *     tags: [RF012 - Nucleo Familiar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNucleoFamiliar'
 *     responses:
 *       200:
 *         description: Nucleo familiar atualizado com sucesso.
 *   delete:
 *     summary: Remove um nucleo familiar
 *     tags: [RF012 - Nucleo Familiar]
 *     responses:
 *       200:
 *         description: Nucleo familiar removido com sucesso.
 */
router.get('/:id', nucleoFamiliarController.findById);
router.put('/:id', nucleoFamiliarController.update);
router.delete('/:id', nucleoFamiliarController.delete);

export { router as nucleoFamiliarRoutes };
