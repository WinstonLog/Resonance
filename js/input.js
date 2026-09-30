window.S = window.S || {};

S.Input = {
  init(){
    const canvas = S.Renderer.canvas;
    canvas.addEventListener('pointerdown', e => this.onPointerDown(e), { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('visibilitychange', ()=> {
      if(document.hidden){
        S.Audio.suspend();
        S.SDK.gameplayStop();
      } else {
        if(S.Game.state.mode === 'playing') S.Audio.resume();
      }
    });
  },

  onPointerDown(e){
    e.preventDefault();
    const rect = S.Renderer.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = S.Game.state;

    if(s.mode === 'playing'){
      // Проверяем попадание в ячейку
      for(const cell of s.cells){
        const dx = x - cell.x, dy = y - cell.y, half = cell.size*0.6;
        if(Math.abs(dx) < half && Math.abs(dy) < half){
          S.Game.handleCellTap(cell);
          return;
        }
      }
    }
  }
};