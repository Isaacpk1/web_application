import { NextFunction, Request, Response } from 'express';
import { supabaseAuth } from '../database/supabaseClient';
import { formatError } from '../views/responseFormatter';

/** Valida o Bearer token emitido pelo Supabase antes de acessar rotas reais. */
export async function requireJwt(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Login e a unica rota publica sob /api/v1; ela e justamente a emissora do token.
  if (req.path === '/auth/login') {
    next();
    return;
  }
  const authorization = req.header('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.status(401).json(formatError('Token de autenticacao ausente', 401));
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json(formatError('Token de autenticacao invalido ou expirado', 401));
    return;
  }
  res.locals.authUser = { id: data.user.id, role: data.user.user_metadata?.role ?? 'agente' };
  next();
}
