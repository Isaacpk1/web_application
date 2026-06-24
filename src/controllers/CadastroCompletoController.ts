import { Request, Response } from 'express';
import { AppError, getErrorMessage } from '../helpers/errors';
import { payloadSchemas } from '../docs/zodSchemas';
import { parseBody } from '../helpers/payloadValidation';
import { CreateCadastroCompletoDTO } from '../models/dto/CreateCadastroCompletoDTO';
import { CadastroCompletoService } from '../services/CadastroCompletoService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class CadastroCompletoController {
  constructor(private readonly service = new CadastroCompletoService()) {}
  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = parseBody<CreateCadastroCompletoDTO>(payloadSchemas.createCadastroCompleto, req.body);
      const data = await this.service.criar(req.header('Idempotency-Key') ?? undefined, payload);
      res.status(201).json(formatSuccess(data, 'Cadastro criado com sucesso'));
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json(formatError(getErrorMessage(error), status));
    }
  };
}
