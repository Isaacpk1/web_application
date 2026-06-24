import { Router } from 'express';

import { PetController } from '../controllers/PetController';

const petRoutes = Router();
const controller = new PetController();

petRoutes.get('/', controller.findAll);
petRoutes.get('/nucleos-familiares/:nucleoFamiliarId', controller.findByNucleoFamiliarId);
petRoutes.get('/:id', controller.findById);
petRoutes.post('/', controller.create);
petRoutes.put('/:id', controller.update);
petRoutes.delete('/:id', controller.delete);

export { petRoutes };
