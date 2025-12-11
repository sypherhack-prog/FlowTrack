import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    flowtrackAgent?: {
      version?: string;
      captureScreen?: () => Promise<ArrayBuffer | null>;
    };
  }
}

type ActivityLevel = 'active' | 'idle' | 'away';

interface AuthState {
  baseUrl: string;
  email: string;
  password: string;
  token: string | null;
}

const loadPersisted = (): Pick<AuthState, 'baseUrl' | 'email'> => {
  try {
    const baseUrl = localStorage.getItem('flowtrack.baseUrl') || 'http://localhost:3000';
    const email = localStorage.getItem('flowtrack.email') || '';
    return { baseUrl, email };
  } catch {
    return { baseUrl: 'http://localhost:3000', email: '' };
  }
};

const persistBaseAndEmail = (baseUrl: string, email: string) => {
  try {
    if (baseUrl) localStorage.setItem('flowtrack.baseUrl', baseUrl);
    if (email) localStorage.setItem('flowtrack.email', email);
  } catch {
    // ignore
  }
};

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

const sendHeartbeat = async (baseUrl: string, token: string, level: ActivityLevel) => {
  if (!baseUrl || !token) return;

  try {
    await fetch(`${baseUrl}/api/track/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ level }),
      keepalive: true,
    });
  } catch {
    // silencieux côté agent
  }
};

const App: React.FC = () => {
  const initial = loadPersisted();
  const [auth, setAuth] = useState<AuthState>({
    baseUrl: initial.baseUrl,
    email: initial.email,
    password: '',
    token: null,
  });

  const [projectId, setProjectId] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [activity, setActivity] = useState<ActivityLevel>('idle');
  const [status, setStatus] = useState<{ message: string; kind: 'info' | 'error' | 'success' | null }>(
    { message: '', kind: null },
  );

  useEffect(() => {
    let lastActivityTs = Date.now();

    const handler = () => {
      lastActivityTs = Date.now();
    };

    window.addEventListener('mousemove', handler, { passive: true });
    window.addEventListener('keydown', handler, { passive: true });

    let interval: number | undefined;

    if (isTracking) {
      interval = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
        const now = Date.now();
        const since = now - lastActivityTs;
        const level: ActivityLevel = since > 60_000 ? 'idle' : 'active';
        setActivity(level);
      }, 1000);
    }

    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('keydown', handler);
      if (interval) window.clearInterval(interval);
    };
  }, [isTracking]);

  useEffect(() => {
    let hbInterval: number | undefined;

    if (isTracking && auth.token) {
      hbInterval = window.setInterval(() => {
        const level = activity;
        void sendHeartbeat(auth.baseUrl, auth.token!, level);
      }, 5_000);
    }

    return () => {
      if (hbInterval) window.clearInterval(hbInterval);
    };
  }, [isTracking, auth.baseUrl, auth.token, activity]);

  // Captures d'écran périodiques côté desktop pendant le suivi
  useEffect(() => {
    if (!isTracking || !auth.token || !window.flowtrackAgent?.captureScreen) return;

    // Log léger pour vérifier que l'effet de capture est actif
    // côté agent pendant le debug.
    // eslint-disable-next-line no-console
    console.log('[FlowTrack Agent] Desktop capture effect active', {
      isTracking,
      hasToken: !!auth.token,
      hasCapture: !!window.flowtrackAgent?.captureScreen,
    });

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const data = await window.flowtrackAgent!.captureScreen!();

        // eslint-disable-next-line no-console
        console.log('[FlowTrack Agent] captureScreen result', { hasData: !!data });

        if (!data || cancelled) return;

        const blob = new Blob([data], { type: 'image/png' });
        const form = new FormData();
        form.append('screenshot', blob, 'desktop-screen.png');
        form.append('url', 'desktop://screen');
        form.append('title', 'FlowTrack Desktop Agent');

        await fetch(`${auth.baseUrl}/api/track/screenshot`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: form,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FlowTrack Agent] Failed to send desktop screenshot', err);
      }
    }, 10_000); // toutes les 10s pour une timeline plus détaillée

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isTracking, auth.baseUrl, auth.token]);

  const setStatusMessage = (message: string, kind: 'info' | 'error' | 'success' | null = null) => {
    setStatus({ message, kind });
  };

  const handleLogin = async () => {
    const baseUrl = auth.baseUrl.trim();
    const email = auth.email.trim();
    const password = auth.password;

    if (!baseUrl || !email || !password) {
      setStatusMessage('Veuillez renseigner URL, email et mot de passe.', 'error');
      return;
    }

    persistBaseAndEmail(baseUrl, email);
    setStatusMessage('Connexion en cours…', 'info');

    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        const httpInfo = !res.ok ? ` (HTTP ${res.status})` : '';
        const msg = data.error || `Connexion impossible${httpInfo}`;
        throw new Error(msg);
      }

      const token = data.token as string;
      setAuth((prev) => ({ ...prev, token }));
      setStatusMessage('Connecté à FlowTrack.', 'success');
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        setStatusMessage('Impossible de joindre le serveur FlowTrack (échec réseau ou CORS).', 'error');
      } else {
        const message = err instanceof Error ? err.message : 'Erreur de connexion';
        setStatusMessage(message, 'error');
      }
    }
  };

  const handleLogout = () => {
    setAuth((prev) => ({ ...prev, token: null }));
    setIsTracking(false);
    setSeconds(0);
    setActivity('idle');
    setStatusMessage('Déconnecté.', 'success');
  };

  const handleTestCapture = async () => {
    if (!auth.token || !auth.baseUrl.trim() || !window.flowtrackAgent?.captureScreen) return;

    const baseUrl = auth.baseUrl.trim();

    try {
      const data = await window.flowtrackAgent.captureScreen();

      if (!data) {
        setStatusMessage("Impossible de capturer l'écran (aucune source détectée).", 'error');
        return;
      }

      const blob = new Blob([data], { type: 'image/png' });
      const form = new FormData();
      form.append('screenshot', blob, 'desktop-test.png');
      form.append('url', 'desktop://screen');
      form.append('title', 'FlowTrack Desktop Agent (test)');

      const res = await fetch(`${baseUrl}/api/track/screenshot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: form,
      });

      if (!res.ok) {
        setStatusMessage(`Erreur lors de l'envoi de la capture test (HTTP ${res.status}).`, 'error');
        return;
      }

      setStatusMessage('Capture test envoyée avec succès.', 'success');
    } catch {
      setStatusMessage('Erreur lors de la capture test.', 'error');
    }
  };

  const handleToggleTracking = async () => {
    if (!auth.token) return;
    const baseUrl = auth.baseUrl.trim();
    if (!baseUrl) return;

    if (!isTracking) {
      const pid = projectId.trim() || 'desktop-agent';
      try {
        await fetch(`${baseUrl}/api/track/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ projectId: pid }),
        });
        setSeconds(0);
        setActivity('active');
        setIsTracking(true);
        setStatusMessage('Suivi démarré.', 'success');
      } catch {
        setStatusMessage("Impossible de démarrer le suivi", 'error');
      }
    } else {
      try {
        await fetch(`${baseUrl}/api/track/stop`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
      } catch {
        // on ignore l'erreur de stop
      }
      setIsTracking(false);
      setActivity('idle');
      setStatusMessage('Suivi arrêté.', 'success');
    }
  };

  const badgeClass =
    activity === 'active'
      ? 'badge badge-green'
      : activity === 'idle'
      ? 'badge badge-yellow'
      : 'badge badge-red';

  const badgeLabel = activity === 'active' ? 'Active' : activity === 'idle' ? 'Idle' : 'Away';

  return (
    <div className="card">
      <div style={{ marginBottom: 12 }}>
        <div className="title">FlowTrack Agent</div>
        <div className="subtitle">Suivi du temps & activité depuis votre poste.</div>
      </div>

      {status.message && (
        <div className={status.kind === 'error' ? 'error' : 'success'}>{status.message}</div>
      )}

      {!auth.token ? (
        <div id="auth-zone">
          <div className="field">
            <label>URL FlowTrack</label>
            <input
              id="baseUrl"
              type="text"
              value={auth.baseUrl}
              onChange={(e) => setAuth((prev) => ({ ...prev, baseUrl: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              id="email"
              type="email"
              value={auth.email}
              onChange={(e) => setAuth((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              id="password"
              type="password"
              value={auth.password}
              onChange={(e) => setAuth((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <button id="loginBtn" className="btn btn-primary" onClick={handleLogin}>
            Se connecter à FlowTrack
          </button>
        </div>
      ) : (
        <div id="tracker-zone" style={{ marginTop: 8 }}>
          <div className="field">
            <label>Projet / tâche</label>
            <input
              id="projectId"
              type="text"
              placeholder="ID du projet ou nom de tâche"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '10px 0',
            }}
          >
            <div>
              <div className="small">Temps suivi</div>
              <div id="timer" className="timer">
                {formatTime(seconds)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="small">État</div>
              <div id="activityBadge" className={badgeClass}>
                {badgeLabel}
              </div>
            </div>
          </div>
          <button id="toggleBtn" className="btn btn-primary" onClick={handleToggleTracking}>
            {isTracking ? 'Arrêter le suivi' : 'Démarrer le suivi'}
          </button>
          <div style={{ marginTop: 6 }} className="small">
            Les données sont envoyées à votre espace FlowTrack toutes les quelques secondes.
          </div>
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: 'auto', paddingInline: 8, fontSize: 11, marginRight: 8 }}
              onClick={handleTestCapture}
            >
              Test capture
            </button>
            <button
              id="logoutBtn"
              className="btn btn-ghost"
              style={{ width: 'auto', paddingInline: 8, fontSize: 11 }}
              onClick={handleLogout}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
