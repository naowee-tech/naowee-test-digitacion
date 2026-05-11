/* ═══════════════════════════════════════════════════════════════
   PROJECT — Estado E2E compartido entre los 3 roles
   ═══════════════════════════════════════════════════════════════
   localStorage key: 'naowee.project.v1'
   Toda mutación pasa por save() para que las páginas se reflejen
   inmediatamente al cambiar de rol vía el demo switcher inferior.
*/

const KEY = 'naowee.project.v1';

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
      entidad: 'Alcaldía de Quibdó — Chocó',
      email: 'planeacion@quibdo.gov.co',
      avatar: 'CM',
      color: '#1f78d1'
    },
    revisor: {
      nombre: 'Juan Manuel Ávila',
      cargo: 'Revisor — Equipo Técnico Ministerio',
      entidad: 'Ministerio del Deporte',
      email: 'jm.avila@mindeporte.gov.co',
      avatar: 'JA',
      color: '#7c3aed'
    }
  },

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
      creadaEn: '2026-03-25T10:30:00',
      postulaciones: 12
    },
    {
      id: 'CONV-2025-002',
      nombre: 'Convocatoria Nacional de Infraestructura Deportiva 2025 II',
      descripcion: 'Segunda convocatoria del bienio 2024-2025 dirigida a municipios priorizados.',
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
      creadaEn: '2025-08-15T09:00:00',
      postulaciones: 28
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
      observaciones: [
        { ts: '2026-04-20T10:00:00', autor: 'revisor', area: 'Postulación', tipo: 'Falta documento', detalle: 'La carta de intención no está firmada por el representante legal vigente. Adjuntar carta firmada con fecha de los últimos 30 días.' },
        { ts: '2026-04-20T10:02:00', autor: 'revisor', area: 'Datos básicos', tipo: 'Inconsistencia', detalle: 'El documento de identidad del representante legal no coincide con el certificado de existencia y representación.' }
      ],
      historial: [
        { ts: '2026-04-12T14:20:00', actor: 'municipio', evento: 'Postulación enviada', estado: 'presentado' },
        { ts: '2026-04-13T08:30:00', actor: 'revisor', evento: 'En revisión', estado: 'en_revision' },
        { ts: '2026-04-20T10:00:00', actor: 'revisor', evento: 'Devuelta a subsanación con 2 observaciones', estado: 'devuelta_subsanacion' }
      ],
      fechaPostulacion: '2026-04-12T14:20:00',
      fechaDevolucion: '2026-04-20T10:00:00',
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
        revisor: 'revisor',
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
          { id: 'topografico', nombre: 'Levantamiento topográfico', estado: 'aprobado', revisor: 'Ing. M. Becerra', revisadoEn: '2026-04-08T12:00:00', items: 6, aprobados: 6 },
          { id: 'suelos', nombre: 'Estudio de suelos', estado: 'aprobado', revisor: 'Ing. P. Rojas', revisadoEn: '2026-04-09T15:00:00', items: 6, aprobados: 6 },
          { id: 'arquitectonico', nombre: 'Diseño arquitectónico', estado: 'en_revision', revisor: 'Arq. L. Sánchez', items: 11, aprobados: 7 },
          { id: 'estructural', nombre: 'Diseño estructural', estado: 'en_revision', revisor: 'Ing. R. Cárdenas', items: 7, aprobados: 4 },
          { id: 'hidraulico', nombre: 'Diseño hidráulico, sanitario y pluvial', estado: 'pendiente', revisor: null, items: 10, aprobados: 0 },
          { id: 'electrico', nombre: 'Diseño eléctrico', estado: 'pendiente', revisor: null, items: 8, aprobados: 0 },
          { id: 'ambiental', nombre: 'Planes de manejo, riesgos y ambiental', estado: 'pendiente', revisor: null, items: 7, aprobados: 0 },
          { id: 'presupuesto', nombre: 'Presupuesto', estado: 'devuelto', revisor: 'Ec. M. Pérez', revisadoEn: '2026-04-10T10:00:00', items: 12, aprobados: 8 }
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
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('[data] parse fallback', e); }
    return JSON.parse(JSON.stringify(SEED));
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

  function getProyectos(filter) {
    const s = load();
    if (!filter) return s.proyectos;
    return s.proyectos.filter(filter);
  }

  function getProyecto(id) {
    return load().proyectos.find(p => p.idUnico === id || p.radicado === id);
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
    getConvocatorias, addConvocatoria, setConvocatoria,
    defaultNotificacion, enviarNotificacion,
    pushHistorial, pushNotificacion,
    SEED
  };
})();

export default ProjectData;
window.ProjectData = ProjectData;
