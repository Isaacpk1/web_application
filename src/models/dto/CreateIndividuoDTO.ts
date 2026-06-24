import { CorRaca, EstadoCivil, Genero, StatusVital } from '../domain/Individuo';

export interface CreateIndividuoDTO {
  id_nucleo_familiar: number;
  nome_completo: string;
  apelido?: string | null;
  nome_social?: string | null;
  data_nascimento: string;
  genero: Genero;
  cor_raca?: CorRaca | null;
  uf?: string | null;
  estado_civil?: EstadoCivil | null;
  profissao?: string | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  grau_parentesco?: string | null;
  escolaridade?: string | null;
  situacao_ocupacional?: string | null;
  cpf?: string | null;
  doc_estrangeiro?: string | null;
  rg?: string | null;
  nis?: string | null;
  telefone?: string | null;
  email?: string | null;
  status_vital?: StatusVital;
  data_obito?: string | null;
  semanas_gestacao?: number | null;
}
