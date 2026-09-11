/**
 * Peer-to-Peer Bidirectional Sync Manager for FitPlaner
 * Enables equal synchronization between PC and Smartphone APK:
 * - PC & Smartphone are equal peers: changes propagate bidirectionally.
 * - Auto-Autark Mode: Automatically activates when leaving home Wi-Fi.
 * - Auto-Reconnection & Sync: Seamlessly synchronizes as soon as PC or Wi-Fi is reachable.
 */

import { localDbGet, localDbSet, localDbGetAll, STORES } from '../backend_embedded/indexedDbStorage';
import { getServerUrl, getAppMode, setAppMode, isCapacitorNative } from './client';

export type SyncState = 'synced' | 'syncing' | 'autark' | 'error';

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncTime: Date | null;
  serverUrl: string;
  isAutark: boolean;
  message: string;
  summary?: Record<string, any>;
}

export interface BidirectionalSyncPacket {
  device_id: string;
  device_name: string;
  timestamp: string;
  settings?: Record<string, any> | null;
  schedule_settings?: Record<string, any> | null;
  profiles?: any[];
  pantry?: any[];
  recipes?: any[];
  chores?: any[];
  plans?: any[];
  checked_shopping_items?: string[];
  custom_shopping_items?: any[];
  daily_hub_state?: Record<string, any>;
  health_dossiers?: any[] | Record<string, any>;
  recurring_rules?: any[];
}

export interface BidirectionalSyncResponse {
  status: string;
  server_device_name: string;
  server_timestamp: string;
  merged_data: BidirectionalSyncPacket;
  summary: Record<string, any>;
}

// Global Sync State
let currentSyncState: SyncState = 'autark';
let lastSyncTimestamp: Date | null = null;
let lastSyncMessage = 'Initialisierung...';
let syncWatcherTimer: any = null;
let isCurrentlySyncing = false;
const listeners = new Set<(status: SyncStatusInfo) => void>();

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'headless_node';
  let id = localStorage.getItem('fitplaner_node_device_id');
  if (!id) {
    id = `node_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem('fitplaner_node_device_id', id);
  }
  return id;
}

function getDeviceName(): string {
  if (isCapacitorNative()) {
    return 'Smartphone (Xiaomi APK)';
  }
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    return 'PC / Desktop Web';
  }
  return 'Web / Mobilgerät';
}

function notifyListeners() {
  const info = getSyncStatus();
  listeners.forEach((listener) => {
    try {
      listener(info);
    } catch (e) {
      console.error('[SyncManager] Listener error:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fitplaner_sync_status_changed', { detail: info })
    );
  }
}

export function subscribeSyncStatus(listener: (status: SyncStatusInfo) => void): () => void {
  listeners.add(listener);
  listener(getSyncStatus());
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatusInfo {
  return {
    state: currentSyncState,
    lastSyncTime: lastSyncTimestamp,
    serverUrl: getServerUrl(),
    isAutark: currentSyncState === 'autark',
    message: lastSyncMessage,
  };
}

/**
 * Fast Health / Liveness Check for PC Server.
 * Rejects in <= 1500ms to immediately fall back to Autark-Modus if outside WLAN.
 */
export async function checkServerHealth(targetUrl?: string, timeoutMs: number = 1800): Promise<boolean> {
  const base = (targetUrl || getServerUrl()).replace(/\/+$/, '');
  if (!base) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/api/sync/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.status === 'ok';
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Loads checked shopping list item keys from localStorage.
 */
export function getLocalCheckedShoppingItems(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('fitplaner_checked_shopping_items');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persists checked shopping list item keys to localStorage.
 */
export function setLocalCheckedShoppingItems(items: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('fitplaner_checked_shopping_items', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('fitplaner_checked_items_updated', { detail: { items } }));
  } catch (err) {
    console.warn('[SyncManager] Failed to persist checked shopping items:', err);
  }
}

/**
 * Packages local device state into a BidirectionalSyncPacket.
 */
export async function buildLocalSyncPacket(): Promise<BidirectionalSyncPacket> {
  const settings = await localDbGet<any>(STORES.SETTINGS, 'current');
  const scheduleSettings = await localDbGet<any>(STORES.TIMELINE, 'settings');
  const profiles = await localDbGetAll<any>(STORES.PROFILES);
  const pantry = await localDbGetAll<any>(STORES.PANTRY);
  const recipes = await localDbGetAll<any>(STORES.RECIPES);
  const chores = await localDbGetAll<any>(STORES.CHORES);
  const plans = await localDbGetAll<any>(STORES.PLANS);
  const customItems = await localDbGetAll<any>(STORES.CUSTOM_ITEMS);
  const checkedItems = getLocalCheckedShoppingItems();
  const healthDossiers = await localDbGetAll<any>(STORES.HEALTH);
  const recurringRules = await localDbGetAll<any>(STORES.RECURRING);

  let dailyHubState: any = null;
  try {
    const rawHub = localStorage.getItem('fitplaner_daily_hub_state');
    if (rawHub) dailyHubState = JSON.parse(rawHub);
  } catch {}

  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
    timestamp: new Date().toISOString(),
    settings,
    schedule_settings: scheduleSettings,
    profiles,
    pantry,
    recipes,
    chores,
    plans,
    checked_shopping_items: checkedItems,
    custom_shopping_items: customItems,
    daily_hub_state: dailyHubState,
    health_dossiers: healthDossiers,
    recurring_rules: recurringRules,
  };
}

/**
 * Applies merged sync packet data back into device's IndexedDB and localStorage.
 */
export async function applyMergedPacket(merged: BidirectionalSyncPacket): Promise<void> {
  if (merged.settings) {
    await localDbSet(STORES.SETTINGS, 'current', merged.settings);
  }

  if (merged.schedule_settings) {
    await localDbSet(STORES.TIMELINE, 'settings', merged.schedule_settings);
  }

  if (Array.isArray(merged.profiles)) {
    for (const p of merged.profiles) {
      if (p && p.id) await localDbSet(STORES.PROFILES, p.id, p);
    }
  }

  if (Array.isArray(merged.pantry)) {
    for (const item of merged.pantry) {
      if (item && item.id) await localDbSet(STORES.PANTRY, item.id, item);
    }
  }

  if (Array.isArray(merged.recipes)) {
    for (const r of merged.recipes) {
      if (r && r.id) await localDbSet(STORES.RECIPES, r.id, r);
    }
  }

  if (Array.isArray(merged.chores)) {
    for (const c of merged.chores) {
      if (c && c.id) await localDbSet(STORES.CHORES, c.id, c);
    }
  }

  if (Array.isArray(merged.plans)) {
    for (const pl of merged.plans) {
      if (pl && pl.week_offset !== undefined) {
        await localDbSet(STORES.PLANS, `plan_${pl.week_offset}`, pl);
      }
    }
  }

  if (Array.isArray(merged.custom_shopping_items)) {
    for (const cit of merged.custom_shopping_items) {
      if (cit && cit.id) await localDbSet(STORES.CUSTOM_ITEMS, cit.id, cit);
    }
  }

  if (Array.isArray(merged.checked_shopping_items)) {
    setLocalCheckedShoppingItems(merged.checked_shopping_items);
  }

  if (merged.daily_hub_state && typeof window !== 'undefined') {
    localStorage.setItem('fitplaner_daily_hub_state', JSON.stringify(merged.daily_hub_state));
  }

  if (merged.health_dossiers) {
    if (Array.isArray(merged.health_dossiers)) {
      for (const hd of merged.health_dossiers) {
        const key = hd?.profile_id || hd?.id || hd?.member_id;
        if (key) await localDbSet(STORES.HEALTH, key, hd);
      }
    } else if (typeof merged.health_dossiers === 'object') {
      for (const [key, hd] of Object.entries(merged.health_dossiers)) {
        if (hd) await localDbSet(STORES.HEALTH, key, hd);
      }
    }
  }

  if (Array.isArray(merged.recurring_rules)) {
    for (const rule of merged.recurring_rules) {
      if (rule && rule.id) await localDbSet(STORES.RECURRING, rule.id, rule);
    }
  }

  // Notify UI components that data was updated from sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fitplaner_synced', { detail: { timestamp: new Date() } }));
    window.dispatchEvent(new CustomEvent('fitplaner_profiles_updated', { detail: { profiles: merged.profiles } }));
    window.dispatchEvent(new CustomEvent('fitplaner_settings_updated', { detail: { settings: merged.settings } }));
  }
}

/**
 * Main Bidirectional Peer-to-Peer Sync Execution.
 * If server is unreachable -> smoothly falls back to Autark-Modus.
 * If server is reachable -> exchanges data, merges equal state, and updates both peers.
 */
export async function performBidirectionalSync(
  customUrl?: string,
  silent: boolean = false
): Promise<{ ok: boolean; message: string; summary?: Record<string, any> }> {
  if (isCurrentlySyncing) {
    return { ok: false, message: 'Synchronisation läuft bereits.' };
  }

  const serverUrl = (customUrl || getServerUrl()).replace(/\/+$/, '');
  if (!serverUrl) {
    currentSyncState = 'autark';
    lastSyncMessage = 'Autark-Modus (Keine Server-URL)';
    setAppMode('standalone');
    notifyListeners();
    return { ok: true, message: 'Autarker Betrieb aktiv' };
  }

  isCurrentlySyncing = true;
  currentSyncState = 'syncing';
  lastSyncMessage = 'Prüfe Verbindung zu PC...';
  notifyListeners();

  try {
    // 1. Fast Health Check to detect if we are in Home Wi-Fi
    const isHealthy = await checkServerHealth(serverUrl, 1800);
    if (!isHealthy) {
      currentSyncState = 'autark';
      lastSyncMessage = 'Außerhalb des WLANs / PC offline. Autarker Modus aktiv.';
      setAppMode('standalone');
      notifyListeners();
      return {
        ok: true,
        message: 'PC nicht im WLAN erreichbar. App läuft 100% autark.',
      };
    }

    // 2. We have a live connection to PC! Switch to server mode and push/pull merged state
    lastSyncMessage = 'Synchronisiere Daten mit PC...';
    notifyListeners();

    const localPacket = await buildLocalSyncPacket();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(`${serverUrl}/api/sync/bidirectional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(localPacket),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Server Sync HTTP ${res.status}`);
    }

    const syncResp: BidirectionalSyncResponse = await res.json();
    if (syncResp.merged_data) {
      await applyMergedPacket(syncResp.merged_data);
    }

    setAppMode('server');
    currentSyncState = 'synced';
    lastSyncTimestamp = new Date();
    lastSyncMessage = `Synchronisiert mit ${syncResp.server_device_name || 'PC'}`;
    notifyListeners();

    return {
      ok: true,
      message: lastSyncMessage,
      summary: syncResp.summary,
    };
  } catch (err: any) {
    console.warn('[SyncManager] Sync failed, seamlessly dropping to Autark-Modus:', err);
    currentSyncState = 'autark';
    lastSyncMessage = 'WLAN verlassen: Autarker Modus aktiv.';
    setAppMode('standalone');
    notifyListeners();
    return {
      ok: true,
      message: 'PC nicht erreichbar. Unterwegs im autarken Modus gespeichert.',
    };
  } finally {
    isCurrentlySyncing = false;
  }
}

/**
 * Background Wi-Fi & Connectivity Watcher
 * Polls server liveness every 15s.
 * Listens to online, offline, and focus events.
 */
export function startAutoSyncWatcher(intervalMs: number = 15000): () => void {
  if (syncWatcherTimer) {
    clearInterval(syncWatcherTimer);
  }

  const triggerAutoSync = () => {
    if (!isCurrentlySyncing) {
      performBidirectionalSync(undefined, true).catch(() => {});
    }
  };

  // Initial trigger
  setTimeout(triggerAutoSync, 1000);

  syncWatcherTimer = setInterval(triggerAutoSync, intervalMs);

  const handleOnline = () => {
    console.log('[SyncManager] Device connected to network. Checking PC sync...');
    triggerAutoSync();
  };

  const handleOffline = () => {
    console.log('[SyncManager] Device went offline. Engaging Autark-Modus.');
    currentSyncState = 'autark';
    lastSyncMessage = 'Kein Netzwerk: Autarker Modus aktiv.';
    setAppMode('standalone');
    notifyListeners();
  };

  const handleFocus = () => {
    triggerAutoSync();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
  }

  return () => {
    if (syncWatcherTimer) clearInterval(syncWatcherTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    }
  };
}
