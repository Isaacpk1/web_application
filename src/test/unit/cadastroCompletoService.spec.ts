import { BadRequestError } from '../../helpers/errors';
import { CreateCadastroCompletoDTO } from '../../models/dto/CreateCadastroCompletoDTO';
import { CadastroCompletoRepository } from '../../repositories/CadastroCompletoRepository';
import { CadastroCompletoService } from '../../services/CadastroCompletoService';

const chave = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const payload: CreateCadastroCompletoDTO = {
  casa: { id_setor: 1, coordenada_lat: -23.66, coordenada_long: -46.52, logradouro: 'Rua A', numero: '1', bairro: 'Centro', tipo_construcao: 'Alvenaria', uso_imovel: 'Residencial' },
  nucleo_familiar: { nome_nucleo: 'Familia Silva', id_cadastrador: 1 },
  individuos: [{ nome_completo: 'Ana Silva', data_nascimento: '1990-01-01', genero: 'Feminino' }],
  responsavel_indice: 0,
};

describe('CadastroCompletoService', () => {
  const repository = { criar: jest.fn() } as unknown as jest.Mocked<CadastroCompletoRepository>;
  const service = new CadastroCompletoService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('encaminha cadastro valido com a chave de idempotencia', async () => {
    repository.criar.mockResolvedValue({ nucleo_familiar_id: 1, reutilizado: false });
    await expect(service.criar(chave, payload)).resolves.toMatchObject({ nucleo_familiar_id: 1 });
    expect(repository.criar).toHaveBeenCalledWith(chave, payload);
  });

  it('rejeita chave ausente ou invalida', async () => {
    await expect(service.criar(undefined, payload)).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.criar('nao-e-uuid', payload)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita cadastro sem membros ou responsavel fora da lista', async () => {
    await expect(service.criar(chave, { ...payload, individuos: [] })).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.criar(chave, { ...payload, responsavel_indice: 2 })).rejects.toBeInstanceOf(BadRequestError);
  });
});
