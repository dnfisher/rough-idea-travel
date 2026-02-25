"use client";

import { useEffect, useRef } from "react";

// ── Palette — Teal suitcase ──────────────────────────────────────

const C = {
  bodyFront: "#4A9E90",
  bodyFrontHi: "#5BB8A6",
  bodyFrontLo: "#3D8A7E",
  bodySide: "#367A70",
  bodyTop: "#5BB8A6",
  bodyBack: "#2D635A",
  outline: "#2A5E56",
  outlineSoft: "rgba(42,94,86,0.5)",
  eyeWhite: "#F0F3F5",
  pupil: "#1E2D35",
  shine: "rgba(255,255,255,0.85)",
  brow: "#2A5E56",
  mouthStroke: "#2A5E56",
  sunglassFrame: "#1E2D35",
  sunglassLens: "rgba(30,45,53,0.7)",
  sunglassShine: "rgba(255,255,255,0.15)",
  handle: "#8B9DA8",
  handleDark: "#5A6B78",
  wheelFill: "#2A3242",
  wheelStroke: "#5A6B78",
  wheelHub: "#8B9DA8",
  inner: "#2A4A44",
  innerBorder: "#2D5550",
  flapLine: "rgba(42,94,86,0.3)",
};

// ── Packing items with expression-matched reactions ──────────────

const ITEMS = [
  { l: "Tiny bikini", c: "#E88B9C", r: "wink" },
  { l: "Lucky underwear", c: "#C8A2D4", r: "wink" },
  { l: "Optimistic swimwear", c: "#6BBAD4", r: "wink" },
  { l: "Slightly spicy novel", c: "#D47070", r: "wink" },
  { l: "Main squeeze", c: "#E88BA0", r: "wink" },
  { l: "Flirty sundress", c: "#E8A0B8", r: "wink" },
  { l: "Main character energy", c: "#E8C46E", r: "sunglasses" },
  { l: "Overconfident itinerary", c: "#B8C470", r: "sunglasses" },
  { l: "Dubious vibes", c: "#B8A0D4", r: "sunglasses" },
  { l: "Suspicious snacks", c: "#D4A853", r: "guilty" },
  { l: "Contraband cheese", c: "#DBC078", r: "guilty" },
  { l: "Hotel slippers (stolen)", c: "#C4B8A4", r: "guilty" },
  { l: "Impulse buys (pre-trip)", c: "#C49470", r: "guilty" },
  { l: "Emergency wine", c: "#B46B82", r: "excited" },
  { l: "Chaotic playlist", c: "#B894C8", r: "excited" },
  { l: "Regrettable hat", c: "#A8C4A0", r: "nervous" },
  { l: "Hangover kit", c: "#90B88C", r: "nervous" },
  { l: "Bad decisions budget", c: "#70C4A0", r: "nervous" },
  { l: "Spare charger (lost already)", c: "#7A9B8A", r: "nervous" },
  { l: "Three outfits per day", c: "#D49080", r: "surprised" },
  { l: "Too many tote bags", c: "#C4A888", r: "surprised" },
  { l: "Passport panic", c: "#E87070", r: "surprised" },
  { l: "Questionable shorts", c: "#E8A870", r: "cheeky" },
  { l: "Midnight snack stash", c: "#D4A070", r: "cheeky" },
  { l: "A flask, just in case", c: "#8BA4B8", r: "cheeky" },
  { l: "Tanlines pending", c: "#E8A870", r: "dreamy" },
  { l: "Vacation brain", c: "#E8D094", r: "dreamy" },
  { l: "Nap schedule", c: "#C4B8D4", r: "dreamy" },
  { l: "Unread novel", c: "#7BA3C4", r: "thinking" },
  { l: "One sensible shoe", c: "#8B9DA4", r: "thinking" },
  { l: "Too much sunscreen", c: "#F2D98B", r: "pleased" },
  { l: "Zero plans", c: "#A8C4B8", r: "pleased" },
  { l: "Emotional support snack", c: "#D4B870", r: "pleased" },
  { l: "Delusional packing list", c: "#94A8D4", r: "smug" },
];

// ── Expression gaze map ──────────────────────────────────────────

const GAZE_MAP: Record<string, { x: number; y: number }> = {
  center: { x: 0, y: 0 }, up: { x: 0, y: -5 }, left: { x: -6, y: 0 },
  right: { x: 5, y: 1 }, upRight: { x: 4, y: -3 }, down: { x: 0, y: 4 },
};

const EXPR_GAZE: Record<string, string> = {
  curious: "right", excited: "upRight", thinking: "up", pleased: "center",
  surprised: "center", cheeky: "left", wink: "center", nervous: "left",
  smug: "right", dreamy: "up", guilty: "left", sunglasses: "center",
};

function getGoofForExpression(expr: string) {
  switch (expr) {
    case "excited": return { l: { x: 0, y: -1, size: 2.5 }, r: { x: 0, y: -1, size: 2.5 } };
    case "surprised": return { l: { x: 0, y: -2, size: 3.5 }, r: { x: 0, y: -2, size: 3.5 } };
    case "thinking": return { l: { x: -3, y: -2, size: 0 }, r: { x: 4, y: 2, size: -1 } };
    case "nervous": return { l: { x: 3, y: 0, size: -1 }, r: { x: -3, y: 0, size: -1 } };
    case "cheeky": return { l: { x: -2, y: -1, size: 2 }, r: { x: 2, y: 2, size: -2 } };
    case "smug": return { l: { x: 0, y: 0, size: -1.5 }, r: { x: 3, y: 0, size: 0 } };
    case "dreamy": return { l: { x: -1, y: -2, size: 1 }, r: { x: 1, y: -2, size: 1 } };
    case "guilty": return { l: { x: -4, y: 1, size: 0 }, r: { x: -2, y: -1, size: 0 } };
    case "sunglasses": return { l: { x: 0, y: 0, size: 0 }, r: { x: 0, y: 0, size: 0 } };
    default: return { l: { x: 0, y: 0, size: 0 }, r: { x: 0, y: 0, size: 0 } };
  }
}

// ── Geometry constants ───────────────────────────────────────────

const W = 680, H = 520;
const CX = W / 2, CY = H / 2 - 5;
const BW = 155, BH = 195;
const DX = 26, DY = -14;
const CORNER_R = 22;

// ── Types ────────────────────────────────────────────────────────

interface AnimState {
  t: number;
  blinkTimer: number;
  isBlinking: boolean;
  currentExpr: string;
  isWinking: boolean;
  gazeX: number;
  gazeY: number;
  flapAngle: number;
  flapTarget: number;
  hasSunglasses: boolean;
  sunglassAlpha: number;
  leftEyeExtra: { x: number; y: number; size: number };
  rightEyeExtra: { x: number; y: number; size: number };
  rafId: number;
  itemIntervalId: ReturnType<typeof setInterval> | null;
  pendingTimeouts: Set<ReturnType<typeof setTimeout>>;
  itemPool: typeof ITEMS;
  currentIndex: number;
  isAlmostDone: boolean;
}

// ── Component ────────────────────────────────────────────────────

interface Props {
  skipToEnd?: boolean;
}

export function ExploreLoadingState({ skipToEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<SVGPathElement>(null);
  const mountedRef = useRef(true);
  const stateRef = useRef<AnimState>({
    t: 0, blinkTimer: 0, isBlinking: false,
    currentExpr: "curious", isWinking: false,
    gazeX: 0, gazeY: 0,
    flapAngle: 0, flapTarget: 0,
    hasSunglasses: false, sunglassAlpha: 0,
    leftEyeExtra: { x: 0, y: 0, size: 0 },
    rightEyeExtra: { x: 0, y: 0, size: 0 },
    rafId: 0,
    itemIntervalId: null,
    pendingTimeouts: new Set(),
    itemPool: [],
    currentIndex: 0,
    isAlmostDone: false,
  });

  // Handle skipToEnd prop
  useEffect(() => {
    const s = stateRef.current;
    if (skipToEnd && !s.isAlmostDone) {
      s.isAlmostDone = true;
      s.currentIndex = 10;
      if (progressLineRef.current) {
        progressLineRef.current.style.strokeDashoffset = String(82 * 0.08);
      }
    }
  }, [skipToEnd]);

  // Main animation lifecycle
  useEffect(() => {
    mountedRef.current = true;
    const s = stateRef.current;
    const canvasEl = canvasRef.current;
    const sceneEl = sceneRef.current;
    if (!canvasEl || !sceneEl) return;
    const maybeCtx = canvasEl.getContext("2d");
    if (!maybeCtx) return;
    // Store as explicitly-typed consts so TypeScript narrows in nested closures
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const canvas: HTMLCanvasElement = canvasEl;
    const scene: HTMLDivElement = sceneEl;

    function safeTimeout(fn: () => void, delay: number) {
      const id = setTimeout(() => {
        s.pendingTimeouts.delete(id);
        if (mountedRef.current) fn();
      }, delay);
      s.pendingTimeouts.add(id);
      return id;
    }

    // ── Drawing helpers ──

    function drawChubbyRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawRoundedPoly(pts: { x: number; y: number }[], r: number) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const prev = pts[(i - 1 + pts.length) % pts.length];
        const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const rr = Math.min(r, len1 / 2, len2 / 2);
        const p1 = { x: curr.x + dx1 / len1 * rr, y: curr.y + dy1 / len1 * rr };
        const p2 = { x: curr.x + dx2 / len2 * rr, y: curr.y + dy2 / len2 * rr };
        if (i === 0) ctx.moveTo(p1.x, p1.y);
        else ctx.lineTo(p1.x, p1.y);
        ctx.quadraticCurveTo(curr.x, curr.y, p2.x, p2.y);
      }
      ctx.closePath();
    }

    // ── Wheels ──

    function drawWheels(f: { x: number; y: number; w: number; h: number }) {
      const wr = 9, hr = 3;
      const by = f.y + f.h + 5;
      const inset = 20;
      const wheels = [
        { x: f.x + inset + DX * 0.55, y: by + DY * 0.55 },
        { x: f.x + f.w - inset + DX * 0.55, y: by + DY * 0.55 },
        { x: f.x + inset, y: by },
        { x: f.x + f.w - inset, y: by },
      ];
      for (const wh of wheels) {
        ctx.strokeStyle = C.wheelStroke; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(wh.x, wh.y - wr - 3); ctx.lineTo(wh.x, wh.y - wr + 1); ctx.stroke();
        ctx.beginPath(); ctx.arc(wh.x, wh.y, wr, 0, Math.PI * 2);
        ctx.fillStyle = C.wheelFill; ctx.fill();
        ctx.strokeStyle = C.wheelStroke; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(wh.x, wh.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = C.wheelHub; ctx.fill();
      }
    }

    // ── Face ──

    function drawFace(fcx: number, fcy: number) {
      const sm = Math.sin(s.t * 0.5) * 0.5 + 0.5;
      const eyeSpacing = 23;
      const lx = fcx - eyeSpacing, ly = fcy;
      const rx = fcx + eyeSpacing, ry = fcy;
      const baseR = 13;
      const leftR = baseR + s.leftEyeExtra.size;
      const rightR = baseR + s.rightEyeExtra.size;
      const eSq = s.isBlinking ? 0.12 : 1;
      const rSq = Math.min(eSq, s.isWinking ? 0.08 : 1);
      const lgx = s.gazeX + s.leftEyeExtra.x;
      const lgy = s.gazeY + s.leftEyeExtra.y;
      const rgx = s.gazeX + s.rightEyeExtra.x;
      const rgy = s.gazeY + s.rightEyeExtra.y;

      // Eyebrows
      ctx.strokeStyle = C.brow; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      let lbY: number, rbY: number, lbT: number, rbT: number;
      switch (s.currentExpr) {
        case "curious": lbY = -2 + sm * .5; rbY = -4 - sm * .5; lbT = 0; rbT = -1; break;
        case "excited": lbY = -5 - sm; rbY = -5 - sm; lbT = 0; rbT = 0; break;
        case "thinking": lbY = -1 + sm; rbY = -5 - sm; lbT = 3; rbT = -2; break;
        case "pleased": lbY = -2; rbY = -2; lbT = 0; rbT = 0; break;
        case "surprised": lbY = -7 - sm; rbY = -7 - sm; lbT = 0; rbT = 0; break;
        case "cheeky": lbY = 1 + sm; rbY = -3; lbT = 3; rbT = -1; break;
        case "wink": lbY = -4 - sm; rbY = 0 + sm; lbT = 0; rbT = 1; break;
        case "nervous": lbY = 3 + sm; rbY = 3 + sm; lbT = -3; rbT = 3; break;
        case "smug": lbY = -1; rbY = -3; lbT = 0; rbT = -1; break;
        case "dreamy": lbY = -2; rbY = -2; lbT = 1; rbT = -1; break;
        case "guilty": lbY = 3 + sm; rbY = 3 + sm; lbT = -3; rbT = 3; break;
        case "sunglasses": lbY = -2; rbY = -2; lbT = 0; rbT = 0; break;
        default: lbY = -2; rbY = -2; lbT = 0; rbT = 0;
      }

      if (s.sunglassAlpha < 0.5) {
        const browAlpha = 1 - s.sunglassAlpha * 2;
        ctx.globalAlpha = browAlpha;
        ctx.beginPath();
        ctx.moveTo(lx - 12, ly - leftR - 4 + lbY + lbT);
        ctx.quadraticCurveTo(lx, ly - leftR - 8 + lbY, lx + 12, ly - leftR - 4 + lbY - lbT);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry - rightR - 4 + rbY + rbT);
        ctx.quadraticCurveTo(rx, ry - rightR - 8 + rbY, rx + 12, ry - rightR - 4 + rbY - rbT);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Left eye
      ctx.save();
      ctx.translate(lx, ly); ctx.scale(1, eSq);
      ctx.beginPath(); ctx.arc(0, 0, leftR, 0, Math.PI * 2);
      ctx.fillStyle = C.eyeWhite; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
      if (!s.isBlinking) {
        const pr = Math.max(3, 6.5 + s.leftEyeExtra.size * 0.3);
        ctx.beginPath(); ctx.arc(lgx, lgy, pr, 0, Math.PI * 2);
        ctx.fillStyle = C.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(lgx + 2.5, lgy - 2.5, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = C.shine; ctx.fill();
      }
      ctx.restore();

      // Right eye
      ctx.save();
      ctx.translate(rx, ry); ctx.scale(1, rSq);
      ctx.beginPath(); ctx.arc(0, 0, rightR, 0, Math.PI * 2);
      ctx.fillStyle = C.eyeWhite; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
      if (!s.isBlinking && !s.isWinking) {
        const pr = Math.max(3, 6.5 + s.rightEyeExtra.size * 0.3);
        ctx.beginPath(); ctx.arc(rgx, rgy, pr, 0, Math.PI * 2);
        ctx.fillStyle = C.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(rgx + 2.5, rgy - 2.5, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = C.shine; ctx.fill();
      }
      ctx.restore();

      // Wink line
      if (s.isWinking && !s.isBlinking) {
        ctx.strokeStyle = C.outline; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rx - 10, ry); ctx.quadraticCurveTo(rx, ry + 5, rx + 10, ry);
        ctx.stroke();
      }

      // Sunglasses
      if (s.sunglassAlpha > 0.02) {
        ctx.globalAlpha = s.sunglassAlpha;
        // Bridge
        ctx.strokeStyle = C.sunglassFrame; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(lx + leftR - 2, ly - 1); ctx.lineTo(rx - rightR + 2, ry - 1); ctx.stroke();
        // Left lens
        ctx.beginPath();
        drawChubbyRect(lx - leftR - 3, ly - leftR + 1, leftR * 2 + 6, leftR * 1.7, 8);
        const lgGrad = ctx.createLinearGradient(lx - leftR, ly - leftR, lx + leftR, ly + leftR * 0.5);
        lgGrad.addColorStop(0, "#1A2530"); lgGrad.addColorStop(0.4, "#253545");
        lgGrad.addColorStop(0.7, "#1E2D3A"); lgGrad.addColorStop(1, "#15202A");
        ctx.fillStyle = lgGrad; ctx.fill();
        ctx.strokeStyle = C.sunglassFrame; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx - leftR + 2, ly - leftR + 5);
        ctx.quadraticCurveTo(lx - 3, ly - leftR + 3, lx + 2, ly - leftR + 8);
        ctx.strokeStyle = "rgba(150,200,230,0.35)"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(lx + leftR - 5, ly + 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(150,200,230,0.2)"; ctx.fill();
        // Right lens
        ctx.beginPath();
        drawChubbyRect(rx - rightR - 3, ry - rightR + 1, rightR * 2 + 6, rightR * 1.7, 8);
        const rgGrad = ctx.createLinearGradient(rx - rightR, ry - rightR, rx + rightR, ry + rightR * 0.5);
        rgGrad.addColorStop(0, "#1A2530"); rgGrad.addColorStop(0.4, "#253545");
        rgGrad.addColorStop(0.7, "#1E2D3A"); rgGrad.addColorStop(1, "#15202A");
        ctx.fillStyle = rgGrad; ctx.fill();
        ctx.strokeStyle = C.sunglassFrame; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx - rightR + 2, ry - rightR + 5);
        ctx.quadraticCurveTo(rx - 3, ry - rightR + 3, rx + 2, ry - rightR + 8);
        ctx.strokeStyle = "rgba(150,200,230,0.35)"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(rx + rightR - 5, ry + 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(150,200,230,0.2)"; ctx.fill();
        // Arms
        ctx.strokeStyle = C.sunglassFrame; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx - leftR - 3, ly); ctx.lineTo(lx - leftR - 14, ly + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx + rightR + 3, ry); ctx.lineTo(rx + rightR + 14, ry + 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Mouth
      const my = fcy + 28;
      ctx.strokeStyle = C.mouthStroke; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      switch (s.currentExpr) {
        case "curious":
          ctx.beginPath(); ctx.moveTo(fcx - 14, my);
          ctx.quadraticCurveTo(fcx, my + 8 + sm * 3, fcx + 14, my); ctx.stroke(); break;
        case "excited":
          ctx.beginPath(); ctx.moveTo(fcx - 16, my - 2);
          ctx.quadraticCurveTo(fcx, my + 13 + sm * 2, fcx + 16, my - 2); ctx.stroke(); break;
        case "thinking":
          ctx.beginPath(); ctx.moveTo(fcx - 5, my + 3);
          ctx.quadraticCurveTo(fcx + 3, my + 7 + sm, fcx + 10, my + 2); ctx.stroke(); break;
        case "pleased":
          ctx.beginPath(); ctx.moveTo(fcx - 14, my);
          ctx.quadraticCurveTo(fcx, my + 10 + sm * 2, fcx + 14, my); ctx.stroke(); break;
        case "surprised":
          ctx.beginPath(); ctx.arc(fcx, my + 4, 7 + sm * 2, 0, Math.PI * 2); ctx.stroke(); break;
        case "cheeky":
          ctx.beginPath(); ctx.moveTo(fcx - 14, my + 1);
          ctx.quadraticCurveTo(fcx - 4, my + 8, fcx, my + 2);
          ctx.quadraticCurveTo(fcx + 8, my + 10 + sm * 3, fcx + 16, my - 2); ctx.stroke();
          ctx.fillStyle = "#D47070";
          ctx.beginPath(); ctx.arc(fcx + 10, my + 5 + sm, 3, 0, Math.PI); ctx.fill(); break;
        case "wink":
          ctx.beginPath(); ctx.moveTo(fcx - 14, my - 1);
          ctx.quadraticCurveTo(fcx - 10, my + 9, fcx, my + 11);
          ctx.quadraticCurveTo(fcx + 10, my + 9, fcx + 14, my - 1);
          ctx.quadraticCurveTo(fcx, my + 3, fcx - 14, my - 1);
          ctx.fillStyle = C.mouthStroke; ctx.fill(); break;
        case "nervous":
          ctx.beginPath(); ctx.moveTo(fcx - 13, my + 2);
          ctx.lineTo(fcx - 7, my - 2 + sm); ctx.lineTo(fcx - 1, my + 4);
          ctx.lineTo(fcx + 5, my - 1 + sm); ctx.lineTo(fcx + 13, my + 3); ctx.stroke(); break;
        case "smug":
          ctx.beginPath(); ctx.moveTo(fcx - 8, my + 2);
          ctx.quadraticCurveTo(fcx, my + 4, fcx + 6, my + 1);
          ctx.quadraticCurveTo(fcx + 14, my + 7 + sm * 2, fcx + 18, my - 2); ctx.stroke(); break;
        case "dreamy":
          ctx.beginPath(); ctx.moveTo(fcx - 12, my + 1);
          ctx.quadraticCurveTo(fcx, my + 8 + sm, fcx + 12, my + 1); ctx.stroke(); break;
        case "guilty":
          ctx.beginPath(); ctx.moveTo(fcx - 8, my + 3);
          ctx.quadraticCurveTo(fcx, my + 5, fcx + 8, my + 2); ctx.stroke(); break;
        case "sunglasses":
          ctx.beginPath(); ctx.moveTo(fcx - 12, my + 1);
          ctx.quadraticCurveTo(fcx - 2, my + 6, fcx + 4, my + 2);
          ctx.quadraticCurveTo(fcx + 12, my + 7 + sm, fcx + 16, my - 1); ctx.stroke(); break;
      }
    }

    // ── Main suitcase draw ──

    function drawSuitcase() {
      const f = { x: CX - BW / 2, y: CY - BH / 2, w: BW, h: BH };
      const bob = Math.sin(s.t * 1.0) * 5;

      ctx.save();
      ctx.translate(0, bob);

      // Shadow
      ctx.save();
      ctx.translate(0, -bob * 0.3);
      const shG = ctx.createRadialGradient(CX + 8, f.y + f.h + 26, 5, CX + 8, f.y + f.h + 26, 95);
      shG.addColorStop(0, "rgba(0,0,0,0.12)"); shG.addColorStop(1, "transparent");
      ctx.fillStyle = shG;
      ctx.fillRect(CX - 95, f.y + f.h + 6, 210, 44);
      ctx.restore();

      // Handle
      const handleCx = CX + DX * 0.55;
      const handleCy = f.y + DY * 0.35;
      const hh = 64;
      ctx.strokeStyle = C.handle; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(handleCx - 14, handleCy - 2); ctx.lineTo(handleCx - 14, handleCy - hh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(handleCx + 14, handleCy - 2); ctx.lineTo(handleCx + 14, handleCy - hh); ctx.stroke();
      ctx.strokeStyle = "rgba(160,180,195,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(handleCx - 13, handleCy - 2); ctx.lineTo(handleCx - 13, handleCy - hh); ctx.stroke();
      // Grip
      const gw = 36, gh = 11, gx = handleCx - gw / 2, gy = handleCy - hh - 7;
      drawChubbyRect(gx, gy, gw, gh, 5);
      ctx.fillStyle = C.handleDark; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();

      // Luggage tag
      const tagSway = Math.sin(s.t * 1.3 + 0.5) * 5;
      const tagAnchorX = handleCx - 14;
      const tagAnchorY = handleCy - hh * 0.45;
      const tagW = 24, tagH = 44, tagR = 6;
      const tagX = tagAnchorX - tagW - 8 + tagSway;
      const tagY = tagAnchorY + 4;
      ctx.save();
      ctx.translate(tagAnchorX, tagAnchorY);
      ctx.rotate(Math.sin(s.t * 1.3 + 0.5) * 0.12);
      ctx.translate(-tagAnchorX, -tagAnchorY);
      ctx.strokeStyle = "#D4856A"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tagAnchorX, tagAnchorY);
      ctx.quadraticCurveTo(tagAnchorX - tagW * 0.4, tagAnchorY - 3, tagX + tagW / 2, tagY + 1);
      ctx.stroke();
      drawChubbyRect(tagX, tagY, tagW, tagH, tagR);
      ctx.fillStyle = "#E8926E"; ctx.fill();
      ctx.strokeStyle = "#D47A5A"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 7, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#D47A5A"; ctx.fill();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 7, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#E8926E"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tagX + 5, tagY + 16); ctx.lineTo(tagX + tagW - 5, tagY + 16);
      ctx.moveTo(tagX + 5, tagY + 21); ctx.lineTo(tagX + tagW - 7, tagY + 21);
      ctx.moveTo(tagX + 5, tagY + 26); ctx.lineTo(tagX + tagW - 10, tagY + 26);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "9px sans-serif";
      ctx.fillText("\u2708", tagX + tagW / 2 - 4, tagY + tagH - 7);
      ctx.restore();

      // Top face
      const tp = [
        { x: f.x, y: f.y }, { x: f.x + DX, y: f.y + DY },
        { x: f.x + f.w + DX, y: f.y + DY }, { x: f.x + f.w, y: f.y },
      ];
      drawRoundedPoly(tp, 12);
      ctx.fillStyle = C.bodyTop; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(f.x + 20, f.y - 2); ctx.lineTo(f.x + f.w - 10 + DX * 0.5, f.y + DY * 0.5 - 2);
      ctx.stroke();

      // Right side
      const rp = [
        { x: f.x + f.w, y: f.y }, { x: f.x + f.w + DX, y: f.y + DY },
        { x: f.x + f.w + DX, y: f.y + f.h + DY }, { x: f.x + f.w, y: f.y + f.h },
      ];
      drawRoundedPoly(rp, 12);
      const sideGrad = ctx.createLinearGradient(f.x + f.w, 0, f.x + f.w + DX, 0);
      sideGrad.addColorStop(0, C.bodyFrontLo); sideGrad.addColorStop(1, C.bodySide);
      ctx.fillStyle = sideGrad; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();

      // Wheels
      drawWheels(f);

      // Inner compartment (behind flap)
      drawChubbyRect(f.x, f.y, f.w, f.h, CORNER_R);
      ctx.fillStyle = C.bodyBack; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
      const ip = 8;
      drawChubbyRect(f.x + ip, f.y + ip, f.w - ip * 2, f.h - ip * 2, 14);
      ctx.fillStyle = C.inner; ctx.fill();
      ctx.strokeStyle = C.innerBorder; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(91,184,166,0.15)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x + 22, f.y + 35); ctx.lineTo(f.x + f.w - 22, f.y + 35);
      ctx.moveTo(f.x + 22, f.y + f.h - 35); ctx.lineTo(f.x + f.w - 22, f.y + f.h - 35);
      ctx.stroke();

      // Front flap
      const fo = s.flapAngle;
      ctx.save();
      if (fo > 0.01) {
        const hingeX = f.x + f.w;
        const scaleX = 1 - fo * 0.72;
        const skewY = fo * 0.1;
        const shiftX = fo * DX * 0.55;
        const shiftY = fo * DY * 0.35;
        ctx.translate(hingeX, f.y);
        ctx.transform(scaleX, skewY, 0, 1, shiftX, shiftY);
        ctx.translate(-hingeX, -f.y);
      }
      drawChubbyRect(f.x, f.y, f.w, f.h, CORNER_R);
      const flapGrad = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
      flapGrad.addColorStop(0, C.bodyFrontHi);
      flapGrad.addColorStop(0.35, C.bodyFront);
      flapGrad.addColorStop(1, C.bodyFrontLo);
      ctx.fillStyle = flapGrad; ctx.fill();
      ctx.strokeStyle = C.outline; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(f.x + CORNER_R, f.y + 2); ctx.lineTo(f.x + f.w - CORNER_R, f.y + 2);
      ctx.stroke();
      ctx.strokeStyle = C.flapLine; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(f.x + 24, f.y + f.h * 0.73); ctx.lineTo(f.x + f.w - 24, f.y + f.h * 0.73);
      ctx.stroke();
      drawChubbyRect(f.x + f.w / 2 - 10, f.y + f.h - 20, 20, 5, 2.5);
      ctx.fillStyle = "rgba(42,94,86,0.2)"; ctx.fill();
      ctx.fillStyle = C.outline;
      for (let i = 0; i < 3; i++) {
        const hy = f.y + 35 + i * (f.h - 70) / 2;
        ctx.beginPath(); ctx.arc(f.x + f.w - 7, hy, 2, 0, Math.PI * 2); ctx.fill();
      }

      // Face on the flap
      drawFace(f.x + f.w / 2, f.y + f.h * 0.40);

      ctx.restore(); // flap transform
      ctx.restore(); // bob
    }

    // ── Goofiness update ──

    function updateGoofiness() {
      const target = getGoofForExpression(s.currentExpr);
      const spd = 0.08;
      s.leftEyeExtra.x += (target.l.x - s.leftEyeExtra.x) * spd;
      s.leftEyeExtra.y += (target.l.y - s.leftEyeExtra.y) * spd;
      s.leftEyeExtra.size += (target.l.size - s.leftEyeExtra.size) * spd;
      s.rightEyeExtra.x += (target.r.x - s.rightEyeExtra.x) * spd;
      s.rightEyeExtra.y += (target.r.y - s.rightEyeExtra.y) * spd;
      s.rightEyeExtra.size += (target.r.size - s.rightEyeExtra.size) * spd;
      const sgTarget = s.hasSunglasses ? 1 : 0;
      s.sunglassAlpha += (sgTarget - s.sunglassAlpha) * 0.12;
    }

    // ── Animation loop ──

    function animate() {
      if (!mountedRef.current) return;
      s.t += 0.016;
      s.blinkTimer += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Blink
      if (s.blinkTimer > 2.5 + Math.random() * 2.5) {
        s.isBlinking = true;
        s.blinkTimer = 0;
        safeTimeout(() => { s.isBlinking = false; }, 110);
      }

      // Gaze
      let tg = GAZE_MAP[EXPR_GAZE[s.currentExpr] || "center"] || GAZE_MAP.center;
      const fi = scene.querySelector(".flying-item.fly");
      if (fi) {
        const r = fi.getBoundingClientRect();
        const sr = scene.getBoundingClientRect();
        tg = {
          x: Math.max(-7, Math.min(7, ((r.left - sr.left) / sr.width - 0.5) * 18)),
          y: Math.max(-6, Math.min(6, ((r.top - sr.top) / sr.height - 0.45) * 12)),
        };
      }
      s.gazeX += (tg.x + Math.sin(s.t * 1.2) * 0.5 - s.gazeX) * 0.08;
      s.gazeY += (tg.y + Math.cos(s.t * 0.9) * 0.4 - s.gazeY) * 0.08;

      // Flap + goofiness
      s.flapAngle += (s.flapTarget - s.flapAngle) * 0.12;
      updateGoofiness();

      drawSuitcase();
      s.rafId = requestAnimationFrame(animate);
    }

    // ── Item launching ──

    function shufflePool() {
      s.itemPool = [...ITEMS].sort(() => Math.random() - 0.5);
    }

    function openFlap() { s.flapTarget = 1; }
    function closeFlap() { s.flapTarget = 0; }

    function launch() {
      if (!mountedRef.current || !scene) return;
      if (s.itemPool.length === 0) shufflePool();
      const it = s.itemPool.pop()!;

      // Expression
      s.hasSunglasses = it.r === "sunglasses";
      s.currentExpr = it.r;
      s.isWinking = it.r === "wink";
      const dur = it.r === "wink" ? 600 : it.r === "sunglasses" ? 2000 : 1800;
      safeTimeout(() => {
        s.currentExpr = "curious";
        s.isWinking = false;
        s.hasSunglasses = false;
      }, dur);

      openFlap();

      // Create flying item element
      const el = document.createElement("div");
      el.className = "flying-item";
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = it.c;
      el.appendChild(dot);
      el.appendChild(document.createTextNode(it.l));

      const side = Math.random();
      let sx: number, sy: number;
      if (side < 0.35) { sx = -90 + Math.random() * 20; sy = 50 + Math.random() * 120; }
      else if (side < 0.65) { sx = 40 + Math.random() * 140; sy = -50 + Math.random() * 20; }
      else { sx = 280 + Math.random() * 50; sy = 50 + Math.random() * 120; }
      const ex = 138 + Math.random() * 35;
      const ey = 118 + Math.random() * 30;

      el.style.setProperty("--sx", sx + "px");
      el.style.setProperty("--sy", sy + "px");
      el.style.setProperty("--ex", ex + "px");
      el.style.setProperty("--ey", ey + "px");
      el.style.setProperty("--sr", ((Math.random() - 0.5) * 30) + "deg");

      scene.appendChild(el);
      requestAnimationFrame(() => el.classList.add("fly"));
      safeTimeout(closeFlap, 1600);
      safeTimeout(() => el.remove(), 2200);

      // Progress
      s.currentIndex++;
      const progress = Math.min((s.currentIndex / 12) * 100, 100);
      if (progressLineRef.current && !s.isAlmostDone) {
        progressLineRef.current.style.strokeDashoffset = String(82 * (1 - progress / 100));
      }
    }

    // ── Start ──
    s.currentIndex = 0;
    s.isAlmostDone = false;
    s.flapAngle = 0;
    s.flapTarget = 0;
    s.hasSunglasses = false;
    s.sunglassAlpha = 0;
    if (progressLineRef.current) progressLineRef.current.style.strokeDashoffset = "82";
    shufflePool();
    safeTimeout(launch, 800);
    s.itemIntervalId = setInterval(() => {
      if (mountedRef.current) launch();
    }, 3200);
    s.rafId = requestAnimationFrame(animate);

    // ── Cleanup ──
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(s.rafId);
      if (s.itemIntervalId) clearInterval(s.itemIntervalId);
      s.pendingTimeouts.forEach((id) => clearTimeout(id));
      s.pendingTimeouts.clear();
      scene.querySelectorAll(".flying-item").forEach((el) => el.remove());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex items-center justify-center shadow-sm">
      <div className="loader-container">
        <div className="loader-scene" ref={sceneRef}>
          <canvas ref={canvasRef} width={680} height={520} style={{ width: "340px", height: "260px" }} />
        </div>
        <div className="phrase-container">
          <span className="loading-text">Loading...</span>
        </div>
        <div className="progress-track">
          <svg viewBox="0 0 80 6">
            <path d="M2 3Q10 1,20 3.5Q30 5.5,40 3Q50 .5,60 3.5Q70 5,78 3" stroke="rgba(91,184,166,.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M2 3Q10 1,20 3.5Q30 5.5,40 3Q50 .5,60 3.5Q70 5,78 3" stroke="rgba(91,184,166,.5)" strokeWidth="2" fill="none" strokeLinecap="round" ref={progressLineRef} style={{ strokeDasharray: 82, strokeDashoffset: 82 }} />
          </svg>
        </div>
      </div>
    </div>
  );
}
