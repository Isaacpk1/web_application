(function () {
  if (!Auth.guard()) return;

  const COLORS = { MUITO_ALTO: '#EF4444', ALTO: '#F97316', MEDIO: '#22C55E', BAIXO: '#6B7280' };
  const SANTO_ANDRE = [-23.6647, -46.5294];

  const map = L.map('leaflet-map', { center: SANTO_ANDRE, zoom: 13, zoomControl: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  let markers = [];

  function makeIcon(nivel) {
    const color = COLORS[nivel] || '#6B7280';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2.5"/>
      <path d="M12 22 L12 32" stroke="${color}" stroke-width="2"/>
    </svg>`;
    return L.divIcon({
      html: svg, className: '', iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -32],
    });
  }

  function popupHtml(p) {
    const badgeColor = COLORS[p.nivel_risco] || '#6B7280';
    return `<div class="map-popup">
      <h3>${p.nome_familia}</h3>
      <div class="map-popup-row"><span>Bairro:</span><span>${p.bairro}</span></div>
      <div class="map-popup-row"><span>Responsável:</span><span>${p.responsavel}</span></div>
      <div class="map-popup-row"><span>Nível de risco:</span>
        <span style="background:${badgeColor};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${p.nivel_risco}</span>
      </div>
      <a class="map-popup-btn" href="/familias?id=${encodeURIComponent(p.id)}">Ver cadastro →</a>
    </div>`;
  }

  async function loadPins() {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
    const params = new URLSearchParams();
    const genero = document.getElementById('f-genero').value;
    const bairro = document.getElementById('f-bairro').value;
    const tipo   = document.getElementById('f-tipo').value;
    const nivel  = document.getElementById('f-nivel').value;
    if (genero) params.set('genero', genero);
    if (bairro) params.set('bairro', bairro);
    if (tipo)   params.set('tipo_construcao', tipo);
    if (nivel)  params.set('nivel_risco', nivel);

    try {
      const data = await apiFetch(`/cadastros/mapa?${params}`);
      atualizarBairros(data.pontos || []);
      (data.pontos || []).forEach((p) => {
        const m = L.marker([p.lat, p.lng], { icon: makeIcon(p.nivel_risco) })
          .bindPopup(popupHtml(p), { maxWidth: 260 })
          .addTo(map);
        markers.push(m);
      });
    } catch (err) {
      showToast('Erro ao carregar pontos do mapa.', 'error');
    }
  }

  function atualizarBairros(pontos) {
    const select = document.getElementById('f-bairro');
    const selecionado = select.value;
    const bairros = [...new Set(pontos.map((p) => p.bairro).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todos os bairros</option>';
    bairros.forEach((bairro) => {
      const option = document.createElement('option');
      option.value = bairro;
      option.textContent = bairro;
      select.appendChild(option);
    });
    select.value = bairros.includes(selecionado) ? selecionado : '';
  }

  document.getElementById('btn-apply').addEventListener('click', loadPins);
  document.getElementById('btn-clear').addEventListener('click', () => {
    ['f-genero', 'f-bairro', 'f-tipo', 'f-nivel'].forEach((id) => { document.getElementById(id).value = ''; });
    loadPins();
  });

  loadPins();
})();
