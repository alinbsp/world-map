import type { CSSProperties, ReactNode } from 'react';

export interface Country {
  code: string;
  name?: string;
  className?: string;
}

export interface Region {
  id: string;
  name: string;
  memberCodes: string[];
  viewBox?: { x: number; y: number; w: number; h: number };
}

export interface Catalog {
  countries: Country[];
  regions: Region[];
}

export interface CountryDatum {
  [key: string]: unknown;
}

export interface WorldMapClassNames {
  root?: string;
  svg?: string;
  controls?: string;
  controlButton?: string;
  zoomLabel?: string;
  tooltip?: string;
  country?: string;
  countryActive?: string;
}

export interface Interactions {
  pan?: boolean;
  wheel?: boolean;
  pinch?: boolean;
  keyboard?: boolean;
}

export interface TooltipContext {
  code: string;
  name: string;
  datum: CountryDatum | undefined;
  event: React.MouseEvent<SVGElement>;
}

export interface WorldMapProps {
  svgUrl: string;
  catalog: Catalog;
  data?: Record<string, CountryDatum>;
  getCountryClassName?: (code: string, datum: CountryDatum | undefined) => string;
  getCountryStyle?: (code: string, datum: CountryDatum | undefined) => CSSProperties;
  onCountryClick?: (code: string, datum: CountryDatum | undefined, event: React.MouseEvent<SVGElement>) => void;
  onCountryHover?: (code: string, datum: CountryDatum | undefined, event: React.MouseEvent<SVGElement>) => void;
  renderTooltip?: (ctx: TooltipContext) => ReactNode;
  classNames?: WorldMapClassNames;
  controls?: 'default' | 'none' | ReactNode;
  initialViewBox?: { x: number; y: number; w: number; h: number };
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  animationMs?: number;
  interactions?: Interactions;
}

export interface ZoomToOpts {
  animationMs?: number;
}

export interface WorldMapHandle {
  zoomToRegion: (regionId: string, opts?: ZoomToOpts) => void;
  zoomToCountry: (code: string, opts?: ZoomToOpts) => void;
  zoomToBox: (box: { x: number; y: number; w: number; h: number }, opts?: ZoomToOpts) => void;
  reset: (opts?: ZoomToOpts) => void;
  getViewBox: () => { x: number; y: number; w: number; h: number };
  setViewBox: (vb: { x: number; y: number; w: number; h: number }, opts?: ZoomToOpts) => void;
}
