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
import { textfield, dropdown, bindDropdowns, renderReview, runConfetti, checkbox, fileUpload, bindFileUploads, mountCheckboxes, multiselect, bindMultiselects, validateRequired, bindValidationReset } from './wizard-page.js';
import { bindMasksIn, unmask } from './masks.js';

const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`;
const stepperCheckIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const arrowLeftIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
const arrowRightIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
const sendIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;
const uploadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const pdfIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

const STEPS = [
  { label: 'Entidad formuladora' },
  { label: 'Datos del proyecto' },
  { label: 'Predio y financiación' },
  { label: 'Representante y carta' },
  { label: 'Revisar' }
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
          <!-- PASO 1 — Entidad formuladora (Resolución 933 Art. 5) -->
          <div class="ai-step-panel" data-panel="1">
            <div class="naowee-message naowee-message--informative" role="status" style="margin-bottom:18px">
              <div class="naowee-message__header">
                <span class="naowee-message__icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                <span class="naowee-message__title">Postulando a ${conv.id}</span>
              </div>
              <div class="naowee-message__text">Bienio ${conv.bienio} · Tope por proyecto: <strong>${formatoMoneda(conv.montoMaximoProyecto)}</strong></div>
            </div>

            <div class="ai-section-title">Entidad formuladora</div>
            <div class="ai-grid-2">
              ${dropdown({ label: 'Tipo de entidad', name: 'entidadTipo', required: true, options: entidadTipos, value: 'Alcaldía Municipal' })}
              ${textfield({ label: 'NIT (sin dígito de verificación)', name: 'entidadNit', required: true, placeholder: '891.680.014', maxlength: 15 })}
            </div>
            ${textfield({ label: 'Nombre oficial de la entidad', name: 'entidadNombre', required: true, value: perfilMun?.entidad || 'Alcaldía Municipal de ' + (perfilMun?.municipio || ''), maxlength: 200 })}

            <div class="ai-grid-2">
              ${dropdown({ label: 'Departamento', name: 'departamento', required: true, options: departamentos, value: perfilMun?.departamento || 'Chocó' })}
              ${textfield({ label: 'Municipio', name: 'municipio', required: true, value: perfilMun?.municipio || 'Quibdó', helper: 'Se obtiene del catálogo DANE' })}
            </div>

            <div class="ai-section-title">Marcadores territoriales</div>
            <p style="font-size:12.5px;color:var(--text-secondary);margin:-6px 0 12px">Marca todas las categorías que apliquen al municipio (Resolución 933 Art. 5.3).</p>
            <div class="pm-checkbox-grid">
              ${checkbox({ name: 'esZomac', value: 'true', label: 'Municipio ZOMAC' })}
              ${checkbox({ name: 'esPdet', value: 'true', label: 'Municipio PDET' })}
              ${checkbox({ name: 'enEbiPnd', value: 'true', label: 'Incluido en EBI / PND' })}
            </div>
          </div>

          <!-- PASO 2 — Datos del proyecto (técnica deportiva) -->
          <div class="ai-step-panel" data-panel="2" hidden>
            <div class="ai-section-title">Identificación del proyecto</div>
            ${textfield({ label: 'Nombre del proyecto', name: 'nombre', required: true, placeholder: 'Ej: Construcción Coliseo Cubierto Quibdó', maxlength: 200 })}
            <div class="ai-grid-2">
              ${dropdown({ label: 'Tipo de proyecto', name: 'tipo', required: true, options: ['Infraestructura'], value: 'Infraestructura' })}
              ${dropdown({ label: 'Fase', name: 'fase', required: true, options: faseOptions })}
            </div>
            <div class="ai-grid-2">
              ${dropdown({ label: 'Tipo de solicitud', name: 'tipoSolicitud', required: true, options: tipoSolicitudOptions })}
              ${dropdown({ label: 'Tipología principal (Censo)', name: 'tipologia', required: true, options: tipologias })}
            </div>
            ${textfield({ label: 'Subtipología (opcional)', name: 'subtipologia', placeholder: 'Ej: Coliseo polifuncional cubierto · cancha 28×15m' })}

            ${multiselect({
              name: 'modalidades',
              label: 'Modalidades deportivas',
              required: true,
              options: modalidadesOpciones,
              placeholder: 'Selecciona las disciplinas que se practicarán...',
              helper: 'Mínimo 1 modalidad · puedes seleccionar varias'
            })}
          </div>

          <!-- PASO 3 — Predio + Financiación -->
          <div class="ai-step-panel" data-panel="3" hidden>
            <div class="ai-section-title">Localización del predio</div>
            ${textfield({ label: 'Dirección del predio', name: 'direccion', required: true, placeholder: 'Calle 22 con Carrera 5, Barrio La Yesquita', maxlength: 250 })}
            <div class="ai-grid-3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-bottom:18px">
              ${textfield({ label: 'Latitud', name: 'lat', type: 'text', required: true, placeholder: '5.6919' })}
              ${textfield({ label: 'Longitud', name: 'lng', type: 'text', required: true, placeholder: '-76.6583' })}
              ${dropdown({ label: 'Datum', name: 'datum', required: true, options: datums, value: 'MAGNA-SIRGAS' })}
            </div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Área del predio (m²)', name: 'areaPredio', type: 'text', required: true, placeholder: '2.400', mask: 'money' })}
              ${textfield({ label: 'Aforo proyectado (personas)', name: 'aforo', type: 'text', required: true, placeholder: '1.200', mask: 'money' })}
            </div>

            <div class="ai-section-title">Financiación del proyecto</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Presupuesto total (COP)', name: 'presupuesto', type: 'text', required: true, placeholder: '4.800.000.000', mask: 'money' })}
              ${textfield({ label: 'Monto solicitado al Mindeporte', name: 'monto', type: 'text', required: true, helper: `Tope: ${formatoMoneda(conv.montoMaximoProyecto)}`, mask: 'money' })}
            </div>
            ${textfield({ label: 'Contrapartida municipal (COP)', name: 'contrapartida', type: 'text', placeholder: '0 si no aplica', mask: 'money' })}

            <div class="ai-section-title">Fuentes de cofinanciación</div>
            <p style="font-size:12.5px;color:var(--text-secondary);margin:-6px 0 12px">Selecciona al menos una fuente disponible para esta convocatoria.</p>
            <div class="pm-checkbox-grid">
              ${fuentes.map(f => checkbox({ name: 'cofinanciacion', value: f, label: f })).join('')}
            </div>
          </div>

          <!-- PASO 4 — Representante + Carta de intención -->
          <div class="ai-step-panel" data-panel="4" hidden>
            <div class="ai-section-title">Datos del representante legal</div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Nombre completo', name: 'repNombre', required: true, maxlength: 150, value: perfilMun?.nombre || '' })}
              ${textfield({ label: 'Documento de identidad', name: 'repDoc', required: true, placeholder: 'CC 11.806.443' })}
            </div>
            <div class="ai-grid-2">
              ${textfield({ label: 'Cargo', name: 'repCargo', required: true, value: perfilMun?.cargo || '' })}
              ${textfield({ label: 'Contacto', name: 'repContacto', prefix: '+57', placeholder: '311 745 2389', helper: 'Celular o teléfono fijo del representante' })}
            </div>

            <div class="ai-section-title">Carta de intención</div>
            <p style="font-size:13px;color:var(--text-secondary);margin:-4px 0 14px">PDF firmada por el representante legal. Vigencia 30 días desde la postulación.</p>
            ${fileUpload({
              name: 'carta',
              label: 'Carta de intención',
              required: true,
              accept: '.pdf',
              maxSize: 20
            })}
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
    const cofin = fd.getAll('cofinanciacion');
    const modas = fd.getAll('modalidades');
    const carta = fd.get('carta');
    const marcadores = [];
    if (fd.get('esZomac')) marcadores.push('ZOMAC');
    if (fd.get('esPdet')) marcadores.push('PDET');
    if (fd.get('enEbiPnd')) marcadores.push('EBI/PND');

    const groups = [
      {
        title: 'Entidad formuladora',
        rows: [
          ['Tipo', fd.get('entidadTipo') || '—'],
          ['Nombre', fd.get('entidadNombre') || '—'],
          ['NIT', fd.get('entidadNit') || '—'],
          ['Departamento · Municipio', `${fd.get('departamento') || '—'} · ${fd.get('municipio') || '—'}`],
          ['Marcadores', marcadores.length
            ? marcadores.map(m => `<span class="naowee-badge naowee-badge--accent naowee-badge--quiet" style="margin-right:4px">${m}</span>`).join('')
            : '<span style="color:var(--text-secondary);font-style:italic">Sin marcadores especiales</span>']
        ]
      },
      {
        title: 'Datos del proyecto',
        rows: [
          ['Nombre', fd.get('nombre') || '—'],
          ['Tipo · Fase', `${fd.get('tipo') || '—'} · ${fd.get('fase') || '—'}`],
          ['Tipo de solicitud', fd.get('tipoSolicitud') || '—'],
          ['Tipología principal', fd.get('tipologia') || '—'],
          ['Subtipología', fd.get('subtipologia') || '<span style="color:var(--text-secondary);font-style:italic">—</span>'],
          ['Modalidades deportivas', modas.length
            ? modas.map(m => `<span class="naowee-badge naowee-badge--informative naowee-badge--quiet" style="margin-right:4px">${m}</span>`).join('')
            : '<span style="color:var(--text-secondary);font-style:italic">Ninguna seleccionada</span>']
        ]
      },
      {
        title: 'Predio y características',
        rows: [
          ['Dirección', fd.get('direccion') || '—'],
          ['Coordenadas', (fd.get('lat') || fd.get('lng')) ? `${fd.get('lat') || '—'}, ${fd.get('lng') || '—'} · <small>${fd.get('datum') || 'MAGNA-SIRGAS'}</small>` : '—'],
          ['Área del predio', unmask(fd.get('areaPredio')) ? `${unmask(fd.get('areaPredio')).toLocaleString('es-CO')} m²` : '—'],
          ['Aforo proyectado', unmask(fd.get('aforo')) ? `${unmask(fd.get('aforo')).toLocaleString('es-CO')} personas` : '—']
        ]
      },
      {
        title: 'Financiación',
        rows: [
          ['Presupuesto total', unmask(fd.get('presupuesto')) ? formatoMoneda(unmask(fd.get('presupuesto'))) : '—'],
          ['Monto solicitado', unmask(fd.get('monto')) ? `<strong style="color:var(--accent)">${formatoMoneda(unmask(fd.get('monto')))}</strong>` : '—'],
          ['Contrapartida', unmask(fd.get('contrapartida')) ? formatoMoneda(unmask(fd.get('contrapartida'))) : '—'],
          ['Fuentes', cofin.length
            ? cofin.map(f => `<span class="naowee-badge naowee-badge--informative naowee-badge--quiet" style="margin-right:4px">${f}</span>`).join('')
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
        title: 'Carta de intención',
        rows: [
          ['Archivo', carta?.name
            ? `<span style="display:inline-flex;align-items:center;gap:6px"><span style="color:var(--accent)">${pdfIcon}</span> ${carta.name} · ${(carta.size/1024).toFixed(0)} KB</span>`
            : '<span style="color:var(--text-secondary);font-style:italic">No adjunta</span>']
        ]
      }
    ];
    overlay.querySelector('#pmReviewBox').innerHTML = renderReview(groups);
  }

  /* ───── Enviar postulación → success state ───── */
  btnEnviar.addEventListener('click', () => {
    const fd = new FormData(form);
    const cofin = fd.getAll('cofinanciacion');
    const numero = String(ProjectData.getProyectos().length + 1).padStart(3, '0');
    const id = `PROJ-2026-${numero}`;
    const radicado = `RAD-2026-${numero}-${conv.id}`;
    const ahora = new Date().toISOString();
    const cartaFile = fd.get('carta');

    const modalidadesArr = fd.getAll('modalidades');
    const nuevo = {
      idUnico: id,
      radicado,
      convocatoriaId: conv.id,
      tipo: fd.get('tipo') || 'Infraestructura',
      nombre: fd.get('nombre') || 'Proyecto sin nombre',
      municipio: fd.get('municipio') || 'Quibdó',
      departamento: fd.get('departamento') || 'Chocó',
      direccionPredio: fd.get('direccion') || '',
      coordenadas: {
        lat: parseFloat(fd.get('lat')) || null,
        lng: parseFloat(fd.get('lng')) || null,
        datum: fd.get('datum') || 'MAGNA-SIRGAS'
      },
      /* Características del predio y aforo (Res. 933 Art. 5 / Censo) */
      areaPredio: unmask(fd.get('areaPredio')) || null,
      aforo: unmask(fd.get('aforo')) || null,
      presupuesto: unmask(fd.get('presupuesto')) || 0,
      montoSolicitado: unmask(fd.get('monto')) || 0,
      contrapartida: unmask(fd.get('contrapartida')) || 0,
      cofinanciacion: cofin,
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
        nombre: fd.get('entidadNombre') || perfilMun?.entidad || 'Alcaldía Municipal',
        tipo: fd.get('entidadTipo') || 'Alcaldía Municipal',
        nit: fd.get('entidadNit') || ''
      },
      /* Marcadores territoriales (Art. 5.3) */
      marcadores: {
        zomac: !!fd.get('esZomac'),
        pdet: !!fd.get('esPdet'),
        ebiPnd: !!fd.get('enEbiPnd')
      },
      estado: 'presentado',
      priorizado: !!fd.get('esZomac') || !!fd.get('esPdet'),
      cartaIntencion: cartaFile?.name ? { name: cartaFile.name, size: cartaFile.size } : null,
      observaciones: [],
      historial: [
        { ts: ahora, actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: ahora, actor: 'sistema', evento: `Radicado emitido: ${radicado}`, estado: 'presentado' }
      ],
      fechaPostulacion: ahora
    };

    ProjectData.addProyecto(nuevo);
    ProjectData.pushNotificacion?.({
      perfil: 'revisor',
      tipo: 'nueva',
      titulo: 'Nueva postulación recibida',
      detalle: `${id} · ${nuevo.municipio} · ${nuevo.nombre}`
    });

    renderSuccessScreen({ nuevo, radicado, cartaFile });
  });

  /* ───── Success screen custom (modal-aware) ───── */
  function renderSuccessScreen({ nuevo, radicado, cartaFile }) {
    const body = overlay.querySelector('.naowee-modal__body');
    const footer = overlay.querySelector('.naowee-modal__footer');
    const stepper = overlay.querySelector('.naowee-stepper');
    const title = overlay.querySelector('.naowee-modal__title');
    const subtitle = overlay.querySelector('.naowee-modal__subtitle');

    if (stepper) stepper.style.display = 'none';
    if (title) title.textContent = 'Postulación enviada';
    if (subtitle) subtitle.textContent = `${conv.nombre} · Resolución 933 de 2024`;

    const notifications = [
      { label: `Radicado <strong>${radicado}</strong> emitido por el sistema`, actor: 'Sistema' },
      { label: 'Equipo revisor del Ministerio notificado', actor: 'Notificaciones' },
      { label: 'Postulación inscrita en la convocatoria',                actor: conv.id },
      ...(cartaFile?.name ? [{ label: `Carta de intención <strong>${cartaFile.name}</strong> adjuntada`, actor: 'Documentos' }] : []),
      { label: 'Ciclo de revisión inicial de 30 días hábiles iniciado',  actor: 'Resolución 933' }
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

        <div class="ai-success__next">
          <div class="ai-success__next-title">Siguiente paso</div>
          <p class="ai-success__next-text">
            Tu postulación entró al ciclo de revisión inicial. Recibirás novedades en tu panel y por correo cuando el revisor emita concepto preliminar (favorable, devuelta a subsanación o rechazada).
          </p>
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
