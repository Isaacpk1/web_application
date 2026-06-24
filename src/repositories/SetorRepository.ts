import { supabase } from '../database/supabaseClient';
import { throwDatabaseError } from '../helpers/databaseErrors';
import { CreateSetorDTO } from '../models/dto/CreateSetorDTO';
import { UpdateSetorDTO } from '../models/dto/UpdateSetorDTO';
import { Setor } from '../models/domain/Setor';

interface SetorRow {
  id: number;
  codigo_setor: string;
  denominacao: string | null;
}

interface SetorTipoRiscoRow {
  id_setor: number;
  id_tipo_risco: number;
  id_grau_risco: number;
}

interface TipoRiscoRow {
  id: number;
  nome: string;
}

interface GrauRiscoRow {
  id: number;
  ordem_exibicao: number;
}

export class SetorRepository {
  async findAll(): Promise<Setor[]> {
    const db = supabase as any;
    const { data, error } = await db
      .from('setor')
      .select('id,codigo_setor,denominacao')
      .eq('ativo', true)
      .order('id');
    if (error) throwDatabaseError(error);
    return this.enrichSetores((data ?? []) as SetorRow[]);
  }

  async findById(id: number): Promise<Setor | null> {
    const db = supabase as any;
    const { data, error } = await db
      .from('setor')
      .select('id,codigo_setor,denominacao')
      .eq('id', id)
      .eq('ativo', true)
      .maybeSingle();
    if (error) throwDatabaseError(error);
    if (!data) return null;
    return (await this.enrichSetores([data as SetorRow]))[0] ?? null;
  }

  async create(payload: CreateSetorDTO): Promise<Setor> {
    const db = supabase as any;
    const codigo = payload.nome_regiao.trim().toUpperCase();
    const { data: setor, error } = await db
      .from('setor')
      .insert({
        codigo_setor: codigo,
        denominacao: payload.nome_regiao.trim(),
        numero_moradias: 0,
      })
      .select('*')
      .single();
    if (error) throwDatabaseError(error);
    await this.upsertRisco(setor.id, payload.tipo_risco, payload.grau_risco ?? 'Baixo');
    const criado = await this.findById(setor.id);
    if (!criado) throw new Error('Setor criado nao pode ser consultado');
    return criado;
  }

  async update(id: number, payload: UpdateSetorDTO): Promise<Setor> {
    const db = supabase as any;
    const { error } = await db
      .from('setor')
      .update({
        ...(payload.nome_regiao !== undefined ? { denominacao: payload.nome_regiao.trim() } : {}),
      })
      .eq('id', id)
      .select('id');
    if (error) throwDatabaseError(error);
    if (payload.tipo_risco !== undefined || payload.grau_risco !== undefined) {
      const atual = await this.findById(id);
      if (!atual) throw new Error('Setor atualizado nao pode ser consultado');
      await this.upsertRisco(id, payload.tipo_risco ?? atual.tipo_risco, payload.grau_risco ?? atual.grau_risco ?? 'Baixo');
    }
    const atualizado = await this.findById(id);
    if (!atualizado) throw new Error('Setor atualizado nao pode ser consultado');
    return atualizado;
  }

  async delete(id: number): Promise<void> {
    const { error } = await (supabase as any).from('setor').update({ ativo: false }).eq('id', id);
    if (error) throwDatabaseError(error);
  }

  private async enrichSetores(setores: SetorRow[]): Promise<Setor[]> {
    if (setores.length === 0) return [];

    const db = supabase as any;
    const setorIds = setores.map((setor) => setor.id);
    const { data: vinculos, error: vinculosError } = await db
      .from('setor_tipo_risco')
      .select('id_setor,id_tipo_risco,id_grau_risco')
      .in('id_setor', setorIds)
      .eq('ativo', true);
    if (vinculosError) throwDatabaseError(vinculosError);

    const riscoVinculos = (vinculos ?? []) as SetorTipoRiscoRow[];
    const tipoIds = [...new Set(riscoVinculos.map((vinculo) => vinculo.id_tipo_risco))];
    const grauIds = [...new Set(riscoVinculos.map((vinculo) => vinculo.id_grau_risco))];
    const [tiposResult, grausResult] = await Promise.all([
      tipoIds.length > 0 ? db.from('tipo_risco').select('id,nome').in('id', tipoIds).eq('ativo', true) : { data: [], error: null },
      grauIds.length > 0 ? db.from('grau_risco').select('id,ordem_exibicao').in('id', grauIds).eq('ativo', true) : { data: [], error: null },
    ]);
    if (tiposResult.error) throwDatabaseError(tiposResult.error);
    if (grausResult.error) throwDatabaseError(grausResult.error);

    const tipos = new Map((tiposResult.data as TipoRiscoRow[]).map((tipo) => [tipo.id, tipo.nome]));
    const graus = new Map((grausResult.data as GrauRiscoRow[]).map((grau) => [grau.id, grau.ordem_exibicao]));

    return setores.map((setor) => {
      const riscos = riscoVinculos.filter((vinculo) => vinculo.id_setor === setor.id);
      const tiposRisco = [...new Set(riscos.map((vinculo) => tipos.get(vinculo.id_tipo_risco)).filter(Boolean))];
      const maiorOrdem = Math.max(0, ...riscos.map((vinculo) => graus.get(vinculo.id_grau_risco) ?? 0));
      return {
        id: setor.id,
        nome_regiao: setor.denominacao ?? setor.codigo_setor,
        tipo_risco: tiposRisco.join(', '),
        grau_risco: this.grauRiscoPorOrdem(maiorOrdem),
      };
    });
  }

  private grauRiscoPorOrdem(ordem: number): Setor['grau_risco'] {
    if (ordem >= 4) return 'Muito Alto';
    if (ordem === 3) return 'Alto';
    if (ordem === 2) return 'M\u00e9dio';
    return 'Baixo';
  }

  private async upsertRisco(setorId: number, tipoRisco: string, grauRisco: string): Promise<void> {
    const db = supabase as any;
    const { data: tipo, error: tipoError } = await db.from('tipo_risco').upsert({ nome: tipoRisco, ativo: true }, { onConflict: 'nome' }).select('id').single();
    if (tipoError) throwDatabaseError(tipoError);
    const codigo = ({ Baixo: 'R1', 'Médio': 'R2', Alto: 'R3', 'Muito Alto': 'R4' } as Record<string, string>)[grauRisco] ?? 'R1';
    const { data: grau, error: grauError } = await db.from('grau_risco').upsert({ codigo, nome: grauRisco, ativo: true }, { onConflict: 'codigo' }).select('id').single();
    if (grauError) throwDatabaseError(grauError);
    const { error } = await db.from('setor_tipo_risco').upsert({ id_setor: setorId, id_tipo_risco: tipo.id, id_grau_risco: grau.id, ativo: true }, { onConflict: 'id_setor,id_tipo_risco' });
    if (error) throwDatabaseError(error);
  }
}
