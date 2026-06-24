import { throwDatabaseError } from '../../helpers/databaseErrors';
import { BadRequestError, ConflictError } from '../../helpers/errors';

describe('throwDatabaseError', () => {
  it.each(['23503', '23505'])('traduz o codigo %s para conflito', (code) => {
    expect(() => throwDatabaseError({ code, message: 'erro do banco' })).toThrow(ConflictError);
  });

  it.each(['22001', '22P02', '23502', '23514'])('traduz o codigo %s para requisicao invalida', (code) => {
    expect(() => throwDatabaseError({ code, message: 'erro do banco' })).toThrow(BadRequestError);
  });

  it('mantem codigo desconhecido como erro interno', () => {
    expect(() => throwDatabaseError({ code: 'XX000', message: 'falha inesperada' })).toThrow('falha inesperada');
  });
});
