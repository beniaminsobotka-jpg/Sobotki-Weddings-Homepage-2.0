import React, { useEffect, useRef, useState } from 'react';
import type { LiquidVariant } from './liquidScene';

const fallbacks: Record<LiquidVariant, string> = {
  paper: 'radial-gradient(120% 80% at 15% 10%, #ece4cc 0%, transparent 55%), radial-gradient(90% 70% at 85% 90%, #dcdbd5 0%, transparent 60%), #F3F2ED',
  noir: 'radial-gradient(80% 60% at 80% 15%, rgba(255,0,0,0.14) 0%, transparent 60%), radial-gradient(90% 70% at 10% 90%, #140303 0%, transparent 65%), #030303',
};

/**
 * Fixed full-screen WebGL liquid field. three.js is loaded in its own chunk after
 * first paint; until then (or without WebGL) a static CSS gradient stands in.
 */
export const LiquidCanvas: React.FC<{ variant: LiquidVariant }> = ({ variant }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let handle: { dispose: () => void } | null = null;
    const win = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

    const load = async () => {
      try {
        const { createLiquidScene } = await import('./liquidScene');
        if (disposed || !canvasRef.current) return;
        handle = createLiquidScene(canvasRef.current, variant);
        setReady(true);
      } catch {
        // No WebGL: the CSS fallback stays.
      }
    };

    const idle = win.requestIdleCallback ? win.requestIdleCallback(load, { timeout: 1200 }) : window.setTimeout(load, 300);

    return () => {
      disposed = true;
      if (win.cancelIdleCallback) win.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      handle?.dispose();
      setReady(false);
    };
  }, [variant]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" style={{ background: fallbacks[variant] }} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="h-full w-full transition-opacity duration-1000"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
};
