# landing-cinematica

**English** · [Español](#español)

Builds one-page landing sites where **scroll is the narrative**, with GSAP, ScrollTrigger and
Lenis, in two styles:

- **Product / startup** — dark, WebGL background, cards that assemble, pinned sections with a
  manifesto zoom or an image sequence. For apps, SaaS, hardware, launches, waitlists.
- **Cinematic walkthrough** — a fixed stage where a video or frames move forward and backward
  with the scroll while text stops pass by. For places and physical projects: real estate,
  hotels, restaurants, museums, destinations.

No build step required (static HTML templates); the same structure works with Astro, Next or Vite.

## What Claude will ask you

1. **Style** (it recommends one for your case).
2. **Visual material**: images and/or videos, how many, resolution, order.
3. **Copy**: headline, sections, calls to action and where each button goes.
4. **Palette and typography** (brand colors in hex and fonts).
5. **Language(s)** and whether to switch without reloading.
6. **Technical target**: static HTML or a framework, and hosting.

If your request already has the essentials, it uses documented defaults and lists every
decision at the end. It never invents figures, testimonials, clients or logos: missing data is
marked `[PENDIENTE]`.

## Example requests

- *"Build a launch landing page for my note-taking app, dark style, with a waitlist form."*
- *"I have 4 chained drone clips of a housing development: make a landing that feels like walking through it."*
- *"One-page site for a specialty coffee shop, with smooth scroll animations, in Spanish and English."*

## What's in the folder

```
SKILL.md        instructions: questions, defaults, rules, common mistakes, checklist
references/     setup of GSAP + Lenis, each style in depth, mobile performance
assets/         two no-build templates: estilo-producto/ and estilo-recorrido/
scripts/        verificar.cjs (checker) and placeholders.py (placeholder frames)
```

## Running the checker

Serve the page with any static server and run the checker (needs Node.js and Playwright):

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
python3 -m http.server 8000
```

```bash
node scripts/verificar.cjs http://localhost:8000/ --out capturas
```

It scrolls down and back up at 1440 px and 375 px and reports console errors, failed requests,
horizontal overflow and whether it reached the bottom and came back. Options: `--reduced`
(reduced motion), `--nojs`, `--libs DIR` (serve GSAP/Lenis from a local folder when the CDN is
blocked). **Review the screenshots**: passing does not mean it looks right.

---

## Español

[English](#landing-cinematica) · **Español**

Construye landings de una sola página donde **el scroll es la narrativa**, con GSAP,
ScrollTrigger y Lenis, en dos estilos:

- **Producto / startup**: oscuro, fondo WebGL, tarjetas que se ensamblan, secciones fijadas
  con zoom de manifiesto o secuencia de imágenes. Para apps, SaaS, hardware, lanzamientos y
  listas de espera.
- **Recorrido cinematográfico**: un escenario fijo donde un video o fotogramas avanzan y
  retroceden con el scroll mientras pasan las paradas de texto. Para lugares y proyectos
  físicos: inmobiliarias, hoteles, restaurantes, museos, destinos.

Sin build (plantillas HTML estáticas); la misma estructura sirve con Astro, Next o Vite.

## Qué te va a preguntar Claude

1. **Estilo** (te recomienda uno según tu caso).
2. **Material visual**: imágenes y/o videos, cuántos, resolución y orden.
3. **Textos**: titular, secciones, llamadas a la acción y a dónde lleva cada botón.
4. **Paleta y tipografía** (colores de marca en hex y fuentes).
5. **Idioma(s)** y si se cambia sin recargar.
6. **Destino técnico**: HTML estático o framework, y hosting.

Si tu pedido ya trae lo esencial, usa valores por defecto documentados y al final enlista
cada decisión. Nunca inventa cifras, testimonios, clientes ni logos: lo que falta se marca
`[PENDIENTE]`.

## Ejemplos de pedidos

- *"Hazme una landing de lanzamiento para mi app de notas, estilo oscuro, con formulario de lista de espera."*
- *"Tengo 4 clips de dron encadenados de un desarrollo de vivienda: haz una landing que se sienta como recorrerlo."*
- *"Sitio de una página para una cafetería de especialidad, con animaciones suaves al hacer scroll, en español e inglés."*

## Qué contiene la carpeta

```
SKILL.md        instrucciones: preguntas, valores por defecto, reglas, errores comunes, checklist
references/     setup de GSAP + Lenis, cada estilo a fondo, rendimiento en móvil
assets/         dos plantillas sin build: estilo-producto/ y estilo-recorrido/
scripts/        verificar.cjs (verificador) y placeholders.py (fotogramas de relleno)
```

## Cómo correr el verificador

Sirve la página con cualquier servidor estático y corre el verificador (necesita Node.js y Playwright):

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
python3 -m http.server 8000
```

```bash
node scripts/verificar.cjs http://localhost:8000/ --out capturas
```

Baja y sube la página a 1440 px y 375 px y reporta errores de consola, peticiones fallidas,
desborde horizontal y si llegó al fondo y regresó. Opciones: `--reduced` (movimiento
reducido), `--nojs`, `--libs DIR` (sirve GSAP/Lenis desde una carpeta local cuando el CDN está
bloqueado). **Revisa las capturas**: que pase no significa que se vea bien.
