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

/* ═══════════════════════════════════════════════════════════════════
   snackbar — Notificación temporal centrada en el borde inferior,
   usa la estructura oficial del DS (.naowee-snackbar) con badge
   info opcional + texto + acción opcional. Reemplaza el uso de toast()
   cuando la interacción amerita una respuesta más prominente y centrada
   (ej. confirmación de toggle, acción en flujo).

   API:
     snackbar({ text, action?, onAction?, badge?, duration? })
       text: string  → contenido
       action: string → label del botón opcional
       onAction: fn  → callback al click del botón
       badge: bool (default true) → icono info circular
       duration: ms (default 3500, 0 = sticky)
   ═══════════════════════════════════════════════════════════════════ */
function ensureSnackbarRoot() {
  let el = document.getElementById('naoweeSnackbarRoot');
  if (!el) {
    el = document.createElement('div');
    el.id = 'naoweeSnackbarRoot';
    el.className = 'naowee-snackbar-root';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notificaciones');
    /* z-index 10001 → arriba del pill DEMO (9999) y de cualquier overlay del modal.
       bottom: 88px deja espacio para que NO choque con el pill demo (que vive ~bottom: 22px). */
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:88px;display:flex;justify-content:center;z-index:10001;pointer-events:none';
    document.body.appendChild(el);
  }
  return el;
}

const SNACKBAR_BADGE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

export function snackbar({ text, action = '', onAction, badge = true, duration = 3500 } = {}) {
  const root = ensureSnackbarRoot();
  const node = document.createElement('div');
  node.className = 'naowee-snackbar naowee-snackbar--floating';
  /* Animación más sutil: empieza 24px abajo con opacity 0, entra hacia arriba
     con fade. Salida: fade out + ligero desplazamiento hacia abajo. */
  node.style.cssText = `
    pointer-events: auto;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity .28s ease-out, transform .32s cubic-bezier(.16, 1, .3, 1);
    will-change: opacity, transform;
  `;
  node.innerHTML = `
    <div class="naowee-snackbar__content">
      ${badge ? `<span class="naowee-snackbar__badge">${SNACKBAR_BADGE_SVG}</span>` : ''}
      <span class="naowee-snackbar__text">${text}</span>
    </div>
    ${action ? `<button type="button" class="naowee-snackbar__action">${action}</button>` : ''}
  `;
  if (action && onAction) {
    node.querySelector('.naowee-snackbar__action')?.addEventListener('click', () => {
      onAction();
      dismiss();
    });
  }
  const dismiss = () => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    node.style.transition = 'opacity .22s ease-in, transform .22s ease-in';
    setTimeout(() => node.remove(), 240);
  };
  root.appendChild(node);
  /* Force layout then enter — doble rAF garantiza que el browser pinte el estado inicial */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    node.style.opacity = '1';
    node.style.transform = 'translateY(0)';
  }));
  if (duration > 0) setTimeout(dismiss, duration);
  return { dismiss };
}

export default { toast, snackbar };
