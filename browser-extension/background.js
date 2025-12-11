// browser-extension/background.js
// Service worker MV3 pour l'agent navigateur FlowTrack.

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  trackingEnabled: true,
  heartbeatIntervalSec: 30,
};

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'netflix.com',
  'twitter.com',
  'x.com',
];

let cachedBlockedSites = null;

function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      resolve(items);
    });
  });
}

async function loadBlockedSites() {
  if (cachedBlockedSites) return cachedBlockedSites;

  const [config, token] = await Promise.all([loadConfig(), loadAuth()]);
  if (!config.trackingEnabled) {
    cachedBlockedSites = DEFAULT_BLOCKED_SITES;
    return cachedBlockedSites;
  }

  const baseUrl = (config.baseUrl || '').trim();
  if (!baseUrl) {
    cachedBlockedSites = DEFAULT_BLOCKED_SITES;
    return cachedBlockedSites;
  }

  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/api/track/blocked-sites`, {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    const sites = Array.isArray(data.sites) ? data.sites : DEFAULT_BLOCKED_SITES;
    cachedBlockedSites = sites;
    return cachedBlockedSites;
  } catch (e) {
    cachedBlockedSites = DEFAULT_BLOCKED_SITES;
    return cachedBlockedSites;
  }
}

function loadAuth() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get({ token: null }, (items) => {
        if (!items || typeof items.token !== 'string') {
          resolve(null);
          return;
        }
        resolve(items.token);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

async function sendHeartbeat(level, tab) {
  const [config, token] = await Promise.all([loadConfig(), loadAuth()]);
  if (!config.trackingEnabled || !token) return;

  const baseUrl = (config.baseUrl || '').trim();
  if (!baseUrl) return;

  const url = tab?.url || undefined;
  const title = tab?.title || undefined;

  try {
    await fetch(`${baseUrl}/api/track/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ level, url, title }),
    });
  } catch (e) {
    // On reste silencieux côté extension pour éviter le spam dans la console.
  }
}

async function sendBlockedEvent(tab) {
  const [config, token] = await Promise.all([loadConfig(), loadAuth()]);
  if (!config.trackingEnabled || !token) return;

  const baseUrl = (config.baseUrl || '').trim();
  if (!baseUrl || !tab?.url) return;

  try {
    await fetch(`${baseUrl}/api/track/blocked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: tab.url }),
    });
  } catch (e) {
    // silencieux
  }
}

async function isBlockedUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname || '';
    const sites = await loadBlockedSites();
    return sites.some((site) => host.includes(site));
  } catch {
    return false;
  }
}

async function handleTabActivity(tab) {
  if (!tab || !tab.url) return;

  try {
    await sendHeartbeat('active', tab);

    if (await isBlockedUrl(tab.url)) {
      await sendBlockedEvent(tab);
    }
  } catch (e) {
    // silencieux
  }
}

async function handleHeartbeatAlarm() {
  const config = await loadConfig();
  if (!config.trackingEnabled) return;

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) return;
    await handleTabActivity(tab);
  });
}

function scheduleHeartbeat(config) {
  chrome.alarms.clear('flowtrack-heartbeat', () => {
    if (!config.trackingEnabled) return;
    const periodInMinutes = Math.max(0.1, (config.heartbeatIntervalSec || 30) / 60);
    chrome.alarms.create('flowtrack-heartbeat', { periodInMinutes });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadConfig();
  scheduleHeartbeat(config);
});

chrome.runtime.onStartup.addListener(async () => {
  const config = await loadConfig();
  scheduleHeartbeat(config);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flowtrack-heartbeat') {
    handleHeartbeatAlarm();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) {
    handleTabActivity(tab);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) {
      return;
    }
    handleTabActivity(tab);
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.trackingEnabled) {
    loadConfig().then((config) => scheduleHeartbeat(config));
  }
});
