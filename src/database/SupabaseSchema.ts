export interface Setor extends Record<string, unknown> {
  id: number;
  nome_regiao: string;
  tipo_risco: string;
  grau_risco: string | null;
}

/** View de leitura que resume os tipos e o maior grau de risco do setor. */
export interface SetorApi extends Record<string, unknown> {
  id: number;
  nome_regiao: string;
  tipo_risco: string | null;
  grau_risco: string | null;
}

export interface Cadastrador extends Record<string, unknown> {
  id: number;
  nome: string;
  documento: string;
}

export interface Casa extends Record<string, unknown> {
  id: number;
  id_setor: number;
  coordenada_lat: number;
  coordenada_long: number;
  logradouro: string;
  numero: string;
  observacao: string | null;
  bairro: string;
  cep: string | null;
  tipo_construcao: string;
  uso_imovel: string;
  status_imovel: string;
  data_interdicao: string | null;
}

export interface NucleoFamiliar extends Record<string, unknown> {
  id: number;
  nome_nucleo: string;
  id_casa: number;
  id_cadastrador: number | null;
  id_chefe_familia: number | null;
  observacao: string | null;
  tempo_residencia_domicilio: number | null;
  tempo_residencia_area: number | null;
  tempo_residencia_municipio: number | null;
  renda_familiar_total: number;
}

export interface Individuo extends Record<string, unknown> {
  id: number;
  id_nucleo_familiar: number;
  nome_completo: string;
  apelido: string | null;
  nome_social: string | null;
  data_nascimento: string;
  genero: string;
  cor_raca: string | null;
  uf: string | null;
  estado_civil: string | null;
  profissao: string | null;
  nome_mae: string | null;
  nome_pai: string | null;
  grau_parentesco: string | null;
  escolaridade: string | null;
  situacao_ocupacional: string | null;
  cpf: string | null;
  doc_estrangeiro: string | null;
  rg: string | null;
  nis: string | null;
  telefone: string | null;
  email: string | null;
  status_vital: string;
  data_obito: string | null;
  semanas_gestacao: number | null;
}

export interface Pet extends Record<string, unknown> {
  id: number;
  id_nucleo_familiar: number;
  tipo: string | null;
  porte: string | null;
  imagem: string | null;
  quantidade: number | null;
}

export interface VulnerabilidadeRow extends Record<string, unknown> {
  id: number;
  tipo_vulnerabilidade: string;
}

export interface IndividuoVulnerabilidade extends Record<string, unknown> {
  id_individuo: number;
  id_vulnerabilidade: number;
}

type RowUpdate<Row extends { id: number }> = Record<string, unknown> & Partial<Omit<Row, 'id'>>;

export type SetorInsert = Record<string, unknown> & Pick<Setor, 'nome_regiao' | 'tipo_risco'> & Partial<Pick<Setor, 'id' | 'grau_risco'>>;
export type SetorUpdate = RowUpdate<Setor>;
export type CadastradorInsert = Record<string, unknown> & Pick<Cadastrador, 'nome' | 'documento'> & Partial<Pick<Cadastrador, 'id'>>;
export type CadastradorUpdate = RowUpdate<Cadastrador>;
export type CasaInsert = Record<string, unknown> &
  Pick<Casa, 'id_setor' | 'coordenada_lat' | 'coordenada_long' | 'logradouro' | 'numero' | 'bairro' | 'tipo_construcao' | 'uso_imovel'> &
  Partial<Pick<Casa, 'id' | 'observacao' | 'cep' | 'status_imovel' | 'data_interdicao'>>;
export type CasaUpdate = RowUpdate<Casa>;
export type NucleoFamiliarInsert = Record<string, unknown> &
  Pick<NucleoFamiliar, 'nome_nucleo' | 'id_casa'> &
  Partial<Pick<NucleoFamiliar, 'id' | 'id_cadastrador' | 'id_chefe_familia' | 'observacao' | 'tempo_residencia_domicilio' | 'tempo_residencia_area' | 'tempo_residencia_municipio' | 'renda_familiar_total'>>;
export type NucleoFamiliarUpdate = RowUpdate<NucleoFamiliar>;
export type IndividuoInsert = Record<string, unknown> &
  Pick<Individuo, 'id_nucleo_familiar' | 'nome_completo' | 'data_nascimento' | 'genero'> &
  Partial<Pick<Individuo, 'id' | 'apelido' | 'nome_social' | 'cor_raca' | 'uf' | 'estado_civil' | 'profissao' | 'nome_mae' | 'nome_pai' | 'grau_parentesco' | 'escolaridade' | 'situacao_ocupacional' | 'cpf' | 'doc_estrangeiro' | 'rg' | 'nis' | 'telefone' | 'email' | 'status_vital' | 'data_obito' | 'semanas_gestacao'>>;
export type IndividuoUpdate = RowUpdate<Individuo>;
export type PetInsert = Record<string, unknown> &
  Pick<Pet, 'id_nucleo_familiar'> &
  Partial<Pick<Pet, 'id' | 'tipo' | 'porte' | 'imagem' | 'quantidade'>>;
export type PetUpdate = RowUpdate<Pet>;
export type VulnerabilidadeInsert = Record<string, unknown> & Pick<VulnerabilidadeRow, 'tipo_vulnerabilidade'> & Partial<Pick<VulnerabilidadeRow, 'id'>>;
export type VulnerabilidadeUpdate = RowUpdate<VulnerabilidadeRow>;
export type IndividuoVulnerabilidadeInsert = Record<string, unknown> & IndividuoVulnerabilidade;
export type IndividuoVulnerabilidadeUpdate = Record<string, unknown> & Partial<IndividuoVulnerabilidade>;

export type TableName = keyof Database['public']['Tables'];

export interface Database {
  public: {
    Tables: {
      setor: { Row: Setor; Insert: SetorInsert; Update: SetorUpdate; Relationships: [] };
      cadastrador: { Row: Cadastrador; Insert: CadastradorInsert; Update: CadastradorUpdate; Relationships: [] };
      casa: { Row: Casa; Insert: CasaInsert; Update: CasaUpdate; Relationships: [] };
      nucleo_familiar: { Row: NucleoFamiliar; Insert: NucleoFamiliarInsert; Update: NucleoFamiliarUpdate; Relationships: [] };
      individuo: { Row: Individuo; Insert: IndividuoInsert; Update: IndividuoUpdate; Relationships: [] };
      pet: { Row: Pet; Insert: PetInsert; Update: PetUpdate; Relationships: [] };
      vulnerabilidade: { Row: VulnerabilidadeRow; Insert: VulnerabilidadeInsert; Update: VulnerabilidadeUpdate; Relationships: [] };
      individuo_vulnerabilidade: { Row: IndividuoVulnerabilidade; Insert: IndividuoVulnerabilidadeInsert; Update: IndividuoVulnerabilidadeUpdate; Relationships: [] };
    };
    Views: {
      setor_api: { Row: SetorApi; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
