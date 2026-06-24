import { BadRequestError, NotFoundError } from '../helpers/errors';
import { assertNonEmptyString, parsePositiveIntegerId } from '../helpers/validators';
import { CreateSetorDTO } from '../models/dto/CreateSetorDTO';
import { UpdateSetorDTO } from '../models/dto/UpdateSetorDTO';
import { GrauRisco, Setor } from '../models/domain/Setor';
import { NucleoFamiliarConsultaRepository } from '../repositories/NucleoFamiliarConsultaRepository';
import { SetorRepository } from '../repositories/SetorRepository';

const grausRiscoPermitidos: GrauRisco[] = ['Baixo', 'Médio', 'Alto', 'Muito Alto'];

export class SetorService {
  constructor(
    private readonly setorRepository = new SetorRepository(),
    private readonly consultaRepository = new NucleoFamiliarConsultaRepository(),
  ) {}

  async findAll(): Promise<Setor[]> {
    return this.setorRepository.findAll();
  }

  async findById(id: string): Promise<Setor> {
    const setor = await this.setorRepository.findById(parsePositiveIntegerId(id));
    if (!setor) throw new NotFoundError('Setor de risco nao encontrado');
    return setor;
  }

  async findByNucleoFamiliarId(nucleoFamiliarId: string): Promise<Setor[]> {
    const setorId = await this.consultaRepository.findSetorIdByNucleoFamiliarId(parsePositiveIntegerId(nucleoFamiliarId, 'id_nucleo_familiar'));
    if (!setorId) return [];
    const setor = await this.setorRepository.findById(setorId);
    return setor ? [setor] : [];
  }

  async create(payload: CreateSetorDTO): Promise<Setor> {
    this.validateCreate(payload);
    return this.setorRepository.create(payload);
  }

  async update(id: string, payload: UpdateSetorDTO): Promise<Setor> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    this.validateUpdate(payload);
    return this.setorRepository.update(parsedId, payload);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.setorRepository.delete(parsedId);
  }

  private validateCreate(payload: CreateSetorDTO): void {
    assertNonEmptyString(payload.nome_regiao, 'nome_regiao');
    assertNonEmptyString(payload.tipo_risco, 'tipo_risco');
    if (payload.grau_risco !== undefined && payload.grau_risco !== null) this.validateGrauRisco(payload.grau_risco);
  }

  private validateUpdate(payload: UpdateSetorDTO): void {
    if (Object.keys(payload).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    if (payload.nome_regiao !== undefined) assertNonEmptyString(payload.nome_regiao, 'nome_regiao');
    if (payload.tipo_risco !== undefined) assertNonEmptyString(payload.tipo_risco, 'tipo_risco');
    if (payload.grau_risco !== undefined && payload.grau_risco !== null) this.validateGrauRisco(payload.grau_risco);
  }

  private validateGrauRisco(grauRisco: string): void {
    if (!grausRiscoPermitidos.includes(grauRisco as GrauRisco)) {
      throw new BadRequestError('Grau de risco deve ser: Baixo, Médio, Alto ou Muito Alto');
    }
  }
}
