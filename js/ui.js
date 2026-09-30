window.S = window.S || {};

S.UI = {
  activeScreen: null,
  toastTimer: null,
  vibrationEnabled: true,
  _modalTimer: null,

  init(){
    this.bindButtons();
    this.bindLifecycle();
    this.loadSettings();
    S.I18N.applyToDOM();
    this.updateBest();
    this.updateHintsCounter();
    this.updateRating();
    this.updatePlayButton();
  },

  /* ---------- LIFECYCLE ---------- */
  bindLifecycle(){
    const pauseIfPlaying = ()=>{
      if(S.Game.state.mode === 'playing'){ this.pause(); }
      else { try { S.Game.savePuzzle(); } catch(e){} }
      try { S.Audio.suspend(); } catch(e){}
      try { S.SDK.gameplayStop(); } catch(e){}
    };

    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){ this.closeHintModal(); pauseIfPlaying(); }
    });
    window.addEventListener('blur', ()=>{
      this.closeHintModal();
      pauseIfPlaying();
    });
    window.addEventListener('pagehide', pauseIfPlaying);
    window.addEventListener('beforeunload', pauseIfPlaying);
  },

  /* ---------- SCREENS ---------- */
  show(id){
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
    this.activeScreen = id;
  },
  hide(id){
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
    if(this.activeScreen === id) this.activeScreen = null;
  },
  hideAll(){
    document.querySelectorAll('.screen').forEach(el=> el.classList.add('hidden'));
    this.activeScreen = null;
  },

  showSolved(scoreResult, moves, ideal, isDaily){
    const overlay = document.getElementById('solvedOverlay');
    const movesEl = document.getElementById('solvedMoves');
    const pointsEl = document.getElementById('solvedPoints');
    const subEl = overlay ? overlay.querySelector('.solved-sub') : null;

    if(overlay) overlay.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    this.hideTutorialHint();

    if(movesEl){
      movesEl.innerHTML =
        S.I18N.t('solvedIn') + ' <b>' + moves + '</b> ' + S.I18N.t('movesShort') +
        ' &nbsp;·&nbsp; ' +
        S.I18N.t('idealMoves') + ' <b>' + ideal + '</b>';
    }

    if(pointsEl){
      pointsEl.classList.remove('perfect', 'hidden');
      pointsEl.style.opacity = '';
      pointsEl.innerHTML = '';

      if(isDaily){
        pointsEl.classList.add('hidden');
      } else if(scoreResult && scoreResult.isNew && scoreResult.points > 0){
        const flavor = scoreResult.isPerfect ? S.I18N.t('perfectLevel') : '';
        const html =
          (flavor ? '<span class="solved-flavor">' + flavor + '</span>' : '') +
          '<span class="solved-points-num">+' + scoreResult.points + '</span>';
        pointsEl.innerHTML = html;
        if(scoreResult.isPerfect) pointsEl.classList.add('perfect');
      } else {
        pointsEl.textContent = S.I18N.t('alreadyScored');
        pointsEl.style.opacity = '.55';
      }
    }

    if(subEl){ subEl.style.display = isDaily ? 'none' : ''; }
  },

  hideSolved(){
    const el = document.getElementById('solvedOverlay');
    if(el) el.classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  },

  showTutorialHint(text, nearCell){
    const el = document.getElementById('tutorialHint');
    el.textContent = text;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    if(nearCell){
      const y = Math.min(S.Renderer.H - 100,
                         Math.max(80, nearCell.y + nearCell.size*1.9));
      el.style.bottom = 'auto';
      el.style.top = y + 'px';
    } else {
      el.style.top = '';
      el.style.bottom = '80px';
    }
  },
  hideTutorialHint(){
    const el = document.getElementById('tutorialHint');
    if(el) el.classList.add('hidden');
  },

  showToast(text){
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(()=> el.classList.add('hidden'), 2000);
  },

  showStreakReward(reward){
    const map = {
      hints: 'streakRewardHints',
      skin: 'streakRewardSkin',
      transpose: 'streakRewardTranspose',
      badge: 'streakRewardBadge'
    };
    const key = map[reward.type] || 'streakReward';
    let text = S.I18N.t(key);
    if (reward.type === 'hints') text = text.replace('{n}', reward.amount || 1);
    if (reward.type === 'skin'){
      const skin = S.Skins.get(reward.skinId);
      const name = S.I18N.lang === 'ru' ? skin.nameRu : skin.nameEn;
      text = text.replace('{name}', name);
    }
    this.showToast(S.I18N.t('streakReward') + ' ' + text);
  },

  showAchievementToast(a){
    const toast = document.getElementById('toast');
    const text = S.I18N.lang === 'ru' ? a.titleRu : a.titleEn;
    toast.innerHTML = `<span class="toast-icon">${a.icon}</span>` +
                      `<span>${S.I18N.t('newAchievement')} ${text}</span>`;
    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 2400);
  },

  updateHUD(){
    const s = S.Game.state;
    const lvl = document.getElementById('levelNum');
    const mv = document.getElementById('movesNum');
    const ideal = document.getElementById('idealNum');
    if(lvl) lvl.textContent = s.level;
    if(mv) mv.textContent = s.moves;
    if(ideal) ideal.textContent = s.idealMoves || 0;
  },
  updateBest(){
    const el = document.getElementById('bestLevel');
    if(el) el.textContent = S.Game.state.best;
  },
  updateRating(){
    const el = document.getElementById('ratingPoints');
    if(el && S.Rating) el.textContent = S.Rating.totalPoints;
  },
  updateHintsCounter(){
    const badge = document.getElementById('hintBadge');
    if(!badge) return;
    const n = S.Hints ? S.Hints.count : 0;
    badge.textContent = n;
    badge.classList.toggle('empty', n <= 0);
  },

  updatePlayButton(){
    const btn = document.getElementById('btnPlay');
    if(!btn) return;
    const hasSaved = S.Game.hasSavedLevel();
    if (hasSaved){
      const lvl = S.Storage.get('level', 1);
      btn.textContent = S.I18N.t('continueLevel') + ' ' + lvl;
    } else {
      btn.textContent = S.I18N.t('play');
    }
  },

  vibrate(ms){
    if(!this.vibrationEnabled) return;
    if(navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){}
  },

  /* ---------- SETTINGS ---------- */
  loadSettings(){
    const soundOn = S.Storage.get('optSound', true);
    const musicOn = S.Storage.get('optMusic', true);
    const vibrationOn = S.Storage.get('optVibration', true);
    const langMode = S.Storage.get('optLanguage', 'auto');

    document.getElementById('optSound').checked = soundOn;
    document.getElementById('optMusic').checked = musicOn;
    document.getElementById('optVibration').checked = vibrationOn;
    document.getElementById('optLanguage').value = langMode;

    S.Audio.sfxEnabled = soundOn;
    S.Audio.musicEnabled = musicOn;
    this.vibrationEnabled = vibrationOn;

    S.I18N.setMode(langMode);
    this.updateHintsCounter();
  },

  /* ---------- BUTTONS ---------- */
  bindButtons(){
    const $ = id => document.getElementById(id);

    $('btnPlay').addEventListener('click', ()=> this.onPlayPressed());
    $('btnHowTo').addEventListener('click', ()=> this.openHowTo('screen-title'));
    $('btnSettings').addEventListener('click', ()=> this.openSettings('screen-title'));
    if($('btnStats')) $('btnStats').addEventListener('click', ()=> this.openStats());

    $('btnDaily').addEventListener('click', ()=> this.openDaily());
    $('btnAchievements').addEventListener('click', ()=> this.openAchievements());
    if($('btnLeaderboard')) $('btnLeaderboard').addEventListener('click', ()=> this.openLeaderboard());

    if($('btnFavorites')) $('btnFavorites').addEventListener('click', ()=> this.onAddToFavorites());
    if($('btnSupport'))   $('btnSupport').addEventListener('click', ()=> {
      if (S.SDK && S.SDK.openSupport) S.SDK.openSupport();
    });
    if($('btnLbOpen'))    $('btnLbOpen').addEventListener('click', ()=> {
      S.Leaderboard.openNative(S.Rating ? S.Rating.totalPoints : 0);
    });

    $('btnDailyClose').addEventListener('click', ()=> this.closeOverlay());
    $('btnAchClose').addEventListener('click', ()=> this.closeOverlay());
    if($('btnLbClose')) $('btnLbClose').addEventListener('click', ()=> this.closeOverlay());
    if($('btnStatsClose')) $('btnStatsClose').addEventListener('click', ()=> this.closeOverlay());

    $('btnHowToClose').addEventListener('click', ()=> this.closeOverlay());
    $('btnSettingsClose').addEventListener('click', ()=> this.closeOverlay());

    $('optSound').addEventListener('change', e=>{
      S.Audio.setSfx(e.target.checked);
      S.Storage.set('optSound', e.target.checked);
    });
    $('optMusic').addEventListener('change', e=>{
      S.Audio.setMusic(e.target.checked);
      S.Storage.set('optMusic', e.target.checked);
    });
    $('optVibration').addEventListener('change', e=>{
      this.vibrationEnabled = e.target.checked;
      S.Storage.set('optVibration', e.target.checked);
    });
    $('optLanguage').addEventListener('change', e=>{
      const mode = e.target.value;
      S.Storage.set('optLanguage', mode);
      S.I18N.setMode(mode);
      this.updateRating();
      this.updatePlayButton();
    });

    $('btnPause').addEventListener('click', ()=> this.pause());
    $('btnHintHUD').addEventListener('click', ()=> this.requestHint());

    $('btnResume').addEventListener('click', ()=> this.resume());
    $('btnRestart').addEventListener('click', ()=> this.restartLevel());
    $('btnPauseSettings').addEventListener('click', ()=> this.openSettings('screen-pause'));
    $('btnPauseMenu').addEventListener('click', ()=> this.goToMainMenu());

    if($('btnHintCancel')) $('btnHintCancel').addEventListener('click', ()=> this.closeHintModal());
    if($('btnHintConfirm')) $('btnHintConfirm').addEventListener('click', ()=> this.confirmHint());
    const backdrop = document.querySelector('#hintModal .modal-backdrop');
    if(backdrop) backdrop.addEventListener('click', ()=> this.closeHintModal());
  },

  async onAddToFavorites(){
    if (!S.SDK.ready){
      this.showToast(S.I18N.t('favoritesFailed'));
      return;
    }
    const ok = await S.SDK.addToFavorites();
    if (ok) this.showToast(S.I18N.t('favoritesAdded'));
    else    this.showToast(S.I18N.t('favoritesFailed'));
  },

  /* ---------- PLAY ---------- */
  onPlayPressed(){
    const hasSaved = S.Game.hasSavedLevel();
    this.startGame(hasSaved);
  },

  startGame(continueSaved){
    S.Audio.init();
    S.Audio.resume();
    this.hideAll();
    S.Game.state.mode = 'playing';
    S.Game.state.titleAlpha = 0;
    S.Game.state.isDaily = false;
    S.Game.state.justFinishedDaily = false;
    document.getElementById('hud').classList.remove('hidden');

    if (continueSaved && S.Game.hasSavedLevel()){
      S.Game.tryRestoreSaved();
    } else if (S.Game.state.cells.length === 0){
      const restored = S.Game.tryRestoreSaved();
      if(!restored) S.Game.newPuzzle(S.Game.state.level);
    } else {
      S.Tutorial.maybeStart();
    }

    this.updateHUD();
    this.updateBest();
    this.updateRating();
    this.updateHintsCounter();
    S.SDK.gameplayStart();
    S.Game.maybeShowFullscreenAd(()=> {});
  },

  pause(){
    S.Game.pauseGame();
    this.show('screen-pause');
  },
  resume(){
    S.Game.resumeGame();
    this.hide('screen-pause');
    S.Audio.resume();
  },
  restartLevel(){
    this.hide('screen-pause');
    S.Game.state.mode = 'playing';
    S.Game.restartPuzzle();
    this.updateHUD();
    S.SDK.gameplayStart();
  },
  goToMainMenu(){
    S.Game.savePuzzle();
    this.hideAll();
    S.SDK.gameplayStop();
    S.Game.state.mode = 'title';
    S.Game.state.isDaily = false;
    S.Game.state.justFinishedDaily = false;
    this.show('screen-title');
    this.updateBest();
    this.updateRating();
    this.updateHintsCounter();
    this.updatePlayButton();
  },

  openHowTo(returnScreen){
    S.Game.state.previousMode = returnScreen;
    this.hideAll();
    this.show('screen-howto');
    S.Demo.start();
  },
  openSettings(returnScreen){
    S.Game.state.previousMode = returnScreen;
    this.hideAll();
    this.show('screen-settings');
  },

  /* ---------- STATS ---------- */
  openStats(){
    S.Game.state.previousMode = 'screen-title';
    this.hideAll();
    this.show('screen-stats');
    this.renderStats();
  },

  renderStats(){
    const set = (id, v) => {
      const el = document.getElementById(id);
      if(el) el.textContent = v;
    };
    set('statLevels',  Math.max(0, (S.Game.state.best || 1) - 1));
    set('statPerfect', S.Rating ? S.Rating.perfectCount : 0);
    set('statRating',  S.Rating ? S.Rating.totalPoints : 0);
    set('statStreak',  S.Daily ? S.Daily.bestStreak : 0);
    set('statDays',    S.Daily ? S.Daily.totalDays : 0);
    set('statDailyDone', S.Daily ? S.Daily.totalDays : 0);
  },

  /* ---------- DAILY ---------- */
  openDaily(){
    S.Game.state.previousMode = 'screen-title';
    const done = S.Daily.isDoneToday();
    if(done){
      this.hideAll();
      this.show('screen-daily');
      this.renderDailyScreen(true);
      return;
    }
    this.hideAll();
    S.Audio.init(); S.Audio.resume();
    S.Game.state.mode = 'playing';
    S.Game.state.isDaily = true;
    document.getElementById('hud').classList.remove('hidden');
    S.Game.newPuzzle(S.Game.state.level, S.Utils.todaySeed(), S.Daily.DAILY_CLICKS);
    this.updateHUD();
    this.updateBest();
    this.updateRating();
    this.updateHintsCounter();
    S.SDK.gameplayStart();
  },

  showDailyAfterFinish(){
    this.hideAll();
    S.Demo.stop();
    S.Game.state.mode = 'title';
    S.SDK.gameplayStop();
    this.show('screen-daily');
    this.renderDailyScreen(true);
  },

  renderDailyScreen(already){
    const badge = document.getElementById('dailyDoneBadge');
    if(badge) badge.classList.toggle('hidden', !already);

    const shareEl = document.getElementById('dailyShare');
    if(shareEl) shareEl.textContent = S.I18N.t('dailyShared');
    const refreshEl = document.getElementById('dailyRefresh');
    if(refreshEl) refreshEl.textContent = S.I18N.t('dailyRefresh');

    const weekEl = document.getElementById('dailyWeek');
    if(!weekEl) return;
    weekEl.innerHTML = '';

    const labels = [
      S.I18N.t('weekMon'), S.I18N.t('weekTue'), S.I18N.t('weekWed'),
      S.I18N.t('weekThu'), S.I18N.t('weekFri'), S.I18N.t('weekSat'),
      S.I18N.t('weekSun')
    ];
    const week = S.Daily.weekStatus();
    week.forEach((d, i) => {
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      if (d.status === 1) cell.classList.add('done');
      if (d.status === 2) cell.classList.add('today');
      if (d.status === 3) cell.classList.add('done-today');
      if (d.status === -1) cell.classList.add('future');
      cell.innerHTML = `<span class="day-label">${labels[i]}</span>` +
                       `<span class="day-dot"></span>`;
      weekEl.appendChild(cell);
    });

    document.getElementById('dailyStreak').textContent = S.Daily.streak;
    document.getElementById('dailyBest').textContent   = S.Daily.bestStreak;
    document.getElementById('dailyTotal').textContent  = S.Daily.totalDays;

    const nextEl = document.getElementById('dailyNext');
    if (nextEl){
      const nr = S.Daily.nextReward();
      if (nr && nr.remaining > 0){
        nextEl.textContent = S.I18N.t('streakNextIn').replace('{n}', nr.remaining);
        nextEl.classList.remove('hidden');
      } else if (nr && nr.remaining === 0){
        nextEl.textContent = S.I18N.t('streakReward');
        nextEl.classList.remove('hidden');
      } else {
        nextEl.classList.add('hidden');
      }
    }

    const btn = document.getElementById('btnDailyPlay');
    if (already){
      btn.disabled = true;
      btn.textContent = S.I18N.t('dailyDone');
      btn.onclick = null;
    } else {
      btn.disabled = false;
      btn.textContent = S.I18N.t('dailyPlay');
      btn.onclick = () => this.openDaily();
    }

    if (S.Daily.streak > 0){
      const n = S.Daily.streak;
      const msg = S.I18N.t('streakLabel') + ': ' + n + ' ' + S.I18N.t('streakDays');
      setTimeout(()=> this.showToast(msg), 250);
    }
  },

  /* ---------- ACHIEVEMENTS ---------- */
  openAchievements(){
    S.Game.state.previousMode = 'screen-title';
    this.hideAll();
    this.show('screen-achievements');
    this.renderAchievements();
  },

  renderAchievements(){
    const wrap = document.getElementById('achList');
    if(!wrap) return;
    wrap.innerHTML = '';
    for (const a of S.Achievements.list){
      const done = !!S.Achievements.unlocked[a.id];
      const row = document.createElement('div');
      row.className = 'ach-row' + (done ? ' done' : '');
      const title = S.I18N.lang === 'ru' ? a.titleRu : a.titleEn;
      const desc  = S.I18N.lang === 'ru' ? a.descRu  : a.descEn;
      row.innerHTML =
        '<div class="ach-icon">' + a.icon + '</div>' +
        '<div class="ach-body">' +
          '<div class="ach-title">' + title + '</div>' +
          '<div class="ach-desc">'  + desc  + '</div>' +
        '</div>' +
        '<div class="ach-state">' + (done ? '✓' : '') + '</div>';
      wrap.appendChild(row);
    }
  },

  /* ---------- LEADERBOARD ---------- */
  openLeaderboard(){
    S.Game.state.previousMode = 'screen-title';
    this.hideAll();
    this.show('screen-leaderboard');
    S.LeaderboardUI.render(true);
  },

  /* ---------- CLOSE OVERLAY ---------- */
  closeOverlay(){
    this.hideAll();
    S.Demo.stop();

    const gs = S.Game.state;
    const prev = gs.previousMode;

    if(prev === 'screen-pause' || gs.mode === 'paused'){
      this.show('screen-pause');
      return;
    }
    if(gs.cells.length && (gs.mode === 'playing' || gs.mode === 'solved')){
      document.getElementById('hud').classList.remove('hidden');
      if(gs.mode !== 'solved'){
        gs.mode = 'playing';
        S.SDK.gameplayStart();
      }
      return;
    }
    this.show('screen-title');
    gs.mode = 'title';
    this.updateRating();
    this.updatePlayButton();
  },

  /* ---------- HINTS ---------- */
  requestHint(){
    const s = S.Game.state;
    if(S.Tutorial.step !== 0) return;
    if(s.mode !== 'playing') return;
    if(s.hintActive) return;

    if(S.Hints && S.Hints.count > 0){
      const ok = S.Game.activateHint();
      if(ok){
        S.Hints.use();
        this.updateHintsCounter();
        this.showToast(S.I18N.t('hintApplied'));
      } else {
        this.showToast(S.I18N.t('hintNone'));
      }
      return;
    }

    this.openHintModal();
  },

  openHintModal(){
    const s = S.Game.state;
    if(S.Tutorial.step !== 0) return;
    if(s.mode !== 'playing') return;
    if(s.hintActive) return;

    const modal = document.getElementById('hintModal');
    const text = document.getElementById('hintModalText');
    const status = document.getElementById('hintModalStatus');
    const confirmBtn = document.getElementById('btnHintConfirm');
    if(!modal || !status || !confirmBtn) return;

    text.textContent = S.I18N.t('hintModalText');

    const cooldownUntil = S.Storage.get('hintCooldownUntil', 0) || 0;
    const cdLeft = cooldownUntil - Date.now();

    if(cdLeft > 0){
      const sec = Math.ceil(cdLeft / 1000);
      status.className = 'modal-status cooldown';
      status.textContent = S.I18N.t('hintAdCooldown') + ' ' + sec + ' ' + S.I18N.t('sec');
      confirmBtn.disabled = true;
    } else if(!S.SDK.ready && !S.SDK.isDevMode()){
      status.className = 'modal-status unavailable';
      status.textContent = S.I18N.t('hintAdUnavailable');
      confirmBtn.disabled = true;
    } else {
      status.className = 'modal-status ready';
      status.textContent = S.I18N.t('hintAdReady') + (S.SDK.isDevMode() && !S.SDK.ready ? ' (dev)' : '');
      confirmBtn.disabled = false;
    }
    modal.classList.remove('hidden');
    this._startModalTicker();
  },

  _startModalTicker(){
    this._stopModalTicker();
    const status = document.getElementById('hintModalStatus');
    const confirmBtn = document.getElementById('btnHintConfirm');
    if(!status || !confirmBtn) return;

    const tick = ()=>{
      const modal = document.getElementById('hintModal');
      if(!modal || modal.classList.contains('hidden')){
        this._stopModalTicker(); return;
      }
      const cooldownUntil = S.Storage.get('hintCooldownUntil', 0) || 0;
      const cdLeft = cooldownUntil - Date.now();
      if(cdLeft > 0){
        const sec = Math.ceil(cdLeft / 1000);
        status.className = 'modal-status cooldown';
        status.textContent = S.I18N.t('hintAdCooldown') + ' ' + sec + ' ' + S.I18N.t('sec');
        confirmBtn.disabled = true;
        this._modalTimer = setTimeout(tick, 500);
      } else if(!S.SDK.ready && !S.SDK.isDevMode()){
        status.className = 'modal-status unavailable';
        status.textContent = S.I18N.t('hintAdUnavailable');
        confirmBtn.disabled = true;
        this._stopModalTicker();
      } else {
        status.className = 'modal-status ready';
        status.textContent = S.I18N.t('hintAdReady') + (S.SDK.isDevMode() && !S.SDK.ready ? ' (dev)' : '');
        confirmBtn.disabled = false;
        this._stopModalTicker();
      }
    };
    tick();
  },
  _stopModalTicker(){
    if(this._modalTimer){ clearTimeout(this._modalTimer); this._modalTimer = null; }
  },
  closeHintModal(){
    this._stopModalTicker();
    const modal = document.getElementById('hintModal');
    if(modal) modal.classList.add('hidden');
  },

  confirmHint(){
    this.closeHintModal();
    const s = S.Game.state;
    if(s.mode !== 'playing') return;

    if(!S.SDK.ready && !S.SDK.isDevMode()){
      this.showToast(S.I18N.t('adFail'));
      return;
    }

    const cooldownUntil = S.Storage.get('hintCooldownUntil', 0) || 0;
    if(Date.now() < cooldownUntil){
      const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      this.showToast(S.I18N.t('hintWait') + ' ' + sec + ' ' + S.I18N.t('sec'));
      return;
    }

    const activate = ()=>{
      const ok = S.Game.activateHint();
      if(ok){
        S.Storage.set('hintCooldownUntil', Date.now() + S.CONFIG.HINT_COOLDOWN_MS);
        this.updateHintsCounter();
        this.showToast(S.I18N.t('hintApplied'));
      } else {
        this.showToast(S.I18N.t('hintNone'));
      }
    };

    S.Ads.showRewarded(
      ()=>{ activate(); },
      ()=>{ /* onClose */ }
    );
  }
};

/* ==================== DEMO CANVAS ==================== */
S.Demo = {
  running: false, raf: null, canvas: null, ctx: null,
  t: 0, phase: 0, phaseT: 0, cells: [], W: 280, H: 280,

  start(){
    this.canvas = document.getElementById('demoCanvas');
    if(!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.W * DPR;
    this.canvas.height = this.H * DPR;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(DPR,0,0,DPR,0,0);

    const n = 3, size = 60, gap = 14;
    const total = n*size + (n-1)*gap;
    const startX = (this.W - total)/2 + size/2;
    const startY = (this.H - total)/2 + size/2;
    this.cells = [];
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      this.cells.push({
        r, c,
        x: startX + c*(size+gap),
        y: startY + r*(size+gap),
        size, on: false, energy: 0
      });
    }
    this.t = 0; this.phase = 0; this.phaseT = 0;
    this.running = true;
    this.loop();
  },
  stop(){ this.running = false; if(this.raf) cancelAnimationFrame(this.raf); },
  loop(){
    if(!this.running) return;
    const dt = 1/60;
    this.t += dt; this.phaseT += dt;
    if(this.phase === 0 && this.phaseT > 0.5){ this.phase = 1; this.phaseT = 0; }
    else if(this.phase === 1 && this.phaseT > 1.0){ this.phase = 2; this.phaseT = 0; this.toggleCenter(); }
    else if(this.phase === 2 && this.phaseT > 1.2){ this.phase = 3; this.phaseT = 0; }
    else if(this.phase === 3 && this.phaseT > 1.0){ this.phase = 4; this.phaseT = 0; }
    else if(this.phase === 4 && this.phaseT > 1.0){ this.phase = 5; this.phaseT = 0; this.toggleCenter(); }
    else if(this.phase === 5 && this.phaseT > 1.2){ this.phase = 6; this.phaseT = 0; }
    else if(this.phase === 6 && this.phaseT > 1.0){
      this.phase = 0; this.phaseT = 0;
      this.cells.forEach(c=> c.on = false);
    }
    for(const c of this.cells){
      c.energy += ((c.on?1:0) - c.energy) * Math.min(1, dt*9);
    }
    this.draw();
    this.raf = requestAnimationFrame(()=> this.loop());
  },
  toggleCenter(){
    const center = this.cells[4];
    const dirs = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
    for(const [dr,dc] of dirs){
      const r = center.r + dr, c = center.c + dc;
      if(r<0||r>2||c<0||c>2) continue;
      const cell = this.cells[r*3 + c];
      cell.on = !cell.on;
    }
  },
  draw(){
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0,0,W,H);
    const pulse = 0.5 + 0.5*Math.sin(this.t*4);
    for(const cell of this.cells){
      const e = cell.energy;
      const half = cell.size/2;
      const hue = 200 + cell.r*20 + cell.c*15;
      if(e > 0.05){
        const glowR = half*1.8;
        const g = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, glowR);
        const a = 0.4 * e;
        g.addColorStop(0, `hsla(${hue},90%,60%,${a})`);
        g.addColorStop(1, `hsla(${hue},90%,50%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cell.x-glowR, cell.y-glowR, glowR*2, glowR*2);
      }
      ctx.fillStyle = `hsla(${hue},${30+e*55}%,${8+e*55}%,${0.3+e*0.6})`;
      this.roundRect(ctx, cell.x-half, cell.y-half, cell.size, cell.size, half*0.35);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue},80%,${50+e*30}%,${0.3+e*0.6})`;
      ctx.lineWidth = 1 + e*1.5;
      ctx.stroke();
      if((this.phase === 1 || this.phase === 4) && cell === this.cells[4]){
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5*pulse})`;
        ctx.lineWidth = 3;
        this.roundRect(ctx, cell.x-half-4, cell.y-half-4, cell.size+8, cell.size+8, half*0.35+4);
        ctx.stroke();
      }
    }
  },
  roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
};