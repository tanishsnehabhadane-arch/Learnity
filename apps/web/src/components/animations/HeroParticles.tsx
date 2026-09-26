/**
 * HeroParticles — neural network metaphor for the hero. Lazy-loaded
 * (not on the critical path), disabled for reduced-motion users.
 */
"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export function HeroParticles(): JSX.Element | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: { enable: false },
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          number: { value: 70, density: { enable: true, width: 1200, height: 800 } },
          color: { value: ["#ef4444", "#3b82f6", "#1a1a1a"] },
          links: { enable: true, distance: 140, color: "#1a1a1a", opacity: 0.25, width: 1 },
          move: { enable: true, speed: 0.6, outModes: { default: "bounce" } },
          opacity: { value: { min: 0.3, max: 0.7 } },
          size: { value: { min: 1, max: 3 } },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: "grab" } },
          modes: { grab: { distance: 160, links: { opacity: 0.4 } } },
        },
      }}
    />
  );
}
