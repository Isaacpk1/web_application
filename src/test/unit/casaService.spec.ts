import { BadRequestError, NotFoundError, UnprocessableEntityError } from '../../helpers/errors';
import { CasaRepository } from '../../repositories/CasaRepository';
import { CasaService } from '../../services/CasaService';
import { createCasaDTO, casa, casaId } from '../factories';

function makeRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<CasaRepository>;
}

function makeConsultaRepository() {
  return {
    findCasaIdByNucleoFamiliarId: jest.fn(),
    findSetorIdByNucleoFamiliarId: jest.fn(),
  };
}

describe('CasaService alinhado a tabela casa', () => {
  it('cadastra casa com campos obrigatorios', async () => {
    const repository = makeRepository();
    const payload = createCasaDTO();
    repository.create.mockResolvedValue(casa());

    await new CasaService(repository).create(payload);

    expect(repository.create).toHaveBeenCalledWith({ ...payload, logradouro: 'RUA A', bairro: 'CENTRO' });
  });

  it('normaliza endereco e CEP sem alterar enums do banco', async () => {
    const repository = makeRepository();
    const payload = createCasaDTO({ logradouro: ' Rua São João ', bairro: ' Vila Assunção ', cep: '09030-320' });

    await new CasaService(repository).create(payload);

    expect(repository.create).toHaveBeenCalledWith({
      ...payload,
      logradouro: 'RUA SAO JOAO',
      bairro: 'VILA ASSUNCAO',
      cep: '09030320',
    });
  });

  it('aceita campos de endereco vazios e normaliza para null', async () => {
    const repository = makeRepository();
    const payload = createCasaDTO({ logradouro: '', numero: '', bairro: '' });
    repository.create.mockResolvedValue(casa({ logradouro: null, numero: null, bairro: null }));

    await new CasaService(repository).create(payload);

    expect(repository.create).toHaveBeenCalledWith({ ...payload, logradouro: null, numero: null, bairro: null });
  });

  it('rejeita setor, CEP e coordenadas invalidos', async () => {
    const service = new CasaService(makeRepository());

    await expect(service.create(createCasaDTO({ id_setor: 0 }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createCasaDTO({ cep: '123' }))).rejects.toBeInstanceOf(UnprocessableEntityError);
    await expect(service.create(createCasaDTO({ coordenada_lat: -91 }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createCasaDTO({ coordenada_long: 181 }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita valores fora dos CHECKs da tabela', async () => {
    const service = new CasaService(makeRepository());

    await expect(service.create(createCasaDTO({ tipo_construcao: 'Concreto' as never }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createCasaDTO({ uso_imovel: 'Industrial' as never }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createCasaDTO({ status_imovel: 'Abandonado' as never }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita combinacoes incoerentes de status e data de interdicao', async () => {
    const service = new CasaService(makeRepository());

    await expect(service.create(createCasaDTO({ status_imovel: 'Interditado' }))).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create(createCasaDTO({ status_imovel: 'Sadio', data_interdicao: '2026-01-01' }))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('busca casa por nucleoFamiliar usando ID numerico', async () => {
    const repository = makeRepository();
    const consultaRepository = makeConsultaRepository();
    consultaRepository.findCasaIdByNucleoFamiliarId.mockResolvedValue(1);
    repository.findById.mockResolvedValue(casa());

    const result = await new CasaService(repository, consultaRepository).findByNucleoFamiliarId('1');

    expect(result).toHaveLength(1);
    expect(consultaRepository.findCasaIdByNucleoFamiliarId).toHaveBeenCalledWith(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('atualiza casa existente e rejeita body vazio', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(casa());
    repository.update.mockResolvedValue(casa({ uso_imovel: 'Comercial' }));
    const service = new CasaService(repository);

    await expect(service.update(String(casaId), {})).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.update(String(casaId), { uso_imovel: 'Comercial' })).resolves.toMatchObject({ uso_imovel: 'Comercial' });
  });

  it('retorna 404 quando casa nao existe', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new CasaService(repository).findById(String(casaId))).rejects.toBeInstanceOf(NotFoundError);
  });
});
