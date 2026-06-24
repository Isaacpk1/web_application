import { CadastroBuscaFiltro, CadastroBuscaPagina, CadastroBuscaRepository } from '../repositories/CadastroBuscaRepository';

export class CadastroBuscaService {
  constructor(private readonly repository = new CadastroBuscaRepository()) {}

  async buscar(query: Record<string, unknown>): Promise<CadastroBuscaPagina> {
    const filtro: CadastroBuscaFiltro = {
      nome: typeof query.nome === 'string' ? query.nome : undefined,
      cpf: typeof query.cpf === 'string' ? query.cpf : undefined,
      bairro: typeof query.bairro === 'string' ? query.bairro : undefined,
      nivel_risco: typeof query.nivel_risco === 'string' ? query.nivel_risco : undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    };

    return this.repository.buscar(filtro);
  }
}
