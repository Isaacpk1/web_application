(function () {
  if (!Auth.guard()) return;

  let abaAtual = '';

  async function load() {
    document.getElementById('completude-list').innerHTML = '<div class="state-loading">Carregando…</div>';
    try {
      const params = abaAtual ? `?aba=${abaAtual}` : '';
      const data = await apiFetch(`/completude${params}`);
      const { stats, items } = data;

      document.getElementById('c-total').textContent      = stats.total;
      document.getElementById('c-completos').textContent  = stats.completos;
      document.getElementById('c-incompletos').textContent = stats.incompletos;
      document.getElementById('c-taxa').textContent       = `${stats.taxa}%`;
      document.getElementById('tab-total').textContent    = stats.total;
      document.getElementById('tab-completos').textContent = stats.completos;
      document.getElementById('tab-incompletos').textContent = stats.incompletos;

      renderList(items);
    } catch (err) {
      document.getElementById('completude-list').innerHTML =
        `<div class="state-empty"><span class="state-empty__icon">⚠</span><span class="state-empty__text">${err.message}</span></div>`;
    }
  }

  function renderList(items) {
    if (!items || items.length === 0) {
      document.getElementById('completude-list').innerHTML =
        '<div class="state-empty"><span class="state-empty__icon">✓</span><span class="state-empty__text">Nenhum registro nesta aba.</span></div>';
      return;
    }

    // Aviso LGPD para incompletos antigos (simulado para o primeiro incompleto)
    const lgpdIdx = items.findIndex((f) => !f.completo);

    const rows = items.map((f, idx) => {
      const pct = Math.round((f.campos_preenchidos / f.campos_total) * 100);
      const ok  = f.completo;
      const lgpd = (idx === lgpdIdx && !f.completo)
        ? `<div class="lgpd-banner">⚠ Rascunho com dados incompletos — podem ser excluídos conforme LGPD (Art. 7º) após 30 dias <a href="#">Saiba mais →</a></div>`
        : '';
      return `${lgpd}<div class="completude-item">
        <div class="ci-icon ${ok ? 'ci-icon--ok' : 'ci-icon--inc'}">${ok ? '✓' : '!'}</div>
        <div class="ci-info">
          <div class="ci-name">${f.nome_familia}</div>
          <div class="ci-meta">Resp. ${f.nome_responsavel} · ${formatDate(f.data_cadastro)}</div>
        </div>
        <div class="ci-progress">
          <div class="ci-prog-label">${f.campos_preenchidos} de ${f.campos_total} campos preenchidos</div>
          <div class="progress-bar">
            <div class="progress-bar__fill progress-bar__fill--${ok ? 'ok' : 'inc'}" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="ci-right">
          ${nivelRiscoBadge(f.nivel_risco)}
          ${ok
            ? '<span class="status-badge status-badge--ok" style="white-space:nowrap">✓ Completo</span>'
            : `<button class="btn-completar" data-completar-id="${f.id}">Completar</button>`}
        </div>
      </div>`;
    }).join('');

    document.getElementById('completude-list').innerHTML = rows;
    document.querySelectorAll('[data-completar-id]').forEach((btn) => {
      btn.addEventListener('click', () => { window.location.href = `/familias?id=${btn.dataset.completarId}&edit=1`; });
    });
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      abaAtual = btn.dataset.aba;
      load();
    });
  });

  load();
})();
