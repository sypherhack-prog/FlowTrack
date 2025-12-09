// browser-extension/options.js
// Page d'options pour configurer l'extension FlowTrack et récupérer un token JWT.

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  trackingEnabled: true,
  heartbeatIntervalSec: 30,
};

function $(id) {
  return document.getElementById(id);
}

function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => resolve(items));
  });
}

function loadAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ token: null }, (items) => resolve(items.token));
  });
}

function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, () => resolve());
  });
}

function saveToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ token }, () => resolve());
  });
}

function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('token', () => resolve());
  });
}

function setStatus(message, type) {
  const el = $('status');
  if (!el) return;
  el.textContent = message || '';
  el.className = 'status ' + (type || '');
}

async function init() {
  const baseUrlInput = $('baseUrl');
  const emailInput = $('email');
  const passwordInput = $('password');
  const trackingEnabledInput = $('trackingEnabled');
  const intervalInput = $('interval');
  const loginBtn = $('loginBtn');
  const clearTokenBtn = $('clearTokenBtn');
  const saveBtn = $('saveBtn');

  const config = await loadConfig();
  const token = await loadAuth();

  if (baseUrlInput) baseUrlInput.value = config.baseUrl || '';
  if (trackingEnabledInput) trackingEnabledInput.checked = !!config.trackingEnabled;
  if (intervalInput) intervalInput.value = String(config.heartbeatIntervalSec || 30);

  if (token) {
    setStatus('Extension connectée à FlowTrack.', 'success');
  } else {
    setStatus('Veuillez vous connecter avec votre compte FlowTrack.', '');
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const baseUrl = baseUrlInput?.value?.trim();
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value || '';

      if (!baseUrl || !email || !password) {
        setStatus('URL, email et mot de passe sont requis.', 'error');
        return;
      }

      setStatus('Connexion en cours…');
      loginBtn.disabled = true;

      try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Connexion impossible');
        }

        await saveToken(data.token);
        setStatus('Connecté à FlowTrack. Le suivi peut démarrer.', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de connexion';
        setStatus(message, 'error');
      } finally {
        loginBtn.disabled = false;
      }
    });
  }

  if (clearTokenBtn) {
    clearTokenBtn.addEventListener('click', async () => {
      await clearToken();
      setStatus("Token effacé. L'extension n'est plus connectée.", '');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const baseUrl = baseUrlInput?.value?.trim() || DEFAULT_CONFIG.baseUrl;
      const trackingEnabled = !!trackingEnabledInput?.checked;
      const raw = intervalInput?.value || String(DEFAULT_CONFIG.heartbeatIntervalSec);
      const interval = Math.max(10, parseInt(raw, 10) || DEFAULT_CONFIG.heartbeatIntervalSec);

      await saveConfig({
        baseUrl,
        trackingEnabled,
        heartbeatIntervalSec: interval,
      });

      setStatus('Configuration enregistrée.', 'success');
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
