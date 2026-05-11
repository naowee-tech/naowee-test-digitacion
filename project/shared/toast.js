/* ═══════════════════════════════════════════════════════════════════
   toast.js — Notificación temporal en esquina inferior derecha.
   API:
     toast({ variant?, title, message?, duration? })
       variant: 'positive' | 'caution' | 'negative' | 'informative' | 'neutral'
       duration: ms (default 4200, 0 = sticky hasta dismiss)
   Estilos vinculados en shared/pages.css (.naowee-toaster, .naowee-toast).
   ═══════════════════════════════════════════════════════════════════ */

const ICONS = {
  positive: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  caution:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>`,
  negative: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  informative: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/></svg>`,
  neutral: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`
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
  node.className = `naowee-toast naowee-toast--${variant}`;
  node.setAttribute('role', 'status');
  node.innerHTML = `
    <div class="naowee-toast__icon">${ICONS[variant] || ICONS.neutral}</div>
    <div class="naowee-toast__body">
      <div class="naowee-toast__title">${title}</div>
      ${message ? `<div class="naowee-toast__msg">${message}</div>` : ''}
    </div>
    <button type="button" class="naowee-toast__dismiss" aria-label="Cerrar">${closeIcon}</button>
    ${duration > 0 ? `<div class="naowee-toast__progress" style="--toast-dur:${duration}ms"></div>` : ''}
  `;

  const dismiss = () => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 220);
  };
  node.querySelector('.naowee-toast__dismiss').addEventListener('click', dismiss);
  root.appendChild(node);
  /* Animar entrada en frame siguiente */
  requestAnimationFrame(() => node.classList.add('is-visible'));

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
  return { dismiss };
}

export default { toast };
