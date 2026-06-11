import type { GuestTranslations } from "@/lib/i18n";
import {
  groupRoadmapStops,
  roadmapSectionTitle,
  stopCategoryEmoji,
  type ChatRoadmap,
  type ChatRoadmapStop,
  type RoadmapSectionId,
} from "@/lib/chat-roadmap";
import { pickPostcardNote } from "@/lib/roadmap-postcard-notes";
import { resolveRoadmapScenery } from "@/lib/roadmap-scenery";

const GUEST_PRO_LOGO_URL = "/colega/images/guestpro-logo-black.png";

const W = 1080;
const H = 1920;
const PAD = 48;

const SECTION_ACCENT: Record<RoadmapSectionId, string> = {
  sights: "#6366f1",
  flavors: "#f59e0b",
  experiences: "#10b981",
};

export interface RoadmapPostcardInput {
  roadmap: ChatRoadmap;
  hotelName: string;
  hotelLogoUrl: string | null;
  guestFirstName?: string;
  t: GuestTranslations;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawScenicBackground(
  ctx: CanvasRenderingContext2D,
  scenery: ReturnType<typeof resolveRoadmapScenery>,
) {
  const mesh = ctx.createLinearGradient(0, 0, W * 0.2, H);
  mesh.addColorStop(0, scenery.accent);
  mesh.addColorStop(0.45, scenery.accentSoft);
  mesh.addColorStop(1, "#0f172a");
  ctx.fillStyle = mesh;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.75, H * 0.15, 20, W * 0.75, H * 0.15, W * 0.55);
  glow.addColorStop(0, `${scenery.accent}55`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, scenery.overlayTop);
  overlay.addColorStop(0.5, "rgba(8,8,14,0.25)");
  overlay.addColorStop(1, scenery.overlayBottom);
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);
}

function drawTrailPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(cpx, prev.y, curr.x, curr.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawStopMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  num: number,
  stop: ChatRoadmapStop,
  accent: string,
  glassX: number,
  glassW: number,
  alignRight: boolean,
) {
  const pinR = 28;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(x, y, pinR, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = "26px Apple Color Emoji, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stopCategoryEmoji(stop.category), x, y - 2);

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x, y + pinR + 10, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 16px -apple-system, sans-serif";
  ctx.fillText(String(num), x, y + pinR + 15);

  const cardPad = 28;
  const textW = alignRight
    ? x - pinR - glassX - cardPad - 20
    : glassX + glassW - cardPad - (x + pinR + 16);
  const textX = alignRight ? glassX + cardPad : x + pinR + 16;
  roundRect(ctx, textX, y - 32, Math.max(textW, 120), 72, 16);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#18181b";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
  const titles = wrapText(ctx, stop.title, textW - 24, 1);
  ctx.fillText(titles[0] ?? stop.title, textX + 14, y - 6);

  if (stop.subtitle) {
    ctx.fillStyle = "#71717a";
    ctx.font = "400 20px -apple-system, sans-serif";
    const subs = wrapText(ctx, stop.subtitle, textW - 24, 1);
    ctx.fillText(subs[0] ?? "", textX + 14, y + 22);
  }
}

export async function renderRoadmapPostcard(input: RoadmapPostcardInput): Promise<Blob> {
  const { roadmap, hotelName, hotelLogoUrl, guestFirstName, t } = input;
  const scenery = resolveRoadmapScenery(roadmap.city);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  drawScenicBackground(ctx, scenery);

  const cx = W / 2;
  let y = 56;

  const gpLogo = await loadImage(GUEST_PRO_LOGO_URL);
  if (gpLogo) {
    const lw = 88;
    const lh = (gpLogo.height / gpLogo.width) * lw;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 12;
    roundRect(ctx, cx - lw / 2 - 8, y - 8, lw + 16, lh + 16, 18);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.drawImage(gpLogo, cx - lw / 2, y, lw, lh);
    ctx.restore();
    y += lh + 28;
  }

  const hotelLogo = hotelLogoUrl ? await loadImage(hotelLogoUrl) : null;
  if (hotelLogo) {
    const size = 72;
    ctx.save();
    roundRect(ctx, cx - size / 2, y, size, size, 18);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
    ctx.clip();
    ctx.drawImage(hotelLogo, cx - size / 2, y, size, size);
    ctx.restore();
    y += size + 14;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  for (const line of wrapText(ctx, hotelName, W - 120, 2)) {
    ctx.fillText(line, cx, y);
    y += 38;
  }
  ctx.shadowBlur = 0;
  y += 8;

  const glassX = PAD;
  const glassW = W - PAD * 2;
  const glassY = y;
  const glassH = H - glassY - 56;

  ctx.save();
  roundRect(ctx, glassX, glassY, glassW, glassH, 36);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  let innerY = glassY + 40;
  ctx.fillStyle = scenery.accent;
  ctx.font = "700 20px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.roadmapPostcardTagline.toUpperCase(), cx, innerY);
  innerY += 36;

  ctx.fillStyle = "#09090b";
  ctx.font = "700 44px -apple-system, BlinkMacSystemFont, sans-serif";
  for (const line of wrapText(ctx, roadmap.title, glassW - 64, 2)) {
    ctx.fillText(line, cx, innerY);
    innerY += 50;
  }

  if (roadmap.city) {
    ctx.fillStyle = "#52525b";
    ctx.font = "500 26px -apple-system, sans-serif";
    ctx.fillText(roadmap.city, cx, innerY);
    innerY += 40;
  }

  const sections = groupRoadmapStops(roadmap.stops);
  const footerReserve = 200;
  const maxY = glassY + glassH - footerReserve;

  type StopLayout = {
    pinX: number;
    pinY: number;
    num: number;
    stop: ChatRoadmapStop;
    accent: string;
    alignRight: boolean;
  };
  const layouts: StopLayout[] = [];
  let stopNum = 0;
  let layoutY = innerY;

  for (const section of sections) {
    if (layoutY > maxY - 100) break;
    const accent = SECTION_ACCENT[section.id];
    layoutY += 56;
    for (const stop of section.stops) {
      if (layoutY > maxY) break;
      stopNum += 1;
      const alignRight = stopNum % 2 === 0;
      layouts.push({
        pinX: alignRight ? glassX + glassW - 80 : glassX + 80,
        pinY: layoutY + 36,
        num: stopNum,
        stop,
        accent,
        alignRight,
      });
      layoutY += 108;
    }
    layoutY += 8;
  }

  const trailPoints = layouts.map((l) => ({ x: l.pinX, y: l.pinY }));
  if (trailPoints.length > 1) {
    drawTrailPath(ctx, trailPoints, scenery.accent + "99");
  }

  let layoutIdx = 0;
  for (const section of sections) {
    if (innerY > maxY - 100) break;
    const accent = SECTION_ACCENT[section.id];

    ctx.textAlign = "left";
    roundRect(ctx, glassX + 28, innerY, glassW - 56, 40, 12);
    ctx.fillStyle = `${accent}18`;
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = "700 20px -apple-system, sans-serif";
    ctx.fillText(roadmapSectionTitle(section.id, t).toUpperCase(), glassX + 44, innerY + 28);
    innerY += 56;

    for (const stop of section.stops) {
      if (innerY > maxY) break;
      const layout = layouts[layoutIdx];
      layoutIdx += 1;
      if (!layout) continue;
      drawStopMarker(
        ctx,
        layout.pinX,
        layout.pinY,
        layout.num,
        stop,
        layout.accent,
        glassX,
        glassW,
        layout.alignRight,
      );
      innerY += 108;
    }
    innerY += 8;
  }

  const note = pickPostcardNote(roadmap, t);
  const footerY = glassY + glassH - 176;
  const footerH = 148;
  const footX = glassX + 24;
  const footW = glassW - 48;

  ctx.save();
  roundRect(ctx, footX, footerY, footW, footerH, 22);
  const footGrad = ctx.createLinearGradient(footX, footerY, footX + footW, footerY + footerH);
  footGrad.addColorStop(0, "#18181b");
  footGrad.addColorStop(1, scenery.accent);
  ctx.fillStyle = footGrad;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 18px -apple-system, sans-serif";
  ctx.textAlign = "center";
  const greeting = guestFirstName?.trim()
    ? t.roadmapPostcardGreeting.replace("{name}", guestFirstName.trim())
    : t.roadmapPostcardGreetingGuest;
  ctx.fillText(greeting, cx, footerY + 34);

  ctx.fillStyle = "#fef9c3";
  ctx.font = "italic 24px Georgia, 'Times New Roman', serif";
  let ny = footerY + 72;
  for (const line of wrapText(ctx, `"${note}"`, footW - 40, 3)) {
    ctx.fillText(line, cx, ny);
    ny += 32;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/png",
      1,
    );
  });
}

export async function downloadRoadmapPostcard(input: RoadmapPostcardInput): Promise<void> {
  const blob = await renderRoadmapPostcard(input);
  const citySlug =
    input.roadmap.city?.replace(/[^\w]+/g, "-").slice(0, 24) ?? "trip";
  const filename = `guest-pro-${citySlug}-roadmap.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: input.roadmap.title,
        text: input.roadmap.city ?? input.roadmap.title,
      });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
