"use client";

import { useEffect, useRef } from "react";

const C = {
  bodyFront: "#4A9E90",
  bodyFrontHi: "#5BB8A6",
  bodyFrontLo: "#3D8A7E",
  bodySide: "#367A70",
  bodyTop: "#5BB8A6",
  outline: "#2A5E56",
  eyeWhite: "#F0F3F5",
  pupil: "#1E2D35",
  shine: "rgba(255,255,255,0.85)",
  brow: "#2A5E56",
  mouthStroke: "#2A5E56",
  handle: "#8B9DA8",
  handleDark: "#5A6B78",
  wheelFill: "#2A3242",
  wheelStroke: "#5A6B78",
  wheelHub: "#8B9DA8",
  flapLine: "rgba(42,94,86,0.3)",
  zColor: "rgba(91,184,166,0.45)",
};

const W = 680, H = 520;
const centerX = W / 2, centerY = H / 2 - 5;
const bw = 155, bh = 195;
const ddx = 26, ddy = -14;

interface ZParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; rotation: number;
  rotSpeed: number; wobble: number;
}

interface AnimState {
  t: number;
  sleepPhase: "sleeping" | "startling" | "awake" | "drifting";
  phaseTimer: number;
  tiltAngle: number; tiltTarget: number;
  eyeOpenness: number; eyeTarget: number;
  mouthState: number; breathScale: number;
  zParticles: ZParticle[];
  zSpawnTimer: number;
  rafId: number;
}

interface Props {
  onRetry?: () => void;
}

export function TimeoutState({ onRetry }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const stateRef = useRef<AnimState>({
    t: 0,
    sleepPhase: "sleeping", phaseTimer: 0,
    tiltAngle: 0.06, tiltTarget: 0.06,
    eyeOpenness: 0, eyeTarget: 0,
    mouthState: 0, breathScale: 0,
    zParticles: [], zSpawnTimer: 0,
    rafId: 0,
  });

  useEffect(() => {
    mountedRef.current = true;
    const s = stateRef.current;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const maybeCtx = canvasEl.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // Reset state
    s.t = 0;
    s.sleepPhase = "sleeping";
    s.phaseTimer = 0;
    s.tiltAngle = 0.06;
    s.tiltTarget = 0.06;
    s.eyeOpenness = 0;
    s.eyeTarget = 0;
    s.mouthState = 0;
    s.zParticles = [];
    s.zSpawnTimer = 0;

    function frontRect() { return { x: centerX - bw / 2, y: centerY - bh / 2, w: bw, h: bh }; }

    function drawChubbyRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawRoundedPoly(pts: { x: number; y: number }[], r: number) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const curr = pts[i], next = pts[(i + 1) % pts.length], prev = pts[(i - 1 + pts.length) % pts.length];
        const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1), l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const rr = Math.min(r, l1 / 2, l2 / 2);
        const p1 = { x: curr.x + dx1 / l1 * rr, y: curr.y + dy1 / l1 * rr };
        const p2 = { x: curr.x + dx2 / l2 * rr, y: curr.y + dy2 / l2 * rr };
        if (i === 0) ctx.moveTo(p1.x, p1.y); else ctx.lineTo(p1.x, p1.y);
        ctx.quadraticCurveTo(curr.x, curr.y, p2.x, p2.y);
      }
      ctx.closePath();
    }

    function drawWheels(f: { x: number; y: number; w: number; h: number }) {
      const wr = 9, hr = 3, by = f.y + f.h + 5, inset = 20;
      const wheels = [
        { x: f.x + inset + ddx * 0.55, y: by + ddy * 0.55 },
        { x: f.x + f.w - inset + ddx * 0.55, y: by + ddy * 0.55 },
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

    function updatePhase() {
      s.phaseTimer += 0.016;
      switch (s.sleepPhase) {
        case "sleeping":
          s.tiltTarget = 0.06;
          s.eyeTarget = 0;
          s.mouthState += (0 - s.mouthState) * 0.05;
          s.zSpawnTimer += 0.016;
          if (s.zSpawnTimer > 1.2) { s.zSpawnTimer = 0; spawnZ(); }
          if (s.phaseTimer > 4 + Math.random() * 3) { s.sleepPhase = "startling"; s.phaseTimer = 0; }
          break;
        case "startling":
          s.tiltTarget = -0.03;
          s.eyeTarget = 1.3;
          s.mouthState += (1 - s.mouthState) * 0.2;
          if (s.phaseTimer > 0.6) { s.sleepPhase = "awake"; s.phaseTimer = 0; }
          break;
        case "awake":
          s.tiltTarget = 0;
          s.eyeTarget = 1;
          s.mouthState += (0.3 - s.mouthState) * 0.08;
          if (s.phaseTimer > 1.8) { s.sleepPhase = "drifting"; s.phaseTimer = 0; }
          break;
        case "drifting":
          s.tiltTarget = 0.04;
          s.eyeTarget = 0;
          s.mouthState += (0 - s.mouthState) * 0.03;
          if (s.phaseTimer > 2.5) { s.sleepPhase = "sleeping"; s.phaseTimer = 0; }
          break;
      }
      s.tiltAngle += (s.tiltTarget - s.tiltAngle) * 0.06;
      s.eyeOpenness += (s.eyeTarget - s.eyeOpenness) * 0.1;
      s.breathScale = Math.sin(s.t * 1.5) * 0.008;
    }

    function spawnZ() {
      const f = frontRect();
      s.zParticles.push({
        x: f.x + f.w * 0.7, y: f.y + f.h * 0.15,
        vx: 0.3 + Math.random() * 0.3, vy: -0.8 - Math.random() * 0.3,
        size: 14 + Math.random() * 8, alpha: 0.7,
        rotation: (Math.random() - 0.5) * 0.3,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    function updateAndDrawZs() {
      for (let i = s.zParticles.length - 1; i >= 0; i--) {
        const z = s.zParticles[i];
        z.x += z.vx; z.y += z.vy;
        z.vx += Math.sin(z.wobble + s.t * 2) * 0.02;
        z.alpha -= 0.004; z.rotation += z.rotSpeed; z.size += 0.08;
        if (z.alpha <= 0) { s.zParticles.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(z.x, z.y); ctx.rotate(z.rotation);
        ctx.globalAlpha = z.alpha * (s.sleepPhase === "startling" ? 0.2 : 1);
        ctx.font = `bold ${Math.round(z.size)}px 'DM Sans', sans-serif`;
        ctx.fillStyle = C.zColor; ctx.textAlign = "center";
        ctx.fillText("z", 0, 0);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function drawFace(fcx: number, fcy: number) {
      const sm = Math.sin(s.t * 0.5) * 0.5 + 0.5;
      const eyeSpacing = 23, baseR = 13;
      const lx = fcx - eyeSpacing, ly = fcy, rx = fcx + eyeSpacing, ry = fcy;
      const eo = Math.max(0, Math.min(1.3, s.eyeOpenness));
      const eyeScale = 0.08 + eo * 0.92;

      let gx = 0, gy = 0;
      if (s.sleepPhase === "startling") { gx = Math.sin(s.phaseTimer * 12) * 5; gy = -2; }
      else if (s.sleepPhase === "awake") { gx = Math.sin(s.t * 2.5) * 4; gy = Math.cos(s.t * 1.8) * 2 - 1; }

      // Brows
      ctx.strokeStyle = C.brow; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      let lbY: number, rbY: number, lbT: number, rbT: number;
      if (s.sleepPhase === "sleeping" || s.sleepPhase === "drifting") { lbY = 2; rbY = 2; lbT = 1; rbT = -1; }
      else if (s.sleepPhase === "startling") { lbY = -7 - sm; rbY = -7 - sm; lbT = 0; rbT = 0; }
      else { lbY = -2 + sm; rbY = -4 - sm; lbT = 1; rbT = -1; }

      ctx.beginPath();
      ctx.moveTo(lx - 12, ly - baseR - 4 + lbY + lbT);
      ctx.quadraticCurveTo(lx, ly - baseR - 8 + lbY, lx + 12, ly - baseR - 4 + lbY - lbT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - 12, ry - baseR - 4 + rbY + rbT);
      ctx.quadraticCurveTo(rx, ry - baseR - 8 + rbY, rx + 12, ry - baseR - 4 + rbY - rbT);
      ctx.stroke();

      // Eyes
      for (const [ex, ey] of [[lx, ly], [rx, ry]]) {
        ctx.save();
        ctx.translate(ex, ey); ctx.scale(1, eyeScale);
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = C.eyeWhite; ctx.fill();
        ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
        if (eo > 0.15) {
          ctx.beginPath(); ctx.arc(gx, gy, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = C.pupil; ctx.fill();
          ctx.beginPath(); ctx.arc(gx + 2.5, gy - 2.5, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = C.shine; ctx.fill();
        }
        ctx.restore();
      }

      // Closed eye lines
      if (eo < 0.4) {
        const closedAlpha = 1 - eo * 2.5;
        ctx.globalAlpha = closedAlpha;
        ctx.strokeStyle = C.outline; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(lx - 9, ly + 1); ctx.quadraticCurveTo(lx, ly + 4, lx + 9, ly + 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx - 9, ry + 1); ctx.quadraticCurveTo(rx, ry + 4, rx + 9, ry + 1); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Mouth
      const my = fcy + 28;
      ctx.strokeStyle = C.mouthStroke; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      if (s.mouthState < 0.3) {
        const snore = Math.sin(s.t * 1.5) * 2;
        ctx.beginPath(); ctx.moveTo(fcx - 5, my + 1);
        ctx.quadraticCurveTo(fcx, my + 4 + snore, fcx + 5, my + 1); ctx.stroke();
        if (s.sleepPhase === "sleeping" && Math.sin(s.t * 0.3) > 0.6) {
          ctx.globalAlpha = 0.3;
          ctx.beginPath(); ctx.moveTo(fcx + 4, my + 3 + snore);
          ctx.quadraticCurveTo(fcx + 6, my + 8 + snore, fcx + 5, my + 12); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else if (s.mouthState > 0.7) {
        const oSize = 7 + sm * 2;
        ctx.beginPath(); ctx.arc(fcx, my + 4, oSize, 0, Math.PI * 2); ctx.stroke();
      } else {
        const blend = (s.mouthState - 0.3) / 0.4;
        const sz = 3 + blend * 5;
        ctx.beginPath(); ctx.arc(fcx, my + 3, sz, 0, Math.PI * 2); ctx.stroke();
      }
    }

    function drawSuitcase() {
      const f = frontRect();
      const bob = Math.sin(s.t * 0.7) * 3;
      const cornerR = 22;

      ctx.save();
      ctx.translate(centerX, f.y + f.h);
      ctx.rotate(s.tiltAngle);
      ctx.scale(1 + s.breathScale, 1 - s.breathScale * 0.5);
      ctx.translate(-centerX, -(f.y + f.h));
      ctx.translate(0, bob);

      // Shadow
      ctx.save(); ctx.translate(0, -bob * 0.3);
      const shG = ctx.createRadialGradient(centerX + 8, f.y + f.h + 26, 5, centerX + 8, f.y + f.h + 26, 95);
      shG.addColorStop(0, "rgba(0,0,0,0.12)"); shG.addColorStop(1, "transparent");
      ctx.fillStyle = shG; ctx.fillRect(centerX - 95, f.y + f.h + 6, 210, 44);
      ctx.restore();

      // Handle
      const handleCx = centerX + ddx * 0.55, handleCy = f.y + ddy * 0.35, hh = 64;
      ctx.strokeStyle = C.handle; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(handleCx - 14, handleCy - 2); ctx.lineTo(handleCx - 14, handleCy - hh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(handleCx + 14, handleCy - 2); ctx.lineTo(handleCx + 14, handleCy - hh); ctx.stroke();
      ctx.strokeStyle = "rgba(160,180,195,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(handleCx - 13, handleCy - 2); ctx.lineTo(handleCx - 13, handleCy - hh); ctx.stroke();
      const gw = 36, gx = handleCx - gw / 2, gy = handleCy - hh - 7;
      drawChubbyRect(gx, gy, gw, 11, 5);
      ctx.fillStyle = C.handleDark; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();

      // Tag
      const tagSway = Math.sin(s.t * 0.8) * 2;
      const tagAnchorX = handleCx - 14, tagAnchorY = handleCy - hh * 0.45;
      const tagW = 24, tagH = 44, tagR = 6;
      const tagX = tagAnchorX - tagW - 8 + tagSway, tagY = tagAnchorY + 4;
      ctx.save();
      ctx.translate(tagAnchorX, tagAnchorY);
      ctx.rotate(Math.sin(s.t * 0.8) * 0.06 + 0.05);
      ctx.translate(-tagAnchorX, -tagAnchorY);
      ctx.strokeStyle = "#D4856A"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(tagAnchorX, tagAnchorY);
      ctx.quadraticCurveTo(tagAnchorX - tagW * 0.4, tagAnchorY - 3, tagX + tagW / 2, tagY + 1); ctx.stroke();
      drawChubbyRect(tagX, tagY, tagW, tagH, tagR);
      ctx.fillStyle = "#E8926E"; ctx.fill(); ctx.strokeStyle = "#D47A5A"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 7, 3, 0, Math.PI * 2); ctx.fillStyle = "#D47A5A"; ctx.fill();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 7, 1.5, 0, Math.PI * 2); ctx.fillStyle = "#E8926E"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tagX + 5, tagY + 16); ctx.lineTo(tagX + tagW - 5, tagY + 16);
      ctx.moveTo(tagX + 5, tagY + 21); ctx.lineTo(tagX + tagW - 7, tagY + 21);
      ctx.moveTo(tagX + 5, tagY + 26); ctx.lineTo(tagX + tagW - 10, tagY + 26);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "9px sans-serif";
      ctx.fillText("\u2708", tagX + tagW / 2 - 4, tagY + tagH - 7);
      ctx.restore();

      // Top face
      const tp = [
        { x: f.x, y: f.y }, { x: f.x + ddx, y: f.y + ddy },
        { x: f.x + f.w + ddx, y: f.y + ddy }, { x: f.x + f.w, y: f.y },
      ];
      drawRoundedPoly(tp, 12);
      ctx.fillStyle = C.bodyTop; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x + 20, f.y - 2); ctx.lineTo(f.x + f.w - 10 + ddx * 0.5, f.y + ddy * 0.5 - 2); ctx.stroke();

      // Right side
      const rp = [
        { x: f.x + f.w, y: f.y }, { x: f.x + f.w + ddx, y: f.y + ddy },
        { x: f.x + f.w + ddx, y: f.y + f.h + ddy }, { x: f.x + f.w, y: f.y + f.h },
      ];
      drawRoundedPoly(rp, 12);
      const sG = ctx.createLinearGradient(f.x + f.w, 0, f.x + f.w + ddx, 0);
      sG.addColorStop(0, C.bodyFrontLo); sG.addColorStop(1, C.bodySide);
      ctx.fillStyle = sG; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();

      // Wheels
      drawWheels(f);

      // Front face
      drawChubbyRect(f.x, f.y, f.w, f.h, cornerR);
      const fG = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
      fG.addColorStop(0, C.bodyFrontHi); fG.addColorStop(0.35, C.bodyFront); fG.addColorStop(1, C.bodyFrontLo);
      ctx.fillStyle = fG; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2.5; ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(f.x + cornerR, f.y + 2); ctx.lineTo(f.x + f.w - cornerR, f.y + 2); ctx.stroke();
      ctx.strokeStyle = C.flapLine; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(f.x + 24, f.y + f.h * 0.73); ctx.lineTo(f.x + f.w - 24, f.y + f.h * 0.73); ctx.stroke();
      drawChubbyRect(f.x + f.w / 2 - 10, f.y + f.h - 20, 20, 5, 2.5);
      ctx.fillStyle = "rgba(42,94,86,0.2)"; ctx.fill();
      ctx.fillStyle = C.outline;
      for (let i = 0; i < 3; i++) {
        const hy = f.y + 35 + i * (f.h - 70) / 2;
        ctx.beginPath(); ctx.arc(f.x + f.w - 7, hy, 2, 0, Math.PI * 2); ctx.fill();
      }

      drawFace(f.x + f.w / 2, f.y + f.h * 0.40);
      ctx.restore();
    }

    function animate() {
      if (!mountedRef.current) return;
      s.t += 0.016;
      ctx.clearRect(0, 0, W, H);
      updatePhase();
      drawSuitcase();
      updateAndDrawZs();
      s.rafId = requestAnimationFrame(animate);
    }

    s.rafId = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(s.rafId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="timeout-state">
      <div className="timeout-state__scene">
        <canvas ref={canvasRef} width={680} height={520} style={{ width: "340px", height: "260px" }} />
      </div>
      <div className="timeout-state__message">
        <span className="timeout-state__text">We nodded off. Try again?</span>
        {onRetry && (
          <button className="timeout-state__retry" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
