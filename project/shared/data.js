/* ═══════════════════════════════════════════════════════════════
   PROJECT — Estado E2E compartido entre los 3 roles
   ═══════════════════════════════════════════════════════════════
   localStorage key: 'naowee.project.v2' (bump cuando cambies el SEED para forzar re-seed)
   Toda mutación pasa por save() para que las páginas se reflejen
   inmediatamente al cambiar de rol vía el demo switcher inferior.
*/

const KEY = 'naowee.project.v6';

/* ───── Estado inicial demo — datos reales ─────
   Convocatoria abierta + 1 proyecto en revisión + 1 favorable + 1 en
   etapa documental + 1 en inversión, para que cada rol vea movimiento
   real al entrar. */
const SEED = {
  perfilActivo: 'admin', // 'admin' | 'municipio' | 'revisor'
  perfiles: {
    admin: {
      nombre: 'Andrea Rodríguez',
      cargo: 'Administradora de Convocatorias',
      entidad: 'Ministerio del Deporte',
      email: 'andrea.rodriguez@mindeporte.gov.co',
      avatar: 'AR',
      color: '#FF7500'
    },
    municipio: {
      nombre: 'Carlos Mosquera',
      cargo: 'Secretario de Planeación',
      entidad: 'Alcaldía Municipal de Quibdó',
      email: 'planeacion@quibdo.gov.co',
      avatar: 'CM',
      color: '#1f78d1',
      /* Datos territoriales explícitos para que la UI no haga
         hardcode "Chocó/Quibdó" — todo viene del perfil. */
      entidadTipo: 'Alcaldía Municipal',
      nit: '891.680.014',
      departamento: 'Chocó',
      municipio: 'Quibdó',
      /* Municipios que esta entidad puede postular (multi-municipio). */
      municipiosCubiertos: ['Quibdó', 'Bahía Solano', 'El Carmen de Atrato'],
      marcadores: { zomac: false, pdet: true, ebiPnd: true }
    },
    revisor: {
      nombre: 'Juan Manuel Ávila',
      cargo: 'Revisor — Equipo Técnico Ministerio',
      entidad: 'Ministerio del Deporte',
      email: 'jm.avila@mindeporte.gov.co',
      avatar: 'JA',
      color: '#7c3aed',
      /* Enlace al pool: con qué revisor del equipo estoy logueado.
         Modelo: el equipo revisor ve todos los proyectos en revisión,
         pero cada quien aprueba SOLO sus áreas (Res. 933 Art. 3 + transcripción 2026-04-29). */
      revisorId: 'rev-001'
    }
  },

  /* ═══ Equipo revisor del Ministerio (Res. 933 Art. 3 + transcripción 29/04/2026) ═══
     5 personas cubren 8 áreas técnicas + 1 documentación general.
     • `especialidades` (array de keys) → mapeo automático área↔revisor.
     • `especialidad` (string display) → label legacy para UI compacta.
     Modelo definido por Andrea + Danna: "todos ven todo, cada quien
     aprueba lo suyo" — no hay coordinador humano que asigna 1-1, la
     asignación por área es automática por especialidad. */
  revisores: [
    { id: 'rev-001', nombre: 'Juan Manuel Ávila',  especialidad: 'Arquitectónica + Estructural', especialidades: ['arquitectonico','estructural'], avatar: 'JA', color: '#7c3aed', cargaActiva: 8 },
    { id: 'rev-002', nombre: 'María Elena Cortés', especialidad: 'Hidrosanitario + Eléctrico',   especialidades: ['hidrosanitario','electrico'],    avatar: 'MC', color: '#0d7a83', cargaActiva: 5 },
    { id: 'rev-003', nombre: 'Carlos Beltrán',     especialidad: 'Suelos + Topográfico',         especialidades: ['suelos','topografico'],          avatar: 'CB', color: '#b45309', cargaActiva: 6 },
    { id: 'rev-004', nombre: 'Andrea Quintero',    especialidad: 'Ambiental + Presupuesto',      especialidades: ['ambiental','presupuesto'],       avatar: 'AQ', color: '#15803d', cargaActiva: 4 },
    { id: 'rev-005', nombre: 'Luis Felipe Rondón', especialidad: 'Documentación General',        especialidades: ['general'],                        avatar: 'LR', color: '#1f78d1', cargaActiva: 7 }
  ],

  convocatorias: [
    {
      id: 'CONV-2026-001',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2026 I',
      descripcion: 'Convocatoria para la presentación de proyectos de infraestructura deportiva nueva o de mejoramiento, dirigidos a entidades territoriales del orden municipal y distrital, en el marco del bienio 2025-2026.',
      bienio: '2025-2026',
      apertura: '2026-04-01T08:00:00',
      cierre: '2026-06-30T17:00:00',
      emisionConcepto: '2026-08-15',
      fuentes: ['SGP', 'Recursos Propios Mindeporte', 'Cofinanciación territorial'],
      presupuestoTotal: 80000000000,
      montoMaximoProyecto: 12000000000,
      permiteSegunda: true,
      estado: 'abierta',
      creadaPor: 'admin',
      creadaEn: '2026-03-25T10:30:00'
    },
    {
      id: 'CONV-2025-002',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2025 II',
      descripcion: 'Segunda convocatoria del bienio 2024-2025 dirigida a municipios priorizados con énfasis en zonas PDET.',
      bienio: '2024-2025',
      apertura: '2025-09-01T08:00:00',
      cierre: '2025-11-30T17:00:00',
      emisionConcepto: '2026-01-30',
      fuentes: ['SGP', 'OCAD-Paz'],
      presupuestoTotal: 60000000000,
      montoMaximoProyecto: 10000000000,
      permiteSegunda: false,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2025-08-15T09:00:00'
    },
    {
      id: 'CONV-2025-001',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2025 I',
      descripcion: 'Primera convocatoria del bienio 2024-2025 abierta a todos los municipios del país. Enfoque en proyectos de construcción nueva y mejoramiento integral.',
      bienio: '2024-2025',
      apertura: '2025-03-01T08:00:00',
      cierre: '2025-05-30T17:00:00',
      emisionConcepto: '2025-07-15',
      fuentes: ['SGP', 'Recursos Propios Mindeporte'],
      presupuestoTotal: 55000000000,
      montoMaximoProyecto: 9500000000,
      permiteSegunda: true,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2025-02-10T10:00:00'
    },
    {
      id: 'CONV-2024-002',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2024 II',
      descripcion: 'Segunda convocatoria del bienio 2023-2024 enfocada en mantenimiento mayor y dotación deportiva.',
      bienio: '2023-2024',
      apertura: '2024-08-15T08:00:00',
      cierre: '2024-11-15T17:00:00',
      emisionConcepto: '2025-01-20',
      fuentes: ['SGP', 'OCAD-Paz', 'Cofinanciación territorial'],
      presupuestoTotal: 48000000000,
      montoMaximoProyecto: 8500000000,
      permiteSegunda: false,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2024-07-22T09:30:00'
    },
    {
      id: 'CONV-2024-001',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2024 I',
      descripcion: 'Primera convocatoria del bienio 2023-2024 dirigida a municipios de categoría 4, 5 y 6 con énfasis en escenarios para deporte social comunitario.',
      bienio: '2023-2024',
      apertura: '2024-02-15T08:00:00',
      cierre: '2024-05-15T17:00:00',
      emisionConcepto: '2024-07-10',
      fuentes: ['SGP', 'Recursos Propios Mindeporte'],
      presupuestoTotal: 42000000000,
      montoMaximoProyecto: 7800000000,
      permiteSegunda: true,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2024-01-18T11:00:00'
    },
    {
      id: 'CONV-2023-002',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2023 II',
      descripcion: 'Convocatoria especial post-pandemia para reactivación de escenarios deportivos en municipios con vulnerabilidad alta.',
      bienio: '2022-2023',
      apertura: '2023-09-01T08:00:00',
      cierre: '2023-11-30T17:00:00',
      emisionConcepto: '2024-01-25',
      fuentes: ['SGP', 'OCAD-Paz'],
      presupuestoTotal: 36000000000,
      montoMaximoProyecto: 7000000000,
      permiteSegunda: false,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2023-08-10T10:15:00'
    },
    {
      id: 'CONV-2023-001',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2023 I',
      descripcion: 'Primera convocatoria del bienio 2022-2023 con foco en infraestructura para deporte adaptado y juvenil.',
      bienio: '2022-2023',
      apertura: '2023-02-20T08:00:00',
      cierre: '2023-05-20T17:00:00',
      emisionConcepto: '2023-07-05',
      fuentes: ['SGP', 'Cofinanciación territorial'],
      presupuestoTotal: 32000000000,
      montoMaximoProyecto: 6500000000,
      permiteSegunda: true,
      estado: 'cerrada',
      creadaPor: 'admin',
      creadaEn: '2023-01-20T08:30:00'
    }
  ],

  proyectos: [
    /* P-001: en revisión inicial (15 días corriendo) */
    {
      idUnico: 'PROJ-2026-001',
      radicado: 'RAD-2026-001-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Coliseo Cubierto Quibdó',
      municipio: 'Quibdó',
      departamento: 'Chocó',
      direccionPredio: 'Calle 22 con Carrera 5, Barrio La Yesquita',
      coordenadas: { lat: 5.6919, lng: -76.6583 },
      presupuesto: 4800000000,
      montoSolicitado: 4200000000,
      contrapartida: 600000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Construcción nueva',
      representante: {
        nombre: 'Carlos Mosquera Rentería',
        documento: 'CC 11.806.443',
        cargo: 'Secretario de Planeación',
        contacto: '+57 311 745 2389'
      },
      formuladora: {
        nombre: 'Alcaldía de Quibdó',
        nit: '891.680.014-2'
      },
      estado: 'en_revision',
      priorizado: true,
      cartaIntencion: { name: 'carta-intencion-quibdo.pdf', size: 482000 },
      documentos: [
        { id: 'carta', nombre: 'Carta de intención', archivo: 'carta-intencion-quibdo.pdf', size: 482000, subidoEn: '2026-04-15T09:12:00' },
        { id: 'cedula-rep', nombre: 'Cédula representante legal', archivo: 'cedula-mosquera.pdf', size: 124000, subidoEn: '2026-04-15T09:12:00' },
        { id: 'existencia', nombre: 'Certificado de existencia y representación', archivo: 'existencia-alcaldia-quibdo.pdf', size: 318000, subidoEn: '2026-04-15T09:12:00' },
        { id: 'plano', nombre: 'Plano de localización del predio', archivo: 'plano-yesquita.pdf', size: 1240000, subidoEn: '2026-04-15T09:12:00' },
        { id: 'mga', nombre: 'Ficha MGA con BPIN', archivo: 'mga-coliseo-quibdo.pdf', size: 892000, subidoEn: '2026-04-15T09:12:00' },
        { id: 'comite', nombre: 'Concepto del Comité Municipal del Deporte', archivo: 'comite-deportivo-quibdo.pdf', size: 256000, subidoEn: '2026-04-15T09:12:00' }
      ],
      revisor: 'revisor',
      observaciones: [],
      historial: [
        { ts: '2026-04-15T09:12:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-15T09:13:00', actor: 'sistema', evento: `Radicado emitido: RAD-2026-001-CONV-2026-001`, estado: 'presentado' },
        { ts: '2026-04-16T11:00:00', actor: 'revisor', evento: 'Postulación tomada para revisión', estado: 'en_revision' },
        { ts: '2026-04-18T14:30:00', actor: 'revisor', evento: 'Marcada como proyecto priorizado (zona Chocó)', estado: 'en_revision' }
      ],
      fechaPostulacion: '2026-04-15T09:12:00',
      fechaInicioRevision: '2026-04-16T11:00:00',
      // estado documental se llena al pasar a favorable
      docsGeneral: null,
      docsTecnica: null
    },

    /* P-002: devuelta a subsanación */
    {
      idUnico: 'PROJ-2026-002',
      radicado: 'RAD-2026-002-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Cancha Sintética Bahía Solano',
      municipio: 'Bahía Solano',
      departamento: 'Chocó',
      direccionPredio: 'Vereda El Valle, lote municipal',
      presupuesto: 1850000000,
      montoSolicitado: 1500000000,
      contrapartida: 350000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase I — Diseños',
      tipoSolicitud: 'Mejoramiento',
      representante: {
        nombre: 'Yuliana Mosquera',
        documento: 'CC 1.077.430.221',
        cargo: 'Alcaldesa Municipal'
      },
      formuladora: { nombre: 'Alcaldía de Bahía Solano', nit: '891.680.025-8' },
      estado: 'devuelta_subsanacion',
      priorizado: true,
      /* Observaciones multi-área (Res. 933 Art. 9): el revisor devolvió
         por distintas razones técnicas a la vez. El municipio puede subsanar
         cada área de forma independiente y en paralelo. */
      observaciones: [
        { ts: '2026-04-20T10:00:00', autor: 'revisor', area: 'estructural', tipo: 'Inconsistencia', ref: 'Art. 3.4.2', detalle: 'Los planos estructurales no incluyen el detalle de cimentación profunda requerido para suelo arenoso costero. Anexar memoria de cálculo y plano detallado de pilotes.' },
        { ts: '2026-04-20T10:05:00', autor: 'revisor', area: 'estructural', tipo: 'Falta documento', ref: 'Art. 3.4.3', detalle: 'No se adjuntó la matrícula profesional vigente del ingeniero estructural responsable. Cargar copia escaneada del certificado COPNIA.' },
        { ts: '2026-04-20T10:10:00', autor: 'revisor', area: 'electrico', tipo: 'Incumplimiento RETIE', ref: 'Art. 3.6.4', detalle: 'El diseño eléctrico no cumple con RETIE vigente en la sección de puesta a tierra. Recalcular sistema según Anexo A del Reglamento.' },
        { ts: '2026-04-20T10:12:00', autor: 'revisor', area: 'electrico', tipo: 'Información incompleta', ref: 'Art. 3.6.2', detalle: 'Faltan los planos de fuerza y comunicaciones. Solo se adjuntó iluminación. Completar la documentación eléctrica completa.' },
        { ts: '2026-04-20T10:15:00', autor: 'revisor', area: 'hidrosanitario', tipo: 'Información incompleta', ref: 'Art. 3.5.1', detalle: 'No se evidencia conexión a red municipal de alcantarillado. Anexar certificación de la empresa de servicios públicos.' },
        { ts: '2026-04-20T10:20:00', autor: 'revisor', area: 'ambiental', tipo: 'Falta documento', ref: 'Art. 3.7.2', detalle: 'No se adjunta plan de manejo ambiental ni evaluación de impacto del predio. Es requisito para escenarios > 1000 m².' }
      ],
      historial: [
        { ts: '2026-04-12T14:20:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-13T08:30:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' },
        { ts: '2026-04-20T10:00:00', actor: 'revisor', evento: 'Devuelta · 6 observaciones en 4 áreas técnicas', estado: 'devuelta_subsanacion' }
      ],
      fechaDevolucion: '2026-04-20T10:00:00',
      fechaPostulacion: '2026-04-12T14:20:00',
      fechaDevolucion: '2026-04-20T10:00:00',
      prorroga: null,
    },

    /* P-2A: presentado, sin asignar revisor — listo para tomar */
    {
      idUnico: 'PROJ-2026-010',
      radicado: 'RAD-2026-010-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Cancha Sintética El Atrato',
      municipio: 'El Carmen de Atrato',
      departamento: 'Chocó',
      direccionPredio: 'Vereda La Mansa, lote municipal lote #4',
      presupuesto: 1450000000,
      montoSolicitado: 1300000000,
      contrapartida: 150000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase I — Diseños',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Andrés Palacios', documento: 'CC 11.802.301', cargo: 'Alcalde Municipal' },
      formuladora: { nombre: 'Alcaldía de El Carmen de Atrato', nit: '800.094.512-3' },
      estado: 'presentado',
      priorizado: false,
      historial: [
        { ts: '2026-05-02T09:15:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-05-02T09:16:00', actor: 'sistema', evento: 'Radicado emitido', estado: 'presentado' }
      ],
      fechaPostulacion: '2026-05-02T09:15:00'
    },

    /* P-2B: en revisión activa, urgente (≤5 días) */
    {
      idUnico: 'PROJ-2026-011',
      radicado: 'RAD-2026-011-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Adecuación Coliseo Cubierto Riosucio',
      municipio: 'Riosucio',
      departamento: 'Chocó',
      direccionPredio: 'Carrera 4 con Calle 9, sector centro',
      presupuesto: 2900000000,
      montoSolicitado: 2600000000,
      contrapartida: 300000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Adecuación',
      representante: { nombre: 'Daniel Romero', documento: 'CC 11.802.190', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Riosucio', nit: '800.103.456-1' },
      estado: 'en_revision',
      priorizado: true,
      historial: [
        { ts: '2026-04-22T08:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-22T08:01:00', actor: 'sistema', evento: 'Radicado emitido', estado: 'presentado' },
        { ts: '2026-04-25T10:00:00', actor: 'revisor', evento: 'Postulación tomada para revisión', estado: 'en_revision' }
      ],
      fechaPostulacion: '2026-04-22T08:00:00',
      fechaInicioRevision: '2026-04-25T10:00:00'
    },

    /* P-2C: en revisión, con tiempo medio */
    {
      idUnico: 'PROJ-2026-012',
      radicado: 'RAD-2026-012-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Pista Atlética Quibdó',
      municipio: 'Quibdó',
      departamento: 'Chocó',
      direccionPredio: 'Avenida del Río, sector estadio municipal',
      presupuesto: 3700000000,
      montoSolicitado: 3300000000,
      contrapartida: 400000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Carlos Mosquera Rentería', documento: 'CC 11.804.553', cargo: 'Secretario de Planeación' },
      formuladora: { nombre: 'Alcaldía de Quibdó', nit: '891.680.018-9' },
      estado: 'en_revision',
      priorizado: true,
      historial: [
        { ts: '2026-04-28T11:30:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-30T09:00:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' }
      ],
      fechaPostulacion: '2026-04-28T11:30:00',
      fechaInicioRevision: '2026-04-30T09:00:00'
    },

    /* P-2D: devuelta a subsanación, esperando municipio */
    {
      idUnico: 'PROJ-2026-013',
      radicado: 'RAD-2026-013-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Polideportivo Tadó',
      municipio: 'Tadó',
      departamento: 'Chocó',
      direccionPredio: 'Sector centro, manzana 7',
      presupuesto: 1980000000,
      montoSolicitado: 1750000000,
      contrapartida: 230000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase I — Diseños',
      tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Eduardo Mosquera', documento: 'CC 11.802.445', cargo: 'Alcalde Municipal' },
      formuladora: { nombre: 'Alcaldía de Tadó', nit: '800.094.310-2' },
      estado: 'devuelta_subsanacion',
      priorizado: false,
      observaciones: [
        { ts: '2026-04-29T14:00:00', autor: 'revisor', area: 'Localización', tipo: 'Información incompleta', detalle: 'Falta plano catastral actualizado del predio. El plano adjunto es de 2021.' },
        { ts: '2026-04-29T14:05:00', autor: 'revisor', area: 'Financiación', tipo: 'Inconsistencia', detalle: 'El valor de contrapartida no coincide con la certificación de disponibilidad presupuestal adjunta.' },
        { ts: '2026-04-29T14:10:00', autor: 'revisor', area: 'Postulación', tipo: 'Falta documento', detalle: 'Anexar concepto del Comité Municipal del Deporte vigente.' }
      ],
      historial: [
        { ts: '2026-04-18T10:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-20T09:00:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' },
        { ts: '2026-04-29T14:00:00', actor: 'revisor', evento: 'Devuelta a subsanación con 3 observaciones', estado: 'devuelta_subsanacion' }
      ],
      fechaPostulacion: '2026-04-18T10:00:00',
      fechaDevolucion: '2026-04-29T14:00:00',
      prorroga: null
    },

    /* P-003: favorable, en etapa documental — varias áreas en revisión */
    {
      idUnico: 'PROJ-2026-003',
      radicado: 'RAD-2026-003-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Polideportivo Istmina',
      municipio: 'Istmina',
      departamento: 'Chocó',
      direccionPredio: 'Calle 8 # 12-34, Istmina',
      presupuesto: 6200000000,
      montoSolicitado: 5500000000,
      contrapartida: 700000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación',
      tipoSolicitud: 'Construcción nueva',
      representante: {
        nombre: 'Hernán Beltrán',
        documento: 'CC 4.829.310',
        cargo: 'Alcalde Municipal'
      },
      formuladora: { nombre: 'Alcaldía de Istmina', nit: '800.094.220-5' },
      estado: 'etapa_documental',
      priorizado: true,
      historial: [
        { ts: '2026-03-20T10:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-03-21T09:00:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' },
        { ts: '2026-04-01T15:30:00', actor: 'revisor', evento: 'Postulación marcada como favorable', estado: 'favorable' },
        { ts: '2026-04-01T15:31:00', actor: 'sistema', evento: 'Repositorio documental activado · Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      docsGeneral: {
        estadoRevision: 'en_revision_general',
        revisor: 'Juan Manuel Ávila',
        /* Checklist Res. 933 — 14 ítems totales (Bloque 1: 9 + Bloque 2: 5).
           Estado actual: revisión parcial (7 cumplidos, 1 no cumple pendiente, resto sin verificar) */
        checklist: {
          1: 'cumple', 2: 'cumple', 3: 'cumple', 4: 'cumple', 5: 'cumple',
          6: 'cumple', 7: 'na', 11: 'cumple'
        },
        items: [
          { id: 'doc-01', nombre: 'Carta de intención firmada', archivo: 'carta-intencion-istmina.pdf', estado: 'aprobado', subidoEn: '2026-04-02T10:00:00', revisadoEn: '2026-04-05T11:00:00' },
          { id: 'doc-02', nombre: 'Estudio de títulos del predio', archivo: 'estudio-titulos.pdf', estado: 'aprobado', subidoEn: '2026-04-02T10:05:00' },
          { id: 'doc-03', nombre: 'Certificado de tradición y libertad', archivo: 'tradicion-libertad.pdf', estado: 'aprobado', subidoEn: '2026-04-02T10:10:00' },
          { id: 'doc-04', nombre: 'Plano catastral del predio', archivo: 'plano-catastral.pdf', estado: 'aprobado', subidoEn: '2026-04-02T10:15:00' },
          { id: 'doc-05', nombre: 'Certificado de uso del suelo', archivo: 'uso-suelo.pdf', estado: 'pendiente', subidoEn: '2026-04-03T08:30:00' }
        ]
      },
      docsTecnica: {
        areas: [
          /* APROBADO — todos los ítems cumplidos (o N/A donde aplique) */
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'aprobado',
            revisor: 'Ing. M. Becerra', revisadoEn: '2026-04-08T12:00:00',
            items: 5, aprobados: 5,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'aprobado',
            revisor: 'Ing. P. Rojas', revisadoEn: '2026-04-09T15:00:00',
            items: 4, aprobados: 4,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },

          /* EN REVISIÓN — checklist parcial */
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'en_revision',
            revisor: 'Arq. L. Sánchez',
            items: 6, aprobados: 4,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 6:'cumple' } },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'en_revision',
            revisor: 'Ing. R. Cárdenas',
            items: 4, aprobados: 2,
            checklist: { 1:'cumple', 2:'cumple' } },

          /* PENDIENTE — sin checklist iniciado */
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente',
            revisor: null, items: 3, aprobados: 0, checklist: {} },

          /* DEVUELTO — 2 ítems en "no cumple" generan observaciones que esperan subsanación */
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'devuelto',
            revisor: 'Ec. M. Pérez', revisadoEn: '2026-04-10T10:00:00',
            items: 8, aprobados: 5,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'nocumple', 7:'nocumple', 8:'na' },
            observaciones: [
              { n: 6, item: 'Certificado de Disponibilidad Presupuestal (CDP).', ref: 'Art. 3.8.6' },
              { n: 7, item: 'Análisis de costos de interventoría.', ref: 'Art. 3.8.7' }
            ] }
        ]
      },
      fechaPostulacion: '2026-03-20T10:00:00',
      fechaFavorable: '2026-04-01T15:30:00'
    },

    /* P-004: con concepto de favorabilidad — listo para activar inversión */
    {
      idUnico: 'PROJ-2026-004',
      radicado: 'RAD-2026-004-CONV-2025-002',
      convocatoriaId: 'CONV-2025-002',
      tipo: 'infraestructura',
      nombre: 'Construcción Estadio Cubierto El Carmen de Atrato',
      municipio: 'El Carmen de Atrato',
      departamento: 'Chocó',
      direccionPredio: 'Variante Salida a Quibdó, lote municipal #12',
      presupuesto: 8500000000,
      montoSolicitado: 7200000000,
      contrapartida: 1300000000,
      cofinanciacion: ['SGP', 'OCAD-Paz', 'Recursos Propios Mindeporte'],
      fase: 'Fase III — Obra y Dotación',
      tipoSolicitud: 'Construcción nueva',
      representante: {
        nombre: 'María Eugenia Palacios',
        documento: 'CC 35.460.991',
        cargo: 'Alcaldesa Municipal'
      },
      formuladora: { nombre: 'Alcaldía de El Carmen de Atrato', nit: '891.680.075-3' },
      estado: 'concepto_favorable',
      priorizado: false,
      conceptoFavorabilidad: {
        ts: '2026-04-22T16:00:00',
        certificado: 'CERT-FAV-2026-004.pdf',
        emitidoPor: 'Equipo Revisor del Ministerio',
        observaciones: 'Proyecto cumple con la totalidad de requisitos de la Resolución 933 de 2024. Apto para inversión.'
      },
      historial: [
        { ts: '2025-10-12T09:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2025-12-15T14:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-22T16:00:00', actor: 'sistema', evento: 'Concepto de favorabilidad emitido', estado: 'concepto_favorable' }
      ]
    },

    /* P-005: ya activado en inversión */
    {
      idUnico: 'PROJ-2025-088',
      radicado: 'RAD-2025-088-CONV-2025-002',
      convocatoriaId: 'CONV-2025-002',
      tipo: 'infraestructura',
      nombre: 'Construcción Coliseo Múltiple Riosucio',
      municipio: 'Riosucio',
      departamento: 'Chocó',
      direccionPredio: 'Avenida Principal, sector deportivo municipal',
      presupuesto: 5400000000,
      montoSolicitado: 4800000000,
      contrapartida: 600000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase III — Obra y Dotación',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Daniel Romero', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Riosucio', nit: '800.103.456-1' },
      estado: 'en_inversion',
      priorizado: true,
      inversion: {
        activadaEn: '2026-03-15T11:00:00',
        montoAprobado: 4800000000,
        bpin: '2026003460001',
        centroCosto: 'CC-MIN-DEP-2026-088',
        ejecutor: 'Alcaldía de Riosucio',
        suidEscenario: 'SUID-CHO-RIO-001'
      },
      historial: [
        { ts: '2025-09-20T10:00:00', actor: 'municipio', evento: 'Postulación enviada' },
        { ts: '2025-12-01T14:00:00', actor: 'revisor', evento: 'Favorable' },
        { ts: '2026-02-28T16:00:00', actor: 'sistema', evento: 'Concepto de favorabilidad' },
        { ts: '2026-03-15T11:00:00', actor: 'admin', evento: 'Activado en inversión · $4.800.000.000', estado: 'en_inversion' }
      ]
    },

    /* P-006: postulación expirada (15 días sin subsanar) */
    {
      idUnico: 'PROJ-2026-006',
      radicado: 'RAD-2026-006-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Polideportivo Atrato',
      municipio: 'Atrato',
      departamento: 'Chocó',
      presupuesto: 2100000000,
      estado: 'expirada',
      historial: [
        { ts: '2026-03-10', actor: 'municipio', evento: 'Postulación enviada' },
        { ts: '2026-03-12', actor: 'revisor', evento: 'Devuelta — 4 observaciones' },
        { ts: '2026-04-02', actor: 'sistema', evento: 'Postulación expirada (sin subsanación en 15 días)', estado: 'expirada' }
      ]
    },

    /* P-007: en etapa documental — todas las áreas en revisión activa, doc general parcial */
    {
      idUnico: 'PROJ-2026-007',
      radicado: 'RAD-2026-007-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Cancha Múltiple Cubierta Bahía Solano',
      municipio: 'Bahía Solano',
      departamento: 'Chocó',
      direccionPredio: 'Sector La Playa, lote del estadio municipal',
      presupuesto: 3200000000,
      montoSolicitado: 2800000000,
      contrapartida: 400000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Lucía Romero', documento: 'CC 35.802.110', cargo: 'Alcaldesa Municipal' },
      formuladora: { nombre: 'Alcaldía de Bahía Solano', nit: '800.094.250-7' },
      estado: 'etapa_documental',
      priorizado: true,
      fechaPostulacion: '2026-03-22T11:30:00',
      fechaFavorable: '2026-04-03T16:00:00',
      historial: [
        { ts: '2026-03-22T11:30:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-03-25T09:00:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' },
        { ts: '2026-04-03T16:00:00', actor: 'revisor', evento: 'Postulación marcada como favorable', estado: 'favorable' },
        { ts: '2026-04-03T16:01:00', actor: 'sistema', evento: 'Repositorio documental activado · Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      docsGeneral: {
        estadoRevision: 'en_revision_general',
        revisor: 'Juan Manuel Ávila',
        checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'na', 10:'cumple' },
        items: [
          { id: 'doc-01', nombre: 'Carta de intención firmada', estado: 'aprobado', subidoEn: '2026-04-04T10:00:00' },
          { id: 'doc-02', nombre: 'Estudio de títulos del predio', estado: 'aprobado', subidoEn: '2026-04-04T10:10:00' },
          { id: 'doc-03', nombre: 'Plano catastral del predio', estado: 'aprobado', subidoEn: '2026-04-04T10:20:00' }
        ]
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'en_revision',
            revisor: 'Ing. M. Becerra', items: 5, aprobados: 3,
            checklist: { 1:'cumple', 2:'cumple', 4:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'aprobado',
            revisor: 'Ing. P. Rojas', revisadoEn: '2026-04-12T11:00:00',
            items: 4, aprobados: 4,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'en_revision',
            revisor: 'Arq. L. Sánchez', items: 6, aprobados: 2,
            checklist: { 1:'cumple', 2:'cumple' } },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente',
            revisor: null, items: 3, aprobados: 0, checklist: {} },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'en_revision',
            revisor: 'Ec. M. Pérez', items: 8, aprobados: 5,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } }
        ]
      }
    },

    /* P-008: en etapa documental — doc general aprobada, varias áreas técnicas devueltas */
    {
      idUnico: 'PROJ-2026-008',
      radicado: 'RAD-2026-008-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Coliseo Deportivo Múltiple Tadó',
      municipio: 'Tadó',
      departamento: 'Chocó',
      direccionPredio: 'Carrera 6 con Calle 4, sector centro',
      presupuesto: 4500000000,
      montoSolicitado: 4000000000,
      contrapartida: 500000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Eduardo Mosquera', documento: 'CC 11.802.445', cargo: 'Alcalde Municipal' },
      formuladora: { nombre: 'Alcaldía de Tadó', nit: '800.094.310-2' },
      estado: 'etapa_documental',
      priorizado: false,
      fechaPostulacion: '2026-03-18T14:00:00',
      fechaFavorable: '2026-03-30T10:00:00',
      historial: [
        { ts: '2026-03-18T14:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-03-30T10:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-15T09:00:00', actor: 'revisor', evento: 'Documentación general aprobada' },
        { ts: '2026-04-20T11:00:00', actor: 'revisor', evento: 'Área de diseño hidráulico devuelta · 3 observaciones' }
      ],
      docsGeneral: {
        estadoRevision: 'aprobado',
        revisor: 'Juan Manuel Ávila',
        aprobadoEn: '2026-04-15T09:00:00',
        checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple', 7:'na', 8:'cumple', 9:'cumple', 10:'cumple', 11:'cumple', 12:'cumple', 13:'cumple', 14:'cumple' }
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'aprobado',
            revisor: 'Ing. M. Becerra', revisadoEn: '2026-04-10T09:00:00',
            items: 5, aprobados: 5,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'aprobado',
            revisor: 'Ing. P. Rojas', revisadoEn: '2026-04-11T15:00:00',
            items: 4, aprobados: 4,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'aprobado',
            revisor: 'Arq. L. Sánchez', revisadoEn: '2026-04-16T11:00:00',
            items: 6, aprobados: 6,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple' } },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'en_revision',
            revisor: 'Ing. R. Cárdenas', items: 4, aprobados: 2,
            checklist: { 1:'cumple', 3:'cumple' } },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'devuelto',
            revisor: 'Ing. F. Mosquera', revisadoEn: '2026-04-20T11:00:00',
            items: 4, aprobados: 1,
            checklist: { 1:'cumple', 2:'nocumple', 3:'nocumple', 4:'nocumple' },
            observaciones: [
              { n: 2, item: 'Planos hidráulicos, sanitarios y pluviales.', ref: 'Art. 3.5.2' },
              { n: 3, item: 'Documentos del profesional responsable.', ref: 'Art. 3.5.3' },
              { n: 4, item: 'Diseño coherente con disponibilidad de servicios públicos.', ref: 'Verificación técnica' }
            ] },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'en_revision',
            revisor: 'Ing. C. Valencia', items: 4, aprobados: 1,
            checklist: { 1:'cumple' } },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'aprobado',
            revisor: 'Ing. S. Quintero', revisadoEn: '2026-04-14T10:00:00',
            items: 3, aprobados: 3,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple' } },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'aprobado',
            revisor: 'Ec. M. Pérez', revisadoEn: '2026-04-17T16:00:00',
            items: 8, aprobados: 8,
            checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple', 7:'cumple', 8:'cumple' } }
        ]
      }
    },

    /* P-009: en etapa documental recién iniciada — primera revisión */
    {
      idUnico: 'PROJ-2026-009',
      radicado: 'RAD-2026-009-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Polideportivo Barrial Nóvita',
      municipio: 'Nóvita',
      departamento: 'Chocó',
      direccionPredio: 'Barrio La Esperanza, manzana 14',
      presupuesto: 2800000000,
      montoSolicitado: 2500000000,
      contrapartida: 300000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Carmen Lozano', documento: 'CC 35.910.220', cargo: 'Alcaldesa Municipal' },
      formuladora: { nombre: 'Alcaldía de Nóvita', nit: '800.094.401-9' },
      estado: 'etapa_documental',
      priorizado: false,
      fechaPostulacion: '2026-04-05T10:00:00',
      fechaFavorable: '2026-04-18T15:00:00',
      historial: [
        { ts: '2026-04-05T10:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-18T15:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-18T15:01:00', actor: 'sistema', evento: 'Repositorio documental activado · Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      docsGeneral: {
        estadoRevision: 'en_revision_general',
        revisor: 'Juan Manuel Ávila',
        checklist: { 1:'cumple', 2:'cumple' }
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'pendiente',
            revisor: null, items: 5, aprobados: 0, checklist: {} },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'pendiente',
            revisor: null, items: 6, aprobados: 0, checklist: {} },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente',
            revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente',
            revisor: null, items: 3, aprobados: 0, checklist: {} },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'pendiente',
            revisor: null, items: 8, aprobados: 0, checklist: {} }
        ]
      }
    },

    /* P-014: etapa documental — varias áreas en revisión, doc general parcial */
    {
      idUnico: 'PROJ-2026-014',
      radicado: 'RAD-2026-014-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Cancha Sintética Itsmina Sur',
      municipio: 'Istmina',
      departamento: 'Chocó',
      direccionPredio: 'Sector sur, lote del polideportivo viejo',
      presupuesto: 1750000000,
      montoSolicitado: 1500000000,
      contrapartida: 250000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase II — Obra',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Hernán Beltrán', documento: 'CC 4.829.310', cargo: 'Alcalde Municipal' },
      formuladora: { nombre: 'Alcaldía de Istmina', nit: '800.094.220-5' },
      estado: 'etapa_documental',
      priorizado: false,
      fechaPostulacion: '2026-03-28T10:00:00',
      fechaFavorable: '2026-04-10T14:00:00',
      historial: [
        { ts: '2026-03-28T10:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-10T14:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-10T14:01:00', actor: 'sistema', evento: 'Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      docsGeneral: {
        estadoRevision: 'en_revision_general',
        revisor: 'Juan Manuel Ávila',
        checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple', 7:'cumple', 8:'cumple', 9:'na' }
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'aprobado', revisor: 'Ing. M. Becerra', revisadoEn: '2026-04-18T11:00:00', items: 5, aprobados: 5, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'en_revision', revisor: 'Ing. P. Rojas', items: 4, aprobados: 2, checklist: { 1:'cumple', 2:'cumple' } },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'en_revision', revisor: 'Arq. L. Sánchez', items: 6, aprobados: 3, checklist: { 1:'cumple', 2:'cumple', 3:'cumple' } },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente', revisor: null, items: 3, aprobados: 0, checklist: {} },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'pendiente', revisor: null, items: 8, aprobados: 0, checklist: {} }
        ]
      }
    },

    /* P-015: etapa documental avanzada — casi listo, 1 área devuelta */
    {
      idUnico: 'PROJ-2026-015',
      radicado: 'RAD-2026-015-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Polideportivo Cubierto Condoto',
      municipio: 'Condoto',
      departamento: 'Chocó',
      direccionPredio: 'Calle 12 con Carrera 8, sector centro',
      presupuesto: 3850000000,
      montoSolicitado: 3400000000,
      contrapartida: 450000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación',
      tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Sandra Lozano', documento: 'CC 35.760.190', cargo: 'Alcaldesa' },
      formuladora: { nombre: 'Alcaldía de Condoto', nit: '800.094.180-1' },
      estado: 'etapa_documental',
      priorizado: true,
      fechaPostulacion: '2026-03-15T08:00:00',
      fechaFavorable: '2026-03-28T15:00:00',
      historial: [
        { ts: '2026-03-15T08:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-03-28T15:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-12T10:00:00', actor: 'revisor', evento: 'Documentación general aprobada' }
      ],
      docsGeneral: {
        estadoRevision: 'aprobado',
        revisor: 'Juan Manuel Ávila',
        aprobadoEn: '2026-04-12T10:00:00',
        checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple', 7:'cumple', 8:'cumple', 9:'cumple', 10:'cumple', 11:'cumple', 12:'cumple', 13:'cumple', 14:'cumple' }
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'aprobado', revisor: 'Ing. M. Becerra', revisadoEn: '2026-04-15T10:00:00', items: 5, aprobados: 5, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'aprobado', revisor: 'Ing. P. Rojas', revisadoEn: '2026-04-16T15:00:00', items: 4, aprobados: 4, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'aprobado', revisor: 'Arq. L. Sánchez', revisadoEn: '2026-04-18T11:00:00', items: 6, aprobados: 6, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple', 6:'cumple' } },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'aprobado', revisor: 'Ing. R. Cárdenas', revisadoEn: '2026-04-20T14:00:00', items: 4, aprobados: 4, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'aprobado', revisor: 'Ing. F. Mosquera', revisadoEn: '2026-04-22T09:00:00', items: 4, aprobados: 4, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' } },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'devuelto', revisor: 'Ing. C. Valencia', revisadoEn: '2026-04-25T16:00:00', items: 4, aprobados: 2, checklist: { 1:'cumple', 2:'nocumple', 3:'cumple', 4:'nocumple' }, observaciones: [{ n: 2, item: 'Planos eléctricos completos.', ref: 'Art. 3.6.2' }, { n: 4, item: 'Cumple con RETIE vigente.', ref: 'Verificación técnica' }] },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'aprobado', revisor: 'Ing. S. Quintero', revisadoEn: '2026-04-19T13:00:00', items: 3, aprobados: 3, checklist: { 1:'cumple', 2:'cumple', 3:'cumple' } },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'en_revision', revisor: 'Ec. M. Pérez', items: 8, aprobados: 5, checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple', 5:'cumple' } }
        ]
      }
    },

    /* P-016: etapa documental — pendiente de inicio en áreas técnicas */
    {
      idUnico: 'PROJ-2026-016',
      radicado: 'RAD-2026-016-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Adecuación Estadio Municipal Unguía',
      municipio: 'Unguía',
      departamento: 'Chocó',
      direccionPredio: 'Carrera 3 con Calle 5, sector deportivo',
      presupuesto: 2200000000,
      montoSolicitado: 1950000000,
      contrapartida: 250000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase I — Diseños',
      tipoSolicitud: 'Adecuación',
      representante: { nombre: 'Javier Cuesta', documento: 'CC 11.806.220', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Unguía', nit: '800.094.621-4' },
      estado: 'etapa_documental',
      priorizado: false,
      fechaPostulacion: '2026-04-08T11:00:00',
      fechaFavorable: '2026-04-22T16:00:00',
      historial: [
        { ts: '2026-04-08T11:00:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-22T16:00:00', actor: 'revisor', evento: 'Favorable', estado: 'favorable' },
        { ts: '2026-04-22T16:01:00', actor: 'sistema', evento: 'Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      docsGeneral: {
        estadoRevision: 'en_revision_general',
        revisor: 'Juan Manuel Ávila',
        checklist: { 1:'cumple', 2:'cumple', 3:'cumple', 4:'cumple' }
      },
      docsTecnica: {
        areas: [
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'en_revision', revisor: 'Ing. M. Becerra', items: 5, aprobados: 2, checklist: { 1:'cumple', 2:'cumple' } },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'pendiente', revisor: null, items: 6, aprobados: 0, checklist: {} },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente', revisor: null, items: 4, aprobados: 0, checklist: {} },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente', revisor: null, items: 3, aprobados: 0, checklist: {} },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'pendiente', revisor: null, items: 8, aprobados: 0, checklist: {} }
        ]
      }
    },

    /* ═══════════════════════════════════════════════════════════════════
       HISTÓRICO — Proyectos cerrados de convocatorias pasadas (en_inversion,
       rechazada, expirada). Datos resumidos para poblar la tabla de
       convocatorias.html y el detalle. No tienen flujo activo. */

    /* CONV-2025-001 · primera del bienio 2024-2025 (cerrada) */
    {
      idUnico: 'PROJ-2025-040',
      radicado: 'RAD-2025-040-CONV-2025-001',
      convocatoriaId: 'CONV-2025-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Cancha Sintética Buenaventura',
      municipio: 'Buenaventura', departamento: 'Valle del Cauca',
      presupuesto: 3400000000, montoSolicitado: 3000000000, contrapartida: 400000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Luz Mary Caicedo', documento: 'CC 31.992.114', cargo: 'Secretaria de Deporte' },
      formuladora: { nombre: 'Alcaldía Distrital de Buenaventura', nit: '890.399.029-5' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2025-04-12T10:00:00',
      inversion: { activadaEn: '2025-08-01T15:30:00', montoAprobado: 2600000000, bpin: '2025760010234', centroCosto: 'CC-MIN-VAC-2025-040', ejecutor: 'Alcaldía Distrital de Buenaventura' },
      historial: [
        { ts: '2025-04-12T10:00:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2025-06-20T14:00:00', actor: 'revisor',    evento: 'Concepto favorable emitido',  estado: 'concepto_favorable' },
        { ts: '2025-08-01T15:30:00', actor: 'admin',      evento: 'Inversión activada · $2.600.000.000 (ajuste -$400M)', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2025-041',
      radicado: 'RAD-2025-041-CONV-2025-001',
      convocatoriaId: 'CONV-2025-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Polideportivo San Andrés',
      municipio: 'San Andrés', departamento: 'San Andrés y Providencia',
      presupuesto: 2200000000, montoSolicitado: 2000000000, contrapartida: 200000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Eddy Robinson', documento: 'CC 18.005.221', cargo: 'Director INDER' },
      formuladora: { nombre: 'Gobernación de San Andrés', nit: '892.400.038-1' },
      estado: 'en_inversion', priorizado: false,
      fechaPostulacion: '2025-04-25T09:30:00',
      inversion: { activadaEn: '2025-08-12T11:00:00', montoAprobado: 2000000000, bpin: '2025880090055', centroCosto: 'CC-MIN-SAP-2025-041', ejecutor: 'Gobernación de San Andrés' },
      historial: [
        { ts: '2025-04-25T09:30:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2025-08-12T11:00:00', actor: 'admin',      evento: 'Inversión activada · $2.000.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2025-042',
      radicado: 'RAD-2025-042-CONV-2025-001',
      convocatoriaId: 'CONV-2025-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Pista de Atletismo Riohacha',
      municipio: 'Riohacha', departamento: 'La Guajira',
      presupuesto: 5800000000, montoSolicitado: 5000000000, contrapartida: 800000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Juan Carlos Robles', documento: 'CC 84.452.987', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Riohacha', nit: '892.115.006-2' },
      estado: 'rechazada', priorizado: false,
      fechaPostulacion: '2025-05-08T16:00:00',
      historial: [
        { ts: '2025-05-08T16:00:00', actor: 'municipio',  evento: 'Postulación enviada',                 estado: 'presentado' },
        { ts: '2025-06-30T10:00:00', actor: 'revisor',    evento: 'Rechazada · incumple Resol. 933 Art. 7', estado: 'rechazada' }
      ]
    },
    {
      idUnico: 'PROJ-2025-043',
      radicado: 'RAD-2025-043-CONV-2025-001',
      convocatoriaId: 'CONV-2025-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Estadio Pasto',
      municipio: 'Pasto', departamento: 'Nariño',
      presupuesto: 4500000000, montoSolicitado: 3800000000, contrapartida: 700000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Andrea Burbano', documento: 'CC 36.940.122', cargo: 'Secretaria de Deportes' },
      formuladora: { nombre: 'Alcaldía de Pasto', nit: '891.280.000-3' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2025-05-15T08:45:00',
      inversion: { activadaEn: '2025-08-20T14:00:00', montoAprobado: 3400000000, bpin: '2025520010078', centroCosto: 'CC-MIN-NAR-2025-043', ejecutor: 'Alcaldía de Pasto' },
      historial: [
        { ts: '2025-05-15T08:45:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2025-08-20T14:00:00', actor: 'admin',      evento: 'Inversión activada · $3.800.000.000', estado: 'en_inversion' }
      ]
    },

    /* CONV-2024-002 · segunda del bienio 2023-2024 (cerrada) */
    {
      idUnico: 'PROJ-2024-080',
      radicado: 'RAD-2024-080-CONV-2024-002',
      convocatoriaId: 'CONV-2024-002',
      tipo: 'infraestructura',
      nombre: 'Dotación Coliseo Mayor de Manizales',
      municipio: 'Manizales', departamento: 'Caldas',
      presupuesto: 1800000000, montoSolicitado: 1600000000, contrapartida: 200000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase IV — Dotación', tipoSolicitud: 'Dotación',
      representante: { nombre: 'Ricardo Gómez Giraldo', documento: 'CC 75.085.412', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Manizales', nit: '890.801.052-1' },
      estado: 'en_inversion', priorizado: false,
      fechaPostulacion: '2024-09-22T11:30:00',
      inversion: { activadaEn: '2025-02-10T10:00:00', montoAprobado: 1600000000, bpin: '2024170020091', centroCosto: 'CC-MIN-CAL-2024-080', ejecutor: 'Alcaldía de Manizales' },
      historial: [
        { ts: '2024-09-22T11:30:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2025-02-10T10:00:00', actor: 'admin',      evento: 'Inversión activada · $1.600.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2024-081',
      radicado: 'RAD-2024-081-CONV-2024-002',
      convocatoriaId: 'CONV-2024-002',
      tipo: 'infraestructura',
      nombre: 'Mantenimiento Mayor Estadio Sincelejo',
      municipio: 'Sincelejo', departamento: 'Sucre',
      presupuesto: 2900000000, montoSolicitado: 2500000000, contrapartida: 400000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mantenimiento mayor',
      representante: { nombre: 'Yahir Acuña', documento: 'CC 91.452.213', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Sincelejo', nit: '892.200.024-7' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2024-10-05T15:00:00',
      inversion: { activadaEn: '2025-02-25T14:15:00', montoAprobado: 2500000000, bpin: '2024700010044', centroCosto: 'CC-MIN-SUC-2024-081', ejecutor: 'Alcaldía de Sincelejo' },
      historial: [
        { ts: '2024-10-05T15:00:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2025-02-25T14:15:00', actor: 'admin',      evento: 'Inversión activada · $2.500.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2024-082',
      radicado: 'RAD-2024-082-CONV-2024-002',
      convocatoriaId: 'CONV-2024-002',
      tipo: 'infraestructura',
      nombre: 'Construcción Cancha de Béisbol Ciénaga',
      municipio: 'Ciénaga', departamento: 'Magdalena',
      presupuesto: 3200000000, montoSolicitado: 2800000000, contrapartida: 400000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Edgardo Pérez', documento: 'CC 12.620.881', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Ciénaga', nit: '891.780.014-3' },
      estado: 'expirada', priorizado: false,
      fechaPostulacion: '2024-10-18T09:00:00',
      historial: [
        { ts: '2024-10-18T09:00:00', actor: 'municipio',  evento: 'Postulación enviada',           estado: 'presentado' },
        { ts: '2024-12-30T17:00:00', actor: 'sistema',    evento: 'Expirada · subsanación no atendida', estado: 'expirada' }
      ]
    },

    /* CONV-2024-001 · primera del bienio 2023-2024 (cerrada) */
    {
      idUnico: 'PROJ-2024-022',
      radicado: 'RAD-2024-022-CONV-2024-001',
      convocatoriaId: 'CONV-2024-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Skatepark Cartago',
      municipio: 'Cartago', departamento: 'Valle del Cauca',
      presupuesto: 1400000000, montoSolicitado: 1200000000, contrapartida: 200000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Víctor Manuel Ramírez', documento: 'CC 16.788.014', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Cartago', nit: '891.901.103-6' },
      estado: 'en_inversion', priorizado: false,
      fechaPostulacion: '2024-03-14T10:00:00',
      inversion: { activadaEn: '2024-08-05T12:00:00', montoAprobado: 1200000000, bpin: '2024760040022', centroCosto: 'CC-MIN-VAC-2024-022', ejecutor: 'Alcaldía de Cartago' },
      historial: [
        { ts: '2024-03-14T10:00:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2024-08-05T12:00:00', actor: 'admin',      evento: 'Inversión activada · $1.200.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2024-023',
      radicado: 'RAD-2024-023-CONV-2024-001',
      convocatoriaId: 'CONV-2024-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Polideportivo Tunja',
      municipio: 'Tunja', departamento: 'Boyacá',
      presupuesto: 2600000000, montoSolicitado: 2200000000, contrapartida: 400000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Mirian Suárez', documento: 'CC 23.985.122', cargo: 'Alcaldesa' },
      formuladora: { nombre: 'Alcaldía de Tunja', nit: '891.800.846-7' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2024-04-02T14:30:00',
      inversion: { activadaEn: '2024-08-18T09:30:00', montoAprobado: 2200000000, bpin: '2024150030023', centroCosto: 'CC-MIN-BOY-2024-023', ejecutor: 'Alcaldía de Tunja' },
      historial: [
        { ts: '2024-04-02T14:30:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2024-08-18T09:30:00', actor: 'admin',      evento: 'Inversión activada · $2.200.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2024-024',
      radicado: 'RAD-2024-024-CONV-2024-001',
      convocatoriaId: 'CONV-2024-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Coliseo Yopal',
      municipio: 'Yopal', departamento: 'Casanare',
      presupuesto: 6800000000, montoSolicitado: 5800000000, contrapartida: 1000000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Luis Eduardo Castro', documento: 'CC 74.180.221', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Yopal', nit: '891.855.029-4' },
      estado: 'rechazada', priorizado: false,
      fechaPostulacion: '2024-04-20T11:00:00',
      historial: [
        { ts: '2024-04-20T11:00:00', actor: 'municipio',  evento: 'Postulación enviada',                 estado: 'presentado' },
        { ts: '2024-06-15T16:00:00', actor: 'revisor',    evento: 'Rechazada · supera tope autorizado',  estado: 'rechazada' }
      ]
    },

    /* CONV-2023-002 · segunda del bienio 2022-2023 (cerrada) */
    {
      idUnico: 'PROJ-2023-070',
      radicado: 'RAD-2023-070-CONV-2023-002',
      convocatoriaId: 'CONV-2023-002',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Estadio Floridablanca',
      municipio: 'Floridablanca', departamento: 'Santander',
      presupuesto: 2100000000, montoSolicitado: 1800000000, contrapartida: 300000000,
      cofinanciacion: ['SGP'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Miguel Ángel Bueno', documento: 'CC 91.483.770', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Floridablanca', nit: '890.205.176-2' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2023-09-30T10:15:00',
      inversion: { activadaEn: '2024-02-28T11:45:00', montoAprobado: 1800000000, bpin: '2023680010070', centroCosto: 'CC-MIN-SAN-2023-070', ejecutor: 'Alcaldía de Floridablanca' },
      historial: [
        { ts: '2023-09-30T10:15:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2024-02-28T11:45:00', actor: 'admin',      evento: 'Inversión activada · $1.800.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2023-071',
      radicado: 'RAD-2023-071-CONV-2023-002',
      convocatoriaId: 'CONV-2023-002',
      tipo: 'infraestructura',
      nombre: 'Construcción Patinódromo Ibagué',
      municipio: 'Ibagué', departamento: 'Tolima',
      presupuesto: 4900000000, montoSolicitado: 4200000000, contrapartida: 700000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Andrés Hurtado', documento: 'CC 14.221.881', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Ibagué', nit: '890.706.823-1' },
      estado: 'en_inversion', priorizado: false,
      fechaPostulacion: '2023-10-12T08:30:00',
      inversion: { activadaEn: '2024-03-15T15:00:00', montoAprobado: 3700000000, bpin: '2023730020071', centroCosto: 'CC-MIN-TOL-2023-071', ejecutor: 'Alcaldía de Ibagué' },
      historial: [
        { ts: '2023-10-12T08:30:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2024-03-15T15:00:00', actor: 'admin',      evento: 'Inversión activada · $4.200.000.000', estado: 'en_inversion' }
      ]
    },

    /* CONV-2023-001 · primera del bienio 2022-2023 (cerrada) */
    {
      idUnico: 'PROJ-2023-008',
      radicado: 'RAD-2023-008-CONV-2023-001',
      convocatoriaId: 'CONV-2023-001',
      tipo: 'infraestructura',
      nombre: 'Mejoramiento Coliseo Pereira',
      municipio: 'Pereira', departamento: 'Risaralda',
      presupuesto: 3500000000, montoSolicitado: 3000000000, contrapartida: 500000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Mejoramiento',
      representante: { nombre: 'Mauricio Salazar', documento: 'CC 10.005.221', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Pereira', nit: '891.480.030-2' },
      estado: 'en_inversion', priorizado: true,
      fechaPostulacion: '2023-04-10T11:00:00',
      inversion: { activadaEn: '2023-08-30T14:00:00', montoAprobado: 3000000000, bpin: '2023660060008', centroCosto: 'CC-MIN-RIS-2023-008', ejecutor: 'Alcaldía de Pereira' },
      historial: [
        { ts: '2023-04-10T11:00:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2023-08-30T14:00:00', actor: 'admin',      evento: 'Inversión activada · $3.000.000.000', estado: 'en_inversion' }
      ]
    },
    {
      idUnico: 'PROJ-2023-009',
      radicado: 'RAD-2023-009-CONV-2023-001',
      convocatoriaId: 'CONV-2023-001',
      tipo: 'infraestructura',
      nombre: 'Construcción Cancha Múltiple Mocoa',
      municipio: 'Mocoa', departamento: 'Putumayo',
      presupuesto: 1900000000, montoSolicitado: 1700000000, contrapartida: 200000000,
      cofinanciacion: ['SGP', 'OCAD-Paz'],
      fase: 'Fase II — Obra', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'José Carlos Lasso', documento: 'CC 18.124.770', cargo: 'Alcalde' },
      formuladora: { nombre: 'Alcaldía de Mocoa', nit: '891.200.012-1' },
      estado: 'en_inversion', priorizado: false,
      fechaPostulacion: '2023-04-25T09:30:00',
      inversion: { activadaEn: '2023-09-12T11:30:00', montoAprobado: 1700000000, bpin: '2023860050009', centroCosto: 'CC-MIN-PUT-2023-009', ejecutor: 'Alcaldía de Mocoa' },
      historial: [
        { ts: '2023-04-25T09:30:00', actor: 'municipio',  evento: 'Postulación enviada',         estado: 'presentado' },
        { ts: '2023-09-12T11:30:00', actor: 'admin',      evento: 'Inversión activada · $1.700.000.000', estado: 'en_inversion' }
      ]
    },

    /* ═══════════════════════════════════════════════════════════════════
       ENTIDADES NO-ALCALDÍA (Res. 933 Art. 5.1) — Gobernación, Resguardo
       Indígena, Consejo Comunitario. Demuestran que el módulo soporta
       todos los tipos de entidad formuladora del catálogo del Ministerio. */

    /* Gobernación postulando para múltiples municipios del departamento */
    {
      idUnico: 'PROJ-2026-017',
      radicado: 'RAD-2026-017-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Coliseo Departamental del Vichada — Sede La Primavera',
      municipio: 'La Primavera', departamento: 'Vichada',
      direccionPredio: 'Avenida Los Llanos · sector deportivo municipal',
      coordenadas: { lat: 5.4926, lng: -70.4081, datum: 'MAGNA-SIRGAS' },
      areaPredio: 3800, aforo: 1500,
      presupuesto: 7200000000, montoSolicitado: 6500000000, contrapartida: 700000000,
      cofinanciacion: ['SGP', 'OCAD'], modalidades: ['Fútbol', 'Baloncesto', 'Voleibol', 'Atletismo'],
      tipologia: 'Coliseo cubierto', subtipologia: 'Coliseo polifuncional con pista atlética',
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Luisa Fernanda Quintero', documento: 'CC 17.450.213', cargo: 'Gobernadora del Vichada', contacto: '+57 311 803 9921' },
      formuladora: { nombre: 'Gobernación del Vichada', tipo: 'Gobernación Departamental', nit: '892.099.346-3' },
      marcadores: { zomac: true, pdet: false, ebiPnd: true },
      estado: 'en_revision', priorizado: true,
      observaciones: [],
      historial: [
        { ts: '2026-04-26T10:00:00', actor: 'municipio', evento: 'Postulación enviada por Gobernación', estado: 'presentado' },
        { ts: '2026-04-26T10:01:00', actor: 'sistema', evento: 'Radicado emitido: RAD-2026-017-CONV-2026-001', estado: 'presentado' },
        { ts: '2026-04-28T09:00:00', actor: 'revisor', evento: 'En revisión técnica', estado: 'en_revision' }
      ],
      fechaPostulacion: '2026-04-26T10:00:00',
      fechaInicioRevision: '2026-04-28T09:00:00'
    },

    /* Resguardo Indígena postulando con autonomía territorial */
    {
      idUnico: 'PROJ-2026-018',
      radicado: 'RAD-2026-018-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Cancha Comunitaria Resguardo Nasa Wesx',
      municipio: 'Caldono', departamento: 'Cauca',
      direccionPredio: 'Vereda Pioyá, Resguardo Indígena Nasa Wesx',
      coordenadas: { lat: 2.7892, lng: -76.5544, datum: 'MAGNA-SIRGAS' },
      areaPredio: 1200, aforo: 400,
      presupuesto: 980000000, montoSolicitado: 880000000, contrapartida: 100000000,
      cofinanciacion: ['SGP', 'Recursos Propios Municipio'], modalidades: ['Fútbol', 'Voleibol'],
      tipologia: 'Cancha múltiple', subtipologia: 'Cancha comunitaria de uso intercultural',
      fase: 'Fase II — Obra', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Aida Quilcué Vivas', documento: 'CC 25.482.117', cargo: 'Gobernadora del Resguardo', contacto: '+57 320 458 7711' },
      formuladora: { nombre: 'Resguardo Indígena Nasa Wesx', tipo: 'Resguardo Indígena', nit: '900.184.522-1' },
      marcadores: { zomac: false, pdet: true, ebiPnd: true },
      estado: 'etapa_documental', priorizado: true,
      observaciones: [],
      historial: [
        { ts: '2026-04-08T11:30:00', actor: 'municipio', evento: 'Postulación enviada por Resguardo', estado: 'presentado' },
        { ts: '2026-04-09T09:00:00', actor: 'revisor', evento: 'Postulación favorable', estado: 'favorable' },
        { ts: '2026-04-15T10:00:00', actor: 'sistema', evento: 'Etapa documental iniciada', estado: 'etapa_documental' }
      ],
      fechaPostulacion: '2026-04-08T11:30:00'
    },

    /* Consejo Comunitario Afrodescendiente */
    {
      idUnico: 'PROJ-2026-019',
      radicado: 'RAD-2026-019-CONV-2026-001',
      convocatoriaId: 'CONV-2026-001',
      tipo: 'infraestructura',
      nombre: 'Polideportivo Comunidades Negras Curvaradó',
      municipio: 'Carmen del Darién', departamento: 'Chocó',
      direccionPredio: 'Cuenca del Curvaradó, sector comunitario',
      coordenadas: { lat: 7.2517, lng: -76.9012, datum: 'MAGNA-SIRGAS' },
      areaPredio: 2100, aforo: 800,
      presupuesto: 2400000000, montoSolicitado: 2200000000, contrapartida: 200000000,
      cofinanciacion: ['OCAD-Paz', 'SGP'], modalidades: ['Fútbol', 'Baloncesto', 'Voleibol', 'Atletismo'],
      tipologia: 'Polideportivo', subtipologia: 'Polideportivo cubierto comunitario',
      fase: 'Fase III — Obra y Dotación', tipoSolicitud: 'Construcción nueva',
      representante: { nombre: 'Hernán Mosquera Romaña', documento: 'CC 11.804.298', cargo: 'Representante legal del Consejo', contacto: '+57 311 884 5022' },
      formuladora: { nombre: 'Consejo Comunitario de Curvaradó', tipo: 'Consejo Comunitario Afrodescendiente', nit: '900.342.881-7' },
      marcadores: { zomac: true, pdet: true, ebiPnd: true },
      estado: 'concepto_favorable', priorizado: true,
      conceptoFavorabilidad: {
        emitidoEn: '2026-05-03T16:30:00',
        observaciones: 'Proyecto cumple con la totalidad de requisitos de la Resolución 933 de 2024. Comunidad PDET con priorización integral. Apto para activación de inversión.'
      },
      observaciones: [],
      historial: [
        { ts: '2026-03-20T09:00:00', actor: 'municipio', evento: 'Postulación enviada por Consejo Comunitario', estado: 'presentado' },
        { ts: '2026-03-22T10:00:00', actor: 'revisor', evento: 'Postulación favorable', estado: 'favorable' },
        { ts: '2026-04-01T08:00:00', actor: 'sistema', evento: 'Etapa documental iniciada', estado: 'etapa_documental' },
        { ts: '2026-05-03T16:30:00', actor: 'revisor', evento: 'Concepto favorable emitido', estado: 'concepto_favorable' }
      ],
      fechaPostulacion: '2026-03-20T09:00:00'
    }
  ],

  notificaciones: [
    { id: 'n01', perfil: 'municipio', ts: '2026-04-01T08:00:00', leida: false, tipo: 'convocatoria', titulo: 'Nueva convocatoria abierta', detalle: 'CONV-2026-001 · Cierra el 30 de junio de 2026' },
    { id: 'n02', perfil: 'municipio', ts: '2026-04-20T10:00:00', leida: false, tipo: 'subsanacion', titulo: 'Postulación devuelta a subsanación', detalle: 'PROJ-2026-002 · 2 observaciones · 15 días para responder' },
    { id: 'n03', perfil: 'revisor', ts: '2026-04-15T09:13:00', leida: false, tipo: 'nueva', titulo: 'Nueva postulación recibida', detalle: 'PROJ-2026-001 · Quibdó · Coliseo Cubierto · $4.800M' },
    { id: 'n04', perfil: 'admin', ts: '2026-04-22T16:01:00', leida: false, tipo: 'favorabilidad', titulo: 'Proyecto listo para inversión', detalle: 'PROJ-2026-004 · Concepto favorable emitido' }
  ]
};

const ProjectData = (() => {
  /* Versión del schema. Bumpear cuando el SEED cambie en forma incompatible
     (ej. nueva clave en revisores, nuevo perfil, restructure de áreas, o
     ajustes de montos del seed que invalidan el state guardado).
     Si el state guardado tiene versión distinta → auto-reset. */
  const SCHEMA_VERSION = 3;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        /* Auto-reset si el state es legacy:
           - sin __schema flag (pre-v2)
           - revisores sin `especialidades` (modelo antiguo donde Andrea/Danna
             usaban especialidad string única)
           - perfil revisor sin `revisorId` (link al pool faltante) */
        const isLegacy =
          (s.__schema || 0) < SCHEMA_VERSION ||
          (s.revisores && s.revisores[0] && !s.revisores[0].especialidades) ||
          (s.perfiles?.revisor && !s.perfiles.revisor.revisorId);
        if (isLegacy) {
          console.info('[data] state legacy detectado → reset al SEED v' + SCHEMA_VERSION);
          const fresh = JSON.parse(JSON.stringify(SEED));
          fresh.__schema = SCHEMA_VERSION;
          localStorage.setItem(KEY, JSON.stringify(fresh));
          return fresh;
        }
        return s;
      }
    } catch (e) { console.warn('[data] parse fallback', e); }
    const fresh = JSON.parse(JSON.stringify(SEED));
    fresh.__schema = SCHEMA_VERSION;
    return fresh;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    /* dispatch event para que páginas abiertas se refresquen */
    window.dispatchEvent(new CustomEvent('project:state', { detail: state }));
  }

  function reset() {
    localStorage.removeItem(KEY);
    return load();
  }

  function update(mutator) {
    const s = load();
    const r = mutator(s);
    save(r || s);
    return load();
  }

  function setPerfil(perfil) {
    update(s => { s.perfilActivo = perfil; });
  }

  function getPerfil() {
    return load().perfilActivo;
  }

  function getPerfilData(perfil) {
    return load().perfiles[perfil || getPerfil()];
  }

  /* ═══ Mapeo área → especialidad ═══
     Normaliza nombres legacy (hidraulico → hidrosanitario) y keys del DS. */
  const AREA_TO_SPECIALTY = {
    topografico: 'topografico',
    suelos: 'suelos',
    arquitectonico: 'arquitectonico',
    estructural: 'estructural',
    hidraulico: 'hidrosanitario',
    hidrosanitario: 'hidrosanitario',
    electrico: 'electrico',
    ambiental: 'ambiental',
    presupuesto: 'presupuesto',
    general: 'general'
  };

  /* Busca en el equipo revisor quién cubre una especialidad de área. */
  function getRevisorPorArea(areaKey) {
    const spec = AREA_TO_SPECIALTY[areaKey];
    if (!spec) return null;
    return getRevisores().find(r => (r.especialidades || []).includes(spec)) || null;
  }

  /* SLA: días estándar de revisión técnica (Res. 933 + acuerdo demo). */
  const SLA_DIAS_REVISION = 15;

  /* Enriquece un área con revisorId + asignadoEn + fechaLimite si faltan.
     ADEMÁS sobrescribe `revisor` (nombre string) para que apunte al pool
     canónico de 5 revisores — así toda la app muestra los mismos nombres
     que el role switcher. Si el seed tenía un nombre ficticio legacy
     (ej. "Ing. M. Becerra"), se reemplaza por el del pool por especialidad. */
  function enrichArea(area, fechaAsignacionBase) {
    if (!area) return area;
    const r = area.revisorId ? getRevisor(area.revisorId) : getRevisorPorArea(area.id);
    if (!r) return area;
    const asignadoEn = area.asignadoEn || fechaAsignacionBase || new Date().toISOString();
    let fechaLimite = area.fechaLimite;
    if (!fechaLimite) {
      const lim = new Date(asignadoEn);
      lim.setDate(lim.getDate() + SLA_DIAS_REVISION);
      fechaLimite = lim.toISOString();
    }
    return {
      ...area,
      revisorId: r.id,
      revisor: r.nombre,  /* canónico — alinea con role switcher */
      asignadoEn,
      fechaLimite
    };
  }

  /* Enriquece un proyecto: auto-asigna revisorId/SLA en cada área técnica
     + en docsGeneral. Se llama en cada `getProyectos/getProyecto` para
     mantener el seed legible sin contaminar el state guardado. */
  function enrichProyecto(p) {
    if (!p) return p;
    /* Base date: cuando el proyecto entró a etapa documental (si existe),
       si no, fecha de favorabilidad, si no, fecha de postulación. */
    const fechaBase = (p.historial || []).find(h => h.estado === 'etapa_documental')?.ts
      || p.fechaFavorable
      || p.fechaPostulacion;
    let next = p;
    if (p.docsTecnica?.areas) {
      next = { ...next, docsTecnica: { ...p.docsTecnica, areas: p.docsTecnica.areas.map(a => enrichArea(a, fechaBase)) } };
    }
    if (p.docsGeneral) {
      const rg = p.docsGeneral.revisorId ? getRevisor(p.docsGeneral.revisorId) : getRevisorPorArea('general');
      if (rg) {
        const asignadoEn = p.docsGeneral.asignadoEn || fechaBase || new Date().toISOString();
        const lim = new Date(asignadoEn); lim.setDate(lim.getDate() + SLA_DIAS_REVISION);
        next = { ...next, docsGeneral: {
          ...p.docsGeneral,
          revisorId: rg.id,
          revisor: rg.nombre,  /* canónico — alinea con role switcher */
          asignadoEn,
          fechaLimite: p.docsGeneral.fechaLimite || lim.toISOString()
        } };
      }
    }
    return next;
  }

  function getProyectos(filter) {
    const s = load();
    const arr = s.proyectos.map(enrichProyecto);
    if (!filter) return arr;
    return arr.filter(filter);
  }

  function getProyecto(id) {
    const p = load().proyectos.find(p => p.idUnico === id || p.radicado === id);
    return p ? enrichProyecto(p) : null;
  }

  /* Revisor del pool actualmente logueado (perfil revisor). */
  function getRevisorActivo() {
    const d = load().perfiles?.revisor;
    return d?.revisorId ? getRevisor(d.revisorId) : null;
  }

  function setProyecto(id, mutator) {
    update(s => {
      const idx = s.proyectos.findIndex(p => p.idUnico === id);
      if (idx >= 0) {
        const next = mutator(s.proyectos[idx]);
        if (next) s.proyectos[idx] = next;
      }
    });
  }

  function addProyecto(p) {
    update(s => { s.proyectos.unshift(p); });
  }

  /* Pool de revisores técnicos del Ministerio (Res. 933 Art. 3) */
  function getRevisores() {
    return load().revisores || [];
  }
  function getRevisor(id) {
    return getRevisores().find(r => r.id === id) || null;
  }

  function getConvocatorias() {
    /* Auto-calcular postulaciones a partir de proyectos reales para evitar
       conteos hardcoded inconsistentes con el detalle. */
    const s = load();
    return s.convocatorias.map(c => ({
      ...c,
      postulaciones: s.proyectos.filter(p => p.convocatoriaId === c.id).length
    }));
  }

  function addConvocatoria(c) {
    update(s => { s.convocatorias.unshift(c); });
  }

  function setConvocatoria(id, mutator) {
    update(s => {
      const i = s.convocatorias.findIndex(c => c.id === id);
      if (i < 0) return;
      s.convocatorias[i] = mutator({ ...s.convocatorias[i] }) || s.convocatorias[i];
    });
  }

  /* Construye una notificación default a partir de una convocatoria.
     Spec: sección 2 (NOTIFICACIÓN A MUNICIPIOS). */
  function defaultNotificacion(conv) {
    /* Lista mock de municipios destinatarios derivada del alcance.
       En producción se calcularía desde alcance territorial. */
    const muniMock = [
      { dane: '27001', municipio: 'Quibdó', depto: 'Chocó', email: 'alcaldia@quibdo.gov.co' },
      { dane: '27075', municipio: 'Bahía Solano', depto: 'Chocó', email: 'alcaldia@bahiasolano.gov.co' },
      { dane: '27361', municipio: 'Istmina', depto: 'Chocó', email: 'alcaldia@istmina.gov.co' },
      { dane: '27135', municipio: 'El Carmen de Atrato', depto: 'Chocó', email: 'alcaldia@elcarmendeatrato.gov.co' },
      { dane: '27615', municipio: 'Riosucio', depto: 'Chocó', email: 'alcaldia@riosucio-choco.gov.co' },
      { dane: '27050', municipio: 'Atrato', depto: 'Chocó', email: 'alcaldia@atrato.gov.co' }
    ];
    return {
      estado: 'pendiente',
      asunto: `Apertura de Convocatoria — ${conv.nombre || conv.id}`,
      cuerpo: `Cordial saludo,\n\nEl Ministerio del Deporte informa la apertura de la convocatoria <strong>${conv.nombre || conv.id}</strong> dirigida a su municipio.\n\n<strong>Cierre de postulaciones:</strong> {fecha_cierre}\n<strong>Tope por proyecto:</strong> {tope_proyecto}\n\nIngrese a la plataforma para conocer los términos de referencia y radicar su postulación: {enlace_plataforma}\n\nCualquier consulta puede dirigirla al correo institucional.`,
      destinatarios: { municipios: muniMock, adicionales: [] },
      adjuntos: [],
      canales: { correo: true, plataforma: true, sms: false },
      programacion: { tipo: 'inmediato', fechaProgramada: null },
      envio: null /* { ts, exitosos, conFalla, fallos: [{municipio, canal, motivo}] } */
    };
  }

  /* Marca una notificación como enviada con resultados simulados. */
  function enviarNotificacion(convId) {
    setConvocatoria(convId, c => {
      if (!c.notificacion) c.notificacion = defaultNotificacion(c);
      const total = c.notificacion.destinatarios.municipios.length;
      const conFalla = Math.random() < 0.3 ? 1 : 0; /* 30% de probabilidad de 1 falla */
      const exitosos = total - conFalla;
      c.notificacion.estado = conFalla > 0 ? 'con_fallas' : 'enviada';
      c.notificacion.envio = {
        ts: new Date().toISOString(),
        exitosos,
        conFalla,
        fallos: conFalla > 0 ? [{
          municipio: c.notificacion.destinatarios.municipios[total-1].municipio,
          canal: 'correo',
          motivo: 'Buzón institucional rebotó (cuota excedida)'
        }] : []
      };
      return c;
    });
  }

  function pushHistorial(idProyecto, evento) {
    setProyecto(idProyecto, p => {
      p.historial = p.historial || [];
      p.historial.push({ ts: new Date().toISOString(), ...evento });
      if (evento.estado) p.estado = evento.estado;
      return p;
    });
  }

  function pushNotificacion(n) {
    update(s => {
      s.notificaciones = s.notificaciones || [];
      s.notificaciones.unshift({ id: 'n' + Date.now(), ts: new Date().toISOString(), leida: false, ...n });
    });
  }

  return {
    load, save, reset, update,
    setPerfil, getPerfil, getPerfilData,
    getProyectos, getProyecto, setProyecto, addProyecto,
    getRevisores, getRevisor, getRevisorActivo, getRevisorPorArea,
    AREA_TO_SPECIALTY, SLA_DIAS_REVISION,
    getConvocatorias, addConvocatoria, setConvocatoria,
    defaultNotificacion, enviarNotificacion,
    pushHistorial, pushNotificacion,
    SEED
  };
})();

export default ProjectData;
window.ProjectData = ProjectData;
