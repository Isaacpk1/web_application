import { BadRequestError, NotFoundError } from '../../helpers/errors';
import { NucleoFamiliarRepository } from '../../repositories/NucleoFamiliarRepository';
import { IndividuoRepository } from '../../repositories/IndividuoRepository';
import { NucleoFamiliarService } from '../../services/NucleoFamiliarService';
import { createNucleoFamiliarDTO, individuo, individuoId, nucleoFamiliar, nucleoFamiliarId } from '../factories';

function makeRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<NucleoFamiliarRepository>;
}

function makeIndividuoRepository() {
  return {
    findById: jest.fn(),
  } as unknown as jest.Mocked<IndividuoRepository>;
}

describe('NucleoFamiliarService', () => {
  it('cadastra nucleo familiar com dados validos', async () => {
    const repository = makeRepository();
    const payload = createNucleoFamiliarDTO({ nome_nucleo: '  Familia Silva  ' });
    const expectedPayload = { ...payload, nome_nucleo: 'FAMILIA SILVA' };
    const expected = nucleoFamiliar({ nome_nucleo: 'FAMILIA SILVA' });
    repository.create.mockResolvedValue(expected);

    const result = await new NucleoFamiliarService(repository, makeIndividuoRepository()).create(payload);

    expect(result).toEqual(expected);
    expect(repository.create).toHaveBeenCalledWith(expectedPayload);
  });

  it('rejeita casa e referencias com IDs invalidos', async () => {
    const service = new NucleoFamiliarService(makeRepository());

    await expect(service.create(createNucleoFamiliarDTO({ id_casa: 0 }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createNucleoFamiliarDTO({ id_cadastrador: 0 }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createNucleoFamiliarDTO({ id_chefe_familia: -1 }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita renda familiar total negativa', async () => {
    const repository = makeRepository();

    await expect(
      new NucleoFamiliarService(repository).create(createNucleoFamiliarDTO({ renda_familiar_total: -1 })),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('impede definir chefe durante a criacao do nucleo', async () => {
    await expect(
      new NucleoFamiliarService(makeRepository()).create(createNucleoFamiliarDTO({ id_chefe_familia: individuoId })),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('aceita como chefe somente adulto pertencente ao nucleo', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(nucleoFamiliar());
    repository.update.mockResolvedValue(nucleoFamiliar({ id_chefe_familia: individuoId }));
    const individuoRepository = makeIndividuoRepository();
    individuoRepository.findById.mockResolvedValue(individuo({ id: individuoId, id_nucleo_familiar: nucleoFamiliarId }));

    await new NucleoFamiliarService(repository, individuoRepository).update(String(nucleoFamiliarId), { id_chefe_familia: individuoId });

    expect(repository.update).toHaveBeenCalledWith(nucleoFamiliarId, { id_chefe_familia: individuoId });
  });

  it('rejeita chefe pertencente a outro nucleo', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(nucleoFamiliar());
    const individuoRepository = makeIndividuoRepository();
    individuoRepository.findById.mockResolvedValue(individuo({ id_nucleo_familiar: 999 }));

    await expect(
      new NucleoFamiliarService(repository, individuoRepository).update(String(nucleoFamiliarId), { id_chefe_familia: individuoId }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('busca por ID numerico e retorna 404 quando nao existe', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new NucleoFamiliarService(repository).findById(String(nucleoFamiliarId))).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findById).toHaveBeenCalledWith(nucleoFamiliarId);
  });

  it('rejeita ID de rota invalido', async () => {
    const service = new NucleoFamiliarService(makeRepository());

    await expect(service.findById('uuid-invalido')).rejects.toBeInstanceOf(BadRequestError);
  });

  it('atualiza somente quando existe e body tem ao menos um campo', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(nucleoFamiliar());
    repository.update.mockResolvedValue(nucleoFamiliar({ renda_familiar_total: 2500 }));
    const service = new NucleoFamiliarService(repository);

    await expect(service.update(String(nucleoFamiliarId), {})).rejects.toBeInstanceOf(BadRequestError);

    const result = await service.update(String(nucleoFamiliarId), { renda_familiar_total: 2500 });
    expect(result.renda_familiar_total).toBe(2500);
    expect(repository.update).toHaveBeenCalledWith(nucleoFamiliarId, { renda_familiar_total: 2500 });
  });
});
