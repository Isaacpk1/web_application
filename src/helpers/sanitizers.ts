const digitOnlyFields = new Set([
  'cpf',
  'nis',
  'telefone',
  'cep',
]);
const uppercaseFields = new Set([
  'nome',
  'nome_completo',
  'nome_social',
  'nome_nucleo',
  'nome_regiao',
  'nome_mae',
  'nome_pai',
  'escolaridade',
  'situacao_ocupacional',
  'profissao',
  'bairro',
  'logradouro',
  'referencia',
  'nivel_risco',
  'uf',
  // 'estado_civil' excluido: o banco usa CHECK IN ('Solteiro','Casado','Viuvo','Divorciado') — valores title-case, nao uppercase
]);

/**
 * Remove tudo que nao for digito de uma string.
 *
 * @param value - Texto contendo documento, telefone ou CEP.
 * @returns String composta apenas por numeros.
 *
 * @example
 * ```typescript
 * const cpf = onlyDigits('529.982.247-25'); // '52998224725'
 * ```
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normaliza texto para caixa alta, sem acentos e sem espacos repetidos.
 *
 * @param value - Texto livre enviado pelo cliente.
 * @returns Texto padronizado para persistencia e busca.
 *
 * @example
 * ```typescript
 * const nome = normalizeUppercaseText(' Jose  da Silva '); // 'JOSE DA SILVA'
 * ```
 */
export function normalizeUppercaseText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Sanitiza um unico valor conforme o nome do campo.
 *
 * @remarks
 * Campos de documento/telefone ficam apenas com digitos; campos textuais
 * relevantes sao normalizados em caixa alta; demais strings sao aparadas.
 *
 * @param field - Nome do campo recebido no payload.
 * @param value - Valor original informado pelo cliente.
 * @returns Valor sanitizado ou o proprio valor quando nao for string.
 *
 * @example
 * ```typescript
 * const value = sanitizeInputValue('telefone1', '(11) 98888-7777');
 * ```
 */
export function sanitizeInputValue(field: string, value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  if (digitOnlyFields.has(field)) {
    return onlyDigits(value);
  }

  if (uppercaseFields.has(field)) {
    return normalizeUppercaseText(value);
  }

  return value.trim();
}

/**
 * Sanitiza todos os campos de um objeto.
 *
 * @param payload - Objeto com dados recebidos pela API.
 * @returns Novo objeto com os campos normalizados.
 *
 * @example
 * ```typescript
 * const payload = sanitizeObject({ nome: ' Ana ', cpf: '529.982.247-25' });
 * ```
 */
export function sanitizeObject<T extends object>(payload: T): T {
  return Object.entries(payload).reduce<Record<string, unknown>>((sanitized, [field, value]) => {
    sanitized[field] = sanitizeInputValue(field, value);
    return sanitized;
  }, {}) as unknown as T;
}
