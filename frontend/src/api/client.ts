/**
 * Central API Client for FitPlaner
 * Resolves API endpoints dynamically across:
 * 1. PC Server Mode (with Ping / DHCP Subnet Auto-Discovery)
 * 2. 100% Autarker Smartphone-Betrieb ("Kein-Server-Betrieb" via Embedded Backend & IndexedDB)
 */

import { embeddedBackend } from '../backend_embedded/embeddedBackend';
import { discoverFitPlanerServer, DiscoveredServer } from './discovery';

const DEFAULT_LAN_HOST = 'http://192.168.178.57:8090';
const STORAGE_KEY = 'fitplaner_server_url';
const MODE_KEY = 'fitplaner_app_mode';

export type AppMode = 'server' | 'standalone';

let isAutoDiscovering = false;

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const isCap = !!(window as any).Capacitor;
  const isLocalhostScheme =
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port === '' && isCap);
  return isCap || isLocalhostScheme;
}

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'server';
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'standalone' || saved === 'server') {
    return saved as AppMode;
  }
  return 'server';
}

export function setAppMode(mode: AppMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent('fitplaner_mode_changed', { detail: { mode } }));
}

export function getServerUrl(): string {
  if (typeof window === 'undefined') return '';

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return saved.replace(/\/+$/, '');
  }

  if (isCapacitorNative()) {
    return DEFAULT_LAN_HOST;
  }

  return '';
}

export function setServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    const normalized =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `http://${trimmed}`;
    localStorage.setItem(STORAGE_KEY, normalized);
  }
  window.dispatchEvent(new Event('fitplaner_server_changed'));
}

export async function checkServerConnection(
  targetUrl?: string
): Promise<{ ok: boolean; message?: string }> {
  const base = (targetUrl !== undefined ? targetUrl : getServerUrl()).replace(/\/+$/, '');
  const testEndpoint = `${base}/api/settings`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(testEndpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return { ok: true, message: 'Verbunden' };
      }
      return { ok: false, message: 'Server liefert kein JSON' };
    }
    return { ok: false, message: `HTTP Fehler ${res.status}` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { ok: false, message: 'Zeitüberschreitung (Timeout)' };
    }
    return { ok: false, message: err.message || 'Verbindung fehlgeschlagen' };
  }
}

/**
 * Triggers background subnet ping discovery if the PC server IP changed.
 */
export async function triggerBackgroundDiscovery(): Promise<DiscoveredServer | null> {
  if (isAutoDiscovering) return null;
  isAutoDiscovering = true;
  try {
    const current = getServerUrl();
    const server = await discoverFitPlanerServer(current);
    if (server && server.url !== current) {
      console.log(`[Auto-Discovery] Server found at new IP: ${server.url}`);
      setServerUrl(server.url);
    }
    return server;
  } finally {
    isAutoDiscovering = false;
  }
}

/**
 * Universal apiFetch:
 * Routes to embeddedBackend (if standalone mode) or to PC Server (with automatic fallback).
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const mode = getAppMode();

  // 1. Explicit Standalone Mode (Kein-Server-Betrieb auf dem Smartphone)
  if (mode === 'standalone') {
    return embeddedBackend.handleRequest(path, options);
  }

  // 2. Server Mode
  const base = getServerUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = base ? `${base}${cleanPath}` : cleanPath;

  // Add timeout controller for resilient failover
  const controller = new AbortController();
  const timeoutMs = options?.method && options.method !== 'GET' ? 8000 : 3500;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedOptions: RequestInit = {
    ...options,
    signal: options?.signal || controller.signal,
  };

  try {
    const response = await fetch(fullUrl, mergedOptions);
    clearTimeout(timeoutId);

    if (response.ok) {
      return response;
    }

    // If server responded with 404/500, fallback to embedded backend
    console.warn(`[FitPlaner API] Server returned ${response.status} for ${cleanPath}, falling back to local engine.`);
    return embeddedBackend.handleRequest(path, options);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[FitPlaner API] Network connection failed for ${fullUrl}:`, err);

    // Run silent auto-discovery in background to find new IP
    triggerBackgroundDiscovery().catch(() => {});

    // Seamless failover: serve request directly from phone's embedded backend!
    return embeddedBackend.handleRequest(path, options);
  }
}

/**
 * Bidirectional Sync between Smartphone IndexedDB and PC Host Server.
 */
export async function syncDataWithServer(): Promise<{ ok: boolean; message: string }> {
  try {
    const serverUrl = getServerUrl();
    if (!serverUrl) return { ok: false, message: 'Keine Server-URL konfiguriert.' };

    const statusCheck = await checkServerConnection(serverUrl);
    if (!statusCheck.ok) {
      return { ok: false, message: `Server nicht erreichbar: ${statusCheck.message}` };
    }

    // Pull from server
    const pullRes = await fetch(`${serverUrl}/api/sync/mesh-pull`, {
      headers: { Accept: 'application/json' },
    });
    if (pullRes.ok) {
      const serverPacket = await pullRes.json();
      // Import into local embedded backend
      await embeddedBackend.handleRequest('/api/sync/mesh-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverPacket),
      });
      return { ok: true, message: 'Daten erfolgreich synchronisiert!' };
    }
    return { ok: false, message: `Server Sync Fehler (${pullRes.status})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Synchronisationsfehler' };
  }
}
