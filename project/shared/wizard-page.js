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

import { textfield, textarea, dropdown, checkbox, bindDropdowns, fileUpload, bindFileUpload } from './modal-convocatoria.js';

/* Helper plural: itera sobre todos los .naowee-file-uploader del scope y
   les aplica el binder oficial (drag-drop, progress, validación). */
export function bindFileUploads(scope) {
  scope.querySelectorAll('.naowee-file-uploader').forEach(field => bindFileUpload(field));
}

/* ═══════════════════════════════════════════════════════════════════
   validateRequired — UX progresivo de validación de campos obligatorios.

   Comportamiento:
   - 1er intento de avanzar con campos vacíos → muestra error loud +
     wiggle + autoscroll al primer campo con error. NO avanza.
   - 2do intento (mismo step, sin haber llenado nada) → permite avanzar
     igual, para no entorpecer la demo.

   Detecta `required` en:
   - input[required] dentro de .naowee-textfield
   - .naowee-dropdown[data-name] con input[type=hidden][required]
   - .naowee-multiselect con label--required que no tenga seleccion
   - .naowee-file-uploader[required] sin archivo
   - .naowee-checkbox required dentro de grids con label que termine en *
   ═══════════════════════════════════════════════════════════════════ */
const errorAttempts = new WeakMap(); // panel -> count

/* Construye el markup canónico del DS Naowee para helper--negative.
   Badge: círculo rojo con guión horizontal blanco (no "i"). */
function makeErrorHelper(text) {
  const span = document.createElement('span');
  span.className = 'naowee-helper naowee-helper--negative';
  span.innerHTML = `
    <span class="naowee-helper__badge">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="6" fill="currentColor" style="color:var(--naowee-color-feedback-fill-negative-loud,#b42318)"/>
        <rect x="3" y="5.4" width="6" height="1.2" rx="0.6" fill="#fff"/>
      </svg>
    </span>
    ${text}
  `;
  return span;
}

/* Regla global: solo UN helper por campo. Si hay error → oculta el helper
   informativo previo (texto auxiliar, hint, etc) para que solo se vea el
   negativo. bindValidationReset restaura al corregir. */
function hideExistingHelpers(field) {
  field.querySelectorAll('.naowee-helper:not(.naowee-helper--negative), .naowee-file-uploader__hint').forEach(h => {
    h.style.display = 'none';
  });
}

export function validateRequired(panel) {
  if (!panel) return true;
  const errors = [];

  /* Limpiar errores previos */
  panel.querySelectorAll('.has-error').forEach(el => {
    el.classList.remove('has-error');
    el.querySelector('.naowee-helper--negative')?.remove();
    /* Restaurar helpers ocultos */
    el.querySelectorAll('.naowee-helper:not(.naowee-helper--negative), .naowee-file-uploader__hint').forEach(h => {
      h.style.display = '';
    });
  });
  panel.querySelectorAll('.is-wiggling').forEach(el => el.classList.remove('is-wiggling'));

  /* Textfields required */
  panel.querySelectorAll('.naowee-textfield').forEach(field => {
    const input = field.querySelector('input[required], textarea[required]');
    if (!input) return;
    const val = (input.value || '').trim();
    if (!val) {
      field.classList.add('has-error');
      const lblText = field.querySelector('.naowee-textfield__label')?.textContent?.trim().replace('*', '').trim() || 'Este campo';
      hideExistingHelpers(field);
      const err = makeErrorHelper(`${lblText} es obligatorio`);
      field.appendChild(err);
      errors.push(field);
    }
  });

  /* Dropdowns required — basta con el atributo [required] en el hidden input
     (las clases --required del label varían entre helpers: algunos modales usan
     naowee-textfield__label--required, otros naowee-dropdown__label--required). */
  panel.querySelectorAll('.naowee-dropdown').forEach(field => {
    const hidden = field.querySelector('input[type="hidden"][required]');
    if (!hidden) return;
    const val = (hidden.value || '').trim();
    if (!val) {
      field.classList.add('has-error');
      const lblText = field.querySelector('.naowee-dropdown__label')?.textContent?.trim().replace('*', '').trim() || 'Selección';
      hideExistingHelpers(field);
      const err = makeErrorHelper(`${lblText} es obligatorio`);
      field.appendChild(err);
      errors.push(field);
    }
  });

  /* Multiselects required — no hay hidden[required] (los hidden se inyectan
     dinámicamente al seleccionar). Marcamos required por cualquiera de las
     dos clases --required del DS o por *.naowee-dropdown__label--required. */
  panel.querySelectorAll('.naowee-multiselect').forEach(field => {
    const lblHas = field.querySelector(
      '.naowee-dropdown__label--required, .naowee-textfield__label--required'
    );
    if (!lblHas) return;
    const checked = field.querySelectorAll('input[data-multivalue]:checked').length;
    if (checked === 0) {
      field.classList.add('has-error');
      const lblText = field.querySelector('.naowee-dropdown__label, .naowee-textfield__label')?.textContent?.trim().replace('*', '').trim() || 'Selección';
      hideExistingHelpers(field);
      const err = makeErrorHelper(`Selecciona al menos una opción de ${lblText}`);
      field.appendChild(err);
      errors.push(field);
    }
  });

  /* File uploaders required */
  panel.querySelectorAll('.naowee-file-uploader').forEach(field => {
    const input = field.querySelector('input[type="file"]');
    const lblReq = field.querySelector('.naowee-file-uploader__label--required');
    if (!lblReq || !input) return;
    if (!input.files || input.files.length === 0) {
      field.classList.add('has-error');
      const lblText = field.querySelector('.naowee-file-uploader__label')?.textContent?.trim() || 'Archivo';
      hideExistingHelpers(field);
      const err = makeErrorHelper(`${lblText} es obligatorio`);
      field.appendChild(err);
      errors.push(field);
    }
  });

  /* Datepickers required — hidden input vacío con [required] */
  panel.querySelectorAll('.naowee-datepicker-field').forEach(field => {
    const hidden = field.querySelector('input[type="hidden"][required]');
    if (!hidden) return;
    const val = (hidden.value || '').trim();
    if (!val) {
      field.classList.add('has-error');
      const lblText = field.querySelector('.naowee-textfield__label')?.textContent?.trim().replace('*', '').trim() || 'Fecha';
      hideExistingHelpers(field);
      const err = makeErrorHelper(`${lblText} es obligatorio`);
      field.appendChild(err);
      errors.push(field);
    }
  });

  if (errors.length === 0) {
    errorAttempts.delete(panel);
    return true;
  }

  /* 1er intento: muestra error, wiggle + scroll · NO avanza */
  const prevAttempts = errorAttempts.get(panel) || 0;
  errorAttempts.set(panel, prevAttempts + 1);

  /* Wiggle a los primeros 5 (no abrumar visualmente) */
  errors.slice(0, 5).forEach(el => {
    el.classList.add('is-wiggling');
    setTimeout(() => el.classList.remove('is-wiggling'), 600);
  });

  /* Autoscroll al primer campo con error */
  const first = errors[0];
  first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  /* Focus al primer input editable si existe */
  setTimeout(() => {
    const focusable = first.querySelector('input:not([type="hidden"]), textarea, select, button');
    focusable?.focus({ preventScroll: true });
  }, 350);

  /* 2do intento: permite avanzar igual (para no entorpecer la demo) */
  if (prevAttempts >= 1) {
    errorAttempts.delete(panel);
    return true;
  }
  return false;
}

/* Limpia el conteo de intentos cuando el usuario empieza a corregir */
export function bindValidationReset(scope) {
  const reset = (target) => {
    const field = target.closest?.('.has-error');
    if (!field) return;
    field.classList.remove('has-error');
    field.querySelector('.naowee-helper--negative')?.remove();
    /* Restaurar helpers originales que se ocultaron */
    field.querySelectorAll('.naowee-helper:not(.naowee-helper--negative), .naowee-file-uploader__hint').forEach(h => {
      h.style.display = '';
    });
  };
  scope.addEventListener('input', e => reset(e.target));
  scope.addEventListener('change', e => reset(e.target));
}

/* ═══════════════════════════════════════════════════════════════════
   Multiselect dropdown — DS Naowee · selecciona múltiples opciones
   con chips visibles en el trigger y menú dropdown con checkboxes.

   Devuelve markup HTML. El form recoge los valores con FormData.getAll(name)
   porque cada opción seleccionada inyecta un <input type="hidden">.

   API:
   - name: clave del FormData
   - label: etiqueta visible
   - options: ['Fútbol', 'Baloncesto', ...]
   - placeholder: texto cuando no hay nada seleccionado
   - required: bool
   - helper: texto auxiliar bajo el campo
   ═══════════════════════════════════════════════════════════════════ */
const multiselectCheckSVG = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.5255 4.86616C11.7859 4.60581 12.2085 4.60582 12.4689 4.86616C12.729 5.12648 12.7291 5.54856 12.4689 5.80887L7.14338 11.1344C7.01837 11.2594 6.8488 11.3297 6.67203 11.3297C6.49525 11.3297 6.32569 11.2594 6.20067 11.1344L3.5314 8.46512C3.27108 8.2048 3.27114 7.78277 3.5314 7.52241C3.79175 7.26206 4.21376 7.26206 4.47411 7.52241L6.67138 9.71968L11.5255 4.86616Z"/></svg>`;

export function multiselect({ name, label, options = [], placeholder = 'Seleccionar...', required = false, helper = '' }) {
  return `
    <div class="naowee-multiselect" data-name="${name}">
      <label class="naowee-dropdown__label ${required ? 'naowee-dropdown__label--required' : ''}">${label}</label>
      <div class="naowee-multiselect__trigger" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false">
        <div class="naowee-multiselect__chips" data-chips>
          <span class="naowee-multiselect__placeholder">${placeholder}</span>
        </div>
      </div>
      <div class="naowee-multiselect__menu" role="listbox">
        ${helper ? `<div class="naowee-multiselect__hint">${helper}</div>` : ''}
        ${options.map(opt => `
          <label class="naowee-multiselect__option" data-value="${opt}">
            <span class="naowee-checkbox">
              <input type="checkbox" data-multivalue="${opt}"/>
              <span class="naowee-checkbox__box">${multiselectCheckSVG}</span>
            </span>
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
      <div data-hidden-inputs></div>
    </div>
  `;
}

/* Binder plural — portal del menu al <body> (escapa overflow del modal),
   actualiza chips, hidden inputs según selección. Cierra al hacer click fuera. */
export function bindMultiselects(scope) {
  scope.querySelectorAll('.naowee-multiselect').forEach(ms => {
    const name = ms.dataset.name;
    const trigger = ms.querySelector('.naowee-multiselect__trigger');
    const chipsEl = ms.querySelector('[data-chips]');
    const hiddenWrap = ms.querySelector('[data-hidden-inputs]');
    const menu = ms.querySelector('.naowee-multiselect__menu');
    const xSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    /* Portar el menú al body para escapar overflow:auto del modal__body */
    document.body.appendChild(menu);

    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.left = rect.left + 'px';
      menu.style.width = rect.width + 'px';
      menu.style.zIndex = '9999';
      /* Default: abajo del trigger */
      menu.style.top = (rect.bottom + 6) + 'px';
      requestAnimationFrame(() => {
        const menuH = menu.offsetHeight || 280;
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        if (menuH > spaceBelow && spaceAbove > spaceBelow) {
          menu.style.top = Math.max(8, rect.top - menuH - 6) + 'px';
        } else if (menuH > spaceBelow) {
          menu.style.maxHeight = Math.max(160, spaceBelow) + 'px';
          menu.style.overflowY = 'auto';
        }
      });
    };

    function rebuildChips() {
      const checked = Array.from(ms.querySelectorAll('input[data-multivalue]:checked')).map(i => i.dataset.multivalue);
      if (checked.length === 0) {
        chipsEl.innerHTML = '<span class="naowee-multiselect__placeholder">Seleccionar...</span>';
      } else if (checked.length <= 4) {
        chipsEl.innerHTML = checked.map(v => `
          <span class="naowee-multiselect__chip">
            ${v}
            <button type="button" class="naowee-multiselect__chip-remove" data-remove="${v}" aria-label="Quitar ${v}">${xSVG}</button>
          </span>
        `).join('');
      } else {
        chipsEl.innerHTML = checked.slice(0, 3).map(v => `
          <span class="naowee-multiselect__chip">
            ${v}
            <button type="button" class="naowee-multiselect__chip-remove" data-remove="${v}" aria-label="Quitar ${v}">${xSVG}</button>
          </span>
        `).join('') + `<span class="naowee-multiselect__count">+${checked.length - 3}</span>`;
      }
      /* Hidden inputs para que FormData.getAll(name) retorne todo */
      hiddenWrap.innerHTML = checked.map(v => `<input type="hidden" name="${name}" value="${v}"/>`).join('');
      chipsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const val = btn.dataset.remove;
          const inp = ms.querySelector(`input[data-multivalue="${CSS.escape(val)}"]`);
          if (inp) { inp.checked = false; inp.closest('.naowee-checkbox')?.classList.remove('naowee-checkbox--checked'); }
          rebuildChips();
        });
      });
    }

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = ms.classList.contains('is-open');
      document.querySelectorAll('.naowee-multiselect.is-open').forEach(m => {
        m.classList.remove('is-open');
        m.querySelector('.naowee-multiselect__menu')?.classList.remove('is-open');
      });
      ms.classList.toggle('is-open', !wasOpen);
      menu.classList.toggle('is-open', !wasOpen);
      trigger.setAttribute('aria-expanded', String(!wasOpen));
      if (!wasOpen) positionMenu();
    });
    /* Re-posicionar al scrollear/resize */
    window.addEventListener('scroll', () => { if (ms.classList.contains('is-open')) positionMenu(); }, true);
    window.addEventListener('resize', () => { if (ms.classList.contains('is-open')) positionMenu(); });
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      if (e.key === 'Escape') { ms.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }
    });
    menu.querySelectorAll('.naowee-multiselect__option').forEach(opt => {
      const inp = opt.querySelector('input[data-multivalue]');
      opt.addEventListener('click', e => {
        e.stopPropagation();
        inp.checked = !inp.checked;
        opt.querySelector('.naowee-checkbox')?.classList.toggle('naowee-checkbox--checked', inp.checked);
        rebuildChips();
      });
    });
    /* Click fuera cierra el menu (verifica ms Y menu porque está portado al body) */
    document.addEventListener('click', e => {
      if (!ms.contains(e.target) && !menu.contains(e.target)) {
        ms.classList.remove('is-open');
        menu.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    rebuildChips();
  });
}

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
export { textfield, textarea, dropdown, checkbox, bindDropdowns, fileUpload, bindFileUpload };
/* multiselect / validateRequired / bindValidationReset ya exportados arriba */
