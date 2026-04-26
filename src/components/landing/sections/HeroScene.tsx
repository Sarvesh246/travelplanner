"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useThemeColors } from "../hooks/useThemeColors";
import { useIsMobile, useMotionEnabled } from "../hooks/useIsMobile";

function CompassNeedle() {
  const ref = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector2(0, 0));
  const motion = useMotionEnabled();

  useFrame((state) => {
    if (!ref.current) return;
    const { x, y } = state.pointer;
    target.current.lerp(new THREE.Vector2(x, y), motion ? 0.08 : 1);
    const angle = Math.atan2(target.current.y, target.current.x);
    ref.current.rotation.z = angle - Math.PI / 2;
    if (motion) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.05;
    }
  });

  return (
    <group ref={ref}>
      {/* North arrow */}
      <mesh position={[0, 0.55, 0.05]}>
        <coneGeometry args={[0.12, 0.85, 12]} />
        <meshStandardMaterial color="#d8483c" emissive="#3a0d09" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* South arrow */}
      <mesh position={[0, -0.55, 0.05]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.12, 0.85, 12]} />
        <meshStandardMaterial color="#e6dfce" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Pin */}
      <mesh position={[0, 0, 0.06]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        <meshStandardMaterial color="#f1e4c4" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CompassBody({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <group>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[1.45, 0.08, 24, 64]} />
        <meshStandardMaterial color={primary} metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[1.2, 0.04, 18, 64]} />
        <meshStandardMaterial color={secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[1.2, 64]} />
        <meshStandardMaterial color="#1a1d1a" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Tick marks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 1.05;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.04, i % 4 === 0 ? 0.18 : 0.1, 0.02]} />
            <meshStandardMaterial color={i % 4 === 0 ? primary : secondary} />
          </mesh>
        );
      })}
    </group>
  );
}

function MountainRing({ primary, secondary }: { primary: string; secondary: string }) {
  const ref = useRef<THREE.Group>(null);
  const motion = useMotionEnabled();

  useFrame((state, delta) => {
    if (!motion || !ref.current) return;
    ref.current.rotation.y += delta * 0.07;
  });

  const peaks = useMemo(() => {
    const arr: { pos: [number, number, number]; height: number; color: string }[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 4.2 + (i % 3) * 0.3;
      const height = 1.2 + ((i * 13) % 7) * 0.18;
      arr.push({
        pos: [Math.cos(a) * r, -1.3, Math.sin(a) * r - 1.5],
        height,
        color: i % 2 === 0 ? primary : secondary,
      });
    }
    return arr;
  }, [primary, secondary]);

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {peaks.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <coneGeometry args={[0.85, p.height, 4]} />
          <meshStandardMaterial color={p.color} flatShading roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function BeaconOrb({ primary }: { primary: string }) {
  const ref = useRef<THREE.PointLight>(null);
  const motion = useMotionEnabled();

  useFrame((state) => {
    if (!motion || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.intensity = 4 + Math.sin(t * 2) * 1.2;
  });

  return (
    <Float floatIntensity={motion ? 0.6 : 0} speed={motion ? 1.4 : 0}>
      <group position={[0, 1.9, 0.1]}>
        <mesh>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshBasicMaterial color={primary} transparent opacity={0.18} />
        </mesh>
        <pointLight ref={ref} color={primary} intensity={5} distance={6} />
      </group>
    </Float>
  );
}

function SceneContents() {
  const colors = useThemeColors();
  const isMobile = useIsMobile();

  return (
    <>
      <ambientLight intensity={colors.isDark ? 0.35 : 0.55} />
      <directionalLight position={[3, 5, 4]} intensity={colors.isDark ? 0.8 : 1.1} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color={colors.primary} />

      <Float floatIntensity={0.4} rotationIntensity={0.3} speed={1.2}>
        <group rotation={[Math.PI * 0.04, 0, 0]}>
          <CompassBody primary={colors.primary} secondary={colors.secondary} />
          <CompassNeedle />
        </group>
      </Float>

      <BeaconOrb primary={colors.primary} />
      <MountainRing primary={colors.primary} secondary={colors.secondary} />

      {colors.isDark && (
        <Stars
          radius={50}
          depth={40}
          count={isMobile ? 800 : 2200}
          factor={3}
          saturation={0}
          fade
          speed={0.5}
        />
      )}

      <fog attach="fog" args={[colors.isDark ? "#10130f" : "#e8eee0", 8, 22]} />
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
    </Canvas>
  );
}

export default HeroScene;
