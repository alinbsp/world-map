# @world-map/core

Headless, themeable React world-map component with pan/zoom, tooltips and region focus.

## Features

- **Pan & Zoom**: Mouse drag, wheel zoom, touch pinch, keyboard shortcuts (`+`/`-`/`0`)
- **Headless Heatmap**: Host computes colors via `getCountryClassName` / `getCountryStyle` props
- **Imperative Ref API**: `zoomToRegion`, `zoomToCountry`, `zoomToBox`, `reset`
- **Custom Tooltips**: `renderTooltip` override or default tooltip
- **Full Theming**: Slot-based `classNames` prop for every visual element
- **SVG Loading**: Fetches and inlines SVG from URL; strips width/height automatically
- **Country Resolution**: Matches paths by `id`, `name`, or `class` attribute

## Install

```bash
npm install @world-map/core
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick Start

```tsx
import { WorldMap } from '@world-map/core';
import type { Catalog, CountryDatum } from '@world-map/core';

const catalog: Catalog = {
  countries: [
    { code: 'US', name: 'United States', className: 'United States' },
    { code: 'DE', name: 'Germany' },
    // ... more countries
  ],
  regions: [
    {
      id: 'nordics',
      name: 'Nordics',
      memberCodes: ['FI', 'SE', 'IS', 'Norway', 'Denmark'],
      viewBox: { x: 920, y: 10, w: 210, h: 160 },
    },
  ],
};

const data: Record<string, CountryDatum> = {
  US: { value: 95 },
  DE: { value: 70 },
};

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorldMap
        svgUrl="/world.svg"
        catalog={catalog}
        data={data}
        getCountryStyle={(code, datum) =>
          datum?.value ? { fill: datum.value > 80 ? '#22c55e' : '#eab308' } : {}
        }
      />
    </div>
  );
}
```

## API Reference

### `<WorldMap />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `svgUrl` | `string` | **required** | URL of the world SVG file |
| `catalog` | `Catalog` | **required** | `{ countries: Country[], regions: Region[] }` |
| `data` | `Record<string, CountryDatum>` | `{}` | Per-country data keyed by country code |
| `getCountryClassName` | `(code, datum) => string` | — | Returns CSS class for heatmap coloring |
| `getCountryStyle` | `(code, datum) => CSSProperties` | — | Returns inline styles for a country |
| `onCountryClick` | `(code, datum, event) => void` | — | Click handler |
| `onCountryHover` | `(code, datum, event) => void` | — | Hover handler |
| `renderTooltip` | `(ctx) => ReactNode` | default | Custom tooltip renderer; `null` disables |
| `classNames` | `WorldMapClassNames` | — | Slot classes: `root`, `svg`, `controls`, `tooltip`, etc. |
| `controls` | `'default' \| 'none' \| ReactNode` | `'default'` | Zoom controls |
| `initialViewBox` | `{x, y, w, h}` | full map | Initial viewport |
| `minZoom` | `number` | `fullW / 40` | Minimum viewBox width |
| `maxZoom` | `number` | `fullW * 3` | Maximum viewBox width |
| `zoomStep` | `number` | `1.25` | Wheel zoom multiplier |
| `animationMs` | `number` | `600` | Animation duration |
| `interactions` | `Interactions` | all enabled | Toggle pan/wheel/pinch/keyboard |

### Imperative Ref (`WorldMapHandle`)

```tsx
const ref = useRef<WorldMapHandle>(null);

ref.current?.zoomToRegion('nordics');
ref.current?.zoomToCountry('US');
ref.current?.zoomToBox({ x: 0, y: 0, w: 500, h: 300 });
ref.current?.reset();
const vb = ref.current?.getViewBox();
ref.current?.setViewBox({ x: 100, y: 50, w: 800, h: 400 });
```

### Types

```ts
interface Country {
  code: string;       // Unique identifier matching SVG path id/name/class
  name?: string;      // Display name (matches SVG `name` attribute)
  className?: string; // Fallback (matches SVG `class` attribute)
}

interface Region {
  id: string;
  name: string;
  memberCodes: string[];
  viewBox?: { x: number; y: number; w: number; h: number };
}

interface Catalog {
  countries: Country[];
  regions: Region[];
}
```

## Country Resolution

The component matches SVG `<path>` elements to catalog entries using three strategies (in order):

1. `path#${code}` — matches the `id` attribute (e.g., `id="US"`)
2. `path[name="${name}"]` — matches the `name` attribute (e.g., `name="Germany"`)
3. `path.${className}` — matches the `class` attribute (e.g., `class="Norway"`)

Your catalog must include whichever attribute the SVG uses for each country.

## Vendored / Drop-in Usage

Copy `dist/` into your project and import directly:

```tsx
import { WorldMap } from './vendor/world-map/index.js';
```

No build step required — the ESM output works in any modern bundler.

## Playground

```bash
npm install
npm run dev -w packages/world-map/example
```

## License

MIT
