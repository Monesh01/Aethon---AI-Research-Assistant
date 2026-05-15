"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RealDataElements = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create multiple distinct shapes representing data types
  // Text chunks, Images, Tables, Vectors
  const elementCount = 60;
  
  const [elements] = useMemo(() => {
    const arr = [];
    const colors = ["#ffffff", "#e2e8f0", "#94a3b8", "#f8fafc"];
    const types = ["box", "tetrahedron", "octahedron", "dodecahedron"];
    
    for (let i = 0; i < elementCount; i++) {
        // Start from edges
        const radius = 8 + Math.random() * 8;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        arr.push({
            pos: new THREE.Vector3(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            ),
            rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
            rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05),
            velocity: new THREE.Vector3(0, 0, 0),
            color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
            type: types[Math.floor(Math.random() * types.length)],
            scale: 0.05 + Math.random() * 0.1 // Smaller scale
        });
    }
    return [arr];
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // We use separate InstancedMesh for each geometry type
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const tetraRef = useRef<THREE.InstancedMesh>(null);
  const octaRef = useRef<THREE.InstancedMesh>(null);
  const dodecaRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    let boxIdx = 0, tetraIdx = 0, octaIdx = 0, dodecaIdx = 0;

    elements.forEach((el, i) => {
        // Move towards center but swirl
        const toCenter = new THREE.Vector3(0, 0, 0).sub(el.pos).normalize();
        const swirl = new THREE.Vector3(-el.pos.y, el.pos.x, 0).normalize().multiplyScalar(0.5);
        
        // Add waving motion
        const wave = new THREE.Vector3(Math.sin(time * 2 + i) * 0.02, Math.cos(time * 1.5 + i) * 0.02, Math.sin(time + i) * 0.02);

        el.velocity.add(toCenter.multiplyScalar(0.001)).add(swirl.multiplyScalar(0.0005)).add(wave);
        el.velocity.multiplyScalar(0.98); // friction
        
        el.pos.add(el.velocity);
        
        el.rot.x += el.rotSpeed.x;
        el.rot.y += el.rotSpeed.y;
        el.rot.z += el.rotSpeed.z;

        const dist = el.pos.length();
        
        // If it gets absorbed into the core
        if (dist < 1.0) {
            const radius = 12 + Math.random() * 5;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            el.pos.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            el.velocity.set(0, 0, 0);
            
            // Randomize color again
            const colors = ["#ffffff", "#e2e8f0", "#94a3b8", "#f8fafc"];
            el.color.set(colors[Math.floor(Math.random() * colors.length)]);
        }

        // Pulse scale based on distance
        let currentScale = el.scale;
        if (dist < 4) {
            currentScale *= (dist / 4); // shrink as it enters core
            // Shift color completely towards bright white when entering DB
            el.color.lerp(new THREE.Color("#ffffff"), 0.05);
        }

        dummy.position.copy(el.pos);
        dummy.rotation.copy(el.rot);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();

        if (el.type === "box" && boxRef.current) {
            boxRef.current.setMatrixAt(boxIdx, dummy.matrix);
            boxRef.current.setColorAt(boxIdx, el.color);
            boxIdx++;
        } else if (el.type === "tetrahedron" && tetraRef.current) {
            tetraRef.current.setMatrixAt(tetraIdx, dummy.matrix);
            tetraRef.current.setColorAt(tetraIdx, el.color);
            tetraIdx++;
        } else if (el.type === "octahedron" && octaRef.current) {
            octaRef.current.setMatrixAt(octaIdx, dummy.matrix);
            octaRef.current.setColorAt(octaIdx, el.color);
            octaIdx++;
        } else if (el.type === "dodecahedron" && dodecaRef.current) {
            dodecaRef.current.setMatrixAt(dodecaIdx, dummy.matrix);
            dodecaRef.current.setColorAt(dodecaIdx, el.color);
            dodecaIdx++;
        }
    });

    if (boxRef.current) { boxRef.current.instanceMatrix.needsUpdate = true; boxRef.current.instanceColor!.needsUpdate = true; }
    if (tetraRef.current) { tetraRef.current.instanceMatrix.needsUpdate = true; tetraRef.current.instanceColor!.needsUpdate = true; }
    if (octaRef.current) { octaRef.current.instanceMatrix.needsUpdate = true; octaRef.current.instanceColor!.needsUpdate = true; }
    if (dodecaRef.current) { dodecaRef.current.instanceMatrix.needsUpdate = true; dodecaRef.current.instanceColor!.needsUpdate = true; }
    
    if (groupRef.current) {
        groupRef.current.rotation.y = time * 0.1;
        groupRef.current.rotation.x = Math.sin(time * 0.05) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
        <instancedMesh ref={boxRef} args={[undefined, undefined, elementCount]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0.8} wireframe />
        </instancedMesh>
        <instancedMesh ref={tetraRef} args={[undefined, undefined, elementCount]}>
            <tetrahedronGeometry args={[1]} />
            <meshBasicMaterial transparent opacity={0.8} wireframe />
        </instancedMesh>
        <instancedMesh ref={octaRef} args={[undefined, undefined, elementCount]}>
            <octahedronGeometry args={[1]} />
            <meshBasicMaterial transparent opacity={0.8} wireframe />
        </instancedMesh>
        <instancedMesh ref={dodecaRef} args={[undefined, undefined, elementCount]}>
            <dodecahedronGeometry args={[1]} />
            <meshBasicMaterial transparent opacity={0.8} wireframe />
        </instancedMesh>
    </group>
  );
};

const RAGNeuralBackground = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const particleCount = 200; // Document chunks
  const maxDistance = 3.5;

  const [particles, connections] = useMemo(() => {
    // Document Chunks (moving towards center)
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Extracted simple white/gray colors for minimalism
    const rainbowColors = [
        new THREE.Color("#ffffff"), new THREE.Color("#f8fafc"), 
        new THREE.Color("#f1f5f9"), new THREE.Color("#e2e8f0"), 
        new THREE.Color("#cbd5e1"), new THREE.Color("#94a3b8")
    ];

    for (let i = 0; i < particleCount; i++) {
        const radius = 5 + Math.random() * 10;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        velocities[i * 3] = -positions[i * 3] * (0.001 + Math.random() * 0.003);
        velocities[i * 3 + 1] = -positions[i * 3 + 1] * (0.001 + Math.random() * 0.003);
        velocities[i * 3 + 2] = -positions[i * 3 + 2] * (0.001 + Math.random() * 0.003);

        const c = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    return [
      { positions, velocities, colors },
      new Float32Array(particleCount * particleCount * 6), // Line positions
    ];
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current?.geometry.attributes.position.array as Float32Array;
    const vels = particles.velocities;
    const colList = pointsRef.current?.geometry.attributes.color.array as Float32Array;
    const linePos = linesRef.current?.geometry.attributes.position.array as Float32Array;
    const lineCols = linesRef.current?.geometry.attributes.color?.array as Float32Array;
    
    // Core pulsing colors (White)
    const coreColorRGB = new THREE.Color("#ffffff");

    let lineIdx = 0;
    let colIdx = 0;

    for (let i = 0; i < particleCount; i++) {
        // Dynamic swelling velocity
        pos[i * 3] += vels[i * 3] * (1 + Math.sin(time + i) * 0.5);
        pos[i * 3 + 1] += vels[i * 3 + 1] * (1 + Math.sin(time + i + 1) * 0.5);
        pos[i * 3 + 2] += vels[i * 3 + 2] * (1 + Math.sin(time + i + 2) * 0.5);

        const distFromCenter = Math.sqrt(
            pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2 + pos[i * 3 + 2] ** 2
        );

        // Turn to current core color as it gets closer to center (Embedded)
        if (distFromCenter < 4.0) {
            colList[i * 3] = THREE.MathUtils.lerp(colList[i * 3], coreColorRGB.r, 0.08);
            colList[i * 3 + 1] = THREE.MathUtils.lerp(colList[i * 3 + 1], coreColorRGB.g, 0.08);
            colList[i * 3 + 2] = THREE.MathUtils.lerp(colList[i * 3 + 2], coreColorRGB.b, 0.08);
        } else {
            // Keep original colors for outer particles
            const cColor = new THREE.Color(colList[i * 3], colList[i * 3 + 1], colList[i * 3 + 2]);
            // Removed hue shifting for purely white theme
            colList[i * 3] = cColor.r;
            colList[i * 3 + 1] = cColor.g;
            colList[i * 3 + 2] = cColor.b;
        }

        // Respawn if too close to center
        if (distFromCenter < 0.5) {
            const radius = 12 + Math.random() * 5;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = radius * Math.cos(phi);

            vels[i * 3] = -pos[i * 3] * (0.001 + Math.random() * 0.004);
            vels[i * 3 + 1] = -pos[i * 3 + 1] * (0.001 + Math.random() * 0.004);
            vels[i * 3 + 2] = -pos[i * 3 + 2] * (0.001 + Math.random() * 0.004);
        }

        for (let j = i + 1; j < Math.min(particleCount, i + 15); j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const d = dx * dx + dy * dy + dz * dz;

            if (d < maxDistance * maxDistance && distFromCenter < 9) {
                linePos[lineIdx++] = pos[i * 3];
                linePos[lineIdx++] = pos[i * 3 + 1];
                linePos[lineIdx++] = pos[i * 3 + 2];
                linePos[lineIdx++] = pos[j * 3];
                linePos[lineIdx++] = pos[j * 3 + 1];
                linePos[lineIdx++] = pos[j * 3 + 2];

                if (lineCols) {
                    lineCols[colIdx++] = colList[i * 3];
                    lineCols[colIdx++] = colList[i * 3 + 1];
                    lineCols[colIdx++] = colList[i * 3 + 2];
                    lineCols[colIdx++] = colList[j * 3];
                    lineCols[colIdx++] = colList[j * 3 + 1];
                    lineCols[colIdx++] = colList[j * 3 + 2];
                }
            }
        }
    }

    if (coreRef.current) {
        coreRef.current.rotation.y -= delta * 0.5;
        coreRef.current.rotation.x += delta * 0.3;
        const mat = coreRef.current.material as THREE.MeshBasicMaterial;
        mat.color = coreColorRGB;
        const s = 1.5 + Math.sin(time * 3) * 0.2;
        coreRef.current.scale.set(s, s, s);
    }

    if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
    if (linesRef.current) {
        linesRef.current.geometry.setDrawRange(0, lineIdx / 3);
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        if (linesRef.current.geometry.attributes.color) {
            linesRef.current.geometry.attributes.color.needsUpdate = true;
        }
        (linesRef.current.material as THREE.LineBasicMaterial).opacity = 0.25 + Math.sin(time * 1.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Glowing Bright Core Representation */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial transparent opacity={0.5} wireframe blending={THREE.AdditiveBlending} />
      </mesh>

      <RealDataElements />

      {/* Incoming Document Chunks */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation />
      </points>

      {/* Connecting semantic links */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[connections, 3]} />
          <bufferAttribute attach="attributes-color" args={[new Float32Array(particleCount * particleCount * 6), 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
};

export const NeuralNetworkBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-transparent pointer-events-none">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#06b6d4" />
        <RAGNeuralBackground />
      </Canvas>
    </div>
  );
};
