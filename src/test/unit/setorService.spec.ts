import { BadRequestError, NotFoundError } from '../../helpers/errors';
import { SetorRepository } from '../../repositories/SetorRepository';
import { SetorService } from '../../services/SetorService';
import { createSetorDTO, setor, setorId } from '../factories';

/**
 * Cria um mock do repository de setores de risco usado pelo service.
 *
 * @returns Repository mockado com operacoes de consulta e persistencia.
 */
function makeRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<SetorRepository>;
}

function makeConsultaRepository() {
  return {
    findCasaIdByNucleoFamiliarId: jest.fn(),
    findSetorIdByNucleoFamiliarId: jest.fn(),
  };
}

/**
 * Suite de regras do SetorService.
 *
 * @remarks
 * Cobre cadastro, validacao de nivel de risco, busca por nucleoFamiliar e tratamento
 * de registros inexistentes.
 */
describe('SetorService', () => {
  it('registra setor com nome da regiao e grau valido', async () => {
    const repository = makeRepository();
    const payload = createSetorDTO();
    repository.create.mockResolvedValue(setor(payload));

    const result = await new SetorService(repository).create(payload);

    expect(result.grau_risco).toBe('Alto');
  });

  it('rejeita grau de risco fora dos valores permitidos', async () => {
    const service = new SetorService(makeRepository());

    await expect(service.create(createSetorDTO({ grau_risco: 'Severo' as never }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita nome da regiao vazio', async () => {
    const service = new SetorService(makeRepository());

    await expect(service.create(createSetorDTO({ nome_regiao: '' }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita tipo_risco vazio', async () => {
    const service = new SetorService(makeRepository());

    await expect(service.create(createSetorDTO({ tipo_risco: '' }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lista setor por nucleoFamiliar usando o vinculo com casa', async () => {
    const repository = makeRepository();
    const consultaRepository = makeConsultaRepository();
    consultaRepository.findSetorIdByNucleoFamiliarId.mockResolvedValue(1);
    repository.findById.mockResolvedValue(setor());

    const result = await new SetorService(repository, consultaRepository).findByNucleoFamiliarId('1');

    expect(result).toHaveLength(1);
    expect(consultaRepository.findSetorIdByNucleoFamiliarId).toHaveBeenCalledWith(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('atualiza setor de risco existente', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(setor());
    repository.update.mockResolvedValue(setor({ grau_risco: 'Muito Alto' }));

    const result = await new SetorService(repository).update(String(setorId), {
      grau_risco: 'Muito Alto',
    });

    expect(result.grau_risco).toBe('Muito Alto');
  });

  it('retorna 404 quando setor de risco nao existe', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new SetorService(repository).findById(String(setorId))).rejects.toBeInstanceOf(NotFoundError);
  });
});
