import { useEffect, useRef, useCallback } from 'react';
import type { ViewBox } from './useViewBox';

interface UsePanZoomOptions {
  enabled: { pan?: boolean; wheel?: boolean; pinch?: boolean };
  zoomStep: number;
  fullW: number;
  fullH: number;
  zoomAt: (clientX: number, clientY: number, rect: DOMRect, factor: number) => void;
  getViewBox: () => ViewBox;
  setViewBox: (vb: ViewBox) => void;
}

export function usePanZoom({
  enabled,
  zoomStep,
  fullW,
  fullH,
  zoomAt,
  getViewBox,
  setViewBox,
}: UsePanZoomOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTouchesRef = useRef<{ x: number; y: number }[] | null>(null);

  // Mouse drag pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled.pan) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      draggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - lastPosRef.current.x) / rect.width) * getViewBox().w;
      const dy = ((e.clientY - lastPosRef.current.y) / rect.height) * getViewBox().h;
      const vb = getViewBox();
      setViewBox({ x: vb.x - dx, y: vb.y - dy, w: vb.w, h: vb.h });
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = () => {
      draggingRef.current = false;
      el.style.cursor = 'grab';
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled.pan, fullW, fullH, getViewBox, setViewBox]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled.wheel) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? zoomStep : 1 / zoomStep;
      zoomAt(e.clientX, e.clientY, el.getBoundingClientRect(), factor);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enabled.wheel, zoomStep, zoomAt]);

  // Touch pan & pinch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && enabled.pan) {
        lastTouchesRef.current = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
        ];
      } else if (e.touches.length === 2 && enabled.pinch) {
        lastTouchesRef.current = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY },
        ];
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!lastTouchesRef.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 1 && lastTouchesRef.current.length === 1 && enabled.pan) {
        const dx =
          ((e.touches[0].clientX - lastTouchesRef.current[0].x) / rect.width) *
          getViewBox().w;
        const dy =
          ((e.touches[0].clientY - lastTouchesRef.current[0].y) / rect.height) *
          getViewBox().h;
        const vb = getViewBox();
        setViewBox({ x: vb.x - dx, y: vb.y - dy, w: vb.w, h: vb.h });
        lastTouchesRef.current = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
        ];
      } else if (e.touches.length === 2 && lastTouchesRef.current.length === 2 && enabled.pinch) {
        const prevDist = Math.hypot(
          lastTouchesRef.current[1].x - lastTouchesRef.current[0].x,
          lastTouchesRef.current[1].y - lastTouchesRef.current[0].y,
        );
        const curDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAt(cx, cy, rect, curDist / prevDist);
        lastTouchesRef.current = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY },
        ];
      }
    };

    const onEnd = () => {
      lastTouchesRef.current = null;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [enabled.pan, enabled.pinch, fullW, fullH, getViewBox, setViewBox, zoomAt]);

  const resetTouches = useCallback(() => {
    lastTouchesRef.current = null;
  }, []);

  return { containerRef, resetTouches };
}
