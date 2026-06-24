import { BadRequestError, NotFoundError } from '../helpers/errors';
import { sanitizeObject } from '../helpers/sanitizers';
import { assertNonEmptyString, parsePositiveIntegerId } from '../helpers/validators';
import { CreateVulnerabilidadeDTO } from '../models/dto/CreateVulnerabilidadeDTO';
import { UpdateVulnerabilidadeDTO } from '../models/dto/UpdateVulnerabilidadeDTO';
import { IndividuoVulnerabilidade, Vulnerabilidade } from '../models/domain/Vulnerabilidade';
import { VulnerabilidadeRepository } from '../repositories/VulnerabilidadeRepository';
import { IndividuoService } from './IndividuoService';

export class VulnerabilidadeService {
  constructor(
    private readonly repository = new VulnerabilidadeRepository(),
    private readonly individuoService = new IndividuoService(),
  ) {}

  async findAll(): Promise<Vulnerabilidade[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Vulnerabilidade> {
    const vulnerabilidade = await this.repository.findById(parsePositiveIntegerId(id));
    if (!vulnerabilidade) throw new NotFoundError('Vulnerabilidade nao encontrada');
    return vulnerabilidade;
  }

  async findByIndividuoId(id: string): Promise<Vulnerabilidade[]> {
    const parsedId = parsePositiveIntegerId(id, 'id_individuo');
    await this.individuoService.findById(id);
    return this.repository.findByIndividuoId(parsedId);
  }

  async create(payload: CreateVulnerabilidadeDTO): Promise<Vulnerabilidade> {
    const sanitized = sanitizeObject(payload);
    assertNonEmptyString(sanitized.tipo_vulnerabilidade, 'tipo_vulnerabilidade');
    return this.repository.create(sanitized);
  }

  async update(id: string, payload: UpdateVulnerabilidadeDTO): Promise<Vulnerabilidade> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    const sanitized = sanitizeObject(payload);
    if (Object.keys(sanitized).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    if (sanitized.tipo_vulnerabilidade !== undefined) assertNonEmptyString(sanitized.tipo_vulnerabilidade, 'tipo_vulnerabilidade');
    return this.repository.update(parsedId, sanitized);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.repository.delete(parsedId);
  }

  async associate(idIndividuo: string, idVulnerabilidade: string): Promise<IndividuoVulnerabilidade> {
    const link = this.parseLink(idIndividuo, idVulnerabilidade);
    await Promise.all([this.individuoService.findById(idIndividuo), this.findById(idVulnerabilidade)]);
    return this.repository.associate(link);
  }

  async disassociate(idIndividuo: string, idVulnerabilidade: string): Promise<void> {
    await this.repository.disassociate(this.parseLink(idIndividuo, idVulnerabilidade));
  }

  private parseLink(idIndividuo: string, idVulnerabilidade: string): IndividuoVulnerabilidade {
    return {
      id_individuo: parsePositiveIntegerId(idIndividuo, 'id_individuo'),
      id_vulnerabilidade: parsePositiveIntegerId(idVulnerabilidade, 'id_vulnerabilidade'),
    };
  }
}
