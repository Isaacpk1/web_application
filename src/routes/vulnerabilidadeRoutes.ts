import { Router } from 'express';

import { VulnerabilidadeController } from '../controllers/VulnerabilidadeController';

const router = Router();
const controller = new VulnerabilidadeController();

router.get('/', controller.findAll);
router.get('/individuos/:individuoId', controller.findByIndividuoId);
router.post('/individuos/:individuoId/:vulnerabilidadeId', controller.associate);
router.delete('/individuos/:individuoId/:vulnerabilidadeId', controller.disassociate);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as vulnerabilidadeRoutes };
