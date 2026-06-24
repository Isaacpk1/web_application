(function () {
  if (!Auth.guard()) return;

  let currentPage = 1;
  let ultimosResultados = [];

  const searchInput  = document.getElementById('search-input');
  const filterRisco  = document.getElementById('filter-risco');
  const filterBairro = document.getElementById('filter-bairro');
  const btnApply     = document.getElementById('btn-apply-filter');
  const btnClear     = document.getElementById('btn-clear-filter');
  const tableWrap    = document.getElementById('table-wrap');
  const tableFooter  = document.getElementById('table-footer');
  const pagInfo      = document.getElementById('pag-info');
  const pagPages     = document.getElementById('pag-pages');
  const subtitle     = document.getElementById('familias-subtitle');

  btnApply.addEventListener('click', () => { currentPage = 1; load(); });

  btnClear.addEventListener('click', () => {
    searchInput.value  = '';
    filterRisco.value  = '';
    filterBairro.value = '';
    currentPage = 1;
    load();
  });

  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; load(); }, 300);
  });

  async function load() {
    tableWrap.innerHTML = '<div class="state-loading">Carregando…</div>';
    tableFooter.style.display = 'none';

    try {
      const params = new URLSearchParams({ page: currentPage, limit: 10 });
      if (searchInput.value.trim())  params.set('nome',        searchInput.value.trim());
      if (filterRisco.value)         params.set('nivel_risco', filterRisco.value);
      if (filterBairro.value.trim()) params.set('bairro',      filterBairro.value.trim());

      const data = await apiFetch(`/cadastros/busca?${params}`);
      const resultados = data.resultados || [];
      ultimosResultados = resultados;

      if (subtitle) {
        subtitle.textContent = `${data.total || 0} família(s) encontrada(s)`;
      }

      renderTable(resultados);
      if (data.total > 0) renderPagination(data);
    } catch (err) {
      tableWrap.innerHTML = `
        <div class="state-empty">
          <span class="state-empty__icon">⚠</span>
          <span class="state-empty__text">${err.message}</span>
        </div>`;
    }
  }

  function renderTable(items) {
    if (!items || items.length === 0) {
      tableWrap.innerHTML = `
        <div class="state-empty">
          <span class="state-empty__icon">🔍</span>
          <span class="state-empty__text">Nenhuma família encontrada.</span>
        </div>`;
      return;
    }

    const rows = items.map((f) => `
      <tr>
        <td><strong>${f.nome_familia || '—'}</strong></td>
        <td>${f.nome_responsavel || '—'}</td>
        <td>${f.bairro || '—'}</td>
        <td>${nivelRiscoBadge(f.nivel_risco)}</td>
        <td>${formatDate(f.data_cadastro || f.ultima_visita)}</td>
        <td class="cell-actions">
          <button class="action-link" data-ver-id="${f.id}">Ver</button>
          <button class="action-link action-link--edit" data-editar-id="${f.id}">Editar</button>
        </td>
      </tr>`).join('');

    tableWrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Família</th>
            <th>Responsável</th>
            <th>Bairro</th>
            <th>Risco</th>
            <th>Última visita</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    tableWrap.querySelectorAll('[data-ver-id]').forEach((btn) => {
      btn.addEventListener('click', () => abrirFamilia(btn.dataset.verId, false));
    });
    tableWrap.querySelectorAll('[data-editar-id]').forEach((btn) => {
      btn.addEventListener('click', () => abrirFamilia(btn.dataset.editarId, true));
    });
  }

  async function abrirFamilia(id, editar) {
    try {
      const [nucleo, casas, individuos, pets, catalogoVulnerabilidades] = await Promise.all([
        apiFetch(`/nucleos-familiares/${id}`),
        apiFetch(`/casas/nucleos-familiares/${id}`),
        apiFetch(`/individuos/nucleos-familiares/${id}`),
        apiFetch(`/pets/nucleos-familiares/${id}`),
        apiFetch('/vulnerabilidades'),
      ]);
      const casa = casas[0];
      const vinculos = await Promise.all(individuos.map((individuo) => apiFetch(`/vulnerabilidades/individuos/${individuo.id}`)));
      renderPainelAdministrativo({ id, nucleo, casa, individuos, pets, catalogoVulnerabilidades, vinculos, editar });
    } catch (err) {
      showToast(err.message || 'Nao foi possivel carregar a familia.', 'error');
    }
  }

  function renderPainelAdministrativo(dados) {
    document.getElementById('familia-painel')?.remove();
    const somenteLeitura = !dados.editar;
    const disabled = somenteLeitura ? 'disabled' : '';
    const casa = dados.casa || {};
    const vulnerabilidades = dados.individuos.map((individuo, indice) => {
      const atuais = new Set((dados.vinculos[indice] || []).map((v) => v.id));
      return `<div class="admin-member" data-individuo-id="${individuo.id}"><h4>${individuo.nome_completo}</h4>
        <label>Nome <input data-ind-campo="nome_completo" value="${individuo.nome_completo || ''}" ${disabled}></label>
        <label>Telefone <input data-ind-campo="telefone" value="${individuo.telefone || ''}" ${disabled}></label>
        <label>E-mail <input data-ind-campo="email" value="${individuo.email || ''}" ${disabled}></label>
        <div class="admin-vulns">${dados.catalogoVulnerabilidades.map((v) => `<label><input type="checkbox" data-vuln-id="${v.id}" ${atuais.has(v.id) ? 'checked' : ''} ${disabled}> ${v.tipo_vulnerabilidade}</label>`).join('')}</div></div>`;
    }).join('');
    const pets = dados.pets.map((pet) => `<div class="admin-pet" data-pet-id="${pet.id}"><input data-pet-campo="tipo" value="${pet.tipo || ''}" placeholder="Tipo" ${disabled}><input data-pet-campo="porte" value="${pet.porte || ''}" placeholder="Porte" ${disabled}><input data-pet-campo="quantidade" type="number" min="1" value="${pet.quantidade || ''}" placeholder="Qtd." ${disabled}>${somenteLeitura ? '' : '<button type="button" class="btn-textlink" data-remover-pet>Remover</button>'}</div>`).join('') || '<p data-sem-pets>Nenhum pet cadastrado.</p>';
    const painel = document.createElement('section');
    painel.id = 'familia-painel';
    painel.className = 'section-card';
    painel.innerHTML = `<div class="content-head"><h2>${somenteLeitura ? 'Detalhes da família' : 'Editar família'}</h2><button class="btn btn--ghost" data-fechar-painel>Fechar</button></div>
      <div class="admin-grid"><label>Núcleo<input data-nucleo="nome_nucleo" value="${dados.nucleo.nome_nucleo || ''}" ${disabled}></label><label>Renda<input data-nucleo="renda_familiar_total" type="number" min="0" value="${dados.nucleo.renda_familiar_total ?? ''}" ${disabled}></label><label>Observação<textarea data-nucleo="observacao" ${disabled}>${dados.nucleo.observacao || ''}</textarea></label><label>Logradouro<input data-casa="logradouro" value="${casa.logradouro || ''}" ${disabled}></label><label>Número<input data-casa="numero" value="${casa.numero || ''}" ${disabled}></label><label>Bairro<input data-casa="bairro" value="${casa.bairro || ''}" ${disabled}></label><label>CEP<input data-casa="cep" value="${casa.cep || ''}" ${disabled}></label></div>
      <h3>Membros e vulnerabilidades</h3>${vulnerabilidades}<h3>Pets</h3><div data-pets-admin>${pets}</div>${somenteLeitura ? '' : '<button type="button" class="btn btn--ghost" data-adicionar-pet>Adicionar pet</button> <button class="btn btn--blue" data-salvar-familia>Salvar alterações</button>'}`;
    document.querySelector('.page-content').prepend(painel);
    painel.querySelector('[data-fechar-painel]').addEventListener('click', () => painel.remove());
    painel.querySelector('[data-salvar-familia]')?.addEventListener('click', () => salvarPainel(dados, painel));
    painel.querySelector('[data-adicionar-pet]')?.addEventListener('click', () => {
      painel.querySelector('[data-sem-pets]')?.remove();
      const card = document.createElement('div');
      card.className = 'admin-pet';
      card.dataset.petId = 'novo';
      card.innerHTML = '<input data-pet-campo="tipo" placeholder="Tipo"><input data-pet-campo="porte" placeholder="Porte"><input data-pet-campo="quantidade" type="number" min="1" placeholder="Qtd."><button type="button" class="btn-textlink" data-remover-pet>Remover</button>';
      painel.querySelector('[data-pets-admin]').appendChild(card);
      card.querySelector('[data-remover-pet]').addEventListener('click', () => card.remove());
    });
    painel.querySelectorAll('[data-remover-pet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('[data-pet-id]');
        const removidos = JSON.parse(painel.dataset.petsRemovidos || '[]');
        if (card.dataset.petId !== 'novo') removidos.push(Number(card.dataset.petId));
        painel.dataset.petsRemovidos = JSON.stringify(removidos);
        card.remove();
      });
    });
    painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function salvarPainel(dados, painel) {
    try {
      const valor = (seletor) => painel.querySelector(seletor)?.value.trim() || '';
      await apiFetch(`/nucleos-familiares/${dados.id}`, { method: 'PUT', body: JSON.stringify({ nome_nucleo: valor('[data-nucleo="nome_nucleo"]'), observacao: valor('[data-nucleo="observacao"]'), ...(valor('[data-nucleo="renda_familiar_total"]') ? { renda_familiar_total: Number(valor('[data-nucleo="renda_familiar_total"]')) } : {}) }) });
      if (dados.casa) await apiFetch(`/casas/${dados.casa.id}`, { method: 'PUT', body: JSON.stringify({ logradouro: valor('[data-casa="logradouro"]'), numero: valor('[data-casa="numero"]'), bairro: valor('[data-casa="bairro"]'), cep: valor('[data-casa="cep"]' ) || null }) });
      await Promise.all([...painel.querySelectorAll('[data-individuo-id]')].map(async (card, indice) => {
        const individuoId = card.dataset.individuoId;
        await apiFetch(`/individuos/${individuoId}`, { method: 'PUT', body: JSON.stringify({ nome_completo: card.querySelector('[data-ind-campo="nome_completo"]').value.trim(), telefone: card.querySelector('[data-ind-campo="telefone"]').value.trim() || null, email: card.querySelector('[data-ind-campo="email"]').value.trim() || null }) });
        const atuais = new Set((dados.vinculos[indice] || []).map((v) => v.id));
        const escolhidas = new Set([...card.querySelectorAll('[data-vuln-id]:checked')].map((el) => Number(el.dataset.vulnId)));
        await Promise.all([...escolhidas].filter((v) => !atuais.has(v)).map((v) => apiFetch(`/vulnerabilidades/individuos/${individuoId}/${v}`, { method: 'POST' })));
        await Promise.all([...atuais].filter((v) => !escolhidas.has(v)).map((v) => apiFetch(`/vulnerabilidades/individuos/${individuoId}/${v}`, { method: 'DELETE' })));
      }));
      await Promise.all(JSON.parse(painel.dataset.petsRemovidos || '[]').map((petId) => apiFetch(`/pets/${petId}`, { method: 'DELETE' })));
      await Promise.all([...painel.querySelectorAll('[data-pet-id]')].map((card) => {
        const payload = { tipo: card.querySelector('[data-pet-campo="tipo"]').value.trim() || null, porte: card.querySelector('[data-pet-campo="porte"]').value.trim() || null, quantidade: Number(card.querySelector('[data-pet-campo="quantidade"]').value) || null };
        return card.dataset.petId === 'novo'
          ? apiFetch('/pets', { method: 'POST', body: JSON.stringify({ id_nucleo_familiar: dados.id, ...payload }) })
          : apiFetch(`/pets/${card.dataset.petId}`, { method: 'PUT', body: JSON.stringify(payload) });
      }));
      showToast('Alterações salvas.', 'success');
      load();
    } catch (err) { showToast(err.message || 'Nao foi possivel salvar.', 'error'); }
  }

  function renderPagination(data) {
    tableFooter.style.display = 'flex';
    const total = data.total || 0;
    const start = (data.page - 1) * data.limit + 1;
    const end   = Math.min(data.page * data.limit, total);
    pagInfo.textContent = `Mostrando ${start}–${end} de ${total} registros`;

    const totalPages = Math.ceil(total / data.limit) || 1;
    pagPages.innerHTML = '';

    const addBtn = (label, page, active, disabled) => {
      const btn = document.createElement('button');
      btn.className = `page-btn${active ? ' is-active' : ''}`;
      btn.textContent = label;
      btn.disabled = disabled;
      if (!disabled && !active) btn.addEventListener('click', () => { currentPage = page; load(); });
      pagPages.appendChild(btn);
    };

    addBtn('‹', currentPage - 1, false, currentPage === 1);
    for (let p = 1; p <= Math.min(totalPages, 5); p++) {
      addBtn(String(p), p, p === currentPage, false);
    }
    if (totalPages > 5) {
      const dots = document.createElement('span');
      dots.textContent = '…';
      dots.style.cssText = 'padding:0 4px;color:#6b7280;align-self:center;';
      pagPages.appendChild(dots);
    }
    addBtn('›', currentPage + 1, false, currentPage === totalPages);
  }

  load();

  document.getElementById('btn-export')?.addEventListener('click', () => {
    if (ultimosResultados.length === 0) {
      showToast('Nao ha registros para exportar nesta pagina.', 'info');
      return;
    }
    const colunas = ['Familia', 'Responsavel', 'Bairro', 'Nivel de risco', 'Membros'];
    const linhas = ultimosResultados.map((f) => [f.nome_familia, f.nome_responsavel, f.bairro, f.nivel_risco, f.qtd_membros]);
    const csv = [colunas, ...linhas].map((linha) => linha.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'familias.csv';
    link.click();
    URL.revokeObjectURL(url);
  });

  const familiaId = new URLSearchParams(window.location.search).get('id');
  if (familiaId) abrirFamilia(familiaId, new URLSearchParams(window.location.search).get('edit') === '1');
})();
