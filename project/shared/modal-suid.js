/* ═══════════════════════════════════════════════════════════════════
   modal-suid.js — Wizard 8 pasos para registro SUID del escenario
   deportivo (Resolución 933 Art. 10). Replica el flujo del módulo
   Escenarios oficial usando DS Naowee canonical:
     · naowee-modal--wide + __header/__body/__footer
     · naowee-stepper--pulse con 8 steps
     · textfield / dropdown / multiselect / fileUpload / datepicker
     · naowee-message para validation
     · radioSegment para Sí/No + tipo infra (helper local)
     · chipMulti para disciplinas / dotación / accesibilidad

   API: openSuidModal({ proyectoId, onCompleto })

   Doug 17/05/2026 — refino transversal del registro-suid hardcoded.
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import {
  textfield, textarea, dropdown, checkbox, fileUpload,
  bindDropdowns, bindFileUpload, datepicker, bindDatepickers
} from './modal-convocatoria.js?v=20260517k';
import { multiselect, bindMultiselects, bindFileUploads, validateRequired, bindValidationReset, runConfetti } from './wizard-page.js?v=20260516b';
import { bindMasksIn, unmask } from './masks.js';
import { toast } from './toast.js';

/* Catálogos Resolución 933 Art. 10 + Censo Mindeporte */
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

/* Icons inline */
const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const checkIconSm = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;

/* Steps definition — el stepper del DS muestra estos labels */
const STEPS = [
  { id: 1, label: 'Datos básicos' },
  { id: 2, label: 'Georreferencia' },
  { id: 3, label: 'Identificación' },
  { id: 4, label: 'Características' },
  { id: 5, label: 'Disciplinas' },
  { id: 6, label: 'Dotación' },
  { id: 7, label: 'Programas y fotos' },
  { id: 8, label: 'Administración' }
];

/* ─── Helper local: radioSegment (segmented control DS-aligned) ───
   El DS Naowee no provee segmented control nativo, así que implementamos
   un pattern alineado: row de botones outline + selected con bg accent
   light. Trabaja con hidden input para que FormData lo recoja. */
function radioSegment({ label, name, options, value, required = false }) {
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

/* ─── Helper local: chipMulti (multi-toggle chips DS-aligned) ───
   Para selección múltiple visual tipo "tags" — disciplinas, dotación,
   accesibilidad. Pattern radius-full + border subtle + hover + selected
   con bg accent light + check icon. Persistencia en hidden input
   (CSV) + array via fd.getAll() también soportado. */
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

/* ─── Inyección de estilos one-time ───
   Custom styles solo para los helpers locales (segment + chip + photo
   grid). El resto vive en el DS Naowee CDN + pages.css. */
function injectSuidStyles() {
  if (document.getElementById('suidModalStyle')) return;
  const style = document.createElement('style');
  style.id = 'suidModalStyle';
  style.textContent = `
    /* Modal width — ajustado al wizard de 8 pasos */
    #suidOverlay .naowee-modal--wide {
      width: 920px !important;
      max-width: 95vw !important;
      max-height: 92vh;
    }
    @media (max-width: 960px) {
      #suidOverlay .naowee-modal--wide { width: 95vw !important; }
    }

    /* Spacing entre campos */
    #suidOverlay .ai-step-panel > * + * { margin-top: 18px; }
    #suidOverlay .ai-step-panel { padding-top: 4px; }

    /* Section title pattern (igual que ai-section-title de modal-postular) */
    #suidOverlay .ai-section-title {
      font-size: 11px; font-weight: 700;
      letter-spacing: .5px; text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    /* Grids */
    #suidOverlay .ai-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    #suidOverlay .ai-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    #suidOverlay .ai-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 720px) {
      #suidOverlay .ai-grid-2,
      #suidOverlay .ai-grid-3,
      #suidOverlay .ai-grid-4 { grid-template-columns: 1fr; }
    }

    /* ─── SegmentField ─── */
    .suid-segment-field {
      display: flex; flex-direction: column;
      gap: 6px;
    }
    .suid-segment-field__label {
      font-size: 12.5px; font-weight: 500;
      color: var(--text-secondary, #646587);
      line-height: 1.4;
    }
    .suid-segment-field__label--required::after {
      content: ' *';
      color: var(--accent, #d74009);
      font-weight: 700;
    }
    .suid-segment {
      display: inline-flex; align-items: stretch;
      border: 1px solid var(--border-dark, #d0d4e6);
      border-radius: var(--radius-md, 8px);
      background: var(--surface, #fff);
      overflow: hidden;
      padding: 3px;
      gap: 3px;
      width: fit-content;
    }
    .suid-segment__opt {
      padding: 7px 14px;
      background: transparent;
      border: 0;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary, #646587);
      cursor: pointer;
      border-radius: 6px;
      transition: background .12s, color .12s;
      letter-spacing: 0;
    }
    .suid-segment__opt:hover:not(.is-selected) {
      background: var(--bg, #f5f6fa);
      color: var(--text-primary, #282834);
    }
    .suid-segment__opt.is-selected {
      background: var(--orange-bg, #fff3e6);
      color: var(--accent, #d74009);
    }

    /* ─── ChipMulti ─── */
    .suid-chip-field {
      display: flex; flex-direction: column;
      gap: 8px;
    }
    .suid-chip-field__label {
      font-size: 12.5px; font-weight: 500;
      color: var(--text-secondary, #646587);
      line-height: 1.4;
    }
    .suid-chip-group {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
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
    .suid-chip:hover {
      border-color: var(--border-dark, #d0d4e6);
      background: #fafbfd;
    }
    .suid-chip.is-selected {
      background: var(--orange-bg, #fff3e6);
      border-color: var(--accent, #d74009);
      color: var(--accent, #d74009);
      font-weight: 700;
    }
    .suid-chip:active { transform: scale(.97); }
    .suid-chip__check {
      display: none;
      width: 13px; height: 13px;
      color: var(--accent, #d74009);
    }
    .suid-chip.is-selected .suid-chip__check { display: inline-flex; }
    .suid-chip__check svg { width: 13px; height: 13px; }
    .suid-chip-field__helper {
      font-size: 11px;
      color: var(--text-secondary, #646587);
      margin-top: 2px;
    }

    /* ─── Photo grid (paso 7) ─── */
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
    .suid-photo-slot__icon {
      color: var(--text-secondary, #646587);
      transition: color .15s, opacity .15s;
    }
    .suid-photo-slot__icon svg { width: 22px; height: 22px; }
    .suid-photo-slot.is-filled .suid-photo-slot__icon { display: none; }
    .suid-photo-slot__check {
      display: none;
      color: var(--green, #1f8923);
    }
    .suid-photo-slot__check svg { width: 24px; height: 24px; }
    .suid-photo-slot.is-filled .suid-photo-slot__check { display: inline-flex; }
    .suid-photo-slot__label {
      font-size: 11.5px; font-weight: 600;
      color: var(--text-secondary, #646587);
    }
    .suid-photo-slot.is-filled .suid-photo-slot__label {
      color: var(--green, #1f8923);
    }

    /* SUID code chip en header del modal */
    .suid-modal-code {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 12px; font-weight: 700;
      color: var(--accent, #d74009);
      letter-spacing: .3px;
    }

    /* Mini map placeholder (paso 2) — soporte visual */
    .suid-map-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: var(--blue-bg, #eef5ff);
      border: 1px solid #c8dcf5;
      border-radius: var(--radius-md, 8px);
      color: var(--blue-info, #1f78d1);
      font-size: 12.5px; font-weight: 600;
      cursor: pointer;
      transition: background .12s;
    }
    .suid-map-cta:hover {
      background: #e0eefb;
    }
    .suid-map-cta svg { width: 14px; height: 14px; }
  `;
  document.head.appendChild(style);
}

/* ─── Helper renderStepper canónico DS Naowee ─── */
function renderStepperOficial(currentStep) {
  return `
    <div class="naowee-stepper naowee-stepper--pulse" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${currentStep}">
      ${STEPS.map((s, i) => {
        const isDone = s.id < currentStep;
        const isActive = s.id === currentStep;
        const stateCls = isDone ? 'naowee-stepper__step--done' : isActive ? 'naowee-stepper__step--active' : '';
        const numInner = isDone ? stepperCheckIcon : String(s.id);
        const connector = i < STEPS.length - 1
          ? `<span class="naowee-stepper__connector ${isDone ? 'naowee-stepper__connector--done' : ''}" data-after="${s.id}"></span>`
          : '';
        return `
          <div class="naowee-stepper__step ${stateCls}" data-step="${s.id}">
            <span class="naowee-stepper__number">${numInner}</span>
            <span class="naowee-stepper__label">${s.label}</span>
          </div>
          ${connector}
        `;
      }).join('')}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   ENTRY POINT — openSuidModal({ proyectoId, onCompleto })
   ═══════════════════════════════════════════════════════════════════ */
export function openSuidModal({ proyectoId, onCompleto } = {}) {
  const p = ProjectData.getProyecto(proyectoId);
  if (!p) {
    alert('Proyecto no encontrado.');
    return;
  }
  const suidCode = p.inversion?.suidEscenario
    || p.registroSuid?.codigo
    || `SUID-${(p.departamento || 'COL').slice(0, 3).toUpperCase()}-${(p.idUnico || '').replace(/[^0-9]/g, '').slice(0, 6)}`;
  const reg = p.registroSuid || {};

  injectSuidStyles();

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.id = 'suidOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Registro SUID del escenario deportivo</h2>
          <p class="naowee-modal__subtitle"><span class="suid-modal-code">${suidCode}</span> · ${p.nombre} · Res. 933 Art. 10</p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      ${renderStepperOficial(1)}

      <div class="naowee-modal__body">
        <form id="suidForm" novalidate>

          <!-- ═══ PASO 1: Datos básicos ═══ -->
          <div class="ai-step-panel" data-panel="1">
            <div class="naowee-message naowee-message--informative" role="status">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                <span class="naowee-message__title">Pre-validación · datos heredados del proyecto</span>
              </div>
              <div class="naowee-message__content">
                <p class="naowee-message__text">El nombre, departamento y municipio se heredan del proyecto. Solo necesitas completar el catastral y la zona para verificar unicidad nacional.</p>
              </div>
            </div>

            <div class="ai-section-title">Identificación del escenario</div>
            <div class="ai-grid-3">
              ${textfield({ label: 'Nombre del escenario', name: 'nombreEscenario', value: p.nombre || '' })}
              ${textfield({ label: 'Departamento', name: 'departamento', value: p.departamento || '' })}
              ${textfield({ label: 'Municipio', name: 'municipio', value: p.municipio || '' })}
            </div>

            <div class="ai-grid-2">
              ${textfield({ label: 'Número de registro catastral', name: 'catastral', required: true, placeholder: '760010100000-001-000-0001', value: reg.catastral || '', helper: 'Código catastral oficial · 19-22 dígitos' })}
              ${dropdown({ label: 'Zona', name: 'zona', required: true, options: ZONAS, value: reg.zona || '' })}
            </div>

            <div class="naowee-message naowee-message--positive" role="status" data-validation-ok>
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="naowee-message__title">Catastral único en el SUID nacional</span>
              </div>
              <div class="naowee-message__content">
                <p class="naowee-message__text">No existe otro escenario registrado con este número. Puedes continuar al siguiente paso.</p>
              </div>
            </div>
          </div>

          <!-- ═══ PASO 2: Georreferencia ═══ -->
          <div class="ai-step-panel" data-panel="2" hidden>
            <div class="ai-section-title">Ubicación geográfica del escenario</div>

            <button type="button" class="suid-map-cta" id="suidBtnUbicarme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Usar coordenadas del proyecto
            </button>

            <div class="ai-grid-2">
              ${textfield({ label: 'Latitud (decimal)', name: 'lat', required: true, placeholder: '4.7110', value: reg.lat || p.coordenadas?.lat || '', helper: 'Rango Colombia: −4.23 a 12.53' })}
              ${textfield({ label: 'Longitud (decimal)', name: 'lng', required: true, placeholder: '-74.0721', value: reg.lng || p.coordenadas?.lng || '', helper: 'Rango Colombia: −81.73 a −66.87' })}
            </div>

            <div class="ai-section-title" style="margin-top:8px">Dirección detallada</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Dirección del escenario', name: 'direccion', required: true, placeholder: 'Cra 30 # 45-12', value: reg.direccion || p.direccionPredio || '' })}
              ${textfield({ label: 'Corregimiento / Vereda / Barrio', name: 'barrio', placeholder: 'Opcional', value: reg.barrio || '' })}
            </div>
          </div>

          <!-- ═══ PASO 3: Identificación deportiva ═══ -->
          <div class="ai-step-panel" data-panel="3" hidden>
            <div class="ai-section-title">Clasificación del escenario</div>

            <div class="ai-grid-2">
              ${radioSegment({ label: '¿Es Centro de Alto Rendimiento (CAR)?', name: 'esCar', options: ['Sí', 'No'], value: reg.esCar || 'No', required: true })}
              ${radioSegment({ label: 'Tipo de infraestructura', name: 'tipoInfra', options: TIPO_INFRA, value: reg.tipoInfra || 'Recreativa', required: true })}
            </div>

            <div class="ai-grid-2">
              ${dropdown({ label: 'Tipo de infraestructura general', name: 'tipoInfraGeneral', required: true, options: TIPO_INFRA_GENERAL, value: reg.tipoInfraGeneral || '' })}
              ${dropdown({ label: 'Tipo de escenario', name: 'tipoEscenario', required: true, options: TIPOS_ESCENARIO, value: reg.tipoEscenario || '' })}
            </div>
          </div>

          <!-- ═══ PASO 4: Características físicas ═══ -->
          <div class="ai-step-panel" data-panel="4" hidden>
            <div class="ai-section-title">Dimensiones y aforo</div>

            <div class="ai-grid-3">
              ${textfield({ label: 'Área del predio (m²)', name: 'areaPredio', required: true, placeholder: '2.400', mask: 'money', value: reg.areaPredio ? String(reg.areaPredio) : '' })}
              ${textfield({ label: 'Área construida (m²)', name: 'areaConstruida', required: true, placeholder: '1.850', mask: 'money', value: reg.areaConstruida ? String(reg.areaConstruida) : '' })}
              ${textfield({ label: 'Aforo (personas)', name: 'aforo', required: true, placeholder: '1.200', mask: 'money', value: reg.aforo ? String(reg.aforo) : '' })}
            </div>

            <div class="ai-section-title" style="margin-top:8px">Detalles constructivos</div>
            <div class="ai-grid-4">
              ${textfield({ label: 'Año de construcción', name: 'anioConstruccion', placeholder: '2024', value: reg.anioConstruccion || '' })}
              ${textfield({ label: 'Sub-espacios', name: 'cantidadSubespacios', value: reg.cantidadSubespacios || '1' })}
              ${textfield({ label: 'Pisos / niveles', name: 'pisos', value: reg.pisos || '1' })}
              ${dropdown({ label: 'Estado de conservación', name: 'estadoConservacion', required: true, options: ESTADO_CONSERVACION, value: reg.estadoConservacion || '' })}
            </div>
          </div>

          <!-- ═══ PASO 5: Disciplinas deportivas ═══ -->
          <div class="ai-step-panel" data-panel="5" hidden>
            <div class="ai-section-title">Disciplinas que se practican</div>
            ${chipMulti({
              label: 'Selecciona todas las disciplinas que alberga el escenario',
              name: 'disciplinas',
              options: DISCIPLINAS,
              value: reg.disciplinas || [],
              helper: `${DISCIPLINAS.length} disciplinas disponibles en el catálogo nacional · mínimo 1`
            })}
          </div>

          <!-- ═══ PASO 6: Dotación y servicios ═══ -->
          <div class="ai-step-panel" data-panel="6" hidden>
            <div class="ai-section-title">Servicios e instalaciones disponibles</div>
            ${chipMulti({
              label: 'Dotación general del escenario',
              name: 'dotacion',
              options: DOTACION_GENERAL,
              value: reg.dotacion || [],
              helper: 'Selecciona los servicios e instalaciones con los que cuenta'
            })}

            <div class="ai-section-title" style="margin-top:8px">Acceso y accesibilidad</div>
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

          <!-- ═══ PASO 7: Programas y fotografías ═══ -->
          <div class="ai-step-panel" data-panel="7" hidden>
            <div class="ai-section-title">Programas y uso del escenario</div>
            ${textarea({ label: 'Descripción del escenario', name: 'descripcion', placeholder: 'Describe brevemente el escenario, su contexto y particularidades técnicas...', rows: 3, value: reg.descripcion || '' })}

            ${multiselect({ name: 'programasMindeporte', label: 'Programas del Ministerio que se ejecutan', options: PROGRAMAS_MINDEPORTE, placeholder: 'Selecciona uno o más programas', helper: '6 programas disponibles del Ministerio del Deporte' })}

            <div class="ai-grid-2">
              ${textfield({ label: 'Población mensual atendida', name: 'poblacionMensual', placeholder: '1.500', mask: 'money', value: reg.poblacionMensual ? String(reg.poblacionMensual) : '' })}
              ${textfield({ label: 'Otros usos (no deportivos)', name: 'otrosUsos', placeholder: 'Conciertos, eventos comunitarios...', value: reg.otrosUsos || '' })}
            </div>

            <div class="ai-section-title" style="margin-top:8px">Fotografías generales</div>
            ${datepicker({ label: 'Fecha de captura de fotografías', name: 'fechaCaptura', required: true, helper: 'Mínimo 6 meses antes de hoy · debe reflejar el estado actual' })}

            <div class="suid-photo-grid" id="suidPhotoGrid">
              ${['Fachada', 'Interior', 'Cancha/Pista', 'Vestuarios', 'Acceso', 'Dotación'].map((lbl, i) => `
                <div class="suid-photo-slot ${(reg.fotos || [])[i] ? 'is-filled' : ''}" data-photo="${i}" role="button" tabindex="0" aria-label="Subir foto: ${lbl}">
                  <span class="suid-photo-slot__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </span>
                  <span class="suid-photo-slot__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="suid-photo-slot__label">${lbl}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- ═══ PASO 8: Datos administrativos ═══ -->
          <div class="ai-step-panel" data-panel="8" hidden>
            <div class="ai-section-title">Responsable y operación</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Responsable administrativo', name: 'responsable', placeholder: 'Nombre completo', value: reg.responsable || p.representante?.nombre || '' })}
              ${textfield({ label: 'Contacto del escenario', name: 'contacto', placeholder: '+57 311 234 5678', value: reg.contacto || p.representante?.contacto || '' })}
            </div>

            <div class="ai-grid-2">
              ${textfield({ label: 'Horario de funcionamiento', name: 'horario', placeholder: 'Lun-Sáb 6 a.m. – 10 p.m.', value: reg.horario || '' })}
              ${textfield({ label: 'Presupuesto operativo anual (COP)', name: 'presupuestoOperativo', placeholder: '240.000.000', mask: 'money', value: reg.presupuestoOperativo ? String(reg.presupuestoOperativo) : '' })}
            </div>

            <div class="naowee-message naowee-message--positive" role="status" style="margin-top:14px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                <span class="naowee-message__title">Listo para inventariar</span>
              </div>
              <div class="naowee-message__content">
                <p class="naowee-message__text">Has completado los 8 pasos del registro SUID. Al finalizar el escenario quedará inventariado en el sistema nacional con el código <strong>${suidCode}</strong>.</p>
              </div>
            </div>
          </div>

        </form>
      </div>

      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="suidBtnPrev" style="display:none;margin-right:auto">${arrowLeftIcon} Volver</button>
        <button type="button" class="naowee-btn naowee-btn--link" id="suidBtnDraft" style="margin-right:12px">Guardar borrador</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="suidBtnNext">Continuar ${arrowRightIcon}</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="suidBtnFinalizar" style="display:none;background:#15803d !important;border-color:#15803d !important">${checkIconSm} Inventariar escenario</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#suidForm');
  bindDropdowns(form);
  bindDatepickers(form);
  bindMultiselects(form);
  bindFileUploads(form);
  bindSegments(form);
  bindChips(form);
  bindMasksIn(form);
  bindValidationReset(form);

  /* Auto-fill coordenadas desde el proyecto */
  overlay.querySelector('#suidBtnUbicarme')?.addEventListener('click', () => {
    const latI = form.querySelector('input[name="lat"]');
    const lngI = form.querySelector('input[name="lng"]');
    if (latI && !latI.value) latI.value = p.coordenadas?.lat || '4.7110';
    if (lngI && !lngI.value) lngI.value = p.coordenadas?.lng || '-74.0721';
    toast({ variant: 'informative', title: 'Coordenadas capturadas', message: 'Datos heredados del proyecto. Verifica antes de continuar.' });
  });

  /* Photo slot toggle (mock — solo marca filled visualmente) */
  overlay.querySelectorAll('.suid-photo-slot').forEach(slot => {
    const toggle = () => slot.classList.toggle('is-filled');
    slot.addEventListener('click', toggle);
    slot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ───────── Navegación entre pasos ───────── */
  let currentStep = 1;
  const btnPrev = overlay.querySelector('#suidBtnPrev');
  const btnNext = overlay.querySelector('#suidBtnNext');
  const btnFinalizar = overlay.querySelector('#suidBtnFinalizar');

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(STEPS.length, n));
    overlay.querySelectorAll('.ai-step-panel').forEach(panel => {
      panel.hidden = parseInt(panel.dataset.panel) !== currentStep;
    });
    /* Re-render stepper visual */
    const stepperEl = overlay.querySelector('.naowee-stepper');
    if (stepperEl) {
      stepperEl.outerHTML = renderStepperOficial(currentStep);
      /* Rebind step clicks */
      overlay.querySelectorAll('.naowee-stepper__step').forEach(stepEl => {
        stepEl.addEventListener('click', () => {
          const target = parseInt(stepEl.dataset.step);
          if (target < currentStep) goToStep(target);
        });
      });
    }
    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    btnNext.style.display = currentStep < STEPS.length ? 'inline-flex' : 'none';
    btnFinalizar.style.display = currentStep === STEPS.length ? 'inline-flex' : 'none';
    overlay.querySelector('.naowee-modal__body').scrollTop = 0;
  }

  btnNext.addEventListener('click', () => {
    const activePanel = overlay.querySelector(`.ai-step-panel[data-panel="${currentStep}"]`);
    if (!validateRequired(activePanel)) return;
    goToStep(currentStep + 1);
  });
  btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

  /* Step click handling para regresar — initial bind */
  overlay.querySelectorAll('.naowee-stepper__step').forEach(stepEl => {
    stepEl.addEventListener('click', () => {
      const target = parseInt(stepEl.dataset.step);
      if (target < currentStep) goToStep(target);
    });
  });

  /* ───────── Recolectar datos ───────── */
  function recolectar() {
    const fd = new FormData(form);
    return {
      codigo: suidCode,
      /* Pre-validación */
      catastral: fd.get('catastral') || '',
      zona: fd.get('zona') || '',
      lat: parseFloat(fd.get('lat')) || null,
      lng: parseFloat(fd.get('lng')) || null,
      direccion: fd.get('direccion') || '',
      barrio: fd.get('barrio') || '',
      /* Datos deportivos */
      esCar: fd.get('esCar') || 'No',
      tipoInfra: fd.get('tipoInfra') || '',
      tipoInfraGeneral: fd.get('tipoInfraGeneral') || '',
      tipoEscenario: fd.get('tipoEscenario') || '',
      cantidadSubespacios: parseInt(fd.get('cantidadSubespacios')) || 1,
      anioConstruccion: fd.get('anioConstruccion') || '',
      pisos: fd.get('pisos') || '',
      estadoConservacion: fd.get('estadoConservacion') || '',
      areaPredio: unmask(fd.get('areaPredio')) || null,
      areaConstruida: unmask(fd.get('areaConstruida')) || null,
      aforo: unmask(fd.get('aforo')) || null,
      disciplinas: (fd.get('disciplinas') || '').split(',').filter(Boolean),
      dotacion: (fd.get('dotacion') || '').split(',').filter(Boolean),
      tipoAcceso: fd.get('tipoAcceso') || '',
      accesibilidad: (fd.get('accesibilidad') || '').split(',').filter(Boolean),
      descripcion: fd.get('descripcion') || '',
      programasMindeporte: fd.getAll('programasMindeporte') || [],
      poblacionMensual: unmask(fd.get('poblacionMensual')) || null,
      otrosUsos: fd.get('otrosUsos') || '',
      fechaCaptura: fd.get('fechaCaptura') || '',
      responsable: fd.get('responsable') || '',
      contacto: fd.get('contacto') || '',
      horario: fd.get('horario') || '',
      presupuestoOperativo: unmask(fd.get('presupuestoOperativo')) || null
    };
  }

  /* ───────── Guardar borrador ───────── */
  overlay.querySelector('#suidBtnDraft').addEventListener('click', () => {
    ProjectData.setProyecto(p.idUnico, x => {
      x.registroSuid = { ...recolectar(), estado: 'borrador', actualizadoEn: new Date().toISOString() };
      return x;
    });
    toast({ variant: 'informative', title: 'Borrador guardado', message: 'Puedes retomar el registro SUID en cualquier momento.' });
  });

  /* ───────── Finalizar (paso 8 → inventariar) ───────── */
  btnFinalizar.addEventListener('click', () => {
    const datos = recolectar();

    /* Validaciones críticas — aunque el wizard pasó por pasos, hacemos
       un check final transversal antes de marcar 'completo'. */
    if (!datos.catastral || !datos.zona || !datos.lat || !datos.lng || !datos.direccion) {
      toast({ variant: 'negative', title: 'Pre-validación incompleta', message: 'Vuelve a los pasos 1-2 y completa catastral, zona, coordenadas y dirección.' });
      return;
    }
    const latOk = datos.lat >= -4.23 && datos.lat <= 12.53;
    const lngOk = datos.lng >= -81.73 && datos.lng <= -66.87;
    if (!latOk || !lngOk) {
      toast({ variant: 'negative', title: 'Coordenadas fuera de rango', message: 'Lat: −4.23 a 12.53 · Lng: −81.73 a −66.87 (Colombia).' });
      return;
    }
    if (!datos.tipoInfraGeneral || !datos.tipoEscenario || !datos.estadoConservacion) {
      toast({ variant: 'negative', title: 'Identificación incompleta', message: 'Pasos 3-4: selecciona tipo de infraestructura, escenario y estado.' });
      return;
    }
    if (datos.disciplinas.length === 0) {
      toast({ variant: 'negative', title: 'Sin disciplinas', message: 'Paso 5: selecciona al menos 1 disciplina deportiva.' });
      return;
    }
    if (!datos.areaPredio || !datos.aforo) {
      toast({ variant: 'negative', title: 'Faltan medidas', message: 'Paso 4: completa área del predio y aforo.' });
      return;
    }
    if (!datos.tipoAcceso) {
      toast({ variant: 'negative', title: 'Falta tipo de acceso', message: 'Paso 6: selecciona el tipo de acceso al escenario.' });
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

    /* Notif a admin (auditoria) */
    ProjectData.pushNotificacion({
      perfil: 'admin',
      proyectoId: p.idUnico,
      tipo: 'suid',
      titulo: 'Escenario inventariado en SUID',
      detalle: `${suidCode} · ${p.nombre} · ${p.municipio}`,
      href: `inversion.html`
    });

    renderSuccessScreen({ suidCode, p });
    if (typeof onCompleto === 'function') onCompleto();
  });

  /* ───────── Success screen ───────── */
  function renderSuccessScreen({ suidCode, p }) {
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
        <h2 class="ai-success__title">¡Escenario inventariado!</h2>
        <p class="ai-success__sub">El escenario quedó registrado en el SUID nacional con el código <strong>${suidCode}</strong>. Aparecerá en la tabla de inversión como "Inventariado".</p>
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

  /* ───────── Close handlers ───────── */
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

export default { openSuidModal };
