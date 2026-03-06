"use client";

import { useEffect, useRef } from "react";

const C = {
  bodyFront: "#4A9E90", bodyFrontHi: "#5BB8A6", bodyFrontLo: "#3D8A7E",
  bodySide: "#367A70", bodyTop: "#5BB8A6", outline: "#2A5E56",
  eyeWhite: "#F0F3F5", pupil: "#1E2D35", shine: "rgba(255,255,255,0.85)",
  brow: "#2A5E56", mouthStroke: "#2A5E56",
  handle: "#8B9DA8", handleDark: "#5A6B78",
  flapLine: "rgba(42,94,86,0.3)",
  steelTop: "#CDD5DD", steelLight: "#BCC6D0", steelMid: "#A0ACB8",
  steelFace: "#B0BAC4", steelDark: "#8C98A6", steelEdge: "#707E8E",
  steelHighlight: "rgba(255,255,255,0.25)",
  rubber: "#282E36", rubberAlt: "#323840", rubberGap: "#1A1E24",
  rubberShine: "rgba(255,255,255,0.04)",
  signBg: "#1A2030", signText: "#D8DDE4", signPole: "#8C98A6",
};

const W = 1000, H = 520;
const beltY = 320, beltH = 14, frameH = 80, frameTop = 10;
const beltMargin = 150;
const beltLeft = beltMargin, beltRight = W - beltMargin;
const slatW = 18, slatGap = 2, slatStep = slatW + slatGap;
const rollerR = 12, rollerSpacing = 140;
const suitW = 120, suitH = 155;
const suitHalf = suitW * 0.85 / 2;
const enterX = beltLeft - suitHalf;
const exitX = beltRight + suitHalf;
const suitSpeed = 1.0;

interface AnimState {
  t: number; suitX: number; slatOffset: number;
  mood: number; moodTarget: number;
  lookDir: number; lookTarget: number;
  passCount: number; blinkTimer: number; isBlinking: boolean;
  rafId: number;
}

export function NotFoundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const stateRef = useRef<AnimState>({
    t: 0, suitX: enterX, slatOffset: 0,
    mood: 0, moodTarget: 0, lookDir: 0, lookTarget: 0,
    passCount: 0, blinkTimer: 0, isBlinking: false, rafId: 0,
  });

  useEffect(() => {
    mountedRef.current = true;
    const s = stateRef.current;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const maybeCtx = canvasEl.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    s.t = 0; s.suitX = enterX; s.slatOffset = 0;
    s.mood = 0; s.moodTarget = 0; s.lookDir = 0; s.lookTarget = 0;
    s.passCount = 0; s.blinkTimer = 0; s.isBlinking = false;

    function drawChubbyRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawBelt() {
      const bL = beltLeft, bR = beltRight;
      const frameY = beltY + beltH;

      drawChubbyRect(bL - 8, frameY, bR - bL + 16, frameH, 6);
      const fG = ctx.createLinearGradient(0, frameY, 0, frameY + frameH);
      fG.addColorStop(0, C.steelFace); fG.addColorStop(0.3, C.steelDark); fG.addColorStop(1, "#6B7888");
      ctx.fillStyle = fG; ctx.fill(); ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 1.5; ctx.stroke();

      const lipY = beltY - frameTop;
      drawChubbyRect(bL - 8, lipY, bR - bL + 16, frameTop, 4);
      const lipG = ctx.createLinearGradient(0, lipY, 0, beltY);
      lipG.addColorStop(0, C.steelTop); lipG.addColorStop(0.5, C.steelFace); lipG.addColorStop(1, C.steelDark);
      ctx.fillStyle = lipG; ctx.fill(); ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 1; ctx.stroke();

      ctx.strokeStyle = C.steelHighlight; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bL - 2, lipY + 1); ctx.lineTo(bR + 2, lipY + 1); ctx.stroke();

      // Rubber slats
      ctx.save();
      ctx.beginPath(); ctx.rect(bL - 2, beltY - 1, bR - bL + 4, beltH + 2); ctx.clip();
      ctx.fillStyle = C.rubberGap; ctx.fillRect(bL, beltY, bR - bL, beltH);

      const startSlat = Math.floor((bL - s.slatOffset) / slatStep) - 1;
      const endSlat = Math.ceil((bR - s.slatOffset) / slatStep) + 1;
      for (let i = startSlat; i <= endSlat; i++) {
        const x = i * slatStep + s.slatOffset;
        if (x + slatW < bL || x > bR) continue;
        ctx.fillStyle = ((i % 2) + 2) % 2 ? C.rubber : C.rubberAlt;
        ctx.fillRect(x, beltY, slatW, beltH);
        ctx.strokeStyle = C.rubberShine; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 1, beltY + 1); ctx.lineTo(x + slatW - 1, beltY + 1); ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath(); ctx.moveTo(x + 1, beltY + beltH - 1); ctx.lineTo(x + slatW - 1, beltY + beltH - 1); ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bL, beltY); ctx.lineTo(bR, beltY); ctx.stroke();

      // Rollers
      const rollerY = frameY + 28;
      for (let rx = bL + rollerSpacing / 2; rx < bR; rx += rollerSpacing) {
        ctx.beginPath(); ctx.arc(rx, rollerY, rollerR, 0, Math.PI * 2);
        const rG = ctx.createRadialGradient(rx - 3, rollerY - 3, 2, rx, rollerY, rollerR);
        rG.addColorStop(0, "#9AA6B4"); rG.addColorStop(0.5, "#707E8E"); rG.addColorStop(1, "#5A6878");
        ctx.fillStyle = rG; ctx.fill(); ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(rx, rollerY, 3, 0, Math.PI * 2); ctx.fillStyle = "#5A6878"; ctx.fill();
        ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rx - rollerR - 4, rollerY); ctx.lineTo(rx - rollerR - 4, frameY + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx + rollerR + 4, rollerY); ctx.lineTo(rx + rollerR + 4, frameY + 2); ctx.stroke();
      }
    }

    function drawSign() {
      const signX = W / 2, signW = 240, signH = 100;
      const signY = beltY - frameTop - 180;

      ctx.strokeStyle = C.signPole; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(signX - 60, beltY - frameTop); ctx.lineTo(signX - 60, signY + signH + 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(signX + 60, beltY - frameTop); ctx.lineTo(signX + 60, signY + signH + 10); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(signX - signW / 2 - 8, signY + signH + 10); ctx.lineTo(signX + signW / 2 + 8, signY + signH + 10); ctx.stroke();

      drawChubbyRect(signX - signW / 2, signY, signW, signH, 8);
      ctx.fillStyle = C.signBg; ctx.fill(); ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 2; ctx.stroke();
      drawChubbyRect(signX - signW / 2 + 6, signY + 6, signW - 12, signH - 12, 4);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; ctx.stroke();

      ctx.font = 'bold 52px "DM Sans", sans-serif';
      ctx.fillStyle = C.signText; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("404", signX, signY + signH / 2 + 2);

      ctx.beginPath(); ctx.arc(signX + signW / 2 - 18, signY + 16, 5, 0, Math.PI * 2);
      ctx.fillStyle = Math.sin(s.t * 2) > 0 ? "#5BB8A6" : "rgba(91,184,166,0.2)"; ctx.fill();
    }

    function drawFace(fcx: number, fcy: number, sc: number) {
      const sm = Math.sin(s.t * 0.5) * 0.5 + 0.5;
      const eyeSpacing = 18 * sc, baseR = 11 * sc, pupR = 5.5 * sc;
      const lx = fcx - eyeSpacing, ly = fcy, rx = fcx + eyeSpacing, ry = fcy;
      const m = s.mood;
      const gaze = s.lookDir * 5 * sc;
      const gazeY = m > 0.3 ? -2 * sc : (m < -0.3 ? 2 * sc : 0);

      s.blinkTimer += 0.016;
      if (s.blinkTimer > 2.5 + Math.random() * 2.5) { s.isBlinking = true; s.blinkTimer = 0; setTimeout(() => { s.isBlinking = false; }, 120); }
      const blinkSq = s.isBlinking ? 0.1 : 1;

      ctx.strokeStyle = C.brow; ctx.lineWidth = 2.5 * sc; ctx.lineCap = "round";
      let lbY: number, rbY: number, lbT: number, rbT: number;
      if (m > 0.4) { lbY = (-4 - sm * 2) * sc; rbY = (-4 - sm * 2) * sc; lbT = 0; rbT = 0; }
      else if (m < -0.4) { lbY = (3 + sm) * sc; rbY = (3 + sm) * sc; lbT = -2.5 * sc; rbT = 2.5 * sc; }
      else { lbY = -2 * sc; rbY = -2 * sc; lbT = 0; rbT = 0; }
      ctx.beginPath(); ctx.moveTo(lx - 10 * sc, ly - baseR - 3 * sc + lbY + lbT);
      ctx.quadraticCurveTo(lx, ly - baseR - 7 * sc + lbY, lx + 10 * sc, ly - baseR - 3 * sc + lbY - lbT); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - 10 * sc, ry - baseR - 3 * sc + rbY + rbT);
      ctx.quadraticCurveTo(rx, ry - baseR - 7 * sc + rbY, rx + 10 * sc, ry - baseR - 3 * sc + rbY - rbT); ctx.stroke();

      const eyeH = (m < -0.4 ? 0.65 : (m > 0.4 ? 1.15 : 1)) * blinkSq;
      for (const [ex, ey] of [[lx, ly], [rx, ry]]) {
        ctx.save(); ctx.translate(ex, ey); ctx.scale(1, eyeH);
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = C.eyeWhite; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2 * sc; ctx.stroke();
        if (eyeH > 0.15) {
          ctx.beginPath(); ctx.arc(gaze, gazeY / Math.max(eyeH, 0.3), pupR, 0, Math.PI * 2);
          ctx.fillStyle = C.pupil; ctx.fill();
          ctx.beginPath(); ctx.arc(gaze + 2 * sc, gazeY / Math.max(eyeH, 0.3) - 2 * sc, 2 * sc, 0, Math.PI * 2);
          ctx.fillStyle = C.shine; ctx.fill();
        }
        ctx.restore();
      }

      const my = fcy + 22 * sc;
      ctx.strokeStyle = C.mouthStroke; ctx.lineWidth = 2.5 * sc; ctx.lineCap = "round";
      if (m > 0.4) {
        ctx.beginPath(); ctx.moveTo(fcx - 12 * sc, my);
        ctx.quadraticCurveTo(fcx, my + 8 * sc + sm * 2 * sc, fcx + 12 * sc, my); ctx.stroke();
      } else if (m < -0.4) {
        const sad = Math.min(1, -m);
        ctx.beginPath(); ctx.moveTo(fcx - 9 * sc, my + 3 * sc);
        ctx.quadraticCurveTo(fcx, my - 4 * sc * sad, fcx + 9 * sc, my + 3 * sc); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(fcx - 7 * sc, my + 1 * sc);
        ctx.quadraticCurveTo(fcx, my + 4 * sc, fcx + 7 * sc, my + 1 * sc); ctx.stroke();
      }

      if (m > 0.5) {
        ctx.globalAlpha = (m - 0.5) * 0.35; ctx.fillStyle = "#E8926E";
        ctx.beginPath(); ctx.arc(lx - 2 * sc, ly + baseR * 0.5, 5 * sc, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + 2 * sc, ry + baseR * 0.5, 5 * sc, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawSuitcase() {
      const sc = 0.85;
      const scw = suitW * sc, sch = suitH * sc;
      const sx = s.suitX - scw / 2, sy = beltY - sch - 1;
      const cornerR = 16 * sc;
      const dx = 16 * sc, dy = -9 * sc;

      ctx.save();
      const bob = Math.sin(s.t * 2) * 1.5;
      ctx.translate(0, bob);

      // Handle
      const hCx = sx + scw / 2 + dx * 0.4, hCy = sy + dy * 0.3, hh = 42 * sc;
      ctx.strokeStyle = C.handle; ctx.lineWidth = 3 * sc; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hCx - 11 * sc, hCy - 1); ctx.lineTo(hCx - 11 * sc, hCy - hh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hCx + 11 * sc, hCy - 1); ctx.lineTo(hCx + 11 * sc, hCy - hh); ctx.stroke();
      ctx.strokeStyle = "rgba(160,180,195,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hCx - 10 * sc, hCy - 1); ctx.lineTo(hCx - 10 * sc, hCy - hh); ctx.stroke();
      drawChubbyRect(hCx - 15 * sc, hCy - hh - 6 * sc, 30 * sc, 9 * sc, 4 * sc);
      ctx.fillStyle = C.handleDark; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5 * sc; ctx.stroke();

      // Tag
      const tagSway = Math.sin(s.t * 1.3) * 2.5 * sc;
      const tagAx = hCx - 11 * sc, tagAy = hCy - hh * 0.5;
      const tagW = 18 * sc, tagHt = 32 * sc, tagR = 4 * sc;
      const tagX = tagAx - tagW - 5 * sc + tagSway, tagY = tagAy + 2 * sc;
      ctx.save();
      ctx.translate(tagAx, tagAy); ctx.rotate(Math.sin(s.t * 1.3) * 0.1 + 0.04); ctx.translate(-tagAx, -tagAy);
      ctx.strokeStyle = "#D4856A"; ctx.lineWidth = 2 * sc; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(tagAx, tagAy);
      ctx.quadraticCurveTo(tagAx - tagW * 0.35, tagAy - 2 * sc, tagX + tagW / 2, tagY); ctx.stroke();
      drawChubbyRect(tagX, tagY, tagW, tagHt, tagR);
      ctx.fillStyle = "#E8926E"; ctx.fill(); ctx.strokeStyle = "#D47A5A"; ctx.lineWidth = 1.5 * sc; ctx.stroke();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 5 * sc, 2.2 * sc, 0, Math.PI * 2); ctx.fillStyle = "#D47A5A"; ctx.fill();
      ctx.beginPath(); ctx.arc(tagX + tagW / 2, tagY + 5 * sc, 1.2 * sc, 0, Math.PI * 2); ctx.fillStyle = "#E8926E"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1 * sc;
      ctx.beginPath();
      ctx.moveTo(tagX + 4 * sc, tagY + 12 * sc); ctx.lineTo(tagX + tagW - 4 * sc, tagY + 12 * sc);
      ctx.moveTo(tagX + 4 * sc, tagY + 16 * sc); ctx.lineTo(tagX + tagW - 5 * sc, tagY + 16 * sc);
      ctx.moveTo(tagX + 4 * sc, tagY + 20 * sc); ctx.lineTo(tagX + tagW - 7 * sc, tagY + 20 * sc);
      ctx.stroke();
      ctx.restore();

      // Top face
      const tp = [{ x: sx, y: sy }, { x: sx + dx, y: sy + dy }, { x: sx + scw + dx, y: sy + dy }, { x: sx + scw, y: sy }];
      ctx.beginPath(); for (let i = 0; i < 4; i++) { i ? ctx.lineTo(tp[i].x, tp[i].y) : ctx.moveTo(tp[i].x, tp[i].y); } ctx.closePath();
      ctx.fillStyle = C.bodyTop; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5 * sc; ctx.stroke();

      // Right side
      const rp = [{ x: sx + scw, y: sy }, { x: sx + scw + dx, y: sy + dy }, { x: sx + scw + dx, y: sy + sch + dy }, { x: sx + scw, y: sy + sch }];
      ctx.beginPath(); for (let i = 0; i < 4; i++) { i ? ctx.lineTo(rp[i].x, rp[i].y) : ctx.moveTo(rp[i].x, rp[i].y); } ctx.closePath();
      const sG = ctx.createLinearGradient(sx + scw, 0, sx + scw + dx, 0);
      sG.addColorStop(0, C.bodyFrontLo); sG.addColorStop(1, C.bodySide);
      ctx.fillStyle = sG; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5 * sc; ctx.stroke();

      // Front face
      drawChubbyRect(sx, sy, scw, sch, cornerR);
      const fG = ctx.createLinearGradient(sx, sy, sx, sy + sch);
      fG.addColorStop(0, C.bodyFrontHi); fG.addColorStop(0.35, C.bodyFront); fG.addColorStop(1, C.bodyFrontLo);
      ctx.fillStyle = fG; ctx.fill(); ctx.strokeStyle = C.outline; ctx.lineWidth = 2 * sc; ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1 * sc;
      ctx.beginPath(); ctx.moveTo(sx + cornerR, sy + 2 * sc); ctx.lineTo(sx + scw - cornerR, sy + 2 * sc); ctx.stroke();
      ctx.strokeStyle = C.flapLine; ctx.lineWidth = 1 * sc;
      ctx.beginPath(); ctx.moveTo(sx + 18 * sc, sy + sch * 0.73); ctx.lineTo(sx + scw - 18 * sc, sy + sch * 0.73); ctx.stroke();
      drawChubbyRect(sx + scw / 2 - 8 * sc, sy + sch - 16 * sc, 16 * sc, 5 * sc, 2.5 * sc);
      ctx.fillStyle = "rgba(42,94,86,0.2)"; ctx.fill();
      ctx.fillStyle = C.outline;
      for (let i = 0; i < 3; i++) {
        const hy = sy + 24 * sc + i * (sch - 48 * sc) / 2;
        ctx.beginPath(); ctx.arc(sx + scw - 5 * sc, hy, 1.5 * sc, 0, Math.PI * 2); ctx.fill();
      }

      drawFace(sx + scw / 2, sy + sch * 0.38, sc);
      ctx.restore();
    }

    function drawEndCap(x: number, side: "left" | "right") {
      const capW = 14;
      const capTop = beltY - frameTop - 120;
      const capBot = beltY + beltH + frameH;
      const capH = capBot - capTop;

      drawChubbyRect(x, capTop, capW, capH, 4);
      const g = ctx.createLinearGradient(x, 0, x + capW, 0);
      if (side === "left") {
        g.addColorStop(0, C.steelMid); g.addColorStop(0.5, C.steelLight); g.addColorStop(1, C.steelDark);
      } else {
        g.addColorStop(0, C.steelDark); g.addColorStop(0.5, C.steelLight); g.addColorStop(1, C.steelMid);
      }
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = C.steelEdge; ctx.lineWidth = 1.5; ctx.stroke();

      const hx = side === "left" ? x + capW - 1 : x + 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, capTop + 4); ctx.lineTo(hx, capBot - 4); ctx.stroke();
    }

    function updateMood() {
      const p = (s.suitX - enterX) / (exitX - enterX);
      if (p < 0.1) { s.moodTarget = 0.3; s.lookTarget = 0.6; }
      else if (p < 0.35) { s.moodTarget = 0.75; s.lookTarget = Math.sin(s.t * 1.8) * 0.7; }
      else if (p < 0.6) { s.moodTarget = 0.9; s.lookTarget = Math.sin(s.t * 2.2) * 0.9; }
      else if (p < 0.8) { s.moodTarget = -0.5 - Math.min(s.passCount * 0.06, 0.3); s.lookTarget = -0.6; }
      else { s.moodTarget = -0.8 - Math.min(s.passCount * 0.06, 0.2); s.lookTarget = 0; }
      s.mood += (s.moodTarget - s.mood) * 0.045;
      s.lookDir += (s.lookTarget - s.lookDir) * 0.06;
    }

    function animate() {
      if (!mountedRef.current) return;
      s.t += 0.016;
      ctx.clearRect(0, 0, W, H);

      s.suitX += suitSpeed;
      if (s.suitX > exitX) { s.suitX = enterX; s.passCount++; }
      s.slatOffset -= suitSpeed;
      if (s.slatOffset < -slatStep) s.slatOffset += slatStep;

      updateMood();
      drawSign();
      drawBelt();

      ctx.save();
      ctx.beginPath(); ctx.rect(beltLeft - 4, 0, beltRight - beltLeft + 8, H); ctx.clip();
      drawSuitcase();
      ctx.restore();

      drawEndCap(beltLeft - 8, "left");
      drawEndCap(beltRight, "right");

      s.rafId = requestAnimationFrame(animate);
    }

    s.rafId = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(s.rafId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="notfound-anim">
      <div className="notfound-anim__scene">
        <canvas ref={canvasRef} width={1000} height={520} style={{ width: "500px", height: "260px" }} />
      </div>
    </div>
  );
}
