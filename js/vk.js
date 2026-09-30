window.S = window.S || {};

/* ============================================================
   VK Bridge. VKWebAppInit вызывается РОВНО ОДИН РАЗ — внутри
   S.SDK.init(). Никаких IIFE-дублей.
   ============================================================ */

/* Глушилка unhandledrejection от внутренних модулей VK Bridge. */
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason || {};
  const stack = (r && r.stack) || '';
  let msg = '';
  try {
    msg = typeof r === 'string'
      ? r
      : (r && (r.message || r.error_msg)) || String(r);
  } catch(_) { msg = ''; }

  const isVkInternal =
    stack.indexOf('bridge.ts') !== -1 ||
    stack.indexOf('promisifySend') !== -1 ||
    stack.indexOf('vk-bridge') !== -1 ||
    stack.indexOf('handleEvent') !== -1;

  const looksVk =
    msg.indexOf('VKWebApp') !== -1 ||
    msg.indexOf('already') !== -1 ||
    msg.indexOf('storage') !== -1 ||
    msg.indexOf('access') !== -1 ||
    msg.indexOf('UserDenied') !== -1 ||
    msg.indexOf('no_ad') !== -1 ||
    msg.indexOf('client_error') !== -1;

  if (isVkInternal || looksVk){
    e.preventDefault();
    console.log('[VK] suppressed rejection (internal)');
  }
});

S.SDK = {
  vk: null,
  user: null,
  isAuthorized: false,
  detectedLang: 'ru',
  ready: false,
  _initSent: false,
  _gameplayActive: false,

  isDevMode(){
    try{
      const h = window.location.hostname;
      const p = window.location.protocol;
      return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    }catch(e){ return true; }
  },

  _send(method, params){
    if (!this.vk) return Promise.resolve(null);
    return new Promise((resolve) => {
      try{
        this.vk.send(method, params)
          .then(res => resolve(res || null))
          .catch(err => {
            console.log('[VK] ' + method + ' rejected:', err);
            resolve(null);
          });
      }catch(e){
        console.log('[VK] ' + method + ' threw:', e);
        resolve(null);
      }
    });
  },

  _sendQuiet(method, params){
    if (!this.vk) return Promise.resolve(null);
    return new Promise((resolve) => {
      try{
        this.vk.send(method, params)
          .then(res => resolve(res || null))
          .catch(() => resolve(null));
      }catch(e){ resolve(null); }
    });
  },

  async init(){
    if (typeof vkBridge === 'undefined'){
      console.warn('[VK] SDK недоступен — dev-режим');
      return;
    }
    this.vk = vkBridge;

    if (!this._initSent){
      this._initSent = true;
      const res = await this._send('VKWebAppInit');
      if (res && res.result) console.log('[VK] VKWebAppInit OK');
      else console.log('[VK] VKWebAppInit уже был отправлен ранее');
    }

    const user = await this._send('VKWebAppGetUserInfo');
    if (user && user.id){
      this.user = user;
      this.isAuthorized = true;
      if (user.language){
        this.detectedLang = user.language.startsWith('ru') ? 'ru' : 'en';
      }
    }

    this.ready = true;
  },

  notifyReady(){ /* VK не требует отдельного события */ },

  gameplayStart(){
    if (!this.ready || this._gameplayActive) return;
    this._gameplayActive = true;
    this._sendQuiet('VKWebAppGameplayStart');
  },
  gameplayStop(){
    if (!this.ready || !this._gameplayActive) return;
    this._gameplayActive = false;
    this._sendQuiet('VKWebAppGameplayStop');
  },

  /* ---------- Cloud storage ---------- */
  async loadCloud(){
    if (!this.vk || !this.ready) return null;

    const keys = [
      'level','best','tutorialDone','achievements','hints',
      'ratingPoints','ratingPerfect','ratingLevels'
    ];
    const res = await this._send('VKWebAppStorageGet', { keys });
    if (!res || !res.keys) return null;

    const out = {};
    res.keys.forEach(item => {
      if (!item || !item.key) return;
      if (item.value === '' || item.value === undefined) return;
      try { out[item.key] = JSON.parse(item.value); }
      catch(e){ out[item.key] = item.value; }
    });
    return out;
  },

  async saveCloud(data){
    if (!this.vk || !this.ready) return;
    const keys = Object.keys(data).map(key => ({
      key,
      value: JSON.stringify(data[key])
    }));
    if (!keys.length) return;
    await this._send('VKWebAppStorageSet', { keys });
  },

  /* ---------- Favorites ---------- */
  async addToFavorites(){
    const res = await this._send('VKWebAppAddToFavorites');
    return !!(res && res.result);
  },

  /* ---------- Community (Support) ---------- */
  async joinCommunity(groupId){
    if (!groupId) return false;
    const res = await this._send('VKWebAppJoinGroup', { group_id: groupId });
    return !!(res && res.result);
  },

  async openCommunityUrl(url){
    const res = await this._send('VKWebAppOpenURL', { url: url });
    return !!(res && res.result);
  }
};

/* ============================================================
   Пауза игры и звука на время рекламы.
   VK Bridge не даёт onOpen/onClose для ShowNativeAds — промис
   резолвится только когда реклама закрыта. Поэтому:
   1) ставим игру на паузу и глушим звук ПЕРЕД показом;
   2) ждём промис;
   3) возвращаем всё как было ПОСЛЕ закрытия.
   ============================================================ */
S.Ads = {
  lastShown: 0,
  _suspended: false,

  canShow(){
    return S.SDK.ready && (Date.now() - this.lastShown) > S.CONFIG.AD_COOLDOWN_MS;
  },

  /* Ставит игру на паузу, глушит музыку и сообщает VK, что
     геймплей остановлен. Не показывает экран паузы. */
  _suspendForAd(){
    if (this._suspended) return;
    this._suspended = true;

    // Пауза игрового процесса без открытия экрана "Пауза"
    try {
      if (S.Game && S.Game.state.mode === 'playing'){
        S.Game.savePuzzle();
        S.Game.state.previousMode = 'playing';
        S.Game.state.mode = 'paused';
      }
    } catch(e){}

    // Полностью выключаем звук (не только suspend, но и gain = 0)
    try {
      if (S.Audio && S.Audio.ready){
        S.Audio._adMutedMusic = S.Audio.musicEnabled;
        S.Audio._adMutedSfx = S.Audio.sfxEnabled;
        S.Audio.suspend();
        // Дополнительно приглушаем master — на случай, если
        // AudioContext не переходит в suspended (iOS).
        if (S.Audio.master){
          S.Audio.master.gain.setTargetAtTime(0, S.Audio.ctx.currentTime, 0.02);
        }
      }
    } catch(e){}

    // Сообщаем VK, что геймплей остановлен
    try { S.SDK.gameplayStop(); } catch(e){}
  },

  /* Возвращает игру и звук из состояния паузы после рекламы. */
  _resumeAfterAd(){
    if (!this._suspended) return;
    this._suspended = false;

    try {
      if (S.Game && S.Game.state.mode === 'paused'
          && S.Game.state.previousMode === 'playing'){
        S.Game.state.mode = 'playing';
      }
    } catch(e){}

    try {
      if (S.Audio && S.Audio.ready){
        // Возвращаем master gain как было
        if (S.Audio.master){
          const target = S.Audio.musicEnabled ? 0.6 : 0;
          S.Audio.master.gain.setTargetAtTime(target, S.Audio.ctx.currentTime, 0.05);
        }
        S.Audio.resume();
      }
    } catch(e){}

    try { S.SDK.gameplayStart(); } catch(e){}
  },

  async isRewardedAvailable(){
    if (!S.SDK.ready) return false;
    const res = await S.SDK._send('VKWebAppCheckNativeAds', { ad_format: 'reward' });
    if (!res) return false;
    return !!res.result;
  },

  async showFullscreen(onClose){
    if (!S.SDK.ready){ onClose && onClose(false); return; }
    if (!this.canShow()){ onClose && onClose(false); return; }

    this._suspendForAd();
    const res = await S.SDK._send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
    this.lastShown = Date.now();
    this._resumeAfterAd();

    onClose && onClose(!!(res && res.result));
  },

  /**
   * Показывает rewarded-рекламу.
   * onReward вызывается ТОЛЬКО если реклама реально просмотрена.
   * onClose(wasShown, rewarded, reason):
   *   wasShown — был ли вообще показан рекламный блок
   *   rewarded — получена ли награда
   *   reason   — 'ok' | 'closed_early' | 'unavailable' | 'error'
   */
  async showRewarded(onReward, onClose){
    // Dev-режим: имитируем успешный просмотр
    if (!S.SDK.ready && S.SDK.isDevMode()){
      console.log('[Ads] DEV: rewarded simulated');
      this._suspendForAd();
      setTimeout(() => {
        this._resumeAfterAd();
        onReward && onReward();
        onClose && onClose(true, true, 'ok');
      }, 400);
      return;
    }

    if (!S.SDK.ready){
      console.log('[Ads] SDK not ready');
      onClose && onClose(false, false, 'unavailable');
      return;
    }

    // Проверяем доступность rewarded-рекламы ДО паузы,
    // чтобы не морозить игру, если реклама не покажется.
    const available = await this.isRewardedAvailable();
    console.log('[Ads] Rewarded available:', available);

    if (!available){
      onClose && onClose(false, false, 'unavailable');
      return;
    }

    // Ставим на паузу и глушим звук
    this._suspendForAd();

    // Показываем рекламу — промис резолвится, когда её закрыли
    const res = await S.SDK._send('VKWebAppShowNativeAds', { ad_format: 'reward' });
    console.log('[Ads] ShowNativeAds result:', res);
    this.lastShown = Date.now();

    // Возвращаем игру и звук
    this._resumeAfterAd();

    if (!res){
      onClose && onClose(false, false, 'error');
      return;
    }

    const rewarded = !!(res && res.result === true);
    if (rewarded && onReward) onReward();
    onClose && onClose(true, rewarded, rewarded ? 'ok' : 'closed_early');
  }
};

/* ============================================================
   Лидерборд VK
   ============================================================ */
S.Leaderboard = {
  async submit(score){
    if (!S.SDK.ready || !S.SDK.vk) return;
    await S.SDK._send('VKWebAppSetLeaderboardScore', {
      leaderboard_id: S.CONFIG.LEADERBOARD_ID,
      score: score
    });
  },

  async openNative(score){
    if (!S.SDK.ready || !S.SDK.vk){
      if (S.UI) S.UI.showToast(S.I18N.t('lbNoSDK'));
      return;
    }
    const res = await S.SDK._send('VKWebAppShowLeaderBoardBox', {
      user_result: score || 0
    });
    if (!res && S.UI) S.UI.showToast(S.I18N.t('lbError'));
  }
};