# Digitación UI/UX Demo — SUID Naowee

Prototipo de interfaz y experiencia de usuario del módulo **Digitación** del Sistema Único de Información del Deporte (SUID).

Cubre el ciclo completo de registro de resultados en competencias deportivas: desde la creación y configuración por parte del **Coordinador de Eventos**, hasta la digitación de marcadores, penalizaciones, estadísticas y descalificaciones por parte del **Digitador**.

## Demo en vivo

Se sirve desde GitHub Pages: **https://douguizard.github.io/digitacion-ui-ux-demo/**

## Estructura

```
digitacion-ui-ux-demo/
├── dashboard.html      # Dashboard del Coordinador de Eventos
├── lista.html          # Lista de competencias con filtros
├── stepper.html        # Wizard de creación de competencia (4 pasos)
├── digitador.html      # Flujo del Digitador + modal de scoring
├── shared.js           # SPORTS_DB, GameTimer, utilidades
├── sports_db.js        # Base de datos parametrizada de deportes
├── scoring-modal.js    # Modal unificado de scoring (7 tipos)
├── scoring-modal.css   # Estilos del modal
├── design-system.css   # Design System Naowee (tokens + componentes BEM)
└── ACTA-MVP.md         # Documento de alcance completo para Scrum
```

## Deportes soportados

30+ deportes parametrizados con **6 tipos de puntuación**:

- **Acumulativa por tiempos** — Baloncesto, Balonmano, Beisbol, Hockey, Cricket…
- **Sets** — Voleibol, Badminton, Tenis, Padel
- **Marca** — Atletismo (56 pruebas), Remo, Natación, Ciclismo
- **Jueces** — Gimnasia, Porrismo
- **Combate** — Taekwondo, Judo, Karate, Boxeo
- **Innings** — Beisbol, Softbol, Cricket

## Cómo correr local

No hay build tools. Cualquier servidor HTTP estático sirve:

```bash
# Opción 1: Python
python3 -m http.server 4200

# Opción 2: Node http-server
npx http-server -p 4200

# Abre http://localhost:4200/dashboard.html
```

## Roles

| Rol | Página principal | Función |
|---|---|---|
| Coordinador de Eventos | `dashboard.html` | Crear, configurar y asignar competencias |
| Digitador | `digitador.html` | Registrar resultados en tiempo real |

El selector de perfil en el header permite alternar entre ambos roles.

## Stack

- HTML + CSS + JavaScript vanilla
- Google Fonts Inter (400, 500, 600, 700, 800)
- Sin framework, sin build tools, sin dependencias externas

## Repos relacionados

| Repo | Qué contiene |
|---|---|
| [`douguizard/escenarios-ux-ui-demo`](https://github.com/douguizard/escenarios-ux-ui-demo) | Prototipo del módulo Escenarios (sedes y escenarios deportivos) |
| [`naowee-tech/parametrizacion-deportes`](https://github.com/naowee-tech/parametrizacion-deportes) | CSVs fuente de verdad de reglas deportivas |
| [`naowee-tech/handoff-engines`](https://github.com/naowee-tech/handoff-engines) | Motores de scoring y modelos TypeScript para integración Angular |

## Documentación

Ver [`ACTA-MVP.md`](./ACTA-MVP.md) para:
- Historias de usuario por rol
- Criterios de aceptación
- Parametrización de deportes (SPORTS_DB schema)
- Mapa de tipos de scoring
- Backlog para JIRA

## Contexto

Este repo fue extraído el 2026-04-15 desde el monorepo `naowee-tech/digitacion-ui-ux-demo` (ahora archivado como `digitacion-ui-ux-demo-legacy`) para separar los prototipos UX de los datos de parametrización y del handoff técnico.

---

Parte del ecosistema **Naowee — Sistema Único de Información del Deporte**.
