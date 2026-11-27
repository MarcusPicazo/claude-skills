# experiencia-3d-educativa

**English** · [Español](#español)

Turns a class topic — science, physics, biology, geography, astronomy — into an **interactive
3D web experience** ready to publish: a Three.js model students rotate and tap, a short info
panel per part (with its source), and a mini quiz where at least one question is answered by
interacting with the model. No build step; works on phones and tablets, keyboard and screen
readers, and keeps working (buttons, panel, quiz) if the CDN or WebGL fails. Publishes to GitHub
Pages as is.

The included template is an example: the layers of the Earth.

## What Claude will ask you

1. **Topic** and the model that represents it.
2. **Students' age or grade** (sets vocabulary, amount of text and difficulty).
3. **Language**.
4. **Concepts** students must learn (2 to 5, as "the student will be able to…").
5. **Quiz**: yes or no, how many questions, review or graded.
6. **Where it will be published** (GitHub Pages, school platform, classroom projector, offline).

If your request already has the essentials, it uses documented defaults and lists every
decision at the end. Scientific data must come from a verifiable source; anything it can't
verify is marked `[PENDIENTE]` instead of invented.

## Example requests

- *"Make a 3D activity about the phases of the Moon for 5th graders, in Spanish, with a 3-question quiz."*
- *"Interactive 3D animal cell for 7th grade: tap each organelle to learn what it does."*
- *"A 3D explorer of the water cycle for my class, to publish on GitHub Pages."*

## What's in the folder

```
SKILL.md        instructions: questions, defaults, teaching and technical rules, common mistakes, checklist
references/     3D scene and camera, interaction and UI, instructional design, mobile performance and publishing
assets/         no-build template: index.html, styles.css, main.js
scripts/        verificar.cjs (checker)
```

## Running the checker

Serve the page with any static server (not `file://`) and run the checker (needs Node.js and Playwright):

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
python3 -m http.server 8000
```

```bash
node scripts/verificar.cjs http://localhost:8000/ --out capturas
```

At 1440 px (mouse) and 375 px (touch) it reports console errors, failed requests, horizontal
overflow and touch targets under 44 px, taps every part on the 3D model and checks its panel,
checks that dragging doesn't open the panel, that Escape closes it and that the quiz can be
completed. Options: `--no3d` (blocks Three.js to test the fallback), `--reduced` (reduced
motion), `--libs DIR` (serve Three.js from a local copy when the CDN is blocked). **Review the
screenshots**.

---

## Español

[English](#experiencia-3d-educativa) · **Español**

Convierte un tema de clase (ciencias, física, biología, geografía, astronomía) en una
**experiencia web 3D interactiva** lista para publicar: un modelo en Three.js que los alumnos
giran y tocan, un panel corto de información por parte (con su fuente) y un mini quiz donde al
menos una pregunta se responde interactuando con el modelo. Sin build; funciona en celular y
tableta, con teclado y lector de pantalla, y sigue funcionando (botones, panel y quiz) si falla
el CDN o WebGL. Se publica tal cual en GitHub Pages.

La plantilla incluida es un ejemplo: las capas de la Tierra.

## Qué te va a preguntar Claude

1. **Tema** y el modelo que lo representa.
2. **Edad o grado** de los alumnos (define vocabulario, cantidad de texto y dificultad).
3. **Idioma**.
4. **Conceptos** que deben aprender (de 2 a 5, como "el alumno podrá…").
5. **Quiz**: si lleva, cuántas preguntas, de repaso o para calificar.
6. **Dónde se publica** (GitHub Pages, plataforma escolar, proyector en clase, sin internet).

Si tu pedido ya trae lo esencial, usa valores por defecto documentados y al final enlista
cada decisión. Los datos científicos deben salir de una fuente verificable; lo que no se puede
verificar se marca `[PENDIENTE]` en lugar de inventarse.

## Ejemplos de pedidos

- *"Crea una actividad 3D sobre las fases de la Luna para 5° de primaria, en español, con un quiz de 3 preguntas."*
- *"Célula animal en 3D para 1° de secundaria: que se pueda tocar cada organelo para saber qué hace."*
- *"Un explorador 3D del ciclo del agua para mi clase, para publicar en GitHub Pages."*

## Qué contiene la carpeta

```
SKILL.md        instrucciones: preguntas, valores por defecto, reglas pedagógicas y técnicas, errores comunes, checklist
references/     escena y cámara 3D, interacción y UI, diseño pedagógico, rendimiento móvil y publicación
assets/         plantilla sin build: index.html, styles.css, main.js
scripts/        verificar.cjs (verificador)
```

## Cómo correr el verificador

Sirve la página con cualquier servidor estático (no con `file://`) y corre el verificador
(necesita Node.js y Playwright):

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
python3 -m http.server 8000
```

```bash
node scripts/verificar.cjs http://localhost:8000/ --out capturas
```

A 1440 px (ratón) y 375 px (táctil) reporta errores de consola, peticiones fallidas, desborde
horizontal y objetivos táctiles de menos de 44 px. Además toca cada parte en el modelo 3D y
revisa su panel, comprueba que arrastrar no abra el panel, que Escape lo cierre y que el quiz
se pueda completar. Opciones: `--no3d` (bloquea Three.js para probar el plan B), `--reduced`
(movimiento reducido), `--libs DIR` (sirve Three.js desde una copia local cuando el CDN está
bloqueado). **Revisa las capturas**.
