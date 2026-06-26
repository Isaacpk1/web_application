import { Router } from 'express';

import { imageUpload, UploadController } from '../controllers/UploadController';

const uploadRoutes = Router();
const controller = new UploadController();

uploadRoutes.post('/imagens', imageUpload.single('imagem'), controller.uploadImagem);

export { uploadRoutes };
