export interface NucleoFamiliar {
  id: number;
  nome_nucleo: string;
  id_casa: number;
  id_cadastrador: number | null;
  id_chefe_familia: number | null;
  observacao: string | null;
  tempo_residencia_domicilio: number | null;
  tempo_residencia_area: number | null;
  tempo_residencia_municipio: number | null;
  renda_familiar_total: number | null;
}
