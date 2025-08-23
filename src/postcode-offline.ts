import { normalisePostcode } from './geocode';

export async function lookupOfflinePostcode(
  key: string,
  path?: string
): Promise<{ postcode: string; latitude: number; longitude: number } | null> {
  if (!path) return null;
  const res = await fetch(path, { headers: { Accept: 'text/csv,application/json' } });
  if (!res.ok) return null;
  const text = await res.text();
  // naive CSV parser: expects postcode,latitude,longitude header
  const lines = text.trim().split(/\r?\n/);
  for (const line of lines.slice(1)) {
    const [pc, lat, lng] = line.split(',');
    if (normalisePostcode(pc).key === key) {
      return { postcode: pc, latitude: parseFloat(lat), longitude: parseFloat(lng) };
    }
  }
  return null;
}
