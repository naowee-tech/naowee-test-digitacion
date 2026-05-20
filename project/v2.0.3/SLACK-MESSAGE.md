# Mensaje Slack — Dev team (release v2.0.1)

Pega esto en el canal de dev. Está pensado para que cualquiera del equipo entienda en 30 segundos qué versión está viendo, cómo navegar entre versiones y dónde reportar.

---

## ✂ Versión copia-pega (lista para Slack)

```
👋 Equipo dev — release Project v2.0.1 lista para revisión

🌐 Demo en vivo de esta versión:
https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/admin/dashboard.html

📌 Qué están viendo
• Módulo Project — flujo end-to-end de postulación → revisión → inversión
• Versión v2.0.1 (primer PATCH después de la MVP entregada v2.0.0)
• Es un snapshot frozen — los cambios futuros no afectan esta URL
• 3 perfiles: Admin · Municipio · Revisor (cambian con el chip de demo abajo)

🆕 Qué cambió en v2.0.1
• 16 commits de refinos UI/UX desde la MVP
• Edit convocatoria modal (admin puede corregir errores)
• Refactor SUID 2 fases con autopopulate inteligente
• Smart positioning de menús (no se salen del viewport)
• Ghost buttons unificados transversales
• Empty states canónicos en tabs
• Fix layout certificado de favorabilidad
→ Detalle completo: https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.1

🔀 Cómo navegar entre versiones
En el footer de cualquier página verán el badge "Project v2.0.1 ▼" — click despliega el historial completo con todas las versiones publicadas. Cada item navega al snapshot de esa versión preservando el path actual (si están en /admin/dashboard.html → los lleva a /v2.0.X/admin/dashboard.html).

💬 Feedback
• Bugs visuales / UX → comenten acá o en el PR (#9)
• Comportamiento funcional inesperado → indiquen versión + URL exacta + screenshot
• Para reproducir un bug en versión específica: usen el switcher del footer
• PR del trabajo en curso: https://github.com/naowee-tech/naowee-test-digitacion/pull/9

🔗 Links útiles
• Live (latest): https://naowee-tech.github.io/naowee-test-digitacion/project/index.html
• Snapshot v2.0.1: https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/index.html
• Snapshot v2.0.0: https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.0
• CHANGELOG completo: https://github.com/naowee-tech/naowee-test-digitacion/blob/project/refinements-validation-suite/project/CHANGELOG.md
• ACTA MVP (PM-ready, 19 HUs): https://github.com/naowee-tech/naowee-test-digitacion/blob/project/refinements-validation-suite/project/ACTA-MVP-PROJECT-v1.0.md
• Proceso de release (para próximas versiones): https://github.com/naowee-tech/naowee-test-digitacion/blob/project/refinements-validation-suite/project/RELEASE-PROCESS.md

Cualquier duda pinguéenme. 🚀
```

---

## Variantes más cortas

### Para Slack thread / DM (60 segundos)

```
🚀 Release Project v2.0.1 → https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/admin/dashboard.html

• Primer PATCH post-MVP (16 commits de refinos UI/UX)
• Footer tiene un switcher de versiones para navegar entre snapshots
• Cambios completos: https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.1
• Feedback en PR #9 o acá ↓
```

### Para anuncio formal (release announcement)

```
📦 Naowee Project Module · v2.0.1 disponible

Primer PATCH consolidado después de la MVP. 16 commits de refinos
distribuidos en los 3 perfiles del sistema (Admin · Municipio · Revisor).

👉 Demo en vivo (snapshot frozen):
https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/admin/dashboard.html

📋 Release notes con todos los cambios:
https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.1

Para navegar entre versiones, usen el dropdown del footer.
Feedback en el PR #9 o respondiendo a este mensaje.
```

---

## Convenciones para futuros mensajes de release

**Estructura recomendada:**
1. 👋 Apertura + qué versión es
2. 🌐 URL principal (snapshot del dashboard del rol más usado)
3. 📌 Qué están viendo (módulo, versión, contexto)
4. 🆕 Qué cambió (3-5 highlights + link al release completo)
5. 🔀 Cómo navegar entre versiones (mención del switcher)
6. 💬 Cómo dar feedback (canales, formato esperado)
7. 🔗 Links útiles (live, historial, docs)

**Tono:**
- Directo, sin jerga innecesaria
- Emojis solo donde aportan jerarquía visual (apertura de cada bloque)
- Asume conocimiento técnico básico (saben qué es un PR, una URL, etc)
- Evita acrónimos sin explicar (SUID, RBI, RUNT) — al menos la primera vez

**Lo que NO incluir en el mensaje principal:**
- Lista exhaustiva de commits (eso va en el release notes de GitHub)
- Detalles técnicos de implementación
- Disclaimers o caveats largos
- "TLDR" cuando el mensaje ya es corto

**Adapta el template:**
- Si es MAJOR release → enfatiza breaking changes al inicio, no al final
- Si es MINOR → enfatiza la nueva sub-funcionalidad
- Si es PATCH → mantén corto, foco en "qué se arregló"

---

**Última actualización:** 2026-05-19 (template para release v2.0.1)
