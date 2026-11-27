# Rendimiento en móvil

El rendimiento es parte del producto: una landing cinematográfica que da tirones en un
Android medio se percibe peor que una estática. Diseña y mide primero en celular.

## Índice
1. Presupuesto
2. Imágenes
3. Video para scroll (scrub)
4. Video en loop (decorativo / capturas)
5. Secuencia de imágenes en canvas
6. Canvas y WebGL
7. Reglas de animación
8. iOS Safari
9. Android
10. Cómo medir

---

## 1. Presupuesto (4G, Android medio)

| Recurso | Objetivo |
|---|---|
| LCP (primera imagen/titular) | < 2.5 s |
| CLS | < 0.1 |
| HTML + CSS crítico | < 50 KB |
| JS propio | < 60 KB sin comprimir |
| Librerías (GSAP + ScrollTrigger + Lenis) | ~ 90 KB gzip; Three.js suma ~150 KB gzip |
| Imagen del hero | < 250 KB (webp/avif) |
| Cada clip de scroll móvil (960 px) | 1–3 MB |
| Cada video en loop | < 2 MB, 8–15 s |
| Total antes del primer scroll | < 1 MB |

Si el presupuesto no alcanza, quita efectos antes que bajar la calidad del material
principal. Lo primero que sobra: WebGL de fondo en móvil, cursor, gráficas animadas.

## 2. Imágenes

- Formatos: `webp` (q 75–82) con `jpg` de respaldo vía `<picture>`; `avif` si el
  hosting lo sirve bien.
- Tamaños: 1920 px de ancho para escritorio, 960–1080 px para móvil; usa `srcset` + `sizes`.
- Primera imagen visible: `loading="eager" fetchpriority="high" decoding="async"`, y
  `<link rel="preload" as="image">` si es imagen de fondo.
- Resto: `loading="lazy" fetchpriority="low"`.
- Siempre `width`/`height` o `aspect-ratio` en el contenedor (evita CLS y refresh de
  ScrollTrigger).
- Encuadre: si el texto va a un lado, el material debe traer espacio vacío de ese lado.
  Usa `object-position` (p. ej. `78% 50%`) para que en móvil no se corte el sujeto.

Conversión rápida (Node + sharp):

```js
import sharp from 'sharp';
await sharp('in.jpg').resize({ width: 1920 }).webp({ quality: 80 }).toFile('out-1920.webp');
await sharp('in.jpg').resize({ width: 960 }).webp({ quality: 78 }).toFile('out-960.webp');
```

O con ffmpeg: `ffmpeg -i in.jpg -vf scale=960:-2 -q:v 3 out-960.jpg`.

## 3. Video para scroll (scrub)

El navegador solo puede saltar rápido a un cuadro si hay keyframes cerca. Un video normal
(keyframe cada 2–10 s) se atora al hacer scroll. Recodifica:

```bash
ffmpeg -i clip.mp4 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -g 6 -keyint_min 6 -sc_threshold 0 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -vf "scale=1920:-2" -movflags +faststart clip-1920.mp4
```

```bash
ffmpeg -i clip.mp4 -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -g 6 -keyint_min 6 -sc_threshold 0 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -vf "scale=960:-2" -movflags +faststart clip-960.mp4
```

Póster (primer y último cuadro, para el crossfade y el modo fijo):

```bash
ffmpeg -i clip-1920.mp4 -frames:v 1 -q:v 3 clip-inicio.jpg
```

```bash
ffmpeg -sseof -0.1 -i clip-1920.mp4 -frames:v 1 -q:v 3 clip-final.jpg
```

Reglas:
- `-g 6`: un keyframe cada 6 cuadros; más chico = seek más rápido y archivo más pesado.
  `-g 1` (todo intra) solo para clips muy cortos.
- Sin audio (`-an`): pesa menos y permite autoplay/seek sin restricciones.
- `+faststart`: el índice al principio; necesario para empezar sin descargar todo.
- Duración por clip 4–8 s; a 24–30 fps. Más largo = más peso sin más sensación.
- El servidor debe soportar `Range` (Netlify, Vercel, Cloudflare lo hacen). Para no
  depender de eso, carga el clip completo como blob (`fetch` → `URL.createObjectURL`):
  con blob el seek es local e instantáneo.
- Carga de a uno, primero el del tramo actual, luego por cercanía. Nunca todos al inicio.
- Elige versión por ancho: `matchMedia('(max-width: 767px)')` → 960 px.

## 4. Video en loop (decorativo / capturas de producto)

```html
<video data-lazy-video muted loop playsinline preload="none" poster="poster.jpg"
       aria-hidden="true" tabindex="-1">
  <source data-src="captura.mp4" type="video/mp4">
</video>
```

- Asigna `src` al acercarse (IO `rootMargin: '150% 0px'`), luego `video.load()`.
- Reproduce solo en pantalla (IO `threshold: 0.4` → `play()` / `pause()`).
- 8–15 s, < 2 MB, sin audio, con póster. En modo `.stills` no se inicializan.
- Si el video no existe todavía, que el póster (o un marco con el nombre) ocupe su lugar:
  nunca un rectángulo negro.

## 5. Secuencia de imágenes en canvas (alternativa al video)

Cuando el scrub tiene que ser perfecto incluso con scroll muy rápido (objeto que gira,
producto que se arma), una secuencia de cuadros es más fiable que el seek de video:

- Exporta 90–150 cuadros a 640×360 (móvil) / 1280×720 (escritorio).
- Empácalos en **hojas de sprites** (p. ej. 10×5 cuadros por hoja): 3 peticiones en vez
  de 150. Con ffmpeg: `ffmpeg -i clip.mp4 -vf "fps=10,scale=640:-2,tile=10x5" -q:v 4 sheet_%d.jpg`.
- Dibuja con `drawImage(sheet, sx, sy, w, h, 0, 0, cw, ch)` — instantáneo.
- Progreso: el scroll solo fija un **objetivo**; un rAF acerca el valor actual
  (`current += (target - current) * 0.08`) → suaviza saltos y da inercia al soltar.
- El rAF corre solo con la sección cerca de la pantalla (IO).
- Mide con `ResizeObserver`, DPR ≤ 2. Un canvas de fondo difuminado puede dibujarse a
  0.35× de resolución: el `blur` CSS esconde el detalle.

## 6. Canvas y WebGL

- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; en móvil considera 1.5.
- `antialias: false` para quads de pantalla completa (shaders de ruido): MSAA no aporta.
- Un solo WebGL de fondo por página. Escenas de sección (partículas) con su propio canvas,
  pausadas con IO.
- Cachea medidas (`scrollHeight`, tamaños) y recalcula en `resize` con debounce de 150 ms
  y en el evento `refresh` de ScrollTrigger.
- Pausa el render con `document.hidden` (`visibilitychange`).
- En móvil de gama baja (`navigator.hardwareConcurrency <= 4` o `deviceMemory <= 4`):
  sustituye el shader por un degradado CSS animado o una imagen.

## 7. Reglas de animación

- Solo `transform` y `opacity` en lo que se mueve con el scroll.
- `will-change` temporal (durante la animación o en `:hover`), nunca en decenas de
  elementos permanentemente.
- `backdrop-filter`: pocos elementos, chicos, y nunca encima de video en escenas fijadas.
- Sombras grandes y `mix-blend-mode` cuestan en cada frame si el elemento se mueve.
- Un solo ticker: los efectos por frame (cursor, lerps) se cuelgan de `gsap.ticker`.
- `mousemove`/`scroll` solo guardan valores; el dibujo ocurre en el ticker.
- Listeners de scroll siempre `{ passive: true }`. Para "¿está en pantalla?" usa IO.
- Para "¿dejó de hacer scroll?" un `setInterval` de 200 ms basta (no rAF).

## 8. iOS Safari

- `muted playsinline` obligatorios en todo video; sin ellos no hay inline ni autoplay.
- El fotograma buscado no se pinta hasta que el video se reprodujo una vez:
  `await v.play().catch(()=>{}); v.pause();` tras `loadeddata`.
- `100vh` incluye la barra; usa `100lvh` para el escenario fijo y `100dvh` para contenido.
- `-webkit-backdrop-filter` a mano si tu CSS no lo prefija (iOS < 18).
- Modo de bajo consumo puede limitar a 30 fps y bloquear `play()`: el recorrido debe verse
  bien con los fotogramas fijos si el video nunca arranca.
- `position: sticky` falla si un ancestro tiene `overflow: hidden|auto`.
- Evita `background-attachment: fixed` (no soportado, se ve estirado).

## 9. Android

- CPU media: prueba con DevTools → Performance → CPU 4× slowdown.
- Chrome Android oculta la barra al bajar: el mismo problema de `vh` que iOS.
- `navigator.connection.saveData` y `effectiveType` sí existen aquí: úsalos para `.stills`.
- Rebote horizontal: algo se sale del ancho (decoraciones difuminadas, texto 3D). Busca
  con `document.querySelectorAll('*')` cuál tiene `getBoundingClientRect().right >
  innerWidth`; corrígelo y deja `overscroll-behavior-x: none` en `body`.

## 10. Cómo medir

1. Lighthouse móvil (modo incógnito): LCP, CLS, TBT, peso total.
2. DevTools → Performance: graba un scroll completo de ida y vuelta con CPU 4×; busca
   frames rojos, "Recalculate Style"/"Layout" dentro de rAF, y "Paint" grande en cada frame.
3. DevTools → Rendering → "Paint flashing" y "Layer borders": lo que parpadea en verde al
   hacer scroll se está repintando.
4. Network → "Fast 4G": confirma que el primer clip no bloquea el hero y que los demás
   cargan por cercanía.
5. Dispositivo real: iPhone (Safari) y un Android de gama media. Emulación no basta para video.
