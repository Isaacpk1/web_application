import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { CadastroMapaService } from '../services/CadastroMapaService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class CadastroMapaController {
  constructor(private readonly cadastroMapaService = new CadastroMapaService()) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const resposta = await this.cadastroMapaService.listar(req.query);
      res.status(200).json(formatSuccess(resposta, 'Pontos do mapa carregados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
