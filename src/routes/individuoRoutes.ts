import { Router } from 'express';

import { IndividuoController } from '../controllers/IndividuoController';

const router = Router();
const controller = new IndividuoController();

router.get('/', controller.findAll);
router.get('/nucleos-familiares/:nucleoFamiliarId', controller.findByNucleoFamiliarId);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as individuoRoutes };
