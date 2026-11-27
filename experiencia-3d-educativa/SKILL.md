---
name: experiencia-3d-educativa
description: Convierte un tema de clase —ciencias, física, química, biología, geografía, astronomía— en una experiencia web 3D interactiva lista para publicar (Three.js sin build, objetos que se tocan, panel de información, mini quiz, celular y tableta, GitHub Pages). Úsala cuando un docente o desarrollador pida una actividad, simulación, explorador, modelo interactivo, recurso o material educativo en 3D, aunque no mencione Three.js ni WebGL.
---

# Experiencia 3D educativa (Three.js sin build)

Esta skill convierte un tema de clase en una página web 3D donde el alumno **aprende
tocando**: gira un modelo, toca sus partes, lee poco texto y comprueba lo que entendió con
un mini quiz. Plantilla sin build en `assets/`, detalle en `references/`, verificador en
`scripts/`.

## 0. Antes de escribir código: pregunta

No construyas sin estas respuestas. Hazlas en **un solo mensaje**, cortas, y ofrece un
valor por defecto en cada una para que se pueda contestar "lo que recomiendes".

1. **Tema** y el modelo que lo representa (p. ej. "las fases de la Luna" → Tierra, Luna y
   luz del Sol). Si no es obvio qué se dibuja, propón 2 opciones.
2. **Edad o grado** de los alumnos (define vocabulario, cantidad de texto y dificultad).
3. **Idioma** (uno o dos; ¿cambio sin recargar?).
4. **Conceptos que deben aprender**: 2 a 5 ideas concretas, escritas como "el alumno podrá…".
   Son la base del modelo, de los textos y del quiz.
5. **Quiz o preguntas**: ¿lleva? ¿cuántas? ¿cuentan para calificación o son de repaso?
6. **Dónde se publica**: GitHub Pages, la plataforma de la escuela (Classroom, Moodle,
   Teams), un proyector en clase, o se abre sin internet.

**Si el pedido ya trae lo esencial** (tema, edad y conceptos), no frenes el trabajo para
preguntar lo demás: usa los valores por defecto y **enlista al entregar cada decisión que
tomaste**, para que el docente la corrija.

| Falta | Valor por defecto |
|---|---|
| Idioma | El del pedido. Un solo idioma. |
| Edad | 10–12 años (primaria alta): frases cortas, sin tecnicismos sin explicar. |
| Conceptos | Los 3 más básicos del tema según programas escolares comunes; se listan al entregar para que el docente confirme. |
| Número de partes clicables | 3 a 6. Más de 7 satura en celular. |
| Quiz | Sí, 3 preguntas: 2 de opción múltiple + 1 de "toca en el modelo". De repaso, sin guardar resultados. |
| Publicación | GitHub Pages, HTML estático con la plantilla de `assets/`. |
| Three.js | Módulo ES por CDN con versión fija (0.160.0) + plan B sin 3D. |
| Estilo visual | Escena oscura neutra, paneles blancos, 1 acento; colores del modelo con significado (no decorativos). |
| Datos y cifras | Solo de fuentes verificables (ver §2). Si no se puede verificar: `[PENDIENTE: verificar …]` visible, nunca inventado. |
| Fuente por parte | Cada parte lleva su propia `fuente` (página concreta); `CONTENIDO.fuente` solo como respaldo. |
| Fuentes sin acceso a internet | Si no puedes abrir la fuente (red bloqueada), usa solo datos de referencia estables y **dilo en la entrega**: "fuentes citadas, no comprobadas en línea". |
| Formato de números | Español: punto decimal y coma de miles (`29.5`, `384,400`), igual en textos y en lo que genera el JS (`toLocaleString('es-MX')`). Otro país: pregunta. Nunca mezclar. |
| Aproximaciones | Primaria: "unos 150 millones". Secundaria en adelante: "≈ 150 millones". |
| Astronomía vista desde la Tierra | Hemisferio norte, con una línea visible: "en el hemisferio sur se ve al revés". |
| Tema de causa → efecto | Un control real (`<input type="range">` con `<label>`) + arrastre en 3D + una vista 2D del efecto que funciona sin 3D (§1.2). |
| Escala | Real cuando se pueda; si se exagera algo para verlo, se dice en pantalla. |
| Personaje o mascota | Ninguno, salvo que lo pidan (si lo piden: SVG propio, sin marcas ni personajes con derechos). |

Antes de tareas grandes, da un plan corto: el modelo (qué se dibuja y con qué geometrías),
las partes clicables, la secuencia de interacción y las preguntas. Al terminar cada paso,
di cómo verificarlo.

Lee según la tarea:
- `references/diseno-pedagogico.md` — de "conceptos" a interacción, textos por edad, quiz, fuentes.
- `references/threejs-escena-base.md` — carga, escena, cámara, controles, geometrías por tipo de tema.
- `references/interaccion-y-ui.md` — tap vs. arrastre, hover, panel, lista accesible, quiz, idioma.
- `references/rendimiento-movil.md` — presupuesto, celular y tableta, publicación en GitHub Pages.

## 1. La plantilla (`assets/`)

`index.html` + `styles.css` + `main.js`, sin build. Ejemplo incluido: **las capas de la
Tierra** (esfera con un octante cortado, 4 capas clicables, panel, quiz de 3 preguntas).
Sirve como modelo de calidad: cámbialo por el tema pedido.

```
index.html   importmap de Three.js, estructura: encabezado, escena, panel, quiz, botonera
styles.css   tokens en :root; móvil primero; hoja inferior en celular, panel lateral ≥ 900 px
main.js      1) CONTENIDO  2) UI sin 3D (botones, panel, quiz)  3) escena 3D (construirModelo)
```

Para adaptarla:
1. Reemplaza `CONTENIDO` (partes, datos, fuente por parte, quiz, textos). Único lugar con texto.
2. Reescribe `construirModelo(THREE, …)` cumpliendo el contrato de §1.1.
3. Ajusta la vista inicial (`VISTA`) y `acercamiento` por parte.
4. Cambia `<title>`, `description`, `aria-label` de la botonera y la nota de escala.
5. Si los nombres de las partes son cortos (≤ 8 letras), `--chip-min: 90px` para una sola fila.

### 1.1 Contrato de `construirModelo`

```js
return {
  grupo,              // THREE.Group con todo el modelo
  clicables,          // mallas que reciben toques; cada una con userData.id = CONTENIDO.partes[].id
  radio,              // radio de la esfera que envuelve el modelo (encuadre)
  acercamiento,       // opcional { id: 0.7…1 } — cuánto acercar al elegir cada parte
  medidas,            // opcional (aspect) => ({ ancho, alto }) — semiejes en pantalla para modelos
                      //   alargados (un sistema Sol–Tierra, una cadena): encuadre de caja, no de esfera
  orientar,           // opcional (vista, aspect) => void — gira el grupo: hacia el corte, o 90° en vertical
  /* + funciones propias del tema que use la UI, p. ej. moverLuna(grados) */
};
```

- Varias mallas pueden compartir id (todas las piezas de una parte) y material (se resaltan juntas).
- Piezas repetidas → `InstancedMesh` con id; piezas diminutas → zona de toque invisible
  más grande (`MeshBasicMaterial({ visible: false })`) en `clicables` con el mismo id.
- Objetos que emiten luz (`emissive`): el resaltado suma sobre su brillo propio, no lo borra.
- Si la luz **es** el concepto (fases, estaciones, sombras), quita la luz atada a la cámara
  y pon la luz dentro del modelo, en la posición física de la fuente.
- Aleatoriedad (posiciones de organelos, estrellas) con semilla fija.
- Modelo alargado en celular vertical: `orientar` lo gira 90° para que el eje largo quede
  vertical (la luz y las piezas giran con el grupo: la física no cambia).

### 1.2 Temas de causa → efecto (un control cambia el modelo)

Ejemplos: fases lunares, estaciones, palancas, circuitos, estados del agua. La plantilla
trae partes que se tocan; para estos temas agrega (detalle en `references/interaccion-y-ui.md` §11–13):
1. **Un solo punto de cambio** `ponerValor(v)` que llaman el control, el arrastre en 3D y el quiz.
2. **Control real**: `<input type="range">` con `<label>` visible, `aria-valuetext` con el
   estado ("Día 7: Cuarto creciente"), alto ≥ 44 px, en la botonera.
3. **Arrastre en 3D** del objeto a lo largo de su trayectoria (escucha `pointerdown` en
   **captura** sobre `#stage` y apaga OrbitControls mientras dura).
4. **Vista del efecto** (recuadro 2D en el encabezado: "así se ve desde…") dibujada con
   `<canvas>` 2D: es lo que se aprende y **funciona sin 3D**, así el plan B sigue enseñando.
5. Al mover el control, **cierra el panel de información** en modo explorar: en celular lo
   tapa todo y el alumno no ve el efecto.
6. Pregunta de quiz `tipo: 'ajustar'` con `comprobar()` (ver §2.6).

### 1.3 Ganchos para pruebas

`window.__experiencia = { escena }` y `escena.dondeEsta(id)` → punto de pantalla donde un
toque cae sobre esa parte. `verificar.cjs` lo usa para tocar cada parte en el modelo 3D.
Mantenlo al adaptar (también sirve para depurar desde la consola). Prueba el centro y
varios vértices de cada malla (en anillos y tubos el centro está vacío) y el verificador
espera a que la cámara deje de moverse antes de medir. Solo acepta puntos "firmes" (el
punto y sus vecinos a ±3 px dan la misma parte). Si reporta partes "sin zona firme para el
dedo" (ocultas o muy delgadas, p. ej. sacos del Golgi a 375 px): agrega una zona de toque
invisible más grande, muévelas a la vista o di en la instrucción que se eligen con su botón.

Qué ya resuelve la plantilla (no lo rompas al adaptar):
- **Un solo punto de entrada** `elegir(id)` para modelo 3D y botones: mismo resultado.
- **Tap vs. arrastre**: solo es clic si el puntero se movió < 8 px y en < 600 ms.
- **Hover** solo con ratón, procesado una vez por frame, con tooltip.
- **Zona libre**: el modelo se centra en el hueco que dejan encabezado, botonera y panel
  (`camera.setViewOffset`), en escritorio y en celular.
- **Plan B**: si Three.js no carga en 12 s, no hay WebGL o se pierde el contexto, se oculta
  la escena y botones, panel y quiz siguen funcionando.
- `prefers-reduced-motion`, objetivos táctiles ≥ 44 px, foco visible, Escape cierra,
  `aria-pressed` en los botones, `aria-live` en el feedback del quiz.
- Render detenido con la pestaña oculta, `pixelRatio` limitado (1.5 táctil / 2 ratón).

Pruébala con un servidor estático (`python3 -m http.server`), **nunca con `file://`**: los
módulos ES y el importmap no cargan desde disco.

## 2. Reglas pedagógicas

1. **La interacción enseña el concepto, no decora.** Cada gesto debe responder una pregunta
   del tema: cortar para ver el interior, mover un control para ver una causa y su efecto,
   comparar tamaños, ordenar etapas. Si quitas la interacción y el alumno aprende lo mismo
   leyendo, rediséñala. Ejemplos en `references/diseno-pedagogico.md` §2.
2. **Poco texto.** Por parte: un título, un resumen de 1–2 frases (≤ 30 palabras para
   primaria, ≤ 45 para secundaria) y 2–3 datos clave. Nada de párrafos en el panel.
3. **Datos científicos verificados, nunca inventados.**
   - Cada cifra sale de una fuente reconocible (agencia científica, museo, libro de texto
     oficial, enciclopedia académica). La fuente se muestra en el panel.
   - Usa "≈" y rangos cuando la ciencia da rangos. No redondees a algo falso.
   - Datos que cambian (número de lunas, población, récords): pon el año o evita la cifra.
   - Si no puedes verificar un dato: `[PENDIENTE: verificar …]` visible y en la lista de
     entrega. Es preferible a un dato plausible pero falso.
   - Las simplificaciones se dicen ("la corteza está dibujada más gruesa").
4. **Lenguaje adecuado a la edad**: verbos concretos, comparaciones con cosas conocidas
   ("se mueve lentísimo, como plastilina"), un término técnico por parte como máximo y
   explicado. Ver tabla por edad en la referencia.
5. **Sin errores conceptuales por estética**: colores, tamaños y movimientos no deben
   enseñar algo falso (órbitas a escala ≠ tamaños a escala; si mezclas escalas, dilo).
6. **El quiz mide los conceptos del §0**, no detalles de memoria. Al menos una pregunta se
   responde **interactuando con el modelo**: `tipo: 'tocar'` (toca la parte que…) o
   `tipo: 'ajustar'` (mueve el control hasta que…, con `comprobar: () => boolean` y
   opcional `alFallar()` que muestra la posición correcta). Cada respuesta tiene una
   explicación corta que corrige sin castigar ("Casi." + por qué).
7. **Neutral y genérico**: sin nombres de alumnos, docentes, escuelas ni marcas, salvo que
   el docente los dé para su propia versión.
8. **Cuidado con los absolutos**: "de cientos a miles de mitocondrias" es falso para algunas
   células (los glóbulos rojos maduros no tienen). Prefiere "varía según…; algunas tienen…".
   Simplificaciones como "instrucciones del ADN" → "instrucciones que vienen del ADN".
9. **Términos técnicos con apoyo concreto**: si la fase se llama "gibosa", muestra también
   "vemos iluminada: 75 %"; si dices "lípidos", añade "(un tipo de grasa)".

## 3. Reglas técnicas

### 3.1 Base
- Three.js como **módulo ES con versión exacta** vía `importmap`; `OrbitControls` desde
  `three/addons/`. Nada de `three@latest` ni librerías sin versión.
- Sin Tailwind por CDN, sin fuentes ni iconos externos imprescindibles: `system-ui` y SVG inline.
- Colores y medidas solo como tokens en `:root`. Textos solo en `CONTENIDO`.
- **La UI no depende del 3D**: `initUI()` corre antes de `init3D()`.
- Botones reales (`<button>`) para toda acción; nada de `div` clicables ni `onclick` inline.

### 3.2 Rendimiento (detalle en `references/rendimiento-movil.md`)
- `setPixelRatio(Math.min(devicePixelRatio, táctil ? 1.5 : 2))`.
- Geometrías con los segmentos justos (esferas 32–64); menos en celular.
- Muchas piezas iguales → `InstancedMesh` (una llamada de dibujo, no cientos).
- Sin sombras salvo que enseñen algo (eclipses, estaciones); entonces una sola luz con sombra.
- Partículas decorativas ≤ 5 000 en celular. Texturas ≤ 2048 px (1024 en celular).
- Detén el loop con la pestaña oculta; no leas layout dentro del loop.
- Libera (`dispose()`) geometrías, materiales y texturas que reemplaces.

### 3.3 Celular y tableta
- Diseña primero a 375×667 y en vertical; luego tableta (768–1024) y escritorio.
- Todo lo que hace el ratón se puede hacer con el dedo: nada solo con `wheel` o hover.
- `touch-action: none` en el canvas (lo maneja OrbitControls); el resto de la página no.
- Panel como **hoja inferior** en celular y lateral desde 900 px; nunca anchos fijos
  que se salgan (`x − 420 px` en una pantalla de 375 px).
- `100dvh`, `env(safe-area-inset-*)`, objetivos táctiles ≥ 44 px.
- El modelo debe caber en el lado más angosto (calcula con el fov horizontal en vertical).

### 3.4 Accesibilidad
- El canvas es `aria-hidden`; **la lista de botones de partes es la alternativa** de
  teclado y lector de pantalla y debe dar exactamente lo mismo que tocar el modelo.
- Foco visible, orden lógico, Escape cierra, el foco va al título del panel al abrirlo
  desde teclado.
- Estado del quiz con texto y símbolo (✓ ✗), no solo color; feedback en `aria-live`.
- Contraste AA en todo texto; texto sobre la escena con sombra o fondo.
- `prefers-reduced-motion`: sin transiciones de cámara ni giros automáticos.

### 3.5 Si el CDN falla o no hay WebGL
- `import()` dinámico dentro de `try/catch` con **timeout** (12 s); WebGLRenderer en `try`;
  escucha `webglcontextlost`.
- En cualquiera de esos casos: clase `no-3d` en `<html>`, mensaje claro y la actividad
  sigue con botones, panel y quiz (las preguntas de "toca el modelo" se responden con los botones).
- Para no depender del CDN (escuela con red filtrada, uso sin internet): copia la misma
  versión a `vendor/three/` y cambia el importmap (`references/threejs-escena-base.md` §1).
- Todo fetch de datos (GeoJSON, JSON) con `.catch` que muestre un error útil y quite el loader.

## 4. Errores comunes que hay que evitar

Salieron de revisar proyectos educativos reales en Three.js. Revísalos antes de entregar.

**Interacción**
1. **Navegación solo con rueda del ratón**: en celular la experiencia queda congelada.
2. **Arrastrar para girar abre el panel**: no distinguir tap de arrastre.
3. **`div` clicables encima del canvas** sin teclado ni rol; usa `<button>`.
4. **Clics durante una transición** que encadenan animaciones: candado o cancelar la anterior.
5. **Rotaciones que dan vueltas de más** al volver: normaliza con `Math.atan2(sin d, cos d)`.
6. **Controles que se pelean** (slider ↔ OrbitControls): bandera mientras se arrastra uno.
7. **Botón de "alejar" con `Math.max` en lugar de `Math.min`** (o al revés): pruébalos
   los dos, no solo uno.

**Layout**
8. **Paneles con ancho o posición fijos** en px que se salen en 375 px.
9. **`100vh`** en celular (la barra del navegador lo cambia): `100dvh`.
10. **Etiquetas proyectadas desde 3D sin ocultarlas** detrás de la cámara (`z > 1`) o
    durante la intro.
11. **Panel que tapa el modelo** en celular: centra el modelo en la zona libre.

**Rendimiento**
12. `setPixelRatio(devicePixelRatio)` sin límite (3× en iPhone = 9× píxeles).
13. Sombras activadas sin objetos que las proyecten; esferas de 64×64 para objetos de 10 px.
14. Cientos de `Mesh` sueltos para piezas repetidas en vez de `InstancedMesh`.
15. 60 000 partículas "porque se ve bonito" en un celular de gama media.
16. Loop de render corriendo con la pestaña oculta.

**Carga**
17. **Sin plan B**: CDN bloqueado o sin WebGL → pantalla negra.
18. `fetch` sin `.catch`: loader infinito.
19. Librerías sin versión (`@latest`), Tailwind por CDN en producción, imágenes de fondo
    servidas desde CDNs de ejemplos de terceros.
20. Abrir con `file://`: los módulos no cargan. Siempre servidor estático.

**Contenido**
21. **Datos viejos o falsos** presentados como actuales (número de lunas, "el ADN es
    código binario", temperaturas sin decir de qué parte).
22. **Textos de relleno** genéricos ("ha vivido transformaciones muy interesantes"): si no
    hay dato real para esa parte, no la hagas clicable o marca `[PENDIENTE]`.
23. Escalas mezcladas sin avisarlo.
24. Párrafos largos en el panel; vocabulario por encima de la edad.
25. Números con formato mezclado ("29,5" en el control y "29.5" en el panel) porque el JS usa
    `toLocaleString('es')`: fija el locale (`'es-MX'`) en todo.

**Encontrados al construir con la plantilla** (ya corregidos en ella; no los reintroduzcas)
26. **Resaltado que apaga lo que brilla**: poner `emissive = 0` al deseleccionar deja el Sol
    "medio apagado". Suma sobre el `emissive` original.
27. **Radio del modelo fijo en el código de cámara**: un modelo de otro tamaño queda cortado
    o diminuto. El radio lo da `construirModelo`.
28. **Modelo alargado encuadrado como esfera**: mucho espacio vacío; y al abrir el panel
    lateral se sale por un lado. Usa `medidas()` y encuadra después de abrir el panel.
29. **Materiales sin `emissive`** (zonas de toque invisibles) rompen el resaltado si no se omiten.
30. **Texto encima del modelo en celular** (título o nota de escala sin fondo): contraste
    ilegible. Nota de escala en el encabezado y franja de fondo tras el título.
31. **Quiz que no cabe en celular**: 4 opciones + botonera de 3 filas. En preguntas que no se
    responden tocando, se oculta la botonera y la hoja crece.
32. **Panel de información tapando el efecto** mientras se mueve un control.
33. **Partes que no se pueden tocar en la vista inicial** (dentro de otras, detrás): o se
    ven desde el corte, o se dice en la instrucción que se eligen con su botón.

## 5. Flujo de trabajo recomendado

1. Preguntas (§0) → plan corto: modelo, partes, interacción clave, preguntas.
2. Escribir `CONTENIDO` primero (textos y datos con fuente). Revisar con la tabla de edad.
3. Copiar `assets/` y construir el modelo con primitivas; probar clic en cada parte.
4. Ajustar encuadre en 375×667 vertical y 1440×900.
5. Quiz: al menos una pregunta de "toca en el modelo".
6. Rendimiento, accesibilidad, plan B.
7. Verificar (§6) y publicar (`references/rendimiento-movil.md` §6).

## 6. Verificación antes de entregar

`scripts/verificar.cjs` (Playwright) a 1440×900 con ratón y 375×667 táctil reporta consola,
peticiones fallidas, desborde horizontal, objetivos táctiles < 44 px (también `range`), y
prueba: cada botón abre el panel, **tocar cada parte en el modelo 3D abre su panel** (con
`dondeEsta`), un arrastre no lo abre, Escape cierra y el quiz llega al resultado (opción,
tocar y ajustar). Guarda capturas. No prueba arrastres de objetos ni que el efecto sea
correcto: eso, a mano o con un script corto (§1.3) y revisando capturas.

```bash
python3 -m http.server 8000
```

```bash
node scripts/verificar.cjs http://localhost:8000/ --out capturas
```

Opciones: `--no3d` (bloquea Three.js para probar el plan B), `--reduced` (movimiento
reducido), `--libs DIR` (sirve `three@x.y.z/<ruta>` desde una copia local cuando el CDN está
bloqueado: carpeta `package/` de `npm pack three@0.160.0`). Contrato con la página:
`html.webgl-ok|no-3d`, `#stage`, `[data-objeto]`, `#panel`, `#panel-titulo`,
`[data-quiz-abrir]`, `#quiz`, `.opcion`, `[data-comprobar]`, `#quiz-siguiente`,
`[data-quiz-resultado]` y, opcional, `window.__experiencia.escena.dondeEsta(id)`.

- [ ] `verificar.cjs` sin ✗ en modo normal, `--no3d` y `--reduced`; **capturas revisadas**.
- [ ] Cada parte se puede elegir tocando el modelo y con su botón; mismo resultado.
- [ ] Celular real o emulado en vertical y horizontal; tableta a 768 y 1024 px.
- [ ] Todos los datos tienen fuente (por parte); ningún `[PENDIENTE]` sin listar; si no
      pudiste abrir las fuentes, dilo.
- [ ] Si hay un control: el efecto es correcto en varios valores (revisa capturas en
      0 %, 25 %, 50 %, 75 %) y funciona con teclado (flechas en el `range`).
- [ ] Textos revisados contra la edad (§2.4); el quiz mide los conceptos del §0.
- [ ] Consola limpia; funciona servido desde una subcarpeta (como en GitHub Pages).

**Entrega siempre**: el enlace o cómo correrlo localmente, los conceptos que cubre, las
fuentes usadas (y si se comprobaron en línea), los `[PENDIENTE]`, y **la lista de decisiones
que tomaste por tu cuenta** (edad supuesta, conceptos y partes elegidas, escala y qué se
exageró, hemisferio, formato de números, número y tipo de preguntas, colores, publicación).
