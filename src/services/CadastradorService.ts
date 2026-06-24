import { BadRequestError, NotFoundError } from '../helpers/errors';
import { sanitizeObject } from '../helpers/sanitizers';
import { assertCadastradorDocumento, assertNonEmptyString, parsePositiveIntegerId } from '../helpers/validators';
import { CreateCadastradorDTO } from '../models/dto/CreateCadastradorDTO';
import { UpdateCadastradorDTO } from '../models/dto/UpdateCadastradorDTO';
import { Cadastrador } from '../models/domain/Cadastrador';
import { CadastradorRepository } from '../repositories/CadastradorRepository';

export class CadastradorService {
  constructor(private readonly repository = new CadastradorRepository()) {}
  async findAll(): Promise<Cadastrador[]> {
    return this.repository.findAll();
  }
  async findById(id: string): Promise<Cadastrador> {
    const cadastrador = await this.repository.findById(parsePositiveIntegerId(id));
    if (!cadastrador) throw new NotFoundError('Cadastrador nao encontrado');
    return cadastrador;
  }
  async create(payload: CreateCadastradorDTO): Promise<Cadastrador> {
    const sanitized = sanitizeObject(payload);
    assertNonEmptyString(sanitized.nome, 'nome');
    assertNonEmptyString(sanitized.documento, 'documento');
    assertCadastradorDocumento(sanitized.documento);
    return this.repository.create(sanitized);
  }
  async update(id: string, payload: UpdateCadastradorDTO): Promise<Cadastrador> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    const sanitized = sanitizeObject(payload);
    if (Object.keys(sanitized).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    if (sanitized.nome !== undefined) assertNonEmptyString(sanitized.nome, 'nome');
    if (sanitized.documento !== undefined) {
      assertNonEmptyString(sanitized.documento, 'documento');
      assertCadastradorDocumento(sanitized.documento);
    }
    return this.repository.update(parsedId, sanitized);
  }
  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.repository.delete(parsedId);
  }
}
