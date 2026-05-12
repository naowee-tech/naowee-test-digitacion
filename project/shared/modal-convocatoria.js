/* ═══════════════════════════════════════════════════════════════
   PROJECT — Modal: Crear Convocatoria (Wizard 3 pasos)
   Componentes oficiales DS Naowee v1.8.0:
     .naowee-modal-overlay / .naowee-modal--wide
     .naowee-textfield · .naowee-dropdown · .naowee-checkbox · .naowee-helper
     .naowee-stepper--pulse · .naowee-shake
   Pasos:
     1. Identificación + Fechas
     2. Alcance territorial
     3. Condiciones + Documentos adjuntos
   Success: confetti + check verde animado (pattern de incentivos)
   ═══════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import { validateRequired, bindValidationReset } from './wizard-page.js';

const FUENTES = [
  'SGP','OCAD-Paz','Recursos Propios Mindeporte','Recursos Propios Municipio',
  'Cofinanciación territorial','Cooperación internacional','Crédito interno','Crédito externo'
];
const BIENIOS = ['2025-2026', '2024-2025', '2026-2027'];
const SI_NO  = [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }];
const COBERTURAS = [
  { value: 'Nacional', label: 'Nacional' },
  { value: 'Departamental', label: 'Departamental' },
  { value: 'Regional', label: 'Regional' },
  { value: 'Específica', label: 'Específica' }
];
const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca',
  'Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta',
  'Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés','Santander','Sucre','Tolima',
  'Valle del Cauca','Vaupés','Vichada','Bogotá D.C.'
];
const TIPOS_SOLICITUD = ['Construcción nueva','Mejoramiento','Adecuación','Dotación'];
const FASES_PROYECTO = ['FASE I — Perfil','FASE II — Prefactibilidad','FASE III — Factibilidad'];

const closeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
const chevronIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;

function nextCodigoConvocatoria() {
  const year = new Date().getFullYear();
  const total = ProjectData.getConvocatorias().length + 1;
  return `CONV-${year}-${String(total).padStart(3, '0')}`;
}

/* ═══ Component builders ═══ */
function textfield({ label, name, type = 'text', required = false, placeholder = '', helper = '', minlength, maxlength, value = '', prefix = '', mask = '' }) {
  const id = `tf-${name}`;
  /* Si hay mask, aplica el formato es-CO al value inicial para que el render coincida */
  const displayValue = mask === 'money' && value !== '' && value !== null && value !== undefined
    ? Number(String(value).replace(/\D/g, '')).toLocaleString('es-CO')
    : value;
  return `
    <div class="naowee-textfield ${prefix ? 'naowee-textfield--with-prefix' : ''}" data-name="${name}">
      <label class="naowee-textfield__label ${required ? 'naowee-textfield__label--required' : ''}" for="${id}">${label}</label>
      <div class="naowee-textfield__input-wrap">
        ${prefix ? `<span class="naowee-textfield__prefix" aria-hidden="true">${prefix}</span>` : ''}
        <input class="naowee-textfield__input" id="${id}" name="${name}" type="${type}"
               ${required ? 'required' : ''} ${minlength ? `minlength="${minlength}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}
               ${mask ? `data-mask="${mask}"` : ''}
               placeholder="${placeholder}" value="${displayValue}"/>
      </div>
      ${helper ? `<p class="naowee-helper">${helper}</p>` : ''}
    </div>
  `;
}

function textarea({ label, name, required = false, placeholder = '', helper = '', maxlength, rows = 4 }) {
  const id = `ta-${name}`;
  return `
    <div class="naowee-textfield naowee-textfield--multiline" data-name="${name}">
      <label class="naowee-textfield__label ${required ? 'naowee-textfield__label--required' : ''}" for="${id}">${label}</label>
      <div class="naowee-textfield__input-wrap" style="height:auto;padding:12px 12px;align-items:flex-start">
        <textarea class="naowee-textfield__input" id="${id}" name="${name}" rows="${rows}"
                  ${required ? 'required' : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}
                  placeholder="${placeholder}" style="resize:vertical;min-height:${rows * 22}px"></textarea>
      </div>
      ${helper ? `<p class="naowee-helper">${helper}</p>` : ''}
    </div>
  `;
}

function dropdown({ label, name, required = false, options, placeholder = 'Seleccionar…', value = '' }) {
  const initial = options.find(o => (typeof o === 'string' ? o : o.value) === value);
  const initialLabel = initial ? (typeof initial === 'string' ? initial : initial.label) : '';
  return `
    <div class="naowee-dropdown" data-name="${name}" data-value="${value}">
      <label class="naowee-dropdown__label ${required ? 'naowee-textfield__label--required' : ''}">${label}</label>
      <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="naowee-dropdown__${initialLabel ? 'value' : 'placeholder'}">${initialLabel || placeholder}</span>
        <span class="naowee-dropdown__controls"><span class="naowee-dropdown__chevron">${chevronIcon}</span></span>
      </button>
      <div class="naowee-dropdown__menu" role="listbox">
        ${options.map(o => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return `<button type="button" class="naowee-dropdown__option ${v === value ? 'is-selected' : ''}" data-value="${v}" role="option">${l}</button>`;
        }).join('')}
      </div>
      <input type="hidden" name="${name}" value="${value}" ${required ? 'required' : ''}/>
    </div>
  `;
}

function datepicker({ label, name, required = false, placeholder = 'dd mmm aaaa', helper = '' }) {
  /* Estructura fiel al DS oficial Naowee v1.8.0:
     .naowee-datepicker-field > __input (clickable container) >
       __icon (left) + __value (text) + __controls (clear + chevron)
     Hidden input para form data. Helper con __text > span. */
  const calendarIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  const clearIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const chevronIcon2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
  return `
    <div class="naowee-datepicker-field" data-name="${name}">
      <label class="naowee-textfield__label ${required ? 'naowee-textfield__label--required' : ''}">${label}</label>
      <div class="naowee-datepicker-field__input" tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false">
        <span class="naowee-datepicker-field__icon">${calendarIcon}</span>
        <span class="naowee-datepicker-field__value" data-placeholder="${placeholder}">${placeholder}</span>
        <div class="naowee-datepicker-field__controls">
          <button type="button" class="naowee-datepicker-field__clear" aria-label="Limpiar fecha" hidden>${clearIcon}</button>
          <span class="naowee-datepicker-field__chevron">${chevronIcon2}</span>
        </div>
      </div>
      <input type="hidden" name="${name}" value=""${required ? ' required' : ''}/>
      <div class="naowee-datepicker naowee-datepicker--popover naowee-datepicker--compact" hidden>
        <div class="naowee-datepicker__calendar" data-mode="days">
          <div class="naowee-datepicker__header">
            <button type="button" class="naowee-datepicker__month-selector" aria-label="Cambiar vista">
              <span class="naowee-datepicker__month"></span>
              <span class="naowee-datepicker__month-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </button>
            <div class="naowee-datepicker__controls">
              <button type="button" class="naowee-datepicker__nav" data-nav="-1" aria-label="Anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button type="button" class="naowee-datepicker__nav" data-nav="1" aria-label="Siguiente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          <div class="naowee-datepicker__content">
            <div class="dp-view dp-view--days">
              <div class="naowee-datepicker__week">
                <span class="naowee-datepicker__weekday">Lun</span>
                <span class="naowee-datepicker__weekday">Mar</span>
                <span class="naowee-datepicker__weekday">Mié</span>
                <span class="naowee-datepicker__weekday">Jue</span>
                <span class="naowee-datepicker__weekday">Vie</span>
                <span class="naowee-datepicker__weekday">Sab</span>
                <span class="naowee-datepicker__weekday">Dom</span>
              </div>
              <div class="naowee-datepicker__days"></div>
            </div>
            <div class="dp-view dp-view--months" hidden></div>
            <div class="dp-view dp-view--years" hidden></div>
          </div>
        </div>
      </div>
      ${helper ? `<div class="naowee-helper"><span class="naowee-helper__text"><span>${helper}</span></span></div>` : ''}
    </div>
  `;
}

/* ═══ Multi-select con tags ═══
   Anatomía fiel al DS oficial:
   - Wrapper `.naowee-dropdown` con `--multi` modificador
   - Trigger `.naowee-dropdown__trigger` (button) con `__placeholder` (vacío)
     o `__tags` (con valores)
   - Tags = `.naowee-tag.naowee-tag--small.naowee-tag--accent` oficial
     con `__active-area` + `__close` (mismo patrón del DS)
   - Options son `<div class="naowee-dropdown__option">` (no button — match playground)
   - Menu se abre con `.naowee-dropdown--open` en el wrapper (clase oficial)
*/
function multiSelect({ label, name, options, required = false, placeholder = 'Seleccionar…', value = [] }) {
  const triggerInnerHTML = value.length === 0
    ? `<span class="naowee-dropdown__placeholder" data-placeholder>${placeholder}</span>`
    : `<span class="naowee-dropdown__tags" data-tags-container>${value.map(v => tagHTML(v)).join('')}</span>`;
  const hiddenHTML = value.map(v => `<input type="hidden" name="${name}" value="${v}"/>`).join('');
  return `
    <div class="naowee-dropdown naowee-dropdown--multi" data-name="${name}" data-multi="true" data-placeholder-text="${placeholder}">
      <label class="naowee-dropdown__label ${required ? 'naowee-textfield__label--required' : ''}">${label}</label>
      <button type="button" class="naowee-dropdown__trigger" aria-haspopup="listbox" aria-expanded="false">
        ${triggerInnerHTML}
        <span class="naowee-dropdown__controls">
          <span class="naowee-dropdown__chevron">${chevronIcon}</span>
        </span>
      </button>
      <div class="naowee-dropdown__menu naowee-dropdown__menu--multi" role="listbox" aria-multiselectable="true">
        <div class="naowee-dropdown__menu-list">
          ${options.map(o => {
            const v = typeof o === 'string' ? o : o.value;
            const l = typeof o === 'string' ? o : o.label;
            const isSelected = value.includes(v);
            return `
              <div class="naowee-dropdown__option ${isSelected ? 'is-selected' : ''}"
                   data-value="${v}" role="option" aria-selected="${isSelected}" tabindex="0">
                <span class="naowee-dropdown__option-check"></span>
                <span class="naowee-dropdown__option-label">${l}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="naowee-dropdown__menu-footer">
          <span class="naowee-dropdown__menu-count" data-multi-count>0 seleccionados</span>
          <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-multi-apply>Agregar</button>
        </div>
      </div>
      <span data-hidden-inputs>${hiddenHTML}</span>
    </div>
  `;
}

/* Tag oficial del DS: .naowee-tag.naowee-tag--small.naowee-tag--accent
   con __active-area (dismiss wrapper) + __close (×) */
function tagHTML(value) {
  return `<span class="naowee-tag naowee-tag--small naowee-tag--accent" data-tag="${value}"><span class="naowee-tag__label">${value}</span><span class="naowee-tag__active-area" data-remove="${value}" role="button" aria-label="Remover ${value}" tabindex="0"><span class="naowee-tag__close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></span></span>`;
}

function checkbox({ name, value, label, checked = false }) {
  const id = `cb-${name}-${value.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  return `
    <label class="naowee-checkbox ${checked ? 'naowee-checkbox--checked' : ''}" for="${id}">
      <input type="checkbox" id="${id}" name="${name}" value="${value}" ${checked ? 'checked' : ''}/>
      <span class="naowee-checkbox__box">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.5255 4.86616C11.7859 4.60581 12.2085 4.60582 12.4689 4.86616C12.729 5.12648 12.7291 5.54856 12.4689 5.80887L7.14338 11.1344C7.01837 11.2594 6.8488 11.3297 6.67203 11.3297C6.49525 11.3297 6.32569 11.2594 6.20067 11.1344L3.5314 8.46512C3.27108 8.2048 3.27114 7.78277 3.5314 7.52241C3.79175 7.26206 4.21376 7.26206 4.47411 7.52241L6.67138 9.71968L11.5255 4.86616Z"/>
        </svg>
      </span>
      <span class="naowee-checkbox__label">${label}</span>
    </label>
  `;
}

/* ═══ File upload — estructura DS oficial naowee-file-uploader v1.8.0 ═══
   Anatomía: __label > __input-wrap (placeholder + action) >
     __file-tag (cuando hay archivo) | __progress (subiendo).
   Estados visuales del DS: --uploaded (verde 2px), --confirmed (gris),
   --error (rojo), --loading (con __progress-ring + __progress-text). */
function fileUpload({ name, label, required = false, accept = '', maxSize = 20, helper = '' }) {
  const acceptStr = accept.split(',').map(s => s.trim().replace(/^\./,'').toUpperCase()).join(', ');
  return `
    <div class="naowee-file-uploader" data-name="${name}" data-state="empty"
         data-accept="${accept}" data-max-size="${maxSize}">
      <label class="naowee-file-uploader__label ${required ? 'naowee-file-uploader__label--required' : ''}">${label}</label>
      <input type="file" name="${name}" accept="${accept}" hidden ${required ? 'required' : ''}/>
      <div class="naowee-file-uploader__input-wrap" data-wrap>
        <span class="naowee-file-uploader__placeholder" data-slot>Sin archivo adjunto</span>
        <button type="button" class="naowee-file-uploader__action" data-action>Subir documento</button>
      </div>
      <span class="naowee-file-uploader__hint">${required ? '' : 'Opcional · '}${acceptStr || 'Cualquier formato'} · máx ${maxSize} MB</span>
    </div>
  `;
}

/* ═══ Estilos del modal — pattern de incentivos (wz-head + wz-stepper) ═══ */
function modalStyles() {
  if (document.getElementById('convocatoriaModalStyle')) return;
  const css = `
    /* ═══ Modal width + paddings (DS oficial) ═══ */
    .naowee-modal-overlay .naowee-modal--wide { width: 920px; max-width: 95vw; max-height: 92vh; }
    /* Body + Footer con paddings consistentes (24px top/bot, 32px sides) */
    #convocatoriaOverlay .naowee-modal__body { padding: 24px 32px; }
    #convocatoriaOverlay .naowee-modal__footer {
      padding: 20px 32px !important;
      border-top: 1px solid var(--border);
      display: flex !important;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }
    /* "Anterior" a la izquierda usa margin-right: auto para empujar el resto a la derecha */
    #convocatoriaOverlay #convoStepPrev { margin-right: auto; }
    /* Refuerzo padding del header oficial — DS suele tener 0 32px del título */
    .naowee-modal__header {
      padding: 24px 32px 16px;
      align-items: flex-start;
    }
    .naowee-modal__title {
      font-size: 22px; font-weight: 700; line-height: 1.2;
      letter-spacing: -.01em; color: var(--text-primary);
      margin: 0;
    }
    .naowee-modal__subtitle {
      font-size: 13px; color: var(--text-secondary); line-height: 1.5;
      margin: 4px 0 0; font-weight: 400; max-width: 560px;
    }
    .naowee-modal__title-group { flex: 1; min-width: 0; }
    .naowee-modal__dismiss {
      width: 32px; height: 32px; border: 0; background: transparent;
      border-radius: 8px; cursor: pointer; color: var(--text-secondary);
      display: inline-flex; align-items: center; justify-content: center;
      transition: background .15s; flex-shrink: 0;
    }
    .naowee-modal__dismiss:hover { background: var(--grey-bg); color: var(--text-primary); }
    .naowee-modal__dismiss svg { width: 20px; height: 20px; }

    /* ═══ Stepper oficial DS — anatomía exacta ═══ */
    .naowee-stepper {
      display: flex; align-items: center; gap: 0;
      padding: 18px 32px; flex-shrink: 0;
      border-bottom: 1px solid var(--border);
      background: #fff;
      overflow-x: auto;
    }
    .naowee-stepper__step {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 4px 8px;
      flex-shrink: 0;
      cursor: default;
    }
    .naowee-stepper__number {
      width: 28px; height: 28px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12.5px; font-weight: 700; flex-shrink: 0;
      background: var(--grey-bg); color: var(--text-secondary);
      transition: all .2s;
    }
    .naowee-stepper__label {
      font-size: 14px; font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      transition: color .2s;
    }
    .naowee-stepper__step--active .naowee-stepper__number {
      background: var(--accent); color: #fff;
      box-shadow: 0 0 0 4px rgba(215,64,9,.12);
    }
    /* Pulse animation en el step active (DS oficial naowee-stepper--pulse) */
    .naowee-stepper--pulse .naowee-stepper__step--active .naowee-stepper__number {
      animation: naoweeStepperPulse 2s cubic-bezier(.4, 0, .6, 1) infinite;
    }
    @keyframes naoweeStepperPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(215, 64, 9, .45); }
      50%      { box-shadow: 0 0 0 8px rgba(215, 64, 9, 0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .naowee-stepper--pulse .naowee-stepper__step--active .naowee-stepper__number {
        animation: none;
      }
    }
    .naowee-stepper__step--active .naowee-stepper__label {
      color: var(--text-primary); font-weight: 600;
    }
    .naowee-stepper__step--done .naowee-stepper__number {
      background: #15803d; color: #fff;
    }
    .naowee-stepper__step--done .naowee-stepper__label { color: var(--text-primary); }
    .naowee-stepper__step--done { cursor: pointer; }
    .naowee-stepper__step--done:hover .naowee-stepper__label { color: var(--accent); }
    .naowee-stepper__connector {
      flex: 1 1 auto; height: 2px; background: var(--border);
      min-width: 24px; transition: background .25s;
    }
    .naowee-stepper__connector--done { background: #15803d; }

    /* ═══ Datepicker field + popover — estructura DS oficial v1.8.0 ═══
       Anatomía: __input (container clickable) > __icon (left) + __value (text)
       + __controls (clear + chevron). Hidden input separado para form data.
       Tamaño LARGE (46px) para paridad con incentivos. */
    .naowee-datepicker-field {
      position: relative;
      display: flex; flex-direction: column;
      width: 100%;
    }
    #convocatoriaOverlay .naowee-datepicker-field__input {
      display: flex; align-items: center; gap: 10px;
      height: 46px;
      padding: 0 12px 0 14px;
      border-width: 1.5px !important;
      border-style: solid !important;
      border-color: var(--border-dark, #d0d4e6) !important;
      border-radius: 12px !important;
      background: #fff;
      cursor: pointer;
      outline: 0;
      /* NO transition aquí — bloquea el render del border-color inline aplicado por JS open() */
    }
    #convocatoriaOverlay .naowee-datepicker-field__input:hover {
      border-color: var(--text-secondary, #646587) !important;
    }
    #convocatoriaOverlay .naowee-datepicker-field__input:focus,
    #convocatoriaOverlay .naowee-datepicker-field--active .naowee-datepicker-field__input {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(215,64,9,.15) !important;
    }
    .naowee-datepicker-field__icon {
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      flex-shrink: 0;
      transition: color .15s;
    }
    .naowee-datepicker-field--active .naowee-datepicker-field__icon,
    .naowee-datepicker-field__input:hover .naowee-datepicker-field__icon { color: var(--accent); }
    .naowee-datepicker-field__icon svg { width: 20px; height: 20px; }
    .naowee-datepicker-field__value {
      flex: 1; min-width: 0;
      font-family: inherit; font-size: 14px; font-weight: 500;
      color: var(--text-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      line-height: 1;
    }
    .naowee-datepicker-field__value.is-placeholder {
      color: var(--text-secondary);
      font-weight: 400;
    }
    .naowee-datepicker-field__controls {
      display: inline-flex; align-items: center; gap: 4px;
      flex-shrink: 0;
    }
    .naowee-datepicker-field__clear {
      width: 26px; height: 26px;
      border: 0; background: transparent; padding: 0;
      border-radius: 6px;
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--text-secondary); cursor: pointer;
      transition: background .12s, color .12s;
    }
    .naowee-datepicker-field__clear[hidden] { display: none !important; }
    .naowee-datepicker-field__clear:hover { background: var(--grey-bg, #f5f6fa); color: var(--accent); }
    .naowee-datepicker-field__clear svg { width: 16px; height: 16px; }
    .naowee-datepicker-field__chevron {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px;
      color: var(--text-secondary);
      transition: transform .2s ease, color .15s;
    }
    .naowee-datepicker-field__chevron svg { width: 18px; height: 18px; }
    .naowee-datepicker-field--active .naowee-datepicker-field__chevron {
      transform: rotate(180deg);
      color: var(--accent);
    }

    /* Popover calendar — solo posicionamiento + animación entrada.
       TODO el styling interno (header, days, weekdays, --selected/--today/--disabled/etc)
       lo aplica el DS oficial v1.8.0 con sus 12+ modificadores. */
    .naowee-datepicker--popover[hidden] { display: none !important; }
    .naowee-datepicker--popover {
      position: fixed;
      z-index: 9999;
      box-shadow: 0 16px 40px rgba(40,40,52,.16);
      background: #fff;
      animation: dpFadeIn .18s ease both;
    }
    @keyframes dpFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    /* Tweak menor: el month chevron del DS necesita display inline para alinear */
    .naowee-datepicker__month-chevron { display: inline-flex; align-items: center; }

    /* DS oficial pone pointer-events:none cuando el popover entra animado.
       Forzamos auto para que click/hover funcionen en días y nav. */
    .naowee-datepicker--popover .naowee-datepicker__day,
    .naowee-datepicker--popover .naowee-datepicker__nav,
    .naowee-datepicker--popover .naowee-datepicker__month-selector,
    .naowee-datepicker--popover button { pointer-events: auto !important; }
    .naowee-datepicker--popover .naowee-datepicker__day:not(.naowee-datepicker__day--disabled) {
      cursor: pointer;
      transition: background .12s, color .12s;
    }
    .naowee-datepicker--popover .naowee-datepicker__day:not(.naowee-datepicker__day--disabled):hover {
      background: var(--orange-bg, #fff3e6);
      color: var(--accent, #d74009);
    }
    .naowee-datepicker--popover .naowee-datepicker__day--selected,
    .naowee-datepicker--popover .naowee-datepicker__day--selected:hover {
      background: var(--accent, #d74009) !important;
      color: #fff !important;
      font-weight: 700;
    }
    .naowee-datepicker--popover .naowee-datepicker__day--today:not(.naowee-datepicker__day--selected) {
      box-shadow: inset 0 0 0 1.5px var(--accent, #d74009);
      color: var(--accent, #d74009);
      font-weight: 700;
    }
    .naowee-datepicker--popover .naowee-datepicker__day--other-month {
      color: var(--text-secondary, #646587);
      opacity: .5;
    }
    .naowee-datepicker--popover .naowee-datepicker__day--disabled {
      opacity: .3; cursor: not-allowed; pointer-events: none !important;
    }
    .naowee-datepicker--popover .naowee-datepicker__nav {
      cursor: pointer;
      transition: background .12s, color .12s;
      color: var(--accent, #d74009);
      border-radius: 6px;
    }
    .naowee-datepicker--popover .naowee-datepicker__nav:hover {
      background: var(--orange-bg, #fff3e6);
    }
    /* Header clickable: cursor pointer + hover sutil */
    .naowee-datepicker--popover .naowee-datepicker__month-selector {
      cursor: pointer; background: none; border: none; padding: 4px 8px;
      display: inline-flex; align-items: center; gap: 6px;
      font-family: inherit; font-weight: 700; font-size: 14px;
      color: var(--text-primary); border-radius: 6px;
      transition: background .12s, color .12s;
    }
    .naowee-datepicker--popover .naowee-datepicker__month-selector:hover {
      background: var(--orange-bg, #fff3e6); color: var(--accent, #d74009);
    }
    /* Chevron rota según modo: months/years apuntan arriba */
    .naowee-datepicker--popover [data-mode="months"] .naowee-datepicker__month-chevron,
    .naowee-datepicker--popover [data-mode="years"] .naowee-datepicker__month-chevron {
      transform: rotate(180deg);
    }
    .naowee-datepicker--popover .naowee-datepicker__month-chevron {
      transition: transform .2s;
    }
    /* Grid 4×3 para meses, 4×3 para años (12 celdas en bloque) */
    .naowee-datepicker--popover .dp-view--months,
    .naowee-datepicker--popover .dp-view--years {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
      padding: 8px;
    }
    .naowee-datepicker--popover .dp-cell {
      padding: 14px 4px; border: none; background: transparent;
      border-radius: 8px; cursor: pointer; font-family: inherit;
      font-size: 13px; font-weight: 500; color: var(--text-primary);
      transition: background .12s, color .12s;
    }
    .naowee-datepicker--popover .dp-cell:hover {
      background: var(--orange-bg, #fff3e6); color: var(--accent, #d74009);
    }
    .naowee-datepicker--popover .dp-cell--selected,
    .naowee-datepicker--popover .dp-cell--selected:hover {
      background: var(--accent, #d74009); color: #fff; font-weight: 700;
    }

    /* ═══ Footer "Guardar borrador" — botón ghost del DS Naowee ═══
       Patrón naowee-btn--mute large: text-only con hover sutil, weight 600
       (no 700) para diferenciarlo del CTA loud "Continuar". */
    .wz-save-draft {
      display: inline-flex; align-items: center; gap: 8px;
      background: transparent; border: 0;
      height: 46px; padding: 0 14px;
      color: var(--accent); font-family: inherit;
      font-size: 14px; font-weight: 600; cursor: pointer;
      border-radius: var(--radius-md);
      transition: background .15s, transform .12s;
      white-space: nowrap;
    }
    .wz-save-draft:hover { background: var(--orange-bg); }
    .wz-save-draft:active { transform: scale(.97); }
    .wz-save-draft svg { width: 18px; height: 18px; }

    /* ═══ Botones large dentro del modal — padding 4 lados consistente ═══
       padding 0 24px = 24px izq y 24px der (top/bottom = (46-line-height)/2 = ~14px implícito por height)
       gap entre texto e icon = 8px. */
    #convocatoriaOverlay .naowee-btn--large {
      height: 46px;
      padding: 0 24px !important;
      gap: 10px !important;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #convocatoriaOverlay .naowee-btn--large svg {
      flex-shrink: 0;
    }

    .convo-section {
      font-size: 11px; font-weight: 700; letter-spacing: .5px;
      text-transform: uppercase;
      color: #b5b9d4;
      margin: 20px 0 12px;
    }
    .convo-section:first-child { margin-top: 0; }
    .convo-grid-2 {
      display: grid; gap: 16px;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      margin-bottom: 18px; align-items: start;
    }
    .convo-grid-3 {
      display: grid; gap: 16px;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
      margin-bottom: 18px; align-items: start;
    }
    @media (max-width: 720px) { .convo-grid-2, .convo-grid-3 { grid-template-columns: 1fr; } }
    /* Spacing 18px entre cada textfield/dropdown standalone — más compacto */
    .convo-step-panel .naowee-textfield,
    .convo-step-panel .naowee-dropdown,
    .convo-step-panel .naowee-datepicker-field { margin-bottom: 18px; }
    /* Inputs dentro de un grid no agregan margen extra */
    .convo-grid-2 > .naowee-textfield,
    .convo-grid-2 > .naowee-dropdown,
    .convo-grid-2 > .naowee-datepicker-field,
    .convo-grid-3 > .naowee-textfield,
    .convo-grid-3 > .naowee-dropdown,
    .convo-grid-3 > .naowee-datepicker-field { margin-bottom: 0; }
    .convo-fuentes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; margin-top: 8px; }

    /* ═══ Filters block (agrupador para checkboxes opcionales) ═══ */
    .convo-filters-block {
      margin-top: 24px;
      padding: 16px 18px;
      background: #fafbfd;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .convo-filters-block__label {
      font-size: 12.5px; font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
      display: flex; align-items: baseline; gap: 6px;
    }
    .convo-filters-block__hint {
      font-size: 11.5px; font-weight: 500;
      color: var(--text-secondary);
    }
    .convo-filters-block__row {
      display: flex; align-items: center;
      gap: 32px; flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .convo-filters-block__caption {
      font-size: 11.5px; color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
    }
    .naowee-modal-overlay .naowee-modal--wide { width: 760px; max-width: 95vw; }

    /* ═══ Multi-select dropdown con tags ═══ */
    /* Trigger: vertical-center para placeholder y tags. Cuando los tags
       wrappean a 2+ líneas, el padding 8px arriba/abajo + align-items:center
       mantienen todo balanceado y el chevron centrado verticalmente. */
    .naowee-dropdown--multi .naowee-dropdown__trigger {
      min-height: 42px;
      height: auto;
      align-items: center;
      padding: 8px 10px 8px 12px;
      gap: 8px;
    }
    /* Tags container — wrap en multilinea, alinea cada chip al baseline central */
    .naowee-dropdown--multi .naowee-dropdown__tags {
      display: flex; flex-wrap: wrap; align-items: center;
      gap: 6px; flex: 1; min-width: 0;
    }
    /* Placeholder: line-height matches input baseline para no descender */
    .naowee-dropdown--multi .naowee-dropdown__placeholder {
      color: var(--text-secondary, #646587);
      font-size: 13.5px;
      line-height: 26px;
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .naowee-dropdown--multi .naowee-dropdown__controls {
      align-self: center;
      flex-shrink: 0;
    }

    /* Tag oficial DS (.naowee-tag.naowee-tag--small.naowee-tag--accent)
       dentro del trigger del multi-select. Tweaks mínimos. */
    .naowee-dropdown--multi .naowee-tag {
      animation: tagFadeIn .15s ease both;
      max-width: 100%;
      background: #fff;
    }
    @keyframes tagFadeIn {
      from { opacity: 0; transform: scale(.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    .naowee-dropdown--multi .naowee-tag__label {
      max-width: 180px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--text-primary, #282834);
      font-size: 12.5px; font-weight: 600;
    }
    .naowee-dropdown--multi .naowee-tag__active-area {
      cursor: pointer;
      border-radius: 0 999px 999px 0;
      transition: background .12s, color .12s;
    }
    .naowee-dropdown--multi .naowee-tag__active-area:hover {
      background: var(--accent, #d74009);
    }
    .naowee-dropdown--multi .naowee-tag__active-area:hover .naowee-tag__close {
      color: #fff;
    }
    .naowee-dropdown--multi .naowee-tag__close {
      color: var(--text-secondary, #646587);
      transition: color .12s;
    }

    /* Menu multi — list + footer sticky */
    body > .naowee-dropdown__menu--multi {
      padding: 0 !important;
      max-height: 380px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    .naowee-dropdown__menu--multi.is-open {
      max-height: 380px !important;
    }
    .naowee-dropdown__menu-list {
      flex: 1; min-height: 0;
      overflow-y: auto;
      padding: 6px;
    }
    .naowee-dropdown__menu-footer {
      flex-shrink: 0;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 10px 14px;
      border-top: 1px solid var(--border, #e7e9f3);
      background: #fafbfd;
    }
    .naowee-dropdown__menu-count {
      font-size: 12px; font-weight: 500;
      color: var(--text-secondary, #646587);
    }
    .naowee-dropdown__menu-footer .naowee-btn--small {
      height: 32px; padding: 0 14px; font-size: 12.5px; font-weight: 700;
    }

    /* Option con checkbox visible a la izquierda */
    .naowee-dropdown__menu--multi .naowee-dropdown__option {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      width: 100%;
      border: 0; background: none; cursor: pointer;
      font-family: inherit; font-size: 13.5px;
      color: var(--text-primary, #282834);
      text-align: left;
      border-radius: 6px;
      transition: background .12s;
    }
    /* Hover idle: gris claro y sutil (matchea el patrón del DS oficial).
       Solo el estado seleccionado usa accent; hover NO debe parecer
       semánticamente "selected". */
    .naowee-dropdown__menu--multi .naowee-dropdown__option:hover {
      background: var(--grey-bg, #f5f6fa);
    }
    .naowee-dropdown__menu--multi .naowee-dropdown__option.is-selected {
      background: var(--orange-bg, #fff3e6);
      color: var(--accent, #d74009);
      font-weight: 700;
    }
    .naowee-dropdown__menu--multi .naowee-dropdown__option.is-selected:hover {
      background: #ffe4cf;
    }
    .naowee-dropdown__option-check {
      width: 18px; height: 18px;
      border: 1.5px solid var(--border-dark, #d0d4e6);
      border-radius: 4px;
      flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      background: #fff;
      transition: background .12s, border-color .12s;
      position: relative;
    }
    .naowee-dropdown__menu--multi .naowee-dropdown__option.is-selected .naowee-dropdown__option-check {
      background: var(--accent, #d74009);
      border-color: var(--accent, #d74009);
    }
    .naowee-dropdown__menu--multi .naowee-dropdown__option.is-selected .naowee-dropdown__option-check::after {
      content: '';
      width: 10px; height: 6px;
      border-left: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(-45deg) translate(1px, -1px);
    }

    /* Wizard stepper wrapper — usa .naowee-stepper--pulse del DS */
    .convo-stepper-wrap {
      padding: 0 32px 20px; flex-shrink: 0;
      border-bottom: 1px solid var(--border);
      display: flex; justify-content: center;
    }
    .convo-stepper-wrap .naowee-stepper { width: 100%; max-width: 640px; }
    .convo-stepper-wrap .naowee-stepper__connector { min-width: 32px; }
    .convo-stepper-wrap .naowee-stepper__label { font-size: 13px; }

    /* Step panels */
    .convo-step-panel { display: none; animation: stepFadeIn .3s cubic-bezier(.32,.72,0,1) both; }
    .convo-step-panel.is-active { display: block; }
    @keyframes stepFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Dropdown menu — PORTAL al body (escapa overflow del modal con z-index alto) */
    .naowee-dropdown { display: flex; flex-direction: column; }
    /* Cuando el menu está en body (portal): override completo del DS oficial.
       El DS usa max-height:0 + transition que conflictúa al estar fuera del parent. */
    body > .naowee-dropdown__menu {
      position: fixed !important;
      background: #fff !important;
      border: 1px solid var(--border-dark) !important;
      border-radius: 10px !important;
      box-shadow: 0 16px 40px rgba(40,40,52,.16) !important;
      padding: 6px !important;
      z-index: 9999 !important;
      transition: none !important;
      margin: 0 !important;
      /* Default cerrado */
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .naowee-dropdown__menu[hidden] { display: none !important; }
    /* Menu en body: clase .is-open toggleada por JS — !important para vencer specificity del DS */
    .naowee-dropdown__menu.is-open {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    .naowee-dropdown.is-open .naowee-dropdown__chevron { transform: rotate(180deg); }
    .naowee-dropdown__option {
      display: flex; align-items: center; width: 100%; padding: 9px 12px;
      border: 0; background: none; font-family: inherit; font-size: 13px;
      font-weight: 500; color: var(--text-primary); text-align: left;
      cursor: pointer; border-radius: 6px; transition: background .12s;
    }
    .naowee-dropdown__option:hover { background: var(--grey-bg); }
    .naowee-dropdown__option.is-selected { background: var(--orange-bg); color: var(--accent); font-weight: 700; }

    /* Checkbox — patrón EXACTO del DS Naowee (sin container con border) */
    .naowee-checkbox {
      display: inline-flex; align-items: center; gap: 8px;
      cursor: pointer; user-select: none;
      font-family: inherit; line-height: 1;
      position: relative;
      padding: 0;
      background: transparent;
      border: 0;
    }
    .naowee-checkbox input {
      position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;
    }
    .naowee-checkbox__box {
      width: 18px; height: 18px; flex-shrink: 0;
      border: 1.5px solid var(--border-dark);
      border-radius: 4px;
      background: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      color: transparent;
      transition: all .15s;
    }
    .naowee-checkbox__box svg { width: 14px; height: 14px; display: block; }
    .naowee-checkbox:hover .naowee-checkbox__box { border-color: var(--text-secondary); }
    .naowee-checkbox:has(input:checked) .naowee-checkbox__box,
    .naowee-checkbox--checked .naowee-checkbox__box {
      background: var(--accent); border-color: var(--accent); color: #fff;
    }
    /* DS oficial setea SVG opacity:0 por default y opacity:1 solo cuando .naowee-checkbox--checked.
       Como usamos <input type=checkbox> nativo, agregamos override con :has() para que el SVG
       sea visible cuando el input está checked. */
    .naowee-checkbox:has(input:checked) .naowee-checkbox__box svg {
      opacity: 1 !important;
    }
    .naowee-checkbox__label {
      font-size: 13px; font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;
    }

    /* Helper + subtitle */
    .naowee-helper { font-size: 11.5px; color: var(--text-secondary); margin: 4px 0 0; line-height: 1.4; }
    .naowee-modal__subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 4px; font-weight: 400; }

    /* Inputs tamaño LARGE (46px) — paridad con incentivos wizard */
    #convocatoriaForm .naowee-textfield__input-wrap { height: 46px !important; padding: 0 14px !important; }
    #convocatoriaForm .naowee-textfield--multiline .naowee-textfield__input-wrap { height: auto !important; padding: 12px 14px !important; }
    #convocatoriaForm .naowee-textfield__input { font-size: 14px; }
    #convocatoriaForm .naowee-textfield__label,
    #convocatoriaForm .naowee-dropdown__label { font-size: 13px; padding-bottom: 6px; font-weight: 500; }
    #convocatoriaForm .naowee-dropdown__trigger { height: 46px !important; padding: 0 14px !important; font-size: 14px; }
    /* Multi dropdown: padding consistente (interior gestionado por el chip flow) */
    #convocatoriaForm .naowee-dropdown--multi .naowee-dropdown__trigger {
      min-height: 46px !important;
      padding: 8px 12px 8px 14px !important;
    }

    /* ═══ File uploader — overrides mínimos al DS oficial v1.8.0 ═══
       El DS provee TODO el styling: __input-wrap (48px), __placeholder,
       __action, __file-tag (+--uploaded/--confirmed), __progress, __progress-ring,
       __progress-text, --dragover, --disabled, --readonly. Solo agregamos:
       - margen entre file uploaders consecutivos
       - __hint (helper bajo el wrap, no es parte del DS) */
    .naowee-file-uploader { margin-bottom: 16px; }
    .naowee-file-uploader__hint {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 6px;
      line-height: 1.4;
      display: block;
    }
    /* Variante --error para el file-tag (el DS solo tiene --uploaded/--confirmed) */
    .naowee-file-uploader__file-tag--error {
      border-color: #b42318 !important;
      background: var(--red-bg, #fff0ee) !important;
      color: #b42318 !important;
    }
    .naowee-file-uploader__file-tag--error svg { color: #b42318; }

    /* ═══ Naowee message — overrides mínimos sobre DS oficial v1.8.0 ═══
       El DS define toda la anatomía:
       - .naowee-message: column flex, padding xtiny, border-radius 20px
       - __header: row icon+title
       - __icon: 20×20 CÍRCULO RELLENO con fondo loud variant + svg blanco 16×16
       - __title: 16/700
       - __content: column wrapper para text + action
       - __text: 14/regular
       - --informative/--positive/--caution/--negative (background quiet + icon loud)
       - --loud.--negative (alta atención)
       Acá solo agregamos margin-top para separación contextual del paso 3. */
    #convocatoriaOverlay .naowee-message { margin-top: 18px; }
    #convocatoriaOverlay .naowee-message__text strong,
    #convocatoriaOverlay .naowee-message__body strong { font-weight: 700; }
    /* Override body para permitir multiline (DS default es nowrap+ellipsis) */
    #convocatoriaOverlay .naowee-message__body {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }

    /* Deptos grid */
    #deptosGrid {
      max-height: 240px; overflow-y: auto; padding: 4px;
      border: 1px solid var(--border); border-radius: var(--radius-md);
    }

    /* ═══ Success animation (confetti + check verde — pattern incentivos) ═══ */
    .convo-success {
      text-align: center; padding: 32px 24px 12px;
      position: relative; overflow: hidden;
      animation: stepFadeIn .4s cubic-bezier(.4,0,.2,1) both;
    }
    .convo-success::before {
      content: ""; position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
      width: 320px; height: 320px; border-radius: 50%;
      background: radial-gradient(circle, rgba(31,137,35,.14) 0%, transparent 70%);
      pointer-events: none;
    }
    .convo-success__check {
      width: 88px; height: 88px; border-radius: 50%;
      background: linear-gradient(135deg,#25a12a,#1f8923);
      display: inline-flex; align-items: center; justify-content: center; color: #fff;
      margin-bottom: 18px;
      box-shadow: 0 8px 28px rgba(31,137,35,.35);
      animation: convoPop .5s cubic-bezier(.34,1.56,.64,1);
      position: relative; z-index: 1;
    }
    @keyframes convoPop {
      0% { transform: scale(.5); opacity: 0 }
      100% { transform: scale(1); opacity: 1 }
    }
    .convo-success h2 {
      font-size: 22px; font-weight: 800; letter-spacing: -.02em;
      margin: 0 0 8px; position: relative; z-index: 1;
    }
    .convo-success p {
      font-size: 13.5px; color: var(--text-secondary); line-height: 1.5;
      max-width: 440px; margin: 0 auto; position: relative; z-index: 1;
    }
    .convo-success__stamp {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
      font-family: 'SF Mono', monospace; font-size: 11.5px; font-weight: 700;
      color: var(--text-secondary); padding: 6px 14px; background: #fff;
      border: 1px solid var(--border); border-radius: var(--radius-full);
      position: relative; z-index: 1;
    }
    .convo-confetti { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .convo-confetti span {
      position: absolute; width: 8px; height: 12px;
      animation: convoFall 2.4s linear forwards; opacity: 0;
    }
    @keyframes convoFall {
      0% { transform: translateY(-30px) rotate(0); opacity: 0 }
      15% { opacity: 1 }
      100% { transform: translateY(380px) rotate(720deg); opacity: 0 }
    }

    /* Validation error — scope con #convocatoriaOverlay para outspecify los
       rules id-prefixed del mismo bloque (líneas 366+, 866+). Sin scope los
       rules .has-error pierden contra el border-color base de los inputs. */
    #convocatoriaOverlay .has-error .naowee-textfield__input-wrap,
    #convocatoriaOverlay .has-error .naowee-datepicker-field__input,
    #convocatoriaOverlay .has-error .naowee-dropdown__trigger,
    #convocatoriaOverlay .has-error .naowee-multiselect__trigger,
    #convocatoriaOverlay .has-error .naowee-file-uploader__input-wrap {
      border-color: #b42318 !important;
      background-color: #fff !important;
      transition: none !important;
    }
    /* Shake on validation error */
    .naowee-shake { animation: convoShake .4s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes convoShake {
      10%, 90% { transform: translateX(-2px) }
      20%, 80% { transform: translateX(4px) }
      30%, 50%, 70% { transform: translateX(-6px) }
      40%, 60% { transform: translateX(6px) }
    }
  `;
  const s = document.createElement('style');
  s.id = 'convocatoriaModalStyle';
  s.textContent = css;
  document.head.appendChild(s);
}

/* ═══ Step content ═══ */
function stepIdentificacion() {
  return `
    <h3 class="convo-section">Identificación</h3>
    ${textfield({ label: 'Nombre de la convocatoria', name: 'nombre', required: true, minlength: 10, maxlength: 200, placeholder: 'Ej: Convocatoria Nacional de Infraestructura Deportiva 2026 II', helper: 'Mín. 10, máx. 200 caracteres' })}
    ${textarea({ label: 'Descripción', name: 'descripcion', required: true, maxlength: 5000, rows: 3, placeholder: 'Alcance, objetivos, entidades elegibles, criterios generales…', helper: 'Máx. 5.000 caracteres' })}
    <div class="convo-grid-2">
      ${dropdown({ label: 'Bienio', name: 'bienio', required: true, options: BIENIOS, value: '2025-2026' })}
      ${dropdown({ label: 'Permite segunda convocatoria', name: 'permiteSegunda', options: SI_NO, value: 'true' })}
    </div>
    <h3 class="convo-section">Periodo de postulación</h3>
    <div class="convo-grid-2">
      ${datepicker({ label: 'Apertura', name: 'apertura', required: true })}
      ${datepicker({ label: 'Cierre', name: 'cierre', required: true, helper: 'Postulaciones expiran tras esta fecha' })}
    </div>
    <h3 class="convo-section" style="margin-top:8px">Plazo posterior al cierre</h3>
    <div class="convo-grid-2">
      ${datepicker({ label: 'Emisión de conceptos', name: 'emisionConcepto', helper: 'Fecha límite para que los revisores publiquen el concepto técnico' })}
      <div></div>
    </div>
  `;
}

function stepAlcance() {
  return `
    <h3 class="convo-section">Alcance territorial</h3>
    ${dropdown({ label: 'Cobertura territorial', name: 'cobertura', required: true, options: COBERTURAS, value: 'Nacional', placeholder: 'Seleccionar cobertura…' })}
    <div id="deptosWrap" style="display:none;margin-top:12px">
      ${multiSelect({
        label: 'Departamentos incluidos',
        name: 'departamentos',
        required: true,
        placeholder: 'Selecciona los departamentos donde aplica la convocatoria…',
        options: DEPARTAMENTOS
      })}
    </div>
    <div id="muniWrap" style="display:none;margin-top:12px">
      ${textarea({ label: 'Municipios específicos', name: 'municipios', helper: 'Lista de municipios separados por coma. Útil para convocatorias focalizadas (ZOMAC, PDET, priorizados).', rows: 2, placeholder: 'Quibdó, Bahía Solano, Istmina, …' })}
    </div>
    <div class="convo-filters-block">
      <div class="convo-filters-block__label">Filtros adicionales <span class="convo-filters-block__hint">(opcional)</span></div>
      <div class="convo-filters-block__row">
        ${checkbox({ name: 'soloZOMAC', value: 'true', label: 'Solo municipios ZOMAC' })}
        ${checkbox({ name: 'soloPDET',  value: 'true', label: 'Solo municipios PDET' })}
      </div>
      <p class="convo-filters-block__caption">Restringe la convocatoria a municipios con clasificación especial.</p>
    </div>
  `;
}

function stepCondiciones() {
  return `
    <h3 class="convo-section">Condiciones de participación</h3>
    ${multiSelect({
      label: 'Tipos de solicitud permitidos',
      name: 'tiposSolicitud',
      required: true,
      placeholder: 'Selecciona los tipos de proyecto que se pueden radicar…',
      options: TIPOS_SOLICITUD
    })}
    ${multiSelect({
      label: 'Fases del proyecto permitidas',
      name: 'fasesProyecto',
      required: true,
      placeholder: 'Selecciona las fases admitidas…',
      options: FASES_PROYECTO
    })}
    ${multiSelect({
      label: 'Fuentes de financiación permitidas',
      name: 'fuentes',
      required: true,
      placeholder: 'Selecciona las fuentes de financiación…',
      options: FUENTES
    })}
    <div class="convo-grid-2" style="margin-top:12px">
      ${textfield({ label: 'Presupuesto total disponible (COP)', name: 'presupuestoTotal', type: 'number', placeholder: '80.000.000.000', helper: 'Techo presupuestal de la convocatoria' })}
      ${textfield({ label: 'Monto máximo por proyecto (COP)', name: 'montoMaximoProyecto', type: 'number', placeholder: '12.000.000.000', helper: 'Tope de solicitud al Ministerio' })}
    </div>

    <h3 class="convo-section">Documentos adjuntos</h3>
    ${fileUpload({ name: 'actoAdmin', label: 'Acto administrativo de apertura', required: true, accept: '.pdf', maxSize: 20, helper: 'Resolución o acuerdo que formaliza la apertura · PDF, máx. 20 MB' })}
    ${fileUpload({ name: 'terminosRef', label: 'Términos de referencia', required: true, accept: '.pdf', maxSize: 20, helper: 'Documento detallado con criterios de evaluación y cronograma · PDF, máx. 20 MB' })}
    ${fileUpload({ name: 'plantillas', label: 'Plantillas y anexos (opcional)', accept: '.zip,.pdf', maxSize: 50, helper: 'Formatos descargables (carta de intención, certificaciones, etc.) · ZIP o PDF, máx. 50 MB' })}

    <div class="naowee-message naowee-message--informative" role="status">
      <div class="naowee-message__header">
        <span class="naowee-message__icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 7v4M8 4.5h.01" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </span>
        <span class="naowee-message__body">
          <strong>Trazabilidad automática.</strong> Al publicar, el sistema registra usuario, fecha y cambia el estado a <strong>Abierta</strong>.
        </span>
      </div>
    </div>

    <div class="convo-section">Notificación a municipios</div>
    <label class="convo-toggle">
      <input type="checkbox" name="notificarAlPublicar" checked>
      <span class="convo-toggle__check"></span>
      <span class="convo-toggle__body">
        <span class="convo-toggle__title">Notificar a municipios al publicar</span>
        <span class="convo-toggle__sub">Se enviará el correo institucional con plantilla precargada. Podrás reconfigurar canales y cuerpo desde el detalle de la convocatoria.</span>
      </span>
    </label>
  `;
}

/* ═══ Modal markup ═══ */
function modalMarkup() {
  const codigoSugerido = nextCodigoConvocatoria();
  return `
    <div class="naowee-modal-overlay" id="convocatoriaOverlay" role="dialog" aria-modal="true" aria-labelledby="convocatoriaModalTitle">
      <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
        <div class="naowee-modal__header">
          <div class="naowee-modal__title-group">
            <h2 class="naowee-modal__title" id="convocatoriaModalTitle">Crear convocatoria</h2>
            <p class="naowee-modal__subtitle">Completa los datos de la convocatoria. Puedes guardar como borrador y retomar después.</p>
          </div>
          <button type="button" class="naowee-modal__dismiss" id="convocatoriaModalClose" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="naowee-stepper naowee-stepper--pulse" id="convoStepper">
          <div class="naowee-stepper__step naowee-stepper__step--active" data-step="1">
            <span class="naowee-stepper__number">1</span>
            <span class="naowee-stepper__label">Identificación</span>
          </div>
          <div class="naowee-stepper__connector" data-after="1"></div>
          <div class="naowee-stepper__step" data-step="2">
            <span class="naowee-stepper__number">2</span>
            <span class="naowee-stepper__label">Alcance territorial</span>
          </div>
          <div class="naowee-stepper__connector" data-after="2"></div>
          <div class="naowee-stepper__step" data-step="3">
            <span class="naowee-stepper__number">3</span>
            <span class="naowee-stepper__label">Condiciones y documentos</span>
          </div>
        </div>

        <div class="naowee-modal__body" id="convoModalBody">
          <form id="convocatoriaForm" novalidate>
            <div class="convo-step-panel is-active" data-panel="1">${stepIdentificacion()}</div>
            <div class="convo-step-panel" data-panel="2">${stepAlcance()}</div>
            <div class="convo-step-panel" data-panel="3">${stepCondiciones()}</div>
          </form>
        </div>

        <div class="naowee-modal__footer" id="convoModalFooter">
          <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="convoStepPrev" style="display:none">
            ${arrowLeftIcon} Anterior
          </button>
          <button type="button" class="wz-save-draft" id="convoSaveDraft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar borrador
          </button>
          <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="convoStepNext">
            Continuar ${arrowRightIcon}
          </button>
          <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="convoStepPublish" style="display:none">
            ${checkIcon} Publicar convocatoria
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ═══ Bind datepickers ═══ */
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatDateInput(d) {
  /* "16 may 2026" */
  return `${String(d.getDate()).padStart(2,'0')} ${MESES_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

/* Construye el HTML de los días agrupados en filas __week (DS oficial usa flex).
   Aplica modificadores --today, --selected, --other-month, --disabled (pasado),
   y --weekend para sábado/domingo. */
function buildDaysHTML(viewYear, viewMonth, selectedISO, opts = {}) {
  const selected = selectedISO ? new Date(selectedISO) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = opts.minDate || null;
  const maxDate = opts.maxDate || null;

  const first = new Date(viewYear, viewMonth, 1);
  let firstDow = first.getDay() - 1; if (firstDow < 0) firstDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  let html = '';
  /* 6 semanas × 7 días = 42 celdas, agrupadas en .naowee-datepicker__week por fila */
  for (let w = 0; w < 6; w++) {
    html += '<div class="naowee-datepicker__week">';
    for (let d = 0; d < 7; d++) {
      const i = w * 7 + d;
      let dayNum, isOther = false, year = viewYear, month = viewMonth;
      if (i < firstDow) {
        dayNum = daysInPrev - firstDow + 1 + i;
        isOther = true;
        month = viewMonth - 1;
        if (month < 0) { month = 11; year--; }
      } else if (i >= firstDow + daysInMonth) {
        dayNum = i - firstDow - daysInMonth + 1;
        isOther = true;
        month = viewMonth + 1;
        if (month > 11) { month = 0; year++; }
      } else {
        dayNum = i - firstDow + 1;
      }
      const cellDate = new Date(year, month, dayNum);
      cellDate.setHours(0, 0, 0, 0);
      const isSelected = selected && cellDate.toDateString() === selected.toDateString();
      const isToday = cellDate.toDateString() === today.toDateString();
      const isDisabled = (minDate && cellDate < minDate) || (maxDate && cellDate > maxDate);
      const classes = [
        'naowee-datepicker__day',
        isOther ? 'naowee-datepicker__day--other-month' : '',
        isSelected ? 'naowee-datepicker__day--selected' : '',
        isToday && !isSelected ? 'naowee-datepicker__day--today' : '',
        isDisabled ? 'naowee-datepicker__day--disabled' : ''
      ].filter(Boolean).join(' ');
      const disabledAttr = isDisabled ? ' disabled aria-disabled="true"' : '';
      html += `<button type="button" class="${classes}"${disabledAttr} data-iso="${cellDate.toISOString()}">${dayNum}</button>`;
    }
    html += '</div>';
  }
  return html;
}

function renderCalendar(field, viewYear, viewMonth) {
  const monthLabel = field.querySelector('.naowee-datepicker__month');
  const daysWrap = field.querySelector('.naowee-datepicker__days');
  monthLabel.textContent = `${MESES_ES[viewMonth]} ${viewYear}`;
  daysWrap.innerHTML = buildDaysHTML(viewYear, viewMonth, field.dataset.selected || '');

  /* Bind day clicks */
  daysWrap.querySelectorAll('.naowee-datepicker__day:not(.naowee-datepicker__day--disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const iso = btn.dataset.iso;
      const d = new Date(iso);
      setDatepickerValue(field, iso, d);
      renderCalendar(field, d.getFullYear(), d.getMonth());
      field.querySelector('.naowee-datepicker--popover').hidden = true;
      field.classList.remove('naowee-datepicker-field--active');
      const inp = field.querySelector('.naowee-datepicker-field__input');
      if (inp) {
        inp.setAttribute('aria-expanded', 'false');
        inp.style.removeProperty('border-color');
        inp.style.removeProperty('box-shadow');
      }
    });
  });
}

/* Setea valor del datepicker DS oficial: __value display + hidden input + clear button */
function setDatepickerValue(field, iso, dateObj) {
  field.dataset.selected = iso || '';
  const valueEl = field.querySelector('.naowee-datepicker-field__value');
  const hiddenInput = field.querySelector('input[type="hidden"][name]');
  const clearBtn = field.querySelector('.naowee-datepicker-field__clear');
  if (iso && dateObj) {
    valueEl.textContent = formatDateLong(dateObj);
    valueEl.classList.remove('is-placeholder');
    if (hiddenInput) hiddenInput.value = iso;
    if (clearBtn) clearBtn.hidden = false;
  } else {
    const placeholder = valueEl.dataset.placeholder || 'dd mmm aaaa';
    valueEl.textContent = placeholder;
    valueEl.classList.add('is-placeholder');
    if (hiddenInput) hiddenInput.value = '';
    if (clearBtn) clearBtn.hidden = true;
  }
}

/* Formato largo "16 de Junio de 2025" — patrón DS oficial */
function formatDateLong(d) {
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

function bindDatepickers(scope) {
  /* Mover popovers al <body> (portal) — escapa overflow/transform del modal */
  const popovers = [];
  scope.querySelectorAll('.naowee-datepicker-field').forEach(field => {
    const popover = field.querySelector('.naowee-datepicker--popover');
    const inputContainer = field.querySelector('.naowee-datepicker-field__input');
    const valueEl = field.querySelector('.naowee-datepicker-field__value');
    const clearBtn = field.querySelector('.naowee-datepicker-field__clear');

    /* Inicializar como placeholder */
    valueEl.classList.add('is-placeholder');

    /* Portal: mover popover al body para escapar containing block del modal */
    document.body.appendChild(popover);
    popover.dataset.field = field.dataset.name;
    field._popover = popover;
    popovers.push({ field, popover });

    let viewDate = new Date();

    const positionPopover = () => {
      const rect = inputContainer.getBoundingClientRect();
      const popoverWidth = popover.offsetWidth || 320;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.right - popoverWidth);
      }
      /* SIEMPRE pegado abajo del input. Si se sale del viewport el
         usuario puede scrollear el modal — esto es preferible al salto
         visual del flip-up que aleja mucho el popover. */
      const top = rect.bottom + 6;
      popover.style.top = top + 'px';
      popover.style.left = left + 'px';
    };

    const open = () => {
      /* Cerrar otros popovers abiertos */
      popovers.forEach(({ field: f, popover: p }) => {
        if (p !== popover) {
          p.hidden = true;
          f.classList.remove('naowee-datepicker-field--active');
          const otherInput = f.querySelector('.naowee-datepicker-field__input');
          otherInput?.setAttribute('aria-expanded', 'false');
          /* Limpiar inline style del input cerrado */
          if (otherInput) {
            otherInput.style.removeProperty('border-color');
            otherInput.style.removeProperty('box-shadow');
          }
        }
      });
      popover.hidden = false;
      field.classList.add('naowee-datepicker-field--active');
      inputContainer.setAttribute('aria-expanded', 'true');
      /* Aplicar focus state inline (vence !important del DS oficial) */
      inputContainer.style.setProperty('border-color', '#d74009', 'important');
      inputContainer.style.setProperty('box-shadow', '0 0 0 3px rgba(215,64,9,.15)', 'important');
      /* Reset al modo days al abrir */
      const calendar = popover.querySelector('.naowee-datepicker__calendar');
      calendar.dataset.mode = 'days';
      renderCalendarPortal(popover, field, viewDate.getFullYear(), viewDate.getMonth());
      /* Posicionar DESPUÉS del render para tener offsetHeight real */
      positionPopover();
      /* Header clickable: cycle days → months → years → days */
      const monthSelector = popover.querySelector('.naowee-datepicker__month-selector');
      monthSelector.onclick = (e) => {
        e.stopPropagation();
        const m = calendar.dataset.mode || 'days';
        calendar.dataset.mode = m === 'days' ? 'months' : m === 'months' ? 'years' : 'days';
        renderCalendarPortal(popover, field, viewDate.getFullYear(), viewDate.getMonth());
      };
      /* Nav buttons: respetan el modo actual (mes / año / bloque-12) */
      popover.querySelectorAll('.naowee-datepicker__nav').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const dir = parseInt(btn.dataset.nav);
          const m = calendar.dataset.mode || 'days';
          if (m === 'days') {
            viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
          } else if (m === 'months') {
            viewDate = new Date(viewDate.getFullYear() + dir, viewDate.getMonth(), 1);
          } else { /* years: bloque de 12 */
            viewDate = new Date(viewDate.getFullYear() + (dir * 12), viewDate.getMonth(), 1);
          }
          renderCalendarPortal(popover, field, viewDate.getFullYear(), viewDate.getMonth());
        };
      });
    };

    const close = () => {
      popover.hidden = true;
      field.classList.remove('naowee-datepicker-field--active');
      inputContainer.setAttribute('aria-expanded', 'false');
      /* Limpiar inline focus styles */
      inputContainer.style.removeProperty('border-color');
      inputContainer.style.removeProperty('box-shadow');
    };

    const reposition = () => { if (!popover.hidden) positionPopover(); };
    scope.querySelector('.naowee-modal__body')?.addEventListener('scroll', reposition);
    window.addEventListener('resize', reposition);

    const toggle = (e) => {
      e.stopPropagation();
      if (popover.hidden) open();
      else close();
    };

    inputContainer.addEventListener('click', (e) => {
      /* Click sobre el clear button NO debe abrir el popover */
      if (e.target.closest('.naowee-datepicker-field__clear')) return;
      toggle(e);
    });

    /* Keyboard support: Enter/Space abre, Esc cierra */
    inputContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(e);
      } else if (e.key === 'Escape' && !popover.hidden) {
        close();
      }
    });

    /* Clear button: limpia valor + deja placeholder */
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setDatepickerValue(field, null, null);
        viewDate = new Date();
      });
    }

    /* Click dentro del popover no debe cerrar */
    popover.addEventListener('click', (e) => e.stopPropagation());
  });

  /* Click fuera cierra todos los popovers */
  if (!scope._dpClickBound) {
    scope._dpClickBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.naowee-datepicker-field')) return;
      if (e.target.closest('.naowee-datepicker--popover')) return;
      popovers.forEach(({ field: f, popover: p }) => {
        if (!p.hidden) {
          p.hidden = true;
          f.classList.remove('naowee-datepicker-field--active');
          const inp = f.querySelector('.naowee-datepicker-field__input');
          if (inp) {
            inp.setAttribute('aria-expanded', 'false');
            inp.style.removeProperty('border-color');
            inp.style.removeProperty('box-shadow');
          }
        }
      });
    });
  }
}

/* Renderiza el calendario dentro del popover (que ahora vive en body) */
const MESES_ES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function renderCalendarPortal(popover, field, viewYear, viewMonth) {
  const calendar = popover.querySelector('.naowee-datepicker__calendar');
  const mode = calendar.dataset.mode || 'days';
  const monthLabel = popover.querySelector('.naowee-datepicker__month');
  const viewDays = popover.querySelector('.dp-view--days');
  const viewMonths = popover.querySelector('.dp-view--months');
  const viewYears = popover.querySelector('.dp-view--years');
  const daysWrap = popover.querySelector('.naowee-datepicker__days');

  /* Toggle visibilidad de vistas (display:none directo evita overrides del DS) */
  viewDays.style.display = mode === 'days' ? '' : 'none';
  viewMonths.style.display = mode === 'months' ? 'grid' : 'none';
  viewYears.style.display = mode === 'years' ? 'grid' : 'none';

  const closePopover = () => {
    popover.hidden = true;
    field.classList.remove('naowee-datepicker-field--active');
    const inp = field.querySelector('.naowee-datepicker-field__input');
    if (inp) {
      inp.setAttribute('aria-expanded', 'false');
      inp.style.removeProperty('border-color');
      inp.style.removeProperty('box-shadow');
    }
  };

  if (mode === 'days') {
    monthLabel.textContent = `${MESES_ES[viewMonth]} ${viewYear}`;
    daysWrap.innerHTML = buildDaysHTML(viewYear, viewMonth, field.dataset.selected || '');
    daysWrap.querySelectorAll('.naowee-datepicker__day:not(.naowee-datepicker__day--disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const iso = btn.dataset.iso;
        const d = new Date(iso);
        setDatepickerValue(field, iso, d);
        renderCalendarPortal(popover, field, d.getFullYear(), d.getMonth());
        closePopover();
      });
    });
  }

  if (mode === 'months') {
    monthLabel.textContent = String(viewYear);
    const selectedMonth = field.dataset.selected ? new Date(field.dataset.selected).getMonth() : -1;
    const selectedYear = field.dataset.selected ? new Date(field.dataset.selected).getFullYear() : -1;
    viewMonths.innerHTML = MESES_ES_CORTO.map((m, i) => {
      const isSelected = i === selectedMonth && viewYear === selectedYear;
      return `<button type="button" class="dp-cell ${isSelected ? 'dp-cell--selected' : ''}" data-month="${i}">${m}</button>`;
    }).join('');
    viewMonths.querySelectorAll('[data-month]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = parseInt(btn.dataset.month);
        calendar.dataset.mode = 'days';
        renderCalendarPortal(popover, field, viewYear, m);
      });
    });
  }

  if (mode === 'years') {
    /* Bloque de 12 años centrado en viewYear */
    const startYear = Math.floor(viewYear / 12) * 12;
    const endYear = startYear + 11;
    monthLabel.textContent = `${startYear} - ${endYear}`;
    const selectedYear = field.dataset.selected ? new Date(field.dataset.selected).getFullYear() : -1;
    let html = '';
    for (let y = startYear; y <= endYear; y++) {
      const isSelected = y === selectedYear;
      html += `<button type="button" class="dp-cell ${isSelected ? 'dp-cell--selected' : ''}" data-year="${y}">${y}</button>`;
    }
    viewYears.innerHTML = html;
    viewYears.querySelectorAll('[data-year]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const y = parseInt(btn.dataset.year);
        calendar.dataset.mode = 'months';
        renderCalendarPortal(popover, field, y, viewMonth);
      });
    });
  }
}

/* ═══ Bind file upload — DS oficial naowee-file-uploader v1.8.0 ═══
   Reemplaza el contenido del __input-wrap según estado.
   - empty: __placeholder + __action ("Subir documento")
   - loading: __file-tag + __progress (ring spinner + text %)
   - uploaded: __file-tag--uploaded (border verde 2px) + __file-dismiss
   - error: __file-tag con border negative + __action "Reintentar"
   Variantes del wrapper: --dragover (CSS DS), --disabled, --readonly. */
function bindFileUpload(field) {
  const input = field.querySelector('input[type="file"]');
  const wrap = field.querySelector('[data-wrap]');
  const accept = (field.dataset.accept || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const maxBytes = parseInt(field.dataset.maxSize || '20', 10) * 1024 * 1024;

  /* SVGs reutilizados */
  const fileSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const xSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

  const renderEmpty = () => {
    wrap.innerHTML = `
      <span class="naowee-file-uploader__placeholder" data-slot>Sin archivo adjunto</span>
      <button type="button" class="naowee-file-uploader__action" data-action>Subir documento</button>`;
    field.dataset.state = 'empty';
    bindAction();
  };

  const renderLoading = (fileName, pct = 0) => {
    wrap.innerHTML = `
      <span class="naowee-file-uploader__file-tag">
        ${fileSvg}
        <span data-name>${fileName}</span>
      </span>
      <span class="naowee-file-uploader__progress">
        <span class="naowee-file-uploader__progress-ring"></span>
        <span class="naowee-file-uploader__progress-text" data-pct>${Math.round(pct)}%</span>
      </span>`;
    field.dataset.state = 'loading';
  };

  const updateProgress = (pct) => {
    const pctEl = wrap.querySelector('[data-pct]');
    if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  };

  const renderUploaded = (fileName) => {
    wrap.innerHTML = `
      <span class="naowee-file-uploader__file-tag naowee-file-uploader__file-tag--uploaded">
        ${fileSvg}
        <span data-name>${fileName}</span>
        <button type="button" class="naowee-file-uploader__file-dismiss" aria-label="Quitar archivo" data-remove>${xSvg}</button>
      </span>`;
    field.dataset.state = 'uploaded';
    wrap.querySelector('[data-remove]')?.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = '';
      renderEmpty();
    });
  };

  const renderError = (msg) => {
    wrap.innerHTML = `
      <span class="naowee-file-uploader__file-tag naowee-file-uploader__file-tag--error">
        ${fileSvg}
        <span data-name>${msg}</span>
      </span>
      <button type="button" class="naowee-file-uploader__action" data-action>Reintentar</button>`;
    field.dataset.state = 'error';
    bindAction();
  };

  const acceptsFile = (file) => {
    if (accept.length === 0) return true;
    const fname = file.name.toLowerCase();
    return accept.some(ext => fname.endsWith(ext));
  };

  const handleFile = (file) => {
    if (!acceptsFile(file)) {
      input.value = '';
      renderError(`Formato no permitido (${accept.join(', ')})`);
      return;
    }
    if (file.size > maxBytes) {
      input.value = '';
      renderError(`Archivo > ${field.dataset.maxSize} MB`);
      return;
    }
    renderLoading(file.name, 0);
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(95, pct + 8 + Math.random() * 12);
      updateProgress(pct);
    }, 120);
    setTimeout(() => {
      clearInterval(tick);
      updateProgress(100);
      setTimeout(() => renderUploaded(file.name), 220);
    }, 800 + Math.random() * 500);
  };

  const bindAction = () => {
    const action = wrap.querySelector('[data-action]');
    if (!action) return;
    action.addEventListener('click', (e) => { e.preventDefault(); input.click(); });
  };

  bindAction();

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) handleFile(file);
  });

  /* Drag & drop — toggle clase --dragover del DS sobre el field padre */
  ['dragenter', 'dragover'].forEach(evt => {
    wrap.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (field.dataset.state === 'empty') field.classList.add('naowee-file-uploader--dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    wrap.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      field.classList.remove('naowee-file-uploader--dragover');
    });
  });
  wrap.addEventListener('drop', (e) => {
    if (field.dataset.state !== 'empty') return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      input.files = e.dataTransfer.files;
      handleFile(file);
    }
  });
}

/* ═══ Bind dropdowns — Portal al body (z-index alto, escapa overflow del modal) ═══ */
function bindDropdowns(scope) {
  const dropdowns = [];
  scope.querySelectorAll('.naowee-dropdown:not([data-multi="true"])').forEach(dd => {
    const trigger = dd.querySelector('.naowee-dropdown__trigger');
    const menu = dd.querySelector('.naowee-dropdown__menu');
    const hidden = dd.querySelector('input[type="hidden"]');
    const valueEl = dd.querySelector('.naowee-dropdown__value, .naowee-dropdown__placeholder');

    /* Portal: mover menu al body */
    document.body.appendChild(menu);
    dropdowns.push({ dd, menu, trigger });

    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      /* Width fijo = ancho del trigger (no min-width que permite crecer) */
      menu.style.width = rect.width + 'px';
      menu.style.maxWidth = rect.width + 'px';
      /* Default: abrir hacia abajo justo debajo del trigger */
      menu.style.top = (rect.bottom + 4) + 'px';
      /* Anti-overflow: solo abrir hacia arriba si REALMENTE no cabe abajo Y
         hay más espacio arriba que abajo (evita el "abre arriba" cuando
         hay espacio suficiente). Mide después de visible para offsetHeight real. */
      requestAnimationFrame(() => {
        const menuH = menu.offsetHeight || 240;
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        if (menuH > spaceBelow && spaceAbove > spaceBelow) {
          /* No cabe abajo y arriba hay más espacio → abrir arriba */
          menu.style.top = Math.max(8, rect.top - menuH - 4) + 'px';
        } else {
          /* Cabe abajo (o arriba también es chiquito): mantener abajo */
          menu.style.top = (rect.bottom + 4) + 'px';
          /* Si el menu es más alto que el espacio disponible, limitar altura */
          if (menuH > spaceBelow) {
            menu.style.setProperty('max-height', Math.max(160, spaceBelow) + 'px', 'important');
          }
        }
      });
    };

    /* Helpers para abrir/cerrar — DS oficial usa max-height:0 + opacity:0 en idle.
       Al hacer portal perdemos `.naowee-dropdown--open .naowee-dropdown__menu`,
       así que forzamos todas las propiedades inline con !important. */
    const showMenu = () => {
      menu.style.setProperty('opacity', '1', 'important');
      menu.style.setProperty('max-height', '280px', 'important');
      menu.style.setProperty('overflow-y', 'auto', 'important');
      menu.style.setProperty('transform', 'translateY(0)', 'important');
      menu.style.setProperty('pointer-events', 'auto', 'important');
      menu.style.setProperty('visibility', 'visible', 'important');
      menu.classList.add('is-open');
      dd.classList.add('is-open');
      dd.classList.add('naowee-dropdown--open');
    };
    const hideMenu = () => {
      menu.style.setProperty('opacity', '0', 'important');
      menu.style.setProperty('max-height', '0', 'important');
      menu.style.setProperty('overflow', 'hidden', 'important');
      menu.style.setProperty('transform', 'translateY(-4px)', 'important');
      menu.style.setProperty('pointer-events', 'none', 'important');
      menu.classList.remove('is-open');
      dd.classList.remove('is-open');
      dd.classList.remove('naowee-dropdown--open');
    };
    /* Exportar a la closure de bindDropdowns */
    dd._showMenu = showMenu;
    dd._hideMenu = hideMenu;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !dd.classList.contains('is-open');
      /* Cerrar otros dropdowns */
      dropdowns.forEach(({ dd: d }) => {
        if (d !== dd && d._hideMenu) d._hideMenu();
      });
      if (willOpen) {
        positionMenu();
        showMenu();
      } else {
        hideMenu();
      }
    });

    /* Bind options del menu (que vive en body) */
    menu.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        const lbl = opt.textContent.trim();
        hidden.value = val;
        dd.dataset.value = val;
        valueEl.className = 'naowee-dropdown__value';
        valueEl.textContent = lbl;
        menu.querySelectorAll('.naowee-dropdown__option').forEach(o => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        hideMenu();
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    /* Click dentro del menu no cierra */
    menu.addEventListener('click', (e) => e.stopPropagation());

    /* Reposicionar al scroll del modal */
    const reposition = () => { if (dd.classList.contains('is-open')) positionMenu(); };
    scope.querySelector('.naowee-modal__body')?.addEventListener('scroll', reposition);
    window.addEventListener('resize', reposition);
  });

  /* Click fuera cierra todos — registrar tras 100ms para que el click que abrió no lo cierre */
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.naowee-dropdown__trigger')) return;
      if (e.target.closest('.naowee-dropdown__menu')) return;
      dropdowns.forEach(({ dd }) => {
        if (dd._hideMenu) dd._hideMenu();
      });
    });
  }, 100);
}

/* ═══ Bind multi-select dropdowns con tags + botón Agregar ═══
   Pattern: portal del menu al body (igual que bindDropdowns) +
   toggle inmediato de selección + tags en el trigger + hidden inputs
   sincronizados para FormData.getAll(). El botón "Agregar" cierra el menu. */
function bindMultiSelects(scope) {
  const dropdowns = [];

  scope.querySelectorAll('.naowee-dropdown[data-multi="true"]').forEach(dd => {
    const trigger = dd.querySelector('.naowee-dropdown__trigger');
    const menu = dd.querySelector('.naowee-dropdown__menu');
    const controlsEl = trigger.querySelector('.naowee-dropdown__controls');
    const hiddenContainer = dd.querySelector('[data-hidden-inputs]');
    const countEl = menu.querySelector('[data-multi-count]');
    const applyBtn = menu.querySelector('[data-multi-apply]');
    const placeholder = dd.dataset.placeholderText || 'Seleccionar…';
    const fieldName = dd.dataset.name;

    /* Portal: mover menu al body (escapa overflow del modal) */
    document.body.appendChild(menu);
    dropdowns.push({ dd, menu, trigger });

    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      menu.style.top = (rect.bottom + 6) + 'px';
      menu.style.left = rect.left + 'px';
      menu.style.width = rect.width + 'px';
      menu.style.maxWidth = rect.width + 'px';
      const menuH = menu.offsetHeight || 320;
      if (rect.bottom + 6 + menuH > window.innerHeight - 16) {
        menu.style.top = Math.max(16, rect.top - menuH - 6) + 'px';
      }
    };

    const showMenu = () => {
      menu.style.setProperty('opacity', '1', 'important');
      menu.style.setProperty('max-height', '380px', 'important');
      menu.style.setProperty('overflow', 'visible', 'important');
      menu.style.setProperty('transform', 'translateY(0)', 'important');
      menu.style.setProperty('pointer-events', 'auto', 'important');
      menu.style.setProperty('visibility', 'visible', 'important');
      menu.classList.add('is-open');
      dd.classList.add('is-open', 'naowee-dropdown--open');
    };
    const hideMenu = () => {
      menu.style.setProperty('opacity', '0', 'important');
      menu.style.setProperty('max-height', '0', 'important');
      menu.style.setProperty('overflow', 'hidden', 'important');
      menu.style.setProperty('transform', 'translateY(-4px)', 'important');
      menu.style.setProperty('pointer-events', 'none', 'important');
      menu.classList.remove('is-open');
      dd.classList.remove('is-open', 'naowee-dropdown--open');
    };
    dd._showMenu = showMenu;
    dd._hideMenu = hideMenu;

    /* Estado: lista de valores actualmente seleccionados */
    const getValues = () => Array.from(menu.querySelectorAll('.naowee-dropdown__option.is-selected'))
      .map(o => o.dataset.value);

    const renderTags = () => {
      const values = getValues();
      /* Quitar placeholder/tags previos (todo lo del trigger excepto __controls) */
      [...trigger.children].forEach(child => {
        if (child !== controlsEl) child.remove();
      });
      if (values.length === 0) {
        const ph = document.createElement('span');
        ph.className = 'naowee-dropdown__placeholder';
        ph.dataset.placeholder = '';
        ph.textContent = placeholder;
        trigger.insertBefore(ph, controlsEl);
      } else {
        const wrap = document.createElement('span');
        wrap.className = 'naowee-dropdown__tags';
        wrap.dataset.tagsContainer = '';
        wrap.innerHTML = values.map(v => tagHTML(v)).join('');
        trigger.insertBefore(wrap, controlsEl);
      }
      /* Hidden inputs para FormData.getAll() */
      hiddenContainer.innerHTML = values.map(v => `<input type="hidden" name="${fieldName}" value="${v}"/>`).join('');
      /* Counter en el menu */
      if (countEl) countEl.textContent = `${values.length} seleccionado${values.length === 1 ? '' : 's'}`;
      /* Reposicionar porque la altura del trigger cambia con muchos tags */
      if (dd.classList.contains('is-open')) positionMenu();
    };

    /* Bind option click → toggle */
    menu.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const isSelected = opt.classList.toggle('is-selected');
        opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        renderTags();
      });
    });

    /* Tag remove (delegated en el trigger — los tags se re-renderizan) */
    trigger.addEventListener('click', (e) => {
      const removeArea = e.target.closest('[data-remove]');
      if (!removeArea) return;
      e.stopPropagation();
      e.preventDefault();
      const v = removeArea.dataset.remove;
      const opt = menu.querySelector(`.naowee-dropdown__option[data-value="${CSS.escape(v)}"]`);
      if (opt) {
        opt.classList.remove('is-selected');
        opt.setAttribute('aria-selected', 'false');
      }
      renderTags();
    });

    /* Botón Agregar — solo cierra el menu (toggle ya aplicó las selecciones) */
    applyBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      hideMenu();
    });

    /* Trigger click → abrir/cerrar */
    trigger.addEventListener('click', (e) => {
      /* Si el click es sobre un dismiss area de tag, no abrimos (handler arriba lo procesó) */
      if (e.target.closest('[data-remove]')) return;
      e.stopPropagation();
      const willOpen = !dd.classList.contains('is-open');
      /* Cerrar otros multiselects */
      dropdowns.forEach(({ dd: d }) => { if (d !== dd && d._hideMenu) d._hideMenu(); });
      if (willOpen) {
        positionMenu();
        showMenu();
      } else {
        hideMenu();
      }
    });

    /* Click dentro del menu no cierra */
    menu.addEventListener('click', (e) => e.stopPropagation());

    /* Reposition en scroll/resize */
    const reposition = () => { if (dd.classList.contains('is-open')) positionMenu(); };
    scope.querySelector('.naowee-modal__body')?.addEventListener('scroll', reposition);
    window.addEventListener('resize', reposition);

    /* Sync inicial del counter */
    renderTags();
  });

  /* Click fuera cierra todos los multiselects */
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.naowee-dropdown[data-multi="true"] .naowee-dropdown__trigger')) return;
      if (e.target.closest('.naowee-dropdown__menu--multi')) return;
      dropdowns.forEach(({ dd }) => { if (dd._hideMenu) dd._hideMenu(); });
    });
  }, 100);
}

/* ═══ Step navigation (validaciones desactivadas temporalmente para QA) ═══ */
/* validateStep ahora delega en el canónico DS validateRequired (wizard-page.js):
   - Helpers --negative loud con badge SVG oficial
   - Wiggle + autoscroll + focus
   - Progresivo: 2º click permite avanzar (no entorpecer demo) */
function validateStep(panel) {
  return validateRequired(panel);
}

const checkSVGStepper = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;

function goToStep(n, scope) {
  const total = 3;
  if (n < 1 || n > total) return;
  /* Update stepper — clases oficiales DS naowee-stepper */
  const steps = scope.querySelectorAll('.naowee-stepper__step');
  const connectors = scope.querySelectorAll('.naowee-stepper__connector');
  steps.forEach(step => {
    const s = parseInt(step.dataset.step);
    step.classList.toggle('naowee-stepper__step--active', s === n);
    step.classList.toggle('naowee-stepper__step--done', s < n);
    /* Cuando done: mostrar check SVG; cuando no: mostrar número */
    const num = step.querySelector('.naowee-stepper__number');
    if (s < n) {
      num.innerHTML = checkSVGStepper;
    } else {
      num.innerHTML = String(s);
    }
  });
  connectors.forEach(c => {
    const after = parseInt(c.dataset.after);
    c.classList.toggle('naowee-stepper__connector--done', after < n);
  });
  /* Update panels */
  scope.querySelectorAll('.convo-step-panel').forEach(panel => {
    panel.classList.toggle('is-active', parseInt(panel.dataset.panel) === n);
  });
  /* Update footer buttons */
  scope.querySelector('#convoStepPrev').style.display = n > 1 ? 'inline-flex' : 'none';
  scope.querySelector('#convoStepNext').style.display = n < total ? 'inline-flex' : 'none';
  scope.querySelector('#convoStepPublish').style.display = n === total ? 'inline-flex' : 'none';
  /* Scroll to top of body */
  scope.querySelector('#convoModalBody').scrollTop = 0;
}

/* ═══ Success view (confetti + check) ═══ */
function renderSuccess(scope, nuevaConvocatoria) {
  const body = scope.querySelector('#convoModalBody');
  const footer = scope.querySelector('#convoModalFooter');
  const stepper = scope.querySelector('#convoStepper');
  const header = scope.querySelector('.naowee-modal__header');
  const titleGroup = scope.querySelector('.naowee-modal__title-group');
  const dismissBtn = scope.querySelector('.naowee-modal__dismiss');

  /* Hide stepper + título del modal (success view tiene su propio título; mantener ✕ visible) */
  stepper.style.display = 'none';
  if (titleGroup) titleGroup.style.display = 'none';
  /* Empujar el ✕ a la derecha y limpiar dividers del header/footer en success */
  if (header) {
    header.style.justifyContent = 'flex-end';
    header.style.borderBottom = 'none';
    header.style.boxShadow = 'none';
  }
  if (dismissBtn) dismissBtn.style.marginLeft = 'auto';

  /* Replace body */
  body.innerHTML = `
    <div class="convo-success">
      <div class="convo-confetti" id="convoConfetti"></div>
      <div class="convo-success__check">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2>¡Convocatoria publicada con éxito!</h2>
      <p>Los municipios han sido notificados automáticamente. Las postulaciones aparecerán en tu panel apenas se reciban.</p>
      <div class="convo-success__stamp">ID · ${nuevaConvocatoria.id}</div>
    </div>
  `;

  /* Replace footer with single CTA + sin divider en success */
  footer.className = 'naowee-modal__footer';
  footer.style.borderTop = 'none';
  footer.style.boxShadow = 'none';
  footer.style.justifyContent = 'flex-end';
  footer.innerHTML = `
    <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="convoSuccessGo">
      Ver convocatoria ${arrowRightIcon}
    </button>
  `;

  /* Confetti — pattern de incentivos */
  const colors = ['#FF7500','#d74009','#1f8923','#1f78d1','#ffbf75','#fff'];
  const wrap = scope.querySelector('#convoConfetti');
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

/* ═══ Public API ═══ */
export function openConvocatoriaModal({ onCreated } = {}) {
  modalStyles();
  document.getElementById('convocatoriaOverlay')?.remove();

  const wrap = document.createElement('div');
  wrap.innerHTML = modalMarkup();
  document.body.appendChild(wrap.firstElementChild);

  const overlay = document.getElementById('convocatoriaOverlay');
  void overlay.offsetWidth;
  /* Clase canónica del DS (.is-open) — la versión vieja usaba .open
     pero pages.css solo estiliza .is-open, causaba modal invisible. */
  setTimeout(() => overlay.classList.add('is-open'), 10);

  /* Cerrar */
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    /* Cleanup: quitar popovers/menus que migraron al body */
    document.querySelectorAll('body > .naowee-datepicker--popover').forEach(p => p.remove());
    document.querySelectorAll('body > .naowee-dropdown__menu').forEach(m => m.remove());
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onEsc);
  };
  const onEsc = (e) => { if (e.key === 'Escape') close(); };
  document.getElementById('convocatoriaModalClose').addEventListener('click', close);
  document.getElementById('convoModalCancel')?.addEventListener('click', close);
  setTimeout(() => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }, 50);
  document.addEventListener('keydown', onEsc);

  bindDropdowns(overlay);
  bindMultiSelects(overlay);
  bindDatepickers(overlay);
  bindValidationReset(overlay);

  /* Bind native checkbox inputs: toggle .naowee-checkbox--checked en el label.
     El DS oficial tiene transition + transform scale(.5) al SVG que bloquea el opacity:1
     incluso con !important. Forzamos transition:none + transform:scale(1) inline. */
  const syncCheckbox = (inp) => {
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
  overlay.querySelectorAll('label.naowee-checkbox > input[type="checkbox"]').forEach(inp => {
    inp.addEventListener('change', () => syncCheckbox(inp));
    syncCheckbox(inp);
  });

  /* Lógica condicional cobertura */
  const coberturaDD = overlay.querySelector('.naowee-dropdown[data-name="cobertura"]');
  const coberturaHidden = coberturaDD?.querySelector('input[type="hidden"]');
  const updateCobertura = () => {
    const v = coberturaHidden?.value || 'Nacional';
    const deptosWrap = overlay.querySelector('#deptosWrap');
    const muniWrap = overlay.querySelector('#muniWrap');
    if (deptosWrap) deptosWrap.style.display = (v === 'Departamental' || v === 'Regional') ? 'block' : 'none';
    if (muniWrap) muniWrap.style.display = (v === 'Específica') ? 'block' : 'none';
  };
  updateCobertura();
  coberturaHidden?.addEventListener('change', updateCobertura);

  /* ═══ File uploads — naowee-file-uploader DS oficial ═══ */
  overlay.querySelectorAll('.naowee-file-uploader').forEach(field => bindFileUpload(field));

  /* Step navigation */
  let currentStep = 1;
  const next = () => {
    const panel = overlay.querySelector(`.convo-step-panel[data-panel="${currentStep}"]`);
    if (!validateStep(panel)) return;
    currentStep++;
    goToStep(currentStep, overlay);
  };
  const prev = () => {
    currentStep--;
    goToStep(currentStep, overlay);
  };
  overlay.querySelector('#convoStepNext').addEventListener('click', next);
  overlay.querySelector('#convoStepPrev').addEventListener('click', prev);

  /* Guardar borrador (placeholder — graba en localStorage como estado borrador) */
  overlay.querySelector('#convoSaveDraft').addEventListener('click', () => {
    alert('Borrador guardado localmente (mock). Podrás retomarlo desde la lista de convocatorias.');
  });

  /* Click en step completado → volver al paso */
  overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
    step.addEventListener('click', () => {
      if (!step.classList.contains('naowee-stepper__step--done')) return;
      currentStep = parseInt(step.dataset.step);
      goToStep(currentStep, overlay);
    });
  });

  /* Publish */
  overlay.querySelector('#convoStepPublish').addEventListener('click', () => {
    const panel3 = overlay.querySelector('.convo-step-panel[data-panel="3"]');
    if (!validateStep(panel3)) return;

    const form = document.getElementById('convocatoriaForm');
    const fd = new FormData(form);

    const tiposSolicitud = fd.getAll('tiposSolicitud');
    const fasesProyecto = fd.getAll('fasesProyecto');
    const fuentes = fd.getAll('fuentes');
    const cobertura = fd.get('cobertura') || 'Nacional';
    const departamentos = fd.getAll('departamentos');
    const municipiosTxt = (fd.get('municipios') || '').split(',').map(s => s.trim()).filter(Boolean);

    const id = nextCodigoConvocatoria();
    const nueva = {
      id,
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion'),
      bienio: fd.get('bienio'),
      apertura: fd.get('apertura'),
      cierre: fd.get('cierre'),
      emisionConcepto: fd.get('emisionConcepto') || null,
      cobertura,
      departamentos: (cobertura === 'Departamental' || cobertura === 'Regional') ? departamentos : [],
      municipios: cobertura === 'Específica' ? municipiosTxt : [],
      soloZOMAC: fd.get('soloZOMAC') === 'true',
      soloPDET: fd.get('soloPDET') === 'true',
      tiposSolicitud,
      fasesProyecto,
      fuentes,
      presupuestoTotal: parseInt(fd.get('presupuestoTotal')) || 0,
      montoMaximoProyecto: parseInt(fd.get('montoMaximoProyecto')) || 0,
      permiteSegunda: fd.get('permiteSegunda') === 'true',
      documentos: {
        actoAdmin: fd.get('actoAdmin')?.name ? { name: fd.get('actoAdmin').name, size: fd.get('actoAdmin').size } : null,
        terminosRef: fd.get('terminosRef')?.name ? { name: fd.get('terminosRef').name, size: fd.get('terminosRef').size } : null,
        plantillas: fd.get('plantillas')?.name ? { name: fd.get('plantillas').name, size: fd.get('plantillas').size } : null
      },
      estado: 'abierta',
      creadaPor: 'admin',
      creadaEn: new Date().toISOString(),
      postulaciones: 0
    };

    /* Si el toggle está ON, preparar y disparar notificación a municipios. */
    const notificarAlPublicar = fd.get('notificarAlPublicar') === 'on';
    nueva.notificacion = ProjectData.defaultNotificacion(nueva);

    ProjectData.addConvocatoria(nueva);

    if (notificarAlPublicar) {
      ProjectData.enviarNotificacion(nueva.id);
    }

    ProjectData.pushNotificacion({
      perfil: 'municipio',
      tipo: 'convocatoria',
      titulo: 'Nueva convocatoria abierta',
      detalle: `${nueva.id} · Cierra el ${new Date(nueva.cierre).toLocaleDateString('es-CO')}`
    });

    /* Mostrar éxito con confetti */
    renderSuccess(overlay, nueva);
    /* Wire CTA después del render */
    setTimeout(() => {
      const goBtn = overlay.querySelector('#convoSuccessGo');
      if (goBtn) goBtn.addEventListener('click', () => {
        close();
        if (onCreated) onCreated(nueva);
      });
    }, 100);
  });
}

export { textfield, textarea, dropdown, checkbox, bindDropdowns, fileUpload, bindFileUpload };
