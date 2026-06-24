import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { CadastroBuscaService } from '../services/CadastroBuscaService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class CadastroBuscaController {
  constructor(private readonly cadastroBuscaService = new CadastroBuscaService()) {}

  buscar = async (req: Request, res: Response): Promise<void> => {
    try {
      const pagina = await this.cadastroBuscaService.buscar(req.query);
      res.status(200).json(formatSuccess(pagina, 'Busca realizada com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
