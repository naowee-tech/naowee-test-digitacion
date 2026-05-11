/* ═══════════════════════════════════════════════════════════════
   EMBED MODE — detección
   ───────────────────────────────────────────────────────────────
   Setea html[data-embed="1"] cuando la página corre dentro de un
   iframe (cross-origin o mismo origin) o cuando llega ?embed=1.
   embed-mode.css usa ese flag para ocultar sidebar + top-header.

   Debe cargarse en el <head>, ANTES de cualquier render, para que
   no haya flash del chrome del repo digitación.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  function flag() {
    document.documentElement.dataset.embed = '1';
  }
  try {
    if (/[?&]embed=1\b/.test(window.location.search)) {
      flag();
      return;
    }
    if (window.self !== window.top) {
      flag();
    }
  } catch (e) {
    /* Acceso cross-origin a window.top tira SecurityError →
       asumimos que estamos embebidos. */
    flag();
  }
})();
