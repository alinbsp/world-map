import { useEffect, useRef, useState } from 'react';

export function useSvgLoader(svgUrl: string) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(svgUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        // Strip width/height, force preserveAspectRatio
        const cleaned = text
          .replace(/\s*width\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s*height\s*=\s*["'][^"']*["']/gi, '')
          .replace(/<svg([^>]*)>/i, (match, attrs: string) => {
            if (/preserveAspectRatio/i.test(attrs)) {
              return match.replace(
                /preserveAspectRatio\s*=\s*["'][^"']*["']/i,
                'preserveAspectRatio="xMidYMid meet"',
              );
            }
            return match.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
          });
        setSvgHtml(cleaned);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err.name === 'AbortError') return;
        setError(err);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [svgUrl]);

  return { svgHtml, error, containerRef };
}
