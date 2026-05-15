"use client";

import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import * as THREE from "three";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const NeuralCore = () => {
  const modelRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (modelRef.current && materialRef.current) {
        // Timeline for whole scroll
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#scrollytelling-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        });

        tl.to(modelRef.current.position, { x: 2.5, duration: 1 }, 0);
        tl.to(modelRef.current.rotation, { y: Math.PI * 2, duration: 1, ease: "none" }, 0);

        // Color transitions matching steps
        // Slide 1: Ingestion (Blue)
        tl.to(materialRef.current.color, { r: 59/255, g: 130/255, b: 246/255, duration: 0.25 }, 0.25);
        tl.to(materialRef.current.emissive, { r: 59/255, g: 130/255, b: 246/255, duration: 0.25 }, 0.25);
        
        // Slide 2: Vectorization (Violet)
        tl.to(materialRef.current.color, { r: 139/255, g: 92/255, b: 246/255, duration: 0.25 }, 0.50);
        tl.to(materialRef.current.emissive, { r: 139/255, g: 92/255, b: 246/255, duration: 0.25 }, 0.50);

        // Slide 3: Agentic Logic (Emerald)
        tl.to(materialRef.current.color, { r: 16/255, g: 185/255, b: 129/255, duration: 0.25 }, 0.75);
        tl.to(materialRef.current.emissive, { r: 16/255, g: 185/255, b: 129/255, duration: 0.25 }, 0.75);
    }
  }, []);

  useFrame((state, delta) => {
    if (coreRef.current) {
        coreRef.current.rotation.y += delta * 0.2;
        coreRef.current.rotation.x += delta * 0.1;
    }
    if (ring1Ref.current) {
        ring1Ref.current.rotation.x += delta * 0.5;
        ring1Ref.current.rotation.y += delta * 0.3;
    }
    if (ring2Ref.current) {
        ring2Ref.current.rotation.x -= delta * 0.4;
        ring2Ref.current.rotation.z += delta * 0.6;
    }
  });

  return (
    <group ref={modelRef} scale={1.5} position={[0, 0, 0]}>
        {/* Core Icosahedron representation of Neural Node */}
        <mesh ref={coreRef}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial 
                ref={materialRef}
                color="#4f46e5" 
                wireframe 
                emissive="#4f46e5"
                emissiveIntensity={0.5}
            />
        </mesh>
        
        {/* Memory/Processing Rings */}
        <mesh ref={ring1Ref}>
            <torusGeometry args={[1.5, 0.02, 16, 100]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
        </mesh>

        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.02, 16, 100]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
        </mesh>
    </group>
  );
};

const Slide = ({ children, index }: { children: React.ReactNode; index: number }) => {
    const slideRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.fromTo(slideRef.current, {
            opacity: 0,
            y: 50,
        }, {
            opacity: 1,
            y: 0,
            scrollTrigger: {
                trigger: slideRef.current,
                start: "top center+=100",
                end: "bottom center-=100",
                toggleActions: "play reverse play reverse",
            }
        });
    }, []);

    return (
        <div ref={slideRef} className="h-screen flex items-center px-12 md:px-24">
            <div className="max-w-xl">
                {children}
            </div>
        </div>
    );
};

export const NeuralScrollytelling = () => {
  return (
    <div id="scrollytelling-container" className="relative h-[500vh]">
      {/* Fixed 3D Canvas */}
      <div className="sticky top-0 h-screen w-full pointer-events-none">
        <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true }} style={{ background: 'transparent' }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#4f46e5" />
          <pointLight position={[0, 5, 5]} intensity={0.5} color="#8b5cf6" />
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <NeuralCore />
            </Float>
            <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Content Layers */}
      <div className="relative z-10">
        <Slide index={0}>
          <h2 className="text-6xl font-black text-white mb-6 drop-shadow-sm">Advanced <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Ingestion</span></h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Upload PDFs to instantly extract markdown text, semantic tables, and perform vision-based image captioning with Gemini 3.1 Flash.
          </p>
        </Slide>
        
        <Slide index={1}>
          <h2 className="text-6xl font-black text-white mb-6">Semantic <span className="text-violet-600">Vectorization</span></h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Extracted document chunks are transformed into powerful Gemini embeddings and indexed locally via ChromaDB for instantaneous, high-dimensional retrieval.
          </p>
        </Slide>

        <Slide index={2}>
          <h2 className="text-6xl font-black text-white mb-6">Cognitive <span className="text-emerald-500">Routing</span></h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            LangGraph orchestrates autonomous Multi agentic intelligence to analyze intent, trigger memory rerankers, and dynamically structure the final response.
          </p>
        </Slide>

        <Slide index={3}>
          <h2 className="text-6xl font-black text-white mb-6">Multi-modal <span className="text-amber-500">Synthesis</span></h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            The generated insights are presented perfectly parsed in markdown, dynamically drawn as 3D Mermaid architecture, or voiced using real-time text-to-speech.
          </p>
        </Slide>

        <div className="h-screen flex flex-col items-center justify-center text-center px-12 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/80 pointer-events-none" />
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                className="z-10 p-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.3)] mb-8"
             >
                <div className="bg-[#0a0a0a] px-8 py-4 rounded-[14px]">
                    <span className="text-white font-black text-2xl tracking-tighter uppercase italic">Scroll Done</span>
                </div>
             </motion.div>
             <h3 className="text-4xl font-black text-white mb-4 relative z-10">Exploration Complete</h3>
             <p className="text-slate-400 font-medium max-w-md relative z-10">
                You've reached the end of the neural pipeline. Continue down for detailed feature specifications.
             </p>
             <div className="mt-12 flex flex-col items-center gap-3 animate-bounce relative z-10">
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">For more info</span>
                 <div className="w-0.5 h-8 bg-blue-500" />
             </div>
        </div>
      </div>
    </div>
  );
};
