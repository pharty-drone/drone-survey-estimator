export type Suggestion = {
  postcode: string;
  country?: string;
  region?: string;
  latitude: number;
  longitude: number;
};

export function normalisePostcode(raw: string): { pretty: string; key: string } {
  const trimmed = (raw || '').trim().toUpperCase();
  const cleaned = trimmed.replace(/[^A-Z0-9 ]+/g, '').replace(/\s+/g, ' ');
  const pretty = cleaned;
  const key = cleaned.replace(/\s+/g, '');
  return { pretty, key };
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function resolvePostcode(
  rawPostcode: string,
  signal?: AbortSignal,
  opts?: { offline?: boolean; offlinePath?: string }
): Promise<{ postcode: string; lat: number; lng: number }> {
  const { key } = normalisePostcode(rawPostcode);
  if (!key) throw new Error('Enter a postcode');

  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`;
  try {
    const json = await getJSON<any>(url, signal);
    if (json && json.status === 200 && json.result) {
      return {
        postcode: json.result.postcode || key,
        lat: json.result.latitude,
        lng: json.result.longitude,
      };
    }
    throw new Error('Postcode not found');
  } catch (e) {
    if (opts?.offline) {
      const offline = await import('./postcode-offline');
      const rec = await offline.lookupOfflinePostcode(key, opts.offlinePath);
      if (rec) return { postcode: rec.postcode, lat: rec.latitude, lng: rec.longitude };
    }
    throw e;
  }
}

export async function searchSuggestions(query: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const q = normalisePostcode(query).key;
  if (!q) return [];
  const url = `https://api.postcodes.io/postcodes?q=${encodeURIComponent(q)}&limit=5`;
  const json = await getJSON<any>(url, signal);
  if (json && json.status === 200 && Array.isArray(json.result)) {
    return json.result.map((r: any) => ({
      postcode: r.postcode,
      country: r.country,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
    })) as Suggestion[];
  }
  return [];
}
