import { BadRequestError, NotFoundError } from '../helpers/errors';
import { sanitizeObject } from '../helpers/sanitizers';
import { assertCep, assertNumber, parsePositiveIntegerId } from '../helpers/validators';
import { CreateCasaDTO } from '../models/dto/CreateCasaDTO';
import { UpdateCasaDTO } from '../models/dto/UpdateCasaDTO';
import { Casa, StatusImovel, TipoConstrucao, UsoImovel } from '../models/domain/Casa';
import { CasaRepository } from '../repositories/CasaRepository';
import { NucleoFamiliarConsultaRepository } from '../repositories/NucleoFamiliarConsultaRepository';

const tiposConstrucao: TipoConstrucao[] = ['Madeira', 'Alvenaria', 'Misto'];
const usosImovel: UsoImovel[] = ['Residencial', 'Comercial', 'Misto'];
const statusImovel: StatusImovel[] = ['Sadio', 'Interditado', 'Destruido'];

export class CasaService {
  constructor(
    private readonly casaRepository = new CasaRepository(),
    private readonly consultaRepository = new NucleoFamiliarConsultaRepository(),
  ) {}

  async findAll(): Promise<Casa[]> {
    return this.casaRepository.findAll();
  }

  async findById(id: string): Promise<Casa> {
    const casa = await this.casaRepository.findById(parsePositiveIntegerId(id));
    if (!casa) throw new NotFoundError('Casa nao encontrado');
    return casa;
  }

  async findByNucleoFamiliarId(nucleoFamiliarId: string): Promise<Casa[]> {
    const casaId = await this.consultaRepository.findCasaIdByNucleoFamiliarId(parsePositiveIntegerId(nucleoFamiliarId, 'id_nucleo_familiar'));
    if (!casaId) return [];
    const casa = await this.casaRepository.findById(casaId);
    return casa ? [casa] : [];
  }

  async create(payload: CreateCasaDTO): Promise<Casa> {
    const sanitizedPayload = this.normalizeEndereco(sanitizeObject(payload));
    this.validateCreate(sanitizedPayload);
    return this.casaRepository.create(sanitizedPayload);
  }

  async update(id: string, payload: UpdateCasaDTO): Promise<Casa> {
    const parsedId = parsePositiveIntegerId(id);
    const current = await this.findById(id);
    const sanitizedPayload = this.normalizeEndereco(sanitizeObject(payload));
    this.validateUpdate(sanitizedPayload);
    this.validateInterdicao({ ...current, ...sanitizedPayload });
    return this.casaRepository.update(parsedId, sanitizedPayload);
  }

  private normalizeEndereco<T extends CreateCasaDTO | UpdateCasaDTO>(payload: T): T {
    return {
      ...payload,
      ...(payload.logradouro === '' ? { logradouro: null } : {}),
      ...(payload.numero === '' ? { numero: null } : {}),
      ...(payload.bairro === '' ? { bairro: null } : {}),
      ...(payload.foto_fachada_url === '' ? { foto_fachada_url: null } : {}),
      ...(payload.foto_detalhe_url === '' ? { foto_detalhe_url: null } : {}),
    };
  }

  async delete(id: string): Promise<void> {
    const parsedId = parsePositiveIntegerId(id);
    await this.findById(id);
    await this.casaRepository.delete(parsedId);
  }

  private validateCreate(payload: CreateCasaDTO): void {
    this.validateIdSetor(payload.id_setor);
    assertNumber(payload.coordenada_lat, 'coordenada_lat');
    assertNumber(payload.coordenada_long, 'coordenada_long');
    this.validateCoordinates(payload.coordenada_lat, payload.coordenada_long);
    if (payload.cep !== undefined && payload.cep !== null) assertCep(payload.cep);
    this.validateTipoConstrucao(payload.tipo_construcao);
    this.validateUsoImovel(payload.uso_imovel);
    if (payload.status_imovel !== undefined) this.validateStatusImovel(payload.status_imovel);
    this.validateInterdicao(payload);
  }

  private validateUpdate(payload: UpdateCasaDTO): void {
    if (Object.keys(payload).length === 0) throw new BadRequestError('Informe ao menos um campo para atualizar');
    if (payload.id_setor !== undefined) this.validateIdSetor(payload.id_setor);
    if (payload.coordenada_lat !== undefined) assertNumber(payload.coordenada_lat, 'coordenada_lat');
    if (payload.coordenada_long !== undefined) assertNumber(payload.coordenada_long, 'coordenada_long');
    this.validateCoordinates(payload.coordenada_lat, payload.coordenada_long);
    if (payload.cep !== undefined && payload.cep !== null) assertCep(payload.cep);
    if (payload.tipo_construcao !== undefined) this.validateTipoConstrucao(payload.tipo_construcao);
    if (payload.uso_imovel !== undefined) this.validateUsoImovel(payload.uso_imovel);
    if (payload.status_imovel !== undefined) this.validateStatusImovel(payload.status_imovel);
  }

  private validateIdSetor(idSetor: number): void {
    if (!Number.isSafeInteger(idSetor) || idSetor <= 0) throw new BadRequestError('ID invalido: id_setor');
  }

  private validateCoordinates(latitude?: number, longitude?: number): void {
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) throw new BadRequestError('Coordenada_lat deve estar entre -90 e 90');
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) throw new BadRequestError('Coordenada_long deve estar entre -180 e 180');
  }

  private validateTipoConstrucao(value: string): void {
    if (!tiposConstrucao.includes(value as TipoConstrucao)) throw new BadRequestError('Tipo de construcao deve ser: Madeira, Alvenaria ou Misto');
  }

  private validateUsoImovel(value: string): void {
    if (!usosImovel.includes(value as UsoImovel)) throw new BadRequestError('Uso do casa deve ser: Residencial, Comercial ou Misto');
  }

  private validateStatusImovel(value: string): void {
    if (!statusImovel.includes(value as StatusImovel)) throw new BadRequestError('Status do imovel deve ser: Sadio, Interditado ou Destruido');
  }

  private validateInterdicao(payload: Pick<CreateCasaDTO, 'status_imovel' | 'data_interdicao'>): void {
    const status = payload.status_imovel ?? 'Sadio';
    const interditado = status === 'Interditado';
    if (interditado && !payload.data_interdicao) throw new BadRequestError('Data de interdicao e obrigatoria para imovel interditado');
    if (!interditado && payload.data_interdicao) throw new BadRequestError('Data de interdicao so pode ser informada para imovel interditado');
  }
}
