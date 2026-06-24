export type GrauRisco = 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto';

export interface Setor {
  id: number;
  nome_regiao: string;
  tipo_risco: string;
  grau_risco: GrauRisco | null;
}
