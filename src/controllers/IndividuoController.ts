import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateIndividuoDTO } from '../models/dto/CreateIndividuoDTO';
import { UpdateIndividuoDTO } from '../models/dto/UpdateIndividuoDTO';
import { IndividuoService } from '../services/IndividuoService';
import { formatError, formatSuccess } from '../views/responseFormatter';

/**
 * Camada HTTP do recurso `individuo`.
 */
export class IndividuoController {
  constructor(private readonly individuoService = new IndividuoService()) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(formatSuccess(await this.individuoService.findAll(), 'Individuos listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const individuo = await this.individuoService.findById(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(individuo, 'Individuo encontrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findByNucleoFamiliarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const individuos = await this.individuoService.findByNucleoFamiliarId(getRouteParam(req.params, 'nucleoFamiliarId'));
      res.status(200).json(formatSuccess(individuos, 'Individuos do nucleo familiar listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const individuo = await this.individuoService.create(parseBody<CreateIndividuoDTO>(payloadSchemas.createIndividuo, req.body));
      res.status(201).json(formatSuccess(individuo, 'Individuo cadastrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const individuo = await this.individuoService.update(getRouteParam(req.params, 'id'), parseBody<UpdateIndividuoDTO>(payloadSchemas.updateIndividuo, req.body));
      res.status(200).json(formatSuccess(individuo, 'Individuo atualizado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.individuoService.delete(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(null, 'Individuo removido com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
