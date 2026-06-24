import { GrauRisco } from '../domain/Setor';

export interface UpdateSetorDTO {
  nome_regiao?: string;
  tipo_risco?: string;
  grau_risco?: GrauRisco | null;
}
