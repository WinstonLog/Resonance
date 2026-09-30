window.S = window.S || {};

S.Renderer = {
  W:0, H:0, DPR:1,
  canvas:null, ctx:null,

  init(){
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', ()=> this.resize());
    window.addEventListener('orientationchange', ()=> setTimeout(()=> this.resize(), 120));
  },

  resize(){
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W*this.DPR);
    this.canvas.height = Math.floor(this.H*this.DPR);
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    if(S.Game.state.cells.length) S.Game.layoutCells();
  },

  roundRect(x,y,w,h,r){
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
  },

  render(){
    const s = S.Game.state, c = this.ctx, W = this.W, H = this.H;

    // Фон
    const bgHue = 230 + Math.sin(s.time*0.05)*20;
    const bg = c.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.9);
    bg.addColorStop(0, `hsl(${bgHue},40%,8%)`);
    bg.addColorStop(1, `hsl(${bgHue+20},50%,3%)`);
    c.fillStyle = bg; c.fillRect(0,0,W,H);

    const vg = c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.5)');
    c.fillStyle = vg; c.fillRect(0,0,W,H);

    // Пыль
    c.globalCompositeOperation = 'lighter';
    for(const p of s.dust){
      c.fillStyle = `rgba(180,200,255,${0.08*p.z})`;
      c.beginPath();
      c.arc(p.x*W, p.y*H, p.r*p.z, 0, Math.PI*2);
      c.fill();
    }

    // Свечение ячеек
    for(const cell of s.cells){
      if(cell.energy < 0.01) continue;
      const glowR = cell.size * (1.6 + Math.sin(s.time*2 + cell.r + cell.c)*0.08);
      const g = c.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, glowR);
      const a = 0.35 * cell.energy;
      g.addColorStop(0, `hsla(${cell.hue},90%,60%,${a})`);
      g.addColorStop(0.5, `hsla(${cell.hue},90%,55%,${a*0.3})`);
      g.addColorStop(1, `hsla(${cell.hue},90%,50%,0)`);
      c.fillStyle = g;
      c.fillRect(cell.x-glowR, cell.y-glowR, glowR*2, glowR*2);
    }

    // Волны
    for(const ring of s.rings){
      const a = Math.max(0, ring.life) * (ring.big ? 0.4 : 0.6);
      c.strokeStyle = `hsla(${ring.hue},90%,70%,${a})`;
      c.lineWidth = ring.big ? 3 : 2;
      c.beginPath();
      c.arc(ring.x, ring.y, ring.r, 0, Math.PI*2);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';

    // Ячейки
    for(const cell of s.cells){
      const e = cell.energy;
      const popScale = 1 + cell.pop*0.18;
      const half = (cell.size * popScale) / 2;
      const r = half * 0.35;
      const lightness = 8 + e*55;
      const alpha = 0.3 + e*0.6;
      c.fillStyle = `hsla(${cell.hue},${30+e*55}%,${lightness}%,${alpha})`;
      this.roundRect(cell.x-half, cell.y-half, half*2, half*2, r);
      c.fill();
      c.strokeStyle = `hsla(${cell.hue},80%,${50+e*30}%,${0.25+e*0.6})`;
      c.lineWidth = 1 + e*1.5;
      c.stroke();

      if(e > 0.05){
        const inner = half * (0.5 - e*0.1);
        const ig = c.createRadialGradient(
          cell.x-inner*0.3, cell.y-inner*0.3, 0, cell.x, cell.y, inner*1.6);
        ig.addColorStop(0, `hsla(${cell.hue},100%,85%,${e*0.5})`);
        ig.addColorStop(1, `hsla(${cell.hue},100%,70%,0)`);
        c.fillStyle = ig;
        this.roundRect(cell.x-half*0.7, cell.y-half*0.7, half*1.4, half*1.4, r*0.7);
        c.fill();
      }
    }

    // Частицы
    c.globalCompositeOperation = 'lighter';
    for(const p of s.particles){
      const a = Math.max(0, p.life);
      c.fillStyle = `hsla(${p.hue},90%,70%,${a})`;
      c.beginPath();
      c.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';

    // Подсказка "погаси все огни"
    if(s.mode === 'playing' && s.moves === 0 && S.Tutorial.step === 0 &&
       s.level > 1 && !s.hintActive){
      const a = 0.4 + 0.3*Math.sin(s.time*2);
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.font = `300 ${Math.min(14, W*0.038)}px -apple-system,sans-serif`;
      c.fillStyle = `rgba(180,200,255,${a})`;
      c.fillText(S.I18N.t('extinguishAll'), W/2, H-80);
    }

    // Оверлей подсказки (одна метка)
    this.renderHintOverlay();

    // Оверлей туториала
    this.renderTutorialOverlay();
  },

  /* ============ ПОДСКАЗКА — одна метка ============ */
  renderHintOverlay(){
    const s = S.Game.state;
    if(!s.hintCells || s.hintCells.size === 0) return;
    if(s.mode !== 'playing' && s.mode !== 'paused') return;

    const c = this.ctx;
    const pulse = 0.5 + 0.5*Math.sin(s.time*4);

    for(const idx of s.hintCells){
      const cell = s.cells[idx];
      if(!cell) continue;
      const half = cell.size / 2;

      // Мягкий белый ореол
      const glowR = cell.size * 1.25;
      const g = c.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, glowR);
      g.addColorStop(0, `rgba(255,255,255,${0.28 + 0.15*pulse})`);
      g.addColorStop(0.6, `rgba(255,255,255,${0.08 + 0.05*pulse})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(cell.x - glowR, cell.y - glowR, glowR*2, glowR*2);

      // Пульсирующее кольцо
      const ringR = half * (1.35 + 0.18*pulse);
      c.strokeStyle = `rgba(255,255,255,${0.7 + 0.3*pulse})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(cell.x, cell.y, ringR, 0, Math.PI*2);
      c.stroke();

      // Расходящаяся рябь
      const ripple = (s.time * 0.9) % 1;
      c.strokeStyle = `rgba(255,255,255,${(1 - ripple) * 0.5})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cell.x, cell.y, ringR + ripple * half * 0.8, 0, Math.PI*2);
      c.stroke();

      // Точка в центре
      c.fillStyle = `rgba(255,255,255,${0.85 + 0.15*pulse})`;
      c.beginPath();
      c.arc(cell.x, cell.y, Math.min(7, half*0.32), 0, Math.PI*2);
      c.fill();
    }
  },

  /* ============ ТУТОРИАЛ ============ */
  // Затемнение — ТОЛЬКО на шаге 1. На шагах 2-3 (когда игрок уже понял
  // базовую механику) туториал не перекрывает поле, чтобы была видна
  // пошаговая подсказка.
  renderTutorialOverlay(){
    const s = S.Game.state, c = this.ctx, W = this.W, H = this.H;

    if(S.Tutorial.step !== 1) return;      // шаги 2 и 3 — ничего не рисуем
    const target = S.Tutorial.targetCell;
    if(!target) return;

    const pulse = 0.5 + 0.5*Math.sin(s.time*3);
    const half = target.size / 2;

    // Затемнение вокруг целевой ячейки
    const tg = c.createRadialGradient(
      target.x, target.y, 0,
      target.x, target.y, target.size*4.5);
    tg.addColorStop(0,   'rgba(0,0,0,0)');
    tg.addColorStop(0.35,'rgba(3,5,14,0.35)');
    tg.addColorStop(0.7, 'rgba(3,5,14,0.72)');
    tg.addColorStop(1,   'rgba(3,5,14,0.88)');
    c.fillStyle = tg;
    c.fillRect(0, 0, W, H);

    // Пульсирующее кольцо
    const ringR = half * (1.45 + pulse*0.15);
    c.strokeStyle = `rgba(255,255,255,${0.45 + 0.55*pulse})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(target.x, target.y, ringR, 0, Math.PI*2);
    c.stroke();

    // Внешнее кольцо
    c.strokeStyle = `rgba(140,180,255,${0.2 + 0.35*(1-pulse)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(target.x, target.y, ringR + 22*pulse, 0, Math.PI*2);
    c.stroke();

    // Индикатор пальца
    const cyc = (s.time * 1.4) % 1;
    const rippleR = half * 0.9 * cyc;
    const rippleA = Math.max(0, 1 - cyc);
    c.strokeStyle = `rgba(255,255,255,${rippleA*0.7})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(target.x, target.y, rippleR, 0, Math.PI*2);
    c.stroke();

    const dotR = Math.min(12, half*0.32);
    c.fillStyle = `rgba(255,255,255,${0.85 + 0.15*pulse})`;
    c.beginPath();
    c.arc(target.x, target.y, dotR, 0, Math.PI*2);
    c.fill();

    const halo = c.createRadialGradient(target.x, target.y, 0, target.x, target.y, dotR*3);
    halo.addColorStop(0, `rgba(255,255,255,${0.35*(0.6+0.4*pulse)})`);
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(target.x, target.y, dotR*3, 0, Math.PI*2);
    c.fill();
  }
};