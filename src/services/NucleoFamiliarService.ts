import { BadRequestError, NotFoundError } from '../helpers/errors';
import { sanitizeObject } from '../helpers/sanitizers';
import { assertMinimumAge, assertNonEmptyString, assertNumber, parsePositiveIntegerId } from '../helpers/validators';
import { CreateNucleoFamiliarDTO } from '../models/dto/CreateNucleoFamiliarDTO';
import { UpdateNucleoFamiliarDTO } from '../models/dto/UpdateNucleoFamiliarDTO';
import { NucleoFamiliar } from '../models/domain/NucleoFamiliar';
import { NucleoFamiliarRepository } from '../repositories/NucleoFamiliarRepository';
import { IndividuoRepository } from '../repositories/IndividuoRepository';

/**
 * Regras da tabela `nucleo_familiar`, conforme o mapeamento Supabase.
 */
export class NucleoFamiliarService {
  constructor(
    private readonly nucleoFamiliarRepository = new NucleoFamiliarRepository(),
    private readonly individuoRepository = new IndividuoRepository(),
  ) {}

  async findAll(): Promise<NucleoFamiliar[]> {
    return this.nucleoFamiliarRepository.findAll();
  }

  async findById(id: string): Promise<NucleoFamiliar> {
    const nucleoFamiliar = await this.nucleoFamiliarRepository.findById(parsePositiveIntegerId(id));

    if (!nucleoFamiliar) throw new NotFoundError('Nucleo familiar nao encontrado');

    return nucleoFamiliar;
  }

  async create(payload: CreateNucleoFamiliarDTO): Promise<NucleoFamiliar> {
    const sanitizedPayload = sanitizeObject(payload);
    this.validateCreate(sanitizedPayload);
    if (sanitizedPayload.id_chefe_familia) {
      throw new BadRequestError('Defina o chefe da familia apos criar o nucleo e cadastrar o individuo');
    }
    return this.nucleoFamiliarRepository.create(sanitizedPayload);
  }

  async update(id: string, payload: UpdateNucleoFamiliarDTO): Promise<NucleoFamiliar> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    const sanitizedPayload = sanitizeObject(payload);
    this.validateUpdate(sanitizedPayload);
    if (sanitizedPayload.id_chefe_familia !== undefined && sanitizedPayload.id_chefe_familia !== null) {
      await this.validateChefeFamiliar(parsedId, sanitizedPayload.id_chefe_familia);
    }
    return this.nucleoFamiliarRepository.update(parsedId, sanitizedPayload);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.nucleoFamiliarRepository.delete(parsedId);
  }

  private validateCreate(payload: CreateNucleoFamiliarDTO): void {
    assertNonEmptyString(payload.nome_nucleo, 'nome_nucleo');
    this.validatePositiveId(payload.id_casa, 'id_casa');
    if (payload.id_cadastrador != null) this.validatePositiveId(payload.id_cadastrador, 'id_cadastrador');
    this.validateOptionalFields(payload);
  }

  private validateUpdate(payload: UpdateNucleoFamiliarDTO): void {
    if (Object.keys(payload).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');

    if (payload.nome_nucleo !== undefined) assertNonEmptyString(payload.nome_nucleo, 'nome_nucleo');
    if (payload.id_casa !== undefined) this.validatePositiveId(payload.id_casa, 'id_casa');
    this.validateOptionalFields(payload);
  }

  private validateOptionalFields(payload: CreateNucleoFamiliarDTO | UpdateNucleoFamiliarDTO): void {
    if (payload.id_chefe_familia !== undefined && payload.id_chefe_familia !== null) {
      this.validatePositiveId(payload.id_chefe_familia, 'id_chefe_familia');
    }
    if (payload.renda_familiar_total !== undefined && payload.renda_familiar_total !== null) {
      assertNumber(payload.renda_familiar_total, 'renda_familiar_total');
      if (payload.renda_familiar_total < 0) throw new BadRequestError('Renda familiar total nao pode ser negativa');
    }
  }

  private validatePositiveId(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) throw new BadRequestError(`ID invalido: ${field}`);
  }

  private async validateChefeFamiliar(nucleoFamiliarId: number, individuoId: number): Promise<void> {
    const individuo = await this.individuoRepository.findById(individuoId);
    if (!individuo) throw new NotFoundError('Chefe da familia nao encontrado');
    if (individuo.id_nucleo_familiar !== nucleoFamiliarId) {
      throw new BadRequestError('Chefe da familia deve pertencer ao nucleo familiar');
    }
    assertMinimumAge(individuo.data_nascimento, 18, 'data_nascimento do chefe da familia');
  }
}
