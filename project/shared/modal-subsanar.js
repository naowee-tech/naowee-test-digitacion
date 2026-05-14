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
import { textarea, fileUpload, bindFileUploads, renderReview, runConfetti, validateRequired, bindValidationReset } from './wizard-page.js?v=20260514a';
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
  const slaCls = dias === null ? '' : dias <= 0 ? 'sla-chip--vencido' : dias <= 3 ? 'sla-chip--urgent' : dias <= 7 ? 'sla-chip--warning' : 'sla-chip--ok';

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
                <span class="sla-chip ${slaCls}" title="Plazo legal Res. 933">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                  ${dias <= 0 ? 'Vencido' : `${dias} día${dias === 1 ? '' : 's'} para subsanar`}
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
                    ${areaObs.map(o => `
                      <div class="subs-obs">
                        <div class="subs-obs__head">
                          <span class="subs-obs__chip">${o.tipo || 'Observación'}</span>
                          <span class="subs-obs__ref">${o.ref ? `Ref. ${o.ref} · ` : ''}${formatoFecha(o.ts)}</span>
                        </div>
                        <p class="subs-obs__body">${o.detalle || ''}</p>
                        ${textarea({ label: 'Tu respuesta', name: `respuesta_${o.idx}`, required: true, placeholder: 'Describe cómo se subsanó esta observación…', maxlength: 1000, rows: 3 })}
                        ${fileUpload({ name: `soporte_${o.idx}`, label: 'Documento de soporte (opcional)', accept: '.pdf,.jpg,.jpeg,.png', maxSize: 20 })}
                      </div>
                    `).join('')}
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

  /* Estado por-área: progreso + chip dinámico */
  function updateAreaStatus() {
    let totalSubsanadas = 0;
    const totalObs = observaciones.length;
    areas.forEach(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const card = form.querySelector(`.subs-area[data-area="${areaKey}"]`);
      if (!card) return;
      const respondidas = areaObs.filter(o => {
        const ta = form.querySelector(`textarea[name="respuesta_${o.idx}"]`);
        return ta && ta.value.trim().length >= 10;
      }).length;
      const pct = areaObs.length ? (respondidas / areaObs.length) * 100 : 0;
      card.querySelector('[data-progress]').style.width = pct + '%';
      const chip = card.querySelector('[data-status]');
      card.classList.toggle('is-complete', pct === 100);
      card.classList.toggle('is-partial', pct > 0 && pct < 100);
      if (pct === 100) {
        chip.className = 'subs-area__status subs-area__status--completa';
        chip.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:4px;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg>Lista para reenviar';
        totalSubsanadas += areaObs.length;
      } else if (pct > 0) {
        chip.className = 'subs-area__status subs-area__status--parcial';
        chip.textContent = `${respondidas}/${areaObs.length} parcial`;
        totalSubsanadas += respondidas;
      } else {
        chip.className = 'subs-area__status subs-area__status--pendiente';
        chip.textContent = 'Pendiente';
      }
    });
    overlay.querySelector('#statsSubsanadas').textContent = totalSubsanadas;
    overlay.querySelector('#statsPendientes').textContent = totalObs - totalSubsanadas;
  }
  form.addEventListener('input', updateAreaStatus);
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

  /* Review agrupado por área */
  function buildReview() {
    const fd = new FormData(form);
    const groups = areas.map(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const rows = [];
      areaObs.forEach((o, i) => {
        const resp = fd.get(`respuesta_${o.idx}`) || '';
        const sop = fd.get(`soporte_${o.idx}`);
        rows.push([
          `${i + 1}. ${(o.detalle || '—').slice(0, 100)}${(o.detalle || '').length > 100 ? '…' : ''}`,
          `<div style="font-size:13px;color:var(--text-primary)">${resp.slice(0, 300) || '<span style="color:var(--text-secondary);font-style:italic">Sin respuesta</span>'}</div>
           ${sop?.name ? `<div style="margin-top:4px;font-size:11px;color:var(--accent)">📎 ${sop.name}</div>` : ''}`
        ]);
      });
      return { title: `${AREA_NOMBRES[areaKey] || areaKey} · ${areaObs.length} obs.`, rows };
    });
    overlay.querySelector('#subsReviewBox').innerHTML = renderReview(groups);
  }

  /* Envío con persistencia por-área */
  btnEnviar.addEventListener('click', () => {
    const fd = new FormData(form);
    const ahora = new Date().toISOString();
    const areasEnviadas = [];
    const areasParciales = [];

    areas.forEach(areaKey => {
      const areaObs = obsPorArea[areaKey];
      const respondidas = areaObs.filter(o => {
        const r = fd.get(`respuesta_${o.idx}`) || '';
        return r.trim().length >= 10;
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
    ProjectData.setProyecto(p.idUnico, x => {
      x.subsanacionAreas = x.subsanacionAreas || {};
      areasEnviadas.forEach(a => {
        x.subsanacionAreas[a.key] = { ts: ahora, estado: 'enviada', respuestas: a.count };
      });
      areasParciales.forEach(a => {
        x.subsanacionAreas[a.key] = { ts: ahora, estado: 'parcial', respondidas: a.respondidas, total: a.total };
      });
      if (todasCompletas) {
        x.estado = 'en_revision';
        x.fechaInicioRevision = ahora;
      }
      x.historial = x.historial || [];
      x.historial.push({
        ts: ahora, actor: 'municipio',
        evento: todasCompletas
          ? `Subsanación completa enviada · ${areasEnviadas.length} área(s)`
          : `Subsanación parcial · ${areasEnviadas.length} de ${areas.length} áreas completas`,
        estado: x.estado
      });
      return x;
    });

    ProjectData.pushNotificacion({
      perfil: 'revisor',
      tipo: 'subsanacion',
      titulo: todasCompletas ? 'Postulación re-enviada a revisión' : 'Subsanación parcial recibida',
      detalle: `${p.idUnico} · ${areasEnviadas.length} área${areasEnviadas.length === 1 ? '' : 's'} subsanada${areasEnviadas.length === 1 ? '' : 's'}`
    });

    toast({
      variant: 'positive',
      title: todasCompletas ? 'Subsanación completa enviada' : 'Progreso guardado',
      message: todasCompletas
        ? `Postulación volvió a estado "En revisión". El revisor fue notificado.`
        : `${areasEnviadas.length} de ${areas.length} áreas completas. Puedes volver a finalizar las pendientes.`
    });

    renderSuccessScreen({ todasCompletas, areasEnviadas, areasParciales, totalAreas: areas.length });
    if (typeof onSubsanado === 'function') onSubsanado();
  });

  /* Success screen dentro del modal */
  function renderSuccessScreen({ todasCompletas, areasEnviadas, areasParciales, totalAreas }) {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    const stepper = overlay.querySelector('.naowee-stepper');
    if (stepper) stepper.style.display = 'none';

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
          ? `Tu postulación volvió a revisión. El revisor recibió ${areasEnviadas.length} área${areasEnviadas.length === 1 ? '' : 's'} corregida${areasEnviadas.length === 1 ? '' : 's'} y emitirá el concepto en los próximos días.`
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
          <div class="naowee-message__text">${todasCompletas
            ? 'El revisor RBI valida en los próximos 15 días hábiles. Recibirás notificación en tu panel cuando emita concepto.'
            : 'Completa las áreas restantes antes del vencimiento para reanudar la revisión.'}</div>
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
