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

  function formatEndereco(item) {
    const rua = item.logradouro || '';
    const numero = item.numero ? `, ${item.numero}` : '';
    const bairro = item.bairro ? ` - ${item.bairro}` : '';
    return `${rua}${numero}${bairro}` || '—';
  }

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
        <td>${f.codigo_setor || '—'}</td>
        <td>${formatEndereco(f)}</td>
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
            <th>Setor</th>
            <th>Endereço</th>
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
    const imagePreview = (url, alt) => url
      ? `<a class="admin-photo-preview" href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${alt}" loading="lazy"></a>`
      : '<span class="admin-photo-empty">Sem imagem</span>';
    const imageField = (label, url, category, targetSelector, hiddenAttr, alt) => `
      <label class="admin-photo-field">${label}
        ${imagePreview(url, alt)}
        ${somenteLeitura ? '' : `<input type="file" accept="image/*" capture="environment" data-admin-image-upload="${category}" data-admin-image-target="${targetSelector}">`}
        <input type="hidden" ${hiddenAttr} value="${url || ''}">
      </label>`;
    const vulnerabilidades = dados.individuos.map((individuo, indice) => {
      const atuais = new Set((dados.vinculos[indice] || []).map((v) => v.id));
      return `<div class="admin-member" data-individuo-id="${individuo.id}"><h4>${individuo.nome_completo}</h4>
        <label>Nome <input data-ind-campo="nome_completo" value="${individuo.nome_completo || ''}" ${disabled}></label>
        <label>Telefone <input data-ind-campo="telefone" value="${individuo.telefone || ''}" ${disabled}></label>
        <label>E-mail <input data-ind-campo="email" value="${individuo.email || ''}" ${disabled}></label>${imageField('Foto', individuo.foto_url, 'individuo', "[data-ind-campo='foto_url']", 'data-ind-campo="foto_url"', `Foto de ${individuo.nome_completo || 'membro'}`)}
        <div class="admin-vulns">${dados.catalogoVulnerabilidades.map((v) => `<label><input type="checkbox" data-vuln-id="${v.id}" ${atuais.has(v.id) ? 'checked' : ''} ${disabled}> ${v.tipo_vulnerabilidade}</label>`).join('')}</div></div>`;
    }).join('');
    const pets = dados.pets.map((pet) => `<div class="admin-pet" data-pet-id="${pet.id}"><input data-pet-campo="tipo" value="${pet.tipo || ''}" placeholder="Tipo" ${disabled}><input data-pet-campo="porte" value="${pet.porte || ''}" placeholder="Porte" ${disabled}><input data-pet-campo="quantidade" type="number" min="1" value="${pet.quantidade || ''}" placeholder="Qtd." ${disabled}>${imageField('Imagem', pet.imagem, 'pet', "[data-pet-campo='imagem']", 'data-pet-campo="imagem"', `Imagem do pet ${pet.tipo || ''}`)}${somenteLeitura ? '' : '<button type="button" class="btn-textlink" data-remover-pet>Remover</button>'}</div>`).join('') || '<p data-sem-pets>Nenhum pet cadastrado.</p>';
    const painel = document.createElement('section');
    painel.id = 'familia-painel';
    painel.className = 'section-card';
    painel.innerHTML = `<div class="content-head"><h2>${somenteLeitura ? 'Detalhes da família' : 'Editar família'}</h2><button class="btn btn--ghost" data-fechar-painel>Fechar</button></div>
      <div class="admin-grid"><label>Núcleo<input data-nucleo="nome_nucleo" value="${dados.nucleo.nome_nucleo || ''}" ${disabled}></label><label>Renda<input data-nucleo="renda_familiar_total" type="number" min="0" value="${dados.nucleo.renda_familiar_total ?? ''}" ${disabled}></label><label>Observação<textarea data-nucleo="observacao" ${disabled}>${dados.nucleo.observacao || ''}</textarea></label><label>Logradouro<input data-casa="logradouro" value="${casa.logradouro || ''}" ${disabled}></label><label>Número<input data-casa="numero" value="${casa.numero || ''}" ${disabled}></label><label>Bairro<input data-casa="bairro" value="${casa.bairro || ''}" ${disabled}></label><label>CEP<input data-casa="cep" value="${casa.cep || ''}" ${disabled}></label>${imageField('Foto da fachada', casa.foto_fachada_url, 'casa_fachada', "[data-casa='foto_fachada_url']", 'data-casa="foto_fachada_url"', 'Foto da fachada')}${imageField('Foto complementar', casa.foto_detalhe_url, 'casa_detalhe', "[data-casa='foto_detalhe_url']", 'data-casa="foto_detalhe_url"', 'Foto complementar da casa')}</div>
      <h3>Membros e vulnerabilidades</h3>${vulnerabilidades}<h3>Pets</h3><div data-pets-admin>${pets}</div>${somenteLeitura ? '' : '<button type="button" class="btn btn--ghost" data-adicionar-pet>Adicionar pet</button> <button class="btn btn--blue" data-salvar-familia>Salvar alterações</button>'}`;
    document.querySelector('.page-content').prepend(painel);
    painel.querySelector('[data-fechar-painel]').addEventListener('click', () => painel.remove());
    painel.querySelector('[data-salvar-familia]')?.addEventListener('click', () => salvarPainel(dados, painel));
    painel.querySelector('[data-adicionar-pet]')?.addEventListener('click', () => {
      painel.querySelector('[data-sem-pets]')?.remove();
      const card = document.createElement('div');
      card.className = 'admin-pet';
      card.dataset.petId = 'novo';
      card.innerHTML = `<input data-pet-campo="tipo" placeholder="Tipo"><input data-pet-campo="porte" placeholder="Porte"><input data-pet-campo="quantidade" type="number" min="1" placeholder="Qtd.">${imageField('Imagem', '', 'pet', "[data-pet-campo='imagem']", 'data-pet-campo="imagem"', 'Imagem do pet')}<button type="button" class="btn-textlink" data-remover-pet>Remover</button>`;
      painel.querySelector('[data-pets-admin]').appendChild(card);
      card.querySelector('[data-remover-pet]').addEventListener('click', () => card.remove());
      bindPainelUploads(card);
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
    bindPainelUploads(painel);
    painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  function bindPainelUploads(painel) {
    painel.querySelectorAll('[data-admin-image-upload]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;

        const scope = input.closest('[data-individuo-id], [data-pet-id]') || painel;
        const target = scope.querySelector(input.dataset.adminImageTarget);
        input.disabled = true;
        try {
          showToast('Enviando imagem...', 'info');
          const result = await apiUploadImage(file, input.dataset.adminImageUpload);
          if (target) target.value = result.url;
          const photoField = input.closest('.admin-photo-field');
          const preview = photoField?.querySelector('.admin-photo-preview');
          if (preview) {
            preview.href = result.url;
            const image = preview.querySelector('img');
            if (image) image.src = result.url;
          } else if (photoField) {
            photoField.querySelector('.admin-photo-empty')?.remove();
            photoField.insertAdjacentHTML('afterbegin', `<a class="admin-photo-preview" href="${result.url}" target="_blank" rel="noopener"><img src="${result.url}" alt="Imagem enviada" loading="lazy"></a>`);
          }
          showToast('Imagem enviada.', 'success');
        } catch (err) {
          input.value = '';
          if (target) target.value = '';
          showToast(err.message || 'Nao foi possivel enviar a imagem.', 'error');
        } finally {
          input.disabled = false;
        }
      });
    });
  }
  async function salvarPainel(dados, painel) {
    try {
      const valor = (seletor) => painel.querySelector(seletor)?.value.trim() || '';
      await apiFetch(`/nucleos-familiares/${dados.id}`, { method: 'PUT', body: JSON.stringify({ nome_nucleo: valor('[data-nucleo="nome_nucleo"]'), observacao: valor('[data-nucleo="observacao"]'), renda_familiar_total: valor('[data-nucleo="renda_familiar_total"]') ? Number(valor('[data-nucleo="renda_familiar_total"]')) : null }) });
      if (dados.casa) await apiFetch(`/casas/${dados.casa.id}`, { method: 'PUT', body: JSON.stringify({ logradouro: valor('[data-casa="logradouro"]'), numero: valor('[data-casa="numero"]'), bairro: valor('[data-casa="bairro"]'), cep: valor('[data-casa="cep"]' ) || null, foto_fachada_url: valor('[data-casa="foto_fachada_url"]') || null, foto_detalhe_url: valor('[data-casa="foto_detalhe_url"]') || null }) });
      await Promise.all([...painel.querySelectorAll('[data-individuo-id]')].map(async (card, indice) => {
        const individuoId = card.dataset.individuoId;
        await apiFetch(`/individuos/${individuoId}`, { method: 'PUT', body: JSON.stringify({ nome_completo: card.querySelector('[data-ind-campo="nome_completo"]').value.trim(), telefone: card.querySelector('[data-ind-campo="telefone"]').value.trim() || null, email: card.querySelector('[data-ind-campo="email"]').value.trim() || null, foto_url: card.querySelector('[data-ind-campo="foto_url"]').value.trim() || null }) });
        const atuais = new Set((dados.vinculos[indice] || []).map((v) => v.id));
        const escolhidas = new Set([...card.querySelectorAll('[data-vuln-id]:checked')].map((el) => Number(el.dataset.vulnId)));
        await Promise.all([...escolhidas].filter((v) => !atuais.has(v)).map((v) => apiFetch(`/vulnerabilidades/individuos/${individuoId}/${v}`, { method: 'POST' })));
        await Promise.all([...atuais].filter((v) => !escolhidas.has(v)).map((v) => apiFetch(`/vulnerabilidades/individuos/${individuoId}/${v}`, { method: 'DELETE' })));
      }));
      await Promise.all(JSON.parse(painel.dataset.petsRemovidos || '[]').map((petId) => apiFetch(`/pets/${petId}`, { method: 'DELETE' })));
      await Promise.all([...painel.querySelectorAll('[data-pet-id]')].map((card) => {
        const payload = { tipo: card.querySelector('[data-pet-campo="tipo"]').value.trim() || null, porte: card.querySelector('[data-pet-campo="porte"]').value.trim() || null, quantidade: Number(card.querySelector('[data-pet-campo="quantidade"]').value) || null, imagem: card.querySelector('[data-pet-campo="imagem"]').value.trim() || null };
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

  async function getExportData() {
    const params = new URLSearchParams({ page: 1, limit: 10000 });
    if (searchInput.value.trim()) params.set('nome', searchInput.value.trim());
    if (filterRisco.value) params.set('nivel_risco', filterRisco.value);
    if (filterBairro.value.trim()) params.set('bairro', filterBairro.value.trim());

    const data = await apiFetch(`/cadastros/busca?${params}`);
    const resultados = data.resultados || [];
    if (resultados.length === 0) {
      showToast('Nao ha registros para exportar nesta pagina.', 'info');
      return null;
    }
    const colunas = ['Familia', 'Responsavel', 'Setor', 'Logradouro', 'Numero', 'Bairro', 'Nivel de risco', 'Membros'];
    const linhas = resultados.map((f) => [f.nome_familia, f.nome_responsavel, f.codigo_setor, f.logradouro, f.numero, f.bairro, f.nivel_risco, f.qtd_membros]);
    return { colunas, linhas };
  }

  function baixarArquivo(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  document.getElementById('btn-export-excel')?.addEventListener('click', async () => {
    const dados = await getExportData();
    if (!dados) return;

    const tabela = `<table><thead><tr>${dados.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join('')}</tr></thead><tbody>${dados.linhas.map((linha) => `<tr>${linha.map((valor) => `<td>${escapeHtml(valor)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${tabela}</body></html>`;
    baixarArquivo('familias.xls', html, 'application/vnd.ms-excel;charset=utf-8');
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', async () => {
    const dados = await getExportData();
    if (!dados) return;

    const linhas = dados.linhas.map((linha) => `<tr>${linha.map((valor) => `<td>${escapeHtml(valor)}</td>`).join('')}</tr>`).join('');
    const colunas = dados.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join('');
    const janela = window.open('', '_blank');
    if (!janela) {
      showToast('Permita pop-ups para exportar o PDF.', 'error');
      return;
    }
    janela.document.write(`<!DOCTYPE html><html><head><title>Familias</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111827}h1{font-size:20px;margin:0 0 16px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d1d5db;padding:6px;text-align:left}th{background:#f3f4f6}@media print{@page{size:landscape;margin:12mm}}</style></head><body><h1>Cadastro de Familias</h1><table><thead><tr>${colunas}</tr></thead><tbody>${linhas}</tbody></table><script>window.onload=function(){window.print();};<\/script></body></html>`);
    janela.document.close();
  });

  const familiaId = new URLSearchParams(window.location.search).get('id');
  if (familiaId) abrirFamilia(familiaId, new URLSearchParams(window.location.search).get('edit') === '1');
})();
