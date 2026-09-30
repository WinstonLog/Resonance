window.S = window.S || {};

/* ============================================================
   VK Bridge. VKWebAppInit вызывается РОВНО ОДИН РАЗ — внутри
   S.SDK.init(). Это убирает Uncaught (in promise) от повторного
   вызова метода.
   ============================================================ */

// Глушилка ожидаемых reject'ов VK Bridge (already sent, storage empty и т.п.)
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason;
  if (r && (typeof r === 'object' || typeof r === 'string')){
    const s = typeof r === 'string' ? r : JSON.stringify(r);
    if (s.indexOf('already') !== -1 ||
        s.indexOf('storage') !== -1 ||
        s.indexOf('access') !== -1 ||
        s.indexOf('UserDenied') !== -1 ||
        s.indexOf('VKWebAppInit') !== -1){
      e.preventDefault();
      console.log('[VK] suppressed rejection:', s);
    }
  }
});

S.SDK = {
  vk: null,
  user: null,
  isAuthorized: false,
  detectedLang: 'ru',
  ready: false,
  _initSent: false,

  isDevMode(){
    try{
      const h = window.location.hostname;
      const p = window.location.protocol;
      return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    }catch(e){ return true; }
  },

  async _send(method, params){
    if (!this.vk) return null;
    try{
      return await this.vk.send(method, params);
    }catch(e){
      console.log('[VK] ' + method + ' rejected:', e);
      return null;
    }
  },

  async init(){
    if (typeof vkBridge === 'undefined'){
      console.warn('[VK] SDK недоступен — dev-режим');
      return;
    }
    this.vk = vkBridge;

    // VKWebAppInit — ОДИН РАЗ. Никаких IIFE-дублей.
    if (!this._initSent){
      this._initSent = true;
      const res = await this._send('VKWebAppInit');
      if (res && res.result) console.log('[VK] VKWebAppInit OK');
      else console.log('[VK] VKWebAppInit уже был отправлен ранее');
    }

    // Информация о пользователе — опционально
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

  gameplayStart(){ this._send('VKWebAppGameplayStart'); },
  gameplayStop(){  this._send('VKWebAppGameplayStop');  },

  /* ---------- Cloud storage (VK Storage) ---------- */
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

  /* ---------- Community (Support) ----------
     Вместо несуществующего VKWebAppOpenSupport используем
     VKWebAppJoinGroup — стандартный способ поддержки через
     сообщество. ID сообщества берётся из S.CONFIG.VK_GROUP_ID.
     Например, для vk.com/veldgame нужно подставить числовой ID
     сообщества, который виден в настройках группы.
  -------------------------------------------- */
  async joinCommunity(groupId){
    if (!groupId) return false;
    const res = await this._send('VKWebAppJoinGroup', { group_id: groupId });
    return !!(res && res.result);
  },

  /* Резервный вариант: открыть ссылку на сообщество.
     Используем, только если JoinGroup почему-то недоступен. */
  async openCommunityUrl(url){
    const res = await this._send('VKWebAppOpenURL', { url: url });
    return !!(res && res.result);
  }
};

/* ============================================================
   Реклама
   ============================================================ */
S.Ads = {
  lastShown: 0,

  canShow(){
    return S.SDK.ready && (Date.now() - this.lastShown) > S.CONFIG.AD_COOLDOWN_MS;
  },

  /**
   * Проверяет, доступна ли rewarded-реклама на текущей платформе.
   * Если VK не может показать rewarded — не показываем ничего и
   * не даём награду.
   */
  async isRewardedAvailable(){
    if (!S.SDK.ready) return false;
    const res = await S.SDK._send('VKWebAppCheckNativeAds', { ad_format: 'reward' });
    if (!res) return false;
    return !!res.result;
  },

  async showFullscreen(onClose){
    if (!S.SDK.ready){ onClose && onClose(false); return; }
    if (!this.canShow()){ onClose && onClose(false); return; }

    const res = await S.SDK._send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
    this.lastShown = Date.now();
    onClose && onClose(!!(res && res.result));
  },

  /**
   * Показывает rewarded-рекламу.
   * onReward вызывается ТОЛЬКО если реклама реально просмотрена
   * (VK вернул result: true). Если пользователь закрыл досрочно —
   * onReward не сработает, onClose получит rewarded = false.
   */
  async showRewarded(onReward, onClose){
    // Dev-режим: имитируем успешный просмотр
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

    // Проверяем доступность именно rewarded-рекламы
    const available = await this.isRewardedAvailable();
    if (!available){
      console.log('[VK] Rewarded ad not available');
      onClose && onClose(false, false);
      return;
    }

    const res = await S.SDK._send('VKWebAppShowNativeAds', { ad_format: 'reward' });
    this.lastShown = Date.now();

    const rewarded = !!(res && res.result === true);
    if (rewarded && onReward) onReward();
    onClose && onClose(true, rewarded);
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