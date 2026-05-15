"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Glowing texture
const createGlowTexture = () => {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// Focused Flare for data pulses
const createFlareTexture = () => {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const CinematicNeuralNodes = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pulsesRef = useRef<THREE.Points>(null);

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [flareTexture, setFlareTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    setTexture(createGlowTexture());
    setFlareTexture(createFlareTexture());
  }, []);

  const particleCount = 180; 
  const pulseCount = 60;
  const maxDistance = 5.0; // Increased max distance to maintain connections with fewer particles

  const [particles, connections, lineColors, pulses] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Start with a highly saturated, vibrant, varied palette covering all hues
    const colorChoices = [
      new THREE.Color("#ef4444"), // Red
      new THREE.Color("#f97316"), // Orange
      new THREE.Color("#f59e0b"), // Amber
      new THREE.Color("#10b981"), // Emerald
      new THREE.Color("#06b6d4"), // Cyan
      new THREE.Color("#3b82f6"), // Blue
      new THREE.Color("#8b5cf6"), // Violet
      new THREE.Color("#d946ef"), // Fuchsia
      new THREE.Color("#f43f5e"), // Rose
    ];

    for (let i = 0; i < particleCount; i++) {
        const radius = 28 * Math.cbrt(Math.random()); 
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = (radius * Math.sin(phi) * Math.cos(theta)) * 1.8; 
        positions[i * 3 + 1] = (radius * Math.sin(phi) * Math.sin(theta)) * 1.2;
        positions[i * 3 + 2] = (radius * Math.cos(phi));

        velocities[i * 3] = (Math.random() - 0.5) * 0.025;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.025;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.025;

        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        particleColors[i * 3] = color.r;
        particleColors[i * 3 + 1] = color.g;
        particleColors[i * 3 + 2] = color.b;
    }

    const linePos = new Float32Array(particleCount * particleCount * 6);
    const lineCols = new Float32Array(particleCount * particleCount * 6);

    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseTargets = new Int32Array(pulseCount); 
    const pulseSources = new Int32Array(pulseCount); 
    const pulseProgress = new Float32Array(pulseCount); 

    for (let i = 0; i < pulseCount; i++) {
        const source = Math.floor(Math.random() * particleCount);
        const target = Math.floor(Math.random() * particleCount);
        pulseSources[i] = source;
        pulseTargets[i] = target;
        pulseProgress[i] = Math.random(); 
        
        pulsePositions[i * 3] = positions[source * 3];
        pulsePositions[i * 3 + 1] = positions[source * 3 + 1];
        pulsePositions[i * 3 + 2] = positions[source * 3 + 2];
    }

    return [
      { positions, velocities, colors: particleColors },
      linePos,
      lineCols,
      { positions: pulsePositions, sources: pulseSources, targets: pulseTargets, progress: pulseProgress }
    ] as const;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Deep parallax for cinematic feel
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.pointer.x * 4.0), 0.015);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.pointer.y * 4.0), 0.015);
    state.camera.lookAt(0, 0, 0);

    if (groupRef.current) {
        groupRef.current.rotation.y = time * 0.02;
        groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }

    if (coreRef.current) {
        coreRef.current.rotation.y -= delta * 0.1;
        coreRef.current.rotation.x -= delta * 0.15;
        // Dynamically shift core color
        const coreMat = coreRef.current.material as THREE.MeshBasicMaterial;
        coreMat.opacity = 0.2 + Math.sin(time * 3) * 0.1;
        coreMat.color.setHSL((time * 0.05) % 1, 0.9, 0.5);
    }

    const pos = pointsRef.current?.geometry.attributes.position.array as Float32Array;
    const vels = particles.velocities;
    const linePos = linesRef.current?.geometry.attributes.position.array as Float32Array;
    const lineCols = linesRef.current?.geometry.attributes.color.array as Float32Array;
    const pointCols = particles.colors;
    
    let lineIdx = 0;
    let colIdx = 0;

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += vels[i * 3];
      pos[i * 3 + 1] += vels[i * 3 + 1];
      pos[i * 3 + 2] += vels[i * 3 + 2];

      const bounds = 35;
      if (Math.abs(pos[i * 3]) > bounds) vels[i * 3] *= -1;
      if (Math.abs(pos[i * 3 + 1]) > bounds) vels[i * 3 + 1] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > bounds) vels[i * 3 + 2] *= -1;

      // Dynamically shift colors of particles over time for chaotic vibrancy
      const c = new THREE.Color(pointCols[i * 3], pointCols[i * 3 + 1], pointCols[i * 3 + 2]);
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL((hsl.h + 0.002) % 1, 0.9, 0.55);
      pointCols[i * 3] = c.r;
      pointCols[i * 3 + 1] = c.g;
      pointCols[i * 3 + 2] = c.b;

      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        const dynamicMaxDistance = maxDistance + Math.sin(time * 0.8 + i) * 1.2;

        if (distSq < dynamicMaxDistance * dynamicMaxDistance) {
          linePos[lineIdx++] = pos[i * 3];
          linePos[lineIdx++] = pos[i * 3 + 1];
          linePos[lineIdx++] = pos[i * 3 + 2];
          linePos[lineIdx++] = pos[j * 3];
          linePos[lineIdx++] = pos[j * 3 + 1];
          linePos[lineIdx++] = pos[j * 3 + 2];

          const opacity = 1 - Math.sqrt(distSq) / dynamicMaxDistance;
          
          lineCols[colIdx++] = pointCols[i * 3] * opacity;
          lineCols[colIdx++] = pointCols[i * 3 + 1] * opacity;
          lineCols[colIdx++] = pointCols[i * 3 + 2] * opacity;
          lineCols[colIdx++] = pointCols[j * 3] * opacity;
          lineCols[colIdx++] = pointCols[j * 3 + 1] * opacity;
          lineCols[colIdx++] = pointCols[j * 3 + 2] * opacity;
        }
      }
    }

    const pulsePosArray = pulsesRef.current?.geometry.attributes.position.array as Float32Array;
    if (pulsePosArray) {
        for (let i = 0; i < pulseCount; i++) {
            pulses.progress[i] += delta * (0.8 + Math.random() * 1.2);
            
            if (pulses.progress[i] >= 1.0) {
                pulses.progress[i] = 0;
                pulses.sources[i] = pulses.targets[i]; 
                
                let foundNeighbor = false;
                const srcIdx = pulses.sources[i];
                for (let n = 0; n < particleCount; n++) {
                    if (n !== srcIdx) {
                        const dx = pos[srcIdx*3] - pos[n*3];
                        const dy = pos[srcIdx*3+1] - pos[n*3+1];
                        const dz = pos[srcIdx*3+2] - pos[n*3+2];
                        if (dx*dx + dy*dy + dz*dz < maxDistance * maxDistance * 2.5) {
                            pulses.targets[i] = n;
                            foundNeighbor = true;
                            pulsePosArray[i*3] = n; // Dummy store
                            break;
                        }
                    }
                }
                if (!foundNeighbor) pulses.targets[i] = Math.floor(Math.random() * particleCount);
            }

            const src = pulses.sources[i];
            const dst = pulses.targets[i];
            const p = pulses.progress[i];

            pulsePosArray[i*3] = pos[src*3] + (pos[dst*3] - pos[src*3]) * p;
            pulsePosArray[i*3+1] = pos[src*3+1] + (pos[dst*3+1] - pos[src*3+1]) * p;
            pulsePosArray[i*3+2] = pos[src*3+2] + (pos[dst*3+2] - pos[src*3+2]) * p;
        }
        if (pulsesRef.current) pulsesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
    if (linesRef.current) {
        linesRef.current.geometry.setDrawRange(0, lineIdx / 3);
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        linesRef.current.geometry.attributes.color.needsUpdate = true;
        
        // Intense glow pulsing using Normal Blending for white bg
        (linesRef.current.material as THREE.LineBasicMaterial).opacity = 0.35 + Math.sin(time * 5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[5, 1]} />
        <meshBasicMaterial 
            color="#2563eb" 
            wireframe 
            transparent 
            opacity={0.1} 
            blending={THREE.AdditiveBlending}
        />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
        </bufferGeometry>
        {texture && (
          <pointsMaterial 
            size={0.9} 
            map={texture}
            alphaMap={texture}
            vertexColors 
            transparent 
            opacity={0.8} 
            sizeAttenuation 
            depthWrite={false} 
            blending={THREE.AdditiveBlending} // Changed to AdditiveBlending for dark mode
          />
        )}
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[connections, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.4} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </lineSegments>

      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulses.positions, 3]} />
        </bufferGeometry>
        {flareTexture && (
          <pointsMaterial 
            size={2.5} 
            color="#ffffff" // Clean white center but picks up vertex color or environment
            map={flareTexture}
            alphaMap={flareTexture}
            transparent 
            opacity={0.9} 
            sizeAttenuation 
            depthWrite={false} 
            blending={THREE.AdditiveBlending} 
          />
        )}
      </points>
    </group>
  );
};

export const DashboardNeuralNetwork = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-transparent"> 
      {/* Absolute clean dark background to serve the cinematic elements */}
      <Canvas camera={{ position: [0, 0, 24], fov: 45 }} dpr={[1, 2]}>
        <fog attach="fog" args={["#0a0a0a", 12, 45]} />
        <CinematicNeuralNodes />
      </Canvas>
    </div>
  );
};
