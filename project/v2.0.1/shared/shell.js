/* ═══════════════════════════════════════════════════════════════
   PROJECT — Shell (sidebar por rol + header + switcher inferior)
   Reutiliza la estructura visual del shell oficial de Naowee
   pero con menús específicos del módulo Project.
   ═══════════════════════════════════════════════════════════════ */

import ProjectData from './data.js';
/* Job mock que mueve proyectos a `expirada` cuando vence el plazo
   Res. 933 (15 días hábiles). Corre 1x por sesión al importar. */
import './sla-expiry.js';

const COLLAPSED_KEY = 'naowee-project-sidebar-collapsed';

/* ───── ICONOS (inline SVG, stroke = currentColor) ───── */
const ICONS = {
  inicio: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>',
  convocatoria: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  proyecto: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12"/></svg>',
  bandeja: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',
  documentos: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
  inversion: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  usuarios: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  postular: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>',
  notificaciones: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  area: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
  concepto: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  logout: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  cog: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
};

/* ───── MENÚS POR ROL ───── */
const MENUS = {
  admin: {
    label: 'Administrador de Convocatorias',
    sections: [
      {
        section: 'Inicio',
        items: [
          { id: 'inicio',         label: 'Panel general',      icon: 'inicio',       href: 'admin/dashboard.html' }
        ]
      },
      {
        section: 'Gestión',
        items: [
          { id: 'convocatorias',  label: 'Convocatorias',      icon: 'convocatoria', href: 'admin/convocatorias.html' },
          { id: 'proyectos',      label: 'Proyectos recibidos',icon: 'proyecto',     href: 'admin/proyectos.html' },
          { id: 'prorrogas',      label: 'Solicitudes de prórroga', icon: 'concepto', href: 'admin/prorrogas.html' }
        ]
      },
      {
        section: 'Inversión',
        items: [
          { id: 'inversion',      label: 'Tabla de inversión', icon: 'inversion',    href: 'admin/inversion.html' }
        ]
      },
      {
        section: 'Configuración',
        items: [
          { id: 'usuarios',       label: 'Usuarios y áreas',   icon: 'usuarios',     href: 'admin/usuarios.html' }
        ]
      }
    ]
  },
  municipio: {
    label: 'Alcaldía / Municipio',
    sections: [
      {
        section: 'Inicio',
        items: [
          { id: 'inicio',         label: 'Mi panel',           icon: 'inicio',       href: 'municipio/dashboard.html' }
        ]
      },
      {
        section: 'Postulación',
        items: [
          { id: 'convocatorias',  label: 'Convocatorias activas', icon: 'convocatoria', href: 'municipio/convocatorias.html' },
          { id: 'mis-proyectos',  label: 'Mis proyectos',         icon: 'proyecto',     href: 'municipio/proyectos.html' },
          { id: 'postular',       label: 'Postular proyecto',     icon: 'postular',     href: 'municipio/postular.html' }
        ]
      }
    ]
  },
  revisor: {
    label: 'Revisor del Ministerio',
    sections: [
      {
        section: 'Inicio',
        items: [
          { id: 'inicio',         label: 'Panel revisor',      icon: 'inicio',       href: 'revisor/dashboard.html' }
        ]
      },
      {
        section: 'Bandejas',
        items: [
          { id: 'bandeja',        label: 'Bandeja de revisión', icon: 'bandeja',      href: 'revisor/bandeja.html' },
          { id: 'doc-general',    label: 'Documentación general', icon: 'documentos', href: 'revisor/doc-general.html' },
          { id: 'doc-tecnica',    label: 'Áreas técnicas',     icon: 'area',         href: 'revisor/doc-tecnica.html' }
        ]
      },
      {
        section: 'Cierre',
        items: [
          { id: 'concepto',       label: 'Concepto favorabilidad', icon: 'concepto', href: 'revisor/concepto.html' }
        ]
      }
    ]
  }
};

/* ───── RENDER SIDEBAR ───── */
function renderSidebar(perfil, activeId) {
  const menu = MENUS[perfil];
  const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1';
  const sections = menu.sections.map(s => `
    ${s.section ? `<div class="nav-section">${s.section}</div>` : ''}
    ${s.items.map(i => renderItem(i, activeId)).join('')}
  `).join('');

  return `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="naoweeSidebar">
      <div class="sidebar-logo">
        <button class="burger-btn" id="sidebarToggle" aria-label="Colapsar menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#282834" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <img src="${pathPrefix()}shared/logos/ministerio.svg" alt="Ministerio del Deporte" class="sb-logo-img" onerror="this.style.display='none'"/>
        <div class="logo-sep"></div>
        <img src="${pathPrefix()}shared/logos/suid.png" alt="SUID — Sistema Único de Información del Deporte" class="sb-logo-img" onerror="this.style.display='none'"/>
      </div>
      <nav class="sidebar-nav" id="sidebarNav" role="navigation" aria-label="Menú principal">
        ${sections}
      </nav>
    </aside>
  `;
}

function renderItem(item, activeId) {
  const isActive = item.id === activeId;
  return `
    <a class="nav-row ${isActive ? 'active' : ''}"
       href="${pathPrefix()}${item.href}"
       data-id="${item.id}">
      ${isActive ? '<span class="active-bar"></span>' : ''}
      <div class="icon">${ICONS[item.icon] || ICONS.inicio}</div>
      <span class="lbl">${item.label}</span>
    </a>
  `;
}

function pathPrefix() {
  /* Si la URL incluye admin/ municipio/ revisor/, subir un nivel. */
  const p = window.location.pathname;
  if (/\/(admin|municipio|revisor)\//.test(p)) return '../';
  return '';
}

/* ───── RENDER HEADER (user-chip + dropdown perfil) ───── */
function renderHeader(perfil) {
  const data = ProjectData.getPerfilData(perfil);
  return `
    <button type="button" class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú" aria-expanded="false">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="header-brand-group">
      <span class="naowee-badge naowee-badge--brand">Módulo Project</span>
    </div>
    <div class="profile-switcher" id="profileSwitcher">
      <div class="user-chip" id="userChip">
        <div class="ava">
          <div class="ava-ring" style="background:${data.color}22;color:${data.color}">${data.avatar}</div>
          <div class="ava-dot"></div>
        </div>
        <div class="user-info">
          <span class="user-name">${data.nombre}</span>
          <span class="user-role">${data.cargo}</span>
        </div>
        <button class="user-chip__chevron" aria-label="Abrir menú">${ICONS.chevron}</button>
      </div>
      <div class="profile-dd" id="profileDd">
        <div class="profile-dd__header">
          <div class="ava-ring" style="width:40px;height:40px;background:${data.color}22;color:${data.color};font-size:14px">${data.avatar}</div>
          <div class="profile-dd__user">
            <strong>${data.nombre}</strong>
            <small>${data.email}</small>
            <span class="profile-dd__current-role" style="color:${data.color}">
              <span class="profile-dd__check-ico">${ICONS.check}</span>
              ${data.cargo}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ───── DEMO ROLE SWITCHER (chip flotante inferior) ───── */
function renderDemoSwitcher(perfil) {
  const data = ProjectData.getPerfilData(perfil);
  const PERFILES = ['admin', 'municipio', 'revisor'];
  const revisorActivo = ProjectData.getRevisorActivo?.();
  const items = PERFILES.map(p => {
    const d = ProjectData.getPerfilData(p);
    const isActive = p === perfil;
    return `
      <a class="demo-role-switcher__item ${isActive ? 'is-active' : ''}"
         href="#" data-perfil="${p}">
        <div class="demo-role-switcher__avatar" style="background:${d.color}22;color:${d.color}">${d.avatar}</div>
        <div class="demo-role-switcher__meta">
          <strong>${d.nombre}</strong>
          <small>${d.cargo}</small>
        </div>
        ${isActive ? `<div class="demo-role-switcher__check">${ICONS.check}</div>` : ''}
      </a>
    `;
  }).join('');

  /* v2.0 — Cuando estás logueado como revisor, mostrar el equipo agrupado
     por tipo (RBI / General / Técnico) para reflejar el orden secuencial
     de revisión. Cada item cambia el `revisorId` del perfil. */
  let equipoItems = '';
  if (perfil === 'revisor' && ProjectData.getRevisores) {
    const equipo = ProjectData.getRevisores();
    const grupos = [
      { tipo: 'rbi',     label: 'Revisor RBI · paso 1 de revisión' },
      { tipo: 'general', label: 'Revisor Doc. General · paso 2' },
      { tipo: 'tecnico', label: 'Revisores técnicos · paso 3 (por especialidad)' }
    ];
    equipoItems = grupos.map(g => {
      const miembros = equipo.filter(r => r.tipo === g.tipo);
      if (!miembros.length) return '';
      return `
        <div class="demo-role-switcher__panel-label" style="margin-top:6px">${g.label}</div>
        <div class="demo-role-switcher__list">
          ${miembros.map(r => {
            const isActive = revisorActivo?.id === r.id;
            return `
              <a class="demo-role-switcher__item ${isActive ? 'is-active' : ''}"
                 href="#" data-revisor="${r.id}">
                <div class="demo-role-switcher__avatar" style="background:${r.color}22;color:${r.color}">${r.avatar}</div>
                <div class="demo-role-switcher__meta">
                  <strong>${r.nombre}</strong>
                  <small>${r.especialidad}</small>
                </div>
                ${isActive ? `<div class="demo-role-switcher__check">${ICONS.check}</div>` : ''}
              </a>`;
          }).join('')}
        </div>
      `;
    }).join('');
  }

  return `
    <div class="demo-role-switcher" id="demoSwitcher">
      <button class="demo-role-switcher__toggle" id="demoSwitcherToggle">
        <span class="demo-role-switcher__badge">DEMO</span>
        <div class="ava-ring" style="width:24px;height:24px;background:${data.color}22;color:${data.color};font-size:10px">${data.avatar}</div>
        <span class="demo-role-switcher__lbl">${data.nombre.split(' ')[0]} · ${perfil}</span>
        <span class="demo-role-switcher__chev">${ICONS.chevron}</span>
      </button>
      <div class="demo-role-switcher__panel" id="demoSwitcherPanel">
        <div class="demo-role-switcher__panel-label">Cambiar de perfil (simulado)</div>
        <div class="demo-role-switcher__list">${items}</div>
        ${equipoItems}
        ${renderDemoModeSection()}
        <div class="demo-role-switcher__panel-footer">
          <button type="button" class="demo-reset-btn" id="demoResetBtn" title="Restablece el mock data al estado original (útil después de probar acciones como activar inversión)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Reiniciar demo
          </button>
        </div>
      </div>
    </div>
  `;
}

/* v2.0 — Sección "Modo demo" en el switcher (Doug 14/05/2026) */
function renderDemoModeSection() {
  const mode = ProjectData.getDemoMode?.() || 'guided';
  const esGuiado = mode === 'guided';
  return `
    <div class="demo-role-switcher__panel-label" style="margin-top:8px">Modo demo</div>
    <div class="demo-mode-row">
      <div class="demo-mode-row__current">
        <span class="demo-mode-row__chip ${esGuiado ? 'is-active' : ''}">Guiado · vacío</span>
        <span class="demo-mode-row__chip ${esGuiado ? '' : 'is-active'}">Libre · con datos</span>
      </div>
      <div class="demo-mode-row__actions">
        ${esGuiado
          ? `<button type="button" class="demo-mode-row__btn" id="demoSwitchModeBtn">Saltar a modo libre →</button>`
          : `<button type="button" class="demo-mode-row__btn" id="demoSwitchModeBtn">← Volver al modo guiado</button>`}
        <button type="button" class="demo-mode-row__btn demo-mode-row__btn--quiet" id="demoRestartTourBtn">Reiniciar tour</button>
      </div>
    </div>
  `;
}

/* ───── TOOLTIPS para sidebar colapsado ─────
   Posición fija calculada en JS (no clipped por overflow del sidebar).
   Aparece a la altura del nav-row, pegado al borde derecho. */
function setupTooltips() {
  const sb = document.getElementById('naoweeSidebar');
  if (!sb) return;
  let tt = null;
  sb.querySelectorAll('.nav-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      if (!sb.classList.contains('collapsed')) return;
      const lbl = row.querySelector('.lbl')?.textContent?.trim();
      if (!lbl) return;
      tt = document.createElement('div');
      tt.className = 'nav-tooltip';
      tt.textContent = lbl;
      document.body.appendChild(tt);
      const rect = row.getBoundingClientRect();
      tt.style.left = (rect.right + 12) + 'px';
      tt.style.top = (rect.top + rect.height / 2) + 'px';
      requestAnimationFrame(() => tt.classList.add('is-visible'));
    });
    row.addEventListener('mouseleave', () => {
      if (tt) { tt.remove(); tt = null; }
    });
  });
}

/* ───── BIND EVENTS ───── */
function bindShell() {
  const sb = document.getElementById('naoweeSidebar');
  const tg = document.getElementById('sidebarToggle');
  if (tg && sb) {
    tg.addEventListener('click', () => {
      sb.classList.toggle('collapsed');
      localStorage.setItem(COLLAPSED_KEY, sb.classList.contains('collapsed') ? '1' : '0');
    });
  }
  setupTooltips();

  /* Mobile menu — burger button en top header abre/cierra sidebar como drawer */
  const mobBtn = document.getElementById('mobileMenuBtn');
  if (mobBtn && sb) {
    /* Backdrop click-out: cierra el sidebar tocando fuera */
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }
    const setOpen = (open) => {
      sb.classList.toggle('is-mobile-open', open);
      backdrop.classList.toggle('is-visible', open);
      mobBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('sidebar-locked', open);
    };
    mobBtn.addEventListener('click', () => {
      setOpen(!sb.classList.contains('is-mobile-open'));
    });
    backdrop.addEventListener('click', () => setOpen(false));
    /* Cerrar al hacer click en un nav-row (navegación) */
    sb.querySelectorAll('.nav-row').forEach(row => {
      row.addEventListener('click', () => setOpen(false));
    });
    /* Cerrar si la pantalla se agranda */
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && sb.classList.contains('is-mobile-open')) {
        setOpen(false);
      }
    });
  }

  /* Profile dropdown */
  const ps = document.getElementById('profileSwitcher');
  const chip = document.getElementById('userChip');
  if (ps && chip) {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      ps.classList.toggle('open');
    });
    document.addEventListener('click', () => ps.classList.remove('open'));
  }

  /* Demo switcher */
  const ds = document.getElementById('demoSwitcher');
  const dt = document.getElementById('demoSwitcherToggle');
  if (dt && ds) {
    dt.addEventListener('click', (e) => {
      e.stopPropagation();
      ds.classList.toggle('open');
    });
    document.addEventListener('click', () => ds.classList.remove('open'));
    ds.querySelectorAll('[data-perfil]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const next = a.dataset.perfil;
        ProjectData.setPerfil(next);
        /* Navegar al inicio del rol elegido con fade suave (sin salto) */
        const map = {
          admin: 'admin/dashboard.html',
          municipio: 'municipio/dashboard.html',
          revisor: 'revisor/dashboard.html'
        };
        ds.classList.remove('open');
        fadeAndGo(pathPrefix() + map[next]);
      });
    });

    /* Cambiar el revisor activo dentro del perfil revisor (equipo de 5).
       Útil para verificar el gate "solo apruebas lo tuyo" en áreas + doc general. */
    ds.querySelectorAll('[data-revisor]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const revId = a.dataset.revisor;
        const rev = ProjectData.getRevisor(revId);
        if (!rev) return;
        ProjectData.update(s => {
          s.perfilActivo = 'revisor';
          s.perfiles.revisor = {
            ...s.perfiles.revisor,
            revisorId: revId,
            nombre: rev.nombre,
            avatar: rev.avatar,
            color: rev.color,
            cargo: `Revisor · ${rev.especialidad}`
          };
        });
        ds.classList.remove('open');
        fadeAndGo(pathPrefix() + 'revisor/dashboard.html');
      });
    });

    /* Reiniciar demo: limpia localStorage y recarga el seed original */
    document.getElementById('demoResetBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('¿Reiniciar la demo? Se restablecerán todos los proyectos al estado inicial (perderás cambios de prueba como activación de inversión, aprobaciones, devoluciones, etc.).')) return;
      ProjectData.reset();
      window.location.reload();
    });

    /* v2.0 — Toggle Modo guiado / libre (Doug 14/05/2026) */
    document.getElementById('demoSwitchModeBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = ProjectData.getDemoMode?.() || 'guided';
      const next = cur === 'guided' ? 'free' : 'guided';
      ProjectData.setDemoMode(next);
      /* Limpia flag de tour cerrado para que reaparezca si vuelve a guided */
      if (next === 'guided') localStorage.removeItem('naowee.project.tourClosed');
      window.location.href = pathPrefix() + 'admin/dashboard.html';
    });
    /* Reiniciar tour: limpia flag de cerrado y refresca el tour */
    document.getElementById('demoRestartTourBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('naowee.project.tourClosed');
      window.location.reload();
    });
  }

  /* Cerrar sesión → volver al index para reset */
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = pathPrefix() + 'index.html';
    });
  });
}

/* ───── fadeAndGo — navegación con slide SOLO de .page (sidebar/header fijos)
   Pareado con .page-fade-in (entrada desde la derecha en pages.css).
   El sidebar y top-header NO deben moverse durante la transición. */
export function fadeAndGo(href) {
  const page = document.querySelector('.page');
  if (!page) { window.location.href = href; return; }
  page.style.transition = 'opacity .2s ease, transform .2s cubic-bezier(.32,.72,0,1)';
  page.style.opacity = '0';
  page.style.transform = 'translateX(-12px)';
  setTimeout(() => { window.location.href = href; }, 200);
}
/* Exponer global para uso desde onclick inline */
if (typeof window !== 'undefined') window.fadeAndGo = fadeAndGo;

/* ───── Intercepta clicks en <a> con href interno → fadeAndGo automático.
   Aplica TRANSVERSALMENTE a toda la app sin tocar cada HTML.
   Excluye: external (http/https), anchors (#), target=_blank, mailto/tel,
   y links con data-no-fade="1" (escape hatch). */
function bindGlobalFadeNav() {
  if (window.__naoweeFadeNavBound) return;
  window.__naoweeFadeNavBound = true;
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    if (a.dataset.noFade === '1') return;
    if (a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http://') ||
        href.startsWith('https://') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:')) return;
    /* Modificadores del usuario: ctrl/cmd/shift/middle click → respetar */
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    fadeAndGo(a.href);
  }, true);
}
if (typeof window !== 'undefined') bindGlobalFadeNav();

/* ───── Naowee floating footer ───── */
function mountNaoweeFooter() {
  if (document.querySelector('.naowee-floating-footer')) return;
  const footer = document.createElement('div');
  footer.className = 'naowee-floating-footer';
  footer.setAttribute('role', 'contentinfo');
  footer.setAttribute('aria-label', 'Pie de página Naowee');
  /* Doug 19/05/2026 rev2: version switcher con historial.
     PROJECT_VERSION = versión que está corriendo este snapshot.
     Dropdown fetches /releases del repo (cache sessionStorage 10 min) y
     lista todas las versiones publicadas (cada una snapshot bajo
     /project/vX.Y.Z/). Highlight de la versión activa + link al release
     notes en GitHub. */
  const PROJECT_VERSION = 'v2.0.1';
  const REPO = 'naowee-tech/naowee-test-digitacion';
  const RELEASE_URL = `https://github.com/${REPO}/releases/tag/project-${PROJECT_VERSION}`;
  footer.innerHTML = `
    <img src="${pathPrefix()}shared/logos/naowee.svg" alt="Naowee" class="naowee-floating-footer__logo" onerror="this.style.display='none'"/>
    <div class="naowee-floating-footer__sep"></div>
    <span class="naowee-floating-footer__text">Todos los derechos reservados <strong>&copy; 2026</strong></span>
    <div class="naowee-floating-footer__sep"></div>
    <div class="naowee-version-switcher" data-version="${PROJECT_VERSION}">
      <button type="button" class="naowee-version-switcher__trigger" aria-haspopup="listbox" aria-expanded="false" title="Cambiar versión / ver historial">
        Project <strong>${PROJECT_VERSION}</strong>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <div class="naowee-version-switcher__menu" role="listbox" hidden>
        <div class="naowee-version-switcher__head">
          <span>Historial de versiones</span>
          <a href="${RELEASE_URL}" target="_blank" rel="noopener" class="naowee-version-switcher__release-link">Release notes ↗</a>
        </div>
        <div class="naowee-version-switcher__list" data-version-list>
          <div class="naowee-version-switcher__loading">Cargando…</div>
        </div>
        <div class="naowee-version-switcher__foot">
          <a href="https://github.com/${REPO}/releases" target="_blank" rel="noopener">Ver todos los releases en GitHub ↗</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
  bindFooterScrollHide(footer);
  bindVersionSwitcher(footer, PROJECT_VERSION, REPO);
  window.__naoweeFooterBound = true;
}

/* ───── Version switcher: fetch releases + render dropdown ─────
   El badge del footer es un dropdown. Click → fetch /releases del repo
   (cache 10min en sessionStorage), lista versiones bajo /project/vX.Y.Z/.
   Cada item navega al index.html de esa versión.
   Fallback: si la API falla (offline, rate limit), muestra solo la
   versión activa como link al release notes. */
function bindVersionSwitcher(footer, currentVersion, repo) {
  const wrap = footer.querySelector('.naowee-version-switcher');
  const trigger = wrap?.querySelector('.naowee-version-switcher__trigger');
  const menu = wrap?.querySelector('.naowee-version-switcher__menu');
  const list = wrap?.querySelector('[data-version-list]');
  if (!trigger || !menu || !list) return;

  let loaded = false;

  function pathToVersion(v) {
    /* Construye URL al snapshot de esa versión:
       https://.../naowee-test-digitacion/project/vX.Y.Z/index.html
       Si estamos en el root live (sin /vX.Y.Z/ en el path), navega a /project/vX.Y.Z/
       Si estamos en /project/vA.B.C/ (snapshot), navega a /project/vX.Y.Z/ */
    const path = location.pathname;
    /* Reemplaza /vX.Y.Z/ del path actual por la nueva versión, o agrega /vX.Y.Z/ si live */
    const versionRe = /\/v\d+\.\d+\.\d+\//;
    if (versionRe.test(path)) {
      return location.origin + path.replace(versionRe, `/${v}/`);
    }
    /* Live (sin versión en path): inserta /vX.Y.Z/ después de /project/ */
    const projectRe = /\/project\/(.*)$/;
    const m = path.match(projectRe);
    if (m) {
      return location.origin + path.replace(projectRe, `/project/${v}/${m[1] || 'index.html'}`);
    }
    /* Fallback: navega al index del snapshot */
    return `${location.origin}/naowee-test-digitacion/project/${v}/index.html`;
  }

  async function loadReleases() {
    if (loaded) return;
    const cacheKey = `naowee_versions_${repo}`;
    let releases = null;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < 10 * 60 * 1000) releases = data;
      }
    } catch (e) {}

    if (!releases) {
      try {
        const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=30`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        releases = await r.json();
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: releases })); } catch (e) {}
      } catch (e) {
        list.innerHTML = `
          <div class="naowee-version-switcher__error">
            No se pudo cargar la lista de versiones (revisa conexión o rate limit).
            <br/><a href="https://github.com/${repo}/releases" target="_blank" rel="noopener">Abrir releases en GitHub ↗</a>
          </div>
        `;
        loaded = true;
        return;
      }
    }

    /* Filtra solo project-vX.Y.Z (excluye tags de otros módulos) y ordena desc */
    const projectReleases = (releases || [])
      .filter(rel => /^project-v\d+\.\d+\.\d+$/.test(rel.tag_name))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (projectReleases.length === 0) {
      list.innerHTML = `<div class="naowee-version-switcher__empty">Sin releases publicados aún.</div>`;
      loaded = true;
      return;
    }

    list.innerHTML = projectReleases.map(rel => {
      const v = rel.tag_name.replace(/^project-/, '');
      const isActive = v === currentVersion;
      const isLatest = rel === projectReleases[0];
      const date = new Date(rel.published_at || rel.created_at).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      return `
        <a href="${pathToVersion(v)}" class="naowee-version-switcher__item ${isActive ? 'is-active' : ''}" role="option" aria-selected="${isActive}">
          <span class="naowee-version-switcher__item-version">${v}</span>
          <span class="naowee-version-switcher__item-meta">
            ${isLatest ? '<span class="naowee-version-switcher__badge naowee-version-switcher__badge--latest">Latest</span>' : ''}
            ${isActive ? '<span class="naowee-version-switcher__badge naowee-version-switcher__badge--active">Viendo</span>' : ''}
            <span class="naowee-version-switcher__item-date">${date}</span>
          </span>
        </a>
      `;
    }).join('');
    loaded = true;
  }

  function close() {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEsc);
  }
  function onDocClick(e) {
    if (!wrap.contains(e.target)) close();
  }
  function onEsc(e) {
    if (e.key === 'Escape') close();
  }
  function open() {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    loadReleases();
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onEsc);
    }, 0);
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) open(); else close();
  });
}

/* Oculta el footer al scroll DOWN y lo reaparece al scroll UP, para
   no interferir con la última fila de tablas largas. Escucha tanto
   .page (scroll interno) como window (fallback). El handler corre
   síncrono pero usa dead-zone + timestamp para evitar churn. */
function bindFooterScrollHide(footer) {
  const TRIGGER_PX = 8;       // umbral de delta antes de actuar
  const TOP_OFFSET = 80;      // no ocultar si estamos cerca del top
  const COOLDOWN_MS = 80;     // mínimo entre evaluaciones

  function track(getY, el) {
    let lastY = getY();
    let lastT = 0;
    const handler = () => {
      const now = performance.now();
      if (now - lastT < COOLDOWN_MS) return;
      lastT = now;
      const y = getY();
      const delta = y - lastY;
      if (Math.abs(delta) < TRIGGER_PX) return;
      if (delta > 0 && y > TOP_OFFSET) {
        footer.classList.add('is-hidden');
      } else if (delta < 0) {
        footer.classList.remove('is-hidden');
      }
      lastY = y;
    };
    el?.addEventListener('scroll', handler, { passive: true });
  }

  /* .page contiene el scroll interno en la mayoría de pantallas */
  const pageEl = document.querySelector('.page');
  if (pageEl) {
    track(() => pageEl.scrollTop, pageEl);
  }
  /* window como fallback (por si una página específica no usa .page) */
  track(() => window.scrollY || document.documentElement.scrollTop, window);
}

/* ───── PUBLIC API ───── */
export function mountShell({ activeId = 'inicio' } = {}) {
  const perfil = ProjectData.getPerfil();
  document.getElementById('sidebarRoot').innerHTML = renderSidebar(perfil, activeId);
  document.getElementById('topHeader').innerHTML = renderHeader(perfil);
  document.getElementById('demoRoleSwitcherRoot').innerHTML = renderDemoSwitcher(perfil);
  mountNaoweeFooter();
  bindShell();
  document.title = `${MENUS[perfil].label} — Naowee Project`;

  /* Global: auto-inyectar botón clear DS en todos los .naowee-searchbox.
     También observa el DOM para enhancer searchboxes que se rendericen
     posteriormente (modales, paneles, etc.). Doug 15/05. */
  enhanceSearchboxes(document);
  observeSearchboxes();

  /* v2.0 — Tour guiado: se monta automáticamente en cada página cuando
     demoMode === 'guided'. Doug 14/05/2026. */
  const mode = ProjectData.getDemoMode?.() || 'guided';
  if (mode === 'guided') {
    import('./demo-tour.js?v=20260516b').then(m => m.Tour.mount()).catch(() => {});
  }

  return { perfil, perfilData: ProjectData.getPerfilData(perfil) };
}

/* ═══════════════════════════════════════════════════════════════════
   enhanceSearchboxes — Agrega botón clear DS a cualquier .naowee-searchbox
   que no lo tenga + wire del click handler. El CSS del DS muestra/oculta
   el botón automáticamente vía :not(:placeholder-shown) ~ __clear.
   ═══════════════════════════════════════════════════════════════════ */
const CLEAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

export function enhanceSearchboxes(root = document) {
  const wraps = root.querySelectorAll('.naowee-searchbox__input-wrap');
  wraps.forEach(wrap => {
    if (wrap.dataset.dsClearEnhanced === '1') return;
    wrap.dataset.dsClearEnhanced = '1';
    const input = wrap.querySelector('.naowee-searchbox__input');
    if (!input) return;
    /* No duplicar si ya existe un __clear en el markup */
    let clearBtn = wrap.querySelector('.naowee-searchbox__clear');
    if (!clearBtn) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'naowee-searchbox__clear';
      clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');
      clearBtn.tabIndex = -1;
      clearBtn.innerHTML = CLEAR_SVG;
      wrap.appendChild(clearBtn);
    }
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
    });
  });
}

let _searchboxObserver = null;
function observeSearchboxes() {
  if (_searchboxObserver) return;
  _searchboxObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.('.naowee-searchbox__input-wrap') || n.querySelector?.('.naowee-searchbox__input-wrap')) {
          enhanceSearchboxes(n.parentNode || document);
        }
      }
    }
  });
  _searchboxObserver.observe(document.body, { childList: true, subtree: true });
}

export { ICONS };
window.ProjectShell = { mountShell, ICONS, enhanceSearchboxes };
