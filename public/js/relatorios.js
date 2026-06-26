(function () {
  if (!Auth.guard()) return;

  const reportConfig = {
    bairro: {
      title: 'Cadastros por Bairro',
      filename: 'cadastros-por-bairro',
      buildRows(items) {
        const porBairro = new Map();
        items.forEach((item) => {
          const bairro = item.bairro || 'Sem bairro';
          const atual = porBairro.get(bairro) || { total: 0, alto: 0, muitoAlto: 0, completo: 0 };
          atual.total += 1;
          if (item.nivel_risco === 'ALTO') atual.alto += 1;
          if (item.nivel_risco === 'MUITO_ALTO') atual.muitoAlto += 1;
          if (item.cadastro_completo) atual.completo += 1;
          porBairro.set(bairro, atual);
        });

        return {
          columns: ['Bairro', 'Total', 'Alto', 'Muito alto', 'Completos'],
          rows: [...porBairro.entries()].map(([bairro, dados]) => [bairro, dados.total, dados.alto, dados.muitoAlto, dados.completo]),
        };
      },
    },
    risco: {
      title: 'Familias em Risco',
      filename: 'familias-em-risco',
      buildRows(items) {
        const filtrados = items.filter((item) => ['ALTO', 'MUITO_ALTO'].includes(item.nivel_risco));
        return {
          columns: ['Familia', 'Responsavel', 'Setor', 'Endereco', 'Bairro', 'Risco', 'Membros'],
          rows: filtrados.map((item) => [
            item.nome_familia,
            item.nome_responsavel,
            item.codigo_setor,
            [item.logradouro, item.numero].filter(Boolean).join(', '),
            item.bairro,
            item.nivel_risco,
            item.qtd_membros,
          ]),
        };
      },
    },
    completude: {
      title: 'Completude de Cadastros',
      filename: 'completude-cadastros',
      buildRows(items) {
        return {
          columns: ['Familia', 'Responsavel', 'Bairro', 'Membros', 'Status'],
          rows: items.map((item) => [
            item.nome_familia,
            item.nome_responsavel,
            item.bairro,
            item.qtd_membros,
            item.cadastro_completo ? 'Completo' : 'Incompleto',
          ]),
        };
      },
    },
    vulnerabilidades: {
      title: 'Vulnerabilidades por Setor',
      filename: 'vulnerabilidades-por-setor',
      buildRows(items) {
        const porSetor = new Map();
        items.forEach((item) => {
          const setor = item.codigo_setor || 'Sem setor';
          const atual = porSetor.get(setor) || { total: 0, alta: 0, media: 0, baixa: 0 };
          atual.total += 1;
          if (item.prioridade_vulnerabilidade === 'ALTA') atual.alta += 1;
          if (item.prioridade_vulnerabilidade === 'MEDIA') atual.media += 1;
          if (item.prioridade_vulnerabilidade === 'BAIXA') atual.baixa += 1;
          porSetor.set(setor, atual);
        });

        return {
          columns: ['Setor', 'Total familias', 'Prioridade alta', 'Prioridade media', 'Prioridade baixa'],
          rows: [...porSetor.entries()].map(([setor, dados]) => [setor, dados.total, dados.alta, dados.media, dados.baixa]),
        };
      },
    },
  };

  async function fetchCadastros() {
    const data = await apiFetch('/cadastros/busca?page=1&limit=10000');
    return data.resultados || [];
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function tableHtml(report) {
    const head = report.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
    const body = report.rows
      .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`)
      .join('');
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel(config, report) {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h1>${escapeHtml(config.title)}</h1>${tableHtml(report)}</body></html>`;
    download(`${config.filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
  }

  function exportPdf(config, report) {
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Permita pop-ups para exportar o PDF.', 'error');
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(config.title)}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111827}h1{font-size:20px;margin:0 0 16px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d1d5db;padding:6px;text-align:left}th{background:#f3f4f6}@media print{@page{size:landscape;margin:12mm}}</style></head><body><h1>${escapeHtml(config.title)}</h1>${tableHtml(report)}<script>window.onload=function(){window.print();};<\/script></body></html>`);
    win.document.close();
  }

  async function handleExport(reportType, format) {
    const config = reportConfig[reportType];
    if (!config) return;

    try {
      const items = await fetchCadastros();
      const report = config.buildRows(items);
      if (report.rows.length === 0) {
        showToast('Nao ha dados para exportar neste relatorio.', 'info');
        return;
      }
      if (format === 'excel') exportExcel(config, report);
      if (format === 'pdf') exportPdf(config, report);
    } catch (error) {
      showToast(error.message || 'Nao foi possivel exportar o relatorio.', 'error');
    }
  }

  document.querySelectorAll('[data-report-actions]').forEach((group) => {
    group.querySelectorAll('[data-export-format]').forEach((button) => {
      button.addEventListener('click', () => handleExport(group.dataset.reportActions, button.dataset.exportFormat));
    });
  });
})();
