import { Casa } from '../models/domain/Casa';
import { Cadastrador } from '../models/domain/Cadastrador';
import { Individuo } from '../models/domain/Individuo';
import { NucleoFamiliar } from '../models/domain/NucleoFamiliar';
import { Pet } from '../models/domain/Pet';
import { Setor } from '../models/domain/Setor';
import { Vulnerabilidade } from '../models/domain/Vulnerabilidade';
import { CreateCasaDTO } from '../models/dto/CreateCasaDTO';
import { CreateCadastradorDTO } from '../models/dto/CreateCadastradorDTO';
import { CreateIndividuoDTO } from '../models/dto/CreateIndividuoDTO';
import { CreateNucleoFamiliarDTO } from '../models/dto/CreateNucleoFamiliarDTO';
import { CreatePetDTO } from '../models/dto/CreatePetDTO';
import { CreateSetorDTO } from '../models/dto/CreateSetorDTO';
import { CreateVulnerabilidadeDTO } from '../models/dto/CreateVulnerabilidadeDTO';

export const nucleoFamiliarId = 1;
export const individuoId = 2;
export const casaId = 3;
export const setorId = 4;
export const cadastradorId = 5;
export const vulnerabilidadeId = 6;
export const petId = 7;

export const createSetorDTO = (overrides: Partial<CreateSetorDTO> = {}): CreateSetorDTO => ({
  nome_regiao: 'VILA PALMARES',
  tipo_risco: 'Deslizamento',
  grau_risco: 'Alto',
  ...overrides,
});
export const setor = (overrides: Partial<Setor> = {}): Setor => ({
  id: setorId,
  nome_regiao: 'VILA PALMARES',
  tipo_risco: 'Deslizamento',
  grau_risco: 'Alto',
  ...overrides,
});

export const createCasaDTO = (overrides: Partial<CreateCasaDTO> = {}): CreateCasaDTO => ({
  id_setor: setorId,
  coordenada_lat: -23.55,
  coordenada_long: -46.63,
  logradouro: 'Rua A',
  numero: '100',
  observacao: null,
  bairro: 'Centro',
  cep: '01234567',
  tipo_construcao: 'Alvenaria',
  uso_imovel: 'Residencial',
  status_imovel: 'Sadio',
  ...overrides,
});
export const casa = (overrides: Partial<Casa> = {}): Casa => ({
  id: casaId,
  ...createCasaDTO(),
  observacao: null,
  cep: '01234567',
  status_imovel: 'Sadio',
  data_interdicao: null,
  ...overrides,
});

export const createCadastradorDTO = (overrides: Partial<CreateCadastradorDTO> = {}): CreateCadastradorDTO => ({
  nome: 'Agente Silva',
  documento: '123.456-7',
  ...overrides,
});
export const cadastrador = (overrides: Partial<Cadastrador> = {}): Cadastrador => ({
  id: cadastradorId,
  nome: 'Agente Silva',
  documento: '123.456-7',
  ...overrides,
});

export const createNucleoFamiliarDTO = (overrides: Partial<CreateNucleoFamiliarDTO> = {}): CreateNucleoFamiliarDTO => ({
  observacao: 'FICHA-001',
  nome_nucleo: 'Familia Silva',
  id_casa: casaId,
  id_cadastrador: cadastradorId,
  renda_familiar_total: 1800,
  ...overrides,
});
export const nucleoFamiliar = (overrides: Partial<NucleoFamiliar> = {}): NucleoFamiliar => ({
  id: nucleoFamiliarId,
  observacao: 'FICHA-001',
  nome_nucleo: 'Familia Silva',
  id_casa: casaId,
  id_cadastrador: cadastradorId,
  id_chefe_familia: null,
  tempo_residencia_domicilio: null,
  tempo_residencia_area: null,
  tempo_residencia_municipio: null,
  renda_familiar_total: 1800,
  ...overrides,
});

export const createIndividuoDTO = (overrides: Partial<CreateIndividuoDTO> = {}): CreateIndividuoDTO => ({
  id_nucleo_familiar: nucleoFamiliarId,
  nome_completo: 'Joao Silva',
  data_nascimento: '1990-05-10',
  genero: 'Masculino',
  cpf: '52998224725',
  ...overrides,
});
export const individuo = (overrides: Partial<Individuo> = {}): Individuo => ({
  id: individuoId,
  id_nucleo_familiar: nucleoFamiliarId,
  nome_completo: 'Joao Silva',
  apelido: null,
  nome_social: null,
  data_nascimento: '1990-05-10',
  genero: 'Masculino',
  cor_raca: null,
  uf: null,
  estado_civil: null,
  profissao: null,
  nome_mae: null,
  nome_pai: null,
  grau_parentesco: null,
  escolaridade: null,
  situacao_ocupacional: null,
  cpf: '52998224725',
  doc_estrangeiro: null,
  rg: null,
  nis: null,
  telefone: null,
  email: null,
  status_vital: 'Vivo',
  data_obito: null,
  semanas_gestacao: null,
  ...overrides,
});

export const createVulnerabilidadeDTO = (overrides: Partial<CreateVulnerabilidadeDTO> = {}): CreateVulnerabilidadeDTO => ({
  tipo_vulnerabilidade: 'Gestante',
  ...overrides,
});
export const vulnerabilidade = (overrides: Partial<Vulnerabilidade> = {}): Vulnerabilidade => ({
  id: vulnerabilidadeId,
  tipo_vulnerabilidade: 'Gestante',
  ...overrides,
});

export const createPetDTO = (overrides: Partial<CreatePetDTO> = {}): CreatePetDTO => ({
  id_nucleo_familiar: nucleoFamiliarId,
  tipo: 'Cachorro',
  porte: 'Medio',
  quantidade: 1,
  ...overrides,
});
export const pet = (overrides: Partial<Pet> = {}): Pet => ({
  id: petId,
  id_nucleo_familiar: nucleoFamiliarId,
  tipo: 'Cachorro',
  porte: 'Medio',
  imagem: null,
  quantidade: 1,
  ...overrides,
});
