window.S = window.S || {};

S.Game = {
  state: {
    mode: 'loading',
    previousMode: null,
    level: 1,
    moves: 0,
    rows: 5, cols: 5,
    cells: [],
    time: 0,
    solvedTimer: 0,
    titleAlpha: 0,
    particles: [],
    rings: [],
    best: 1,
    dust: [],
    hintUsedThisLevel: false,
    hintActive: false,
    hintCells: null,
    initialMask: null,
    isDaily: false,
    justFinishedDaily: false,
    idealMoves: 0,
    _lastScore: null,
    _levelStartTime: 0,
    _adsShown: 0
  },

  initDust(){
    const s = this.state;
    s.dust = [];
    for(let i=0;i<50;i++){
      s.dust.push({
        x: Math.random(), y: Math.random(),
        z: 0.3 + Math.random()*0.7,
        vx: (Math.random()-0.5)*0.01,
        vy: -0.005 - Math.random()*0.015,
        r: 0.5 + Math.random()*1.2
      });
    }
  },

  scaleForLevel(level){
    const base = S.CONFIG.SCALE;
    const transpose = S.CONFIG.TRANSPOSE || [1];
    const unlocked = S.Storage.get('transposeUnlocked', false);
    if (!unlocked) return base.slice();
    const block = Math.floor((level - 1) / 5) % transpose.length;
    const factor = transpose[block];
    return base.map(f => f * factor);
  },

  createEmptyBoard(level){
    const s = this.state;
    s.rows = S.CONFIG.ROWS;
    s.cols = S.CONFIG.COLS;
    s.cells = [];
    const scale = this.scaleForLevel(level);
    for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++){
      const noteIdx = (r+c) % scale.length;
      s.cells.push({
        r, c, on: false, energy: 0, pop: 0,
        note: scale[noteIdx],
        hue: (180 + noteIdx*32) % 360,
        x: 0, y: 0, size: 0
      });
    }
    this.layoutCells();
  },

  computeIdeal(){
    const s = this.state;
    if (!S.Solver || !s.cells.length){ s.idealMoves = 0; return; }
    const solution = S.Solver.solve(s.cells, s.rows, s.cols);
    s.idealMoves = (solution && solution.length) ? solution.length : 0;
  },

  newPuzzle(level, seed, dailyClicks){
    const s = this.state;
    s.isDaily = (seed !== undefined);
    this.createEmptyBoard(level);

    const rng = (seed !== undefined) ? S.Utils.seededRandom(seed) : Math.random;
    const clicks = dailyClicks
      ? dailyClicks
      : Math.min(S.CONFIG.BASE_CLICKS + level, S.CONFIG.MAX_CLICKS);

    const seen = {};
    let placed = 0, safety = 0;
    while (placed < clicks && safety < clicks * 8){
      const idx = Math.floor(rng() * s.cells.length);
      safety++;
      if (seen[idx]) continue;
      seen[idx] = true;
      const cell = s.cells[idx];
      this.applyToggle(cell.r, cell.c, false);
      placed++;
    }
    if (this.isSolved()) this.applyToggle(0, 0, false);

    s.moves = 0;
    s.hintUsedThisLevel = false;
    s.hintActive = false;
    s.hintCells = null;
    s.justFinishedDaily = false;
    s._lastScore = null;
    s._levelStartTime = 0;
    s.initialMask = this.getMask();
    this.computeIdeal();
    this.savePuzzle();

    if (S.Skins) S.Skins.applyToCells();
    if (!s.isDaily) S.Tutorial.maybeStart();
  },

  tryRestoreSaved(){
    const s = this.state;
    const saved = S.Storage.get('puzzleState', null);
    if(!saved || !saved.initial || !saved.current) return false;
    if(saved.level !== s.level) return false;

    this.createEmptyBoard(s.level);
    if(saved.current.length !== s.cells.length) return false;
    if(saved.initial.length !== s.cells.length) return false;

    s.initialMask = saved.initial.slice();
    s.moves = saved.moves || 0;
    s.hintUsedThisLevel = !!saved.hintUsed;
    s.isDaily = !!saved.isDaily;
    s.justFinishedDaily = false;
    s._lastScore = null;
    this.applyMask(saved.current);
    this.layoutCells();

    s.idealMoves = saved.ideal || 0;
    if (!s.idealMoves) this.computeIdeal();

    s.hintActive = !!saved.hintActive && s.hintUsedThisLevel;
    if (s.hintActive){
      s.hintCells = null;
      this.refreshHint();
    } else {
      s.hintCells = null;
    }

    if (S.Skins) S.Skins.applyToCells();
    return true;
  },

  hasSavedLevel(){
    const saved = S.Storage.get('puzzleState', null);
    return !!(saved && saved.current && saved.moves >= 0);
  },

  getMask(){ return this.state.cells.map(c => c.on ? 1 : 0); },
  applyMask(mask){
    const s = this.state;
    const n = Math.min(s.cells.length, mask.length);
    for(let i=0;i<n;i++){
      s.cells[i].on = !!mask[i];
      s.cells[i].energy = mask[i] ? 1 : 0;
      s.cells[i].pop = 0;
    }
  },

  savePuzzle(){
    const s = this.state;
    if(!s.cells.length) return;
    S.Storage.set('puzzleState', {
      level: s.level,
      initial: s.initialMask || this.getMask(),
      current: this.getMask(),
      moves: s.moves,
      hintUsed: !!s.hintUsedThisLevel,
      hintActive: !!s.hintActive,
      isDaily: !!s.isDaily,
      ideal: s.idealMoves,
      savedAt: Date.now()
    });
  },

  clearPuzzleSave(){ S.Storage.set('puzzleState', null); },

  restartPuzzle(){
    const s = this.state;
    if(s.initialMask && s.initialMask.length === s.cells.length){
      this.applyMask(s.initialMask);
      s.moves = 0;
      s._levelStartTime = 0;
      s.particles.length = 0;
      s.rings.length = 0;
      if(s.hintUsedThisLevel && s.hintActive){ this.refreshHint(); }
      else { s.hintCells = null; }
      if (S.Skins) S.Skins.applyToCells();
      this.savePuzzle();
    } else { this.newPuzzle(s.level); }
  },

  refreshHint(){
    const s = this.state;
    if(!s.hintActive){ s.hintCells = null; return; }
    if(!S.Solver){ s.hintActive = false; s.hintCells = null; return; }
    const solution = S.Solver.solve(s.cells, s.rows, s.cols);
    if(!solution || solution.length === 0){
      s.hintActive = false; s.hintCells = null; return;
    }
    s.hintCells = new Set([ solution[0] ]);
  },

  activateHint(){
    const s = this.state;
    s.hintUsedThisLevel = true;
    s.hintActive = true;
    this.refreshHint();
    this.savePuzzle();
    return !!(s.hintCells && s.hintCells.size > 0);
  },

  activateTutorialHint(){
    const s = this.state;
    s.hintActive = true;
    this.refreshHint();
    this.savePuzzle();
    return !!(s.hintCells && s.hintCells.size > 0);
  },

  applyToggle(r, c, animate){
    const s = this.state;
    const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for(const [dr,dc] of dirs){
      const nr = r+dr, nc = c+dc;
      if(nr<0 || nr>=s.rows || nc<0 || nc>=s.cols) continue;
      const cell = s.cells[nr*s.cols + nc];
      cell.on = !cell.on;
      if(animate) cell.pop = 1;
    }
  },

  isSolved(){
    for(const c of this.state.cells) if(c.on) return false;
    return true;
  },

  layoutCells(){
    const s = this.state;
    if(!s.cells.length) return;
    const W = S.Renderer.W, H = S.Renderer.H;
    const pad = Math.max(16, Math.min(W,H)*0.04);
    const availW = W - pad*2, availH = H*0.62;
    const cellSize = Math.min(availW/s.cols, availH/s.rows);
    const gridW = cellSize*s.cols, gridH = cellSize*s.rows;
    const startX = (W - gridW)/2 + cellSize/2;
    const startY = (H - gridH)/2 + cellSize/2 + H*0.02;
    for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++){
      const cell = s.cells[r*s.cols + c];
      cell.x = startX + c*cellSize;
      cell.y = startY + r*cellSize;
      cell.size = cellSize*0.78;
    }
  },

  handleCellTap(cell){
    const s = this.state;
    if(s.mode !== 'playing') return;

    const isTutorialTap = S.Tutorial.isBlocking();
    if(isTutorialTap && cell !== S.Tutorial.targetCell) return;

    if(s.moves === 0){ s._levelStartTime = performance.now(); }

    // Обычный тап снимает подсказку — игрок сделал ход.
    // Туториальный — не снимаем, чтобы onTargetTapped() пересчитал следующий ход.
    if(s.hintActive && !isTutorialTap){
      s.hintActive = false;
      s.hintCells = null;
    }

    this.applyToggle(cell.r, cell.c, true);
    s.moves++;
    S.Audio.note(cell.note, 1.4, 0.25);
    if(S.UI && S.UI.vibrate) S.UI.vibrate(8);
    s.rings.push({ x: cell.x, y: cell.y, r: 0, max: cell.size*3, life: 1, hue: cell.hue });

    // Туториал пересчитает подсказку уже для нового состояния поля.
    if(isTutorialTap){
      S.Tutorial.onTargetTapped();
    }

    S.UI.updateHUD();
    this.savePuzzle();

    if(this.isSolved()) this.onSolved();
  },

  onSolved(){
    const s = this.state;
    s.mode = 'solved';
    s.solvedTimer = 0;
    s.hintActive = false;
    s.hintCells = null;

    s.justFinishedDaily = !!s.isDaily;
    this.clearPuzzleSave();

    const levelTime = s._levelStartTime
      ? (performance.now() - s._levelStartTime)
      : 99999;

    if(s.moves === 1){
      const cnt1 = (S.Storage.get('perf1Count', 0) || 0) + 1;
      S.Storage.set('perf1Count', cnt1);
      S.Storage.set('perf1', true);
      if(cnt1 >= 5) S.Storage.set('perf5', true);
    }

    if(levelTime < S.CONFIG.FAST_THRESHOLD){
      S.Storage.set('fast1', true);
      const cnt = (S.Storage.get('fastCount', 0) || 0) + 1;
      S.Storage.set('fastCount', cnt);
      if(cnt >= 5) S.Storage.set('fast5', true);
    }

    if(!s.hintUsedThisLevel){
      const noHint = (S.Storage.get('noHintStreak', 0) || 0) + 1;
      S.Storage.set('noHintStreak', noHint);
      if(noHint >= S.CONFIG.NOHINT_TARGET) S.Storage.set('noHint10', true);
    } else {
      S.Storage.set('noHintStreak', 0);
    }

    // Рейтинг
    let scoreResult = { points: 0, isPerfect: false, isNew: false };
    if (!s.justFinishedDaily && S.Rating){
      scoreResult = S.Rating.addScore(s.level, s.moves, s.idealMoves);
      if (scoreResult.isNew) S.Rating.submit();
    }
    s._lastScore = scoreResult;

    // Daily
    if(s.isDaily){
      const wasDone = S.Daily.isDoneToday();
      S.Daily.recordToday();
      if(!wasDone && S.UI) S.UI.showToast(S.I18N.t('dailyCompleted'));
      s.isDaily = false;
    }

    // Milestones
    if (!s.justFinishedDaily &&
        S.CONFIG.MILESTONES &&
        S.CONFIG.MILESTONES.indexOf(s.level) !== -1 &&
        S.UI){
      setTimeout(()=>{
        S.UI.showToast(S.I18N.t('newRecordToast').replace('{n}', s.level));
      }, 1600);
    }

    if(s.level + 1 > s.best) s.best = s.level + 1;
    S.Storage.set('level', s.level);
    S.Storage.set('best', s.best);
    S.SDK.saveCloud({ level: s.level, best: s.best });

    if (S.Achievements) S.Achievements.check();

    S.Audio.chord(
      [S.CONFIG.SCALE[0],S.CONFIG.SCALE[2],S.CONFIG.SCALE[4],S.CONFIG.SCALE[6],S.CONFIG.SCALE[8]],
      0.12, 2.8
    );

    for(const cell of s.cells){
      for(let i=0;i<6;i++){
        const a = Math.random()*Math.PI*2, sp = 40 + Math.random()*160;
        s.particles.push({
          x: cell.x, y: cell.y,
          vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
          life: 1, decay: 0.6 + Math.random()*0.6,
          hue: cell.hue, size: 1.5 + Math.random()*2.5
        });
      }
    }
    s.rings.push({
      x: S.Renderer.W/2, y: S.Renderer.H/2,
      r: 0, max: Math.max(S.Renderer.W,S.Renderer.H)*0.9,
      life: 1.4, hue: 200, big: true
    });

    S.UI.showSolved(scoreResult, s.moves, s.idealMoves, s.justFinishedDaily);
    S.SDK.gameplayStop();
  },

  advanceLevel(){
    const s = this.state;
    s.level++;
    s.isDaily = false;
    s.justFinishedDaily = false;
    s.hintActive = false;
    s.hintCells = null;
    s._lastScore = null;
    S.Storage.set('level', s.level);
    s.mode = 'playing';
    S.UI.hideSolved();
    this.newPuzzle(s.level);
    S.UI.updateHUD();
    S.UI.updateBest();
    S.UI.updateRating();
    S.SDK.gameplayStart();
  },

  pauseGame(){
    if(this.state.mode !== 'playing') return;
    this.savePuzzle();
    this.state.previousMode = 'playing';
    this.state.mode = 'paused';
    S.SDK.gameplayStop();
  },

  resumeGame(){
    if(this.state.mode !== 'paused') return;
    this.state.mode = 'playing';
    S.SDK.gameplayStart();
  },

  maybeShowFullscreenAd(onClose){
    const s = this.state;
    if (s.level < S.CONFIG.AD_FIRST_LEVEL){
      onClose && onClose(false);
      return;
    }
    S.Ads.showFullscreen(onClose);
  },

  update(dt){
    const s = this.state;
    s.time += dt;

    for(const cell of s.cells){
      const target = cell.on ? 1 : 0;
      cell.energy += (target - cell.energy) * Math.min(1, dt*9);
      cell.pop = Math.max(0, cell.pop - dt*3.5);
    }

    for(const p of s.dust){
      p.x += p.vx*dt*p.z;
      p.y += p.vy*dt*p.z;
      if(p.x < -0.05) p.x = 1.05;
      if(p.x > 1.05) p.x = -0.05;
      if(p.y < -0.05) p.y = 1.05;
      if(p.y > 1.05) p.y = -0.05;
    }

    for(let i=s.particles.length-1;i>=0;i--){
      const p = s.particles[i];
      p.x += p.vx*dt; p.y += p.vy*dt;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= p.decay*dt;
      if(p.life <= 0) s.particles.splice(i,1);
    }

    for(let i=s.rings.length-1;i>=0;i--){
      const r = s.rings[i];
      const speed = r.big ? r.max*0.7 : r.max*1.6;
      r.r += speed*dt;
      r.life -= dt * (r.big ? 0.5 : 1.6);
      if(r.life <= 0 || r.r > r.max) s.rings.splice(i,1);
    }

    if(s.mode === 'solved'){
      s.solvedTimer += dt;
      if(s.solvedTimer > 2.2){
        if(s.justFinishedDaily){
          s.justFinishedDaily = false;
          s.mode = 'title';
          S.UI.hideSolved();
          S.UI.showDailyAfterFinish();
        } else {
          this.maybeShowFullscreenAd(()=> {});
          this.advanceLevel();
        }
      }
    }

    if(s.mode === 'title') s.titleAlpha = Math.min(1, s.titleAlpha + dt*1.5);

    S.Tutorial.update(dt);
  }
};

/* ==================== TUTORIAL ==================== */
S.Tutorial = {
  step: 0,
  targetCell: null,
  neighborCells: [],
  timer: 0,

  maybeStart(){
    const done = S.Storage.get('tutorialDone', false);
    if(done) { this.step = 0; return; }
    if(S.Game.state.level !== 1) { this.step = 0; return; }
    if(S.Game.state.isDaily) { this.step = 0; return; }
    if(!S.Game.state.cells.length) return;

    let target = S.Game.state.cells.find(c => c.on);
    if(!target) target = S.Game.state.cells[Math.floor(S.Game.state.cells.length/2)];

    this.targetCell = target;
    this.neighborCells = [];
    this.step = 1;
    this.timer = 0;

    S.UI.showTutorialHint(S.I18N.t('tutStep1'), target);
  },

  isBlocking(){ return this.step === 1; },

  onTargetTapped(){
    if(this.step !== 1) return;
    const s = S.Game.state, t = this.targetCell;
    const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    this.neighborCells = [];
    for(const [dr,dc] of dirs){
      const nr = t.r+dr, nc = t.c+dc;
      if(nr<0||nr>=s.rows||nc<0||nc>=s.cols) continue;
      this.neighborCells.push(s.cells[nr*s.cols + nc]);
    }
    this.step = 2;
    this.timer = 0;
    // Активируем пошаговую подсказку — она пересчитает следующий ход для нового состояния поля
    S.Game.activateTutorialHint();
    S.UI.showTutorialHint(S.I18N.t('tutStep2'), t);
  },

  update(dt){
    if(this.step === 0) return;
    this.timer += dt;
    if(this.step === 2 && this.timer > 2.2){
      this.step = 3; this.timer = 0;
      S.UI.showTutorialHint(S.I18N.t('tutStep3'), null);
    } else if(this.step === 3 && this.timer > 2.6){
      this.step = 0;
      this.targetCell = null;
      this.neighborCells = [];
      S.UI.hideTutorialHint();
      S.Storage.set('tutorialDone', true);
      S.SDK.saveCloud({ tutorialDone: true });
    }
  },

  isCellHighlighted(cell){
    if(this.step === 1 && cell === this.targetCell) return true;
    if(this.step >= 2 && this.neighborCells.indexOf(cell) !== -1) return true;
    return false;
  }
};