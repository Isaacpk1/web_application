import { CreateCasaDTO } from './CreateCasaDTO';
import { CreateIndividuoDTO } from './CreateIndividuoDTO';
import { CreateNucleoFamiliarDTO } from './CreateNucleoFamiliarDTO';
import { CreatePetDTO } from './CreatePetDTO';

export interface CreateCadastroCompletoDTO {
  casa: CreateCasaDTO;
  nucleo_familiar: Omit<CreateNucleoFamiliarDTO, 'id_casa' | 'id_chefe_familia'>;
  individuos: Array<Omit<CreateIndividuoDTO, 'id_nucleo_familiar'>>;
  responsavel_indice: number;
  pets?: Array<Omit<CreatePetDTO, 'id_nucleo_familiar'>>;
  vulnerabilidades_por_individuo?: Record<string, number[]>;
}
