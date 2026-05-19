# Project v2.0 — Flujos por rol para validación con stakeholders

> **Estado:** Propuesta de modelo · pendiente de validación con Andrea Rodríguez, Danna Arrieta y Juan Manuel Armero.
> **Fecha:** 14 de mayo de 2026
> **Origen:** Acta de la llamada del 13/05/2026 (Danna + Juanma) + nuevo documento normativo `Lista-chequeo-Resolucion-933-de-2024-v2.xlsx`.
> **No implementar nada del código todavía** — primero recibir feedback sobre los diagramas.

---

## 1 · Resumen v1.0 → v2.0

| Aspecto | v1.0 (congelada en `naowee-tech/naowee-test-project`) | v2.0 (propuesta) |
|---|---|---|
| Wizard postular | 6 pasos · arranca con "Entidad formuladora" | **5 pasos · sin entidad formuladora** (se hereda del perfil municipio) |
| Carga de documentos | 1 paso final con 9 áreas mezcladas | **3 bloques diferenciados**: RBI · Doc General · Doc Técnica |
| Revisor RBI | Cualquier revisor del pool decide RBI | **Rol dedicado** `rev-rbi-001` con scope explícito |
| Revisor Doc General | rev-005 lo hace pero sin scope explícito | **Rol dedicado** `rev-general-001` |
| Revisores técnicos | 4 especialistas, ven RBI también | 4 especialistas, **bloqueados hasta que RBI esté aprobado** |
| Orden de revisión | RBI → todo en paralelo (general + áreas) | **RBI → (Doc General + 8 áreas en paralelo)** — orden secuencial |
| Prórroga | RBI puede pedir, admin aprueba | **Cualquier revisor** puede pedir (RBI, general, técnico) — admin aprueba |
| Subsanación municipio | 15 días hábiles, no prorrogable, expira | Igual (sin cambio) |

**El cambio central:** el municipio carga TODA la documentación al postular, pero la revisión es **secuencial y por capas**.

---

## 2 · TO DO list priorizado

Extraído del acta del 13/05/2026 (Danna + Juanma):

| # | P | Tema | Cita / origen | Estado en v1.0 |
|---|---|---|---|---|
| 1 | **P0** | Subir RBI + Doc General + Doc Técnica en **3 bloques diferenciados** al postular | Danna: *"se dividió la parte de requisitos básicos indispensables, que son unos temas, y la revisión técnica sectorial, que son otros"* | Hoy es 1 bloque con 9 áreas mezcladas |
| 2 | **P0** | Quitar paso "Entidad formuladora" del wizard | Doug + Danna (acordado verbalmente) | Existe como paso 1 |
| 3 | **P0** | Crear rol **Revisor RBI** dedicado | Danna: *"Juan Manuel es revisor de requisitos básicos indispensables"* | Cualquier revisor decide RBI |
| 4 | **P0** | Crear rol **Revisor Doc General** dedicado | Danna: *"rol revisor, revisor de documentación general"* | rev-005 hace doc general pero sin scope explícito |
| 5 | **P0** | Orden de revisión secuencial: **RBI → (Doc General + 8 áreas en paralelo)** | Danna: *"orden orden orden de las revisiones"* | RBI → etapa documental con todo simultáneo |
| 6 | **P0** | Prórroga **sólo para revisores**, no para municipio | Danna + Juanma: *"prórroga para revisión, no prórroga para subsanación"* | v1.0 ya tiene prórroga revisor RBI; falta extenderla a general y técnicos |
| 7 | **P1** | Justificación de cambios en cada subsanación (trazabilidad) | Danna: *"ahí eso me falta"* (acta) | Hoy hay textarea, falta marcarla como required ≥20 chars |
| 8 | **P1** | Expiración automática 15 días tras devolución | Acta | Existe `sla-expiry.js`, validar que aplique a subsanación |
| 9 | **P1** | Re-postulación: mismo `idUnico` + nuevo `radicado` en próxima convocatoria | Doug: *"escenario subsanación fuera de plazo"* | No implementado |
| 10 | **P1** | Notificación a municipios cuando se selecciona departamento (cascada) | Juanma | Hoy es lista explícita de municipios |
| 11 | **P2** | Validar copy y campos del xlsx v2 vs los 9 bloques actuales | Diff Excel viejo vs v2 | Necesita pasada de QA del xlsx |
| 12 | **P2** | Variants: Construcción nueva / Mejoramiento / Adecuación / Dotación cambian documentos requeridos | Acta 13/05 (Juanma) | Hoy todos los tipos piden lo mismo |

**Aristas abiertas** (no implementar, **preguntar a stakeholders en la validación**):

- ¿Cuántos proyectos puede postular un municipio por convocatoria?
- Si se expira un proyecto pero la convocatoria sigue abierta, ¿puede crear otro nuevo distinto? (acuerdo tentativo: sí, pero NO el mismo)
- ¿Plantillas de notificación editables o fijas en v2.0? (Juanma: implica refactor backend, posponer)
- ¿La prórroga del revisor de Doc General y de los técnicos es independiente por persona, o solo una por proyecto?
- Si se devuelve solo una área técnica, ¿el municipio reabre el wizard completo o solo el bloque de esa área?

---

## 3 · Modelo de datos propuesto

### 3.1 · Estados del proyecto (v2.0)

```
borrador
  → presentado (envío + radicado)
    → en_revision_rbi
      → rbi_aprobada (RBI ok)
        → en_revision_docs  (Doc General + 8 áreas en paralelo)
          → concepto_favorable (todas ok)
            → en_inversion (admin activa)
          → devuelta_subsanacion_docs (alguna devuelta)
            → en_revision_docs (municipio subsana)
            → expirada (no subsana en 15d)
      → devuelta_subsanacion_rbi
        → en_revision_rbi (municipio subsana)
        → expirada (no subsana en 15d)
      → rechazada (terminal)
  → expirada → presentado (re-postulación, mismo idUnico, nuevo radicado)
```

### 3.2 · Pool de revisores ampliado

| ID | Nombre | Especialidades | Scope |
|---|---|---|---|
| `rev-rbi-001` | (nuevo, asignar) | `rbi` | Bloque 1 — Requisitos Básicos Indispensables |
| `rev-general-001` | Luis Felipe Rondón (renombrado de `rev-005`) | `general` | Bloque 2 — Documentación general (Art. 1 y 2 + sec. 2.1–2.7) |
| `rev-001` | Juan Manuel Ávila | `arquitectonico`, `estructural` | Áreas 3.3 y 3.4 del Bloque 3 |
| `rev-002` | María Elena Cortés | `hidrosanitario`, `electrico` | Áreas 3.5 y 3.6 |
| `rev-003` | Carlos Beltrán | `suelos`, `topografico` | Áreas 3.1 y 3.2 |
| `rev-004` | Andrea Quintero | `ambiental`, `presupuesto` | Áreas 3.7 y 3.8 |

**Total:** 6 revisores (2 nuevos roles + 4 especialistas existentes).

### 3.3 · Estructura de documentación por bloque

| Bloque | Sección | # docs aprox. | Quién revisa |
|---|---|---|---|
| **1 · RBI** | Carta intención, titularidad predio, info geográfica básica | ~10 | rev-rbi-001 |
| **2 · Doc General** | Análisis necesidad, sostenibilidad, licencias, servicios públicos | ~15 | rev-general-001 |
| **3 · Doc Técnica** | Topográfico, suelos, arquitectónico, estructural, hidrosanitario, eléctrico, ambiental, presupuesto | ~25 en 8 áreas | rev-001 a rev-004 (auto-asignación por especialidad) |

---

## 4 · Diagrama 1 — Administrador de Convocatoria (Ministerio)

**Perfil:** Andrea Rodríguez · Recursos y Herramientas del Ministerio del Deporte.

```mermaid
flowchart TD
    Start([Admin · Andrea Rodriguez]):::roleAdmin
    Start --> A1[Crear convocatoria<br/>bienio + rango fechas]
    A1 --> A2[Paso 4 wizard:<br/>elegir areas requeridas<br/>+ responsables]
    A2 --> A3{Habilitar}
    A3 -->|Si| A4[Notificar municipios<br/>throttle 24h + filtros]
    A3 -->|Aun no| A5[(Convocatoria<br/>en borrador)]:::stateNeutral
    A4 --> A6[(Convocatoria<br/>abierta)]:::stateOk
    A6 --> A7[Ve postulaciones llegando<br/>dashboard + proyectos.html]
    A7 --> A8{Algun revisor<br/>pide prorroga}
    A8 -->|Si| A9[Notif en<br/>admin/prorrogas.html]
    A9 --> A10{Decision}
    A10 -->|Aprobar| A11[+15 dias al revisor]:::stateOk
    A10 -->|Rechazar| A12[Revisor sigue plazo<br/>original + alerta]:::stateWarn
    A7 --> A13{Concepto<br/>favorable}
    A13 -->|Si| A14[Banner verde<br/>X listos para activar]
    A14 --> A15[Wizard activar inversion<br/>BPIN + monto + centro costo]
    A15 --> A16[Registro SUID · 3 fases]
    A16 --> A17([Tabla de inversion<br/>con sumatoria]):::stateOk
    A6 --> A18[Convocatoria cierra<br/>por fecha]
    A18 --> A19[(Cerrada · solo<br/>revision pendiente)]:::stateNeutral
    
    classDef roleAdmin fill:#FF7500,color:#fff,stroke:#c45e00
    classDef stateOk fill:#e6f4e7,color:#15803d,stroke:#b7dfb9
    classDef stateNeutral fill:#f5f6fa,color:#646587,stroke:#d0d4e6
    classDef stateWarn fill:#fff3e6,color:#c54500,stroke:#ffbf75
```

### Caminos alternos del admin

1. **Rechaza prórroga** → revisor sigue con plazo original, recibe alerta.
2. **Convocatoria cierra por fecha** → estado `cerrada`, no acepta nuevas postulaciones pero sigue procesando las existentes.
3. **Cancela convocatoria** (no en happy path) → estado terminal `cancelada`, todas las postulaciones quedan suspendidas.

---

## 5 · Diagrama 2 — Municipio / Ente Territorial

**Perfil:** Carlos Mosquera Rentería · Secretario de Planeación de Quibdó (Chocó). Otros perfiles válidos: Alcaldía Distrital, Gobernación Departamental, Resguardo Indígena, Consejo Comunitario Afrodescendiente.

```mermaid
flowchart TD
    Start([Municipio · Carlos Mosquera<br/>Quibdo, Choco]):::roleMuni
    Start --> M1[Ve dashboard<br/>convocatorias activas]
    M1 --> M2[Entra a convocatoria<br/>lee TDR]
    M2 --> M3[Click 'Postular']
    M3 --> M4[Wizard v2.0 · 5 pasos]
    M4 --> M5[Paso 1: Datos del proyecto<br/>nombre, tipo, fase, modalidades]
    M5 --> M6[Paso 2: Predio + financiacion<br/>direccion, lat/lng, presupuesto]
    M6 --> M7[Paso 3: Representante<br/>+ carta intencion]
    M7 --> M8[Paso 4: Documentacion en 3 bloques]
    M8 --> M8A[Bloque RBI · 10 docs]
    M8 --> M8B[Bloque Doc General · 15 docs]
    M8 --> M8C[Bloque Doc Tecnica · 8 areas, 25 docs]
    M8A --> M9[Paso 5: Revisar]
    M8B --> M9
    M8C --> M9
    M9 --> M10[Enviar postulacion]
    M10 --> M11[(Radicado emitido)]:::stateInfo
    M11 --> M12{Esperando<br/>revision 15d habiles}
    M12 -->|Aprobado todo| M13([Concepto favorable<br/>+ certificado PDF]):::stateOk
    M12 -->|Devuelto RBI o docs| M14[Lee observaciones<br/>en proyecto-perfil]
    M14 --> M15[Modal subsanar<br/>15d sin prorroga]
    M15 --> M16{Subsana<br/>a tiempo}
    M16 -->|Si| M17[Re-envio automatico]
    M17 --> M12
    M16 -->|No, expira| M18([Expirada]):::stateWarn
    M18 --> M19[Puede re-postular en<br/>proxima convocatoria<br/>mismo ID, nuevo radicado]
    M19 --> M3
    M12 -->|Rechazado terminal| M20([Rechazada terminal]):::stateBad
    
    classDef roleMuni fill:#2563eb,color:#fff,stroke:#1d4ed8
    classDef stateOk fill:#e6f4e7,color:#15803d,stroke:#b7dfb9
    classDef stateInfo fill:#eef5ff,color:#1f78d1,stroke:#c7dbf7
    classDef stateWarn fill:#fff3e6,color:#c45000,stroke:#ffbf75
    classDef stateBad fill:#fff0ee,color:#b42318,stroke:#ffc4bb
```

### Caminos alternos del municipio

1. **Devolución a subsanación** (RBI o algún bloque de docs) → 15 días hábiles, NO prorrogable → si no responde, expira.
2. **Expiración** → puede re-postular en la **próxima convocatoria** preservando el `idUnico` (radicado nuevo, indica continuidad para auditoría).
3. **Rechazo terminal** → no puede re-postular este mismo proyecto; puede crear uno nuevo con id distinto.

---

## 6 · Diagrama 3 — Revisor RBI

**Perfil:** `rev-rbi-001` · revisor dedicado a Requisitos Básicos Indispensables. Hoy en v1.0 no existe como perfil distinto — se crea en v2.0.

```mermaid
flowchart TD
    Start([Revisor RBI<br/>rev-rbi-001 · especialidad: rbi]):::roleRev
    Start --> R1[Dashboard:<br/>X proyectos presentados<br/>esperando RBI]
    R1 --> R2[Bandeja:<br/>filtros por convocatoria + plazo]
    R2 --> R3[Entra a proyecto<br/>estado: presentado]
    R3 --> R4[Lee perfil completo<br/>+ todos los documentos<br/>foco: bloque RBI ~10 docs]
    R4 --> R5{Decision RBI}
    R5 -->|Favorable| R6([estado: rbi_aprobada<br/>libera siguientes revisores]):::stateOk
    R5 -->|Devolver| R7[Modal observaciones<br/>scope: RBI]
    R7 --> R8([devuelta_subsanacion_rbi]):::stateWarn
    R8 --> R9[Espera subsanacion<br/>15d habiles]
    R9 --> R10{Municipio<br/>subsana}
    R10 -->|Si en plazo| R4
    R10 -->|No| R11([expirada]):::stateExp
    R5 -->|Rechazar| R12([rechazada terminal]):::stateBad
    R1 --> R13{Plazo vencido<br/>o por vencer}
    R13 -->|Si| R14[Widget prorroga RBI<br/>en revisar-postulacion.html]
    R14 --> R15[Modal solicitar<br/>motivo min 10 chars]
    R15 --> R16([Pendiente admin]):::stateInfo
    R16 --> R17{Admin decide}
    R17 -->|Aprobada| R18[+15d habiles]:::stateOk
    R17 -->|Rechazada| R19[Plazo original<br/>+ alerta]:::stateWarn
    R18 --> R4
    R19 --> R4
    
    classDef roleRev fill:#7c3aed,color:#fff,stroke:#5b21b6
    classDef stateOk fill:#e6f4e7,color:#15803d,stroke:#b7dfb9
    classDef stateInfo fill:#eef5ff,color:#1f78d1,stroke:#c7dbf7
    classDef stateWarn fill:#fff3e6,color:#c45000,stroke:#ffbf75
    classDef stateExp fill:#f5f6fa,color:#646587,stroke:#d0d4e6
    classDef stateBad fill:#fff0ee,color:#b42318,stroke:#ffc4bb
```

### Caminos alternos del revisor RBI

1. **Solicita prórroga** (15 días extra, una sola vez por proyecto) → admin aprueba o rechaza.
2. **Devuelve a subsanación** → si el municipio no responde en 15d, el proyecto **expira automáticamente** (sla-expiry).
3. **Rechaza terminal** → cierra el flujo; el municipio puede crear otro proyecto distinto pero no re-postular el mismo.

---

## 7 · Diagrama 4 — Revisor Documentación General

**Perfil:** `rev-general-001` · revisor dedicado a la documentación general (Art. 1 y 2 Res. 933 + secciones 2.1–2.7 del nuevo xlsx). Es el reemplazo explícito de `rev-005` Luis Felipe Rondón.

```mermaid
flowchart TD
    Start([Revisor Doc General<br/>rev-general-001 · especialidad: general]):::roleRev
    Start --> G1[Dashboard:<br/>X proyectos post-RBI<br/>esperando doc general]
    G1 --> G2{Hay proyectos<br/>rbi_aprobada}
    G2 -->|No| G3[Bandeja vacia<br/>esperar nuevas favorabilidades RBI]
    G2 -->|Si| G4[Bandeja con<br/>filtro automatico]
    G4 --> G5[Entra a proyecto]
    G5 --> G6[Foco: Doc General<br/>checklist Art. 1 y 2<br/>+ sec. 2.1-2.7]
    G6 --> G7{Decision}
    G7 -->|Aprobar| G8([Doc General aprobada]):::stateOk
    G7 -->|Devolver| G9[Observaciones<br/>scope: solo bloque general]
    G9 --> G10([devuelta_subsanacion_docs<br/>area: general]):::stateWarn
    G7 -->|Rechazar| G11([rechazada terminal]):::stateBad
    G8 --> G12{Todas las areas tecnicas<br/>tambien aprobadas}
    G12 -->|Si| G13([concepto_favorable<br/>cierre automatico]):::stateOk
    G12 -->|Aun no| G14[Espera revisores<br/>tecnicos completen]
    G14 --> G12
    G1 --> G15[Solicita prorroga<br/>al admin]
    G15 --> G16([Pendiente admin]):::stateInfo
    G16 --> G17{Admin decide}
    G17 -->|Aprobada| G18[+15d]:::stateOk
    G17 -->|Rechazada| G19[Plazo original]:::stateWarn
    G18 --> G6
    G19 --> G6
    
    classDef roleRev fill:#7c3aed,color:#fff,stroke:#5b21b6
    classDef stateOk fill:#e6f4e7,color:#15803d,stroke:#b7dfb9
    classDef stateInfo fill:#eef5ff,color:#1f78d1,stroke:#c7dbf7
    classDef stateWarn fill:#fff3e6,color:#c45000,stroke:#ffbf75
    classDef stateBad fill:#fff0ee,color:#b42318,stroke:#ffc4bb
```

### Caminos alternos del revisor Doc General

1. **Solicita prórroga** → mismo mecanismo que RBI.
2. **Devuelve a subsanación con scope `general`** → municipio corrige solo ese bloque (no toca los anexos técnicos que ya están aprobados o pendientes en otra fila).
3. **Espera a que todas las áreas técnicas terminen** → si las suyas están aprobadas pero falta alguna técnica, se queda en pausa hasta que cierre el concepto.

---

## 8 · Diagrama 5 — Revisores Técnicos por Área

**Perfil:** 4 especialistas existentes (`rev-001` a `rev-004`). Cada uno revisa SOLO las áreas de sus especialidades. La auto-asignación por especialidad ya existe en v1.0.

```mermaid
flowchart TD
    Start([Revisores tecnicos · 4 personas<br/>auto-asignacion por especialidad]):::roleRev
    Start --> T1[rev-001<br/>Arquitectonico + Estructural]
    Start --> T2[rev-002<br/>Hidrosanitario + Electrico]
    Start --> T3[rev-003<br/>Suelos + Topografico]
    Start --> T4[rev-004<br/>Ambiental + Presupuesto]
    T1 --> T5[Dashboard:<br/>tu carga · tus areas proximas a vencer]
    T2 --> T5
    T3 --> T5
    T4 --> T5
    T5 --> T6[Bandeja:<br/>columna Mis areas]
    T6 --> T7{Proyecto<br/>rbi_aprobada}
    T7 -->|No| T8[Banner amarillo:<br/>esperando RBI]:::stateWarn
    T7 -->|Si| T9[Entra al proyecto]
    T9 --> T10[Grid 8 areas<br/>doc-tecnica.html]
    T10 --> T11{Es tu<br/>especialidad}
    T11 -->|No| T12[Banner amarillo:<br/>asignada a otro<br/>consulta solamente]:::stateWarn
    T11 -->|Si| T13[Banner verde:<br/>asignada a ti]:::stateOk
    T13 --> T14[Checklist area<br/>Res. 933 Art. 3.X]
    T14 --> T15{Decision}
    T15 -->|Aprobar| T16([Area aprobada]):::stateOk
    T15 -->|Devolver| T17([Area devuelta<br/>scope: solo esta area]):::stateWarn
    T15 -->|Rechazar| T18([Area rechazada]):::stateBad
    T16 --> T19{TODAS las areas<br/>+ Doc General<br/>aprobadas}
    T19 -->|Si| T20([concepto_favorable<br/>+ certificado PDF<br/>+ notif admin y municipio]):::stateOk
    T19 -->|No| T21[Espera a otros revisores]
    T21 --> T19
    T5 --> T22[Solicita prorroga<br/>de su area al admin]
    T22 --> T23{Admin decide}
    T23 -->|Aprobada| T24[+15d en esa area]:::stateOk
    T23 -->|Rechazada| T25[Plazo original]:::stateWarn
    T24 --> T14
    T25 --> T14
    
    classDef roleRev fill:#7c3aed,color:#fff,stroke:#5b21b6
    classDef stateOk fill:#e6f4e7,color:#15803d,stroke:#b7dfb9
    classDef stateWarn fill:#fff3e6,color:#c45000,stroke:#ffbf75
    classDef stateBad fill:#fff0ee,color:#b42318,stroke:#ffc4bb
```

### Caminos alternos de los revisores técnicos

1. **Solicita prórroga de su área** → independiente por revisor (no afecta a los otros especialistas del mismo proyecto).
2. **Devuelve a subsanación con scope `topografico` / `suelos` / etc.** → municipio solo corrige esa área; las otras siguen su flujo.
3. **Admin reasigna el área** a otro especialista (caso enfermedad/saturación) — pendiente confirmar UX exacto del flujo de reasignación.

---

## 9 · Diagrama transversal — Estados del proyecto

```mermaid
stateDiagram-v2
    [*] --> borrador
    borrador --> presentado: envia postulacion<br/>genera radicado
    presentado --> en_revision_rbi: revisor RBI<br/>toma el caso
    en_revision_rbi --> rbi_aprobada: aprueba RBI
    en_revision_rbi --> devuelta_subsanacion_rbi: devuelve
    en_revision_rbi --> rechazada: rechaza terminal
    devuelta_subsanacion_rbi --> en_revision_rbi: municipio subsana <= 15d
    devuelta_subsanacion_rbi --> expirada: no subsana en 15d
    rbi_aprobada --> en_revision_docs: libera Doc General<br/>+ 8 areas tecnicas
    en_revision_docs --> concepto_favorable: TODAS aprobadas
    en_revision_docs --> devuelta_subsanacion_docs: alguna devuelta<br/>scope por bloque
    en_revision_docs --> rechazada: alguna rechazada
    devuelta_subsanacion_docs --> en_revision_docs: municipio subsana <= 15d
    devuelta_subsanacion_docs --> expirada: no subsana en 15d
    concepto_favorable --> en_inversion: admin activa<br/>BPIN + monto + SUID
    expirada --> presentado: re-postular en proxima convocatoria<br/>mismo ID, nuevo radicado
    rechazada --> [*]: terminal
    en_inversion --> [*]: ejecucion
```

---

## 10 · Aristas abiertas para los stakeholders

Estas preguntas **no están resueltas en el acta del 13/05/2026** y deben confirmarse antes de implementar v2.0:

| # | Pregunta | Quién responde |
|---|---|---|
| 1 | ¿Cuántos proyectos puede postular un municipio por convocatoria? | Danna + Andrea |
| 2 | Si un proyecto expira (subsanación vencida) pero la convocatoria sigue abierta, ¿puede crear otro proyecto distinto en la misma convocatoria? | Danna |
| 3 | La prórroga del revisor Doc General y de los técnicos, ¿es independiente por revisor o solo una por proyecto? | Juanma (consecuencias técnicas) |
| 4 | Si se devuelve solo un área técnica, ¿el municipio reabre el wizard completo o solo el bloque de esa área? | Doug + Danna (UX) |
| 5 | ¿Cuándo se notifica al revisor de Doc General y a los técnicos? ¿Al instante de aprobarse el RBI o cuando entran al sistema? | Juanma |
| 6 | ¿El admin puede reasignar un área a otro especialista? ¿Y la cuenta de prórroga se resetea con la reasignación? | Andrea |
| 7 | ¿Plantillas de notificación editables en v2.0 o queda para v3.0? | Juanma (backend) |
| 8 | Variants por tipo de solicitud (Construcción / Mejoramiento / Adecuación / Dotación) cambian la lista de documentos requeridos. ¿Aplica en v2.0 o se posterga? | Danna |

---

## 11 · Checklist de validación

Para cada stakeholder, marcar **OK** o anotar cambios:

### Andrea Rodríguez · Admin de convocatorias

- [ ] Diagrama 1 (Admin) refleja correctamente mi flujo diario.
- [ ] El panel de prórrogas (`admin/prorrogas.html` ya existe en v1.0) sigue siendo el mismo en v2.0 pero ahora recibe solicitudes de los 3 tipos de revisor.
- [ ] Activar inversión + Registro SUID **no cambia respecto a v1.0**.

### Danna Arrieta · Producto / normativa

- [ ] Diagrama 2 (Municipio) muestra los 3 bloques de documentos como esperabas.
- [ ] El paso "Entidad formuladora" queda eliminado del wizard.
- [ ] El orden secuencial RBI → (Doc General + Áreas) está correctamente reflejado.
- [ ] La re-postulación con `idUnico` preservado pero radicado nuevo es lo correcto.

### Juan Manuel Armero · Tech lead

- [ ] Los nuevos roles `rev-rbi-001` y `rev-general-001` son aceptables para el modelo de datos.
- [ ] La prórroga extendida a los 3 tipos de revisor es viable técnicamente.
- [ ] El estado `en_revision_docs` con sub-estados por área (general + 8 técnicas en paralelo) es manejable.
- [ ] La auto-asignación por especialidad sigue el patrón actual.

---

## 12 · Próximos pasos (post-validación)

Cuando los 3 stakeholders firmen este documento:

1. Crear repo `naowee-tech/naowee-test-project-v2` (clonado de `naowee-test-project` v1.0.0).
2. Generar un plan de implementación detallado en otro archivo.
3. Construir v2.0 sin tocar v1.0 (queda como referencia histórica).
4. Iterar con feedback de Andrea/Danna/Juanma.
