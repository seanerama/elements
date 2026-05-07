import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { orbitalsForShells, type OrbitalShell } from '@/lib/orbital-geometry';

interface Props {
  electronsPerShell: readonly number[];
  protons: number;
  neutrons: number | null;
}

interface ThemeColors {
  ink: string;
  electron: string;
  shell: string;
  paperDeep: string;
}

function readThemeColors(): ThemeColors {
  const root = document.documentElement;
  const cs = window.getComputedStyle(root);
  return {
    ink: cs.getPropertyValue('--color-ink').trim() || '#1f1d18',
    electron: cs.getPropertyValue('--color-accent-prussian').trim() || '#2d4a6b',
    shell: cs.getPropertyValue('--color-rule').trim() || '#8a7e63',
    paperDeep: cs.getPropertyValue('--color-paper-deep').trim() || '#e0d4ba',
  };
}

function ShellRing({ radius, color }: { radius: number; color: string }) {
  const segments = 64;
  const points = useMemo(() => {
    const out = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      out[i * 3 + 0] = Math.cos(a) * radius;
      out[i * 3 + 1] = 0;
      out[i * 3 + 2] = Math.sin(a) * radius;
    }
    return out;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.45} />
    </line>
  );
}

function Electrons({ shell, color, speed }: { shell: OrbitalShell; color: string; speed: number }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, dt) => {
    if (groupRef.current && speed > 0) {
      groupRef.current.rotation.y += speed * dt;
    }
  });

  return (
    <group
      ref={groupRef}
      rotation={[shell.electrons[0]?.tiltAngle ?? 0, 0, ((shell.index - 1) * Math.PI) / 9]}
    >
      {shell.electrons.map((e, i) => {
        const x = Math.cos(e.phase) * shell.radius;
        const z = Math.sin(e.phase) * shell.radius;
        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({ electronsPerShell, protons, neutrons }: Props) {
  const [colors, setColors] = useState<ThemeColors>(() => ({
    ink: '#1f1d18',
    electron: '#2d4a6b',
    shell: '#8a7e63',
    paperDeep: '#e0d4ba',
  }));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setColors(readThemeColors());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const scene = useMemo(
    () => orbitalsForShells(electronsPerShell, reducedMotion),
    [electronsPerShell, reducedMotion],
  );

  void Vector3; // satisfy three import for tree-shake hint
  void protons;
  void neutrons;

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 4]} intensity={1.2} />
      <pointLight position={[-4, -2, -4]} intensity={0.5} color={colors.electron} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[scene.nucleusRadius, 24, 24]} />
        <meshStandardMaterial color={colors.ink} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Shell rings */}
      {scene.shells.map((s) => (
        <ShellRing key={`ring-${s.index}`} radius={s.radius} color={colors.shell} />
      ))}

      {/* Electrons */}
      {scene.shells.map((s) => (
        <Electrons key={`e-${s.index}`} shell={s} color={colors.electron} speed={s.speed} />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={12}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function Atom(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 6], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
