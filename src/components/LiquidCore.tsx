import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { useGetDashboardSummary } from "@workspace/api-client-react";

extend({ UnrealBloomPass });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      unrealBloomPass: any;
    }
  }
}

interface ParticleSwarmProps {
  speedMult: number;
  count: number;
}

const ParticleSwarm = ({ speedMult, count }: ParticleSwarmProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor;

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push(new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      ));
    }
    return pos;
  }, [count]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS = useMemo(() => ({ "size": 66.8, "speed": 1.028, "pulse": 1.1 }), []);
  const addControl = (id: string, l: string, min: number, max: number, val: number) => {
    // @ts-ignore
    return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = () => {};
  const annotate = () => {};

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    for (let i = 0; i < count; i++) {
      const size = addControl("size", "Size", 20, 200, 80);
      const speed = addControl("speed", "Speed", 0.1, 3.0, 1.0);
      const pulse = addControl("pulse", "Pulse", 0.0, 2.0, 0.8);

      const t = time * speed;
      const f = i / count;

      const phi = Math.acos(1.0 - 2.0 * f);
      const theta = Math.PI * 2.0 * Math.sqrt(count * f);

      const r =
        size +
        Math.sin(theta * 6.0 + t * 2.0) * 8.0 +
        Math.cos(phi * 8.0 - t) * 8.0;

      const breathing =
        1.0 + Math.sin(t * 2.0) * pulse * 0.15;

      const x = Math.sin(phi) * Math.cos(theta) * r * breathing;
      const y = Math.sin(phi) * Math.sin(theta) * r * breathing;
      const z = Math.cos(phi) * r * breathing;

      target.set(x, y, z);

      const hue =
        0.52 +
        Math.sin(f * 20.0 + t) * 0.08;

      const light =
        0.45 +
        Math.sin(theta * 2.0 - t * 3.0) * 0.2;

      color.setHSL(hue, 1.0, light);

      if (i === 0) {
        setInfo();
        annotate();
      }

      if (positions[i]) {
        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

function LiquidCore() {
  const summaryQ = useGetDashboardSummary({ query: { refetchInterval: 10000 } });
  const summary = summaryQ.data;

  // Track viewport width for responsive particle count
  const [particleCount, setParticleCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 5000 : 20000;
    }
    return 20000;
  });

  useEffect(() => {
    const handleResize = () => {
      setParticleCount(window.innerWidth < 768 ? 5000 : 20000);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute speed multiplier dynamically based on transactions
  const speedMult = useMemo(() => {
    if (!summary) return 0.8;
    const activityCount = summary.recentActivity?.length || 0;
    const donationCount = summary.donations?.length || 0;
    const expenseCount = summary.expenses?.length || 0;

    const totalTransactions = donationCount + expenseCount;
    const transactionFactor = Math.min(1.0, totalTransactions * 0.01); // max addition of 1.0

    return 0.6 + (activityCount * 0.12) + transactionFactor; // ranges from 0.6 to 2.8+
  }, [summary]);

  return (
    <div 
      className="fixed inset-0 z-[-1] pointer-events-none opacity-40 bg-[#030712]"
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#030712', 0.01]} />
        <ParticleSwarm speedMult={speedMult} count={particleCount} />
        <OrbitControls autoRotate={true} enableZoom={false} enablePan={false} enableRotate={false} />
        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}

export default React.memo(LiquidCore);
