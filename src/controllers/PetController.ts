import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { getRouteParam } from '../helpers/requestParams';
import { CreatePetDTO } from '../models/dto/CreatePetDTO';
import { UpdatePetDTO } from '../models/dto/UpdatePetDTO';
import { PetService } from '../services/PetService';
import { formatError, formatSuccess } from '../views/responseFormatter';

export class PetController {
  constructor(private readonly petService = new PetService()) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pets = await this.petService.findAll();
      res.status(200).json(formatSuccess(pets, 'Pets listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const pet = await this.petService.findById(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(pet, 'Pet encontrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findByNucleoFamiliarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const pets = await this.petService.findByNucleoFamiliarId(getRouteParam(req.params, 'nucleoFamiliarId'));
      res.status(200).json(formatSuccess(pets, 'Pets do nucleo familiar listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const pet = await this.petService.create(req.body as CreatePetDTO);
      res.status(201).json(formatSuccess(pet, 'Pet cadastrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const pet = await this.petService.update(getRouteParam(req.params, 'id'), req.body as UpdatePetDTO);
      res.status(200).json(formatSuccess(pet, 'Pet atualizado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.petService.delete(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(null, 'Pet removido com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
