/* ═══════════════════════════════════════════════════════════
   SCORING MODAL — Shared between digitador.html & detalle.html
   Source of truth: this file. Do NOT duplicate in page scripts.
═══════════════════════════════════════════════════════════ */

/* Helper: resolve competition by ID — works from COMPETITIONS array (digitador)
   or window.comp (detalle.html coordinator view) */
function _resolveComp(compId){
  if(typeof COMPETITIONS !== 'undefined'){
    const c = COMPETITIONS.find(c => c.id === compId);
    if(c) return c;
  }
  if(typeof window.comp !== 'undefined' && window.comp) return window.comp;
  return null;
}

/* Callback invoked after saving a result — each host page sets this */
let _onScoringModalSave = null;

/* ═══════════════════════════════════════════════════════════
   SCORING MODAL — Dynamic generation
═══════════════════════════════════════════════════════════ */
if(typeof TEAM_COLORS === 'undefined') var TEAM_COLORS = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#34495e'];

/* ── Current modal context (for extra time, etc.) ── */
let _modalSportKey = null;
let _modalMatchData = null;
let _modalCompId = null;
let _sportPenalizaciones = [];
let _directScoreOverride = false;

function _onDirectScoreEdit(){
  _directScoreOverride = true;
  if(typeof checkSaveReady === 'function') checkSaveReady();
}

function openScoringModal(sportKey, matchData, compId){
  _modalSportKey = sportKey;
  _modalMatchData = matchData;
  _modalCompId = compId;
  _directScoreOverride = false;
  const _baseSport = SPORTS_DB[sportKey];
  const comp = _resolveComp(compId);
  /* ── Resolve prueba _override: merge prueba-specific config over base sport ── */
  let sport = _baseSport;
  if(_baseSport.pruebas && comp){
    const _catNorm = comp.categoria.trim().toLowerCase();
    for(const pk of Object.keys(_baseSport.pruebas)){
      const pr = _baseSport.pruebas[pk];
      if(pr.label && pr.label.trim().toLowerCase() === _catNorm && pr._override){
        sport = Object.assign({}, _baseSport, pr._override, {parciales: pr.parciales || _baseSport.parciales, tiempoParcial: pr.tiempoParcial || _baseSport.tiempoParcial});
        break;
      }
    }
  }
  const modal = document.getElementById('modalContent');
  /* Resolve atletismo sub-modalidad specific penalties */
  _sportPenalizaciones = sport.penalizaciones || [];
  if(comp && comp.atletismoModalidad && sport.modalidades){
    const _subMod = _resolveAtletismoSubModalidad(comp);
    if(_subMod && sport.modalidades[_subMod] && sport.modalidades[_subMod].penalizaciones){
      _sportPenalizaciones = sport.modalidades[_subMod].penalizaciones;
    }
  }
  const hasPenalizaciones = _sportPenalizaciones.length > 0;
  const activeDescals = getActiveDescalificaciones(sportKey, sport, comp);
  const _ss_check = sport.scoringSystem;
  const _isOutcomeBased = _ss_check && (_ss_check.tablas !== undefined || _ss_check.empate !== undefined);
  /* Infraction-based sports: use unified DQ/pérdida/incident system (chess, badminton, etc.)
     Detect: outcome-based OR has tarjeta-type penalties + tipoEnfrentamiento Duelo */
  const _isInfractionBased = _isOutcomeBased || (sport.tipoEnfrentamiento && sport.tipoEnfrentamiento.toLowerCase().includes('duelo') && sport.puntosSet);
  /* For infraction-based sports: merge "pérdida" penalties into descalificaciones tab */
  const _perdidaPenalties = _isInfractionBased ? _sportPenalizaciones.filter(p => { const pl=p.toLowerCase(); return pl.includes('pérdida')||pl.includes('perdida')||pl.includes('pierde'); }) : [];
  const _nonPerdidaPenalties = _isInfractionBased ? _sportPenalizaciones.filter(p => { const pl=p.toLowerCase(); return !(pl.includes('pérdida')||pl.includes('perdida')||pl.includes('pierde')); }) : [];
  /* Tarjeta penalties that give points to rival → inline in Marcador, not in Penalizaciones tab (skip if using unified inline penalties) */
  const _tarjetaPenalties = (sport.puntosSet && !sport.penalizacionesSumanAlContrario) ? _sportPenalizaciones.filter(p => { const pl=p.toLowerCase(); return pl.includes('tarjeta roja') && (pl.includes('punto')||pl.includes('otorga')); }) : [];
  /* Penalties that add to scoreboard (cricket-style) → inline in Marcador, not in Penalizaciones tab */
  const _inlineScoringPenalties = sport.penalizacionesSumanAlContrario ? _sportPenalizaciones : [];
  const _tabPenalties = _isInfractionBased ? _nonPerdidaPenalties.filter(p => !_tarjetaPenalties.includes(p) && !_inlineScoringPenalties.includes(p)) : _sportPenalizaciones.filter(p => !_inlineScoringPenalties.includes(p));
  const hasPenalizacionesFiltered = _tabPenalties.length > 0;
  const hasDescalificaciones = activeDescals.length > 0 || _perdidaPenalties.length > 0;
  const hasEstadisticas = (sport.estadisticasComplementarias && sport.estadisticasComplementarias.length > 0) || (sport.estadisticasJuego && sport.estadisticasJuego.length > 0);
  const hasExtraTime = sport.permiteTiempoExtra && !sport.puntosSet; /* Hide extra time for counter-based sets (badminton) */
  const isRondaSport = !['marca','jueces'].includes(sport.puntuacion);
  const isRondaComp = comp && comp.matches && comp.matches.filter(m => /^(Ronda|Heat)\s/i.test(m.phase)).length > 1;
  const hasParticipants = (isRondaSport || isRondaComp) && matchData.participants && matchData.participants.length > 0 && (!matchData.teams || matchData.teams.length < 2 || matchData.teams[0] === 'Todos');
  const isVs = !hasParticipants && ['acumulativa_tiempos','innings','sets','combate'].includes(sport.puntuacion);
  /* Sanitize team names AFTER hasParticipants check: "Todos" is a marker, not a real team */
  if(matchData.teams){
    if(matchData.teams[0] === 'Todos') matchData.teams[0] = 'Equipo 1';
    if(matchData.teams[1] === 'Todos') matchData.teams[1] = 'Equipo 2';
  }
  let html = '';

  /* ── Header ── */
  html += `<div class="modal-header">
    <div>
      <div class="modal-title">${sport.emoji} ${sport.label} ${comp.genero} ${comp.categoria}</div>
      <div class="modal-subtitle">${matchData.phase} · ${comp.code}</div>
    </div>
    <button class="modal-close" onclick="closeScoringModal()">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  </div>`;

  /* ── Tabs ── */
  html += `<div class="modal-tabs">
    <div class="modal-tab active" data-tab="marcador" onclick="switchModalTab(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Marcador</div>
    ${hasPenalizacionesFiltered ? `<div class="modal-tab" data-tab="penalizaciones" onclick="switchModalTab(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Penalizaciones <span class="tab-badge">${_tabPenalties.length}</span></div>` : ''}
    ${hasDescalificaciones ? `<div class="modal-tab" data-tab="descalificaciones" onclick="switchModalTab(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> ${_isInfractionBased ? 'Pérdidas / Descalif.' : 'Descalificaciones'} <span class="tab-badge">${activeDescals.length + _perdidaPenalties.length}</span></div>` : ''}
    ${hasEstadisticas ? `<div class="modal-tab" data-tab="estadisticas" onclick="switchModalTab(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Estadísticas <span class="tab-badge">${(sport.estadisticasComplementarias||[]).length + (sport.estadisticasJuego||[]).length}</span></div>` : ''}
  </div>`;

  /* ── Tab: Marcador ── */
  html += `<div class="tab-panel active" id="tab-marcador">`;

  /* ── Sport info banner (scoring system, time, modality) ── */
  if(sport.scoringSystem || sport.modalidad || sport.tipoEnfrentamiento || sport.puntosSet){
    const ss = sport.scoringSystem;
    let scoringText = '';
    if(ss){
      if(ss.victoria !== undefined && ss.tablas !== undefined){
        scoringText = `Victoria: <b>${ss.victoria} pt</b> · Tablas: <b>${ss.tablas} pt</b> · Derrota: <b>${ss.derrota} pt</b>`;
      } else if(ss.victoria !== undefined && ss.empate !== undefined){
        scoringText = `Victoria: <b>${ss.victoria} pts</b> · Empate: <b>${ss.empate} pt</b> · Derrota: <b>${ss.derrota} pts</b>`;
      }
    }
    /* Sets-based scoring info (badminton, volleyball, etc.) */
    if(!scoringText && sport.puntosSet){
      const stParts = [`<b>${sport.puntosSet} pts</b> por set`];
      if(sport.difMinima) stParts.push(`dif. mín. <b>${sport.difMinima}</b>`);
      if(sport.techoSet) stParts.push(`techo <b>${sport.techoSet} pts</b>`);
      if(sport.setsParaGanar) stParts.push(`<b>${sport.setsParaGanar}</b> sets para ganar`);
      if(sport.setDecisivoPuntos) stParts.push(`set decisivo: <b>${sport.setDecisivoPuntos} pts</b>`);
      scoringText = stParts.join(' · ');
    }
    html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:18px 28px 14px;padding:14px 16px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">
      ${sport.modalidad ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:var(--radius-full);background:var(--blue-bg);border:1px solid #bdd7f7;font:600 12px var(--font);color:var(--blue-info)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${sport.modalidad}</span>` : ''}
      ${sport.tipoEnfrentamiento ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:var(--radius-full);background:#f3f0ff;border:1px solid #d4c8f5;font:500 11px var(--font);color:var(--purple)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${sport.tipoEnfrentamiento === 'Duelo' ? (sport.tipo === 'conjunto' ? 'Duelo' : 'Duelo 1v1') : sport.tipoEnfrentamiento}</span>` : ''}
      ${sport.tiempoParcial ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:var(--radius-full);background:var(--orange-bg);border:1px solid var(--orange-border);font:600 12px var(--font);color:#b45309"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${sport.tiempoParcial}</span>` : ''}
      ${sport.desempate ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:var(--radius-full);background:var(--green-bg);border:1px solid var(--green-border);font:500 11px var(--font);color:var(--green)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Desempate: ${sport.desempate}</span>` : ''}
      ${sport.autoWin ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:var(--radius-full);background:#fef3c7;border:1px solid #fcd34d;font:600 11px var(--font);color:#92400e">🏆 Victoria automática: ${sport.autoWin} pts</span>` : ''}
    </div>
    ${scoringText ? `<div style="padding:10px 14px;background:#f8f7ff;border:1px solid #e0ddf5;border-radius:var(--radius-md);font-size:12px;color:var(--text-secondary);margin:0 28px 16px;display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> <span><b>Puntuación:</b> ${scoringText}</span></div>` : ''}`;
  }

  const _hasButtonScoring = sport.scoringConfig && sport.scoringConfig.buttons && sport.scoringConfig.buttons.length > 0;

  if(hasParticipants){
    html += buildRondaParticipantsSection(sport, matchData, comp);
  } else switch(sport.puntuacion){
    case 'acumulativa_tiempos':
      html += buildVsHeader(matchData);
      if(sport.scoringConfig?.judoMode){
        html += buildJudoGrid(sport, matchData, sportKey);
      } else if(_hasButtonScoring){
        html += buildBasketballGrid(sport, matchData, sportKey);
        if(sport.penalizacionesSumanAlContrario){
          html += buildInlinePenaltySection(sport, matchData);
        }
      } else {
        html += buildTimesGrid(sport, matchData);
      }
      break;
    case 'innings':
      html += buildVsHeader(matchData);
      html += buildInningsGrid(sport, matchData);
      break;
    case 'sets':
      html += buildVsHeader(matchData);
      html += buildSetsGrid(sport, matchData);
      if(sport.penalizacionesSumanAlContrario){
        html += buildInlinePenaltySection(sport, matchData);
      }
      break;
    case 'combate':
      html += buildVsHeader(matchData);
      html += buildCombatGrid(sport, matchData);
      if(sport.accionesEspeciales && sport.accionesEspeciales.length > 0){
        html += buildSpecialActionsOnly(sport);
      }
      break;
    case 'marca':
      html += buildMarcaSection(sport, matchData, comp);
      break;
    case 'jueces':
      html += buildJudgesSection(sport, matchData);
      break;
  }
  /* Scoring action buttons — skip for basketball-style (buttons are inline in the grid) */
  if(isVs && sport.scoringConfig && sport.scoringConfig.buttons && !_hasButtonScoring){
    html += buildScoringButtons(sport, matchData);
  }
  /* Game timer — skip for outcome-based sports (chess), counter-based sets (badminton), basketball-style, and marca sports (atletismo, natación) */
  const _ssTimer = sport.scoringSystem;
  const _isMarca = sport.puntuacion === 'marca' || sport.puntuacion === 'jueces';
  const _isJudoMode = sport.scoringConfig?.judoMode;
  const _timerIsInformational = (_ssTimer && (_ssTimer.tablas !== undefined || _ssTimer.empate !== undefined)) || sport.puntosSet || _hasButtonScoring || _isMarca || _isJudoMode;
  if(sport.tiempoParcial && sport.parciales && sport.parciales.length > 0 && !_timerIsInformational){
    html += GameTimer.buildHTML(sport.parciales, sport.tiempoParcial);
    setTimeout(() => GameTimer.init(sport.parciales, sport.tiempoParcial), 0);
  }
  /* Extra time — skip for basketball-style (prórrogas inline), innings (extra innings inline),
     and scoringSystem sports with desempateDescripcion (now handled in GANADOR → Empate flow) */
  const _isInningsSport = sport.puntuacion === 'innings';
  const _ssET = sport.scoringSystem;
  const _hasDesempateInGanador = sport.desempateDescripcion && sport.desempateDescripcion.length > 0 && _ssET && (_ssET.tablas !== undefined || _ssET.empate !== undefined);
  if(hasExtraTime && !_hasButtonScoring && !_isInningsSport && !_hasDesempateInGanador && !_isJudoMode){
    const cfg = sport.tiempoExtraConfig || {};
    const etLabel = '⏱️ Tiempo extra / Prórroga';
    const etInfo = `Duración: ${cfg.duracion || 'Variable'}`;
    html += `<div class="extra-time-row">
      <div class="extra-time-toggle" onclick="toggleExtraTime(this,'${sportKey}')"></div>
      <div>
        <div class="extra-time-label">${etLabel}</div>
        <div class="extra-time-info">${etInfo}</div>
      </div>
    </div>
    <div id="extraTimeParciales" style="display:none"></div>`;
  }
  html += `</div>`;

  /* ── Tab: Penalizaciones ── */
  if(hasPenalizacionesFiltered){
    html += `<div class="tab-panel" id="tab-penalizaciones">`;
    html += buildPenalizacionesTab(sport, matchData, _isInfractionBased);
    html += `</div>`;
  }

  /* ── Tab: Descalificaciones / Pérdidas ── */
  if(hasDescalificaciones){
    html += `<div class="tab-panel" id="tab-descalificaciones">`;
    html += buildDescalificacionesTab(sport, matchData, isVs, sportKey, _perdidaPenalties, comp);
    html += `</div>`;
  }

  /* ── Tab: Estadísticas ── */
  if(hasEstadisticas){
    html += `<div class="tab-panel" id="tab-estadisticas">`;
    html += buildEstadisticasTab(sport, matchData, isVs, comp);
    html += `</div>`;
  }

  /* ── Victoria Directa (KO, etc.) — instant win buttons in Marcador ── */
  if(isVs && sport.victoriaDirecta && sport.victoriaDirecta.length > 0){
    let _vdT1 = (matchData.teams && matchData.teams[0]) || 'Equipo 1';
    let _vdT2 = (matchData.teams && matchData.teams[1]) || 'Equipo 2';
    html += `<div class="winner-section" style="border-top:2px solid #c0392b;background:linear-gradient(180deg,#fff5f5 0%,var(--surface) 100%)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span style="font-size:18px">⚡</span>
        <div>
          <div style="font-size:13px;font-weight:600;color:#c0392b;letter-spacing:.3px">VICTORIA DIRECTA</div>
          <div style="font-size:11px;color:var(--text-secondary)">Fin inmediato del combate — se auto-selecciona como ganador</div>
        </div>
      </div>
      ${sport.victoriaDirecta.map(vd => `<div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${vd.label}</span>
          <span style="font-size:11px;color:var(--text-secondary)">${vd.desc}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-outline btn-sm" style="flex:1;border-color:#c0392b;color:#c0392b" onclick="applyVictoriaDirecta(this,'1','${vd.label}')">⚡ ${_vdT1}</button>
          <button type="button" class="btn btn-outline btn-sm" style="flex:1;border-color:#c0392b;color:#c0392b" onclick="applyVictoriaDirecta(this,'2','${vd.label}')">⚡ ${_vdT2}</button>
        </div>
      </div>`).join('')}
    </div>`;
  }

  /* ── Winner selection ── */
  if(isVs){
    /* Draw allowed only in group/robin phases — NOT in elimination (must have a winner) */
    const _isElim = (comp && (comp.sisCls === 'elim' || comp.sisCls === 'doble')) ||
      (comp && comp.sistema && /eliminaci[oó]n/i.test(comp.sistema)) ||
      (matchData.phase && /semifinal|final|cuartos|octavos|dieciseisavos/i.test(matchData.phase) && !/grupo|jornada|robin/i.test(matchData.phase));
    const allowDraw = !_isElim && !['combate'].includes(sport.puntuacion);
    let wt1 = (matchData.teams && matchData.teams[0]) || 'Equipo 1';
    let wt2 = (matchData.teams && matchData.teams[1]) || 'Equipo 2';
    if(wt1 === 'Todos') wt1 = 'Equipo 1';
    if(wt2 === 'Todos') wt2 = 'Equipo 2';
    html += `<div class="winner-section">
      <div class="winner-label">🏆 GANADOR <span class="req">*</span></div>
      <div class="winner-options">
        <div class="winner-opt" onclick="selectWinner(this)" data-winner="1" data-participant-name="${wt1}">
          <span class="winner-emoji">🎉</span>
          <div class="winner-name">${wt1}</div>
          <div class="winner-tag">✓ Ganador</div>
        </div>
        ${allowDraw ? `<div class="winner-opt draw" onclick="selectWinner(this)" data-winner="empate">
          <span class="winner-emoji">🤝</span>
          <div class="winner-name">Empate</div>
          <div class="winner-tag">✓ Empate</div>
        </div>` : ''}
        <div class="winner-opt" onclick="selectWinner(this)" data-winner="2" data-participant-name="${wt2}">
          <span class="winner-emoji">🎉</span>
          <div class="winner-name">${wt2}</div>
          <div class="winner-tag">✓ Ganador</div>
        </div>
      </div>
      ${(sport.desempateDescripcion && sport.desempateDescripcion.length > 0) ? `
      <div id="desempateSection" style="display:none;margin-top:16px;padding-top:16px;border-top:2px solid var(--blue-info);animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <span style="font-size:16px">⚖️</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--blue-info);letter-spacing:.3px">RESOLUCIÓN DE DESEMPATE</div>
            <div style="font-size:11px;color:var(--text-secondary)">${sport.desempate || 'Selecciona el criterio y el ganador'}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:6px">¿Cómo se resolvió?</div>
            <div class="float-dd-wrap" style="display:block;width:100%" id="desempateCritWrap">
              <div class="float-dd-trigger" id="desempateCritTrigger" onclick="toggleDesempateDd('crit')" style="color:var(--text-secondary);font-weight:400;width:100%">Seleccionar criterio</div>
              <div class="float-dd-menu" id="desempateCritMenu" style="min-width:280px">
                ${sport.desempateDescripcion.map((d,i) => `<div class="float-dd-opt" data-val="${i}" onclick="pickDesempateCrit(this,'${d.replace(/'/g,"\\'")}',${i})">${i+1}. ${d}</div>`).join('')}
              </div>
            </div>
          </div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:6px">Ganador del desempate</div>
            <div class="float-dd-wrap" style="display:block;width:100%" id="desempateWinWrap">
              <div class="float-dd-trigger" id="desempateWinTrigger" onclick="toggleDesempateDd('win')" style="color:var(--text-secondary);font-weight:400;width:100%">Seleccionar ganador</div>
              <div class="float-dd-menu" id="desempateWinMenu">
                <div class="float-dd-opt" data-val="1" onclick="pickDesempateWinner(this,'1','${wt1}')">${wt1}</div>
                <div class="float-dd-opt" data-val="2" onclick="pickDesempateWinner(this,'2','${wt2}')">${wt2}</div>
              </div>
            </div>
          </div>
        </div>
      </div>` : ''}
    </div>`;
  } else {
    /* For marca/jueces — participant-based winner selection */
    let participants = matchData.participants || matchData.teams || [];
    if(participants.length === 0){
      if(matchData.teams && matchData.teams.length >= 2) participants = matchData.teams;
      else { const n = comp ? (comp.total || 6) : 6; participants = Array.from({length: Math.min(n, 8)}, (_, i) => `Participante ${i + 1}`); }
    }
    if(participants.length > 1){
      const isRondaLocked = hasParticipants && _rondaMatches.length > 1;
      html += `<div class="winner-section" id="winnerSection" ${isRondaLocked ? 'data-ronda-locked="true"' : ''}>
        ${isRondaLocked ? `<div id="winnerLockedOverlay" style="position:relative">
          <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:12px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--text-primary)">Completa todas las rondas primero</div>
              <div style="font-size:11px;color:var(--text-secondary)">La clasificación final se habilitará cuando todas las rondas tengan puntajes registrados</div>
            </div>
            <span id="winnerLockedProgress" style="font-size:11px;font-weight:600;color:var(--accent);white-space:nowrap;margin-left:auto">0/${_rondaMatches.length}</span>
          </div>
        </div>` : ''}
        <div class="winner-label">🏆 CLASIFICACIÓN FINAL *</div>
        <div class="winner-options" data-podium="true" ${isRondaLocked ? 'style="opacity:.4;pointer-events:none"' : ''}>
          ${participants.map((p,i) => `<div class="winner-opt" onclick="selectWinner(this)" data-winner="${i+1}" data-participant-name="${p}">
            <div class="winner-name">${p}</div>
            <div class="winner-tag"></div>
          </div>`).join('')}
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-secondary)">Selecciona en orden: 1er lugar, 2do lugar y 3er lugar.</div>
        ${(sport.desempateDescripcion && sport.desempateDescripcion.length > 0) ? `
        <div style="margin-top:12px">
          <div class="winner-opt draw" onclick="togglePodiumDesempate(this)" data-winner="empate" style="max-width:160px">
            <span class="winner-emoji">🤝</span>
            <div class="winner-name">Empate</div>
            <div class="winner-tag">✓ Empate</div>
          </div>
        </div>
        <div id="desempateSection" style="display:none;margin-top:16px;padding-top:16px;border-top:2px solid var(--blue-info);animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span style="font-size:16px">⚖️</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--blue-info);letter-spacing:.3px">RESOLUCIÓN DE DESEMPATE</div>
              <div style="font-size:11px;color:var(--text-secondary)">${sport.desempate || 'Si hay empate en puntaje, selecciona el criterio decisivo'}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:6px">¿Cómo se resolvió?</div>
              <div class="float-dd-wrap" style="display:block;width:100%" id="desempateCritWrap">
                <div class="float-dd-trigger" id="desempateCritTrigger" onclick="toggleDesempateDd('crit')" style="color:var(--text-secondary);font-weight:400;width:100%">Seleccionar criterio</div>
                <div class="float-dd-menu" id="desempateCritMenu" style="min-width:280px">
                  ${sport.desempateDescripcion.map((d,i) => `<div class="float-dd-opt" data-val="${i}" onclick="pickDesempateCrit(this,'${d.replace(/'/g,"\\\\'")}',${i})">${i+1}. ${d}</div>`).join('')}
                </div>
              </div>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:6px">Ganador del desempate</div>
              <div class="float-dd-wrap" style="display:block;width:100%" id="desempateWinWrap">
                <div class="float-dd-trigger" id="desempateWinTrigger" onclick="toggleDesempateDd('win')" style="color:var(--text-secondary);font-weight:400;width:100%">Seleccionar ganador</div>
                <div class="float-dd-menu" id="desempateWinMenu">
                  ${participants.map((p,i) => `<div class="float-dd-opt" data-val="${i+1}" onclick="pickDesempateWinner(this,'${i+1}','${p.replace(/'/g,"\\\\'")}')"> ${p}</div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>` : ''}
      </div>`;
    }
  }

  /* ── Notes + confirm + footer ── */
  html += `<div class="obs-section">
    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">NOTAS</div>
    <textarea id="obsNotes" class="obs-textarea" placeholder="Incidencias, Observaciones, sanciones, protestas, etc."></textarea>
  </div>`;
  html += `<div class="confirm-row">
    <div class="confirm-check" onclick="toggleConfirm(this)">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style="display:none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <span class="confirm-text" onclick="toggleConfirm(this.previousElementSibling)">Confirmo que el resultado registrado corresponde al acta física oficial y es correcto</span>
  </div>`;
  html += `<div class="modal-footer">
    <button class="btn-link" onclick="closeScoringModal()" style="margin-right:auto">Cancelar</button>
    ${hasParticipants ? `
      <button class="btn-link" id="saveRondaBtn" onclick="saveRondaPartial(${compId})" style="color:var(--accent);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 13h-10a1 1 0 01-1-1V3a1 1 0 011-1h7.5l3 3v7a1 1 0 01-1 1z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 13V8.5H5V13M5 2v3h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Guardar ronda
      </button>
    ` : ''}
    <button class="btn btn-orange" id="saveResultBtn" disabled onclick="saveResult('${compId}', ${matchData.id})">Guardar resultado</button>
  </div>`;

  modal.innerHTML = html;
  modal.dataset.sportKey = sportKey;
  const overlay = document.getElementById('scoringModal');
  overlay.style.display = '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  recalcTotals();
  InputValidation.attachAll();
  /* Update acumulado grid with restored scores */
  if(typeof updateAcumulado === 'function') setTimeout(updateAcumulado, 50);
}

function closeScoringModal(){
  const overlay = document.getElementById('scoringModal');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function openScoringModalReadOnly(sportKey, matchData, compId){
  openScoringModal(sportKey, matchData, compId);
  /* Make everything read-only after modal renders */
  setTimeout(() => {
    const modal = document.getElementById('modalContent');
    /* Disable all inputs */
    modal.querySelectorAll('input, textarea, select').forEach(el => {
      el.readOnly = true;
      el.disabled = true;
      el.style.opacity = '0.7';
      el.style.cursor = 'default';
    });
    /* Disable all buttons inside modal except close */
    modal.querySelectorAll('button, .counter-btn, .winner-opt, .confirm-check, .descal-header, .descal-p-row, .extra-time-toggle').forEach(el => {
      if(!el.classList.contains('modal-close')){
        el.style.pointerEvents = 'none';
      }
    });
    /* Hide footer save buttons, show read-only banner */
    const footer = modal.querySelector('.modal-footer');
    if(footer) footer.innerHTML = `<button class="btn-link" onclick="closeScoringModal()" style="margin-right:auto">Cerrar</button>
      <span style="font-size:12px;font-weight:500;color:var(--blue-info);display:inline-flex;align-items:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C3 1.5 1 7 1 7s2 5.5 6 5.5 6-5.5 6-5.5-2-5.5-6-5.5z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
        Modo lectura — Resultado registrado
      </span>`;
    /* Hide confirm row */
    const confirmRow = modal.querySelector('.confirm-row');
    if(confirmRow) confirmRow.style.display = 'none';
    /* Add read-only banner at top */
    const header = modal.querySelector('.modal-header');
    if(header){
      const banner = document.createElement('div');
      banner.style.cssText = 'padding:10px 28px;background:var(--blue-bg);border-bottom:1px solid #c2d6f0;font-size:12px;font-weight:500;color:var(--blue-info);display:flex;align-items:center;gap:8px';
      banner.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3M7 9v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Vista de lectura — Los resultados ya fueron registrados oficialmente';
      header.after(banner);
    }
    /* Populate saved scores for VS sports */
    if(matchData.scores){
      const ts1 = document.getElementById('totalScore1');
      const ts2 = document.getElementById('totalScore2');
      if(ts1) ts1.value = matchData.scores.t1 || 0;
      if(ts2) ts2.value = matchData.scores.t2 || 0;
    }
    /* Populate saved ronda scores */
    if(matchData.rondaScores){
      const inputs = modal.querySelectorAll('#rondaTableWrap .scoring-table .score-input');
      inputs.forEach((inp, idx) => {
        const val = matchData.rondaScores[idx];
        if(val != null) inp.value = val;
      });
    }
  }, 50);
}

// Close on overlay click
document.addEventListener('click', (e) => {
  if(e.target.id === 'scoringModal') closeScoringModal();
});

function toggleConfirm(el){
  el.classList.toggle('checked');
  const svg = el.querySelector('svg');
  svg.style.display = el.classList.contains('checked') ? 'block' : 'none';
  checkSaveReady();
}

function checkSaveReady(){
  const btn = document.getElementById('saveResultBtn');
  if(!btn) return;

  // 1. Checkbox must be checked
  if(!document.querySelector('.confirm-check.checked')){ btn.disabled=true; return; }

  // 2. Winner required for VS sports
  if(document.querySelector('.winner-section') && !document.querySelector('.winner-opt.selected')){ btn.disabled=true; return; }

  // 3. At least one score/time/mark entered
  const timeInputs = document.querySelectorAll('.atl-lane-input, .lt-time-hidden');
  const fieldInputs = document.querySelectorAll('.atl-attempt-input:not(.nulo)');
  const combInputs  = document.querySelectorAll('.atl-comb-input, .comb-row-input input');
  const scoreInputs = document.querySelectorAll('.score-input');

  let hasData = true; // default: no mandatory score inputs (marca/jueces)
  if(timeInputs.length > 0){
    hasData = Array.from(timeInputs).some(i => i.value && atlParseTime(i.value) !== null);
  } else if(fieldInputs.length > 0){
    hasData = Array.from(fieldInputs).some(i => i.value && parseFloat(i.value) > 0);
  } else if(combInputs.length > 0){
    hasData = Array.from(combInputs).some(i => i.value !== '');
  } else if(scoreInputs.length > 0){
    hasData = Array.from(scoreInputs).some(i => i.value !== '');
  }

  /* Direct score override: if user typed totals directly, consider as valid data */
  if(!hasData && _directScoreOverride){
    const ts1 = document.getElementById('totalScore1');
    const ts2 = document.getElementById('totalScore2');
    if((ts1 && parseInt(ts1.value) > 0) || (ts2 && parseInt(ts2.value) > 0)) hasData = true;
  }

  btn.disabled = !hasData;
}

function showDigiToast(title, desc){
  const t = document.getElementById('digiToast');
  document.getElementById('digiToastTitle').textContent = title;
  document.getElementById('digiToastDesc').innerHTML = desc;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
function hideDigiToast(){
  document.getElementById('digiToast').classList.remove('show');
}

/* ═══ RONDA PARTICIPANTS (individual round-based scoring) ═══ */
let _rondaCurrentIdx = 0;
let _rondaMatches = [];
let _rondaCompId = null;
let _rondaScores = {}; /* { rondaIdx: { participantIdx: value } } */
let _rondaDqMap = {}; /* { rondaIdx: { participantIdx: { tipo: string, descripcion: string } } } */

function buildRondaParticipantsSection(sport, match, comp){
  _rondaMatches = (comp.matches || []).filter(m => /^(Ronda|Heat)\s/i.test(m.phase));
  if(!_rondaMatches.length) _rondaMatches = [match];
  _rondaCurrentIdx = _rondaMatches.findIndex(m => m.id === match.id);
  if(_rondaCurrentIdx < 0) _rondaCurrentIdx = 0;
  _rondaCompId = comp.id;

  /* Restore previously saved ronda scores from match data */
  _rondaScores = {};
  _rondaDqMap = {};
  _selectedDqInfraction = null;
  _rondaMatches.forEach((rm, rIdx) => {
    const savedMatch = comp.matches.find(m => m.id === rm.id);
    if(savedMatch && savedMatch.rondaScores){
      _rondaScores[rIdx] = { ...savedMatch.rondaScores };
    }
  });

  const participants = match.participants || [];
  const puntDesc = sport.descPuntuacion || (sport.puntuacion === 'marca' ? (sport.tipoMarca === 'tiempo' ? 'Tiempo' : sport.tipoMarca === 'peso' ? 'Peso' : 'Resultado') : sport.puntuacion === 'jueces' ? 'Puntaje' : 'Puntos');
  const totalRondas = _rondaMatches.length;

  let html = '';

  /* ── Ronda navigation tabs (sticky bar) ── */
  if(totalRondas > 1){
    const _tealC = '#0891b2';
    const _tealBgLight = '#ecfeff';
    html += `<div class="ronda-tabs-sticky" style="position:sticky;top:102px;z-index:2;background:var(--surface);padding:12px 28px;border-bottom:1px solid var(--border)">
      <div style="display:flex;gap:6px;flex-wrap:wrap">`;
    _rondaMatches.forEach((rm, i) => {
      const active = i === _rondaCurrentIdx;
      const savedMatch = comp.matches.find(m => m.id === rm.id);
      const mStatus = savedMatch ? savedMatch.status : rm.status;
      const statusDot = mStatus === 'done'
        ? `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#1f8923"/></svg>`
        : mStatus === 'in-progress'
        ? `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="${_tealC}"/></svg>`
        : mStatus === 'ready'
        ? `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#1f8923"/></svg>`
        : `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="none" stroke="#d0d4e6" stroke-width="1"/></svg>`;
      html += `<button class="ronda-tab-btn${active?' active':''}" onclick="switchRonda(${i})" style="
        display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-full);
        font:500 12px var(--font);cursor:pointer;transition:all .15s;
        border:1.5px solid ${active?_tealC:'var(--border-dark)'};
        background:${active?_tealBgLight:'var(--surface)'};
        color:${active?_tealC:'var(--text-primary)'};
      ">${statusDot} ${rm.phase}</button>`;
    });
    html += `</div></div>`;
  }

  html += `<div class="scoring-grid" id="rondaScoringGrid">`;

  /* ── Current ronda header ── */
  html += `<div class="ronda-header-label" style="font-size:12px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;margin-bottom:12px">
    REGISTRO DE RESULTADOS — ${match.phase} · ${comp ? comp.categoria : ''}
  </div>`;

  /* ── Scoring table ── */
  html += `<div id="rondaTableWrap">`;
  html += buildRondaTable(participants, puntDesc);
  html += `</div>`;

  /* ── Acumulado general (if multiple rounds) ── */
  if(totalRondas > 1){
    html += `<div id="rondaTotalsWrap" style="margin-top:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">Clasificación general</span>
        <span style="font-size:11px;color:var(--text-secondary);background:var(--bg);padding:2px 8px;border-radius:var(--radius-full);border:1px solid var(--border)">${totalRondas} rondas</span>
      </div>
      <div class="acum-grid" id="rondaTotalsBody" style="--rondas:${totalRondas}">
        <div class="acum-row head">
          <div class="acum-cell">#</div>
          <div class="acum-cell name">Participante</div>
          ${_rondaMatches.map((rm,i) => `<div class="acum-cell">R${i+1}</div>`).join('')}
          <div class="acum-cell">TOTAL</div>
        </div>
        ${participants.map((p, idx) => `<div class="acum-row" data-pidx="${idx}">
          <div class="acum-cell"><span class="ronda-pos" id="acum_pos_${idx}">${idx+1}</span></div>
          <div class="acum-cell name">${p}</div>
          ${_rondaMatches.map((rm,i) => `<div class="acum-cell acum-r" data-r="${i}" id="acum_r${i}_p${idx}" style="color:var(--text-secondary)">—</div>`).join('')}
          <div class="acum-cell total" id="acum_total_${idx}">0</div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function buildRondaTable(participants, puntDesc){
  /* Detect if sport uses discrete outcome scoring (like chess: victoria/tablas/derrota) */
  const comp = _resolveComp(_rondaCompId);
  const sport = comp ? SPORTS_DB[comp.sport] : {};
  const ss = sport.scoringSystem;
  const hasOutcomes = ss && (ss.tablas !== undefined || ss.empate !== undefined);

  if(hasOutcomes){
    /* ── Outcome-based scoring (chess, etc.) ── */
    const isDuelo = sport.tipoEnfrentamiento && (sport.tipoEnfrentamiento.toLowerCase().includes('duelo'));
    const isTablas = ss.tablas !== undefined;
    const outcomes = isTablas
      ? [{label:'Victoria',value:ss.victoria,emoji:'✅',color:'var(--green)',bg:'var(--green-bg)',border:'var(--green-border)'},
         {label:'Tablas',value:ss.tablas,emoji:'🤝',color:'#b45309',bg:'var(--orange-bg)',border:'var(--orange-border)'},
         {label:'Derrota',value:ss.derrota,emoji:'❌',color:'#dc2626',bg:'var(--red-bg)',border:'var(--red-border)'}]
      : [{label:'Victoria',value:ss.victoria,emoji:'✅',color:'var(--green)',bg:'var(--green-bg)',border:'var(--green-border)'},
         {label:'Empate',value:ss.empate,emoji:'🤝',color:'#b45309',bg:'var(--orange-bg)',border:'var(--orange-border)'},
         {label:'Derrota',value:ss.derrota,emoji:'❌',color:'#dc2626',bg:'var(--red-bg)',border:'var(--red-border)'}];

    /* ── Duel pairing mode: show matchups instead of flat list ── */
    if(isDuelo && participants.length >= 2){
      const pairs = [];
      for(let i = 0; i < participants.length; i += 2){
        if(i + 1 < participants.length){
          pairs.push([i, i+1]);
        } else {
          pairs.push([i, null]); /* BYE — odd participant */
        }
      }

      let html = `<div class="duel-pairings">`;
      pairs.forEach((pair, pairIdx) => {
        const [aIdx, bIdx] = pair;
        const pA = participants[aIdx];
        const pB = bIdx !== null ? participants[bIdx] : null;
        const savedA = _rondaScores[_rondaCurrentIdx]?.[aIdx];
        const savedAVal = savedA != null ? parseFloat(savedA) : null;
        const savedB = bIdx !== null ? (_rondaScores[_rondaCurrentIdx]?.[bIdx]) : null;
        const savedBVal = savedB != null ? parseFloat(savedB) : null;

        html += `<div class="duel-card" data-pair="${pairIdx}" style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;margin-bottom:12px;background:var(--surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);letter-spacing:.4px">TABLERO ${pairIdx + 1}</span>
            <span style="font-size:10px;color:var(--text-secondary)">${pB ? '' : '🔄 BYE'}</span>
          </div>`;

        if(pB){
          /* Normal duel: two players */
          html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div style="flex:1;text-align:center">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:600 14px var(--font);margin-bottom:4px">${pA.charAt(0)}</div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${pA}</div>
              <div style="font-size:18px;font-weight:600;color:${savedAVal != null ? 'var(--accent)' : 'var(--text-secondary)'};margin-top:2px" id="rondaPts_${aIdx}">${savedAVal != null ? savedAVal : '—'}</div>
            </div>
            <div style="font-size:11px;font-weight:600;color:var(--text-secondary);padding:4px 8px;background:var(--bg);border-radius:var(--radius-sm)">VS</div>
            <div style="flex:1;text-align:center">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-info);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:600 14px var(--font);margin-bottom:4px">${pB.charAt(0)}</div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${pB}</div>
              <div style="font-size:18px;font-weight:600;color:${savedBVal != null ? 'var(--accent)' : 'var(--text-secondary)'};margin-top:2px" id="rondaPts_${bIdx}">${savedBVal != null ? savedBVal : '—'}</div>
            </div>
          </div>`;

          /* Outcome buttons as a row */
          const drawLabel = isTablas ? 'Tablas' : 'Empate';
          const drawValue = isTablas ? ss.tablas : ss.empate;
          const drawEmoji = '🤝';

          /* Determine active state */
          const aWins = savedAVal === ss.victoria && savedBVal === ss.derrota;
          const bWins = savedBVal === ss.victoria && savedAVal === ss.derrota;
          const draw = savedAVal === drawValue && savedBVal === drawValue;

          const _checkSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          html += `<div style="display:flex;gap:6px">
            <button type="button" class="duel-outcome-btn${aWins?' active':''}" data-pair="${pairIdx}" data-result="a-wins"
              onclick="selectDuelOutcome(${aIdx},${bIdx},'a-wins',this)"
              style="flex:1;padding:8px;border-radius:var(--radius-md);font:500 11px var(--font);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px;
              border:1.5px solid ${aWins?'var(--green-border)':'var(--border-dark)'};
              background:${aWins?'var(--green-bg)':'var(--surface)'};
              color:${aWins?'var(--green)':'var(--text-secondary)'};">
              ${_checkSvg} Gana ${pA.length > 12 ? pA.substring(0,12)+'…' : pA}
            </button>
            <button type="button" class="duel-outcome-btn${draw?' active':''}" data-pair="${pairIdx}" data-result="draw"
              onclick="selectDuelOutcome(${aIdx},${bIdx},'draw',this)"
              style="padding:8px 12px;border-radius:var(--radius-md);font:500 11px var(--font);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px;
              border:1.5px solid ${draw?'var(--orange-border)':'var(--border-dark)'};
              background:${draw?'var(--orange-bg)':'var(--surface)'};
              color:${draw?'#b45309':'var(--text-secondary)'};">
              ${drawEmoji} ${drawLabel}
            </button>
            <button type="button" class="duel-outcome-btn${bWins?' active':''}" data-pair="${pairIdx}" data-result="b-wins"
              onclick="selectDuelOutcome(${aIdx},${bIdx},'b-wins',this)"
              style="flex:1;padding:8px;border-radius:var(--radius-md);font:500 11px var(--font);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px;
              border:1.5px solid ${bWins?'var(--green-border)':'var(--border-dark)'};
              background:${bWins?'var(--green-bg)':'var(--surface)'};
              color:${bWins?'var(--green)':'var(--text-secondary)'};">
              ${_checkSvg} Gana ${pB.length > 12 ? pB.substring(0,12)+'…' : pB}
            </button>
          </div>`;
        } else {
          /* BYE: auto-win */
          html += `<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:12px">
            <span style="font-weight:600">${pA}</span> pasa automáticamente (sin rival)
          </div>`;
        }

        html += `</div>`;
      });
      html += `</div>`;
      return html;
    }

    /* ── Flat list fallback (non-duel outcome sports) ── */
    return `<table class="scoring-table">
      <thead><tr>
        <th style="width:36px">#</th>
        <th>PARTICIPANTE</th>
        <th>RESULTADO</th>
        <th style="width:60px">PTS</th>
      </tr></thead>
      <tbody>
        ${participants.map((p,idx) => {
          const saved = _rondaScores[_rondaCurrentIdx]?.[idx];
          const savedVal = saved != null ? parseFloat(saved) : null;
          return `<tr>
            <td style="text-align:center;font-weight:500;color:var(--text-secondary)">${idx+1}</td>
            <td style="font-weight:500">${p}</td>
            <td>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                ${outcomes.map(o => {
                  const isActive = savedVal === o.value;
                  return `<button type="button" class="outcome-btn${isActive?' active':''}" data-pidx="${idx}" data-value="${o.value}"
                    onclick="selectOutcome(${idx},${o.value},this)"
                    style="display:inline-flex;align-items:center;gap:3px;padding:5px 10px;border-radius:var(--radius-full);
                    font:500 11px var(--font);cursor:pointer;transition:all .15s;
                    border:1.5px solid ${isActive?o.border:'var(--border-dark)'};
                    background:${isActive?o.bg:'var(--surface)'};
                    color:${isActive?o.color:'var(--text-secondary)'};"
                  >${o.emoji} ${o.label} <span style="font-weight:600">${o.value}</span></button>`;
                }).join('')}
              </div>
            </td>
            <td style="text-align:center;font-weight:600;font-size:15px" id="rondaPts_${idx}">${savedVal != null ? savedVal : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  /* ── Standard numeric / time input (other sports) ── */
  const isTiempoRonda = sport.tipoMarca === 'tiempo';
  const _avatarColors = ['#d74009','#1f78d1','#7c3aed','#0891b2','#b45309','#1f8923','#dc2626','#6366f1','#0d9488','#a855f7'];
  return `<table class="scoring-table">
    <thead><tr>
      <th style="width:36px">#</th>
      <th style="text-align:left">PARTICIPANTE</th>
      <th style="width:${isTiempoRonda?'130':'110'}px">${puntDesc.toUpperCase()}</th>
    </tr></thead>
    <tbody>
      ${participants.map((p,idx) => {
        const saved = _rondaScores[_rondaCurrentIdx]?.[idx];
        const initials = p.split(/\s+/).map(w=>w.charAt(0)).join('').substring(0,2).toUpperCase();
        const avColor = _avatarColors[idx % _avatarColors.length];
        return `<tr>
          <td style="text-align:center"><span class="marca-pos" style="background:${avColor}">${idx+1}</span></td>
          <td style="text-align:left"><div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:${avColor}15;border:1.5px solid ${avColor}40;color:${avColor};display:flex;align-items:center;justify-content:center;font:600 11px var(--font);flex-shrink:0">${initials}</div>
            <span style="font-weight:500;font-size:13px">${p}</span>
          </div></td>
          <td>${isTiempoRonda
            ? `<input class="score-input time-mask" type="text" placeholder="00:00.00" value="${saved!=null?saved:''}" oninput="formatTimeMask(this);recalcRondaResults()" onfocus="cursorToStart(this)" inputmode="decimal" style="text-align:center;width:100%;font-variant-numeric:tabular-nums;letter-spacing:.5px"/>`
            : `<input class="score-input wide" type="text" placeholder="0" value="${saved!=null?saved:''}" oninput="recalcRondaResults()" style="text-align:center"/>`
          }</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function switchRonda(idx){
  if(idx < 0 || idx >= _rondaMatches.length) return;
  /* Save current scores before switching */
  saveCurrentRondaScores();
  _rondaCurrentIdx = idx;
  const match = _rondaMatches[idx];
  const participants = match.participants || [];
  const comp = _resolveComp(_rondaCompId);
  const sport = comp ? SPORTS_DB[comp.sport] : {};
  const puntDesc = sport.descPuntuacion || (sport.puntuacion === 'marca' ? (sport.tipoMarca === 'tiempo' ? 'Tiempo' : sport.tipoMarca === 'peso' ? 'Peso' : 'Resultado') : sport.puntuacion === 'jueces' ? 'Puntaje' : 'Puntos');

  /* Update tab active state */
  const _teal = '#0891b2';
  const _tealBg = '#ecfeff';
  document.querySelectorAll('.ronda-tab-btn').forEach((btn, i) => {
    const active = i === idx;
    btn.classList.toggle('active', active);
    btn.style.border = `1.5px solid ${active?_teal:'var(--border-dark)'}`;
    btn.style.background = active ? _tealBg : 'var(--surface)';
    btn.style.color = active ? _teal : 'var(--text-primary)';
  });

  /* Update header text */
  const header = document.querySelector('.ronda-header-label');
  if(header) header.textContent = `REGISTRO DE RESULTADOS — ${match.phase} · ${comp ? comp.categoria : ''}`;

  /* Update table (with saved scores restored) */
  const tableWrap = document.getElementById('rondaTableWrap');
  if(tableWrap) tableWrap.innerHTML = buildRondaTable(participants, puntDesc);

  /* Update save button match id */
  const saveBtn = document.getElementById('saveResultBtn');
  if(saveBtn) saveBtn.setAttribute('onclick', `saveResult('${_rondaCompId}', ${match.id})`);
}

function saveCurrentRondaScores(){
  /* Duel pairings and outcome buttons save directly to _rondaScores — no DOM scraping needed */
  const hasDuelCards = document.querySelector('#rondaTableWrap .duel-card');
  const hasOutcomeBtns = document.querySelector('#rondaTableWrap .outcome-btn.active');
  if(hasDuelCards || hasOutcomeBtns) return; /* Already saved via selectDuelOutcome/selectOutcome */

  const rows = document.querySelectorAll('#rondaTableWrap .scoring-table tbody tr');
  if(!rows.length) return;
  if(!_rondaScores[_rondaCurrentIdx]) _rondaScores[_rondaCurrentIdx] = {};
  rows.forEach((row, idx) => {
    const input = row.querySelector('.score-input');
    const val = parseFloat(input?.value);
    if(!isNaN(val)) _rondaScores[_rondaCurrentIdx][idx] = val;
    else delete _rondaScores[_rondaCurrentIdx][idx];
  });
}

function selectOutcome(pIdx, value, btnEl){
  /* Toggle: if already active, deselect */
  const wasActive = btnEl.classList.contains('active');

  /* Deactivate all buttons for this participant */
  const row = btnEl.closest('tr');
  row.querySelectorAll('.outcome-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });

  /* Activate clicked (unless toggling off) */
  if(!wasActive){
    btnEl.classList.add('active');
    /* Get color scheme from the button's outcome type */
    const emoji = btnEl.textContent.trim().charAt(0);
    if(emoji === '✅'){ btnEl.style.border='1.5px solid var(--green-border)'; btnEl.style.background='var(--green-bg)'; btnEl.style.color='var(--green)'; }
    else if(emoji === '🤝'){ btnEl.style.border='1.5px solid var(--orange-border)'; btnEl.style.background='var(--orange-bg)'; btnEl.style.color='#b45309'; }
    else { btnEl.style.border='1.5px solid var(--red-border)'; btnEl.style.background='var(--red-bg)'; btnEl.style.color='#dc2626'; }
  }

  /* Update points display */
  const ptsEl = document.getElementById('rondaPts_' + pIdx);
  if(ptsEl) ptsEl.textContent = wasActive ? '—' : value;

  /* Save to ronda scores */
  if(!_rondaScores[_rondaCurrentIdx]) _rondaScores[_rondaCurrentIdx] = {};
  if(wasActive){
    delete _rondaScores[_rondaCurrentIdx][pIdx];
  } else {
    _rondaScores[_rondaCurrentIdx][pIdx] = value;
  }

  /* Recalculate totals */
  updateAcumulado();
  checkSaveReady();
}

/* ═══ Duel outcome selection (individual pairings) ═══ */
function selectDuelOutcome(aIdx, bIdx, result, btnEl){
  const comp = _resolveComp(_rondaCompId);
  const sport = comp ? SPORTS_DB[comp.sport] : {};
  const ss = sport.scoringSystem || {};
  const isTablas = ss.tablas !== undefined;
  const drawValue = isTablas ? ss.tablas : ss.empate;

  /* Toggle: if already active, deselect */
  const wasActive = btnEl.classList.contains('active');
  const card = btnEl.closest('.duel-card');

  /* Deactivate all buttons in this pair */
  card.querySelectorAll('.duel-outcome-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });

  if(!_rondaScores[_rondaCurrentIdx]) _rondaScores[_rondaCurrentIdx] = {};
  const ptsA = document.getElementById('rondaPts_' + aIdx);
  const ptsB = document.getElementById('rondaPts_' + bIdx);

  if(wasActive){
    /* Deselect: clear both scores */
    delete _rondaScores[_rondaCurrentIdx][aIdx];
    delete _rondaScores[_rondaCurrentIdx][bIdx];
    if(ptsA){ ptsA.textContent = '—'; ptsA.style.color = 'var(--text-secondary)'; }
    if(ptsB){ ptsB.textContent = '—'; ptsB.style.color = 'var(--text-secondary)'; }
  } else {
    /* Activate clicked result */
    btnEl.classList.add('active');
    let aVal, bVal;

    if(result === 'a-wins'){
      aVal = ss.victoria; bVal = ss.derrota;
      btnEl.style.border = '1.5px solid var(--green-border)';
      btnEl.style.background = 'var(--green-bg)';
      btnEl.style.color = 'var(--green)';
    } else if(result === 'b-wins'){
      aVal = ss.derrota; bVal = ss.victoria;
      btnEl.style.border = '1.5px solid var(--green-border)';
      btnEl.style.background = 'var(--green-bg)';
      btnEl.style.color = 'var(--green)';
    } else {
      aVal = drawValue; bVal = drawValue;
      btnEl.style.border = '1.5px solid var(--orange-border)';
      btnEl.style.background = 'var(--orange-bg)';
      btnEl.style.color = '#b45309';
    }

    _rondaScores[_rondaCurrentIdx][aIdx] = aVal;
    _rondaScores[_rondaCurrentIdx][bIdx] = bVal;

    if(ptsA){ ptsA.textContent = aVal; ptsA.style.color = 'var(--accent)'; }
    if(ptsB){ ptsB.textContent = bVal; ptsB.style.color = 'var(--accent)'; }

    /* Highlight card border briefly */
    card.style.borderColor = 'var(--accent)';
    setTimeout(() => { card.style.borderColor = 'var(--border)'; }, 800);
  }

  updateAcumulado();
  checkSaveReady();
}

/* ═══ VS Outcome selection (team vs team with outcome buttons) ═══ */
function selectVsOutcome(teamIdx, value, btnEl){
  const wasActive = btnEl.classList.contains('active');
  /* Deactivate all buttons for this team row */
  const row = btnEl.closest('div[style*="display:flex"]');
  row.querySelectorAll('.outcome-vs-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });
  if(!wasActive){
    btnEl.classList.add('active');
    /* Color based on value: highest = green, middle = orange, lowest = red */
    const allBtns = Array.from(row.querySelectorAll('.outcome-vs-btn'));
    const allVals = allBtns.map(b => parseFloat(b.dataset.value));
    const maxVal = Math.max(...allVals);
    const minVal = Math.min(...allVals);
    if(value === maxVal){ btnEl.style.border='1.5px solid var(--green-border)'; btnEl.style.background='var(--green-bg)'; btnEl.style.color='var(--green)'; }
    else if(value === minVal){ btnEl.style.border='1.5px solid var(--red-border)'; btnEl.style.background='var(--red-bg)'; btnEl.style.color='#dc2626'; }
    else { btnEl.style.border='1.5px solid var(--orange-border)'; btnEl.style.background='var(--orange-bg)'; btnEl.style.color='#b45309'; }
  }
  /* Update VS header score */
  const scoreEl = document.getElementById('totalScore' + teamIdx);
  if(scoreEl) scoreEl.textContent = wasActive ? '0' : value;
  checkSaveReady();
}

function recalcRondaResults(){
  /* Save current inputs */
  saveCurrentRondaScores();
  /* Update acumulado */
  updateAcumulado();
}

function updateAcumulado(){
  const totalsBody = document.getElementById('rondaTotalsBody');
  if(!totalsBody) return;
  const match = _rondaMatches[_rondaCurrentIdx];
  const participants = match?.participants || [];
  const totals = [];

  participants.forEach((p, pIdx) => {
    let sum = 0;
    let hasDq = false;
    _rondaMatches.forEach((rm, rIdx) => {
      const rawVal = _rondaScores[rIdx]?.[pIdx];
      const hasVal = rawVal !== undefined && rawVal !== null;
      const val = hasVal ? rawVal : 0;
      const isDq = !!(_rondaDqMap[rIdx]?.[pIdx]);
      if(isDq) hasDq = true;
      const cell = document.getElementById(`acum_r${rIdx}_p${pIdx}`);
      if(cell){
        if(isDq){
          cell.innerHTML = `<span style="color:#dc2626;font-weight:600;font-size:10px" title="Pérdida/Descalificación">DQ</span>`;
        } else {
          cell.textContent = hasVal ? val : '—';
        }
        cell.style.color = isDq ? '#dc2626' : (hasVal ? 'var(--text-primary)' : 'var(--text-secondary)');
        cell.style.fontWeight = hasVal || isDq ? '600' : '400';
      }
      sum += val;
    });
    totals.push({pIdx, sum, hasDq});
    const totalEl = document.getElementById(`acum_total_${pIdx}`);
    if(totalEl){
      totalEl.textContent = sum > 0 ? sum : '0';
      if(hasDq){
        totalEl.innerHTML = `${sum > 0 ? sum : '0'} <span style="font-size:9px;color:#dc2626;font-weight:600;vertical-align:super">DQ</span>`;
      }
    }
  });

  /* Sort and assign position classes */
  const sorted = [...totals].sort((a,b) => b.sum - a.sum);

  /* Detect ties: group by sum */
  const tieGroups = {};
  sorted.forEach(t => {
    const key = t.sum.toString();
    if(!tieGroups[key]) tieGroups[key] = [];
    tieGroups[key].push(t);
  });

  let realRank = 0;
  const rankMap = {};
  Object.values(tieGroups).sort((a,b) => b[0].sum - a[0].sum).forEach(group => {
    const startRank = realRank;
    group.forEach(t => {
      rankMap[t.pIdx] = { rank: startRank, tied: group.length > 1 && t.sum > 0 };
      realRank++;
    });
  });

  sorted.forEach((t) => {
    const info = rankMap[t.pIdx];
    const rank = info.rank;
    const posEl = document.getElementById(`acum_pos_${t.pIdx}`);
    if(posEl){
      if(t.sum > 0){
        posEl.textContent = rank + 1;
        if(info.tied) posEl.title = 'Empatado — requiere desempate';
      } else {
        posEl.textContent = '-';
      }
      posEl.className = 'ronda-pos';
      if(t.sum > 0 && rank === 0) posEl.classList.add('top-1');
      else if(t.sum > 0 && rank === 1) posEl.classList.add('top-2');
      else if(t.sum > 0 && rank === 2) posEl.classList.add('top-3');
      if(info.tied) posEl.classList.add('tied');
    }
    /* Reorder rows visually via order */
    const row = totalsBody.querySelector(`.acum-row[data-pidx="${t.pIdx}"]`);
    if(row){
      row.style.order = rank;
      row.className = 'acum-row' + (t.sum > 0 && rank === 0 ? ' rank-1' : t.sum > 0 && rank === 1 ? ' rank-2' : t.sum > 0 && rank === 2 ? ' rank-3' : '');
      if(info.tied) row.classList.add('tied');
    }
  });

  /* Show/update tie indicator */
  const hasTies = Object.values(tieGroups).some(g => g.length > 1 && g[0].sum > 0);
  let tieIndicator = document.getElementById('tieIndicator');
  if(hasTies){
    const comp = _resolveComp(_rondaCompId);
    const sport = comp ? SPORTS_DB[comp.sport] : {};
    const desempateMethod = sport.desempate || '';
    const desempateDesc = sport.desempateDescripcion || [];

    if(!tieIndicator){
      tieIndicator = document.createElement('div');
      tieIndicator.id = 'tieIndicator';
      totalsBody.parentElement.appendChild(tieIndicator);
    }
    const tiedEntries = Object.values(tieGroups).filter(g => g.length > 1 && g[0].sum > 0);
    let tieHtml = `<div style="margin-top:12px;padding:12px 14px;background:var(--orange-bg);border:1px solid var(--orange-border);border-radius:var(--radius-md);font-size:11px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-weight:600;color:#b45309">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ${tiedEntries.length} empate${tiedEntries.length > 1 ? 's' : ''} detectado${tiedEntries.length > 1 ? 's' : ''}
      </div>`;
    if(desempateMethod){
      tieHtml += `<div style="color:var(--text-secondary);margin-bottom:4px">Método: <strong style="color:var(--text-primary)">${desempateMethod}</strong></div>`;
    }
    if(desempateDesc.length > 0){
      tieHtml += `<div style="color:var(--text-secondary)">Criterios: ${desempateDesc.slice(0,3).map((d,i) => `<span style="color:var(--text-primary)">${i+1}. ${d}</span>`).join(' · ')}</div>`;
    }
    tieHtml += `</div>`;
    tieIndicator.innerHTML = tieHtml;
    tieIndicator.style.display = 'block';
  } else if(tieIndicator){
    tieIndicator.style.display = 'none';
  }

  /* Check if all rondas are complete → unlock winner section */
  _checkRondaCompletion();
}

function _checkRondaCompletion(){
  const winnerSection = document.getElementById('winnerSection');
  if(!winnerSection || !winnerSection.dataset.rondaLocked) return;

  const totalRondas = _rondaMatches.length;
  let completedRondas = 0;

  _rondaMatches.forEach((rm, rIdx) => {
    const parts = rm.participants || [];
    if(parts.length === 0){ completedRondas++; return; }
    /* Check all participants have scores */
    const scores = _rondaScores[rIdx];
    if(!scores){ return; }
    const allScored = parts.every((_, pIdx) => scores[pIdx] !== undefined && scores[pIdx] !== null);
    if(allScored) completedRondas++;
  });

  const progressEl = document.getElementById('winnerLockedProgress');
  if(progressEl) progressEl.textContent = `${completedRondas}/${totalRondas}`;

  const isComplete = completedRondas >= totalRondas;
  const overlay = document.getElementById('winnerLockedOverlay');
  const opts = winnerSection.querySelector('.winner-options');

  if(isComplete){
    if(overlay) overlay.style.display = 'none';
    if(opts){ opts.style.opacity = '1'; opts.style.pointerEvents = ''; }
    delete winnerSection.dataset.rondaLocked;
  } else {
    if(overlay) overlay.style.display = '';
    if(opts){ opts.style.opacity = '.4'; opts.style.pointerEvents = 'none'; }
  }
}

/* ═══ VS HEADER (for team-based sports) ═══ */
function buildVsHeader(match){
  const c1 = TEAM_COLORS[0], c2 = TEAM_COLORS[1];
  let t1 = (match.teams && match.teams[0]) || 'Equipo 1';
  let t2 = (match.teams && match.teams[1]) || 'Equipo 2';
  if(t1 === 'Todos') t1 = 'Equipo 1';
  if(t2 === 'Todos') t2 = 'Equipo 2';
  const i1 = t1.charAt(0), i2 = t2.charAt(0);
  return `<div class="score-header">
    <div class="score-team">
      <div class="team-circle" style="background:${c1}">${i1}</div>
      <div>
        <div class="team-name">${t1}</div>
      </div>
    </div>
    <div style="text-align:center">
      <input type="number" class="score-big" id="totalScore1" value="0" min="0" oninput="_onDirectScoreEdit()" onfocus="this.select()">
      <span id="penalesIndicator1" style="display:none;font-size:13px;font-weight:600;color:var(--text-secondary)"></span>
    </div>
    <div class="score-vs">VS</div>
    <div style="text-align:center">
      <input type="number" class="score-big" id="totalScore2" value="0" min="0" oninput="_onDirectScoreEdit()" onfocus="this.select()">
      <span id="penalesIndicator2" style="display:none;font-size:13px;font-weight:600;color:var(--text-secondary)"></span>
    </div>
    <div class="score-team right">
      <div class="team-circle" style="background:${c2}">${i2}</div>
      <div>
        <div class="team-name">${t2}</div>
      </div>
    </div>
  </div>`;
}

/* ═══ ACUMULATIVA POR TIEMPOS ═══ */
function buildTimesGrid(sport, match){
  if(!match.teams || match.teams.length < 2) match = {...match, teams: [match.teams?.[0]||'Equipo 1', match.teams?.[1]||'Equipo 2']};
  if(match.teams[0] === 'Todos') match = {...match, teams: ['Equipo 1', match.teams[1] || 'Equipo 2']};
  if(match.teams[1] === 'Todos') match = {...match, teams: [match.teams[0], 'Equipo 2']};
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : null;
  const tiempoInfo = sport.tiempoParcial ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:8px">Tiempo por parcial: ${sport.tiempoParcial}</div>` : '';

  /* ── Outcome-based VS scoring (e.g. Ajedrez equipos: Victoria/Empate/Derrota) ── */
  const ss = sport.scoringSystem;
  const hasOutcomes = ss && (ss.tablas !== undefined || ss.empate !== undefined);
  if(hasOutcomes){
    const hasTablas = ss.tablas !== undefined;
    const outcomes = hasTablas
      ? [{label:'Victoria',value:ss.victoria,color:'#1f8923',bg:'var(--green-bg)',border:'var(--green-border)'},{label:'Tablas',value:ss.tablas,color:'#b45309',bg:'var(--orange-bg)',border:'var(--orange-border)'},{label:'Derrota',value:ss.derrota,color:'#dc2626',bg:'var(--red-bg)',border:'var(--red-border)'}]
      : [{label:'Victoria',value:ss.victoria,color:'#1f8923',bg:'var(--green-bg)',border:'var(--green-border)'},{label:'Empate',value:ss.empate,color:'#b45309',bg:'var(--orange-bg)',border:'var(--orange-border)'},{label:'Derrota',value:ss.derrota,color:'#dc2626',bg:'var(--red-bg)',border:'var(--red-border)'}];
    const buildOutcomeRow = (teamName, teamIdx) => {
      return `<div style="display:flex;align-items:center;gap:12px;padding:14px 0;${teamIdx===1?'border-top:1px solid var(--border)':''}">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);min-width:120px">${teamName}</div>
        <div style="display:flex;gap:8px;flex:1;justify-content:center">
          ${outcomes.map(o => `<button type="button" class="outcome-vs-btn" data-team="${teamIdx}" data-value="${o.value}"
            onclick="selectVsOutcome(${teamIdx},${o.value},this)"
            style="padding:8px 18px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px">
            ${o.label} <span style="opacity:.6">${o.value} pt${o.value!==1?'s':''}</span>
          </button>`).join('')}
        </div>
      </div>`;
    };
    return `<div style="padding:20px 28px">
      ${buildOutcomeRow(match.teams[0], 1)}
      ${buildOutcomeRow(match.teams[1], 2)}
      ${tiempoInfo}
    </div>`;
  }

  if(!cols){
    // No parciales: puntaje directo compacto
    return `<div class="direct-score-grid">
      <div class="direct-score-card">
        <div class="direct-score-label">${match.teams[0]}</div>
        <input class="direct-score-input score-input" type="number" min="0" data-team="1" data-col="0"
          oninput="this.classList.toggle('has-value',this.value!=='');recalcTotals(true)" onfocus="setActiveScoreInput(this)"/>
      </div>
      <div class="direct-score-sep">VS</div>
      <div class="direct-score-card">
        <div class="direct-score-label">${match.teams[1]}</div>
        <input class="direct-score-input score-input" type="number" min="0" data-team="2" data-col="0"
          oninput="this.classList.toggle('has-value',this.value!=='');recalcTotals(true)" onfocus="setActiveScoreInput(this)"/>
      </div>
    </div>
    ${tiempoInfo}`;
  }
  return `<div class="scoring-grid">
    <table class="scoring-table">
      <thead><tr>
        <th>EQUIPO</th>
        ${cols.map(c => `<th>${c}</th>`).join('')}
      </tr></thead>
      <tbody>
        <tr>
          <td>${match.teams[0]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="1" data-col="${i}" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
        <tr>
          <td>${match.teams[1]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="2" data-col="${i}" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
      </tbody>
    </table>
    ${tiempoInfo}
  </div>`;
}

/* ═══ JUDO GRID — técnicas (Waza-ari/Ippon) + Shidos + auto-win + Golden Score ═══ */
let _judoState = null;

function buildJudoGrid(sport, match, sportKey){
  const t1 = match.teams[0], t2 = match.teams[1];
  const shidoMax = sport.scoringConfig?.shidoMax || 3;
  const shidoLabel = sport.scoringConfig?.shidoLabel || 'Shido';
  const dqLabel = sport.scoringConfig?.dqLabel || 'Hansoku-make';
  const hasGoldenScore = sport.permiteTiempoExtra;
  const prorrogaName = (sport.prorrogaLabels && sport.prorrogaLabels[0]) || 'Golden Score';

  _judoState = {
    activeTab:'Combate',
    periods:{ 'Combate':{ 1:{wazaari:0,ippon:false}, 2:{wazaari:0,ippon:false} } },
    shidos:{1:0, 2:0},
    goldenScoreActive: false,
    winner:null, winReason:null,
    teams:[t1,t2], shidoMax, shidoLabel, dqLabel, prorrogaName, sportKey
  };

  let html = `<div class="scoring-grid" id="judoGrid">`;

  /* ── Period tabs ── */
  html += `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center" id="judoTabsRow">
    <button class="judo-tab-btn active" data-period="Combate" onclick="switchJudoTab('Combate')"
      style="padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid var(--accent);
      background:var(--orange-bg);font:600 12px var(--font);color:var(--accent);cursor:pointer;transition:all .15s;
      display:flex;align-items:center;gap:6px">
      Combate <span class="judo-tab-score" style="font-size:10px;opacity:.7">0 – 0</span>
    </button>`;
  if(hasGoldenScore){
    html += `<button id="judoAddGoldenBtn" onclick="addJudoGoldenScore()" style="padding:7px 14px;border-radius:var(--radius-full);
      border:1.5px dashed var(--border-dark);background:var(--surface);font:600 12px var(--font);
      color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:4px"
      onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
      onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">
      + ${prorrogaName}
    </button>`;
  }
  html += `</div>`;

  /* ── Active panel ── */
  html += `<div id="judoActivePanel" style="padding:20px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">`;
  html += _buildJudoPanelContent('Combate', t1, t2);
  html += `</div>`;

  /* ── Shido section ── */
  html += `<div id="judoShidoSection" style="margin-top:14px;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
    <div style="font:600 11px var(--font);color:var(--text-secondary);letter-spacing:.5px;margin-bottom:10px;text-transform:uppercase">${shidoLabel}s (penalizaciones)</div>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">`;
  [1,2].forEach(ti => {
    const name = ti===1?t1:t2;
    html += `<div style="flex:1;min-width:200px;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-md);background:#fafbfd">
      <div style="font:600 12px var(--font);color:var(--text-primary);margin-bottom:8px">${name}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div id="judoShidoDots_${ti}" style="display:flex;gap:4px">${_buildShidoDots(0, shidoMax)}</div>
        <button onclick="addJudoShido(${ti})" class="judo-shido-btn" id="judoShidoBtn_${ti}" style="
          padding:6px 14px;border-radius:var(--radius-full);border:1.5px solid #f59e0b;background:#fffbeb;
          font:600 11px var(--font);color:#92400e;cursor:pointer;transition:all .15s;white-space:nowrap"
          onmouseover="this.style.background='#fef3c7';this.style.borderColor='#d97706'"
          onmouseout="this.style.background='#fffbeb';this.style.borderColor='#f59e0b'">
          + ${shidoLabel}
        </button>
        <button onclick="removeJudoShido(${ti})" style="
          padding:6px 10px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);
          font:600 11px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s"
          onmouseover="this.style.borderColor='#dc2626';this.style.color='#dc2626'"
          onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">−1</button>
      </div>
    </div>`;
  });
  html += `</div></div>`;

  /* ── Auto-win banner ── */
  html += `<div id="judoWinBanner" style="display:none;margin-top:14px;padding:18px 24px;border-radius:var(--radius-lg);
    animation:fadeInUp .35s cubic-bezier(.4,0,.2,1)">
    <div id="judoWinIcon" style="width:40px;height:40px;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:18px"></div>
    <div id="judoWinTitle" style="font:600 15px var(--font);text-align:center;margin-bottom:4px"></div>
    <div id="judoWinSub" style="font:500 12px var(--font);text-align:center;opacity:.8"></div>
  </div>`;

  /* ── Summary ── */
  html += `<div id="judoSummary" style="margin-top:12px;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md)">`;
  html += _buildJudoSummary(t1, t2);
  html += `</div>`;

  /* Hidden inputs for recalcTotals compatibility */
  html += `<div id="judoHiddenInputs" style="display:none">
    <input class="score-input" type="hidden" data-team="1" data-col="0" value="0"/>
    <input class="score-input" type="hidden" data-team="2" data-col="0" value="0"/>
  </div>`;

  html += `</div>`;
  return html;
}

function _buildJudoPanelContent(period, t1, t2){
  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <span style="font:600 13px var(--font);color:var(--text-primary)" id="judoActiveLabel">${period}</span>
    <span id="judoPeriodStatus" style="padding:4px 12px;border-radius:var(--radius-full);font:600 10px var(--font);letter-spacing:.3px;
      background:var(--blue-bg);border:1px solid #bdd7f7;color:var(--blue-info)">DIGITANDO</span>
  </div>`;
  html += _buildJudoTeamRow(1, t1, period);
  html += `<div style="height:1px;background:var(--border);margin:14px 0"></div>`;
  html += _buildJudoTeamRow(2, t2, period);
  return html;
}

function _buildJudoTeamRow(teamIdx, teamName, period){
  const data = _judoState?.periods[period]?.[teamIdx] || {wazaari:0, ippon:false};
  const disabled = _judoState?.winner ? 'pointer-events:none;opacity:.5;' : '';
  let html = `<div class="judo-team-row" data-team="${teamIdx}" id="judoTeamRow_${teamIdx}" style="${disabled}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font:600 13px var(--font);color:var(--text-primary)">${teamName}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div id="judoWazaDots_${teamIdx}" style="display:flex;gap:4px">${_buildWazaDots(data.wazaari)}</div>
        <div id="judoIpponBadge_${teamIdx}" style="display:${data.ippon?'inline-flex':'none'};align-items:center;gap:4px;padding:4px 12px;border-radius:var(--radius-full);background:#dc2626;color:#fff;font:600 11px var(--font)">🔴 IPPON</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="judoBtns_${teamIdx}">
      <button type="button" onclick="judoAddWazaari(${teamIdx})" style="
        display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:var(--radius-full);
        border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);
        color:var(--text-primary);cursor:pointer;transition:all .15s;white-space:nowrap"
        onmouseover="this.style.borderColor='#f59e0b';this.style.background='#fffbeb';this.style.color='#92400e'"
        onmouseout="this.style.borderColor='var(--border-dark)';this.style.background='var(--surface)';this.style.color='var(--text-primary)'"
      >🟡 Waza-ari</button>
      <button type="button" onclick="judoAddIppon(${teamIdx})" style="
        display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:var(--radius-full);
        border:1.5px solid #dc2626;background:#fff0ee;font:600 12px var(--font);
        color:#dc2626;cursor:pointer;transition:all .15s;white-space:nowrap"
        onmouseover="this.style.background='#fecaca'"
        onmouseout="this.style.background='#fff0ee'"
      >🔴 Ippon → Victoria</button>
      <button type="button" onclick="judoUndoWazaari(${teamIdx})" style="
        display:inline-flex;align-items:center;gap:4px;padding:8px 12px;border-radius:var(--radius-full);
        border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);
        color:var(--text-secondary);cursor:pointer;transition:all .15s"
        onmouseover="this.style.borderColor='#dc2626';this.style.color='#dc2626'"
        onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'"
      >−1</button>
    </div>
  </div>`;
  return html;
}

function _buildWazaDots(count){
  let html = '';
  for(let i=0;i<2;i++){
    const filled = i < count;
    html += `<span style="width:16px;height:16px;border-radius:50%;border:2px solid ${filled?'#f59e0b':'#d0d4e6'};
      background:${filled?'#f59e0b':'transparent'};display:inline-block;transition:all .2s"></span>`;
  }
  return html;
}

function _buildShidoDots(count, max){
  let html = '';
  for(let i=0;i<max;i++){
    const filled = i < count;
    const isLast = i === max - 1 && filled;
    const color = isLast ? '#dc2626' : (filled ? '#f59e0b' : '#d0d4e6');
    const bg = isLast ? '#dc2626' : (filled ? '#f59e0b' : 'transparent');
    html += `<span style="width:14px;height:14px;border-radius:50%;border:2px solid ${color};
      background:${bg};display:inline-block;transition:all .2s"></span>`;
  }
  return html;
}

function _buildJudoSummary(t1, t2){
  if(!_judoState) return '';
  const allPeriods = ['Combate', ...(_judoState.goldenScoreActive ? [_judoState.prorrogaName] : [])];
  let html = `<div style="font:600 9px var(--font);color:var(--text-secondary);letter-spacing:.3px;text-transform:uppercase;margin-bottom:6px;display:flex;gap:4px;align-items:center;flex-wrap:wrap">
    <span style="min-width:80px"></span>`;
  allPeriods.forEach(p => {
    const isGS = p === _judoState.prorrogaName;
    html += `<span style="min-width:60px;text-align:center;${isGS?'color:var(--accent)':''}">${p}</span>`;
  });
  const _sLabel = _judoState?.shidoLabel || 'Shidos';
  html += `<span style="min-width:40px;text-align:center">${_sLabel}s</span><span style="margin-left:4px">RESULTADO</span></div>`;

  [1,2].forEach(ti => {
    const name = ti===1?t1:t2;
    html += `<div style="display:flex;gap:4px;align-items:center;font:500 11px var(--font);color:var(--text-secondary);${ti===2?'margin-top:6px':''}flex-wrap:wrap">
      <span style="min-width:80px;font-weight:600">${name}</span>`;
    allPeriods.forEach(p => {
      const d = _judoState.periods[p]?.[ti] || {wazaari:0,ippon:false};
      const isGS = p === _judoState?.prorrogaName;
      let txt = '—';
      if(d.ippon){
        txt = `<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:#dc2626;display:inline-block"></span> Ippon</span>`;
      } else if(d.wazaari > 0){
        let dots = '';
        for(let w=0;w<d.wazaari;w++) dots += `<span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block"></span>`;
        txt = `<span style="display:inline-flex;align-items:center;gap:3px">${dots} W×${d.wazaari}</span>`;
      }
      html += `<span style="padding:3px 8px;background:${isGS?'#fff3e6':'var(--surface)'};border:1px solid ${isGS?'var(--orange-border)':'var(--border)'};border-radius:4px;min-width:60px;text-align:center;${isGS?'color:var(--accent)':''}">${txt}</span>`;
    });
    const shidos = _judoState.shidos[ti];
    const shidoColor = shidos >= _judoState.shidoMax ? '#dc2626' : (shidos > 0 ? '#f59e0b' : 'var(--text-secondary)');
    html += `<span style="min-width:40px;text-align:center;font-weight:600;color:${shidoColor}">${shidos}</span>`;
    const isWinner = _judoState.winner === ti;
    const resultTxt = isWinner
      ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:var(--radius-full);background:var(--green-bg);border:1px solid var(--green-border);color:var(--green);font:600 10px var(--font)">Victoria</span>`
      : (_judoState.winner && _judoState.winner !== ti ? '—' : '');
    html += `<span style="margin-left:4px;font-weight:600">${resultTxt}</span>`;
    html += `</div>`;
  });
  return html;
}

/* ── Judo actions ── */
function judoAddWazaari(teamIdx){
  if(!_judoState || _judoState.winner) return;
  const period = _judoState.activeTab;
  const data = _judoState.periods[period][teamIdx];
  data.wazaari++;

  /* 2 Waza-ari = Ippon */
  if(data.wazaari >= 2){
    data.ippon = true;
    _judoState.winner = teamIdx;
    _judoState.winReason = 'wazaari';
    _judoSetWinBanner(`${_judoState.teams[teamIdx-1]} gana el combate`, '2 Waza-ari = Ippon', 'wazaari');
  } else if(_judoState.goldenScoreActive && period === _judoState.prorrogaName){
    /* En prórroga cualquier técnica = victoria */
    _judoState.winner = teamIdx;
    _judoState.winReason = 'golden_score';
    _judoSetWinBanner(`${_judoState.teams[teamIdx-1]} gana`, `Waza-ari en ${_judoState.prorrogaName}`, 'golden');
  }
  _judoRefreshUI();
}

function judoAddIppon(teamIdx){
  if(!_judoState || _judoState.winner) return;
  const period = _judoState.activeTab;
  _judoState.periods[period][teamIdx].ippon = true;
  _judoState.winner = teamIdx;
  _judoState.winReason = 'ippon';
  _judoSetWinBanner(`${_judoState.teams[teamIdx-1]} gana el combate`, 'Ippon', 'ippon');
  _judoRefreshUI();
}

function judoUndoWazaari(teamIdx){
  if(!_judoState) return;
  const period = _judoState.activeTab;
  const data = _judoState.periods[period][teamIdx];
  if(data.wazaari <= 0 && !data.ippon) return;

  /* If winner was set by this team's technique, reset it */
  if(_judoState.winner === teamIdx && (_judoState.winReason === 'wazaari' || _judoState.winReason === 'ippon' || _judoState.winReason === 'golden_score')){
    _judoState.winner = null;
    _judoState.winReason = null;
    const banner = document.getElementById('judoWinBanner');
    if(banner) banner.style.display = 'none';
  }

  if(data.ippon && data.wazaari >= 2){
    data.ippon = false;
    data.wazaari--;
  } else if(data.ippon){
    data.ippon = false;
  } else if(data.wazaari > 0){
    data.wazaari--;
  }
  _judoRefreshUI();
}

function addJudoShido(teamIdx){
  if(!_judoState || _judoState.winner) return;
  _judoState.shidos[teamIdx]++;

  /* 3 Shidos = Hansoku-make → rival gana */
  if(_judoState.shidos[teamIdx] >= _judoState.shidoMax){
    const rival = teamIdx === 1 ? 2 : 1;
    _judoState.winner = rival;
    _judoState.winReason = 'hansoku';
    _judoSetWinBanner(`${_judoState.teams[rival-1]} gana`, `${_judoState.dqLabel} — ${_judoState.teams[teamIdx-1]} descalificado (${_judoState.shidoMax} ${_judoState.shidoLabel}s)`, 'hansoku');
  } else if(_judoState.goldenScoreActive && _judoState.activeTab === _judoState.prorrogaName){
    /* En prórroga un shido/yuko = rival gana */
    const rival = teamIdx === 1 ? 2 : 1;
    _judoState.winner = rival;
    _judoState.winReason = 'golden_score';
    _judoSetWinBanner(`${_judoState.teams[rival-1]} gana`, `${_judoState.shidoLabel} en ${_judoState.activeTab}`, 'golden');
  }
  _judoRefreshUI();
}

function removeJudoShido(teamIdx){
  if(!_judoState || _judoState.shidos[teamIdx] <= 0) return;
  /* If DQ was from this team's shidos, reset winner */
  if(_judoState.winner && _judoState.winReason === 'hansoku'){
    const rival = teamIdx === 1 ? 2 : 1;
    if(_judoState.winner === rival){
      _judoState.winner = null;
      _judoState.winReason = null;
      const banner = document.getElementById('judoWinBanner');
      if(banner) banner.style.display = 'none';
    }
  }
  if(_judoState.winner && _judoState.winReason === 'golden_score' && _judoState.shidos[teamIdx] > 0){
    _judoState.winner = null;
    _judoState.winReason = null;
    const banner = document.getElementById('judoWinBanner');
    if(banner) banner.style.display = 'none';
  }
  _judoState.shidos[teamIdx]--;
  _judoRefreshUI();
}

function addJudoGoldenScore(){
  if(!_judoState || _judoState.goldenScoreActive) return;
  _judoState.goldenScoreActive = true;
  const _prName = _judoState.prorrogaName;
  _judoState.periods[_prName] = { 1:{wazaari:0,ippon:false}, 2:{wazaari:0,ippon:false} };

  /* Add tab */
  const tabsRow = document.getElementById('judoTabsRow');
  const addBtn = document.getElementById('judoAddGoldenBtn');
  if(addBtn) addBtn.style.display = 'none';
  const newTab = document.createElement('button');
  newTab.className = 'judo-tab-btn';
  newTab.setAttribute('data-period', _prName);
  newTab.setAttribute('onclick',`switchJudoTab('${_prName.replace(/'/g,"\\'")}')`);
  newTab.style.cssText = 'padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)';
  newTab.innerHTML = `🔄 ${_prName} <span class="judo-tab-score" style="font-size:10px;opacity:.7">0 – 0</span>`;
  tabsRow.appendChild(newTab);

  switchJudoTab(_prName);
  _judoRefreshUI();
}

function switchJudoTab(period){
  if(!_judoState) return;
  _judoState.activeTab = period;
  document.querySelectorAll('.judo-tab-btn').forEach(btn => {
    const p = btn.getAttribute('data-period');
    const active = p === period;
    btn.style.borderColor = active ? 'var(--accent)' : 'var(--border-dark)';
    btn.style.background = active ? 'var(--orange-bg)' : 'var(--surface)';
    btn.style.color = active ? 'var(--accent)' : 'var(--text-secondary)';
    btn.classList.toggle('active', active);
  });
  const panel = document.getElementById('judoActivePanel');
  if(panel) panel.innerHTML = _buildJudoPanelContent(period, _judoState.teams[0], _judoState.teams[1]);
}

function _judoSetWinBanner(title, subtitle, type){
  const banner = document.getElementById('judoWinBanner');
  if(!banner) return;
  const isRed = type === 'ippon' || type === 'hansoku';
  const isYellow = type === 'wazaari' || type === 'golden';
  banner.style.display = 'block';
  banner.style.background = isRed ? 'var(--red-bg)' : '#fffbeb';
  banner.style.border = `1.5px solid ${isRed ? '#dc2626' : '#f59e0b'}`;
  const icon = document.getElementById('judoWinIcon');
  if(icon){
    icon.style.background = isRed ? '#dc2626' : '#f59e0b';
    icon.style.color = '#fff';
    icon.innerHTML = type === 'hansoku' ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  }
  const titleEl = document.getElementById('judoWinTitle');
  if(titleEl){ titleEl.style.color = isRed ? '#dc2626' : '#92400e'; titleEl.textContent = title; }
  const subEl = document.getElementById('judoWinSub');
  if(subEl){ subEl.style.color = isRed ? '#991b1b' : '#78350f'; subEl.textContent = subtitle; }
}

function _judoRefreshUI(){
  if(!_judoState) return;
  const {teams, shidoMax} = _judoState;

  /* Update waza-ari dots + ippon badge for active period */
  [1,2].forEach(ti => {
    const data = _judoState.periods[_judoState.activeTab]?.[ti] || {wazaari:0,ippon:false};
    const dots = document.getElementById(`judoWazaDots_${ti}`);
    if(dots) dots.innerHTML = _buildWazaDots(data.wazaari);
    const badge = document.getElementById(`judoIpponBadge_${ti}`);
    if(badge) badge.style.display = data.ippon ? 'inline-flex' : 'none';
  });

  /* Update shido dots */
  [1,2].forEach(ti => {
    const dots = document.getElementById(`judoShidoDots_${ti}`);
    if(dots) dots.innerHTML = _buildShidoDots(_judoState.shidos[ti], shidoMax);
  });

  /* Disable buttons if winner decided */
  [1,2].forEach(ti => {
    const row = document.getElementById(`judoTeamRow_${ti}`);
    if(row) row.style.cssText = _judoState.winner ? 'pointer-events:none;opacity:.5;' : '';
  });
  const shidoSection = document.getElementById('judoShidoSection');
  if(shidoSection) shidoSection.style.cssText = _judoState.winner
    ? 'margin-top:14px;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);pointer-events:none;opacity:.5'
    : 'margin-top:14px;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)';

  /* Update tab badges */
  document.querySelectorAll('.judo-tab-btn').forEach(btn => {
    const p = btn.getAttribute('data-period');
    const d = _judoState.periods[p];
    if(!d) return;
    const sc = btn.querySelector('.judo-tab-score');
    if(sc) sc.textContent = `${d[1].wazaari}${d[1].ippon?'I':''} – ${d[2].wazaari}${d[2].ippon?'I':''}`;
  });

  /* Update summary */
  const summary = document.getElementById('judoSummary');
  if(summary) summary.innerHTML = _buildJudoSummary(teams[0], teams[1]);

  /* Update hidden inputs + VS header for recalcTotals/saveResult */
  _judoSyncHiddenInputs();

  /* Auto-select winner in GANADOR section */
  if(_judoState.winner){
    const winnerBtns = document.querySelectorAll('#ganadorSection .winner-btn, .winner-btn');
    winnerBtns.forEach(btn => {
      const val = btn.getAttribute('data-winner') || btn.getAttribute('onclick');
      if(val && val.includes(`${_judoState.winner === 1 ? "'1'" : "'2'"}`)){
        btn.click();
      }
    });
  }

  if(typeof checkSaveReady === 'function') checkSaveReady();
}

function _judoSyncHiddenInputs(){
  if(!_judoState) return;
  /* Sum waza-ari across all periods for each team */
  let total1 = 0, total2 = 0;
  Object.keys(_judoState.periods).forEach(p => {
    const d = _judoState.periods[p];
    total1 += d[1].wazaari + (d[1].ippon ? 10 : 0);
    total2 += d[2].wazaari + (d[2].ippon ? 10 : 0);
  });

  /* Update hidden inputs */
  const container = document.getElementById('judoHiddenInputs');
  if(container){
    container.innerHTML = `<input class="score-input" type="hidden" data-team="1" data-col="0" value="${total1}"/>
      <input class="score-input" type="hidden" data-team="2" data-col="0" value="${total2}"/>`;
  }

  /* Update VS header big numbers */
  const ts1 = document.getElementById('totalScore1');
  const ts2 = document.getElementById('totalScore2');
  if(ts1) ts1.value = total1;
  if(ts2) ts2.value = total2;
}

/* ═══ BASKETBALL-STYLE GRID (button scoring per team per quarter + dynamic prórrogas) ═══ */
let _bballState = null;

function buildBasketballGrid(sport, match, sportKey){
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];
  const t1 = match.teams[0], t2 = match.teams[1];
  const buttons = sport.scoringConfig.buttons;
  const hasExtraTime = sport.permiteTiempoExtra || (sport.prorrogaLabels && sport.prorrogaLabels.length > 0);
  const etCfg = sport.tiempoExtraConfig || {};

  const _scoreBase = sport.scoreBase || 0;
  _bballState = { scores: {}, activeTab: cols[0], prorrogas: [], sportKey, scoreBase: _scoreBase };
  cols.forEach(c => { _bballState.scores[c] = { 1: _scoreBase, 2: _scoreBase }; });

  let html = `<div class="scoring-grid" id="bballGrid">`;

  /* ── Period tabs ── */
  html += `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center" id="bballTabsRow">`;
  cols.forEach((c, i) => {
    const active = i === 0;
    html += `<button class="bball-tab-btn${active?' active':''}" data-period="${c}" onclick="switchBballTab('${c}')"
      style="padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid ${active?'var(--accent)':'var(--border-dark)'};
      background:${active?'var(--orange-bg)':'var(--surface)'};font:600 12px var(--font);
      color:${active?'var(--accent)':'var(--text-secondary)'};cursor:pointer;transition:all .15s;
      display:flex;align-items:center;gap:6px">
      ${c} <span class="bball-tab-score" style="font-size:10px;color:inherit;opacity:.7">${_scoreBase} – ${_scoreBase}</span>
    </button>`;
  });
  /* Prórroga add button */
  if(hasExtraTime){
    const prorrogaBtnLabel = sport.prorrogaButtonLabel ? sport.prorrogaButtonLabel : (sport.prorrogaLabels ? `+ ${sport.prorrogaLabels[0]}` : '+ Prórroga');
    html += `<button id="bballAddProrrogaBtn" onclick="addBballProrroga()" style="padding:7px 14px;border-radius:var(--radius-full);
      border:1.5px dashed var(--border-dark);background:var(--surface);font:600 12px var(--font);
      color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:4px"
      onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
      onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">
      ${prorrogaBtnLabel}
    </button>`;
  }
  /* Penales button (hidden, shown after maxProrrogas exhausted) */
  if(sport.penalesTrasProrrogas){
    html += `<button id="bballPenalesBtn" onclick="addBballPenales()" style="padding:7px 14px;border-radius:var(--radius-full);
      border:1.5px dashed #dc2626;background:var(--surface);font:600 12px var(--font);
      color:#dc2626;cursor:pointer;transition:all .15s;display:none;align-items:center;gap:4px;animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)"
      onmouseover="this.style.background='#fff0ee';this.style.borderStyle='solid'"
      onmouseout="this.style.background='var(--surface)';this.style.borderStyle='dashed'">
      ⚽ Penales
    </button>`;
  }
  html += `</div>`;

  /* ── Active period panel ── */
  html += `<div id="bballActivePanel" style="padding:20px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">`;
  html += _buildBballPanelContent(cols[0], t1, t2, buttons);
  html += `</div>`;

  /* ── Summary row ── */
  html += `<div id="bballSummary" style="margin-top:12px;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md)">`;
  html += _buildBballSummary(cols, t1, t2);
  html += `</div>`;

  /* Auto-win info */
  if(sport.autoWin){
    html += `<div id="autoWinBanner" style="display:none"></div>`;
  }

  /* Hidden inputs for recalcTotals compatibility */
  html += `<div id="bballHiddenInputs" style="display:none">`;
  cols.forEach((c,i) => {
    html += `<input class="score-input" type="hidden" data-team="1" data-col="${i}" value="${_scoreBase}"/>`;
    html += `<input class="score-input" type="hidden" data-team="2" data-col="${i}" value="${_scoreBase}"/>`;
  });
  html += `</div>`;

  html += `</div>`;
  return html;
}

function _buildBballPanelContent(period, t1, t2, buttons){
  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <span style="font:600 13px var(--font);color:var(--text-primary)" id="bballActiveLabel">${period}</span>
    <span id="bballPeriodStatus" style="padding:4px 12px;border-radius:var(--radius-full);font:600 10px var(--font);letter-spacing:.3px;
      background:var(--blue-bg);border:1px solid #bdd7f7;color:var(--blue-info)">DIGITANDO</span>
  </div>`;

  /* Team 1 scoring row */
  html += _buildBballTeamRow(1, t1, buttons);
  /* Divider */
  html += `<div style="height:1px;background:var(--border);margin:14px 0"></div>`;
  /* Team 2 scoring row */
  html += _buildBballTeamRow(2, t2, buttons);
  return html;
}

function _buildBballTeamRow(teamIdx, teamName, buttons){
  const score = _bballState ? (_bballState.scores[_bballState.activeTab]?.[teamIdx] || 0) : 0;
  let html = `<div class="bball-team-row" data-team="${teamIdx}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font:600 13px var(--font);color:var(--text-primary)">${teamName}</div>
      <input type="number" min="0" class="bball-team-score" id="bballScore_${teamIdx}" value="${score}"
        oninput="onBballScoreInput(${teamIdx},this)" onfocus="this.select()"
        style="font:600 24px var(--font);color:var(--text-primary);width:64px;text-align:center;padding:4px 12px;
        background:var(--surface);border:1.5px solid var(--border-dark);border-radius:var(--radius-md);
        -moz-appearance:textfield;outline:none"/>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">`;
  buttons.forEach(b => {
    html += `<button type="button" class="bball-scoring-btn" onclick="bballAddPoints(${teamIdx},${b.points})" style="
      display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:var(--radius-full);
      border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);
      color:var(--text-primary);cursor:pointer;transition:all .15s;white-space:nowrap;
    " onmouseover="this.style.borderColor='var(--accent)';this.style.background='var(--orange-bg)';this.style.color='var(--accent)'"
       onmouseout="this.style.borderColor='var(--border-dark)';this.style.background='var(--surface)';this.style.color='var(--text-primary)'"
    >${b.emoji} +${b.points} ${b.label}</button>`;
  });
  /* Undo button */
  html += `<button type="button" class="bball-scoring-btn" onclick="bballAddPoints(${teamIdx},-1)" style="
    display:inline-flex;align-items:center;gap:4px;padding:8px 12px;border-radius:var(--radius-full);
    border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);
    color:var(--text-secondary);cursor:pointer;transition:all .15s;
  " onmouseover="this.style.borderColor='#dc2626';this.style.color='#dc2626'"
     onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'"
  >−1</button>`;
  html += `</div></div>`;
  return html;
}

function _buildBballSummary(periods, t1, t2){
  let totalT1 = 0, totalT2 = 0;
  let html = `<div style="display:flex;gap:4px;align-items:center;font:500 11px var(--font);color:var(--text-secondary);flex-wrap:wrap">
    <span style="min-width:80px;font-weight:600">${t1}</span>`;
  periods.forEach(p => {
    const s = _bballState?.scores[p] || {1:0,2:0};
    totalT1 += s[1];
    html += `<span style="padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;min-width:28px;text-align:center">${s[1]}</span>`;
  });
  /* Include prórrogas */
  (_bballState?.prorrogas || []).forEach(p => {
    const s = _bballState?.scores[p] || {1:0,2:0};
    totalT1 += s[1];
    html += `<span style="padding:3px 8px;background:#fff3e6;border:1px solid var(--orange-border);border-radius:4px;min-width:28px;text-align:center;color:var(--accent)">${s[1]}</span>`;
  });
  html += `<span style="font-weight:600;margin-left:4px">= ${totalT1}</span></div>`;

  html += `<div style="display:flex;gap:4px;align-items:center;font:500 11px var(--font);color:var(--text-secondary);margin-top:6px;flex-wrap:wrap">
    <span style="min-width:80px;font-weight:600">${t2}</span>`;
  periods.forEach(p => {
    const s = _bballState?.scores[p] || {1:0,2:0};
    totalT2 += s[2];
    html += `<span style="padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;min-width:28px;text-align:center">${s[2]}</span>`;
  });
  (_bballState?.prorrogas || []).forEach(p => {
    const s = _bballState?.scores[p] || {1:0,2:0};
    totalT2 += s[2];
    html += `<span style="padding:3px 8px;background:#fff3e6;border:1px solid var(--orange-border);border-radius:4px;min-width:28px;text-align:center;color:var(--accent)">${s[2]}</span>`;
  });
  html += `<span style="font-weight:600;margin-left:4px">= ${totalT2}</span></div>`;

  /* Period headers */
  const allPeriods = [...(periods || []), ...(_bballState?.prorrogas || [])];
  let headerHtml = `<div style="display:flex;gap:4px;align-items:center;font:600 9px var(--font);color:var(--text-secondary);letter-spacing:.3px;margin-bottom:6px;flex-wrap:wrap;text-transform:uppercase">
    <span style="min-width:80px"></span>`;
  allPeriods.forEach(p => {
    const isPR = p.startsWith('PR');
    headerHtml += `<span style="min-width:28px;text-align:center;padding:0 8px;${isPR?'color:var(--accent)':''}">${p}</span>`;
  });
  headerHtml += `<span style="margin-left:4px">TOT</span></div>`;

  return headerHtml + html;
}

function switchBballTab(period){
  if(!_bballState) return;
  _bballState.activeTab = period;
  /* Update tab styles */
  document.querySelectorAll('.bball-tab-btn').forEach(btn => {
    const isActive = btn.dataset.period === period;
    btn.classList.toggle('active', isActive);
    btn.style.borderColor = isActive ? 'var(--accent)' : 'var(--border-dark)';
    btn.style.background = isActive ? 'var(--orange-bg)' : 'var(--surface)';
    btn.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
  });
  /* Rebuild panel content */
  const panel = document.getElementById('bballActivePanel');
  if(!panel) return;
  const sport = SPORTS_DB[_bballState.sportKey];
  const match = _modalMatchData;
  panel.innerHTML = _buildBballPanelContent(period, match.teams[0], match.teams[1], sport.scoringConfig.buttons);
}

function bballAddPoints(teamIdx, points){
  if(!_bballState) return;
  const period = _bballState.activeTab;
  const current = _bballState.scores[period][teamIdx] || 0;
  const newVal = Math.max(0, current + points);
  _bballState.scores[period][teamIdx] = newVal;

  /* Update score display in panel */
  const scoreEl = document.getElementById('bballScore_' + teamIdx);
  if(scoreEl){
    scoreEl.value = newVal;
    scoreEl.style.transition = 'background .15s, box-shadow .15s';
    scoreEl.style.background = '#fff3e6';
    scoreEl.style.boxShadow = '0 0 0 3px rgba(255,117,0,.2)';
    setTimeout(() => {
      scoreEl.style.background = 'var(--surface)';
      scoreEl.style.boxShadow = 'none';
    }, 300);
  }

  /* Update tab badge */
  const tabBtn = document.querySelector(`.bball-tab-btn[data-period="${period}"]`);
  if(tabBtn){
    const badge = tabBtn.querySelector('.bball-tab-score');
    if(badge) badge.textContent = `${_bballState.scores[period][1]} – ${_bballState.scores[period][2]}`;
  }

  /* Sync hidden inputs & recalc totals */
  _syncBballHiddenInputs();
  /* Update summary */
  const summary = document.getElementById('bballSummary');
  if(summary){
    const sport = SPORTS_DB[_bballState.sportKey];
    const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];
    const match = _modalMatchData;
    summary.innerHTML = _buildBballSummary(cols, match.teams[0], match.teams[1]);
  }
  recalcTotals(true);
}

function onBballScoreInput(teamIdx, el){
  if(!_bballState) return;
  const period = _bballState.activeTab;
  const val = Math.max(0, parseInt(el.value) || 0);
  _bballState.scores[period][teamIdx] = val;

  /* Update tab badge */
  const tabBtn = document.querySelector(`.bball-tab-btn[data-period="${period}"]`);
  if(tabBtn){
    const badge = tabBtn.querySelector('.bball-tab-score');
    if(badge) badge.textContent = `${_bballState.scores[period][1]} – ${_bballState.scores[period][2]}`;
  }

  _syncBballHiddenInputs();
  const summary = document.getElementById('bballSummary');
  if(summary){
    const sport = SPORTS_DB[_bballState.sportKey];
    const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];
    const match = _modalMatchData;
    summary.innerHTML = _buildBballSummary(cols, match.teams[0], match.teams[1]);
  }
  recalcTotals(true);
}

function _syncBballHiddenInputs(){
  if(!_bballState) return;
  const sport = SPORTS_DB[_bballState.sportKey];
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];

  /* Rebuild hidden inputs to include prórrogas */
  const container = document.getElementById('bballHiddenInputs');
  if(!container) return;
  let html = '';
  cols.forEach((c,i) => {
    html += `<input class="score-input" type="hidden" data-team="1" data-col="${i}" value="${_bballState.scores[c]?.[1]||0}"/>`;
    html += `<input class="score-input" type="hidden" data-team="2" data-col="${i}" value="${_bballState.scores[c]?.[2]||0}"/>`;
  });
  _bballState.prorrogas.forEach((p,i) => {
    const isPenales = p.toLowerCase() === 'penales';
    const extraAttr = isPenales ? 'data-penales="1"' : '';
    html += `<input class="score-input" type="hidden" data-team="1" data-extra-time="pr${i}" ${extraAttr} value="${_bballState.scores[p]?.[1]||0}"/>`;
    html += `<input class="score-input" type="hidden" data-team="2" data-extra-time="pr${i}" ${extraAttr} value="${_bballState.scores[p]?.[2]||0}"/>`;
  });
  container.innerHTML = html;
}

function addBballProrroga(){
  if(!_bballState) return;
  const sport = SPORTS_DB[_bballState.sportKey];
  const num = _bballState.prorrogas.length + 1;

  /* Check max prórrogas limit */
  if(sport.maxProrrogas && _bballState.prorrogas.length >= sport.maxProrrogas){
    return;
  }

  /* Custom labels (e.g. balonmano playa: Shoot-out, Punto de Oro) or prefix (e.g. béisbol: E1, E2) */
  let name;
  if(sport.prorrogaLabels && sport.prorrogaLabels[num - 1]){
    name = sport.prorrogaLabels[num - 1];
  } else if(sport.prorrogaPrefix){
    name = `${sport.prorrogaPrefix}${num}`;
  } else {
    name = `PR${num}`;
  }
  const _pBase = _bballState.scoreBase || 0;
  _bballState.prorrogas.push(name);
  _bballState.scores[name] = { 1: _pBase, 2: _pBase };

  /* Add tab button before the "+" button */
  const addBtn = document.getElementById('bballAddProrrogaBtn');
  const tab = document.createElement('button');
  tab.className = 'bball-tab-btn';
  tab.dataset.period = name;
  tab.setAttribute('onclick', `switchBballTab('${name}')`);
  tab.style.cssText = 'padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 12px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)';
  const prrEmoji = sport.prorrogaPrefix ? '' : '🔄 ';
  tab.innerHTML = `${prrEmoji}${name} <span class="bball-tab-score" style="font-size:10px;color:inherit;opacity:.7">0 – 0</span>`;
  addBtn.parentElement.insertBefore(tab, addBtn);

  /* Update "+" button label for next prórroga if custom labels exist */
  if(sport.prorrogaLabels && sport.prorrogaLabels[_bballState.prorrogas.length]){
    addBtn.textContent = `+ ${sport.prorrogaLabels[_bballState.prorrogas.length]}`;
  }
  /* Hide "+" button if max reached */
  if(sport.maxProrrogas && _bballState.prorrogas.length >= sport.maxProrrogas){
    addBtn.style.display = 'none';
    /* Show Penales button if sport supports it */
    if(sport.penalesTrasProrrogas){
      const penBtn = document.getElementById('bballPenalesBtn');
      if(penBtn) penBtn.style.display = 'inline-flex';
    }
  }
  /* Also hide if prorrogaLabels exhausted */
  if(sport.prorrogaLabels && _bballState.prorrogas.length >= sport.prorrogaLabels.length){
    addBtn.style.display = 'none';
  }

  /* Switch to the new prorroga */
  switchBballTab(name);

  /* Sync inputs and update summary */
  _syncBballHiddenInputs();
  const summary = document.getElementById('bballSummary');
  if(summary){
    const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];
    const match = _modalMatchData;
    summary.innerHTML = _buildBballSummary(cols, match.teams[0], match.teams[1]);
  }
}

function addBballPenales(){
  if(!_bballState) return;
  const sport = SPORTS_DB[_bballState.sportKey];
  const name = 'Penales';

  /* Prevent duplicates */
  if(_bballState.prorrogas.includes(name)) return;

  _bballState.prorrogas.push(name);
  _bballState.scores[name] = { 1: 0, 2: 0 };

  /* Hide Penales button */
  const penBtn = document.getElementById('bballPenalesBtn');
  if(penBtn) penBtn.style.display = 'none';

  /* Add tab button */
  const tabsRow = document.getElementById('bballTabsRow');
  const tab = document.createElement('button');
  tab.className = 'bball-tab-btn';
  tab.dataset.period = name;
  tab.setAttribute('onclick', `switchBballTab('${name}')`);
  tab.style.cssText = 'padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid #dc2626;background:#fff0ee;font:600 12px var(--font);color:#dc2626;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)';
  tab.innerHTML = `⚽ ${name} <span class="bball-tab-score" style="font-size:10px;color:inherit;opacity:.7">0 – 0</span>`;
  tabsRow.appendChild(tab);

  /* Switch to Penales tab */
  switchBballTab(name);

  /* Sync inputs and update summary */
  _syncBballHiddenInputs();
  const summary = document.getElementById('bballSummary');
  if(summary){
    const cols = sport.parciales && sport.parciales.length ? sport.parciales : ['P1'];
    const match = _modalMatchData;
    summary.innerHTML = _buildBballSummary(cols, match.teams[0], match.teams[1]);
  }
}

/* ═══ SCORING ACTION BUTTONS (Focus-based) ═══ */
let _activeScoreInput = null;

function setActiveScoreInput(el){
  /* Remove active highlight from all inputs */
  document.querySelectorAll('.score-input.input-active, .direct-score-input.input-active').forEach(inp => inp.classList.remove('input-active'));
  /* Set new active */
  _activeScoreInput = el;
  el.classList.add('input-active');
  /* Update indicator */
  const team = el.dataset.team;
  const col = el.dataset.col;
  const indicator = document.getElementById('scoringFocusIndicator');
  if(indicator){
    const teamName = team === '1' ? (document.querySelector('.score-header .team-name')?.textContent || 'Equipo 1')
                                  : (document.querySelectorAll('.score-header .team-name')[1]?.textContent || 'Equipo 2');
    const colHeaders = document.querySelectorAll('.scoring-table thead th');
    const colName = colHeaders && colHeaders[parseInt(col)+1] ? colHeaders[parseInt(col)+1].textContent : '';
    indicator.innerHTML = `<span style="font-weight:600;color:var(--accent)">${teamName}</span>${colName ? ' · '+colName : ''}`;
    indicator.style.opacity = '1';
  }
}

function buildScoringButtons(sport, match){
  const cfg = sport.scoringConfig;
  if(!cfg || !cfg.buttons || cfg.buttons.length === 0) return '';
  return `<div class="scoring-actions" style="margin:16px 0;padding:14px 16px;background:#fafbfd;border-radius:var(--radius-lg);border:1px solid var(--border)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;text-transform:uppercase">⚡ Puntuación rápida</div>
      <div id="scoringFocusIndicator" style="font-size:12px;color:var(--text-secondary);opacity:0;transition:opacity .2s">Selecciona un campo</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      ${cfg.buttons.map(b => `<button type="button" class="scoring-action-btn" onclick="addScoringPoints(${b.points})" style="
        display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:var(--radius-full);
        border:1.5px solid var(--border-dark);background:var(--surface);font:600 13px var(--font);
        color:var(--text-primary);cursor:pointer;transition:all .15s;white-space:nowrap;
      " onmouseover="this.style.borderColor='var(--accent)';this.style.background='var(--orange-bg)';this.style.color='var(--accent)'"
         onmouseout="this.style.borderColor='var(--border-dark)';this.style.background='var(--surface)';this.style.color='var(--text-primary)'"
      >${b.emoji} +${b.points} ${b.label}</button>`).join('')}
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);text-align:center">Haz clic en el campo del equipo y período, luego usa los botones para sumar puntos</div>
  </div>`;
}

/* Add points to the currently focused input */
function addScoringPoints(points){
  if(!_activeScoreInput){
    /* No input focused: flash the scoring hint */
    const indicator = document.getElementById('scoringFocusIndicator');
    if(indicator){
      indicator.innerHTML = '<span style="color:var(--accent)">⚠ Selecciona un campo primero</span>';
      indicator.style.opacity = '1';
      setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
    }
    return;
  }
  const current = parseInt(_activeScoreInput.value) || 0;
  _activeScoreInput.value = current + points;
  _activeScoreInput.classList.add('has-value');
  /* Flash animation */
  _activeScoreInput.style.transition = 'background .15s, box-shadow .15s';
  _activeScoreInput.style.background = '#fff3e6';
  _activeScoreInput.style.boxShadow = '0 0 0 3px rgba(255,117,0,.2)';
  setTimeout(() => {
    if(_activeScoreInput){
      _activeScoreInput.style.background = '';
      _activeScoreInput.style.boxShadow = '';
    }
  }, 350);
  /* Trigger input event for recalculation */
  _activeScoreInput.dispatchEvent(new Event('input', {bubbles: true}));
  /* Keep focus on the input */
  _activeScoreInput.focus();
}

/* ═══ ACUMULATIVA POR INNINGS ═══ */
let _inningsState = { extraCount: 0 };

function buildInningsGrid(sport, match){
  if(!match.teams || match.teams.length < 2) match = {...match, teams: [match.teams?.[0]||'Equipo 1', match.teams?.[1]||'Equipo 2']};
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : null;
  if(!cols) return buildTimesGrid(sport, match);
  const extras = sport.columnasExtra || [];
  const t1 = match.teams[0], t2 = match.teams[1];
  _inningsState = { extraCount: 0 };

  const inputStyle = `width:44px;height:38px;text-align:center;border:1.5px solid var(--border-dark);border-radius:var(--radius-md);
    font:600 15px var(--font);color:var(--text-primary);background:var(--surface);outline:none;-moz-appearance:textfield;
    -webkit-appearance:none;appearance:none`;
  const extraColStyle = `width:44px;height:38px;text-align:center;border:1.5px solid var(--border-dark);border-radius:var(--radius-md);
    font:600 15px var(--font);color:var(--accent);background:#fef8f4;outline:none;-moz-appearance:textfield;
    -webkit-appearance:none;appearance:none`;
  const thStyle = `font:600 11px var(--font);color:var(--text-secondary);padding:6px 4px;text-align:center;letter-spacing:.3px`;
  const tdStyle = `padding:4px 3px;text-align:center`;
  const teamTdStyle = `font:600 12px var(--font);color:var(--text-primary);padding:8px 8px 8px 0;white-space:nowrap;text-align:left;max-width:90px;overflow:hidden;text-overflow:ellipsis`;
  const totThStyle = `font:600 11px var(--font);color:var(--accent);padding:6px 4px;text-align:center;background:var(--orange-bg);border-radius:var(--radius-sm)`;

  let html = `<div class="scoring-grid" id="inningsGridWrap" style="overflow-x:auto;padding-bottom:4px">
    <table id="inningsTable" style="border-collapse:separate;border-spacing:3px 6px;width:100%">
      <thead><tr>
        <th style="${thStyle};text-align:left;min-width:80px"></th>
        ${cols.map(c => `<th style="${thStyle}" class="inn-col-header">${c}</th>`).join('')}
        <th style="${totThStyle}" id="innTotHeader">R</th>
        ${extras.map(e => `<th style="${thStyle};color:var(--blue-info)" class="inn-extra-header">${e}</th>`).join('')}
        <th style="${thStyle};color:var(--text-secondary)" class="inn-err-header">E</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="${teamTdStyle}">${t1}</td>
          ${cols.map((_,i) => `<td style="${tdStyle}"><input class="score-input inn-input" type="number" min="0" value="0" data-team="1" data-col="${i}" oninput="recalcInnings(true)" onfocus="this.select()" style="${inputStyle}"/></td>`).join('')}
          <td style="${tdStyle}"><div id="innTotal1" style="font:600 16px var(--font);color:var(--accent);min-width:36px">0</div></td>
          ${extras.map((e,i) => `<td style="${tdStyle}"><input class="score-input inn-input inn-extra-input" type="number" min="0" value="0" data-team="1" data-extra="${i}" oninput="recalcInnings(true)" onfocus="this.select()" style="${extraColStyle}"/></td>`).join('')}
          <td style="${tdStyle}"><input class="inn-input" type="number" min="0" value="0" id="inningsErrInp1" oninput="syncInningsErr(1)" onfocus="this.select()" style="${inputStyle};color:#dc2626;border-color:#ffc4bb;background:var(--red-bg)"/></td>
        </tr>
        <tr>
          <td style="${teamTdStyle}">${t2}</td>
          ${cols.map((_,i) => `<td style="${tdStyle}"><input class="score-input inn-input" type="number" min="0" value="0" data-team="2" data-col="${i}" oninput="recalcInnings(true)" onfocus="this.select()" style="${inputStyle}"/></td>`).join('')}
          <td style="${tdStyle}"><div id="innTotal2" style="font:600 16px var(--font);color:var(--accent);min-width:36px">0</div></td>
          ${extras.map((e,i) => `<td style="${tdStyle}"><input class="score-input inn-input inn-extra-input" type="number" min="0" value="0" data-team="2" data-extra="${i}" oninput="recalcInnings(true)" onfocus="this.select()" style="${extraColStyle}"/></td>`).join('')}
          <td style="${tdStyle}"><input class="inn-input" type="number" min="0" value="0" id="inningsErrInp2" oninput="syncInningsErr(2)" onfocus="this.select()" style="${inputStyle};color:#dc2626;border-color:#ffc4bb;background:var(--red-bg)"/></td>
        </tr>
      </tbody>
    </table>
  </div>`;

  /* + Extra Inning button */
  if(sport.permiteTiempoExtra){
    html += `<div style="display:flex;justify-content:center;margin:8px 0 16px">
      <button type="button" id="addExtraInningBtn" onclick="addExtraInning()" style="padding:8px 18px;border-radius:var(--radius-full);
        border:1.5px dashed var(--border-dark);background:var(--surface);font:600 12px var(--font);
        color:var(--text-secondary);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px"
        onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
        onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">
        + Extra Inning
      </button>
    </div>`;
  }

  return html;
}

/* Add extra inning column dynamically */
function addExtraInning(){
  _inningsState.extraCount++;
  const num = _inningsState.extraCount;
  const table = document.getElementById('inningsTable');
  if(!table) return;

  const inputStyle = `width:44px;height:38px;text-align:center;border:1.5px solid #b7dfb9;border-radius:var(--radius-md);
    font:600 15px var(--font);color:#1f8923;background:var(--green-bg);outline:none;-moz-appearance:textfield;
    -webkit-appearance:none;appearance:none`;

  /* Get the regular innings count to determine the new col index */
  const existingCols = table.querySelectorAll('thead .inn-col-header').length;
  const newColIdx = existingCols + num - 1;
  const label = `E${num}`;

  /* Insert header before the R (total) column */
  const headerRow = table.querySelector('thead tr');
  const totHeader = document.getElementById('innTotHeader');
  const th = document.createElement('th');
  th.style.cssText = 'font:600 11px var(--font);color:#1f8923;padding:6px 4px;text-align:center;letter-spacing:.3px;background:var(--green-bg);border-radius:var(--radius-sm)';
  th.className = 'inn-col-header inn-extra-inning-header';
  th.textContent = label;
  th.style.animation = 'fadeInUp .3s cubic-bezier(.4,0,.2,1)';
  headerRow.insertBefore(th, totHeader);

  /* Insert cells for each team row */
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row, rIdx) => {
    const teamIdx = rIdx + 1;
    const totCell = row.querySelector(`#innTotal${teamIdx}`)?.parentElement;
    const td = document.createElement('td');
    td.style.cssText = 'padding:4px 3px;text-align:center';
    td.style.animation = 'fadeInUp .3s cubic-bezier(.4,0,.2,1)';
    td.innerHTML = `<input class="score-input inn-input inn-extra-inning-input" type="number" min="0" value="0" data-team="${teamIdx}" data-col="${newColIdx}" oninput="recalcInnings(true)" onfocus="this.select()" style="${inputStyle}"/>`;
    row.insertBefore(td, totCell);
  });

  /* Scroll table to show new column */
  const wrap = document.getElementById('inningsGridWrap');
  if(wrap) setTimeout(() => wrap.scrollLeft = wrap.scrollWidth, 50);

  recalcInnings(true);
}

/* Innings helpers */
function recalcInnings(fromPeriod){
  if(fromPeriod) _directScoreOverride = false;
  let c1=0, c2=0;
  document.querySelectorAll('.score-input[data-team="1"][data-col]').forEach(inp => { c1 += parseInt(inp.value)||0; });
  document.querySelectorAll('.score-input[data-team="2"][data-col]').forEach(inp => { c2 += parseInt(inp.value)||0; });
  /* Update totals in table */
  const t1El = document.getElementById('innTotal1');
  const t2El = document.getElementById('innTotal2');
  if(t1El) t1El.textContent = c1;
  if(t2El) t2El.textContent = c2;
  /* Update VS header */
  const s1El = document.getElementById('totalScore1');
  const s2El = document.getElementById('totalScore2');
  if(!_directScoreOverride){
    if(s1El) s1El.value = c1;
    if(s2El) s2El.value = c2;
  }
}
function stepInningsErr(team, delta){
  const inp = document.getElementById('inningsErrInp'+team);
  let val = Math.max(0, (parseInt(inp.value)||0) + delta);
  inp.value = val;
}
function syncInningsErr(team){
  const inp = document.getElementById('inningsErrInp'+team);
  let val = Math.max(0, parseInt(inp.value)||0);
  inp.value = val;
}

/* ═══ POR SETS ═══ */
function buildSetsGrid(sport, match){
  if(!match.teams || match.teams.length < 2) match = {...match, teams: [match.teams?.[0]||'Equipo 1', match.teams?.[1]||'Equipo 2']};
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : null;
  if(!cols) return buildTimesGrid(sport, match);

  /* Tennis/Padel scoring: point-by-point within games within sets */
  if(sport.scoringConfig && sport.scoringConfig.type === 'tennis'){
    return buildTennisGrid(sport, match, cols);
  }

  /* Counter-based scoring for sports with puntosSet (badminton, volleyball, etc.) */
  if(sport.puntosSet){
    return buildSetsCounterGrid(sport, match, cols);
  }

  /* Detect if rounds-based (R1,R2...) → sum points; sets-based (Set 1,Set 2...) → count sets won */
  const isRoundBased = cols.some(c => /^R\d|^Round/i.test(c));
  const recalcFn = isRoundBased ? 'recalcTotals' : 'recalcSets';
  let infoText = '';
  if(isRoundBased){
    infoText = sport.tiempoParcial ? `Tiempo por round: ${sport.tiempoParcial}` : '';
  } else {
    const parts = [];
    if(sport.setsParaGanar) parts.push(`${sport.setsParaGanar} sets para ganar`);
    infoText = parts.join(' · ');
  }
  return `<div class="scoring-grid">
    <table class="scoring-table">
      <thead><tr>
        <th>JUGADOR/EQUIPO</th>
        ${cols.map(c => `<th>${c}</th>`).join('')}
      </tr></thead>
      <tbody>
        <tr>
          <td>${match.teams[0]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="1" data-col="${i}" oninput="${recalcFn}()" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
        <tr>
          <td>${match.teams[1]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="2" data-col="${i}" oninput="${recalcFn}()" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
      </tbody>
    </table>
    ${infoText ? `<div style="font-size:11px;color:var(--text-secondary)">${infoText}</div>` : ''}
  </div>`;
}

/* ═══ TENNIS/PADEL GRID — point-by-point within games within sets ═══ */
let _tennisState = null;
let _tennisSport = null;

function buildTennisGrid(sport, match, cols){
  _tennisSport = sport;
  const cfg = sport.scoringConfig;
  const numSets = cols.length;
  const setsWin = sport.setsParaGanar || 2;
  const t1 = match.teams[0], t2 = match.teams[1];

  _tennisState = {
    activeSet: 0,
    sets: Array.from({length:numSets}, () => ({
      games:{1:0,2:0},
      currentGame:{points:{1:0,2:0},tiebreak:false},
      winner:0
    })),
    setsWon:{1:0,2:0},
    matchWinner:0
  };

  let html = `<div class="scoring-grid" id="tennisGrid">`;

  /* ── Set tabs ── */
  html += `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap" id="tennisSetTabs">`;
  cols.forEach((c,i) => {
    const active = i===0;
    html += `<button class="tennis-set-tab" data-set="${i}" onclick="tennisSwitchSet(${i})"
      style="padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid ${active?'var(--accent)':'var(--border-dark)'};
      background:${active?'var(--orange-bg)':'var(--surface)'};font:600 12px var(--font);
      color:${active?'var(--accent)':'var(--text-secondary)'};cursor:pointer;transition:all .15s;
      display:flex;align-items:center;gap:6px">
      ${c} <span class="tennis-tab-score" style="font-size:10px;color:var(--text-secondary)">0 – 0</span>
    </button>`;
  });
  html += `</div>`;

  /* ── Active set panel ── */
  html += `<div id="tennisActivePanel" style="padding:20px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">`;

  /* Set label + status */
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <span style="font:600 13px var(--font);color:var(--text-primary)" id="tennisSetLabel">${cols[0]}</span>
    <span id="tennisSetBadge" style="padding:4px 12px;border-radius:var(--radius-full);font:600 10px var(--font);letter-spacing:.3px;
      background:var(--blue-bg);border:1px solid #bdd7f7;color:var(--blue-info)">EN JUEGO</span>
  </div>`;

  /* Games display — −/input/+ counter (same pattern as sets counter grid) */
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:18px">
    <div style="text-align:center;flex:1">
      <div style="font:500 11px var(--font);color:var(--text-secondary);margin-bottom:8px">${t1}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:0">
        <button onclick="tennisGameChange(1,-1)" style="width:40px;height:48px;border-radius:var(--radius-md) 0 0 var(--radius-md);border:1.5px solid var(--border-dark);border-right:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">−</button>
        <input id="tennisGames1" type="number" min="0" max="7" value="0" oninput="tennisDirectGameInput(1,this)" onfocus="this.select()" style="width:56px;height:48px;text-align:center;border:1.5px solid var(--border-dark);font:600 22px var(--font);color:var(--text-primary);background:var(--surface);-moz-appearance:textfield;-webkit-appearance:none;appearance:textfield;outline:none"/>
        <button onclick="tennisGameChange(1,1)" style="width:40px;height:48px;border-radius:0 var(--radius-md) var(--radius-md) 0;border:1.5px solid var(--border-dark);border-left:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">+</button>
      </div>
      <div style="font:500 9px var(--font);color:var(--text-secondary);margin-top:4px">JUEGOS</div>
    </div>
    <div style="font:600 12px var(--font);color:var(--text-secondary);padding-top:20px">VS</div>
    <div style="text-align:center;flex:1">
      <div style="font:500 11px var(--font);color:var(--text-secondary);margin-bottom:8px">${t2}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:0">
        <button onclick="tennisGameChange(2,-1)" style="width:40px;height:48px;border-radius:var(--radius-md) 0 0 var(--radius-md);border:1.5px solid var(--border-dark);border-right:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">−</button>
        <input id="tennisGames2" type="number" min="0" max="7" value="0" oninput="tennisDirectGameInput(2,this)" onfocus="this.select()" style="width:56px;height:48px;text-align:center;border:1.5px solid var(--border-dark);font:600 22px var(--font);color:var(--text-primary);background:var(--surface);-moz-appearance:textfield;-webkit-appearance:none;appearance:textfield;outline:none"/>
        <button onclick="tennisGameChange(2,1)" style="width:40px;height:48px;border-radius:0 var(--radius-md) var(--radius-md) 0;border:1.5px solid var(--border-dark);border-left:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">+</button>
      </div>
      <div style="font:500 9px var(--font);color:var(--text-secondary);margin-top:4px">JUEGOS</div>
    </div>
  </div>`;

  /* Separator */
  html += `<div style="border-top:1px solid var(--border);margin:0 -20px 16px;padding:0"></div>`;

  /* Current game section */
  html += `<div id="tennisCurrentGameSection">
    <div style="text-align:center;font:600 10px var(--font);color:var(--text-secondary);letter-spacing:.5px;margin-bottom:12px" id="tennisGameLabel">JUEGO ACTUAL</div>`;

  /* Game indicator (Deuce, Tiebreak, Punto de Oro) */
  html += `<div id="tennisGameIndicator" style="display:none;text-align:center;padding:6px 14px;border-radius:var(--radius-md);margin-bottom:12px;font:600 11px var(--font);letter-spacing:.3px"></div>`;

  /* Point display + buttons */
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:14px">`;

  /* Team 1 point */
  html += `<div style="text-align:center;flex:1">
    <div style="font:500 11px var(--font);color:var(--text-secondary);margin-bottom:6px">${t1}</div>
    <div id="tennisPoint1" style="font:600 32px var(--font);color:var(--text-primary);margin-bottom:8px">0</div>
    <button onclick="tennisAddPoint(1)" id="tennisBtnPunto1" style="
      padding:9px 20px;border-radius:var(--radius-md);border:1.5px solid var(--accent);
      background:var(--surface);font:600 12px var(--font);color:var(--accent);cursor:pointer;
      transition:all .12s;width:100%"
      onmouseover="this.style.background='var(--orange-bg)'"
      onmouseout="this.style.background='var(--surface)'"
      onmousedown="this.style.transform='scale(.97)'"
      onmouseup="this.style.transform='scale(1)'">+ Punto</button>
  </div>`;

  /* VS */
  html += `<div style="font:600 12px var(--font);color:var(--text-secondary);padding-bottom:30px">VS</div>`;

  /* Team 2 point */
  html += `<div style="text-align:center;flex:1">
    <div style="font:500 11px var(--font);color:var(--text-secondary);margin-bottom:6px">${t2}</div>
    <div id="tennisPoint2" style="font:600 32px var(--font);color:var(--text-primary);margin-bottom:8px">0</div>
    <button onclick="tennisAddPoint(2)" id="tennisBtnPunto2" style="
      padding:9px 20px;border-radius:var(--radius-md);border:1.5px solid var(--accent);
      background:var(--surface);font:600 12px var(--font);color:var(--accent);cursor:pointer;
      transition:all .12s;width:100%"
      onmouseover="this.style.background='var(--orange-bg)'"
      onmouseout="this.style.background='var(--surface)'"
      onmousedown="this.style.transform='scale(.97)'"
      onmouseup="this.style.transform='scale(1)'">+ Punto</button>
  </div>`;

  html += `</div>`; /* end point display */
  html += `</div>`; /* end currentGameSection */

  /* Rules */
  const rulesText = `${cfg.gamesPerSet} juegos para ganar set · dif. mín. ${cfg.difMinGames} · Tiebreak a ${cfg.tiebreakAt}-${cfg.tiebreakAt}` + (cfg.puntoDeOro ? ' · Punto de Oro en Deuce' : '');
  html += `<div id="tennisRules" style="text-align:center;font:500 11px var(--font);color:var(--text-secondary);margin-top:4px">${rulesText}</div>`;

  html += `</div>`; /* end tennisActivePanel */

  /* Sets summary row */
  html += `<div id="tennisSummaryRow" style="display:flex;gap:8px;margin-top:14px;justify-content:center;flex-wrap:wrap"></div>`;

  /* Match result */
  html += `<div id="tennisMatchResult" style="display:none;text-align:center;margin-top:12px;padding:12px 16px;border-radius:var(--radius-lg);font:600 13px var(--font)"></div>`;

  html += `</div>`; /* end tennisGrid */
  return html;
}

/* ── Tennis point label ── */
function _tennisPointLabel(teamIdx){
  const st = _tennisState;
  const set = st.sets[st.activeSet];
  const game = set.currentGame;
  const pts = game.points;
  if(game.tiebreak) return pts[teamIdx].toString();
  const seq = _tennisSport.scoringConfig.pointSequence;
  const me = pts[teamIdx], opp = pts[teamIdx===1?2:1];
  if(me <= 3 && (opp <= 2 || me <= 2)) return seq[me].toString();
  /* Deuce zone: both >= 3 */
  if(me === opp) return '40';
  if(me > opp) return 'AD';
  return '40';
}

/* ── Add a point ── */
function tennisAddPoint(team){
  const st = _tennisState;
  if(st.matchWinner) return;
  const set = st.sets[st.activeSet];
  if(set.winner) return;
  const game = set.currentGame;
  const opp = team===1?2:1;
  const cfg = _tennisSport.scoringConfig;

  if(game.tiebreak){
    game.points[team]++;
    if(game.points[team] >= cfg.tiebreakPoints && game.points[team] - game.points[opp] >= cfg.tiebreakDif){
      _tennisWinGame(team);
    }
  } else {
    game.points[team]++;
    const me = game.points[team], op = game.points[opp];
    if(me >= 4 && op <= 2){
      /* Clear win: e.g. 40-0, 40-15, 40-30 */
      _tennisWinGame(team);
    } else if(me >= 3 && op >= 3){
      /* Deuce zone */
      if(cfg.puntoDeOro){
        if(me > op) _tennisWinGame(team);
      } else {
        if(me - op >= 2) _tennisWinGame(team);
      }
    }
  }
  _updateTennisUI();
}

/* ── Game won ── */
function _tennisWinGame(team){
  const st = _tennisState;
  const set = st.sets[st.activeSet];
  const cfg = _tennisSport.scoringConfig;
  set.games[team]++;
  set.currentGame = {points:{1:0,2:0},tiebreak:false};
  const g1 = set.games[1], g2 = set.games[2];
  /* Tiebreak result (7-6): whoever has more games wins the set */
  if(g1 > cfg.tiebreakAt || g2 > cfg.tiebreakAt){
    if(g1 > g2){ _tennisWinSet(1); return; }
    if(g2 > g1){ _tennisWinSet(2); return; }
  }
  /* Normal set win: gamesPerSet with difMinGames difference */
  if(g1 >= cfg.gamesPerSet && g1 - g2 >= cfg.difMinGames){ _tennisWinSet(1); return; }
  if(g2 >= cfg.gamesPerSet && g2 - g1 >= cfg.difMinGames){ _tennisWinSet(2); return; }
  /* Check tiebreak entry */
  if(g1 === cfg.tiebreakAt && g2 === cfg.tiebreakAt){
    set.currentGame.tiebreak = true;
  }
}

/* ── Set won ── */
function _tennisWinSet(team){
  const st = _tennisState;
  const set = st.sets[st.activeSet];
  set.winner = team;
  st.setsWon[team]++;
  const setsWin = _tennisSport.setsParaGanar || 2;
  if(st.setsWon[team] >= setsWin){
    st.matchWinner = team;
  } else {
    /* Auto-advance to next unplayed set */
    for(let i = 0; i < st.sets.length; i++){
      if(!st.sets[i].winner){ st.activeSet = i; break; }
    }
  }
  _updateTennisUI();
}

/* ── Switch set tab ── */
function tennisSwitchSet(idx){
  _tennisState.activeSet = idx;
  _updateTennisUI();
}

/* ── Add game directly (for Game Penalty) ── */
function tennisAddGame(team){
  const st = _tennisState;
  if(st.matchWinner) return;
  const set = st.sets[st.activeSet];
  if(set.winner) return;
  const cfg = _tennisSport.scoringConfig;
  /* Reset current game since a full game is awarded */
  set.currentGame = {points:{1:0,2:0},tiebreak:false};
  set.games[team]++;
  const g1 = set.games[1], g2 = set.games[2];
  /* Tiebreak result */
  if(g1 > cfg.tiebreakAt || g2 > cfg.tiebreakAt){
    if(g1 > g2){ _tennisWinSet(1); return; }
    if(g2 > g1){ _tennisWinSet(2); return; }
  }
  if(g1 >= cfg.gamesPerSet && g1 - g2 >= cfg.difMinGames){ _tennisWinSet(1); return; }
  if(g2 >= cfg.gamesPerSet && g2 - g1 >= cfg.difMinGames){ _tennisWinSet(2); return; }
  if(g1 === cfg.tiebreakAt && g2 === cfg.tiebreakAt) set.currentGame.tiebreak = true;
  _updateTennisUI();
}

/* ── Undo game (for undo Game Penalty) ── */
function tennisUndoGame(team){
  const st = _tennisState;
  const set = st.sets[st.activeSet];
  if(set.games[team] <= 0) return;
  const cfg = _tennisSport.scoringConfig;
  /* If set was won, undo it */
  if(set.winner){
    st.setsWon[set.winner]--;
    if(st.matchWinner) st.matchWinner = 0;
    set.winner = 0;
  }
  set.games[team]--;
  /* Check if we need to exit/enter tiebreak */
  const g1 = set.games[1], g2 = set.games[2];
  set.currentGame.tiebreak = (g1 === cfg.tiebreakAt && g2 === cfg.tiebreakAt);
  set.currentGame.points = {1:0,2:0};
  _updateTennisUI();
}

/* ── Game change via −/+ buttons (for quick registration) ── */
function tennisGameChange(team, delta){
  const el = document.getElementById('tennisGames' + team);
  if(!el) return;
  let val = (parseInt(el.value) || 0) + delta;
  const cfg = _tennisSport.scoringConfig;
  val = Math.max(0, Math.min(val, cfg.tiebreakAt + 1));
  el.value = val;
  tennisDirectGameInput(team, el);
}

/* ── Direct game input (for post-match registration from scoresheet) ── */
/* Does NOT auto-advance to next set — digitador clicks set tabs manually */
function tennisDirectGameInput(team, el){
  const st = _tennisState;
  const set = st.sets[st.activeSet];
  const cfg = _tennisSport.scoringConfig;
  let val = parseInt(el.value) || 0;
  if(val < 0) val = 0;
  if(val > cfg.tiebreakAt + 1) val = cfg.tiebreakAt + 1; /* max 7 */
  el.value = val;

  /* If set was previously won, undo it */
  if(set.winner){
    st.setsWon[set.winner]--;
    if(st.matchWinner) st.matchWinner = 0;
    set.winner = 0;
  }

  set.games[team] = val;
  set.currentGame = {points:{1:0,2:0}, tiebreak: false};

  const g1 = set.games[1], g2 = set.games[2];
  /* Check tiebreak entry */
  if(g1 === cfg.tiebreakAt && g2 === cfg.tiebreakAt) set.currentGame.tiebreak = true;

  /* Check set win (NO auto-advance — user clicks next set tab) */
  let winner = 0;
  if(g1 > cfg.tiebreakAt || g2 > cfg.tiebreakAt){
    if(g1 > g2) winner = 1;
    else if(g2 > g1) winner = 2;
  }
  if(!winner && g1 >= cfg.gamesPerSet && g1 - g2 >= cfg.difMinGames) winner = 1;
  if(!winner && g2 >= cfg.gamesPerSet && g2 - g1 >= cfg.difMinGames) winner = 2;

  if(winner){
    set.winner = winner;
    st.setsWon[winner]++;
    const setsWin = _tennisSport.setsParaGanar || 2;
    if(st.setsWon[winner] >= setsWin) st.matchWinner = winner;
  }

  _updateTennisUI();
}

/* ── Full UI refresh ── */
function _updateTennisUI(){
  const st = _tennisState;
  const sport = _tennisSport;
  const cfg = sport.scoringConfig;
  const cols = sport.parciales;
  const set = st.sets[st.activeSet];

  /* Update tab styles + scores */
  document.querySelectorAll('.tennis-set-tab').forEach((btn,i) => {
    const active = i === st.activeSet;
    btn.style.border = `1.5px solid ${active?'var(--accent)':'var(--border-dark)'}`;
    btn.style.background = active?'var(--orange-bg)':'var(--surface)';
    btn.style.color = active?'var(--accent)':'var(--text-secondary)';
    const sc = btn.querySelector('.tennis-tab-score');
    const s = st.sets[i];
    if(sc){
      sc.textContent = `${s.games[1]} – ${s.games[2]}`;
      sc.style.color = s.winner ? 'var(--green)' : (s.games[1]>0||s.games[2]>0) ? 'var(--accent)' : 'var(--text-secondary)';
      sc.style.fontWeight = s.winner ? '800' : '600';
    }
  });

  /* Set label */
  const lbl = document.getElementById('tennisSetLabel');
  if(lbl) lbl.textContent = cols[st.activeSet];

  /* Set badge */
  const badge = document.getElementById('tennisSetBadge');
  if(badge){
    if(set.winner){
      badge.style.background = 'var(--green-bg)';
      badge.style.borderColor = 'var(--green-border)';
      badge.style.color = 'var(--green)';
      badge.textContent = '✓ SET GANADO';
    } else if(set.currentGame.tiebreak){
      badge.style.background = '#fef3cd';
      badge.style.borderColor = '#ffc107';
      badge.style.color = '#856404';
      badge.textContent = 'TIEBREAK';
    } else {
      badge.style.background = 'var(--blue-bg)';
      badge.style.borderColor = '#bdd7f7';
      badge.style.color = 'var(--blue-info)';
      badge.textContent = 'EN JUEGO';
    }
  }

  /* Games display */
  const g1El = document.getElementById('tennisGames1');
  const g2El = document.getElementById('tennisGames2');
  if(g1El) g1El.value = set.games[1];
  if(g2El) g2El.value = set.games[2];
  if(set.winner){
    const winEl = set.winner===1?g1El:g2El;
    const loseEl = set.winner===1?g2El:g1El;
    if(winEl) winEl.style.color = 'var(--green)';
    if(loseEl) loseEl.style.color = 'var(--text-secondary)';
  } else {
    if(g1El) g1El.style.color = 'var(--text-primary)';
    if(g2El) g2El.style.color = 'var(--text-primary)';
  }

  /* Point display */
  const p1El = document.getElementById('tennisPoint1');
  const p2El = document.getElementById('tennisPoint2');
  if(set.winner){
    if(p1El) p1El.textContent = '–';
    if(p2El) p2El.textContent = '–';
  } else {
    if(p1El) p1El.textContent = _tennisPointLabel(1);
    if(p2El) p2El.textContent = _tennisPointLabel(2);
  }

  /* Game label */
  const gameLbl = document.getElementById('tennisGameLabel');
  if(gameLbl){
    if(set.winner) gameLbl.textContent = '';
    else if(set.currentGame.tiebreak) gameLbl.textContent = `TIEBREAK · Primero a ${cfg.tiebreakPoints} pts (dif. ${cfg.tiebreakDif})`;
    else gameLbl.textContent = 'JUEGO ACTUAL';
  }

  /* Game indicator (Deuce / Punto de Oro) */
  const ind = document.getElementById('tennisGameIndicator');
  if(ind){
    const p = set.currentGame.points;
    if(!set.winner && !set.currentGame.tiebreak && p[1] >= 3 && p[2] >= 3 && p[1] === p[2]){
      ind.style.display = 'block';
      ind.style.background = '#fef3cd';
      ind.style.border = '1px solid #ffc107';
      ind.style.color = '#856404';
      ind.textContent = cfg.puntoDeOro ? '⚡ PUNTO DE ORO — Siguiente punto gana el juego' : 'DEUCE 40–40';
    } else if(!set.winner && set.currentGame.tiebreak && p[1] >= cfg.tiebreakPoints-1 && p[2] >= cfg.tiebreakPoints-1 && p[1]===p[2]){
      ind.style.display = 'block';
      ind.style.background = '#fef3cd';
      ind.style.border = '1px solid #ffc107';
      ind.style.color = '#856404';
      ind.textContent = `DEUCE ${p[1]}–${p[2]} · Necesita ${cfg.tiebreakDif} pts de diferencia`;
    } else {
      ind.style.display = 'none';
    }
  }

  /* Buttons enable/disable */
  const btn1 = document.getElementById('tennisBtnPunto1');
  const btn2 = document.getElementById('tennisBtnPunto2');
  const disabled = set.winner || st.matchWinner;
  [btn1,btn2].forEach(b => {
    if(!b) return;
    b.disabled = disabled;
    b.style.opacity = disabled ? '0.4' : '1';
    b.style.cursor = disabled ? 'not-allowed' : 'pointer';
  });

  /* Rules update for tiebreak */
  const rulesEl = document.getElementById('tennisRules');
  if(rulesEl){
    if(set.currentGame.tiebreak && !set.winner){
      rulesEl.textContent = `Tiebreak: primero a ${cfg.tiebreakPoints} pts · dif. mín. ${cfg.tiebreakDif}`;
    } else {
      const r = `${cfg.gamesPerSet} juegos para ganar set · dif. mín. ${cfg.difMinGames} · Tiebreak a ${cfg.tiebreakAt}-${cfg.tiebreakAt}` + (cfg.puntoDeOro ? ' · Punto de Oro en Deuce' : '');
      rulesEl.textContent = r;
    }
  }

  _tennisRecalcTotals();
}

/* ── Recalc VS header + summary + hidden inputs ── */
function _tennisRecalcTotals(){
  const st = _tennisState;
  const sport = _tennisSport;
  const cols = sport.parciales;
  const setsWin = sport.setsParaGanar || 2;

  /* VS header */
  const ts1 = document.getElementById('totalScore1');
  const ts2 = document.getElementById('totalScore2');
  if(!_directScoreOverride){
    if(ts1) ts1.value = st.setsWon[1];
    if(ts2) ts2.value = st.setsWon[2];
  }

  /* Summary row */
  let summaryHtml = '';
  cols.forEach((c,i) => {
    const s = st.sets[i];
    const bg = s.winner ? 'var(--green-bg)' : (s.games[1]>0||s.games[2]>0) ? 'var(--orange-bg)' : '#f5f6fa';
    const border = s.winner ? 'var(--green-border)' : (s.games[1]>0||s.games[2]>0) ? 'var(--orange-border)' : 'var(--border)';
    const color = s.winner ? 'var(--green)' : 'var(--text-secondary)';
    summaryHtml += `<div style="padding:6px 12px;border-radius:var(--radius-md);border:1px solid ${border};background:${bg};font:500 11px var(--font);color:${color};text-align:center;min-width:70px">
      <div style="font-size:10px;margin-bottom:2px">${c}</div>
      <div style="font-weight:600;font-size:13px">${s.games[1]} – ${s.games[2]}</div>
      ${s.winner ? `<div style="font-size:9px;margin-top:1px">✓ G${s.winner}</div>` : ''}
    </div>`;
  });
  const row = document.getElementById('tennisSummaryRow');
  if(row) row.innerHTML = summaryHtml;

  /* Match result */
  const res = document.getElementById('tennisMatchResult');
  if(res){
    if(st.matchWinner){
      res.style.display = 'block';
      res.style.background = 'var(--green-bg)';
      res.style.border = '1.5px solid var(--green-border)';
      res.style.color = 'var(--green)';
      const wn = st.matchWinner===1 ? (document.querySelector('.score-header .team-name')?.textContent||'Equipo 1') : (document.querySelectorAll('.score-header .team-name')[1]?.textContent||'Equipo 2');
      res.innerHTML = `🏆 ${wn} gana el partido ${st.setsWon[1]}–${st.setsWon[2]}`;
    } else {
      res.style.display = 'none';
    }
  }

  /* Hidden inputs for save compatibility */
  const grid = document.getElementById('tennisGrid');
  if(grid){
    cols.forEach((_,i) => {
      const s = st.sets[i];
      let inp1 = grid.querySelector(`.score-input[data-team="1"][data-col="${i}"]`);
      let inp2 = grid.querySelector(`.score-input[data-team="2"][data-col="${i}"]`);
      if(!inp1){
        inp1 = document.createElement('input'); inp1.type='hidden'; inp1.className='score-input'; inp1.dataset.team='1'; inp1.dataset.col=i;
        grid.appendChild(inp1);
        inp2 = document.createElement('input'); inp2.type='hidden'; inp2.className='score-input'; inp2.dataset.team='2'; inp2.dataset.col=i;
        grid.appendChild(inp2);
      }
      if(inp1) inp1.value = s.games[1];
      if(inp2) inp2.value = s.games[2];
    });
  }
  if(typeof checkSaveReady === 'function') checkSaveReady();
}

/* ═══ SETS COUNTER GRID (Badminton, Volleyball, etc.) ═══ */
let _setsCounterState = {}; /* { setIdx: { 1: score, 2: score }, activeSet: 0 } */
let _setsCounterSport = null;

function buildSetsCounterGrid(sport, match, cols){
  _setsCounterSport = sport;
  _setsCounterState = { activeSet: 0 };
  cols.forEach((_,i) => { _setsCounterState[i] = { 1: 0, 2: 0 }; });

  const ptsSet = sport.puntosSet || 21;
  const dif = sport.difMinima || 2;
  const techo = sport.techoSet || null;
  const setsWin = sport.setsParaGanar || 2;
  const t1 = match.teams[0], t2 = match.teams[1];

  let html = `<div class="scoring-grid" id="setsCounterGrid">`;

  /* ── Set tabs ── */
  html += `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap" id="setTabsRow">`;
  cols.forEach((c, i) => {
    const active = i === 0;
    html += `<button class="set-tab-btn" data-set="${i}" onclick="switchSetTab(${i})"
      style="padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid ${active?'var(--accent)':'var(--border-dark)'};
      background:${active?'var(--orange-bg)':'var(--surface)'};font:600 12px var(--font);
      color:${active?'var(--accent)':'var(--text-secondary)'};cursor:pointer;transition:all .15s;
      display:flex;align-items:center;gap:6px">
      ${c} <span class="set-tab-score" style="font-size:10px;color:var(--text-secondary)">0 – 0</span>
    </button>`;
  });
  html += `</div>`;

  /* ── Active set panel ── */
  html += `<div id="setActivePanel" style="padding:20px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">`;

  /* Set status badge */
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <span style="font:600 13px var(--font);color:var(--text-primary)" id="setActiveLabel">${cols[0]}</span>
    <span id="setStatusBadge" style="padding:4px 12px;border-radius:var(--radius-full);font:600 10px var(--font);letter-spacing:.3px;
      background:var(--blue-bg);border:1px solid #bdd7f7;color:var(--blue-info)">EN JUEGO</span>
  </div>`;

  /* Score display — large counters */
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:14px">`;

  /* Team 1 */
  html += `<div style="text-align:center;flex:1">
    <div style="font:500 12px var(--font);color:var(--text-secondary);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t1}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:0">
      <button onclick="setScoreChange(1,-1)" class="set-counter-btn" style="width:40px;height:48px;border-radius:var(--radius-md) 0 0 var(--radius-md);border:1.5px solid var(--border-dark);border-right:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">−</button>
      <input id="setScore1" type="number" min="0" value="0" oninput="onSetScoreInput(1,this)" style="width:56px;height:48px;text-align:center;border:1.5px solid var(--border-dark);font:600 22px var(--font);color:var(--text-primary);background:var(--surface);-moz-appearance:textfield;outline:none" onfocus="this.select()"/>
      <button onclick="setScoreChange(1,1)" class="set-counter-btn" style="width:40px;height:48px;border-radius:0 var(--radius-md) var(--radius-md) 0;border:1.5px solid var(--border-dark);border-left:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">+</button>
    </div>
  </div>`;

  /* VS divider */
  html += `<div style="font:600 12px var(--font);color:var(--text-secondary);padding-top:20px">VS</div>`;

  /* Team 2 */
  html += `<div style="text-align:center;flex:1">
    <div style="font:500 12px var(--font);color:var(--text-secondary);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t2}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:0">
      <button onclick="setScoreChange(2,-1)" class="set-counter-btn" style="width:40px;height:48px;border-radius:var(--radius-md) 0 0 var(--radius-md);border:1.5px solid var(--border-dark);border-right:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">−</button>
      <input id="setScore2" type="number" min="0" value="0" oninput="onSetScoreInput(2,this)" style="width:56px;height:48px;text-align:center;border:1.5px solid var(--border-dark);font:600 22px var(--font);color:var(--text-primary);background:var(--surface);-moz-appearance:textfield;outline:none" onfocus="this.select()"/>
      <button onclick="setScoreChange(2,1)" class="set-counter-btn" style="width:40px;height:48px;border-radius:0 var(--radius-md) var(--radius-md) 0;border:1.5px solid var(--border-dark);border-left:none;background:var(--surface);font:600 18px var(--font);color:var(--accent);cursor:pointer;transition:background .12s" onmousedown="this.style.background='var(--orange-bg)'" onmouseup="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--surface)'">+</button>
    </div>
  </div>`;

  html += `</div>`; /* end score display */

  /* ── Deuce / Alargue indicator ── */
  html += `<div id="setDeuceIndicator" style="display:none;text-align:center;padding:8px 14px;border-radius:var(--radius-md);margin-bottom:10px;font:600 11px var(--font);letter-spacing:.3px"></div>`;

  /* ── Set rules reminder ── */
  const _hasDecisive = sport.setDecisivoPuntos && sport.setDecisivoPuntos !== ptsSet;
  const _pLabel = sport.puntosSetLabel || 'pts';
  let _rulesText = `${ptsSet} ${_pLabel} para ganar · dif. mín. ${dif}`;
  if(techo) _rulesText += ` · techo ${techo} ${_pLabel}`;
  if(_hasDecisive) _rulesText += ` | Set decisivo: ${sport.setDecisivoPuntos} ${_pLabel}`;
  html += `<div id="setRulesReminder" style="text-align:center;font:500 11px var(--font);color:var(--text-secondary)">
    ${_rulesText}
  </div>`;

  html += `</div>`; /* end setActivePanel */

  /* ── Sets summary row ── */
  html += `<div id="setsSummaryRow" style="display:flex;gap:8px;margin-top:14px;justify-content:center;flex-wrap:wrap"></div>`;

  /* ── Match result (appears when someone wins enough sets) ── */
  html += `<div id="setsMatchResult" style="display:none;text-align:center;margin-top:12px;padding:12px 16px;border-radius:var(--radius-lg);font:600 13px var(--font)"></div>`;

  /* ── Inline tarjeta roja section (for sports where cards give points — SKIP if using unified inline penalties) ── */
  const _tarjetas = sport.penalizacionesSumanAlContrario ? [] : (sport.penalizaciones || []).filter(p => { const pl=p.toLowerCase(); return pl.includes('tarjeta roja') && (pl.includes('punto')||pl.includes('otorga')); });
  if(_tarjetas.length > 0){
    _setsCounterState._tarjetaCounts = { 1: 0, 2: 0 };
    html += `<div style="margin-top:16px;padding:14px 18px;background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--radius-lg)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:16px">🔴</span>
        <span style="font:600 12px var(--font);color:#dc2626;flex:1">TARJETA ROJA</span>
        <span style="font:500 10px var(--font);color:#dc2626;opacity:.7">Otorga +1 punto al rival en el set activo</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;justify-content:center">
        <div style="text-align:center;flex:1">
          <div style="font:500 11px var(--font);color:#dc2626;margin-bottom:6px;opacity:.8">${t1}</div>
          <button onclick="applyTarjetaRoja(1)" class="tarjeta-btn" style="
            width:100%;padding:8px 14px;border-radius:var(--radius-md);border:1.5px solid #fca5a5;
            background:var(--surface);font:600 12px var(--font);color:#dc2626;cursor:pointer;
            transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px">
            🟥 <span>Aplicar</span> <span id="tarjetaCount1" style="display:none;width:18px;height:18px;border-radius:50%;background:#dc2626;color:#fff;font:600 10px var(--font);align-items:center;justify-content:center"></span>
          </button>
        </div>
        <div style="font:600 11px var(--font);color:#dc2626;opacity:.5;padding-top:16px">VS</div>
        <div style="text-align:center;flex:1">
          <div style="font:500 11px var(--font);color:#dc2626;margin-bottom:6px;opacity:.8">${t2}</div>
          <button onclick="applyTarjetaRoja(2)" class="tarjeta-btn" style="
            width:100%;padding:8px 14px;border-radius:var(--radius-md);border:1.5px solid #fca5a5;
            background:var(--surface);font:600 12px var(--font);color:#dc2626;cursor:pointer;
            transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px">
            🟥 <span>Aplicar</span> <span id="tarjetaCount2" style="display:none;width:18px;height:18px;border-radius:50%;background:#dc2626;color:#fff;font:600 10px var(--font);align-items:center;justify-content:center"></span>
          </button>
        </div>
      </div>
      <div id="tarjetaLog" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--red-border)"></div>
    </div>`;
  }

  html += `</div>`; /* end scoring-grid */
  return html;
}

function switchSetTab(idx){
  _setsCounterState.activeSet = idx;
  const sport = _setsCounterSport;
  const cols = sport.parciales;

  /* Update tab styles */
  document.querySelectorAll('.set-tab-btn').forEach((btn, i) => {
    const active = i === idx;
    btn.style.border = `1.5px solid ${active?'var(--accent)':'var(--border-dark)'}`;
    btn.style.background = active ? 'var(--orange-bg)' : 'var(--surface)';
    btn.style.color = active ? 'var(--accent)' : 'var(--text-secondary)';
  });

  /* Update label */
  const label = document.getElementById('setActiveLabel');
  if(label) label.textContent = cols[idx];

  /* Update counter displays */
  const s = _setsCounterState[idx] || {1:0, 2:0};
  const _ss1 = document.getElementById('setScore1');
  const _ss2 = document.getElementById('setScore2');
  if(_ss1){ if(_ss1.tagName === 'INPUT') _ss1.value = s[1]; else _ss1.textContent = s[1]; }
  if(_ss2){ if(_ss2.tagName === 'INPUT') _ss2.value = s[2]; else _ss2.textContent = s[2]; }

  /* Update set rules reminder for decisive set */
  const _rulesEl = document.getElementById('setRulesReminder');
  if(_rulesEl){
    const _target = _getSetTarget(idx);
    const _dif = sport.difMinima || 2;
    const _techo = sport.techoSet || null;
    const _pL = sport.puntosSetLabel || 'pts';
    let _rt = `${_target} ${_pL} para ganar · dif. mín. ${_dif}`;
    if(_techo) _rt += ` · techo ${_techo} ${_pL}`;
    if(sport.setDecisivoPuntos && idx === cols.length - 1) _rt = `⚡ Set decisivo: ${sport.setDecisivoPuntos} ${_pL} · dif. mín. ${_dif}` + (_techo ? ` · techo ${_techo}` : '');
    _rulesEl.textContent = _rt;
  }

  /* Update deuce/status indicators */
  _updateSetStatus(idx);
}

function setScoreChange(team, delta){
  const idx = _setsCounterState.activeSet;
  const s = _setsCounterState[idx];
  if(!s) return;

  const sport = _setsCounterSport;
  const techo = sport.techoSet || 99;

  /* Check if this set is already decided */
  if(_isSetWon(idx) && delta > 0) return;

  const newVal = Math.max(0, Math.min(s[team] + delta, techo));
  s[team] = newVal;

  /* Update display */
  const scoreEl = document.getElementById('setScore'+team);
  if(scoreEl.tagName === 'INPUT') scoreEl.value = newVal;
  else scoreEl.textContent = newVal;

  /* Update set tab score preview */
  _updateSetTabScores();
  _updateSetStatus(idx);

  /* Recalculate VS header totals (sets won) */
  _recalcSetsCounterTotals();
}

function onSetScoreInput(team, el){
  const idx = _setsCounterState.activeSet;
  const s = _setsCounterState[idx];
  if(!s) return;
  const sport = _setsCounterSport;
  const techo = sport.techoSet || 99;
  let val = parseInt(el.value) || 0;
  val = Math.max(0, Math.min(val, techo));
  s[team] = val;
  _updateSetTabScores();
  _updateSetStatus(idx);
  _recalcSetsCounterTotals();
}

function _getSetTarget(idx){
  const sport = _setsCounterSport;
  const cols = sport.parciales || [];
  const isDecisive = sport.setDecisivoPuntos && idx === cols.length - 1;
  return isDecisive ? sport.setDecisivoPuntos : (sport.puntosSet || 21);
}

function _isSetWon(idx){
  const s = _setsCounterState[idx];
  if(!s) return false;
  const sport = _setsCounterSport;
  const ptsSet = _getSetTarget(idx);
  const dif = sport.difMinima || 2;
  const techo = sport.techoSet || null;
  const s1 = s[1], s2 = s[2];

  /* Normal win: >= puntosSet AND difference >= difMinima */
  if(s1 >= ptsSet && s1 - s2 >= dif) return 1;
  if(s2 >= ptsSet && s2 - s1 >= dif) return 2;
  /* Techo win: whoever reaches techo first */
  if(techo){
    if(s1 >= techo) return 1;
    if(s2 >= techo) return 2;
  }
  return 0;
}

function _updateSetStatus(idx){
  const s = _setsCounterState[idx];
  if(!s) return;
  const sport = _setsCounterSport;
  const ptsSet = _getSetTarget(idx);
  const dif = sport.difMinima || 2;
  const techo = sport.techoSet || null;
  const s1 = s[1], s2 = s[2];
  const badge = document.getElementById('setStatusBadge');
  const deuce = document.getElementById('setDeuceIndicator');
  const score1El = document.getElementById('setScore1');
  const score2El = document.getElementById('setScore2');
  const winner = _isSetWon(idx);

  /* Reset styles */
  if(score1El) score1El.style.cssText = score1El.style.cssText.replace(/color:[^;]+;?/g,'') + 'color:var(--text-primary);';
  if(score2El) score2El.style.cssText = score2El.style.cssText.replace(/color:[^;]+;?/g,'') + 'color:var(--text-primary);';

  if(winner){
    /* Set is decided */
    if(badge){
      badge.style.background = 'var(--green-bg)';
      badge.style.borderColor = 'var(--green-border)';
      badge.style.color = 'var(--green)';
      badge.textContent = winner === 1 ? '✓ SET GANADO' : '✓ SET GANADO';
    }
    if(deuce) deuce.style.display = 'none';
    /* Highlight winner score */
    const winEl = winner === 1 ? score1El : score2El;
    const loseEl = winner === 1 ? score2El : score1El;
    if(winEl) winEl.style.color = 'var(--green)';
    if(loseEl) loseEl.style.color = 'var(--text-secondary)';
  } else if(s1 >= ptsSet - 1 && s2 >= ptsSet - 1 && s1 >= ptsSet - 1 && s2 >= ptsSet - 1){
    /* Deuce / Alargue zone */
    if(badge){
      badge.style.background = '#fef3cd';
      badge.style.borderColor = '#ffc107';
      badge.style.color = '#856404';
      badge.textContent = 'ALARGUE';
    }
    if(deuce){
      deuce.style.display = 'block';
      if(s1 === s2){
        deuce.style.background = '#fef3cd';
        deuce.style.borderColor = '#ffc107';
        deuce.style.border = '1px solid #ffc107';
        deuce.style.color = '#856404';
        const _pLbl = sport.puntosSetLabel || 'pts';
        deuce.textContent = `DEUCE ${s1}–${s2} · Necesita ${dif} ${_pLbl} de diferencia` + (techo ? ` (techo: ${techo})` : '');
      } else {
        const leader = s1 > s2 ? 1 : 2;
        const diff = Math.abs(s1 - s2);
        deuce.style.background = 'var(--blue-bg)';
        deuce.style.border = '1px solid #bdd7f7';
        deuce.style.color = 'var(--blue-info)';
        const _pLbl2 = sport.puntosSetLabel || 'pt';
        const _pLblPlural = _pLbl2 === 'pt' ? `pt${diff>1?'s':''}` : _pLbl2;
        deuce.textContent = `VENTAJA ${diff} ${_pLblPlural} · Falta ${dif - diff} para ganar el set`;
      }
    }
  } else {
    /* Normal play */
    if(badge){
      badge.style.background = 'var(--blue-bg)';
      badge.style.borderColor = '#bdd7f7';
      badge.style.color = 'var(--blue-info)';
      badge.textContent = 'EN JUEGO';
    }
    if(deuce) deuce.style.display = 'none';
  }

  /* Update set tab badge colors */
  const tabBtn = document.querySelectorAll('.set-tab-btn')[idx];
  if(tabBtn){
    const scoreBadge = tabBtn.querySelector('.set-tab-score');
    if(scoreBadge){
      if(winner){
        scoreBadge.style.color = 'var(--green)';
        scoreBadge.style.fontWeight = '800';
      } else if(s1 > 0 || s2 > 0){
        scoreBadge.style.color = 'var(--accent)';
        scoreBadge.style.fontWeight = '700';
      } else {
        scoreBadge.style.color = 'var(--text-secondary)';
        scoreBadge.style.fontWeight = '600';
      }
    }
  }
}

function _updateSetTabScores(){
  document.querySelectorAll('.set-tab-btn').forEach((btn, i) => {
    const s = _setsCounterState[i];
    if(!s) return;
    const scoreBadge = btn.querySelector('.set-tab-score');
    if(scoreBadge) scoreBadge.textContent = `${s[1]} – ${s[2]}`;
  });
}

function _recalcSetsCounterTotals(){
  const sport = _setsCounterSport;
  const cols = sport.parciales;
  let s1Won = 0, s2Won = 0;
  const setsWin = sport.setsParaGanar || 2;

  /* Build summary row */
  let summaryHtml = '';
  cols.forEach((c, i) => {
    const winner = _isSetWon(i);
    const s = _setsCounterState[i] || {1:0,2:0};
    if(winner === 1) s1Won++;
    if(winner === 2) s2Won++;
    const bg = winner === 1 ? 'var(--green-bg)' : winner === 2 ? 'var(--green-bg)' : (s[1]>0||s[2]>0) ? 'var(--orange-bg)' : '#f5f6fa';
    const border = winner ? 'var(--green-border)' : (s[1]>0||s[2]>0) ? 'var(--orange-border)' : 'var(--border)';
    const color = winner ? 'var(--green)' : 'var(--text-secondary)';
    summaryHtml += `<div style="padding:6px 12px;border-radius:var(--radius-md);border:1px solid ${border};background:${bg};font:500 11px var(--font);color:${color};text-align:center;min-width:70px">
      <div style="font-size:10px;margin-bottom:2px">${c}</div>
      <div style="font-weight:600;font-size:13px">${s[1]} – ${s[2]}</div>
      ${winner ? `<div style="font-size:9px;margin-top:1px">✓ ${winner === 1 ? 'G1' : 'G2'}</div>` : ''}
    </div>`;
  });
  const summaryRow = document.getElementById('setsSummaryRow');
  if(summaryRow) summaryRow.innerHTML = summaryHtml;

  /* Update VS header totals */
  const ts1 = document.getElementById('totalScore1');
  const ts2 = document.getElementById('totalScore2');
  if(!_directScoreOverride){
    if(ts1) ts1.value = s1Won;
    if(ts2) ts2.value = s2Won;
  }

  /* Match result */
  const resultDiv = document.getElementById('setsMatchResult');
  if(resultDiv){
    if(s1Won >= setsWin || s2Won >= setsWin){
      const matchWinner = s1Won >= setsWin ? 1 : 2;
      resultDiv.style.display = 'block';
      resultDiv.style.background = 'var(--green-bg)';
      resultDiv.style.border = '1.5px solid var(--green-border)';
      resultDiv.style.color = 'var(--green)';
      const winnerName = matchWinner === 1 ? (document.querySelector('.score-header .team-name')?.textContent || 'Equipo 1') : (document.querySelectorAll('.score-header .team-name')[1]?.textContent || 'Equipo 2');
      resultDiv.innerHTML = `🏆 ${winnerName} gana el partido ${s1Won}–${s2Won}`;
    } else {
      resultDiv.style.display = 'none';
    }
  }

  /* Also populate hidden score-inputs so saveResult can read them */
  cols.forEach((_, i) => {
    const s = _setsCounterState[i];
    let inp1 = document.querySelector(`.score-input[data-team="1"][data-col="${i}"]`);
    let inp2 = document.querySelector(`.score-input[data-team="2"][data-col="${i}"]`);
    if(!inp1){
      /* Create hidden inputs for save compatibility */
      const grid = document.getElementById('setsCounterGrid');
      if(grid){
        inp1 = document.createElement('input');
        inp1.type = 'hidden'; inp1.className = 'score-input'; inp1.dataset.team = '1'; inp1.dataset.col = i;
        grid.appendChild(inp1);
        inp2 = document.createElement('input');
        inp2.type = 'hidden'; inp2.className = 'score-input'; inp2.dataset.team = '2'; inp2.dataset.col = i;
        grid.appendChild(inp2);
      }
    }
    if(inp1) inp1.value = s ? s[1] : 0;
    if(inp2) inp2.value = s ? s[2] : 0;
  });

  checkSaveReady();
}

/* ═══ COMBATE / ROUNDS ═══ */
function buildCombatGrid(sport, match){
  if(!match.teams || match.teams.length < 2) match = {...match, teams: [match.teams?.[0]||'Equipo 1', match.teams?.[1]||'Equipo 2']};
  const cols = sport.parciales && sport.parciales.length ? sport.parciales : null;
  if(!cols) return buildTimesGrid(sport, match);
  return `<div class="scoring-grid">
    <table class="scoring-table">
      <thead><tr>
        <th>COMPETIDOR</th>
        ${cols.map(c => `<th>${c}</th>`).join('')}
      </tr></thead>
      <tbody>
        <tr>
          <td>${match.teams[0]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="1" data-col="${i}" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
        <tr>
          <td>${match.teams[1]}</td>
          ${cols.map((_,i) => `<td><input class="score-input" type="number" min="0" data-team="2" data-col="${i}" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td>`).join('')}
        </tr>
      </tbody>
    </table>
    ${sport.tiempoParcial ? `<div style="font-size:11px;color:var(--text-secondary)">Tiempo por round: ${sport.tiempoParcial}</div>` : ''}
  </div>`;
}

/* ═══ Tab switching ═══ */
function switchModalTab(tabEl){
  const tabId = tabEl.dataset.tab;
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  tabEl.classList.add('active');
  const panel = document.getElementById('tab-' + tabId);
  if(panel) panel.classList.add('active');
}

/* ═══ Special Actions (combat, inline in marcador) ═══ */
function buildSpecialActionsOnly(sport){
  const emojiMap = {'Ippon':'🥇','Waza-ari':'🥈','Yuko':'🥉','KO':'💥','TKO':'💥','RSC':'🛑','Touché':'🎯','Pin (Fall)':'📌','Superioridad':'⚡','Superioridad técnica':'⚡','Descalificación':'❌'};
  return `<div class="stats-section">
    <div class="stats-section-title">⚡ ACCIONES ESPECIALES</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
      ${sport.accionesEspeciales.map(a=>`<button class="btn btn-outline btn-sm action-btn" onclick="toggleAction(this)" style="font-size:11px">${emojiMap[a]||'🎯'} ${a}</button>`).join('')}
    </div>
  </div>`;
}

/* ═══ Tab: Penalizaciones ═══ */
let _penaltyLog = [];

/* ═══ INLINE PENALTY SECTION — penalties that add runs/points to scoreboard (cricket-style) ═══ */
let _inlinePenaltyLog = [];

function buildInlinePenaltySection(sport, match){
  const t1 = match.teams[0], t2 = match.teams[1];
  const penalties = sport.penalizaciones || [];
  _inlinePenaltyLog = [];

  /* Parse penalty info: extract points and target from label — supports +0 (log-only), +1, +5 */
  const parsedPenalties = penalties.map((p, i) => {
    const lower = p.toLowerCase();
    const explicitPts = lower.match(/\+(\d+)/);
    const pts = explicitPts ? parseInt(explicitPts[1]) : 1;
    const isContrario = pts >= 5 || lower.includes('rival') || !!sport.penalizacionesSumanAlContrario;
    const shortLabel = p.split('→')[0].trim();
    return { id: i, label: shortLabel, points: pts, isContrario };
  });

  const _hasScorePenalties = parsedPenalties.some(p => p.points > 0);
  const _periodWord = sport.puntosSet ? 'set' : sport.parciales && sport.parciales[0] && /inn/i.test(sport.parciales[0]) ? 'innings' : 'período';
  let html = `<div id="inlinePenaltySection" style="margin:12px 0 0;padding:16px 28px 20px;border-top:1px solid var(--border)">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
      <span style="font:600 11px var(--font);color:var(--text-secondary);letter-spacing:.3px;flex:1">PENALIZACIONES</span>
      <span style="font:500 10px var(--font);color:var(--text-secondary);opacity:.6">${_hasScorePenalties ? 'Afectan el marcador del ' + _periodWord + ' activo' : 'Se registran como incidencia'}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">`;

  parsedPenalties.forEach((pen, idx) => {
    const isLogOnly = pen.points === 0;
    const ptsLabel = isLogOnly ? '📋' : `+${pen.points}`;
    const targetHint = pen.isContrario ? (sport.penaltyTargetLabel || 'al contrario') : (sport.penaltyTargetLabel || 'al bateador');
    const hintText = isLogOnly ? 'registro' : targetHint;
    html += `<div style="display:flex;align-items:center;gap:8px">
      <div style="flex:1;font:500 12px var(--font);color:var(--text-primary);display:flex;align-items:center;gap:6px">
        <span style="font:600 11px var(--font);color:${isLogOnly ? 'var(--text-secondary)' : pen.isContrario ? '#dc2626' : 'var(--accent)'};min-width:22px">${ptsLabel}</span>
        ${pen.label}
        <span style="font:400 10px var(--font);color:var(--text-secondary)">${hintText}</span>
      </div>
      <button type="button" onclick="applyInlinePenalty(${idx},1)" style="
        padding:5px 12px;border-radius:var(--radius-sm);border:1px solid var(--border-dark);
        background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;
        transition:all .12s;white-space:nowrap"
        onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
        onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'"
      >${t1.length > 12 ? t1.substring(0,12)+'…' : t1}</button>
      <button type="button" onclick="applyInlinePenalty(${idx},2)" style="
        padding:5px 12px;border-radius:var(--radius-sm);border:1px solid var(--border-dark);
        background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;
        transition:all .12s;white-space:nowrap"
        onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
        onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'"
      >${t2.length > 12 ? t2.substring(0,12)+'…' : t2}</button>
    </div>`;
  });

  html += `</div>`;

  /* Log section */
  html += `<div id="inlinePenaltyLog" style="display:none;margin-top:10px;padding-top:8px">
    <div id="inlinePenaltyLogEntries" style="display:flex;flex-direction:column;gap:3px"></div>
  </div>`;

  html += `</div>`;
  return html;
}

function applyInlinePenalty(penIdx, teamClicked){
  if(!_modalSportKey) return;
  const sport = SPORTS_DB[_modalSportKey];
  const penalties = sport.penalizaciones || [];
  const pen = penalties[penIdx];
  if(!pen) return;

  const _useSetsCounter = _setsCounterSport && sport.puntosSet;
  const _useTennis = _tennisState !== null;
  if(!_useSetsCounter && !_bballState && !_useTennis) return;

  const lower = pen.toLowerCase();
  const explicitPts = lower.match(/\+(\d+)/);
  const pts = explicitPts ? parseInt(explicitPts[1]) : 1;
  const isContrario = pts >= 5;

  /* Determine which team RECEIVES the points */
  let targetTeam;
  if(sport.penalizacionesSumanAlContrario || isContrario){
    targetTeam = teamClicked === 1 ? 2 : 1;
  } else {
    targetTeam = teamClicked;
  }

  /* Add points to the active period/set (skip if pts === 0 → log-only penalty) */
  let periodLabel;
  if(pts > 0){
    if(_useTennis){
      /* Tennis mode: Game Penalty adds a full game */
      tennisAddGame(targetTeam);
      const cols = sport.parciales || [];
      periodLabel = cols[_tennisState.activeSet] || 'Set ?';
    } else if(_useSetsCounter){
      /* Sets counter mode (volleyball, badminton) → add to active set */
      for(let i = 0; i < pts; i++) setScoreChange(targetTeam, 1);
      const cols = sport.parciales || [];
      periodLabel = cols[_setsCounterState.activeSet] || 'Set ?';
    } else {
      /* Basketball grid mode (cricket, etc.) */
      bballAddPoints(targetTeam, pts);
      periodLabel = _bballState.activeTab;
    }
  } else {
    /* Log-only penalty (pts === 0): record but don't change score */
    const cols = sport.parciales || [];
    periodLabel = _useTennis ? (cols[_tennisState.activeSet] || 'Set ?') : _useSetsCounter ? (cols[_setsCounterState.activeSet] || 'Set ?') : (_bballState ? _bballState.activeTab : '');
  }

  /* Get team names */
  const match = _modalMatchData;
  const t1Name = match.teams[0], t2Name = match.teams[1];
  const penalizedName = teamClicked === 1 ? t1Name : t2Name;
  const benefitName = targetTeam === 1 ? t1Name : t2Name;
  const shortLabel = pen.split('→')[0].trim();

  /* Log entry */
  const entry = {
    penIdx, teamClicked, targetTeam, pts, label: shortLabel,
    penalized: penalizedName, benefit: benefitName,
    period: periodLabel, time: new Date(),
    _useSetsCounter, _useTennis
  };
  _inlinePenaltyLog.push(entry);
  _renderInlinePenaltyLog();

  /* ── Auto-DQ: check if penalized team hit threshold (e.g. taekwondo 10 pens = immediate defeat) ── */
  if(sport.penaltyDqThreshold){
    const teamPenCount = _inlinePenaltyLog.filter(e => e.teamClicked === teamClicked).length;
    if(teamPenCount >= sport.penaltyDqThreshold){
      _showPenaltyDqAlert(penalizedName, teamPenCount, sport.penaltyDqThreshold);
    }
  }
}

function _showPenaltyDqAlert(teamName, count, threshold){
  /* Remove any existing DQ alert */
  const prev = document.getElementById('penaltyDqAlert');
  if(prev) prev.remove();

  const alertHtml = `<div id="penaltyDqAlert" style="
    margin:12px 28px;padding:14px 18px;border-radius:var(--radius-md);
    background:#fff0ee;border:1.5px solid #ffc4bb;
    display:flex;align-items:center;gap:10px;
    animation:fadeInUp .35s cubic-bezier(.4,0,.2,1)">
    <span style="font-size:20px">🚫</span>
    <div style="flex:1">
      <div style="font:600 13px var(--font);color:#dc2626">DERROTA POR ACUMULACIÓN DE PENALIZACIONES</div>
      <div style="font:500 12px var(--font);color:var(--text-secondary);margin-top:2px">
        <strong>${teamName}</strong> acumuló ${count} penalizaciones (límite: ${threshold}) — derrota inmediata.
      </div>
    </div>
  </div>`;

  /* Insert right before the inline penalty section */
  const penSection = document.getElementById('inlinePenaltySection');
  if(penSection){
    penSection.insertAdjacentHTML('beforebegin', alertHtml);
  }
}

function _renderInlinePenaltyLog(){
  const logWrap = document.getElementById('inlinePenaltyLog');
  const entries = document.getElementById('inlinePenaltyLogEntries');
  const count = document.getElementById('inlinePenaltyCount');
  if(!logWrap || !entries) return;

  logWrap.style.display = _inlinePenaltyLog.length > 0 ? 'block' : 'none';

  /* DQ threshold counter per team */
  const sport = _modalSportKey ? SPORTS_DB[_modalSportKey] : null;
  const dqThreshold = sport && sport.penaltyDqThreshold ? sport.penaltyDqThreshold : 0;
  let counterHtml = '';
  if(dqThreshold > 0 && _inlinePenaltyLog.length > 0){
    const match = _modalMatchData;
    const t1Name = match.teams[0], t2Name = match.teams[1];
    const t1Count = _inlinePenaltyLog.filter(e => e.teamClicked === 1).length;
    const t2Count = _inlinePenaltyLog.filter(e => e.teamClicked === 2).length;
    const _bar = (name, cnt) => {
      const pct = Math.min(cnt / dqThreshold * 100, 100);
      const barColor = cnt >= dqThreshold ? '#dc2626' : cnt >= dqThreshold * 0.7 ? '#f59e0b' : 'var(--accent)';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font:500 11px var(--font);color:var(--text-primary);min-width:90px;text-align:right">${name.length > 14 ? name.substring(0,14)+'…' : name}</span>
        <div style="flex:1;height:7px;background:var(--border);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;transition:width .2s"></div>
        </div>
        <span style="font:600 11px var(--font);color:var(--text-secondary);min-width:36px">${cnt}/${dqThreshold}</span>
      </div>`;
    };
    counterHtml = `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
      <div style="font:500 10px var(--font);color:var(--text-secondary);letter-spacing:.3px;margin-bottom:10px">ACUMULACIÓN DE PENALIZACIONES</div>
      ${_bar(t1Name, t1Count)}
      ${_bar(t2Name, t2Count)}
    </div>`;
  }

  entries.innerHTML = counterHtml + _inlinePenaltyLog.map((e, i) => {
    const time = e.time.toLocaleTimeString('es-CO', {hour:'2-digit',minute:'2-digit'});
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font:400 11px var(--font);color:var(--text-secondary)">
      <span style="font:600 11px var(--font);color:${e.pts >= 5 ? '#dc2626' : 'var(--accent)'};min-width:22px">+${e.pts}</span>
      <span style="flex:1">${e.label} · ${e.period} → ${e.benefit}</span>
      <span style="opacity:.4;font-size:10px">${time}</span>
      <button type="button" onclick="undoInlinePenalty(${i})" style="
        background:none;border:none;cursor:pointer;color:var(--text-secondary);font:500 10px var(--font);
        padding:1px 4px;opacity:.5;transition:all .12s"
        onmouseover="this.style.opacity='1';this.style.color='#dc2626'" onmouseout="this.style.opacity='.5';this.style.color='var(--text-secondary)'">
        deshacer
      </button>
    </div>`;
  }).join('');
}

function undoInlinePenalty(idx){
  if(idx < 0 || idx >= _inlinePenaltyLog.length) return;
  const entry = _inlinePenaltyLog[idx];

  if(entry._useTennis){
    /* Tennis mode: undo Game Penalty */
    const sport = _tennisSport;
    const cols = sport ? sport.parciales || [] : [];
    const setIdx = cols.indexOf(entry.period);
    if(setIdx >= 0 && _tennisState.activeSet !== setIdx) tennisSwitchSet(setIdx);
    tennisUndoGame(entry.targetTeam);
  } else if(entry._useSetsCounter){
    /* Sets counter mode: find the set index by label and switch to it */
    const sport = _setsCounterSport;
    const cols = sport ? sport.parciales || [] : [];
    const setIdx = cols.indexOf(entry.period);
    if(setIdx >= 0 && _setsCounterState.activeSet !== setIdx) switchSetTab(setIdx);
    for(let i = 0; i < entry.pts; i++) setScoreChange(entry.targetTeam, -1);
  } else {
    /* Basketball grid mode */
    if(_bballState && _bballState.activeTab !== entry.period){
      switchBballTab(entry.period);
    }
    bballAddPoints(entry.targetTeam, -entry.pts);
  }

  /* Remove from log */
  _inlinePenaltyLog.splice(idx, 1);
  _renderInlinePenaltyLog();

  /* Remove DQ alert if below threshold after undo */
  const sport = SPORTS_DB[_modalSportKey];
  if(sport && sport.penaltyDqThreshold){
    const t1Count = _inlinePenaltyLog.filter(e => e.teamClicked === 1).length;
    const t2Count = _inlinePenaltyLog.filter(e => e.teamClicked === 2).length;
    if(t1Count < sport.penaltyDqThreshold && t2Count < sport.penaltyDqThreshold){
      const alert = document.getElementById('penaltyDqAlert');
      if(alert) alert.remove();
    }
  }
}

function buildPenalizacionesTab(sport, match, excludePerdidas){
  const penalEmojiMap = {'Tarjeta amarilla':'🟡','Tarjeta roja':'🔴','Tarjeta verde':'🟢','Falta personal':'⚠️','Falta técnica':'🚫','Falta acumulada':'⚠️','Falta antideportiva':'🔴','Falta descalificante':'❌','Gam-jeom':'🔴','Advertencia':'🟡','Shido (leve)':'🟡','Shido (grave)':'🟠','Hansoku-make':'❌','Tarjeta negra':'⚫','Pasividad':'🟡','Conducta antideportiva':'🔴','Golpe peligroso o ilegal':'🔴','Salir de la pista':'🟡','Intentos Nulos':'❌','Tiempo de intento excedido':'⏱️','Salida en Falso':'🚫','Invasión de Carril':'🚫','Errores en obstáculos (−30 a −40 pts)':'⚠️','Nulos en Campo (0 pts en la prueba)':'❌'};

  const isVsMatch = match.teams && match.teams.length >= 2 && match.teams[0] !== 'Todos' && match.teams[0] !== 'Equipo 1' && match.teams[0] !== 'Serie A' && match.teams[0] !== 'TBD';
  const penalTargets = isVsMatch ? match.teams.slice(0,2) : ((match.participants && match.participants.length > 0) ? match.participants : ['Equipo 1','Equipo 2']);

  /* ── Categorized penalties for infraction-based sports (chess, badminton, etc.) ── */
  if(excludePerdidas){
    return buildCategorizedPenalizaciones(sport, match, penalTargets, isVsMatch, excludePerdidas);
  }

  /* ── Incident-log style for marca/individual sports (atletismo, etc.) ── */
  const _isMarcaP = sport.puntuacion === 'marca' || sport.puntuacion === 'jueces';
  const penals = _isMarcaP ? (_sportPenalizaciones || sport.penalizaciones || []) : (sport.penalizaciones || []);
  if(_isMarcaP && penals.length > 0){
    _penaltyLog = [];
    _penalDdState = { selectedType: null, selectedTarget: null, allPenals: penals, targets: penalTargets };
    let html = `<div style="padding:20px 28px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style="font-size:14px;font-weight:600;color:var(--text-primary)">Registro de penalizaciones</span>
        </div>
        <span style="font-size:11px;color:var(--text-secondary)" id="penalCount">0 registros</span>
      </div>
      <div style="padding:16px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:18px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="min-width:0">
            <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">TIPO DE PENALIZACIÓN</div>
            <div class="float-dd-wrap" style="display:block;width:100%" id="penalTypeWrap">
              <div class="float-dd-trigger" id="penalTypeTrigger" onclick="togglePenalDd('type')" style="min-height:42px;font-size:12px">
                Seleccionar tipo
              </div>
              <div class="float-dd-menu" id="penalTypeMenu" style="width:100%;min-width:0">
                ${penals.map((p,i) => {
                  const shortP = p.length > 45 ? p.substring(0,45)+'…' : p;
                  return `<div class="float-dd-opt" data-idx="${i}" onclick="pickPenalType(${i})">${shortP}</div>`;
                }).join('')}
              </div>
            </div>
          </div>
          <div style="min-width:0">
            <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">¿A QUIÉN?</div>
            <div class="float-dd-wrap" style="display:block;width:100%" id="penalTargetWrap">
              <div class="float-dd-trigger" id="penalTargetTrigger" onclick="togglePenalDd('target')" style="min-height:42px;font-size:12px">
                Seleccionar
              </div>
              <div class="float-dd-menu" id="penalTargetMenu" style="width:100%;min-width:0">
                ${penalTargets.map((p,i) => {
                  return `<div class="float-dd-opt" data-idx="${i}" data-name="${p}" onclick="pickPenalTarget('${p.replace(/'/g,"\\'")}')">${p}</div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
        <button type="button" id="addPenalBtn" onclick="addPenalty()" disabled
          style="width:100%;padding:10px;border-radius:var(--radius-md);border:none;background:var(--border);font:600 12px var(--font);color:var(--text-secondary);cursor:not-allowed;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar penalización
        </button>
      </div>
      <div id="penalLogEntries" style="margin-bottom:12px"></div>
    </div>`;
    return html;
  }

  /* ── Default: flat list with counters ── */
  const items = (sport.penalizaciones || []).map(p => {
    const shortP = p.length > 40 ? p.substring(0,40)+'…' : p;
    return { label: shortP, emoji: penalEmojiMap[p] || '⚠️', full: p };
  });
  let html = `<div style="padding:20px 28px">
    <div class="stats-section-title">🟡 PENALIZACIONES DEL DEPORTE</div>`;
  if(isVsMatch){
    html += items.map(item => `
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-align:center">${item.emoji} ${item.label.toUpperCase()}</div>
        <div class="stats-counters">
          <div class="stat-counter"><div class="stat-counter-label">${penalTargets[0]}</div><div class="stat-counter-controls"><button class="counter-btn" onclick="adjustCounter(this,-1)">−</button><div class="counter-val" data-penal="${item.full}" data-team="1">0</div><button class="counter-btn" onclick="adjustCounter(this,1)">+</button></div></div>
          <div class="stat-counter"><div class="stat-counter-label">${penalTargets[1]}</div><div class="stat-counter-controls"><button class="counter-btn" onclick="adjustCounter(this,-1)">−</button><div class="counter-val" data-penal="${item.full}" data-team="2">0</div><button class="counter-btn" onclick="adjustCounter(this,1)">+</button></div></div>
        </div>
      </div>`).join('');
  } else {
    html += items.map(item => `
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-align:center">${item.emoji} ${item.label.toUpperCase()}</div>
        <div class="stats-counters" style="flex-wrap:wrap">
          ${penalTargets.map((p,i) => `<div class="stat-counter"><div class="stat-counter-label">${p.length > 15 ? p.substring(0,15)+'…' : p}</div><div class="stat-counter-controls"><button class="counter-btn" onclick="adjustCounter(this,-1)">−</button><div class="counter-val" data-penal="${item.full}" data-team="${i+1}">0</div><button class="counter-btn" onclick="adjustCounter(this,1)">+</button></div></div>`).join('')}
        </div>
      </div>`).join('');
  }
  html += `</div>`;
  return html;
}

/* ═══ Penalty floating-dropdown interactions (marca/individual sports) ═══ */
let _penalDdState = { selectedType: null, selectedTarget: null, allPenals: [], targets: [] };

function togglePenalDd(which){
  const typeT = document.getElementById('penalTypeTrigger');
  const typeM = document.getElementById('penalTypeMenu');
  const targT = document.getElementById('penalTargetTrigger');
  const targM = document.getElementById('penalTargetMenu');
  if(which === 'type'){
    const isOpen = typeM.classList.contains('open');
    typeM.classList.toggle('open'); typeT.classList.toggle('open');
    if(!isOpen){ targM.classList.remove('open'); targT.classList.remove('open'); }
  } else {
    const isOpen = targM.classList.contains('open');
    targM.classList.toggle('open'); targT.classList.toggle('open');
    if(!isOpen){ typeM.classList.remove('open'); typeT.classList.remove('open'); }
  }
}

function pickPenalType(idx){
  const st = _penalDdState;
  st.selectedType = st.allPenals[idx];
  const trigger = document.getElementById('penalTypeTrigger');
  const menu = document.getElementById('penalTypeMenu');
  const shortT = st.selectedType.length > 40 ? st.selectedType.substring(0,40)+'…' : st.selectedType;
  trigger.textContent = shortT;
  trigger.classList.remove('open');
  menu.classList.remove('open');
  menu.querySelectorAll('.float-dd-opt').forEach((o,i) => o.classList.toggle('selected', i===idx));
  _updatePenalRegisterBtn();
}

function pickPenalTarget(name){
  const st = _penalDdState;
  st.selectedTarget = name;
  const trigger = document.getElementById('penalTargetTrigger');
  const menu = document.getElementById('penalTargetMenu');
  trigger.textContent = name.length > 20 ? name.substring(0,20)+'…' : name;
  trigger.classList.remove('open');
  menu.classList.remove('open');
  menu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.toggle('selected', o.dataset.name===name));
  _updatePenalRegisterBtn();
}

function _updatePenalRegisterBtn(){
  const btn = document.getElementById('addPenalBtn');
  if(!btn) return;
  const st = _penalDdState;
  if(st.selectedType && st.selectedTarget){
    btn.disabled = false;
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.background = 'var(--border)';
    btn.style.color = 'var(--text-secondary)';
    btn.style.cursor = 'not-allowed';
  }
}

function addPenalty(){
  const st = _penalDdState;
  if(!st.selectedType || !st.selectedTarget) return;
  const entry = {type:st.selectedType, target:st.selectedTarget, time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})};
  _penaltyLog.push(entry);
  /* Reset dropdown selections */
  st.selectedType = null;
  st.selectedTarget = null;
  const typeTrigger = document.getElementById('penalTypeTrigger');
  const targTrigger = document.getElementById('penalTargetTrigger');
  if(typeTrigger) typeTrigger.textContent = 'Seleccionar tipo';
  if(targTrigger) targTrigger.textContent = 'Seleccionar';
  document.getElementById('penalTypeMenu')?.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  document.getElementById('penalTargetMenu')?.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  _updatePenalRegisterBtn();
  /* Update log display */
  const logEl = document.getElementById('penalLogEntries');
  if(logEl){
    const e = entry;
    const shortType = e.type.length > 30 ? e.type.substring(0,30)+'…' : e.type;
    logEl.insertAdjacentHTML('afterbegin', `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--radius-md);margin-bottom:6px;animation:fadeInUp .25s cubic-bezier(.4,0,.2,1)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div style="flex:1;min-width:0">
        <div style="font:600 12px var(--font);color:#dc2626">${shortType}</div>
        <div style="font:500 11px var(--font);color:var(--text-secondary)">${e.target} · ${e.time}</div>
      </div>
      <button onclick="this.parentElement.remove();_penaltyLog.pop();document.getElementById('penalCount').textContent=_penaltyLog.length+' registro'+((_penaltyLog.length!==1)?'s':'')" style="width:24px;height:24px;border-radius:var(--radius-full);border:1px solid var(--border);background:var(--surface);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-secondary)">✕</button>
    </div>`);
  }
  const countEl = document.getElementById('penalCount');
  if(countEl) countEl.textContent = _penaltyLog.length + ' registro' + (_penaltyLog.length !== 1 ? 's' : '');
}

/* ═══ DQ incident log interactions (marca/individual sports) ═══ */
let _selectedDqMarcaType = null;
let _selectedDqMarcaTarget = null;
let _selectedDqMarcaPlayerName = null;
let _dqMarcaTargetMode = null; /* 'equipo' | 'individuo' */
let _dqLog = [];

function selectDqMarcaType(btn){
  const container = document.getElementById('dqMarcaTypeBtns');
  if(!container) return;
  container.querySelectorAll('.dq-marca-type-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = 'var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });
  btn.classList.add('active');
  btn.style.borderColor = 'var(--accent)';
  btn.style.background = 'var(--orange-bg)';
  btn.style.color = 'var(--accent)';
  _selectedDqMarcaType = btn.dataset.full;
  _dqMarcaTargetMode = btn.dataset.dqtarget || 'equipo';

  /* Show/hide player input based on target mode */
  const playerSection = document.getElementById('dqMarcaPlayerSection');
  if(playerSection){
    if(_dqMarcaTargetMode === 'individuo'){
      playerSection.style.display = '';
    } else {
      playerSection.style.display = 'none';
      _selectedDqMarcaPlayerName = null;
      const pInput = document.getElementById('dqMarcaPlayerInput');
      if(pInput) pInput.value = '';
    }
  }

  /* Reset target selection */
  _selectedDqMarcaTarget = null;
  document.getElementById('dqMarcaTargetBtns')?.querySelectorAll('.dq-marca-target-btn').forEach(b => {
    b.classList.remove('active'); b.style.borderColor='var(--border-dark)'; b.style.background='var(--surface)'; b.style.color='var(--text-secondary)';
  });

  /* Show target section with fadeInUp */
  const targetSection = document.getElementById('dqMarcaTargetSection');
  if(targetSection && targetSection.style.display === 'none'){
    targetSection.style.display = '';
    targetSection.style.animation = 'fadeInUp .25s cubic-bezier(.4,0,.2,1)';
  }
  _updateAddDqMarcaBtn();
}

function selectDqMarcaTarget(btn){
  const container = document.getElementById('dqMarcaTargetBtns');
  if(!container) return;
  container.querySelectorAll('.dq-marca-target-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = 'var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });
  btn.classList.add('active');
  btn.style.borderColor = '#1f8923';
  btn.style.background = 'var(--green-bg)';
  btn.style.color = '#1f8923';
  _selectedDqMarcaTarget = btn.dataset.name;
  _updateAddDqMarcaBtn();
}

function _updateAddDqMarcaBtn(){
  const btn = document.getElementById('addDqMarcaBtn');
  if(!btn) return;
  const needsPlayer = _dqMarcaTargetMode === 'individuo';
  const playerInput = document.getElementById('dqMarcaPlayerInput');
  _selectedDqMarcaPlayerName = playerInput ? playerInput.value.trim() : null;
  const ready = _selectedDqMarcaType && _selectedDqMarcaTarget && (!needsPlayer || (_selectedDqMarcaPlayerName && _selectedDqMarcaPlayerName.length > 0));
  if(ready){
    btn.disabled = false;
    btn.style.background = '#dc2626';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.background = 'var(--border)';
    btn.style.color = 'var(--text-secondary)';
    btn.style.cursor = 'not-allowed';
  }
}

function addDqMarca(){
  if(!_selectedDqMarcaType || !_selectedDqMarcaTarget) return;
  const needsPlayer = _dqMarcaTargetMode === 'individuo';
  const playerInput = document.getElementById('dqMarcaPlayerInput');
  const playerName = playerInput ? playerInput.value.trim() : '';
  if(needsPlayer && !playerName) return;
  const entry = {
    type: _selectedDqMarcaType,
    target: _selectedDqMarcaTarget,
    targetMode: _dqMarcaTargetMode,
    player: needsPlayer ? playerName : null,
    time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})
  };
  _dqLog.push(entry);
  /* Reset selections */
  document.getElementById('dqMarcaTypeBtns')?.querySelectorAll('.dq-marca-type-btn').forEach(b => {
    b.classList.remove('active'); b.style.borderColor='var(--border-dark)'; b.style.background='var(--surface)'; b.style.color='var(--text-secondary)';
  });
  document.getElementById('dqMarcaTargetBtns')?.querySelectorAll('.dq-marca-target-btn').forEach(b => {
    b.classList.remove('active'); b.style.borderColor='var(--border-dark)'; b.style.background='var(--surface)'; b.style.color='var(--text-secondary)';
  });
  _selectedDqMarcaType = null;
  _selectedDqMarcaTarget = null;
  _selectedDqMarcaPlayerName = null;
  _dqMarcaTargetMode = null;
  if(playerInput) playerInput.value = '';
  const playerSection = document.getElementById('dqMarcaPlayerSection');
  if(playerSection) playerSection.style.display = 'none';
  const targetSection = document.getElementById('dqMarcaTargetSection');
  if(targetSection) targetSection.style.display = 'none';
  _updateAddDqMarcaBtn();
  /* Update log display */
  const logEl = document.getElementById('dqMarcaLogEntries');
  if(logEl){
    const shortType = entry.type.length > 35 ? entry.type.substring(0,35)+'…' : entry.type;
    const targetLabel = entry.player
      ? `${entry.target} → ${entry.player}`
      : entry.target;
    const modeTag = entry.targetMode === 'individuo'
      ? '<span style="font-size:9px;padding:1px 6px;border-radius:var(--radius-full);background:#f3f0ff;color:#7c3aed;font-weight:600;margin-left:4px">INDIVIDUO</span>'
      : '<span style="font-size:9px;padding:1px 6px;border-radius:var(--radius-full);background:var(--blue-bg);color:var(--blue-info);font-weight:600;margin-left:4px">EQUIPO</span>';
    logEl.insertAdjacentHTML('afterbegin', `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--radius-md);margin-bottom:6px;animation:fadeInUp .25s cubic-bezier(.4,0,.2,1)">
      <span style="font-size:14px">🚫</span>
      <div style="flex:1;min-width:0">
        <div style="font:600 12px var(--font);color:#dc2626;display:flex;align-items:center;flex-wrap:wrap">${shortType}${modeTag}</div>
        <div style="font:500 11px var(--font);color:var(--text-secondary)">${targetLabel} · ${entry.time}</div>
      </div>
      <button onclick="this.parentElement.remove();_dqLog.pop();document.getElementById('dqMarcaCount').textContent=_dqLog.length+' registro'+(_dqLog.length!==1?'s':'');syncDescalToWinner()" style="width:24px;height:24px;border-radius:var(--radius-full);border:1px solid var(--border);background:var(--surface);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-secondary)">✕</button>
    </div>`);
  }
  const countEl = document.getElementById('dqMarcaCount');
  if(countEl) countEl.textContent = _dqLog.length + ' registro' + (_dqLog.length !== 1 ? 's' : '');
  syncDescalToWinner();
}

/* ═══ Categorized penalties for outcome-based sports (chess, etc.) ═══ */
function buildCategorizedPenalizaciones(sport, match, targets, isVs, excludePerdidas){
  /* Classify penalties by severity */
  const categories = {
    tarjeta: { label:'Tarjetas (otorga punto al rival)', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>', color:'#dc2626', bg:'var(--red-bg)', border:'var(--red-border)', items:[] },
    aumento: { label:'Aumentos de tiempo', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', color:'#b45309', bg:'var(--orange-bg)', border:'var(--orange-border)', items:[] },
    perdida: { label:'Pérdida de partida', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', color:'#dc2626', bg:'var(--red-bg)', border:'var(--red-border)', items:[] },
    deduccion: { label:'Deducciones', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', color:'#7c3aed', bg:'#f3f0ff', border:'#d4c8f5', items:[] }
  };

  sport.penalizaciones.forEach(p => {
    const pl = p.toLowerCase();
    if(pl.includes('tarjeta roja') && (pl.includes('punto') || pl.includes('otorga'))){
      categories.tarjeta.items.push(p);
    } else if(pl.includes('minuto') || pl.includes('aumento') || pl.includes('tiempo')){
      categories.aumento.items.push(p);
    } else if(pl.includes('pérdida') || pl.includes('perdida') || pl.includes('pierde')){
      categories.perdida.items.push(p);
    } else {
      categories.deduccion.items.push(p);
    }
  });

  let html = `<div style="padding:20px 28px">`;

  /* Render each category */
  Object.entries(categories).forEach(([key, cat]) => {
    if(cat.items.length === 0) return;
    if(excludePerdidas && key === 'perdida') return;
    html += `<div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 14px;background:${cat.bg};border:1px solid ${cat.border};border-radius:var(--radius-md)">
        <span style="color:${cat.color};display:flex">${cat.icon}</span>
        <span style="font-size:12px;font-weight:600;color:${cat.color}">${cat.label.toUpperCase()}</span>
        <span style="font-size:10px;color:${cat.color};opacity:.7;margin-left:auto">${cat.items.length} tipo${cat.items.length>1?'s':''}</span>
      </div>`;

    cat.items.forEach(p => {
      const shortP = p.length > 50 ? p.substring(0,50)+'…' : p;
      html += `<div style="margin-bottom:12px;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface)">
        <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:8px">${shortP}</div>
        <div class="stats-counters" style="gap:${isVs?'12px':'16px 20px'};${!isVs?'flex-wrap:wrap':''}">`;

      targets.forEach((t, i) => {
        const tLabel = t.length > 15 ? t.substring(0,15)+'…' : t;
        html += `<div class="stat-counter" style="flex:${isVs?'1':'0 0 auto'};min-width:${isVs?'auto':'110px'}">
          <div class="stat-counter-label">${tLabel}</div>
          <div class="stat-counter-controls">
            <button class="counter-btn" onclick="adjustCounter(this,-1)">−</button>
            <div class="counter-val" data-penal="${p}" data-team="${i+1}">0</div>
            <button class="counter-btn" onclick="adjustCounter(this,1)">+</button>
          </div>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
  });

  /* Applied penalties log */
  html += `<div id="penaltyLog" style="display:none;margin-top:16px;padding:14px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-md)">
    <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      REGISTRO DE PENALIZACIONES
    </div>
    <div id="penaltyLogEntries" style="font-size:11px;color:var(--text-secondary)"></div>
  </div>`;

  html += `</div>`;
  return html;
}

/* ═══ Helper: get active descalificaciones (filtered by coordinator config) ═══ */
function getActiveDescalificaciones(sportKey, sport, comp){
  /* For atletismo: resolve sub-modalidad specific descalificaciones */
  let all = sport.descalificaciones || [];
  if(comp && comp.atletismoModalidad && sport.modalidades){
    const subMod = _resolveAtletismoSubModalidad(comp);
    if(subMod && sport.modalidades[subMod] && sport.modalidades[subMod].descalificaciones){
      all = sport.modalidades[subMod].descalificaciones;
    }
  }
  /* Normalize: if entries are objects {texto, target}, extract texto for standard flow */
  const normalized = all.map(d => typeof d === 'object' ? d.texto : d);
  try {
    const configs = JSON.parse(localStorage.getItem('naowee_comp_configs') || '{}');
    const cfg = configs[sportKey];
    if(cfg && cfg.descalificaciones){
      const filtered = normalized.filter(d => cfg.descalificaciones.includes(d));
      if(filtered.length > 0) return filtered;
      /* If localStorage filter yields empty but sport has descalificaciones, show all (stale config) */
    }
  } catch(e){}
  return normalized;
}

/* ═══ Tab: Descalificaciones ═══ */
function buildDescalificacionesTab(sport, match, isVs, sportKey, perdidaPenalties, comp){
  const participants = isVs ? match.teams.slice(0,2) : ((match.participants && match.participants.length > 0) ? match.participants : (match.teams && match.teams.length >= 2 ? match.teams.slice(0,2) : ['Equipo 1','Equipo 2']));
  const descals = getActiveDescalificaciones(sportKey, sport, comp);
  const _pp = perdidaPenalties || [];
  const ss = sport.scoringSystem;
  const _isOutcome = ss && (ss.tablas !== undefined || ss.empate !== undefined);
  const isDuelo = sport.tipoEnfrentamiento && sport.tipoEnfrentamiento.toLowerCase().includes('duelo');
  const _isInfraction = _isOutcome || (isDuelo && sport.puntosSet);
  const isRondaMode = _rondaMatches.length > 1 && isDuelo && participants.length >= 2;

  let html = `<div style="padding:20px 28px">`;

  /* ══ UNIFIED FLOATING DROPDOWN DQ SYSTEM ══ */
  const allDqs = [...descals];
  _pp.forEach(p => allDqs.push(p));
  const hasParticipantsList = match.participants && match.participants.length > 0;
  const needsPlayerInput = sport.descalificacionPorJugador && isDuelo && !hasParticipantsList;

  /* Init state */
  _dqDdState = { selectedType: null, selectedTarget: null, playerName: '', log: [],
    allDqs, participants, isDuelo, hasParticipantsList, needsPlayerInput };

  html += `<div style="padding:16px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <!-- Dropdown 1: Tipo -->
      <div style="min-width:0">
        <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">TIPO DE DESCALIFICACIÓN</div>
        <div class="float-dd-wrap" style="display:block;width:100%" id="dqTypeWrap">
          <div class="float-dd-trigger" id="dqTypeTrigger" onclick="toggleDqDd('type')" style="min-height:42px;font-size:12px">
            Seleccionar tipo
          </div>
          <div class="float-dd-menu" id="dqTypeMenu" style="width:100%;min-width:0">
            ${allDqs.map((d,i) => {
              const shortD = d.length > 45 ? d.substring(0,45)+'…' : d;
              return `<div class="float-dd-opt" data-idx="${i}" onclick="pickDqType(${i})">${shortD}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <!-- Dropdown 2: Aplicar a -->
      <div style="min-width:0">
        <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">APLICAR A</div>
        <div class="float-dd-wrap" style="display:block;width:100%" id="dqTargetWrap">
          <div class="float-dd-trigger" id="dqTargetTrigger" onclick="toggleDqDd('target')" style="min-height:42px;font-size:12px">
            Seleccionar
          </div>
          <div class="float-dd-menu" id="dqTargetMenu" style="width:100%;min-width:0">
            ${participants.map((p,i) => {
              return `<div class="float-dd-opt" data-idx="${i}" data-name="${p}" onclick="pickDqTarget('${p.replace(/'/g,"\\'")}')">${p}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
    <!-- Player input (only for descalificacionPorJugador duelos) -->
    ${needsPlayerInput ? `<div id="dqDdPlayerSection" style="margin-bottom:14px;display:none">
      <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">DEPORTISTA (nombre o número)</div>
      <input type="text" id="dqDdPlayerInput" placeholder="Ej: #7 Juan Pérez" oninput="_updateDqDdRegisterBtn()" style="
        width:100%;padding:10px 14px;border:1.5px solid var(--border-dark);border-radius:var(--radius-md);
        font:500 13px var(--font);color:var(--text-primary);background:var(--surface);outline:none;box-sizing:border-box"
        onfocus="this.style.borderColor='var(--accent)';this.style.boxShadow='0 0 0 3px rgba(215,64,9,.1)'"
        onblur="this.style.borderColor='var(--border-dark)';this.style.boxShadow='none'"/>
    </div>` : ''}
    <!-- Register button -->
    <button type="button" id="dqDdRegisterBtn" onclick="registerDqDd()" disabled style="
      width:100%;padding:10px;border-radius:var(--radius-md);border:none;background:var(--border);font:600 12px var(--font);
      color:var(--text-secondary);cursor:not-allowed;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px">
      Registrar descalificación
    </button>
  </div>
  <!-- Log -->
  <div style="margin-top:14px">
    <div style="font:600 11px var(--font);color:var(--text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:6px;letter-spacing:.3px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      REGISTRO <span id="dqDdLogCount" style="padding:2px 8px;border-radius:var(--radius-full);background:var(--red-bg);color:#dc2626;font:600 10px var(--font)">0</span>
    </div>
    <div id="dqDdLogEntries" style="display:flex;flex-direction:column;gap:6px">
      <div style="font:500 12px var(--font);color:var(--text-secondary);font-style:italic">Sin descalificaciones registradas</div>
    </div>
  </div>`;

  html += `</div>`;
  return html;
}

function toggleDescal(el){
  /* Only toggle expand/collapse — never clear checked state */
  el.classList.toggle('open');
}

/* ═══ UNIFIED DQ FLOATING DROPDOWN SYSTEM ═══ */
let _dqDdState = null;

function toggleDqDd(which){
  const typeT = document.getElementById('dqTypeTrigger');
  const typeM = document.getElementById('dqTypeMenu');
  const targT = document.getElementById('dqTargetTrigger');
  const targM = document.getElementById('dqTargetMenu');
  if(which === 'type'){
    const isOpen = typeM && typeM.classList.contains('open');
    if(targM){ targM.classList.remove('open'); targT.classList.remove('open'); }
    if(typeM){ typeM.classList.toggle('open', !isOpen); }
    if(typeT){ typeT.classList.toggle('open', !isOpen); }
  } else {
    const isOpen = targM && targM.classList.contains('open');
    if(typeM){ typeM.classList.remove('open'); typeT.classList.remove('open'); }
    if(targM){ targM.classList.toggle('open', !isOpen); }
    if(targT){ targT.classList.toggle('open', !isOpen); }
  }
}

function pickDqType(idx){
  if(!_dqDdState) return;
  _dqDdState.selectedType = idx;
  const label = _dqDdState.allDqs[idx] || '';
  const shortLabel = label.length > 35 ? label.substring(0,35)+'…' : label;
  const trigger = document.getElementById('dqTypeTrigger');
  if(trigger){
    trigger.textContent = shortLabel;
    trigger.style.color = '#dc2626';
    trigger.style.borderColor = '#dc2626';
    trigger.style.background = 'var(--red-bg)';
  }
  /* Mark selected in menu */
  document.querySelectorAll('#dqTypeMenu .float-dd-opt').forEach((o,i) => {
    o.classList.toggle('selected', i === idx);
  });
  document.getElementById('dqTypeTrigger')?.classList.remove('open');
  document.getElementById('dqTypeMenu')?.classList.remove('open');
  _updateDqDdRegisterBtn();
}

function pickDqTarget(name){
  if(!_dqDdState) return;
  _dqDdState.selectedTarget = name;
  const trigger = document.getElementById('dqTargetTrigger');
  if(trigger){
    trigger.textContent = name.length > 25 ? name.substring(0,25)+'…' : name;
    trigger.style.color = 'var(--accent)';
    trigger.style.borderColor = 'var(--accent)';
    trigger.style.background = 'var(--orange-bg)';
  }
  /* Mark selected in menu */
  document.querySelectorAll('#dqTargetMenu .float-dd-opt').forEach(o => {
    o.classList.toggle('selected', o.dataset.name === name);
  });
  document.getElementById('dqTargetTrigger')?.classList.remove('open');
  document.getElementById('dqTargetMenu')?.classList.remove('open');
  /* Show player input if needed */
  if(_dqDdState.needsPlayerInput){
    const sec = document.getElementById('dqDdPlayerSection');
    if(sec){ sec.style.display = ''; sec.style.animation = 'fadeInUp .3s cubic-bezier(.4,0,.2,1)'; }
  }
  _updateDqDdRegisterBtn();
}

function _updateDqDdRegisterBtn(){
  const btn = document.getElementById('dqDdRegisterBtn');
  if(!btn || !_dqDdState) return;
  const hasType = _dqDdState.selectedType !== null;
  const hasTarget = !!_dqDdState.selectedTarget;
  const needsPlayer = _dqDdState.needsPlayerInput;
  const hasPlayer = needsPlayer ? !!(document.getElementById('dqDdPlayerInput')?.value?.trim()) : true;
  const ready = hasType && hasTarget && hasPlayer;
  btn.disabled = !ready;
  btn.style.background = ready ? 'var(--accent)' : 'var(--border)';
  btn.style.color = ready ? '#fff' : 'var(--text-secondary)';
  btn.style.cursor = ready ? 'pointer' : 'not-allowed';
}

function registerDqDd(){
  if(!_dqDdState || _dqDdState.selectedType === null || !_dqDdState.selectedTarget) return;
  const typeLabel = _dqDdState.allDqs[_dqDdState.selectedType] || 'Descalificación';
  const target = _dqDdState.selectedTarget;
  const playerInput = document.getElementById('dqDdPlayerInput');
  const player = playerInput?.value?.trim() || '';

  const entry = {
    id: Date.now(), typeLabel, target, player,
    time: new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
  };
  _dqDdState.log.push(entry);

  /* Reset form */
  _dqDdState.selectedType = null;
  _dqDdState.selectedTarget = null;
  const typeTrigger = document.getElementById('dqTypeTrigger');
  if(typeTrigger){ typeTrigger.textContent = 'Seleccionar tipo'; typeTrigger.style.color=''; typeTrigger.style.borderColor=''; typeTrigger.style.background=''; }
  const targetTrigger = document.getElementById('dqTargetTrigger');
  if(targetTrigger){ targetTrigger.textContent = 'Seleccionar'; targetTrigger.style.color=''; targetTrigger.style.borderColor=''; targetTrigger.style.background=''; }
  document.querySelectorAll('#dqTypeMenu .float-dd-opt, #dqTargetMenu .float-dd-opt').forEach(o => o.classList.remove('selected'));
  if(playerInput) playerInput.value = '';
  const playerSec = document.getElementById('dqDdPlayerSection');
  if(playerSec) playerSec.style.display = 'none';
  _updateDqDdRegisterBtn();
  _renderDqDdLog();
  syncDescalToWinner();
}

function removeDqDdEntry(id){
  if(!_dqDdState) return;
  _dqDdState.log = _dqDdState.log.filter(e => e.id !== id);
  _renderDqDdLog();
  syncDescalToWinner();
}

function _renderDqDdLog(){
  if(!_dqDdState) return;
  const container = document.getElementById('dqDdLogEntries');
  const countEl = document.getElementById('dqDdLogCount');
  if(!container) return;
  if(countEl) countEl.textContent = _dqDdState.log.length;

  if(_dqDdState.log.length === 0){
    container.innerHTML = `<div style="font:500 12px var(--font);color:var(--text-secondary);font-style:italic">Sin descalificaciones registradas</div>`;
    return;
  }
  container.innerHTML = _dqDdState.log.map(e => {
    const displayTarget = e.player ? `${e.target} (${e.player})` : e.target;
    const shortType = e.typeLabel.length > 40 ? e.typeLabel.substring(0,40)+'…' : e.typeLabel;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--radius-md);animation:fadeInUp .25s cubic-bezier(.4,0,.2,1)">
      <div style="width:28px;height:28px;border-radius:50%;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font:600 12px var(--font);color:#dc2626;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${displayTarget}</div>
        <div style="font:500 11px var(--font);color:#991b1b;opacity:.7;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${shortType}</div>
      </div>
      <span style="font:500 10px var(--font);color:var(--text-secondary);flex-shrink:0">${e.time}</span>
      <button onclick="removeDqDdEntry(${e.id})" style="padding:4px 8px;border:1px solid var(--border-dark);border-radius:var(--radius-sm);background:var(--surface);font:500 10px var(--font);color:var(--text-secondary);cursor:pointer;flex-shrink:0" onmouseover="this.style.borderColor='#dc2626';this.style.color='#dc2626'" onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">✕</button>
    </div>`;
  }).join('');
}

function _flashDqHint(msg){
  const container = document.getElementById('dqPlayerLog');
  if(!container) return;
  const hint = document.createElement('div');
  hint.style.cssText = 'padding:8px 14px;background:#fff3e6;border:1px solid var(--orange-border);border-radius:var(--radius-md);font:500 12px var(--font);color:var(--accent);text-align:center;animation:fadeInUp .2s';
  hint.textContent = '⚠ ' + msg;
  container.prepend(hint);
  setTimeout(() => hint.remove(), 2500);
}

function toggleDescalParticipant(row, descalIdx){
  row.classList.toggle('checked');
  /* Ensure parent shows "selected" state (red border) when has checks */
  const item = row.closest('.descal-item');
  const checked = item.querySelectorAll('.descal-p-row.checked').length;
  if(checked > 0){
    item.classList.add('selected');
  } else {
    item.classList.remove('selected');
  }
  /* Update count badge */
  const countEl = document.getElementById('descalCount-'+descalIdx);
  if(countEl) countEl.textContent = checked;
  /* Sync: disable this participant in OTHER descal categories + winner */
  syncDescalCrossItems();
  syncDescalToWinner();
}

/* Disable descalified participants in other descal categories */
function syncDescalCrossItems(){
  /* Collect all checked participant names per descal-item index */
  const allDescalItems = document.querySelectorAll('.descal-item:not(.stat-item)');
  /* Build set of (participantName → descalIdx) for all checked */
  const checkedMap = new Map(); // participantName → Set of descalIdx
  allDescalItems.forEach(item => {
    const idx = item.dataset.descal;
    item.querySelectorAll('.descal-p-row.checked').forEach(row => {
      const name = row.dataset.participant;
      if(!checkedMap.has(name)) checkedMap.set(name, new Set());
      checkedMap.get(name).add(idx);
    });
  });
  /* For each descal-item, disable participants that are checked in a DIFFERENT item */
  allDescalItems.forEach(item => {
    const idx = item.dataset.descal;
    item.querySelectorAll('.descal-p-row').forEach(row => {
      const name = row.dataset.participant;
      const checkedIn = checkedMap.get(name);
      if(checkedIn && !checkedIn.has(idx)){
        /* Checked in another category — disable here */
        row.classList.add('disabled');
      } else {
        row.classList.remove('disabled');
      }
    });
  });
}

/* Sync descalified participants to winner section — disable them or auto-select opponent */
function syncDescalToWinner(){
  const winnerOpts = document.querySelectorAll('.winner-opt[data-participant-name]');
  if(!winnerOpts.length) return;
  const isPodium = !!document.querySelector('.winner-options[data-podium="true"]');
  /* Collect all descalified participant names from ALL DQ systems */
  const descalifiedNames = new Set();
  /* 1. Legacy checkbox system */
  document.querySelectorAll('.descal-p-row.checked .descal-p-name').forEach(el => {
    descalifiedNames.add(el.textContent.trim());
  });
  /* 2. Floating dropdown DQ system (_dqDdState.log) */
  if(typeof _dqDdState !== 'undefined' && _dqDdState && _dqDdState.log){
    _dqDdState.log.forEach(e => { if(e.target) descalifiedNames.add(e.target); });
  }
  /* 3. Marca DQ system (_dqLog) */
  if(typeof _dqLog !== 'undefined' && _dqLog && _dqLog.length){
    _dqLog.forEach(e => { if(e.target) descalifiedNames.add(e.target); });
  }
  let needsReorder = false;
  winnerOpts.forEach(opt => {
    const name = opt.dataset.participantName;
    if(descalifiedNames.has(name)){
      opt.classList.add('descalified');
      if(opt.classList.contains('selected') || opt.dataset.position){
        opt.classList.remove('selected','pos-1','pos-2','pos-3');
        opt.removeAttribute('data-position');
        opt.querySelector('.winner-tag').textContent = '';
        needsReorder = true;
      }
    } else {
      opt.classList.remove('descalified');
    }
  });
  /* Reorder podium positions if someone was removed */
  if(isPodium && needsReorder){
    const remaining = Array.from(document.querySelectorAll('.winner-opt[data-position]'))
      .sort((a,b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
    remaining.forEach((opt, i) => {
      const newPos = i + 1;
      opt.dataset.position = newPos;
      opt.classList.remove('pos-1','pos-2','pos-3');
      opt.classList.add('selected', _podiumClasses[newPos - 1]);
      opt.querySelector('.winner-tag').textContent = _podiumLabels[newPos - 1];
    });
  }
  /* Auto-select opponent as winner in VS matches (2 teams, non-podium) */
  if(!isPodium){
    const nonDescalified = Array.from(winnerOpts).filter(o => !o.classList.contains('descalified') && o.dataset.winner !== 'empate');
    if(descalifiedNames.size > 0 && nonDescalified.length === 1){
      const ws = document.querySelector('.winner-section');
      if(ws) ws.style.display = '';
      document.querySelectorAll('.winner-opt').forEach(o => o.classList.remove('selected'));
      nonDescalified[0].classList.add('selected');
      if(ws){
        ws.style.transition = 'background .3s';
        ws.style.background = 'var(--green-bg)';
        setTimeout(() => { ws.style.background = ''; }, 1200);
      }
    } else if(descalifiedNames.size === 0){
      document.querySelectorAll('.winner-opt').forEach(o => o.classList.remove('selected'));
    }
  }
  checkSaveReady();
}

/* ═══ Ronda DQ System: infraction selection + player toggle ═══ */
let _selectedDqInfraction = null; /* { id, tipo, label } */

function switchDqRonda(rIdx){
  const _tealDq = '#0891b2';
  const _tealBgDq = '#ecfeff';
  document.querySelectorAll('.dq-ronda-chip').forEach((c, i) => {
    const active = i === rIdx;
    c.classList.toggle('active', active);
    c.style.border = `1.5px solid ${active?_tealDq:'var(--border-dark)'}`;
    c.style.background = active ? _tealBgDq : 'var(--surface)';
    c.style.color = active ? _tealDq : 'var(--text-secondary)';
  });
  document.querySelectorAll('.dq-ronda-panel').forEach((p, i) => {
    p.style.display = i === rIdx ? '' : 'none';
  });
}

function selectDqInfraction(btnEl){
  const wasActive = btnEl.classList.contains('dq-sel');
  document.querySelectorAll('.dq-infraction-btn').forEach(b => {
    b.classList.remove('dq-sel');
    b.style.border = '1.5px solid var(--border)';
    b.style.background = 'var(--surface)';
  });
  const pairingsWrap = document.getElementById('dqRondaPairings');
  if(wasActive){
    _selectedDqInfraction = null;
    if(pairingsWrap) pairingsWrap.style.display = 'none';
    return;
  }
  btnEl.classList.add('dq-sel');
  const tipo = btnEl.dataset.dqTipo;
  btnEl.style.border = `1.5px solid ${tipo==='perdida'?'#dc2626':'#7c3aed'}`;
  btnEl.style.background = tipo==='perdida'?'var(--red-bg)':'#f3f0ff';
  _selectedDqInfraction = { id: btnEl.dataset.dqId, tipo, label: btnEl.querySelector('span:nth-child(2)').textContent };
  if(pairingsWrap) pairingsWrap.style.display = '';
}

function toggleDqPlayer(btnEl){
  if(!_selectedDqInfraction){
    /* Flash the infraction list to guide user */
    const list = document.getElementById('dqInfractionList');
    if(list){ list.style.transition='background .3s'; list.style.background='var(--orange-bg)'; setTimeout(()=>{list.style.background='';},800); }
    return;
  }
  const rIdx = parseInt(btnEl.dataset.ronda);
  const pIdx = parseInt(btnEl.dataset.pidx);
  const pName = btnEl.dataset.pname;

  if(!_rondaDqMap[rIdx]) _rondaDqMap[rIdx] = {};

  if(_rondaDqMap[rIdx][pIdx]){
    /* Remove existing DQ */
    delete _rondaDqMap[rIdx][pIdx];
    btnEl.classList.remove('dq-active');
    btnEl.style.border = '1.5px solid var(--border-dark)';
    btnEl.style.background = 'var(--surface)';
    btnEl.style.color = 'var(--text-primary)';
    btnEl.querySelector('.dq-pname').textContent = pName;
    /* Remove DQ from scores — revert to unscored */
    _revertDqScore(rIdx, pIdx);
  } else {
    /* Apply DQ */
    _rondaDqMap[rIdx][pIdx] = { tipo: _selectedDqInfraction.tipo, descripcion: _selectedDqInfraction.label, id: _selectedDqInfraction.id };
    btnEl.classList.add('dq-active');
    btnEl.style.border = '1.5px solid #dc2626';
    btnEl.style.background = '#fef2f2';
    btnEl.style.color = '#dc2626';
    btnEl.querySelector('.dq-pname').textContent = pName;
    /* Apply DQ to scores: infractor gets 0 (derrota), opponent gets victoria */
    _applyDqScore(rIdx, pIdx);
  }

  /* Update pair card visual */
  const pairCard = btnEl.closest('.dq-pair-card');
  if(pairCard){
    const hasDq = pairCard.querySelectorAll('.dq-active').length > 0;
    pairCard.style.border = `1px solid ${hasDq?'var(--red-border)':'var(--border)'}`;
    pairCard.style.background = hasDq?'var(--red-bg)':'var(--surface)';
  }

  _renderDqSummary();
  updateAcumulado();
}

function _applyDqScore(rIdx, pIdx){
  const comp = _resolveComp(_rondaCompId);
  const sport = comp ? SPORTS_DB[comp.sport] : {};
  const ss = sport.scoringSystem || {};
  if(!_rondaScores[rIdx]) _rondaScores[rIdx] = {};
  _rondaScores[rIdx][pIdx] = ss.derrota || 0;

  /* Find opponent in the same pair */
  const match = _rondaMatches[rIdx];
  const parts = match?.participants || [];
  const pairStart = (pIdx % 2 === 0) ? pIdx : pIdx - 1;
  const opponentIdx = (pIdx === pairStart) ? pairStart + 1 : pairStart;
  if(opponentIdx < parts.length && !_rondaDqMap[rIdx]?.[opponentIdx]){
    _rondaScores[rIdx][opponentIdx] = ss.victoria || 1;
  }

  /* If currently viewing this ronda, update DOM */
  if(rIdx === _rondaCurrentIdx){
    const ptsEl = document.getElementById('rondaPts_' + pIdx);
    if(ptsEl){ ptsEl.textContent = ss.derrota || 0; ptsEl.style.color = '#dc2626'; }
    const optEl = document.getElementById('rondaPts_' + opponentIdx);
    if(optEl && !_rondaDqMap[rIdx]?.[opponentIdx]){ optEl.textContent = ss.victoria || 1; optEl.style.color = 'var(--green)'; }
    /* Activate duel outcome visually */
    const cards = document.querySelectorAll('.duel-card');
    const pairIdx = Math.floor(pIdx / 2);
    if(cards[pairIdx]){
      cards[pairIdx].querySelectorAll('.duel-outcome-btn').forEach(b => {
        b.classList.remove('active');
        b.style.border = '1.5px solid var(--border-dark)';
        b.style.background = 'var(--surface)';
        b.style.color = 'var(--text-secondary)';
      });
      const winResult = pIdx % 2 === 0 ? 'b-wins' : 'a-wins';
      const winBtn = cards[pairIdx].querySelector(`[data-result="${winResult}"]`);
      if(winBtn){
        winBtn.classList.add('active');
        winBtn.style.border = '1.5px solid var(--green-border)';
        winBtn.style.background = 'var(--green-bg)';
        winBtn.style.color = 'var(--green)';
      }
    }
  }
}

function _revertDqScore(rIdx, pIdx){
  /* Remove forced scores */
  if(_rondaScores[rIdx]){
    delete _rondaScores[rIdx][pIdx];
    const match = _rondaMatches[rIdx];
    const parts = match?.participants || [];
    const pairStart = (pIdx % 2 === 0) ? pIdx : pIdx - 1;
    const opponentIdx = (pIdx === pairStart) ? pairStart + 1 : pairStart;
    if(!_rondaDqMap[rIdx]?.[opponentIdx]){
      delete _rondaScores[rIdx][opponentIdx];
    }
  }
  /* If currently viewing this ronda, refresh the table */
  if(rIdx === _rondaCurrentIdx){
    const comp = _resolveComp(_rondaCompId);
    const sport = comp ? SPORTS_DB[comp.sport] : {};
    const puntDesc = sport.descPuntuacion || 'Puntos';
    const match = _rondaMatches[rIdx];
    const tableWrap = document.getElementById('rondaTableWrap');
    if(tableWrap) tableWrap.innerHTML = buildRondaTable(match.participants || [], puntDesc);
  }
}

function _renderDqSummary(){
  const log = document.getElementById('dqSummaryLog');
  const entries = document.getElementById('dqSummaryEntries');
  if(!log || !entries) return;
  let items = [];
  Object.entries(_rondaDqMap).forEach(([rIdx, pMap]) => {
    const rm = _rondaMatches[parseInt(rIdx)];
    Object.entries(pMap).forEach(([pIdx, info]) => {
      const match = _rondaMatches[parseInt(rIdx)];
      const pName = match?.participants?.[parseInt(pIdx)] || `Jugador ${parseInt(pIdx)+1}`;
      const pairIdx = Math.floor(parseInt(pIdx) / 2) + 1;
      items.push({ronda: rm?.phase||'Ronda ?', tablero: pairIdx, jugador: pName, tipo: info.tipo, desc: info.descripcion, rIdx: parseInt(rIdx), pIdx: parseInt(pIdx)});
    });
  });
  if(items.length === 0){ log.style.display='none'; return; }
  log.style.display = '';
  let html = '';
  items.forEach(item => {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:4px;border-radius:var(--radius-sm);background:var(--red-bg);border:1px solid var(--red-border)">
      <span style="font-size:12px">${item.tipo==='perdida'?'⛔':'🚫'}</span>
      <span style="font-size:11px;font-weight:600;color:#dc2626">${item.ronda}</span>
      <span style="font-size:10px;color:var(--text-secondary)">T${item.tablero}</span>
      <span style="font-size:11px;font-weight:500;color:var(--text-primary)">${item.jugador}</span>
      <span style="font-size:10px;color:var(--text-secondary);flex:1;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">${item.desc}</span>
      <button onclick="_removeDqEntry(${item.rIdx},${item.pIdx})" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:14px;padding:2px 4px" title="Quitar">×</button>
    </div>`;
  });
  entries.innerHTML = html;

  /* Update DQ count badges on ronda chips */
  document.querySelectorAll('.dq-ronda-chip').forEach(chip => {
    const r = parseInt(chip.dataset.ronda);
    const count = _rondaDqMap[r] ? Object.keys(_rondaDqMap[r]).length : 0;
    let badge = chip.querySelector('.dq-chip-badge');
    if(count > 0){
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'dq-chip-badge';
        badge.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#dc2626;color:#fff;font:600 9px var(--font);display:inline-flex;align-items:center;justify-content:center';
        chip.appendChild(badge);
      }
      badge.textContent = count;
    } else if(badge){
      badge.remove();
    }
  });
}

function _removeDqEntry(rIdx, pIdx){
  if(_rondaDqMap[rIdx]){
    delete _rondaDqMap[rIdx][pIdx];
    if(Object.keys(_rondaDqMap[rIdx]).length === 0) delete _rondaDqMap[rIdx];
  }
  _revertDqScore(rIdx, pIdx);
  /* Update button visuals */
  const btn = document.querySelector(`.dq-player-btn[data-ronda="${rIdx}"][data-pidx="${pIdx}"]`);
  if(btn){
    btn.classList.remove('dq-active');
    btn.style.border = '1.5px solid var(--border-dark)';
    btn.style.background = 'var(--surface)';
    btn.style.color = 'var(--text-primary)';
  }
  const pairCard = btn?.closest('.dq-pair-card');
  if(pairCard){
    const hasDq = pairCard.querySelectorAll('.dq-active').length > 0;
    pairCard.style.border = `1px solid ${hasDq?'var(--red-border)':'var(--border)'}`;
    pairCard.style.background = hasDq?'var(--red-bg)':'var(--surface)';
  }
  _renderDqSummary();
  updateAcumulado();
}

/* ═══ Tab: Estadísticas Complementarias ═══ */
function buildEstadisticasTab(sport, match, isVs, comp){
  /* Resolve atletismo sub-modalidad specific stats */
  let stats = sport.estadisticasComplementarias;
  if(comp && comp.atletismoModalidad && sport.modalidades){
    const subMod = _resolveAtletismoSubModalidad(comp);
    if(subMod && sport.modalidades[subMod] && sport.modalidades[subMod].estadisticasComplementarias){
      stats = sport.modalidades[subMod].estadisticasComplementarias;
    }
  }
  const ss = sport.scoringSystem;
  const hasOutcomes = ss && (ss.tablas !== undefined || ss.empate !== undefined);
  const isDuelo = sport.tipoEnfrentamiento && sport.tipoEnfrentamiento.toLowerCase().includes('duelo');

  /* ── Incident log mode for Duelo sports AND marca/individual sports (atletismo, etc.) ── */
  const _isMarcaSport = sport.puntuacion === 'marca' || sport.puntuacion === 'jueces';
  if(hasOutcomes || isDuelo || _isMarcaSport){
    return buildIncidentLogTab(sport, match, isVs);
  }

  /* ── Default: counters ── */
  const t1 = match.teams && match.teams[0] ? match.teams[0] : 'Equipo 1';
  const t2 = match.teams && match.teams[1] ? match.teams[1] : 'Equipo 2';
  let html = `<div style="padding:20px 28px">
    <div class="stats-section-title">📊 ESTADÍSTICAS COMPLEMENTARIAS</div>`;
  if(isVs){
    stats.forEach(s => {
      const shortS = s.length > 40 ? s.substring(0,40)+'…' : s;
      html += `<div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-align:center">📈 ${shortS.toUpperCase()}</div>
        <div class="stats-counters">
          <div class="stat-counter"><div class="stat-counter-label">${t1}</div><div class="stat-counter-controls"><button class="counter-btn" onclick="adjustCounter(this,-1)">−</button><div class="counter-val">0</div><button class="counter-btn" onclick="adjustCounter(this,1)">+</button></div></div>
          <div class="stat-counter"><div class="stat-counter-label">${t2}</div><div class="stat-counter-controls"><button class="counter-btn" onclick="adjustCounter(this,-1)">−</button><div class="counter-val">0</div><button class="counter-btn" onclick="adjustCounter(this,1)">+</button></div></div>
        </div>
      </div>`;
    });
  } else {
    const participants = match.participants || match.teams || [];
    html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Selecciona la estadística y marca los competidores afectados</div>`;
    stats.forEach((s, i) => {
      const shortS = s.length > 60 ? s.substring(0,60)+'…' : s;
      html += `<div class="descal-item stat-item" data-stat="${i}">
        <div class="descal-header" onclick="toggleStatItem(this.parentElement)">
          <div class="descal-icon">📈</div>
          <div class="descal-text">${shortS}</div>
          <span class="descal-count stat-count" id="statCount-${i}">0</span>
          <svg class="descal-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </div>
        <div class="descal-participants">
          ${participants.map((p, pIdx) => `<div class="descal-p-row stat-p-row" onclick="toggleStatParticipant(this, ${i})">
            <div class="descal-p-check stat-p-check">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="descal-p-name">${p}</span>
          </div>`).join('')}
        </div>
      </div>`;
    });
  }
  html += `</div>`;
  return html;
}

/* ═══ Incident log for outcome-based sports ═══ */
let _incidentLog = [];

function buildIncidentLogTab(sport, match, isVs){
  const stats = sport.estadisticasComplementarias;
  const isVsMatch = isVs || (match.teams && match.teams.length >= 2);
  /* Build targets: for individual/ronda sports use participants; for vs use teams; always guarantee at least 2 */
  let targets;
  if(match.participants && match.participants.length >= 2){
    targets = match.participants;
  } else if(isVsMatch && match.teams){
    targets = match.teams.slice(0,2);
    if(targets.length < 2) targets.push(targets[0] === 'Equipo 1' ? 'Equipo 2' : 'Equipo 1');
  } else {
    targets = [match.teams?.[0] || 'Equipo 1', match.teams?.[1] || 'Equipo 2'];
    if(targets[0] === targets[1]) targets[1] = 'Equipo 2';
  }
  const isDuelo = sport.tipoEnfrentamiento && sport.tipoEnfrentamiento.toLowerCase().includes('duelo');
  const isRondaIncident = _rondaMatches.length > 1 && targets.length >= 2;

  let html = `<div style="padding:20px 28px">`;

  /* ── Game Stats section (estadisticasJuego) ── */
  const gameStats = sport.estadisticasJuego;
  if(gameStats && gameStats.length > 0 && isVsMatch){
    const gt1 = (match.teams && match.teams[0]) ? match.teams[0] : 'Equipo 1';
    const gt2 = (match.teams && match.teams[1]) ? match.teams[1] : 'Equipo 2';
    html += `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span style="font:600 14px var(--font);color:var(--text-primary)">Estadísticas de juego</span>
      </div>
      <div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#fafbfd">
              <th style="font:600 11px var(--font);color:var(--text-secondary);padding:10px 14px;text-align:left;letter-spacing:.3px">ESTADÍSTICA</th>
              <th style="font:600 11px var(--font);color:var(--text-secondary);padding:10px 8px;text-align:center;letter-spacing:.3px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${gt1}</th>
              <th style="font:600 11px var(--font);color:var(--text-secondary);padding:10px 8px;text-align:center;letter-spacing:.3px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${gt2}</th>
            </tr>
          </thead>
          <tbody>
            ${gameStats.map((gs, i) => `<tr style="border-top:1px solid var(--border)">
              <td style="font:500 12px var(--font);color:var(--text-primary);padding:8px 14px">${gs}</td>
              <td style="padding:6px 4px;text-align:center">
                <div style="display:inline-flex;align-items:center;gap:4px">
                  <button type="button" onclick="adjustGameStat(this,-1)" style="width:28px;height:28px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">−</button>
                  <span class="game-stat-val" data-stat="${i}" data-team="1" style="font:600 15px var(--font);color:var(--text-primary);min-width:24px;text-align:center">0</span>
                  <button type="button" onclick="adjustGameStat(this,1)" style="width:28px;height:28px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">+</button>
                </div>
              </td>
              <td style="padding:6px 4px;text-align:center">
                <div style="display:inline-flex;align-items:center;gap:4px">
                  <button type="button" onclick="adjustGameStat(this,-1)" style="width:28px;height:28px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">−</button>
                  <span class="game-stat-val" data-stat="${i}" data-team="2" style="font:600 15px var(--font);color:var(--text-primary);min-width:24px;text-align:center">0</span>
                  <button type="button" onclick="adjustGameStat(this,1)" style="width:28px;height:28px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border-dark)';this.style.color='var(--text-secondary)'">+</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  /* ── Header ── */
  if(stats && stats.length > 0){
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <span style="font-size:14px;font-weight:600;color:var(--text-primary)">Registro de incidencias</span>
    </div>
    <span style="font-size:11px;color:var(--text-secondary)" id="incidentCount">0 registros</span>
  </div>`;

  /* ── Quick add form ── */
  html += `<div style="padding:16px;background:#fafbfd;border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:18px;overflow:visible">`;

  const _targetLabel = isVsMatch ? 'Seleccionar equipo' : 'Seleccionar participante';

  /* Step 1+2: Type + Target dropdowns side by side */
  html += `<div style="display:flex;gap:10px;margin-bottom:12px">
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">TIPO DE INCIDENCIA</div>
      <div class="float-dd-wrap" style="display:block;width:100%" id="incidentTypeWrap">
        <div class="float-dd-trigger" id="incidentTypeTrigger" onclick="toggleIncidentDd('type')" style="width:100%;text-align:left;font-size:12px">
          Seleccionar incidencia
        </div>
        <div class="float-dd-menu" id="incidentTypeMenu" style="width:100%;min-width:0">
          ${stats.map((s, i) => `<div class="float-dd-opt" data-idx="${i}" data-full="${s.replace(/"/g,'&quot;')}"
            onclick="pickIncidentType(this,${i})">
            ${s}
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">¿A QUIÉN?</div>
      <div class="float-dd-wrap" style="display:block;width:100%" id="incidentTargetWrap">
        <div class="float-dd-trigger" id="incidentTargetTrigger" onclick="toggleIncidentDd('target')" style="width:100%;text-align:left;font-size:12px">
          ${(isRondaIncident && isDuelo) ? 'Selecciona ronda primero' : _targetLabel}
        </div>
        <div class="float-dd-menu" id="incidentTargetMenu" style="width:100%;min-width:0">`;

  if(!(isRondaIncident && isDuelo)){
    html += targets.map((t, i) => `<div class="float-dd-opt" data-idx="${i}" data-name="${t.replace(/"/g,'&quot;')}"
      onclick="pickIncidentTarget(this,${i})">
      ${t}
    </div>`).join('');
  }

  html += `</div>
      </div>
    </div>
  </div>`;

  /* Step 1.5: Ronda + Pairing selector (only for ronda mode) */
  if(isRondaIncident){
    html += `<div style="margin-bottom:12px" id="incidentRondaSection">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">¿EN QUÉ RONDA?</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px" id="incidentRondaBtns">
        ${_rondaMatches.map((rm, i) => `<button type="button" class="incident-ronda-btn" data-ronda="${i}"
          onclick="selectIncidentRonda(this)"
          style="padding:6px 12px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s">
          ${rm.phase}
        </button>`).join('')}
      </div>`;

    if(isDuelo){
      html += `<div id="incidentPairingWrap" style="margin-top:8px;display:none">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">¿EN QUÉ ENFRENTAMIENTO?</div>
        <div id="incidentPairingBtns" style="display:flex;flex-wrap:wrap;gap:6px"></div>
      </div>`;
    }
    html += `</div>`;
  }

  /* Step 2.5: Player input — only when estadisticasPorJugador is true */
  if(sport.estadisticasPorJugador){
    html += `<div id="incidentPlayerSection" style="margin-bottom:12px;display:none">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;letter-spacing:.3px">JUGADOR (nombre o número)</div>
      <input type="text" id="incidentPlayerInput" placeholder="Ej: #7 Juan Pérez" oninput="_updateAddIncidentBtn()" style="
        width:100%;padding:10px 14px;border:1.5px solid var(--border-dark);border-radius:var(--radius-md);
        font:500 13px var(--font);color:var(--text-primary);background:var(--surface);outline:none;box-sizing:border-box"
        onfocus="this.style.borderColor='var(--accent)';this.style.boxShadow='0 0 0 3px rgba(215,64,9,.1)'"
        onblur="this.style.borderColor='var(--border-dark)';this.style.boxShadow='none'"/>
    </div>`;
  }

  /* Step 3: Add button */
  html += `<button type="button" id="addIncidentBtn" onclick="addIncident()" disabled
    style="width:100%;padding:10px;border-radius:var(--radius-md);border:none;background:var(--border);font:600 12px var(--font);color:var(--text-secondary);cursor:not-allowed;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Registrar incidencia
  </button>`;

  html += `</div>`;

  /* ── Log entries ── */
  html += `<div id="incidentLogEntries" style="margin-bottom:12px"></div>`;

  /* ── Summary counters (collapsed by default) ── */
  html += `<div id="incidentSummary" style="display:none;padding:14px;background:var(--blue-bg);border:1px solid #bdd7f7;border-radius:var(--radius-md)">
    <div style="font-size:11px;font-weight:600;color:var(--blue-info);margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      RESUMEN
    </div>
    <div id="incidentSummaryContent" style="font-size:11px;color:var(--text-secondary)"></div>
  </div>`;
  } /* end if(stats && stats.length > 0) */

  html += `</div>`;
  return html;
}

/* ── Game stats counter ── */
function adjustGameStat(btn, delta){
  const cell = btn.closest('td');
  const valEl = cell.querySelector('.game-stat-val');
  if(!valEl) return;
  let val = Math.max(0, (parseInt(valEl.textContent)||0) + delta);
  valEl.textContent = val;
}

/* ── Incident log interaction functions ── */
/* ── Legacy button handlers (kept for backward compat) ── */
function selectIncidentType(btnEl){ pickIncidentType(btnEl, btnEl.dataset.idx); }
function selectIncidentTarget(btnEl){ pickIncidentTarget(btnEl, btnEl.dataset.idx); }

/* ── Floating dropdown handlers for incident log ── */
function _positionIncidentMenu(trigger, menu){
  const r = trigger.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.left = r.left + 'px';
  menu.style.width = r.width + 'px';
  menu.style.zIndex = '9999';
}
function _resetIncidentMenuPos(menu){
  menu.style.position = '';
  menu.style.top = '';
  menu.style.left = '';
  menu.style.width = '';
  menu.style.zIndex = '';
}
function toggleIncidentDd(type){
  const ids = {type:['incidentTypeTrigger','incidentTypeMenu'], target:['incidentTargetTrigger','incidentTargetMenu']};
  /* Close all other incident dropdowns first */
  Object.keys(ids).forEach(k => {
    if(k === type) return;
    const t = document.getElementById(ids[k][0]);
    const m = document.getElementById(ids[k][1]);
    if(t) t.classList.remove('open');
    if(m){ m.classList.remove('open'); _resetIncidentMenuPos(m); }
  });
  const trigger = document.getElementById(ids[type][0]);
  const menu = document.getElementById(ids[type][1]);
  if(!trigger || !menu) return;
  const opening = !trigger.classList.contains('open');
  trigger.classList.toggle('open');
  menu.classList.toggle('open');
  if(opening){
    _positionIncidentMenu(trigger, menu);
    const close = (e) => {
      if(!trigger.contains(e.target) && !menu.contains(e.target)){
        trigger.classList.remove('open');
        menu.classList.remove('open');
        _resetIncidentMenuPos(menu);
        document.removeEventListener('click', close, true);
      }
    };
    setTimeout(() => document.addEventListener('click', close, true), 0);
  } else {
    _resetIncidentMenuPos(menu);
  }
}

function pickIncidentType(opt, idx){
  const menu = document.getElementById('incidentTypeMenu');
  const trigger = document.getElementById('incidentTypeTrigger');
  if(!menu || !trigger) return;
  const wasSelected = opt.classList.contains('selected');
  menu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  if(!wasSelected){
    opt.classList.add('selected');
    trigger.textContent = opt.dataset.full || opt.textContent.trim();
  } else {
    trigger.textContent = 'Seleccionar incidencia';
  }
  trigger.classList.remove('open');
  menu.classList.remove('open');
  _resetIncidentMenuPos(menu);
  _updateAddIncidentBtn();
}

function pickIncidentTarget(opt, idx){
  const menu = document.getElementById('incidentTargetMenu');
  const trigger = document.getElementById('incidentTargetTrigger');
  if(!menu || !trigger) return;
  const wasSelected = opt.classList.contains('selected');
  menu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  if(!wasSelected){
    opt.classList.add('selected');
    trigger.textContent = opt.dataset.name || opt.textContent.trim();
  } else {
    trigger.textContent = 'Seleccionar participante';
  }
  trigger.classList.remove('open');
  menu.classList.remove('open');
  _resetIncidentMenuPos(menu);
  /* Show/hide player input for estadisticasPorJugador */
  const playerSection = document.getElementById('incidentPlayerSection');
  if(playerSection){
    if(!wasSelected){
      playerSection.style.display = '';
      playerSection.style.animation = 'fadeInUp .25s cubic-bezier(.4,0,.2,1)';
      const inp = document.getElementById('incidentPlayerInput');
      if(inp) setTimeout(() => inp.focus(), 100);
    } else {
      playerSection.style.display = 'none';
      const inp = document.getElementById('incidentPlayerInput');
      if(inp) inp.value = '';
    }
  }
  _updateAddIncidentBtn();
}

/* ── Ronda + Pairing selectors for incidents ── */
function selectIncidentRonda(btnEl){
  const container = document.getElementById('incidentRondaBtns');
  if(!container) return;
  const wasActive = btnEl.classList.contains('active');
  const _tealC = '#0891b2';
  container.querySelectorAll('.incident-ronda-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = 'var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });

  /* Clear pairing + target selections */
  const pairingWrap = document.getElementById('incidentPairingWrap');
  const targetMenu = document.getElementById('incidentTargetMenu');
  const targetTrigger = document.getElementById('incidentTargetTrigger');

  if(wasActive){
    if(pairingWrap) pairingWrap.style.display = 'none';
    /* Reset target dropdown */
    if(targetMenu) targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
    if(targetTrigger) targetTrigger.textContent = 'Selecciona ronda y enfrentamiento primero';
    _updateAddIncidentBtn();
    return;
  }

  btnEl.classList.add('active');
  btnEl.style.borderColor = _tealC;
  btnEl.style.background = '#ecfeff';
  btnEl.style.color = _tealC;

  const rIdx = parseInt(btnEl.dataset.ronda);
  const rm = _rondaMatches[rIdx];
  const parts = rm?.participants || [];

  /* Build pairings if duelo mode */
  if(pairingWrap && parts.length >= 2){
    const pairingBtns = document.getElementById('incidentPairingBtns');
    if(pairingBtns){
      let phtml = '';
      for(let i=0; i<parts.length; i+=2){
        if(i+1 < parts.length){
          const pairIdx = Math.floor(i/2);
          const pA = parts[i], pB = parts[i+1];
          const shortA = pA.length > 10 ? pA.substring(0,10)+'…' : pA;
          const shortB = pB.length > 10 ? pB.substring(0,10)+'…' : pB;
          phtml += `<button type="button" class="incident-pairing-btn" data-pair="${pairIdx}" data-aidx="${i}" data-bidx="${i+1}" data-aname="${pA}" data-bname="${pB}"
            onclick="selectIncidentPairing(this)"
            style="padding:6px 10px;border-radius:var(--radius-md);border:1.5px solid var(--border-dark);background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s">
            <span style="font-weight:600;font-size:10px;color:var(--text-secondary);margin-right:4px">T${pairIdx+1}</span> ${shortA} vs ${shortB}
          </button>`;
        }
      }
      pairingBtns.innerHTML = phtml;
    }
    pairingWrap.style.display = '';
    /* Reset target dropdown */
    if(targetMenu) targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
    if(targetTrigger) targetTrigger.textContent = 'Selecciona ronda y enfrentamiento primero';
  } else {
    /* Non-duel ronda: populate target dropdown with participants */
    if(targetMenu){
      targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
      if(targetTrigger) targetTrigger.textContent = 'Seleccionar participante';
      parts.forEach((p, i) => {
        const opt = document.createElement('div');
        opt.className = 'float-dd-opt';
        opt.dataset.idx = i;
        opt.dataset.name = p;
        opt.setAttribute('onclick', `pickIncidentTarget(this,${i})`);
        opt.textContent = p;
        targetMenu.appendChild(opt);
      });
    }
  }
  _updateAddIncidentBtn();
}

function selectIncidentPairing(btnEl){
  const container = document.getElementById('incidentPairingBtns');
  if(!container) return;
  const wasActive = btnEl.classList.contains('active');
  const _tealC = '#0891b2';
  container.querySelectorAll('.incident-pairing-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = 'var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });

  const targetMenu = document.getElementById('incidentTargetMenu');
  const targetTrigger = document.getElementById('incidentTargetTrigger');

  if(wasActive){
    /* Clear target dropdown */
    if(targetMenu) targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
    if(targetTrigger) targetTrigger.textContent = 'Selecciona ronda y enfrentamiento primero';
    _updateAddIncidentBtn();
    return;
  }

  btnEl.classList.add('active');
  btnEl.style.borderColor = _tealC;
  btnEl.style.background = '#ecfeff';
  btnEl.style.color = _tealC;

  /* Populate target dropdown with the two players in this pairing */
  const pA = btnEl.dataset.aname;
  const pB = btnEl.dataset.bname;
  if(targetMenu){
    targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
    if(targetTrigger) targetTrigger.textContent = 'Seleccionar participante';
    [pA, pB].forEach((p, i) => {
      const opt = document.createElement('div');
      opt.className = 'float-dd-opt';
      opt.dataset.idx = i;
      opt.dataset.name = p;
      opt.setAttribute('onclick', `pickIncidentTarget(this,${i})`);
      opt.textContent = p;
      targetMenu.appendChild(opt);
    });
  }
  _updateAddIncidentBtn();
}

function _updateAddIncidentBtn(){
  const btn = document.getElementById('addIncidentBtn');
  if(!btn) return;
  const hasType = document.querySelector('#incidentTypeMenu .float-dd-opt.selected');
  const hasTarget = document.querySelector('#incidentTargetMenu .float-dd-opt.selected');
  /* In ronda mode, also require ronda selection */
  const rondaSection = document.getElementById('incidentRondaSection');
  const hasRonda = !rondaSection || document.querySelector('#incidentRondaBtns .incident-ronda-btn.active');
  /* In estadisticasPorJugador mode, require player name */
  const playerInput = document.getElementById('incidentPlayerInput');
  const hasPlayer = !playerInput || (playerInput && playerInput.value.trim().length > 0);
  if(hasType && hasTarget && hasRonda && hasPlayer){
    btn.disabled = false;
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.background = 'var(--border)';
    btn.style.color = 'var(--text-secondary)';
    btn.style.cursor = 'not-allowed';
  }
}

function addIncident(){
  const typeOpt = document.querySelector('#incidentTypeMenu .float-dd-opt.selected');
  const targetOpt = document.querySelector('#incidentTargetMenu .float-dd-opt.selected');
  if(!typeOpt || !targetOpt) return;

  const incident = {
    type: typeOpt.dataset.full || typeOpt.textContent.trim(),
    target: targetOpt.dataset.name || targetOpt.textContent.trim(),
    time: new Date().toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit', second:'2-digit'}),
    id: Date.now()
  };

  /* Capture player name if estadisticasPorJugador */
  const playerInput = document.getElementById('incidentPlayerInput');
  if(playerInput && playerInput.value.trim()){
    incident.player = playerInput.value.trim();
  }

  /* Capture ronda context if available */
  const rondaBtn = document.querySelector('#incidentRondaBtns .incident-ronda-btn.active');
  if(rondaBtn){
    const rIdx = parseInt(rondaBtn.dataset.ronda);
    incident.ronda = _rondaMatches[rIdx]?.phase || `Ronda ${rIdx+1}`;
    incident.rondaIdx = rIdx;
  }
  const pairingBtn = document.querySelector('#incidentPairingBtns .incident-pairing-btn.active');
  if(pairingBtn){
    incident.tablero = parseInt(pairingBtn.dataset.pair) + 1;
    incident.pairingLabel = `${pairingBtn.dataset.aname} vs ${pairingBtn.dataset.bname}`;
  }

  _incidentLog.push(incident);

  /* Reset dropdown selections + close menus */
  const _typeMenu = document.getElementById('incidentTypeMenu');
  const _targetMenuR = document.getElementById('incidentTargetMenu');
  if(_typeMenu){ _typeMenu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected')); _typeMenu.classList.remove('open'); _resetIncidentMenuPos(_typeMenu); }
  const typeTrigger = document.getElementById('incidentTypeTrigger');
  if(typeTrigger){ typeTrigger.textContent = 'Seleccionar incidencia'; typeTrigger.classList.remove('open'); }

  if(_targetMenuR){ _targetMenuR.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected')); _targetMenuR.classList.remove('open'); _resetIncidentMenuPos(_targetMenuR); }
  const targetTrigger = document.getElementById('incidentTargetTrigger');
  if(targetTrigger){ targetTrigger.textContent = 'Seleccionar participante'; targetTrigger.classList.remove('open'); }

  /* Reset player input if estadisticasPorJugador */
  const _playerSec = document.getElementById('incidentPlayerSection');
  if(_playerSec){ _playerSec.style.display = 'none'; }
  const _playerInp = document.getElementById('incidentPlayerInput');
  if(_playerInp){ _playerInp.value = ''; }
  /* Reset ronda + pairing selections */
  const hasRondaSection = document.getElementById('incidentRondaSection');
  if(hasRondaSection){
    document.querySelectorAll('#incidentRondaBtns .incident-ronda-btn').forEach(b => {
      b.classList.remove('active');
      b.style.borderColor = 'var(--border-dark)';
      b.style.background = 'var(--surface)';
      b.style.color = 'var(--text-secondary)';
    });
    const pairingWrap = document.getElementById('incidentPairingWrap');
    if(pairingWrap) pairingWrap.style.display = 'none';
    /* Clear dynamic target opts in ronda+duelo mode */
    const _targetMenu = document.getElementById('incidentTargetMenu');
    if(_targetMenu) _targetMenu.querySelectorAll('.float-dd-opt').forEach(o => o.remove());
    if(targetTrigger) targetTrigger.textContent = 'Selecciona ronda y enfrentamiento primero';
  }

  _updateAddIncidentBtn();

  /* Render log */
  _renderIncidentLog();

  /* Animate the new entry */
  const entriesEl = document.getElementById('incidentLogEntries');
  if(entriesEl && entriesEl.firstChild){
    entriesEl.firstChild.style.animation = 'fadeInUp .3s cubic-bezier(.4,0,.2,1)';
  }
}

function removeIncident(id){
  _incidentLog = _incidentLog.filter(i => i.id !== id);
  _renderIncidentLog();
}

function _renderIncidentLog(){
  const entriesEl = document.getElementById('incidentLogEntries');
  const countEl = document.getElementById('incidentCount');
  const summaryEl = document.getElementById('incidentSummary');
  const summaryContent = document.getElementById('incidentSummaryContent');

  if(countEl) countEl.textContent = _incidentLog.length + ' registro' + (_incidentLog.length !== 1 ? 's' : '');

  if(!entriesEl) return;

  if(_incidentLog.length === 0){
    entriesEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-secondary);font-size:12px">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 8px;opacity:.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Sin incidencias registradas
    </div>`;
    if(summaryEl) summaryEl.style.display = 'none';
    return;
  }

  /* Render entries (newest first) */
  let html = '';
  const sorted = [..._incidentLog].reverse();
  sorted.forEach(inc => {
    const typeShort = inc.type.length > 40 ? inc.type.substring(0,40)+'…' : inc.type;
    const rondaTag = inc.ronda ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:var(--radius-full);background:#ecfeff;border:1px solid #0891b2;color:#0891b2;font:600 9px var(--font)">${inc.ronda}${inc.tablero ? ' · T'+inc.tablero : ''}</span>` : '';
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:6px;transition:all .15s">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:500;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${inc.type}">${typeShort}</span>
          ${rondaTag}
        </div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:3px">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${inc.target}${inc.player ? ' · <strong>'+inc.player+'</strong>' : ''}
          </span>
          <span style="display:flex;align-items:center;gap:3px">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${inc.time}
          </span>
        </div>
      </div>
      <button type="button" onclick="removeIncident(${inc.id})" style="width:26px;height:26px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);transition:all .12s" onmouseover="this.style.borderColor='var(--red-border)';this.style.color='#d32f2f';this.style.background='var(--red-bg)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)';this.style.background='var(--surface)'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  });
  entriesEl.innerHTML = html;

  /* Build summary */
  if(summaryEl && summaryContent){
    const counts = {};
    _incidentLog.forEach(inc => {
      const key = inc.type + '|||' + inc.target;
      counts[key] = (counts[key] || 0) + 1;
    });
    let sumHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    Object.entries(counts).forEach(([key, count]) => {
      const [type, target] = key.split('|||');
      const typeShort = type.length > 25 ? type.substring(0,25)+'…' : type;
      sumHtml += `<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--surface);border:1px solid #bdd7f7;border-radius:var(--radius-full);font-size:10px">
        <span style="font-weight:600;color:var(--blue-info)">${count}×</span>
        <span style="color:var(--text-primary)" title="${type}">${typeShort}</span>
        <span style="color:var(--text-secondary)">→ ${target}</span>
      </div>`;
    });
    sumHtml += '</div>';
    summaryContent.innerHTML = sumHtml;
    summaryEl.style.display = 'block';
  }
}

/* ═══ Estadísticas accordion (non-VS) ═══ */
function toggleStatItem(el){
  el.classList.toggle('open');
}
function toggleStatParticipant(row, statIdx){
  row.classList.toggle('checked');
  const item = row.closest('.stat-item');
  const checked = item.querySelectorAll('.stat-p-row.checked').length;
  if(checked > 0){
    item.classList.add('selected');
  } else {
    item.classList.remove('selected');
  }
  const countEl = document.getElementById('statCount-'+statIdx);
  if(countEl) countEl.textContent = checked;
}

/* ═══ Winner selection ═══ */
const _podiumLabels = ['🥇 1er lugar','🥈 2do lugar','🥉 3er lugar'];
const _podiumClasses = ['pos-1','pos-2','pos-3'];

function selectWinner(el){
  if(el.classList.contains('descalified')) return;
  const isPodium = !!el.closest('.winner-options[data-podium="true"]');

  if(!isPodium){
    /* VS mode — single winner toggle */
    document.querySelectorAll('.winner-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    /* Show/hide desempate section based on Empate selection */
    const desempateSection = document.getElementById('desempateSection');
    if(desempateSection){
      const isEmpate = el.dataset.winner === 'empate';
      desempateSection.style.display = isEmpate ? '' : 'none';
      if(isEmpate){
        desempateSection.scrollIntoView({behavior:'smooth',block:'center'});
      } else {
        /* Clear desempate selections when picking direct winner */
        desempateSection.querySelectorAll('button').forEach(b => {
          b.style.background = '';b.style.borderColor = '';b.style.color = '';b.style.fontWeight = '';
        });
        _desempateCriterioSelected = null;
      }
    }
    checkSaveReady();
    return;
  }

  /* Podium mode — sequential 1st/2nd/3rd selection */
  const currentPos = el.dataset.position;
  if(currentPos){
    /* Already selected → deselect and shift others up */
    const removedPos = parseInt(currentPos);
    el.removeAttribute('data-position');
    el.classList.remove('selected','pos-1','pos-2','pos-3');
    el.querySelector('.winner-tag').textContent = '';
    /* Shift higher positions down */
    document.querySelectorAll('.winner-opt[data-position]').forEach(o => {
      const p = parseInt(o.dataset.position);
      if(p > removedPos){
        const newPos = p - 1;
        o.dataset.position = newPos;
        o.classList.remove('pos-1','pos-2','pos-3');
        o.classList.add(_podiumClasses[newPos - 1]);
        o.querySelector('.winner-tag').textContent = _podiumLabels[newPos - 1];
      }
    });
  } else {
    /* Not selected → assign next available position */
    const taken = document.querySelectorAll('.winner-opt[data-position]').length;
    if(taken >= 3) return; /* Max 3 podium positions */
    const nextPos = taken + 1;
    el.dataset.position = nextPos;
    el.classList.add('selected', _podiumClasses[nextPos - 1]);
    el.querySelector('.winner-tag').textContent = _podiumLabels[nextPos - 1];
  }
  checkSaveReady();
}

/* ═══ Podium desempate toggle ═══ */
function togglePodiumDesempate(el){
  const section = document.getElementById('desempateSection');
  if(!section) return;
  const isActive = el.classList.contains('selected');
  el.classList.toggle('selected', !isActive);
  section.style.display = isActive ? 'none' : '';
  if(!isActive){
    section.scrollIntoView({behavior:'smooth',block:'center'});
  } else {
    /* Clear dropdown selections */
    _closeAllDesempateDd();
    const critTrigger = document.getElementById('desempateCritTrigger');
    const winTrigger = document.getElementById('desempateWinTrigger');
    if(critTrigger){ critTrigger.textContent = 'Seleccionar criterio'; critTrigger.style.color = 'var(--text-secondary)'; critTrigger.style.fontWeight = '400'; }
    if(winTrigger){ winTrigger.textContent = 'Seleccionar ganador'; winTrigger.style.color = 'var(--text-secondary)'; winTrigger.style.fontWeight = '400'; }
  }
}

/* ═══ Desempate — floating dropdowns triggered by "Empate" ═══ */
let _desempateCrit = null;
let _desempateWinNum = null;
let _desempateWinName = null;

function _closeAllDesempateDd(){
  ['desempateCrit','desempateWin'].forEach(id => {
    const t = document.getElementById(id+'Trigger');
    const m = document.getElementById(id+'Menu');
    if(t) t.classList.remove('open');
    if(m) m.classList.remove('open');
  });
}

function toggleDesempateDd(type){
  const id = type === 'crit' ? 'desempateCrit' : 'desempateWin';
  const trigger = document.getElementById(id+'Trigger');
  const menu = document.getElementById(id+'Menu');
  const isOpen = trigger.classList.contains('open');
  /* Always close all first */
  _closeAllDesempateDd();
  /* Open this one if it was closed */
  if(!isOpen){
    trigger.classList.add('open');
    menu.classList.add('open');
    const close = (e) => {
      if(!trigger.contains(e.target) && !menu.contains(e.target)){
        trigger.classList.remove('open');
        menu.classList.remove('open');
        document.removeEventListener('click',close,true);
      }
    };
    setTimeout(() => document.addEventListener('click',close,true), 0);
  }
}

function pickDesempateCrit(opt, label, idx){
  const trigger = document.getElementById('desempateCritTrigger');
  const menu = document.getElementById('desempateCritMenu');
  menu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  opt.classList.add('selected');
  trigger.textContent = (idx+1)+'. '+label;
  trigger.style.color = 'var(--text-primary)';
  trigger.style.fontWeight = '500';
  trigger.classList.remove('open');
  menu.classList.remove('open');
  _desempateCrit = (idx+1)+'. '+label;
  _syncDesempateNote();
}

function pickDesempateWinner(opt, num, name){
  const trigger = document.getElementById('desempateWinTrigger');
  const menu = document.getElementById('desempateWinMenu');
  menu.querySelectorAll('.float-dd-opt').forEach(o => o.classList.remove('selected'));
  opt.classList.add('selected');
  trigger.textContent = name;
  trigger.style.color = 'var(--text-primary)';
  trigger.style.fontWeight = '500';
  trigger.classList.remove('open');
  menu.classList.remove('open');
  _desempateWinNum = num;
  _desempateWinName = name;
  /* Auto-select winner in GANADOR */
  const winnerOpt = document.querySelector(`.winner-opt[data-winner="${num}"]`);
  if(winnerOpt){
    document.querySelectorAll('.winner-opt').forEach(o => o.classList.remove('selected'));
    winnerOpt.classList.add('selected');
  }
  _syncDesempateNote();
  checkSaveReady();
}

function _syncDesempateNote(){
  if(!_desempateCrit || !_desempateWinName) return;
  const notesEl = document.getElementById('obsNotes');
  if(!notesEl) return;
  const note = `Desempate: ${_desempateWinName} gana por ${_desempateCrit}`;
  if(!notesEl.value.includes('Desempate:')){
    notesEl.value = (notesEl.value ? notesEl.value + '\n' : '') + note;
  } else {
    notesEl.value = notesEl.value.replace(/Desempate:.*/, note);
  }
}

/* ═══ Victoria Directa (KO) — auto-select winner ═══ */
function applyVictoriaDirecta(btn, winnerNum, label){
  /* Highlight the clicked button, reset siblings */
  const container = btn.closest('.winner-section');
  container.querySelectorAll('button').forEach(b => {
    b.style.background = '';
    b.style.color = '#c0392b';
    b.style.fontWeight = '';
  });
  btn.style.background = '#c0392b';
  btn.style.color = '#fff';
  btn.style.fontWeight = '700';
  /* Auto-select winner in GANADOR section */
  const winnerOpt = document.querySelector(`.winner-opt[data-winner="${winnerNum}"]`);
  if(winnerOpt){
    document.querySelectorAll('.winner-opt').forEach(o => o.classList.remove('selected'));
    winnerOpt.classList.add('selected');
  }
  /* Add note about victory type */
  const notesEl = document.getElementById('obsNotes');
  if(notesEl && !notesEl.value.includes(label)){
    const winnerName = winnerOpt ? winnerOpt.dataset.participantName : ('Equipo ' + winnerNum);
    notesEl.value = (notesEl.value ? notesEl.value + '\n' : '') + `${label}: Victoria de ${winnerName}`;
  }
  checkSaveReady();
}

/* ═══ Extra time toggle ═══ */
function toggleExtraTime(toggleEl, sportKey){
  toggleEl.classList.toggle('on');
  const container = document.getElementById('extraTimeParciales');
  if(toggleEl.classList.contains('on')){
    const sport = SPORTS_DB[sportKey];
    const cfg = sport.tiempoExtraConfig || {};
    const match = _modalMatchData;
    const comp = _modalCompId ? _resolveComp(_modalCompId) : null;
    const hasParticipants = match && match.participants && match.participants.length > 0 && (!match.teams || match.teams.length < 2 || match.teams[0] === 'Todos' || match.teams[0] === 'Equipo 1');
    const ss = sport.scoringSystem;
    const hasOutcomes = ss && (ss.tablas !== undefined || ss.empate !== undefined);

    container.style.display = 'block';
    /* Hide winner section when tiebreaker is active (avoids duplication) */
    if(hasOutcomes && sport.desempate){
      const ws = document.querySelector('.winner-section');
      if(ws) ws.style.display = 'none';
    }
    let html = `<div class="scoring-grid">`;

    /* ── Header: adapt title based on sport type ── */
    if(hasOutcomes && sport.desempate){
      html += `<div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:6px;display:flex;align-items:center;gap:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        DESEMPATE — ${sport.desempate}
      </div>`;
      /* Explanation of tiebreaker method */
      if(sport.desempateDescripcion && sport.desempateDescripcion.length > 0){
        html += `<div style="padding:10px 14px;background:var(--blue-bg);border:1px solid #bdd7f7;border-radius:var(--radius-md);margin-bottom:14px">
          <div style="font-size:11px;font-weight:600;color:var(--blue-info);margin-bottom:6px">Criterios de desempate (en orden):</div>
          <ol style="margin:0;padding-left:18px;font-size:11px;color:var(--text-secondary);line-height:1.7">
            ${sport.desempateDescripcion.map(d => `<li>${d}</li>`).join('')}
          </ol>
        </div>`;
      }
      if(cfg.descripcion){
        html += `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          ${cfg.descripcion}
        </div>`;
      }
    } else {
      html += `<div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:12px">⏱️ TIEMPO EXTRA (${cfg.duracion || 'Variable'})</div>`;
    }

    if(hasParticipants){
      /* ── Individual / Rondas: show tied participants ── */
      const tied = getTiedParticipants(match, sport);
      if(tied.length > 0){
        html += `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          <span style="background:var(--orange-bg);color:#b45309;padding:2px 8px;border-radius:var(--radius-full);font-weight:500;font-size:10px;border:1px solid var(--orange-border)">EMPATE</span>
          ${tied.length} participantes empatados en ${tied[0].total} pts
        </div>`;

        if(hasOutcomes){
          /* ── Decisive tiebreaker: select winner (e.g. chess Armagedón — no draws) ── */
          /* Step 1: Criterion used */
          if(sport.desempateDescripcion && sport.desempateDescripcion.length > 0){
            html += `<div style="margin-bottom:14px">
              <div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:6px">¿Cómo se resolvió?</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px" id="tiebreakCriterionBtns">
                ${sport.desempateDescripcion.map((d, idx) => `<button type="button" class="tb-criterion-btn" data-idx="${idx}"
                  onclick="selectTiebreakCriterion(this)"
                  style="padding:6px 12px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s;text-align:left">
                  ${idx+1}. ${d}
                </button>`).join('')}
              </div>
            </div>`;
          }
          /* Step 2: Select winner from tied participants */
          html += `<div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:8px">Selecciona el ganador del desempate:</div>`;
          html += `<div style="display:flex;flex-wrap:wrap;gap:8px" id="tiebreakWinnerBtns">`;
          tied.forEach((t) => {
            html += `<button type="button" class="tb-winner-btn" data-participant="${t.idx}"
              onclick="selectTiebreakWinner(${t.idx},this)"
              style="flex:1;min-width:120px;padding:12px 16px;border-radius:var(--radius-md);border:1.5px solid var(--border-dark);background:var(--surface);font:600 13px var(--font);color:var(--text-primary);cursor:pointer;transition:all .15s;text-align:center">
              ${t.name}
              <div style="font-size:10px;font-weight:500;color:var(--text-secondary);margin-top:2px">${t.total} pts</div>
            </button>`;
          });
          html += `</div>`;
        } else {
          /* ── Numeric tiebreaker ── */
          html += `<table class="scoring-table">
            <thead><tr><th>#</th><th>PARTICIPANTE</th><th>TE</th><th class="total-col">NUEVO TOTAL</th></tr></thead>
            <tbody>`;
          tied.forEach((t, i) => {
            html += `<tr>
              <td style="text-align:center;font-weight:500;color:var(--text-secondary)">${i+1}</td>
              <td style="font-weight:500">${t.name}</td>
              <td><input class="score-input" type="number" min="0" data-participant="${t.idx}" data-extra-time="1" oninput="recalcExtraTimeParticipants()" style="text-align:center"/></td>
              <td class="total-col" id="etTotal_${t.idx}">${t.total}</td>
            </tr>`;
          });
          html += `</tbody></table>`;
        }
      } else {
        html += `<div style="font-size:12px;color:var(--text-secondary);padding:12px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:var(--radius-md)">✅ No hay empates — la clasificación está definida.</div>`;
      }
    } else {
      /* ── Team-based ── */
      const t1 = match && match.teams && match.teams[0] ? match.teams[0] : 'Equipo 1';
      const t2 = match && match.teams && match.teams[1] ? match.teams[1] : 'Equipo 2';

      if(hasOutcomes){
        /* ── Decisive tiebreaker for teams: select winner ── */
        if(sport.desempateDescripcion && sport.desempateDescripcion.length > 0){
          html += `<div style="margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:6px">¿Cómo se resolvió?</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px" id="tiebreakCriterionBtns">
              ${sport.desempateDescripcion.map((d, idx) => `<button type="button" class="tb-criterion-btn" data-idx="${idx}"
                onclick="selectTiebreakCriterion(this)"
                style="padding:6px 12px;border-radius:var(--radius-full);border:1.5px solid var(--border-dark);background:var(--surface);font:500 11px var(--font);color:var(--text-secondary);cursor:pointer;transition:all .15s;text-align:left">
                ${idx+1}. ${d}
              </button>`).join('')}
            </div>
          </div>`;
        }
        html += `<div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:8px">Selecciona el ganador del desempate:</div>`;
        html += `<div style="display:flex;gap:10px">
          <button type="button" class="tb-winner-btn" data-team="1" onclick="selectTiebreakWinnerTeam(1,this)"
            style="flex:1;padding:14px 16px;border-radius:var(--radius-md);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-primary);cursor:pointer;transition:all .15s;text-align:center">
            ${t1}
          </button>
          <button type="button" class="tb-winner-btn" data-team="2" onclick="selectTiebreakWinnerTeam(2,this)"
            style="flex:1;padding:14px 16px;border-radius:var(--radius-md);border:1.5px solid var(--border-dark);background:var(--surface);font:600 14px var(--font);color:var(--text-primary);cursor:pointer;transition:all .15s;text-align:center">
            ${t2}
          </button>
        </div>`;
      } else {
        /* ── Numeric extra time for teams ── */
        html += `<table class="scoring-table">
          <thead><tr><th>EQUIPO</th><th>TE</th><th class="total-col">PTS</th></tr></thead>
          <tbody>
            <tr><td style="font-weight:500">${t1}</td><td><input class="score-input" type="number" min="0" data-team="1" data-extra-time="1" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td><td class="total-col">-</td></tr>
            <tr><td style="font-weight:500">${t2}</td><td><input class="score-input" type="number" min="0" data-team="2" data-extra-time="1" oninput="recalcTotals(true)" onfocus="setActiveScoreInput(this)"/></td><td class="total-col">-</td></tr>
          </tbody>
        </table>`;
      }
    }
    html += `</div>`;
    container.innerHTML = html;
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
    /* Restore winner section when tiebreaker is deactivated */
    const ws = document.querySelector('.winner-section');
    if(ws) ws.style.display = '';
  }
}

/* ── Detect tied participants from ronda scores or current scores ── */
function getTiedParticipants(match, sport){
  const participants = match.participants || [];
  if(!participants.length) return [];

  /* Try ronda scores first (multi-round sports) */
  if(_rondaMatches && _rondaMatches.length > 1 && Object.keys(_rondaScores).length > 0){
    saveCurrentRondaScores();
    const totals = participants.map((p, pIdx) => {
      let sum = 0;
      _rondaMatches.forEach((rm, rIdx) => { sum += (_rondaScores[rIdx]?.[pIdx] || 0); });
      return { name: p, idx: pIdx, total: sum };
    });
    totals.sort((a,b) => b.total - a.total);
    const maxScore = totals[0].total;
    if(maxScore === 0) return [];
    const tied = totals.filter(t => t.total === maxScore);
    return tied.length > 1 ? tied : [];
  }

  /* Single-round: read current inputs */
  const inputs = document.querySelectorAll('#tab-marcador .score-input');
  if(!inputs.length) return [];
  const scores = participants.map((p, idx) => {
    const input = inputs[idx];
    const val = parseFloat(input?.value) || 0;
    return { name: p, idx, total: val };
  });
  scores.sort((a,b) => b.total - a.total);
  const maxScore = scores[0].total;
  if(maxScore === 0) return [];
  const tied = scores.filter(t => t.total === maxScore);
  return tied.length > 1 ? tied : [];
}

/* ── Recalc extra time totals for participant-based ── */
function recalcExtraTimeParticipants(){
  const match = _modalMatchData;
  const participants = match?.participants || [];
  const inputs = document.querySelectorAll('#extraTimeParciales input[data-extra-time]');
  inputs.forEach(input => {
    const pIdx = parseInt(input.dataset.participant);
    const extraVal = parseFloat(input.value) || 0;
    /* Get base total from ronda or current scores */
    let baseTotal = 0;
    if(_rondaMatches && _rondaMatches.length > 1){
      _rondaMatches.forEach((rm, rIdx) => { baseTotal += (_rondaScores[rIdx]?.[pIdx] || 0); });
    } else {
      const mainInputs = document.querySelectorAll('#tab-marcador .score-input');
      baseTotal = parseFloat(mainInputs[pIdx]?.value) || 0;
    }
    const totalEl = document.getElementById(`etTotal_${pIdx}`);
    if(totalEl){
      const newTotal = baseTotal + extraVal;
      totalEl.textContent = newTotal;
      totalEl.style.color = extraVal > 0 ? 'var(--accent)' : 'var(--text-primary)';
      totalEl.style.fontWeight = extraVal > 0 ? '800' : '600';
    }
  });
}

/* ── Tiebreaker: select which criterion resolved it ── */
function selectTiebreakCriterion(btnEl){
  const wasActive = btnEl.classList.contains('active');
  document.querySelectorAll('.tb-criterion-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-secondary)';
  });
  if(!wasActive){
    btnEl.classList.add('active');
    btnEl.style.border = '1.5px solid #bdd7f7';
    btnEl.style.background = 'var(--blue-bg)';
    btnEl.style.color = 'var(--blue-info)';
  }
}

/* ── Tiebreaker: select winner (participant-based) ── */
function selectTiebreakWinner(pIdx, btnEl){
  const wasActive = btnEl.classList.contains('active');
  document.querySelectorAll('.tb-winner-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-primary)';
  });
  if(!wasActive){
    btnEl.classList.add('active');
    btnEl.style.border = '1.5px solid var(--green-border)';
    btnEl.style.background = 'var(--green-bg)';
    btnEl.style.color = 'var(--green)';
  }
  checkSaveReady();
}

/* ── Tiebreaker: select winner (team-based) ── */
function selectTiebreakWinnerTeam(teamIdx, btnEl){
  const wasActive = btnEl.classList.contains('active');
  document.querySelectorAll('.tb-winner-btn').forEach(b => {
    b.classList.remove('active');
    b.style.border = '1.5px solid var(--border-dark)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--text-primary)';
  });
  if(!wasActive){
    btnEl.classList.add('active');
    btnEl.style.border = '1.5px solid var(--green-border)';
    btnEl.style.background = 'var(--green-bg)';
    btnEl.style.color = 'var(--green)';
  }
  checkSaveReady();
}

/* ═══ POR MARCA (time/distance) ═══ */
function buildMarcaSection(sport, match, comp){
  let participants = match.participants || [];
  const attempts = sport.intentos || 1;
  const isTiempo = sport.tipoMarca === 'tiempo';
  const isPeso = sport.tipoMarca === 'peso';
  const unidad = sport.unidad || (isTiempo ? 'Tiempo' : isPeso ? 'Peso' : 'Resultado');

  /* ── Enhanced Atletismo UI (campo/combinados only) ── */
  const isAtletismo = comp && (comp.sport === 'atletismo' || comp.sport === 'para_atletismo') && comp.atletismoTipo;
  if(isAtletismo && comp.atletismoTipo !== 'tiempo'){
    return buildAtletismoMarca(comp, match);
  }

  /* ── Fallback: if no participants, generate placeholders from teams or generic ── */
  if(participants.length === 0){
    if(match.teams && match.teams.length >= 2){
      participants = match.teams;
    } else {
      const n = comp ? (comp.total || 6) : 6;
      participants = Array.from({length: Math.min(n, 8)}, (_, i) => `Participante ${i + 1}`);
    }
  }

  /* ── Premium Lane Timing Grid for ALL time-based single-attempt sports ── */
  const isTimeSport = isTiempo || (isAtletismo && comp.atletismoTipo === 'tiempo');
  if(isTimeSport && attempts <= 1){
    return buildLaneTimingGrid(participants, comp, sport);
  }

  /* ── Default marca UI (multi-attempt time, peso, other) ── */
  let html = `<div class="scoring-grid">
    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;margin-bottom:12px">
      ${isTiempo ? 'REGISTRO DE TIEMPOS' : isPeso ? 'REGISTRO DE PESOS' : 'REGISTRO DE MARCAS'} — ${comp ? comp.categoria : ''}
    </div>`;

  if(attempts > 1){
    html += `<table class="scoring-table">
      <thead><tr>
        <th>POS</th><th>PARTICIPANTE</th>
        ${Array.from({length:attempts},(_,i) => `<th>Int. ${i+1}</th>`).join('')}
        <th class="total-col">MEJOR</th>
      </tr></thead>
      <tbody>
        ${participants.map((p,idx) => `<tr>
          <td><span class="marca-pos">${idx+1}</span></td>
          <td style="font-weight:500">${p}</td>
          ${Array.from({length:attempts},() => `<td><input class="score-input ${isTiempo?'time-mask':'wide'}" type="text" placeholder="${isTiempo?'00:00.00':unidad}" oninput="${isTiempo ? "formatTimeMask(this);" : isPeso ? "this.value=this.value.replace(/[^0-9.,]/g,'');" : ''}recalcMarca()" ${isTiempo?'onfocus="cursorToStart(this)"':''} ${isTiempo||isPeso?'inputmode="decimal"':''} ${isTiempo?'style="font-variant-numeric:tabular-nums;letter-spacing:.5px"':''}/></td>`).join('')}
          <td class="total-col" id="best_${idx}">-</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } else {
    html += `<div class="marca-grid">
      ${participants.map((p,idx) => `<div class="marca-card">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="marca-pos">${idx+1}</span>
          <div>
            <div class="marca-participant">${p}</div>
            <div class="marca-label">Carril ${idx+1}</div>
          </div>
        </div>
        <input class="score-input ${isTiempo?'time-mask':'wide'}" type="text" placeholder="${isTiempo?'00:00.00':unidad}" style="width:100%;height:40px;${isTiempo?'font-variant-numeric:tabular-nums;letter-spacing:.5px':''}"
          ${isTiempo ? 'inputmode="decimal" oninput="formatTimeMask(this)" onfocus="cursorToStart(this)"' : isPeso ? 'inputmode="decimal" oninput="this.value=this.value.replace(/[^0-9.,]/g,\'\')"' : ''}/>
      </div>`).join('')}
    </div>`;
  }


  html += `</div>`;
  return html;
}

/* ═══════════════════════════════════════════════════════════
   LANE TIMING GRID — Premium UI for all lane-based time sports
═══════════════════════════════════════════════════════════ */
const LT_COLORS = [
  {border:'#6b8299',fill:'#e8eef3',text:'#3a4f61'},
  {border:'#5a8ab4',fill:'#e4eef7',text:'#2c5a84'},
  {border:'#4a9e6e',fill:'#e4f3ea',text:'#2a6e44'},
  {border:'#b89840',fill:'#f5f0de',text:'#7a6420'},
  {border:'#8a60b8',fill:'#efe6f7',text:'#5a3080'},
  {border:'#b8804a',fill:'#f5edde',text:'#7a5020'},
  {border:'#4aaa8c',fill:'#e4f3ee',text:'#2a7a5c'},
  {border:'#7a8a98',fill:'#eaecef',text:'#4a5a68'}
];

function buildLaneTimingGrid(participants, comp, sport){
  const categoryLabel = comp ? comp.categoria : '';
  const ruleLabel = (sport.tablaOrden === 'mayor_a_menor') ? 'Mayor tiempo gana' : 'Menor tiempo gana';

  /* Resolve points table for this modalidad */
  const ptsTable = sport.puntosPorPosicion;
  const modalKey = comp && comp.atletismoModalidad ? comp.atletismoModalidad : null;
  const pts = ptsTable ? (modalKey && ptsTable[modalKey] ? ptsTable[modalKey] : (Array.isArray(ptsTable) ? ptsTable : null)) : null;

  let html = `<div class="lane-timing-grid">
    <div class="lt-header">
      <span class="lt-header-title">REGISTRO DE TIEMPOS — ${categoryLabel}</span>
      <span class="lt-rule-badge">${ruleLabel}</span>
    </div>`;

  /* Points-per-position banner */
  if(pts && pts.length > 0){
    html += `<div class="lt-points-banner">
      <div class="lt-points-title">PUNTOS POR POSICIÓN</div>
      <div class="lt-points-chips">
        ${pts.map((p,i) => {
          const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
          const cls = i<3?'lt-pts-medal':'lt-pts-regular';
          return `<span class="lt-pts-chip ${cls}"><span class="lt-pts-pos">${medal||((i+1)+'°')}</span><span class="lt-pts-val">${p} pts</span></span>`;
        }).join('')}
      </div>
    </div>`;
  }

  html += `<div class="lt-lanes">`;

  participants.forEach((p, idx) => {
    const lc = LT_COLORS[idx % LT_COLORS.length];
    html += `<div class="lt-lane" id="lt-lane-${idx}" data-idx="${idx}" style="animation-delay:calc(${idx} * 0.04s);background:linear-gradient(90deg,${lc.fill}22 0%,transparent 40%)">
      <div class="lt-lane-accent" style="background:${lc.border}"></div>
      <div class="lt-lane-num" style="background:${lc.fill};border:2px solid ${lc.border};color:${lc.text}">${idx+1}</div>
      <div class="lt-lane-body">
        <div class="lt-lane-name">${p}</div>
        <div class="lt-lane-meta">Carril ${idx+1}</div>
      </div>
      <div class="lt-lane-controls">
        <div class="lt-status-dot" id="lt-dot-${idx}"></div>
        <div class="lt-seg-input" id="lt-seg-${idx}">
          <input class="lt-seg-field" id="lt-min-${idx}" type="text" inputmode="numeric" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="min" oninput="ltSegInput(this)" onkeydown="ltSegKey(event,this)" aria-label="Minutos carril ${idx+1}"/>
          <span class="lt-seg-sep">:</span>
          <input class="lt-seg-field" id="lt-sec-${idx}" type="text" inputmode="numeric" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="sec" oninput="ltSegInput(this)" onkeydown="ltSegKey(event,this)" aria-label="Segundos carril ${idx+1}"/>
          <span class="lt-seg-sep">.</span>
          <input class="lt-seg-field lt-seg-ms" id="lt-ms-${idx}" type="text" inputmode="numeric" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="ms" oninput="ltSegInput(this)" aria-label="Centésimas carril ${idx+1}"/>
        </div>
        <input class="lt-time-hidden" id="lt-time-${idx}" type="hidden" data-idx="${idx}"/>
      </div>
      <div class="lt-rank-badge" id="lt-rank-${idx}" aria-live="polite">-</div>
    </div>`;
  });

  html += `</div></div>`;
  return html;
}

/* ── Lane Timing: segmented input handler ── */
function ltSegInput(el){
  el.value = el.value.replace(/\D/g,'').substring(0, 2);
  const idx = el.dataset.idx;
  const minEl = document.getElementById('lt-min-'+idx);
  const secEl = document.getElementById('lt-sec-'+idx);
  const msEl = document.getElementById('lt-ms-'+idx);
  const hiddenEl = document.getElementById('lt-time-'+idx);
  const segWrap = document.getElementById('lt-seg-'+idx);
  const m = minEl.value.padStart(2,'0');
  const s = secEl.value.padStart(2,'0');
  const ms = msEl.value.padStart(2,'0');
  const hasAny = minEl.value || secEl.value || msEl.value;
  if(hasAny){
    hiddenEl.value = m+':'+s+'.'+ms;
    segWrap.classList.add('has-value');
    document.getElementById('lt-dot-'+idx)?.classList.add('done');
    const lane = document.getElementById('lt-lane-'+idx);
    if(lane) lane.classList.add('completed');
  } else {
    hiddenEl.value = '';
    segWrap.classList.remove('has-value');
    document.getElementById('lt-dot-'+idx)?.classList.remove('done');
    const lane = document.getElementById('lt-lane-'+idx);
    if(lane) lane.classList.remove('completed');
  }
  /* Auto-advance with pulse micro-interaction */
  if(el.value.length === 2){
    const seg = el.dataset.seg;
    if(seg === 'min'){ secEl.focus(); segWrap.classList.add('pulse'); }
    else if(seg === 'sec'){ msEl.focus(); segWrap.classList.add('pulse'); }
    setTimeout(()=>segWrap.classList.remove('pulse'),220);
  }
  ltRecalcRanks();
  checkSaveReady();
}

function ltSegKey(e, el){
  if(e.key === 'Backspace' && el.value === ''){
    const idx = el.dataset.idx;
    const seg = el.dataset.seg;
    if(seg === 'ms') document.getElementById('lt-sec-'+idx)?.focus();
    else if(seg === 'sec') document.getElementById('lt-min-'+idx)?.focus();
  }
}

function ltRecalcRanks(){
  const lanes = document.querySelectorAll('.lt-lane');
  if(!lanes.length) return;

  /* Resolve points table if available */
  let ptsArr = null;
  if(_modalSportKey){
    const sp = SPORTS_DB[_modalSportKey];
    if(sp && sp.puntosPorPosicion){
      const comp = _modalCompId ? _resolveComp(_modalCompId) : null;
      const mk = comp && comp.atletismoModalidad ? comp.atletismoModalidad : null;
      ptsArr = mk && sp.puntosPorPosicion[mk] ? sp.puntosPorPosicion[mk] : (Array.isArray(sp.puntosPorPosicion) ? sp.puntosPorPosicion : null);
    }
  }

  const entries = [];
  lanes.forEach(lane => {
    const idx = parseInt(lane.dataset.idx);
    const input = document.getElementById('lt-time-'+idx);
    const t = atlParseTime(input.value);
    entries.push({idx, time:t});
  });
  const ranked = entries.filter(e=>e.time!==null).sort((a,b)=>a.time-b.time);
  const medals = ['\u{1F947}','\u{1F948}','\u{1F949}'];
  const rankClasses = ['gold','silver','bronze'];
  entries.forEach(e=>{
    const badge = document.getElementById('lt-rank-'+e.idx);
    if(!badge) return;
    badge.innerHTML = '-';
    badge.className = 'lt-rank-badge';
  });
  /* Assign ranks with tie detection */
  let tieCount = 0;
  ranked.forEach((e,pos)=>{
    const badge = document.getElementById('lt-rank-'+e.idx);
    if(!badge) return;
    const prevText = badge.textContent;
    /* Check if tied with previous */
    const isTied = pos > 0 && ranked[pos-1].time === e.time;
    if(isTied) tieCount++;
    const ptsLabel = ptsArr && pos < ptsArr.length ? `<span class="lt-rank-pts">${ptsArr[pos]}p</span>` : '';
    if(pos<3){
      badge.innerHTML = medals[pos] + ptsLabel;
      badge.className = 'lt-rank-badge '+rankClasses[pos];
    } else {
      badge.innerHTML = (pos+1) + ptsLabel;
      badge.className = 'lt-rank-badge ranked';
    }
    if(isTied){
      badge.classList.add('tied');
      const lane = document.getElementById('lt-lane-'+e.idx);
      if(lane) lane.classList.add('lt-tied');
      /* Also mark the previous tied entry */
      const prevBadge = document.getElementById('lt-rank-'+ranked[pos-1].idx);
      if(prevBadge) prevBadge.classList.add('tied');
      const prevLane = document.getElementById('lt-lane-'+ranked[pos-1].idx);
      if(prevLane) prevLane.classList.add('lt-tied');
    }
    if(prevText !== badge.textContent){
      badge.classList.add('rank-update');
      setTimeout(()=>badge.classList.remove('rank-update'),320);
    }
  });

  /* Clear tied state from non-tied lanes */
  lanes.forEach(lane => {
    const idx = parseInt(lane.dataset.idx);
    const entry = ranked.find(r => r.idx === idx);
    if(!entry) { lane.classList.remove('lt-tied'); return; }
    const rankPos = ranked.indexOf(entry);
    const tiedWithPrev = rankPos > 0 && ranked[rankPos-1].time === entry.time;
    const tiedWithNext = rankPos < ranked.length-1 && ranked[rankPos+1].time === entry.time;
    if(!tiedWithPrev && !tiedWithNext){
      lane.classList.remove('lt-tied');
      const badge = document.getElementById('lt-rank-'+idx);
      if(badge) badge.classList.remove('tied');
    }
  });

  /* Show/hide desempate indicator */
  ltShowDesempate(tieCount > 0 && ranked.length >= 2, tieCount);
}

function ltShowDesempate(hasTies, tieCount){
  let indicator = document.getElementById('ltDesempateIndicator');
  const grid = document.querySelector('.lane-timing-grid');
  if(!grid) return;

  if(hasTies){
    const comp = _resolveComp(typeof selectedCompId !== 'undefined' ? selectedCompId : _modalCompId);
    const sport = comp ? SPORTS_DB[comp.sport] : {};
    const method = sport.desempate || '';
    const desc = sport.desempateDescripcion || [];

    if(!indicator){
      indicator = document.createElement('div');
      indicator.id = 'ltDesempateIndicator';
      grid.appendChild(indicator);
    }
    let html = `<div class="lt-desempate-banner">
      <div class="lt-desempate-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Empate detectado — Requiere desempate
      </div>`;
    if(method){
      html += `<div class="lt-desempate-method">Método: <strong>${method}</strong></div>`;
    }
    if(desc.length > 0){
      html += `<div class="lt-desempate-criteria">
        ${desc.map((d,i) => `<div class="lt-desempate-item"><span class="lt-desempate-num">${i+1}</span>${d}</div>`).join('')}
      </div>`;
    }
    html += `</div>`;
    indicator.innerHTML = html;
    indicator.style.display = 'block';
  } else if(indicator){
    indicator.style.display = 'none';
  }
}

/* ═══════════════════════════════════════════════════════════
   ATLETISMO — Enhanced lane/field/combined UI
═══════════════════════════════════════════════════════════ */
/* Each lane color: [border (strong), fill (subtle), text (high contrast)] */
const LANE_COLORS = [
  {border:'#6b8299',fill:'#e8eef3',text:'#3a4f61'},
  {border:'#5a8ab4',fill:'#e4eef7',text:'#2c5a84'},
  {border:'#4a9e6e',fill:'#e4f3ea',text:'#2a6e44'},
  {border:'#b89840',fill:'#f5f0de',text:'#7a6420'},
  {border:'#8a60b8',fill:'#efe6f7',text:'#5a3080'},
  {border:'#b8804a',fill:'#f5edde',text:'#7a5020'},
  {border:'#4aaa8c',fill:'#e4f3ee',text:'#2a7a5c'},
  {border:'#7a8a98',fill:'#eaecef',text:'#4a5a68'}
];
/* Event metadata: name, type (tiempo/distancia), unit, placeholder, icon, lowerIsBetter, format */
/* format: 'ss.cc' for short runs, 'm:ss.ms' for long runs (milliseconds), 'dd.cc' for distance */
function combEvent(name, tipo, unidad, placeholder, icon, lowerBetter, format){
  return {name, tipo, unidad, placeholder, icon: icon||'🏃', lowerBetter: !!lowerBetter, format: format||'dd.cc'};
}
const COMBINADO_EVENTS = {
  'Pentatlón': [
    combEvent('60m Vallas','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Largo','distancia','m','d.cc','📏',false,'dd.cc'),
    combEvent('Lanz. Bala','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('Salto Alto','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('800m','tiempo','min:seg','m:ss.ms','🏃',true,'m:ss.ms')
  ],
  'Hexatlón': [
    combEvent('100m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Largo','distancia','m','d.cc','📏',false,'dd.cc'),
    combEvent('Lanz. Bala','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('Salto Alto','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('110m Vallas','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('1500m','tiempo','min:seg','m:ss.ms','🏃',true,'m:ss.ms')
  ],
  'Heptatlón': [
    combEvent('100m Vallas','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Alto','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('Lanz. Bala','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('200m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Largo','distancia','m','d.cc','📏',false,'dd.cc'),
    combEvent('Lanz. Jabalina','distancia','m','dd.cc','🎯',false,'dd.cc'),
    combEvent('800m','tiempo','min:seg','m:ss.ms','🏃',true,'m:ss.ms')
  ],
  'Octatlón': [
    combEvent('100m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Largo','distancia','m','d.cc','📏',false,'dd.cc'),
    combEvent('Lanz. Bala','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('400m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('110m Vallas','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Lanz. Disco','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('Salto Pértiga','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('1000m','tiempo','min:seg','m:ss.ms','🏃',true,'m:ss.ms')
  ],
  'Decatlón': [
    combEvent('100m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Salto Largo','distancia','m','d.cc','📏',false,'dd.cc'),
    combEvent('Lanz. Bala','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('Salto Alto','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('400m','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('110m Vallas','tiempo','seg','ss.cc','🏃',true,'ss.cc'),
    combEvent('Lanz. Disco','distancia','m','dd.cc','💪',false,'dd.cc'),
    combEvent('Salto Pértiga','distancia','m','d.cc','⬆️',false,'dd.cc'),
    combEvent('Lanz. Jabalina','distancia','m','dd.cc','🎯',false,'dd.cc'),
    combEvent('1500m','tiempo','min:seg','m:ss.ms','🏃',true,'m:ss.ms')
  ]
};

/* Resolve atletismo sub-modalidad key from comp fields */
function _resolveAtletismoSubModalidad(comp){
  if(!comp || !comp.atletismoModalidad) return null;
  const mod = comp.atletismoModalidad;
  /* For non-atletismo sports (para_natacion, para_atletismo, etc.): atletismoModalidad IS the modalidad key */
  if(comp.sport !== 'atletismo') return mod;
  /* Atletismo: resolve sub-categories for carreras */
  const cat = (comp.categoria || '').toLowerCase();
  if(mod === 'combinados') return 'combinados';
  if(mod === 'lanzamiento') return 'lanzamiento';
  if(mod === 'salto') return 'salto';
  /* Carreras sub-types */
  if(cat.includes('relevo')) return 'carreras_relevos';
  if(cat.includes('marcha')) return 'carreras_marcha';
  if(cat.includes('ruta') || cat.includes('maratón') || cat.includes('maraton')) return 'carreras_ruta';
  if(cat.includes('campo traviesa')) return 'carreras_campo_traviesa';
  if(cat.includes('obstáculo') || cat.includes('obstaculo')) return 'carreras_obstaculos';
  if(cat.includes('valla')) return 'carreras_vallas';
  if(cat.includes('medio fondo')) return 'carreras_medio_fondo';
  if(cat.includes('fondo')) return 'carreras_fondo';
  return 'carreras_velocidad';
}

function buildAtletismoMarca(comp, match){
  const participants = match.participants || [];
  const tipo = comp.atletismoTipo; // 'tiempo', 'distancia', 'puntos'
  const modalidad = comp.atletismoModalidad; // 'carreras', 'lanzamiento', 'salto', 'combinados'

  if(tipo === 'tiempo'){
    return buildAtletismoCarreras(participants, comp);
  } else if(tipo === 'distancia'){
    return buildAtletismoCampo(participants, comp);
  } else if(tipo === 'puntos'){
    return buildAtletismoCombinados(participants, comp);
  }
  return '';
}

/* ── CARRERAS (time-based, lane UI) ── */
function buildAtletismoCarreras(participants, comp){
  let html = `<div class="scoring-grid">
    <div class="atl-section-title">
      REGISTRO DE TIEMPOS — ${comp.categoria}
      <span class="atl-unit-badge">Menor tiempo gana</span>
    </div>
    <div class="atl-lanes-wrap">`;

  participants.forEach((p, idx) => {
    const lc = LANE_COLORS[idx % LANE_COLORS.length];
    html += `<div class="atl-lane" id="atl-lane-${idx}" data-idx="${idx}">
      <div class="atl-lane-border" style="background:${lc.border}"></div>
      <div class="atl-lane-num" style="background:${lc.fill};border:2px solid ${lc.border};color:${lc.text}">${idx+1}</div>
      <div class="atl-lane-info">
        <div class="atl-lane-name">${p}</div>
        <div class="atl-lane-sub">Carril ${idx+1}</div>
      </div>
      <div class="atl-lane-input-wrap">
        <div class="atl-status-dot" id="atl-dot-${idx}"></div>
        <div class="atl-seg-input" id="atl-seg-${idx}">
          <input class="atl-seg-field" id="atl-min-${idx}" type="text" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="min" oninput="atlSegInput(this)" onkeydown="atlSegKey(event,this)"/>
          <span class="atl-seg-sep">:</span>
          <input class="atl-seg-field" id="atl-sec-${idx}" type="text" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="sec" oninput="atlSegInput(this)" onkeydown="atlSegKey(event,this)"/>
          <span class="atl-seg-sep">.</span>
          <input class="atl-seg-field atl-seg-ms" id="atl-ms-${idx}" type="text" placeholder="00" maxlength="2" data-idx="${idx}" data-seg="ms" oninput="atlSegInput(this)"/>
        </div>
        <input class="atl-lane-input" id="atl-time-${idx}" type="hidden" data-idx="${idx}"/>
      </div>
      <div class="atl-rank-badge" id="atl-rank-${idx}">-</div>
    </div>`;
  });

  html += `</div></div>`;
  return html;
}

/* ── LANZAMIENTO / SALTO (distance-based, 3 attempts) ── */
function buildAtletismoCampo(participants, comp){
  const numAttempts = 3;
  let html = `<div class="scoring-grid">
    <div class="atl-section-title">
      REGISTRO DE MARCAS — ${comp.categoria}
      <span class="atl-unit-badge">Mayor distancia gana</span>
    </div>
    <table class="atl-field-table">
      <thead><tr>
        <th style="width:40px">POS</th>
        <th style="text-align:left">PARTICIPANTE</th>
        ${Array.from({length:numAttempts},(_,i) => `<th>Int. ${i+1}</th>`).join('')}
        <th style="width:70px">MEJOR</th>
      </tr></thead>
      <tbody>`;

  participants.forEach((p, idx) => {
    const lc = LANE_COLORS[idx % LANE_COLORS.length];
    html += `<tr data-pidx="${idx}">
      <td>
        <div class="atl-lane-num" style="background:${lc.fill};border:2px solid ${lc.border};color:${lc.text};width:28px;height:28px;font-size:11px;margin:0 auto">${idx+1}</div>
      </td>
      <td style="text-align:left">
        <div style="font-weight:600;font-size:13px">${p}</div>
      </td>`;
    for(let a=0;a<numAttempts;a++){
      html += `<td>
        <div style="display:flex;align-items:center;gap:4px;justify-content:center">
          <input class="atl-attempt-input" id="atl-att-${idx}-${a}" type="text"
            placeholder="m" data-pidx="${idx}" data-att="${a}"
            oninput="atlFieldInput(this)" onblur="atlFieldBlur(this)"/>
          <button class="atl-nulo-btn" title="Marcar NULO"
            onclick="atlToggleNulo(this,${idx},${a})">X</button>
        </div>
      </td>`;
    }
    html += `<td>
        <div class="atl-best-cell empty" id="atl-best-${idx}">-</div>
      </td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}

/* ── COMBINADOS (points-based) — tabbed per event ── */
function buildAtletismoCombinados(participants, comp){
  const events = COMBINADO_EVENTS[comp.categoria] || [combEvent('Prueba 1','distancia','m','0.00','🏃')];
  const evCount = events.length;

  let html = `<div class="scoring-grid" data-ev-count="${evCount}">
    <div class="comb-leader-card" id="combLeaderCard">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;margin-bottom:2px">PUNTUACIÓN COMBINADA — ${comp.categoria}</div>
          <div style="font-size:12px;color:var(--text-secondary)" id="combProgress">Pruebas completadas: 0 de ${evCount}</div>
        </div>
        <div id="combLeaderWrap" style="display:none;text-align:right">
          <div style="font-size:10px;font-weight:500;color:var(--text-secondary);letter-spacing:.3px">LÍDER</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span id="combLeaderName" style="font:600 14px var(--font);color:var(--text-primary)">—</span>
            <span id="combLeaderPts" style="font:600 16px var(--font);color:var(--accent)">0 pts</span>
          </div>
        </div>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;margin-top:10px;overflow:hidden">
        <div id="combProgressBar" style="height:100%;width:0%;background:var(--accent);border-radius:2px;transition:width .3s ease"></div>
      </div>
    </div>`;

  /* Event tabs */
  html += `<div class="comb-event-tabs">`;
  events.forEach((ev, eIdx) => {
    html += `<button class="comb-event-tab ${eIdx===0?'active':''}" data-eidx="${eIdx}" onclick="switchCombEvent(${eIdx})">
      <span class="comb-tab-dot"></span>
      ${ev.name}
    </button>`;
  });
  html += `</div>`;

  /* Event panels — one per event */
  events.forEach((ev, eIdx) => {
    html += `<div class="comb-event-panel ${eIdx===0?'active':''}" id="combPanel-${eIdx}">
      <div class="comb-event-info">
        <div>
          <div class="comb-event-name">${ev.name}</div>
          <div class="comb-event-type">${ev.tipo === 'tiempo' ? 'Tiempo' : 'Distancia'} — Ingresa ${ev.tipo === 'tiempo' ? 'el tiempo en ' + ev.unidad : 'la distancia en ' + ev.unidad}</div>
        </div>
      </div>
      <div class="comb-participants">`;

    participants.forEach((p, idx) => {
      const lc = LANE_COLORS[idx % LANE_COLORS.length];
      const shortName = p.length > 12 ? p.substring(0,11)+'…' : p;
      html += `<div class="comb-row" id="combRow-${eIdx}-${idx}">
        <div class="comb-row-pos" style="background:${lc.fill};border:2px solid ${lc.border};color:${lc.text}">${idx+1}</div>
        <div class="comb-row-name">${shortName}</div>
        <div class="comb-row-input">
          <input type="text" id="combVal-${eIdx}-${idx}"
            placeholder="${ev.placeholder}"
            data-eidx="${eIdx}" data-pidx="${idx}" data-tipo="${ev.tipo}" data-format="${ev.format}"
            oninput="combValueInput(this)"
            onblur="combValueBlur(this)"/>
          <span class="comb-unit">${ev.unidad}</span>
        </div>
        <div class="comb-row-pts" id="combPts-${eIdx}-${idx}">— pts</div>
        <div class="comb-row-ded-btns" style="display:flex;align-items:center;gap:2px;margin-left:2px">
          <button type="button" class="comb-ded-btn" onclick="combDeduccion(${idx},-40)" title="−40 pts">-40</button>
          <button type="button" class="comb-ded-btn comb-ded-btn-30" onclick="combDeduccion(${idx},-30)" title="−30 pts">-30</button>
          <span class="comb-ded-val-inline" id="combDedRow-${eIdx}-${idx}">0</span>
        </div>
      </div>`;
    });

    html += `</div></div>`;
  });

  /* Summary table */
  html += `<div class="comb-summary" style="--ev-count:${evCount}">
    <div class="comb-summary-head">
      <div>#</div><div>PARTICIPANTE</div>
      ${events.map(ev => `<div style="text-align:center">${ev.name.length > 8 ? ev.name.substring(0,7)+'.' : ev.name}</div>`).join('')}
      <div style="text-align:center">DED</div>
      <div style="text-align:right">TOTAL</div>
    </div>`;
  participants.forEach((p, idx) => {
    const lc = LANE_COLORS[idx % LANE_COLORS.length];
    html += `<div class="comb-summary-row" data-pidx="${idx}">
      <div><div class="atl-lane-num" style="background:${lc.fill};border:2px solid ${lc.border};color:${lc.text};width:24px;height:24px;font-size:10px">${idx+1}</div></div>
      <div style="font-weight:500;font-size:12px">${p}</div>
      ${events.map((_,eIdx) => `<div class="comb-s-pts" id="combSPts-${eIdx}-${idx}">-</div>`).join('')}
      <div class="comb-s-ded" id="combSDed-${idx}" style="text-align:center;color:#d74009;font-weight:600;font-size:11px">0</div>
      <div class="comb-s-total empty" id="combSTotal-${idx}">0</div>
    </div>`;
  });
  html += `</div>`;

  html += `</div>`;

  return html;
}

/* ═══ ATLETISMO — Live ranking logic ═══ */

/* Parse time string (mm:ss.ms or ss.ms) → total seconds as float */
function atlParseTime(str){
  str = str.trim();
  if(!str) return null;
  // mm:ss.ms
  const full = str.match(/^(\d{1,2}):(\d{1,2})\.(\d{1,2})$/);
  if(full){
    return parseInt(full[1])*60 + parseInt(full[2]) + parseInt(full[3])/(full[3].length===1?10:100);
  }
  // ss.ms
  const short = str.match(/^(\d{1,3})\.(\d{1,2})$/);
  if(short){
    return parseInt(short[1]) + parseInt(short[2])/(short[2].length===1?10:100);
  }
  // just seconds
  const sec = str.match(/^(\d+)$/);
  if(sec) return parseInt(sec[1]);
  return null;
}

/* ── Segmented time input (min:sec.ms) ── */
function atlSegInput(el){
  /* Allow only digits */
  el.value = el.value.replace(/\D/g,'').substring(0, 2);
  const idx = el.dataset.idx;
  const minEl = document.getElementById('atl-min-'+idx);
  const secEl = document.getElementById('atl-sec-'+idx);
  const msEl = document.getElementById('atl-ms-'+idx);
  const hiddenEl = document.getElementById('atl-time-'+idx);
  const segWrap = document.getElementById('atl-seg-'+idx);
  const m = minEl.value.padStart(2,'0');
  const s = secEl.value.padStart(2,'0');
  const ms = msEl.value.padStart(2,'0');
  const hasAny = minEl.value || secEl.value || msEl.value;
  if(hasAny){
    hiddenEl.value = m+':'+s+'.'+ms;
    segWrap.classList.add('has-value');
    document.getElementById('atl-dot-'+idx)?.classList.add('done');
    const lane = document.getElementById('atl-lane-'+idx);
    if(lane) lane.classList.add('completed');
  } else {
    hiddenEl.value = '';
    segWrap.classList.remove('has-value');
    document.getElementById('atl-dot-'+idx)?.classList.remove('done');
    const lane = document.getElementById('atl-lane-'+idx);
    if(lane) lane.classList.remove('completed');
  }
  /* Auto-advance to next field when 2 digits typed */
  if(el.value.length === 2){
    const seg = el.dataset.seg;
    if(seg === 'min') secEl.focus();
    else if(seg === 'sec') msEl.focus();
  }
  atlRecalcCarreras();
  checkSaveReady();
}
function atlSegKey(e, el){
  /* On backspace in empty field, go to previous */
  if(e.key === 'Backspace' && el.value === ''){
    const idx = el.dataset.idx;
    const seg = el.dataset.seg;
    if(seg === 'ms') document.getElementById('atl-sec-'+idx)?.focus();
    else if(seg === 'sec') document.getElementById('atl-min-'+idx)?.focus();
  }
}

function atlTimeInput(el){
  const digits = el.value.replace(/\D/g,'').substring(0,6);
  let masked = '';
  if(digits.length > 0){
    masked = digits.substring(0,2);
    if(digits.length > 2) masked += ':' + digits.substring(2,4);
    if(digits.length > 4) masked += '.' + digits.substring(4,6);
  }
  el.value = masked;
  if(el.value){
    el.classList.add('has-value');
    document.getElementById('atl-dot-'+el.dataset.idx).classList.add('done');
  } else {
    el.classList.remove('has-value');
    document.getElementById('atl-dot-'+el.dataset.idx).classList.remove('done');
  }
  atlRecalcCarreras();
  checkSaveReady();
}
function atlTimeBlur(el){
  // Pad to full MM:SS.ms on blur if partially filled
  const digits = el.value.replace(/\D/g,'');
  if(digits.length > 0 && digits.length < 6){
    const padded = digits.padEnd(6,'0');
    el.value = padded.substring(0,2)+':'+padded.substring(2,4)+'.'+padded.substring(4,6);
  }
  atlRecalcCarreras();
}

function atlRecalcCarreras(){
  const lanes = document.querySelectorAll('.atl-lane');
  if(!lanes.length) return;
  const entries = [];
  lanes.forEach(lane => {
    const idx = parseInt(lane.dataset.idx);
    const input = document.getElementById('atl-time-'+idx);
    const t = atlParseTime(input.value);
    entries.push({idx, time:t});
  });
  // Sort: valid times ascending, nulls at end
  const ranked = entries.filter(e=>e.time!==null).sort((a,b)=>a.time-b.time);
  const medals = ['🥇','🥈','🥉'];
  const rankClasses = ['gold','silver','bronze'];
  // Clear all
  entries.forEach(e=>{
    const badge = document.getElementById('atl-rank-'+e.idx);
    badge.textContent = '-';
    badge.className = 'atl-rank-badge';
  });
  // Assign ranks
  ranked.forEach((e,pos)=>{
    const badge = document.getElementById('atl-rank-'+e.idx);
    if(pos<3){
      badge.textContent = medals[pos];
      badge.className = 'atl-rank-badge '+rankClasses[pos];
    } else {
      badge.textContent = pos+1;
      badge.className = 'atl-rank-badge';
    }
  });
}

/* ── Field events (distance) ── */
function atlFieldInput(el){
  // Allow digits and one decimal point only
  let val = el.value.replace(/[^0-9.]/g,'');
  const dotIdx = val.indexOf('.');
  if(dotIdx !== -1) val = val.substring(0,dotIdx+1) + val.substring(dotIdx+1).replace(/\./g,'');
  if(val !== el.value) el.value = val;
  if(el.value && !el.classList.contains('nulo')){
    el.classList.add('has-value');
  } else if(!el.classList.contains('nulo')){
    el.classList.remove('has-value');
  }
  atlRecalcField();
  checkSaveReady();
}
function atlFieldBlur(el){
  if(el.classList.contains('nulo')) return;
  const v = parseFloat(el.value);
  if(!isNaN(v)) el.value = v.toFixed(2);
  atlRecalcField();
  checkSaveReady();
}
function atlToggleNulo(btn, pidx, att){
  btn.classList.toggle('active');
  const input = document.getElementById('atl-att-'+pidx+'-'+att);
  if(btn.classList.contains('active')){
    input.classList.add('nulo');
    input.classList.remove('has-value');
    input.value = 'NULO';
    input.readOnly = true;
  } else {
    input.classList.remove('nulo');
    input.value = '';
    input.readOnly = false;
  }
  atlRecalcField();
}

function atlRecalcField(){
  const rows = document.querySelectorAll('.atl-field-table tbody tr');
  if(!rows.length) return;
  const entries = [];
  rows.forEach(row => {
    const pidx = parseInt(row.dataset.pidx);
    let best = null;
    for(let a=0;a<3;a++){
      const input = document.getElementById('atl-att-'+pidx+'-'+a);
      if(!input) continue;
      if(input.classList.contains('nulo')) continue;
      const v = parseFloat(input.value);
      if(!isNaN(v) && (best===null || v>best)) best = v;
    }
    const bestEl = document.getElementById('atl-best-'+pidx);
    if(best!==null){
      bestEl.textContent = best.toFixed(2)+' m';
      bestEl.className = 'atl-best-cell';
    } else {
      bestEl.textContent = '-';
      bestEl.className = 'atl-best-cell empty';
    }
    entries.push({pidx, best});
  });
  // Rank by best descending
  const ranked = entries.filter(e=>e.best!==null).sort((a,b)=>b.best-a.best);
  const medals = ['🥇','🥈','🥉'];
  // Update pos column with rank
  rows.forEach(row => {
    const pidx = parseInt(row.dataset.pidx);
    const posCell = row.querySelector('.atl-lane-num');
    const ri = ranked.findIndex(e=>e.pidx===pidx);
    if(ri>=0 && ri<3 && posCell){
      posCell.textContent = medals[ri];
      posCell.style.fontSize = '14px';
    } else if(ri>=0 && posCell){
      posCell.textContent = ri+1;
      posCell.style.fontSize = '11px';
    } else if(posCell) {
      posCell.textContent = pidx+1;
      posCell.style.fontSize = '11px';
    }
  });
}

/* ── Combinados (points) ── */
/* ── Combinados: scoring tables (IAAF-like point conversion) ── */
/* Simplified point tables — real IAAF uses complex formulas, here we approximate */
const COMB_POINT_TABLES = {
  '100m':       {a:25.4347, b:18, c:1.81, tipo:'tiempo'},
  '200m':       {a:5.8425, b:38, c:1.81, tipo:'tiempo'},
  '400m':       {a:1.53775, b:82, c:1.81, tipo:'tiempo'},
  '800m':       {a:0.11193, b:254, c:1.88, tipo:'tiempo'},
  '1000m':      {a:0.08713, b:305.5, c:1.85, tipo:'tiempo'},
  '1500m':      {a:0.03768, b:480, c:1.85, tipo:'tiempo'},
  '60m Vallas': {a:20.0479, b:17, c:1.81, tipo:'tiempo'},
  '100m Vallas':{a:9.23076, b:26.7, c:1.835, tipo:'tiempo'},
  '110m Vallas':{a:5.74352, b:28.5, c:1.92, tipo:'tiempo'},
  'Salto Largo': {a:0.14354, b:220, c:1.4, tipo:'distancia_cm'},
  'Salto Alto':  {a:0.8465, b:75, c:1.42, tipo:'distancia_cm'},
  'Salto Pértiga':{a:0.2797, b:100, c:1.35, tipo:'distancia_cm'},
  'Lanz. Bala':  {a:51.39, b:1.5, c:1.05, tipo:'distancia_m'},
  'Lanz. Disco': {a:12.91, b:4, c:1.1, tipo:'distancia_m'},
  'Lanz. Jabalina':{a:10.14, b:7, c:1.08, tipo:'distancia_m'}
};

function combCalcPoints(eventName, rawValue){
  const table = COMB_POINT_TABLES[eventName];
  if(!table || rawValue === null || isNaN(rawValue)) return 0;
  let pts = 0;
  if(table.tipo === 'tiempo'){
    /* For running events: pts = A * (B - T)^C where T is time in seconds */
    const diff = table.b - rawValue;
    if(diff <= 0) return 0;
    pts = Math.floor(table.a * Math.pow(diff, table.c));
  } else if(table.tipo === 'distancia_cm'){
    /* For jumps: pts = A * (D_cm - B)^C where D is distance in cm */
    const cm = rawValue * 100;
    const diff = cm - table.b;
    if(diff <= 0) return 0;
    pts = Math.floor(table.a * Math.pow(diff, table.c));
  } else {
    /* For throws: pts = A * (D_m - B)^C */
    const diff = rawValue - table.b;
    if(diff <= 0) return 0;
    pts = Math.floor(table.a * Math.pow(diff, table.c));
  }
  return Math.max(0, Math.min(pts, 1500));
}

function combParseValue(str, tipo){
  str = (str||'').trim();
  if(!str) return null;
  if(tipo === 'tiempo'){
    /* Accept mm:ss.cc or ss.cc */
    if(str.includes(':')){
      const parts = str.split(':');
      const min = parseFloat(parts[0]) || 0;
      const sec = parseFloat(parts[1]) || 0;
      return min * 60 + sec;
    }
    return parseFloat(str) || null;
  } else {
    return parseFloat(str) || null;
  }
}

function switchCombEvent(eIdx){
  document.querySelectorAll('.comb-event-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.comb-event-panel').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector(`.comb-event-tab[data-eidx="${eIdx}"]`);
  const panel = document.getElementById('combPanel-'+eIdx);
  if(tab) tab.classList.add('active');
  if(panel) panel.classList.add('active');
}

/* ── Input masks for combined events ── */
function combMaskSeconds(raw){
  /* ss.cc — max 2 digits seconds, dot auto, max 2 decimals */
  let digits = raw.replace(/[^0-9]/g,'');
  if(digits.length > 4) digits = digits.substring(0,4);
  if(digits.length <= 2) return digits;
  return digits.substring(0,2) + '.' + digits.substring(2);
}

function combMaskMinSec(raw){
  /* m:ss.mss — 1 digit min, colon auto, 2 digits sec, dot auto, 3 decimals (milliseconds) */
  let digits = raw.replace(/[^0-9]/g,'');
  if(digits.length > 6) digits = digits.substring(0,6);
  if(digits.length <= 1) return digits;
  if(digits.length <= 3) return digits.substring(0,1) + ':' + digits.substring(1);
  return digits.substring(0,1) + ':' + digits.substring(1,3) + '.' + digits.substring(3);
}

function combMaskDistance(raw){
  /* dd.cc — digits, single dot, max 2 decimals */
  let val = raw.replace(/[^0-9.]/g,'');
  const dotIdx = val.indexOf('.');
  if(dotIdx !== -1){
    val = val.substring(0,dotIdx+1) + val.substring(dotIdx+1).replace(/\./g,'');
    /* Max 2 decimals */
    if(val.length > dotIdx + 3) val = val.substring(0, dotIdx + 3);
  }
  /* Max 2 digits before dot for jumps, or more for throws */
  return val;
}

function combValueInput(el){
  const fmt = el.dataset.format || 'dd.cc';
  const cursorPos = el.selectionStart;
  const oldLen = el.value.length;
  let val = el.value;

  if(fmt === 'ss.cc'){
    val = combMaskSeconds(val);
  } else if(fmt === 'm:ss.cc' || fmt === 'm:ss.ms'){
    val = combMaskMinSec(val);
  } else {
    val = combMaskDistance(val);
  }

  if(val !== el.value){
    el.value = val;
    /* Try to maintain cursor position */
    const diff = val.length - oldLen;
    const newPos = Math.max(0, cursorPos + diff);
    el.setSelectionRange(newPos, newPos);
  }

  const row = el.closest('.comb-row');
  if(el.value){
    el.classList.add('has-value');
    if(row) row.classList.add('has-value');
  } else {
    el.classList.remove('has-value');
    if(row) row.classList.remove('has-value');
  }
  combRecalc();
  checkSaveReady();
}

function combValueBlur(el){
  const fmt = el.dataset.format || 'dd.cc';
  let val = el.value.trim();
  if(!val) return;

  /* Auto-pad on blur for nicer display */
  if(fmt === 'ss.cc'){
    const parts = val.split('.');
    if(parts.length === 1) val = val + '.00';
    else if(parts[1].length === 1) val = parts[0] + '.' + parts[1] + '0';
  } else if(fmt === 'm:ss.ms'){
    /* Ensure m:ss.mss format (milliseconds) */
    if(!val.includes(':') && val.length <= 2){
      val = '0:' + val.padStart(2,'0') + '.000';
    } else if(val.includes(':') && !val.includes('.')){
      val = val + '.000';
    } else if(val.includes(':') && val.includes('.')){
      const [minSec, ms] = val.split('.');
      val = minSec + '.' + (ms||'').padEnd(3,'0').substring(0,3);
    }
  } else {
    const parts = val.split('.');
    if(parts.length === 1) val = val + '.00';
    else if(parts[1].length === 1) val = parts[0] + '.' + parts[1] + '0';
  }

  el.value = val;
  combRecalc();
}

/* ── Deducciones storage (combinados) ── */
const _combDeducciones = {};

function combDeduccion(pidx, amount){
  if(amount === 0){
    _combDeducciones[pidx] = 0;
  } else {
    _combDeducciones[pidx] = (_combDeducciones[pidx] || 0) + amount;
  }
  const val = _combDeducciones[pidx] || 0;
  const valStr = val === 0 ? '0' : String(val);
  /* Update all inline ded displays across event panels */
  document.querySelectorAll(`[id^="combDedRow-"][id$="-${pidx}"]`).forEach(el => {
    el.textContent = valStr;
    el.style.color = val < 0 ? '#9b3a3a' : 'var(--text-secondary)';
  });
  combRecalc();
}

function combRecalc(){
  const grid = document.querySelector('.scoring-grid[data-ev-count]');
  if(!grid) return;
  const evCount = parseInt(grid.dataset.evCount);
  /* Get current comp events */
  const tabs = document.querySelectorAll('.comb-event-tab');
  const eventNames = [];
  tabs.forEach(t => {
    const txt = t.textContent.trim();
    eventNames.push(txt);
  });

  /* Read events from COMBINADO_EVENTS by checking active comp */
  let events = null;
  for(const cat in COMBINADO_EVENTS){
    if(COMBINADO_EVENTS[cat].length === evCount){ events = COMBINADO_EVENTS[cat]; break; }
  }
  /* More reliable: match by panel count */
  const panels = document.querySelectorAll('.comb-event-panel');
  if(!events && panels.length > 0){
    events = [];
    for(let i=0;i<evCount;i++) events.push({name:'Event '+i, tipo:'distancia'});
  }
  if(!events) return;

  /* Collect all values and compute points */
  const pCount = document.querySelectorAll('#combPanel-0 .comb-row').length;
  const totals = new Array(pCount).fill(0);
  const hasAny = new Array(pCount).fill(false);
  let evDone = 0;

  events.forEach((ev, eIdx) => {
    let allFilled = true;
    for(let p=0; p<pCount; p++){
      const input = document.getElementById('combVal-'+eIdx+'-'+p);
      if(!input) continue;
      const raw = combParseValue(input.value, ev.tipo);
      const pts = raw !== null ? combCalcPoints(ev.name, raw) : 0;
      const ptsEl = document.getElementById('combPts-'+eIdx+'-'+p);
      const summPtsEl = document.getElementById('combSPts-'+eIdx+'-'+p);
      if(raw !== null){
        if(ptsEl){ ptsEl.textContent = pts + ' pts'; ptsEl.classList.add('has-pts'); }
        if(summPtsEl){ summPtsEl.textContent = pts; summPtsEl.classList.add('filled'); }
        totals[p] += pts;
        hasAny[p] = true;
      } else {
        if(ptsEl){ ptsEl.textContent = '— pts'; ptsEl.classList.remove('has-pts'); }
        if(summPtsEl){ summPtsEl.textContent = '-'; summPtsEl.classList.remove('filled'); }
        allFilled = false;
      }
    }
    /* Mark tab as done if all participants filled */
    const tab = document.querySelector(`.comb-event-tab[data-eidx="${eIdx}"]`);
    if(tab){
      if(allFilled && pCount > 0) { tab.classList.add('done'); evDone++; }
      else tab.classList.remove('done');
    }
  });

  /* Apply deducciones and update summary totals */
  for(let p=0; p<pCount; p++){
    const ded = _combDeducciones[p] || 0;
    totals[p] = Math.max(0, totals[p] + ded);
    /* Update ded column in summary */
    const dedSEl = document.getElementById('combSDed-'+p);
    if(dedSEl){
      dedSEl.textContent = ded === 0 ? '0' : ded;
      dedSEl.style.color = ded < 0 ? '#c0392b' : 'var(--text-secondary)';
    }
    const totalEl = document.getElementById('combSTotal-'+p);
    if(totalEl){
      if(hasAny[p]){
        totalEl.textContent = totals[p];
        totalEl.className = 'comb-s-total';
      } else {
        totalEl.textContent = '0';
        totalEl.className = 'comb-s-total empty';
      }
    }
  }

  /* Update leader card */
  const progressEl = document.getElementById('combProgress');
  const progressBar = document.getElementById('combProgressBar');
  const leaderWrap = document.getElementById('combLeaderWrap');
  const leaderName = document.getElementById('combLeaderName');
  const leaderPts = document.getElementById('combLeaderPts');
  if(progressEl) progressEl.textContent = `Pruebas completadas: ${evDone} de ${evCount}`;
  if(progressBar) progressBar.style.width = (evCount > 0 ? Math.round(evDone/evCount*100) : 0) + '%';
  const ranked = totals.map((t,i) => ({idx:i, total:t, has:hasAny[i]})).filter(e=>e.has).sort((a,b)=>b.total-a.total);
  if(leaderWrap){
    if(ranked.length > 0){
      leaderWrap.style.display = '';
      const panels0 = document.querySelectorAll('#combPanel-0 .comb-row-name');
      const name = panels0[ranked[0].idx]?.textContent || '';
      if(leaderName) leaderName.textContent = name;
      if(leaderPts) leaderPts.textContent = ranked[0].total + ' pts';
    } else {
      leaderWrap.style.display = 'none';
    }
  }
}

/* ═══ EVALUACIÓN DE JUECES ═══ */
let _judgesState = null;
let _judgesSport = null;

function buildJudgesSection(sport, match){
  const participants = match.participants || match.teams;
  const numJueces = sport.numJueces || 5;
  const componentes = sport.componentes || ['Puntuación'];
  const hasDedConfig = sport.deducciones && sport.deduccionesConfig && sport.deduccionesConfig.length > 0;

  /* Initialize state */
  _judgesState = { scores:{}, deducciones:{} };
  _judgesSport = sport;
  participants.forEach((_,pIdx) => {
    _judgesState.scores[pIdx] = {};
    _judgesState.deducciones[pIdx] = {};
    componentes.forEach((_,cIdx) => { _judgesState.scores[pIdx][cIdx] = {}; });
    if(hasDedConfig) sport.deduccionesConfig.forEach((_,dIdx) => { _judgesState.deducciones[pIdx][dIdx] = 0; });
  });

  let html = `<div class="scoring-grid">
    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;margin-bottom:12px">
      EVALUACIÓN DE JUECES
    </div>
    <div class="judge-participant-tabs">
      ${participants.map((p, i) => `<button type="button" class="judge-participant-tab${i===0?' active':''}" data-pidx="${i}" onclick="switchJudgeParticipant(${i})">
        <span class="jp-dot"></span>
        ${p}
        <span class="jp-score" id="jpScore_${i}"></span>
      </button>`).join('')}
    </div>`;

  participants.forEach((p, pIdx) => {
    html += `<div class="judge-participant-panel${pIdx===0?' active':''}" data-pidx="${pIdx}" id="judgeCard_${pIdx}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--text-primary)">
          <span class="marca-pos">${pIdx+1}</span> ${p}
        </div>
        <div style="display:flex;align-items:baseline;gap:6px">
          <span style="font-size:11px;font-weight:500;color:var(--text-secondary);letter-spacing:.3px">TOTAL</span>
          <span class="judge-total" id="judgeTotal_${pIdx}" style="font-size:22px;font-weight:600;color:var(--accent);font-variant-numeric:tabular-nums">0.00</span>
        </div>
      </div>`;

    componentes.forEach((comp, cIdx) => {
      html += `<div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);letter-spacing:.3px;margin-bottom:8px">${comp.toUpperCase()}</div>
        <div class="judge-grid">
          ${Array.from({length:numJueces}, (_,j) => `<div class="judge-card" style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div class="judge-label">JUEZ ${j+1}</div>
            <div class="stat-counter-controls">
              <button class="counter-btn" type="button" onclick="adjustJudgeScore(${pIdx},${cIdx},${j},-0.5)">−</button>
              <div class="counter-val" id="jScore_${pIdx}_${cIdx}_${j}" style="font-size:14px;font-variant-numeric:tabular-nums;width:52px">0.00</div>
              <button class="counter-btn" type="button" onclick="adjustJudgeScore(${pIdx},${cIdx},${j},0.5)">+</button>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
    });

    /* Deduction counters with +/− controls */
    if(hasDedConfig){
      html += `<div style="margin-top:8px;padding-top:12px;border-top:1px dashed var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:11px;font-weight:600;color:#c0392b;letter-spacing:.3px">DEDUCCIONES</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;font-weight:500;color:var(--text-secondary)">Total:</span>
            <span id="dedTotal_${pIdx}" style="font-size:14px;font-weight:600;color:#c0392b;font-variant-numeric:tabular-nums">0.00</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">`;
      sport.deduccionesConfig.forEach((ded, dIdx) => {
        html += `<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface)">
            <div style="flex:1;min-width:0">
              <div style="font:500 12px var(--font);color:var(--text-primary)">${ded.label}</div>
              <div style="font:500 10px var(--font);color:var(--text-secondary)">${ded.nivel} · ${ded.valor} pts</div>
            </div>
            <div class="stat-counter-controls">
              <button class="counter-btn" type="button" onclick="adjustJudgeDeduction(${pIdx},${dIdx},-1)">−</button>
              <div class="counter-val" id="dedCount_${pIdx}_${dIdx}" style="font-size:14px;width:40px">0</div>
              <button class="counter-btn" type="button" onclick="adjustJudgeDeduction(${pIdx},${dIdx},1)">+</button>
            </div>
            <span id="dedSubtotal_${pIdx}_${dIdx}" style="min-width:50px;text-align:right;font:600 13px var(--font);color:var(--text-primary);font-variant-numeric:tabular-nums">0.00</span>
          </div>`;
      });
      html += `</div>
      </div>`;
    } else if(sport.deducciones){
      /* Simple deductions input (legacy) */
      html += `<div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:11px;font-weight:600;color:var(--text-secondary)">DEDUCCIONES:</span>
        <input class="score-input wide" type="number" step="0.01" min="0" placeholder="0.00" data-pidx="${pIdx}" oninput="recalcJudges()"/>
      </div>`;
    }

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

function switchJudgeParticipant(pIdx){
  document.querySelectorAll('.judge-participant-tab').forEach(t => {
    const isActive = parseInt(t.dataset.pidx) === pIdx;
    t.classList.toggle('active', isActive);
  });
  document.querySelectorAll('.judge-participant-panel').forEach(p => {
    const isActive = parseInt(p.dataset.pidx) === pIdx;
    p.classList.toggle('active', isActive);
  });
}

function onJudgeInput(input){
  const pIdx = parseInt(input.dataset.pidx);
  const cIdx = parseInt(input.dataset.cidx);
  const jIdx = parseInt(input.dataset.jidx);
  if(!_judgesState) return;
  _judgesState.scores[pIdx][cIdx][jIdx] = parseFloat(input.value) || 0;
  recalcJudges();
}

function adjustJudgeScore(pIdx, cIdx, jIdx, delta){
  if(!_judgesState) return;
  const current = _judgesState.scores[pIdx][cIdx][jIdx] || 0;
  const newVal = Math.min(10, Math.max(0, +(current + delta).toFixed(2)));
  _judgesState.scores[pIdx][cIdx][jIdx] = newVal;
  const el = document.getElementById(`jScore_${pIdx}_${cIdx}_${jIdx}`);
  if(el){
    el.textContent = newVal.toFixed(2);
    el.style.color = newVal > 0 ? 'var(--accent)' : '';
    el.style.fontWeight = newVal > 0 ? '800' : '';
  }
  recalcJudges();
}

function adjustJudgeDeduction(pIdx, dIdx, delta){
  if(!_judgesState || !_judgesSport) return;
  const current = _judgesState.deducciones[pIdx][dIdx] || 0;
  const newVal = Math.max(0, current + delta);
  _judgesState.deducciones[pIdx][dIdx] = newVal;

  const countEl = document.getElementById(`dedCount_${pIdx}_${dIdx}`);
  if(countEl){
    countEl.textContent = newVal;
    countEl.style.color = newVal > 0 ? 'var(--accent)' : '';
    countEl.style.fontWeight = newVal > 0 ? '800' : '';
  }
  /* Show subtotal per deduction type */
  const ded = _judgesSport.deduccionesConfig[dIdx];
  const subtotal = newVal * Math.abs(ded.valor);
  const subEl = document.getElementById(`dedSubtotal_${pIdx}_${dIdx}`);
  if(subEl){
    subEl.textContent = subtotal > 0 ? '-' + subtotal.toFixed(2) : '0.00';
    subEl.style.color = subtotal > 0 ? '#c0392b' : 'var(--text-secondary)';
  }
  recalcJudges();
}

/* Legacy compat */
function applyJudgeDeduction(pIdx, dIdx){ adjustJudgeDeduction(pIdx, dIdx, 1); }

function resetJudgeDeductions(pIdx){
  if(!_judgesState || !_judgesSport) return;
  _judgesSport.deduccionesConfig.forEach((_, dIdx) => {
    _judgesState.deducciones[pIdx][dIdx] = 0;
    const countEl = document.getElementById(`dedCount_${pIdx}_${dIdx}`);
    if(countEl) countEl.textContent = '0';
    const subEl = document.getElementById(`dedSubtotal_${pIdx}_${dIdx}`);
    if(subEl) subEl.textContent = '0.00';
  });
  recalcJudges();
}

/* ═══ RECALC FUNCTIONS ═══ */
function recalcTotals(fromPeriod){
  if(fromPeriod) _directScoreOverride = false;
  let t1=0, t2=0;
  document.querySelectorAll('.score-input[data-team="1"][data-col]').forEach(inp => {
    t1 += parseInt(inp.value) || 0;
  });
  document.querySelectorAll('.score-input[data-team="2"][data-col]').forEach(inp => {
    t2 += parseInt(inp.value) || 0;
  });
  /* Include extra time scores (exclude penales — they show separately) */
  let et1=0, et2=0, pen1=0, pen2=0;
  document.querySelectorAll('.score-input[data-team="1"][data-extra-time]').forEach(inp => {
    if(inp.dataset.penales) pen1 += parseInt(inp.value) || 0;
    else et1 += parseInt(inp.value) || 0;
  });
  document.querySelectorAll('.score-input[data-team="2"][data-extra-time]').forEach(inp => {
    if(inp.dataset.penales) pen2 += parseInt(inp.value) || 0;
    else et2 += parseInt(inp.value) || 0;
  });
  const total1 = t1 + et1, total2 = t2 + et2;
  /* Update VS header scores */
  const ts1 = document.getElementById('totalScore1');
  const ts2 = document.getElementById('totalScore2');
  if(!_directScoreOverride){
    if(ts1) ts1.value = total1;
    if(ts2) ts2.value = total2;
  }
  /* Penales indicator (parentheses beside score) */
  const penWrap1 = document.getElementById('penalesIndicator1');
  const penWrap2 = document.getElementById('penalesIndicator2');
  if(pen1 > 0 || pen2 > 0){
    if(penWrap1){ penWrap1.textContent = '('+pen1+')'; penWrap1.style.display = 'inline'; }
    if(penWrap2){ penWrap2.textContent = '('+pen2+')'; penWrap2.style.display = 'inline'; }
  } else {
    if(penWrap1) penWrap1.style.display = 'none';
    if(penWrap2) penWrap2.style.display = 'none';
  }
  /* Update extra time PTS cells if present */
  const etRows = document.querySelectorAll('#extraTimeParciales .scoring-table tbody tr');
  if(etRows.length >= 2){
    const pts1 = etRows[0].querySelector('.total-col');
    const pts2 = etRows[1].querySelector('.total-col');
    if(pts1) { pts1.textContent = total1; pts1.style.fontWeight = et1>0?'800':'600'; pts1.style.color = et1>0?'var(--accent)':'var(--text-primary)'; }
    if(pts2) { pts2.textContent = total2; pts2.style.fontWeight = et2>0?'800':'600'; pts2.style.color = et2>0?'var(--accent)':'var(--text-primary)'; }
  }
  /* ── Auto-win detection (e.g. 3x3 basketball: first to 21 pts) ── */
  _checkAutoWin(total1, total2);
  checkSaveReady();
}

/* Auto-win: if a sport defines autoWin threshold, show banner when reached */
function _checkAutoWin(t1, t2){
  const sportKey = document.querySelector('.modal')?.dataset?.sportKey;
  const sport = sportKey ? SPORTS_DB[sportKey] : null;
  if(!sport) return;
  let banner = document.getElementById('autoWinBanner');

  /* Helper to get team name */
  function _getWinnerName(winnerIdx){
    const scoreEl = document.getElementById('totalScore'+winnerIdx);
    const header = scoreEl?.closest('.score-header, .vs-header');
    const teams = header?.querySelectorAll('.team-name, .vs-team-name');
    return (winnerIdx === 1 ? teams?.[0] : teams?.[1])?.textContent?.trim() || ('Equipo '+winnerIdx);
  }
  function _showBanner(msg, sub){
    if(!banner){
      banner = document.createElement('div');
      banner.id = 'autoWinBanner';
      const grid = document.querySelector('#tab-marcador .scoring-grid, #bballGrid') || document.querySelector('#tab-marcador');
      if(grid) grid.appendChild(banner);
    }
    banner.style.cssText = 'margin-top:14px;padding:12px 18px;border-radius:var(--radius-lg);background:var(--green-bg);border:1.5px solid var(--green-border);text-align:center;animation:fadeInUp .3s cubic-bezier(.4,0,.2,1)';
    banner.innerHTML = `<div style="font:600 14px var(--font);color:var(--green);margin-bottom:4px">${msg}</div>
      <div style="font:500 11px var(--font);color:var(--green);opacity:.8">${sub}</div>`;
    banner.style.display = '';
  }

  /* Check regular autoWin (e.g. 3x3: first to 21) */
  if(sport.autoWin && (t1 >= sport.autoWin || t2 >= sport.autoWin)){
    const winner = t1 >= sport.autoWin ? 1 : 2;
    _showBanner(`🏆 ¡${_getWinnerName(winner)} alcanzó ${winner===1?t1:t2} puntos!`, `Victoria automática al llegar a ${sport.autoWin} pts`);
    return;
  }

  /* Check prórroga autoWin (e.g. 3x3: first to 2 pts in overtime) */
  if(sport.autoWinProrroga && _bballState && _bballState.prorrogas.length > 0){
    const lastPR = _bballState.prorrogas[_bballState.prorrogas.length - 1];
    const prScores = _bballState.scores[lastPR];
    if(prScores){
      const pr1 = prScores[1] || 0, pr2 = prScores[2] || 0;
      if(pr1 >= sport.autoWinProrroga || pr2 >= sport.autoWinProrroga){
        const winner = pr1 >= sport.autoWinProrroga ? 1 : 2;
        _showBanner(`🏆 ¡${_getWinnerName(winner)} anotó ${winner===1?pr1:pr2} pts en prórroga!`, `Primer equipo en anotar ${sport.autoWinProrroga} pts gana la prórroga`);
        return;
      }
    }
  }

  if(banner) banner.style.display = 'none';
}

function recalcSets(fromPeriod){
  if(fromPeriod) _directScoreOverride = false;
  let s1=0, s2=0;
  const inputs1 = document.querySelectorAll('.score-input[data-team="1"][data-col]');
  const inputs2 = document.querySelectorAll('.score-input[data-team="2"][data-col]');
  inputs1.forEach((inp, i) => {
    const v1 = parseInt(inp.value) || 0;
    const v2 = parseInt(inputs2[i]?.value) || 0;
    if(v1 > v2 && v1 > 0) s1++;
    else if(v2 > v1 && v2 > 0) s2++;
  });
  /* Include extra time scores for sets */
  let et1=0, et2=0;
  document.querySelectorAll('.score-input[data-team="1"][data-extra-time]').forEach(inp => { et1 += parseInt(inp.value) || 0; });
  document.querySelectorAll('.score-input[data-team="2"][data-extra-time]').forEach(inp => { et2 += parseInt(inp.value) || 0; });
  const total1 = s1 + et1, total2 = s2 + et2;
  /* Update VS header scores */
  const ts1 = document.getElementById('totalScore1');
  const ts2 = document.getElementById('totalScore2');
  if(!_directScoreOverride){
    if(ts1) ts1.value = total1;
    if(ts2) ts2.value = total2;
  }
  /* Update extra time PTS cells if present */
  const etRows = document.querySelectorAll('#extraTimeParciales .scoring-table tbody tr');
  if(etRows.length >= 2){
    const pts1 = etRows[0].querySelector('.total-col');
    const pts2 = etRows[1].querySelector('.total-col');
    if(pts1) { pts1.textContent = total1; pts1.style.fontWeight = et1>0?'800':'600'; pts1.style.color = et1>0?'var(--accent)':'var(--text-primary)'; }
    if(pts2) { pts2.textContent = total2; pts2.style.fontWeight = et2>0?'800':'600'; pts2.style.color = et2>0?'var(--accent)':'var(--text-primary)'; }
  }
  checkSaveReady();
}

/* ═══ TIME MASK: mm:ss.ms ═══ */
function formatTimeMask(el){
  /* Strip non-numeric chars */
  let raw = el.value.replace(/[^0-9]/g,'');
  /* Limit to 6 digits: MMSSms */
  if(raw.length > 6) raw = raw.substring(0,6);
  /* Build formatted string */
  let formatted = '';
  if(raw.length <= 2){
    formatted = raw;
  } else if(raw.length <= 4){
    formatted = raw.substring(0,raw.length-2) + ':' + raw.substring(raw.length-2);
  } else {
    formatted = raw.substring(0,raw.length-4) + ':' + raw.substring(raw.length-4,raw.length-2) + '.' + raw.substring(raw.length-2);
  }
  el.value = formatted;
}
function cursorToStart(el){
  if(!el.value || el.value === '00:00.00'){
    el.value = '';
  }
}

function recalcMarca(){
  if(!_modalSportKey) return;
  const sport = SPORTS_DB[_modalSportKey];
  const attempts = sport.intentos || 1;
  if(attempts <= 1) return;
  const isTiempo = sport.tipoMarca === 'tiempo';
  const isLower = sport.tablaOrden !== 'mayor_a_menor';

  const table = document.querySelector('.scoring-table');
  if(!table) return;
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach((row, idx) => {
    const inputs = row.querySelectorAll('input.score-input');
    let best = null;
    inputs.forEach(inp => {
      const raw = inp.value.trim().replace(',','.');
      const v = parseFloat(raw);
      if(isNaN(v)) return;
      if(best === null) best = v;
      else best = isLower ? Math.min(best, v) : Math.max(best, v);
    });
    const cell = document.getElementById(`best_${idx}`);
    if(cell){
      if(best !== null){
        cell.textContent = best % 1 === 0 ? best.toString() : best.toFixed(2);
        cell.style.fontWeight = '800';
        cell.style.color = 'var(--accent)';
        cell.style.fontSize = '14px';
      } else {
        cell.textContent = '-';
        cell.style.fontWeight = '';
        cell.style.color = '';
        cell.style.fontSize = '';
      }
    }
  });
}

function recalcJudges(){
  if(!_judgesState || !_judgesSport) return;
  const sport = _judgesSport;
  const componentes = sport.componentes || ['Puntuación'];
  const hasDedConfig = sport.deduccionesConfig && sport.deduccionesConfig.length > 0;

  Object.keys(_judgesState.scores).forEach(pIdx => {
    let total = 0;
    /* Sum average of each component */
    componentes.forEach((_, cIdx) => {
      const judges = _judgesState.scores[pIdx][cIdx] || {};
      const vals = Object.values(judges).filter(v => v > 0);
      if(vals.length > 0) total += vals.reduce((a,b) => a+b, 0) / vals.length;
    });

    /* Apply deducciones */
    let dedTotal = 0;
    if(hasDedConfig){
      sport.deduccionesConfig.forEach((ded, dIdx) => {
        const count = _judgesState.deducciones[pIdx]?.[dIdx] || 0;
        dedTotal += count * Math.abs(ded.valor);
      });
    }
    const dedTotalEl = document.getElementById(`dedTotal_${pIdx}`);
    if(dedTotalEl){
      dedTotalEl.textContent = dedTotal.toFixed(2);
      dedTotalEl.style.color = dedTotal > 0 ? '#c0392b' : 'var(--text-secondary)';
    }

    total = Math.max(0, total - dedTotal);
    const totalEl = document.getElementById(`judgeTotal_${pIdx}`);
    if(totalEl) totalEl.textContent = total.toFixed(2);

    /* Update tab badge with score */
    const jpScore = document.getElementById(`jpScore_${pIdx}`);
    if(jpScore) jpScore.textContent = total > 0 ? total.toFixed(2) : '';

    /* Mark tab as done if all judges have scores */
    const tab = document.querySelector(`.judge-participant-tab[data-pidx="${pIdx}"]`);
    if(tab){
      const numJueces = sport.numJueces || 5;
      const allFilled = componentes.every((_, cIdx) => {
        const judges = _judgesState.scores[pIdx][cIdx] || {};
        return Object.values(judges).filter(v => v > 0).length === numJueces;
      });
      tab.classList.toggle('done', allFilled);
    }
  });
}

function adjustCounter(btn, delta){
  const controls = btn.parentElement;
  const valEl = controls.querySelector('.counter-val');
  let val = parseInt(valEl.textContent) || 0;
  val = Math.max(0, val + delta);
  valEl.textContent = val;
  /* Highlight non-zero values */
  if(val > 0){
    valEl.style.color = 'var(--accent)';
    valEl.style.fontWeight = '800';
    const card = valEl.closest('div[style*="border:1px solid var(--border)"]');
    if(card) card.style.borderColor = 'var(--orange-border)';
  } else {
    valEl.style.color = '';
    valEl.style.fontWeight = '';
    /* Reset card border only if all counters in this card are 0 */
    const card = valEl.closest('div[style*="border"]');
    if(card){
      const allVals = card.querySelectorAll('.counter-val');
      const anyNonZero = Array.from(allVals).some(v => parseInt(v.textContent) > 0);
      if(!anyNonZero && card.style) card.style.borderColor = '';
    }
  }
  /* Update penalty log if it exists */
  updatePenaltyLog();
}

/* Quick toast for tarjeta roja point award */
/* ═══ Inline tarjeta roja in Marcador ═══ */
function applyTarjetaRoja(team){
  if(!_setsCounterState || !_setsCounterSport) return;
  const rival = team === 1 ? 2 : 1;

  /* Track tarjeta count */
  if(!_setsCounterState._tarjetaCounts) _setsCounterState._tarjetaCounts = {1:0, 2:0};
  _setsCounterState._tarjetaCounts[team]++;
  const count = _setsCounterState._tarjetaCounts[team];

  /* Add point to rival */
  setScoreChange(rival, 1);

  /* Update badge on button */
  const badge = document.getElementById('tarjetaCount'+team);
  if(badge){
    badge.style.display = 'inline-flex';
    badge.textContent = count;
  }

  /* Animate the button */
  const btn = document.querySelector(`.tarjeta-btn:nth-child(1)`);

  /* Add to log */
  const activeSet = _setsCounterState.activeSet;
  const setLabel = _setsCounterSport.parciales?.[activeSet] || ('Set '+(activeSet+1));
  function _getSetTeamName(t){
    const scoreEl = document.getElementById('setScore'+t);
    return scoreEl?.parentElement?.parentElement?.querySelector('div')?.textContent?.trim() || ('Equipo '+t);
  }
  const teamName = _getSetTeamName(team);
  const rivalName = _getSetTeamName(rival);

  /* Initialize log array */
  if(!_setsCounterState._tarjetaLog) _setsCounterState._tarjetaLog = [];
  _setsCounterState._tarjetaLog.push({team, teamName: teamName.trim(), rivalName: rivalName.trim(), set: setLabel, time: new Date()});

  _renderTarjetaLog();
  _showTarjetaToast(rival, rivalName.trim());
}

function _renderTarjetaLog(){
  const log = _setsCounterState._tarjetaLog || [];
  const logEl = document.getElementById('tarjetaLog');
  if(!logEl) return;
  if(log.length === 0){ logEl.style.display = 'none'; return; }
  logEl.style.display = 'block';
  let html = `<div style="font:600 10px var(--font);color:#dc2626;margin-bottom:6px;letter-spacing:.3px;display:flex;align-items:center;gap:6px">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    REGISTRO (${log.length})
  </div>`;
  log.forEach((entry, i) => {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font:500 11px var(--font);color:#dc2626;${i>0?'border-top:1px solid rgba(220,38,38,.15);margin-top:4px;padding-top:6px':''}">
      <span style="font-size:12px">🔴</span>
      <span style="flex:1"><b>${entry.teamName}</b> → +1 pt para ${entry.rivalName}</span>
      <span style="font-size:10px;opacity:.6">${entry.set}</span>
      <button onclick="undoTarjetaRoja(${i})" style="background:none;border:none;cursor:pointer;font-size:12px;opacity:.5;transition:opacity .15s;padding:2px" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.5'" title="Deshacer">✕</button>
    </div>`;
  });
  logEl.innerHTML = html;
}

function undoTarjetaRoja(idx){
  if(!_setsCounterState._tarjetaLog || !_setsCounterState._tarjetaLog[idx]) return;
  const entry = _setsCounterState._tarjetaLog[idx];
  const rival = entry.team === 1 ? 2 : 1;

  /* Remove point from rival */
  setScoreChange(rival, -1);

  /* Decrement tarjeta count */
  _setsCounterState._tarjetaCounts[entry.team] = Math.max(0, (_setsCounterState._tarjetaCounts[entry.team]||1) - 1);
  const count = _setsCounterState._tarjetaCounts[entry.team];
  const badge = document.getElementById('tarjetaCount'+entry.team);
  if(badge){
    badge.textContent = count;
    if(count === 0) badge.style.display = 'none';
  }

  /* Remove from log */
  _setsCounterState._tarjetaLog.splice(idx, 1);
  _renderTarjetaLog();
}

function _showTarjetaToast(rivalTeam, rivalName){
  const panel = document.getElementById('setActivePanel');
  if(!panel) return;
  let toast = document.getElementById('tarjetaToast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'tarjetaToast';
    toast.style.cssText = 'text-align:center;padding:6px 16px;border-radius:var(--radius-full);background:#dc2626;color:#fff;font:500 11px var(--font);display:flex;align-items:center;justify-content:center;gap:6px;opacity:0;transition:opacity .3s;pointer-events:none;margin:-8px auto 10px';
    /* Insert at the top of the panel, after the status row */
    const statusRow = panel.querySelector('#setStatusBadge')?.parentElement;
    if(statusRow && statusRow.nextSibling) panel.insertBefore(toast, statusRow.nextSibling);
    else panel.prepend(toast);
  }
  const name = rivalName || ('Equipo '+rivalTeam);
  toast.innerHTML = `🔴 +1 punto para <b>${name}</b> (tarjeta roja)`;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

function updatePenaltyLog(){
  const logEl = document.getElementById('penaltyLog');
  const entriesEl = document.getElementById('penaltyLogEntries');
  if(!logEl || !entriesEl) return;
  const allCounters = document.querySelectorAll('#tab-penalizaciones .counter-val');
  const entries = [];
  allCounters.forEach(v => {
    const count = parseInt(v.textContent) || 0;
    if(count > 0){
      const penal = v.dataset.penal || '';
      const teamIdx = v.dataset.team;
      /* Find target name from the stat-counter-label */
      const counter = v.closest('.stat-counter');
      const labelEl = counter ? counter.querySelector('.stat-counter-label') : null;
      const target = labelEl ? labelEl.textContent : `Jugador ${teamIdx}`;
      entries.push(`<div style="padding:4px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
        <span>${penal.length > 40 ? penal.substring(0,40)+'…' : penal}</span>
        <span style="font-weight:600">${target} × ${count}</span>
      </div>`);
    }
  });
  if(entries.length > 0){
    logEl.style.display = 'block';
    entriesEl.innerHTML = entries.join('');
  } else {
    logEl.style.display = 'none';
  }
}

function toggleAction(btn){
  btn.classList.toggle('active');
  if(btn.classList.contains('active')){
    btn.style.borderColor = 'var(--accent)';
    btn.style.background = 'var(--orange-bg)';
    btn.style.color = 'var(--accent)';
  } else {
    btn.style.borderColor = '';
    btn.style.background = '';
    btn.style.color = '';
  }
}

/* ═══ SAVE RONDA PARTIAL (per-round save) ═══ */
function saveRondaPartial(compId){
  const comp = _resolveComp(compId);
  if(!comp) return;
  const sport = SPORTS_DB[comp.sport];

  /* Save current ronda scores */
  saveCurrentRondaScores();

  /* Persist scores to each ronda match */
  _rondaMatches.forEach((rm, rIdx) => {
    const match = comp.matches.find(m => m.id === rm.id);
    if(!match) return;
    const rScores = _rondaScores[rIdx];
    if(rScores && Object.keys(rScores).length > 0){
      match.rondaScores = { ...rScores };
      if(match.status === 'not-started' || match.status === 'ready'){
        match.status = 'in-progress';
      }
    }
  });

  /* Mark the currently active ronda as done if it has scores */
  const currentMatch = comp.matches.find(m => m.id === _rondaMatches[_rondaCurrentIdx]?.id);
  const currentScores = _rondaScores[_rondaCurrentIdx];
  if(currentMatch && currentScores && Object.keys(currentScores).length > 0){
    currentMatch.status = 'done';
    currentMatch.rondaScores = { ...currentScores };
  }

  comp.completed = comp.matches.filter(m=>m.status==='done').length;

  /* Update ronda tab status icons in modal */
  document.querySelectorAll('.ronda-tab-btn').forEach((btn, i) => {
    const rm = _rondaMatches[i];
    const m = comp.matches.find(x => x.id === rm.id);
    const icon = m.status === 'done' ? '✅' : m.status === 'in-progress' ? '🔵' : m.status === 'ready' ? '🟢' : '⚪';
    btn.textContent = `${icon} ${rm.phase}`;
  });

  /* Auto-advance to next undone ronda */
  const nextIdx = _rondaMatches.findIndex((rm, i) => {
    const m = comp.matches.find(x => x.id === rm.id);
    return i > _rondaCurrentIdx && m.status !== 'done';
  });
  if(nextIdx >= 0) switchRonda(nextIdx);

  if(typeof _onScoringModalSave === 'function') _onScoringModalSave(compId);

  const rondaLabel = _rondaMatches[_rondaCurrentIdx]?.phase || 'Ronda';
  showDigiToast(
    '💾 Ronda guardada',
    `Los resultados de <strong>${rondaLabel}</strong> fueron guardados. Puedes continuar con las demás rondas en cualquier momento.`
  );
}

/* ═══ SAVE RESULT (final / complete) ═══ */
function saveResult(compId, matchId){
  const winnerEl = document.querySelector('.winner-opt.selected');
  if(document.querySelector('.winner-section') && !winnerEl) return;

  const comp = _resolveComp(compId);
  const sport = SPORTS_DB[comp.sport] || SPORTS_DB[comp.sportKey] || SPORTS_DB[_modalSportKey];
  const hasParticipants = _modalMatchData && _modalMatchData.participants && _modalMatchData.participants.length > 0 && (!_modalMatchData.teams || _modalMatchData.teams.length < 2 || _modalMatchData.teams[0] === 'Todos');

  /* ═══ Collect all tab data ═══ */

  /* 1. Ganador / Podio */
  let ganador = null;
  const isPodiumMode = !!document.querySelector('.winner-options[data-podium="true"]');
  if(isPodiumMode){
    const podiumOpts = Array.from(document.querySelectorAll('.winner-opt[data-position]'))
      .sort((a,b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
    if(podiumOpts.length > 0){
      ganador = {podio:true};
      const keys = ['primero','segundo','tercero'];
      podiumOpts.forEach((opt,i) => {
        if(i < 3) ganador[keys[i]] = {valor:opt.dataset.winner, nombre:opt.dataset.participantName || opt.querySelector('.winner-name')?.textContent || ''};
      });
    }
  } else if(winnerEl){
    ganador = {
      valor: winnerEl.dataset.winner,
      nombre: winnerEl.dataset.participantName || winnerEl.querySelector('.winner-name')?.textContent || ''
    };
  }

  /* 2. Penalizaciones (counters) */
  const penalizaciones = [];
  document.querySelectorAll('#tab-penalizaciones .counter-val').forEach(v => {
    const count = parseInt(v.textContent) || 0;
    if(count > 0){
      const counter = v.closest('.stat-counter');
      const labelEl = counter ? counter.querySelector('.stat-counter-label') : null;
      penalizaciones.push({
        tipo: v.dataset.penal || '',
        objetivo: labelEl ? labelEl.textContent.trim() : '',
        cantidad: count
      });
    }
  });

  /* 3. Pérdidas y Descalificaciones (checkboxes) */
  const perdidasDescalificaciones = [];
  document.querySelectorAll('#tab-descalificaciones .descal-item').forEach(item => {
    const headerText = item.querySelector('.descal-text')?.textContent || '';
    const isPerdida = item.dataset.isPerdida === 'true';
    const afectados = [];
    item.querySelectorAll('.descal-p-row.checked .descal-p-name').forEach(el => {
      afectados.push(el.textContent.trim());
    });
    if(afectados.length > 0){
      perdidasDescalificaciones.push({
        tipo: isPerdida ? 'perdida' : 'descalificacion',
        descripcion: headerText.trim(),
        afectados: afectados
      });
    }
  });

  /* 4. Estadísticas / Incidencias (incident log) */
  const incidencias = _incidentLog.map(inc => ({
    tipo: inc.type,
    objetivo: inc.target,
    hora: inc.time,
    ronda: inc.ronda || null,
    tablero: inc.tablero || null
  }));

  /* 5. Notas */
  const notasEl = document.querySelector('.notes-textarea, textarea');
  const notas = notasEl ? notasEl.value.trim() : '';

  /* 6. Desempate */
  let desempate = null;
  const tbCriterion = document.querySelector('.tb-criterion-btn.active');
  const tbWinner = document.querySelector('.tb-winner-btn.active');
  if(tbCriterion || tbWinner){
    desempate = {
      criterio: tbCriterion ? tbCriterion.textContent.trim() : null,
      ganador: tbWinner ? tbWinner.textContent.trim() : null
    };
  }

  /* ═══ Build result object ═══ */
  /* Collect ronda DQ data if any */
  const rondaDqEntries = [];
  Object.entries(_rondaDqMap).forEach(([rIdx, pMap]) => {
    Object.entries(pMap).forEach(([pIdx, info]) => {
      const rm = _rondaMatches[parseInt(rIdx)];
      const pName = rm?.participants?.[parseInt(pIdx)] || `Jugador ${parseInt(pIdx)+1}`;
      rondaDqEntries.push({ ronda: rm?.phase, participante: pName, participanteIdx: parseInt(pIdx), tipo: info.tipo, descripcion: info.descripcion });
    });
  });

  const resultado = {
    timestamp: new Date().toISOString(),
    ganador,
    penalizaciones: penalizaciones.length > 0 ? penalizaciones : null,
    perdidasDescalificaciones: perdidasDescalificaciones.length > 0 ? perdidasDescalificaciones : null,
    rondaDq: rondaDqEntries.length > 0 ? rondaDqEntries : null,
    incidencias: incidencias.length > 0 ? incidencias : null,
    desempate,
    notas: notas || null
  };

  /* ═══ Save to match ═══ */
  if(hasParticipants && _rondaMatches && _rondaMatches.length > 1){
    /* Ronda-based: save all rondas and mark all as done */
    saveCurrentRondaScores();
    _rondaMatches.forEach((rm, rIdx) => {
      const match = comp.matches.find(m => m.id === rm.id);
      if(!match) return;
      match.status = 'done';
      match.rondaScores = _rondaScores[rIdx] ? { ..._rondaScores[rIdx] } : {};
      match.rondaDq = _rondaDqMap[rIdx] ? { ..._rondaDqMap[rIdx] } : null;
    });
    /* Attach resultado to the first ronda match */
    const firstMatch = comp.matches.find(m => m.id === _rondaMatches[0].id);
    if(firstMatch) firstMatch.resultado = resultado;
  } else {
    /* Single match: standard save */
    const match = comp.matches.find(m=>m.id===matchId);
    let t1=0, t2=0;
    if(sport.puntuacion === 'marca' || sport.puntuacion === 'jueces'){
      t1 = 0; t2 = 0;
    } else {
      t1 = parseInt(document.getElementById('totalScore1')?.value) || 0;
      t2 = parseInt(document.getElementById('totalScore2')?.value) || 0;
    }
    match.status = 'done';
    match.scores = {t1, t2};
    /* Also set s1/s2 for bracket display compatibility */
    match.s1 = t1;
    match.s2 = t2;
    /* Set winner based on ganador or scores */
    if(ganador && ganador.valor === '1') match.winner = 1;
    else if(ganador && ganador.valor === '2') match.winner = 2;
    else if(t1 > t2) match.winner = 1;
    else if(t2 > t1) match.winner = 2;
    match.resultado = resultado;
  }

  comp.completed = comp.matches.filter(m=>m.status==='done').length;

  /* Log the full result to console for debugging */
  console.log('📋 Resultado guardado:', JSON.stringify(resultado, null, 2));

  const sportLabel = sport ? sport.label : '';
  closeScoringModal();
  if(typeof _onScoringModalSave === 'function') _onScoringModalSave(compId);

  showDigiToast(
    '✅ Resultado guardado',
    `El resultado de <strong>${sportLabel} ${comp.genero} ${comp.categoria}</strong> fue registrado exitosamente.`
  );
}

// ESC to close modal
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeScoringModal();
});
