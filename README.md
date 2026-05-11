# World Map

Interactive SVG world map component for React.

## Overview

This workspace contains a reusable, themeable, headless React + TypeScript component (`@world-map/core`) for displaying an interactive SVG world map with pan, zoom, tooltips, and region focus.

## Structure

| Path | Description |
|------|-------------|
| `packages/world-map/` | The React component library |
| `packages/world-map/example/` | Vite playground app |
| `world-map.html` | Original standalone HTML reference (kept for comparison) |
| `world.svg` | Standalone SVG world map asset |

## Quick Start

```bash
npm install
npm run build          # Build the library
npm run dev -w packages/world-map/example  # Run the playground
```

## Library: @world-map/core

See [`packages/world-map/README.md`](packages/world-map/README.md) for full API documentation.

### Key Features

- **Pan & Zoom**: Mouse drag, wheel zoom, touch pinch, keyboard shortcuts
- **Headless Heatmap**: Host computes colors via props; component renders
- **Imperative Ref API**: Zoom to regions, countries, or arbitrary boxes
- **Custom Tooltips**: Override or disable the default tooltip
- **Full Theming**: Slot-based className props for every visual element
- **SVG Loading**: Fetches and inlines SVG from a URL prop

### Example

```tsx
import { WorldMap } from '@world-map/core';

<WorldMap
  svgUrl="/world.svg"
  catalog={catalog}
  data={data}
  getCountryStyle={(code, datum) => ({
    fill: datum?.value > 80 ? '#22c55e' : '#eab308',
  })}
/>
```

## Development

```bash
# Install dependencies
npm install

# Build the library (produces dist/index.{js,cjs,d.ts})
npm run build -w packages/world-map

# Run the example playground
npm run dev -w packages/world-map/example
```

## License

MIT — Copyright 2026 Alin Iacob
