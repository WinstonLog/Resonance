window.S = window.S || {};

/* ============================================================
   VK Bridge. Требование модерации: VKWebAppInit должен быть
   отправлен в первые 30 секунд. Отправляем сразу при загрузке.
   ============================================================ */
(function(){
  if (typeof vkBridge === 'undefined'){
    console.warn('[VK] vk-bridge не загружен — dev-режим');
    return;
  }
  vkBridge.send('VKWebAppInit')
    .then(data => {
      if (data && data.result){
        console.log('[VK] VKWebAppInit OK');
        S.VKReady = true;
      }
    })
    .catch(err => console.warn('[VK] VKWebAppInit error', err));
})();

S.SDK = {
  vk: null,
  user: null,
  isAuthorized: false,
  detectedLang: 'ru',
  ready: false,

  isDevMode(){
    try{
      const h = window.location.hostname;
      const p = window.location.protocol;
      return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    }catch(e){ return true; }
  },

  async init(){
    if (typeof vkBridge === 'undefined'){
      console.warn('[VK] SDK недоступен');
      return;
    }
    this.vk = vkBridge;

    try{
      await this.vk.send('VKWebAppInit');
    }catch(e){ /* уже мог быть отправлен */ }

    // Информация о пользователе — вежливая попытка, без падения
    try{
      const user = await this.vk.send('VKWebAppGetUserInfo');
      this.user = user || null;
      this.isAuthorized = !!(user && user.id);
      if (user && user.language){
        this.detectedLang = user.language.startsWith('ru') ? 'ru' : 'en';
      }
    }catch(e){
      this.isAuthorized = false;
    }

    this.ready = true;
  },

  // VK Bridge не требует отдельного события ready — VKWebAppInit достаточно
  notifyReady(){ /* no-op */ },

  gameplayStart(){ try { this.vk && this.vk.send('VKWebAppGameplayStart'); }catch(e){} },
  gameplayStop(){  try { this.vk && this.vk.send('VKWebAppGameplayStop');  }catch(e){} },

  /* ---------- Cloud storage (VK Storage) ---------- */
  async loadCloud(){
    if (!this.vk || !this.ready) return null;
    try{
      const keys = [
        'level','best','tutorialDone','achievements','hints',
        'ratingPoints','ratingPerfect','ratingLevels'
      ];
      const res = await this.vk.send('VKWebAppStorageGet', { keys });
      const out = {};
      (res && res.keys || []).forEach(item => {
        if (!item || !item.key) return;
        if (item.value === '' || item.value === undefined) return;
        try { out[item.key] = JSON.parse(item.value); }
        catch(e){ out[item.key] = item.value; }
      });
      return out;
    }catch(e){
      console.warn('[VK] StorageGet failed', e);
      return null;
    }
  },

  async saveCloud(data){
    if (!this.vk || !this.ready) return;
    try{
      const keys = Object.keys(data).map(key => ({
        key,
        value: JSON.stringify(data[key])
      }));
      if (!keys.length) return;
      await this.vk.send('VKWebAppStorageSet', { keys });
    }catch(e){
      console.warn('[VK] StorageSet failed', e);
    }
  },

  /* ---------- Favorites / Support ---------- */
  async addToFavorites(){
    if (!this.vk) return false;
    try{
      const res = await this.vk.send('VKWebAppAddToFavorites');
      return !!(res && res.result);
    }catch(e){ return false; }
  },

  openSupport(){
    if (!this.vk) return;
    try { this.vk.send('VKWebAppOpenSupport'); }catch(e){}
  }
};

/* ============================================================
   Реклама через VK Bridge
   ============================================================ */
S.Ads = {
  lastShown: 0,

  canShow(){
    return S.SDK.ready && (Date.now() - this.lastShown) > S.CONFIG.AD_COOLDOWN_MS;
  },

  showFullscreen(onClose){
    if (!S.SDK.ready){ onClose && onClose(false); return; }
    if (!this.canShow()){ onClose && onClose(false); return; }

    try{
      S.SDK.vk.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        .then(data => {
          this.lastShown = Date.now();
          onClose && onClose(!!(data && data.result));
        })
        .catch(() => onClose && onClose(false));
    }catch(e){
      onClose && onClose(false);
    }
  },

  showRewarded(onReward, onClose){
    // В dev-режиме имитируем успешный просмотр
    if (!S.SDK.ready && S.SDK.isDevMode()){
      console.log('[DEV] Rewarded simulated');
      setTimeout(() => {
        onReward && onReward();
        onClose && onClose(true, true);
      }, 200);
      return;
    }
    if (!S.SDK.ready){
      onClose && onClose(false, false);
      return;
    }

    let rewarded = false;
    try{
      S.SDK.vk.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then(data => {
          if (data && data.result){
            rewarded = true;
            onReward && onReward();
          }
          onClose && onClose(true, rewarded);
        })
        .catch(() => onClose && onClose(false, false));
    }catch(e){
      onClose && onClose(false, false);
    }
  }
};

/* ============================================================
   Лидерборд VK. Отправляем результат через VKWebAppSetLeaderboardScore,
   а для показа используем нативное окно VKWebAppShowLeaderBoardBox.
   ============================================================ */
S.Leaderboard = {
  async submit(score){
    if (!S.SDK.ready || !S.SDK.vk) return;
    try{
      await S.SDK.vk.send('VKWebAppSetLeaderboardScore', {
        leaderboard_id: S.CONFIG.LEADERBOARD_ID,
        score: score
      });
    }catch(e){ console.warn('[VK] Leaderboard submit failed', e); }
  },

  async openNative(score){
    if (!S.SDK.ready || !S.SDK.vk){
      if (S.UI) S.UI.showToast(S.I18N.t('lbNoSDK'));
      return;
    }
    try{
      await S.SDK.vk.send('VKWebAppShowLeaderBoardBox', {
        user_result: score || 0
      });
    }catch(e){
      console.warn('[VK] ShowLeaderBoardBox failed', e);
      if (S.UI) S.UI.showToast(S.I18N.t('lbError'));
    }
  }
};