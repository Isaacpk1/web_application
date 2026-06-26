/* ==========================================================================
   api.js — utilitários compartilhados de autenticação e chamadas à API
   Conecta o frontend (EJS) aos endpoints JWT em /api/v1/*
   ========================================================================== */

const TOKEN_KEY = 'georisco_token';
const USER_KEY = 'georisco_usuario';
const API_BASE = '/api/v1';

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  },
  setSession(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario || {}));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  /** Redireciona para /login se não houver token. Usar no topo de páginas protegidas. */
  guard() {
    if (!this.getToken()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  },
  async logout() {
    const token = this.getToken();
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignora falha de rede no logout */
    } finally {
      this.clear();
      window.location.href = '/login';
    }
  },
};

/**
 * Wrapper de fetch que injeta o token JWT e trata a resposta padronizada
 * da API ({ success, data, error }). Lança Error com a mensagem da API.
 */
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Sessão expirada → volta para login
  if (res.status === 401) {
    Auth.clear();
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!res.ok) {
    const message = (body && (body.error || body.message)) || `Erro ${res.status}`;
    throw new Error(message);
  }

  // A API responde { success, message, data } — devolvemos data quando existir.
  return body && 'data' in body ? body.data : body;
}

async function apiUploadImage(file, categoria) {
  const token = Auth.getToken();
  const formData = new FormData();
  formData.append('imagem', file);
  formData.append('categoria', categoria);

  const res = await fetch(`${API_BASE}/uploads/imagens`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (res.status === 401) {
    Auth.clear();
    window.location.href = '/login';
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body && (body.error || body.message)) || `Erro ${res.status}`;
    throw new Error(message);
  }

  return body && 'data' in body ? body.data : body;
}

/* ---------------------------------------------------------------------------
   UI helpers compartilhados
   --------------------------------------------------------------------------- */

function nivelRiscoBadge(nivel) {
  const n = (nivel || 'BAIXO').toUpperCase();
  const labels = { MUITO_ALTO: 'MUITO_ALTO', ALTO: 'ALTO', MEDIO: 'MÉDIO', BAIXO: 'BAIXO' };
  return `<span class="badge badge--${n.toLowerCase()}">${labels[n] || nivel || '—'}</span>`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

/* ---------------------------------------------------------------------------
   Toast helper
   --------------------------------------------------------------------------- */
function showToast(message, type = 'info', timeout = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), timeout);
}

const Theme = {
  STORAGE_KEY: 'georisco_theme',

  get() {
    const value = localStorage.getItem(this.STORAGE_KEY);
    return value === 'dark' ? 'dark' : 'light';
  },

  set(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(this.STORAGE_KEY, normalized);
    this.apply(normalized);
  },

  toggle() {
    this.set(this.get() === 'dark' ? 'light' : 'dark');
  },

  apply(theme = this.get()) {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Modo claro' : 'Modo escuro');
    }
  },
};

/* ---------------------------------------------------------------------------
   Navbar: liga logout, menu mobile e nome do usuário (executa em toda página
   que inclui a navbar)
   --------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const userEl = document.querySelector('[data-nav-name]');
  if (userEl) {
    const user = Auth.getUser();
    userEl.textContent = user && user.email ? user.email : '';
  }

  const logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  const themeButton = document.querySelector('[data-theme-toggle]');
  if (themeButton) {
    themeButton.addEventListener('click', () => Theme.toggle());
  }

  Theme.apply();
});
