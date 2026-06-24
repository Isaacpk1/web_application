export interface Vulnerabilidade {
  id: number;
  tipo_vulnerabilidade: string;
}

export interface IndividuoVulnerabilidade {
  id_individuo: number;
  id_vulnerabilidade: number;
}
