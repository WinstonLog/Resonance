window.S = window.S || {};

S.Daily = {
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  totalDays: 0,
  todayKey: null,
  claimedRewards: [],

  DAILY_CLICKS: 5,

  init(){
    this.streak     = S.Storage.get('dailyStreak', 0);
    this.bestStreak = S.Storage.get('dailyBest', 0);
    this.lastDay    = S.Storage.get('dailyLastDay', null);
    this.totalDays  = S.Storage.get('dailyTotal', 0);
    this.claimedRewards = S.Storage.get('dailyClaimed', []) || [];
    if (!Array.isArray(this.claimedRewards)) this.claimedRewards = [];
    this.todayKey   = S.Utils.dateKey();

    if (this.lastDay &&
        this.lastDay !== this.todayKey &&
        !S.Utils.isYesterdayKey(this.lastDay)){
      this.streak = 0;
      S.Storage.set('dailyStreak', 0);
    }
  },

  isDoneToday(){ return this.lastDay === this.todayKey; },

  markDone(){
    if (this.isDoneToday()) return;
    this.streak += 1;
    this.totalDays += 1;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    this.lastDay = this.todayKey;
    S.Storage.set('dailyStreak', this.streak);
    S.Storage.set('dailyBest', this.bestStreak);
    S.Storage.set('dailyLastDay', this.lastDay);
    S.Storage.set('dailyTotal', this.totalDays);
  },

  recordToday(){
    if (this.isDoneToday()) return;
    this.markDone();
    this._markHistory(this.todayKey);
    // Проверяем награды
    const reward = this.claimRewardIfAny();
    if (reward && S.UI) S.UI.showStreakReward(reward);
  },

  // Возвращает награду, если серия пересекла порог и она ещё не выдана
  claimRewardIfAny(){
    const rewards = S.CONFIG.STREAK_REWARDS || [];
    for (const r of rewards){
      const key = 'd' + r.day;
      if (this.streak >= r.day && this.claimedRewards.indexOf(key) === -1){
        this.claimedRewards.push(key);
        S.Storage.set('dailyClaimed', this.claimedRewards);
        this._grantReward(r);
        return r;
      }
    }
    return null;
  },

  _grantReward(r){
    if (r.type === 'hints'){
      S.Hints.add(r.amount || 1);
    } else if (r.type === 'skin'){
      // скин разблокируется через S.Skins.isUnlocked (проверка streak)
      // здесь только уведомление
    } else if (r.type === 'transpose'){
      S.Storage.set('transposeUnlocked', true);
    } else if (r.type === 'badge'){
      S.Storage.set('badgeMarathon', true);
    }
  },

  // Ближайшая незакрытая награда
  nextReward(){
    const rewards = S.CONFIG.STREAK_REWARDS || [];
    for (const r of rewards){
      const key = 'd' + r.day;
      if (this.claimedRewards.indexOf(key) === -1){
        return { day: r.day, remaining: Math.max(0, r.day - this.streak) };
      }
    }
    return null;
  },

  weekStatus(){
    const out = [];
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    for (let i = 0; i < 7; i++){
      const d = new Date();
      d.setDate(now.getDate() - dow + i);
      const key = S.Utils.dateKey(d);
      const isFuture = d > now && key !== this.todayKey;

      let status = 0;
      if (isFuture) status = -1;
      else if (key === this.todayKey) status = this.isDoneToday() ? 3 : 2;
      else if (this._wasDoneOn(key)) status = 1;
      else status = 0;

      out.push({ key, status, date: d });
    }
    return out;
  },

  _history(){ return S.Storage.get('dailyHistory', ''); },
  _markHistory(key){
    const hist = this._history();
    if (hist.indexOf(key) !== -1) return;
    const arr = (hist ? hist.split(',') : []).concat(key).slice(-60);
    S.Storage.set('dailyHistory', arr.join(','));
  },
  _wasDoneOn(key){
    if (key === this.todayKey) return this.isDoneToday();
    return this._history().split(',').indexOf(key) !== -1;
  }
};