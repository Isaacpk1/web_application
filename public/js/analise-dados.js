/* analise-dados.js — listagem de famílias com filtros e paginação
   Consome GET /api/v1/cadastros/busca (RF005 - busca multi-critério) */

if (!Auth.guard()) {
  // guard() já redirecionou para /login
} else {
  initAnaliseDados();
}

function initAnaliseDados() {
  const state = { page: 1, limit: 5, nome: '', bairro: '', cpf: '' };

  const tbody = document.getElementById('tabelaCorpo');
  const info = document.getElementById('infoRegistros');
  const paginacao = document.getElementById('paginacao');

  const RISCO_LABEL = {
    ALTA: 'muito_alto',
    MEDIA: 'medio',
    BAIXA: 'baixo',
  };

  function moeda(valor) {
    if (valor == null || isNaN(valor)) return '—';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
    );
  }

  function badge(prioridade) {
    const key = (prioridade || 'BAIXA').toUpperCase();
    const cls = RISCO_LABEL[key] || 'baixo';
    return `<span class="badge badge--${cls}">${escapeHtml(key)}</span>`;
  }

  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Carregando cadastros...</td></tr>';
    const params = new URLSearchParams({ page: state.page, limit: state.limit });
    if (state.nome) params.set('nome', state.nome);
    if (state.bairro) params.set('bairro', state.bairro);
    if (state.cpf) params.set('cpf', state.cpf);

    try {
      const data = await apiFetch(`/cadastros/busca?${params.toString()}`);
      render(data);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Erro ao carregar: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function render(data) {
    const resultados = (data && data.resultados) || [];
    const total = (data && data.total) || 0;
    const stats = (data && data.stats) || {};
    const page = (data && data.page) || state.page;
    const limit = (data && data.limit) || state.limit;

    // KPIs
    document.getElementById('kpiTotal').textContent = total.toLocaleString('pt-BR');
    document.getElementById('kpiAlta').textContent = Number(
      stats.prioridade_alta ?? resultados.filter((r) => (r.prioridade_vulnerabilidade || '').toUpperCase() === 'ALTA').length,
    ).toLocaleString('pt-BR');
    document.getElementById('kpiCompletos').textContent = Number(
      stats.cadastros_completos ?? resultados.filter((r) => r.cadastro_completo).length,
    ).toLocaleString('pt-BR');

    if (resultados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma família encontrada.</td></tr>';
      info.textContent = 'Nenhum registro';
      paginacao.innerHTML = '';
      return;
    }

    tbody.innerHTML = resultados
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.nome_familia)}</td>
          <td>${escapeHtml(r.nome_responsavel || '—')}</td>
          <td>${escapeHtml(r.bairro || '—')}</td>
          <td>${badge(r.prioridade_vulnerabilidade)}</td>
          <td>${r.qtd_membros ?? '—'}</td>
          <td>${moeda(r.renda_familiar)}</td>
          <td>
            <div class="cell-actions">
              <a class="action-link" href="/familias?id=${encodeURIComponent(r.id)}">Ver</a>
              <a class="action-link action-link--edit" href="/familias?id=${encodeURIComponent(r.id)}&edit=1">Editar</a>
            </div>
          </td>
        </tr>`,
      )
      .join('');

    const inicio = (page - 1) * limit + 1;
    const fim = Math.min(page * limit, total);
    info.textContent = `Mostrando ${inicio}–${fim} de ${total.toLocaleString('pt-BR')} registros`;

    renderPaginacao(total, page, limit);
  }

  function renderPaginacao(total, page, limit) {
    const totalPaginas = Math.max(1, Math.ceil(total / limit));
    let html = `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">‹</button>`;
    for (let p = 1; p <= totalPaginas; p++) {
      if (p === 1 || p === totalPaginas || Math.abs(p - page) <= 1) {
        html += `<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (Math.abs(p - page) === 2) {
        html += `<button disabled>…</button>`;
      }
    }
    html += `<button ${page >= totalPaginas ? 'disabled' : ''} data-page="${page + 1}">›</button>`;
    paginacao.innerHTML = html;

    paginacao.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p >= 1 && p <= totalPaginas && p !== state.page) {
          state.page = p;
          carregar();
        }
      });
    });
  }

  document.getElementById('btnAplicar').addEventListener('click', () => {
    state.nome = document.getElementById('filtroNome').value.trim();
    state.bairro = document.getElementById('filtroBairro').value.trim();
    state.cpf = document.getElementById('filtroCpf').value.trim();
    state.page = 1;
    carregar();
  });

  document.getElementById('btnLimpar').addEventListener('click', () => {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroBairro').value = '';
    document.getElementById('filtroCpf').value = '';
    state.nome = state.bairro = state.cpf = '';
    state.page = 1;
    carregar();
  });

  // Enter nos filtros aplica a busca
  ['filtroNome', 'filtroBairro', 'filtroCpf'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btnAplicar').click();
    });
  });

  carregar();
}
