import { GrauRisco } from '../domain/Setor';

export interface CreateSetorDTO {
  nome_regiao: string;
  tipo_risco: string;
  grau_risco?: GrauRisco | null;
}
