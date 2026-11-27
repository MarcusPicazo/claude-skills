/* Plantilla base: experiencia 3D educativa (Three.js como módulo ES, sin build).
   Orden: 1) CONTENIDO  2) UI que no depende de 3D (lista, panel, quiz)  3) escena 3D.
   Si Three.js o WebGL fallan, 1 y 2 siguen funcionando (ver SKILL.md §5).

   PARA ADAPTAR A OTRO TEMA: cambia solo CONTENIDO y la función construirModelo().
   Cada objeto clicable lleva userData.id igual al id de su entrada en CONTENIDO.partes. */

// ============================================================================
// 1. CONTENIDO — todos los textos y datos en un solo lugar
// ============================================================================
const CONTENIDO = {
  notaEscala: 'La corteza está dibujada más gruesa para poder verla; las demás capas están a escala.',
  fuente: 'Fuente: USGS y National Geographic Education.',
  partes: [
    {
      id: 'corteza',
      nombre: 'Corteza',
      color: '#8d6e4f',
      resumen: 'Es la capa sólida y delgada donde vivimos. Bajo los océanos es más fina que bajo los continentes.',
      datos: [['Grosor', '5 a 70 km'], ['Estado', 'Sólido']],
    },
    {
      id: 'manto',
      nombre: 'Manto',
      color: '#c2562b',
      resumen: 'Es la capa más grande. Es roca sólida, pero muy caliente, y se mueve lentísimo, como plastilina.',
      datos: [['Llega hasta', '≈ 2,900 km de profundidad'], ['Volumen', '≈ 84 % de la Tierra']],
    },
    {
      id: 'nucleo-externo',
      nombre: 'Núcleo externo',
      color: '#e0a458',
      resumen: 'Es hierro y níquel en estado líquido. Su movimiento produce el campo magnético que mueve las brújulas.',
      datos: [['Profundidad', '≈ 2,900 a 5,150 km'], ['Estado', 'Líquido']],
    },
    {
      id: 'nucleo-interno',
      nombre: 'Núcleo interno',
      color: '#f6e27a',
      resumen: 'Es una esfera de hierro y níquel. Está muy caliente, pero la enorme presión la mantiene sólida.',
      datos: [['Radio', '≈ 1,220 km'], ['Temperatura', 'más de 5,000 °C'], ['Estado', 'Sólido']],
    },
  ],
  quiz: [
    {
      tipo: 'opcion',
      pregunta: '¿Cuál es la capa más grande de la Tierra?',
      opciones: ['La corteza', 'El manto', 'El núcleo interno'],
      correcta: 1,
      explicacion: 'El manto ocupa cerca del 84 % del volumen de la Tierra.',
    },
    {
      tipo: 'tocar',                       // se responde tocando el modelo (o su botón)
      pregunta: 'Toca la capa que está en estado líquido.',
      correcta: 'nucleo-externo',
      explicacion: 'El núcleo externo es hierro y níquel líquidos.',
    },
    {
      tipo: 'opcion',
      pregunta: '¿Por qué el núcleo interno es sólido si está tan caliente?',
      opciones: ['Porque está frío por dentro', 'Por la enorme presión', 'Porque es de roca'],
      correcta: 1,
      explicacion: 'La presión es tan grande que el hierro no puede fundirse.',
    },
  ],
  textos: {
    instruccion: 'Toca una capa para conocerla. Arrastra para girar.',
    instruccionSin3D: 'Elige una capa con los botones de abajo.',
    quizTitulo: 'Pon a prueba lo aprendido',
    pregunta: (n, total) => `Pregunta ${n} de ${total}`,
    correcto: 'Correcto.',
    incorrecto: 'Casi.',
    tocaPista: 'Toca el modelo o usa los botones de abajo.',
    tocaPistaSin3D: 'Elige la respuesta con los botones de abajo.',
    siguiente: 'Siguiente',
    verResultado: 'Ver resultado',
    resultado: (b, t) => `Respondiste bien ${b} de ${t}.`,
    repetir: 'Repetir',
    laRespuesta: (nombre) => `La respuesta era: ${nombre}.`,
  },
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const parte = (id) => CONTENIDO.partes.find((p) => p.id === id);

// ============================================================================
// 2. UI — funciona con o sin 3D
// ============================================================================
const estado = { seleccion: null, modo: 'explorar', quizIndex: 0, aciertos: 0, respondida: false };
let escena = null; // se llena si el 3D arranca: { seleccionar(id), enfocar(id) }

const panel = $('#panel');
const quiz = $('#quiz');

function initUI() {
  $('#nota-escala').textContent = CONTENIDO.notaEscala;

  const lista = $('#chips-lista');
  CONTENIDO.partes.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.objeto = p.id;
    b.style.setProperty('--chip-color', p.color);
    b.setAttribute('aria-pressed', 'false');
    b.textContent = p.nombre;
    b.addEventListener('click', () => elegir(p.id, { desdeBoton: true }));
    lista.appendChild(b);
  });

  document.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', cerrarTodo));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarTodo(); });
  $('[data-quiz-abrir]').addEventListener('click', abrirQuiz);
  $('#quiz-siguiente').addEventListener('click', siguientePregunta);

  // Reserva el alto real de la botonera para que los paneles nunca la tapen.
  const chips = $('#objetos');
  const medir = () => document.documentElement.style.setProperty('--chips-alto', `${chips.offsetHeight}px`);
  new ResizeObserver(medir).observe(chips);
  medir();
}

/** Punto único de entrada al elegir una parte: desde el modelo 3D o desde un botón. */
function elegir(id, { desdeBoton = false } = {}) {
  if (estado.modo === 'quiz') {
    const q = CONTENIDO.quiz[estado.quizIndex];
    if (q && q.tipo === 'tocar' && !estado.respondida) responderTocar(id);
    return;
  }
  estado.seleccion = id;
  marcarChips(id);
  escena?.seleccionar(id);
  escena?.enfocar(id);
  mostrarPanel(id, desdeBoton);
}

function marcarChips(id) {
  document.querySelectorAll('[data-objeto]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.objeto === id)));
}

function mostrarPanel(id, moverFoco) {
  const p = parte(id);
  if (!p) return;
  quiz.hidden = true;
  $('#panel-titulo').textContent = p.nombre;
  $('#panel-resumen').textContent = p.resumen;
  const dl = $('#panel-datos');
  dl.replaceChildren(...p.datos.flatMap(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  }));
  $('#panel-fuente').textContent = CONTENIDO.fuente;
  panel.hidden = false;
  escena?.reencuadrar();
  if (moverFoco) $('#panel-titulo').focus({ preventScroll: true });
}

function cerrarTodo() {
  panel.hidden = true;
  quiz.hidden = true;
  estado.modo = 'explorar';
  estado.seleccion = null;
  marcarChips(null);
  escena?.seleccionar(null);
  escena?.reencuadrar();
}

// ----- Quiz -----
function abrirQuiz() {
  panel.hidden = true;
  estado.modo = 'quiz';
  estado.quizIndex = 0;
  estado.aciertos = 0;
  marcarChips(null);
  escena?.seleccionar(null);
  pintarPregunta();
  quiz.hidden = false;
  escena?.reencuadrar();
  $('#quiz-titulo').focus({ preventScroll: true });
}

function pintarPregunta() {
  const t = CONTENIDO.textos;
  const q = CONTENIDO.quiz[estado.quizIndex];
  estado.respondida = false;
  $('#quiz-progreso').textContent = t.pregunta(estado.quizIndex + 1, CONTENIDO.quiz.length);
  $('#quiz-titulo').textContent = q.pregunta;
  $('#quiz-feedback').replaceChildren();
  $('#quiz-siguiente').hidden = true;
  quiz.classList.toggle('modo-tocar', q.tipo === 'tocar');
  const cont = $('#quiz-opciones');
  cont.replaceChildren();

  if (q.tipo === 'opcion') {
    q.opciones.forEach((texto, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcion';
      b.dataset.opcion = String(i);
      b.textContent = texto;
      b.addEventListener('click', () => responderOpcion(i));
      cont.appendChild(b);
    });
  } else {
    const p = document.createElement('p');
    p.className = 'tocar-pista';
    p.textContent = escena ? t.tocaPista : t.tocaPistaSin3D;
    cont.appendChild(p);
  }
  if (!quiz.hidden) escena?.reencuadrar();
}

function responderOpcion(i) {
  if (estado.respondida) return;
  const q = CONTENIDO.quiz[estado.quizIndex];
  const bien = i === q.correcta;
  document.querySelectorAll('.opcion').forEach((b, j) => {
    b.disabled = true;
    if (j === q.correcta) { b.classList.add('es-correcta'); b.textContent = `✓ ${b.textContent}`; }
    else if (j === i) { b.classList.add('es-incorrecta'); b.textContent = `✗ ${b.textContent}`; }
  });
  cerrarPregunta(bien, q.explicacion);
}

function responderTocar(id) {
  const q = CONTENIDO.quiz[estado.quizIndex];
  const bien = id === q.correcta;
  marcarChips(q.correcta);
  escena?.seleccionar(q.correcta);
  const extra = bien ? '' : ` ${CONTENIDO.textos.laRespuesta(parte(q.correcta).nombre)}`;
  cerrarPregunta(bien, q.explicacion + extra);
}

function cerrarPregunta(bien, explicacion) {
  const t = CONTENIDO.textos;
  estado.respondida = true;
  if (bien) estado.aciertos++;
  const fb = $('#quiz-feedback');
  const s = document.createElement('span');
  s.className = bien ? 'ok' : 'no';
  s.textContent = `${bien ? '✓ ' + t.correcto : '✗ ' + t.incorrecto} `;
  fb.replaceChildren(s, document.createTextNode(explicacion));
  const sig = $('#quiz-siguiente');
  sig.textContent = estado.quizIndex === CONTENIDO.quiz.length - 1 ? t.verResultado : t.siguiente;
  sig.hidden = false;
  sig.focus({ preventScroll: true });
  sig.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); // dentro de la hoja
}

function siguientePregunta() {
  const t = CONTENIDO.textos;
  if (estado.quizIndex >= CONTENIDO.quiz.length) return abrirQuiz(); // botón "Repetir"
  marcarChips(null);
  escena?.seleccionar(null);
  if (estado.quizIndex < CONTENIDO.quiz.length - 1) {
    estado.quizIndex++;
    pintarPregunta();
    $('#quiz-titulo').focus({ preventScroll: true });
    return;
  }
  // Resultado final
  quiz.classList.remove('modo-tocar');
  $('#quiz-progreso').textContent = '';
  $('#quiz-titulo').textContent = t.quizTitulo;
  const r = document.createElement('p');
  r.className = 'resultado';
  r.dataset.quizResultado = '';
  r.textContent = t.resultado(estado.aciertos, CONTENIDO.quiz.length);
  $('#quiz-opciones').replaceChildren(r);
  $('#quiz-feedback').replaceChildren();
  const sig = $('#quiz-siguiente');
  sig.textContent = t.repetir;
  estado.quizIndex = CONTENIDO.quiz.length; // marca "terminado": el botón ahora reinicia
  sig.hidden = false;
  escena?.reencuadrar();
  $('#quiz-titulo').focus({ preventScroll: true });
}

function sin3D(motivo) {
  console.info('[3D desactivado]', motivo);
  document.documentElement.classList.add('no-3d');
  $('#fallback').hidden = false;
  $('#stage').hidden = true;
  $('#instruccion').textContent = CONTENIDO.textos.instruccionSin3D;
  $('#nota-escala').textContent = '';
  escena = null;
}

// ============================================================================
// 3. ESCENA 3D
// ============================================================================
async function init3D() {
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('CDN tardó demasiado')), ms));
  let THREE, OrbitControls;
  try {
    [THREE, { OrbitControls }] = await Promise.race([
      Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]),
      timeout(12000),
    ]);
  } catch (err) { return sin3D(err); }

  const stage = $('#stage');
  const tactil = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(devicePixelRatio || 1, tactil ? 1.5 : 2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' });
  } catch (err) { return sin3D(err); }
  renderer.setPixelRatio(dpr);
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sin3D('contexto WebGL perdido'); });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--color-fondo').trim());
  const camera = new THREE.PerspectiveCamera(40, stage.clientWidth / stage.clientHeight, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.4));
  // Luz atada a la cámara: lo que el alumno mira siempre está iluminado, gire como gire.
  const luz = new THREE.DirectionalLight(0xffffff, 1.9);
  luz.position.set(1, 1.2, 0.5);
  camera.add(luz);
  scene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 7;
  controls.rotateSpeed = tactil ? 0.7 : 1;

  const { grupo, clicables, orientarCorteHacia, acercamiento } = construirModelo(THREE, { segmentos: tactil ? 48 : 64 });
  scene.add(grupo);

  // --- Zona libre: el hueco que no tapan encabezado, botonera ni panel ---
  // El modelo se centra ahí con setViewOffset (no se mueve la cámara ni se pierde el giro).
  const zonaLibre = (conPanel) => {
    const W = stage.clientWidth, H = stage.clientHeight;
    let top = $('.topbar').getBoundingClientRect().bottom + 8;
    let bottom = $('#objetos').getBoundingClientRect().top - 8;
    let right = W;
    const hoja = conPanel && document.querySelector('.sheet:not([hidden])');
    if (hoja) {
      const r = hoja.getBoundingClientRect();
      if (r.left > W / 2) right = r.left - 8;   // panel lateral (escritorio)
      else bottom = Math.min(bottom, r.top - 8); // hoja inferior (celular)
    }
    if (bottom - top < H * 0.25) top = Math.max(0, bottom - H * 0.25); // nunca menos de 1/4 de alto
    return { W, H, cx: right / 2, cy: (top + bottom) / 2, w: right, h: bottom - top };
  };

  const distanciaBase = () => {
    const z = zonaLibre(false);
    const radio = 1.08; // radio del modelo + margen
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tv = t * (z.h / z.H);                           // fov vertical efectivo de la zona libre
    const th = t * (z.W / z.H) * (z.w / z.W);             // fov horizontal efectivo
    return radio / Math.sin(Math.atan(Math.min(tv, th)));
  };

  const desfase = { x: 0, y: 0, tx: 0, ty: 0 };
  function aplicarDesfase() {
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, desfase.x, desfase.y, stage.clientWidth, stage.clientHeight);
  }
  function reencuadrar() {
    const z = zonaLibre(true);
    desfase.tx = -(z.cx - z.W / 2);
    desfase.ty = -(z.cy - z.H / 2);
    if (reduceMotion) { desfase.x = desfase.tx; desfase.y = desfase.ty; aplicarDesfase(); }
  }

  // Vista inicial: en diagonal y desde arriba, mirando al octante abierto.
  const VISTA = new THREE.Vector3(1, 0.75, 1).normalize();
  grupo.rotation.y = orientarCorteHacia(VISTA);
  camera.position.copy(VISTA).multiplyScalar(distanciaBase());
  controls.maxDistance = Math.max(7, distanciaBase() * 1.6);
  reencuadrar();
  desfase.x = desfase.tx; desfase.y = desfase.ty; aplicarDesfase();

  // --- Selección y hover ---
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let hoverId = null;
  let seleccionId = null;

  function pintarEstados() {
    clicables.forEach((m) => {
      const id = m.userData.id;
      const base = m.userData.colorBase;
      const activo = id === seleccionId;
      const hover = id === hoverId;
      m.material.emissive.copy(base).multiplyScalar(activo ? 0.4 : hover ? 0.2 : 0);
      // Oscurecer en vez de volver transparente: sin errores de orden de dibujo en capas anidadas.
      m.material.color.copy(base).multiplyScalar(seleccionId && !activo ? 0.45 : 1);
    });
  }

  function idBajo(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(puntero, camera);
    const hit = raycaster.intersectObjects(clicables, false)[0];
    return hit ? hit.object.userData.id : null;
  }

  // Tap vs. arrastre: solo es "clic" si el dedo/ratón casi no se movió.
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const movio = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8;
    const lento = performance.now() - down.t > 600;
    down = null;
    if (movio || lento) return;
    const id = idBajo(e.clientX, e.clientY);
    if (id) elegir(id);
  });

  // Hover solo con ratón; se procesa una vez por frame.
  const tooltip = $('#tooltip');
  let ultimoMove = null;
  renderer.domElement.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') ultimoMove = e; });
  renderer.domElement.addEventListener('pointerleave', () => { ultimoMove = null; hoverId = null; tooltip.hidden = true; stage.classList.remove('is-hover'); pintarEstados(); });

  function procesarHover() {
    if (!ultimoMove) return;
    const e = ultimoMove; ultimoMove = null;
    const id = idBajo(e.clientX, e.clientY);
    if (id !== hoverId) { hoverId = id; pintarEstados(); }
    stage.classList.toggle('is-hover', !!id);
    tooltip.hidden = !id;
    if (id) {
      tooltip.textContent = parte(id).nombre;
      const r = stage.getBoundingClientRect();
      tooltip.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, calc(-100% - 14px))`;
    }
  }

  // --- Transición de cámara (sin librerías) ---
  let anim = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function moverCamara(destino, ms = 900) {
    if (reduceMotion) { camera.position.copy(destino); controls.update(); return; }
    anim = { desde: camera.position.clone(), hasta: destino.clone(), t0: performance.now(), ms };
  }

  escena = {
    reencuadrar,
    seleccionar(id) { seleccionId = id; pintarEstados(); },
    enfocar(id) {
      // Vuelve a la vista del corte y se acerca más a las partes pequeñas.
      moverCamara(VISTA.clone().multiplyScalar(distanciaBase() * (acercamiento[id] ?? 1)));
    },
  };
  pintarEstados();

  // --- Tamaño ---
  function ajustar() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    renderer.setSize(w, h);
    reencuadrar();
    desfase.x = desfase.tx; desfase.y = desfase.ty;
    aplicarDesfase(); // también actualiza la proyección
  }
  new ResizeObserver(ajustar).observe(stage);

  // --- Bucle: se detiene con la pestaña oculta ---
  let corriendo = false;
  function frame(now) {
    if (!corriendo) return;
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.ms);
      camera.position.lerpVectors(anim.desde, anim.hasta, ease(k));
      if (k === 1) anim = null;
    }
    if (Math.abs(desfase.tx - desfase.x) > 0.5 || Math.abs(desfase.ty - desfase.y) > 0.5) {
      desfase.x += (desfase.tx - desfase.x) * 0.15;
      desfase.y += (desfase.ty - desfase.y) * 0.15;
      aplicarDesfase();
    }
    procesarHover();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  const arrancar = () => { if (!corriendo && !document.hidden) { corriendo = true; requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) corriendo = false; else arrancar(); });
  controls.addEventListener('start', () => { anim = null; }); // el usuario manda sobre la animación
  arrancar();

  document.documentElement.classList.add('webgl-ok');
}

/** Construye el modelo del tema. Devuelve el grupo, las mallas clicables y una función que
 *  orienta el corte hacia una dirección de vista. Aquí: la Tierra sin un octante (1/8) para
 *  ver las capas por dentro, como en los cortes de los libros de texto. */
function construirModelo(THREE, { segmentos }) {
  const grupo = new THREE.Group();
  const clicables = [];
  // Radios relativos al radio terrestre (6,371 km). La corteza real mide ~0.5 % del radio:
  // se exagera (nota visible en pantalla) para que se pueda ver y tocar.
  const capas = [
    { id: 'corteza', rExt: 1.0, rInt: 0.94 },
    { id: 'manto', rExt: 0.94, rInt: 0.546 },       // 3,480 km / 6,371 km
    { id: 'nucleo-externo', rExt: 0.546, rInt: 0.192 },
    { id: 'nucleo-interno', rExt: 0.192, rInt: 0 },  // 1,220 km / 6,371 km
  ];
  const Q = Math.PI / 2;
  const hs = Math.round(segmentos / 4); // segmentos por cuarto de meridiano

  capas.forEach(({ id, rExt, rInt }) => {
    const color = new THREE.Color(parte(id).color);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
    const piezas = [
      // Hemisferio sur completo + hemisferio norte sin un cuarto (phi de 270° a 360°).
      new THREE.Mesh(new THREE.SphereGeometry(rExt, segmentos, hs, 0, Math.PI * 2, Q, Q), mat),
      new THREE.Mesh(new THREE.SphereGeometry(rExt, Math.round(segmentos * 0.75), hs, 0, Q * 3, 0, Q), mat),
    ];
    // Tres caras planas del corte: dos verticales (bordes del gajo) y el piso horizontal.
    const cuarto = (t0) => new THREE.RingGeometry(rInt, rExt, hs * 2, 1, t0, Q);
    [0, Q * 3].forEach((phi) => {
      const cara = new THREE.Mesh(cuarto(0), mat);
      cara.rotation.y = Math.PI + phi; // lleva el eje +x del anillo al meridiano phi
      piezas.push(cara);
    });
    const piso = new THREE.Mesh(cuarto(Q), mat);
    piso.rotation.x = -Q;            // al plano ecuatorial, cuadrante (-x, -z) = el hueco
    piezas.push(piso);

    piezas.forEach((m) => {
      m.userData = { id, colorBase: color.clone() }; // id = CONTENIDO.partes[].id
      grupo.add(m);
      clicables.push(m);
    });
  });

  // La bisectriz del hueco en coordenadas locales es (-1, 0, -1). Devuelve el giro en Y
  // que la apunta hacia `vista` (vector desde el centro hacia la cámara).
  const orientarCorteHacia = (vista) => Math.atan2(vista.x, vista.z) - Math.atan2(-1, -1);
  // Cuánto acercar la cámara al elegir cada parte (1 = vista completa).
  const acercamiento = { corteza: 1, manto: 0.92, 'nucleo-externo': 0.8, 'nucleo-interno': 0.7 };
  return { grupo, clicables, orientarCorteHacia, acercamiento };
}

// ============================================================================
initUI();
init3D();
