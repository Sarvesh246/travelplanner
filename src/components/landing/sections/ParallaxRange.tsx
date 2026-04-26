"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useThemeColors } from "../hooks/useThemeColors";

export function ParallaxRange() {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const sunY = useTransform(scrollYProgress, [0, 1], ["80%", "20%"]);
  const sunOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.7, 0]);
  const moonOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.4, 1]);

  const layer1Y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const layer3Y = useTransform(scrollYProgress, [0, 1], ["0%", "-32%"]);
  const layer4Y = useTransform(scrollYProgress, [0, 1], ["0%", "-42%"]);
  const fogOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.6, 0.2]);

  return (
    <section
      ref={ref}
      className="relative h-[150vh] w-full overflow-hidden landing-sky"
      aria-label="Mountain range parallax"
    >
      <div className="sticky top-0 h-screen w-full">
        {/* Sun (light mode) / Moon (dark mode) */}
        {colors.isDark ? (
          <motion.div
            style={{ top: sunY, opacity: moonOpacity }}
            className="absolute right-[15%] h-32 w-32 rounded-full bg-[#e8eee0] shadow-[0_0_80px_30px_rgba(232,238,224,0.3)]"
          />
        ) : (
          <motion.div
            style={{ top: sunY, opacity: sunOpacity }}
            className="absolute right-[15%] h-28 w-28 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 shadow-[0_0_100px_40px_rgba(251,191,36,0.4)]"
          />
        )}

        {/* Fog band */}
        <motion.div
          style={{ opacity: fogOpacity }}
          className="absolute inset-x-0 bottom-[40%] h-32 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
        />

        {/* Layer 1 — farthest */}
        <motion.svg
          style={{ y: layer1Y }}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.15)"
            d="M0,224L80,213.3C160,203,320,181,480,176C640,171,800,181,960,176C1120,171,1280,149,1360,138.7L1440,128L1440,320L0,320Z"
          />
        </motion.svg>

        {/* Layer 2 */}
        <motion.svg
          style={{ y: layer2Y }}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.3)"
            d="M0,256L60,229.3C120,203,240,149,360,154.7C480,160,600,224,720,229.3C840,235,960,181,1080,160C1200,139,1320,149,1380,154.7L1440,160L1440,320L0,320Z"
          />
        </motion.svg>

        {/* Layer 3 */}
        <motion.svg
          style={{ y: layer3Y }}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.55)"
            d="M0,288L80,277.3C160,267,320,245,480,224C640,203,800,181,960,186.7C1120,192,1280,224,1360,240L1440,256L1440,320L0,320Z"
          />
        </motion.svg>

        {/* Layer 4 — nearest, with pine silhouettes */}
        <motion.svg
          style={{ y: layer4Y }}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.85)"
            d="M0,320L0,260L60,240L120,250L180,220L240,235L300,210L360,225L420,200L480,215L540,190L600,210L660,205L720,225L780,210L840,220L900,200L960,215L1020,205L1080,225L1140,210L1200,220L1260,205L1320,215L1380,225L1440,260L1440,320Z"
          />
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 80 + i * 100;
            const h = 30 + (i % 4) * 10;
            return (
              <g key={i} transform={`translate(${x}, ${260 - h})`}>
                <polygon points={`0,${h} -10,${h} 0,0 10,${h}`} fill="hsl(var(--primary) / 0.95)" />
                <rect x="-1.5" y={h} width="3" height="6" fill="hsl(var(--primary))" />
              </g>
            );
          })}
        </motion.svg>

        {/* Headline overlay */}
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <p className="landing-kicker mb-5">Chapter 01 — The Range</p>
            <h2 className="text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              Every adventure starts with <span className="gradient-text">a horizon</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
              Scroll down — and watch the trail unfold. Beacon turns scattered ideas into one
              shared expedition map.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
