# Interacción y UI: tocar, panel, lista accesible, quiz e idioma

## Índice
1. Un solo punto de entrada: `elegir(id)`
2. Tap vs. arrastre
3. Hover (solo ratón)
4. Resaltar la selección
5. La lista de partes (alternativa accesible)
6. Panel de información
7. Mini quiz
8. Pantalla de inicio (opcional)
9. Cambio de idioma (opcional)
10. Controles extra: sliders, paradas, botones de escala

---

## 1. Un solo punto de entrada

Todo lo que selecciona una parte —tocar la malla, un botón de la lista, una etiqueta, una
pregunta del quiz— llama a la **misma** función:

```js
function elegir(id, { desdeBoton = false } = {}) {
  if (estado.modo === 'quiz') return responderSiToca(id);
  marcarChips(id); escena?.seleccionar(id); escena?.enfocar(id); mostrarPanel(id, desdeBoton);
}
```

Así el modelo 3D y la lista dan **exactamente** el mismo resultado, y el plan B sin 3D
funciona sin código extra (`escena` es `null`).

## 2. Tap vs. arrastre

OrbitControls usa el mismo gesto para girar. Si seleccionas en `click`, cada giro termina
abriendo el panel. Solución: es clic solo si el puntero casi no se movió y fue rápido.

```js
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const movio = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8;
  const lento = performance.now() - down.t > 600;
  down = null;
  if (!movio && !lento) { const id = idBajo(e.clientX, e.clientY); if (id) elegir(id); }
});
```

- Raycasting contra una **lista de mallas clicables** (`intersectObjects(clicables, false)`),
  no contra toda la escena (más lento y atrapa fondos, estrellas, órbitas).
- Objetos pequeños en celular: agrega una malla invisible más grande como zona de toque
  (`material.visible = false` sigue recibiendo raycast) o un marcador con halo.
- Coordenadas desde `canvas.getBoundingClientRect()`, no desde `innerWidth` (con
  `setViewOffset` el raycaster sigue funcionando porque usa la proyección de la cámara).

## 3. Hover

- Solo si `e.pointerType === 'mouse'`; en táctil no existe y "pega" estados.
- Guarda el último `pointermove` y procésalo **una vez por frame** en el loop.
- Hover = resaltar suave + tooltip con el nombre + `cursor: pointer`. Nunca información que
  solo aparezca con hover.
- `pointerleave` limpia todo.

## 4. Resaltar la selección

- Seleccionada: `emissive = color × 0.4`. Hover: `× 0.2`.
- Las demás: **oscurecer** (`color × 0.45`), no volver transparentes: la transparencia en
  objetos anidados produce errores de orden de dibujo (capas que desaparecen al girar).
- Si la transparencia es el concepto (ver el interior), úsala en una sola capa externa,
  con `depthWrite: false`.
- Comparte material entre las piezas de una misma parte para resaltarlas juntas.

## 5. La lista de partes

Fila (o cuadrícula en celular) de `<button class="chip" data-objeto="id" aria-pressed>` con
un punto del color de la parte. Es:
- la alternativa de **teclado y lector de pantalla** (el canvas es `aria-hidden`);
- la forma rápida de encontrar partes pequeñas en celular;
- el plan B cuando no hay 3D.

Reglas: ≥ 44 px de alto, `aria-pressed` refleja la selección, el texto es el mismo nombre
que en el panel. Con más de 6 partes, una fila con desplazamiento horizontal propio
(`overflow-x: auto` en la lista, no en la página).

## 6. Panel de información

Contenido fijo y corto:
1. Título (`h2`, `tabindex="-1"` para recibir foco).
2. Resumen de 1–2 frases.
3. 2–3 datos clave en `<dl>` (etiqueta → valor con unidad).
4. Fuente.
5. Botón cerrar (`<button aria-label="Cerrar">`, 44 px).

Posición: **hoja inferior** en celular (`left/right: 16px; bottom: alto de la botonera`,
`max-height: 52dvh`, `overflow-y: auto`) y **panel lateral** desde 900 px (`width: 360px`).
Nunca posiciones calculadas en px desde la posición del objeto en pantalla (se sale en
celular). Escape cierra. Al abrir desde teclado, mueve el foco al título; desde el modelo
no (en celular haría saltar el teclado virtual o el scroll).

Se rellena con `textContent` / `replaceChildren`, no con `innerHTML` de cadenas (evita
inyección si los textos vienen de un JSON).

## 7. Mini quiz

Sección no modal en el mismo lugar que el panel (las preguntas de "toca" necesitan la
escena). Estructura en `CONTENIDO.quiz`:

```js
{ tipo: 'opcion', pregunta, opciones: [...], correcta: 1, explicacion }
{ tipo: 'tocar',  pregunta, correcta: 'id-de-parte', explicacion }
```

Flujo: pregunta → respuesta → bloqueo de opciones → feedback (✓/✗ + explicación, en
`aria-live="polite"`) → "Siguiente" → al final "Respondiste bien X de N" + "Repetir".

- En `tocar`, `elegir(id)` responde en vez de abrir el panel; tras responder se resalta la
  correcta en el modelo y en la lista.
- La posición de la opción correcta varía entre preguntas.
- 3 opciones para primaria, 4 para secundaria. Distractores plausibles (errores comunes),
  nunca absurdos ni de broma.
- El feedback de error explica, no castiga: "Casi." + la razón.
- No guardes resultados ni pidas nombres salvo que el docente lo pida (y entonces di dónde
  se guardan). `localStorage` solo para "ya lo completaste" en ese dispositivo.
- En celular, tras responder, desplaza el botón "Siguiente" a la vista dentro de la hoja.

## 8. Pantalla de inicio (opcional)

Útil en proyector o como portada: título, una frase del objetivo y botón "Comenzar". Que
**no** sea obligatoria para leer el contenido y que el botón sea un `<button>`. Una intro de
cámara de ≤ 3 s, cancelable al tocar, sin intro con movimiento reducido. Mientras dura,
oculta etiquetas y bloquea la selección.

## 9. Cambio de idioma (opcional)

`CONTENIDO` por idioma (`CONTENIDO.es`, `CONTENIDO.en`) y una función `aplicarIdioma(lang)`
que reescribe UI, lista, panel abierto y pregunta actual. Botones con el **nombre** del
idioma ("Español", "English"), no banderas (un idioma no es un país, y las banderas de CDN
externos se rompen). Actualiza `<html lang>` y guarda la elección en `localStorage`
(con `try/catch`).

## 10. Controles extra

- **Slider** (`<input type="range">` con `<label>` visible): para variables continuas (tiempo,
  ángulo, temperatura). Muestra el valor con unidad junto al slider. Si convive con
  OrbitControls u otro control sobre la misma magnitud, bandera `arrastrando` para que no se
  pisen.
- **Paradas** (anterior/siguiente o `<select>`): para recorridos de escala o procesos.
- **Botón de escala** "Ver a escala real": enseña por qué el modelo por defecto exagera.
- Botones de zoom +/−: prueba los dos sentidos y los límites (`Math.min`/`Math.max` correctos).
