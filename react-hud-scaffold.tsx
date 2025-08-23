import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
// These packages illustrate how the scaffold would hook into drawing and analysis.
// They are referenced for clarity but may require installation in a real project.
// import { TerraDraw } from "terra-draw";
// import { TerraDrawMapLibreAdapter } from "terra-draw-maplibre";
import * as turf from "@turf/turf";

// Minimal stand‑ins for UI pieces used in the sketch. Replace with your design system.
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="card">{children}</div>;
const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="card-header">{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3>{children}</h3>;
const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="card-content">{children}</div>;
const ScrollArea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => <div className="scroll-area">{children}</div>;

// =============== HUD Component ===========================================
export default function RoofEstimatorHUD() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [pitch, setPitch] = useState(0);
  const [rate, setRate] = useState(45); // $/m^2 base rate
  const [overhead, setOverhead] = useState(10); // percent
  const [profit, setProfit] = useState(15); // percent

  useEffect(() => {
    if (!mapRef.current || map) return;
    const m = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-96, 37.8],
      zoom: 4,
    });
    setMap(m);
    // Hook TerraDraw here to allow polygon drawing and update `features` state.
    // const draw = new TerraDraw({ adapter: new TerraDrawMapLibreAdapter({ map: m }), modes: [new TerraDrawPolygonMode()] });
    // draw.start();
    // draw.on("finish", () => setFeatures(draw.getSnapshot()));
    return () => {
      m.remove();
    };
  }, [map]);

  const measure = useMemo(() => measureFromFeatures(features, pitch), [features, pitch]);
  const estimate = useMemo(() =>
    estimateFromGeometry(measure, { rate, overheadPct: overhead, profitPct: profit }),
  [measure, rate, overhead, profit]);

  function exportCSV() {
    const csv = csvFromEstimate(estimate, measure, { pitch, material: "Generic", rate, overheadPct: overhead, profitPct: profit });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estimate.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="hud">
      <div ref={mapRef} className="map" />
      <div className="panel">
        <Card>
          <CardHeader>
            <CardTitle>Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryRow label="Area" value={`${formatNumber(measure.areaM2)} m²`} />
            <SummaryRow label="Perimeter" value={`${formatNumber(measure.perimeterM)} m`} />
            <SummaryRow label="Ridge/Eave" value={`${formatNumber(measure.ridgeEaveM)} m`} />
            <SummaryRow label="Pitch" value={`${formatNumber(pitch)}°`} />
            <SummaryRow label="Total" value={money(estimate.total)} bold />
            <div className="mt-4 flex gap-2">
              <Button onClick={exportCSV}>Export CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 pr-4">
              <ul className="space-y-2 text-sm">
                {estimate.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border p-2">
                    <span>{it.name}</span>
                    <span className="font-semibold">{money(it.total)}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className={bold ? "font-semibold" : undefined}>{value}</span>
    </div>
  );
}

// =============== Logic =====================================================
function measureFromFeatures(features: any[], pitchDeg: number) {
  const polys = features.filter((f) => f.geometry?.type === "Polygon");
  const area = polys.reduce((sum, f) => sum + turf.area(f), 0); // m^2
  const perimeter = polys.reduce((sum, f) => sum + turf.length(f, { units: "meters" }), 0); // m

  // very rough ridge/eave proxy: total perimeter of all facets (customize with topology)
  const ridgeEave = perimeter * 0.5;

  return {
    facets: polys.length,
    areaM2: area,
    perimeterM: perimeter,
    ridgeEaveM: ridgeEave,
    pitchDeg,
  };
}

function estimateFromGeometry(measure: ReturnType<typeof measureFromFeatures>, opts: { rate: number; overheadPct: number; profitPct: number }) {
  const { areaM2, pitchDeg } = measure;
  const base = areaM2 * opts.rate;

  // Pitch factor: 0° → 1.00, 30° → 1.10, 45° → 1.25, 60° → 1.45 (tweak to your calibration)
  const pf = 1 + Math.min(0.9, Math.max(0, (pitchDeg / 60) * 0.45));
  const adjustedBase = base * pf;
  const overhead = adjustedBase * (opts.overheadPct / 100);
  const profit = (adjustedBase + overhead) * (opts.profitPct / 100);
  const total = adjustedBase + overhead + profit;

  const items = [
    { name: "Base (Materials+Labor)", total: adjustedBase },
    { name: "Overhead", total: overhead },
    { name: "Profit", total: profit },
  ];

  return { areaM2, base, pitchFactor: pf, adjustedBase, overhead, profit, total, items, facets: measure.facets };
}

function csvFromEstimate(
  est: ReturnType<typeof estimateFromGeometry>,
  measure: ReturnType<typeof measureFromFeatures>,
  meta: { pitch: number; material: string; rate: number; overheadPct: number; profitPct: number }
) {
  const lines = [
    ["Field", "Value"],
    ["Material", meta.material],
    ["Rate per m2", meta.rate.toString()],
    ["Pitch (deg)", meta.pitch.toString()],
    ["Facets", String(est.facets)],
    ["Area m2", est.areaM2.toFixed(2)],
    ["Base", est.base.toFixed(2)],
    ["Pitch Factor", est.pitchFactor.toFixed(2)],
    ["Adjusted Base", est.adjustedBase.toFixed(2)],
    ["Overhead", est.overhead.toFixed(2)],
    ["Profit", est.profit.toFixed(2)],
    ["Total", est.total.toFixed(2)],
  ];
  return lines.map((r) => r.join(",")).join("\n");
}

// =============== Utils =====================================================
function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

