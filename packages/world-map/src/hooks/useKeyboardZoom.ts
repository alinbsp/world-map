import { useEffect } from 'react';

interface UseKeyboardZoomOptions {
  enabled: boolean;
  zoomStep: number;
  zoomAtCenter: (factor: number) => void;
  resetView: () => void;
}

export function useKeyboardZoom({
  enabled,
  zoomStep,
  zoomAtCenter,
  resetView,
}: UseKeyboardZoomOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomAtCenter(zoomStep);
      } else if (e.key === '-') {
        e.preventDefault();
        zoomAtCenter(1 / zoomStep);
      } else if (e.key === '0') {
        e.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, zoomStep, zoomAtCenter, resetView]);
}
