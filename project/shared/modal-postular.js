/* ═══════════════════════════════════════════════════════════════════
   modal-postular.js — Wizard 5 pasos en modal DS oficial.
   Mismo patrón canónico que modal-activar-inversion + modal-convocatoria:
     .naowee-modal-overlay.is-open / .naowee-modal--wide
     .naowee-modal__header / __dismiss (hover state oficial)
     .naowee-stepper--pulse con --done + check SVG inline
     .naowee-modal__footer (sticky) — Volver (left) · Continuar (right)
     Success screen reusando runConfetti

   API: openPostularModal({ convocatoriaId, onPostulado })
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
import { formatoFecha, formatoMoneda } from './states.js';
import { textfield, textarea, dropdown, bindDropdowns, renderReview, runConfetti, checkbox, fileUpload, bindFileUploads, mountCheckboxes, multiselect, bindMultiselects, validateRequired, bindValidationReset } from './wizard-page.js?v=20260514a';
import { bindMasksIn, unmask } from './masks.js';

const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const sendIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;
const uploadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const pdfIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

/* v2.0 — Wizard 5 pasos (acta Danna/Juanma 14/05/2026).
   Quitamos "Entidad formuladora" (datos heredados del perfil municipio
   logueado) y dividimos la documentación en 3 bloques diferenciados que
   reflejan el orden de revisión Res. 933:
     1. RBI (Requisitos Básicos Indispensables) — revisado primero
     2. Documentación general — revisado después de RBI aprobado
     3. Documentación técnica (8 áreas) — revisado en paralelo con general

   El municipio sube TODO al postular; la revisión es secuencial. */
const STEPS = [
  { label: 'Registro básico' },
  { label: 'Doc. indispensable' },
  { label: 'Doc. general' },
  { label: 'Doc. técnica' },
  { label: 'Revisar' }
];

/* v2.0 — Documentación organizada en 3 BLOQUES diferenciados que reflejan
   el orden de revisión Res. 933 + Lista-chequeo-v2 (Danna 14/05/2026):
     BLOQUE 1 (RBI) — Requisitos Básicos Indispensables (revisor RBI dedicado)
     BLOQUE 2 (general) — Documentación general (revisor doc general dedicado)
     BLOQUE 3 (técnica) — 8 áreas técnicas (revisores especialistas por área)

   Cada icono es un SVG semántico (24x24 stroke=currentColor stroke-width=1.7). */
const ICON_RBI     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9-1.85 0-3.57-.56-5-1.51L3 21l1.5-4A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"/></svg>';
const ICON_GENERAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>';
const ICON_TOPO    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/></svg>';
const ICON_SUELOS  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 7 12 2 21 7 12 12 3 7"/><polyline points="3 12 12 17 21 12"/><polyline points="3 17 12 22 21 17"/></svg>';
const ICON_ARQ     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M10 22v-4h4v4"/></svg>';
const ICON_EST     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="3" x2="21" y2="3"/><rect x="5" y="3" width="3" height="18"/><rect x="11" y="3" width="3" height="18"/><rect x="17" y="3" width="2" height="18"/></svg>';
const ICON_HIDRO   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>';
const ICON_ELEC    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
const ICON_AMB     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19.2 2.96c.97 6.43 0 11.48-2.4 14.21A7 7 0 0111 20z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>';
const ICON_PRES    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>';

/* BLOQUE 1 — RBI (lo revisa el revisor RBI dedicado) */
const AREAS_RBI = [
  { id: 'rbi-intencion', icon: ICON_RBI, ref: 'Res. 933 Sec. 1.1', label: 'Carta de intención y formalización', docs: [
    { id: 'rbi-carta', label: 'Carta de intención firmada por representante legal', required: true },
    { id: 'rbi-cedula', label: 'Cédula del representante legal', required: true },
    { id: 'rbi-acto', label: 'Acto administrativo que autoriza la postulación', required: true }
  ]},
  { id: 'rbi-titularidad', icon: ICON_RBI, ref: 'Res. 933 Sec. 1.2-1.3', label: 'Titularidad del predio', docs: [
    { id: 'rbi-tenencia', label: 'Documento de tenencia / propiedad', required: true },
    { id: 'rbi-tradicion', label: 'Certificado de tradición y libertad', required: true }
  ]},
  { id: 'rbi-presupuestal', icon: ICON_RBI, ref: 'Res. 933 Sec. 1.4', label: 'Soporte presupuestal y SUID', docs: [
    { id: 'rbi-cdp', label: 'Certificado de disponibilidad presupuestal (CDP)', required: true },
    { id: 'rbi-suid', label: 'Certificado del Sistema Único de Información Deportiva (SUID)', required: true },
    { id: 'rbi-analisis', label: 'Documento de análisis de necesidad', required: true }
  ]}
];

/* BLOQUE 2 — Documentación general (lo revisa el revisor doc general dedicado) */
const AREAS_GENERAL = [
  { id: 'general-analisis', icon: ICON_GENERAL, ref: 'Res. 933 Sec. 2.1', label: 'Análisis del proyecto', docs: [
    { id: 'gen-memorando', label: 'Memorando técnico de análisis', required: true },
    { id: 'gen-mga', label: 'Ficha MGA con BPIN', required: true },
    { id: 'gen-sostenibilidad', label: 'Plan de sostenibilidad 10 años', required: true }
  ]},
  { id: 'general-territorial', icon: ICON_GENERAL, ref: 'Res. 933 Sec. 2.2-2.5', label: 'Planeación territorial y licencias', docs: [
    { id: 'gen-uso-suelo', label: 'Concepto de uso del suelo', required: true },
    { id: 'gen-plano-ubicacion', label: 'Plano de ubicación + ficha DANE', required: true },
    { id: 'gen-licencias', label: 'Licencias urbanísticas (o certificado de no aplicabilidad)', required: true },
    { id: 'gen-comite', label: 'Concepto del Comité Municipal del Deporte', required: true }
  ]},
  { id: 'general-servicios', icon: ICON_GENERAL, ref: 'Res. 933 Sec. 2.6-2.7', label: 'Servicios públicos y socialización', docs: [
    { id: 'gen-agua', label: 'Certificado disponibilidad de agua', required: true },
    { id: 'gen-energia', label: 'Certificado disponibilidad de energía', required: true },
    { id: 'gen-alcantarillado', label: 'Certificado de alcantarillado', required: true },
    { id: 'gen-socializacion', label: 'Acta de socialización comunitaria', required: true }
  ]}
];

/* BLOQUE 3 — Documentación técnica (8 áreas Res. 933 Art. 3, cada una su revisor especialista) */
const AREAS_TECNICA = [
  { id: 'topografico', icon: ICON_TOPO, ref: 'Res. 933 Art. 3.1', label: 'Levantamiento topográfico', docs: [
    { id: 'topo-plano', label: 'Plano topográfico georreferenciado', required: true },
    { id: 'topo-memoria', label: 'Memoria descriptiva del levantamiento', required: true },
    { id: 'topo-profesional', label: 'Matrícula profesional del topógrafo', required: true }
  ]},
  { id: 'suelos', icon: ICON_SUELOS, ref: 'Res. 933 Art. 3.2', label: 'Estudio de suelos', docs: [
    { id: 'suelos-estudio', label: 'Estudio geotécnico firmado', required: true },
    { id: 'suelos-ensayos', label: 'Resultados de ensayos de laboratorio', required: true },
    { id: 'suelos-profesional', label: 'Matrícula profesional COPNIA', required: true }
  ]},
  { id: 'arquitectonico', icon: ICON_ARQ, ref: 'Res. 933 Art. 3.3', label: 'Diseño arquitectónico', docs: [
    { id: 'arq-planos', label: 'Planos arquitectónicos (plantas, cortes, fachadas)', required: true },
    { id: 'arq-memoria', label: 'Memoria descriptiva arquitectónica', required: true },
    { id: 'arq-zona', label: 'Zonificación de áreas de competencia', required: true }
  ]},
  { id: 'estructural', icon: ICON_EST, ref: 'Res. 933 Art. 3.4', label: 'Diseño estructural', docs: [
    { id: 'est-planos', label: 'Planos estructurales', required: true },
    { id: 'est-memoria', label: 'Memoria de cálculo estructural', required: true },
    { id: 'est-matricula', label: 'Matrícula profesional COPNIA', required: true }
  ]},
  { id: 'hidrosanitario', icon: ICON_HIDRO, ref: 'Res. 933 Art. 3.5', label: 'Hidráulico, sanitario y RCI', docs: [
    { id: 'hidro-planos', label: 'Planos hidrosanitarios + red contra incendio', required: true },
    { id: 'hidro-memoria', label: 'Memoria descriptiva hidráulica', required: true }
  ]},
  { id: 'electrico', icon: ICON_ELEC, ref: 'Res. 933 Art. 3.6', label: 'Diseño eléctrico (RETIE/RETILAP)', docs: [
    { id: 'elec-planos', label: 'Planos eléctricos (fuerza, iluminación, comunicaciones)', required: true },
    { id: 'elec-memoria', label: 'Memoria de cálculo eléctrico', required: true }
  ]},
  { id: 'ambiental', icon: ICON_AMB, ref: 'Res. 933 Art. 3.7', label: 'Manejo, riesgos y licencia ambiental', docs: [
    { id: 'amb-plan', label: 'Plan de manejo ambiental', required: true },
    { id: 'amb-riesgos', label: 'Evaluación de riesgos y vulnerabilidad', required: true },
    { id: 'amb-inventario', label: 'Inventario florístico y faunístico', required: false }
  ]},
  { id: 'presupuesto', icon: ICON_PRES, ref: 'Res. 933 Art. 3.8', label: 'Presupuesto integral', docs: [
    { id: 'pres-detallado', label: 'Presupuesto detallado por capítulos', required: true },
    { id: 'pres-apus', label: 'Análisis de precios unitarios (APU)', required: true },
    { id: 'pres-cronograma', label: 'Cronograma de obra', required: true }
  ]}
];

/* Backward-compat: ARRAY plano para flatMap del submit y el contador.
   Conserva el campo `bloque` para que el revisor sepa qué tipo de revisor
   tiene scope sobre el documento. */
const AREAS_ANEXOS = [
  ...AREAS_RBI.map(a => ({ ...a, bloque: 'rbi' })),
  ...AREAS_GENERAL.map(a => ({ ...a, bloque: 'general' })),
  ...AREAS_TECNICA.map(a => ({ ...a, bloque: 'tecnica' }))
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

export function openPostularModal({ convocatoriaId, onPostulado } = {}) {
  const todas = ProjectData.getConvocatorias();
  const conv = (convocatoriaId && todas.find(c => c.id === convocatoriaId)) ||
               todas.find(c => c.estado === 'abierta');
  if (!conv) {
    alert('No hay convocatorias abiertas en este momento.');
    return;
  }

  const tipoSolicitudOptions = ['Construcción nueva', 'Mejoramiento', 'Adecuación', 'Dotación'];
  const faseOptions = ['Fase I — Diseños', 'Fase II — Obra', 'Fase III — Obra y Dotación'];
  const fuentes = conv.fuentes || [];

  const perfilMun = ProjectData.getPerfilData('municipio');

  /* ═══ Catálogos Resolución 933 / Censo Mindeporte ═══ */
  const entidadTipos = [
    'Alcaldía Municipal', 'Alcaldía Distrital',
    'Gobernación Departamental', 'Resguardo Indígena',
    'Consejo Comunitario Afrodescendiente'
  ];
  const departamentos = [
    'Antioquia', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
    'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
    'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
    'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
    'Santander', 'Sucre', 'Tolima', 'Valle del Cauca'
  ];
  const tipologias = [
    'Coliseo cubierto', 'Polideportivo', 'Estadio de fútbol', 'Pista atlética',
    'Cancha sintética', 'Cancha múltiple', 'Cancha de béisbol', 'Patinódromo',
    'Piscina olímpica', 'Skatepark', 'Velódromo', 'Centro de alto rendimiento',
    'Gimnasio biosaludable', 'Cancha de tenis', 'Otro'
  ];
  const modalidadesOpciones = [
    'Fútbol', 'Baloncesto', 'Voleibol', 'Atletismo', 'Natación', 'Boxeo',
    'Lucha', 'Ciclismo', 'Patinaje', 'Tenis', 'Béisbol', 'Softbol',
    'Tenis de mesa', 'Bádminton', 'Pesas', 'Judo', 'Karate', 'Taekwondo'
  ];
  const datums = ['MAGNA-SIRGAS', 'WGS84'];

  const overlay = document.createElement('div');
  overlay.className = 'naowee-modal-overlay';
  overlay.id = 'postularOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="naowee-modal naowee-modal--wide naowee-modal--fixed-header naowee-modal--fixed-footer">
      <!-- HEADER fijo con dismiss oficial -->
      <div class="naowee-modal__header">
        <div class="naowee-modal__title-group">
          <h2 class="naowee-modal__title">Postular proyecto</h2>
          <p class="naowee-modal__subtitle">${conv.nombre} · Cierra ${formatoFecha(conv.cierre)}</p>
        </div>
        <button type="button" class="naowee-modal__dismiss" data-close aria-label="Cerrar">${closeIcon}</button>
      </div>

      <!-- STEPPER canónico DS -->
      ${renderStepperOficial()}

      <!-- BODY scrollable -->
      <div class="naowee-modal__body">
        <form id="postularForm" novalidate>
          <!-- PASO 1 — Registro básico (datos mínimos del proyecto)
               v2.0: la entidad formuladora se hereda del perfil del municipio
               logueado. No se pide tipo de proyecto (todos son infraestructura)
               ni descripción breve (eso vive en los docs). Solo lo esencial. -->
          <div class="ai-step-panel" data-panel="1">
            <div class="naowee-message naowee-message--informative" role="status" style="margin-bottom:18px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                <span class="naowee-message__title">Postulando a ${conv.id}</span>
              </div>
              <div class="naowee-message__text">Año ${conv.anio || conv.bienio || ''} · Tope por proyecto: <strong>${formatoMoneda(conv.montoMaximoProyecto)}</strong> · Entidad: <strong>${perfilMun?.entidad || ''}</strong> (${perfilMun?.municipio || perfilMun?.departamento || ''})</div>
            </div>

            <div class="ai-section-title">Identificación del proyecto</div>
            ${textfield({ label: 'Nombre del proyecto', name: 'nombre', required: true, placeholder: 'Ej: Construcción Coliseo Cubierto Quibdó', maxlength: 200 })}
            <div class="ai-grid-2">
              ${dropdown({ label: 'Fase', name: 'fase', required: true, options: faseOptions })}
              ${dropdown({ label: 'Tipo de solicitud', name: 'tipoSolicitud', required: true, options: tipoSolicitudOptions })}
            </div>
            <div class="ai-grid-2">
              ${dropdown({ label: 'Tipología principal (Censo)', name: 'tipologia', required: true, options: tipologias })}
              ${textfield({ label: 'Subtipología (opcional)', name: 'subtipologia', placeholder: 'Ej: Coliseo polifuncional cubierto' })}
            </div>

            ${multiselect({
              name: 'modalidades',
              label: 'Modalidades deportivas',
              required: true,
              options: modalidadesOpciones,
              placeholder: 'Selecciona las disciplinas que se practicarán...',
              helper: 'Mínimo 1 modalidad · puedes seleccionar varias'
            })}

            <div class="ai-section-title">Representante legal</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Nombre completo', name: 'repNombre', required: true, maxlength: 150, value: perfilMun?.nombre || '' })}
              ${textfield({ label: 'Documento de identidad', name: 'repDoc', required: true, placeholder: 'CC 11.806.443' })}
            </div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Cargo', name: 'repCargo', required: true, value: perfilMun?.cargo || '' })}
              ${textfield({ label: 'Contacto', name: 'repContacto', prefix: '+57', placeholder: '311 745 2389', helper: 'Celular o teléfono fijo del representante' })}
            </div>

            <div class="ai-section-title">Monto solicitado</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Presupuesto total (COP)', name: 'presupuesto', type: 'text', required: true, placeholder: '4.800.000.000', mask: 'money' })}
              ${textfield({ label: 'Monto solicitado al Mindeporte', name: 'monto', type: 'text', required: true, helper: `Tope: ${formatoMoneda(conv.montoMaximoProyecto)}`, mask: 'money' })}
            </div>
            ${textfield({ label: 'Contrapartida municipal (COP)', name: 'contrapartida', type: 'text', placeholder: '0 si no aplica', mask: 'money' })}
          </div>

          <!-- PASO 2 — Documentación Indispensable (RBI · Sec. 1 Res. 933)
               Revisa: rev-rbi-001 (revisor RBI dedicado). Es el primer eslabón
               del flujo de revisión secuencial. -->
          <div class="ai-step-panel" data-panel="2" hidden>
            <div class="naowee-message naowee-message--informative" role="status" style="margin-bottom:18px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon">${ICON_RBI}</span>
                <span class="naowee-message__title">Bloque 1 · Requisitos Básicos Indispensables (RBI)</span>
              </div>
              <div class="naowee-message__text">Documentos legales y de soporte presupuestal. Los valida primero el <strong>revisor RBI del Ministerio</strong>; si los aprueba, se libera la revisión del resto de bloques.</div>
            </div>
            <div class="pm-anexos-list" data-anexos-list="rbi">
              ${AREAS_RBI.map((a, idx) => `
                <details class="pm-anexo" data-anexo="${a.id}" ${idx === 0 ? 'open' : ''}>
                  <summary class="pm-anexo__head">
                    <span class="pm-anexo__icon" aria-hidden="true">${a.icon}</span>
                    <span class="pm-anexo__body">
                      <span class="pm-anexo__title">${a.label}</span>
                      <span class="pm-anexo__ref">${a.ref}</span>
                    </span>
                    <span class="pm-anexo__progress" data-progress="${a.id}">0/${a.docs.length}</span>
                    <span class="pm-anexo__chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </summary>
                  <div class="pm-anexo__panel">
                    ${a.docs.map(d => fileUpload({
                      name: `anexo-${a.id}-${d.id}`,
                      label: d.label,
                      required: d.required,
                      accept: '.pdf',
                      maxSize: 20
                    })).join('')}
                  </div>
                </details>
              `).join('')}
            </div>
          </div>

          <!-- PASO 3 — Documentación General (Sec. 2 Res. 933)
               Revisa: rev-general-001 (revisor doc general dedicado). Se activa
               cuando el RBI está aprobado. -->
          <div class="ai-step-panel" data-panel="3" hidden>
            <div class="naowee-message naowee-message--informative" role="status" style="margin-bottom:18px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon">${ICON_GENERAL}</span>
                <span class="naowee-message__title">Bloque 2 · Documentación general</span>
              </div>
              <div class="naowee-message__text">Análisis del proyecto, planeación territorial, licencias y servicios públicos. Los valida el <strong>revisor de documentación general</strong> una vez aprobado el RBI.</div>
            </div>
            <div class="pm-anexos-list" data-anexos-list="general">
              ${AREAS_GENERAL.map((a, idx) => `
                <details class="pm-anexo" data-anexo="${a.id}" ${idx === 0 ? 'open' : ''}>
                  <summary class="pm-anexo__head">
                    <span class="pm-anexo__icon" aria-hidden="true">${a.icon}</span>
                    <span class="pm-anexo__body">
                      <span class="pm-anexo__title">${a.label}</span>
                      <span class="pm-anexo__ref">${a.ref}</span>
                    </span>
                    <span class="pm-anexo__progress" data-progress="${a.id}">0/${a.docs.length}</span>
                    <span class="pm-anexo__chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </summary>
                  <div class="pm-anexo__panel">
                    ${a.docs.map(d => fileUpload({
                      name: `anexo-${a.id}-${d.id}`,
                      label: d.label,
                      required: d.required,
                      accept: '.pdf',
                      maxSize: 20
                    })).join('')}
                  </div>
                </details>
              `).join('')}
            </div>
          </div>

          <!-- PASO 4 — Documentación Técnica (Art. 3 Res. 933, 8 áreas)
               Revisan: revisores técnicos especialistas, auto-asignados por área.
               Se activan en paralelo con doc general cuando RBI está aprobado. -->
          <div class="ai-step-panel" data-panel="4" hidden>
            <div class="naowee-message naowee-message--informative" role="status" style="margin-bottom:18px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon">${ICON_TOPO}</span>
                <span class="naowee-message__title">Bloque 3 · Documentación técnica (8 áreas)</span>
              </div>
              <div class="naowee-message__text">Anexos técnicos por especialidad (Art. 3 Res. 933). Cada área es revisada por su <strong>especialista del Ministerio</strong> en paralelo, una vez aprobado el RBI.</div>
            </div>
            <div class="pm-anexos-list" data-anexos-list="tecnica">
              ${AREAS_TECNICA.map((a, idx) => `
                <details class="pm-anexo" data-anexo="${a.id}" ${idx === 0 ? 'open' : ''}>
                  <summary class="pm-anexo__head">
                    <span class="pm-anexo__icon" aria-hidden="true">${a.icon}</span>
                    <span class="pm-anexo__body">
                      <span class="pm-anexo__title">${a.label}</span>
                      <span class="pm-anexo__ref">${a.ref}</span>
                    </span>
                    <span class="pm-anexo__progress" data-progress="${a.id}">0/${a.docs.length}</span>
                    <span class="pm-anexo__chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </summary>
                  <div class="pm-anexo__panel">
                    ${a.docs.map(d => fileUpload({
                      name: `anexo-${a.id}-${d.id}`,
                      label: d.label,
                      required: d.required,
                      accept: '.pdf',
                      maxSize: 20
                    })).join('')}
                  </div>
                </details>
              `).join('')}
            </div>
          </div>

          <!-- PASO 5 — Revisar -->
          <div class="ai-step-panel" data-panel="5" hidden>
            <div class="ai-section-title">Revisar antes de enviar</div>
            <p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 18px">Verifica los datos antes de confirmar. Recibirás un radicado al enviar.</p>
            <div id="pmReviewBox"></div>
          </div>
        </form>
      </div>

      <!-- FOOTER — Volver (izq, puntas opuestas) · Continuar/Enviar (der) -->
      <div class="naowee-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="pmBtnPrev" style="display:none;margin-right:auto">${arrowLeftIcon} Volver</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="pmBtnNext">Continuar ${arrowRightIcon}</button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="pmBtnEnviar" style="display:none;background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">${sendIcon} Enviar postulación</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  /* setTimeout en vez de rAF: rAF se pausa cuando la pestaña no tiene foco
     y deja el modal con opacity 0 (invisible). setTimeout corre siempre. */
  setTimeout(() => overlay.classList.add('is-open'), 10);

  const form = overlay.querySelector('#postularForm');
  bindDropdowns(form);
  /* Checkboxes DS: sincroniza el SVG del check (HANDOFF en wizard-page) */
  mountCheckboxes(form);
  /* Multiselect DS: trigger + chips + menu con checkboxes */
  bindMultiselects(form);
  /* File uploader DS: drag-drop, progress simulado, validación accept/maxSize */
  bindFileUploads(form);
  /* Máscara numérica (miles/millones) en campos con data-mask="money" */
  bindMasksIn(form);

  /* v1.1 — Actualizar contador "X/N cargados" en cada área de anexos.
     Se llama cuando un file uploader del área cambia de estado. */
  const updateAnexoProgress = () => {
    AREAS_ANEXOS.forEach(a => {
      const total = a.docs.length;
      const cargados = a.docs.filter(d => {
        const fu = form.querySelector(`.naowee-file-uploader[data-name="anexo-${a.id}-${d.id}"]`);
        const state = fu?.dataset?.state;
        return state === 'uploaded' || state === 'confirmed';
      }).length;
      const tag = form.querySelector(`[data-progress="${a.id}"]`);
      if (tag) {
        tag.textContent = `${cargados}/${total}`;
        tag.classList.toggle('pm-anexo__progress--complete', cargados === total);
      }
    });
  };
  /* Escuchamos cambios en data-state del file uploader (lo cambia bindFileUploads). */
  const obs = new MutationObserver(updateAnexoProgress);
  form.querySelectorAll('.naowee-file-uploader[data-name^="anexo-"]').forEach(fu => {
    obs.observe(fu, { attributes: true, attributeFilter: ['data-state'] });
  });
  updateAnexoProgress();

  /* v2.0 — La entidad formuladora se hereda del perfil municipio
     logueado (perfilMun), por eso ya no hay paso "Entidad formuladora"
     ni el sync de NIT condicional. */

  /* ───── Navegación de pasos (igual a modal-activar-inversion) ───── */
  let currentStep = 1;
  const btnPrev = overlay.querySelector('#pmBtnPrev');
  const btnNext = overlay.querySelector('#pmBtnNext');
  const btnEnviar = overlay.querySelector('#pmBtnEnviar');

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(STEPS.length, n));
    overlay.querySelectorAll('.ai-step-panel').forEach(panel => {
      panel.hidden = parseInt(panel.dataset.panel) !== currentStep;
    });
    /* Stepper visual — patrón canónico: --done con SVG check + label en text-primary */
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
    /* Footer buttons — Volver (left, margin-right:auto) + Continuar/Enviar (right) */
    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    btnNext.style.display = currentStep < STEPS.length ? 'inline-flex' : 'none';
    btnEnviar.style.display = currentStep === STEPS.length ? 'inline-flex' : 'none';
    overlay.querySelector('.naowee-modal__body').scrollTop = 0;
    if (currentStep === STEPS.length) buildReview();
  }

  /* Avance libre (sin validaciones — consistente con activar-inversion) */
  /* Validación progresiva: 1er click muestra errores + wiggle + scroll,
     2do click permite avanzar igual (no entorpece la demo) */
  btnNext.addEventListener('click', () => {
    const activePanel = overlay.querySelector(`.ai-step-panel[data-panel="${currentStep}"]`);
    const valid = validateRequired(activePanel);
    if (!valid) return;
    goToStep(currentStep + 1);
  });
  btnPrev.addEventListener('click', () => goToStep(currentStep - 1));
  /* Limpia errores cuando el usuario empieza a llenar */
  bindValidationReset(form);

  /* Click en step done permite regresar */
  overlay.querySelectorAll('.naowee-stepper__step').forEach(step => {
    step.addEventListener('click', () => {
      const target = parseInt(step.dataset.step);
      if (target < currentStep) goToStep(target);
    });
  });

  /* ───── Review (paso 5) ───── */
  function buildReview() {
    const fd = new FormData(form);
    const modas = fd.getAll('modalidades');

    const bloqueProgress = (areas) => areas.map(a => {
      const cargados = a.docs.filter(d => fd.get(`anexo-${a.id}-${d.id}`)?.name).length;
      const total = a.docs.length;
      const completo = cargados === total;
      return [
        a.label,
        `<span class="naowee-badge naowee-badge--${completo ? 'positive' : 'caution'} naowee-badge--quiet">${cargados}/${total} archivos</span>`
      ];
    });

    const groups = [
      {
        title: 'Entidad formuladora',
        rows: [
          ['Tipo', perfilMun?.entidadTipo || perfilMun?.entidad || '—'],
          ['Nombre', perfilMun?.entidad || '—'],
          ['NIT', perfilMun?.nit || '—'],
          ['Departamento · Municipio', `${perfilMun?.departamento || '—'} · ${perfilMun?.municipio || '—'}`]
        ]
      },
      {
        title: 'Identificación del proyecto',
        rows: [
          ['Nombre', fd.get('nombre') || '—'],
          ['Fase', fd.get('fase') || '—'],
          ['Tipo de solicitud', fd.get('tipoSolicitud') || '—'],
          ['Tipología principal', fd.get('tipologia') || '—'],
          ['Subtipología', fd.get('subtipologia') || '<span style="color:var(--text-secondary);font-style:italic">—</span>'],
          ['Modalidades deportivas', modas.length
            ? modas.map(m => `<span class="naowee-badge naowee-badge--informative naowee-badge--quiet" style="margin-right:4px">${m}</span>`).join('')
            : '<span style="color:var(--text-secondary);font-style:italic">Ninguna seleccionada</span>']
        ]
      },
      {
        title: 'Representante legal',
        rows: [
          ['Nombre', fd.get('repNombre') || '—'],
          ['Documento', fd.get('repDoc') || '—'],
          ['Cargo', fd.get('repCargo') || '—'],
          ['Contacto', fd.get('repContacto') || '—']
        ]
      },
      {
        title: 'Monto solicitado',
        rows: [
          ['Presupuesto total', unmask(fd.get('presupuesto')) ? formatoMoneda(unmask(fd.get('presupuesto'))) : '—'],
          ['Monto solicitado', unmask(fd.get('monto')) ? `<strong style="color:var(--accent)">${formatoMoneda(unmask(fd.get('monto')))}</strong>` : '—'],
          ['Contrapartida', unmask(fd.get('contrapartida')) ? formatoMoneda(unmask(fd.get('contrapartida'))) : '—']
        ]
      },
      { title: 'Bloque 1 · RBI (Requisitos Básicos Indispensables)', rows: bloqueProgress(AREAS_RBI) },
      { title: 'Bloque 2 · Documentación general', rows: bloqueProgress(AREAS_GENERAL) },
      { title: 'Bloque 3 · Documentación técnica (8 áreas)', rows: bloqueProgress(AREAS_TECNICA) }
    ];
    overlay.querySelector('#pmReviewBox').innerHTML = renderReview(groups);
  }

  /* ───── Enviar postulación → success state ───── */
  btnEnviar.addEventListener('click', () => {
    const fd = new FormData(form);
    const numero = String(ProjectData.getProyectos().length + 1).padStart(3, '0');
    const id = `PROJ-2026-${numero}`;
    const radicado = `RAD-2026-${numero}-${conv.id}`;
    const ahora = new Date().toISOString();

    const modalidadesArr = fd.getAll('modalidades');
    /* v2.0 — La entidad formuladora se hereda del perfil municipio. */
    const nuevo = {
      idUnico: id,
      radicado,
      convocatoriaId: conv.id,
      tipo: 'Infraestructura',
      nombre: fd.get('nombre') || 'Proyecto sin nombre',
      municipio: perfilMun?.municipio || 'Quibdó',
      departamento: perfilMun?.departamento || 'Chocó',
      presupuesto: unmask(fd.get('presupuesto')) || 0,
      montoSolicitado: unmask(fd.get('monto')) || 0,
      contrapartida: unmask(fd.get('contrapartida')) || 0,
      fase: fd.get('fase') || '',
      tipoSolicitud: fd.get('tipoSolicitud') || '',
      tipologia: fd.get('tipologia') || '',
      subtipologia: fd.get('subtipologia') || '',
      modalidades: modalidadesArr,
      representante: {
        nombre: fd.get('repNombre') || '',
        documento: fd.get('repDoc') || '',
        cargo: fd.get('repCargo') || '',
        contacto: fd.get('repContacto') || ''
      },
      formuladora: {
        nombre: perfilMun?.entidad || 'Alcaldía Municipal',
        tipo: perfilMun?.entidadTipo || 'Alcaldía Municipal',
        nit: perfilMun?.nit || ''
      },
      marcadores: perfilMun?.marcadores || { zomac: false, pdet: false, ebiPnd: false },
      /* v2.0 — Inicia en `en_revision_rbi`: el revisor RBI tiene 15d hábiles
         para decidir. Si aprueba → `rbi_aprobada` y libera Doc General + áreas. */
      estado: 'en_revision_rbi',
      priorizado: !!perfilMun?.marcadores?.zomac || !!perfilMun?.marcadores?.pdet,
      /* v2.0 — Documentos en 3 bloques diferenciados (RBI/General/Técnica)
         para que el revisor de cada tipo sepa qué le toca. */
      documentos: AREAS_ANEXOS.flatMap(a =>
        a.docs.map(d => {
          const file = fd.get(`anexo-${a.id}-${d.id}`);
          return file?.name ? {
            id: `${a.id}-${d.id}`,
            area: a.id,
            bloque: a.bloque,
            nombre: d.label,
            archivo: file.name,
            size: file.size,
            subidoEn: ahora
          } : null;
        }).filter(Boolean)
      ),
      observaciones: [],
      historial: [
        { ts: ahora, actor: 'municipio', evento: 'Postulación enviada con 3 bloques de documentación', estado: 'presentado' },
        { ts: ahora, actor: 'sistema', evento: `Radicado emitido: ${radicado}`, estado: 'presentado' },
        { ts: ahora, actor: 'sistema', evento: 'Asignada al revisor RBI · plazo 15 días hábiles', estado: 'en_revision_rbi' }
      ],
      fechaPostulacion: ahora,
      fechaInicioRevisionRBI: ahora
    };

    ProjectData.addProyecto(nuevo);
    /* v2.0 — Notificar al revisor RBI (primer eslabón). Los revisores
       de Doc General y técnicos reciben notificación cuando RBI se aprueba. */
    ProjectData.pushNotificacion?.({
      perfil: 'revisor',
      revisorTipo: 'rbi',
      tipo: 'nueva',
      titulo: 'Nueva postulación · RBI por revisar',
      detalle: `${id} · ${nuevo.municipio} · ${nuevo.nombre}`
    });

    renderSuccessScreen({ nuevo, radicado });
  });

  /* ───── Success screen custom (modal-aware) ───── */
  function renderSuccessScreen({ nuevo, radicado }) {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    const stepper = overlay.querySelector('.naowee-stepper');
    const title = overlay.querySelector('.naowee-modal__title');
    const subtitle = overlay.querySelector('.naowee-modal__subtitle');

    if (stepper) stepper.style.display = 'none';
    if (title) title.textContent = 'Postulación enviada';
    if (subtitle) subtitle.textContent = `${conv.nombre} · Resolución 933 de 2024`;

    const totalAnexos = nuevo.documentos?.length || 0;
    const docsRBI     = nuevo.documentos.filter(d => d.bloque === 'rbi').length;
    const docsGeneral = nuevo.documentos.filter(d => d.bloque === 'general').length;
    const docsTecnica = nuevo.documentos.filter(d => d.bloque === 'tecnica').length;
    const notifications = [
      { label: `Radicado <strong>${radicado}</strong> emitido por el sistema`, actor: 'Sistema' },
      { label: 'Revisor RBI del Ministerio notificado', actor: 'Notificaciones' },
      { label: 'Postulación inscrita en la convocatoria', actor: conv.id },
      ...(docsRBI     ? [{ label: `<strong>${docsRBI}</strong> documentos del bloque RBI cargados`, actor: 'Bloque 1' }] : []),
      ...(docsGeneral ? [{ label: `<strong>${docsGeneral}</strong> documentos del bloque General cargados`, actor: 'Bloque 2' }] : []),
      ...(docsTecnica ? [{ label: `<strong>${docsTecnica}</strong> documentos técnicos cargados`, actor: 'Bloque 3' }] : []),
      { label: 'Ciclo de revisión RBI de 15 días hábiles iniciado', actor: 'Resolución 933' }
    ];

    body.innerHTML = `
      <div class="ai-success">
        <div class="ai-success__confetti" data-confetti></div>
        <div class="ai-success__check" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="ai-success__title">¡Postulación enviada!</h2>
        <p class="ai-success__lede">
          <strong>${nuevo.nombre}</strong> fue radicado y notificado al equipo revisor del Ministerio.
        </p>

        <div class="ai-success__stamp">
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Radicado</span>
            <span class="ai-success__stamp-value ai-success__stamp-value--mono">${radicado}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Proyecto</span>
            <span class="ai-success__stamp-value">${nuevo.idUnico}</span>
          </div>
          <div class="ai-success__stamp-row">
            <span class="ai-success__stamp-label">Enviada</span>
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

        <div class="naowee-message naowee-message--informative" role="status" style="margin-top:18px">
          <div class="naowee-message__header">
            <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
            <span class="naowee-message__title">Siguiente paso</span>
          </div>
          <div class="naowee-message__text">Tu postulación entró al ciclo de revisión de <strong>Requisitos Básicos Indispensables (RBI)</strong>. El revisor del Ministerio tiene 15 días hábiles para validarla. Si la aprueba, el equipo técnico revisará cada área en paralelo. Si la devuelve, podrás subsanar en 15 días hábiles.</div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--large" id="pmSuccessClose">
        Cerrar
      </button>
      <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="pmSuccessVer" style="background:#15803d !important;border-color:#15803d !important;box-shadow:var(--shadow-green-cta)">
        Ver mi proyecto ${arrowRightIcon}
      </button>
    `;

    footer.querySelector('#pmSuccessClose').addEventListener('click', () => {
      close();
      if (typeof onPostulado === 'function') onPostulado(nuevo);
    });
    footer.querySelector('#pmSuccessVer').addEventListener('click', () => {
      close();
      window.location.href = `proyecto-perfil.html?id=${nuevo.idUnico}&nuevo=1`;
    });

    runConfetti(body.querySelector('[data-confetti]'));
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
  /* Click fuera del modal cierra (registrado tras un tick para no capturar el click que abrió) */
  setTimeout(() => {
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }, 50);
  document.addEventListener('keydown', escListener);

  return { close };
}

export default { openPostularModal };
