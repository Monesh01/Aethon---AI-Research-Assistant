"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

const BreezeShaderMaterial = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uBreezeStrength: { value: 0.05 },
    uBreezeSpeed: { value: 0.8 },
  },
  vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uBreezeStrength;
    uniform float uBreezeSpeed;

    // Simple noise function for more organic movement
    float noise(vec2 p) {
      return sin(p.x * 12.0 + p.y * 8.0 + uTime * 0.5) * 0.5 + 0.5;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Apply breeze more subtly to plants (bottom half)
      float plantFactor = pow(smoothstep(0.9, 0.1, uv.y), 1.5);
      
      // Multi-layered sine waves for "smaller", more complex breeze
      float wave1 = sin(pos.x * 4.0 + uTime * uBreezeSpeed * 1.2) * 0.03;
      float wave2 = sin(pos.y * 3.0 + uTime * uBreezeSpeed * 0.8) * 0.02;
      float drift = noise(pos.xy * 0.1) * 0.04;
      
      float totalOffset = (wave1 + wave2 + drift) * uBreezeStrength * plantFactor;
      
      pos.x += totalOffset;
      pos.y += totalOffset * 0.4;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    
    void main() {
      // Slight chromatic aberration on the edges of the breeze
      vec4 color = texture2D(tDiffuse, vUv);
      gl_FragColor = color;
    }
  `,
};

function BackgroundPlane({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(imageUrl);
  
  // Create a material that uses our custom shader
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(BreezeShaderMaterial.uniforms),
      vertexShader: BreezeShaderMaterial.vertexShader,
      fragmentShader: BreezeShaderMaterial.fragmentShader,
    });
  }, []);

  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      material.uniforms.tDiffuse.value = texture;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1.8, 1.8, 1]}>
      <planeGeometry args={[16, 9, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function FloatingParticles({ count = 2000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        // Spread particles across the screen space
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
        
        // Initial velocities for realistic drift
        velocities[i * 3] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        
        sizes[i] = Math.random() * 0.05 + 0.02;
    }
    return { positions, velocities, sizes };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    const mouse = state.mouse;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Turbulence noise
        const turbulence = Math.sin(time * 0.4 + pos[i3] * 0.2) * 0.003;
        
        // Update positions with velocities and wind/turbulence
        pos[i3] += particles.velocities[i3] + turbulence + (mouse.x * 0.002); // Subtle parallax
        pos[i3+1] += particles.velocities[i3+1] + turbulence + (mouse.y * 0.002);
        pos[i3+2] += particles.velocities[i3+2];
        
        // Wrap around logic for infinite loop
        if (pos[i3] > 15) pos[i3] = -15;
        if (pos[i3] < -15) pos[i3] = 15;
        if (pos[i3+1] > 10) pos[i3+1] = -10;
        if (pos[i3+1] < -10) pos[i3+1] = 10;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#a0c4ff"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

export const MotionBackground = () => {
    // Try to load bg.png (if user saved it), fallback to a high-quality nebula/field asset
    const [imageUrl, setImageUrl] = React.useState("/bg.png");

    React.useEffect(() => {
        const img = new Image();
        img.src = imageUrl;
        img.onerror = () => {
            // Fallback to a stunning high-quality nebula & field placeholder matching user's aesthetic
            setImageUrl("https://images.unsplash.com/photo-1464802686167-b939a67e06a1?auto=format&fit=crop&q=80&w=3540");
        };
    }, [imageUrl]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <React.Suspense fallback={null}>
                    <BackgroundPlane imageUrl={imageUrl} />
                    <FloatingParticles count={1500} />
                </React.Suspense>
                
                {/* Visual Enhancements */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#4cc9f0" />
            </Canvas>

            {/* Cinematic Overlays from original CinematicBackground */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
                }}
            />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        </div>
    );
};
