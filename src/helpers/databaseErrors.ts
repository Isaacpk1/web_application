import { BadRequestError, ConflictError } from './errors';

interface DatabaseError {
  code?: string;
  message: string;
}

const conflictCodes = new Set(['23503', '23505']);
const badRequestCodes = new Set(['22001', '22023', '22P02', '23502', '23514']);

export function throwDatabaseError(error: DatabaseError): never {
  if (conflictCodes.has(error.code ?? '')) {
    if (/CPF ja cadastrado/i.test(error.message)) throw new ConflictError('CPF ja cadastrado');
    if (/NIS ja cadastrado/i.test(error.message)) throw new ConflictError('NIS ja cadastrado');
    if (/Duplicidade sem documento/i.test(error.message)) {
      throw new ConflictError('Ja existe responsavel sem documento cadastrado neste endereco');
    }
    throw new ConflictError('Operacao conflita com dados existentes');
  }

  if (badRequestCodes.has(error.code ?? '')) {
    if (/Endereco invalido|Responsavel invalido|Vulnerabilidade invalida|Pet invalido|Payload de cadastro|Cadastrador invalido/i.test(error.message)) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError('Dados rejeitados pelo banco de dados');
  }

  throw new Error(error.message);
}
