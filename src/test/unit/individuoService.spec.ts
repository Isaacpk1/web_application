import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../helpers/errors';
import { IndividuoRepository } from '../../repositories/IndividuoRepository';
import { IndividuoService } from '../../services/IndividuoService';
import { NucleoFamiliarService } from '../../services/NucleoFamiliarService';
import {
  createIndividuoDTO,
  individuo,
  individuoId,
  nucleoFamiliar,
} from '../factories';

const makeRepository = () =>
  ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByNucleoFamiliarId: jest.fn(),
    existsByCpfOrNis: jest.fn().mockResolvedValue(false),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<IndividuoRepository>;

const makeNucleoService = () =>
  ({
    findById: jest.fn().mockResolvedValue(nucleoFamiliar()),
  }) as unknown as jest.Mocked<NucleoFamiliarService>;

describe('IndividuoService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('cria individuo validando o nucleo familiar', async () => {
    const repository = makeRepository();
    const nucleoService = makeNucleoService();
    repository.create.mockResolvedValue(individuo());

    const service = new IndividuoService(repository, nucleoService);

    await service.create(
      createIndividuoDTO({
        nome_completo: ' Joao Silva ',
        genero: 'Masculino',
        cor_raca: 'Pardo',
      }),
    );

    expect(nucleoService.findById).toHaveBeenCalledWith('1');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome_completo: 'JOAO SILVA',
        genero: 'Masculino',
        cor_raca: 'Pardo',
      }),
    );
  });

  it('rejeita ID de nucleo invalido e semanas_gestacao negativas', async () => {
    const service = new IndividuoService(
      makeRepository(),
      makeNucleoService(),
    );

    await expect(
      service.create(createIndividuoDTO({ id_nucleo_familiar: 0 })),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.create(createIndividuoDTO({ semanas_gestacao: -1 })),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('preserva RG alfanumerico e valida NIS e UF', async () => {
    const repository = makeRepository();
    repository.create.mockResolvedValue(individuo());

    const service = new IndividuoService(repository, makeNucleoService());

    await service.create(
      createIndividuoDTO({
        rg: '12.345.678-X',
        nis: '12345678901',
        uf: 'sp',
      }),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rg: '12.345.678-X',
        nis: '12345678901',
        uf: 'SP',
      }),
    );

    await expect(
      service.create(createIndividuoDTO({ nis: '123' })),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);

    await expect(
      service.create(createIndividuoDTO({ uf: 'SAO PAULO' })),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('rejeita combinacoes incoerentes de status vital e data de obito', async () => {
    const service = new IndividuoService(
      makeRepository(),
      makeNucleoService(),
    );

    await expect(
      service.create(createIndividuoDTO({ status_vital: 'Obito' })),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.create(
        createIndividuoDTO({
          status_vital: 'Vivo',
          data_obito: '2020-01-01',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita valores fora dos CHECKs de individuo', async () => {
    const service = new IndividuoService(
      makeRepository(),
      makeNucleoService(),
    );

    await expect(
      service.create(createIndividuoDTO({ genero: 'Invalido' as never })),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.create(createIndividuoDTO({ cor_raca: 'Invalida' as never })),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.create(
        createIndividuoDTO({ status_vital: 'Invalido' as never }),
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('bloqueia CPF ou NIS duplicado', async () => {
    const repository = makeRepository();
    repository.existsByCpfOrNis.mockResolvedValue(true);

    const service = new IndividuoService(repository, makeNucleoService());

    await expect(
      service.create(createIndividuoDTO()),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('busca usando ID numerico e retorna 404 quando inexistente', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    const service = new IndividuoService(repository, makeNucleoService());

    await expect(
      service.findById(String(individuoId)),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.findById).toHaveBeenCalledWith(individuoId);
  });

  it('atualiza somente com body preenchido', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(individuo());
    repository.update.mockResolvedValue(
      individuo({ profissao: 'PROFESSORA' }),
    );

    const service = new IndividuoService(repository, makeNucleoService());

    await expect(
      service.update(String(individuoId), {}),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.update(String(individuoId), { profissao: 'Professora' }),
    ).resolves.toMatchObject({ profissao: 'PROFESSORA' });

    expect(repository.update).toHaveBeenCalledWith(individuoId, {
      profissao: 'PROFESSORA',
    });
  });

  it('valida nucleo e documentos apenas quando enviados na atualizacao', async () => {
    const repository = makeRepository();
    const nucleoService = makeNucleoService();

    repository.findById.mockResolvedValue(individuo());
    repository.update.mockResolvedValue(individuo());

    const service = new IndividuoService(repository, nucleoService);

    await service.update(String(individuoId), {
      nome_completo: 'Novo Nome',
    });

    expect(nucleoService.findById).not.toHaveBeenCalled();
    expect(repository.existsByCpfOrNis).not.toHaveBeenCalled();

    await service.update(String(individuoId), {
      id_nucleo_familiar: 2,
      cpf: '52998224725',
    });

    expect(nucleoService.findById).toHaveBeenCalledWith('2');
    expect(repository.existsByCpfOrNis).toHaveBeenCalledWith(
      '52998224725',
      undefined,
      individuoId,
    );
  });

  it('lista todos os individuos', async () => {
    const repository = makeRepository();
    const registros = [
      individuo(),
      individuo({ nome_completo: 'OUTRO' }),
    ];

    repository.findAll.mockResolvedValue(registros);

    const service = new IndividuoService(repository, makeNucleoService());

    await expect(service.findAll()).resolves.toEqual(registros);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('lista individuos por nucleo familiar', async () => {
    const repository = makeRepository();
    const nucleoService = makeNucleoService();
    const registros = [individuo()];

    repository.findByNucleoFamiliarId.mockResolvedValue(registros);

    const service = new IndividuoService(repository, nucleoService);

    await expect(
      service.findByNucleoFamiliarId('1'),
    ).resolves.toEqual(registros);

    expect(nucleoService.findById).toHaveBeenCalledWith('1');
    expect(repository.findByNucleoFamiliarId).toHaveBeenCalledWith(1);
  });

  it('exclui individuo depois de validar sua existencia', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(individuo());

    const service = new IndividuoService(repository, makeNucleoService());

    await service.delete(String(individuoId));

    expect(repository.findById).toHaveBeenCalledWith(individuoId);
    expect(repository.delete).toHaveBeenCalledWith(individuoId);
  });
});