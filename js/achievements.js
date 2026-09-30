window.S = window.S || {};

S.Achievements = {
  unlocked: {},

  list: [
    { id:'first',      icon:'✦', titleRu:'Первый свет',      titleEn:'First light',      descRu:'Реши первый уровень',        descEn:'Solve your first level',
      check:() => S.Game.state.best >= 2 },
    { id:'ten',        icon:'✦✦', titleRu:'Настройщик',       titleEn:'Tuner',            descRu:'Пройди 10 уровней',           descEn:'Reach level 10',
      check:() => S.Game.state.best >= 10 },
    { id:'twenty5',    icon:'✧', titleRu:'Резонатор',        titleEn:'Resonator',        descRu:'Пройди 25 уровней',           descEn:'Reach level 25',
      check:() => S.Game.state.best >= 25 },
    { id:'fifty',      icon:'❋', titleRu:'Маэстро',          titleEn:'Maestro',          descRu:'Пройди 50 уровней',           descEn:'Reach level 50',
      check:() => S.Game.state.best >= 50 },
    { id:'hundred',    icon:'✺', titleRu:'Легенда',          titleEn:'Legend',           descRu:'Пройди 100 уровней',          descEn:'Reach level 100',
      check:() => S.Game.state.best >= 100 },

    { id:'perfect1',   icon:'○', titleRu:'Идеально',         titleEn:'Perfect',          descRu:'Пройди уровень за 1 ход',     descEn:'Solve a level in 1 move',
      check:() => S.Storage.get('perf1', false) },
    { id:'perfect5',   icon:'◎', titleRu:'Перфекционист',     titleEn:'Perfectionist',    descRu:'5 уровней по 1 ходу',         descEn:'5 levels in 1 move',
      check:() => S.Storage.get('perf5', false) },
    { id:'fast',       icon:'⚡', titleRu:'Скорость',         titleEn:'Speed',            descRu:'Пройди уровень за 3 секунды', descEn:'Solve a level in 3 seconds',
      check:() => S.Storage.get('fast1', false) },
    { id:'fast5',      icon:'⚡⚡', titleRu:'Молния',          titleEn:'Lightning',        descRu:'5 уровней подряд за 5 сек',   descEn:'5 levels under 5s each',
      check:() => S.Storage.get('fast5', false) },
    { id:'noHint',     icon:'✧', titleRu:'Спартанец',         titleEn:'Spartan',          descRu:'10 уровней без подсказки',    descEn:'10 levels without a hint',
      check:() => S.Storage.get('noHint10', false) },

    { id:'streak3',    icon:'◆', titleRu:'Ритуал',           titleEn:'Ritual',           descRu:'3 дня подряд',                descEn:'3 days in a row',
      check:() => S.Daily.streak >= 3 },
    { id:'streak7',    icon:'◆◆', titleRu:'Спартанец дней',   titleEn:'Week warrior',     descRu:'7 дней подряд',               descEn:'7 days in a row',
      check:() => S.Daily.streak >= 7 },
    { id:'streak30',   icon:'✵', titleRu:'Марафонец',        titleEn:'Marathoner',       descRu:'30 дней подряд',              descEn:'30 days in a row',
      check:() => S.Daily.streak >= 30 },

    { id:'daily1',     icon:'☀', titleRu:'Первый рассвет',   titleEn:'First dawn',       descRu:'Пройди ежедневный вызов',     descEn:'Solve a daily challenge',
      check:() => S.Daily.totalDays >= 1 },
    { id:'skins3',     icon:'✿', titleRu:'Коллекционер',     titleEn:'Collector',        descRu:'Открой 3 скина',              descEn:'Unlock 3 skins',
      check:() => S.Skins.list.filter(s => S.Skins.isUnlocked(s.id)).length >= 3 }
  ],

  init(){
    this.unlocked = S.Storage.get('achievements', {}) || {};
  },

  // Вызывается после события (решил уровень, daily и т.п.)
  check(){
    let newOnes = [];
    for (const a of this.list){
      if (this.unlocked[a.id]) continue;
      let ok = false;
      try { ok = !!a.check(); } catch(e){}
      if (ok){
        this.unlocked[a.id] = Date.now();
        newOnes.push(a);
      }
    }
    if (newOnes.length){
      S.Storage.set('achievements', this.unlocked);
      // Тост по одному с задержкой
      newOnes.forEach((a, i) => {
        setTimeout(() => S.UI.showAchievementToast(a), i*700);
      });
      S.SDK.saveCloud({ achievements: this.unlocked });
    }
  },

  countUnlocked(){
    return Object.keys(this.unlocked).length;
  }
};