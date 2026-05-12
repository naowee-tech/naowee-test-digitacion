/* ═══════════════════════════════════════════════════════════════════
   modal-activar-inversion.js — Wizard 2 pasos en modal DS oficial.
   Reusa el patrón canónico de modal-convocatoria:
     .naowee-modal-overlay / .naowee-modal--wide
     .naowee-modal__header / __dismiss (hover oficial)
     .naowee-stepper--pulse
     .naowee-modal__footer (sticky)
     Componentes DS: naowee-textfield (vía helper textfield del wizard)

   API: openActivarInversionModal({ proyectoId, onActivado })
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import { formatoMoneda } from './states.js';
import { textfield, bindDropdowns, renderReview, runConfetti, validateRequired, bindValidationReset } from './wizard-page.js';
import { bindMasksIn, unmask } from './masks.js';

const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
/* Check inline para stepper done — patrón DS canónico (playground.html#stepper) */
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;

const STEPS = [
  { label: 'Datos de la inversión' },
  { label: 'Confirmar activación' }
];

function renderStepperOficial() {
  return `
    <div class="naowee-stepper naowee-stepper--pulse">
      ${STEPS.map((s, i) => {
        const n = i + 1;
        const active = n === 1 ? 'naowee-stepper__step--active' : '';
        return `
          <div class="naowee-stepper__step ${active}" data-step="${n}">
            <span class="naowee-stepper__number">${n}</span>
            <span class="naowee-stepper__label">${s.label}</span>
          </div>
          ${i < STEPS.length - 1 ? `<div class="naowee-stepper__connector" data-after="${n}"></div>` : ''}
        `;
      }).join('')}
    </div>
  `;
}

export function openActivarInversionModal({ proyectoId, onActivado } = {}) {
  const p = ProjectData.getProyecto(proyectoId);
  if (!p || p.estado !== 'concepto_favorable') {
    alert('Solo proyectos con concepto favorable pueden activarse en inversión.');
    return;
  }

  const isInfra = p.tipo === 'infraestructura';

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.id = 'activarInversionOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <!-- HEADER fijo -->
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Activar inversión</h2>
          <p class="naowee-modal__subtitle">${p.nombre} · ${p.municipio}${p.departamento ? `, ${p.departamento}` : ''}</p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      <!-- STEPPER -->
      ${renderStepperOficial()}

      <!-- BODY scrollable -->
      <div class="naowee-modal__body">
        <form id="activarInvForm" novalidate>
          <!-- PASO 1 -->
          <div class="ai-step-panel" data-panel="1">
            <div class="naowee-message naowee-message--positive" role="status" style="margin-bottom:20px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="naowee-message__title">Concepto favorable emitido</span>
              </div>
              <div class="naowee-message__text">${p.conceptoFavorabilidad?.observaciones || 'Proyecto cumple con la totalidad de requisitos de la Resolución 933 de 2024.'}</div>
            </div>

            <div class="ai-section-title">Datos de la inversión</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Monto aprobado (COP)', name: 'monto', type: 'text', required: true, value: p.montoSolicitado || 0, helper: `Solicitado: ${formatoMoneda(p.montoSolicitado || 0)}`, mask: 'money' })}
              ${textfield({ label: 'BPIN', name: 'bpin', required: true, placeholder: '2026000000000', helper: 'Código BPIN de 13 dígitos', maxlength: 13 })}
              ${textfield({ label: 'Centro de costo', name: 'centroCosto', required: true, placeholder: 'CC-MIN-DEP-2026-XXX' })}
              ${textfield({ label: 'Ejecutor', name: 'ejecutor', required: true, value: p.formuladora?.nombre || '' })}
            </div>

            ${isInfra ? `
              <div class="naowee-message naowee-message--informative" role="status" style="margin-top:18px;margin-bottom:18px">
                <div class="naowee-message__header">
                  <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                  <span class="naowee-message__title">Registro SUID del escenario</span>
                </div>
                <div class="naowee-message__text">Al activar este proyecto se habilitará el formulario de Registro de Escenarios para inventariar la infraestructura en el sistema nacional.</div>
              </div>
              <div class="ai-section-title">SUID (opcional)</div>
              <div class="ai-grid-1">
                ${textfield({ label: 'Código SUID', name: 'suid', placeholder: 'SUID-CHO-XXX-001', helper: 'Se puede asignar después' })}
              </div>
            ` : ''}
          </div>

          <!-- PASO 2 -->
          <div class="ai-step-panel" data-panel="2" hidden>
            <div class="ai-section-title">Revisar antes de activar</div>
            <p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 18px">Verifica los datos antes de confirmar. Una vez activada, el proyecto entra a la tabla nacional de inversión.</p>
            <div id="aiReviewBox"></div>
          </div>
        </form>
      </div>

      <!-- FOOTER fijo: Anterior (left, solo paso 2) · Continuar/Activar (right) -->
      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="aiBtnPrev" style="display:none;margin-right:auto">${arrowLeftIcon} Anterior</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="aiBtnNext">Continuar ${arrowRightIcon}</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="aiBtnActivar" style="display:none;background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">${checkIcon} Activar inversión</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  /* setTimeout en vez de rAF: rAF se pausa en pestañas inactivas */
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#activarInvForm');
  bindDropdowns(form);
  bindValidationReset(form);
  bindMasksIn(form);

  /* ───── Navegación entre pasos (custom para modal) ───── */
  let currentStep = 1;
  const btnPrev = overlay.querySelector('#aiBtnPrev');
  const btnNext = overlay.querySelector('#aiBtnNext');
  const btnActivar = overlay.querySelector('#aiBtnActivar');

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(STEPS.length, n));
    /* Panels */
    overlay.querySelectorAll('.ai-step-panel').forEach(panel => {
      panel.hidden = parseInt(panel.dataset.panel) !== currentStep;
    });
    /* Stepper visual — patrón DS oficial: --done (no --completed) + SVG check inline */
    overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
      const s = parseInt(step.dataset.step);
      const isDone = s < currentStep;
      step.classList.toggle('naowee-stepper__step--active', s === currentStep);
      step.classList.toggle('naowee-stepper__step--done', isDone);
      /* Reemplazar el número por el check SVG (o restaurar el número) */
      const num = step.querySelector('.naowee-stepper__number');
      if (num) num.innerHTML = isDone ? stepperCheckIcon : String(s);
    });
    overlay.querySelectorAll('.naowee-stepper__connector').forEach(c => {
      const after = parseInt(c.dataset.after);
      c.classList.toggle('naowee-stepper__connector--done', after < currentStep);
    });
    /* Footer buttons */
    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    btnNext.style.display = currentStep < STEPS.length ? 'inline-flex' : 'none';
    btnActivar.style.display = currentStep === STEPS.length ? 'inline-flex' : 'none';
    /* Scroll al top del body */
    overlay.querySelector('.naowee-modal__body').scrollTop = 0;
    /* Si llegamos al paso 2 → render review */
    if (currentStep === 2) buildReview();
  }

  /* Validación progresiva: 1er click muestra helpers --negative + wiggle + autoscroll,
     2do click permite avanzar (no entorpecer la demo). Patrón canónico DS. */
  btnNext.addEventListener('click', () => {
    const activePanel = overlay.querySelector(`.ai-step-panel[data-panel="${currentStep}"]`);
    const valid = validateRequired(activePanel);
    if (!valid) return;
    goToStep(currentStep + 1);
  });
  btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

  /* Click en step para regresar a uno completado */
  overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
    step.addEventListener('click', () => {
      const target = parseInt(step.dataset.step);
      if (target < currentStep) goToStep(target);
    });
  });

  /* ───── Review (paso 2) ───── */
  function buildReview() {
    const fd = new FormData(form);
    const monto = unmask(fd.get('monto')) || 0;
    const groups = [
      {
        title: 'Inversión',
        rows: [
          ['Monto aprobado', `<strong style="color:var(--green)">${formatoMoneda(monto)}</strong>`],
          ['BPIN', fd.get('bpin') || '—'],
          ['Centro de costo', fd.get('centroCosto') || '—'],
          ['Ejecutor', fd.get('ejecutor') || '—'],
          ...(isInfra ? [['SUID', fd.get('suid') || '<span style="color:var(--text-secondary);font-style:italic">Se asignará después</span>']] : [])
        ]
      },
      {
        title: 'Proyecto destino',
        rows: [
          ['ID', p.idUnico],
          ['Nombre', p.nombre],
          ['Municipio', `${p.municipio}${p.departamento ? ` · ${p.departamento}` : ''}`],
          ['Tipo', p.tipo === 'infraestructura' ? 'Infraestructura' : (p.tipo || '—')]
        ]
      }
    ];
    overlay.querySelector('#aiReviewBox').innerHTML = renderReview(groups);
  }

  /* ───── Activar (paso 2 → success) ───── */
  btnActivar.addEventListener('click', () => {
    const fd = new FormData(form);
    const monto = unmask(fd.get('monto')) || 0;
    const bpin = fd.get('bpin') || '—';
    const centroCosto = fd.get('centroCosto') || '—';
    const ejecutor = fd.get('ejecutor') || '—';
    const suid = fd.get('suid') || null;
    const ahora = new Date().toISOString();

    ProjectData.setProyecto(p.idUnico, x => {
      x.estado = 'en_inversion';
      x.inversion = {
        activadaEn: ahora,
        montoAprobado: monto,
        bpin: bpin === '—' ? null : bpin,
        centroCosto: centroCosto === '—' ? null : centroCosto,
        ejecutor: ejecutor === '—' ? null : ejecutor,
        suidEscenario: suid
      };
      x.historial = x.historial || [];
      x.historial.push({
        ts: ahora,
        actor: 'admin',
        evento: `Inversión activada · ${formatoMoneda(monto)}`,
        estado: 'en_inversion'
      });
      return x;
    });

    renderSuccessScreen({ monto, bpin, centroCosto });
  });

  /* ───── Pantalla de éxito custom (modal-aware) ─────
     Reemplaza body + esconde stepper + footer custom.
     Texto pro-max para el admin: qué pasó, qué se notificó, qué sigue. */
  function renderSuccessScreen({ monto, bpin, centroCosto }) {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    const stepper = overlay.querySelector('.naowee-stepper');
    const subtitle = overlay.querySelector('.naowee-modal__subtitle');
    const title = overlay.querySelector('.naowee-modal__title');

    /* Esconder stepper, refinar header */
    if (stepper) stepper.style.display = 'none';
    if (title) title.textContent = 'Activación completada';
    if (subtitle) subtitle.textContent = `${p.nombre} · Resolución 933 de 2024`;

    /* Build notification checklist específico para admin */
    const notifications = [
      { label: 'Proyecto inscrito en la tabla nacional de inversión',         actor: 'Sistema' },
      { label: `Municipio de ${p.municipio} notificado por correo y dashboard`, actor: 'Notificaciones' },
      { label: 'Revisor responsable notificado del cambio de estado',           actor: 'Notificaciones' },
      { label: `BPIN ${bpin} registrado en el sistema de inversión`,            actor: 'BPIN' },
      ...(centroCosto !== '—' ? [{ label: `Centro de costo <strong>${centroCosto}</strong> vinculado`, actor: 'Hacienda' }] : []),
      ...(isInfra ? [{ label: 'Formulario SUID habilitado para registro del escenario', actor: 'SUID' }] : [])
    ];

    body.innerHTML = `
      <div class="ai-success">
        <div class="ai-success__confetti" data-confetti></div>
        <div class="ai-success__check" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="ai-success__title">¡Inversión activada!</h2>
        <p class="ai-success__lede">
          <strong>${p.nombre}</strong> entró a la tabla nacional de inversión por
          <strong style="color:var(--green,#15803d)">${formatoMoneda(monto)}</strong>.
        </p>

        <div class="ai-success__stamp">
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Proyecto</span>
            <span class="ai-success__stamp-value">${p.idUnico}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">BPIN</span>
            <span class="ai-success__stamp-value ai-success__stamp-value--mono">${bpin}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Activada</span>
            <span class="ai-success__stamp-value">${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</span>
          </div>
        </div>

        <div class="ai-success__section-title">Acciones disparadas automáticamente</div>
        <ul class="ai-success__list">
          ${notifications.map(n => `
            <li class="ai-success__list-item">
              <span class="ai-success__list-check" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="ai-success__list-text">${n.label}</span>
              <span class="ai-success__list-actor">${n.actor}</span>
            </li>
          `).join('')}
        </ul>

        <div class="ai-success__next">
          <div class="ai-success__next-title">Siguiente paso</div>
          <p class="ai-success__next-text">
            ${isInfra
              ? 'Coordina con el municipio el diligenciamiento del Registro SUID del escenario para inventariar la infraestructura en el sistema nacional.'
              : 'El proyecto ahora se ejecuta bajo seguimiento. Las actas, avances y reportes financieros aparecerán en la Tabla de inversión.'}
          </p>
        </div>
      </div>
    `;

    /* Footer: 3 acciones contextuales — Volver | Tabla | SUID (solo infra) */
    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="aiSuccessCloseBtn" style="margin-right:auto">
        Volver al proyecto
      </button>
      <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="aiSuccessTablaBtn">
        Ir a tabla de inversión
      </button>
      ${isInfra ? `
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="aiSuccessSuidBtn" style="background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Diligenciar Registro SUID
        </button>
      ` : ''}
    `;

    footer.querySelector('#aiSuccessCloseBtn').addEventListener('click', () => {
      close();
      if (typeof onActivado === 'function') onActivado();
    });
    footer.querySelector('#aiSuccessTablaBtn').addEventListener('click', () => {
      close();
      window.location.href = 'inversion.html';
    });
    footer.querySelector('#aiSuccessSuidBtn')?.addEventListener('click', () => {
      close();
      window.location.href = `registro-suid.html?id=${p.idUnico}`;
    });

    /* Disparar confetti dentro del body */
    runConfetti(body.querySelector('[data-confetti]'));
    /* Scroll al top por si el body venía con scroll del paso 2 */
    body.scrollTop = 0;
  }

  /* ───── Close handlers ───── */
  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 240);
    document.removeEventListener('keydown', escListener);
  }
  function escListener(e) { if (e.key === 'Escape') close(); }
  overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', escListener);

  return { close };
}

export default { openActivarInversionModal };
