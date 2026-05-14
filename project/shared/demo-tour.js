/* ═══════════════════════════════════════════════════════════════════
   demo-tour.js — Tour guiado paso-a-paso para onboarding de la demo.

   v2.0 (Doug 14/05/2026): activado por default cuando demoMode === 'guided'.
   State machine REACTIVA — escucha cambios de localStorage / project:state
   y avanza al step que corresponde al estado actual del proyecto.

   API:
     Tour.mount({ pageId })  → singleton, lee estado y muestra step relevante
     Tour.close()            → oculta el tour (persiste hasta Restart o reset)
     Tour.restart()          → vuelve a mostrar el step actual

   No depende de librerías externas. Sigue el DS Naowee:
   - Overlay oscurece el fondo
   - Spotlight con clip-path sobre el target
   - Card-tooltip con .naowee-card pattern (title + body + footer)
  ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';

const TOUR_CLOSED_KEY = 'naowee.project.tourClosed';
const TOUR_DEBOUNCE_MS = 150;

/* ───── Definición de pasos (state machine) ─────
   Cada step tiene:
   - id           → identificador único
   - title        → header del tooltip
   - body         → instrucción
   - target       → selector CSS donde apunta el spotlight (puede ser null = sin spotlight)
   - position     → 'bottom' | 'top' | 'left' | 'right' | 'center' (sin target)
   - applicable   → (state) => boolean : true si el step corresponde al estado actual
   - pageHint     → URL relativa donde el step es relevante (mostrar "Ir a esa página" si no)
   - totalSteps   → cuántos pasos hay (para "Paso X de Y")
   - stepIndex    → posición en la secuencia
*/
function getSteps() {
  return [
    {
      id: 'crear-convocatoria',
      stepIndex: 1,
      title: 'Crea tu primera convocatoria',
      body: 'Empieza el flujo abriendo una convocatoria. Define el año, los documentos a pedir y los entes territoriales que pueden postular.',
      target: '[data-tour="nueva-convocatoria"], button.naowee-btn--loud',
      position: 'bottom',
      pageHint: 'admin/convocatorias.html',
      pageHintLabel: 'Ir a Convocatorias',
      applicable: s => s.perfilActivo === 'admin' && s.convocatorias.length === 0
    },
    {
      id: 'cambiar-a-municipio',
      stepIndex: 2,
      title: 'Cambia al perfil Municipio',
      body: 'La convocatoria está abierta. Ahora simulemos al municipio que postula un proyecto. Usa el chip "DEMO" abajo para cambiar de perfil.',
      target: '#demoSwitcherToggle',
      position: 'top',
      pageHint: 'admin/convocatorias.html',
      applicable: s => s.convocatorias.length >= 1 && s.proyectos.length === 0 && s.perfilActivo === 'admin'
    },
    {
      id: 'postular-proyecto',
      stepIndex: 3,
      title: 'Postula tu primer proyecto',
      body: 'Desde el perfil Municipio, entra a la convocatoria activa y postula un proyecto cargando los 3 bloques de documentos: RBI, General y Técnica.',
      target: '[data-tour="postular-proyecto"], a[href*="postular"], button:not([data-close])',
      position: 'bottom',
      pageHint: 'municipio/convocatorias.html',
      pageHintLabel: 'Ir a Convocatorias activas',
      applicable: s => s.proyectos.length === 0 && s.perfilActivo === 'municipio'
    },
    {
      id: 'cambiar-a-rbi',
      stepIndex: 4,
      title: 'Cambia a Revisor RBI',
      body: 'Tu proyecto está en revisión. Ahora simulemos al revisor RBI (Diana Patricia) que valida los Requisitos Básicos Indispensables.',
      target: '#demoSwitcherToggle',
      position: 'top',
      applicable: s => s.proyectos.length >= 1
        && (s.proyectos[0].estado === 'en_revision_rbi' || s.proyectos[0].estado === 'presentado' || s.proyectos[0].estado === 'en_revision')
        && s.perfilActivo === 'municipio'
    },
    {
      id: 'aprobar-rbi',
      stepIndex: 5,
      title: 'Aprueba el RBI',
      body: 'Como revisora RBI, abre la postulación pendiente y marca el RBI como favorable. Al aprobar, se libera la revisión de Doc General + las 8 áreas técnicas.',
      target: 'tbody tr:first-child, [data-tour="postulacion-row"]',
      position: 'bottom',
      pageHint: 'revisor/bandeja.html',
      pageHintLabel: 'Ir a la bandeja',
      applicable: s => s.perfilActivo === 'revisor'
        && s.revisorTipo === 'rbi'
        && s.proyectos.length >= 1
        && ['presentado', 'en_revision', 'en_revision_rbi'].includes(s.proyectos[0].estado)
    },
    {
      id: 'cambiar-a-general',
      stepIndex: 6,
      title: 'Cambia a Revisor Doc General',
      body: 'RBI aprobado. Ahora le toca a Luis Felipe (revisor de Documentación General) validar el bloque 2. Cambia de revisor en el chip "DEMO".',
      target: '#demoSwitcherToggle',
      position: 'top',
      applicable: s => s.proyectos.length >= 1
        && ['rbi_aprobada', 'en_revision_docs', 'etapa_documental', 'favorable'].includes(s.proyectos[0].estado)
        && (s.revisorTipo === 'rbi' || s.perfilActivo !== 'revisor')
    },
    {
      id: 'revisar-general',
      stepIndex: 7,
      title: 'Revisa la Documentación General',
      body: 'Abre el proyecto y aprueba la documentación general. Mientras tanto, los 4 revisores técnicos están revisando sus áreas en paralelo.',
      target: '[data-tour="postulacion-row"], tbody tr:first-child',
      position: 'bottom',
      pageHint: 'revisor/doc-general.html',
      pageHintLabel: 'Ir a Doc. General',
      applicable: s => s.perfilActivo === 'revisor'
        && s.revisorTipo === 'general'
        && s.proyectos.length >= 1
        && ['rbi_aprobada', 'en_revision_docs', 'etapa_documental', 'favorable'].includes(s.proyectos[0].estado)
    },
    {
      id: 'fin-tour',
      stepIndex: 8,
      title: '¡Llegaste al final del flujo guiado!',
      body: 'Has recorrido el flujo principal: postular → RBI → Doc General → áreas técnicas. Puedes seguir explorando libremente o reiniciar el tour desde el chip "DEMO".',
      target: null,
      position: 'center',
      applicable: s => s.proyectos.length >= 1
        && ['concepto_favorable', 'en_inversion'].includes(s.proyectos[0].estado)
    }
  ];
}

function getTotalSteps() {
  return getSteps().length;
}

/* ───── Construcción del estado para resolver el step actual ───── */
function buildState() {
  const proyectos = ProjectData.getProyectos();
  const convocatorias = ProjectData.getConvocatorias();
  const perfilActivo = ProjectData.getPerfil();
  const revisor = perfilActivo === 'revisor' ? ProjectData.getRevisorActivo?.() : null;
  return {
    perfilActivo,
    revisorTipo: revisor?.tipo || null,
    proyectos,
    convocatorias,
    /* Quick check helper para applicable() */
    proyectoEstado: proyectos[0]?.estado || null
  };
}

function pickActiveStep() {
  const state = buildState();
  const steps = getSteps();
  return steps.find(s => s.applicable(state)) || null;
}

/* ───── Render del overlay + spotlight + tooltip ───── */
let _overlay = null;
let _resizeObserver = null;
let _pendingTimer = null;

function mountTourElements() {
  if (_overlay) return _overlay;
  _overlay = document.createElement('div');
  _overlay.className = 'demo-tour-overlay';
  _overlay.id = 'demoTourOverlay';
  _overlay.setAttribute('aria-hidden', 'true');
  _overlay.innerHTML = `
    <div class="demo-tour-spotlight" data-spotlight></div>
    <div class="demo-tour-tooltip" role="dialog" aria-labelledby="demoTourTitle" data-tooltip>
      <div class="demo-tour-tooltip__head">
        <span class="demo-tour-tooltip__step" data-step-label>Paso 1 de 8</span>
        <button type="button" class="demo-tour-tooltip__close" data-close aria-label="Cerrar tour">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <h3 class="demo-tour-tooltip__title" id="demoTourTitle" data-title>—</h3>
      <p class="demo-tour-tooltip__body" data-body>—</p>
      <div class="demo-tour-tooltip__footer">
        <a class="naowee-btn naowee-btn--quiet naowee-btn--small" href="#" data-page-hint hidden>—</a>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-action-primary>Entendido</button>
      </div>
    </div>
  `;
  document.body.appendChild(_overlay);
  _overlay.querySelector('[data-close]').addEventListener('click', close);
  return _overlay;
}

function unmountTourElements() {
  if (_overlay) { _overlay.remove(); _overlay = null; }
}

function positionTooltip(target) {
  if (!_overlay) return;
  const tooltip = _overlay.querySelector('[data-tooltip]');
  const spotlight = _overlay.querySelector('[data-spotlight]');
  if (!target) {
    /* Sin target: tooltip centrado, sin spotlight */
    spotlight.style.display = 'none';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    return;
  }
  spotlight.style.display = '';
  const rect = target.getBoundingClientRect();
  const PAD = 8;
  spotlight.style.top    = (rect.top    - PAD) + 'px';
  spotlight.style.left   = (rect.left   - PAD) + 'px';
  spotlight.style.width  = (rect.width  + PAD * 2) + 'px';
  spotlight.style.height = (rect.height + PAD * 2) + 'px';

  /* Tooltip posicionado debajo (o arriba si no hay espacio) */
  const tipH = tooltip.offsetHeight || 200;
  const spaceBelow = window.innerHeight - rect.bottom;
  const showAbove = spaceBelow < (tipH + 24) && rect.top > (tipH + 24);
  tooltip.style.position = 'fixed';
  tooltip.style.transform = 'none';
  if (showAbove) {
    tooltip.style.top = (rect.top - tipH - 16) + 'px';
  } else {
    tooltip.style.top = (rect.bottom + 16) + 'px';
  }
  const tipW = tooltip.offsetWidth || 360;
  let left = rect.left + (rect.width / 2) - (tipW / 2);
  left = Math.max(16, Math.min(window.innerWidth - tipW - 16, left));
  tooltip.style.left = left + 'px';
}

function renderStep(step) {
  if (!_overlay) mountTourElements();
  if (!step) {
    _overlay.classList.remove('is-open');
    return;
  }
  _overlay.classList.add('is-open');
  _overlay.querySelector('[data-step-label]').textContent = `Paso ${step.stepIndex} de ${getTotalSteps()}`;
  _overlay.querySelector('[data-title]').textContent = step.title;
  _overlay.querySelector('[data-body]').textContent = step.body;

  /* Page hint: si la página actual no es la sugerida, mostrar link */
  const hint = _overlay.querySelector('[data-page-hint]');
  if (step.pageHint && !location.pathname.endsWith('/' + step.pageHint) && !location.pathname.endsWith(step.pageHint)) {
    hint.textContent = step.pageHintLabel || `Ir a ${step.pageHint}`;
    hint.href = pathPrefix() + step.pageHint;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }

  /* Buscar target en el DOM */
  let target = null;
  if (step.target) {
    const selectors = step.target.split(',').map(s => s.trim());
    for (const sel of selectors) {
      target = document.querySelector(sel);
      if (target) break;
    }
  }
  positionTooltip(target);

  /* CTA primario = cerrar (el avance es automático cuando cambia el estado) */
  const btn = _overlay.querySelector('[data-action-primary]');
  btn.textContent = step.id === 'fin-tour' ? 'Cerrar tour' : 'Entendido';
  btn.onclick = step.id === 'fin-tour' ? close : () => {
    /* Acknowledge: oculta temporalmente para que el usuario actúe */
    _overlay.classList.remove('is-open');
  };
}

function pathPrefix() {
  /* Detecta si estamos en admin/, municipio/, revisor/ o raíz */
  const parts = location.pathname.split('/').filter(Boolean);
  return parts.length >= 2 ? '../' : '';
}

/* ───── Loop de polling (estado puede cambiar por navegación cross-tab) ───── */
function refresh() {
  clearTimeout(_pendingTimer);
  _pendingTimer = setTimeout(() => {
    const closed = localStorage.getItem(TOUR_CLOSED_KEY) === '1';
    const mode = ProjectData.getDemoMode?.() || 'guided';
    if (mode !== 'guided' || closed) {
      if (_overlay) _overlay.classList.remove('is-open');
      return;
    }
    const step = pickActiveStep();
    renderStep(step);
  }, TOUR_DEBOUNCE_MS);
}

function close() {
  localStorage.setItem(TOUR_CLOSED_KEY, '1');
  if (_overlay) _overlay.classList.remove('is-open');
}

function restart() {
  localStorage.removeItem(TOUR_CLOSED_KEY);
  refresh();
}

function mount(_opts = {}) {
  if (typeof window === 'undefined') return;
  mountTourElements();
  /* Reaccionar a cambios de estado */
  window.addEventListener('project:state', refresh);
  window.addEventListener('storage', e => {
    if (e.key === 'naowee.project.v6' || e.key === TOUR_CLOSED_KEY) refresh();
  });
  window.addEventListener('resize', () => {
    const step = pickActiveStep();
    const target = step?.target ? document.querySelector(step.target.split(',')[0].trim()) : null;
    positionTooltip(target);
  });
  /* Render inicial — esperamos un tick para que el DOM de la página esté listo */
  setTimeout(refresh, 200);
}

export const Tour = { mount, close, restart, refresh };
export default Tour;
