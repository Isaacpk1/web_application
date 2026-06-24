import { supabase } from '../../database/supabaseClient';
import { NucleoFamiliarConsultaRepository } from '../../repositories/NucleoFamiliarConsultaRepository';

jest.mock('../../database/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('NucleoFamiliarConsultaRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findCasaIdByNucleoFamiliarId retorna id_casa quando existe', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id_casa: 42 }, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    const repository = new NucleoFamiliarConsultaRepository();

    const result = await repository.findCasaIdByNucleoFamiliarId(101);

    expect(result).toBe(42);
    expect(supabase.from).toHaveBeenCalledWith('nucleo_familiar');
    expect(query.eq).toHaveBeenCalledWith('id', 101);
  });

  it('findCasaIdByNucleoFamiliarId retorna null quando nenhum registro encontrado', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    const repository = new NucleoFamiliarConsultaRepository();

    const result = await repository.findCasaIdByNucleoFamiliarId(101);

    expect(result).toBeNull();
  });

  it('findSetorIdByNucleoFamiliarId retorna null quando nucleo familiar nao tem imovel', async () => {
    const firstQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(firstQuery);

    const repository = new NucleoFamiliarConsultaRepository();

    const result = await repository.findSetorIdByNucleoFamiliarId(101);

    expect(result).toBeNull();
    expect(firstQuery.eq).toHaveBeenCalledWith('id', 101);
  });

  it('findSetorIdByNucleoFamiliarId retorna id_setor quando existe', async () => {
    const firstQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id_casa: 3 }, error: null }),
    };
    const secondQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id_setor: 7 }, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(firstQuery).mockReturnValueOnce(secondQuery);

    const repository = new NucleoFamiliarConsultaRepository();

    const result = await repository.findSetorIdByNucleoFamiliarId(101);

    expect(result).toBe(7);
    expect(secondQuery.eq).toHaveBeenCalledWith('id', 3);
  });
});