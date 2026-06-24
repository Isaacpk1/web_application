import { BadRequestError, NotFoundError } from '../../helpers/errors';
import { VulnerabilidadeRepository } from '../../repositories/VulnerabilidadeRepository';
import { IndividuoService } from '../../services/IndividuoService';
import { VulnerabilidadeService } from '../../services/VulnerabilidadeService';
import { individuo, individuoId, vulnerabilidade, vulnerabilidadeId } from '../factories';

const makeRepository = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIndividuoId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  associate: jest.fn(),
  disassociate: jest.fn(),
}) as unknown as jest.Mocked<VulnerabilidadeRepository>;
const makeIndividuoService = () => ({ findById: jest.fn().mockResolvedValue(individuo()) }) as unknown as jest.Mocked<IndividuoService>;

describe('VulnerabilidadeService alinhado ao catalogo e associacao', () => {
  it('cria um tipo de vulnerabilidade', async () => {
    const repository = makeRepository();
    repository.create.mockResolvedValue(vulnerabilidade());
    await new VulnerabilidadeService(repository, makeIndividuoService()).create({ tipo_vulnerabilidade: ' Gestante ' });
    expect(repository.create).toHaveBeenCalledWith({ tipo_vulnerabilidade: 'Gestante' });
  });
  it('rejeita tipo vazio', async () => {
    await expect(new VulnerabilidadeService(makeRepository(), makeIndividuoService()).create({ tipo_vulnerabilidade: '' })).rejects.toBeInstanceOf(BadRequestError);
  });
  it('retorna 404 para vulnerabilidade inexistente', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    await expect(new VulnerabilidadeService(repository, makeIndividuoService()).findById(String(vulnerabilidadeId))).rejects.toBeInstanceOf(NotFoundError);
  });
  it('associa vulnerabilidade a individuo com IDs numericos', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(vulnerabilidade());
    repository.associate.mockResolvedValue({ id_individuo: individuoId, id_vulnerabilidade: vulnerabilidadeId });
    const result = await new VulnerabilidadeService(repository, makeIndividuoService()).associate(String(individuoId), String(vulnerabilidadeId));
    expect(result).toEqual({ id_individuo: individuoId, id_vulnerabilidade: vulnerabilidadeId });
  });
});
