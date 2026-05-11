import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type {
  TooltipContext,
  WorldMapHandle,
  WorldMapProps,
  ZoomToOpts,
} from './types';
import { useViewBox } from './hooks/useViewBox';
import { useSvgLoader } from './hooks/useSvgLoader';
import { usePanZoom } from './hooks/usePanZoom';
import { useKeyboardZoom } from './hooks/useKeyboardZoom';
import { useCountryDecorations } from './hooks/useCountryDecorations';
import { Controls } from './Controls';
import { Tooltip } from './Tooltip';

const FULL_W = 2000;
const FULL_H = 857;

export const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(function WorldMap(
  {
    svgUrl,
    catalog,
    data,
    getCountryClassName,
    getCountryStyle,
    onCountryClick,
    onCountryHover,
    renderTooltip,
    classNames,
    controls = 'default',
    initialViewBox,
    minZoom,
    maxZoom,
    zoomStep = 1.25,
    animationMs = 600,
    regionPadding = 0.2,
    interactions,
  },
  ref,
) {
  const interactionsDef = useMemo(
    () => ({
      pan: interactions?.pan ?? true,
      wheel: interactions?.wheel ?? true,
      pinch: interactions?.pinch ?? true,
      keyboard: interactions?.keyboard ?? true,
    }),
    [interactions],
  );

  const {
    viewBox,
    setViewBox,
    animateTo,
    zoomAt,
    fullW,
    fullH,
  } = useViewBox({
    fullW: FULL_W,
    fullH: FULL_H,
    initialViewBox,
    minW: minZoom,
    maxW: maxZoom,
    animationMs,
  });

  const { svgHtml, error, containerRef: svgLoaderRef } = useSvgLoader(svgUrl);

  const getViewBox = useCallback(() => viewBox, [viewBox]);

  const zoomAtCenter = useCallback(
    (factor: number) => {
      const el = panZoomRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, rect, factor);
    },
    [zoomAt],
  );

  const resetView = useCallback(() => {
    activeRegionRef.current = null;
    setActiveRegionCodes(new Set());
    animateTo({ x: 0, y: 0, w: fullW, h: fullH });
  }, [animateTo, fullW, fullH]);

  const computeViewBoxForCodes = useCallback(
    (codes: string[]): { x: number; y: number; w: number; h: number } | null => {
      const container = panZoomRef.current;
      if (!container) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let found = false;
      for (const code of codes) {
        const paths = container.querySelectorAll(`path[data-code="${code}"]`);
        for (const path of paths) {
          const bbox = (path as SVGPathElement).getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
          found = true;
        }
      }
      if (!found) return null;
      const w = maxX - minX;
      const h = maxY - minY;
      const padX = w * regionPadding;
      const padY = h * regionPadding;
      return { x: minX - padX, y: minY - padY, w: w + padX * 2, h: h + padY * 2 };
    },
    [regionPadding],
  );

  const { containerRef: panZoomRef } = usePanZoom({
    enabled: {
      pan: interactionsDef.pan,
      wheel: interactionsDef.wheel,
      pinch: interactionsDef.pinch,
    },
    zoomStep,
    fullW: FULL_W,
    fullH: FULL_H,
    zoomAt,
    getViewBox,
    setViewBox: (vb) => setViewBox(vb, false),
  });

  useKeyboardZoom({
    enabled: interactionsDef.keyboard,
    zoomStep,
    zoomAtCenter,
    resetView,
  });

  // Active region highlighting
  const [activeRegionCodes, setActiveRegionCodes] = useState<Set<string>>(new Set());
  const activeRegionRef = useRef<string | null>(null);

  useCountryDecorations({
    catalog,
    data,
    getCountryClassName,
    getCountryStyle,
    onCountryClick,
    onCountryHover,
    svgContainerRef: panZoomRef,
    activeCodes: activeRegionCodes,
    svgLoaded: !!svgHtml,
  });

  // Apply viewBox to SVG element
  useEffect(() => {
    const el = svgLoaderRef.current?.querySelector('svg');
    if (!el) return;
    el.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
  }, [viewBox, svgLoaderRef]);

  // Tooltip state
  const [tooltipCtx, setTooltipCtx] = useState<TooltipContext | null>(null);

  // Tooltip hover handling
  useEffect(() => {
    const container = panZoomRef.current;
    if (!container) return;

    const findPathTarget = (e: MouseEvent): SVGPathElement | null => {
      const target = e.target as Element | null;
      if (!target) return null;
      const path = target.closest('path[data-code]');
      return path as SVGPathElement | null;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const path = findPathTarget(e);
      if (!path) return;
      const code = path.getAttribute('data-code');
      if (!code) return;
      const datum = data?.[code];
      const country = catalog.countries.find((c) => c.code === code);
      const name = country?.name ?? country?.className ?? code;
      setTooltipCtx({
        code,
        name,
        datum,
        event: e as unknown as ReactMouseEvent<SVGElement>,
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      const path = findPathTarget(e);
      if (!path) return;
      const code = path.getAttribute('data-code');
      if (code) {
        setTooltipCtx(null);
      }
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [catalog, data, panZoomRef]);

  // Imperative API
  const zoomToCountry = useCallback(
    (code: string, opts?: ZoomToOpts) => {
      const country = catalog.countries.find((c) => c.code === code);
      if (!country) return;
      if (country.viewBox) {
        animateTo(country.viewBox, opts?.animationMs);
      } else {
        const vb = computeViewBoxForCodes([code]);
        if (vb) {
          animateTo(vb, opts?.animationMs);
        }
      }
    },
    [catalog, animateTo, computeViewBoxForCodes],
  );

  const zoomToRegion = useCallback(
    (regionId: string, opts?: ZoomToOpts) => {
      if (regionId === activeRegionRef.current) {
        activeRegionRef.current = null;
        setActiveRegionCodes(new Set());
        animateTo({ x: 0, y: 0, w: fullW, h: fullH }, opts?.animationMs);
        return;
      }
      const region = catalog.regions.find((r) => r.id === regionId);
      if (!region) return;
      activeRegionRef.current = regionId;
      setActiveRegionCodes(new Set(region.memberCodes));
      if (region.viewBox) {
        animateTo(region.viewBox, opts?.animationMs);
      } else {
        const vb = computeViewBoxForCodes(region.memberCodes);
        if (vb) {
          animateTo(vb, opts?.animationMs);
        }
      }
    },
    [catalog, animateTo, computeViewBoxForCodes, fullW, fullH],
  );

  const zoomToBox = useCallback(
    (box: { x: number; y: number; w: number; h: number }, opts?: ZoomToOpts) => {
      animateTo(box, opts?.animationMs);
    },
    [animateTo],
  );

  const reset = useCallback(
    (opts?: ZoomToOpts) => {
      activeRegionRef.current = null;
      setActiveRegionCodes(new Set());
      animateTo({ x: 0, y: 0, w: fullW, h: fullH }, opts?.animationMs);
    },
    [animateTo, fullW, fullH],
  );

  const getViewBoxHandle = useCallback(() => viewBox, [viewBox]);

  const setViewBoxHandle = useCallback(
    (vb: { x: number; y: number; w: number; h: number }, opts?: ZoomToOpts) => {
      if (opts?.animationMs !== undefined) {
        animateTo(vb, opts.animationMs);
      } else {
        setViewBox(vb, true);
      }
    },
    [animateTo, setViewBox],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomToRegion,
      zoomToCountry,
      zoomToBox,
      reset,
      getViewBox: getViewBoxHandle,
      setViewBox: setViewBoxHandle,
    }),
    [zoomToRegion, zoomToCountry, zoomToBox, reset, getViewBoxHandle, setViewBoxHandle],
  );

  const zoomLevel = useMemo(() => {
    return Math.round((fullW / viewBox.w) * 100) + '%';
  }, [fullW, viewBox.w]);

  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    cursor: 'grab',
    position: 'relative',
    userSelect: 'none',
  };

  if (error) {
    return <div style={{ color: 'red', padding: 20 }}>Failed to load map: {error.message}</div>;
  }

  return (
    <div
      ref={panZoomRef}
      className={classNames?.root}
      style={containerStyle}
    >
      <div
        ref={svgLoaderRef}
        style={{ width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
      />
      {controls === 'default' && (
        <Controls
          onZoomIn={() => zoomAtCenter(zoomStep)}
          onZoomOut={() => zoomAtCenter(1 / zoomStep)}
          onReset={resetView}
          classNames={classNames}
          zoomLevel={zoomLevel}
        />
      )}
      {controls !== 'default' && controls !== 'none' && controls}
      {tooltipCtx && renderTooltip !== null && (
        <Tooltip
          context={tooltipCtx}
          renderTooltip={renderTooltip}
          classNames={classNames}
        />
      )}
    </div>
  );
});
