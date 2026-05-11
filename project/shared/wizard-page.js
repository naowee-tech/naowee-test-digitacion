/* ═══════════════════════════════════════════════════════════════════
   wizard-page.js — Wizard pattern embebido en página (no modal).
   Reusa los builders del modal de convocatoria + replica navegación.

   API:
     renderStepper(steps)           → HTML string del stepper oficial DS
     renderFooter({...})            → HTML string del footer flat
     mountWizard({...})             → wira navegación, save-draft, click-to-step
     mountFileDrops(scope)          → wira los .wz-file-drop con preview
     mountCheckboxes(scope)         → fuerza visibility del SVG (HANDOFF)
     renderReview(groups)           → HTML de paso "Revisar"
     renderSuccess(scope, opts)     → reemplaza body por confetti + check
   Re-exports: textfield, textarea, dropdown, checkbox, bindDropdowns
   ═══════════════════════════════════════════════════════════════════ */

import { textfield, textarea, dropdown, checkbox, bindDropdowns } from './modal-convocatoria.js';

const checkSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const arrowLeft = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRight = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const saveIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
const uploadIcon = `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`;

/* ─────────────────────────────────────────────────────────
   Stepper render
   ───────────────────────────────────────────────────────── */
export function renderStepper(steps) {
  /* steps: [{ label }, ...]  → primero is-active, resto idle */
  return `
    <div class="naowee-stepper naowee-stepper--pulse" data-wz-stepper>
      ${steps.map((s, i) => {
        const n = i + 1;
        const isActive = i === 0;
        return `
          <div class="naowee-stepper__step ${isActive ? 'naowee-stepper__step--active' : ''}" data-step="${n}">
            <span class="naowee-stepper__number">${n}</span>
            <span class="naowee-stepper__label">${s.label}</span>
          </div>
          ${i < steps.length - 1 ? `<div class="naowee-stepper__connector" data-after="${n}"></div>` : ''}
        `;
      }).join('')}
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   Footer render — flat structure con margin-right:auto en Anterior
   ───────────────────────────────────────────────────────── */
export function renderFooter({
  cancelHref = null,
  cancelLabel = 'Cancelar',
  saveDraft = true,
  publishLabel = 'Enviar',
  publishIconHTML = ''
} = {}) {
  return `
    <div class="wz-footer" data-wz-footer>
      <button type="button" class="naowee-btn naowee-btn--mute wz-footer__prev" data-wz-prev style="display:none">
        ${arrowLeft} Anterior
      </button>
      ${cancelHref ? `<a class="naowee-btn naowee-btn--quiet" href="${cancelHref}">${cancelLabel}</a>` : ''}
      ${saveDraft ? `<button type="button" class="wz-save-draft" data-wz-save-draft>${saveIcon} Guardar borrador</button>` : ''}
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-wz-next>
        Continuar ${arrowRight}
      </button>
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-wz-publish style="display:none">
        ${publishIconHTML} ${publishLabel}
      </button>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   Wizard navigation — equivalente a goToStep del modal
   ───────────────────────────────────────────────────────── */
export function mountWizard({
  scope,
  totalSteps,
  onPublish,
  onSaveDraft,
  validateStep = () => true
}) {
  let currentStep = 1;

  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;

    /* Stepper update */
    const steps = scope.querySelectorAll('[data-wz-stepper] .naowee-stepper__step');
    const connectors = scope.querySelectorAll('[data-wz-stepper] .naowee-stepper__connector');
    steps.forEach(step => {
      const s = parseInt(step.dataset.step);
      step.classList.toggle('naowee-stepper__step--active', s === n);
      step.classList.toggle('naowee-stepper__step--done', s < n);
      const num = step.querySelector('.naowee-stepper__number');
      if (s < n) {
        num.innerHTML = checkSVG;
      } else {
        num.textContent = String(s);
      }
    });
    connectors.forEach(c => {
      const after = parseInt(c.dataset.after);
      c.classList.toggle('naowee-stepper__connector--done', after < n);
    });

    /* Panels */
    scope.querySelectorAll('.wz-step-panel').forEach(panel => {
      panel.classList.toggle('is-active', parseInt(panel.dataset.panel) === n);
    });

    /* Footer buttons */
    const prevBtn = scope.querySelector('[data-wz-prev]');
    const nextBtn = scope.querySelector('[data-wz-next]');
    const pubBtn = scope.querySelector('[data-wz-publish]');
    if (prevBtn) prevBtn.style.display = n > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = n < totalSteps ? 'inline-flex' : 'none';
    if (pubBtn) pubBtn.style.display = n === totalSteps ? 'inline-flex' : 'none';

    /* Scroll panel a inicio si es scrollable */
    const body = scope.querySelector('[data-wz-body]');
    if (body) body.scrollTop = 0;
    /* Scroll suave al top de la card también */
    scope.scrollIntoView({ behavior: 'smooth', block: 'start' });

    currentStep = n;
  }

  /* Click en step done para retroceder */
  scope.querySelectorAll('[data-wz-stepper] .naowee-stepper__step').forEach(step => {
    step.addEventListener('click', () => {
      if (!step.classList.contains('naowee-stepper__step--done')) return;
      goToStep(parseInt(step.dataset.step));
    });
  });

  /* Continuar */
  scope.querySelector('[data-wz-next]')?.addEventListener('click', () => {
    const panel = scope.querySelector(`.wz-step-panel[data-panel="${currentStep}"]`);
    if (!validateStep(panel, currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  });

  /* Anterior */
  scope.querySelector('[data-wz-prev]')?.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  /* Publicar */
  scope.querySelector('[data-wz-publish]')?.addEventListener('click', () => {
    const panel = scope.querySelector(`.wz-step-panel[data-panel="${currentStep}"]`);
    if (!validateStep(panel, currentStep)) return;
    onPublish?.();
  });

  /* Guardar borrador */
  scope.querySelector('[data-wz-save-draft]')?.addEventListener('click', () => {
    if (onSaveDraft) {
      onSaveDraft();
    } else {
      alert('Borrador guardado localmente (mock). Podrás retomarlo desde tu lista.');
    }
  });

  return {
    goToStep,
    getCurrentStep: () => currentStep
  };
}

/* ─────────────────────────────────────────────────────────
   File drop builder (HTML)
   ───────────────────────────────────────────────────────── */
export function fileDrop({ name, title, hint = '', accept = '.pdf', required = false }) {
  return `
    <label class="wz-file-drop" data-wz-file-drop>
      <span class="wz-file-drop__icon">${uploadIcon}</span>
      <span class="wz-file-drop__title">${title}</span>
      ${hint ? `<span class="wz-file-drop__hint">${hint}</span>` : ''}
      <span class="wz-file-drop__name" data-wz-file-name></span>
      <input type="file" name="${name}" accept="${accept}" ${required ? 'required' : ''}/>
    </label>
  `;
}

/* Mount file drops — actualiza nombre + estado filled */
export function mountFileDrops(scope) {
  scope.querySelectorAll('[data-wz-file-drop]').forEach(drop => {
    const inp = drop.querySelector('input[type="file"]');
    const name = drop.querySelector('[data-wz-file-name]');
    inp?.addEventListener('change', () => {
      const f = inp.files?.[0];
      if (f) {
        name.textContent = `📎 ${f.name} · ${(f.size / 1024).toFixed(0)} KB`;
        drop.classList.add('is-filled');
      } else {
        name.textContent = '';
        drop.classList.remove('is-filled');
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────
   Sync checkbox SVG (HANDOFF: cubic-bezier negativo del DS bloquea opacity)
   ───────────────────────────────────────────────────────── */
export function mountCheckboxes(scope) {
  const sync = (inp) => {
    const label = inp.closest('label.naowee-checkbox');
    if (!label) return;
    label.classList.toggle('naowee-checkbox--checked', inp.checked);
    const svg = label.querySelector('.naowee-checkbox__box svg');
    if (svg) {
      svg.style.setProperty('transition', 'none', 'important');
      svg.style.setProperty('transform', inp.checked ? 'scale(1)' : 'scale(.5)', 'important');
      svg.style.setProperty('opacity', inp.checked ? '1' : '0', 'important');
    }
  };
  scope.querySelectorAll('label.naowee-checkbox > input[type="checkbox"]').forEach(inp => {
    inp.addEventListener('change', () => sync(inp));
    sync(inp);
  });
}

/* ─────────────────────────────────────────────────────────
   Review render — listas tipo key/value agrupadas
   ───────────────────────────────────────────────────────── */
export function renderReview(groups) {
  /* groups: [{ title, rows: [[label, value], ...] }, ...] */
  return `
    <div class="wz-review">
      ${groups.map(g => `
        <div class="wz-review__group">
          <div class="wz-review__group-title">${g.title}</div>
          ${g.rows.map(([label, value]) => `
            <div class="wz-review__row">
              <span class="wz-review__label">${label}</span>
              <span class="wz-review__value">${value ?? '—'}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   Success view — reemplaza body + footer por confetti + CTA
   ───────────────────────────────────────────────────────── */
export function renderSuccess(scope, { title, message, stamp, ctaLabel = 'Continuar', onContinue }) {
  const stepper = scope.querySelector('[data-wz-stepper]');
  const stepperWrap = stepper?.closest('.wz-stepper-wrap');
  const body = scope.querySelector('[data-wz-body]');
  const footer = scope.querySelector('[data-wz-footer]');

  if (stepperWrap) stepperWrap.style.display = 'none';

  if (body) {
    body.innerHTML = `
      <div class="wz-success">
        <div class="wz-confetti" data-wz-confetti></div>
        <div class="wz-success__check">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>${title}</h2>
        <p>${message}</p>
        ${stamp ? `<div class="wz-success__stamp">${stamp}</div>` : ''}
      </div>
    `;
    runConfetti(body.querySelector('[data-wz-confetti]'));
  }

  if (footer) {
    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-wz-success-cta style="margin:0 auto">
        ${ctaLabel} ${arrowRight}
      </button>
    `;
    footer.querySelector('[data-wz-success-cta]')?.addEventListener('click', () => onContinue?.());
  }
}

/* Pequeña animación de confetti — replica del modal */
export function runConfetti(wrap) {
  if (!wrap) return;
  const colors = ['#FF7500','#d74009','#1f8923','#1f78d1','#ffbf75','#fff'];
  for (let i = 0; i < 50; i++) {
    const s = document.createElement('span');
    s.style.left = (Math.random() * 100) + '%';
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.animationDelay = (Math.random() * .6) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    s.style.top = '0';
    s.style.borderRadius = Math.random() > .5 ? '2px' : '50%';
    wrap.appendChild(s);
  }
}

/* Re-exports — los formularios solo necesitan importar wizard-page.js */
export { textfield, textarea, dropdown, checkbox, bindDropdowns };
