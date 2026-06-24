import { BadRequestError } from '../helpers/errors';
import { CreateCadastroCompletoDTO } from '../models/dto/CreateCadastroCompletoDTO';
import { CadastroCompletoRepository } from '../repositories/CadastroCompletoRepository';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CadastroCompletoService {
  constructor(private readonly repository = new CadastroCompletoRepository()) {}

  async criar(chaveIdempotencia: string | undefined, payload: CreateCadastroCompletoDTO): Promise<unknown> {
    if (!chaveIdempotencia || !uuidRegex.test(chaveIdempotencia)) {
      throw new BadRequestError('Header Idempotency-Key deve conter um UUID valido');
    }
    if (!Array.isArray(payload.individuos) || payload.individuos.length === 0) {
      throw new BadRequestError('Informe ao menos um individuo');
    }
    if (!Number.isInteger(payload.responsavel_indice) || payload.responsavel_indice < 0 || payload.responsavel_indice >= payload.individuos.length) {
      throw new BadRequestError('responsavel_indice invalido');
    }
    return this.repository.criar(chaveIdempotencia, payload);
  }
}
