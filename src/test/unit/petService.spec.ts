import { BadRequestError, NotFoundError } from '../../helpers/errors';
import { PetRepository } from '../../repositories/PetRepository';
import { NucleoFamiliarService } from '../../services/NucleoFamiliarService';
import { PetService } from '../../services/PetService';
import { createPetDTO, nucleoFamiliar, pet, petId } from '../factories';

const makeRepository = () =>
  ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByNucleoFamiliarId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<PetRepository>;

const makeNucleoService = () =>
  ({
    findById: jest.fn().mockResolvedValue(nucleoFamiliar()),
  }) as unknown as jest.Mocked<NucleoFamiliarService>;

describe('PetService', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria pet verificando existencia do nucleo familiar', async () => {
    const repository = makeRepository();
    const nucleoService = makeNucleoService();
    repository.create.mockResolvedValue(pet());

    const service = new PetService(repository, nucleoService);
    await service.create(createPetDTO());

    expect(nucleoService.findById).toHaveBeenCalledWith('1');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ id_nucleo_familiar: 1 }));
  });

  it('rejeita id_nucleo_familiar zero ou negativo', async () => {
    const service = new PetService(makeRepository(), makeNucleoService());

    await expect(service.create(createPetDTO({ id_nucleo_familiar: 0 }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createPetDTO({ id_nucleo_familiar: -1 }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita quantidade negativa', async () => {
    const service = new PetService(makeRepository(), makeNucleoService());

    await expect(service.create(createPetDTO({ quantidade: -1 }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('aceita quantidade zero', async () => {
    const repository = makeRepository();
    repository.create.mockResolvedValue(pet({ quantidade: 0 }));
    const service = new PetService(repository, makeNucleoService());

    await expect(service.create(createPetDTO({ quantidade: 0 }))).resolves.toMatchObject({ quantidade: 0 });
  });

  it('retorna 404 para pet inexistente', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    const service = new PetService(repository, makeNucleoService());

    await expect(service.findById(String(petId))).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findById).toHaveBeenCalledWith(petId);
  });

  it('lista pets por nucleo verificando existencia do nucleo', async () => {
    const repository = makeRepository();
    const nucleoService = makeNucleoService();
    repository.findByNucleoFamiliarId.mockResolvedValue([pet()]);
    const service = new PetService(repository, nucleoService);

    const result = await service.findByNucleoFamiliarId('1');

    expect(nucleoService.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual([pet()]);
  });

  it('rejeita update com body vazio', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(pet());
    const service = new PetService(repository, makeNucleoService());

    await expect(service.update(String(petId), {})).rejects.toBeInstanceOf(BadRequestError);
  });

  it('deleta pet verificando existencia antes', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(pet());
    const service = new PetService(repository, makeNucleoService());

    await service.delete(String(petId));

    expect(repository.findById).toHaveBeenCalledWith(petId);
    expect(repository.delete).toHaveBeenCalledWith(petId);
  });

  it('lista todos os pets', async () => {
    const repository = makeRepository();
    repository.findAll.mockResolvedValue([pet(), pet({ id: 8 })]);
    const service = new PetService(repository, makeNucleoService());

    await expect(service.findAll()).resolves.toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalled();
  });
});
