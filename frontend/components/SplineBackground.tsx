"use client";

import Spline from '@splinetool/react-spline';
import React, { useState } from 'react';

export const SplineBackground = () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="fixed inset-0 z-0 w-full h-full bg-[#050510] overflow-hidden">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#050510]">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Premium Neural Network / Particles Parallax Spline Scene */}
            <div className="absolute inset-0 w-full h-full transform scale-[1.15]">
                <Spline 
                    scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
                    onLoad={() => setIsLoading(false)}
                />
            </div>
            
            {/* Cinematic Overlays to blend with the app dark theme */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(5,5,16,0.95) 100%)",
                }}
            />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        </div>
    );
};
