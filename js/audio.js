window.S = window.S || {};

S.Audio = {
  ctx:null, master:null, wet:null, reverb:null, pad:null,
  ready:false, sfxEnabled:true, musicEnabled:true,

  init(){
    if(this.ready) return;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(2.8, 2.2);
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.35;
      this.wet.connect(this.reverb);
      this.reverb.connect(this.master);

      this.ready = true;
      this.startPad();
      this.applySettings();
    }catch(e){ console.warn('Audio init failed', e); }
  },

  resume(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  suspend(){ if(this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },

  applySettings(){
    if(!this.ready) return;
    this.master.gain.setTargetAtTime(this.musicEnabled ? 0.6 : 0, this.ctx.currentTime, 0.05);
  },

  setMusic(on){
    this.musicEnabled = on;
    if(this.ready){
      this.master.gain.setTargetAtTime(on ? 0.6 : 0, this.ctx.currentTime, 0.15);
    }
  },
  setSfx(on){ this.sfxEnabled = on; },

  makeImpulse(dur, decay){
    const rate = this.ctx.sampleRate, len = Math.floor(rate*dur);
    const buf = this.ctx.createBuffer(2, len, rate);
    for(let c=0;c<2;c++){
      const d = buf.getChannelData(c);
      for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
    }
    return buf;
  },

  startPad(){
    const t = this.ctx.currentTime;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0;
    padGain.gain.linearRampToValueAtTime(0.06, t+4);
    padGain.connect(this.master);
    padGain.connect(this.wet);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 800; filter.Q.value = 2;
    filter.connect(padGain);
    [65.41, 98.00, 130.81].forEach((f,i)=>{
      const osc = this.ctx.createOscillator();
      osc.type = i%2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = f * (1 + (Math.random()-0.5)*0.003);
      const g = this.ctx.createGain(); g.gain.value = 0.3;
      osc.connect(g); g.connect(filter); osc.start();
    });
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    this.pad = { gain: padGain, filter };
  },

  note(freq, dur=1.6, vol=0.28, type='sine'){
    if(!this.ready || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type; osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    osc.connect(g); g.connect(this.master); g.connect(this.wet);
    osc.start(t); osc.stop(t+dur+0.05);

    const o2 = this.ctx.createOscillator();
    o2.type = 'triangle'; o2.frequency.value = freq*2;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(vol*0.2, t+0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t+dur*0.7);
    o2.connect(g2); g2.connect(this.master); g2.connect(this.wet);
    o2.start(t); o2.stop(t+dur*0.7);
  },

  chord(freqs, spacing=0.09, dur=2.4){
    if(!this.sfxEnabled) return;
    freqs.forEach((f,i)=> setTimeout(()=> this.note(f, dur, 0.22), i*spacing*1000));
  }
};