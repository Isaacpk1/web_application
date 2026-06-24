import { BadRequestError, ConflictError, NotFoundError } from '../helpers/errors';
import { sanitizeObject } from '../helpers/sanitizers';
import { assertCpf, assertEmail, assertNis, assertNonEmptyString, assertPastOrTodayDate, assertUf, parsePositiveIntegerId } from '../helpers/validators';
import { CreateIndividuoDTO } from '../models/dto/CreateIndividuoDTO';
import { UpdateIndividuoDTO } from '../models/dto/UpdateIndividuoDTO';
import { CorRaca, EstadoCivil, Genero, Individuo, StatusVital } from '../models/domain/Individuo';
import { IndividuoRepository } from '../repositories/IndividuoRepository';
import { NucleoFamiliarService } from './NucleoFamiliarService';

const generosPermitidos: Genero[] = ['Masculino', 'Feminino', 'Outro'];
const coresRacasPermitidas: CorRaca[] = ['Branco', 'Preto', 'Pardo', 'Amarelo', 'Indigena'];
const statusVitaisPermitidos: StatusVital[] = ['Vivo', 'Obito', 'Desaparecido'];
const estadosCivisPermitidos: EstadoCivil[] = ['Solteiro', 'Casado', 'Viuvo', 'Divorciado'];

export class IndividuoService {
  constructor(
    private readonly individuoRepository = new IndividuoRepository(),
    private readonly nucleoFamiliarService = new NucleoFamiliarService(),
  ) {}

  async findAll(): Promise<Individuo[]> {
    return this.individuoRepository.findAll();
  }

  async findById(id: string): Promise<Individuo> {
    const individuo = await this.individuoRepository.findById(parsePositiveIntegerId(id));
    if (!individuo) throw new NotFoundError('Individuo nao encontrado');
    return individuo;
  }

  async findByNucleoFamiliarId(id: string): Promise<Individuo[]> {
    const parsedId = parsePositiveIntegerId(id, 'id_nucleo_familiar');
    await this.nucleoFamiliarService.findById(id);
    return this.individuoRepository.findByNucleoFamiliarId(parsedId);
  }

  async create(payload: CreateIndividuoDTO): Promise<Individuo> {
    const sanitized = sanitizeObject(payload);
    this.validateCreate(sanitized);
    await this.nucleoFamiliarService.findById(String(sanitized.id_nucleo_familiar));
    await this.ensureUniqueDocuments(sanitized.cpf, sanitized.nis);
    return this.individuoRepository.create(sanitized);
  }

  async update(id: string, payload: UpdateIndividuoDTO): Promise<Individuo> {
    const parsedId = parsePositiveIntegerId(id);
    const current = await this.findById(id);
    const sanitized = sanitizeObject(payload);
    this.validateUpdate(sanitized);
    if (sanitized.id_nucleo_familiar !== undefined) {
      await this.nucleoFamiliarService.findById(String(sanitized.id_nucleo_familiar));
    }
    if (sanitized.cpf !== undefined || sanitized.nis !== undefined) {
      await this.ensureUniqueDocuments(sanitized.cpf, sanitized.nis, parsedId);
    }
    this.validateVitalStatus({ ...current, ...sanitized });
    return this.individuoRepository.update(parsedId, sanitized);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.individuoRepository.delete(parsedId);
  }

  private validateCreate(payload: CreateIndividuoDTO): void {
    this.validatePositiveId(payload.id_nucleo_familiar, 'id_nucleo_familiar');
    assertNonEmptyString(payload.nome_completo, 'nome_completo');
    assertNonEmptyString(payload.data_nascimento, 'data_nascimento');
    assertPastOrTodayDate(payload.data_nascimento, 'data_nascimento');
    this.validateGenero(payload.genero);
    this.validateOptionalFields(payload);
    this.validateVitalStatus(payload);
  }

  private validateUpdate(payload: UpdateIndividuoDTO): void {
    if (Object.keys(payload).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    if (payload.id_nucleo_familiar !== undefined) this.validatePositiveId(payload.id_nucleo_familiar, 'id_nucleo_familiar');
    if (payload.nome_completo !== undefined) assertNonEmptyString(payload.nome_completo, 'nome_completo');
    if (payload.data_nascimento !== undefined) assertPastOrTodayDate(payload.data_nascimento, 'data_nascimento');
    if (payload.genero !== undefined) this.validateGenero(payload.genero);
    this.validateOptionalFields(payload);
  }

  private validateOptionalFields(payload: CreateIndividuoDTO | UpdateIndividuoDTO): void {
    this.validateOptionalEnumerations(payload);
    this.validateOptionalContactFields(payload);
    this.validateOptionalGestacaoAndObito(payload);
  }

  private validateOptionalEnumerations(payload: CreateIndividuoDTO | UpdateIndividuoDTO): void {
    if (payload.cor_raca != null && !coresRacasPermitidas.includes(payload.cor_raca)) throw new BadRequestError('Cor/raca invalida');
    if (payload.estado_civil != null && !estadosCivisPermitidos.includes(payload.estado_civil)) {
      throw new BadRequestError(`Estado civil invalido. Valores permitidos: ${estadosCivisPermitidos.join(', ')}`);
    }
    if (payload.status_vital !== undefined && !statusVitaisPermitidos.includes(payload.status_vital)) throw new BadRequestError('Status vital invalido');
  }

  private validateOptionalContactFields(payload: CreateIndividuoDTO | UpdateIndividuoDTO): void {
    if (payload.cpf) assertCpf(payload.cpf, 'cpf');
    if (payload.nis) assertNis(payload.nis);
    if (payload.uf) assertUf(payload.uf);
    if (payload.email) assertEmail(payload.email, 'email');
  }

  private validateOptionalGestacaoAndObito(payload: CreateIndividuoDTO | UpdateIndividuoDTO): void {
    if (payload.semanas_gestacao !== undefined && payload.semanas_gestacao !== null) {
      if (!Number.isInteger(payload.semanas_gestacao) || payload.semanas_gestacao < 0) {
        throw new BadRequestError('Semanas de gestacao deve ser um numero inteiro nao negativo');
      }
    }
    if (payload.data_obito) assertPastOrTodayDate(payload.data_obito, 'data_obito');
  }

  private validatePositiveId(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) throw new BadRequestError(`ID invalido: ${field}`);
  }

  private validateGenero(value: Genero): void {
    if (!generosPermitidos.includes(value)) throw new BadRequestError('Genero invalido');
  }

  private validateVitalStatus(payload: Pick<CreateIndividuoDTO, 'status_vital' | 'data_obito'>): void {
    const statusVital = payload.status_vital ?? 'Vivo';
    if (statusVital === 'Obito' && !payload.data_obito) throw new BadRequestError('Data do obito e obrigatoria para status Obito');
    if (statusVital !== 'Obito' && payload.data_obito) throw new BadRequestError('Data do obito so pode ser informada para status Obito');
  }

  private async ensureUniqueDocuments(cpf?: string | null, nis?: string | null, excludeId?: number): Promise<void> {
    if (await this.individuoRepository.existsByCpfOrNis(cpf, nis, excludeId)) {
      throw new ConflictError('CPF ou NIS ja cadastrado');
    }
  }
}
