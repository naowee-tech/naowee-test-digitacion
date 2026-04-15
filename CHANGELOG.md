# Changelog

## v2.0.0 — 2026-04-15

**Re-fundación como repo independiente.** Extracción de la carpeta `digitacion/` desde el monorepo `naowee-tech/digitacion-ui-ux-demo` (archivado como `digitacion-ui-ux-demo-legacy`) a su propio repositorio en cuenta personal para:

- Activar GitHub Pages (el repo legacy estaba en naowee-tech privado, sin Pages funcionales)
- Separar prototipos UX de datos (`parametrizacion-deportes`) y handoff técnico (`handoff-engines`)
- Alineación con la convención de usar `douguizard/*-ux-ui-demo` para prototipos visuales

### Estado al momento del split
- 30+ deportes parametrizados con 6 tipos de puntuación
- Modal de scoring unificado con routing automático por tipo de deporte
- Flujo Coordinador de Eventos + Digitador completo
- Design System Naowee con tokens y componentes BEM

### Historial previo
Todo el historial git anterior a este punto vive en `naowee-tech/digitacion-ui-ux-demo-legacy` (archivado, read-only). Allí están los tags v1.0.0 a v1.24.1 con la evolución detallada.

### Documentación
- [`ACTA-MVP.md`](./ACTA-MVP.md) — acta completa con historias de usuario, criterios de aceptación y backlog para JIRA.
