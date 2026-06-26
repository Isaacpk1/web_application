import { StatusImovel, TipoConstrucao, UsoImovel } from '../domain/Casa';

export interface CreateCasaDTO {
  id_setor: number;
  coordenada_lat: number;
  coordenada_long: number;
  logradouro?: string | null;
  numero?: string | null;
  observacao?: string | null;
  bairro?: string | null;
  cep?: string | null;
  tipo_construcao: TipoConstrucao;
  uso_imovel: UsoImovel;
  status_imovel?: StatusImovel;
  data_interdicao?: string | null;
  foto_fachada_url?: string | null;
  foto_detalhe_url?: string | null;
}
