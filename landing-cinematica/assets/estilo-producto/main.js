/* Plantilla "producto / startup": Lenis + GSAP ScrollTrigger, sin build.
   Cada sección en su propia función init*. Ver references/estilo-producto.md. */
(() => {
  // Sin librerías (CDN caído o bloqueado) la página se lee completa, y el menú móvil y el
  // formulario TIENEN que seguir funcionando: por eso no se hace `return` aquí arriba.
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 767px)').matches;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let lenis = null;
  let suppressST = false; // se activa durante saltos largos del menú

  // ---------- Lenis sincronizado con ScrollTrigger (un solo reloj: gsap.ticker) ----------
  function initLenis() {
    if (reduceMotion || !window.Lenis) return;
    lenis = new Lenis({
      autoRaf: false,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on('scroll', () => { if (!suppressST) ScrollTrigger.update(); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- Navbar flotante + menú móvil ----------
  function initNav() {
    const nav = document.getElementById('nav');
    if (hasGsap) ScrollTrigger.create({ start: 'top -50', end: 99999, toggleClass: { className: 'is-floating', targets: nav } });

    const burger = document.getElementById('burger');
    const menu = document.getElementById('menu-movil');
    const setOpen = (open) => { menu.hidden = !open; burger.setAttribute('aria-expanded', String(open)); };
    burger.addEventListener('click', () => setOpen(menu.hidden));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); burger.focus(); } });
  }

  // ---------- Scroll suave desde el menú, sin reproducir las animaciones de en medio ----------
  function initNavScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        const target = id.length > 1 ? document.querySelector(id) : null;
        if (!target || !lenis) return;
        e.preventDefault();
        suppressST = true;
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: easeInOutCubic,
          onComplete: () => { suppressST = false; ScrollTrigger.update(); },
        });
      });
    });
  }

  // ---------- Hero: el contenido crece y se desvanece ----------
  function initHero() {
    if (reduceMotion) return;
    gsap.to('.hero__content', {
      scale: 1.5, opacity: 0, ease: 'power2.in',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
    });
  }

  // ---------- Entradas genéricas scrubeadas (reversibles) ----------
  function initUps() {
    gsap.utils.toArray('[data-up]').forEach((el) => {
      if (reduceMotion) return;
      // data-delay (0, 0.1, 0.2…) se convierte en un desfase pequeño del start: cascada
      // izquierda→derecha sin que la última termine cuando el usuario ya se fue.
      const offset = Math.round((parseFloat(el.dataset.delay) || 0) * 150);
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, ease: 'power1.out',
        scrollTrigger: { trigger: el, start: offset ? `top bottom-=${offset}` : 'top bottom', end: 'top 80%', scrub: 0.6 },
      });
    });
  }

  // ---------- Manifiesto: letras + zoom que atraviesa el texto ----------
  let statementST = null;
  function buildStatement() {
    const el = document.getElementById('statement-text');
    if (!el) return;
    const text = el.dataset.text || el.textContent.trim();
    el.dataset.text = text;
    el.setAttribute('aria-label', text);
    el.replaceChildren(...text.split(' ').map((word) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'c';
        c.textContent = ch; // el estado inicial (tenue) ya viene del CSS bajo .js: sin destello
        w.appendChild(c);
      });
      return w;
    }));
  }
  function initStatement() {
    const statement = document.querySelector('.statement'); // por clase: puede vivir dentro de otra sección
    if (!statement) return;
    buildStatement();
    if (reduceMotion) return;
    // Si el texto se reconstruye (p. ej. cambio de idioma), llama de nuevo a initStatement:
    // el timeline viejo apuntaría a spans que ya no existen.
    if (statementST) statementST.kill();
    const zoom = document.querySelector('.statement__zoom');
    gsap.set(zoom, { clearProps: 'scale,opacity' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top top', end: 'bottom bottom', scrub: 1.3 } });
    tl.to('#statement-text .c', { opacity: 1, y: 0, scale: 1, stagger: 0.02, ease: 'power2.out', duration: 3 })
      .to(zoom, { scale: 1, duration: 1.5 })                        // pausa de lectura
      .to(zoom, { scale: isMobile() ? 40 : 60, ease: 'power4.in', duration: 4 })
      .to(zoom, { opacity: 0, ease: 'power2.in', duration: 2 }, '<');
    statementST = tl.scrollTrigger;
  }

  // ---------- Filas de funciones: número → ícono con rebote → texto ----------
  function initRows() {
    if (reduceMotion) return;
    gsap.utils.toArray('.row').forEach((row) => {
      const [num, icon, body] = row.children;
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top bottom-=60', end: 'top 55%', scrub: 0.6 } })
        .fromTo(num, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, 0)
        .fromTo(icon, { opacity: 0, y: 24, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)', duration: 1 }, 0.12)
        .fromTo(body, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 1 }, 0.24);
    });
  }

  // ---------- Filas de tarjetas con giro 3D alternando lado ([data-flip-row]) ----------
  function initFlip() {
    if (reduceMotion) return;
    document.querySelectorAll('[data-flip-row]').forEach((row) => initFlipRow(row));
  }
  function initFlipRow(row) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top bottom-=30', end: 'top 50%', scrub: 0.6 } });
    [...row.children].forEach((card, i) => {
      tl.fromTo(card,
        { opacity: 0, y: 20, rotateY: i % 2 ? 55 : -55, transformPerspective: 800 },
        { opacity: 1, y: 0, rotateY: 0, duration: 1 }, i * 0.12);
    });
  }

  // ---------- Lista de espera ----------
  // data-endpoint vacío = demo: valida y muestra éxito sin enviar nada (dilo en la entrega).
  // Con endpoint (Formspree, Netlify Forms, propio): POST con FormData y Accept: JSON.
  function initForm() {
    const form = document.getElementById('waitlist-form');
    if (!form) return;
    const msg = document.getElementById('form-msg');
    const email = form.elements.email;
    const button = form.querySelector('button[type="submit"]');
    const say = (text, ok) => { msg.textContent = text; msg.className = `form__msg ${ok ? 'is-ok' : 'is-error'}`; };
    let sending = false; // candado contra doble toque
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      const valid = email.value.trim() !== '' && email.checkValidity();
      email.setAttribute('aria-invalid', String(!valid));
      if (!valid) { say(form.dataset.msgInvalid, false); email.focus(); return; }
      const endpoint = form.dataset.endpoint;
      sending = true; button.disabled = true;
      try {
        if (endpoint) {
          const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(res.status);
        }
        say(endpoint ? form.dataset.msgOk : `${form.dataset.msgOk} (Demo: no se envió nada.)`, true);
        form.reset(); email.removeAttribute('aria-invalid');
      } catch { say(form.dataset.msgError, false); }
      finally { sending = false; button.disabled = false; }
    });
  }

  // ---------- Aviso "empieza / sigue bajando" tras 1 s sin scroll ----------
  function initScrollHint() {
    const hint = document.getElementById('scroll-hint');
    const text = document.getElementById('scroll-hint-text');
    const hero = document.getElementById('hero');
    let last = performance.now();
    addEventListener('scroll', () => { last = performance.now(); }, { passive: true });
    setInterval(() => {
      const idle = performance.now() - last > 1000;
      const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
      const show = idle && !atBottom;
      hint.style.opacity = show ? '1' : '0';
      if (show) text.textContent = hero.getBoundingClientRect().bottom > innerHeight * 0.5 ? 'Empieza a bajar' : 'Sigue bajando';
    }, 200);
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  initNav();   // funciona sin GSAP
  initForm();  // funciona sin GSAP
  if (!hasGsap) return;
  initLenis();
  initNavScroll();
  initHero();
  initUps();
  initStatement();
  initRows();
  initFlip();
  initScrollHint();
  // Las fuentes web cambian la altura de los titulares: recalcula al tenerlas.
  document.fonts?.ready.then(() => { lenis?.resize(); ScrollTrigger.refresh(); });
})();
