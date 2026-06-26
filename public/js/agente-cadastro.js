/* agente-cadastro.js — cadastro de família em 6 etapas
   Fluxo:
     1. Imóvel  — setor (GET /setores) + endereço / GPS / status do imóvel
     2. Núcleo  — nome do núcleo, renda, tempo de residência, observação
     3. Membros — adicionar múltiplos moradores com todos os campos pós-migration
     4. Chefe   — selecionar o responsável entre os membros (deve ter 18+)
     5. Pets    — animais de estimação do núcleo (opcional)
     6. Revisão — resumo + envio

   No envio (passo 6), todos os dados seguem em uma unica requisicao para
   POST /cadastros-completos com Idempotency-Key estavel durante o retry.
*/
(function () {
  if (!Auth.guard()) return;

  const TOTAL_STEPS = 6;
  // Identidade temporaria do ambiente de demonstracao. Nao inclua senha no
  // frontend: qualquer valor neste arquivo pode ser visto no navegador.
  const CADASTRADOR_MOCK = {
    nome: 'Agente de Campo (Mock)',
    documento: '000.000-0',
    email: 'agente@georisco.sp.gov.br',
  };
  let currentStep = 1;
  let isSending = false;
  // Uma mesma tentativa conserva a chave entre reenvios após falha de rede.
  let idempotencyKey = null;

  const state = {
    gpsLat:   null,
    gpsLng:   null,
    membros:  [],    // [{nome_completo, data_nascimento, genero, ..., vulns[]}]
    chefeIdx: null,
    pets:     [],    // [{tipo, porte, quantidade, imagem}]
  };

  const root       = document.querySelector('[data-agente-cadastro]');
  const btnPrev    = root.querySelector('[data-prev]');
  const btnNext    = root.querySelector('[data-next]');
  const btnSubmit  = root.querySelector('[data-submit]');
  const footerHint = root.querySelector('[data-step-hint]');
  const savePill   = root.querySelector('[data-save-pill]');

  /* ── helpers ─────────────────────────────────────────────────────── */

  function val(id) { return (document.getElementById(id)?.value ?? '').trim(); }
  function stepEl(n)     { return root.querySelector(`[data-step="${n}"]`); }
  function stepItemEl(n) { return root.querySelector(`[data-step-item="${n}"]`); }

  async function obterCadastradorMock() {
    const buscar = async () => {
      const cadastradores = await apiFetch('/cadastradores');
      return Array.isArray(cadastradores)
        ? cadastradores.find((c) => c.documento === CADASTRADOR_MOCK.documento)
        : null;
    };

    const existente = await buscar();
    if (existente) return existente;
    throw new Error('Cadastrador de sessao nao encontrado. Contate a administracao.');
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function setorLabel(setor) {
    const codigo = setor.codigo_setor ? String(setor.codigo_setor).trim() : '';
    const nome = setor.nome_regiao ? String(setor.nome_regiao).trim() : '';
    const base = codigo && nome && codigo !== nome ? `${codigo} - ${nome}` : (codigo || nome);
    return base + (setor.grau_risco ? ' — ' + setor.grau_risco : '');
  }

  function enderecoLabel() {
    return [
      val('m_logradouro'),
      val('m_numero') ? `Nº ${val('m_numero')}` : '',
      val('m_bairro'),
    ].filter(Boolean).join(' — ') || '—';
  }

  function calcAge(iso) {
    if (!iso) return 0;
    const dob = new Date(iso + 'T00:00:00');
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const dm = now.getMonth() - dob.getMonth();
    if (dm < 0 || (dm === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }

  function cpfValido(cpf) {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    let r = 11 - (sum % 11); if (r > 9) r = 0;
    if (r !== Number(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    r = 11 - (sum % 11); if (r > 9) r = 0;
    return r === Number(cpf[10]);
  }

  function bindImageUploads() {
    root.querySelectorAll('[data-image-upload]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;

        const target = document.getElementById(input.dataset.imageTarget);
        input.disabled = true;
        try {
          showToast('Enviando imagem...', 'info');
          const result = await apiUploadImage(file, input.dataset.imageUpload);
          if (target) target.value = result.url;
          showToast('Imagem enviada com sucesso.', 'success');
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

  /* ── showStep ────────────────────────────────────────────────────── */

  function showStep(n) {
    for (let i = 1; i <= 7; i++) {
      const el = stepEl(i);
      if (el) el.hidden = (i !== n);
    }

    const inStepper = n <= TOTAL_STEPS;
    root.querySelector('.m-stepper').style.display = inStepper ? '' : 'none';
    root.querySelector('.m-footer').style.display  = inStepper ? '' : 'none';
    if (!inStepper) return;

    btnPrev.hidden   = n <= 1;
    btnNext.hidden   = n >= TOTAL_STEPS;
    btnSubmit.hidden = n < TOTAL_STEPS;
    footerHint.textContent = `Passo ${n} de ${TOTAL_STEPS}`;

    const fill = root.querySelector('.m-stepper__fill');
    fill.style.width = `${((n - 1) / (TOTAL_STEPS - 1)) * 100}%`;

    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const item = stepItemEl(i);
      if (!item) continue;
      item.classList.remove('is-active', 'is-done');
      if (i < n)        item.classList.add('is-done');
      else if (i === n) item.classList.add('is-active');
    }

    if (n === 4) renderChefeList();
    if (n === 6) renderRevisao();
  }

  /* ── field validation ────────────────────────────────────────────── */

  function markField(fieldEl, valid, msg) {
    fieldEl.classList.toggle('is-invalid', !valid);
    const err = fieldEl.querySelector('.m-field__error');
    if (err && msg) err.textContent = msg;
  }

  function validateStep(n) {
    if (n === 1) {
      const latitude = Number(val('m_latitude'));
      const longitude = Number(val('m_longitude'));
      const latitudeField = document.getElementById('m_latitude')?.closest('[data-field]');
      const longitudeField = document.getElementById('m_longitude')?.closest('[data-field]');
      const latitudeValida = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
      const longitudeValida = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;

      if (latitudeField) markField(latitudeField, latitudeValida, 'Informe uma latitude entre -90 e 90.');
      if (longitudeField) markField(longitudeField, longitudeValida, 'Informe uma longitude entre -180 e 180.');

      if (!latitudeValida || !longitudeValida) {
        showToast('Informe coordenadas válidas ou capture o GPS para continuar.', 'error');
        return false;
      }

      state.gpsLat = latitude;
      state.gpsLng = longitude;

      let ok = true;
      root.querySelectorAll('[data-step="1"] [data-field][data-required]').forEach((f) => {
        const ctrl = f.querySelector('.m-field__control');
        if (!ctrl?.value?.trim()) { markField(f, false); ok = false; }
        else markField(f, true);
      });
      return ok;
    }

    if (n === 2) {
      const ctrl = document.getElementById('m_nome_nucleo');
      const f    = ctrl?.closest('[data-field]');
      if (!ctrl?.value?.trim()) { if (f) markField(f, false); return false; }
      if (f) markField(f, true);
      return true;
    }

    if (n === 3) {
      if (state.membros.length === 0) {
        showToast('Adicione ao menos um membro antes de continuar.', 'error');
        return false;
      }
      return true;
    }

    if (n === 4) {
      if (state.chefeIdx === null) {
        showToast('Selecione o responsável pelo núcleo antes de continuar.', 'error');
        return false;
      }
      return true;
    }

    return true;
  }

  /* ── loadSetores ─────────────────────────────────────────────────── */

  async function loadSetores() {
    const select = document.getElementById('m_setor');
    select.innerHTML = '<option value="">Carregando setores…</option>';
    try {
      const list = await apiFetch('/setores');
      if (!Array.isArray(list) || list.length === 0) {
        select.innerHTML = '<option value="">Nenhum setor disponivel</option>';
        showToast('Nenhum setor IPT esta disponivel para cadastro.', 'error');
        return;
      }
      select.innerHTML = '<option value="">Selecionar setor…</option>';
      list.forEach((s) => {
        const opt = document.createElement('option');
        opt.value       = String(s.id);
        opt.textContent = setorLabel(s);
        select.appendChild(opt);
      });
      if (list.length === 1) select.value = String(list[0].id);
    } catch (err) {
      select.innerHTML = '<option value="">Erro ao carregar setores</option>';
      showToast('Erro ao carregar setores: ' + err.message, 'error');
    }
  }

  /* ── GPS ─────────────────────────────────────────────────────────── */

  root.querySelector('[data-gps-capture]').addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocalização não suportada. Informe o endereço manualmente.', 'error');
      return;
    }
    const btn   = root.querySelector('[data-gps-capture]');
    const label = btn.querySelector('.label');
    label.textContent = 'Localizando…';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.gpsLat = pos.coords.latitude;
        state.gpsLng = pos.coords.longitude;
        document.getElementById('m_latitude').value  = state.gpsLat;
        document.getElementById('m_longitude').value = state.gpsLng;
        root.querySelector('[data-map]').classList.remove('is-empty');
        const badge = root.querySelector('[data-gps-badge]');
        badge.textContent = `✓ Localização capturada: ${state.gpsLat.toFixed(5)}, ${state.gpsLng.toFixed(5)}`;
        badge.classList.add('show');
        label.textContent    = 'GPS capturado ✓';
        btn.disabled         = false;
        btn.style.background = '#16a34a';
      },
      (err) => {
        label.textContent    = 'Capturar GPS automaticamente';
        btn.disabled         = false;
        const msgs = { 1: 'Permissão negada.', 2: 'Localização indisponível.', 3: 'Tempo esgotado.' };
        showToast((msgs[err.code] || 'Erro GPS.') + ' Use o endereço manual.', 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });

  /* ── campos condicionais ─────────────────────────────────────────── */

  document.getElementById('m_status_imovel')?.addEventListener('change', (e) => {
    const deveExibir = e.target.value === 'Interditado';
    document.getElementById('m_field_data_interdicao').hidden = !deveExibir;
    if (!deveExibir) document.getElementById('m_data_interdicao').value = '';
  });

  document.getElementById('mf_status_vital')?.addEventListener('change', (e) => {
    document.getElementById('mf_field_data_obito').hidden = (e.target.value === 'Vivo');
  });

  /* ── adicionar membro ────────────────────────────────────────────── */

  root.querySelector('[data-add-membro]').addEventListener('click', addMembro);

  function addMembro() {
    const nome       = val('mf_nome');
    const nascimento = val('mf_nascimento');
    const genero     = val('mf_genero');

    let ok = true;
    [
      ['mf_nome',       nome,       'Informe o nome completo.'],
      ['mf_nascimento', nascimento, 'Informe a data de nascimento.'],
      ['mf_genero',     genero,     'Selecione o gênero.'],
    ].forEach(([id, v, msg]) => {
      const f = document.getElementById(id)?.closest('[data-mf]');
      if (f) markField(f, !!v, msg);
      if (!v) ok = false;
    });
    if (!ok) return;

    const cpfRaw   = val('mf_cpf').replace(/\D/g, '');
    const cpfField = document.getElementById('mf_cpf')?.closest('[data-mf]');
    if (cpfRaw && !cpfValido(cpfRaw)) {
      if (cpfField) markField(cpfField, false, 'CPF inválido.');
      return;
    }
    if (cpfField) markField(cpfField, true);

    const nisRaw   = val('mf_nis').replace(/\D/g, '');
    const nisField = document.getElementById('mf_nis')?.closest('[data-mf]');
    if (nisRaw && !/^\d{11}$/.test(nisRaw)) {
      if (nisField) markField(nisField, false, 'NIS deve ter 11 dígitos.');
      return;
    }
    if (nisField) markField(nisField, true);

    const vulns = [];
    root.querySelectorAll('[data-membro-form] input[name="vuln"]:checked').forEach((cb) => vulns.push(cb.value));

    state.membros.push({
      nome_completo:         nome,
      data_nascimento:       nascimento,
      genero,
      apelido:               val('mf_apelido') || null,
      nome_social:           val('mf_nome_social') || null,
      cor_raca:              val('mf_cor_raca') || null,
      uf:                    val('mf_uf') || null,
      status_vital:          val('mf_status_vital') || 'Vivo',
      data_obito:            val('mf_data_obito') || null,
      cpf:                   cpfRaw || null,
      estado_civil:          val('mf_estado_civil') || null,
      rg:                    val('mf_rg') || null,
      nis:                   nisRaw || null,
      doc_estrangeiro:       val('mf_doc_estrangeiro') || null,
      telefone:              val('mf_telefone') || null,
      email:                 val('mf_email') || null,
      foto_url:              val('mf_foto_url') || null,
      nome_mae:              val('mf_nome_mae') || null,
      nome_pai:              val('mf_nome_pai') || null,
      grau_parentesco:       val('mf_grau_parentesco') || null,
      profissao:             val('mf_profissao') || null,
      escolaridade:          val('mf_escolaridade') || null,
      situacao_ocupacional:  val('mf_situacao_ocupacional') || null,
      semanas_gestacao:      val('mf_semanas_gestacao') ? Number(val('mf_semanas_gestacao')) : null,
      vulns,
    });

    // limpa o formulário de membro
    [
      'mf_nome', 'mf_nascimento', 'mf_genero', 'mf_apelido', 'mf_nome_social', 'mf_cor_raca', 'mf_uf',
      'mf_data_obito', 'mf_cpf', 'mf_estado_civil', 'mf_rg', 'mf_nis', 'mf_doc_estrangeiro', 'mf_telefone',
      'mf_email', 'mf_nome_mae', 'mf_nome_pai', 'mf_grau_parentesco', 'mf_profissao', 'mf_escolaridade',
      'mf_situacao_ocupacional', 'mf_semanas_gestacao', 'mf_foto_url',
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('mf_status_vital').value = 'Vivo';
    document.getElementById('mf_foto_file').value = '';
    document.getElementById('mf_field_data_obito').hidden = true;
    root.querySelectorAll('[data-membro-form] input[name="vuln"]').forEach((cb) => { cb.checked = false; });
    root.querySelectorAll('[data-mf]').forEach((f) => f.classList.remove('is-invalid'));

    renderMembroList();
  }

  function renderMembroList() {
    const list    = root.querySelector('[data-membros-list]');
    const titleEl = root.querySelector('[data-membro-form-title]');
    if (titleEl) {
      titleEl.textContent = state.membros.length > 0 ? 'Adicionar outro membro' : 'Adicionar 1º membro';
    }

    list.innerHTML = state.membros.map((m, i) => {
      const age     = calcAge(m.data_nascimento);
      const vulnStr = m.vulns.length
        ? `<span style="color:#F97316;font-size:11px"> · ${esc(m.vulns.join(', '))}</span>`
        : '';
      return `<div class="m-member-item">
        <div class="m-member-info">
          <div class="m-member-name">${esc(m.nome_completo)}</div>
          <div class="m-member-sub">${esc(m.genero)} · ${age} anos · ${fmtDate(m.data_nascimento)}${vulnStr}</div>
        </div>
        <button type="button" class="m-member-remove" data-remove="${i}" aria-label="Remover membro">&times;</button>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.remove);
        state.membros.splice(idx, 1);
        if (state.chefeIdx !== null) {
          if (state.chefeIdx === idx) state.chefeIdx = null;
          else if (state.chefeIdx > idx) state.chefeIdx--;
        }
        renderMembroList();
      });
    });
  }

  /* ── adicionar pet ───────────────────────────────────────────────── */

  root.querySelector('[data-add-pet]')?.addEventListener('click', addPet);

  function addPet() {
    const quantidade = val('pf_quantidade') ? Number(val('pf_quantidade')) : null;
    if (!val('pf_tipo') && !val('pf_porte') && quantidade === null && !val('pf_imagem')) {
      showToast('Informe ao menos um dado do pet antes de adiciona-lo.', 'error');
      return;
    }
    if (quantidade !== null && quantidade < 1) {
      showToast('A quantidade de pets deve ser maior que zero.', 'error');
      return;
    }
    state.pets.push({
      tipo:       val('pf_tipo') || null,
      porte:      val('pf_porte') || null,
      quantidade,
      imagem:     val('pf_imagem') || null,
    });

    ['pf_tipo', 'pf_porte', 'pf_quantidade', 'pf_imagem'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('pf_imagem_file').value = '';

    renderPetsList();
  }

  function renderPetsList() {
    const list = root.querySelector('[data-pets-list]');
    if (!list) return;

    list.innerHTML = state.pets.map((p, i) => {
      const sub = [p.porte, p.quantidade ? `${p.quantidade}x` : null].filter(Boolean).join(' · ');
      return `<div class="m-member-item">
        <div class="m-member-info">
          <div class="m-member-name">${esc(p.tipo || 'Pet')}</div>
          <div class="m-member-sub">${esc(sub || '—')}</div>
        </div>
        <button type="button" class="m-member-remove" data-remove-pet="${i}" aria-label="Remover pet">&times;</button>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-remove-pet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.pets.splice(Number(btn.dataset.removePet), 1);
        renderPetsList();
      });
    });
  }

  /* ── chefe ───────────────────────────────────────────────────────── */

  function renderChefeList() {
    const container = root.querySelector('[data-chefe-list]');
    container.innerHTML = state.membros.map((m, i) => {
      const age     = calcAge(m.data_nascimento);
      const isAdult = age >= 18;
      const isSel   = state.chefeIdx === i;
      return `<div class="m-chefe-item${isSel ? ' is-selected' : ''}"
                   data-chefe-idx="${i}"
                   ${!isAdult ? 'data-minor style="opacity:.45;cursor:not-allowed"' : ''}>
        <div class="m-chefe-radio"><div class="m-chefe-dot"></div></div>
        <div>
          <div class="m-chefe-name">${esc(m.nome_completo)}</div>
          <div class="m-chefe-sub">${esc(m.genero)} · ${age} anos${!isAdult ? ' — menor de idade (não elegível)' : ''}</div>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('[data-chefe-idx]:not([data-minor])').forEach((item) => {
      item.addEventListener('click', () => {
        state.chefeIdx = Number(item.dataset.chefeIdx);
        container.querySelectorAll('[data-chefe-idx]').forEach((el) => el.classList.remove('is-selected'));
        item.classList.add('is-selected');
      });
    });
  }

  /* ── revisão ─────────────────────────────────────────────────────── */

  function renderRevisao() {
    const setorText = (() => {
      const sel = document.getElementById('m_setor');
      return sel?.options[sel.selectedIndex]?.text || '—';
    })();

    const chefe     = state.chefeIdx !== null ? state.membros[state.chefeIdx] : null;
    const container = root.querySelector('[data-revisao-content]');

    container.innerHTML = `
      <div class="m-review-card">
        <div class="m-review-card__head">
          <span class="m-review-card__title">Imóvel</span>
          <button type="button" class="m-review-card__edit" data-go-step="1">Editar &rarr;</button>
        </div>
        <div class="m-review-row"><span class="m-review-key">Setor</span><span class="m-review-val">${esc(setorText)}</span></div>
        <div class="m-review-row"><span class="m-review-key">Endereço</span><span class="m-review-val">${esc(enderecoLabel())}</span></div>
        <div class="m-review-row"><span class="m-review-key">GPS</span><span class="m-review-val">${state.gpsLat ? state.gpsLat.toFixed(4) + ', ' + state.gpsLng.toFixed(4) : 'Não capturado'}</span></div>
        <div class="m-review-row"><span class="m-review-key">Tipo / Uso</span><span class="m-review-val">${esc(val('m_tipo_construcao'))} / ${esc(val('m_uso_imovel'))}</span></div>
        <div class="m-review-row"><span class="m-review-key">Fotos</span><span class="m-review-val">${[val('m_foto_fachada_url') && 'fachada', val('m_foto_detalhe_url') && 'complementar'].filter(Boolean).join(', ') || '&mdash;'}</span></div>
      </div>
      <div class="m-review-card">
        <div class="m-review-card__head">
          <span class="m-review-card__title">Núcleo Familiar</span>
          <button type="button" class="m-review-card__edit" data-go-step="2">Editar &rarr;</button>
        </div>
        <div class="m-review-row"><span class="m-review-key">Nome</span><span class="m-review-val">${esc(val('m_nome_nucleo'))}</span></div>
        <div class="m-review-row"><span class="m-review-key">Renda</span><span class="m-review-val">${val('m_renda_familiar') ? 'R$ ' + Number(val('m_renda_familiar')).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</span></div>
      </div>
      <div class="m-review-card">
        <div class="m-review-card__head">
          <span class="m-review-card__title">Membros (${state.membros.length})</span>
          <button type="button" class="m-review-card__edit" data-go-step="3">Editar &rarr;</button>
        </div>
        ${state.membros.map((m, i) => `
          <div class="m-review-row">
            <span class="m-review-key">${i + 1}. ${esc(m.nome_completo)}</span>
            <span class="m-review-val">${esc(m.genero)} · ${calcAge(m.data_nascimento)} anos${state.chefeIdx === i ? ' ★' : ''}</span>
          </div>`).join('')}
      </div>
      <div class="m-review-card">
        <div class="m-review-card__head">
          <span class="m-review-card__title">Chefe da Família</span>
          <button type="button" class="m-review-card__edit" data-go-step="4">Editar &rarr;</button>
        </div>
        <div class="m-review-row">
          <span class="m-review-key">Responsável</span>
          <span class="m-review-val">${chefe ? esc(chefe.nome_completo) : '—'}</span>
        </div>
      </div>
      <div class="m-review-card">
        <div class="m-review-card__head">
          <span class="m-review-card__title">Pets (${state.pets.length})</span>
          <button type="button" class="m-review-card__edit" data-go-step="5">Editar &rarr;</button>
        </div>
        ${state.pets.length === 0
          ? '<div class="m-review-row"><span class="m-review-key">Nenhum pet cadastrado</span></div>'
          : state.pets.map((p) => `
            <div class="m-review-row">
              <span class="m-review-key">${esc(p.tipo || 'Pet')}</span>
              <span class="m-review-val">${esc(p.porte || '—')}${p.quantidade ? ' · ' + p.quantidade + 'x' : ''}</span>
            </div>`).join('')}
      </div>`;

    container.querySelectorAll('[data-go-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentStep = Number(btn.dataset.goStep);
        showStep(currentStep);
      });
    });
  }

  /* ── navegação ───────────────────────────────────────────────────── */

  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    currentStep++;
    showStep(currentStep);
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
  });

  root.querySelector('[data-back]').addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
    else window.history.back();
  });

  root.querySelectorAll('[data-step-item]').forEach((item) => {
    const goToStep = () => {
      const destino = Number(item.dataset.stepItem);
      if (destino > currentStep) return;
      currentStep = destino;
      showStep(currentStep);
    };
    item.addEventListener('click', goToStep);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToStep(); }
    });
  });

  /* ── envio ───────────────────────────────────────────────────────── */

  btnSubmit.addEventListener('click', enviar);

  async function enviar() {
    if (isSending) return;
    isSending = true;

    const toastOk  = root.querySelector('[data-toast-ok]');
    const errorNet = root.querySelector('[data-error-net]');
    toastOk.classList.remove('show');
    errorNet.classList.remove('show');
    errorNet.innerHTML = '';
    btnSubmit.disabled = true;

    try {
      /* 1 — Casa */
      const cadastradorComposto = await obterCadastradorMock();
      const vulnerabilidades = await apiFetch('/vulnerabilidades');
      const porTipo = new Map(vulnerabilidades.map((v) => [v.tipo_vulnerabilidade, v.id]));
      const vulnerabilidades_por_individuo = {};
      const individuos = state.membros.map((m, indice) => {
        const { vulns, ...individuo } = m;
        vulnerabilidades_por_individuo[indice] = (vulns || []).map((nome) => {
          const id = porTipo.get(nome);
          if (!id) throw new Error(`Vulnerabilidade nao configurada no banco: ${nome}`);
          return id;
        });
        return { ...individuo, status_vital: individuo.status_vital || 'Vivo' };
      });
      const resultado = await apiFetch('/cadastros-completos', {
        method: 'POST',
        headers: { 'Idempotency-Key': (idempotencyKey ??= crypto.randomUUID()) },
        body: JSON.stringify({
          casa: {
            id_setor: Number(val('m_setor')), coordenada_lat: state.gpsLat, coordenada_long: state.gpsLng,
            logradouro: val('m_logradouro') || null, numero: val('m_numero') || null, bairro: val('m_bairro') || null,
            tipo_construcao: val('m_tipo_construcao'), uso_imovel: val('m_uso_imovel'),
            status_imovel: val('m_status_imovel') || 'Sadio',
            cep: val('m_cep').replace(/\D/g, '') || null,
            observacao: val('m_observacao_imovel') || null,
            data_interdicao: val('m_data_interdicao') || null,
            foto_fachada_url: val('m_foto_fachada_url') || null,
            foto_detalhe_url: val('m_foto_detalhe_url') || null,
          },
          nucleo_familiar: {
            nome_nucleo: val('m_nome_nucleo'), id_cadastrador: cadastradorComposto.id,
            renda_familiar_total: val('m_renda_familiar') ? Number(val('m_renda_familiar')) : null,
            observacao: val('m_observacao_nucleo') || null,
            tempo_residencia_domicilio: val('m_tempo_residencia_domicilio') ? Number(val('m_tempo_residencia_domicilio')) : null,
            tempo_residencia_area: val('m_tempo_residencia_area') ? Number(val('m_tempo_residencia_area')) : null,
            tempo_residencia_municipio: val('m_tempo_residencia_municipio') ? Number(val('m_tempo_residencia_municipio')) : null,
          },
          individuos, responsavel_indice: state.chefeIdx, pets: state.pets, vulnerabilidades_por_individuo,
        }),
      });
      toastOk.classList.add('show');
      savePill.classList.add('show');
      const protocolo = root.querySelector('[data-success-proto]');
      const descricao = root.querySelector('[data-success-desc]');
      if (protocolo) protocolo.textContent = `Protocolo: NF-${String(resultado.nucleo_familiar_id).padStart(6, '0')}`;
      if (descricao) descricao.textContent = `${val('m_nome_nucleo')} foi cadastrado com ${state.membros.length} membro(s).`;
      setTimeout(() => showStep(7), 700);
    } catch (err) {
      errorNet.innerHTML = `Falha ao enviar: <strong>${esc(err.message)}</strong>. O cadastro não foi concluído e nenhuma alteração parcial foi confirmada.`;
      errorNet.classList.add('show');
    } finally {
      isSending = false;
      btnSubmit.disabled = false;
    }
  }

  /* ── reset / navegação pós-sucesso ───────────────────────────────── */

  root.querySelector('[data-novo-cadastro]').addEventListener('click', resetForm);
  root.querySelector('[data-ir-analise-dados]').addEventListener('click', () => {
    const isAgente = Auth.getUser()?.role === 'agente';
    window.location.href = isAgente ? '/agente/cadastro' : '/admin/analise-dados';
  });

  function resetForm() {
    idempotencyKey = null;
    state.gpsLat   = null;
    state.gpsLng   = null;
    state.membros  = [];
    state.chefeIdx = null;
    state.pets     = [];

    root.querySelectorAll('input:not([type="hidden"]), select').forEach((el) => { el.value = ''; });
    ['m_foto_fachada_url', 'm_foto_detalhe_url', 'mf_foto_url', 'pf_imagem'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('m_status_imovel').value = 'Sadio';
    root.querySelectorAll('[data-image-upload]').forEach((input) => { input.value = ''; });
    document.getElementById('m_field_data_interdicao').hidden = true;
    document.getElementById('mf_status_vital').value = 'Vivo';
    document.getElementById('mf_field_data_obito').hidden = true;
    root.querySelector('[data-map]').classList.add('is-empty');
    const gpsBadge = root.querySelector('[data-gps-badge]');
    gpsBadge.classList.remove('show');
    gpsBadge.textContent = '✓ GPS capturado com precisão';
    const gpsBtn = root.querySelector('[data-gps-capture]');
    gpsBtn.querySelector('.label').textContent = 'Capturar GPS automaticamente';
    gpsBtn.style.background = '';

    root.querySelector('[data-membros-list]').innerHTML = '';
    root.querySelector('[data-membro-form-title]').textContent = 'Adicionar 1º membro';
    root.querySelectorAll('[data-mf]').forEach((f) => f.classList.remove('is-invalid'));
    root.querySelector('[data-chefe-list]').innerHTML = '';
    root.querySelector('[data-pets-list]').innerHTML = '';
    root.querySelector('[data-revisao-content]').innerHTML = '';
    root.querySelector('[data-toast-ok]').classList.remove('show');
    root.querySelector('[data-error-net]').classList.remove('show');
    root.querySelector('[data-error-net]').innerHTML = '';

    loadSetores();
    currentStep = 1;
    showStep(1);
  }

  /* ── init ────────────────────────────────────────────────────────── */
  loadSetores();
  bindImageUploads();
  showStep(1);
})();
