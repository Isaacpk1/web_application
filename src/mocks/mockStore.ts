/**
 * Store de dados em memória para o MODO MOCK (desenvolvimento/testes).
 *
 * @remarks
 * Emula o contrato da API real (Familia, Imovel, Vulnerabilidade, busca
 * paginada) e enriquece os registros com os campos exibidos nos mockups do
 * Figma — nível de risco, última visita e coordenadas para o mapa de risco.
 * Ativado pela variável de ambiente `MOCK_AUTH=true`.
 */

export type NivelRisco = 'MUITO_ALTO' | 'ALTO' | 'MEDIO' | 'BAIXO';

export interface MockFamiliaRecord {
  id: string;
  /** Nome/sobrenome da família (coluna "Família" da tabela do gestor). */
  nome_familia: string;
  /** Responsável pelo núcleo (coluna "Responsável"). */
  nome_responsavel: string;
  cpf_responsavel: string;
  rg_responsavel: string | null;
  nis_responsavel: string | null;
  data_nascimento_responsavel: string | null;
  genero_responsavel: string | null;
  escolaridade_responsavel: string | null;
  ocupacao_responsavel: string | null;
  email_responsavel: string | null;
  telefone: string;
  renda_familiar: number;
  qtd_membros: number;
  cadastro_completo: boolean;
  nivel_risco: NivelRisco;
  prioridade_vulnerabilidade: 'ALTA' | 'BAIXA';
  bairro: string | null;
  /** Data da última visita (ISO yyyy-mm-dd) — exibida na tabela do gestor. */
  ultima_visita: string | null;
  latitude: number;
  longitude: number;
  imovel: MockImovel | null;
  vulnerabilidades: MockVulnerabilidade | null;
  created_at: string;
  updated_at: string;
}

interface MockImovel {
  id: string;
  familia_id: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  cep: string;
  latitude: number;
  longitude: number;
  tipo_construcao: string | null;
  tempo_construcao: number | null;
  uso_imovel: string | null;
}

interface MockVulnerabilidade {
  id: string;
  nucleo_familiar_id: string;
  doenca_idoso: boolean;
  doenca_crianca: boolean;
  doenca_cronica: boolean;
  gestante: boolean;
  lactante: boolean;
  pcd: boolean;
  deficiencia: boolean;
  restrito: boolean;
}

const now = () => new Date().toISOString();

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface SeedInput {
  id: string; familia: string; nome: string; cpf: string; nascimento: string;
  telefone: string; email: string | null; escolaridade: string; ocupacao: string;
  genero: string; renda: number; membros: number; completo: boolean;
  risco: NivelRisco; bairro: string; logradouro: string; numero: string;
  lat: number; lng: number; visita: string | null;
  vuln: Partial<MockVulnerabilidade> | null;
}

const riscoToPrioridade = (r: NivelRisco): 'ALTA' | 'BAIXA' =>
  r === 'MUITO_ALTO' || r === 'ALTO' ? 'ALTA' : 'BAIXA';

function buildFamilia(i: SeedInput): MockFamiliaRecord {
  return {
    id: i.id,
    nome_familia: i.familia,
    nome_responsavel: i.nome,
    cpf_responsavel: i.cpf,
    rg_responsavel: null,
    nis_responsavel: null,
    data_nascimento_responsavel: i.nascimento,
    genero_responsavel: i.genero,
    escolaridade_responsavel: i.escolaridade,
    ocupacao_responsavel: i.ocupacao,
    email_responsavel: i.email,
    telefone: i.telefone,
    renda_familiar: i.renda,
    qtd_membros: i.membros,
    cadastro_completo: i.completo,
    nivel_risco: i.risco,
    prioridade_vulnerabilidade: riscoToPrioridade(i.risco),
    bairro: i.bairro,
    ultima_visita: i.visita,
    latitude: i.lat,
    longitude: i.lng,
    imovel: {
      id: uuid(), familia_id: i.id,
      logradouro: i.logradouro, numero: i.numero, complemento: null,
      bairro: i.bairro, cidade: 'Santo André', cep: '09000-000',
      latitude: i.lat, longitude: i.lng,
      tipo_construcao: 'Alvenaria', tempo_construcao: 10, uso_imovel: 'Próprio',
    },
    vulnerabilidades: i.vuln
      ? {
          id: uuid(), nucleo_familiar_id: i.id,
          doenca_idoso: !!i.vuln.doenca_idoso, doenca_crianca: !!i.vuln.doenca_crianca,
          doenca_cronica: !!i.vuln.doenca_cronica, gestante: !!i.vuln.gestante,
          lactante: !!i.vuln.lactante, pcd: !!i.vuln.pcd,
          deficiencia: !!i.vuln.deficiencia, restrito: !!i.vuln.restrito,
        }
      : null,
    created_at: now(),
    updated_at: now(),
  };
}

/** Dados-semente: 8 famílias variadas em Santo André (coordenadas reais
 *  aproximadas) para demonstrar tabela, filtros, KPIs, paginação e mapa. */
const seed: SeedInput[] = [
  { id: 'a1b2c3d4-0001-4001-8001-000000000001', familia: 'Silva Santos', nome: 'Maria Souza', cpf: '529.982.247-25', nascimento: '1985-03-15', telefone: '(11) 98765-4321', email: 'maria.souza@example.com', escolaridade: 'Médio Completo', ocupacao: 'Diarista', genero: 'Feminino', renda: 1800, membros: 4, completo: true, risco: 'MUITO_ALTO', bairro: 'Centro', logradouro: 'Rua das Flores', numero: '42', lat: -23.6639, lng: -46.5383, visita: '2025-05-12', vuln: { doenca_crianca: true } },
  { id: 'a1b2c3d4-0002-4002-8002-000000000002', familia: 'Oliveira Lima', nome: 'João Pedro', cpf: '168.995.350-09', nascimento: '1972-11-22', telefone: '(11) 91234-5678', email: null, escolaridade: 'Fundamental Incompleto', ocupacao: 'Pedreiro', genero: 'Masculino', renda: 900, membros: 5, completo: false, risco: 'ALTO', bairro: 'Jardins', logradouro: 'Travessa dos Ipês', numero: '7', lat: -23.6712, lng: -46.5301, visita: '2025-05-05', vuln: { doenca_idoso: true, pcd: true, doenca_cronica: true } },
  { id: 'a1b2c3d4-0003-4003-8003-000000000003', familia: 'Costa Ferreira', nome: 'Ana Lima', cpf: '111.444.777-35', nascimento: '1990-07-04', telefone: '(11) 95554-4433', email: 'ana.ferreira@example.com', escolaridade: 'Superior Incompleto', ocupacao: 'Auxiliar administrativo', genero: 'Feminino', renda: 2400, membros: 3, completo: true, risco: 'MEDIO', bairro: 'Norte', logradouro: 'Avenida Industrial', numero: '300', lat: -23.6505, lng: -46.5250, visita: '2025-04-20', vuln: { gestante: true } },
  { id: 'a1b2c3d4-0004-4004-8004-000000000004', familia: 'Pereira Alves', nome: 'Carlos Reis', cpf: '390.533.447-05', nascimento: '1965-01-30', telefone: '(11) 93332-2211', email: null, escolaridade: 'Fundamental Completo', ocupacao: 'Aposentado', genero: 'Masculino', renda: 1200, membros: 2, completo: true, risco: 'MUITO_ALTO', bairro: 'Sul', logradouro: 'Rua Esperança', numero: '88', lat: -23.6820, lng: -46.5402, visita: '2025-05-10', vuln: { doenca_idoso: true, doenca_cronica: true, deficiencia: true } },
  { id: 'a1b2c3d4-0005-4005-8005-000000000005', familia: 'Rodrigues Melo', nome: 'Paula Costa', cpf: '298.967.690-07', nascimento: '2001-09-18', telefone: '(11) 94445-5566', email: 'paula.melo@example.com', escolaridade: 'Médio Incompleto', ocupacao: 'Desempregada', genero: 'Feminino', renda: 650, membros: 6, completo: false, risco: 'ALTO', bairro: 'Leste', logradouro: 'Rua dos Pinheiros', numero: '12', lat: -23.6588, lng: -46.5120, visita: '2025-05-02', vuln: { doenca_crianca: true, gestante: true, lactante: true } },
  { id: 'a1b2c3d4-0006-4006-8006-000000000006', familia: 'Almeida Nunes', nome: 'Roberto Almeida', cpf: '457.776.558-08', nascimento: '1978-05-12', telefone: '(11) 96667-8899', email: 'roberto.nunes@example.com', escolaridade: 'Superior Completo', ocupacao: 'Motorista', genero: 'Masculino', renda: 3200, membros: 3, completo: true, risco: 'BAIXO', bairro: 'Centro', logradouro: 'Rua Coronel Oliveira Lima', numero: '155', lat: -23.6650, lng: -46.5290, visita: '2025-04-28', vuln: null },
  { id: 'a1b2c3d4-0007-4007-8007-000000000007', familia: 'Gomes Barros', nome: 'Luciana Gomes', cpf: '153.509.460-56', nascimento: '1993-12-01', telefone: '(11) 97778-1122', email: 'luciana.barros@example.com', escolaridade: 'Médio Completo', ocupacao: 'Cuidadora', genero: 'Feminino', renda: 1100, membros: 4, completo: false, risco: 'ALTO', bairro: 'Jardins', logradouro: 'Rua Amazonas', numero: '64', lat: -23.6740, lng: -46.5345, visita: '2025-05-15', vuln: { doenca_crianca: true, lactante: true } },
  { id: 'a1b2c3d4-0008-4008-8008-000000000008', familia: 'Martins Rocha', nome: 'Eduardo Martins', cpf: '247.594.620-09', nascimento: '1969-08-25', telefone: '(11) 98889-3344', email: null, escolaridade: 'Fundamental Completo', ocupacao: 'Porteiro', genero: 'Masculino', renda: 1600, membros: 5, completo: true, risco: 'MEDIO', bairro: 'Norte', logradouro: 'Rua Bahia', numero: '210', lat: -23.6470, lng: -46.5210, visita: '2025-05-18', vuln: { doenca_idoso: true } },
];

/** Armazenamento mutável em memória (reinicia a cada restart do servidor). */
const families: MockFamiliaRecord[] = seed.map(buildFamilia);

const onlyDigits = (s: string) => String(s || '').replace(/\D/g, '');

function toResultado(f: MockFamiliaRecord) {
  return {
    id: f.id,
    familia_id: f.id,
    nome: f.nome_responsavel,
    nome_familia: f.nome_familia,
    nome_responsavel: f.nome_responsavel,
    cpf: f.cpf_responsavel,
    bairro: f.bairro,
    nivel_risco: f.nivel_risco,
    ultima_visita: f.ultima_visita,
    renda_familiar: f.renda_familiar,
    qtd_membros: f.qtd_membros,
    cadastro_completo: f.cadastro_completo,
    prioridade_vulnerabilidade: f.prioridade_vulnerabilidade,
    latitude: f.latitude,
    longitude: f.longitude,
    vulnerabilidades: f.vulnerabilidades,
  };
}

export const mockStore = {
  /** Aplica filtros (sem paginar) — base para busca e mapa. */
  filter(query: { nome?: string; cpf?: string; bairro?: string; nivel_risco?: string }) {
    let list = [...families];
    if (query.nome) {
      const n = query.nome.toLowerCase();
      list = list.filter(
        (f) => f.nome_responsavel.toLowerCase().includes(n) || f.nome_familia.toLowerCase().includes(n),
      );
    }
    if (query.cpf) {
      const c = onlyDigits(query.cpf);
      list = list.filter((f) => onlyDigits(f.cpf_responsavel).includes(c));
    }
    if (query.bairro) {
      const b = query.bairro.toLowerCase();
      list = list.filter((f) => (f.bairro || '').toLowerCase().includes(b));
    }
    if (query.nivel_risco) {
      list = list.filter((f) => f.nivel_risco === query.nivel_risco);
    }
    return list;
  },

  search(query: {
    nome?: string; cpf?: string; bairro?: string; nivel_risco?: string;
    page?: number; limit?: number;
  }) {
    const list = this.filter(query);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 5);
    const total = list.length;
    const start = (page - 1) * limit;
    const resultados = list.slice(start, start + limit).map(toResultado);

    const kpis = {
      total_familias: families.length,
      em_risco_extremo: families.filter(
        (f) => f.nivel_risco === 'MUITO_ALTO' || f.nivel_risco === 'ALTO',
      ).length,
      cadastros_incompletos: families.filter((f) => !f.cadastro_completo).length,
    };

    return { total, page, limit, kpis, resultados };
  },

  /** Todos os pontos com coordenadas (para o mapa de risco). */
  geo(query: { nome?: string; bairro?: string; nivel_risco?: string }) {
    return this.filter(query).map(toResultado);
  },

  getFamilia(id: string): MockFamiliaRecord | undefined {
    return families.find((f) => f.id === id);
  },

  getImovelByFamilia(familiaId: string) {
    const f = this.getFamilia(familiaId);
    return f?.imovel ? [f.imovel] : [];
  },

  getVulnByFamilia(familiaId: string) {
    const f = this.getFamilia(familiaId);
    return f?.vulnerabilidades ? [f.vulnerabilidades] : [];
  },

  // Mock de compatibilidade com o formulario legado; nao e regra de producao.
  // eslint-disable-next-line complexity
  createFamilia(payload: Record<string, unknown>): MockFamiliaRecord {
    const renda = Number(payload.renda_familiar ?? 0);
    const record = buildFamilia({
      id: uuid(),
      familia: String(payload.nome_responsavel ?? 'Nova Família').split(' ').slice(-1)[0] || 'Família',
      nome: String(payload.nome_responsavel ?? 'Sem nome'),
      cpf: String(payload.cpf_responsavel ?? ''),
      nascimento: String(payload.data_nascimento_responsavel ?? '') || '1990-01-01',
      telefone: String(payload.telefone ?? ''),
      email: (payload.email_responsavel as string) ?? null,
      escolaridade: String(payload.escolaridade_responsavel ?? ''),
      ocupacao: String(payload.ocupacao_responsavel ?? ''),
      genero: String(payload.genero_responsavel ?? ''),
      renda, membros: Number(payload.qtd_membros ?? 1),
      completo: false,
      risco: renda < 1000 ? 'ALTO' : 'BAIXO',
      bairro: '', logradouro: '', numero: '', lat: 0, lng: 0,
      visita: null, vuln: null,
    });
    record.imovel = null;
    record.bairro = null;
    record.rg_responsavel = (payload.rg_responsavel as string) ?? null;
    record.nis_responsavel = (payload.nis_responsavel as string) ?? null;
    families.unshift(record);
    return record;
  },

  updateFamilia(id: string, payload: Record<string, unknown>): MockFamiliaRecord | undefined {
    const f = this.getFamilia(id);
    if (!f) return undefined;
    const fields: Array<keyof MockFamiliaRecord> = [
      'nome_responsavel', 'cpf_responsavel', 'rg_responsavel', 'nis_responsavel',
      'data_nascimento_responsavel', 'genero_responsavel', 'escolaridade_responsavel',
      'ocupacao_responsavel', 'email_responsavel', 'telefone', 'renda_familiar', 'qtd_membros',
    ];
    for (const field of fields) {
      if (payload[field] !== undefined) {
        // @ts-expect-error atribuição dinâmica controlada pela lista acima
        f[field] = payload[field];
      }
    }
    f.updated_at = now();
    return f;
  },

  // eslint-disable-next-line complexity
  upsertImovel(familiaId: string, payload: Record<string, unknown>) {
    const f = this.getFamilia(familiaId);
    if (!f) return null;
    const imovel: MockImovel = {
      id: f.imovel?.id ?? uuid(),
      familia_id: familiaId,
      logradouro: String(payload.logradouro ?? ''),
      numero: String(payload.numero ?? 'S/N'),
      complemento: (payload.complemento as string) ?? null,
      bairro: String(payload.bairro ?? '—'),
      cidade: String(payload.cidade ?? '—'),
      cep: String(payload.cep ?? '00000-000'),
      latitude: Number(payload.latitude ?? 0),
      longitude: Number(payload.longitude ?? 0),
      tipo_construcao: (payload.tipo_construcao as string) ?? null,
      tempo_construcao: payload.tempo_construcao != null ? Number(payload.tempo_construcao) : null,
      uso_imovel: (payload.uso_imovel as string) ?? null,
    };
    f.imovel = imovel;
    f.bairro = imovel.bairro;
    if (imovel.latitude && imovel.longitude) {
      f.latitude = imovel.latitude;
      f.longitude = imovel.longitude;
    }
    return imovel;
  },

  upsertVulnerabilidade(familiaId: string, payload: Record<string, unknown>) {
    const f = this.getFamilia(familiaId);
    if (!f) return null;
    const vuln: MockVulnerabilidade = {
      id: f.vulnerabilidades?.id ?? uuid(),
      nucleo_familiar_id: familiaId,
      doenca_idoso: !!payload.doenca_idoso,
      doenca_crianca: !!payload.doenca_crianca,
      doenca_cronica: !!payload.doenca_cronica,
      gestante: !!payload.gestante,
      lactante: !!payload.lactante,
      pcd: !!payload.pcd,
      deficiencia: !!payload.deficiencia,
      restrito: !!payload.restrito,
    };
    f.vulnerabilidades = vuln;
    return vuln;
  },
};
