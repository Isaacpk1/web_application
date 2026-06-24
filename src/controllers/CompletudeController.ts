import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { CompletudeService } from '../services/CompletudeService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class CompletudeController {
  constructor(private readonly completudeService = new CompletudeService()) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const aba = typeof req.query.aba === 'string' ? req.query.aba : undefined;
      const resposta = await this.completudeService.listar(aba);
      res.status(200).json(formatSuccess(resposta, 'Completude calculada com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
