import { BadRequestError, UnprocessableEntityError } from './errors';

const cpfRegex = /^\d{11}$/;
const nisRegex = /^\d{11}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cadastradorDocumentoRegex = /^\d{3}\.\d{3}-\d$/;

/**
 * Garante que um valor seja uma string nao vazia.
 *
 * @param value - Valor a ser validado.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor; refina o tipo quando a validacao passa.
 *
 * @example
 * ```typescript
 * assertNonEmptyString(payload.nome, 'nome');
 * ```
 */
export function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestError(`Campo obrigatorio invalido: ${field}`);
  }
}

/**
 * Garante que um valor seja numerico.
 *
 * @param value - Valor a ser validado.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor; refina o tipo quando a validacao passa.
 *
 * @example
 * ```typescript
 * assertNumber(payload.renda, 'renda');
 * ```
 */
export function assertNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BadRequestError(`Campo numerico invalido: ${field}`);
  }
}

/**
 * Garante que um valor seja booleano.
 *
 * @param value - Valor a ser validado.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor; refina o tipo quando a validacao passa.
 */
export function assertBoolean(value: unknown, field: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestError(`Campo booleano invalido: ${field}`);
  }
}

/**
 * Garante que uma string pertenca ao conjunto de valores permitidos.
 *
 * @param value - Valor ja sanitizado a ser verificado.
 * @param field - Nome do campo usado na mensagem de erro.
 * @param allowedValues - Lista de valores validos para o enum.
 * @returns Nao retorna valor quando o valor e valido.
 *
 * @example
 * ```typescript
 * assertEnum(payload.nivel_risco, 'nivel_risco', ['BAIXO', 'MEDIO', 'ALTO', 'MUITO_ALTO']);
 * ```
 */
export function assertEnum(value: string, field: string, allowedValues: readonly string[]): void {
  if (!allowedValues.includes(value)) {
    throw new BadRequestError(`Valor invalido para ${field}. Valores permitidos: ${allowedValues.join(', ')}`);
  }
}

/**
 * Converte um parametro de rota em um ID compativel com as chaves `BIGINT`
 * identity do Supabase.
 *
 * @param value - Valor textual recebido pela rota.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns ID inteiro positivo validado.
 */
export function parsePositiveIntegerId(value: string, field = 'id'): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`ID invalido: ${field}`);
  }

  return parsed;
}

export function assertCadastradorDocumento(value: string): void {
  if (!cadastradorDocumentoRegex.test(value)) {
    throw new UnprocessableEntityError('Documento do cadastrador deve seguir o formato 123.456-7');
  }
}

/**
 * Valida matematicamente um CPF.
 *
 * @remarks
 * A funcao remove mascara antes de validar os digitos verificadores.
 *
 * @param value - CPF com ou sem mascara.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor quando o CPF e valido.
 *
 * @example
 * ```typescript
 * assertCpf('529.982.247-25', 'cpf');
 * ```
 */
export function assertCpf(value: string, field: string): void {
  const digits = value.replace(/\D/g, '');

  if (!cpfRegex.test(digits) || !hasValidCpfCheckDigits(digits)) {
    throw new UnprocessableEntityError(`CPF invalido: ${field}`);
  }
}

/**
 * Valida formato simples de e-mail.
 *
 * @param value - E-mail informado pelo cliente.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor quando o e-mail e valido.
 */
export function assertEmail(value: string, field: string): void {
  if (!emailRegex.test(value)) {
    throw new UnprocessableEntityError(`Email invalido: ${field}`);
  }
}

/**
 * Valida um CEP brasileiro com oito digitos.
 *
 * @param value - CEP com ou sem mascara.
 * @returns Nao retorna valor quando o CEP e valido.
 *
 * @example
 * ```typescript
 * assertCep('09000-000');
 * ```
 */
export function assertCep(value: string): void {
  if (!cepRegex.test(value.replace(/\D/g, ''))) {
    throw new UnprocessableEntityError('CEP invalido: cep');
  }
}

export function assertNis(value: string): void {
  if (!nisRegex.test(value)) {
    throw new UnprocessableEntityError('NIS deve conter exatamente 11 digitos');
  }
}

export function assertUf(value: string): void {
  if (!ufRegex.test(value)) {
    throw new UnprocessableEntityError('UF deve conter exatamente 2 letras');
  }
}

/**
 * Valida se uma data existe e nao esta no futuro.
 *
 * @param value - Data em formato aceito pelo construtor Date.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor quando a data e valida.
 *
 * @example
 * ```typescript
 * assertPastOrTodayDate('1990-05-10', 'data_nascimento');
 * ```
 */
export function assertPastOrTodayDate(value: string, field: string): void {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new UnprocessableEntityError(`Data invalida: ${field}`);
  }

  if (parsedDate.getTime() > Date.now()) {
    throw new UnprocessableEntityError(`Data nao pode estar no futuro: ${field}`);
  }
}

/**
 * Valida idade minima a partir de uma data de nascimento.
 *
 * @param value - Data de nascimento.
 * @param minimumAge - Idade minima exigida.
 * @param field - Nome do campo usado na mensagem de erro.
 * @returns Nao retorna valor quando a idade minima e atendida.
 *
 * @example
 * ```typescript
 * assertMinimumAge('1990-05-10', 18, 'data_nascimento_responsavel');
 * ```
 */
export function assertMinimumAge(value: string, minimumAge: number, field: string): void {
  assertPastOrTodayDate(value, field);

  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (today.getTime() < birthdayThisYear.getTime()) {
    age -= 1;
  }

  if (age < minimumAge) {
    throw new UnprocessableEntityError(`${field} deve indicar idade maior ou igual a ${minimumAge} anos`);
  }
}

/**
 * Confere os digitos verificadores de um CPF ja normalizado.
 *
 * @param digits - CPF contendo exatamente onze digitos.
 * @returns `true` quando os digitos verificadores batem.
 */
function hasValidCpfCheckDigits(digits: string): boolean {
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9), 10);
  const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10), 11);

  return digits[9] === String(firstCheckDigit) && digits[10] === String(secondCheckDigit);
}

/**
 * Calcula um digito verificador de CPF.
 *
 * @param base - Sequencia base de digitos.
 * @param initialWeight - Peso inicial da multiplicacao.
 * @returns Digito verificador calculado.
 */
function calculateCpfCheckDigit(base: string, initialWeight: number): number {
  const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * (initialWeight - index), 0);
  const remainder = (sum * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}
