# Three.js: escena base, cámara, controles y modelos por tipo de tema

Referencia técnica de la parte 3D. La plantilla (`assets/main.js`) ya implementa todo lo de
las secciones 1–6; aquí está el porqué y las variantes.

## Índice
1. Carga de Three.js (CDN, vendor, sin internet)
2. Arranque defensivo (timeout, WebGL, contexto perdido)
3. Renderer, escena y luces
4. Cámara y encuadre que se adapta a la pantalla
5. OrbitControls
6. Transiciones de cámara sin librerías
7. Modelos por tipo de tema (recetas)
8. Texturas procedurales (sin imágenes)
9. Etiquetas HTML sobre objetos 3D
10. Limpieza de memoria

---

## 1. Carga de Three.js

**CDN con versión exacta** (la plantilla):

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
} }
</script>
<script type="module" src="main.js"></script>
```

- El importmap va **antes** de cualquier `<script type="module">`.
- `three` y `three/addons/` deben ser **la misma versión**; si no, los addons importan otra
  copia de Three y fallan en silencio (objetos que "no son" `THREE.Object3D`).
- No uses el build UMD viejo (`three.min.js` r128 + `THREE.` global): los addons modernos ya
  no existen en ese formato y la API cambió (`outputEncoding` → `outputColorSpace`).

**Vendor (sin depender del CDN)** — escuelas con red filtrada, uso sin internet, producción:

```bash
npm pack three@0.160.0 && tar xzf three-0.160.0.tgz
```

```bash
mkdir -p vendor/three/build vendor/three/examples && cp package/build/three.module.min.js vendor/three/build/ && cp -r package/examples/jsm vendor/three/examples/ && rm -rf package three-0.160.0.tgz
```

Y en el importmap: `"three": "./vendor/three/build/three.module.min.js"`,
`"three/addons/": "./vendor/three/examples/jsm/"`. Copia solo los addons que uses si el
peso del repo importa (`controls/OrbitControls.js` basta para la plantilla).

**Sin internet en el aula**: vendor + abrir con un servidor local (`python3 -m http.server`);
`file://` no carga módulos.

## 2. Arranque defensivo

```js
async function init3D() {
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('CDN lento')), ms));
  let THREE, OrbitControls;
  try {
    [THREE, { OrbitControls }] = await Promise.race([
      Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]),
      timeout(12000),
    ]);
  } catch (err) { return sin3D(err); }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch (err) { return sin3D(err); }                       // sin WebGL
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sin3D('contexto perdido'); });
  // …
}
initUI();   // primero: no depende de Three
init3D();
```

- Usa `import()` dinámico, no `import * as THREE from 'three'` arriba del archivo: un import
  estático que falla mata **todo** el módulo, incluida la UI.
- `sin3D()` agrega `html.no-3d`, oculta la escena, muestra el aviso y cambia la instrucción.
- `webglcontextlost` pasa en celulares con poca memoria o al volver de otra app.

## 3. Renderer, escena y luces

```js
const tactil = matchMedia('(pointer: coarse)').matches;
const dpr = Math.min(devicePixelRatio || 1, tactil ? 1.5 : 2);
renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

- Con `dpr ≥ 2` el antialias casi no se nota y cuesta mucho: apágalo.
- Fondo: `scene.background = new THREE.Color(token)`, leído del CSS para no duplicar colores.
- **Luces didácticas**: `HemisphereLight` suave + una `DirectionalLight` **hija de la cámara**
  (`camera.add(luz); scene.add(camera)`). Así la cara que el alumno mira siempre está
  iluminada. Excepción: si la luz **es** el concepto (fases lunares, estaciones, eclipses),
  la luz es fija en la posición física del Sol y no se ata a la cámara.
- Materiales: `MeshStandardMaterial` con `roughness` 0.6–0.9 y `metalness: 0` para colores
  legibles. `MeshBasicMaterial` para cosas que emiten luz (una estrella) o líneas guía.
- Sombras solo si enseñan algo; entonces una sola luz con `castShadow` y `shadow.mapSize` 1024.

## 4. Cámara y encuadre

`PerspectiveCamera(40, aspect, 0.1, far)` — fov 35–45 deforma poco y se ve "de libro".
`near`/`far` lo más ajustados posible (con `far` de millones hay z-fighting).

**Que el modelo quepa en cualquier pantalla**: en vertical el lado angosto es el ancho.

```js
const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
const tv = t * (zona.h / H);                 // fov vertical de la zona libre
const th = t * (W / H) * (zona.w / W);       // fov horizontal de la zona libre
const distancia = radioModelo / Math.sin(Math.atan(Math.min(tv, th)));
```

**Zona libre**: el hueco que no tapan encabezado, botonera ni panel. El modelo se centra ahí
con `camera.setViewOffset(W, H, dx, dy, W, H)`, que desplaza el dibujo sin mover la cámara
(no rompe OrbitControls). La plantilla anima `dx, dy` al abrir/cerrar el panel. Recuerda
llamar `reencuadrar()` después de cualquier cambio de UI que cambie esa zona.

**Vista inicial**: elige el ángulo que muestra el concepto (el corte, la órbita de lado, la
cara iluminada). Guárdala como vector (`VISTA`) y vuelve a ella al elegir una parte.

## 5. OrbitControls

```js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.enablePan = false;                       // el alumno no "pierde" el modelo
controls.minDistance = …; controls.maxDistance = …;
controls.rotateSpeed = tactil ? 0.7 : 1;
// opcional: controls.minPolarAngle / maxPolarAngle para no ver "por debajo"
```

- Con damping hay que llamar `controls.update()` en cada frame.
- `controls.addEventListener('start', cancelarAnimacionDeCamara)`: si el alumno toca, manda él.
- `touch-action: none` en el contenedor del canvas.
- `autoRotate` solo en pantalla de inicio o modo proyector, y nunca con movimiento reducido.
- Para temas "de recorrido" (de lo grande a lo pequeño, una secuencia de lugares) usa
  **paradas**: un arreglo de `{ posicionCamara, objetivo }` y un slider o botones
  anterior/siguiente que interpolan entre paradas. Más fácil de usar en clase que el giro libre.

## 6. Transiciones de cámara sin librerías

```js
const ease = (t) => (t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2);
function moverCamara(destino, ms = 900) {
  if (reduceMotion) { camera.position.copy(destino); controls.update(); return; }
  anim = { desde: camera.position.clone(), hasta: destino.clone(), t0: performance.now(), ms };
}
// en el frame:
if (anim) { const k = Math.min(1, (now - anim.t0) / anim.ms);
  camera.position.lerpVectors(anim.desde, anim.hasta, ease(k)); if (k === 1) anim = null; }
```

- Si también rotas un objeto, normaliza la diferencia de ángulo para ir por el camino corto:
  `const d = Math.atan2(Math.sin(meta - actual), Math.cos(meta - actual))`.
- Si necesitas coreografías largas con muchas piezas, GSAP está bien; para una cámara, no.

## 7. Modelos por tipo de tema

Construye con primitivas: se carga al instante, se ve limpio y cada parte es fácil de
tocar. Usa modelos `.glb` solo si la forma es el concepto (un esqueleto, un órgano) y
pesan < 2 MB (Draco/Meshopt).

| Tipo de tema | Modelo | Interacción que enseña |
|---|---|---|
| Estructura interna (Tierra, célula, átomo, fruto) | Esferas/cápsulas anidadas con un corte (`SphereGeometry` con `phiLength`/`thetaLength` + caras planas con `RingGeometry`) | Tocar capas; abrir/cerrar el corte con un slider |
| Sistema con órbitas (planetas, electrones, lunas) | `Group` por cuerpo + `RingGeometry` fina para la órbita | Slider de tiempo; comparar periodos; escala real vs. legible (botón) |
| Causa → efecto (fases, estaciones, palancas, circuitos) | Pocas piezas + una luz o fuerza explícita | Mover la causa (slider, arrastrar) y ver el efecto en vivo |
| Proceso o ciclo (ciclo del agua, mitosis, cadena trófica) | Etapas en un anillo o línea | Botones anterior/siguiente; ordenar etapas en el quiz |
| Comparación de tamaños o cantidades | Objetos alineados a escala | Botón "a escala real"; etiqueta con la razón (×10) |
| Superficie geográfica | Esfera con textura o polígonos extruidos (librería de globos) | Tocar regiones; capas (relieve, clima) |
| Moléculas y estructuras repetidas (ADN, cristales) | `InstancedMesh` para átomos/enlaces + marcadores clicables | Tocar marcadores; girar; resaltar un tipo |

Receta del corte (plantilla): por cada capa, hemisferio sur completo
(`SphereGeometry(r, s, s/4, 0, 2π, π/2, π/2)`), hemisferio norte sin un cuarto
(`…, 0, 1.5π, 0, π/2`), dos `RingGeometry(rInt, rExt, …, 0, π/2)` verticales girados
`π + φ` en Y, y un piso `RingGeometry(…, π/2, π/2)` girado `-π/2` en X. Todas las piezas de
la capa comparten material y `userData.id`.

**Piezas repetidas**: `InstancedMesh(geo, mat, n)` + `setMatrixAt(i, m)`; para saber cuál
se tocó, `hit.instanceId`. Para colores por instancia: `setColorAt`.

## 8. Texturas procedurales

Para planetas, rocas, brillos, halos: dibuja en un `<canvas>` 2D y usa `CanvasTexture`
(`texture.colorSpace = THREE.SRGBColorSpace`). Ventajas: cero descargas, sin derechos de
imagen. Límites: 1024×512 en celular; genera una sola vez; si usas `Math.random()`, usa una
semilla fija si el resultado debe ser igual en todas las pantallas del aula.
Si la textura es **información** (un mapa real), no la inventes: usa datos reales con licencia.

## 9. Etiquetas HTML sobre objetos 3D

```js
obj.getWorldPosition(v); v.project(camera);
const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
el.style.transform = `translate(${(v.x + 1) / 2 * W}px, ${(1 - v.y) / 2 * H}px) translate(-50%, -100%)`;
```

- Oculta las que están detrás de la cámara o fuera de pantalla, y durante transiciones.
- Si la etiqueta es clicable, debe ser `<button>` y existir también en la lista accesible.
- Con más de 6 etiquetas visibles a la vez, muestra solo la seleccionada o la cercana.
- Escribe `transform` una vez por frame; no `left/top` (provoca layout).

## 10. Limpieza

Al reemplazar un modelo (cambio de nivel, de modo): `geometry.dispose()`,
`material.dispose()`, `texture.dispose()` y quítalo de `clicables`. Si no, la memoria de la
GPU crece y el celular pierde el contexto WebGL.
