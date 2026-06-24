import { Router, Request, Response } from 'express';

import { supabaseAuth } from '../database/supabaseClient';
import { formatError, formatSuccess } from '../views/responseFormatter';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um usuario e retorna o token JWT
 *     tags: [Autenticacao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       401:
 *         description: Credenciais invalidas.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json(formatError('E-mail e senha sao obrigatorios', 400));
    return;
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: String(senha),
  });

  if (error || !data.session) {
    res.status(401).json(formatError('Credenciais invalidas', 401));
    return;
  }

  res.status(200).json(
    formatSuccess(
      {
        token: data.session.access_token,
        usuario: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role ?? 'admin',
        },
      },
      'Login realizado com sucesso',
    ),
  );
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Encerra a sessao do usuario
 *     tags: [Autenticacao]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso.
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.status(200).json(formatSuccess(null, 'Logout realizado com sucesso'));
});

export { router as authRoutes };
