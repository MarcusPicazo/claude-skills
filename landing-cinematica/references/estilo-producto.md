# Estilo "producto / startup"

Para apps, SaaS, hardware, lanzamientos y listas de espera. La página vende una promesa:
mucha energía visual, secciones que se ensamblan al entrar y dos o tres momentos fijados
que son "el show". Plantilla: `assets/estilo-producto/`.

## Índice
1. Carácter visual
2. Estructura de secciones
3. Fondo vivo (WebGL o CSS)
4. Hero
5. Momentos fijados ("el show")
6. Secciones de contenido que se ensamblan
7. Tarjetas bento y vidrio
8. Conversión: lista de espera, descarga, demo
9. Extras opcionales (cursor, gráficas, aviso de scroll)
10. Ajustes para móvil

---

## 1. Carácter visual

- Fondo de color de marca saturado u oscuro, texto claro, mucho contraste.
- Tipografía sans geométrica o grotesca, pesos 700–800 en titulares, tracking negativo
  (`-0.04em`), titulares enormes (`clamp(3rem, 9vw, 8rem)`).
- Superficies de vidrio: fondo blanco al 4–8 %, borde blanco al 5–15 %, `backdrop-filter`.
- Botones píldora; el principal en blanco (o el acento) con texto oscuro.
- Movimiento: entradas scrubeadas (reversibles), easings `power2.out` y `back.out(1.4–1.7)`
  para piezas que "encajan".

## 2. Estructura de secciones (adapta, no copies todas)

| # | Sección | Rol | Animación típica |
|---|---|---|---|
| 1 | Hero | promesa + CTA | contenido se agranda y desvanece al bajar (`scale 1.5, opacity 0`, scrub) |
| 2 | Promo (opcional) | el producto en acción | secuencia de imágenes en canvas, fijada 300–400vh, 3–4 textos encima |
| 3 | Ecosistema / qué es | 3–4 pilares | tarjetas bento con cascada |
| 4 | Manifiesto | una frase fuerte | letras que se encienden + zoom ×60 que "atraviesa" el texto, fijado 400–480vh |
| 5 | Problema | el dolor, con datos reales | dos columnas que convergen; gráfica al entrar |
| 6 | Solución / tecnología | 3 filas de features | número → ícono con rebote → título → texto |
| 7 | Para empresas (opcional) | segundo público | tarjetas con giro 3D |
| 8 | Momento de marca (opcional) | palabras clave | espiral 3D de palabras, fijado 400vh |
| 9 | Lista de espera / CTA | conversión | formulario + contadores (solo cifras reales) |
| 10 | Equipo (opcional) | confianza | protagonistas desde los lados, resto "se asienta" rotando |
| 11 | Descarga / demo | conversión final | tarjetas que se voltean, cuadrícula desde las esquinas |
| 12 | Pie | legales, redes, idioma | — |

Regla: máximo 2–3 secciones fijadas largas. Entre ellas, secciones cortas de contenido
para que el ritmo respire.

Si te piden secciones que no están en la tabla, combina piezas de la plantilla:
- **Problema sin datos reales**: manifiesto fijado con la frase del dolor + dos tarjetas
  "Hoy / Con [producto]" que convergen. Sin porcentajes inventados.
- **Cómo funciona**: las filas numeradas (`.rows`) con 3 pasos.
- **Funciones**: bento con una tarjeta protagonista (puede llevar un mini mockup en HTML,
  p. ej. una lista de 3 pendientes, en vez de una captura que no existe).
- **Testimonios**: `.quotes` con `[data-flip-row]`; reales o, en demo, marcados como
  ejemplo (SKILL.md §0).
- **Lista de espera**: la tarjeta `.waitlist` con el formulario de la plantilla.

## 3. Fondo vivo

**Opción A — WebGL (shader de ruido)**, un solo quad a pantalla completa, fijo detrás de
todo (`position: fixed; inset: 0; z-index: -1; pointer-events: none`):
- `OrthographicCamera(-1,1,1,-1,0,1)` + `PlaneGeometry(2,2)` + `ShaderMaterial`.
- Uniforms: `u_time`, `u_scroll` (scroll normalizado y suavizado con lerp 0.05),
  `u_resolution`. Mezcla 3 tonos de la paleta con dos capas de simplex noise.
- `antialias: false`, DPR ≤ 2, `alpha: true`, `powerPreference: 'high-performance'`.
- Cachea `scrollMax`; recalcula en `resize` (debounce) y en `ScrollTrigger` `refresh`.
- Opacidad del canvas 0.5–0.7 para que no compita con el texto.

**Opción B — CSS** (recomendada en móvil o si no hay presupuesto): 2–3 `radial-gradient`
grandes animando `transform` lentamente (20–40 s), o un `conic-gradient` girando. La
plantilla usa esta opción por defecto y deja el gancho para WebGL.

Video de fondo en el hero: solo si es decorativo, `muted loop playsinline`, opacidad
baja, y con `preload="none"` + póster en móvil.

## 4. Hero

- Una frase de beneficio (≤ 8 palabras), un subtítulo (≤ 20), CTA principal + secundario.
- Composición en escritorio: titular a un lado, mockup o visual al centro/derecha; en
  móvil todo apilado y centrado, el visual debajo del CTA.
- Al bajar, `.hero-content` → `scale: 1.5, opacity: 0, ease: 'power2.in'`, scrub 1, de
  `top top` a `bottom top`. Da la sensación de "entrar".
- Etiqueta pequeña tipo píldora arriba del titular ("Beta abierta", "Nuevo").

## 5. Momentos fijados ("el show")

### 5.1 Manifiesto con zoom

Sección `height: 400–480vh`, hijo sticky `100vh` con `overflow: hidden`. El texto se parte
en letras (dentro de palabras `inline-block`). Timeline scrubeado (scrub ~1.3):

```js
tl.to(chars, { opacity: 1, y: 0, scale: 1, stagger: 0.02, ease: 'power2.out', duration: 3 })
  .to(wrap,  { scale: 1, duration: 1.5 })                       // pausa de lectura
  .to(wrap,  { scale: 60, ease: 'power4.in', duration: 4 })     // atraviesa el texto
  .to(wrap,  { opacity: 0, ease: 'power2.in', duration: 2 }, '<');
```

- Escala y opacidad en tweens separados que arrancan juntos: la opacidad (`power2.in`) se
  mantiene alta al inicio y cae antes de que la escala recorte el texto.
- Estado inicial de las letras (`opacity: 0.1; translateY(10px)`) puesto al crearlas.
- Si cambia el idioma, vuelve a partir el texto y **mata y recrea** el timeline.

### 5.2 Secuencia de imágenes (promo del producto)

Sección `height: 400vh`, sticky con dos canvas: uno principal 16:9 centrado (con margen
para el header) y uno de fondo con el mismo cuadro difuminado (`blur(25px) saturate(1.3)
brightness(.7)` escalado 1.2) para que el color se extienda sin borde duro. 3–4 textos se
cruzan por tramos (fade de 18 % del tramo en la entrada y la salida). Detalle técnico en
`rendimiento-movil.md` §5.

### 5.3 Espiral 3D de palabras

Contenedor con `perspective: 1200px` y `transform-style: preserve-3d`; 30–35 palabras
colocadas con `rotateY(i*35deg) translateZ(radio) translateY(offset)`; alterna relleno y
contorno (`-webkit-text-stroke`). Scroll → `rotationY: -720, y: -3000` (móvil `-2000`,
radio 180 vs 380), `ease: 'none'`, scrub 2–2.4 (mucha inercia: es decorativo).
Cuidado con el desborde horizontal en móvil.

## 6. Secciones de contenido que se ensamblan

Genérico para todo `[data-up]`: `y: 40 → 0, opacity 0 → 1`, `start: 'top bottom'`,
`end: 'top 80%'`, scrub 0.6. Termina pronto para dejar tiempo de lectura.

Cascada en una fila: reutiliza un `data-delay` (0, 0.1, 0.2, 0.3) como desfase de
`start` en px (`delay * 150`). No más: con offsets grandes la última tarjeta termina de
aparecer cuando el usuario ya se fue.

Coreografías por sección (una distinta en cada una, para que no se sienta repetido):
ver `gsap-lenis-setup.md` §5 (convergencia, giro 3D, esquinas, "se asienta").

Paneles completos: además de las piezas, cada `.panel` sube 50 px y aparece con scrub 1
entre `top 95%` y `top 20%`. Excluye los fijados y el hero.

## 7. Tarjetas bento y vidrio

```css
.card {
  background: linear-gradient(145deg, rgb(255 255 255 / .05), rgb(255 255 255 / .01));
  border: 1px solid rgb(255 255 255 / .06);
  border-radius: 2rem;
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  box-shadow: 0 4px 24px -1px rgb(0 0 0 / .1), inset 0 1px 0 rgb(255 255 255 / .15);
  transition: transform .5s var(--ease), background .5s var(--ease), border-color .5s var(--ease);
}
.card:hover { transform: translateY(-6px); will-change: transform; }
```

- Cuadrícula bento: 6 o 12 columnas, tarjetas que abarcan 2–4, una protagonista más grande.
- En móvil: 1 columna, `backdrop-filter` más suave (12px) o sustituido por fondo al 8 %.

## 8. Conversión

- Un CTA principal repetido (hero, mitad, final) con el mismo texto.
- Lista de espera: formulario mínimo (correo + 1 campo opcional), estado de éxito en la
  misma tarjeta, sin recargar. Ya está en la plantilla (`#waitlist-form`):
  - `data-endpoint=""` → **modo demo**: valida, muestra el éxito con "(Demo: no se envió
    nada.)" y no envía. Úsalo si el usuario no dio backend, y dilo en la entrega.
  - `data-endpoint="https://formspree.io/f/…"` (o Netlify Forms / propio) → `POST` con
    `FormData` y `Accept: application/json`; error visible si falla.
  - Mensajes en `data-msg-ok`, `data-msg-invalid`, `data-msg-error` (textos en el HTML).
  - `novalidate` + validación propia con `aria-invalid` y `role="status" aria-live="polite"`;
    candado contra doble envío; funciona aunque GSAP no cargue.
- Descarga: detecta plataforma (`navigator.userAgent`) para destacar la opción correcta;
  archivos pesados con `Content-Type` correcto en el hosting (`_headers`).
- Contadores o estadísticas: **solo cifras que dé el usuario**. Anima de 0 al valor con
  `gsap.to(obj, { val, snap: 'val', onUpdate })` al entrar, una vez.

## 9. Extras opcionales

- **Cursor propio** (solo `pointer: fine`): punto 1:1 + anillo con lerp 0.45, los dos
  escritos en `gsap.ticker`; `mix-blend-mode: difference`; crece en `a, button`; variante
  "precisa" para objetivos pequeños. Sin `transition` en `transform` del punto (se
  separaría del anillo).
- **Gráficas** (Chart.js u otra): crea la gráfica con `ScrollTrigger` `once: true` al entrar.
- **Aviso de scroll**: "Empieza a bajar" en el hero / "Sigue bajando" después; aparece
  tras 1 s sin scroll y se oculta al llegar al final.
- **Navbar flotante**: transparente arriba; tras 50 px, píldora de vidrio y altura menor.
  Menú móvil propio (el de escritorio se oculta bajo `md`).
- **Escena de partículas** en la lista de espera (Three.js `Points`), pausada con IO.

## 10. Ajustes para móvil

- Sin fondo WebGL o a DPR 1; sin cursor; espiral con menos palabras y radio menor.
- Secciones fijadas más cortas (300vh en vez de 480vh) y textos del manifiesto más cortos.
- Secuencia de imágenes a 640×360.
- Tarjetas a una columna; coreografías laterales con `x` más chico (±30 en vez de ±70).
  Ojo: **±30 no evita el desborde** (una tarjeta a todo el ancho con 20 px de margen se sale
  10 px), y el hero con `scale: 1.5` siempre se sale. Lo que lo evita es
  `main { overflow-x: clip }` (en la plantilla). Verifica a 375 px con `scripts/verificar.cjs`.
- El menú móvil es la única navegación: todas las secciones del menú de escritorio deben
  estar ahí, más el CTA.
