import { supabase } from '../../database/supabaseClient';
import { VulnerabilidadeRepository } from '../../repositories/VulnerabilidadeRepository';

jest.mock('../../database/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('VulnerabilidadeRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('findByIndividuoId retorna lista vazia quando nao ha links', async () => {
    const firstQuery: any = {
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };

    const secondQuery: any = {
      select: jest.fn().mockImplementation(() => ({
        in: jest.fn().mockResolvedValue({ data: [{ id: 6, tipo_vulnerabilidade: 'Gestante' }], error: null }),
      })),
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(firstQuery).mockReturnValueOnce(secondQuery);

    const repository = new VulnerabilidadeRepository();

    const result = await repository.findByIndividuoId(2);

    expect(result).toEqual([]);
    expect(firstQuery.select).toHaveBeenCalledWith('id_vulnerabilidade');
  });

  it('findByIndividuoId retorna vulnerabilidades quando existe linking', async () => {
    const firstQuery: any = {
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ data: [{ id_vulnerabilidade: 6 }], error: null }),
      })),
    };

    const secondQuery: any = {
      select: jest.fn().mockImplementation(() => ({
        in: jest.fn().mockResolvedValue({ data: [{ id: 6, tipo_vulnerabilidade: 'Gestante' }], error: null }),
      })),
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(firstQuery).mockReturnValueOnce(secondQuery);

    const repository = new VulnerabilidadeRepository();

    const result = await repository.findByIndividuoId(2);

    expect(result).toEqual([{ id: 6, tipo_vulnerabilidade: 'Gestante' }]);
    expect(firstQuery.select).toHaveBeenCalledWith('id_vulnerabilidade');
    expect(secondQuery.select).toHaveBeenCalledWith('*');
  });
});