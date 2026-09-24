"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * Wraps a single interactive child (typically the primary CTA button) and
 * nudges it gently toward the pointer when hovered on desktop. Disabled on
 * touch devices and when the user prefers reduced motion, per the motion
 * spec's guidance on magnetic buttons.
 */
export function Magnetic({
  children,
  strength = 0.25,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || event.pointerType !== "mouse") return;
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const relX = event.clientX - (bounds.left + bounds.width / 2);
    const relY = event.clientY - (bounds.top + bounds.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ x: springX, y: springY }}
      className="inline-flex"
    >
      {children}
    </motion.div>
  );
}
