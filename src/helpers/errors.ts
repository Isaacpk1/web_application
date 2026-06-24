/**
 * Erro base da aplicacao com status HTTP associado.
 *
 * @remarks
 * Controllers usam esta classe para diferenciar erros esperados de falhas
 * internas inesperadas.
 *
 * @param message - Mensagem legivel retornada para a API.
 * @param statusCode - Codigo HTTP que representa o erro.
 *
 * @example
 * ```typescript
 * throw new AppError('Falha de validacao', 400);
 * ```
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Erro para requisicoes malformadas ou parametros invalidos.
 *
 * @example
 * ```typescript
 * throw new BadRequestError('Body deve ser um objeto JSON');
 * ```
 */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Erro para conflito de estado ou violacao de unicidade.
 *
 * @example
 * ```typescript
 * throw new ConflictError('CPF ou NIS ja cadastrado');
 * ```
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Erro para recurso inexistente.
 *
 * @example
 * ```typescript
 * throw new NotFoundError('Individuo nao encontrada');
 * ```
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro para dados sintaticamente validos, mas rejeitados por regra de validacao.
 *
 * @example
 * ```typescript
 * throw new UnprocessableEntityError('CPF invalido: cpf');
 * ```
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

/**
 * Extrai uma mensagem segura de erro.
 *
 * @remarks
 * Quando o valor capturado nao e uma instancia de Error, retorna uma mensagem
 * generica para evitar vazamento de detalhes internos.
 *
 * @param error - Valor capturado em um bloco `catch`.
 * @returns Mensagem que pode ser enviada na resposta HTTP.
 *
 * @example
 * ```typescript
 * const message = getErrorMessage(error);
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro interno inesperado';
}
