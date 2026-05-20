/* ═══════════════════════════════════════════════════════════════════
   sla-expiry.js — Job mock de expiración automática.

   Recorre los proyectos del SEED en cada page-load (corre 1x por sesión
   para no saturar) y aplica la regla de la Resolución 933:
   - presentado / en_revision con > 15 días desde fechaPostulacion
     (o fechaInicioRevision) sin actividad → estado `expirada`
   - devuelta_subsanacion con > 15 días desde fechaDevolucion
     sin respuesta del municipio → estado `expirada`

   En producción esto sería un cron del backend. En la demo simula que
   "el tiempo corre" y muestra el comportamiento automático.

   Si el proyecto ya tiene prórroga aprobada, se respeta la fecha
   extendida (la propagación al fechaDevolucion la hace prorroga.html).
   ═══════════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';

const SESSION_KEY = 'naowee.project.expiry-checked';
const MS_DAY = 1000 * 60 * 60 * 24;
/* Plazo legal Res. 933 Art. 6 — 15 días hábiles ≈ 21 días calendario.
   Para la demo usamos 21 días redondos para que la simulación tenga
   margen y no marque proyectos del seed como expirados de inmediato. */
const PLAZO_DIAS = 21;

function diasDesde(isoDate) {
  if (!isoDate) return 0;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / MS_DAY);
}

export function runSlaExpiryJob() {
  /* Solo correr 1x por sesión del navegador para evitar churn */
  if (sessionStorage.getItem(SESSION_KEY)) return { expirados: [], skipped: true };

  const proyectos = ProjectData.getProyectos();
  const expirados = [];

  proyectos.forEach(p => {
    let fechaBase = null;
    let motivo = null;

    if (p.estado === 'presentado' || p.estado === 'en_revision') {
      fechaBase = p.fechaInicioRevision || p.fechaPostulacion;
      motivo = 'sin revisión completada dentro del plazo';
    } else if (p.estado === 'devuelta_subsanacion') {
      fechaBase = p.fechaDevolucion;
      motivo = 'sin respuesta del municipio dentro del plazo de subsanación';
    } else {
      return; // estados finales / inversión: no aplica
    }

    const dias = diasDesde(fechaBase);
    if (dias > PLAZO_DIAS) {
      const ahora = new Date().toISOString();
      ProjectData.setProyecto(p.idUnico, x => {
        x.estado = 'expirada';
        x.expiradoEn = ahora;
        x.expiradoMotivo = motivo;
        x.historial = x.historial || [];
        x.historial.push({
          ts: ahora, actor: 'sistema',
          evento: `Expirada automáticamente · ${motivo} · ${dias} días transcurridos (límite ${PLAZO_DIAS})`,
          estado: 'expirada'
        });
        return x;
      });
      expirados.push({ id: p.idUnico, nombre: p.nombre, dias, motivo });
    }
  });

  sessionStorage.setItem(SESSION_KEY, '1');
  return { expirados, skipped: false };
}

/* Auto-ejecutar al importar (no bloquea page-load porque es síncrono y rápido) */
if (typeof window !== 'undefined') {
  /* setTimeout 0 para correr tras el mount del shell, no antes */
  setTimeout(() => {
    const result = runSlaExpiryJob();
    if (result.expirados?.length) {
      console.info(`[SLA Expiry] ${result.expirados.length} proyecto(s) expirado(s) automáticamente:`, result.expirados);
    }
  }, 200);
}
