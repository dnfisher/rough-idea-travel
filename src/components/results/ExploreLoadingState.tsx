"use client";

import { useEffect, useRef } from "react";

// ── Constants ──────────────────────────────────────────────────

const NUM_POINTS = 12;

const packingItems = [
  { label: "Tiny bikini", color: "#E88B9C", reaction: "wink" },
  { label: "Suspicious snacks", color: "#D4A853", reaction: "guilty" },
  { label: "Too much sunscreen", color: "#F2D98B", reaction: "pleased" },
  { label: "Emergency wine", color: "#B46B82", reaction: "excited" },
  { label: "Lucky underwear", color: "#C8A2D4", reaction: "wink" },
  { label: "Regrettable hat", color: "#A8C4A0", reaction: "nervous" },
  { label: "Unread novel", color: "#7BA3C4", reaction: "thinking" },
  { label: "Hangover kit", color: "#90B88C", reaction: "nervous" },
  { label: "Questionable shorts", color: "#E8A870", reaction: "cheeky" },
  { label: "Contraband cheese", color: "#DBC078", reaction: "guilty" },
  { label: "Three outfits per day", color: "#D49080", reaction: "surprised" },
  { label: "Main character energy", color: "#E8C46E", reaction: "smug" },
  { label: "Tanlines pending", color: "#E8A870", reaction: "dreamy" },
  { label: "Chaotic playlist", color: "#B894C8", reaction: "excited" },
  { label: "Hotel slippers (stolen)", color: "#C4B8A4", reaction: "guilty" },
  { label: "One sensible shoe", color: "#8B7D6B", reaction: "thinking" },
  { label: "Spare charger (lost already)", color: "#7A8B7A", reaction: "nervous" },
  { label: "Optimistic swimwear", color: "#6BBAD4", reaction: "wink" },
  { label: "Midnight snack stash", color: "#D4A070", reaction: "cheeky" },
  { label: "Slightly spicy novel", color: "#D47070", reaction: "wink" },
  { label: "Dubious vibes", color: "#B8A0D4", reaction: "smug" },
  { label: "Zero plans", color: "#A8C4B8", reaction: "pleased" },
  { label: "Too many tote bags", color: "#C4A888", reaction: "surprised" },
  { label: "Vacation brain", color: "#E8D094", reaction: "dreamy" },
  { label: "Main squeeze", color: "#E88BA0", reaction: "wink" },
  { label: "A flask, just in case", color: "#8BA4B8", reaction: "cheeky" },
  { label: "Overconfident itinerary", color: "#B8C470", reaction: "smug" },
  { label: "Nap schedule", color: "#C4B8D4", reaction: "dreamy" },
  { label: "Flirty sundress", color: "#E8A0B8", reaction: "wink" },
  { label: "Bad decisions budget", color: "#70C4A0", reaction: "nervous" },
  { label: "Emotional support snack", color: "#D4B870", reaction: "pleased" },
  { label: "Passport panic", color: "#E87070", reaction: "surprised" },
  { label: "Impulse buys (pre-trip)", color: "#C49470", reaction: "guilty" },
  { label: "Delusional packing list", color: "#94A8D4", reaction: "smug" },
];

const phrases = [
  "Wandering with intent", "Following a hunch", "Poking around the atlas",
  "Rummaging through hidden gems", "Nosing about for something lovely",
  "Chasing a daydream", "Having a little rummage", "Pulling at a loose thread",
  "Tootling down a side street", "Pottering about with purpose",
  "Going on a small adventure", "Shaking the idea tree",
  "Turning over a few stones", "Letting curiosity drive",
  "Sniffing out something splendid", "Putting our feelers out",
  "Cooking something up", "Dusting off a corker",
  "Thumbing through postcards", "Daydreaming out loud",
  "Chasing golden hour", "Unfolding the map",
  "Looking for a good wander", "Snooping in the best way",
  "Spinning the globe", "Seeing what turns up",
  "Going where the wind blows", "Picking up the scent",
  "Peeking around corners", "Taking the scenic route",
  "Moseying through possibilities", "Noodling on it", "Having a good think",
];

const almostDone = [
  "Getting somewhere now", "Tidying up our findings",
  "Polishing this up nicely", "Nearly there — bear with",
  "Just dotting the i's", "Wrapping it up with a bow",
  "Sitting on the suitcase to close it", "One more thing, maybe",
];

// ── Types ──────────────────────────────────────────────────────

type Expression = "curious" | "excited" | "thinking" | "pleased" | "surprised" |
  "cheeky" | "wink" | "nervous" | "smug" | "dreamy" | "guilty";

interface AnimState {
  t: number;
  blinkTimer: number;
  isBlinking: boolean;
  currentExpression: Expression;
  isWinking: boolean;
  gazeX: number;
  gazeY: number;
  currentIndex: number;
  usedPhrases: number[];
  isAlmostDone: boolean;
  itemPool: typeof packingItems;
  rafId: number;
  phraseIntervalId: ReturnType<typeof setInterval> | null;
  itemIntervalId: ReturnType<typeof setInterval> | null;
  pendingTimeouts: Set<ReturnType<typeof setTimeout>>;
  baseShape: number[];
  pointSeeds: Array<{
    phase1: number; phase2: number; phase3: number;
    speed1: number; speed2: number; speed3: number;
    amp1: number; amp2: number; amp3: number;
  }>;
  showPhrase: (() => void) | null;
}

// ── Component ──────────────────────────────────────────────────

interface Props {
  skipToEnd?: boolean;
}

export function ExploreLoadingState({ skipToEnd }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const blobFillRef = useRef<SVGPathElement>(null);
  const blobOutlineRef = useRef<SVGPathElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const pupilLRef = useRef<SVGCircleElement>(null);
  const pupilRRef = useRef<SVGCircleElement>(null);
  const shineLRef = useRef<SVGCircleElement>(null);
  const shineRRef = useRef<SVGCircleElement>(null);
  const eyeWhiteLRef = useRef<SVGEllipseElement>(null);
  const eyeWhiteRRef = useRef<SVGEllipseElement>(null);
  const browLRef = useRef<SVGPathElement>(null);
  const browRRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const suitcaseLidRef = useRef<SVGGElement>(null);
  const phraseContainerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<SVGPathElement>(null);

  const mountedRef = useRef(true);
  const stateRef = useRef<AnimState>({
    t: 0, blinkTimer: 0, isBlinking: false,
    currentExpression: "curious", isWinking: false,
    gazeX: 0, gazeY: 0,
    currentIndex: 0, usedPhrases: [], isAlmostDone: false,
    itemPool: [], rafId: 0,
    phraseIntervalId: null, itemIntervalId: null,
    pendingTimeouts: new Set(),
    baseShape: [], pointSeeds: [],
    showPhrase: null,
  });

  // Handle skipToEnd prop changes
  useEffect(() => {
    const s = stateRef.current;
    if (skipToEnd && !s.isAlmostDone) {
      s.isAlmostDone = true;
      s.usedPhrases = [];
      s.currentIndex = 10;
      s.showPhrase?.();
    }
  }, [skipToEnd]);

  // Main animation lifecycle
  useEffect(() => {
    mountedRef.current = true;
    const s = stateRef.current;

    // Safe timeout helper
    function safeTimeout(fn: () => void, delay: number) {
      const id = setTimeout(() => {
        s.pendingTimeouts.delete(id);
        if (mountedRef.current) fn();
      }, delay);
      s.pendingTimeouts.add(id);
      return id;
    }

    // Generate shapes (client-side only, uses Math.random)
    s.baseShape = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const angle = (i / NUM_POINTS) * Math.PI * 2;
      let r = 46;
      if (angle > Math.PI * 0.3 && angle < Math.PI * 0.7) r += 8;
      if (angle > Math.PI * 0.7 && angle < Math.PI * 1.3) r += 12;
      if (angle > Math.PI * 1.3 && angle < Math.PI * 1.7) r += 8;
      if (angle > Math.PI * 1.7 || angle < Math.PI * 0.3) r -= 6;
      s.baseShape.push(r);
    }

    s.pointSeeds = Array.from({ length: NUM_POINTS }, () => ({
      phase1: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      phase3: Math.random() * Math.PI * 2,
      speed1: 0.5 + Math.random() * 0.6,
      speed2: 0.8 + Math.random() * 0.8,
      speed3: 1.2 + Math.random() * 1.0,
      amp1: 3 + Math.random() * 4,
      amp2: 1.5 + Math.random() * 3,
      amp3: 0.8 + Math.random() * 2,
    }));

    // ── Blob path helper ──
    function pointsToSmoothPath(points: { x: number; y: number }[]) {
      const n = points.length;
      let d = "";
      for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];
        const tension = 4.2;
        if (i === 0) d += `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} `;
        d += `C ${(p1.x + (p2.x - p0.x) / tension).toFixed(1)},${(p1.y + (p2.y - p0.y) / tension).toFixed(1)} ${(p2.x - (p3.x - p1.x) / tension).toFixed(1)},${(p2.y - (p3.y - p1.y) / tension).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} `;
      }
      return d + "Z";
    }

    // ── Gaze targets ──
    const gazeTargets: Record<string, { x: number; y: number }> = {
      suitcase: { x: 4.5, y: 1.5 }, up: { x: 0, y: -4 },
      left: { x: -4, y: 0 }, center: { x: 0, y: 0 },
      upRight: { x: 3.5, y: -3 }, downRight: { x: 3, y: 3 },
    };
    const exprGaze: Record<string, string> = {
      curious: "suitcase", excited: "upRight", thinking: "up",
      pleased: "suitcase", surprised: "center", cheeky: "left",
      wink: "center", nervous: "left", smug: "suitcase",
      dreamy: "up", guilty: "left",
    };

    // ── Blob animation loop ──
    function animateBlob() {
      if (!mountedRef.current) return;
      s.t += 0.014;
      s.blinkTimer += 0.014;

      const leanX = Math.sin(s.t * 0.25) * 3.5 + Math.cos(s.t * 0.15) * 2;
      const leanY = Math.cos(s.t * 0.2) * 2.5 + Math.sin(s.t * 0.13) * 1.5;
      const stretchX = 1 + Math.sin(s.t * 0.35) * 0.03;
      const stretchY = 1 - Math.sin(s.t * 0.35) * 0.03;
      const surge = Math.pow(Math.sin(s.t * 0.9), 12) * 6;
      const surgeAngle = s.t * 0.25;

      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < NUM_POINTS; i++) {
        const angle = (i / NUM_POINTS) * Math.PI * 2;
        const seed = s.pointSeeds[i];
        const n1 = Math.sin(s.t * seed.speed1 + seed.phase1) * seed.amp1;
        const n2 = Math.cos(s.t * seed.speed2 + seed.phase2) * seed.amp2;
        const n3 = Math.sin(s.t * seed.speed3 + seed.phase3) * seed.amp3;
        const angleDiff = Math.abs(Math.atan2(Math.sin(angle - surgeAngle), Math.cos(angle - surgeAngle)));
        const surgeEffect = surge * Math.max(0, 1 - angleDiff / 1.2);
        const r = s.baseShape[i] + n1 + n2 + n3 + surgeEffect;
        points.push({
          x: (100 + leanX) + Math.cos(angle) * r * stretchX,
          y: (104 + leanY) + Math.sin(angle) * r * stretchY,
        });
      }

      const pathD = pointsToSmoothPath(points);
      blobFillRef.current?.setAttribute("d", pathD);
      blobOutlineRef.current?.setAttribute("d", pathD);

      // Face position
      const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      if (faceRef.current) {
        faceRef.current.style.transform = `translate(calc(-50% + ${((avgX - 100) * 0.6).toFixed(1)}px), calc(-50% + ${((avgY - 104) * 0.6 - 10).toFixed(1)}px))`;
      }

      // Gaze
      let targetGaze = gazeTargets[exprGaze[s.currentExpression] || "suitcase"];
      const flyingItem = sceneRef.current?.querySelector(".flying-item.fly-in");
      if (flyingItem && sceneRef.current) {
        const rect = flyingItem.getBoundingClientRect();
        const sceneRect = sceneRef.current.getBoundingClientRect();
        targetGaze = {
          x: Math.max(-5, Math.min(5, ((rect.left - sceneRect.left) / sceneRect.width - 0.3) * 12)),
          y: Math.max(-4, Math.min(4, ((rect.top - sceneRect.top) / sceneRect.height - 0.4) * 8)),
        };
      }
      targetGaze = { x: targetGaze.x + Math.sin(s.t * 1.2) * 0.4, y: targetGaze.y + Math.cos(s.t * 0.9) * 0.3 };
      s.gazeX += (targetGaze.x - s.gazeX) * 0.08;
      s.gazeY += (targetGaze.y - s.gazeY) * 0.08;

      // Blink
      if (s.blinkTimer > 2.5 + Math.random() * 2.5) {
        s.isBlinking = true;
        s.blinkTimer = 0;
        safeTimeout(() => { s.isBlinking = false; }, 110);
      }

      // Eyes
      const eyeSq = s.isBlinking ? 0.15 : 1;
      const rEyeSq = Math.min(eyeSq, s.isWinking ? 0.1 : 1);

      pupilLRef.current?.setAttribute("cx", (14 + s.gazeX).toFixed(1));
      pupilLRef.current?.setAttribute("cy", (17 + s.gazeY).toFixed(1));
      shineLRef.current?.setAttribute("cx", (16 + s.gazeX * 0.4).toFixed(1));
      shineLRef.current?.setAttribute("cy", (14 + s.gazeY * 0.2).toFixed(1));
      eyeWhiteLRef.current?.setAttribute("ry", (10 * eyeSq).toFixed(1));

      pupilRRef.current?.setAttribute("cx", (36 + s.gazeX).toFixed(1));
      pupilRRef.current?.setAttribute("cy", (17 + s.gazeY).toFixed(1));
      shineRRef.current?.setAttribute("cx", (38 + s.gazeX * 0.4).toFixed(1));
      shineRRef.current?.setAttribute("cy", (14 + s.gazeY * 0.2).toFixed(1));
      eyeWhiteRRef.current?.setAttribute("ry", (10 * rEyeSq).toFixed(1));

      if (s.isBlinking) {
        pupilLRef.current?.setAttribute("r", "0");
        pupilRRef.current?.setAttribute("r", "0");
        shineLRef.current?.setAttribute("r", "0");
        shineRRef.current?.setAttribute("r", "0");
      } else {
        pupilLRef.current?.setAttribute("r", "5");
        pupilRRef.current?.setAttribute("r", s.isWinking ? "0" : "5");
        shineLRef.current?.setAttribute("r", "1.8");
        shineRRef.current?.setAttribute("r", s.isWinking ? "0" : "1.8");
      }

      // Expressions
      const sm = Math.sin(s.t * 0.5) * 0.5 + 0.5;
      switch (s.currentExpression) {
        case "curious":
          browLRef.current?.setAttribute("d", `M5 ${3 + sm} Q10 ${sm * 0.5}, 18 ${2 + sm * 0.5}`);
          browRRef.current?.setAttribute("d", `M32 ${1 - sm * 0.5} Q40 -1, 45 ${2 - sm * 0.5}`);
          mouthRef.current?.setAttribute("d", `M18 34 Q25 ${39 + sm * 2}, 32 34`); break;
        case "excited":
          browLRef.current?.setAttribute("d", `M6 ${1 - sm} Q11 -2, 18 ${-sm * 0.5}`);
          browRRef.current?.setAttribute("d", `M32 ${-sm * 0.5} Q39 -2, 44 ${1 - sm}`);
          mouthRef.current?.setAttribute("d", `M15 33 Q25 ${43 + sm}, 35 33`); break;
        case "thinking":
          browLRef.current?.setAttribute("d", `M5 2 Q10 ${-1 + sm}, 18 ${3 + sm}`);
          browRRef.current?.setAttribute("d", `M32 ${1 - sm} Q40 ${-1 - sm}, 45 ${2 - sm}`);
          mouthRef.current?.setAttribute("d", `M20 35 Q25 ${37 + sm}, 30 35.5`); break;
        case "pleased":
          browLRef.current?.setAttribute("d", `M6 ${3 + sm * 0.5} Q11 1, 18 2.5`);
          browRRef.current?.setAttribute("d", `M32 2.5 Q39 1, 44 ${3 + sm * 0.5}`);
          mouthRef.current?.setAttribute("d", `M17 34 Q25 ${41 + sm}, 33 34`); break;
        case "surprised":
          browLRef.current?.setAttribute("d", `M5 ${-sm} Q10 -3, 18 ${-1 - sm * 0.5}`);
          browRRef.current?.setAttribute("d", `M32 ${-1 - sm * 0.5} Q40 -3, 45 ${-sm}`);
          mouthRef.current?.setAttribute("d", `M21 35 Q25 ${39 + sm}, 29 35`); break;
        case "cheeky":
          browLRef.current?.setAttribute("d", `M5 ${4 + sm} Q10 2, 18 1`);
          browRRef.current?.setAttribute("d", `M32 ${1 - sm * 0.5} Q40 -1, 45 1`);
          mouthRef.current?.setAttribute("d", `M17 34 Q22 39, 27 35 Q31 ${38 + sm * 2}, 34 33`); break;
        case "wink":
          browLRef.current?.setAttribute("d", `M5 ${1 - sm} Q10 -2, 18 0`);
          browRRef.current?.setAttribute("d", `M32 ${3 + sm} Q40 3, 45 ${4 + sm}`);
          mouthRef.current?.setAttribute("d", `M16 33 Q17 38, 25 39 Q33 38, 34 33 Q33 31, 25 30 Q17 31, 16 33`); break;
        case "nervous":
          browLRef.current?.setAttribute("d", `M5 ${5 + sm} Q10 3, 18 ${1 - sm}`);
          browRRef.current?.setAttribute("d", `M32 ${1 - sm} Q40 3, 45 ${5 + sm}`);
          mouthRef.current?.setAttribute("d", `M19 36 Q22 ${34 - sm}, 25 ${36 + sm} Q28 ${34 - sm}, 31 36`); break;
        case "smug":
          browLRef.current?.setAttribute("d", `M6 ${4 + sm * 0.3} Q11 3, 18 3`);
          browRRef.current?.setAttribute("d", `M32 2 Q39 ${1 - sm * 0.3}, 44 2`);
          mouthRef.current?.setAttribute("d", `M19 35 Q24 36, 27 35 Q32 ${39 + sm}, 35 33`); break;
        case "dreamy":
          browLRef.current?.setAttribute("d", `M6 3 Q11 ${2 + sm * 0.5}, 18 ${3 + sm * 0.3}`);
          browRRef.current?.setAttribute("d", `M32 ${3 + sm * 0.3} Q39 ${2 + sm * 0.5}, 44 3`);
          mouthRef.current?.setAttribute("d", `M17 34 Q25 ${40 + sm}, 33 34`); break;
        case "guilty":
          browLRef.current?.setAttribute("d", `M5 ${4 + sm} Q10 ${2 + sm}, 18 1`);
          browRRef.current?.setAttribute("d", `M32 1 Q40 ${2 + sm}, 45 ${4 + sm}`);
          mouthRef.current?.setAttribute("d", `M20 35 Q25 37, 30 36`); break;
      }

      s.rafId = requestAnimationFrame(animateBlob);
    }

    // ── Packing items ──
    function shufflePool() {
      s.itemPool = [...packingItems].sort(() => Math.random() - 0.5);
    }

    function openLid() { suitcaseLidRef.current?.classList.add("open"); }
    function closeLid() { suitcaseLidRef.current?.classList.remove("open"); }

    function launchItem() {
      if (!mountedRef.current || !sceneRef.current) return;
      if (s.itemPool.length === 0) shufflePool();
      const item = s.itemPool.pop()!;

      // Expression
      s.currentExpression = item.reaction as Expression;
      s.isWinking = item.reaction === "wink";
      const resetDelay = item.reaction === "wink" ? 600 : 1800;
      safeTimeout(() => { s.currentExpression = "curious"; s.isWinking = false; }, resetDelay);

      openLid();

      const el = document.createElement("div");
      el.className = "flying-item";
      const dot = document.createElement("span");
      dot.className = "item-dot";
      dot.style.background = item.color;
      el.appendChild(dot);
      el.appendChild(document.createTextNode(item.label));

      const side = Math.random();
      let startX: number, startY: number;
      if (side < 0.4) { startX = -70 + Math.random() * 30; startY = 20 + Math.random() * 80; }
      else if (side < 0.7) { startX = 20 + Math.random() * 100; startY = -40 + Math.random() * 20; }
      else { startX = -30 + Math.random() * 60; startY = 150 + Math.random() * 30; }

      el.style.setProperty("--start-x", startX + "px");
      el.style.setProperty("--start-y", startY + "px");
      el.style.setProperty("--end-x", (200 + Math.random() * 20) + "px");
      el.style.setProperty("--end-y", (70 + Math.random() * 15) + "px");
      el.style.setProperty("--start-rot", ((Math.random() - 0.5) * 30) + "deg");

      sceneRef.current.appendChild(el);
      requestAnimationFrame(() => el.classList.add("fly-in"));
      safeTimeout(closeLid, 1250);
      safeTimeout(() => el.remove(), 1800);
    }

    // ── Phrases ──
    function getRandomFromPool(pool: string[]) {
      if (s.usedPhrases.length >= pool.length) s.usedPhrases = [];
      let idx: number;
      do { idx = Math.floor(Math.random() * pool.length); } while (s.usedPhrases.includes(idx));
      s.usedPhrases.push(idx);
      return pool[idx];
    }

    function showPhrase() {
      if (!mountedRef.current || !phraseContainerRef.current) return;
      const pool = s.isAlmostDone ? almostDone : phrases;
      const text = getRandomFromPool(pool);
      const old = phraseContainerRef.current.querySelector(".loader-phrase");
      if (old) old.remove();
      const el = document.createElement("div");
      el.className = "loader-phrase active";
      el.innerHTML = `${text}<span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>`;
      phraseContainerRef.current.appendChild(el);
      const progress = Math.min((s.currentIndex + 1) / 12 * 100, 100);
      if (progressLineRef.current) {
        progressLineRef.current.style.strokeDashoffset = String(
          s.isAlmostDone ? 82 * 0.08 : 82 * (1 - progress / 100)
        );
      }
      s.currentIndex++;
    }
    s.showPhrase = showPhrase;

    // ── Start ──
    s.currentIndex = 0;
    s.usedPhrases = [];
    s.isAlmostDone = false;
    if (progressLineRef.current) progressLineRef.current.style.strokeDashoffset = "82";
    shufflePool();
    closeLid();

    showPhrase();
    s.phraseIntervalId = setInterval(showPhrase, 3000);
    safeTimeout(launchItem, 600);
    s.itemIntervalId = setInterval(launchItem, 2200);
    s.rafId = requestAnimationFrame(animateBlob);

    // ── Cleanup ──
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(s.rafId);
      if (s.phraseIntervalId) clearInterval(s.phraseIntervalId);
      if (s.itemIntervalId) clearInterval(s.itemIntervalId);
      s.pendingTimeouts.forEach((id) => clearTimeout(id));
      s.pendingTimeouts.clear();
      sceneRef.current?.querySelectorAll(".flying-item").forEach((el) => el.remove());
      phraseContainerRef.current?.querySelectorAll(".loader-phrase").forEach((el) => el.remove());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center shadow-sm">
      <div className="loader-container">
        <div className="loader-scene" ref={sceneRef}>
          {/* Blob */}
          <div className="blob-wrap">
            <div className="blob-shadow" />
            <svg className="blob-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path className="blob-fill-path" ref={blobFillRef} />
              <path className="blob-outline-path" ref={blobOutlineRef} />
            </svg>
            <div className="blob-face" ref={faceRef}>
              <svg width="50" height="46" viewBox="0 0 50 46">
                <path d="M5 3 Q10 0, 18 2" fill="none" stroke="#4A3F35" strokeWidth="2.5" strokeLinecap="round" ref={browLRef} />
                <path d="M32 2 Q40 0, 45 3" fill="none" stroke="#4A3F35" strokeWidth="2.5" strokeLinecap="round" ref={browRRef} />
                <ellipse cx="14" cy="17" rx="10" ry="10" fill="white" stroke="#4A3F35" strokeWidth="2.5" ref={eyeWhiteLRef} />
                <circle cx="16" cy="16" r="5" fill="#4A3F35" ref={pupilLRef} />
                <circle cx="18" cy="14" r="1.8" fill="white" ref={shineLRef} />
                <ellipse cx="36" cy="17" rx="10" ry="10" fill="white" stroke="#4A3F35" strokeWidth="2.5" ref={eyeWhiteRRef} />
                <circle cx="38" cy="16" r="5" fill="#4A3F35" ref={pupilRRef} />
                <circle cx="40" cy="14" r="1.8" fill="white" ref={shineRRef} />
                <path d="M16 34 Q25 42, 34 34" fill="none" stroke="#4A3F35" strokeWidth="2.5" strokeLinecap="round" ref={mouthRef} />
              </svg>
            </div>
          </div>

          {/* Suitcase */}
          <div className="loader-suitcase">
            <svg viewBox="0 0 88 72" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="24" width="80" height="40" rx="5" fill="#E8E0D2" stroke="#4A3F35" strokeWidth="3" />
              <path d="M32 24 L32 14 Q32 8, 38 8 L50 8 Q56 8, 56 14 L56 24" fill="none" stroke="#4A3F35" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="37" y="21" width="14" height="7" rx="2" fill="#D4C8B4" stroke="#4A3F35" strokeWidth="2" />
              <circle cx="18" cy="67" r="4" fill="#D4C8B4" stroke="#4A3F35" strokeWidth="2.5" />
              <circle cx="70" cy="67" r="4" fill="#D4C8B4" stroke="#4A3F35" strokeWidth="2.5" />
              <g className="suitcase-lid" ref={suitcaseLidRef}>
                <rect x="4" y="22" width="80" height="10" rx="4" fill="#D4C8B4" stroke="#4A3F35" strokeWidth="3" />
              </g>
            </svg>
          </div>
        </div>

        <div className="phrase-container" ref={phraseContainerRef} />

        <div className="loader-progress">
          <svg viewBox="0 0 80 6">
            <path d="M2 3 Q10 1, 20 3.5 Q30 5.5, 40 3 Q50 0.5, 60 3.5 Q70 5, 78 3" stroke="#E0D8CC" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M2 3 Q10 1, 20 3.5 Q30 5.5, 40 3 Q50 0.5, 60 3.5 Q70 5, 78 3" stroke="#A89882" strokeWidth="2.5" fill="none" strokeLinecap="round" ref={progressLineRef} style={{ strokeDasharray: 82, strokeDashoffset: 82 }} />
          </svg>
        </div>
      </div>
    </div>
  );
}
