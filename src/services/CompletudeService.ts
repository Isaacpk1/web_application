import { CompletudeItem, CompletudeRepository } from '../repositories/CompletudeRepository';

export interface CompletudeStats {
  total: number;
  completos: number;
  incompletos: number;
  taxa: number;
}

export interface CompletudeResposta {
  stats: CompletudeStats;
  items: CompletudeItem[];
}

export class CompletudeService {
  constructor(private readonly repository = new CompletudeRepository()) {}

  async listar(aba?: string): Promise<CompletudeResposta> {
    const todos = await this.repository.listar();

    const total = todos.length;
    const completos = todos.filter((i) => i.completo).length;
    const incompletos = total - completos;
    const taxa = total > 0 ? Math.round((completos / total) * 100) : 0;

    let items: CompletudeItem[];
    if (aba === 'completos') items = todos.filter((i) => i.completo);
    else if (aba === 'incompletos') items = todos.filter((i) => !i.completo);
    else items = todos;

    return { stats: { total, completos, incompletos, taxa }, items };
  }
}
