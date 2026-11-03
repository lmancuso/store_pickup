# Store Pickup

App web conversacional para pedir comida y retirarla en el local (store pickup).
El usuario chatea con un asistente en una interfaz estilo mensajería (diseño
propio, sin marca ni assets de WhatsApp), el asistente detecta la categoría
(pizza, empanadas, hamburguesas, sushi, helado), muestra en un mapa
(Leaflet + OpenStreetMap) el vendedor más cercano y toma el pedido.

MVP **solo frontend** con datos mock. Idioma: español (Argentina).
Ver la iniciativa completa en [`requirements/store-pickup.md`](requirements/store-pickup.md).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript (`strict`)
- Tailwind CSS v4
- ESLint (`eslint-config-next`)
- Vitest + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) + jsdom
- Playwright (proyectos `mobile` 375px y `desktop`)
- GitHub Actions (`.github/workflows/ci.yml`)

## Requisitos

- Node.js 24 (LTS) y npm

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos con `tsc --noEmit` |
| `npm test` | Tests unitarios (Vitest, una corrida) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | Tests end-to-end (Playwright; hace build y levanta la app) |

La primera vez que corras los e2e instalá los browsers: `npx playwright install chromium`.

## Estructura de carpetas

```
.
├── .github/workflows/ci.yml   # CI: lint, typecheck, test, build, e2e
├── e2e/                       # Tests Playwright (no los toma Vitest)
├── requirements/              # Requerimientos de la iniciativa
└── src/
    ├── app/                   # Rutas App Router (layout, home)
    ├── components/
    │   ├── chat/              # UI del chat (burbujas, input, header)
    │   ├── map/               # Mapa Leaflet + OSM
    │   └── order/             # Menú, carrito y confirmación de retiro
    ├── data/                  # Datos mock: vendedores, menús, DEFAULT_LOCATION
    ├── lib/
    │   ├── intent/            # Detección de intención/categoría
    │   ├── geo/               # Geolocalización y distancias (haversine)
    │   ├── order/             # Lógica de pedido
    │   ├── conversation/      # Motor de conversación
    │   └── storage/           # Persistencia en el navegador
    └── types/                 # Tipos compartidos (Category, Vendor, ChatMessage…)
```

Alias de imports: `@/*` → `src/*`.

## Datos mock

`src/data/vendors.ts` contiene 15 vendedores ficticios en CABA (3 por categoría,
2 cerrados), cada uno con 4 ítems de menú y precios en ARS.
`src/data/location.ts` exporta `DEFAULT_LOCATION` (Obelisco: `-34.6037, -58.3816`).
