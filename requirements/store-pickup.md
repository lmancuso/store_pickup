# Iniciativa: Store Pickup conversacional

## Visión
Una app web (Next.js) donde el usuario pide comida conversando en un chat que
emula WhatsApp. Según lo que pida (un día pizza, otro empanadas, etc.), el
asistente identifica el tipo de vendedor, muestra en un mapa el vendedor más
cercano de ese tipo, toma el pedido y el usuario lo va a retirar al local
(store pickup).

## Usuario objetivo
Persona que quiere pedir comida para retirar, usando una interfaz familiar
(WhatsApp) en lugar de navegar catálogos.

## Flujo principal
1. El usuario abre la app y ve una pantalla tipo WhatsApp con un chat abierto
   con el asistente ("Store Pickup").
2. El usuario escribe lo que quiere, por ejemplo "quiero una pizza de muzzarella".
3. El asistente detecta la categoría (pizza) y responde en el chat.
4. Se activa un mapa con la ubicación del usuario y el vendedor de esa categoría
   más cercano resaltado (también se ven otros vendedores de la categoría).
5. El asistente propone el vendedor más cercano (nombre, distancia, tiempo
   estimado) y muestra su menú en el chat.
6. El usuario arma el pedido conversando y lo confirma.
7. El asistente confirma el pedido con un código de retiro y la dirección del
   local; el mapa muestra cómo llegar (ruta o link a navegación).
8. Otro día, si pide "empanadas", se activa otro tipo de vendedor.

## Requisitos funcionales
- **RF1 – Chat estilo WhatsApp:** burbujas enviadas y recibidas, hora, ticks
  de leído, indicador "escribiendo…", header con avatar y nombre, input con
  botón enviar, scroll automático. Mobile-first y responsive.
- **RF2 – Detección de intención/categoría:** a partir del mensaje del usuario
  se determina la categoría de vendedor (pizza, empanadas, hamburguesas, sushi,
  helado…). Si es ambiguo, el asistente pregunta.
- **RF3 – Geolocalización:** se obtiene la ubicación del usuario con la API del
  navegador; si la deniega, se usa una ubicación por defecto o se le pide que
  la elija en el mapa.
- **RF4 – Mapa:** se muestra la ubicación del usuario y los vendedores de la
  categoría detectada; el más cercano aparece resaltado. El mapa se activa o
  actualiza cuando cambia la categoría.
- **RF5 – Vendedor más cercano:** cálculo por distancia (haversine) entre el
  usuario y los vendedores abiertos de la categoría.
- **RF6 – Menú y pedido:** el chat muestra el menú del vendedor; el usuario
  agrega y quita ítems conversando o con botones rápidos, ve el total y confirma.
- **RF7 – Confirmación de retiro:** código de pedido, dirección, horario
  estimado de retiro y acceso a "cómo llegar".
- **RF8 – Historial:** la conversación persiste en el navegador entre recargas.

## Decisiones (confirmadas)
- **Solo frontend, MVP:** vendedores, menús y pedidos son datos mock
  (JSON/TS), sin backend real ni pagos.
- **Mapa:** Leaflet + OpenStreetMap (no necesita API key).
- **Detección de intención:** reglas o palabras clave en el MVP, detrás de una
  interfaz que permita cambiar luego a un LLM (por ejemplo, la API de Claude)
  sin tocar la UI.
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS; tests con
  Vitest + Testing Library y Playwright para el flujo principal.
- **Idioma:** español (Argentina).
- No se usa la marca, el logo ni los assets de WhatsApp: se emula el estilo de
  la conversación con un diseño propio.

## Fuera de alcance (MVP)
Pagos, cuentas de usuario, panel para vendedores, notificaciones push,
integración real con WhatsApp.

## Criterios de aceptación de la iniciativa
- Pedir "pizza" muestra en el mapa la pizzería más cercana resaltada y su menú
  en el chat; pedir "empanadas" cambia a vendedores de empanadas.
- Se puede completar un pedido de punta a punta y obtener un código de retiro.
- Funciona en mobile (375px) y desktop.
- `npm run build`, `npm run lint` y los tests pasan en CI.
