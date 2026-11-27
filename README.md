# Claude Skills

**English** · [Español](#español)

Reusable [Agent Skills](https://agentskills.io) for Claude, created by
[Marcus Escalona](https://marcusescalona.art) from real projects running in production.
Each skill packages what worked (and the mistakes that were fixed along the way) into
instructions, references, ready-to-use templates and an automated checker, so Claude can
build the same kind of project again — with the same quality — for anyone.

## Skills

| Skill | What it does | Who it's for |
|---|---|---|
| [`landing-cinematica`](landing-cinematica/) | Scroll-driven animated landing pages in two styles: **product / startup** and **cinematic walkthrough**. | Developers, designers and studios building launch pages, product pages or visual storytelling for a place or project. |
| [`experiencia-3d-educativa`](experiencia-3d-educativa/) | Turns a class topic into an interactive 3D web experience with a quiz. | Teachers and developers creating science, geography or astronomy activities for students. |

<!-- DEMO GIF: landing-cinematica → add it here, e.g. docs/demo-landing-cinematica.gif -->
<!-- DEMO GIF: experiencia-3d-educativa → add it here, e.g. docs/demo-experiencia-3d-educativa.gif -->

> The skills are written in Spanish. Claude understands them and can build the result in
> any language you ask for.

## Installation

A skill is just a folder. Copy it to one of these places:

- `~/.claude/skills/` — available in **all your sessions**.
- `.claude/skills/` inside a project — available **only in that project** (and to anyone who clones it).

Clone the repository:

```bash
git clone https://github.com/MarcusPicazo/claude-skills.git
```

Copy a skill for all your sessions (macOS / Linux):

```bash
mkdir -p ~/.claude/skills && cp -r claude-skills/landing-cinematica ~/.claude/skills/
```

Or only for one project (run it from the project's root folder):

```bash
mkdir -p .claude/skills && cp -r /path/to/claude-skills/experiencia-3d-educativa .claude/skills/
```

On Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null; Copy-Item -Recurse claude-skills\landing-cinematica "$HOME\.claude\skills\"
```

Start a new Claude Code session after copying so the skill is loaded.

## Usage

Claude activates a skill on its own when your request matches its description. Examples:

- *"Build a launch landing page for my app with scroll animations."* → `landing-cinematica`
- *"I want a cinematic one-page site for a boutique hotel that feels like walking in."* → `landing-cinematica`
- *"Make a 3D activity about the phases of the Moon for 5th graders, with a quiz."* → `experiencia-3d-educativa`
- *"Necesito un explorador 3D de la célula animal para secundaria."* → `experiencia-3d-educativa`

You can also invoke a skill directly by name:

```text
/landing-cinematica
/experiencia-3d-educativa
```

Before writing code, each skill asks a few short questions (or uses documented defaults
when your request already has the essentials) and, at the end, lists every decision it made
on its own so you can correct it.

## Open standard

These skills follow the open [Agent Skills](https://agentskills.io) format: a folder with a
`SKILL.md` (YAML front matter with `name` and `description`, followed by instructions), plus
optional `references/`, `assets/` and `scripts/`. They work in Claude Code and in any tool that
supports the standard.

## How they are tested

Each skill includes a checker (`scripts/verificar.cjs`, built with Playwright) that opens the
page at **1440 px** (mouse) and **375 px** (touch) and reports console errors, failed requests,
horizontal overflow and other issues, and saves screenshots to review by eye. The templates of
both skills pass their checker in every mode (normal, reduced motion, no JS / no 3D). The 3D
skill was also tested by building two new experiences from scratch using only the skill.

**Known limitations**

- Not yet tested on real iPhone or Android devices (only emulated viewports in a headless browser).
- Scroll-linked video (`landing-cinematica`, walkthrough style) has not been validated on real devices yet.
- 3D scenes were checked with a software-rendered GPU; real frame rate on low-end phones is unmeasured.
- The checkers need Node.js and Playwright with Chromium.

## License and author

[MIT](LICENSE) © 2026 [Marcus Escalona](https://marcusescalona.art).

---

## Español

[English](#claude-skills) · **Español**

[Agent Skills](https://agentskills.io) reutilizables para Claude, creadas por
[Marcus Escalona](https://marcusescalona.art) a partir de proyectos reales en producción.
Cada skill empaqueta lo que funcionó (y los errores que se corrigieron en el camino) en
instrucciones, referencias, plantillas listas para usar y un verificador automático, para
que Claude pueda volver a construir ese tipo de proyecto, con la misma calidad, para
cualquier persona.

## Skills

| Skill | Qué hace | Para quién |
|---|---|---|
| [`landing-cinematica`](landing-cinematica/) | Landings animadas por scroll en dos estilos: **producto / startup** y **recorrido cinematográfico**. | Desarrolladores, diseñadores y estudios que hacen páginas de lanzamiento, de producto o storytelling visual de un lugar o proyecto. |
| [`experiencia-3d-educativa`](experiencia-3d-educativa/) | Convierte un tema de clase en una experiencia web 3D interactiva con quiz. | Docentes y desarrolladores que crean actividades de ciencias, geografía o astronomía para alumnos. |

<!-- GIF DE DEMOSTRACIÓN: landing-cinematica → agregarlo aquí, p. ej. docs/demo-landing-cinematica.gif -->
<!-- GIF DE DEMOSTRACIÓN: experiencia-3d-educativa → agregarlo aquí, p. ej. docs/demo-experiencia-3d-educativa.gif -->

## Instalación

Una skill es solo una carpeta. Cópiala a uno de estos lugares:

- `~/.claude/skills/` — disponible en **todas tus sesiones**.
- `.claude/skills/` dentro de un proyecto — disponible **solo en ese proyecto** (y para quien lo clone).

Clona el repositorio:

```bash
git clone https://github.com/MarcusPicazo/claude-skills.git
```

Copia una skill para todas tus sesiones (macOS / Linux):

```bash
mkdir -p ~/.claude/skills && cp -r claude-skills/landing-cinematica ~/.claude/skills/
```

O solo para un proyecto (desde la carpeta raíz del proyecto):

```bash
mkdir -p .claude/skills && cp -r /ruta/a/claude-skills/experiencia-3d-educativa .claude/skills/
```

En Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null; Copy-Item -Recurse claude-skills\landing-cinematica "$HOME\.claude\skills\"
```

Abre una sesión nueva de Claude Code después de copiarla para que se cargue.

## Uso

Claude activa una skill por su cuenta cuando tu pedido coincide con su descripción. Ejemplos:

- *"Hazme una landing de lanzamiento para mi app con animaciones al hacer scroll."* → `landing-cinematica`
- *"Quiero un sitio de una página para un desarrollo inmobiliario que se sienta como recorrerlo."* → `landing-cinematica`
- *"Crea una actividad 3D sobre las fases de la Luna para 5° de primaria, con quiz."* → `experiencia-3d-educativa`
- *"Necesito un explorador 3D de la célula animal para secundaria."* → `experiencia-3d-educativa`

También puedes invocarlas directamente por su nombre:

```text
/landing-cinematica
/experiencia-3d-educativa
```

Antes de escribir código, cada skill hace unas preguntas cortas (o usa valores por defecto
documentados si tu pedido ya trae lo esencial) y, al final, enlista cada decisión que tomó
por su cuenta para que la corrijas.

## Estándar abierto

Siguen el formato abierto [Agent Skills](https://agentskills.io): una carpeta con un
`SKILL.md` (encabezado YAML con `name` y `description`, seguido de las instrucciones) y, de
forma opcional, `references/`, `assets/` y `scripts/`. Funcionan en Claude Code y en cualquier
herramienta compatible con el estándar.

## Cómo están probadas

Cada skill incluye un verificador (`scripts/verificar.cjs`, hecho con Playwright) que abre la
página a **1440 px** (ratón) y **375 px** (táctil), reporta errores de consola, peticiones
fallidas, desborde horizontal y otros problemas, y guarda capturas para revisarlas a ojo. Las
plantillas de ambas skills pasan su verificador en todos los modos (normal, movimiento
reducido, sin JS / sin 3D). La skill 3D además se probó construyendo dos experiencias nuevas
desde cero usando solo la skill.

**Límites conocidos**

- Aún no se han probado en iPhone ni Android reales (solo pantallas emuladas en un navegador sin interfaz).
- El video ligado al scroll (`landing-cinematica`, estilo recorrido) todavía no se ha validado en dispositivos reales.
- Las escenas 3D se revisaron con GPU por software; no se ha medido la fluidez real en celulares de gama baja.
- Los verificadores necesitan Node.js y Playwright con Chromium.

## Licencia y autor

[MIT](LICENSE) © 2026 [Marcus Escalona](https://marcusescalona.art).
