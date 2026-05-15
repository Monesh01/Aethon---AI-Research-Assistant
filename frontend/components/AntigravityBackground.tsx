"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";

/* ── Orb: large ambient color blobs ── */
const Orb = ({ orb, i, springX, springY }: any) => {
  const x = useTransform(springX, (v: number) => v * -50 * (i + 1));
  const y = useTransform(springY, (v: number) => v * -50 * (i + 1));
  return (
    <motion.div
      className={`absolute rounded-full ${orb.color} ${orb.size}`}
      style={{ top: orb.top, left: orb.left, x, y, filter: "blur(90px)", willChange: "transform" }}
      animate={{ scale: [1, 1.12, 1], opacity: [orb.minOp, orb.maxOp, orb.minOp] }}
      transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};

/* ── FloatingShape: geometric parallax objects ── */
const FloatingShape = ({ shape, i, springX, springY }: any) => {
  const x = useTransform(springX, (v: number) => v * 40 * ((i % 3) + 1));
  const y = useTransform(springY, (v: number) => v * 40 * ((i % 3) + 1));
  return (
    <motion.div
      className="absolute"
      style={{ left: shape.left, top: shape.top, x, y, willChange: "transform" }}
      animate={{
        y: [0, shape.drift, 0],
        rotate: [shape.rotation, shape.rotation + shape.rotateAmt, shape.rotation],
      }}
      transition={{ duration: shape.speed, repeat: Infinity, ease: "easeInOut" }}
    >
      {shape.type === "circle" && (
        <div
          className="rounded-full border-2"
          style={{
            width: shape.w,
            height: shape.w,
            borderColor: shape.borderColor,
            background: shape.bg,
          }}
        />
      )}
      {shape.type === "ring" && (
        <div
          className="rounded-full border-2"
          style={{
            width: shape.w,
            height: shape.w,
            borderColor: shape.borderColor,
            background: "transparent",
          }}
        />
      )}
      {shape.type === "square" && (
        <div
          className="rounded-xl border-2"
          style={{
            width: shape.w,
            height: shape.w,
            borderColor: shape.borderColor,
            background: shape.bg,
            transform: `rotate(${shape.skew}deg)`,
          }}
        />
      )}
      {shape.type === "dot" && (
        <div
          className="rounded-full"
          style={{
            width: shape.w,
            height: shape.w,
            background: shape.bg,
          }}
        />
      )}
      {shape.type === "diamond" && (
        <div
          className="border-2 rotate-45"
          style={{
            width: shape.w,
            height: shape.w,
            borderColor: shape.borderColor,
            background: shape.bg,
            borderRadius: 4,
          }}
        />
      )}
      {shape.type === "cross" && (
        <div className="relative" style={{ width: shape.w, height: shape.w }}>
          <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2" style={{ background: shape.borderColor }} />
          <div className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2" style={{ background: shape.borderColor }} />
        </div>
      )}
    </motion.div>
  );
};

/* ── Tiny Particle dots ── */
const Particle = ({ p, i, springX, springY }: any) => {
  const x = useTransform(springX, (v: number) => v * 25 * ((i % 4) + 1));
  const y = useTransform(springY, (v: number) => v * 25 * ((i % 4) + 1));
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ width: p.size, height: p.size, left: p.left, top: p.top, background: p.color, x, y, willChange: "transform" }}
      animate={{ opacity: [0.15, 0.5, 0.15], scale: [1, 1.3, 1] }}
      transition={{ duration: p.speed, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
    />
  );
};

export const AntigravityBackground = () => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 25, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 20 });

  const [shapes, setShapes] = useState<any[]>([]);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const types = ["circle", "ring", "square", "dot", "diamond", "cross"];
    const colors = [
      { border: "rgba(239, 68, 68, 0.25)", bg: "rgba(239, 68, 68, 0.08)" },   // Red
      { border: "rgba(249, 115, 22, 0.25)", bg: "rgba(249, 115, 22, 0.08)" }, // Orange
      { border: "rgba(234, 179, 8, 0.25)", bg: "rgba(234, 179, 8, 0.08)" },   // Yellow
      { border: "rgba(132, 204, 22, 0.25)", bg: "rgba(132, 204, 22, 0.08)" }, // Lime
      { border: "rgba(16, 185, 129, 0.25)", bg: "rgba(16, 185, 129, 0.08)" }, // Emerald
      { border: "rgba(6, 182, 212, 0.25)", bg: "rgba(6, 182, 212, 0.08)" },   // Cyan
      { border: "rgba(59, 130, 246, 0.25)", bg: "rgba(59, 130, 246, 0.08)" }, // Blue
      { border: "rgba(139, 92, 246, 0.25)", bg: "rgba(139, 92, 246, 0.08)" }, // Violet
      { border: "rgba(236, 72, 153, 0.25)", bg: "rgba(236, 72, 153, 0.08)" }, // Pink
      { border: "rgba(245, 158, 11, 0.25)", bg: "rgba(245, 158, 11, 0.08)" }, // Amber
      { border: "rgba(20, 184, 166, 0.25)", bg: "rgba(20, 184, 166, 0.08)" }, // Teal
      { border: "rgba(217, 70, 239, 0.25)", bg: "rgba(217, 70, 239, 0.08)" }, // Fuchsia
    ];

    setShapes(
      Array.from({ length: 24 }).map(() => {
        const c = colors[Math.floor(Math.random() * colors.length)];
        return {
          type: types[Math.floor(Math.random() * types.length)],
          w: Math.random() * 40 + 15,
          left: `${Math.random() * 95}%`,
          top: `${Math.random() * 95}%`,
          drift: -(Math.random() * 40 + 15),
          speed: Math.random() * 10 + 10,
          rotation: Math.random() * 360,
          rotateAmt: (Math.random() - 0.5) * 80,
          skew: Math.random() * 45,
          borderColor: c.border,
          bg: c.bg,
        };
      })
    );

    const pColors = [
      "rgba(239, 68, 68, 0.3)", "rgba(249, 115, 22, 0.3)", "rgba(234, 179, 8, 0.3)",
      "rgba(132, 204, 22, 0.3)", "rgba(16, 185, 129, 0.3)", "rgba(6, 182, 212, 0.3)",
      "rgba(59, 130, 246, 0.3)", "rgba(139, 92, 246, 0.3)", "rgba(236, 72, 153, 0.3)",
      "rgba(245, 158, 11, 0.3)", "rgba(20, 184, 166, 0.3)", "rgba(217, 70, 239, 0.3)"
    ];
    setParticles(
      Array.from({ length: 30 }).map(() => ({
        size: Math.random() * 4 + 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        speed: Math.random() * 6 + 5,
        color: pColors[Math.floor(Math.random() * pColors.length)],
      }))
    );

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const orbs = [
    { color: "bg-red-400", size: "w-[450px] h-[450px]", top: "-5%", left: "-3%", minOp: 0.05, maxOp: 0.12 },
    { color: "bg-yellow-400", size: "w-[400px] h-[400px]", top: "55%", left: "65%", minOp: 0.04, maxOp: 0.10 },
    { color: "bg-emerald-400", size: "w-[350px] h-[350px]", top: "20%", left: "45%", minOp: 0.04, maxOp: 0.08 },
    { color: "bg-blue-400", size: "w-[300px] h-[300px]", top: "70%", left: "12%", minOp: 0.03, maxOp: 0.07 },
    { color: "bg-fuchsia-400", size: "w-[320px] h-[320px]", top: "40%", left: "80%", minOp: 0.03, maxOp: 0.07 },
  ];

  if (!mounted) return <div className="fixed inset-0 bg-[#020205] z-[-1]" />;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[-1] overflow-hidden bg-[#020205]">
      {/* 1. Deep Midnight base with very subtle multi-color gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-[#020205] to-purple-900/10" />

      {/* 2. Ambient orbs */}
      <div className="relative z-10">
        {orbs.map((orb, i) => (
          <Orb key={`o-${i}`} orb={orb} i={i} springX={springX} springY={springY} />
        ))}
      </div>

      {/* 3. Floating geometric shapes — the "live wallpaper" objects */}
      <div className="relative z-20">
        {shapes.map((shape, i) => (
          <FloatingShape key={`s-${i}`} shape={shape} i={i} springX={springX} springY={springY} />
        ))}
      </div>

      {/* 4. Dot particles */}
      <div className="relative z-30">
        {particles.map((p, i) => (
          <Particle key={`p-${i}`} p={p} i={i} springX={springX} springY={springY} />
        ))}
      </div>

      {/* 5. Subtle multi-colored dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] z-40 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#3b82f6 0.8px, transparent 0), radial-gradient(#ef4444 0.8px, transparent 0)", backgroundSize: "48px 48px", backgroundPosition: "0 0, 24px 24px" }}
      />

      {/* 6. Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)] pointer-events-none z-50" />
    </div>
  );
};
