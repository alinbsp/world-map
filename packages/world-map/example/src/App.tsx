import { useRef, useCallback, useState } from 'react';
import { WorldMap } from '@world-map/core';
import type { WorldMapHandle, CountryDatum, TooltipContext, Catalog } from '@world-map/core';
import { catalog } from './catalog';

const sampleData: Record<string, CountryDatum> = {
  US: { value: 95, label: 'United States' },
  CN: { value: 80, label: 'China' },
  DE: { value: 70, label: 'Germany' },
  GB: { value: 65, label: 'United Kingdom' },
  FR: { value: 60, label: 'France' },
  JP: { value: 75, label: 'Japan' },
  BR: { value: 50, label: 'Brazil' },
  IN: { value: 55, label: 'India' },
  AU: { value: 45, label: 'Australia' },
  CA: { value: 68, label: 'Canada' },
  FI: { value: 85, label: 'Finland' },
  SE: { value: 82, label: 'Sweden' },
  NO: { value: 88, label: 'Norway' },
  DK: { value: 78, label: 'Denmark' },
  IS: { value: 72, label: 'Iceland' },
  IT: { value: 58, label: 'Italy' },
  ES: { value: 52, label: 'Spain' },
  RU: { value: 40, label: 'Russian Federation' },
  MX: { value: 48, label: 'Mexico' },
  ZA: { value: 35, label: 'South Africa' },
};

function getHeatmapColor(value: number): string {
  if (value >= 80) return '#22c55e';
  if (value >= 60) return '#84cc16';
  if (value >= 40) return '#eab308';
  if (value >= 20) return '#f97316';
  return '#ef4444';
}

export function App() {
  const mapRef = useRef<WorldMapHandle>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const getCountryClassName = useCallback(
    (code: string, datum: CountryDatum | undefined) => {
      if (!datum?.value) return 'wm-country';
      const color = getHeatmapColor(datum.value as number);
      // We use inline style instead for heatmap; this class is for structure
      return 'wm-country';
    },
    [],
  );

  const getCountryStyle = useCallback(
    (code: string, datum: CountryDatum | undefined) => {
      if (!datum?.value) return {};
      const color = getHeatmapColor(datum.value as number);
      return { fill: color };
    },
    [],
  );

  const renderTooltip = useCallback((ctx: TooltipContext) => {
    const datum = ctx.datum;
    if (datum?.value !== undefined) {
      return (
        <span>
          <strong>{ctx.name}</strong> — Score: {datum.value as number}
        </span>
      );
    }
    return <span>{ctx.name}</span>;
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <button
          onClick={() => mapRef.current?.zoomToRegion('nordics')}
          style={regionBtnStyle}
        >
          Nordics
        </button>
        <button
          onClick={() => mapRef.current?.zoomToRegion('eu')}
          style={regionBtnStyle}
        >
          EU
        </button>
        <button
          onClick={() => mapRef.current?.reset()}
          style={regionBtnStyle}
        >
          Reset
        </button>
        {hoveredCode && (
          <span style={{ color: '#aaa', fontSize: 13, marginLeft: 12 }}>
            Hovered: {hoveredCode}
          </span>
        )}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <WorldMap
          ref={mapRef}
          svgUrl="/world.svg"
          catalog={catalog}
          data={sampleData}
          getCountryClassName={getCountryClassName}
          getCountryStyle={getCountryStyle}
          onCountryHover={(code) => setHoveredCode(code)}
          renderTooltip={renderTooltip}
        />
      </div>
    </div>
  );
}

const regionBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s',
};
