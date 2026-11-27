/* Plantilla "recorrido cinematográfico": Lenis + GSAP ScrollTrigger, sin build.
   Ver references/estilo-recorrido.md. Funciona con fotogramas solos y suma video cuando
   existan los <video data-clip>. */
(() => {
  const root = document.documentElement;
  const stills = root.classList.contains('stills');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 767px)').matches;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Entradas de una sola vez (no dependen de GSAP) ----------
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

  // ---------- Lema palabra por palabra ----------
  const tagline = document.querySelector('[data-tagline]');
  if (tagline) {
    const text = tagline.textContent.trim();
    tagline.setAttribute('aria-label', text);
    tagline.replaceChildren(...text.split(/\s+/).flatMap((word, i, arr) => {
      const s = document.createElement('span');
      s.className = 'word'; s.textContent = word; s.setAttribute('aria-hidden', 'true');
      s.style.transitionDelay = `${i * 35}ms`;
      return i < arr.length - 1 ? [s, document.createTextNode(' ')] : [s];
    }));
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { tagline.querySelectorAll('.word').forEach((w) => w.classList.add('is-in')); io.disconnect(); }
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(tagline);
  }

  // Sin librerías (CDN caído): modo de imágenes fijas, la página se lee completa.
  if (!window.gsap || !window.ScrollTrigger) { root.classList.add('stills'); return; }
  gsap.registerPlugin(ScrollTrigger);
  const clamp01 = gsap.utils.clamp(0, 1);
  const band = (p, a, b) => clamp01((p - a) / (b - a));

  // ---------- Lenis (un solo reloj: gsap.ticker) ----------
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ autoRaf: false, duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- Header flotante + navegación suave ----------
  ScrollTrigger.create({ start: 'top -50', end: 99999, toggleClass: { className: 'is-floating', targets: '#header' } });
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = id.length > 1 ? document.querySelector(id) : null;
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(link.id === 'logo' ? 0 : target, { duration: 1.2, easing: easeInOutCubic });
    });
  });

  // ---------- Enlace activo del header según la sección en el centro ----------
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const groupOf = (el) => el.dataset.sceneGroup || (el.matches('[data-stop]') && el.id !== 'parada-1' ? 'recorrido' : null);
  const centerIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const g = groupOf(e.target);
      if (!g) return;
      navLinks.filter((l) => l.dataset.nav === g).forEach((l) => l.classList.toggle('is-active', e.isIntersecting));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('[data-stop], [data-scene-group]').forEach((el) => centerIO.observe(el));

  // ---------- Interpolación por tramos ----------
  function piecewise(y, keys) {
    if (y <= keys[0].y) return keys[0].v;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (y <= b.y) return a.v + (b.v - a.v) * ((y - a.y) / (b.y - a.y || 1));
    }
    return keys[keys.length - 1].v;
  }

  // ---------- El mundo: fotogramas + clips ligados al scroll ----------
  function initWorld(world) {
    const stage = world.querySelector('[data-stage]');
    const stops = [...world.querySelectorAll('[data-stop]')];
    const frames = [...stage.querySelectorAll('[data-frame]')];
    const clips = [...stage.querySelectorAll('[data-clip]')];
    const links = [...stage.querySelectorAll('[data-goto]')];
    const fill = stage.querySelector('[data-rail-fill]');
    const hint = stage.querySelector('[data-hint]');
    const last = stops.length - 1;

    const marks = stops.map((s) => ScrollTrigger.create({ trigger: s, start: 'top top' }));
    const ready = clips.map(() => false);
    let w = 0, active = 0, shown = -1, time = 0, current = -1;

    const setCurrent = (i) => {
      if (i === current) return;
      current = i;
      stops.forEach((s, k) => s.classList.toggle('is-current', k === i));
      links.forEach((l, k) => l.setAttribute('aria-current', String(k === i)));
    };

    const show = () => {
      if (shown !== active) { shown = active; clips.forEach((c, i) => c.classList.toggle('is-shown', i === active)); }
      stage.dataset.mode = 'video';
    };

    // Solo pide un cuadro nuevo cuando el seek anterior terminó: si no, el video se atora.
    const sync = () => {
      const clip = clips[active];
      if (!clip || !ready[active]) { delete stage.dataset.mode; return; }
      if (clip.seeking) return;
      if (Math.abs(clip.currentTime - time) > 0.01) clip.currentTime = time;
      else show();
    };
    clips.forEach((c, i) => c.addEventListener('seeked', () => { if (i === active) { show(); sync(); } }));

    const render = (self) => {
      const y = self.scroll();
      w = piecewise(y, [...marks.map((m, i) => ({ y: m.start, v: i })), { y: self.end, v: stops.length }]);
      const at = Math.min(w, last);
      setCurrent(Math.round(at));
      if (fill) fill.style.transform = `scaleY(${last ? at / last : 1})`;
      if (hint) hint.style.opacity = String(clamp01(1 - w * 4));

      frames.forEach((f, i) => {
        f.style.opacity = String(i === 0 ? 1 : clamp01((w - i + 0.5) / 0.5));
        if (!reduceMotion) f.style.transform = `scale(${1 + 0.06 * clamp01(w - i)})`;
      });

      if (!clips.length) return;
      active = Math.min(clips.length - 1, Math.floor(w));
      const { duration } = clips[active];
      if (ready[active] && duration) time = Math.min((w - active) * duration, duration - 0.05);
      sync();
    };

    const span = ScrollTrigger.create({ trigger: world, start: 'top top', end: 'bottom bottom', onUpdate: render, onRefresh: render });
    render(span);

    const saveData = navigator.connection && navigator.connection.saveData;
    if (!clips.length || reduceMotion || saveData) return;

    // Carga de a uno: primero el tramo actual, luego el más cercano.
    const distance = (i) => (i === active ? -1 : i > w ? i - w : w - (i + 1) + 0.5);
    const queue = clips.map((_, i) => i);
    const loadNext = async () => {
      queue.sort((a, b) => distance(a) - distance(b));
      const i = queue.shift();
      if (i === undefined) return;
      const clip = clips[i];
      const src = (isMobile() ? clip.dataset.srcMobile : clip.dataset.srcDesktop) || clip.dataset.srcDesktop || '';
      clip.preload = 'auto';
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(res.statusText);
        clip.src = URL.createObjectURL(await res.blob()); // seek local, sin depender de Range
      } catch { clip.src = src; }
      const loaded = await new Promise((resolve) => {
        clip.addEventListener('loadeddata', () => resolve(true), { once: true });
        clip.addEventListener('error', () => resolve(false), { once: true });
      });
      if (loaded) {
        await clip.play().catch(() => {}); // iOS no pinta el cuadro buscado sin esto
        clip.pause();
        ready[i] = true;
        render(span);
      }
      loadNext();
    };
    // Empieza a cargar cuando el mundo está cerca (útil si no es el primero de la página).
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      loadNext();
    }, { rootMargin: '50% 0px' });
    near.observe(world);
  }

  // ---------- Parada fijada: secuencia por bandas de progreso ----------
  // [data-pin-title]: se enciende palabra por palabra en el primer 25 %.
  // [data-pin-step="a,b"]: cualquier bloque (datos, CTAs, mockup) que aparece entre a y b
  // del progreso (0–1). Agrega los que quieras sin tocar este archivo; termina antes de 0.9.
  // [data-pin-progress]: línea que se llena con el progreso.
  function initPin(section) {
    const title = section.querySelector('[data-pin-title]');
    const fillEl = section.querySelector('[data-pin-progress]');
    const body = section.querySelector('.stop__body'); // sube el bloque entero: el título no pisa la etiqueta
    const steps = [...section.querySelectorAll('[data-pin-step]')].map((el) => {
      const [a, b] = el.dataset.pinStep.split(',').map(Number);
      return { el, a, b };
    });
    let words = [];

    if (!reduceMotion && title) {
      const text = title.textContent.trim();
      title.setAttribute('aria-label', text);
      title.replaceChildren(...text.split(/\s+/).flatMap((word, i, arr) => {
        const s = document.createElement('span');
        s.textContent = word; s.setAttribute('aria-hidden', 'true');
        s.style.display = 'inline-block';
        s.style.opacity = '0'; s.style.transform = 'translateY(12px)'; // estado inicial YA: sin destello
        words.push(s);
        return i < arr.length - 1 ? [s, document.createTextNode(' ')] : [s];
      }));
    }
    if (!reduceMotion) steps.forEach(({ el }) => gsap.set(el, { autoAlpha: 0, y: 12 }));

    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: ({ progress: p }) => {
        if (fillEl) fillEl.style.width = `${p * 100}%`;
        if (reduceMotion) return;
        words.forEach((wEl, i) => {
          const t = band(p, (i / words.length) * 0.25, ((i + 1) / words.length) * 0.25);
          wEl.style.opacity = String(t);
          wEl.style.transform = `translateY(${(1 - t) * 12}px)`;
        });
        if (body) body.style.transform = `translateY(${-40 * clamp01(p / 0.75)}px)`;
        steps.forEach(({ el, a, b }) => {
          const t = band(p, a, b);
          gsap.set(el, { autoAlpha: t, y: (1 - t) * 12 });
        });
      },
    });
  }

  if (!stills) {
    document.querySelectorAll('[data-world]').forEach(initWorld);
    document.querySelectorAll('[data-pin]').forEach(initPin);
  }
  document.fonts?.ready.then(() => { lenis?.resize(); ScrollTrigger.refresh(); });
})();
