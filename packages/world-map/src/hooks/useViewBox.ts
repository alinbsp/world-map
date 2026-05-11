import { useCallback, useRef, useState } from 'react';

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseViewBoxOptions {
  fullW: number;
  fullH: number;
  initialViewBox?: ViewBox;
  minW?: number;
  maxW?: number;
  animationMs?: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useViewBox({
  fullW,
  fullH,
  initialViewBox,
  minW,
  maxW,
  animationMs = 600,
}: UseViewBoxOptions) {
  const defaultVb: ViewBox = initialViewBox ?? { x: 0, y: 0, w: fullW, h: fullH };
  const [viewBox, setViewBox] = useState<ViewBox>(defaultVb);
  const animFrameRef = useRef<number | null>(null);
  const vbRef = useRef<ViewBox>(defaultVb);
  vbRef.current = viewBox;

  const clampViewBox = useCallback(
    (vb: ViewBox): ViewBox => {
      const effectiveMinW = minW ?? fullW / 40;
      const effectiveMaxW = maxW ?? fullW * 3;
      const clampedW = Math.min(effectiveMaxW, Math.max(effectiveMinW, vb.w));
      const aspect = fullH / fullW;
      const clampedH = clampedW * aspect;

      let { x, y } = vb;
      if (clampedW <= fullW) {
        if (x < 0) x = 0;
        if (x + clampedW > fullW) x = fullW - clampedW;
      } else {
        x = (fullW - clampedW) / 2;
      }
      if (clampedH <= fullH) {
        if (y < 0) y = 0;
        if (y + clampedH > fullH) y = fullH - clampedH;
      } else {
        y = (fullH - clampedH) / 2;
      }
      return { x, y, w: clampedW, h: clampedH };
    },
    [fullW, fullH, minW, maxW],
  );

  const animateTo = useCallback(
    (target: ViewBox, duration?: number) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      const start = { ...vbRef.current };
      const clampedTarget = clampViewBox(target);
      const dur = duration ?? animationMs;
      const startTime = performance.now();

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - startTime) / dur, 1);
        const eased = easeInOutCubic(progress);

        const next: ViewBox = {
          x: start.x + (clampedTarget.x - start.x) * eased,
          y: start.y + (clampedTarget.y - start.y) * eased,
          w: start.w + (clampedTarget.w - start.w) * eased,
          h: start.h + (clampedTarget.h - start.h) * eased,
        };
        setViewBox(next);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    },
    [clampViewBox, animationMs],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, rect: DOMRect, factor: number) => {
      const current = vbRef.current;
      const sx = current.x + ((clientX - rect.left) / rect.width) * current.w;
      const sy = current.y + ((clientY - rect.top) / rect.height) * current.h;

      const effectiveMinW = minW ?? fullW / 40;
      const effectiveMaxW = maxW ?? fullW * 3;
      const aspect = fullH / fullW;
      const newW = Math.min(effectiveMaxW, Math.max(effectiveMinW, current.w / factor));
      const newH = newW * aspect;

      const next: ViewBox = {
        x: sx - (sx - current.x) * (newW / current.w),
        y: sy - (sy - current.y) * (newH / current.h),
        w: newW,
        h: newH,
      };
      setViewBox(clampViewBox(next));
    },
    [fullW, fullH, minW, maxW, clampViewBox],
  );

  const setViewBoxDirect = useCallback(
    (vb: ViewBox, animate?: boolean, duration?: number) => {
      const clamped = clampViewBox(vb);
      if (animate) {
        animateTo(clamped, duration);
      } else {
        setViewBox(clamped);
      }
    },
    [clampViewBox, animateTo],
  );

  return {
    viewBox,
    setViewBox: setViewBoxDirect,
    animateTo,
    zoomAt,
    clampViewBox,
    fullW,
    fullH,
  };
}
