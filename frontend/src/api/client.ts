/**
 * Central API Client for FitPlaner
 * Resolves API endpoints dynamically across Web and Android (Capacitor) environments.
 */

// Default local network IP for the host running the FitPlaner server
const DEFAULT_LAN_HOST = 'http://192.168.178.57:8090';
const STORAGE_KEY = 'fitplaner_server_url';

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const isCap = !!(window as any).Capacitor;
  const isLocalhostScheme = window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && window.location.port === '' && isCap);
  return isCap || isLocalhostScheme;
}

export function getServerUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return saved.replace(/\/+$/, '');
  }

  // In native Android APK, relative requests hit https://localhost/ which returns index.html.
  // We therefore route to the host server in the home Wi-Fi network.
  if (isCapacitorNative()) {
    return DEFAULT_LAN_HOST;
  }

  // In standard browser mode, relative URLs resolve against current origin
  return '';
}

export function setServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    // Ensure protocol is present
    const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
      ? trimmed 
      : `http://${trimmed}`;
    localStorage.setItem(STORAGE_KEY, normalized);
  }
  // Dispatch custom event so UI components can re-render immediately
  window.dispatchEvent(new Event('fitplaner_server_changed'));
}

export async function checkServerConnection(targetUrl?: string): Promise<{ ok: boolean; message?: string }> {
  const base = (targetUrl !== undefined ? targetUrl : getServerUrl()).replace(/\/+$/, '');
  const testEndpoint = `${base}/api/settings`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(testEndpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return { ok: true, message: 'Verbunden' };
      }
      return { ok: false, message: 'Server liefert kein JSON (evtl. falscher Port)' };
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

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const base = getServerUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = base ? `${base}${cleanPath}` : cleanPath;

  try {
    const response = await fetch(fullUrl, options);
    return response;
  } catch (err) {
    console.warn(`[FitPlaner API] Failed to fetch ${fullUrl}:`, err);
    throw err;
  }
}
