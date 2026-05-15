"use client";

import { useEffect } from "react";

export function ClientPrerequisites() {
  useEffect(() => {
    // Suppress Three.js deprecation warnings (e.g., THREE.Clock vs THREE.Timer)
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && (args[0].includes('THREE.Clock') || args[0].includes('THREE.Timer'))) {
        return;
      }
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
