import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateCasaDTO } from '../models/dto/CreateCasaDTO';
import { UpdateCasaDTO } from '../models/dto/UpdateCasaDTO';
import { CasaService } from '../services/CasaService';
import { formatError, formatSuccess } from '../views/responseFormatter';

/**
 * Controller dos endpoints de casas.
 *
 * @remarks
 * Encaminha requisicoes para CasaService e mantem o contrato de resposta da API consistente entre listagem, consulta, criacao, atualizacao e remocao.
 *
 * @example
 * ```typescript
 * const controller = new CasaController();
 * ```
 */
export class CasaController {
  constructor(private readonly casaService = new CasaService()) {}

  /**
   * Lista todos os casas cadastrados.
   *
   * @param _req - Requisicao Express sem parametros relevantes.
   * @param res - Resposta Express usada para retornar a listagem.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/casas');
   * ```
   */
  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const casas = await this.casaService.findAll();
      res.status(200).json(formatSuccess(casas, 'Imoveis listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Busca um casa pelo ID informado na rota.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para retornar o casa encontrado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/casas/{id}');
   * ```
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const casa = await this.casaService.findById(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(casa, 'Casa encontrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Lista os casas associados a uma nucleoFamiliar.
   *
   * @param req - Requisicao Express com `nucleoFamiliarId` em `req.params`.
   * @param res - Resposta Express usada para retornar os casas da nucleoFamiliar.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/casas/nucleos-familiares/{nucleoFamiliarId}');
   * ```
   */
  findByNucleoFamiliarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const casas = await this.casaService.findByNucleoFamiliarId(getRouteParam(req.params, 'nucleoFamiliarId'));
      res.status(200).json(formatSuccess(casas, 'Imoveis da nucleoFamiliar listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Cria um novo casa vinculado a uma nucleoFamiliar existente.
   *
   * @param req - Requisicao Express com os dados do casa no corpo.
   * @param res - Resposta Express usada para retornar o casa criado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).post('/api/v1/casas').send(payload);
   * ```
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const casa = await this.casaService.create(parseBody<CreateCasaDTO>(payloadSchemas.createCasa, req.body));
      res.status(201).json(formatSuccess(casa, 'Casa cadastrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Atualiza os dados editaveis de um casa.
   *
   * @param req - Requisicao Express com `id` na rota e dados no corpo.
   * @param res - Resposta Express usada para retornar o casa atualizado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).put('/api/v1/casas/{id}').send(payload);
   * ```
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const casa = await this.casaService.update(getRouteParam(req.params, 'id'), parseBody<UpdateCasaDTO>(payloadSchemas.updateCasa, req.body));
      res.status(200).json(formatSuccess(casa, 'Casa atualizado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Remove um casa pelo ID informado na rota.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para confirmar a remocao.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).delete('/api/v1/casas/{id}');
   * ```
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.casaService.delete(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(null, 'Casa removido com sucesso'));
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
