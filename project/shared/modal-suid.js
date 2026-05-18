/* ═══════════════════════════════════════════════════════════════════
   modal-suid.js — Registro SUID del escenario deportivo
   (Resolución 933 Art. 10)

   Arquitectura 2 fases (Doug 17/05/2026, replica escenarios oficial
   https://naowee-tech.github.io/naowee-test-escenarios/escenario-08-dashboard):

     FASE A · Pre-validación
       - 1 pantalla con datos básicos + georreferenciación
       - Botón "Validar y continuar" verifica unicidad catastral
       - Inline success state (check verde + bullets) → Continuar

     FASE B · Datos del escenario (sub-stepper 3 pasos)
       1. Información general — propiedad/administración + horarios
       2. Escenario físico — identificación + dimensiones
       3. Documentación — disciplinas, dotación, programas, fotos

   API: openSuidModal({ proyectoId, onCompleto })
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import {
  textfield, textarea, dropdown, fileUpload,
  bindDropdowns, datepicker, bindDatepickers
} from './modal-convocatoria.js?v=20260517k';
import { multiselect, bindMultiselects, bindFileUploads, runConfetti } from './wizard-page.js?v=20260516b';
import { bindMasksIn, unmask } from './masks.js';
import { toast } from './toast.js';

/* ═══ Catálogos Res. 933 Art. 10 + Censo Mindeporte ═══ */
const DEPARTAMENTOS = [
  'Antioquia', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
  'Santander', 'Sucre', 'Tolima', 'Valle del Cauca'
];
const ZONAS = ['Urbana', 'Rural'];
const TIPO_INFRA = ['Recreativa', 'Alta competencia'];
const TIPO_INFRA_GENERAL = [
  'Coliseo', 'Polideportivo', 'Estadio', 'Cancha múltiple',
  'Piscina', 'Pista atlética', 'Gimnasio', 'Centro de Alto Rendimiento'
];
const TIPOS_ESCENARIO = [
  'Coliseo cubierto', 'Coliseo descubierto', 'Polideportivo',
  'Estadio de fútbol', 'Pista atlética', 'Cancha sintética', 'Cancha múltiple',
  'Cancha de béisbol', 'Patinódromo', 'Piscina olímpica',
  'Piscina semi-olímpica', 'Skatepark', 'Velódromo',
  'Centro de alto rendimiento', 'Gimnasio biosaludable', 'Cancha de tenis', 'Otro'
];
const TIPOS_CUBIERTA = ['Cubierto', 'Descubierto', 'Mixto'];
const TIPOS_PROPIETARIO = ['Pública municipal', 'Pública departamental', 'Pública nacional', 'Privada', 'Mixta', 'Comunitaria'];
const TIPOS_TENENCIA = ['Propia', 'Arrendamiento', 'Comodato', 'Usufructo', 'Convenio interadministrativo'];
const DISCIPLINAS = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Atletismo', 'Natación',
  'Boxeo', 'Lucha', 'Ciclismo', 'Patinaje', 'Tenis', 'Béisbol',
  'Softbol', 'Tenis de mesa', 'Bádminton', 'Pesas', 'Judo', 'Karate',
  'Taekwondo', 'Gimnasia', 'Rugby', 'Hockey'
];
const PROGRAMAS_MINDEPORTE = [
  'Supérate-Intercolegiados', 'Hábitos y Estilos de Vida Saludable',
  'Recreación para Adultos Mayores', 'Centros de Iniciación y Formación',
  'Apoyo al Deportista', 'Atención a Personas con Discapacidad'
];
const DOTACION_GENERAL = [
  'Vestuarios', 'Baterías sanitarias', 'Iluminación nocturna', 'Graderías',
  'Cubierta', 'Sistema de sonido', 'Marcador electrónico', 'Cámaras de seguridad',
  'Parqueadero', 'Boletería', 'Cafetería', 'Enfermería'
];
const ESTADO_CONSERVACION = ['Excelente', 'Bueno', 'Regular', 'Deficiente', 'En construcción'];
const TIPO_ACCESO = ['Público gratuito', 'Público con tarifa', 'Mixto', 'Restringido'];
const ACCESIBILIDAD = ['Rampa accesible', 'Parqueadero accesible', 'Baterías sanitarias adaptadas', 'Señalización Braille', 'Ascensor'];
const HORARIO_PRESETS = ['L-V igual', 'Todos los días', 'L-V + Fin de semana', 'Personalizado'];

/* ═══ Icons ═══ */
const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const checkIconSm = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const mapPinIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const compassIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
const clockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

/* ─── Helpers locales DS-aligned ─── */

/* toggleSwitch — switch tipo iOS para Sí/No. Hidden input "true"/"false". */
function toggleSwitch({ label, name, value = false, helper = '', required = false }) {
  const checked = value === true || value === 'true' || value === 'Sí';
  return `
    <div class="suid-switch-field" data-name="${name}">
      <div class="suid-switch-field__row">
        <span class="suid-switch-field__label ${required ? 'suid-switch-field__label--required' : ''}">${label}</span>
        <label class="suid-switch">
          <input type="checkbox" data-toggle-input ${checked ? 'checked' : ''}/>
          <span class="suid-switch__track"><span class="suid-switch__thumb"></span></span>
        </label>
      </div>
      ${helper ? `<span class="suid-switch-field__helper">${helper}</span>` : ''}
      <input type="hidden" name="${name}" value="${checked ? 'true' : 'false'}"/>
    </div>
  `;
}

function bindSwitches(scope) {
  scope.querySelectorAll('.suid-switch-field').forEach(field => {
    const toggle = field.querySelector('[data-toggle-input]');
    const hidden = field.querySelector('input[type="hidden"]');
    toggle?.addEventListener('change', () => {
      if (hidden) {
        hidden.value = toggle.checked ? 'true' : 'false';
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

/* segmentControl — pattern de segmented horizontal (sin DS nativo). */
function segmentControl({ label, name, options, value, required = false }) {
  return `
    <div class="suid-segment-field" data-name="${name}">
      <span class="suid-segment-field__label ${required ? 'suid-segment-field__label--required' : ''}">${label}</span>
      <div class="suid-segment" role="radiogroup" aria-label="${label}">
        ${options.map(o => `
          <button type="button" class="suid-segment__opt ${o === value ? 'is-selected' : ''}" data-val="${o}" role="radio" aria-checked="${o === value ? 'true' : 'false'}">${o}</button>
        `).join('')}
      </div>
      <input type="hidden" name="${name}" value="${value || ''}" ${required ? 'required' : ''}/>
    </div>
  `;
}

function bindSegments(scope) {
  scope.querySelectorAll('.suid-segment-field').forEach(field => {
    const hidden = field.querySelector('input[type="hidden"]');
    field.querySelectorAll('.suid-segment__opt').forEach(btn => {
      btn.addEventListener('click', () => {
        field.querySelectorAll('.suid-segment__opt').forEach(b => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-checked', 'true');
        if (hidden) {
          hidden.value = btn.dataset.val;
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });
}

/* chipMulti — multi-toggle DS-aligned con check icon */
function chipMulti({ label, name, options, value = [], helper = '' }) {
  const selected = new Set(value);
  return `
    <div class="suid-chip-field" data-name="${name}">
      <span class="suid-chip-field__label">${label}</span>
      <div class="suid-chip-group">
        ${options.map(o => `
          <button type="button" class="suid-chip ${selected.has(o) ? 'is-selected' : ''}" data-val="${o}" aria-pressed="${selected.has(o) ? 'true' : 'false'}">
            <span class="suid-chip__check" aria-hidden="true">${checkIconSm}</span>
            <span class="suid-chip__label">${o}</span>
          </button>
        `).join('')}
      </div>
      <input type="hidden" name="${name}" value="${[...selected].join(',')}"/>
      ${helper ? `<span class="suid-chip-field__helper">${helper}</span>` : ''}
    </div>
  `;
}

function bindChips(scope) {
  scope.querySelectorAll('.suid-chip-field').forEach(field => {
    const hidden = field.querySelector('input[type="hidden"]');
    field.querySelectorAll('.suid-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-selected');
        const pressed = chip.classList.contains('is-selected');
        chip.setAttribute('aria-pressed', String(pressed));
        const selected = Array.from(field.querySelectorAll('.suid-chip.is-selected')).map(c => c.dataset.val);
        if (hidden) {
          hidden.value = selected.join(',');
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });
}

/* daySelector — chips L M M J V S D (multi-select por horario) */
function daySelector({ name, value = [] }) {
  const days = [
    { code: 'L', label: 'Lunes' },
    { code: 'M', label: 'Martes' },
    { code: 'X', label: 'Miércoles' },
    { code: 'J', label: 'Jueves' },
    { code: 'V', label: 'Viernes' },
    { code: 'S', label: 'Sábado' },
    { code: 'D', label: 'Domingo' }
  ];
  const selected = new Set(value);
  return `
    <div class="suid-day-selector" data-name="${name}">
      ${days.map(d => `
        <button type="button" class="suid-day ${selected.has(d.code) ? 'is-selected' : ''}" data-day="${d.code}" aria-label="${d.label}">${d.code === 'X' ? 'M' : d.code}</button>
      `).join('')}
      <input type="hidden" name="${name}" value="${[...selected].join(',')}"/>
    </div>
  `;
}

function bindDaySelectors(scope) {
  scope.querySelectorAll('.suid-day-selector').forEach(field => {
    const hidden = field.querySelector('input[type="hidden"]');
    field.querySelectorAll('.suid-day').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('is-selected');
        const selected = Array.from(field.querySelectorAll('.suid-day.is-selected')).map(c => c.dataset.day);
        if (hidden) {
          hidden.value = selected.join(',');
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });
}

/* mapPlaceholder — caja con grid sutil + pin + 2 CTAs cream */
function mapPlaceholder() {
  return `
    <div class="suid-map" data-suid-map>
      <div class="suid-map__grid" aria-hidden="true"></div>
      <div class="suid-map__pin" aria-hidden="true">${mapPinIcon}</div>
      <div class="suid-map__attribution" aria-hidden="true">Vista de mapa · OpenStreetMap</div>
    </div>
    <div class="suid-map-ctas">
      <button type="button" class="suid-map-cta" data-marcar-actual>
        ${compassIcon}
        Marcar mi ubicación actual
      </button>
      <button type="button" class="suid-map-cta" data-ubicarme>
        ${mapPinIcon}
        Ubicarme en el mapa
      </button>
    </div>
  `;
}

/* timeField — input type=time wrapped DS */
function timeField({ label, name, value = '', required = false }) {
  return `
    <div class="naowee-textfield">
      <label class="naowee-textfield__label ${required ? 'naowee-textfield__label--required' : ''}">${label}</label>
      <div class="naowee-textfield__input-wrap">
        <input class="naowee-textfield__input" type="time" name="${name}" value="${value}" ${required ? 'required' : ''}/>
      </div>
    </div>
  `;
}

/* ═══ Inyección CSS one-time ═══ */
function injectSuidStyles() {
  if (document.getElementById('suidModalStyle')) return;
  const style = document.createElement('style');
  style.id = 'suidModalStyle';
  style.textContent = `
    /* Modal width */
    #suidOverlay .naowee-modal {
      width: 920px !important;
      max-width: 95vw !important;
      max-height: 92vh;
    }
    #suidOverlay .naowee-modal--narrow {
      width: 580px !important;
    }

    /* Spacing */
    #suidOverlay .ai-step-panel > * + * { margin-top: 18px; }
    #suidOverlay .ai-step-panel { padding-top: 4px; }
    #suidOverlay .suid-section-block + .suid-section-block { margin-top: 26px; }

    #suidOverlay .ai-section-title {
      font-size: 11px; font-weight: 700;
      letter-spacing: .5px; text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    #suidOverlay .ai-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    #suidOverlay .ai-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    #suidOverlay .ai-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 720px) {
      #suidOverlay .ai-grid-2,
      #suidOverlay .ai-grid-3,
      #suidOverlay .ai-grid-4 { grid-template-columns: 1fr; }
    }

    /* Sub-stepper de 3 pasos (Modal 2) */
    .suid-substepper {
      display: flex; align-items: center;
      gap: 8px;
      padding: 14px 0 20px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--border, #e7e9f3);
    }
    .suid-substepper__step {
      display: inline-flex; align-items: center; gap: 8px;
      cursor: pointer;
    }
    .suid-substepper__num {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--bg, #f5f6fa);
      color: var(--text-secondary, #646587);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12.5px; font-weight: 700;
      transition: background .15s, color .15s;
    }
    .suid-substepper__step.is-active .suid-substepper__num {
      background: var(--accent, #d74009);
      color: #fff;
    }
    .suid-substepper__step.is-done .suid-substepper__num {
      background: var(--green, #15803d);
      color: #fff;
    }
    .suid-substepper__label {
      font-size: 13px; font-weight: 600;
      color: var(--text-secondary, #646587);
    }
    .suid-substepper__step.is-active .suid-substepper__label,
    .suid-substepper__step.is-done .suid-substepper__label {
      color: var(--text-primary, #282834);
    }
    .suid-substepper__connector {
      flex: 1; height: 2px;
      background: var(--border, #e7e9f3);
      max-width: 120px;
      transition: background .2s;
    }
    .suid-substepper__connector.is-done {
      background: var(--green, #15803d);
    }

    /* ─── Toggle switch (DS-aligned) ─── */
    .suid-switch-field { display: flex; flex-direction: column; gap: 4px; }
    .suid-switch-field__row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
    }
    .suid-switch-field__label {
      font-size: 13px; font-weight: 500;
      color: var(--text-primary, #282834);
    }
    .suid-switch-field__label--required::after {
      content: ' *'; color: var(--accent, #d74009); font-weight: 700;
    }
    .suid-switch-field__helper {
      font-size: 11.5px;
      color: var(--text-secondary, #646587);
    }
    .suid-switch {
      position: relative;
      display: inline-block;
      width: 42px; height: 24px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .suid-switch input { display: none; }
    .suid-switch__track {
      display: block;
      width: 100%; height: 100%;
      background: var(--border-dark, #d0d4e6);
      border-radius: 999px;
      transition: background .18s;
      position: relative;
    }
    .suid-switch__thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 20px; height: 20px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,.18);
      transition: transform .18s cubic-bezier(.4,0,.2,1);
    }
    .suid-switch input:checked + .suid-switch__track {
      background: var(--accent, #d74009);
    }
    .suid-switch input:checked + .suid-switch__track .suid-switch__thumb {
      transform: translateX(18px);
    }

    /* ─── SegmentField ─── */
    .suid-segment-field { display: flex; flex-direction: column; gap: 6px; }
    .suid-segment-field__label {
      font-size: 12.5px; font-weight: 500;
      color: var(--text-secondary, #646587);
    }
    .suid-segment-field__label--required::after {
      content: ' *'; color: var(--accent, #d74009); font-weight: 700;
    }
    .suid-segment {
      display: inline-flex; align-items: stretch;
      border: 1px solid var(--border-dark, #d0d4e6);
      border-radius: var(--radius-md, 8px);
      background: var(--surface, #fff);
      padding: 3px;
      gap: 3px;
      width: 100%;
    }
    .suid-segment__opt {
      flex: 1;
      padding: 8px 14px;
      background: transparent;
      border: 0;
      font-family: inherit;
      font-size: 13px; font-weight: 600;
      color: var(--text-secondary, #646587);
      cursor: pointer;
      border-radius: 6px;
      transition: background .12s, color .12s;
    }
    .suid-segment__opt:hover:not(.is-selected) {
      background: var(--bg, #f5f6fa);
      color: var(--text-primary, #282834);
    }
    .suid-segment__opt.is-selected {
      background: var(--orange-bg, #fff3e6);
      color: var(--accent, #d74009);
      border: 1px solid var(--accent, #d74009);
      padding: 7px 13px;
    }

    /* ─── ChipMulti ─── */
    .suid-chip-field { display: flex; flex-direction: column; gap: 8px; }
    .suid-chip-field__label {
      font-size: 12.5px; font-weight: 500;
      color: var(--text-secondary, #646587);
    }
    .suid-chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
    .suid-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px;
      background: var(--surface, #fff);
      border: 1px solid var(--border-dark, #d0d4e6);
      color: var(--text-primary, #282834);
      border-radius: var(--radius-full, 9999px);
      font-family: inherit;
      font-size: 12.5px; font-weight: 500;
      cursor: pointer;
      transition: background .12s, border-color .12s, color .12s, transform .12s;
    }
    .suid-chip:hover { background: #fafbfd; }
    .suid-chip.is-selected {
      background: var(--orange-bg, #fff3e6);
      border-color: var(--accent, #d74009);
      color: var(--accent, #d74009);
      font-weight: 700;
    }
    .suid-chip:active { transform: scale(.97); }
    .suid-chip__check {
      display: none; width: 13px; height: 13px;
      color: var(--accent, #d74009);
    }
    .suid-chip.is-selected .suid-chip__check { display: inline-flex; }
    .suid-chip__check svg { width: 13px; height: 13px; }
    .suid-chip-field__helper {
      font-size: 11px; color: var(--text-secondary, #646587);
    }

    /* ─── Day selector L M M J V S D ─── */
    .suid-day-selector {
      display: inline-flex; gap: 6px; flex-wrap: wrap;
    }
    .suid-day {
      width: 40px; height: 40px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-dark, #d0d4e6);
      background: var(--surface, #fff);
      color: var(--text-primary, #282834);
      font-family: inherit; font-size: 13px; font-weight: 700;
      cursor: pointer;
      transition: background .12s, border-color .12s, color .12s;
    }
    .suid-day:hover { background: #fafbfd; }
    .suid-day.is-selected {
      background: var(--orange-bg, #fff3e6);
      border-color: var(--accent, #d74009);
      color: var(--accent, #d74009);
    }

    /* ─── Map placeholder ─── */
    .suid-map {
      position: relative;
      width: 100%;
      height: 220px;
      background: linear-gradient(180deg, #e8eef3 0%, #d8e0e8 100%);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border, #e7e9f3);
      overflow: hidden;
    }
    .suid-map__grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px);
      background-size: 30px 30px;
    }
    .suid-map__pin {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -100%);
      color: var(--accent, #d74009);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,.2));
    }
    .suid-map__pin svg { width: 36px; height: 36px; }
    .suid-map__attribution {
      position: absolute;
      bottom: 6px; right: 8px;
      font-size: 10px;
      color: var(--text-secondary, #646587);
      background: rgba(255,255,255,.7);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .suid-map-ctas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 10px;
    }
    .suid-map-cta {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 14px;
      background: var(--orange-bg, #fff3e6);
      border: 1px solid var(--orange-border, #ffbf75);
      color: var(--accent, #d74009);
      border-radius: var(--radius-md, 8px);
      font-family: inherit; font-size: 12.5px; font-weight: 600;
      cursor: pointer;
      transition: background .12s, transform .12s;
    }
    .suid-map-cta:hover { background: #ffe8d3; }
    .suid-map-cta:active { transform: translateY(1px); }
    .suid-map-cta svg { width: 16px; height: 16px; }
    @media (max-width: 600px) {
      .suid-map-ctas { grid-template-columns: 1fr; }
    }

    /* ─── Horario card ─── */
    .suid-horario-card {
      padding: 16px;
      background: var(--bg, #f5f6fa);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border, #e7e9f3);
      margin-top: 12px;
    }
    .suid-horario-card__title {
      font-size: 11px; font-weight: 700;
      letter-spacing: .5px; text-transform: uppercase;
      color: var(--text-secondary, #646587);
      margin-bottom: 12px;
    }
    .suid-horario-card__row { display: flex; flex-direction: column; gap: 14px; }
    .suid-horario-card__row > * + * { margin-top: 0; }

    /* ─── Success state inline (Modal 1 → Modal 2) ─── */
    .suid-success {
      text-align: center;
      padding: 36px 24px;
      animation: aiStepFade .35s cubic-bezier(.32,.72,0,1) both;
    }
    .suid-success__check {
      width: 64px; height: 64px;
      margin: 0 auto 22px;
      background: var(--green, #15803d);
      color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .suid-success__check svg { width: 32px; height: 32px; }
    .suid-success__title {
      font-size: 18px; font-weight: 800;
      color: var(--text-primary, #282834);
      margin: 0 0 8px;
    }
    .suid-success__msg {
      font-size: 13.5px;
      color: var(--text-secondary, #646587);
      line-height: 1.55;
      max-width: 460px;
      margin: 0 auto 24px;
    }
    .suid-success__bullets {
      max-width: 460px;
      margin: 0 auto;
      display: flex; flex-direction: column; gap: 10px;
      text-align: left;
    }
    .suid-success__bullet {
      display: flex; gap: 10px; align-items: flex-start;
      font-size: 12.5px; color: var(--text-primary);
      line-height: 1.5;
    }
    .suid-success__bullet-check {
      width: 18px; height: 18px;
      background: var(--green, #15803d);
      color: #fff;
      border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .suid-success__bullet-check svg { width: 10px; height: 10px; }

    /* ─── Photo grid ─── */
    .suid-photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    @media (max-width: 720px) {
      .suid-photo-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .suid-photo-slot {
      position: relative;
      aspect-ratio: 4/3;
      background: var(--bg, #f5f6fa);
      border: 1.5px dashed var(--border-dark, #d0d4e6);
      border-radius: var(--radius-md, 8px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: border-color .15s, background .12s;
    }
    .suid-photo-slot:hover {
      border-color: var(--accent, #d74009);
      background: #fff8f4;
    }
    .suid-photo-slot.is-filled {
      border-style: solid;
      border-color: var(--green-border, #b7dfb9);
      background: var(--green-bg, #e6f4e7);
    }
    .suid-photo-slot__icon { color: var(--text-secondary, #646587); }
    .suid-photo-slot__icon svg { width: 22px; height: 22px; }
    .suid-photo-slot.is-filled .suid-photo-slot__icon { display: none; }
    .suid-photo-slot__check { display: none; color: var(--green, #1f8923); }
    .suid-photo-slot__check svg { width: 24px; height: 24px; }
    .suid-photo-slot.is-filled .suid-photo-slot__check { display: inline-flex; }
    .suid-photo-slot__label {
      font-size: 11.5px; font-weight: 600;
      color: var(--text-secondary, #646587);
    }
    .suid-photo-slot.is-filled .suid-photo-slot__label { color: var(--green, #1f8923); }

    /* SUID code chip en header */
    .suid-modal-code {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 12px; font-weight: 700;
      color: var(--accent, #d74009);
      letter-spacing: .3px;
    }
    .suid-id-bar {
      font-size: 12px;
      color: var(--blue-info, #1f78d1);
      font-weight: 600;
    }
    .suid-id-bar strong {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      color: var(--blue-info, #1f78d1);
      font-weight: 800;
      letter-spacing: .3px;
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════════════════════════ */
export function openSuidModal({ proyectoId, onCompleto } = {}) {
  const p = ProjectData.getProyecto(proyectoId);
  if (!p) {
    alert('Proyecto no encontrado.');
    return;
  }
  injectSuidStyles();
  const reg = p.registroSuid || {};

  /* Si la pre-validación ya fue completada y el registro está en
     borrador o completo, saltar a Fase B. Si no, arrancar Fase A. */
  if (reg.prevalidacionEn) {
    openEscenarioModal({ p, onCompleto });
  } else {
    openPrevalidacionModal({ p, onCompleto });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FASE A · Pre-validación (1 pantalla)
   ═══════════════════════════════════════════════════════════════════ */
function openPrevalidacionModal({ p, onCompleto }) {
  const suidCode = p.inversion?.suidEscenario
    || p.registroSuid?.codigo
    || `SUID-${(p.departamento || 'COL').slice(0, 3).toUpperCase()}-${(p.idUnico || '').replace(/[^0-9]/g, '').slice(0, 6)}`;
  const reg = p.registroSuid || {};

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.id = 'suidOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Datos de pre-validación</h2>
          <p class="naowee-modal__subtitle">Completa la información requerida para verificar la unicidad de la sede o escenario · <span class="suid-modal-code">${suidCode}</span></p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      <div class="naowee-modal__body">
        <form id="suidFormA" novalidate>

          <!-- DATOS BÁSICOS -->
          <div class="suid-section-block">
            <div class="ai-section-title">Datos básicos</div>

            ${textfield({ label: 'Nombre del escenario', name: 'nombreEscenario', required: true, placeholder: 'Centro deportivo …', value: reg.nombreEscenario || p.nombre || '' })}

            <div class="ai-grid-2">
              ${dropdown({ label: 'Departamento', name: 'departamento', required: true, options: DEPARTAMENTOS, value: reg.departamento || p.departamento || '' })}
              ${textfield({ label: 'Municipio', name: 'municipio', required: true, placeholder: 'Selecciona municipio', value: reg.municipio || p.municipio || '' })}
            </div>

            <div class="ai-grid-2">
              ${textfield({ label: 'Número de registro catastral', name: 'catastral', required: true, placeholder: '760010100000-001-000-0001', value: reg.catastral || '', helper: 'Código catastral oficial · 19-22 dígitos' })}
              ${dropdown({ label: 'Zona', name: 'zona', required: true, options: ZONAS, value: reg.zona || '' })}
            </div>
          </div>

          <!-- GEORREFERENCIACIÓN -->
          <div class="suid-section-block">
            <div class="ai-section-title">Georreferenciación</div>

            ${mapPlaceholder()}

            <div class="ai-grid-2">
              ${textfield({ label: 'Latitud (decimal)', name: 'lat', required: true, placeholder: '4.7110', value: reg.lat || p.coordenadas?.lat || '', helper: 'Rango Colombia: −4.23 a 12.53' })}
              ${textfield({ label: 'Longitud (decimal)', name: 'lng', required: true, placeholder: '-74.0721', value: reg.lng || p.coordenadas?.lng || '', helper: 'Rango Colombia: −81.73 a −66.87' })}
            </div>

            <div class="ai-grid-2">
              ${textfield({ label: 'Dirección del escenario', name: 'direccion', required: true, placeholder: 'Cra 30 # 45-12', value: reg.direccion || p.direccionPredio || '' })}
              ${textfield({ label: 'Corregimiento / Vereda / Barrio', name: 'barrio', placeholder: 'Opcional', value: reg.barrio || '' })}
            </div>

            <div class="naowee-message naowee-message--informative" role="status" style="margin-top:8px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                <span class="naowee-message__title">¿Cómo obtener coordenadas desde Google Maps?</span>
              </div>
              <div class="naowee-message__content">
                <p class="naowee-message__text">Para registro manual abre <a href="https://www.google.com/maps" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">Google Maps</a>. Ubica el marcador, click derecho sobre el icono y selecciona la primera opción para copiar las coordenadas.</p>
              </div>
            </div>
          </div>

        </form>
      </div>

      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute" data-close style="margin-right:auto">Cancelar</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-validar>
          ${checkIconSm} Validar y continuar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#suidFormA');
  bindDropdowns(form);
  bindMasksIn(form);

  /* CTAs del mapa */
  overlay.querySelector('[data-marcar-actual]')?.addEventListener('click', () => {
    toast({ variant: 'informative', title: 'Geolocalización', message: 'Demo: usa coordenadas del proyecto si están disponibles.' });
    const latI = form.querySelector('input[name="lat"]');
    const lngI = form.querySelector('input[name="lng"]');
    if (latI && !latI.value) latI.value = p.coordenadas?.lat || '4.7110';
    if (lngI && !lngI.value) lngI.value = p.coordenadas?.lng || '-74.0721';
  });
  overlay.querySelector('[data-ubicarme]')?.addEventListener('click', () => {
    toast({ variant: 'informative', title: 'Ubicarme en el mapa', message: 'Demo: en producción se abre un picker interactivo.' });
  });

  /* Validar + transición a success → escenario */
  overlay.querySelector('[data-validar]').addEventListener('click', () => {
    const fd = new FormData(form);
    const datos = {
      nombreEscenario: fd.get('nombreEscenario') || '',
      departamento: fd.get('departamento') || '',
      municipio: fd.get('municipio') || '',
      catastral: fd.get('catastral') || '',
      zona: fd.get('zona') || '',
      lat: parseFloat(fd.get('lat')) || null,
      lng: parseFloat(fd.get('lng')) || null,
      direccion: fd.get('direccion') || '',
      barrio: fd.get('barrio') || ''
    };

    /* Validaciones críticas */
    if (!datos.nombreEscenario || !datos.departamento || !datos.municipio || !datos.catastral || !datos.zona) {
      toast({ variant: 'negative', title: 'Datos básicos incompletos', message: 'Completa nombre, departamento, municipio, catastral y zona.' });
      return;
    }
    if (!datos.lat || !datos.lng || !datos.direccion) {
      toast({ variant: 'negative', title: 'Georreferenciación incompleta', message: 'Completa coordenadas y dirección del escenario.' });
      return;
    }
    const latOk = datos.lat >= -4.23 && datos.lat <= 12.53;
    const lngOk = datos.lng >= -81.73 && datos.lng <= -66.87;
    if (!latOk || !lngOk) {
      toast({ variant: 'negative', title: 'Coordenadas fuera de rango', message: 'Lat: −4.23 a 12.53 · Lng: −81.73 a −66.87 (Colombia).' });
      return;
    }

    /* Persistir pre-validación + timestamp */
    ProjectData.setProyecto(p.idUnico, x => {
      x.registroSuid = {
        ...(x.registroSuid || {}),
        ...datos,
        codigo: suidCode,
        prevalidacionEn: new Date().toISOString(),
        estado: x.registroSuid?.estado || 'borrador'
      };
      return x;
    });

    /* Swap content → success state inline */
    renderSuccessTransicion();
  });

  function renderSuccessTransicion() {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    body.innerHTML = `
      <div class="suid-success">
        <div class="suid-success__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="suid-success__title">Validación exitosa</h2>
        <p class="suid-success__msg">Los datos registrados fueron validados exitosamente y no se detectó duplicidad de datos.</p>
        <div class="suid-success__bullets">
          <div class="suid-success__bullet">
            <span class="suid-success__bullet-check">${checkIconSm}</span>
            <span>Puede continuar con el registro del formulario o guardarlo como borrador para completarlo en otro momento.</span>
          </div>
          <div class="suid-success__bullet">
            <span class="suid-success__bullet-check">${checkIconSm}</span>
            <span>Los datos básicos no se deben modificar. Si lo hace y ya completó el registro, sus datos serán eliminados.</span>
          </div>
        </div>
      </div>
    `;
    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--link" data-close-draft style="margin-right:auto">Guardar borrador</button>
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-continuar-registro>
        Continuar registro ${arrowRightIcon}
      </button>
    `;
    footer.querySelector('[data-close-draft]').addEventListener('click', () => {
      toast({ variant: 'informative', title: 'Borrador guardado', message: 'Puedes retomar el registro SUID en cualquier momento.' });
      close();
    });
    footer.querySelector('[data-continuar-registro]').addEventListener('click', () => {
      close();
      setTimeout(() => openEscenarioModal({ p: ProjectData.getProyecto(p.idUnico), onCompleto }), 250);
    });
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
}

/* ═══════════════════════════════════════════════════════════════════
   FASE B · Datos del escenario (sub-stepper 3 pasos)
   ═══════════════════════════════════════════════════════════════════ */
function openEscenarioModal({ p, onCompleto }) {
  const suidCode = p.registroSuid?.codigo || `SUID-${(p.departamento || 'COL').slice(0, 3).toUpperCase()}-${(p.idUnico || '').replace(/[^0-9]/g, '').slice(0, 6)}`;
  const reg = p.registroSuid || {};

  const SUBSTEPS = [
    { id: 1, label: 'Información general' },
    { id: 2, label: 'Escenario físico' },
    { id: 3, label: 'Documentación' }
  ];

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.id = 'suidOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Datos del escenario deportivo</h2>
          <p class="naowee-modal__subtitle">Completa la información requerida para registrar el escenario · <span class="suid-id-bar">ID único: <strong>${suidCode}</strong></span></p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      <div class="naowee-modal__body">

        <!-- Sub-stepper de 3 pasos -->
        <div class="suid-substepper" data-substepper>
          ${SUBSTEPS.map((s, i) => `
            <div class="suid-substepper__step ${s.id === 1 ? 'is-active' : ''}" data-substep="${s.id}">
              <span class="suid-substepper__num">${s.id}</span>
              <span class="suid-substepper__label">${s.label}</span>
            </div>
            ${i < SUBSTEPS.length - 1 ? `<span class="suid-substepper__connector" data-after="${s.id}"></span>` : ''}
          `).join('')}
        </div>

        <form id="suidFormB" novalidate>

          <!-- ═══ PASO 1 · Información general ═══ -->
          <div class="ai-step-panel" data-panel="1">

            <div class="suid-section-block">
              <div class="ai-section-title">Datos de propiedad</div>
              <div class="ai-grid-2">
                ${textfield({ label: 'Nombre de la entidad propietaria', name: 'entidadPropietaria', required: true, placeholder: 'Escriba el nombre', value: reg.entidadPropietaria || '' })}
                ${dropdown({ label: 'Tipo de propietario', name: 'tipoPropietario', required: true, options: TIPOS_PROPIETARIO, value: reg.tipoPropietario || '' })}
              </div>
              <div class="ai-grid-2">
                ${textfield({ label: 'Entidad administradora', name: 'entidadAdministradora', placeholder: 'Escriba el nombre', value: reg.entidadAdministradora || '' })}
                ${dropdown({ label: 'Tipo de tenencia', name: 'tipoTenencia', required: true, options: TIPOS_TENENCIA, value: reg.tipoTenencia || '' })}
              </div>
              ${textfield({ label: 'Nombre del responsable del escenario', name: 'responsable', required: true, placeholder: 'Escriba el nombre del responsable', value: reg.responsable || p.representante?.nombre || '' })}
              <div class="ai-grid-2">
                ${textfield({ label: 'Teléfono del responsable', name: 'telefonoResponsable', required: true, placeholder: '311 234 5678', value: reg.telefonoResponsable || p.representante?.contacto || '' })}
                ${textfield({ label: 'Correo del responsable', name: 'emailResponsable', placeholder: 'correo@municipio.gov.co', value: reg.emailResponsable || '' })}
              </div>
              ${toggleSwitch({ label: '¿Es un proyecto de inversión?', name: 'esInversion', value: reg.esInversion === true || reg.esInversion === 'true' || !!p.inversion, helper: 'Marca si el escenario es financiado por la convocatoria del Ministerio' })}
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Datos administrativos</div>
              ${segmentControl({ label: 'Días y horarios de atención', name: 'horarioPreset', options: HORARIO_PRESETS, value: reg.horarioPreset || 'L-V igual', required: true })}

              <div class="suid-horario-card">
                <div class="suid-horario-card__title">Horario 1</div>
                <div class="suid-horario-card__row">
                  ${daySelector({ name: 'horarioDias', value: (reg.horarioDias || 'L,M,X,J,V').split(',').filter(Boolean) })}
                  ${toggleSwitch({ label: 'Abierto 24 horas', name: 'horario24h', value: reg.horario24h === true || reg.horario24h === 'true' })}
                  <div class="ai-grid-2">
                    ${timeField({ label: 'Apertura', name: 'horarioApertura', required: true, value: reg.horarioApertura || '06:00' })}
                    ${timeField({ label: 'Cierre', name: 'horarioCierre', required: true, value: reg.horarioCierre || '22:00' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ PASO 2 · Escenario físico ═══ -->
          <div class="ai-step-panel" data-panel="2" hidden>

            <div class="suid-section-block">
              <div class="ai-section-title">Identificación</div>
              ${toggleSwitch({ label: '¿La sede es un Centro de Alto Rendimiento (CAR)?', name: 'esCar', value: reg.esCar === 'Sí' || reg.esCar === true, required: true })}
              ${segmentControl({ label: 'Tipo de infraestructura', name: 'tipoInfra', options: TIPO_INFRA, value: reg.tipoInfra || 'Recreativa', required: true })}
              <div class="ai-grid-2">
                ${dropdown({ label: 'Tipo de infraestructura general', name: 'tipoInfraGeneral', required: true, options: TIPO_INFRA_GENERAL, value: reg.tipoInfraGeneral || '' })}
                ${dropdown({ label: 'Tipo de escenario', name: 'tipoEscenario', required: true, options: TIPOS_ESCENARIO, value: reg.tipoEscenario || '' })}
              </div>
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Características físicas</div>
              <div class="ai-grid-2">
                ${textfield({ label: 'Área total construida (m²)', name: 'areaConstruida', required: true, placeholder: '1.850', mask: 'money', value: reg.areaConstruida ? String(reg.areaConstruida) : '' })}
                ${textfield({ label: 'Área útil deportiva (m²)', name: 'areaPredio', required: true, placeholder: '2.400', mask: 'money', value: reg.areaPredio ? String(reg.areaPredio) : '' })}
              </div>
              <div class="ai-grid-2">
                ${dropdown({ label: 'Cubierta', name: 'cubierta', required: true, options: TIPOS_CUBIERTA, value: reg.cubierta || '' })}
                ${textfield({ label: 'Capacidad de espectadores', name: 'aforo', required: true, placeholder: '5.000', mask: 'money', value: reg.aforo ? String(reg.aforo) : '' })}
              </div>
              <div class="ai-grid-2">
                ${textfield({ label: 'Año de construcción', name: 'anioConstruccion', required: true, placeholder: '2015', value: reg.anioConstruccion || '' })}
                ${textfield({ label: 'Año de última remodelación', name: 'anioRemodelacion', placeholder: '2022', value: reg.anioRemodelacion || '' })}
              </div>
              <div class="ai-grid-2">
                ${dropdown({ label: 'Estado de conservación', name: 'estadoConservacion', required: true, options: ESTADO_CONSERVACION, value: reg.estadoConservacion || '' })}
                ${textfield({ label: 'Sub-espacios / canchas', name: 'cantidadSubespacios', placeholder: '1', value: reg.cantidadSubespacios || '1' })}
              </div>
            </div>
          </div>

          <!-- ═══ PASO 3 · Documentación ═══ -->
          <div class="ai-step-panel" data-panel="3" hidden>

            <div class="suid-section-block">
              <div class="ai-section-title">Disciplinas deportivas</div>
              ${chipMulti({
                label: 'Selecciona todas las disciplinas que se practican en el escenario',
                name: 'disciplinas',
                options: DISCIPLINAS,
                value: reg.disciplinas || [],
                helper: `${DISCIPLINAS.length} disciplinas disponibles · mínimo 1`
              })}
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Dotación y servicios generales</div>
              ${chipMulti({
                label: 'Dotación general del escenario',
                name: 'dotacion',
                options: DOTACION_GENERAL,
                value: reg.dotacion || []
              })}
              <div class="ai-grid-2">
                ${dropdown({ label: 'Tipo de acceso', name: 'tipoAcceso', required: true, options: TIPO_ACCESO, value: reg.tipoAcceso || '' })}
                ${chipMulti({
                  label: 'Condiciones de accesibilidad',
                  name: 'accesibilidad',
                  options: ACCESIBILIDAD,
                  value: reg.accesibilidad || []
                })}
              </div>
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Programas y uso</div>
              ${textarea({ label: 'Descripción del escenario', name: 'descripcion', placeholder: 'Contexto, particularidades técnicas, programas que aloja...', rows: 3, value: reg.descripcion || '' })}
              ${multiselect({ name: 'programasMindeporte', label: 'Programas del Ministerio que se ejecutan', options: PROGRAMAS_MINDEPORTE, placeholder: 'Selecciona uno o más programas', helper: '6 programas disponibles' })}
              <div class="ai-grid-2">
                ${textfield({ label: 'Población mensual atendida', name: 'poblacionMensual', placeholder: '1.500', mask: 'money', value: reg.poblacionMensual ? String(reg.poblacionMensual) : '' })}
                ${textfield({ label: 'Otros usos (no deportivos)', name: 'otrosUsos', placeholder: 'Conciertos, eventos comunitarios...', value: reg.otrosUsos || '' })}
              </div>
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Fotografías generales del escenario</div>
              ${datepicker({ label: 'Fecha de captura de fotografías', name: 'fechaCaptura', required: true, helper: 'Mínimo 6 meses antes de hoy · refleja el estado actual' })}
              <div class="suid-photo-grid">
                ${['Fachada', 'Interior', 'Cancha/Pista', 'Vestuarios', 'Acceso', 'Dotación'].map((lbl, i) => `
                  <div class="suid-photo-slot ${(reg.fotos || [])[i] ? 'is-filled' : ''}" data-photo="${i}" role="button" tabindex="0" aria-label="Subir foto: ${lbl}">
                    <span class="suid-photo-slot__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </span>
                    <span class="suid-photo-slot__check" aria-hidden="true">${checkIconSm}</span>
                    <span class="suid-photo-slot__label">${lbl}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="suid-section-block">
              <div class="ai-section-title">Documentos administrativos</div>
              ${fileUpload({ name: 'soportes', label: 'Soportes administrativos (opcional)', accept: '.pdf,.zip', maxSize: 50, helper: 'PDF o ZIP · máx 50 MB · puedes apilar varios' })}
            </div>
          </div>

        </form>
      </div>

      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="suidBtnPrev" style="display:none;margin-right:auto">${arrowLeftIcon} Volver</button>
        <button type="button" class="naowee-btn naowee-btn--link" id="suidBtnDraft" style="margin-right:12px">Guardar borrador</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="suidBtnNext">Guardar y continuar ${arrowRightIcon}</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="suidBtnFinalizar" style="display:none;background:#15803d !important;border-color:#15803d !important">${checkIconSm} Inventariar escenario</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#suidFormB');
  bindDropdowns(form);
  bindDatepickers(form);
  bindMultiselects(form);
  bindFileUploads(form);
  bindSegments(form);
  bindChips(form);
  bindSwitches(form);
  bindDaySelectors(form);
  bindMasksIn(form);

  /* Photo slots toggle (mock) */
  overlay.querySelectorAll('.suid-photo-slot').forEach(slot => {
    const t = () => slot.classList.toggle('is-filled');
    slot.addEventListener('click', t);
    slot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
  });

  /* ─── Navegación ─── */
  let currentStep = 1;
  const btnPrev = overlay.querySelector('#suidBtnPrev');
  const btnNext = overlay.querySelector('#suidBtnNext');
  const btnFinalizar = overlay.querySelector('#suidBtnFinalizar');

  function goToSubstep(n) {
    currentStep = Math.max(1, Math.min(SUBSTEPS.length, n));
    overlay.querySelectorAll('.ai-step-panel').forEach(panel => {
      panel.hidden = parseInt(panel.dataset.panel) !== currentStep;
    });
    /* Actualizar sub-stepper visual */
    overlay.querySelectorAll('.suid-substepper__step').forEach(step => {
      const s = parseInt(step.dataset.substep);
      step.classList.toggle('is-active', s === currentStep);
      step.classList.toggle('is-done', s < currentStep);
      const numEl = step.querySelector('.suid-substepper__num');
      if (numEl) numEl.innerHTML = (s < currentStep) ? stepperCheckIcon : String(s);
    });
    overlay.querySelectorAll('.suid-substepper__connector').forEach(c => {
      const after = parseInt(c.dataset.after);
      c.classList.toggle('is-done', after < currentStep);
    });
    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    btnNext.style.display = currentStep < SUBSTEPS.length ? 'inline-flex' : 'none';
    btnFinalizar.style.display = currentStep === SUBSTEPS.length ? 'inline-flex' : 'none';
    overlay.querySelector('.naowee-modal__body').scrollTop = 0;
  }

  btnNext.addEventListener('click', () => goToSubstep(currentStep + 1));
  btnPrev.addEventListener('click', () => goToSubstep(currentStep - 1));
  overlay.querySelectorAll('.suid-substepper__step').forEach(step => {
    step.addEventListener('click', () => {
      const target = parseInt(step.dataset.substep);
      if (target < currentStep) goToSubstep(target);
    });
  });

  /* ─── Recolectar datos ─── */
  function recolectar() {
    const fd = new FormData(form);
    /* Mantener datos de pre-validación + agregar los del escenario */
    const prevalidacion = {
      nombreEscenario: reg.nombreEscenario,
      departamento: reg.departamento,
      municipio: reg.municipio,
      catastral: reg.catastral,
      zona: reg.zona,
      lat: reg.lat, lng: reg.lng,
      direccion: reg.direccion,
      barrio: reg.barrio,
      prevalidacionEn: reg.prevalidacionEn
    };
    return {
      ...prevalidacion,
      codigo: suidCode,
      /* Paso 1: Info general */
      entidadPropietaria: fd.get('entidadPropietaria') || '',
      tipoPropietario: fd.get('tipoPropietario') || '',
      entidadAdministradora: fd.get('entidadAdministradora') || '',
      tipoTenencia: fd.get('tipoTenencia') || '',
      responsable: fd.get('responsable') || '',
      telefonoResponsable: fd.get('telefonoResponsable') || '',
      emailResponsable: fd.get('emailResponsable') || '',
      esInversion: fd.get('esInversion') === 'true',
      horarioPreset: fd.get('horarioPreset') || '',
      horarioDias: fd.get('horarioDias') || '',
      horario24h: fd.get('horario24h') === 'true',
      horarioApertura: fd.get('horarioApertura') || '',
      horarioCierre: fd.get('horarioCierre') || '',
      /* Paso 2: Escenario físico */
      esCar: fd.get('esCar') === 'true' ? 'Sí' : 'No',
      tipoInfra: fd.get('tipoInfra') || '',
      tipoInfraGeneral: fd.get('tipoInfraGeneral') || '',
      tipoEscenario: fd.get('tipoEscenario') || '',
      areaConstruida: unmask(fd.get('areaConstruida')) || null,
      areaPredio: unmask(fd.get('areaPredio')) || null,
      cubierta: fd.get('cubierta') || '',
      aforo: unmask(fd.get('aforo')) || null,
      anioConstruccion: fd.get('anioConstruccion') || '',
      anioRemodelacion: fd.get('anioRemodelacion') || '',
      estadoConservacion: fd.get('estadoConservacion') || '',
      cantidadSubespacios: parseInt(fd.get('cantidadSubespacios')) || 1,
      /* Paso 3: Documentación */
      disciplinas: (fd.get('disciplinas') || '').split(',').filter(Boolean),
      dotacion: (fd.get('dotacion') || '').split(',').filter(Boolean),
      tipoAcceso: fd.get('tipoAcceso') || '',
      accesibilidad: (fd.get('accesibilidad') || '').split(',').filter(Boolean),
      descripcion: fd.get('descripcion') || '',
      programasMindeporte: fd.getAll('programasMindeporte') || [],
      poblacionMensual: unmask(fd.get('poblacionMensual')) || null,
      otrosUsos: fd.get('otrosUsos') || '',
      fechaCaptura: fd.get('fechaCaptura') || ''
    };
  }

  /* Guardar borrador */
  overlay.querySelector('#suidBtnDraft').addEventListener('click', () => {
    ProjectData.setProyecto(p.idUnico, x => {
      x.registroSuid = { ...recolectar(), estado: 'borrador', actualizadoEn: new Date().toISOString() };
      return x;
    });
    toast({ variant: 'informative', title: 'Borrador guardado', message: 'Puedes retomar el registro SUID en cualquier momento.' });
  });

  /* Finalizar */
  btnFinalizar.addEventListener('click', () => {
    const datos = recolectar();

    if (!datos.entidadPropietaria || !datos.tipoPropietario || !datos.tipoTenencia || !datos.responsable) {
      toast({ variant: 'negative', title: 'Información general incompleta', message: 'Paso 1: completa entidad propietaria, tipo, tenencia y responsable.' });
      goToSubstep(1);
      return;
    }
    if (!datos.tipoInfraGeneral || !datos.tipoEscenario || !datos.estadoConservacion || !datos.areaPredio || !datos.aforo || !datos.cubierta) {
      toast({ variant: 'negative', title: 'Escenario físico incompleto', message: 'Paso 2: completa tipo infra, escenario, áreas, aforo, cubierta y estado.' });
      goToSubstep(2);
      return;
    }
    if (datos.disciplinas.length === 0 || !datos.tipoAcceso) {
      toast({ variant: 'negative', title: 'Documentación incompleta', message: 'Paso 3: selecciona al menos 1 disciplina y el tipo de acceso.' });
      goToSubstep(3);
      return;
    }

    ProjectData.setProyecto(p.idUnico, x => {
      x.registroSuid = { ...datos, estado: 'completo', registradoEn: new Date().toISOString() };
      x.inversion = x.inversion || {};
      x.inversion.suidEscenario = suidCode;
      x.historial = x.historial || [];
      x.historial.push({
        ts: new Date().toISOString(), actor: 'admin',
        evento: `Escenario inventariado en SUID · ${suidCode}`,
        estado: x.estado || 'en_inversion'
      });
      return x;
    });

    ProjectData.pushNotificacion({
      perfil: 'admin',
      proyectoId: p.idUnico,
      tipo: 'suid',
      titulo: 'Escenario inventariado en SUID',
      detalle: `${suidCode} · ${p.nombre} · ${p.municipio}`,
      href: `inversion.html`
    });

    renderSuccessFinal();
    if (typeof onCompleto === 'function') onCompleto();
  });

  function renderSuccessFinal() {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    body.innerHTML = `
      <div class="ai-success">
        <div class="ai-success__confetti" data-confetti></div>
        <div class="ai-success__check" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="ai-success__title">¡Escenario inventariado!</h2>
        <p class="ai-success__sub">El escenario quedó registrado en el SUID nacional con el código <strong>${suidCode}</strong>.</p>
        <div class="ai-success__stamp">
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Código SUID</span>
            <span class="ai-success__stamp-value">${suidCode}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Escenario</span>
            <span class="ai-success__stamp-value">${p.nombre}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Fecha</span>
            <span class="ai-success__stamp-value">${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</span>
          </div>
        </div>
      </div>
    `;
    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" data-close style="background:#15803d !important;border-color:#15803d !important">${arrowRightIcon} Volver a inversión</button>
    `;
    footer.querySelector('[data-close]').addEventListener('click', close);
    runConfetti(body.querySelector('[data-confetti]'));
    body.scrollTop = 0;
  }

  /* Close */
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
}

export default { openSuidModal };
