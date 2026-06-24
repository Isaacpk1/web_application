export interface CreatePetDTO {
  id_nucleo_familiar: number;
  tipo?: string | null;
  porte?: string | null;
  imagem?: string | null;
  quantidade?: number | null;
}
