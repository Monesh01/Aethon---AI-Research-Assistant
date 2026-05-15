"use client";

import React from "react";

export const CinematicBackground = () => {
    return (
        <div
            className="fixed inset-0 z-0 overflow-hidden bg-black"
            style={{ contain: "strict" }}
        >
            {/* Lovable cinematic video — cropped to remove cyclist, sharp & realistic */}
            <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    objectPosition: "center 0%",
                    transform: "scale(1.8)",
                    /* Sharp, realistic rendering — no blur at all */
                    filter: "contrast(1.1) saturate(1.2) brightness(1.02)",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transformOrigin: "center top",
                }}
            />

            {/* Subtle cinematic vignette — very light to keep realism */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
                }}
            />

            {/* Top navbar fade — very subtle */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent z-20 pointer-events-none" />

            {/* Bottom page fade into dark site bg */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        </div>
    );
};
