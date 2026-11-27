# Rendimiento, celular y tableta, y publicación

En el aula se usan celulares y tabletas de gama media o baja, a veces compartidos y con
red escolar lenta. Diseña y mide ahí primero.

## Índice
1. Presupuesto
2. Render: lo que más cuesta
3. Geometría, materiales y texturas
4. Celular y tableta (layout y gestos)
5. iOS Safari y Android
6. Publicación en GitHub Pages
7. Cómo medir

---

## 1. Presupuesto (4G, Android medio)

| Recurso | Objetivo |
|---|---|
| Primera pantalla útil (UI y botones) | < 2 s |
| Modelo 3D visible | < 3.5 s |
| Three.js (módulo min + OrbitControls) | ≈ 170 KB gzip; no sumes otras librerías 3D |
| JS propio | < 40 KB |
| Texturas totales | < 1.5 MB (celular) |
| Modelos `.glb` | < 2 MB con compresión |
| Llamadas de dibujo | < 100 (celular), < 300 (escritorio) |
| Triángulos | < 200 k (celular) |
| FPS al girar | 60 escritorio, ≥ 30 estable en celular |

Lo primero que se quita si no alcanza: partículas decorativas, sombras, antialias en
pantallas densas, segmentos de más.

## 2. Render: lo que más cuesta

- **Píxeles**: `setPixelRatio(Math.min(devicePixelRatio, táctil ? 1.5 : 2))`. Un iPhone a 3×
  dibuja 9 veces más píxeles que a 1× por casi ninguna mejora visible.
- **Antialias** solo si `dpr < 2`.
- **Sombras**: apagadas salvo que sean el concepto. Si lo son: una luz, `mapSize` 1024,
  `castShadow` solo en lo necesario.
- **Llamadas de dibujo**: cada `Mesh` es una. Piezas repetidas → `InstancedMesh`; piezas
  estáticas con el mismo material → `BufferGeometryUtils.mergeGeometries`.
- **Transparencias** y `AdditiveBlending` en miles de partículas grandes = sobre-dibujo; usa
  pocas y pequeñas.
- **Postprocesado** (bloom, SSAO): no en material escolar móvil.
- **Loop**: detenlo con `visibilitychange`. Si la escena está quieta mucho tiempo, puedes
  renderizar solo bajo demanda (al mover controles, animar o cambiar selección).

## 3. Geometría, materiales y texturas

- Esferas: 32–48 segmentos en celular, 64 en escritorio; objetos lejanos o pequeños, 16–24.
- Reutiliza geometrías y materiales (crearlos dentro de un `forEach` por pieza duplica memoria).
- Texturas potencia de 2, ≤ 2048 px (≤ 1024 en celular); `CanvasTexture` generada una vez.
- `.glb`: comprime con gltf-transform (`meshopt` o `draco`) y texturas a `webp`/KTX2.
- `dispose()` al reemplazar; WebGL no libera memoria solo.
- Lee `getComputedStyle` y medidas del DOM fuera del loop (en `resize`/al abrir el panel).

## 4. Celular y tableta

Diseña en este orden: **375×667 vertical → 768×1024 tableta → 1440×900 escritorio →
horizontal en celular**.

- Escena a pantalla completa con `height: 100dvh`; `body { overflow: hidden }` y
  `main { overflow-x: clip }`.
- `touch-action: none` solo en el contenedor del canvas.
- Dos dedos: OrbitControls hace zoom con pellizco; con `enablePan = false` no se pierde el
  modelo.
- Paneles: hoja inferior en < 900 px; lateral desde 900 px. Nunca `width` fija > 343 px en
  celular.
- Botonera inferior con `env(safe-area-inset-bottom)`; encabezado con `safe-area-inset-top`
  y `viewport-fit=cover`.
- Objetivos táctiles ≥ 44×44 px y separados ≥ 8 px.
- El modelo cabe en el lado angosto; en vertical calcula con el fov horizontal.
- Tableta en horizontal se comporta como escritorio (≥ 900 px): revisa que el panel lateral
  no tape el modelo (zona libre).
- Sin hover: todo lo que el hover muestra debe estar disponible al tocar.
- **Presupuesto vertical a 375×667**: encabezado ~100 px (+ recuadro 2D si lo hay, a la
  derecha del título), modelo ≥ 200 px, controles (`range` 44 px + etiqueta) y botonera. Si
  no cabe: nota de escala dentro del encabezado, botones de nombres cortos en una fila
  (`--chip-min: 90px`), y en quiz se oculta lo que no se usa (interaccion-y-ui.md §15).
- Texto sobre el modelo: nunca sin fondo. La plantilla pone una franja degradada tras el
  título en celular.

## 5. iOS Safari y Android

- **iOS**: `100vh` incluye la barra; usa `dvh`. Las pestañas en segundo plano pierden el
  contexto WebGL con frecuencia → `webglcontextlost` + plan B o recarga.
- **iOS < 16.4** no soporta importmap: si el público usa iPads viejos, usa vendor con rutas
  completas en los imports o agrega `es-module-shims` (versión fija) antes del importmap.
- **iOS** limita la memoria de canvas: texturas grandes o muchas pestañas → pantalla negra.
- **Android gama baja**: CPU 4× más lenta; prueba con *CPU throttling* 4× en DevTools.
- Doble toque para zoom de página: `touch-action` en el canvas lo evita; el resto de la UI
  usa botones normales.

## 6. Publicación en GitHub Pages

1. Estructura en la raíz del repositorio (o en `/docs`):
   ```
   index.html  styles.css  main.js  vendor/ (opcional)  assets/ (opcional)
   ```
2. **Rutas relativas** siempre (`styles.css`, `./vendor/...`), nunca `/styles.css`: el sitio
   vive en `https://usuario.github.io/repositorio/` y la ruta absoluta apunta a la raíz del
   dominio.
3. Settings → Pages → *Deploy from a branch* → rama principal → `/ (root)` o `/docs`.
4. Mayúsculas y minúsculas importan en los nombres (`Main.js` ≠ `main.js`), aunque en
   Windows/macOS funcione local.
5. Agrega un archivo vacío `.nojekyll` si alguna carpeta empieza con `_`.
6. Sin build ni `package.json` obligatorio. Si existe, que no sea necesario para servir.
7. Prueba la URL publicada en celular y con datos móviles (no solo en la red de casa).

Otras opciones: Netlify o Vercel (arrastrar carpeta), o un ZIP para la plataforma escolar
(Moodle admite paquetes HTML; Classroom solo enlaces). Para uso sin internet: vendor +
instrucciones de servidor local.

Metadatos mínimos: `<title>` y `description` con el tema, `lang` correcto, favicon inline
(SVG en data URI) y, si se comparte en redes, Open Graph con una captura 1200×630.

## 7. Cómo medir

- `scripts/verificar.cjs` (consola, desborde, 44 px, interacción, quiz) + revisar capturas.
- DevTools → Performance con CPU 4× y red "Fast 4G": FPS al girar, tiempo hasta el modelo.
- `renderer.info.render.calls` y `.triangles` en consola para el presupuesto de §1.
- Lighthouse móvil: rendimiento y accesibilidad (el canvas no cuenta para contraste;
  revisa a mano el texto sobre la escena).
- Un celular real de gama media, en vertical y horizontal, al menos una vez antes de entregar.
