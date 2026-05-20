/* ═══════════════════════════════════════════════════════════════════
   modal-registro-escenario.js — Modal de registro SUID (pre-validación)
   ═══════════════════════════════════════════════════════════════════

   Copia EXACTA del modal #regModalOverlay del módulo escenarios
   (https://naowee-tech.github.io/naowee-test-escenarios/escenario-08-
   dashboard.html?mode=single — "Datos de pre-validación"), adaptada
   al contexto project: el copy habla de "escenario del proyecto" en
   lugar de "sede o escenario", el ID del proyecto se muestra en el
   header, y el submit persiste en p.inversion.suidEscenario.

   Reemplaza completamente al wizard modal-suid.js (3 pasos) por este
   modal de 1 paso que cubre: datos básicos + georreferenciación.

   Dependencias:
   - Leaflet 1.9.4 (CDN auto-load)
   - shared/colombia-municipios.js (loaded via <script>)
   - shared/data.js (para persistir el resultado)

   API: openRegistroEscenarioModal({ proyectoId, onCompleted })
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
/* Doug 19/05/2026: usar import.meta.url para que el src del <script>
   resuelva relativo al MODULO (siempre /shared/) y no a la pagina que
   lo importa (puede ser /admin/, /municipio/, etc.). Sin esto, el
   script.src queda como /admin/colombia-municipios.js -> 404 ->
   setInterval polling infinito -> modal nunca abre. */
const MUNI_JS = new URL('./colombia-municipios.js', import.meta.url).href;

/* Estado del modal (singleton, se resetea en cada apertura) */
const regState = {
  proyectoId: null,
  /* Paso 1: Datos basicos + Georreferenciacion */
  nombre: '',
  departamento: '',
  municipio: '',
  catastral: '',
  catastralState: 'empty', // 'empty' | 'valid' | 'duplicate'
  lat: null,
  lon: null,
  direccion: '',
  corregimiento: '',
  zona: '',
  /* Paso 2: Detalles fisicos + disciplinas */
  tipoEscenario: '',
  area: '',
  capacidad: '',
  disciplinas: [],
  estadoFisico: '',
  descripcion: '',
  /* Wizard state */
  currentStep: 1,
  totalSteps: 2
};

/* Tipos de escenario y disciplinas (catalogo) */
const TIPOS_ESCENARIO = [
  'Polideportivo', 'Coliseo', 'Cancha de futbol', 'Cancha multiple',
  'Piscina', 'Pista atletica', 'Gimnasio', 'Patinodromo',
  'Velodromo', 'Cancha de tenis', 'Otro'
];
const DISCIPLINAS_CATALOGO = [
  'Futbol', 'Baloncesto', 'Voleibol', 'Microfutbol', 'Tenis',
  'Natacion', 'Atletismo', 'Ciclismo', 'Patinaje', 'Boxeo',
  'Lucha', 'Gimnasia', 'Levantamiento de pesas', 'Esgrima'
];
const ESTADOS_FISICO = ['Excelente', 'Bueno', 'Regular', 'Deficiente'];

/* localStorage draft helpers */
const DRAFT_KEY_PREFIX = 'naowee.escenario.draft.';
const DRAFT_FIELDS = [
  'nombre', 'departamento', 'municipio', 'catastral',
  'lat', 'lon', 'direccion', 'corregimiento', 'zona',
  'tipoEscenario', 'area', 'capacidad', 'disciplinas',
  'estadoFisico', 'descripcion', 'currentStep'
];
let saveDraftTimer = null;
function saveDraft() {
  if (!regState.proyectoId) return;
  clearTimeout(saveDraftTimer);
  saveDraftTimer = setTimeout(() => {
    try {
      const payload = { savedAt: new Date().toISOString() };
      DRAFT_FIELDS.forEach(k => { payload[k] = regState[k]; });
      localStorage.setItem(DRAFT_KEY_PREFIX + regState.proyectoId, JSON.stringify(payload));
    } catch (e) { /* silent */ }
  }, 350);
}
function loadDraft(proyectoId) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + proyectoId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearDraft(proyectoId) {
  try { localStorage.removeItem(DRAFT_KEY_PREFIX + proyectoId); } catch (e) { /* silent */ }
}
function formatDraftDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch (e) { return ''; }
}

let mapInstance = null;
let markerInstance = null;
let pickMode = false;
let leafletLoaded = false;

/* ─── DEPENDENCIES LOADER (Leaflet + colombia-municipios) ─── */
function loadDependencies() {
  return new Promise(resolve => {
    /* Leaflet CSS */
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    /* Colombia municipios */
    const muniReady = () => typeof window.COLOMBIA_MUNICIPIOS !== 'undefined';
    if (!muniReady()) {
      const muniScript = document.createElement('script');
      muniScript.src = MUNI_JS;
      document.head.appendChild(muniScript);
    }
    /* Leaflet JS */
    if (typeof L === 'undefined') {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.onload = () => {
        leafletLoaded = true;
        /* Wait for muni dataset too */
        const wait = setInterval(() => {
          if (muniReady()) { clearInterval(wait); resolve(); }
        }, 50);
      };
      document.head.appendChild(script);
    } else {
      leafletLoaded = true;
      const wait = setInterval(() => {
        if (muniReady()) { clearInterval(wait); resolve(); }
      }, 50);
    }
  });
}

/* ─── CSS scoped (.reg-modal-*) — copia exacta de escenarios ─── */
function injectStyles() {
  if (document.getElementById('regModalEscenarioStyle')) return;
  const style = document.createElement('style');
  style.id = 'regModalEscenarioStyle';
  style.textContent = `
.reg-modal-overlay {
  position: fixed; inset: 0; z-index: 1500;
  background: rgba(0, 43, 91, .45);
  backdrop-filter: blur(2px);
  display: none; align-items: center; justify-content: center;
  padding: 24px;
  animation: regFade .25s ease;
}
.reg-modal-overlay.open { display: flex; }
@keyframes regFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes wiggle {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
.field-error-wiggle { animation: wiggle .4s ease; }

.reg-modal {
  width: 680px; max-width: calc(100vw - 48px); max-height: calc(100vh - 48px);
  background: #fff; border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0,0,0,.25);
  display: flex; flex-direction: column;
  animation: regScale .35s cubic-bezier(.175,.885,.32,1.275);
  overflow: hidden;
}
@keyframes regScale { from { opacity: 0; } to { opacity: 1; } }

.reg-modal__header {
  flex-shrink: 0; padding: 24px;
  display: flex; gap: 16px; align-items: flex-start;
  border-bottom: 1px solid #d0d4e6;
  background: #fff; position: relative; z-index: 2;
}
.reg-modal__titles {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.reg-modal__step {
  font-size: 14px; font-weight: 400; line-height: 18px;
  color: var(--text-secondary);
}
.reg-modal__title {
  font-size: 20px; font-weight: 700; line-height: 24px;
  color: var(--text-primary); margin: 0;
}
.reg-modal__subtitle {
  font-size: 14px; font-weight: 400; line-height: 20px;
  color: var(--text-secondary); margin: 0;
}
.reg-modal__id-chip {
  display: inline-block; margin-top: 2px;
  font-size: 14px; font-weight: 400; line-height: 20px;
  color: #006aff;
}
.reg-modal__id-chip strong { color: #002b5b; font-weight: 600; }
.reg-modal__dismiss {
  flex-shrink: 0; width: 32px; height: 32px;
  border: none; background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-primary); border-radius: 8px;
  transition: background .15s;
}
.reg-modal__dismiss:hover { background: #f4f5f9; }
.reg-modal__dismiss svg { width: 20px; height: 20px; }

.reg-modal__body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 16px;
  scroll-behavior: smooth;
}
.reg-modal__body::-webkit-scrollbar { width: 8px; }
.reg-modal__body::-webkit-scrollbar-thumb { background: #d0d4e6; border-radius: 4px; }
.reg-modal__body::-webkit-scrollbar-thumb:hover { background: #8788ab; }

.reg-section__title {
  font-size: 11px; font-weight: 700; line-height: 16px; letter-spacing: .4px;
  color: #9ca0b8; text-transform: uppercase;
  margin: 0; padding: 0; border: none;
}

.reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.reg-row > * { min-width: 0; }

.reg-map-wrap {
  position: relative; width: 100%; height: 220px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border);
}
#regMap { width: 100%; height: 100%; background: #f5f6fa; }
.reg-map-wrap .leaflet-tile {
  filter: saturate(0.6) brightness(1.06) contrast(0.95);
}
.reg-map-fs {
  position: absolute; top: 12px; right: 12px; z-index: 500;
  width: 32px; height: 32px; border-radius: 8px;
  background: #fff; border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 2px 6px rgba(40,40,52,.1);
  transition: background .15s;
}
.reg-map-fs:hover { background: #f5f6fa; }
.reg-map-fs svg { width: 16px; height: 16px; color: var(--accent); }

.reg-map-actions { display: flex; gap: 12px; }
.reg-map-actions .naowee-btn { flex: 1; }
.geo-marker { background: transparent; border: none; }

.reg-geofield { display: flex; flex-direction: column; width: 100%; }
.reg-geofield__label {
  display: flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 400; line-height: 18px;
  color: var(--text-primary); padding-bottom: 6px;
}
.reg-geofield__label .req { color: var(--accent); margin-left: 2px; }
.reg-geofield__tooltip {
  position: relative; width: 16px; height: 16px; margin-left: 2px;
  color: var(--accent); cursor: help;
  display: flex; align-items: center; justify-content: center;
}
.reg-geofield__tooltip svg { width: 16px; height: 16px; }
.reg-geofield__tooltip-content {
  position: absolute; bottom: calc(100% + 8px); left: 50%;
  transform: translateX(-50%);
  background: #282834; color: #fff;
  font-size: 12px; font-weight: 400; line-height: 16px;
  padding: 8px 10px; border-radius: 6px; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity .15s;
  z-index: 30;
}
.reg-geofield__tooltip-content::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #282834;
}
.reg-geofield__tooltip:hover .reg-geofield__tooltip-content { opacity: 1; }
.reg-geofield__input {
  height: 48px; padding: 0 12px;
  background: #fff; border: 1px solid #8788ab;
  border-radius: 12px;
  font: 400 14px/18px 'Inter', sans-serif;
  color: var(--text-primary);
  width: 100%; outline: none;
  text-align: right; font-variant-numeric: tabular-nums;
  transition: border-color .15s, box-shadow .15s;
}
.reg-geofield__input:focus { border-color: var(--accent); border-width: 2px; padding: 0 11px; }
.reg-geofield__input::placeholder { color: var(--text-secondary); }

.reg-helper {
  display: flex; gap: 6px; align-items: flex-start;
  padding-top: 0;
}
.reg-helper__badge {
  flex-shrink: 0; width: 12px; height: 12px; border-radius: 50%;
  background: #006aff; color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin-top: 4px;
}
.reg-helper__badge svg { width: 8px; height: 8px; }
.reg-helper__text {
  flex: 1; font-size: 12px; line-height: 16px; color: var(--text-secondary);
}
.reg-helper__text strong { display: block; margin-bottom: 4px; font-weight: 400; color: var(--text-primary); }
.reg-helper__text a { color: #006aff; text-decoration: underline; }

.reg-modal .naowee-textfield { width: 100%; }
.reg-modal .naowee-dropdown { width: 100%; position: relative; z-index: 1; }
.reg-modal .naowee-dropdown--open { z-index: 2000; }
.reg-modal .naowee-dropdown__menu { z-index: 2001; }
.reg-modal .naowee-dropdown__trigger {
  border-color: var(--naowee-color-gray-600, #8788ab);
}
.reg-modal .naowee-dropdown__trigger:hover {
  border-color: var(--naowee-color-gray-700, #646587);
}
.reg-modal .naowee-dropdown--open .naowee-dropdown__trigger {
  border-color: var(--accent) !important;
  border-width: 2px;
}
.reg-modal .leaflet-top,
.reg-modal .leaflet-bottom { z-index: 400; }

.reg-modal__footer {
  flex-shrink: 0; padding: 16px 24px;
  border-top: 1px solid #d0d4e6;
  background: #fff; position: relative; z-index: 2;
  display: flex; gap: 12px;
}
.reg-modal__footer .naowee-btn {
  flex: 1; height: 48px; border-radius: 12px;
  font-size: 16px; font-weight: 500;
}
/* Boton "Atras" del paso 2 — ghost variant */
.reg-modal__footer .reg-back-btn {
  flex: 0 0 auto; min-width: 120px;
  background: #fff !important; color: #282834 !important;
  border: 1px solid #d0d4e6 !important;
}
.reg-modal__footer .reg-back-btn:hover {
  background: #f5f6fa !important;
}

/* ── Helper error inline debajo de cada campo ── */
.reg-field-helper {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px;
  font-size: 13px; line-height: 1.4; font-weight: 500;
  color: #d33e3e;
  animation: regHelperFadeIn .18s cubic-bezier(.4,0,.2,1) both;
}
/* CRITICAL: el atributo HTML 'hidden' debe vencer al display:flex */
.reg-field-helper[hidden] { display: none !important; }
.reg-field-helper svg {
  flex-shrink: 0; width: 16px; height: 16px;
  color: #d33e3e;
}
@keyframes regHelperFadeIn {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Step container: gap vertical entre filas/campos ── */
.reg-step {
  display: flex; flex-direction: column; gap: 16px;
}
.reg-step[hidden] { display: none !important; }

/* ── Banner de borrador recuperado ── */
.reg-draft-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; margin: 0 0 18px 0;
  background: #eef5ff; border: 1px solid #cfe1f7;
  border-radius: 8px;
  font-size: 13px; color: #1f78d1;
}
.reg-draft-banner svg {
  flex-shrink: 0; width: 18px; height: 18px; color: #1f78d1;
}
.reg-draft-banner__text { flex: 1; }
.reg-draft-banner__text strong { color: #282834; font-weight: 600; }
.reg-draft-banner button {
  background: transparent; border: none; cursor: pointer;
  color: #1f78d1; font-size: 12px; font-weight: 600;
  padding: 4px 10px; border-radius: 6px;
}
.reg-draft-banner button:hover { background: rgba(31,120,209,.1); }

/* ── Step indicator pill ── */
.reg-modal__step-progress {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px;
}
.reg-modal__step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #d0d4e6; transition: background .2s ease;
}
.reg-modal__step-dot.is-active { background: var(--accent, #d74009); }
.reg-modal__step-dot.is-done { background: #1f8923; }

/* ── Paso 2: Disciplinas multi-select pills ── */
.reg-disciplinas-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 6px;
}
.reg-disciplina-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: #fff; border: 1.5px solid #d0d4e6;
  border-radius: 9999px;
  font-size: 13px; font-weight: 500; color: #282834;
  cursor: pointer; transition: all .12s ease;
  user-select: none;
}
.reg-disciplina-pill:hover { border-color: var(--accent, #d74009); }
.reg-disciplina-pill.is-selected {
  background: #fff3e6; border-color: var(--accent, #d74009);
  color: var(--accent, #d74009);
}
.reg-disciplina-pill.is-selected::before {
  content: ""; width: 14px; height: 14px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d74009' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>") center/contain no-repeat;
}

/* ── Textarea para descripcion ── */
.reg-textarea {
  width: 100%; min-height: 90px;
  padding: 10px 12px;
  border: 1px solid #d0d4e6; border-radius: 8px;
  font-family: inherit; font-size: 14px;
  color: #282834; background: #fff;
  resize: vertical;
  transition: border-color .12s ease, box-shadow .12s ease;
}
.reg-textarea:focus {
  outline: none;
  border-color: var(--accent, #d74009);
  box-shadow: 0 0 0 3px rgba(215,64,9,.15);
}
.reg-textarea--error {
  border-color: #d33e3e;
  box-shadow: 0 0 0 3px rgba(211,62,62,.12);
}
  `;
  document.head.appendChild(style);
}

/* ─── HELPERS ─── */
function escape(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function clearFieldError(el) { if (el) el.classList.remove('naowee-textfield--error', 'naowee-dropdown--error'); }

/* ─── MARKUP del modal ─── */
function buildModalHTML(proyecto) {
  const proyectoChip = proyecto
    ? `<span class="reg-modal__id-chip">Proyecto: <strong>${escape(proyecto.idUnico)}</strong></span>`
    : '';
  return `
    <div class="reg-modal" role="document">
      <!-- Header sticky -->
      <div class="reg-modal__header">
        <div class="reg-modal__titles">
          <span class="reg-modal__step">Paso <span id="regStepCurrent">1</span> de 2</span>
          <h2 class="reg-modal__title" id="regModalTitle">Registrar escenario del proyecto</h2>
          <p class="reg-modal__subtitle" id="regModalSubtitle">Completa la información requerida para registrar el escenario del proyecto en el sistema SUID.</p>
          ${proyectoChip}
          <div class="reg-modal__step-progress" aria-label="Progreso del wizard">
            <span class="reg-modal__step-dot is-active" data-step-dot="1"></span>
            <span class="reg-modal__step-dot" data-step-dot="2"></span>
          </div>
        </div>
        <button type="button" class="reg-modal__dismiss" data-close aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Body scrollable -->
      <div class="reg-modal__body">

        <!-- Banner de borrador recuperado (hidden hasta loadDraft) -->
        <div class="reg-draft-banner" id="regDraftBanner" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 12 11 12"/></svg>
          <div class="reg-draft-banner__text">
            Recuperaste un borrador del <strong id="regDraftDate"></strong>. Continúa donde lo dejaste o reinicia para empezar desde cero.
          </div>
          <button type="button" id="regDraftDiscard">Descartar borrador</button>
        </div>

        <!-- ════════ PASO 1: Datos básicos + Georreferenciación ════════ -->
        <div class="reg-step" data-step="1">

        <h3 class="reg-section__title">DATOS BÁSICOS</h3>

        <!-- Nombre del escenario -->
        <div class="naowee-textfield" id="regFldNombre">
          <label class="naowee-textfield__label naowee-textfield__label--required" for="regNombre">Nombre del escenario</label>
          <div class="naowee-textfield__input-wrap">
            <input type="text" id="regNombre" class="naowee-textfield__input" placeholder="Centro deportivo Prado" minlength="5" autocomplete="off"/>
          </div>
          <div class="reg-field-helper" id="regHlpNombre" hidden>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
            <span></span>
          </div>
        </div>

        <!-- Row: Departamento + Municipio -->
        <div class="reg-row">
          <div class="naowee-dropdown" id="regDepartamentoDD">
            <label class="naowee-dropdown__label" for="regDepTrigger">Departamento <span style="color:var(--accent,#d74009)">*</span></label>
            <button type="button" class="naowee-dropdown__trigger" id="regDepTrigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="naowee-dropdown__placeholder" id="regDepValue">Selecciona departamento</span>
              <span class="naowee-dropdown__controls">
                <span class="naowee-dropdown__chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </span>
            </button>
            <div class="naowee-dropdown__menu" role="listbox" id="regDepMenu" style="max-height: 280px; overflow-y: auto;"></div>
            <div class="reg-field-helper" id="regHlpDepartamento" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>

          <div class="naowee-dropdown naowee-dropdown--disabled" id="regMunicipioDD">
            <label class="naowee-dropdown__label" for="regMpioTrigger">Municipio <span style="color:var(--accent,#d74009)">*</span></label>
            <button type="button" class="naowee-dropdown__trigger" id="regMpioTrigger" aria-haspopup="listbox" aria-expanded="false" disabled>
              <span class="naowee-dropdown__placeholder" id="regMpioValue">Selecciona municipio</span>
              <span class="naowee-dropdown__controls">
                <span class="naowee-dropdown__chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </span>
            </button>
            <div class="naowee-dropdown__menu" role="listbox" id="regMpioMenu" style="max-height: 280px; overflow-y: auto;"></div>
            <div class="reg-field-helper" id="regHlpMunicipio" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>
        </div>

        <!-- Número de registro catastral -->
        <div class="naowee-textfield" id="regFldCatastral">
          <label class="naowee-textfield__label naowee-textfield__label--required" for="regCatastral">Número de registro catastral</label>
          <div class="naowee-textfield__input-wrap">
            <input type="text" id="regCatastral" class="naowee-textfield__input" placeholder="080010101000000010901900000012" inputmode="numeric" pattern="[0-9]*" autocomplete="off"/>
          </div>
          <div class="reg-field-helper" id="regHlpCatastral" hidden>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
            <span></span>
          </div>
        </div>

        <!-- Catastral duplicate error block removed — backend will validate -->

        <h3 class="reg-section__title">GEORREFERENCIACIÓN</h3>

        <!-- Leaflet Map -->
        <div class="reg-map-wrap">
          <div id="regMap"></div>
          <button type="button" class="reg-map-fs" id="regBtnFullscreen" aria-label="Pantalla completa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        </div>

        <!-- Map action buttons -->
        <div class="reg-map-actions">
          <button type="button" class="naowee-btn naowee-btn--quiet naowee-btn--small" id="regBtnMyLocation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v5M9 13l-2 8M15 13l2 8M9 10h6"/></svg>
            Marcar mi ubicación actual
          </button>
          <button type="button" class="naowee-btn naowee-btn--quiet naowee-btn--small" id="regBtnClickMap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
            Ubicarme en el mapa
          </button>
        </div>

        <!-- Lat + Lon row -->
        <div class="reg-row">
          <div class="reg-geofield">
            <label class="reg-geofield__label" for="regLat">
              Latitud<span class="req">*</span>
              <span class="reg-geofield__tooltip">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M6 6a2 2 0 0 1 4 0c0 1.5-2 2-2 3M8 11v.5" stroke-linecap="round"/></svg>
                <span class="reg-geofield__tooltip-content">Formato decimal. Rango Colombia: -4.23 a 12.53</span>
              </span>
            </label>
            <input type="text" id="regLat" class="reg-geofield__input" placeholder="0.0000" inputmode="decimal" autocomplete="off"/>
          </div>
          <div class="reg-geofield">
            <label class="reg-geofield__label" for="regLon">
              Longitud<span class="req">*</span>
              <span class="reg-geofield__tooltip">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M6 6a2 2 0 0 1 4 0c0 1.5-2 2-2 3M8 11v.5" stroke-linecap="round"/></svg>
                <span class="reg-geofield__tooltip-content">Formato decimal. Rango Colombia: -81.73 a -66.87</span>
              </span>
            </label>
            <input type="text" id="regLon" class="reg-geofield__input" placeholder="0.0000" inputmode="decimal" autocomplete="off"/>
          </div>
        </div>
        <div class="reg-field-helper" id="regHlpCoords" hidden style="margin-top:-8px;margin-bottom:8px">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          <span></span>
        </div>

        <!-- Informative helper: Google Maps link -->
        <div class="reg-helper">
          <span class="reg-helper__badge"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="4" x2="6" y2="6"/><line x1="6" y1="8" x2="6" y2="8.01"/></svg></span>
          <div class="reg-helper__text">
            <strong>¿Cómo obtener coordenadas desde Google Maps?</strong>
            Para el registro manual puede dirigirse a <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Maps.</a> Ubique el marcador en la ubicación correspondiente, haga clic derecho sobre el icono y seleccione la primera opción.
          </div>
        </div>

        <!-- Dirección -->
        <div class="naowee-textfield" id="regFldDireccion">
          <label class="naowee-textfield__label naowee-textfield__label--required" for="regDireccion">Dirección del escenario</label>
          <div class="naowee-textfield__input-wrap">
            <input type="text" id="regDireccion" class="naowee-textfield__input" placeholder="Cl. 6 #No. 16-95, Salgar" minlength="5" maxlength="200" autocomplete="street-address"/>
          </div>
          <div class="reg-field-helper" id="regHlpDireccion" hidden>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
            <span></span>
          </div>
        </div>

        <!-- Corregimiento + Zona row -->
        <div class="reg-row">
          <div class="naowee-textfield" id="regFldCorregimiento">
            <label class="naowee-textfield__label" for="regCorregimiento">Corregimiento/Vereda/Barrio</label>
            <div class="naowee-textfield__input-wrap">
              <input type="text" id="regCorregimiento" class="naowee-textfield__input" placeholder="Ej: Salgar" maxlength="100" autocomplete="off"/>
            </div>
          </div>

          <div class="naowee-dropdown" id="regZonaDD">
            <label class="naowee-dropdown__label" for="regZonaTrigger">Zona <span style="color:var(--accent,#d74009)">*</span></label>
            <button type="button" class="naowee-dropdown__trigger" id="regZonaTrigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="naowee-dropdown__placeholder" id="regZonaValue">Selecciona</span>
              <span class="naowee-dropdown__controls">
                <span class="naowee-dropdown__chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </span>
            </button>
            <div class="naowee-dropdown__menu" role="listbox" id="regZonaMenu"></div>
            <div class="reg-field-helper" id="regHlpZona" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>
        </div>

        </div><!-- /paso 1 -->

        <!-- ════════ PASO 2: Detalles físicos + Disciplinas ════════ -->
        <div class="reg-step" data-step="2" hidden>

          <h3 class="reg-section__title">CARACTERÍSTICAS FÍSICAS</h3>

          <!-- Tipo de escenario -->
          <div class="naowee-dropdown" id="regTipoDD">
            <label class="naowee-dropdown__label" for="regTipoTrigger">Tipo de escenario <span style="color:var(--accent,#d74009)">*</span></label>
            <button type="button" class="naowee-dropdown__trigger" id="regTipoTrigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="naowee-dropdown__placeholder" id="regTipoValue">Selecciona el tipo</span>
              <span class="naowee-dropdown__controls">
                <span class="naowee-dropdown__chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </span>
            </button>
            <div class="naowee-dropdown__menu" role="listbox" id="regTipoMenu" style="max-height: 280px; overflow-y: auto;"></div>
            <div class="reg-field-helper" id="regHlpTipo" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>

          <!-- Area + Capacidad -->
          <div class="reg-row">
            <div class="naowee-textfield" id="regFldArea">
              <label class="naowee-textfield__label naowee-textfield__label--required" for="regArea">Área construida (m²)</label>
              <div class="naowee-textfield__input-wrap">
                <input type="number" id="regArea" class="naowee-textfield__input" placeholder="2500" min="1" max="999999" inputmode="numeric" autocomplete="off"/>
              </div>
              <div class="reg-field-helper" id="regHlpArea" hidden>
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
                <span></span>
              </div>
            </div>
            <div class="naowee-textfield" id="regFldCapacidad">
              <label class="naowee-textfield__label naowee-textfield__label--required" for="regCapacidad">Capacidad de espectadores</label>
              <div class="naowee-textfield__input-wrap">
                <input type="number" id="regCapacidad" class="naowee-textfield__input" placeholder="500" min="1" max="999999" inputmode="numeric" autocomplete="off"/>
              </div>
              <div class="reg-field-helper" id="regHlpCapacidad" hidden>
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
                <span></span>
              </div>
            </div>
          </div>

          <!-- Estado físico -->
          <div class="naowee-dropdown" id="regEstadoDD">
            <label class="naowee-dropdown__label" for="regEstadoTrigger">Estado físico actual <span style="color:var(--accent,#d74009)">*</span></label>
            <button type="button" class="naowee-dropdown__trigger" id="regEstadoTrigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="naowee-dropdown__placeholder" id="regEstadoValue">Selecciona</span>
              <span class="naowee-dropdown__controls">
                <span class="naowee-dropdown__chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </span>
            </button>
            <div class="naowee-dropdown__menu" role="listbox" id="regEstadoMenu"></div>
            <div class="reg-field-helper" id="regHlpEstado" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>

          <h3 class="reg-section__title">DISCIPLINAS DEPORTIVAS</h3>

          <!-- Disciplinas multi-select -->
          <div class="naowee-textfield" id="regFldDisciplinas">
            <label class="naowee-textfield__label naowee-textfield__label--required">Disciplinas que se practican</label>
            <div class="reg-disciplinas-grid" id="regDisciplinasGrid"></div>
            <div class="reg-field-helper" id="regHlpDisciplinas" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>

          <h3 class="reg-section__title">DESCRIPCIÓN</h3>

          <!-- Descripcion textarea -->
          <div class="naowee-textfield" id="regFldDescripcion">
            <label class="naowee-textfield__label" for="regDescripcion">Observaciones (opcional)</label>
            <textarea id="regDescripcion" class="reg-textarea" placeholder="Características adicionales del escenario, condiciones especiales, restricciones de uso, etc." maxlength="500"></textarea>
            <div class="reg-field-helper" id="regHlpDescripcion" hidden>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M4.5 8h7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              <span></span>
            </div>
          </div>

        </div><!-- /paso 2 -->

      </div>

      <!-- Footer sticky -->
      <div class="reg-modal__footer">
        <button type="button" class="naowee-btn naowee-btn--large reg-back-btn" id="regBackBtn" hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Atrás
        </button>
        <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--large" id="regSubmitBtn">
          <span id="regSubmitLabel">Continuar</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `;
}

/* ─── DROPDOWN simple helper ─── */
function buildDropdown(dd, options, onSelect, isDisabled = false) {
  const trigger = dd.querySelector('.naowee-dropdown__trigger');
  const menu = dd.querySelector('.naowee-dropdown__menu');
  const valueEl = dd.querySelector('[id$="Value"]');

  if (isDisabled) {
    dd.classList.add('naowee-dropdown--disabled');
    trigger.disabled = true;
  } else {
    dd.classList.remove('naowee-dropdown--disabled');
    trigger.disabled = false;
  }

  menu.innerHTML = options.map(o => `<div class="naowee-dropdown__option" role="option" data-value="${escape(o)}">${escape(o)}</div>`).join('');

  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = dd.classList.contains('naowee-dropdown--open');
    /* Close other open dropdowns */
    document.querySelectorAll('.reg-modal .naowee-dropdown--open').forEach(d => {
      if (d !== dd) {
        d.classList.remove('naowee-dropdown--open');
        const t = d.querySelector('.naowee-dropdown__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
    dd.classList.toggle('naowee-dropdown--open');
    trigger.setAttribute('aria-expanded', String(!isOpen));
  };

  menu.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
    opt.onclick = () => {
      const v = opt.dataset.value;
      valueEl.textContent = v;
      valueEl.classList.remove('naowee-dropdown__placeholder');
      valueEl.style.color = 'var(--text-primary)';
      dd.classList.remove('naowee-dropdown--open');
      trigger.setAttribute('aria-expanded', 'false');
      clearFieldError(dd);
      onSelect(v);
    };
  });
}

/* ─── MAP INIT (Leaflet) ─── */
const DEFAULT_CENTER = [10.9878, -74.9547]; // Puerto Colombia
function initMap() {
  if (mapInstance) return;
  mapInstance = L.map('regMap', { zoomControl: true, attributionControl: true }).setView(DEFAULT_CENTER, 16);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mapInstance);

  const markerIcon = L.divIcon({
    className: 'geo-marker',
    html: '<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#d74009"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>',
    iconSize: [32, 40],
    iconAnchor: [16, 40]
  });

  markerInstance = L.marker(DEFAULT_CENTER, { draggable: true, icon: markerIcon }).addTo(mapInstance);
  markerInstance.on('dragend', (e) => {
    const { lat, lng } = e.target.getLatLng();
    updateCoords(lat, lng);
  });

  mapInstance.on('click', (e) => {
    if (!pickMode) return;
    markerInstance.setLatLng(e.latlng);
    updateCoords(e.latlng.lat, e.latlng.lng);
    pickMode = false;
    document.getElementById('regMap').style.cursor = '';
    const btn = document.getElementById('regBtnClickMap');
    if (btn) btn.style.outline = '';
  });
}

function updateCoords(lat, lon) {
  regState.lat = parseFloat(lat.toFixed(6));
  regState.lon = parseFloat(lon.toFixed(6));
  const latEl = document.getElementById('regLat');
  const lonEl = document.getElementById('regLon');
  if (latEl) latEl.value = regState.lat;
  if (lonEl) lonEl.value = regState.lon;
}

/* ─── PUBLIC API ─── */
export async function openRegistroEscenarioModal({ proyectoId, onCompleted } = {}) {
  const proyecto = proyectoId ? ProjectData.getProyecto(proyectoId) : null;

  /* Reset state */
  Object.assign(regState, {
    proyectoId,
    nombre: '', departamento: '', municipio: '', catastral: '',
    catastralState: 'empty',
    lat: null, lon: null,
    direccion: '', corregimiento: '', zona: '',
    tipoEscenario: '', area: '', capacidad: '',
    disciplinas: [], estadoFisico: '', descripcion: '',
    currentStep: 1, totalSteps: 2
  });
  mapInstance = null;
  markerInstance = null;

  /* Restaurar borrador si existe */
  const draft = proyectoId ? loadDraft(proyectoId) : null;

  injectStyles();
  await loadDependencies();

  /* Build overlay */
  const overlay = document.createElement('div');
  overlay.className = 'reg-modal-overlay';
  overlay.id = 'regModalOverlayProject';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = buildModalHTML(proyecto);
  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add('open'), 10);
  document.body.style.overflow = 'hidden';

  /* Init map after layout settles */
  setTimeout(() => {
    initMap();
    if (mapInstance) mapInstance.invalidateSize();
  }, 250);

  /* ── Bind: Nombre ── */
  const nombreInput = overlay.querySelector('#regNombre');
  nombreInput.addEventListener('input', () => {
    regState.nombre = nombreInput.value;
    clearFieldError(overlay.querySelector('#regFldNombre'));
  });

  /* ── Bind: Dropdowns Departamento + Municipio (cascada) ── */
  const depDD = overlay.querySelector('#regDepartamentoDD');
  const muniDD = overlay.querySelector('#regMunicipioDD');
  const departamentos = Object.keys(window.COLOMBIA_MUNICIPIOS || {}).sort();

  buildDropdown(depDD, departamentos, (dep) => {
    regState.departamento = dep;
    /* Cascade: rebuild municipios */
    regState.municipio = '';
    const munis = window.COLOMBIA_MUNICIPIOS[dep] || [];
    const mpioValue = overlay.querySelector('#regMpioValue');
    mpioValue.textContent = 'Selecciona municipio';
    mpioValue.classList.add('naowee-dropdown__placeholder');
    mpioValue.style.color = '';
    buildDropdown(muniDD, munis, (m) => {
      regState.municipio = m;
      /* helper + draft (paso 2 hooks definidos mas abajo) */
      const h = overlay.querySelector('#regHlpMunicipio'); if (h) h.hidden = true;
      try { saveDraft(); } catch(e){}
    }, false);
    const h = overlay.querySelector('#regHlpDepartamento'); if (h) h.hidden = true;
    try { saveDraft(); } catch(e){}
  });

  /* ── Bind: Zona dropdown ── */
  const zonaDD = overlay.querySelector('#regZonaDD');
  buildDropdown(zonaDD, ['Urbana', 'Rural'], (z) => {
    regState.zona = z;
    const h = overlay.querySelector('#regHlpZona'); if (h) h.hidden = true;
    try { saveDraft(); } catch(e){}
  });

  /* ── Bind: Catastral ── */
  const catInput = overlay.querySelector('#regCatastral');
  catInput.addEventListener('input', () => {
    catInput.value = catInput.value.replace(/\D/g, '');
    regState.catastral = catInput.value;
    clearFieldError(overlay.querySelector('#regFldCatastral'));
    regState.catastralState = regState.catastral.length >= 30 ? 'valid' : 'empty';
  });

  /* ── Bind: Lat/Lon inputs (sync con marker) ── */
  const latInput = overlay.querySelector('#regLat');
  const lonInput = overlay.querySelector('#regLon');
  const syncMarkerFromInputs = () => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (!isNaN(lat) && !isNaN(lon) && mapInstance && markerInstance) {
      regState.lat = lat;
      regState.lon = lon;
      markerInstance.setLatLng([lat, lon]);
      mapInstance.setView([lat, lon], 16);
    }
  };
  latInput.addEventListener('change', syncMarkerFromInputs);
  lonInput.addEventListener('change', syncMarkerFromInputs);

  /* ── Bind: Dirección + Corregimiento ── */
  const dirInput = overlay.querySelector('#regDireccion');
  dirInput.addEventListener('input', () => {
    regState.direccion = dirInput.value;
    clearFieldError(overlay.querySelector('#regFldDireccion'));
  });
  const corrInput = overlay.querySelector('#regCorregimiento');
  corrInput.addEventListener('input', () => { regState.corregimiento = corrInput.value; });

  /* ── Bind: Geolocation button ── */
  overlay.querySelector('#regBtnMyLocation').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstance && markerInstance) {
          markerInstance.setLatLng([latitude, longitude]);
          mapInstance.setView([latitude, longitude], 17);
          updateCoords(latitude, longitude);
        }
      },
      (err) => {
        alert('No se pudo obtener tu ubicación: ' + err.message);
      }
    );
  });

  /* ── Bind: Click-to-pin button ── */
  const clickMapBtn = overlay.querySelector('#regBtnClickMap');
  clickMapBtn.addEventListener('click', () => {
    pickMode = !pickMode;
    document.getElementById('regMap').style.cursor = pickMode ? 'crosshair' : '';
    clickMapBtn.style.outline = pickMode ? '2px solid var(--accent)' : '';
  });

  /* ── Bind: Fullscreen toggle ── */
  overlay.querySelector('#regBtnFullscreen').addEventListener('click', () => {
    const mapWrap = overlay.querySelector('.reg-map-wrap');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapWrap.requestFullscreen?.();
    }
    setTimeout(() => mapInstance?.invalidateSize(), 200);
  });

  /* ── Bind: Close/dismiss ── */
  const close = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 250);
    /* Cleanup leaflet */
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      markerInstance = null;
    }
  };
  overlay.querySelector('[data-close]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  const onEsc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);

  /* ── Bind: Click outside dropdowns to close ── */
  overlay.addEventListener('click', (e) => {
    if (!e.target.closest('.naowee-dropdown')) {
      overlay.querySelectorAll('.naowee-dropdown--open').forEach(d => {
        d.classList.remove('naowee-dropdown--open');
        const t = d.querySelector('.naowee-dropdown__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ════════════════════════════════════════════════════════════════
     PASO 2 — Bind dropdowns + inputs + disciplinas
     ════════════════════════════════════════════════════════════════ */

  /* Tipo de escenario */
  const tipoDD = overlay.querySelector('#regTipoDD');
  buildDropdown(tipoDD, TIPOS_ESCENARIO, (t) => {
    regState.tipoEscenario = t;
    clearHelper('regHlpTipo');
    saveDraft();
  });

  /* Estado físico */
  const estadoDD = overlay.querySelector('#regEstadoDD');
  buildDropdown(estadoDD, ESTADOS_FISICO, (e) => {
    regState.estadoFisico = e;
    clearHelper('regHlpEstado');
    saveDraft();
  });

  /* Área + Capacidad */
  const areaInput = overlay.querySelector('#regArea');
  areaInput.addEventListener('input', () => {
    areaInput.value = areaInput.value.replace(/\D/g, '');
    regState.area = areaInput.value;
    clearHelper('regHlpArea');
    saveDraft();
  });
  const capInput = overlay.querySelector('#regCapacidad');
  capInput.addEventListener('input', () => {
    capInput.value = capInput.value.replace(/\D/g, '');
    regState.capacidad = capInput.value;
    clearHelper('regHlpCapacidad');
    saveDraft();
  });

  /* Disciplinas multi-select pills */
  const discGrid = overlay.querySelector('#regDisciplinasGrid');
  DISCIPLINAS_CATALOGO.forEach(d => {
    const pill = document.createElement('span');
    pill.className = 'reg-disciplina-pill';
    pill.dataset.disc = d;
    pill.textContent = d;
    pill.addEventListener('click', () => {
      const idx = regState.disciplinas.indexOf(d);
      if (idx >= 0) {
        regState.disciplinas.splice(idx, 1);
        pill.classList.remove('is-selected');
      } else {
        regState.disciplinas.push(d);
        pill.classList.add('is-selected');
      }
      if (regState.disciplinas.length > 0) clearHelper('regHlpDisciplinas');
      saveDraft();
    });
    discGrid.appendChild(pill);
  });

  /* Descripción */
  const descInput = overlay.querySelector('#regDescripcion');
  descInput.addEventListener('input', () => {
    regState.descripcion = descInput.value;
    saveDraft();
  });

  /* ════════════════════════════════════════════════════════════════
     HELPER ERROR utilities
     ════════════════════════════════════════════════════════════════ */
  function showHelper(id, msg) {
    const h = overlay.querySelector('#' + id);
    if (!h) return;
    h.hidden = false;
    h.querySelector('span').textContent = msg;
  }
  function clearHelper(id) {
    const h = overlay.querySelector('#' + id);
    if (h) h.hidden = true;
  }
  function applyFieldError(fieldId) {
    const el = overlay.querySelector('#' + fieldId);
    if (!el) return;
    if (el.classList.contains('naowee-dropdown')) el.classList.add('naowee-dropdown--error');
    else el.classList.add('naowee-textfield--error');
    el.classList.add('field-error-wiggle');
    setTimeout(() => el.classList.remove('field-error-wiggle'), 400);
  }

  /* ════════════════════════════════════════════════════════════════
     STEP NAVIGATION
     ════════════════════════════════════════════════════════════════ */
  const stepEls = overlay.querySelectorAll('.reg-step');
  const stepDots = overlay.querySelectorAll('[data-step-dot]');
  const stepCurrentLabel = overlay.querySelector('#regStepCurrent');
  const submitLabel = overlay.querySelector('#regSubmitLabel');
  const backBtn = overlay.querySelector('#regBackBtn');
  const modalBody = overlay.querySelector('.reg-modal__body');

  function goToStep(n) {
    regState.currentStep = n;
    stepEls.forEach(el => { el.hidden = (parseInt(el.dataset.step, 10) !== n); });
    stepDots.forEach(d => {
      const dn = parseInt(d.dataset.stepDot, 10);
      d.classList.toggle('is-active', dn === n);
      d.classList.toggle('is-done', dn < n);
    });
    stepCurrentLabel.textContent = String(n);
    submitLabel.textContent = (n === regState.totalSteps) ? 'Validar y registrar' : 'Continuar';
    backBtn.hidden = (n === 1);
    /* Refresh mapa en paso 1 (puede haber perdido tamaño) */
    if (n === 1 && mapInstance) setTimeout(() => mapInstance.invalidateSize(), 100);
    /* Scroll al tope del body */
    modalBody.scrollTop = 0;
    saveDraft();
  }

  backBtn.addEventListener('click', () => { goToStep(regState.currentStep - 1); });

  /* ════════════════════════════════════════════════════════════════
     VALIDACION por paso (devuelve true si OK)
     ════════════════════════════════════════════════════════════════ */
  function validateStep1() {
    let firstErrId = null;
    const check = (cond, fieldId, helperId, msg) => {
      if (cond) {
        applyFieldError(fieldId);
        showHelper(helperId, msg);
        if (!firstErrId) firstErrId = fieldId;
      } else {
        clearHelper(helperId);
      }
    };
    check(!regState.nombre || regState.nombre.length < 5, 'regFldNombre', 'regHlpNombre', 'Debe tener mínimo 5 caracteres.');
    check(!regState.departamento, 'regDepartamentoDD', 'regHlpDepartamento', 'Selecciona un departamento.');
    check(!regState.municipio, 'regMunicipioDD', 'regHlpMunicipio', 'Selecciona un municipio.');
    check(!regState.catastral || regState.catastral.length < 30, 'regFldCatastral', 'regHlpCatastral', 'Debe tener 30 dígitos.');
    if (regState.lat === null || regState.lon === null) {
      showHelper('regHlpCoords', 'Marca un punto en el mapa o ingresa latitud/longitud manualmente.');
      if (!firstErrId) firstErrId = 'regMap';
    } else {
      clearHelper('regHlpCoords');
    }
    check(!regState.direccion || regState.direccion.length < 5, 'regFldDireccion', 'regHlpDireccion', 'Debe tener mínimo 5 caracteres.');
    check(!regState.zona, 'regZonaDD', 'regHlpZona', 'Selecciona una zona.');

    if (firstErrId) {
      overlay.querySelector('#' + firstErrId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  function validateStep2() {
    let firstErrId = null;
    const check = (cond, fieldId, helperId, msg) => {
      if (cond) {
        applyFieldError(fieldId);
        showHelper(helperId, msg);
        if (!firstErrId) firstErrId = fieldId;
      } else {
        clearHelper(helperId);
      }
    };
    check(!regState.tipoEscenario, 'regTipoDD', 'regHlpTipo', 'Selecciona el tipo de escenario.');
    check(!regState.area || parseInt(regState.area, 10) <= 0, 'regFldArea', 'regHlpArea', 'Ingresa el área en metros cuadrados.');
    check(!regState.capacidad || parseInt(regState.capacidad, 10) <= 0, 'regFldCapacidad', 'regHlpCapacidad', 'Ingresa la capacidad de espectadores.');
    check(!regState.estadoFisico, 'regEstadoDD', 'regHlpEstado', 'Selecciona el estado físico.');
    if (regState.disciplinas.length === 0) {
      showHelper('regHlpDisciplinas', 'Selecciona al menos una disciplina deportiva.');
      if (!firstErrId) firstErrId = 'regFldDisciplinas';
    } else {
      clearHelper('regHlpDisciplinas');
    }
    if (firstErrId) {
      overlay.querySelector('#' + firstErrId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  /* ════════════════════════════════════════════════════════════════
     ADD: helper clears y saveDraft en cada bind ya existente (paso 1)
     ════════════════════════════════════════════════════════════════ */
  nombreInput.addEventListener('input', () => { clearHelper('regHlpNombre'); saveDraft(); });
  catInput.addEventListener('input', () => { clearHelper('regHlpCatastral'); saveDraft(); });
  dirInput.addEventListener('input', () => { clearHelper('regHlpDireccion'); saveDraft(); });
  corrInput.addEventListener('input', saveDraft);
  latInput.addEventListener('input', () => { clearHelper('regHlpCoords'); saveDraft(); });
  lonInput.addEventListener('input', () => { clearHelper('regHlpCoords'); saveDraft(); });

  /* ════════════════════════════════════════════════════════════════
     RESTAURAR BORRADOR + BANNER
     ════════════════════════════════════════════════════════════════ */
  function applyDraft(d) {
    if (!d) return;
    /* Hidratar inputs simples */
    if (d.nombre) { nombreInput.value = d.nombre; regState.nombre = d.nombre; }
    if (d.catastral) { catInput.value = d.catastral; regState.catastral = d.catastral; regState.catastralState = d.catastral.length >= 30 ? 'valid' : 'empty'; }
    if (d.direccion) { dirInput.value = d.direccion; regState.direccion = d.direccion; }
    if (d.corregimiento) { corrInput.value = d.corregimiento; regState.corregimiento = d.corregimiento; }
    if (d.lat !== null && d.lat !== undefined) { latInput.value = d.lat; regState.lat = d.lat; }
    if (d.lon !== null && d.lon !== undefined) { lonInput.value = d.lon; regState.lon = d.lon; }
    /* Dropdowns: simular click si hay valor */
    if (d.departamento && window.COLOMBIA_MUNICIPIOS?.[d.departamento]) {
      regState.departamento = d.departamento;
      const depVal = overlay.querySelector('#regDepValue');
      depVal.textContent = d.departamento;
      depVal.classList.remove('naowee-dropdown__placeholder');
      depVal.style.color = 'var(--text-primary, #282834)';
      /* Habilitar municipios */
      buildDropdown(muniDD, window.COLOMBIA_MUNICIPIOS[d.departamento], (m) => { regState.municipio = m; clearHelper('regHlpMunicipio'); saveDraft(); });
      if (d.municipio) {
        regState.municipio = d.municipio;
        const mpioVal = overlay.querySelector('#regMpioValue');
        mpioVal.textContent = d.municipio;
        mpioVal.classList.remove('naowee-dropdown__placeholder');
        mpioVal.style.color = 'var(--text-primary, #282834)';
      }
    }
    if (d.zona) {
      regState.zona = d.zona;
      const zVal = overlay.querySelector('#regZonaValue');
      zVal.textContent = d.zona;
      zVal.classList.remove('naowee-dropdown__placeholder');
      zVal.style.color = 'var(--text-primary, #282834)';
    }
    /* Paso 2 */
    if (d.tipoEscenario) {
      regState.tipoEscenario = d.tipoEscenario;
      const tVal = overlay.querySelector('#regTipoValue');
      tVal.textContent = d.tipoEscenario;
      tVal.classList.remove('naowee-dropdown__placeholder');
      tVal.style.color = 'var(--text-primary, #282834)';
    }
    if (d.estadoFisico) {
      regState.estadoFisico = d.estadoFisico;
      const eVal = overlay.querySelector('#regEstadoValue');
      eVal.textContent = d.estadoFisico;
      eVal.classList.remove('naowee-dropdown__placeholder');
      eVal.style.color = 'var(--text-primary, #282834)';
    }
    if (d.area) { areaInput.value = d.area; regState.area = d.area; }
    if (d.capacidad) { capInput.value = d.capacidad; regState.capacidad = d.capacidad; }
    if (Array.isArray(d.disciplinas) && d.disciplinas.length) {
      regState.disciplinas = [...d.disciplinas];
      regState.disciplinas.forEach(disc => {
        const pill = overlay.querySelector(`[data-disc="${disc}"]`);
        if (pill) pill.classList.add('is-selected');
      });
    }
    if (d.descripcion) { descInput.value = d.descripcion; regState.descripcion = d.descripcion; }
    /* Mostrar banner */
    const banner = overlay.querySelector('#regDraftBanner');
    const dateEl = overlay.querySelector('#regDraftDate');
    if (banner && dateEl) {
      dateEl.textContent = formatDraftDate(d.savedAt);
      banner.hidden = false;
    }
    /* Saltar al paso guardado si hay datos del paso 2 */
    if (d.currentStep && d.currentStep > 1) {
      setTimeout(() => goToStep(d.currentStep), 50);
    }
  }
  if (draft) {
    setTimeout(() => applyDraft(draft), 100);
  }
  /* Discard draft button */
  overlay.querySelector('#regDraftDiscard').addEventListener('click', () => {
    if (proyectoId) clearDraft(proyectoId);
    overlay.querySelector('#regDraftBanner').hidden = true;
    /* Cerrar y reabrir limpio */
    close();
    setTimeout(() => openRegistroEscenarioModal({ proyectoId, onCompleted }), 300);
  });

  /* ════════════════════════════════════════════════════════════════
     SUBMIT — Dos fases: paso 1 → avanzar, paso 2 → persistir
     ════════════════════════════════════════════════════════════════ */
  overlay.querySelector('#regSubmitBtn').addEventListener('click', () => {
    if (regState.currentStep === 1) {
      if (!validateStep1()) return;
      goToStep(2);
      return;
    }
    /* Paso 2: validar y persistir */
    if (!validateStep2()) return;

    if (proyectoId) {
      const suid = `SUID-${String(regState.departamento).slice(0,3).toUpperCase()}-${String(regState.municipio).slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      ProjectData.setProyecto(proyectoId, p => {
        p.inversion = p.inversion || {};
        p.inversion.suidEscenario = suid;
        p.inversion.escenarioRegistro = {
          nombre: regState.nombre,
          departamento: regState.departamento,
          municipio: regState.municipio,
          catastral: regState.catastral,
          lat: regState.lat,
          lon: regState.lon,
          direccion: regState.direccion,
          corregimiento: regState.corregimiento,
          zona: regState.zona,
          tipoEscenario: regState.tipoEscenario,
          area: regState.area,
          capacidad: regState.capacidad,
          disciplinas: [...regState.disciplinas],
          estadoFisico: regState.estadoFisico,
          descripcion: regState.descripcion,
          registradoEn: new Date().toISOString()
        };
        p.historial = p.historial || [];
        p.historial.push({
          ts: new Date().toISOString(),
          actor: 'admin',
          evento: `Escenario registrado en SUID (${suid})`
        });
        return p;
      });
      /* Borrar borrador al completar exitosamente */
      clearDraft(proyectoId);
    }

    close();
    if (typeof onCompleted === 'function') onCompleted({ ...regState });
  });
}

export default { openRegistroEscenarioModal };
