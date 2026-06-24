import { CadastroMapaFiltro, CadastroMapaRepository, MapaPonto } from '../repositories/CadastroMapaRepository';

export interface CadastroMapaResposta {
  total: number;
  pontos: MapaPonto[];
}

export class CadastroMapaService {
  constructor(private readonly repository = new CadastroMapaRepository()) {}

  async listar(query: Record<string, unknown>): Promise<CadastroMapaResposta> {
    const filtro: CadastroMapaFiltro = {
      bairro: typeof query.bairro === 'string' ? query.bairro : undefined,
      nivel_risco: typeof query.nivel_risco === 'string' ? query.nivel_risco : undefined,
      genero: typeof query.genero === 'string' ? query.genero : undefined,
      tipo_construcao: typeof query.tipo_construcao === 'string' ? query.tipo_construcao : undefined,
    };

    const pontos = await this.repository.listar(filtro);
    return { total: pontos.length, pontos };
  }
}
