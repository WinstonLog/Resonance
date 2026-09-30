window.S = window.S || {};

S.Hints = {
  count: 0,

  init(){
    this.count = S.Storage.get('hints', 0) || 0;
    if(!S.Storage.get('hintsInit', false)){
      this.count = 1;
      S.Storage.set('hints', 1);
      S.Storage.set('hintsInit', true);
    }
  },

  add(n = 1){
    this.count += n;
    S.Storage.set('hints', this.count);
    S.SDK.saveCloud({ hints: this.count });
    if (S.UI) S.UI.updateHintsCounter();
  },

  use(){
    if(this.count <= 0) return false;
    this.count--;
    S.Storage.set('hints', this.count);
    S.SDK.saveCloud({ hints: this.count });
    if (S.UI) S.UI.updateHintsCounter();
    return true;
  }
};