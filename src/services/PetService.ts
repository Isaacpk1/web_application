import { BadRequestError, NotFoundError } from '../helpers/errors';
import { parsePositiveIntegerId } from '../helpers/validators';
import { CreatePetDTO } from '../models/dto/CreatePetDTO';
import { UpdatePetDTO } from '../models/dto/UpdatePetDTO';
import { Pet } from '../models/domain/Pet';
import { PetRepository } from '../repositories/PetRepository';
import { NucleoFamiliarService } from './NucleoFamiliarService';

export class PetService {
  constructor(
    private readonly petRepository = new PetRepository(),
    private readonly nucleoFamiliarService = new NucleoFamiliarService(),
  ) {}

  async findAll(): Promise<Pet[]> {
    return this.petRepository.findAll();
  }

  async findById(id: string): Promise<Pet> {
    const pet = await this.petRepository.findById(parsePositiveIntegerId(id));
    if (!pet) throw new NotFoundError('Pet nao encontrado');
    return pet;
  }

  async findByNucleoFamiliarId(nucleoFamiliarId: string): Promise<Pet[]> {
    const parsedId = parsePositiveIntegerId(nucleoFamiliarId, 'id_nucleo_familiar');
    await this.nucleoFamiliarService.findById(nucleoFamiliarId);
    return this.petRepository.findByNucleoFamiliarId(parsedId);
  }

  async create(payload: CreatePetDTO): Promise<Pet> {
    const normalized = this.normalizeOptionalImage(payload);
    this.validateCreate(normalized);
    await this.nucleoFamiliarService.findById(String(normalized.id_nucleo_familiar));
    return this.petRepository.create(normalized);
  }

  async update(id: string, payload: UpdatePetDTO): Promise<Pet> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    const normalized = this.normalizeOptionalImage(payload);
    if (Object.keys(normalized).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    return this.petRepository.update(parsedId, normalized);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.petRepository.delete(parsedId);
  }

  private validateCreate(payload: CreatePetDTO): void {
    if (!Number.isSafeInteger(payload.id_nucleo_familiar) || payload.id_nucleo_familiar <= 0) {
      throw new BadRequestError('ID invalido: id_nucleo_familiar');
    }
    if (payload.quantidade !== undefined && payload.quantidade !== null) {
      if (!Number.isInteger(payload.quantidade) || payload.quantidade < 0) {
        throw new BadRequestError('Quantidade deve ser um numero inteiro nao negativo');
      }
    }
  }

  private normalizeOptionalImage<T extends CreatePetDTO | UpdatePetDTO>(payload: T): T {
    return {
      ...payload,
      ...(payload.imagem === '' ? { imagem: null } : {}),
    };
  }
}
