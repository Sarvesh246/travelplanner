"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobile, useMotionEnabled } from "../hooks/useIsMobile";
import { useLandingMotionRuntime } from "../hooks/useLandingMotionRuntime";
import { useThemeColors } from "../hooks/useThemeColors";

function toThreeColor(value: string) {
  const match = value.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/i);
  if (!match) return new THREE.Color(value);

  const [, h, s, l] = match;
  return new THREE.Color().setHSL(Number(h) / 360, Number(s) / 100, Number(l) / 100);
}

function pseudoRandom(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function StaticHeroBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_28%,hsl(var(--primary)/0.22),transparent_30%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.55))]"
    >
      <div className="absolute left-1/2 top-[24%] h-64 w-64 -translate-x-1/2 rounded-full border border-primary/25 shadow-[0_0_90px_hsl(var(--primary)/0.28)]" />
      <div className="absolute left-1/2 top-[29%] h-40 w-40 -translate-x-1/2 rounded-full border border-secondary/45" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(135deg,transparent_0_18%,hsl(var(--primary)/0.22)_18%_42%,transparent_42%),linear-gradient(225deg,transparent_0_22%,hsl(var(--secondary)/0.28)_22%_48%,transparent_48%)]" />
    </div>
  );
}

function useCanvasVisibility() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function SceneGpuReady({ onSaturated }: { onSaturated: () => void }) {
  const { gl, scene, camera } = useThree();
  const onSaturatedRef = useRef(onSaturated);
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    onSaturatedRef.current = onSaturated;
  }, [onSaturated]);

  useLayoutEffect(() => {
    if (doneRef.current) return;

    const renderer = gl as THREE.WebGLRenderer;
    try {
      renderer.compile(scene, camera);
    } catch {
      // Still run warm-up frames; compile can fail in edge WebGL states.
    }

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        onSaturatedRef.current();
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [gl, scene, camera]);

  return null;
}

function FloatingGroup({
  active,
  children,
  floatIntensity,
  rotationIntensity = 0,
  speed,
}: {
  active: boolean;
  children: ReactNode;
  floatIntensity: number;
  rotationIntensity?: number;
  speed: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!active || !ref.current) return;

    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = Math.sin(t) * floatIntensity;
    ref.current.rotation.z = Math.sin(t * 0.72) * rotationIntensity * 0.08;
    ref.current.rotation.x = Math.cos(t * 0.58) * rotationIntensity * 0.04;
  });

  return <group ref={ref}>{children}</group>;
}

function CompassNeedle({
  active,
  foreground,
  primary,
  secondary,
}: {
  active: boolean;
  foreground: THREE.Color;
  primary: THREE.Color;
  secondary: THREE.Color;
}) {
  const ref = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector2(0, 0));
  const eased = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!ref.current) return;
    if (!active) return;
    target.current.set(state.pointer.x, state.pointer.y);
    eased.current.lerp(target.current, 0.075);
    ref.current.rotation.z = Math.atan2(eased.current.y, eased.current.x) - Math.PI / 2;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.035;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.55, 0.07]}>
        <coneGeometry args={[0.12, 0.9, 3]} />
        <meshStandardMaterial
          color={primary}
          emissive={primary}
          emissiveIntensity={0.28}
          roughness={0.42}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, -0.55, 0.07]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.12, 0.9, 3]} />
        <meshStandardMaterial color={secondary} roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.085, 0.085, 0.1, 20]} />
        <meshStandardMaterial color={foreground} metalness={0.55} roughness={0.28} />
      </mesh>
    </group>
  );
}

function CompassBody({
  background,
  border,
  foreground,
  primary,
  secondary,
}: {
  background: THREE.Color;
  border: THREE.Color;
  foreground: THREE.Color;
  primary: THREE.Color;
  secondary: THREE.Color;
}) {
  const tickData = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        angle: (i / 32) * Math.PI * 2,
        major: i % 4 === 0,
      })),
    []
  );

  return (
    <group>
      <mesh>
        <torusGeometry args={[1.48, 0.085, 28, 96]} />
        <meshStandardMaterial
          color={foreground}
          emissive={primary}
          emissiveIntensity={0.12}
          metalness={0.7}
          roughness={0.22}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[1.22, 0.035, 18, 96]} />
        <meshStandardMaterial color={primary} metalness={0.42} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[1.18, 80]} />
        <meshStandardMaterial color={background} roughness={0.72} metalness={0.1} />
      </mesh>
      {tickData.map((tick, i) => (
        <mesh
          key={i}
          position={[Math.cos(tick.angle) * 1.03, Math.sin(tick.angle) * 1.03, 0.02]}
          rotation={[0, 0, tick.angle]}
        >
          <boxGeometry args={[0.035, tick.major ? 0.2 : 0.1, 0.025]} />
          <meshStandardMaterial color={tick.major ? primary : border} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.025]}>
        <ringGeometry args={[0.18, 0.22, 28]} />
        <meshStandardMaterial color={secondary} roughness={0.5} />
      </mesh>
    </group>
  );
}

function MountainRing({
  active,
  background,
  primary,
  secondary,
}: {
  active: boolean;
  background: THREE.Color;
  primary: THREE.Color;
  secondary: THREE.Color;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (!active) return;
    ref.current.rotation.y += delta * 0.055;
  });

  const peaks = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 4.8 + (i % 4) * 0.28;
      return {
        height: 1.26 + ((i * 17) % 8) * 0.17,
        position: [Math.cos(angle) * radius, -1.55, Math.sin(angle) * radius - 1.15] as [
          number,
          number,
          number,
        ],
        rotation: angle + Math.PI / 4,
        tint: i % 2 === 0 ? primary : secondary,
      };
    });
  }, [primary, secondary]);

  return (
    <group ref={ref}>
      {peaks.map((peak, i) => (
        <group key={i} position={peak.position} rotation={[0, peak.rotation, 0]}>
          <mesh>
            <coneGeometry args={[0.86, peak.height, 4]} />
            <meshStandardMaterial color={peak.tint} flatShading roughness={0.82} />
          </mesh>
          <mesh position={[0, peak.height * 0.32, 0.01]} scale={[0.42, 0.32, 0.42]}>
            <coneGeometry args={[0.86, peak.height * 0.38, 4]} />
            <meshStandardMaterial color={background} flatShading roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BeaconOrb({ active, primary }: { active: boolean; primary: THREE.Color }) {
  const light = useRef<THREE.PointLight>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!active) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.16;
    if (light.current) light.current.intensity = 4.5 * pulse;
    if (halo.current) halo.current.scale.setScalar(1.2 + pulse * 0.18);
  });

  return (
    <FloatingGroup active={active} floatIntensity={0.08} speed={1.35}>
      <group position={[0, 1.82, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.17, 28, 28]} />
          <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.8} />
        </mesh>
        <mesh ref={halo}>
          <sphereGeometry args={[0.36, 24, 24]} />
          <meshBasicMaterial color={primary} transparent opacity={0.16} depthWrite={false} />
        </mesh>
        <pointLight ref={light} color={primary} intensity={4.5} distance={7} />
      </group>
    </FloatingGroup>
  );
}

function StarField({
  active,
  count,
  foreground,
  primary,
}: {
  active: boolean;
  count: number;
  foreground: THREE.Color;
  primary: THREE.Color;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = pseudoRandom(i, 9);
      const b = pseudoRandom(i, 10);
      const c = pseudoRandom(i, 11);
      data[i * 3] = (a - 0.5) * 12;
      data[i * 3 + 1] = (b - 0.5) * 6.5;
      data[i * 3 + 2] = -1.6 - c * 12;
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (!active || !ref.current) return;
    ref.current.rotation.y += delta * 0.018;
  });

  const color = useMemo(() => foreground.clone().lerp(primary, 0.24), [foreground, primary]);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        depthWrite={false}
        size={0.022}
        transparent
        opacity={0.62}
        sizeAttenuation
      />
    </points>
  );
}

function PollenField({
  active,
  count,
  primary,
  secondary,
}: {
  active: boolean;
  count: number;
  primary: THREE.Color;
  secondary: THREE.Color;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = pseudoRandom(i, 1);
      const b = pseudoRandom(i, 2);
      const c = pseudoRandom(i, 3);
      data[i * 3] = (a - 0.5) * 10;
      data[i * 3 + 1] = (b - 0.5) * 5.5;
      data[i * 3 + 2] = -2 - c * 8;
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (!active) return;
    ref.current.rotation.y += delta * 0.025;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  const color = useMemo(() => primary.clone().lerp(secondary, 0.35), [primary, secondary]);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        depthWrite={false}
        size={0.026}
        transparent
        opacity={0.48}
        sizeAttenuation
      />
    </points>
  );
}

function HeroPerformanceMonitor({
  active,
  onDegrade,
}: {
  active: boolean;
  onDegrade: () => void;
}) {
  const sampleFramesRef = useRef(0);
  const slowFramesRef = useRef(0);
  const degradedRef = useRef(false);

  useFrame((_, delta) => {
    if (!active || degradedRef.current) return;

    sampleFramesRef.current += 1;
    if (delta > 1 / 48) {
      slowFramesRef.current += 1;
    }

    if (sampleFramesRef.current < 45) return;

    if (slowFramesRef.current >= 18) {
      degradedRef.current = true;
      onDegrade();
      return;
    }

    sampleFramesRef.current = 0;
    slowFramesRef.current = 0;
  });

  return null;
}

function SceneContents({
  active,
  compassScale,
  compassY,
  isMobile,
  qualityTier,
}: {
  active: boolean;
  compassScale: number;
  compassY: number;
  isMobile: boolean;
  qualityTier: "full" | "balanced";
}) {
  const colors = useThemeColors();
  const palette = useMemo(
    () => ({
      background: toThreeColor(colors.background),
      border: toThreeColor(colors.border),
      foreground: toThreeColor(colors.foreground),
      primary: toThreeColor(colors.primary),
      secondary: toThreeColor(colors.secondary),
    }),
    [colors.background, colors.border, colors.foreground, colors.primary, colors.secondary]
  );

  return (
    <>
      <ambientLight intensity={colors.isDark ? 0.5 : 0.72} />
      <directionalLight position={[3, 5, 4]} intensity={colors.isDark ? 0.95 : 1.2} />
      <directionalLight position={[-4, -1.5, 2]} intensity={0.45} color={palette.primary} />

      <FloatingGroup active={active} floatIntensity={0.055} rotationIntensity={0.18} speed={1}>
        <group
          position={[0, compassY, 0]}
          rotation={[Math.PI * 0.04, 0, 0]}
          scale={compassScale}
        >
          <CompassBody
            background={palette.background}
            border={palette.border}
            foreground={palette.foreground}
            primary={palette.primary}
            secondary={palette.secondary}
          />
          <CompassNeedle
            active={active}
            foreground={palette.foreground}
            primary={palette.primary}
            secondary={palette.secondary}
          />
        </group>
      </FloatingGroup>

      <BeaconOrb active={active} primary={palette.primary} />
      <MountainRing
        active={active}
        background={palette.background}
        primary={palette.primary}
        secondary={palette.secondary}
      />

      {colors.isDark ? (
        <StarField
          active={active}
          count={qualityTier === "balanced" ? (isMobile ? 420 : 880) : isMobile ? 700 : 1400}
          foreground={palette.foreground}
          primary={palette.primary}
        />
      ) : (
        <PollenField
          active={active}
          count={qualityTier === "balanced" ? (isMobile ? 60 : 120) : isMobile ? 90 : 180}
          primary={palette.primary}
          secondary={palette.secondary}
        />
      )}

      <fog attach="fog" args={[palette.background, 8, 23]} />
    </>
  );
}

export function HeroScene({ onReady }: { onReady?: () => void }) {
  const isMobile = useIsMobile();
  const motionEnabled = useMotionEnabled();
  const runtime = useLandingMotionRuntime();
  const { ref, isVisible } = useCanvasVisibility();
  const viewport = runtime.viewport;
  const aspect = viewport.width / Math.max(1, viewport.height);
  const compactHeight = viewport.height < 700;
  const tallViewport = viewport.height > viewport.width * 1.35;
  const ultraWide = aspect > 2.15;
  const heroTier = runtime.qualityTier;
  const compassScale = isMobile
    ? tallViewport
      ? 0.78
      : 0.72
    : compactHeight
      ? 0.84
      : ultraWide
        ? 1.18
        : 1.04;
  const compassY = isMobile ? (tallViewport ? -0.62 : -0.84) : compactHeight ? -0.62 : -0.42;
  const cameraFov = isMobile ? (tallViewport ? 45 : 48) : compactHeight ? 46 : ultraWide ? 37 : 41;

  useEffect(() => {
    if (!motionEnabled) onReady?.();
  }, [motionEnabled, onReady]);

  if (!motionEnabled) return <StaticHeroBackdrop />;

  const dpr: [number, number] = isMobile
    ? heroTier === "balanced"
      ? [1, 1]
      : [1, 1.15]
    : heroTier === "balanced"
      ? [1, 1.18]
      : [1, 1.35];

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 5.5], fov: cameraFov }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        frameloop={isVisible ? "always" : "demand"}
        resize={{ scroll: false, debounce: { resize: 0, scroll: 80 } }}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <Suspense fallback={null}>
          <SceneContents
            active={isVisible}
            compassScale={compassScale}
            compassY={compassY}
            isMobile={isMobile}
            qualityTier={heroTier}
          />
          <HeroPerformanceMonitor
            active={isVisible && heroTier === "full"}
            onDegrade={runtime.downgradeQuality}
          />
          {onReady ? <SceneGpuReady onSaturated={onReady} /> : null}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HeroScene;
