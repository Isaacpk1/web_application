import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateCadastradorDTO } from '../models/dto/CreateCadastradorDTO';
import { UpdateCadastradorDTO } from '../models/dto/UpdateCadastradorDTO';
import { CadastradorService } from '../services/CadastradorService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class CadastradorController {
  constructor(private readonly service = new CadastradorService()) {}
  findAll = async (_req: Request, res: Response): Promise<void> => this.respond(res, () => this.service.findAll(), 'Cadastradores listados');
  findById = async (req: Request, res: Response): Promise<void> => this.respond(res, () => this.service.findById(getRouteParam(req.params, 'id')), 'Cadastrador encontrado');
  create = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, () => this.service.create(parseBody<CreateCadastradorDTO>(payloadSchemas.createCadastrador, req.body)), 'Cadastrador criado', 201);
  update = async (req: Request, res: Response): Promise<void> =>
    this.respond(
      res,
      () => this.service.update(getRouteParam(req.params, 'id'), parseBody<UpdateCadastradorDTO>(payloadSchemas.updateCadastrador, req.body)),
      'Cadastrador atualizado',
    );
  delete = async (req: Request, res: Response): Promise<void> => this.respond(res, async () => {
    await this.service.delete(getRouteParam(req.params, 'id'));
    return null;
  }, 'Cadastrador removido');

  private async respond(res: Response, action: () => Promise<unknown>, message: string, status = 200): Promise<void> {
    try {
      res.status(status).json(formatSuccess(await action(), message));
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
    }
  }
}
