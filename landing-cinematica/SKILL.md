---
name: landing-cinematica
description: Crea landings animadas por scroll con GSAP, ScrollTrigger y Lenis, en dos estilos — "producto / startup" (oscuro, fondo WebGL, tarjetas que se ensamblan, secciones fijadas con zoom de manifiesto o secuencia de imágenes) o "recorrido cinematográfico" (un escenario fijo donde un video o fotogramas avanzan y retroceden con el scroll mientras pasan las paradas de texto). Úsala cuando pidan una landing, página de lanzamiento, página de producto, sitio de una sola página con animaciones de scroll, o storytelling visual de un lugar, desarrollo inmobiliario, obra, destino o proyecto.
---

# Landing cinematográfica (GSAP + ScrollTrigger + Lenis)

Esta skill construye landings de una sola página donde el scroll es la narrativa. Tiene dos
estilos con la misma base técnica. Plantillas sin build en `assets/`, detalle en `references/`.

## 0. Antes de escribir código: pregunta

No empieces a construir sin estas respuestas. Hazlas en un solo mensaje, cortas, y ofrece
valores por defecto para que el usuario pueda contestar "lo que recomiendes".

**Si el pedido ya trae lo esencial** (estilo o tipo de negocio, secciones, idioma y qué
material hay), no frenes el trabajo para preguntar lo demás: usa los valores por defecto de
abajo y **enlista al final cada decisión que tomaste** para que el usuario las corrija.

| Falta | Valor por defecto |
|---|---|
| Paleta | Producto: fondo oscuro + 1 acento saturado + 1 secundario. Recorrido: fondo claro natural + texto grafito + 1 acento cálido. Comprueba AA (texto ≥ 4.5:1; texto del botón sobre el acento también). |
| Tipografía | Producto: Inter. Recorrido: Fraunces (titulares) + Manrope (texto). |
| Destino técnico | HTML estático con las plantillas de `assets/`. |
| Backend del formulario | Modo demo (`data-endpoint=""`): valida y muestra éxito sin enviar; se declara en la entrega. |
| Dirección, horarios, precios, regiones, cifras | `[PENDIENTE: …]` visible en el texto, nunca inventados. |
| Enlace de mapa sin dirección | Búsqueda de la ciudad en Google Maps + `[PENDIENTE: dirección]` en el botón. |
| Imágenes | `scripts/placeholders.py` (genera webp + jpg a 1920 y 960 px). |

### Proyecto ficticio o demo

Cuando el usuario dice que el negocio es ficticio o pide contenido "de ejemplo":
- `<meta name="robots" content="noindex">` y en el pie "Proyecto ficticio de demostración".
- **Testimonios de ejemplo**: solo si los pide explícitamente. Cada tarjeta lleva una
  etiqueta visible "Ejemplo" (`.tag`), hay una nota bajo el título ("Testimonios de ejemplo
  para mostrar el diseño. No son personas reales.") y el autor es genérico ("Estudiante de
  ejemplo · Ingeniería"), nunca un nombre propio inventado. Sin fotos de personas.
- Aun así, nada de cifras, premios, logos de clientes ni datos de contacto inventados.

1. **Estilo** (recomienda uno según su caso, ver tabla abajo):
   - **Producto / startup** — app, SaaS, hardware, lanzamiento, lista de espera.
   - **Recorrido cinematográfico** — un lugar o una cosa física que "se recorre": desarrollo
     inmobiliario, hotel, restaurante, obra, destino, museo, un producto que se arma.
2. **Material visual**: ¿tiene imágenes y/o videos? ¿cuántos, de qué resolución, en qué
   orden? Para el recorrido: ¿los clips están encadenados (último cuadro de uno = primer
   cuadro del siguiente)? Si no tiene nada, se arranca con placeholders de color y se
   deja la lista de archivos que faltan.
3. **Textos**: titular, subtítulo, secciones, llamada a la acción principal y secundaria,
   y a dónde lleva cada botón. Si no los tiene, propón una estructura y marca los textos
   como `[PENDIENTE]`. Nunca inventes cifras, clientes, testimonios ni logos.
4. **Paleta y tipografía**: colores de marca (hex) y fuentes. Si no hay, propón 1 fondo,
   1 texto, 1 texto secundario, 1 acento y una pareja display + texto.
5. **Idioma(s)**: uno o dos (¿cambio de idioma sin recargar?).
6. **Destino técnico**: HTML estático sin build (plantillas de `assets/`) o un framework
   (Astro, Next, Vite). Hosting (Netlify, Vercel, otro).

| Señal en el pedido | Recomienda |
|---|---|
| "app", "SaaS", "beta", "waitlist", "descarga", métricas, equipo | Producto / startup |
| un lugar, edificio, espacio, viaje, "que se sienta como entrar" | Recorrido |
| tiene clips encadenados o renders de una cámara que avanza | Recorrido |
| solo tiene capturas de pantalla y textos | Producto |
| quiere "algo tipo Apple" con un objeto que gira o se arma | Producto (secuencia) o Recorrido (si es un espacio) |

Después de elegir, **lee la referencia del estilo** antes de construir:
- `references/estilo-producto.md`
- `references/estilo-recorrido.md`

Y para la parte técnica común:
- `references/gsap-lenis-setup.md` — setup, sincronización, patrones de ScrollTrigger.
- `references/rendimiento-movil.md` — presupuesto, video, imágenes, iOS/Android.

Para arrancar, copia la plantilla del estilo (`assets/estilo-producto/` o
`assets/estilo-recorrido/`) y reemplaza los placeholders. Funcionan abriendo `index.html`
con cualquier servidor estático (`python3 -m http.server`). No abras con `file://` si hay
video: algunos navegadores no permiten `fetch` ni seek fiable desde disco.

Qué trae cada plantilla (adapta, no tienes que usar todo):
- **Producto**: hero, bento "qué es", manifiesto fijado (`.statement`, puede ir dentro de
  otra sección: se busca por clase), filas de funciones, testimonios (`[data-flip-row]`,
  giro 3D), lista de espera con formulario (validación, `aria-live`, modo demo o
  `data-endpoint`), pie. Para "problema" usa el manifiesto + dos columnas que convergen
  (`gsap-lenis-setup.md` §5).
- **Recorrido**: 4 paradas (la última fijada con secuencia por bandas `[data-pin-step]`),
  lema, detalles, FAQ, contacto. Para cambiar el número de paradas sigue el comentario
  "PARA CAMBIAR EL NÚMERO DE PARADAS" del `index.html` (4 lugares que deben sumar N).

Herramientas en `scripts/`:
- `placeholders.py <carpeta> "Nombre 1" "Nombre 2" …` — fotogramas de placeholder 16:9 con
  el sujeto a la derecha (lado opuesto al texto), en webp + jpg, 1920 y 960 px.
- `verificar.cjs <url> [--libs DIR] [--reduced] [--nojs]` — Playwright: baja y sube a 1440 y
  375 px, reporta consola, peticiones fallidas, desborde horizontal y si llegó/regresó, y
  guarda capturas. **Revisa las capturas**: el script no ve problemas de diseño.

Antes de tareas grandes da un plan corto. Al terminar cada paso, di cómo verificarlo.

## 1. Base común

### 1.1 Estructura de archivos (sin build)

```
index.html      un solo documento, secciones en orden de lectura
styles.css      tokens en :root + componentes; nada de colores sueltos
main.js         Lenis + GSAP + módulos por sección, en funciones init*
assets/img/     imágenes (webp + jpg de respaldo)
assets/video/   clips (mp4 H.264, versión escritorio y móvil)
```

Con framework, la misma idea: un archivo de datos (textos, URLs, rutas de medios), un
archivo de tokens CSS, componentes por sección y un `motion` que inicializa todo.

Reglas:
- **Colores y tipografías solo como tokens** (`--color-*`, `--font-*`, `--ease-*`) en
  `:root`. Los componentes usan variables, nunca hex sueltos.
- **Textos y configuración en un solo lugar** (atributos `data-*` o un objeto de datos).
  URLs de botones, número de WhatsApp, correo: una sola constante.
- Cada sección es un `<section id>` con un rol claro. Los anclas del menú apuntan a ids.
- El contenido debe **verse sin JS**: los estados iniciales ocultos van bajo `.js`
  (clase que agrega un script inline en `<head>`), nunca en el CSS base.

### 1.2 Setup de GSAP + ScrollTrigger + Lenis

Esto va igual en los dos estilos (detalle y variantes en `references/gsap-lenis-setup.md`):

```js
gsap.registerPlugin(ScrollTrigger);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
```

- **Un solo reloj**: Lenis avanza desde `gsap.ticker`, nunca con su propio rAF además.
- Lenis anima el scroll real de la ventana: `window.scrollY`, `position: sticky` e
  IntersectionObserver siguen funcionando. No uses wrappers con `transform`.
- Con `prefers-reduced-motion` no se crea Lenis: scroll nativo.
- CSS obligatorio de Lenis (`html.lenis { height:auto }`, etc.) — está en las plantillas.
- **Lo que no es animación no depende de GSAP**: menú móvil, formularios, año del pie y
  acordeones se inicializan *antes* de comprobar si cargaron las librerías. Si el CDN falla,
  la página debe seguir siendo usable, no solo legible.
- Si el CDN está bloqueado (sandbox, red corporativa) o quieres no depender de él en
  producción: copia las librerías a `vendor/` (ver `references/gsap-lenis-setup.md` §1).
- Si algo cambia la altura de la página (idioma, acordeón, imágenes que cargan sin
  dimensiones): `lenis.resize(); ScrollTrigger.refresh();`.

### 1.3 Patrones de animación permitidos

| Necesidad | Patrón |
|---|---|
| Entrada simple de un bloque | IntersectionObserver agrega `.is-in`; transición CSS. Una vez. |
| Entrada ligada al scroll (reversible) | `gsap.fromTo(el, from, { ..., scrollTrigger: { trigger, start, end, scrub: 0.6 } })` |
| Coreografía de varias piezas | `gsap.timeline({ scrollTrigger: { ..., scrub } })` con posiciones `0, 0.12, 0.24…` |
| Sección fijada con secuencia | sección alta (`min-height: 250dvh`) + hijo `position: sticky; top:0; height:100dvh` + `ScrollTrigger` con `onUpdate(self.progress)` que calcula bandas |
| Header que cambia al bajar | `ScrollTrigger.create({ start: 'top -50', end: 99999, toggleClass: {...} })` |
| Progreso / raíl | IntersectionObserver con `rootMargin: '-45% 0px -45% 0px'` |

Preferencias:
- Fija con **`position: sticky`** en CSS antes que con `pin: true` de GSAP: no mete
  espaciadores, no salta en iOS y funciona sin JS.
- Anima **solo `opacity` y `transform`** en todo lo que dependa del scroll. `filter: blur`
  solo en entradas puntuales (una vez), nunca en loops ni en decenas de elementos.
- `scrub: true` para cosas que deben ir pegadas al dedo (video, progreso); `scrub: 0.6–1.3`
  para entradas con un poco de inercia; >2 solo para efectos decorativos lentos.
- Todo lo ligado a scroll debe funcionar **hacia adelante y hacia atrás**. Calcula el
  estado desde `progress`, no acumules.

### 1.4 Navegación suave desde el menú

```js
const easeInOutCubic = (t) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target || !lenis) return;
  e.preventDefault();
  lenis.scrollTo(target, { duration: 1.4, easing: easeInOutCubic });
}));
```

Si la página tiene muchas animaciones scrubeadas pesadas entre secciones, suspende
`ScrollTrigger.update` durante el salto y llama `ScrollTrigger.update()` al llegar
(ver `references/gsap-lenis-setup.md` §Saltos largos).

### 1.5 Rendimiento en móvil (resumen; detalle en `references/rendimiento-movil.md`)

- **Piensa primero en celular**: diseña a 375×667 y luego amplía.
- Presupuesto: primera pantalla visible < 2.5 s en 4G; JS propio < 60 KB; hero < 250 KB.
- Primera imagen `loading="eager" fetchpriority="high"`; el resto `lazy` con `width`/
  `height` o `aspect-ratio` para no mover el layout.
- Video: `muted playsinline preload="none"`, sin audio, versiones 1920 y 960 px, póster.
  Cargar solo cuando esté cerca (IO con `rootMargin`) y pausar fuera de pantalla.
- **Modo fijo** (`.stills`): con movimiento reducido, `saveData` o 2G, decide en un script
  inline del `<head>` (sin parpadeo) y muestra imágenes fijas en vez de video.
- `devicePixelRatio` limitado a 2 en canvas/WebGL; nada de WebGL de fondo en móvil si la
  página ya tiene video.
- Todo loop de `requestAnimationFrame` se detiene fuera de pantalla (IntersectionObserver).
- Unidades: `100dvh`/`100lvh` para escenarios a pantalla completa (la barra de Safari
  cambia `100vh`). `lvh` para el escenario fijo (no salta al ocultarse la barra), `dvh`
  para contenido que debe caber.
- Desborde horizontal: `main { overflow-x: clip }` (ya en las plantillas) + `overscroll-
  behavior-x: none` en `body`. **Nunca** `overflow-x: hidden` en `html` ni en un ancestro
  de un sticky (crea contenedor de scroll y rompe `position: sticky`; `clip` no lo hace).

### 1.6 Accesibilidad

- `prefers-reduced-motion`: sin Lenis, sin scrub decorativo, sin video; las entradas son
  fundidos de opacidad cortos. El contenido completo debe leerse igual.
- Contraste AA en todo texto, incluido texto sobre foto/video: usa **velos degradados**
  solo del lado del texto (`linear-gradient` desde el color de fondo a transparente).
- Elementos decorativos (canvas, video de fondo, fotogramas) con `aria-hidden="true"` y
  `alt=""`; videos decorativos con `tabindex="-1"`, `disablepictureinpicture`.
- Enlace "Saltar al contenido", `:focus-visible` visible con el color de acento, orden de
  tabulación igual al visual, menú móvil con `aria-expanded` y cierre con Escape.
- Texto partido en letras/palabras para animar: conserva el texto completo en
  `aria-label` del contenedor y marca los `span` con `aria-hidden="true"`.
- Botones reales (`<button>`) para acciones y `<a>` para navegación. Nada de `div` clicable.
- Cursor personalizado solo con `(pointer: fine)` y sin ocultar el foco del teclado.

### 1.7 SEO básico

- `<html lang>` correcto, `<title>` (≤ 60 caracteres) y `<meta name="description">`
  (≤ 155) con el beneficio, no con adjetivos.
- Un solo `<h1>` (el titular del hero o de la primera parada), jerarquía `h2/h3` real.
- Open Graph + Twitter card con imagen 1200×630, `og:url`, `og:locale`, `canonical`.
- Si hay dos idiomas: `hreflang` para cada uno + `x-default`; idealmente una URL por idioma.
- JSON-LD `Organization` (o `Product`, `Place`, `FAQPage` si aplica) **solo con datos reales**.
- `robots.txt` y `sitemap.xml`; `noindex` si es una demo o un proyecto ficticio.
- El texto importante va en el HTML servido, no inyectado solo por JS.
- `history.scrollRestoration = 'manual'` + `scrollTo(0,0)` en páginas con escenas
  fijadas: si no, al recargar se queda a medio recorrido sin contexto.

### 1.8 Cambio de idioma sin recargar (opcional)

Patrón: cada texto traducible es `<span class="i18n" data-es="…" data-en="…">`. Al cambiar:
barrido `clip-path: inset(0 0 0 100%)` → cambiar `innerHTML` → barrido de regreso. Después:
1. Reconstruir cualquier texto partido en spans y **matar y recrear** su timeline.
2. `lenis.resize(); ScrollTrigger.refresh();`
3. Candado `isSwitching` que ignore toques mientras dura el barrido.
4. Guardar el idioma en `localStorage` y actualizar `<html lang>`.

## 2. Errores comunes que hay que evitar

Cada uno se encontró en producción. Revísalos antes de entregar.

**Scroll y sincronización**
1. **Dos relojes**: Lenis con su propio rAF *y* `gsap.ticker`. Usa `autoRaf: false` y solo el ticker.
2. **Doble inercia en trackpad**: el sistema ya aplica momentum; si un swipe fuerte se
   siente "a veces rápido, a veces lento", limita los deltas (`normalizeWheel` en Lenis
   ≤1.0.x; en 1.1+ ajusta `wheelMultiplier`/`lerp`) antes de subir `duration`.
3. **Saltos de menú que disparan todas las animaciones de en medio** a toda velocidad:
   suspende `ScrollTrigger.update` durante el `scrollTo` largo.
4. **`anchors: true` de Lenis + tu propio handler**: los dos procesan el clic con easings
   distintos. Usa uno; si usas el tuyo, `stopPropagation()`.
5. **Recarga a mitad del recorrido**: fija `history.scrollRestoration = 'manual'`.

**GSAP y DOM**
6. **Timeline apuntando a nodos muertos**: un tween resuelve sus selectores al crearse. Si
   reemplazas el `innerHTML` (idioma, split de texto), mata el `ScrollTrigger` viejo y
   crea uno nuevo.
7. **`transition` de CSS peleando con el scrub**: un elemento con `transition: opacity 1s`
   que además se anima por scroll va "persiguiendo" el valor y queda a destiempo. Pon
   `el.style.transition = 'none'` antes de controlarlo desde JS.
8. **`clearProps` que revive el estado inicial de la hoja de estilos**: si el CSS pone
   `filter: blur(12px)` por defecto, limpiar el inline lo vuelve a poner. Al terminar,
   fija el valor final explícito (`filter: 'none'`, `opacity: 1`).
9. **Destello antes del primer scroll**: elementos que un ScrollTrigger va a ocultar se ven
   un instante con su opacidad por defecto. Dales el estado inicial en el momento en que
   los creas (o en CSS bajo `.js`), no en el primer `onUpdate`.
10. **Animaciones que terminan cuando el usuario ya se va**: el `end` de una entrada debe
    estar alto en la pantalla (`top 80%`), no a la mitad, para dejar tiempo de lectura.
    Si escalonas tarjetas con offsets, que sean pequeños (≤ 50 px de diferencia).

**Rendimiento**
11. **`filter` animado en decenas de elementos** → repintado en cada frame → tirones.
12. **Leer layout en cada frame** (`scrollHeight`, `getBoundingClientRect`) dentro de un
    loop de rAF. Cachea y recalcula en `resize` / `ScrollTrigger` `refresh`.
13. **`will-change` permanente en muchos elementos**: crea decenas de capas. Ponlo solo
    durante la animación o en `:hover`.
14. **Loops de rAF/WebGL dibujando en pantallas invisibles**: páralos con IO.
15. **`mousemove` escribiendo transform en cada evento**: guarda la posición y escribe una
    vez por frame en el ticker.
16. **`backdrop-filter` sobre escenas fijadas con video**: provoca "fantasmas" de texto y
    caídas de FPS. Usa fondo sólido semitransparente ahí.

**Video y canvas**
17. **Hacer seek a un `<video>` en cada evento de scroll** sin esperar `seeked` → se atora.
    Solo pide un `currentTime` nuevo cuando el anterior terminó (`!video.seeking`).
18. **Clips con keyframes cada 2–10 s** → seek lento. Recodifica con GOP corto (`-g 6`).
19. **iOS no pinta el fotograma buscado** hasta que el video se reprodujo una vez: después
    de cargar, `await video.play().catch(()=>{}); video.pause();`.
20. **Canvas en 0×0** porque se midió en `onload` antes del layout: usa `ResizeObserver`
    y vuelve a medir justo antes de dibujar si el ancho es 0.
21. **Servidor local sin `Range`**: el scrubbing de video falla en dev. Usa un servidor
    que soporte Range o carga el clip como blob (`fetch` → `URL.createObjectURL`).

**Layout y CSS**
22. **`overflow-x: hidden` en `html`** rompe `position: sticky`. Y `overflow-x: clip` solo en
    `body` **no basta**: el overflow de `body` se propaga al viewport, `scrollWidth` sigue
    creciendo y en iOS se puede arrastrar de lado. Usa `main { overflow-x: clip }`.
22b. **Animaciones que se salen del ancho en móvil**: el hero con `scale: 1.5`, columnas
    con `x: ±60` (o incluso ±30: una tarjeta a todo el ancho con 20 px de margen se sale
    10 px), giros 3D, espirales. Se probó: ninguna de las plantillas originales lo
    recortaba. El `main { overflow-x: clip }` lo resuelve; compruébalo con
    `scripts/verificar.cjs` a 375 px, no a ojo.
23. **`100vh` en móvil**: cambia con la barra de Safari. Usa `dvh`/`lvh`/`svh`.
24. **Safari iOS < 18 sin `-webkit-backdrop-filter`**: algunos generadores de CSS no lo
    prefijan; agrégalo a mano.
25. **Secciones de contenido con `min-height: 100dvh`** por inercia: solo las escenas
    cinemáticas llenan la pantalla; FAQ, pasos y tablas usan padding normal.
26. **Botones/textos que saltan de tamaño al cambiar de idioma**: anima el ancho/alto
    viejo → nuevo y luego `clearProps`.
27. **Dobles toques en celular** (idioma, menú): candado mientras dura la transición.

**Carga y JS**
27b. **`return` al inicio de `main.js` si no hay GSAP**: deja muerto el menú móvil y el
    formulario cuando el CDN falla. Separa lo funcional de lo animado (las plantillas ya lo hacen).
27c. **Ids fijos en el JS de la plantilla** (`#manifiesto`, `#pin-ctas`): si mueves o
    agregas bloques, se rompen en silencio. Las plantillas usan clases y atributos
    (`.statement`, `[data-pin-step]`, `[data-flip-row]`); sigue ese patrón en lo que agregues.

**Contenido**
28. Inventar cifras, testimonios, logos de clientes o premios. Marca `[PENDIENTE]`. Si el
    usuario pide testimonios de ejemplo, ver §0 "Proyecto ficticio o demo".
29. Texto ilegible sobre la foto: siempre velo degradado + comprobar contraste en el
    fotograma más claro del video, no solo en el primero.
30. Botones muertos (`href="#"`) al entregar: lista explícita de enlaces pendientes.

## 3. Flujo de trabajo recomendado

1. Preguntas (§0) → elegir estilo → leer su referencia.
2. Copiar la plantilla de `assets/` y definir tokens (paleta, fuentes, easing).
3. Maquetar todas las secciones **sin animación**, con textos reales o `[PENDIENTE]`.
   Revisar en 375 px y en 1440 px. Debe leerse completo sin JS.
4. Conectar Lenis + ScrollTrigger y animar de arriba abajo, una sección a la vez.
5. Medios: optimizar (ver `references/rendimiento-movil.md`), cargar por cercanía, modo fijo.
6. Accesibilidad, SEO, idioma.
7. Verificar (abajo) con `scripts/verificar.cjs` en modo normal, `--reduced` y `--nojs`,
   revisar las capturas y entregar con la lista de pendientes y de decisiones tomadas.

## 4. Verificación antes de entregar

- [ ] Scroll de arriba a abajo **y de regreso** sin saltos ni elementos atorados.
- [ ] Celular real o emulación (375×667, Android medio con CPU 4× más lenta): sin tirones
      en las escenas fijadas, sin desborde horizontal.
- [ ] Safari de iPhone: video que avanza con el scroll, sticky, vidrio esmerilado.
- [ ] `prefers-reduced-motion` activado: todo el contenido visible, sin video.
- [ ] Sin JS: todo el texto visible y los enlaces funcionan.
- [ ] Recargar a media página: vuelve arriba.
- [ ] Lighthouse móvil: LCP < 2.5 s, CLS < 0.1; contraste AA.
- [ ] Ningún botón muerto, ningún texto de ejemplo, ninguna cifra inventada.
- [ ] Consola sin errores ni advertencias de ScrollTrigger.
- [ ] `node scripts/verificar.cjs <url>` sin ✗ (y con `--reduced`, `--nojs`); capturas revisadas.
- [ ] Sin GSAP (CDN bloqueado): menú móvil y formulario siguen funcionando.

Entrega siempre: cómo correrlo localmente, qué archivos de medios faltan (nombre, medida,
peso objetivo), qué enlaces o textos quedan pendientes y qué decidiste por tu cuenta
(paleta, fuentes, backend del formulario, estructura).
