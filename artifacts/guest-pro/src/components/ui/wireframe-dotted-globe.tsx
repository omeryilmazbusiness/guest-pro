import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";

const LAND_GEOJSON_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
  /** Hide drag/zoom hint (e.g. when used as a background). */
  showHint?: boolean;
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInFeature(point: [number, number], feature: Feature<Geometry>): boolean {
  const geometry = feature.geometry;

  if (geometry.type === "Polygon") {
    const coordinates = geometry.coordinates;
    if (!pointInPolygon(point, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygon(point, coordinates[i])) return false;
    }
    return true;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      if (pointInPolygon(point, polygon[0])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (pointInPolygon(point, polygon[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }

  return false;
}

function generateDotsInPolygon(feature: Feature<Polygon | MultiPolygon>, dotSpacing = 16) {
  const dots: [number, number][] = [];
  const bounds = d3.geoBounds(feature);
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const stepSize = dotSpacing * 0.08;

  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const point: [number, number] = [lng, lat];
      if (pointInFeature(point, feature)) {
        dots.push(point);
      }
    }
  }

  return dots;
}

interface DotData {
  lng: number;
  lat: number;
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  showHint = true,
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const containerWidth = Math.min(width, window.innerWidth - 40);
    const containerHeight = Math.min(height, window.innerHeight - 100);
    const radius = Math.min(containerWidth, containerHeight) / 2.5;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);
    const allDots: DotData[] = [];
    let landFeatures: FeatureCollection | null = null;

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      context.beginPath();
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
      context.fillStyle = "#000000";
      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = "#ffffff";
        context.lineWidth = 1 * scaleFactor;
        context.globalAlpha = 0.25;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        for (const feature of landFeatures.features) {
          path(feature);
        }
        context.strokeStyle = "#ffffff";
        context.lineWidth = 1 * scaleFactor;
        context.stroke();

        for (const dot of allDots) {
          const projected = projection([dot.lng, dot.lat]);
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath();
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
            context.fillStyle = "#999999";
            context.fill();
          }
        }
      }
    };

    const loadWorldData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(LAND_GEOJSON_URL);
        if (!response.ok) throw new Error("Failed to load land data");

        landFeatures = (await response.json()) as FeatureCollection;

        for (const feature of landFeatures.features) {
          if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
            continue;
          }
          const dots = generateDotsInPolygon(
            feature as Feature<Polygon | MultiPolygon>,
            16,
          );
          for (const [lng, lat] of dots) {
            allDots.push({ lng, lat });
          }
        }

        render();
        setIsLoading(false);
      } catch {
        setError("Failed to load land map data");
        setIsLoading(false);
      }
    };

    const rotation: [number, number, number] = [0, 0, 0];
    let autoRotate = true;
    const rotationSpeed = 0.5;

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
        render();
      }
    };

    const rotationTimer = d3.timer(rotate);

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation: [number, number, number] = [...rotation];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.5;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = startRotation[1] - dy * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

        projection.rotate(rotation);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        window.setTimeout(() => {
          autoRotate = true;
        }, 10);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newRadius = Math.max(
        radius * 0.5,
        Math.min(radius * 3, projection.scale() * scaleFactor),
      );
      projection.scale(newRadius);
      render();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    void loadWorldData();

    return () => {
      rotationTimer.stop();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [width, height]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/10 bg-black/80 p-8 ${className}`}
        role="alert"
      >
        <div className="text-center">
          <p className="mb-2 font-semibold text-red-400">Error loading Earth visualization</p>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} aria-busy={isLoading}>
      <canvas
        ref={canvasRef}
        className="h-auto w-full rounded-2xl bg-black"
        style={{ maxWidth: "100%", height: "auto" }}
        aria-label="Interactive dotted globe. Drag to rotate, scroll to zoom."
      />
      {isLoading && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40"
          aria-hidden="true"
        >
          <div className="h-8 w-8 animate-pulse rounded-full border border-white/20 border-t-white/80" />
        </div>
      )}
      {showHint && !isLoading && (
        <div className="absolute bottom-4 left-4 rounded-md bg-neutral-900/90 px-2 py-1 text-xs text-white/50">
          Drag to rotate · Scroll to zoom
        </div>
      )}
    </div>
  );
}
