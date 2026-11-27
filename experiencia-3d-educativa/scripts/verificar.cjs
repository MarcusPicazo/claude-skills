#!/usr/bin/env node
/* Verificación automática de una experiencia 3D educativa (§8 de SKILL.md).
   A 1440×900 (ratón) y 375×667 (táctil) reporta: errores/advertencias de consola, excepciones,
   peticiones fallidas o 4xx/5xx, desborde horizontal, objetivos táctiles < 44 px (botones,
   enlaces y también input range/select), si arrancó el 3D o el modo sin 3D, y prueba la
   interacción: cada botón de parte abre el panel, tocar cada parte EN EL MODELO abre su panel
   (con el gancho window.__experiencia.escena.dondeEsta), un arrastre NO abre el panel, Escape
   cierra y el quiz se contesta de principio a fin (opción, "toca" y "ajusta + Comprobar").
   Guarda capturas: revísalas a ojo.

   Uso:
     node verificar.cjs http://localhost:8000/ [--out capturas] [--libs DIR] [--no3d] [--reduced]
   --libs DIR  sirve las peticiones a three@x.y.z/<ruta> desde DIR/<ruta> (carpeta `package/` de
               `npm pack three@x.y.z`) cuando el CDN está bloqueado.
   --no3d      bloquea Three.js para probar el plan B (lista + panel + quiz sin 3D).
   --reduced   emula prefers-reduced-motion.

   Contrato con la página (lo cumple la plantilla de assets/):
     html.webgl-ok | html.no-3d · #stage (contiene el canvas) · [data-objeto] botones de cada parte
     #panel y #panel-titulo · [data-quiz-abrir] · #quiz · .opcion · [data-comprobar] · #quiz-siguiente
     [data-quiz-resultado] · opcional: window.__experiencia.escena.dondeEsta(id) → {x, y} | null

   Requiere Playwright (`npm i -D playwright && npx playwright install chromium`). */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a));
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const outDir = opt('--out') || 'capturas';
const libsDir = opt('--libs');
const no3d = args.includes('--no3d');
const reduced = args.includes('--reduced');
if (!url) { console.error('Falta la URL. Ej.: node verificar.cjs http://localhost:8000/'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const THREE_URL = /three@[\d.]+\/(.+?)(\?.*)?$/;

(async () => {
  const browser = await chromium.launch();
  let failed = false;
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 667 }]) {
    const mobile = vp.width < 500;
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile,
      reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const issues = [];   // ✗ fallan
    const notes = [];    // · informativo (se imprime sin repetir)
    page.on('console', (m) => {
      if (!['error', 'warning'].includes(m.type())) return;
      // Avisos del GPU por software del navegador headless (p. ej. al tomar capturas): no son de la página.
      if (/GL Driver Message|GPU stall due to ReadPixels/.test(m.text())) return notes.push('aviso del GPU de software (headless), ignorado');
      // Con --no3d el bloqueo de Three.js es intencional: su error de carga no cuenta.
      if (no3d && /Failed to load resource/.test(m.text())) return;
      issues.push(`consola ${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => issues.push(`excepción: ${e.message}`));
    page.on('requestfailed', (r) => { if (!(no3d && THREE_URL.test(r.url()))) issues.push(`petición fallida: ${r.url()} (${r.failure()?.errorText})`); });
    page.on('response', (r) => { if (r.status() >= 400) issues.push(`HTTP ${r.status()}: ${r.url()}`); });

    if (no3d) await page.route(THREE_URL, (route) => route.abort());
    else if (libsDir) {
      await page.route(THREE_URL, (route) => {
        const rel = route.request().url().match(THREE_URL)[1];
        const file = path.join(libsDir, rel);
        if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'no está en --libs' });
        route.fulfill({ path: file, contentType: 'application/javascript' });
      });
    }

    const tag = `${vp.width}px${no3d ? '-no3d' : ''}${reduced ? '-reduced' : ''}`;
    const shot = (name) => page.screenshot({ path: path.join(outDir, `${tag}-${name}.png`) });
    const press = async (loc) => (mobile ? loc.tap() : loc.click());
    const visible = (sel) => page.locator(sel).first().isVisible().catch(() => false);

    await page.goto(url, { waitUntil: 'load' });
    const modo = await page.waitForFunction(() => {
      const c = document.documentElement.classList;
      return c.contains('webgl-ok') ? '3D' : c.contains('no-3d') ? 'sin 3D' : false;
    }, null, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => 'no arrancó');
    if (modo === 'no arrancó') issues.push('ni html.webgl-ok ni html.no-3d tras 15 s');
    if (no3d && modo === '3D') issues.push('--no3d: la escena arrancó aunque Three.js estaba bloqueado');
    if (!no3d && modo === 'sin 3D') issues.push('arrancó en modo sin 3D (¿CDN bloqueado? usa --libs)');
    await page.waitForTimeout(700);
    await shot('01-inicio');

    // Desborde horizontal y objetivos táctiles
    const layout = await page.evaluate((isMobile) => {
      const W = document.documentElement.clientWidth;
      const off = new Set(); const chicos = new Set();
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const b = el.getBoundingClientRect();
        if (!b.width) return;
        const name = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
        if (isMobile && el.matches('button, a[href], input, select, [role="button"]') && b.height && (b.width < 44 || b.height < 44) && !el.classList.contains('skip')) chicos.add(`${name} ${Math.round(b.width)}×${Math.round(b.height)}`);
        if (b.right <= W + 1 && b.left >= -1) return;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') return; // un ancestro lo recorta o lo desplaza
        }
        if (!el.classList.contains('skip')) off.add(name);
      });
      return { sw: document.documentElement.scrollWidth, W, off: [...off].slice(0, 5), chicos: [...chicos].slice(0, 6) };
    }, mobile);
    if (layout.sw > layout.W) issues.push(`desborde horizontal: scrollWidth ${layout.sw} > ${layout.W}`);
    if (layout.off.length) issues.push(`fuera del ancho: ${layout.off.join(', ')}`);
    if (layout.chicos.length) issues.push(`objetivos táctiles < 44 px: ${layout.chicos.join(', ')}`);

    // Panel dentro de la pantalla y sin tapar la botonera
    const panelOk = async (donde) => {
      const r = await page.evaluate(() => {
        const p = document.querySelector('#panel:not([hidden]), #quiz:not([hidden])');
        const n = document.querySelector('#objetos');
        if (!p) return null;
        const a = p.getBoundingClientRect(); const b = n ? n.getBoundingClientRect() : null;
        return { a: [a.left, a.top, a.right, a.bottom], dentro: a.left >= 0 && a.top >= 0 && a.right <= innerWidth + 1 && a.bottom <= innerHeight + 1,
          tapa: b ? a.bottom > b.top + 1 && a.top < b.bottom && a.right > b.left && a.left < b.right : false };
      });
      if (!r) return;
      if (!r.dentro) issues.push(`${donde}: el panel se sale de la pantalla (${r.a.map(Math.round).join(', ')})`);
      if (r.tapa) issues.push(`${donde}: el panel tapa la botonera`);
    };

    // 1. Cada botón de parte abre el panel con contenido
    const chips = page.locator('[data-objeto]');
    const n = await chips.count();
    if (!n) issues.push('no hay botones [data-objeto]: falta la alternativa sin 3D / teclado');
    for (let i = 0; i < n; i++) {
      const chip = chips.nth(i);
      await chip.scrollIntoViewIfNeeded();
      await press(chip);
      await page.waitForTimeout(reduced ? 150 : 1000);
      const titulo = (await page.locator('#panel-titulo').textContent().catch(() => '') || '').trim();
      if (!(await visible('#panel')) || !titulo) issues.push(`botón ${i + 1} (${await chip.textContent()}) no abrió el panel`);
      if (i === 0) { await panelOk('panel'); await shot('02-panel'); }
    }
    if (n && !(await page.locator('[data-objeto][aria-pressed="true"]').count())) notes.push('los botones no marcan aria-pressed');

    // 2. Escape cierra
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    if (await visible('#panel')) issues.push('Escape no cerró el panel');

    // 3. Interacción directa con el modelo (solo con 3D)
    if (modo === '3D') {
      const box = await page.locator('#stage canvas').boundingBox();
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      // Arrastre: no debe abrir el panel
      if (mobile) {
        const cdp = await ctx.newCDPSession(page);
        const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
        await t('touchStart', cx - 80, cy); for (let k = 1; k <= 8; k++) await t('touchMove', cx - 80 + k * 20, cy); await t('touchEnd');
      } else {
        await page.mouse.move(cx - 120, cy); await page.mouse.down();
        for (let k = 1; k <= 10; k++) await page.mouse.move(cx - 120 + k * 24, cy + k * 4);
        await page.mouse.up();
      }
      await page.waitForTimeout(300);
      if (await visible('#panel')) issues.push('un arrastre para girar abrió el panel (falta distinguir tap de arrastre)');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      const conGancho = await page.evaluate(() => !!window.__experiencia?.escena?.dondeEsta);
      if (conGancho) {
        // Toca cada parte en el modelo 3D (posición calculada por la propia escena) y comprueba el panel.
        const ids = await chips.evaluateAll((els) => els.map((e) => [e.dataset.objeto, e.textContent.trim()]));
        const ok = [], ocultas = [];
        for (const [id, nombre] of ids) {
          // Espera a que la cámara termine de moverse (transición del toque anterior) antes de medir.
          const donde = (i) => page.evaluate((x) => window.__experiencia.escena.dondeEsta(x), i);
          let q = await donde(id);
          for (let k = 0; k < 15; k++) {
            await page.waitForTimeout(200);
            const q2 = await donde(id);
            const quieto = (!q && !q2) || (q && q2 && Math.hypot(q.x - q2.x, q.y - q2.y) < 1);
            q = q2;
            if (quieto) break;
          }
          if (!q) { ocultas.push(nombre); continue; }
          if (mobile) await page.touchscreen.tap(q.x, q.y); else await page.mouse.click(q.x, q.y);
          await page.waitForTimeout(reduced ? 150 : 1000);
          const titulo = (await page.locator('#panel-titulo').textContent().catch(() => '') || '').trim();
          if (!(await visible('#panel')) || titulo !== nombre) issues.push(`tocar «${nombre}» en el modelo abrió «${titulo || 'nada'}»`);
          else ok.push(nombre);
          if (ok.length === 1) await shot('03-tap-modelo');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
        }
        notes.push(`toques en el modelo 3D: ${ok.length}/${ids.length} correctos`);
        if (ocultas.length) notes.push(`sin zona firme para el dedo en la vista inicial (ocultas o muy pequeñas: agrega zona de toque o dilo en la instrucción): ${ocultas.join(', ')}`);
      } else {
        // Sin gancho: un toque en el centro debería seleccionar algo
        if (mobile) await page.touchscreen.tap(cx, cy); else await page.mouse.click(cx, cy);
        await page.waitForTimeout(reduced ? 150 : 1000);
        if (await visible('#panel')) { notes.push(`tap en el centro → ${(await page.locator('#panel-titulo').textContent()).trim()}`); await shot('03-tap-modelo'); }
        else notes.push('tap en el centro no seleccionó nada; expón window.__experiencia.escena.dondeEsta para probar cada parte');
        await page.keyboard.press('Escape');
      }
    }

    // 4. Quiz de principio a fin
    const abrir = page.locator('[data-quiz-abrir]');
    if (await abrir.count()) {
      await press(abrir.first());
      await page.waitForTimeout(250);
      await panelOk('quiz');
      await shot('04-quiz');
      let pasos = 0, terminado = false;
      while (pasos++ < 25) {
        if (await page.locator('[data-quiz-resultado]').count()) { terminado = true; break; }
        const op = page.locator('#quiz .opcion:not([disabled])');
        const comprobar = page.locator('#quiz [data-comprobar]:not([disabled])');
        if (await op.count()) await press(op.first());
        else if (await comprobar.count()) await press(comprobar.first()); // pregunta de "ajusta y comprueba"
        else await press(chips.first());           // pregunta de "toca en el modelo"
        await page.waitForTimeout(150);
        const sig = page.locator('#quiz-siguiente');
        if (!(await sig.isVisible())) { issues.push(`quiz: tras responder la pregunta ${pasos} no apareció "Siguiente"`); break; }
        if (pasos === 1) await shot('05-quiz-feedback');
        await press(sig);
        await page.waitForTimeout(150);
      }
      if (terminado) { notes.push(`quiz: ${(await page.locator('[data-quiz-resultado]').textContent()).trim()}`); await shot('06-quiz-resultado'); }
      else if (!issues.some((s) => s.startsWith('quiz'))) issues.push('quiz: no llegó al resultado final');
    } else notes.push('sin quiz ([data-quiz-abrir] no existe)');

    const uniq = [...new Set(issues)];
    failed ||= uniq.length > 0;
    console.log(`\n== ${tag} · modo: ${modo}`);
    [...new Set(notes)].forEach((s) => console.log(`  · ${s}`));
    console.log(uniq.length ? uniq.map((s) => `  ✗ ${s}`).join('\n') : '  ✓ sin errores de consola ni desborde; panel, Escape, interacción y quiz funcionan');
    await ctx.close();
  }
  await browser.close();
  console.log(`\nCapturas en ${path.resolve(outDir)} — revísalas: que no truene no significa que se vea bien.`);
  process.exit(failed ? 1 : 0);
})();
