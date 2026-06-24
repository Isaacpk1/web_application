import { Request, Response } from 'express';

import { AppError, getErrorMessage } from '../helpers/errors';
import { parseBody } from '../helpers/payloadValidation';
import { getRouteParam } from '../helpers/requestParams';
import { payloadSchemas } from '../docs/zodSchemas';
import { CreateSetorDTO } from '../models/dto/CreateSetorDTO';
import { UpdateSetorDTO } from '../models/dto/UpdateSetorDTO';
import { SetorService } from '../services/SetorService';
import { formatError, formatSuccess } from '../views/responseFormatter';

/**
 * Controller dos endpoints de setores de risco.
 *
 * @remarks
 * Encaminha requisicoes HTTP para SetorService e padroniza as respostas
 * relacionadas a consulta, criacao, atualizacao e remocao de setores.
 *
 * @example
 * ```typescript
 * const controller = new SetorController();
 * ```
 */
export class SetorController {
  constructor(private readonly setorService = new SetorService()) {}

  /**
   * Lista todos os setores de risco cadastrados.
   *
   * @param _req - Requisicao Express sem parametros relevantes.
   * @param res - Resposta Express usada para retornar a listagem.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/setores');
   * ```
   */
  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const setores = await this.setorService.findAll();
      res.status(200).json(formatSuccess(setores, 'Setores de risco listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Busca um setor de risco pelo ID informado na rota.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para retornar o setor encontrado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/setores/{id}');
   * ```
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const setor = await this.setorService.findById(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(setor, 'Setor de risco encontrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Lista setores de risco associados a uma nucleoFamiliar.
   *
   * @remarks
   * O vinculo e resolvido pelo service a partir do identificador da nucleoFamiliar.
   *
   * @param req - Requisicao Express com `nucleoFamiliarId` em `req.params`.
   * @param res - Resposta Express usada para retornar os setores da nucleoFamiliar.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).get('/api/v1/setores/nucleos-familiares/{nucleoFamiliarId}');
   * ```
   */
  findByNucleoFamiliarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const setores = await this.setorService.findByNucleoFamiliarId(getRouteParam(req.params, 'nucleoFamiliarId'));
      res.status(200).json(formatSuccess(setores, 'Setores de risco da nucleoFamiliar listados com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Cria um novo setor de risco.
   *
   * @param req - Requisicao Express com os dados do setor no corpo.
   * @param res - Resposta Express usada para retornar o setor criado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).post('/api/v1/setores').send(payload);
   * ```
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const setor = await this.setorService.create(parseBody<CreateSetorDTO>(payloadSchemas.createSetor, req.body));
      res.status(201).json(formatSuccess(setor, 'Setor de risco cadastrado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Atualiza um setor de risco existente.
   *
   * @param req - Requisicao Express com `id` na rota e dados no corpo.
   * @param res - Resposta Express usada para retornar o setor atualizado.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).put('/api/v1/setores/{id}').send(payload);
   * ```
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const setor = await this.setorService.update(getRouteParam(req.params, 'id'), parseBody<UpdateSetorDTO>(payloadSchemas.updateSetor, req.body));
      res.status(200).json(formatSuccess(setor, 'Setor de risco atualizado com sucesso'));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Remove um setor de risco pelo ID informado.
   *
   * @param req - Requisicao Express com `id` em `req.params`.
   * @param res - Resposta Express usada para confirmar a remocao.
   * @returns Responde pela propria conexao HTTP.
   *
   * @example
   * ```typescript
   * await request(app).delete('/api/v1/setores/{id}');
   * ```
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.setorService.delete(getRouteParam(req.params, 'id'));
      res.status(200).json(formatSuccess(null, 'Setor de risco removido com sucesso'));
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
