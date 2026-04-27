"use client";

import { motion, useTransform } from "framer-motion";
import { useRef } from "react";
import { useElementScrollProgress } from "../hooks/useElementScrollProgress";
import { useMotionEnabled } from "../hooks/useIsMobile";
import { useThemeColors } from "../hooks/useThemeColors";

const PINES = Array.from({ length: 16 }, (_, i) => ({
  x: 70 + i * 88,
  height: 30 + (i % 5) * 9,
}));

export function ParallaxRange() {
  const ref = useRef<HTMLElement>(null);
  const colors = useThemeColors();
  const motionEnabled = useMotionEnabled();
  const scrollYProgress = useElementScrollProgress(ref, 1, 0);

  const sunY = useTransform(scrollYProgress, [0, 1], ["78%", "18%"]);
  const sunOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.72, 0]);
  const moonOpacity = useTransform(scrollYProgress, [0, 0.45, 1], [0, 0.45, 1]);
  const layer1Y = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const layer3Y = useTransform(scrollYProgress, [0, 1], ["0%", "-31%"]);
  const layer4Y = useTransform(scrollYProgress, [0, 1], ["0%", "-42%"]);
  const fogOpacity = useTransform(
    scrollYProgress,
    [0, 0.48, 1],
    [0.18, 0.58, 0.22],
  );
  const routeProgress = useTransform(scrollYProgress, [0.15, 0.86], [0, 1]);
  const headingY = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    ["0%", "-5%", "-14%"],
  );
  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.82, 1],
    [0.4, 1, 1, 0.45],
  );

  return (
    <section
      id="range"
      ref={ref}
      className="relative h-[106svh] w-full overflow-hidden bg-background"
      aria-label="Mountain range parallax"
    >
      <div className="sticky top-0 h-svh w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 landing-sky"
        />
        {colors.isDark ? (
          <motion.div
            style={
              motionEnabled
                ? { top: sunY, opacity: moonOpacity }
                : { top: "24%" }
            }
            className="absolute right-[12%] h-28 w-28 rounded-full bg-foreground/55 shadow-[0_0_90px_28px_hsl(var(--foreground)/0.12)] sm:h-32 sm:w-32"
          />
        ) : (
          <motion.div
            style={
              motionEnabled
                ? { top: sunY, opacity: sunOpacity }
                : { top: "24%" }
            }
            className="absolute right-[12%] h-24 w-24 rounded-full bg-warning/80 shadow-[0_0_100px_38px_hsl(var(--warning)/0.22)] sm:h-28 sm:w-28"
          />
        )}

        <motion.div
          style={motionEnabled ? { opacity: fogOpacity } : { opacity: 0.35 }}
          className="absolute inset-x-0 bottom-[42%] h-40 bg-gradient-to-r from-transparent via-background/40 to-transparent"
        />

        <svg
          className="pointer-events-none absolute inset-x-0 bottom-[20%] z-20 h-36 w-full"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M-40 124 C 180 68, 310 148, 520 90 S 870 38, 1060 84 S 1300 142, 1480 78"
            fill="none"
            className="landing-range-route-track"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <motion.path
            d="M-40 124 C 180 68, 310 148, 520 90 S 870 38, 1060 84 S 1300 142, 1480 78"
            fill="none"
            className="landing-range-route"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ pathLength: motionEnabled ? routeProgress : 1 }}
          />
        </svg>

        <motion.svg
          style={motionEnabled ? { y: layer1Y } : undefined}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.16)"
            d="M0,224L80,213.3C160,203,320,181,480,176C640,171,800,181,960,176C1120,171,1280,149,1360,138.7L1440,128L1440,320L0,320Z"
          />
        </motion.svg>

        <motion.svg
          style={motionEnabled ? { y: layer2Y } : undefined}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--secondary) / 0.42)"
            d="M0,256L60,229.3C120,203,240,149,360,154.7C480,160,600,224,720,229.3C840,235,960,181,1080,160C1200,139,1320,149,1380,154.7L1440,160L1440,320L0,320Z"
          />
        </motion.svg>

        <motion.svg
          style={motionEnabled ? { y: layer3Y } : undefined}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.58)"
            d="M0,288L80,277.3C160,267,320,245,480,224C640,203,800,181,960,186.7C1120,192,1280,224,1360,240L1440,256L1440,320L0,320Z"
          />
        </motion.svg>

        <motion.svg
          style={motionEnabled ? { y: layer4Y } : undefined}
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="hsl(var(--primary) / 0.86)"
            d="M0,320L0,260L60,240L120,250L180,220L240,235L300,210L360,225L420,200L480,215L540,190L600,210L660,205L720,225L780,210L840,220L900,200L960,215L1020,205L1080,225L1140,210L1200,220L1260,205L1320,215L1380,225L1440,260L1440,320Z"
          />
          {PINES.map((pine, i) => (
            <g key={i} transform={`translate(${pine.x}, ${260 - pine.height})`}>
              <polygon
                points={`0,${pine.height} -10,${pine.height} 0,0 10,${pine.height}`}
                fill="hsl(var(--background) / 0.32)"
              />
              <rect
                x="-1.5"
                y={pine.height}
                width="3"
                height="7"
                fill="hsl(var(--background) / 0.42)"
              />
            </g>
          ))}
        </motion.svg>

        <motion.div
          style={
            motionEnabled ? { y: headingY, opacity: headingOpacity } : undefined
          }
          className="landing-range-copy relative z-30 flex h-full items-start justify-center px-6 pt-[30svh]"
        >
          <div className="max-w-2xl text-center">
            <p className="landing-kicker mb-5">Chapter 01 - The Range</p>
            <h2 className="text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              Every adventure starts with{" "}
              <span className="gradient-text">a horizon</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
              Scroll the route into view as plans become one shared map.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
