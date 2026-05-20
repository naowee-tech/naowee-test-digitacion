/* ═══════════════════════════════════════════════════════════════
   shared/components.js — Helpers unificados que componen markup
   oficial del Naowee Design System v1.8.0.

   Regla: si necesitas un componente del DS, llámalo desde aquí.
   No duplicar markup en páginas. No inventar subclases.
   ═══════════════════════════════════════════════════════════════ */

const MESSAGE_ICONS = {
  informative: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  positive: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  caution: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v3.5M8 10.75v.05" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7.13 2.5L1.78 12.5a1 1 0 00.87 1.5h10.7a1 1 0 00.87-1.5L8.87 2.5a1 1 0 00-1.74 0z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  negative: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`
};

/**
 * Compone un .naowee-message oficial del DS v1.8.0.
 * Estructura validada en design-system.css L2971-3098.
 *
 * @param {object} opts
 * @param {'informative'|'positive'|'caution'|'negative'} opts.variant
 * @param {string} [opts.title]    Título corto (1 línea)
 * @param {string} [opts.text]     Texto del cuerpo (puede ser HTML)
 * @param {string} [opts.action]   HTML opcional de un CTA al final (ej: <a class="naowee-btn ...">)
 * @param {string} [opts.icon]     SVG override; si se omite usa el icono del variant
 * @param {string} [opts.role]     ARIA role (default: 'status')
 * @param {string} [opts.style]    Inline style extra para el contenedor
 * @param {string} [opts.className] Clases extra (ej: 'naowee-message--loud')
 * @returns {string} HTML markup
 */
export function naoweeMessage({ variant = 'informative', title, text, action, icon, role = 'status', style = '', className = '' } = {}) {
  const iconSvg = icon || MESSAGE_ICONS[variant] || MESSAGE_ICONS.informative;
  const styleAttr = style ? ` style="${style}"` : '';
  const extraCls = className ? ' ' + className : '';
  const headerInline = title
    ? `<span class="naowee-message__title">${title}</span>`
    : (text && !title ? `<span class="naowee-message__body">${text}</span>` : '');
  const bodyText = title && text ? `<div class="naowee-message__text">${text}</div>` : '';
  const actionHtml = action ? `<div class="naowee-message__action-wrap">${action}</div>` : '';
  return `
    <div class="naowee-message naowee-message--${variant}${extraCls}" role="${role}"${styleAttr}>
      <div class="naowee-message__header">
        <span class="naowee-message__icon">${iconSvg}</span>
        ${headerInline}
      </div>
      ${bodyText}
      ${actionHtml}
    </div>
  `;
}

export const NaoweeMessageIcons = MESSAGE_ICONS;
