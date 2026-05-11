import { useEffect, useRef, useCallback } from 'react';
import type { Catalog, CountryDatum } from '../types';

interface UseCountryDecorationsOptions {
  catalog: Catalog;
  data?: Record<string, CountryDatum>;
  getCountryClassName?: (code: string, datum: CountryDatum | undefined) => string;
  getCountryStyle?: (code: string, datum: CountryDatum | undefined) => React.CSSProperties;
  onCountryClick?: (code: string, datum: CountryDatum | undefined, event: React.MouseEvent<SVGElement>) => void;
  onCountryHover?: (code: string, datum: CountryDatum | undefined, event: React.MouseEvent<SVGElement>) => void;
  svgContainerRef: React.RefObject<HTMLDivElement | null>;
  activeCodes?: Set<string>;
  svgLoaded?: boolean;
}

function resolveCountryCode(
  el: SVGPathElement,
  catalog: Catalog,
): string | null {
  // Prefer id match
  const id = el.getAttribute('id');
  if (id) {
    const found = catalog.countries.find((c) => c.code === id);
    if (found) return found.code;
  }

  // Then name match
  const name = el.getAttribute('name');
  if (name) {
    const found = catalog.countries.find((c) => c.name === name);
    if (found) return found.code;
  }

  // Then class match
  const cls = el.getAttribute('class');
  if (cls) {
    const found = catalog.countries.find((c) => c.className === cls);
    if (found) return found.code;
  }

  return null;
}

export function useCountryDecorations({
  catalog,
  data,
  getCountryClassName,
  getCountryStyle,
  onCountryClick,
  onCountryHover,
  svgContainerRef,
  activeCodes,
  svgLoaded,
}: UseCountryDecorationsOptions) {
  const hoverRef = useRef<string | null>(null);
  const clickHandlerRef = useRef(onCountryClick);
  const hoverHandlerRef = useRef(onCountryHover);
  clickHandlerRef.current = onCountryClick;
  hoverHandlerRef.current = onCountryHover;

  const decorate = useCallback(() => {
    const container = svgContainerRef.current;
    if (!container) return;
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    const paths = svgEl.querySelectorAll('path');
    const dataMap = data ?? {};

    // Build a lookup from code to element for event delegation
    paths.forEach((path) => {
      const el = path as SVGPathElement;
      let code = el.getAttribute('data-code');
      if (!code) {
        code = resolveCountryCode(el, catalog);
        if (!code) return;
        el.setAttribute('data-code', code);
      }
      const datum = dataMap[code];

      // Apply className
      if (getCountryClassName) {
        const cls = getCountryClassName(code, datum);
        if (cls) {
          // Preserve existing classes, add new one
          const existing = el.getAttribute('class') || '';
          const parts = existing.split(/\s+/).filter(Boolean);
          // Remove any previously added decoration classes
          const cleaned = parts.filter((p) => !p.startsWith('wm-'));
          el.setAttribute('class', [...cleaned, cls].join(' '));
        }
      }

      // Apply inline style
      if (getCountryStyle) {
        const style = getCountryStyle(code, datum);
        if (style) {
          Object.assign(el.style, style);
        }
      }

      // Apply active region highlight
      const currentCls = el.getAttribute('class') || '';
      const parts = currentCls.split(/\s+/).filter(Boolean);
      const withoutActive = parts.filter((p) => p !== 'wm-active');
      if (activeCodes?.has(code)) {
        withoutActive.push('wm-active');
      }
      el.setAttribute('class', withoutActive.join(' '));
    });
  }, [catalog, data, getCountryClassName, getCountryStyle, svgContainerRef, activeCodes, svgLoaded]);

  // Re-run decoration when dependencies change
  useEffect(() => {
    decorate();
  }, [decorate]);

  // Event delegation via container
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    const findPathTarget = (e: MouseEvent): SVGPathElement | null => {
      const target = e.target as Element | null;
      if (!target) return null;
      const path = target.closest('path[data-code]');
      return path as SVGPathElement | null;
    };

    const handleClick = (e: MouseEvent) => {
      const path = findPathTarget(e);
      if (!path) return;
      const code = path.getAttribute('data-code');
      if (!code || !clickHandlerRef.current) return;
      const datum = data?.[code];
      // Create a synthetic React-like event
      const reactEvent = e as unknown as React.MouseEvent<SVGElement>;
      clickHandlerRef.current(code, datum, reactEvent);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const path = findPathTarget(e);
      if (!path) return;
      const code = path.getAttribute('data-code');
      if (!code || !hoverHandlerRef.current) return;
      const datum = data?.[code];
      hoverRef.current = code;
      const reactEvent = e as unknown as React.MouseEvent<SVGElement>;
      hoverHandlerRef.current(code, datum, reactEvent);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const path = findPathTarget(e);
      if (!path) return;
      const code = path.getAttribute('data-code');
      if (code === hoverRef.current) {
        hoverRef.current = null;
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [svgContainerRef, data]);

  return { hoverRef };
}
