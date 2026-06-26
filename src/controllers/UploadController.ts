import { randomUUID } from 'crypto';
import path from 'path';

import { Request, Response } from 'express';
import multer from 'multer';

import { env } from '../config/env';
import { supabase } from '../database/supabaseClient';
import { formatError, formatSuccess } from '../views/responseFormatter';

const allowedMimeTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const foldersByCategory: Record<string, string> = {
  casa_fachada: 'casas/fachadas',
  casa_detalhe: 'casas/detalhes',
  individuo: 'individuos',
  pet: 'pets',
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export class UploadController {
  uploadImagem = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const categoria = String(req.body?.categoria ?? '');
      const folder = foldersByCategory[categoria];

      if (!file) {
        res.status(400).json(formatError('Imagem nao enviada', 400));
        return;
      }

      const extension = allowedMimeTypes.get(file.mimetype);
      if (!extension) {
        res.status(422).json(formatError('Formato invalido. Use JPG, PNG ou WebP', 422));
        return;
      }

      if (!folder) {
        res.status(400).json(formatError('Categoria de imagem invalida', 400));
        return;
      }

      const objectPath = path.posix.join(folder, `${randomUUID()}.${extension}`);
      const { error } = await supabase.storage
        .from(env.supabaseStorageBucket)
        .upload(objectPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        res.status(500).json(formatError(`Falha ao enviar imagem: ${error.message}`, 500));
        return;
      }

      const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(objectPath);

      res.status(201).json(
        formatSuccess(
          {
            path: objectPath,
            url: data.publicUrl,
          },
          'Imagem enviada com sucesso',
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno inesperado';
      res.status(500).json(formatError(message, 500));
    }
  };
}
