# Estilo "recorrido cinematográfico"

Para lugares y cosas físicas que se recorren: desarrollos inmobiliarios, hoteles, obras,
destinos, museos, un objeto que se construye. El scroll es una cámara: un escenario fijo a
pantalla completa donde un video (o fotogramas) avanza y retrocede, y encima pasan las
"paradas" de texto. Ritmo pausado, editorial, mucho aire. Plantilla: `assets/estilo-recorrido/`.

## Índice
1. Carácter visual
2. Estructura de la página
3. El "mundo": escenario fijo + paradas
4. Motor: `w`, fotogramas y clips
5. Carga de clips
6. Modo fijo (`.stills`) y sin JS
7. Escenas fijadas dentro del recorrido
8. Raíl de progreso y header
9. Secciones de contenido después del recorrido
10. Preparar el material (imágenes y clips encadenados)
11. Ajustes para móvil

---

## 1. Carácter visual

- Sitio claro o de tonos naturales (arena, piedra, hueso) con texto grafito; o noche con
  texto claro si el material es nocturno. Un acento cálido para el botón principal.
- Serif editorial para titulares (peso 400, `text-wrap: balance`), sans humanista para texto.
- Easing único y suave para todo: `cubic-bezier(.32, .72, 0, 1)` con duraciones largas
  (700–1200 ms).
- El material manda: el encuadre deja espacio vacío del lado del texto; el texto nunca
  tapa al sujeto.

## 2. Estructura de la página

1. **Recorrido** (uno o dos "mundos"): 3–6 paradas. La primera es el hero (`<h1>`, CTA
   principal + secundario visibles desde el primer momento, una línea de datos clave).
2. **Frase / lema**: una frase grande cuyas palabras se encienden una a una al entrar.
3. **Contenido**: tipologías/opciones, amenidades/características, cómo funciona, ubicación,
   pagos/planes (sin precios si el cliente no los da), FAQ (acordeón nativo).
4. **Contacto / asesor**: formulario corto o botón a WhatsApp/agenda.
5. **Cierre** (opcional, segundo mundo): un último clip fijado (cambio de luz, alejamiento)
   con el CTA final.
6. Pie.

## 3. El "mundo": escenario fijo + paradas

```html
<section data-world>
  <div data-stage class="stage">           <!-- sticky; top:0; height:100lvh; overflow:hidden -->
    <div aria-hidden="true" class="stage__media">
      <picture data-frame class="frame">…</picture>   <!-- un fotograma por parada -->
      <div class="clips">
        <video data-clip data-src-desktop="c1-1920.mp4" data-src-mobile="c1-960.mp4"
               muted playsinline preload="none" disablepictureinpicture
               disableremoteplayback tabindex="-1" class="clip"></video>
      </div>
    </div>
    <div class="veil" aria-hidden="true"></div>   <!-- degradado del lado del texto -->
  </div>
  <div class="stops">                        <!-- margin-top:-100lvh; z-index:1 -->
    <article data-stop id="parada-1" class="stop">…</article>  <!-- min-height:100lvh -->
    …
  </div>
</section>
```

- Escenario: `position: sticky` en CSS (no `pin` de GSAP). `100lvh` para que no salte
  cuando la barra del navegador aparece/desaparece.
- Paradas: cada una mide al menos una pantalla y deja su texto abajo a la izquierda (o a
  la izquierda centrado). La parada activa (`.is-current`) a opacidad 1; las demás a 0.35.
- Velos: `linear-gradient(to right, fondo 0%, fondo/65 30%, transparent 70%)` en móvil y
  algo más corto en escritorio; un desvanecido de 12dvh abajo hacia el color de la página.
  Comprueba el contraste en el fotograma más claro.
- `--focus-x` (CSS var) controla `object-position` horizontal; puede variar por parada
  (`data-focus="70"`) e interpolarse con `piecewise` para "paneos" suaves en móvil.

## 4. Motor: `w`, fotogramas y clips

`w` = posición en el recorrido: `0` en la primera parada, `1` en la segunda, `2.5` a mitad
entre la tercera y la cuarta. Se calcula con `piecewise` sobre los `start` de un
ScrollTrigger por parada (`start: 'top top'`) y el `end` del mundo.

```js
const render = (self) => {
  const y = self.scroll();
  w = piecewise(y, [...marks.map((m, i) => ({ y: m.start, v: i })), { y: self.end, v: stops.length }]);
  setCurrent(Math.round(Math.min(w, last)));

  // Fotogramas: el i está entero y sin escala justo en su parada; aparece en la segunda
  // mitad del tramo anterior y se acerca un 6 % al avanzar.
  frames.forEach((f, i) => {
    f.style.opacity = i === 0 ? 1 : clamp01((w - i + 0.5) / 0.5);
    if (!reduceMotion) f.style.transform = `scale(${1 + 0.06 * clamp01(w - i)})`;
  });

  // Clip del tramo: el clip i cubre de la parada i a la i+1.
  active = Math.min(clips.length - 1, Math.floor(w));
  if (ready[active]) time = Math.min((w - active) * clips[active].duration, clips[active].duration - 0.05);
  sync();
};
ScrollTrigger.create({ trigger: world, start: 'top top', end: 'bottom bottom', onUpdate: render, onRefresh: render });
```

Sincronizar el video sin atorarlo:

```js
const sync = () => {
  const clip = clips[active];
  if (!clip || !ready[active]) { delete stage.dataset.mode; return; } // se ven los fotogramas
  if (clip.seeking) return;                                           // espera al seek anterior
  if (Math.abs(clip.currentTime - time) > 0.01) clip.currentTime = time;
  else show();
};
clips.forEach((c, i) => c.addEventListener('seeked', () => { if (i === active) { show(); sync(); } }));
```

- `show()` hace visible solo el clip activo (`visibility`), y pone `data-mode="video"` en
  el escenario, que hace un fundido de 1.2 s de los fotogramas al video la primera vez.
- El cambio entre clips es instantáneo porque comparten el cuadro de corte (§10).
- `duration - 0.05`: nunca pidas el último cuadro exacto (algunos navegadores lo pintan negro).
- Sin clips (o mientras cargan) el mismo código hace crossfade + zoom entre fotogramas:
  el recorrido siempre funciona.

## 5. Carga de clips

```js
const distance = (i) => (i === active ? -1 : i > w ? i - w : w - (i + 1) + 0.5);
const queue = clips.map((_, i) => i);
async function loadNext() {
  queue.sort((a, b) => distance(a) - distance(b));
  const i = queue.shift(); if (i === undefined) return;
  const clip = clips[i];
  const src = matchMedia('(max-width: 767px)').matches ? clip.dataset.srcMobile : clip.dataset.srcDesktop;
  clip.preload = 'auto';
  try { const r = await fetch(src); if (!r.ok) throw 0; clip.src = URL.createObjectURL(await r.blob()); }
  catch { clip.src = src; }
  const ok = await new Promise((res) => {
    clip.addEventListener('loadeddata', () => res(true), { once: true });
    clip.addEventListener('error', () => res(false), { once: true });
  });
  if (ok) { await clip.play().catch(() => {}); clip.pause(); ready[i] = true; render(span); } // iOS
  loadNext();
}
```

- De uno en uno, el más cercano a la posición actual primero.
- Blob → seek local e instantáneo, independiente de `Range` en el servidor.
- Si el mundo no está arriba (p. ej. el cierre), empieza a cargar solo cuando se acerca:
  IntersectionObserver con `rootMargin: '50% 0px'` y `disconnect()` al primer cruce.
- No cargar nada con `reduceMotion`, `saveData` o `.stills`.

## 6. Modo fijo (`.stills`) y sin JS

- El script inline del `<head>` (ver `gsap-lenis-setup.md` §4) agrega `.stills` con
  movimiento reducido, ahorro de datos o 2G.
- Cada parada tiene además una imagen fija propia (`.still-bg`, `position:absolute;
  inset:0; z-index:-1`) visible por defecto.
- CSS: `[data-stage]{display:none}` y `html.js:not(.stills) [data-stage]{display:block}`;
  `html.js:not(.stills) .still-bg{display:none}`. Así nunca se ven los dos fondos y sin JS
  la página se lee completa con imágenes.
- En `.stills` no se inicializa el mundo ni los videos en loop.

## 7. Escenas fijadas dentro del recorrido

Para una parada que necesita más tiempo (el objeto termina de armarse y luego entra un
mockup; el atardecer del cierre), la parada se vuelve una sección alta (150–250dvh) con un
hijo sticky de `100dvh`. Como el mundo calcula `w` con los `start` de las paradas, el video
se estira solo a lo largo de ese tramo más largo.

Dentro del fijado, una secuencia por bandas de `progress` (ver `gsap-lenis-setup.md` §6):
- Título palabra por palabra en el primer 20 %, sube 40 px hasta el 75 %.
- Mockup/imagen secundaria 50–70 %; globo de mensaje 72–92 %.
- Botones 75–90 %, nítidos antes del final.
- Una línea de progreso (ancho = `progress * 100%`) refuerza que "algo avanza".

Recuerda: `el.style.transition = 'none'` en lo que controla el scrub, valores finales
explícitos (no `clearProps`) y estado inicial puesto al crear los spans.

## 8. Raíl de progreso y header

- Raíl lateral (solo escritorio): un punto por **grupo** de escenas (no uno por escena si
  hay más de 6), línea de relleno `scaleY(w / last)` y etiqueta visible al hover/foco.
- Un solo IntersectionObserver (`rootMargin: '-45% 0px -45% 0px'`) marca a la vez el punto
  del raíl y el enlace del header del grupo activo. Un mapa `escena → grupo` en un solo
  archivo de datos para que header, raíl y página nunca se desincronicen.
- Header: transparente arriba, vidrio al pasar 50 px; enlaces con línea del acento bajo el
  activo. Mismo scroll suave (`easeInOutCubic`, 1.2 s) para header, logo y raíl.
- Aviso "Desliza para recorrer" abajo a la derecha que se desvanece con `1 - w*4`.

## 9. Secciones de contenido después del recorrido

- Entradas de una sola vez con IntersectionObserver (`[data-reveal]` + `--d` para escalonar).
- Lema palabra por palabra: cada palabra un `span` con `transition-delay: i*35ms`, de color
  tenue (texto al 30 %) a color pleno al entrar.
- Sin `min-height: 100dvh` en secciones cortas: padding vertical normal (64–128 px).
- Tarjetas con video en loop (capturas, amenidades): `data-lazy-video`, ver
  `rendimiento-movil.md` §4; con póster o marco con el nombre si falta el video.
- FAQ con `<details>`/`<summary>` (animable con `::details-content` donde haya soporte) y
  JSON-LD `FAQPage` en el HTML servido.
- Contacto sin backend: el formulario arma un mensaje y abre `wa.me/<número>?text=` o
  `mailto:`; dilo explícitamente en la entrega.

## 10. Preparar el material

**Imágenes**: un fotograma por parada, misma cámara y misma luz, con espacio vacío del
lado del texto. Si se generan con IA: crea primero la imagen "final" (la más completa) y
obtén las demás **editando esa misma imagen** (quitar partes, cambiar la luz…), para que el
sujeto sea idéntico en todas.

**Clips encadenados**: el clip *k* va del fotograma *k* al *k+1* (modo "primer y último
cuadro" en generadores de video, o una toma real cortada exactamente en esos puntos).
- Cámara estática o con un movimiento muy lento y constante; sin cortes ni disolvencias.
- Si un clip sale con disolvencia ("fantasma" a la mitad), regenera dando solo el primer cuadro.
- 4–8 s cada uno; recodifica con `-g 6` en 1920 y 960 px (ver `rendimiento-movil.md` §3).
- Extrae el último cuadro real de cada clip y úsalo como fotograma de la parada siguiente:
  garantiza que el corte entre clips sea invisible.

Nombra por orden: `parada-1.jpg … parada-N.jpg`, `clip-1-1920.mp4`, `clip-1-960.mp4`…
Entrega siempre la lista de archivos que faltan con su medida y peso objetivo.

## 11. Ajustes para móvil

- Clips de 960 px; fotogramas de 960–1080 px.
- Texto de las paradas casi a todo el ancho, abajo, con un velo de abajo hacia arriba
  más fuerte (desde el color de fondo al 15 %, al 50 % a media altura).
- Sin raíl; el header muestra un menú compacto.
- `object-position` con el sujeto a la derecha (`--focus-x: 70–80%`) para que el texto no
  lo tape.
- Prueba en iPhone real: el primer seek tras cargar y el regreso hacia arriba.
