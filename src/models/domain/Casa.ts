export type TipoConstrucao = 'Madeira' | 'Alvenaria' | 'Misto';
export type UsoImovel = 'Residencial' | 'Comercial' | 'Misto';
export type StatusImovel = 'Sadio' | 'Interditado' | 'Destruido';

export interface Casa {
  id: number;
  id_setor: number;
  coordenada_lat: number;
  coordenada_long: number;
  logradouro: string;
  numero: string;
  observacao: string | null;
  bairro: string;
  cep: string | null;
  tipo_construcao: TipoConstrucao;
  uso_imovel: UsoImovel;
  status_imovel: StatusImovel;
  data_interdicao: string | null;
}
