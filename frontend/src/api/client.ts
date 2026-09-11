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
const AUTH_TOKEN_KEY = 'fitplaner_auth_token';
const PASSKEY_KEY = 'fitplaner_household_passkey';
const ACTIVE_MEMBER_KEY = 'fitplaner_active_member';

export type AppMode = 'server' | 'standalone';

let isAutoDiscovering = false;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getHouseholdPasskey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PASSKEY_KEY);
}

export function setHouseholdPasskey(passkey: string | null): void {
  if (typeof window === 'undefined') return;
  if (!passkey) {
    localStorage.removeItem(PASSKEY_KEY);
  } else {
    localStorage.setItem(PASSKEY_KEY, passkey.trim().toUpperCase());
  }
  window.dispatchEvent(new CustomEvent('fitplaner_passkey_changed', { detail: { passkey } }));
}

export function getActiveMember(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ACTIVE_MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveMember(member: any | null): void {
  if (typeof window === 'undefined') return;
  if (!member) {
    localStorage.removeItem(ACTIVE_MEMBER_KEY);
  } else {
    localStorage.setItem(ACTIVE_MEMBER_KEY, JSON.stringify(member));
  }
  window.dispatchEvent(new CustomEvent('fitplaner_member_changed', { detail: { member } }));
}

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
  if (!base) return { ok: false, message: 'Keine Server-Adresse eingegeben' };

  // Fast-path: check lightweight sync health ping
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const healthRes = await fetch(`${base}/api/sync/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    if (healthRes.ok) {
      return { ok: true, message: 'Verbunden (Peer-to-Peer Sync bereit)' };
    }
  } catch {
    clearTimeout(timeoutId);
  }

  // Fallback check to /api/settings
  const fallbackController = new AbortController();
  const fallbackTimeout = setTimeout(() => fallbackController.abort(), 2500);
  try {
    const res = await fetch(`${base}/api/settings`, {
      signal: fallbackController.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(fallbackTimeout);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return { ok: true, message: 'Verbunden' };
      }
      return { ok: false, message: 'Server liefert kein JSON' };
    }
    return { ok: false, message: `HTTP Fehler ${res.status}` };
  } catch (err: any) {
    clearTimeout(fallbackTimeout);
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

  const token = getAuthToken();
  const passkey = getHouseholdPasskey();

  const reqHeaders = new Headers(options?.headers || {});
  if (token && !reqHeaders.has('Authorization')) {
    reqHeaders.set('Authorization', `Bearer ${token}`);
  }
  if (passkey && !reqHeaders.has('X-Household-Passkey')) {
    reqHeaders.set('X-Household-Passkey', passkey);
  }

  const enrichedOptions: RequestInit = {
    ...options,
    headers: reqHeaders,
  };

  // 1. Explicit Standalone Mode (Kein-Server-Betrieb auf dem Smartphone)
  if (mode === 'standalone') {
    return embeddedBackend.handleRequest(path, enrichedOptions);
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
    ...enrichedOptions,
    signal: options?.signal || controller.signal,
  };

  try {
    const response = await fetch(fullUrl, mergedOptions);
    clearTimeout(timeoutId);

    // If 401/403, household or member is unauthorized - return response to trigger login/passkey prompt
    if (response.status === 401 || response.status === 403) {
      return response;
    }

    if (response.ok) {
      return response;
    }

    // If server responded with 404/500, fallback to embedded backend
    console.warn(`[FitPlaner API] Server returned ${response.status} for ${cleanPath}, falling back to local engine.`);
    return embeddedBackend.handleRequest(path, enrichedOptions);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[FitPlaner API] Network connection failed for ${fullUrl}:`, err);

    // Run silent auto-discovery in background to find new IP
    triggerBackgroundDiscovery().catch(() => {});

    // Seamless failover: serve request directly from phone's embedded backend!
    return embeddedBackend.handleRequest(path, enrichedOptions);
  }
}

/**
 * Bidirectional Peer-to-Peer Sync between Smartphone and PC Server.
 */
export async function syncDataWithServer(): Promise<{ ok: boolean; message: string }> {
  try {
    const { performBidirectionalSync } = await import('./syncManager');
    return await performBidirectionalSync();
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Synchronisationsfehler' };
  }
}

// -------------------------------------------------------------
// AUTH & HOUSEHOLD API METHODS
// -------------------------------------------------------------

export async function fetchHouseholdStatus(): Promise<{
  is_initialized: boolean;
  household_id?: string | null;
  household_name?: string | null;
  member_count: number;
  has_admin: boolean;
}> {
  const res = await apiFetch('/api/auth/household/status');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function createHouseholdApi(payload: {
  family_name: string;
  admin_name: string;
  username: string;
  password: string;
  pin?: string;
  device_id: string;
  device_name: string;
  demographics?: any;
}): Promise<any> {
  const res = await apiFetch('/api/auth/household/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Fehler beim Erstellen des Haushalts');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  if (data.household_passkey) setHouseholdPasskey(data.household_passkey);
  if (data.member) setActiveMember(data.member);
  return data;
}

export async function joinHouseholdApi(payload: {
  household_passkey: string;
  username: string;
  password?: string;
  pin?: string;
  device_id: string;
  device_name: string;
}): Promise<any> {
  const res = await apiFetch('/api/auth/household/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Fehler beim Beitreten des Haushalts');
  }
  const data = await res.json();
  if (payload.household_passkey) setHouseholdPasskey(payload.household_passkey);
  return data;
}

export async function loginApi(payload: {
  username: string;
  password?: string;
  pin?: string;
  device_id?: string;
  device_name?: string;
}): Promise<any> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Anmeldung fehlgeschlagen');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  if (data.member) setActiveMember(data.member);
  if (data.household?.household_passkey) setHouseholdPasskey(data.household.household_passkey);
  return data;
}

export async function fetchMeApi(): Promise<any> {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  setAuthToken(null);
  setActiveMember(null);
}

export async function fetchPublicMembersApi(): Promise<any[]> {
  const res = await apiFetch('/api/auth/household/members-list');
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchPairingInfoApi(): Promise<any> {
  const res = await apiFetch('/api/auth/household/pairing-info');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function adminResetMemberPasswordApi(payload: {
  member_id: string;
  new_password?: string;
  new_pin?: string;
  new_role?: string;
}): Promise<any> {
  const res = await apiFetch('/api/auth/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Fehler beim Zurücksetzen');
  }
  return await res.json();
}

export async function changeOwnPasswordApi(payload: {
  current_password?: string;
  current_pin?: string;
  new_password?: string;
  new_pin?: string;
}): Promise<any> {
  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Fehler beim Ändern');
  }
  return await res.json();
}
