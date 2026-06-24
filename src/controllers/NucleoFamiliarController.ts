import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateNucleoFamiliarDTO } from '../models/dto/CreateNucleoFamiliarDTO';
import { UpdateNucleoFamiliarDTO } from '../models/dto/UpdateNucleoFamiliarDTO';
import { NucleoFamiliarService } from '../services/NucleoFamiliarService';
import { formatError, formatSuccess } from '../views/responseFormatter';

/**
 * Controller dos endpoints de nucleosFamiliares e nucleos familiares.
 *
 * @remarks
 * Centraliza a entrada HTTP para listar, consultar, criar, atualizar e remover registros familiares.
 *
 * @example
 * ```typescript
 * const controller = new NucleoFamiliarController();
 * ```
 */
export class NucleoFamiliarController {
  constructor(private readonly nucleoFamiliarService = new NucleoFamiliarService()) {}

  /**
   * Lista todas as nucleosFamiliares cadastradas.
   *
   * @param _req - Requisicao Express sem parametros relevantes.
   * @param res - Resposta Express usada para retornar a listagem.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/nucleos-familiares');
   * ```
   */
  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const nucleosFamiliares = await this.nucleoFamiliarService.findAll();
      res.status(200).json(formatSuccess(nucleosFamiliares, 'Nucleos familiares listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Busca uma nucleoFamiliar pelo ID informado na rota.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para retornar a nucleoFamiliar encontrada.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/nucleos-familiares/{id}');
   * ```
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const nucleoFamiliar = await this.nucleoFamiliarService.findById(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(nucleoFamiliar, 'Nucleo familiar encontrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Cria uma nova nucleoFamiliar.
   *
   * @remarks
   * A regra de negocio e validacao ficam no NucleoFamiliarService.
   *
   * @param req - Requisicao Express com os dados da nucleoFamiliar no corpo.
   * @param res - Resposta Express usada para retornar a nucleoFamiliar criada.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).post('/api/v1/nucleos-familiares').send(payload);
   * ```
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const nucleoFamiliar = await this.nucleoFamiliarService.create(parseBody<CreateNucleoFamiliarDTO>(payloadSchemas.createNucleoFamiliar, req.body));
      res.status(201).json(formatSuccess(nucleoFamiliar, 'Nucleo familiar cadastrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Atualiza uma nucleoFamiliar existente.
   *
   * @param req - Requisicao Express com `id` na rota e dados no corpo.
   * @param res - Resposta Express usada para retornar a nucleoFamiliar atualizada.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).put('/api/v1/nucleos-familiares/{id}').send(payload);
   * ```
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const nucleoFamiliar = await this.nucleoFamiliarService.update(
        getRouteParam(req.params, 'id'),
        parseBody<UpdateNucleoFamiliarDTO>(payloadSchemas.updateNucleoFamiliar, req.body),
      );
      res.status(200).json(formatSuccess(nucleoFamiliar, 'Nucleo familiar atualizado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Remove uma nucleoFamiliar pelo ID informado.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para confirmar a remocao.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).delete('/api/v1/nucleos-familiares/{id}');
   * ```
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.nucleoFamiliarService.delete(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(null, 'Nucleo familiar removido com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Converte erros de dominio em respostas HTTP padronizadas.
   *
   * @param error - Erro capturado durante o processamento da requisicao.
   * @param res - Resposta Express usada para enviar o erro formatado.
   * @returns Responde pela propria conexao HTTP.
   */
  private handleError(error: unknown, res: Response): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(formatError(getErrorMessage(error), statusCode));
  }
}
