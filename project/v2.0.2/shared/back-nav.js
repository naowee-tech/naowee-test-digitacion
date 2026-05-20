/* ═══════════════════════════════════════════════════════════════
   shared/back-nav.js — Smart back button.
   Resuelve el destino del botón "Volver" según document.referrer y
   un set de reglas declarativas pasadas por la página.

   Uso:
     import { resolveBack } from '../shared/back-nav.js';
     const { href, label } = resolveBack({
       defaultHref: 'proyectos.html',
       defaultLabel: 'Volver a proyectos',
       rules: [
         { match: 'convocatoria-detalle.html', href: () => `convocatoria-detalle.html?id=${p.convocatoriaId}`, label: 'Volver a la convocatoria' },
         { match: 'dashboard.html', href: 'dashboard.html', label: 'Volver al panel' }
       ]
     });
   ═══════════════════════════════════════════════════════════════ */

export function resolveBack({ defaultHref, defaultLabel, rules = [] }) {
  const ref = document.referrer || '';
  for (const r of rules) {
    if (ref.includes(r.match)) {
      return {
        href: typeof r.href === 'function' ? r.href() : r.href,
        label: r.label
      };
    }
  }
  return { href: defaultHref, label: defaultLabel };
}

/* HTML del botón ghost (DS naowee-btn--mute --small con ícono ←).
   Devuelve string para inyectar en innerHTML. */
export function backButtonHTML({ href, label }) {
  return `
    <a class="naowee-btn naowee-btn--mute naowee-btn--small back-btn" href="${href}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      ${label}
    </a>
  `;
}
