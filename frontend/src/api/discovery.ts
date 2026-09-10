/**
 * Central Auto-Discovery Module for FitPlaner
 * Automatically locates the FitPlaner PC server in the local Wi-Fi / LAN,
 * even when DHCP assigns a new IP address to the PC.
 */

export interface DiscoveredServer {
  ip: string;
  port: number;
  url: string;
  responseTimeMs: number;
  primaryRetailer?: string;
  retailersCount?: number;
}

/**
 * Attempts to discover the device's local LAN IP using WebRTC ICE candidates.
 * Returns null if blocked by browser privacy or not on Wi-Fi.
 */
export async function getDeviceLocalSubnet(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      let resolved = false;

      pc.createDataChannel('');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        });

      pc.onicecandidate = (event) => {
        if (resolved) return;
        if (!event || !event.candidate) {
          resolved = true;
          resolve(null);
          return;
        }

        const candidate = event.candidate.candidate;
        // Match standard IPv4 addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const match = candidate.match(/(192\.168\.\d+|10\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+)\.(\d+)/);
        if (match) {
          resolved = true;
          const subnet = match[1]; // e.g. "192.168.178"
          pc.close();
          resolve(subnet);
        }
      };

      // Safety timeout after 1.2s
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { pc.close(); } catch {}
          resolve(null);
        }
      }, 1200);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Probes a candidate URL to check if a valid FitPlaner server is running there.
 */
export async function probeServer(host: string, port: number = 8090, timeoutMs: number = 650): Promise<DiscoveredServer | null> {
  const url = `http://${host}:${port}`;
  const controller = new AbortController();
  const start = performance.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/api/settings`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // Validate FitPlaner specific signature
        if (data && Array.isArray(data.active_retailers)) {
          return {
            ip: host,
            port,
            url,
            responseTimeMs: Math.round(performance.now() - start),
            primaryRetailer: data.primary_retailer,
            retailersCount: data.active_retailers.length,
          };
        }
      }
    }
    return null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * High-speed parallel subnet scanner.
 * Scans up to 254 candidate IPs in parallel chunks of 25.
 */
export async function scanSubnetForServer(
  subnet: string,
  port: number = 8090,
  onProgress?: (scannedCount: number, total: number) => void
): Promise<DiscoveredServer | null> {
  const candidates: string[] = [];

  // Prioritize common fixed router/PC IPs first (.57, .1, .2, .20, .30, .50, .100, etc.)
  const priorityHosts = [57, 1, 2, 20, 21, 22, 23, 24, 25, 30, 40, 50, 60, 70, 80, 90, 100, 101, 102, 150, 200];
  const otherHosts: number[] = [];

  for (let i = 1; i <= 254; i++) {
    if (!priorityHosts.includes(i)) {
      otherHosts.push(i);
    }
  }

  const allHosts = [...priorityHosts, ...otherHosts];
  for (const h of allHosts) {
    candidates.push(`${subnet}.${h}`);
  }

  const CHUNK_SIZE = 25;
  let scanned = 0;

  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map((ip) => probeServer(ip, port, 650));
    const results = await Promise.all(promises);

    scanned += chunk.length;
    if (onProgress) {
      onProgress(Math.min(scanned, candidates.length), candidates.length);
    }

    for (const server of results) {
      if (server) {
        return server; // Found server!
      }
    }
  }

  return null;
}

/**
 * Comprehensive Auto-Discovery Routine.
 * 1. Checks current saved IP
 * 2. Tries WebRTC-detected subnet
 * 3. Probes common German router subnets (FRITZ!Box 192.168.178.x, Speedport 192.168.2.x, 192.168.1.x, 192.168.0.x, 10.0.0.x)
 */
export async function discoverFitPlanerServer(
  currentSavedUrl?: string,
  onStatusUpdate?: (status: string) => void
): Promise<DiscoveredServer | null> {
  // 1. Quick check on saved IP
  if (currentSavedUrl) {
    try {
      const parsed = new URL(currentSavedUrl.startsWith('http') ? currentSavedUrl : `http://${currentSavedUrl}`);
      if (onStatusUpdate) onStatusUpdate(`Prüfe zuletzt genutzte IP ${parsed.hostname}...`);
      const alive = await probeServer(parsed.hostname, parseInt(parsed.port || '8090', 10), 1000);
      if (alive) {
        if (onStatusUpdate) onStatusUpdate(`Server gefunden: ${alive.ip}`);
        return alive;
      }
    } catch {}
  }

  // 2. Try detected subnet from device Wi-Fi interface
  if (onStatusUpdate) onStatusUpdate('Ermittle lokales WLAN-Subnetz...');
  const detectedSubnet = await getDeviceLocalSubnet();
  const subnetsToScan: string[] = [];

  if (detectedSubnet) {
    subnetsToScan.push(detectedSubnet);
  }

  // Common home network subnets in Germany / Europe
  const standardSubnets = ['192.168.178', '192.168.1', '192.168.0', '192.168.2', '10.0.0'];
  for (const s of standardSubnets) {
    if (!subnetsToScan.includes(s)) {
      subnetsToScan.push(s);
    }
  }

  for (const subnet of subnetsToScan) {
    if (onStatusUpdate) onStatusUpdate(`Scanne ${subnet}.0/24 nach FitPlaner Server...`);
    const server = await scanSubnetForServer(subnet, 8090, (done, total) => {
      if (onStatusUpdate) onStatusUpdate(`Durchsuche ${subnet}.x (${done}/${total})...`);
    });

    if (server) {
      if (onStatusUpdate) onStatusUpdate(`FitPlaner Server gefunden auf ${server.ip}!`);
      return server;
    }
  }

  if (onStatusUpdate) onStatusUpdate('Kein Server im Netzwerk gefunden.');
  return null;
}
