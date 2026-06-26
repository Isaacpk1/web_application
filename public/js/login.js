function destinoPosLogin(usuario) {
  const role = String(usuario?.role || '').toLowerCase();
  return role === 'agente' ? '/agente/cadastro' : '/admin/analise-dados';
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.clear();

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const toggleSenha = document.getElementById('toggleSenha');
  const alertErro = document.getElementById('alertErro');
  const alertErroTexto = document.getElementById('alertErroTexto');
  const btnEntrar = document.getElementById('btnEntrar');
  const btnLabel = btnEntrar?.querySelector('.btn-label');

  function showErro(message) {
    if (alertErroTexto) alertErroTexto.textContent = message;
    if (alertErro) alertErro.style.display = 'block';
    emailInput?.classList.add('field-error');
    senhaInput?.classList.add('field-error');
  }

  function clearErro() {
    if (alertErro) alertErro.style.display = 'none';
    emailInput?.classList.remove('field-error');
    senhaInput?.classList.remove('field-error');
  }

  toggleSenha?.addEventListener('click', () => {
    const showing = senhaInput.type === 'text';
    senhaInput.type = showing ? 'password' : 'text';
    toggleSenha.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErro();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      showErro('Preencha e-mail e senha para continuar.');
      return;
    }

    btnEntrar.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Entrando...';
    Auth.clear();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        throw new Error(body?.error || body?.message || 'Credenciais invalidas.');
      }

      Auth.setSession(body.data.token, body.data.usuario);
      window.location.href = destinoPosLogin(body.data.usuario);
    } catch (error) {
      showErro(error.message || 'Nao foi possivel fazer login.');
    } finally {
      btnEntrar.disabled = false;
      if (btnLabel) btnLabel.textContent = 'Entrar';
    }
  });
});
