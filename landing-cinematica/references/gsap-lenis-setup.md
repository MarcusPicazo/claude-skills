# GSAP + ScrollTrigger + Lenis: setup y patrones

Referencia técnica común a los dos estilos.

## Índice
1. Carga de librerías (sin build / con build)
2. Inicialización y sincronización
3. CSS obligatorio
4. Estado `.js`, `.stills` y movimiento reducido
5. Patrones de ScrollTrigger
6. Escenas fijadas con `sticky` + progreso
7. Interpolación por tramos (`piecewise`)
8. Saltos largos desde el menú
9. Refresh y cambios de altura
10. Texto partido (letras / palabras)
11. Depuración

---

## 1. Carga de librerías

**Sin build** (plantillas de `assets/`). Fija versiones exactas, `defer`, y carga los
scripts propios después:

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.1.20/dist/lenis.css">
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>
<script defer src="main.js"></script>
```

`defer` mantiene el orden y no bloquea el render. No uses `window.onload` para arrancar
(espera a todas las imágenes): `DOMContentLoaded` o simplemente `defer`.

**Con build** (Vite/Astro/Next):

```js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
```

En frameworks con navegación de cliente (Next, Astro con View Transitions) destruye todo
al salir: `ScrollTrigger.getAll().forEach(t => t.kill()); lenis.destroy();` — o usa
`gsap.context()` / `useGSAP()` y `ctx.revert()`.

## 2. Inicialización y sincronización

```js
gsap.registerPlugin(ScrollTrigger);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
let suppressST = false; // ver §8

function initLenis() {
  if (reduceMotion) return null;
  lenis = new Lenis({
    autoRaf: false,          // el reloj es gsap.ticker
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', () => { if (!suppressST) ScrollTrigger.update(); });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);   // sin esto, tras un tirón GSAP "salta" y Lenis se desincroniza
  return lenis;
}
```

Valores de partida:
- `duration 1.0–1.2` con el easing exponencial de arriba: se siente premium sin flotar.
  1.8 ya se percibe impreciso. Alternativa: `lerp: 0.1` (no mezclar `lerp` y `duration`).
- En táctil, Lenis deja el scroll nativo por defecto (`syncTouch: false`): no lo cambies;
  el scroll nativo del celular es el más fluido.
- Si un trackpad se siente con doble inercia, baja `wheelMultiplier` (0.8) o, en
  `@studio-freight/lenis` 1.0.x, `normalizeWheel: true`.
- Elementos con su propio scroll (modal, lista larga): atributo `data-lenis-prevent`.

Orden de arranque en `main.js`:

```js
initLenis();
initHeader();
initReveals();
initSecciones();        // cada sección en su propia función init*
initNavSuave();
initScrollHint();
ScrollTrigger.refresh(); // tras crear todo
```

## 3. CSS obligatorio

```css
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-scrolling iframe { pointer-events: none; }
```

(Es lo que trae `lenis.css`). Nunca `scroll-behavior: smooth` global junto con Lenis.

## 4. `.js`, `.stills` y movimiento reducido

Script inline al inicio de `<head>` (síncrono, antes del CSS):

```html
<script>
  document.documentElement.classList.add('js');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  (function () {
    try {
      var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var c = navigator.connection;
      var slow = !!(c && (c.saveData || /2g/.test(c.effectiveType || '')));
      if (rm || slow) document.documentElement.classList.add('stills');
    } catch (e) {}
  })();
</script>
```

- Estados ocultos iniciales solo bajo `.js`: `.js [data-reveal] { opacity: 0 }`.
- `.stills` decide entre video e imágenes fijas sin parpadeo (ver `estilo-recorrido.md`).
- En JS, lee `reduceMotion` una vez y pásalo a cada `init*`.

## 5. Patrones de ScrollTrigger

**Entrada scrubeada y reversible** (estilo producto):

```js
gsap.utils.toArray('[data-up]').forEach((el) => {
  gsap.fromTo(el, { y: 40, opacity: 0 }, {
    y: 0, opacity: 1, ease: 'power1.out',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 80%', scrub: 0.6 },
  });
});
```

**Coreografía** (varias piezas de un bloque, cada una en su momento):

```js
const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top bottom-=60', end: 'top 55%', scrub: 0.6 } });
tl.fromTo(num,  { opacity: 0, y: 24 },             { opacity: 1, y: 0, duration: 1 }, 0)
  .fromTo(icon, { opacity: 0, scale: .7 },          { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1 }, .12)
  .fromTo(txt,  { opacity: 0, x: -24 },             { opacity: 1, x: 0, duration: 1 }, .24);
```

Variaciones útiles para que cada sección se sienta distinta:
- Dos columnas que convergen (`x: -60` / `x: 60`).
- Tarjetas laterales desde los lados y la central crece con `back.out`.
- Giro 3D: `rotateY: ±55, transformPerspective: 800` (no requiere `perspective` en el padre).
- Cuadrícula 2×2 que entra desde sus esquinas.
- Fotos que "se asientan": `rotation: ±9 → 0` + `y` + `scale`.

**Entrada de una sola vez** (estilo recorrido, contenido largo): IntersectionObserver.

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
```

```css
.js [data-reveal] { opacity: 0; transform: translateY(4rem); filter: blur(12px);
  transition: opacity 1s var(--ease), transform 1s var(--ease), filter 1s var(--ease);
  transition-delay: var(--d, 0ms); }
.js [data-reveal].is-in { opacity: 1; transform: none; filter: none; }
```

(El `blur` aquí es aceptable: corre una vez por elemento, no en cada frame de scroll.)

**Header flotante**:

```js
ScrollTrigger.create({ start: 'top -50', end: 99999, toggleClass: { className: 'is-floating', targets: header } });
```

**Lazy de cosas caras** (gráficas, WebGL de sección): `ScrollTrigger.create({ trigger, start: 'top 80%', once: true, onEnter: init })`.

## 6. Escenas fijadas con `sticky` + progreso

```html
<section id="cierre" class="pin" style="min-height:250dvh">
  <div class="pin__sticky">  <!-- position:sticky; top:0; height:100dvh -->
    …
  </div>
</section>
```

```js
const clamp01 = gsap.utils.clamp(0, 1);
const band = (p, a, b) => clamp01((p - a) / (b - a));

ScrollTrigger.create({
  trigger: '#cierre', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: ({ progress: p }) => {
    const t = band(p, 0.5, 0.7);
    gsap.set(phone, { autoAlpha: t, y: (1 - t) * 16 });
    if (t >= 1) gsap.set(phone, { filter: 'none' }); // valor final explícito, nunca clearProps
  },
});
```

- Calcula todo desde `progress` → es reversible sin código extra.
- Cada elemento tiene su **banda** `[inicio, fin]`; no las encimes si deben leerse en orden.
- Termina las bandas antes de `1.0` (p. ej. 0.9): el usuario rara vez llega al último pixel.
- Altura: 150–250dvh por escena fijada. Más de 400dvh se siente atascado salvo que haya
  mucho que ver (una secuencia de 150 cuadros, un zoom de manifiesto).

## 7. Interpolación por tramos (`piecewise`)

Convierte la posición de scroll en un valor continuo entre marcas (p. ej. `w` = índice de
parada con decimales). Es el corazón del recorrido cinematográfico:

```js
function piecewise(y, keys) {           // keys: [{ y, v }] ordenadas por y
  if (y <= keys[0].y) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (y <= b.y) return a.v + (b.v - a.v) * ((y - a.y) / (b.y - a.y || 1));
  }
  return keys[keys.length - 1].v;
}
const marks = stops.map((s) => ScrollTrigger.create({ trigger: s, start: 'top top' }));
// en onUpdate: w = piecewise(self.scroll(), [...marks.map((m, i) => ({ y: m.start, v: i })), { y: self.end, v: stops.length }]);
```

Ventaja sobre un solo `progress`: cada parada puede medir distinto y el video igual llega
exacto a su cuadro de corte cuando el texto toca el borde superior.

## 8. Saltos largos desde el menú

```js
function goTo(target) {
  if (!lenis) { document.querySelector(target)?.scrollIntoView(); return; }
  suppressST = true;
  lenis.scrollTo(target, {
    duration: 1.4, easing: easeInOutCubic,
    onComplete: () => { suppressST = false; ScrollTrigger.update(); },
  });
}
```

Usa la supresión cuando entre origen y destino haya escenas scrubeadas pesadas (espirales,
zooms, video): si no, se reproducen a toda velocidad durante el viaje. En el recorrido con
video normalmente NO se suprime (el video debe quedar en el cuadro correcto al llegar, y
`ScrollTrigger.update()` al final lo deja bien de todos modos).

Logo → `goTo(0)`. Para enlaces que caen dentro de una escena fijada, apunta a un offset
donde el contenido ya es visible: `lenis.scrollTo(section, { offset: innerHeight * 1.2 })`.

## 9. Refresh y cambios de altura

Llama `lenis?.resize(); ScrollTrigger.refresh();` cuando:
- Cambia el idioma (los textos miden distinto).
- Se abre/cierra un acordeón grande o un bloque se muestra/oculta.
- Cargan fuentes web (`document.fonts.ready.then(...)`) si los titulares son grandes.
- Imágenes sin dimensiones (mejor: siempre pon `width`/`height` o `aspect-ratio`).

En `resize` de ventana, ScrollTrigger ya hace refresh con debounce; no agregues otro.

## 10. Texto partido (letras / palabras)

```js
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.replaceChildren(...text.split(/\s+/).flatMap((w, i, arr) => {
    const s = document.createElement('span');
    s.textContent = w; s.setAttribute('aria-hidden', 'true');
    s.style.display = 'inline-block';
    s.style.opacity = '0';                     // estado inicial YA aquí (evita destello)
    return i < arr.length - 1 ? [s, document.createTextNode(' ')] : [s];
  }));
  return [...el.querySelectorAll('span')];
}
```

Para letras, envuelve cada palabra en un `inline-block` y dentro cada letra, así no se
parte una palabra entre líneas. Si el texto cambia (idioma), vuelve a partir **y** mata y
recrea el ScrollTrigger que lo anima.

## 11. Depuración

- `markers: true` en el ScrollTrigger mientras ajustas `start`/`end`; quítalo al entregar.
- `ScrollTrigger.getAll().length` en consola: si crece al cambiar idioma, estás duplicando.
- Si algo va "detrás" del scroll: busca una `transition` CSS en ese elemento (error 7).
- Si un sticky no se fija: busca `overflow` distinto de `visible` en algún ancestro.
- Simula reduced motion en DevTools → Rendering → "Emulate CSS prefers-reduced-motion".
