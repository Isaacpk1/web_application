import { Router } from 'express';

import { authRoutes } from './authRoutes';
import { cadastradorRoutes } from './cadastradorRoutes';
import { cadastroBuscaRoutes } from './cadastroBuscaRoutes';
import { cadastroCompletoRoutes } from './cadastroCompletoRoutes';
import { completudeRoutes } from './completudeRoutes';
import { nucleoFamiliarRoutes } from './nucleoFamiliarRoutes';
import { casaRoutes } from './casaRoutes';
import { individuoRoutes } from './individuoRoutes';
import { setorRoutes } from './setorRoutes';
import { vulnerabilidadeRoutes } from './vulnerabilidadeRoutes';
import { petRoutes } from './petRoutes';
import { uploadRoutes } from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cadastros', cadastroBuscaRoutes);
router.use('/cadastros-completos', cadastroCompletoRoutes);
router.use('/completude', completudeRoutes);
router.use('/cadastradores', cadastradorRoutes);
router.use('/nucleos-familiares', nucleoFamiliarRoutes);
router.use('/familias', nucleoFamiliarRoutes);
router.use('/individuos', individuoRoutes);
router.use('/pessoas', individuoRoutes);
router.use('/casas', casaRoutes);
router.use('/imoveis', casaRoutes);
router.use('/setores', setorRoutes);
router.use('/setores-risco', setorRoutes);
router.use('/vulnerabilidades', vulnerabilidadeRoutes);
router.use('/pets', petRoutes);
router.use('/uploads', uploadRoutes);

export { router };
