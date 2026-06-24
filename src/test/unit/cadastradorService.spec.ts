import { BadRequestError, NotFoundError } from '../../helpers/errors';
import { CadastradorRepository } from '../../repositories/CadastradorRepository';
import { CadastradorService } from '../../services/CadastradorService';
import { cadastrador, cadastradorId, createCadastradorDTO } from '../factories';

const makeRepository = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}) as unknown as jest.Mocked<CadastradorRepository>;

describe('CadastradorService', () => {
  it('cria cadastrador', async () => {
    const repository = makeRepository();
    repository.create.mockResolvedValue(cadastrador());
    await new CadastradorService(repository).create(createCadastradorDTO());
    expect(repository.create).toHaveBeenCalledWith(createCadastradorDTO({ nome: 'AGENTE SILVA' }));
  });
  it('rejeita nome vazio', async () => {
    await expect(new CadastradorService(makeRepository()).create({ nome: '', documento: '123.456-7' })).rejects.toBeInstanceOf(BadRequestError);
  });
  it('rejeita documento vazio', async () => {
    await expect(new CadastradorService(makeRepository()).create({ nome: 'Agente', documento: '' })).rejects.toBeInstanceOf(BadRequestError);
  });
  it('rejeita documento fora do padrao', async () => {
    await expect(new CadastradorService(makeRepository()).create({ nome: 'Agente', documento: 'IF 123.456-7' })).rejects.toThrow(
      'Documento do cadastrador deve seguir o formato 123.456-7',
    );
  });
  it('retorna 404 quando nao existe', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    await expect(new CadastradorService(repository).findById(String(cadastradorId))).rejects.toBeInstanceOf(NotFoundError);
  });
});
