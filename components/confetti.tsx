"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#5b4bdb", "#a99ff0", "#1b1b1f", "#e2e0da", "#f2b544"];
const PIECES = 160;
const DURATION_MS = 4500;
const FADE_MS = 800;

// One burst of confetti over the whole screen when the page opens.
// Skipped for people who prefer reduced motion.
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    const pieces = Array.from({ length: PIECES }, () => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.6,
      w: 6 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = Math.min(1, Math.max(0, (DURATION_MS - elapsed) / FADE_MS));
      for (const p of pieces) {
        p.wobble += 0.08;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.vy = Math.min(p.vy + 0.04, 6);
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
