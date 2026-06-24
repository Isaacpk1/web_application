import { BadRequestError } from './errors';

/**
 * Recupera um parametro de rota garantindo que ele seja string.
 *
 * @remarks
 * Express pode representar parametros de forma ampla em tipos. Este helper
 * concentra a validacao antes de controllers repassarem o valor aos services.
 *
 * @param params - Objeto `req.params` recebido pelo controller.
 * @param name - Nome do parametro esperado.
 * @returns Valor do parametro como string.
 *
 * @example
 * ```typescript
 * const id = getRouteParam(req.params, 'id');
 * ```
 */
export function getRouteParam(params: Record<string, string | string[] | undefined>, name: string): string {
  const value = params[name];

  if (typeof value !== 'string') {
    throw new BadRequestError(`Parametro de rota invalido: ${name}`);
  }

  return value;
}
