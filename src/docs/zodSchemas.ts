import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const nullableString = z.string().nullable();
const id = z.number().int().positive();
const genero = z.enum(['Masculino', 'Feminino', 'Outro']);
const corRaca = z.enum(['Branco', 'Preto', 'Pardo', 'Amarelo', 'Indigena']);
const statusVital = z.enum(['Vivo', 'Obito', 'Desaparecido']);
const estadoCivil = z.enum(['Solteiro', 'Casado', 'Viuvo', 'Divorciado']);
const convert = zodToJsonSchema as unknown as (schema: unknown, options: Record<string, unknown>) => Record<string, unknown>;
const openApi = (schema: z.ZodTypeAny): Record<string, unknown> => convert(schema, { target: 'openApi3', $refStrategy: 'none' });

const cadastrador = z.object({ id, nome: z.string(), documento: z.string().regex(/^\d{3}\.\d{3}-\d$/) }).strip();
const setor = z.object({
  id,
  codigo_setor: z.string(),
  nome_regiao: z.string(),
  tipo_risco: z.string(),
  grau_risco: z.enum(['Baixo', 'Médio', 'Alto', 'Muito Alto']).nullable(),
}).strip();
const casa = z.object({
  id,
  id_setor: id,
  coordenada_lat: z.number(),
  coordenada_long: z.number(),
  logradouro: nullableString,
  numero: nullableString,
  observacao: nullableString,
  bairro: nullableString,
  cep: nullableString,
  tipo_construcao: z.enum(['Madeira', 'Alvenaria', 'Misto']),
  uso_imovel: z.enum(['Residencial', 'Comercial', 'Misto']),
  status_imovel: z.enum(['Sadio', 'Interditado', 'Destruido']),
  data_interdicao: nullableString,
  foto_fachada_url: nullableString,
  foto_detalhe_url: nullableString,
}).strip();
const nucleoFamiliar = z.object({
  id,
  nome_nucleo: z.string(),
  id_casa: id,
  id_cadastrador: id,
  id_chefe_familia: id.nullable(),
  observacao: nullableString,
  tempo_residencia_domicilio: z.number().int().nullable(),
  tempo_residencia_area: z.number().int().nullable(),
  tempo_residencia_municipio: z.number().int().nullable(),
  renda_familiar_total: z.number().nonnegative().nullable(),
}).strip();
const individuo = z.object({
  id,
  id_nucleo_familiar: id,
  nome_completo: z.string(),
  apelido: nullableString,
  nome_social: nullableString,
  data_nascimento: z.string(),
  genero,
  cor_raca: corRaca.nullable(),
  uf: z.string().regex(/^[A-Za-z]{2}$/).nullable(),
  estado_civil: estadoCivil.nullable(),
  profissao: nullableString,
  nome_mae: nullableString,
  nome_pai: nullableString,
  grau_parentesco: nullableString,
  escolaridade: nullableString,
  situacao_ocupacional: nullableString,
  cpf: nullableString,
  doc_estrangeiro: nullableString,
  rg: nullableString,
  nis: z.string().regex(/^\d{11}$/).nullable(),
  telefone: nullableString,
  email: nullableString,
  status_vital: statusVital,
  data_obito: nullableString,
  semanas_gestacao: z.number().int().nonnegative().nullable(),
  foto_url: nullableString,
}).strip();
const vulnerabilidade = z.object({ id, tipo_vulnerabilidade: z.string() }).strip();
const pet = z.object({
  id,
  id_nucleo_familiar: id,
  tipo: nullableString,
  porte: nullableString,
  imagem: nullableString,
  quantidade: z.number().int().nonnegative().nullable(),
}).strip();

const createCadastrador = cadastrador.omit({ id: true });
const createSetor = setor.omit({ id: true, codigo_setor: true }).partial({ grau_risco: true });
const createCasa = casa.omit({ id: true }).partial({
  logradouro: true, numero: true, bairro: true, observacao: true, cep: true,
  status_imovel: true, data_interdicao: true, foto_fachada_url: true, foto_detalhe_url: true,
});
const createNucleoFamiliar = nucleoFamiliar.omit({ id: true }).partial({
  id_chefe_familia: true, observacao: true, tempo_residencia_domicilio: true,
  tempo_residencia_area: true, tempo_residencia_municipio: true, renda_familiar_total: true,
});
const createIndividuo = individuo.omit({ id: true }).partial({
  apelido: true, nome_social: true, cor_raca: true, uf: true, estado_civil: true, profissao: true, nome_mae: true, nome_pai: true,
  grau_parentesco: true, escolaridade: true, situacao_ocupacional: true, cpf: true, doc_estrangeiro: true, rg: true,
  nis: true, telefone: true, email: true, status_vital: true, data_obito: true, semanas_gestacao: true, foto_url: true,
});
const createVulnerabilidade = vulnerabilidade.omit({ id: true });
const createPet = pet.omit({ id: true }).partial({ tipo: true, porte: true, imagem: true, quantidade: true });
const createCadastroCompleto = z.object({
  casa: createCasa,
  nucleo_familiar: createNucleoFamiliar.omit({ id_casa: true, id_chefe_familia: true }),
  individuos: z.array(createIndividuo.omit({ id_nucleo_familiar: true })).min(1),
  responsavel_indice: z.number().int().nonnegative(),
  pets: z.array(createPet.omit({ id_nucleo_familiar: true })).optional(),
  vulnerabilidades_por_individuo: z.record(z.array(id)).optional(),
}).strip();

export const payloadSchemas = {
  createCadastrador,
  updateCadastrador: createCadastrador.partial(),
  createSetor,
  updateSetor: createSetor.partial(),
  createCasa,
  updateCasa: createCasa.partial(),
  createNucleoFamiliar,
  updateNucleoFamiliar: createNucleoFamiliar.omit({ id_cadastrador: true }).partial(),
  createIndividuo,
  updateIndividuo: createIndividuo.partial(),
  createVulnerabilidade,
  updateVulnerabilidade: createVulnerabilidade.partial(),
  createPet,
  updatePet: createPet.partial(),
  createCadastroCompleto,
};

export const openApiSchemas = {
  Cadastrador: openApi(cadastrador), CreateCadastrador: openApi(createCadastrador), UpdateCadastrador: openApi(createCadastrador.partial()),
  Setor: openApi(setor), CreateSetor: openApi(createSetor), UpdateSetor: openApi(createSetor.partial()),
  Casa: openApi(casa), CreateCasa: openApi(createCasa), UpdateCasa: openApi(createCasa.partial()),
  NucleoFamiliar: openApi(nucleoFamiliar), CreateNucleoFamiliar: openApi(createNucleoFamiliar), UpdateNucleoFamiliar: openApi(createNucleoFamiliar.omit({ id_cadastrador: true }).partial()),
  Individuo: openApi(individuo), CreateIndividuo: openApi(createIndividuo), UpdateIndividuo: openApi(createIndividuo.partial()),
  Vulnerabilidade: openApi(vulnerabilidade), CreateVulnerabilidade: openApi(createVulnerabilidade), UpdateVulnerabilidade: openApi(createVulnerabilidade.partial()),
  Pet: openApi(pet), CreatePet: openApi(createPet), UpdatePet: openApi(createPet.partial()),
  CreateCadastroCompleto: openApi(createCadastroCompleto),
};
