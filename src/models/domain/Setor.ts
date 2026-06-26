export type GrauRisco = 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto';

export interface Setor {
  id: number;
  codigo_setor: string;
  nome_regiao: string;
  tipo_risco: string;
  grau_risco: GrauRisco | null;
}
