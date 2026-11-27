#!/usr/bin/env node
/* Verificación automática de una landing (§4 de SKILL.md).
   Recorre la página de arriba a abajo y de regreso a 1440×900 y 375×667 (táctil), y reporta:
   errores/advertencias de consola, excepciones, peticiones fallidas o 4xx/5xx, desborde
   horizontal (scrollWidth y elementos fuera del ancho), si llegó al fondo y si volvió arriba.
   Guarda capturas en <salida>/ para revisarlas a ojo (que no truene no significa que se vea bien).

   Uso:
     node verificar.cjs http://localhost:8000/ [--out capturas] [--reduced] [--nojs] [--libs DIR]
   --libs DIR: sirve gsap.min.js, ScrollTrigger.min.js, lenis.min.js y lenis.css desde DIR cuando
               el CDN está bloqueado (sandbox, red corporativa). Ver gsap-lenis-setup.md §1.
   Requiere Playwright (`npm i -D playwright && npx playwright install chromium`). */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a));
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const outDir = opt('--out') || 'capturas';
const libsDir = opt('--libs');
const reduced = args.includes('--reduced');
const nojs = args.includes('--nojs');
if (!url) { console.error('Falta la URL. Ej.: node verificar.cjs http://localhost:8000/'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  let failed = false;
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 667 }]) {
    const mobile = vp.width < 500;
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile,
      reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: !nojs });
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push(`consola ${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => issues.push(`excepción: ${e.message}`));
    page.on('requestfailed', (r) => issues.push(`petición fallida: ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) issues.push(`HTTP ${r.status()}: ${r.url()}`); });
    if (libsDir) {
      await page.route(/(cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net).*\/(gsap\.min\.js|ScrollTrigger\.min\.js|lenis\.min\.js|lenis\.css)$/, (route) => {
        const file = route.request().url().split('/').pop();
        route.fulfill({ path: path.join(libsDir, file), contentType: file.endsWith('.css') ? 'text/css' : 'application/javascript' });
      });
    }
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const tag = `${vp.width}px${reduced ? '-reduced' : ''}${nojs ? '-nojs' : ''}`;

    const checkOverflow = async (where) => {
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const off = new Set();
        document.querySelectorAll('body *').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.display === 'none') return;
          const b = el.getBoundingClientRect();
          if (!b.width || (b.right <= W + 1 && b.left >= -1)) return;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p);
            if (o.overflowX !== 'visible' || o.position === 'fixed') return; // un ancestro lo recorta
          }
          off.add(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`);
        });
        return { sw: document.documentElement.scrollWidth, W, off: [...off].slice(0, 5) };
      });
      if (r.sw > r.W) issues.push(`desborde horizontal (${where}): scrollWidth ${r.sw} > ${r.W}`);
      if (r.off.length) issues.push(`fuera del ancho (${where}): ${r.off.join(', ')}`);
    };

    const scroll = async (dir) => {
      const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const steps = Math.ceil(max / 300) + 6;
      const every = Math.max(1, Math.floor(steps / 6));
      for (let i = 0, n = 1; i < steps; i++) {
        if (mobile || nojs || reduced) await page.evaluate((d) => window.scrollBy(0, d * 300), dir);
        else await page.mouse.wheel(0, dir * 300); // rueda real: pasa por Lenis
        await page.waitForTimeout(120);
        if (i % every === 0) {
          await page.waitForTimeout(350);
          await checkOverflow(`${dir > 0 ? 'bajando' : 'subiendo'} ${i}`);
          await page.screenshot({ path: path.join(outDir, `${tag}-${dir > 0 ? 'baja' : 'sube'}-${String(n++).padStart(2, '0')}.png`) });
        }
      }
      await page.waitForTimeout(1500);
    };

    await checkOverflow('inicio');
    await scroll(1);
    const atBottom = await page.evaluate(() => Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) < 4);
    if (!atBottom) issues.push('no llegó al fondo de la página');
    await scroll(-1);
    const top = await page.evaluate(() => Math.round(scrollY));
    if (top > 2) issues.push(`no volvió arriba (scrollY=${top})`);
    const triggers = await page.evaluate(() => (window.ScrollTrigger ? ScrollTrigger.getAll().length : 'sin GSAP'));

    const uniq = [...new Set(issues)];
    failed ||= uniq.length > 0;
    console.log(`\n== ${tag} · ScrollTriggers: ${triggers}`);
    console.log(uniq.length ? uniq.map((s) => `  ✗ ${s}`).join('\n') : '  ✓ sin errores de consola ni desborde; bajó y regresó completo');
    await ctx.close();
  }
  await browser.close();
  console.log(`\nCapturas en ${path.resolve(outDir)} — revísalas: que no truene no significa que se vea bien.`);
  process.exit(failed ? 1 : 0);
})();
