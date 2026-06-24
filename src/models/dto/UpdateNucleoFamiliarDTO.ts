import { CreateNucleoFamiliarDTO } from './CreateNucleoFamiliarDTO';

/**
 * Payload para atualizar parcialmente uma linha em `nucleo_familiar`.
 */
export type UpdateNucleoFamiliarDTO = Partial<Omit<CreateNucleoFamiliarDTO, 'id_cadastrador'>>;
