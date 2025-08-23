import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  resolvePostcode,
  searchSuggestions,
  normalisePostcode,
  type Suggestion,
} from './geocode';

type Props = {
  map: maplibregl.Map | null | undefined;
  className?: string;
  onLocate?: (r: { postcode: string; lat: number; lng: number }) => void;
  offlinePath?: string;
};

const PostcodeFinder: React.FC<Props> = ({ map, className, onLocate, offlinePath }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    ctrl.current?.abort();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const c = new AbortController();
    ctrl.current = c;
    searchSuggestions(query, c.signal)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
    return () => c.abort();
  }, [query]);

  const flyTo = (r: { lat: number; lng: number }) => {
    if (!map) return;
    map.flyTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 15) });
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker().setLngLat([r.lng, r.lat]).addTo(map);
    } else {
      markerRef.current.setLngLat([r.lng, r.lat]);
    }
  };

  const handleResolve = async (pc: string) => {
    setError(null);
    try {
      const r = await resolvePostcode(pc, undefined, {
        offline: !!offlinePath,
        offlinePath,
      });
      flyTo(r);
      onLocate?.(r);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const s = suggestions[0];
      handleResolve(s ? s.postcode : query);
      setSuggestions([]);
    }
  };

  return (
    <div className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Enter postcode"
        className="rounded border px-2 py-1 text-sm"
        aria-label="Find postcode"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="mt-1 max-h-40 overflow-auto rounded border bg-white text-sm">
          {suggestions.map((s) => (
            <li
              key={s.postcode}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100"
              onMouseDown={() => {
                setQuery(normalisePostcode(s.postcode).pretty);
                setSuggestions([]);
                handleResolve(s.postcode);
              }}
            >
              {s.postcode} {s.region ? `– ${s.region}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PostcodeFinder;
