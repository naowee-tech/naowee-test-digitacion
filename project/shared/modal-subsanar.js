/* ═══════════════════════════════════════════════════════════════════
   modal-subsanar.js — Wizard 2 pasos en modal DS oficial.
   Mismo patrón canónico que modal-postular + modal-activar-inversion:
     .naowee-modal-overlay.is-open / .naowee-modal--wide
     .naowee-modal__header / __dismiss
     .naowee-stepper--pulse con --done + check SVG inline
     .naowee-modal__footer (sticky) — Volver (left) · Continuar/Enviar (right)
     Success screen reusando runConfetti

   API: openSubsanarModal({ proyectoId, onSubsanado })

   Reemplaza la antigua municipio/subsanar.html que era una página dedicada.
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import { formatoFecha, diasRestantes } from './states.js';
import { textarea, fileUpload, bindFileUploads, renderReview, runConfetti, validateRequired, bindValidationReset } from './wizard-page.js?v=20260516b';
import { toast } from './toast.js';

const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const sendIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;

const STEPS = [
  { label: 'Responder por área' },
  { label: 'Revisar y enviar' }
];

/* Mapa área → ícono semántico (espejo de los anexos en modal-postular) */
const AREA_ICONS = {
  topografico:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/></svg>',
  suelos:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 7 12 2 21 7 12 12 3 7"/><polyline points="3 12 12 17 21 12"/><polyline points="3 17 12 22 21 17"/></svg>',
  arquitectonico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><path d="M10 22v-4h4v4"/></svg>',
  estructural:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="3" x2="21" y2="3"/><rect x="5" y="3" width="3" height="18"/><rect x="11" y="3" width="3" height="18"/><rect x="17" y="3" width="2" height="18"/></svg>',
  hidrosanitario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
  electrico:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  ambiental:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19.2 2.96c.97 6.43 0 11.48-2.4 14.21A7 7 0 0111 20z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>',
  presupuesto:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>',
  general:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'
};

const AREA_NOMBRES = {
  topografico:    'Levantamiento topográfico',
  suelos:         'Estudio de suelos',
  arquitectonico: 'Diseño arquitectónico',
  estructural:    'Diseño estructural',
  hidrosanitario: 'Diseño hidrosanitario',
  electrico:      'Diseño eléctrico',
  ambiental:      'Manejo, riesgos y ambiental',
  presupuesto:    'Presupuesto integral',
  general:        'Observaciones generales'
};

function renderStepperOficial(currentStep = 1) {
  return `
    <div class="naowee-stepper naowee-stepper--pulse">
      ${STEPS.map((s, i) => {
        const n = i + 1;
        const active = n === currentStep ? 'naowee-stepper__step--active' : '';
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

export function openSubsanarModal({ proyectoId, onSubsanado } = {}) {
  const p = ProjectData.getProyecto(proyectoId);
  if (!p) {
    toast({ variant: 'caution', title: 'Proyecto no encontrado', message: 'No se pudo cargar la postulación.' });
    return;
  }
  const observaciones = p.observaciones || [];
  if (observaciones.length === 0) {
    toast({ variant: 'informative', title: 'Sin observaciones', message: 'Esta postulación no tiene observaciones pendientes.' });
    return;
  }

  /* Agrupar por área técnica (Res. 933 Art. 9) */
  const obsPorArea = {};
  observaciones.forEach((o, idx) => {
    const area = o.area || 'general';
    if (!obsPorArea[area]) obsPorArea[area] = [];
    obsPorArea[area].push({ ...o, idx });
  });
  const areas = Object.keys(obsPorArea);
  const isMultiArea = areas.length > 1;
  const dias = diasRestantes(p.fechaDevolucion);
  /* Doug 16/05/2026: usar utility transversal .naowee-sla.
     Semántica unificada: vencido (≤0) · warn (≤5) · ok (>5). */
  const slaVariant = dias === null ? '' : dias <= 0 ? 'vencido' : dias <= 5 ? 'warn' : 'ok';

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Subsanar postulación</h2>
          <p class="naowee-modal__subtitle">${p.nombre} · ${observaciones.length} ${observaciones.length === 1 ? 'observación' : 'observaciones'}${isMultiArea ? ` en ${areas.length} áreas` : ''}</p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      ${renderStepperOficial(1)}

      <div class="naowee-modal__body">
        <form id="subsanarForm" novalidate>
          <!-- PASO 1 — Responder por área -->
          <div class="ai-step-panel" data-panel="1">
            <div class="subs-summary subs-summary--in-modal">
              <div class="subs-summary__stats">
                <div>
                  <div class="subs-summary__stat-label">${isMultiArea ? 'Áreas devueltas' : 'Observaciones'}</div>
                  <div class="subs-summary__stat-value">${isMultiArea ? areas.length : observaciones.length}</div>
                </div>
                <div>
                  <div class="subs-summary__stat-label">Subsanadas</div>
                  <div class="subs-summary__stat-value" id="statsSubsanadas">0</div>
                </div>
                <div>
                  <div class="subs-summary__stat-label">Pendientes</div>
                  <div class="subs-summary__stat-value" id="statsPendientes">${observaciones.length}</div>
                </div>
              </div>
              ${dias !== null ? `
                <span class="naowee-sla naowee-sla--${slaVariant}" title="Plazo legal Res. 933">
                  <svg class="naowee-sla__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                  <strong class="naowee-sla__num">${dias <= 0 ? 'Vencido' : `${dias} día${dias === 1 ? '' : 's'}`}</strong>
                  ${dias > 0 ? '<span class="naowee-sla__label">para subsanar</span>' : ''}
                </span>
              ` : ''}
            </div>

            <p style="font-size:13px;color:var(--text-secondary);margin:0 0 16px">
              ${isMultiArea
                ? 'Las observaciones están agrupadas por área técnica. Responde cada área de manera independiente — cada una se marca como subsanada cuando completes todas sus observaciones.'
                : 'Responde cada observación con texto y, si aplica, adjunta el documento corregido.'}
            </p>

            ${areas.map(areaKey => {
              const areaObs = obsPorArea[areaKey];
              return `
                <div class="subs-area" data-area="${areaKey}">
                  <div class="subs-area__head">
                    <span class="subs-area__icon">${AREA_ICONS[areaKey] || AREA_ICONS.general}</span>
                    <div style="flex:1;min-width:0">
                      <div class="subs-area__title">${AREA_NOMBRES[areaKey] || areaKey}</div>
                      <div class="subs-area__count">${areaObs.length} ${areaObs.length === 1 ? 'observación' : 'observaciones'} a subsanar</div>
                    </div>
                    <span class="subs-area__status subs-area__status--pendiente" data-status>Pendiente</span>
                  </div>
                  <div class="subs-area__progress"><span data-progress style="width:0%"></span></div>
                  <div class="subs-area__body">
                    ${areaObs.map((o, i) => {
                      /* Doug 16/05/2026: smart accordion. Truncar el detalle
                         a la primera oración para el header, mostrar completo
                         dentro del body como "cita destacada". */
                      const titleShort = (o.detalle || 'Observación').split('.')[0].slice(0, 80) || 'Observación';
                      return `
                        <details class="subs-obs-item" data-obs-idx="${o.idx}">
                          <summary class="subs-obs-item__head">
                            <span class="subs-obs-item__num">
                              <span class="subs-obs-item__num-text">${i + 1}</span>
                              <span class="subs-obs-item__num-check" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </span>
                            </span>
                            <div class="subs-obs-item__head-body">
                              <div class="subs-obs-item__title" title="${o.detalle || ''}">${titleShort}</div>
                              <div class="subs-obs-item__ref">${o.ref ? `Ref. ${o.ref} · ` : ''}${formatoFecha(o.ts)}</div>
                            </div>
                            <span class="subs-obs-item__status subs-obs-item__status--pendiente" data-obs-status>Pendiente</span>
                            <svg class="subs-obs-item__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </summary>
                          <div class="subs-obs-item__body">
                            ${fileUpload({ name: `soporte_${o.idx}`, label: 'Documento corregido', required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 20 })}
                            ${textarea({ label: 'Nota para el revisor', name: `respuesta_${o.idx}`, required: false, placeholder: 'Aclara qué se corrigió o agrega contexto adicional (opcional)…', maxlength: 1000, rows: 3 })}
                            <div class="subs-obs-item__actions">
                              <button type="button" class="subs-obs-item__mark" data-mark-subsanada disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Marcar como subsanada
                              </button>
                            </div>
                          </div>
                        </details>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- PASO 2 — Revisar -->
          <div class="ai-step-panel" data-panel="2" hidden>
            <p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 18px">Confirma las respuestas antes de enviar la subsanación a revisión.</p>
            <div id="subsReviewBox"></div>
          </div>
        </form>
      </div>

      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="subsBtnPrev" style="display:none;margin-right:auto">${arrowLeftIcon} Volver</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="subsBtnNext">Continuar ${arrowRightIcon}</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="subsBtnEnviar" style="display:none;background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">${sendIcon} Enviar subsanación</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#subsanarForm');
  bindFileUploads(form);
  bindValidationReset(form);

  /* ═══ Smart accordion: primer pendiente abierto, resto closed ═══ */
  const allItems = Array.from(form.querySelectorAll('.subs-obs-item'));
  if (allItems[0]) allItems[0].open = true;

  /* ═══ Estado por-área: cuenta items con .subs-obs-item--done ═══
     Doug 16/05/2026: cambio de criterio — antes era textarea.length >= 10
     (auto-detected). Ahora es explícito vía "Marcar como subsanada" para
     dar control al user + momento celebratorio cuando avanza. */
  function updateAreaStatus() {
    let totalSubsanadas = 0;
    const totalObs = observaciones.length;
    areas.forEach(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const card = form.querySelector(`.subs-area[data-area="${areaKey}"]`);
      if (!card) return;
      const subsanadas = areaObs.filter(o => {
        const item = card.querySelector(`.subs-obs-item[data-obs-idx="${o.idx}"]`);
        return item?.classList.contains('subs-obs-item--done');
      }).length;
      const pct = areaObs.length ? (subsanadas / areaObs.length) * 100 : 0;
      card.querySelector('[data-progress]').style.width = pct + '%';
      const chip = card.querySelector('[data-status]');
      card.classList.toggle('is-complete', pct === 100);
      card.classList.toggle('is-partial', pct > 0 && pct < 100);
      if (pct === 100) {
        chip.className = 'subs-area__status subs-area__status--completa';
        chip.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:4px;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg>Lista para reenviar';
      } else if (pct > 0) {
        chip.className = 'subs-area__status subs-area__status--parcial';
        chip.textContent = `${subsanadas}/${areaObs.length} parcial`;
      } else {
        chip.className = 'subs-area__status subs-area__status--pendiente';
        chip.textContent = 'Pendiente';
      }
      totalSubsanadas += subsanadas;
    });
    overlay.querySelector('#statsSubsanadas').textContent = totalSubsanadas;
    overlay.querySelector('#statsPendientes').textContent = totalObs - totalSubsanadas;
    /* Bloquear "Continuar" hasta tener todo subsanado */
    updateContinueBtn(totalSubsanadas === totalObs);
  }
  function updateContinueBtn(allDone) {
    const btn = overlay.querySelector('#subsBtnNext');
    if (!btn) return;
    btn.disabled = !allDone;
    btn.title = allDone ? '' : 'Marca todas las observaciones como subsanadas para continuar';
    btn.style.opacity = allDone ? '' : '.5';
    btn.style.cursor = allDone ? '' : 'not-allowed';
  }

  /* Enable "Marcar subsanada" cuando hay archivo adjunto.
     Doug 17/05/2026: el documento es lo que importa al revisor, la nota
     queda opcional para aclarar contexto. */
  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type="file"][name^="soporte_"]')) {
      const item = e.target.closest('.subs-obs-item');
      const btn = item?.querySelector('[data-mark-subsanada]');
      if (!btn) return;
      btn.disabled = !e.target.files || e.target.files.length === 0;
    }
  });

  /* Click "Marcar subsanada" → mark done + collapse + auto-open next pendiente.
     Doug 17/05/2026: removido el estado "Actualizar respuesta" (botón azul).
     El item queda done; si el user lo reabre puede editar libremente y el
     CTA mantiene la misma acción. */
  form.addEventListener('click', (e) => {
    const markBtn = e.target.closest('[data-mark-subsanada]');
    if (!markBtn || markBtn.disabled) return;
    e.preventDefault();
    const item = markBtn.closest('.subs-obs-item');
    if (!item) return;
    item.classList.add('subs-obs-item--done');
    const status = item.querySelector('[data-obs-status]');
    status.className = 'subs-obs-item__status subs-obs-item__status--done';
    status.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Subsanada';
    item.open = false;
    updateAreaStatus();
    const next = allItems.find(it => !it.classList.contains('subs-obs-item--done') && !it.open);
    if (next) {
      next.open = true;
      setTimeout(() => {
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  });

  updateAreaStatus();

  /* Navegación de pasos */
  let currentStep = 1;
  const btnPrev = overlay.querySelector('#subsBtnPrev');
  const btnNext = overlay.querySelector('#subsBtnNext');
  const btnEnviar = overlay.querySelector('#subsBtnEnviar');

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(STEPS.length, n));
    overlay.querySelectorAll('.ai-step-panel').forEach(panel => {
      panel.hidden = parseInt(panel.dataset.panel) !== currentStep;
    });
    overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
      const s = parseInt(step.dataset.step);
      const isDone = s < currentStep;
      step.classList.toggle('naowee-stepper__step--active', s === currentStep);
      step.classList.toggle('naowee-stepper__step--done', isDone);
      const num = step.querySelector('.naowee-stepper__number');
      if (num) num.innerHTML = isDone ? stepperCheckIcon : String(s);
    });
    overlay.querySelectorAll('.naowee-stepper__connector').forEach(c => {
      const after = parseInt(c.dataset.after);
      c.classList.toggle('naowee-stepper__connector--done', after < currentStep);
    });
    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    btnNext.style.display = currentStep < STEPS.length ? 'inline-flex' : 'none';
    btnEnviar.style.display = currentStep === STEPS.length ? 'inline-flex' : 'none';
    overlay.querySelector('.naowee-modal__body').scrollTop = 0;
    if (currentStep === STEPS.length) buildReview();
  }

  btnNext.addEventListener('click', () => {
    const activePanel = overlay.querySelector(`.ai-step-panel[data-panel="${currentStep}"]`);
    const valid = validateRequired(activePanel);
    if (!valid) return;
    goToStep(currentStep + 1);
  });
  btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

  overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
    step.addEventListener('click', () => {
      const target = parseInt(step.dataset.step);
      if (target < currentStep) goToStep(target);
    });
  });

  /* Review agrupado por área (paso 2 readonly).
     Doug 17/05/2026: redesign UX/UI — cada observación es una row con
     check verde, detalle, archivo destacado tipo chip + nota opcional como
     cita gris. El header del grupo lleva un badge "Listo para enviar" si
     todas las obs del área están done. */
  function buildReview() {
    const fd = new FormData(form);
    const escape = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const formatBytes = (b) => {
      if (!b) return '';
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };
    const html = areas.map(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const totalDone = areaObs.filter(o => {
        const item = form.querySelector(`.subs-obs-item[data-obs-idx="${o.idx}"]`);
        return item?.classList.contains('subs-obs-item--done');
      }).length;
      const allDone = totalDone === areaObs.length;
      const items = areaObs.map((o, i) => {
        const resp = (fd.get(`respuesta_${o.idx}`) || '').toString().trim();
        const sop = fd.get(`soporte_${o.idx}`);
        const sopName = sop?.name || '';
        const sopSize = sop?.size ? ` · ${formatBytes(sop.size)}` : '';
        return `
          <li class="subs-review__item">
            <span class="subs-review__num" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div class="subs-review__body">
              <div class="subs-review__obs"><span class="subs-review__obs-num">${i + 1}.</span> ${escape(o.detalle || '—')}</div>
              ${sopName ? `
                <div class="subs-review__file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                  <span class="subs-review__file-name">${escape(sopName)}</span>
                  <span class="subs-review__file-size">${escape(sopSize)}</span>
                </div>
              ` : `
                <div class="subs-review__file subs-review__file--missing">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>Sin documento adjunto</span>
                </div>
              `}
              ${resp ? `<div class="subs-review__note">${escape(resp)}</div>` : ''}
            </div>
          </li>
        `;
      }).join('');
      return `
        <div class="subs-review__group ${allDone ? 'is-complete' : ''}">
          <div class="subs-review__group-head">
            <span class="subs-review__group-icon">${AREA_ICONS[areaKey] || AREA_ICONS.general}</span>
            <div class="subs-review__group-info">
              <div class="subs-review__group-title">${AREA_NOMBRES[areaKey] || areaKey}</div>
              <div class="subs-review__group-meta">${totalDone} de ${areaObs.length} ${areaObs.length === 1 ? 'observación subsanada' : 'observaciones subsanadas'}</div>
            </div>
            <span class="naowee-badge ${allDone ? 'naowee-badge--positive' : 'naowee-badge--caution'} naowee-badge--small">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                ${allDone ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
              </svg>
              ${allDone ? 'Listo para enviar' : 'Incompleto'}
            </span>
          </div>
          <ol class="subs-review__list">${items}</ol>
        </div>
      `;
    }).join('');
    overlay.querySelector('#subsReviewBox').innerHTML = `<div class="subs-review">${html}</div>`;
  }

  /* Envío con persistencia por-área */
  btnEnviar.addEventListener('click', () => {
    const fd = new FormData(form);
    const ahora = new Date().toISOString();
    const areasEnviadas = [];
    const areasParciales = [];

    /* Doug 17/05/2026: criterio de "respondida" cambió de
       textarea.length >= 10 a la clase .subs-obs-item--done (set explícito
       por el user vía "Marcar como subsanada"). El documento es ahora
       el campo mandatorio, la nota es opcional. */
    areas.forEach(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const respondidas = areaObs.filter(o => {
        const item = form.querySelector(`.subs-obs-item[data-obs-idx="${o.idx}"]`);
        return item?.classList.contains('subs-obs-item--done');
      });
      if (respondidas.length === areaObs.length) {
        areasEnviadas.push({ key: areaKey, nombre: AREA_NOMBRES[areaKey], count: respondidas.length });
      } else if (respondidas.length > 0) {
        areasParciales.push({ key: areaKey, nombre: AREA_NOMBRES[areaKey], respondidas: respondidas.length, total: areaObs.length });
      }
    });

    if (areasEnviadas.length === 0) {
      toast({ variant: 'caution', title: 'Sin áreas completas', message: 'Debes completar todas las observaciones de al menos un área para enviar.' });
      return;
    }

    const todasCompletas = areasParciales.length === 0;
    /* Doug 15/05/2026: persist:
       - Cada respuesta como nueva observación (autor: municipio) en el chat
       - Cada documento adjunto en p.documentos para que el revisor lo vea
       - Marcar cada observación original como respondida (o.respondida = true) */
    const perfilMun = ProjectData.getPerfilData?.('municipio');
    const muniNombre = perfilMun?.nombre || 'Municipio';
    const muniAvatar = (perfilMun?.nombre || 'MU').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const respuestasPersist = [];
    const adjuntosPersist = [];
    observaciones.forEach((o, idx) => {
      const item = form.querySelector(`.subs-obs-item[data-obs-idx="${idx}"]`);
      const isDone = item?.classList.contains('subs-obs-item--done');
      if (!isDone) return;
      const resp = (fd.get(`respuesta_${idx}`) || '').toString().trim();
      const soporte = fd.get(`soporte_${idx}`);
      /* Persist siempre la respuesta cuando el item está done. Si el
         municipio no escribió nota, generamos una entrada por defecto que
         menciona el documento corregido (que sí es el mandatorio). */
      respuestasPersist.push({
        ts: ahora,
        autor: 'municipio',
        autorNombre: muniNombre,
        autorAvatar: muniAvatar,
        autorColor: '#1f78d1',
        autorRol: 'Municipio',
        area: o.area || 'general',
        tipo: 'Respuesta del municipio',
        replyToTs: o.ts,
        detalle: resp || (soporte?.name
          ? `Documento corregido adjunto: ${soporte.name}.`
          : 'Observación marcada como subsanada por el municipio.')
      });
      if (soporte?.name) {
        adjuntosPersist.push({
          id: `subs-${idx}-${Date.now()}`,
          nombre: `Soporte de subsanación · ${AREA_NOMBRES[o.area || 'general'] || o.area}`,
          archivo: soporte.name,
          size: soporte.size || 0,
          subidoEn: ahora,
          subsanacionDe: o.ts,
          area: o.area || 'general'
        });
      }
    });

    /* Doug 17/05/2026: end-to-end del flujo de subsanación.
       Cada área enviada cambia a estado 'subsanada' (nuevo) que
         (a) deja la card editable de nuevo en revisar-area.html
         (b) muestra cenefa info "Subsanación recibida" al revisor
         (c) reinicia el SLA de re-evaluación
       Además se push UNA notificación por revisor asignado (no genérica),
       con `revisorId` y `href` deep-link para que el dashboard del revisor
       pueda filtrarla y ofrecer la acción directa. */
    const docsPorArea = {};
    adjuntosPersist.forEach(d => {
      docsPorArea[d.area] = (docsPorArea[d.area] || 0) + 1;
    });
    const obsPorAreaCount = {};
    respuestasPersist.forEach(r => {
      obsPorAreaCount[r.area] = (obsPorAreaCount[r.area] || 0) + 1;
    });

    ProjectData.setProyecto(p.idUnico, x => {
      x.subsanacionAreas = x.subsanacionAreas || {};
      areasEnviadas.forEach(a => {
        x.subsanacionAreas[a.key] = { ts: ahora, estado: 'enviada', respuestas: a.count };
      });
      areasParciales.forEach(a => {
        x.subsanacionAreas[a.key] = { ts: ahora, estado: 'parcial', respondidas: a.respondidas, total: a.total };
      });
      /* Reset del estado de cada área subsanada → 'subsanada' (re-evaluable).
         Se conserva el checklist anterior como referencia y se setea
         subsanadoEn + nuevosDocsCount + nuevasObsCount para el banner. */
      if (x.docsTecnica?.areas) {
        x.docsTecnica = {
          ...x.docsTecnica,
          areas: x.docsTecnica.areas.map(ar => {
            const enviada = areasEnviadas.find(ae => ae.key === ar.id);
            if (!enviada) return ar;
            return {
              ...ar,
              estado: 'subsanada',
              subsanadoEn: ahora,
              nuevosDocsCount: docsPorArea[ar.id] || 0,
              nuevasObsCount: obsPorAreaCount[ar.id] || 0,
              /* SLA reset: 15 días para re-evaluar */
              fechaLimite: (() => {
                const lim = new Date(ahora);
                lim.setDate(lim.getDate() + 15);
                return lim.toISOString();
              })()
            };
          })
        };
      }
      if (x.docsGeneral && areasEnviadas.find(ae => ae.key === 'general')) {
        x.docsGeneral = {
          ...x.docsGeneral,
          estadoRevision: 'subsanada',
          subsanadoEn: ahora,
          nuevosDocsCount: docsPorArea.general || 0,
          nuevasObsCount: obsPorAreaCount.general || 0
        };
      }
      if (todasCompletas) {
        x.estado = 'en_revision';
        x.fechaInicioRevision = ahora;
      }
      /* Append respuestas del municipio al hilo de observaciones */
      x.observaciones = x.observaciones || [];
      respuestasPersist.forEach(r => x.observaciones.push(r));
      /* Marcar las observaciones del revisor como respondidas (para QA del revisor) */
      x.observaciones.forEach((o, i) => {
        if (o.autor === 'revisor' && respuestasPersist.some(r => r.replyToTs === o.ts)) {
          x.observaciones[i] = { ...o, respondida: true };
        }
      });
      /* Persistir documentos de soporte de subsanación + areaId canónico
         (revisar-area.html filtra docs por d.areaId). */
      x.documentos = x.documentos || [];
      adjuntosPersist.forEach(d => x.documentos.push({
        ...d,
        areaId: d.area,
        bloque: d.area === 'general' ? 'general' : 'tecnica'
      }));
      x.historial = x.historial || [];
      x.historial.push({
        ts: ahora, actor: 'municipio',
        evento: todasCompletas
          ? `Subsanación completa enviada · ${areasEnviadas.length} área(s) · ${respuestasPersist.length} respuesta(s)${adjuntosPersist.length ? ' · ' + adjuntosPersist.length + ' adjunto(s)' : ''}`
          : `Subsanación parcial · ${areasEnviadas.length} de ${areas.length} áreas completas`,
        estado: x.estado
      });
      return x;
    });

    /* Per-revisor notifications: una por área (con su revisorId asignado)
       para que cada revisor vea EXACTAMENTE las áreas que le tocan a él. */
    const proyectoEnriquecido = ProjectData.getProyecto(p.idUnico);
    const revisoresNotificados = new Map(); /* revisorId → {areas:[], total} */
    areasEnviadas.forEach(a => {
      const areaState = (proyectoEnriquecido?.docsTecnica?.areas || []).find(ar => ar.id === a.key);
      const revisorId = a.key === 'general'
        ? proyectoEnriquecido?.docsGeneral?.revisorId
        : areaState?.revisorId;
      if (!revisorId) return;
      const acc = revisoresNotificados.get(revisorId) || { areas: [], total: 0 };
      acc.areas.push({ key: a.key, nombre: a.nombre, count: a.count, docs: docsPorArea[a.key] || 0 });
      acc.total += a.count;
      revisoresNotificados.set(revisorId, acc);
    });
    revisoresNotificados.forEach((info, revisorId) => {
      const r = ProjectData.getRevisor?.(revisorId);
      const primeraArea = info.areas[0];
      const isMulti = info.areas.length > 1;
      const docsTotal = info.areas.reduce((s, a) => s + a.docs, 0);
      const href = isMulti
        ? `doc-tecnica.html?id=${p.idUnico}`
        : (primeraArea.key === 'general'
          ? `doc-general.html?id=${p.idUnico}`
          : `revisar-area.html?id=${p.idUnico}&area=${primeraArea.key}`);
      ProjectData.pushNotificacion({
        perfil: 'revisor',
        revisorId,
        proyectoId: p.idUnico,
        tipo: 'subsanacion',
        titulo: isMulti
          ? `Subsanación recibida · ${info.areas.length} áreas`
          : `Subsanación recibida · ${primeraArea.nombre}`,
        detalle: `${p.nombre || p.idUnico} — ${muniNombre} envió ${docsTotal} documento${docsTotal === 1 ? '' : 's'} corregido${docsTotal === 1 ? '' : 's'} y ${info.total} respuesta${info.total === 1 ? '' : 's'} para tu revisión.`,
        href
      });
    });
    /* Notif global para el coordinador admin (auditoria del flujo) */
    ProjectData.pushNotificacion({
      perfil: 'admin',
      proyectoId: p.idUnico,
      tipo: 'subsanacion',
      titulo: todasCompletas ? 'Postulación re-enviada a revisión' : 'Subsanación parcial recibida',
      detalle: `${p.idUnico} · ${areasEnviadas.length} área${areasEnviadas.length === 1 ? '' : 's'} subsanada${areasEnviadas.length === 1 ? '' : 's'} · ${respuestasPersist.length} respuesta${respuestasPersist.length === 1 ? '' : 's'}`,
      href: `proyecto-detalle.html?id=${p.idUnico}`
    });

    /* Lista de nombres de revisores notificados para el toast + success */
    const nombresNotificados = Array.from(revisoresNotificados.keys())
      .map(rid => ProjectData.getRevisor?.(rid)?.nombre)
      .filter(Boolean);
    const notifResumen = nombresNotificados.length === 0
      ? 'el equipo revisor'
      : nombresNotificados.length === 1
      ? nombresNotificados[0]
      : nombresNotificados.length === 2
      ? `${nombresNotificados[0]} y ${nombresNotificados[1]}`
      : `${nombresNotificados[0]} y ${nombresNotificados.length - 1} revisores más`;

    toast({
      variant: 'positive',
      title: todasCompletas ? 'Subsanación completa enviada' : 'Progreso guardado',
      message: todasCompletas
        ? `Postulación volvió a "En revisión". ${notifResumen} fue notificado${nombresNotificados.length === 1 ? '' : 's'}.`
        : `${areasEnviadas.length} de ${areas.length} áreas completas. Puedes volver a finalizar las pendientes.`
    });

    renderSuccessScreen({ todasCompletas, areasEnviadas, areasParciales, totalAreas: areas.length, nombresNotificados });
    if (typeof onSubsanado === 'function') onSubsanado();
  });

  /* Success screen dentro del modal */
  function renderSuccessScreen({ todasCompletas, areasEnviadas, areasParciales, totalAreas, nombresNotificados = [] }) {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    const stepper = overlay.querySelector('.naowee-stepper');
    if (stepper) stepper.style.display = 'none';

    const revisoresMsg = nombresNotificados.length === 0
      ? 'El equipo revisor fue notificado'
      : nombresNotificados.length === 1
      ? `<strong>${nombresNotificados[0]}</strong> fue notificado`
      : nombresNotificados.length === 2
      ? `<strong>${nombresNotificados[0]}</strong> y <strong>${nombresNotificados[1]}</strong> fueron notificados`
      : `<strong>${nombresNotificados[0]}</strong> y <strong>${nombresNotificados.length - 1}</strong> revisores más fueron notificados`;

    body.innerHTML = `
      <div class="ai-success">
        <div class="ai-success__confetti" data-confetti></div>
        <div class="ai-success__check" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="ai-success__title">${todasCompletas ? '¡Subsanación enviada!' : 'Subsanación parcial guardada'}</h2>
        <p class="ai-success__sub">${todasCompletas
          ? `${revisoresMsg} y verán los nuevos documentos en su bandeja. La postulación vuelve a estado "En revisión".`
          : `Guardamos ${areasEnviadas.length} de ${totalAreas} áreas. Las restantes (${areasParciales.map(a => a.nombre).join(', ')}) siguen pendientes — puedes volver y completarlas antes del vencimiento.`}</p>
        <div class="ai-success__stamp">
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Áreas completas</span>
            <span class="ai-success__stamp-value">${areasEnviadas.length} / ${totalAreas}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Fecha</span>
            <span class="ai-success__stamp-value">${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</span>
          </div>
        </div>
        <div class="naowee-message naowee-message--informative" role="status" style="margin-top:18px;text-align:left">
  <div class="naowee-message__header">
    <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
    <span class="naowee-message__title">Siguiente paso</span>
  </div>
  <div class="naowee-message__content">
    <p class="naowee-message__text">${todasCompletas
            ? 'El revisor RBI valida en los próximos 15 días hábiles. Recibirás notificación en tu panel cuando emita concepto.'
            : 'Completa las áreas restantes antes del vencimiento para reanudar la revisión.'}</p>
  </div>
</div>

      </div>
    `;
    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-close style="background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">${arrowRightIcon} Volver al proyecto</button>
    `;
    footer.querySelector('[data-close]').addEventListener('click', close);
    runConfetti(body.querySelector('[data-confetti]'));
    body.scrollTop = 0;
  }

  /* Close handlers */
  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 240);
    document.removeEventListener('keydown', escListener);
  }
  function escListener(e) { if (e.key === 'Escape') close(); }
  overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  setTimeout(() => {
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }, 50);
  document.addEventListener('keydown', escListener);

  return { close };
}

export default { openSubsanarModal };
