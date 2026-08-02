# Atlas

Interactive globe travel-planning UI built with Next.js, Mapbox GL JS, and Tailwind CSS.

Country-to-country route selection is implemented now. The AI travel-agent workflow will plug in later from the Continue action.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
cp .env.example .env.local
```

3. Add your Mapbox public access token:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

Create a token at [Mapbox account tokens](https://account.mapbox.com/access-tokens/).

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Country boundary data

Country polygons are loaded from:

`public/data/countries.geojson`

This file is Natural Earth Admin 0 countries at 1:110m scale, sourced from:

[natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)

`ne_110m_admin_0_countries.geojson`

Each feature uses `ADM0_A3` as its ISO-style id for Mapbox `feature-state`, and `LABEL_X` / `LABEL_Y` (when present) as representative route endpoints.

## Scripts

- `npm run dev` — start the local app
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Project structure

```text
src/
  app/                  # App Router pages and global styles
  components/
    TravelGlobe.tsx     # Mapbox globe, hover/click, route + markers
    CountryTooltip.tsx
    RouteSelectionPanel.tsx
    GlobeControls.tsx
  lib/map/
    countryData.ts      # GeoJSON loading and country helpers
    routeGeometry.ts    # Great-circle path + antimeridian unwrap
    mapHelpers.ts       # Layers, markers, camera framing
  types/travel.ts
public/data/
  countries.geojson
```
