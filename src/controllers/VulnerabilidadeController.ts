import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateVulnerabilidadeDTO } from '../models/dto/CreateVulnerabilidadeDTO';
import { UpdateVulnerabilidadeDTO } from '../models/dto/UpdateVulnerabilidadeDTO';
import { VulnerabilidadeService } from '../services/VulnerabilidadeService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class VulnerabilidadeController {
  constructor(private readonly service = new VulnerabilidadeService()) {}

  findAll = async (_req: Request, res: Response): Promise<void> => this.respond(res, () => this.service.findAll(), 'Vulnerabilidades listadas');
  findById = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, () => this.service.findById(getRouteParam(req.params, 'id')), 'Vulnerabilidade encontrada');
  findByIndividuoId = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, () => this.service.findByIndividuoId(getRouteParam(req.params, 'individuoId')), 'Vulnerabilidades do individuo listadas');
  create = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, () => this.service.create(parseBody<CreateVulnerabilidadeDTO>(payloadSchemas.createVulnerabilidade, req.body)), 'Vulnerabilidade cadastrada', 201);
  update = async (req: Request, res: Response): Promise<void> =>
    this.respond(
      res,
      () => this.service.update(getRouteParam(req.params, 'id'), parseBody<UpdateVulnerabilidadeDTO>(payloadSchemas.updateVulnerabilidade, req.body)),
      'Vulnerabilidade atualizada',
    );
  delete = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, async () => {
      await this.service.delete(getRouteParam(req.params, 'id'));
      return null;
    }, 'Vulnerabilidade removida');
  associate = async (req: Request, res: Response): Promise<void> =>
    this.respond(
      res,
      () => this.service.associate(getRouteParam(req.params, 'individuoId'), getRouteParam(req.params, 'vulnerabilidadeId')),
      'Vulnerabilidade associada ao individuo',
      201,
    );
  disassociate = async (req: Request, res: Response): Promise<void> =>
    this.respond(res, async () => {
      await this.service.disassociate(getRouteParam(req.params, 'individuoId'), getRouteParam(req.params, 'vulnerabilidadeId'));
      return null;
    }, 'Vulnerabilidade desassociada do individuo');

  private async respond(res: Response, action: () => Promise<unknown>, message: string, status = 200): Promise<void> {
    try {
      res.status(status).json(formatSuccess(await action(), message));
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
    }
  }
}
