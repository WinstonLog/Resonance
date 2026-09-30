window.S = window.S || {};

S.Skins = {
  list: [
    {
      id:'classic', nameRu:'Классика', nameEn:'Classic',
      palette:[180,212,244,276,308,340,12,44,76],
      unlock:{ type:'free' }
    },
    {
      id:'aurora', nameRu:'Сияние', nameEn:'Aurora',
      palette:[150,165,180,195,210,225,240,260,285],
      unlock:{ type:'level', n:10, labelRu:'10 уровней', labelEn:'10 levels' }
    },
    {
      id:'sunset', nameRu:'Закат', nameEn:'Sunset',
      palette:[0,15,30,45,60,20,350,330,310],
      unlock:{ type:'level', n:25, labelRu:'25 уровней', labelEn:'25 levels' }
    },
    {
      id:'neon', nameRu:'Неон', nameEn:'Neon',
      palette:[300,320,340,0,30,60,180,200,260],
      unlock:{ type:'level', n:50, labelRu:'50 уровней', labelEn:'50 levels' }
    },
    {
      id:'ocean', nameRu:'Океан', nameEn:'Ocean',
      palette:[185,195,205,215,225,235,245,255,265],
      unlock:{ type:'level', n:100, labelRu:'100 уровней', labelEn:'100 levels' }
    },
    {
      id:'mono', nameRu:'Монохром', nameEn:'Mono',
      palette:[220,220,220,220,220,220,220,220,220],
      unlock:{ type:'streak', n:7, labelRu:'Серия 7 дней', labelEn:'7-day streak' }
    }
  ],

  current: 'classic',

  init(){
    const saved = S.Storage.get('skin', 'classic');
    if (this.get(saved) && this.isUnlocked(saved)) this.current = saved;
  },

  get(id){
    return this.list.find(s => s.id === id) || this.list[0];
  },

  isUnlocked(id){
    const skin = this.get(id);
    const u = skin.unlock || { type:'free' };
    if (u.type === 'free') return true;
    if (u.type === 'level') return (S.Game.state.best || 1) - 1 >= u.n;
    if (u.type === 'streak') return (S.Daily.streak || 0) >= u.n;
    return false;
  },

  setSkin(id){
    if (!this.isUnlocked(id)) return false;
    this.current = id;
    S.Storage.set('skin', id);
    this.applyToCells();
    return true;
  },

  // Меняет hue текущих ячеек под выбранную палитру
  applyToCells(){
    const cells = S.Game.state.cells;
    if (!cells || !cells.length) return;
    const palette = this.get(this.current).palette;
    for (const cell of cells){
      const idx = (cell.r + cell.c) % palette.length;
      cell.hue = palette[idx];
    }
  },

  // Для демо-канваса и меню — получить палитру
  getPalette(){
    return this.get(this.current).palette;
  }
};