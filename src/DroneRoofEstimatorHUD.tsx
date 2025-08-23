import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
// Drawing & measurement libs
import { TerraDraw } from "@terradraw/core";
import { TerraDrawMapLibreGLAdapter } from "@terradraw/maplibre-gl-adapter";
import { TerraDrawPolygonMode, TerraDrawSelectMode } from "@terradraw/polygon";
import * as turf from "@turf/turf";

// UI helpers (replace with your design system)
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * DroneRoofEstimatorHUD
 * ---------------------
 * Minimal HUD-style scaffold for drawing roof facets and surfacing
 * live measurements and cost estimates.
 *
 * Drop this component into your React app and ensure the required
 * dependencies are installed:
 *
 * npm i maplibre-gl @terradraw/core @terradraw/maplibre-gl-adapter \
 *       @terradraw/polygon @turf/turf
 */
export const DroneRoofEstimatorHUD: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<TerraDraw | null>(null);

  const [area, setArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  const [cost, setCost] = useState(0);
  const [open, setOpen] = useState(false);

  // instantiate map + draw once
  useEffect(() => {
    if (!mapRef.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-122.4, 37.78],
      zoom: 17,
      pitch: 45,
      antialias: true,
    });

    const adapter = new TerraDrawMapLibreGLAdapter({ map: map.current });
    draw.current = new TerraDraw({
      adapter,
      modes: {
        select: new TerraDrawSelectMode(),
        polygon: new TerraDrawPolygonMode(),
      },
    });

    draw.current.start();
    draw.current.setMode("polygon");

    draw.current.on("finish", handleChange);
    draw.current.on("update", handleChange);
    draw.current.on("delete", handleChange);
  }, []);

  const handleChange = () => {
    const d = draw.current;
    if (!d) return;
    const fc = d.getAll();
    const feature = fc.features[0];
    if (!feature) {
      setArea(0);
      setPerimeter(0);
      setCost(0);
      return;
    }
    const a = turf.area(feature);
    const p = turf.length(feature, { units: "meters" });
    setArea(a);
    setPerimeter(p);
    // simple placeholder pricing – replace with your engine
    setCost(49 + 0.45 * a);
  };

  const formatted = useMemo(() => ({
    area: area ? area.toFixed(1) : "–",
    perimeter: perimeter ? perimeter.toFixed(1) : "–",
    cost: cost ? cost.toFixed(2) : "–",
  }), [area, perimeter, cost]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* bottom telemetry strip */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 bg-black/70 p-2 text-white">
        <span>Perimeter: {formatted.perimeter} m</span>
        <span>Area: {formatted.area} m²</span>
        <span>Estimate: £{formatted.cost}</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="ml-auto">Estimate</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Estimate</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full p-4">
              <p>Perimeter: {formatted.perimeter} m</p>
              <p>Area: {formatted.area} m²</p>
              <p className="font-semibold">Total: £{formatted.cost}</p>
              {/* Replace with line item UI / pricing engine */}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default DroneRoofEstimatorHUD;
