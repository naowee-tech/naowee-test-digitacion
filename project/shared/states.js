/* ═══════════════════════════════════════════════════════════════
   PROJECT — Máquina de estados de postulación / etapa documental
   ═══════════════════════════════════════════════════════════════ */

/* Color = modificador oficial del DS Naowee (.naowee-badge--{color})
   Uso: <span class="naowee-badge naowee-badge--${ESTADOS_POSTULACION[x].color} naowee-badge--quiet">…</span>
*/
export const ESTADOS_POSTULACION = {
  borrador:               { label: 'Borrador',                 color: 'neutral',     orden: 0 },
  presentado:             { label: 'Presentada',               color: 'informative', orden: 1 },
  en_revision:            { label: 'En revisión',              color: 'caution',     orden: 2 },
  no_revisada:            { label: 'No revisada',              color: 'neutral',     orden: 3 },
  devuelta_subsanacion:   { label: 'Devuelta a subsanación',   color: 'caution',     orden: 4 },
  expirada:               { label: 'Expirada',                 color: 'negative',    orden: 5 },
  rechazada:              { label: 'Rechazada',                color: 'negative',    orden: 6 },
  favorable:              { label: 'Favorable',                color: 'positive',    orden: 7 },
  etapa_documental:       { label: 'Etapa documental',         color: 'brand',       orden: 8 },
  concepto_favorable:     { label: 'Concepto favorable',       color: 'positive',    orden: 9 },
  en_inversion:           { label: 'En inversión',             color: 'positive',    orden: 10 }
};

export const ESTADOS_DOC = {
  pendiente:              { label: 'Pendiente',                color: 'neutral' },
  en_revision_general:    { label: 'En revisión',              color: 'caution' },
  aprobado:               { label: 'Aprobado',                 color: 'positive' },
  devuelto:               { label: 'Devuelto',                 color: 'negative' },
  rechazado:              { label: 'Rechazado',                color: 'negative' }
};

export const ESTADOS_AREA = {
  pendiente:   { label: 'Pendiente',   color: 'neutral' },
  en_revision: { label: 'En revisión', color: 'caution' },
  aprobado:    { label: 'Aprobado',    color: 'positive' },
  /* devuelto = subsanable por el municipio (corregible)
     rechazado = no subsanable, requiere replantear el proyecto (Res. 933 Art. 9) */
  devuelto:    { label: 'Devuelto a subsanación', color: 'caution' },
  rechazado:   { label: 'Rechazado',   color: 'negative' }
};

/* Transiciones permitidas — fuente de verdad de la lógica E2E */
export const TRANSICIONES = {
  borrador:             ['presentado'],
  presentado:           ['en_revision', 'no_revisada'],
  en_revision:          ['favorable', 'devuelta_subsanacion', 'rechazada', 'no_revisada'],
  devuelta_subsanacion: ['en_revision', 'expirada'],
  no_revisada:          ['en_revision'],
  favorable:            ['etapa_documental'],
  etapa_documental:     ['concepto_favorable', 'devuelta_subsanacion'],
  concepto_favorable:   ['en_inversion'],
  expirada:             ['borrador'],
  rechazada:            [],
  en_inversion:         []
};

/* Días hábiles entre dos fechas (lun-vie). Excluye fines de semana. */
export function diasHabiles(fechaInicio, fechaFin = new Date()) {
  const a = new Date(fechaInicio);
  const b = new Date(fechaFin);
  if (isNaN(a) || isNaN(b)) return 0;
  let d = 0;
  const cur = new Date(a);
  while (cur < b) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) d++;
  }
  return d;
}

/* Cuenta regresiva de revisión (15 días hábiles) */
export function diasRestantes(fechaInicio, total = 15) {
  return Math.max(0, total - diasHabiles(fechaInicio));
}

export function formatoMoneda(valor) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(valor);
}

/* Formato canónico de fecha del proyecto: "04. abr, 2026"
   Día con leading zero · punto · mes corto en minúsculas · coma · año */
const __MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function _fechaCanonica(d) {
  return `${String(d.getDate()).padStart(2,'0')}. ${__MESES_CORTOS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatoFecha(iso, conHora = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const fecha = _fechaCanonica(d);
  if (!conHora) return fecha;
  const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} · ${hora}`;
}

export function fechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return _fechaCanonica(d);
}

window.ProjectStates = { ESTADOS_POSTULACION, ESTADOS_DOC, ESTADOS_AREA, TRANSICIONES, diasHabiles, diasRestantes, formatoMoneda, formatoFecha, fechaCorta };
