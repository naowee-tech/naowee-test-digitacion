/* ═══════════════════════════════════════════════════════════════════
   toast.js — Notificación temporal en esquina inferior derecha.
   Usa la estructura HTML oficial de naowee-message del DS Naowee
   (.naowee-message + variantes + __header / __icon / __title / __text)
   envuelta en un contenedor fixed para el posicionamiento.

   API:
     toast({ variant?, title, message?, duration? })
       variant: 'positive' | 'caution' | 'negative' | 'informative' | 'neutral'
       duration: ms (default 4200, 0 = sticky hasta dismiss)
   ═══════════════════════════════════════════════════════════════════ */

/* Iconos del DS — mismos paths que usa naowee-message en el resto del proyecto */
const ICONS = {
  positive: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  caution:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v3.5M8 10.75v.05" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7.13 2.5L1.78 12.5a1 1 0 00.87 1.5h10.7a1 1 0 00.87-1.5L8.87 2.5a1 1 0 00-1.74 0z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  negative: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  informative: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/><path d="M8 7v4M8 4.5v.05" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  neutral: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fff" stroke-width="1.4"/></svg>`
};
const closeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function ensureToaster() {
  let el = document.getElementById('naoweeToaster');
  if (!el) {
    el = document.createElement('div');
    el.id = 'naoweeToaster';
    el.className = 'naowee-toaster';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notificaciones');
    document.body.appendChild(el);
  }
  return el;
}

export function toast({ variant = 'positive', title, message = '', duration = 4200 } = {}) {
  const root = ensureToaster();
  const node = document.createElement('div');
  /* Estructura del naowee-message oficial + wrapper de toast para animación */
  node.className = `naowee-toast-item naowee-message naowee-message--${variant}`;
  node.setAttribute('role', 'status');
  node.innerHTML = `
    <div class="naowee-message__header">
      <span class="naowee-message__icon">${ICONS[variant] || ICONS.neutral}</span>
      <span class="naowee-message__title">${title}</span>
      <button type="button" class="naowee-toast-item__dismiss" aria-label="Cerrar">${closeIcon}</button>
    </div>
    ${message ? `<div class="naowee-message__text">${message}</div>` : ''}
    ${duration > 0 ? `<div class="naowee-toast-item__progress" style="--toast-dur:${duration}ms"></div>` : ''}
  `;

  const dismiss = () => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 220);
  };
  node.querySelector('.naowee-toast-item__dismiss').addEventListener('click', dismiss);
  root.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));

  if (duration > 0) setTimeout(dismiss, duration);
  return { dismiss };
}

export default { toast };
