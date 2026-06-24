import { supabase } from '../../database/supabaseClient';
import { IndividuoRepository } from '../../repositories/IndividuoRepository';

jest.mock('../../database/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('IndividuoRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('existsByCpfOrNis retorna false quando cpf e nis nao sao fornecidos', async () => {
    const repository = new IndividuoRepository();

    const result = await repository.existsByCpfOrNis(undefined, undefined);

    expect(result).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('existsByCpfOrNis consulta supabase com filtros OR para cpf e nis', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      then(resolve: any, reject: any) {
        return Promise.resolve({ data: [{ id: 2 }], error: null }).then(resolve, reject);
      },
    } as any;
    (supabase.from as jest.Mock).mockReturnValue(query);

    const repository = new IndividuoRepository();

    const result = await repository.existsByCpfOrNis('12345678901', '10987654321');

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('individuo');
    expect(query.or).toHaveBeenCalledWith('cpf.eq.12345678901,nis.eq.10987654321');
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('existsByCpfOrNis utiliza exclusao de id quando excludeId eh informado', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      then(resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    } as any;
    (supabase.from as jest.Mock).mockReturnValue(query);

    const repository = new IndividuoRepository();

    const result = await repository.existsByCpfOrNis('12345678901', '10987654321', 2);

    expect(result).toBe(false);
    expect(query.neq).toHaveBeenCalledWith('id', 2);
  });
});