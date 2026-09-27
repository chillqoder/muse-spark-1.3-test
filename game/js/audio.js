/* Original procedural chiptune + SFX engine (WebAudio, no assets). */
(function(){
"use strict";
const AudioSys = {
  ctx:null, master:null, musicGain:null, muted:false, musicTimer:null, step:0,
  init(){
    if(this.ctx) return;
    try{
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value=0.55; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value=0.30; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value=0.5; this.sfxGain.connect(this.master);
    }catch(e){}
  },
  resume(){ this.init(); if(this.ctx && this.ctx.state==="suspended") this.ctx.resume(); },
  toggleMute(){ this.muted=!this.muted; if(this.master) this.master.gain.value=this.muted?0:0.55; return this.muted; },
  // --- SFX ---
  blip(freq,dur,type,vol,slide){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type||"square"; o.frequency.setValueAtTime(freq,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+dur);
    g.gain.setValueAtTime(vol||0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t+dur+0.02);
  },
  noise(dur,vol,hp){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime, len=Math.floor(this.ctx.sampleRate*dur);
    const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const f=this.ctx.createBiquadFilter(); f.type=hp?"highpass":"lowpass"; f.frequency.value=hp||1200;
    const g=this.ctx.createGain(); g.gain.value=vol||0.3;
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t);
  },
  jump(){ this.blip(300,0.18,"square",0.22,700); },
  ring(){ this.blip(950,0.28,"sine",0.28,1900); this.blip(1420,0.2,"sine",0.15,2100); },
  spring(){ this.blip(180,0.3,"square",0.3,1200); },
  stomp(){ this.noise(0.18,0.4); this.blip(400,0.15,"square",0.25,120); },
  hurt(){ this.blip(500,0.35,"sawtooth",0.3,110); },
  ringLoss(){ this.blip(700,0.3,"square",0.22,150); },
  checkpoint(){ this.blip(660,0.12,"square",0.25); setTimeout(()=>this.blip(880,0.18,"square",0.25),110); },
  item(){ this.blip(520,0.1,"square",0.25,780); setTimeout(()=>this.blip(780,0.1,"square",0.25,1040),90); setTimeout(()=>this.blip(1040,0.2,"square",0.25),180); },
  breakBox(){ this.noise(0.22,0.45); },
  skid(){ this.noise(0.12,0.15,3000); },
  splash(){ this.noise(0.3,0.35,900); },
  win(){ const n=[523,659,784,1046,784,1046]; n.forEach((f,i)=>setTimeout(()=>this.blip(f,0.22,"square",0.26),i*130)); },
  die(){ this.blip(600,0.6,"sawtooth",0.3,60); },
  boost(){ this.blip(200,0.5,"sawtooth",0.25,1400); },
  // --- Music: upbeat 16-step chiptune loop, tempo can scale with speed boost ---
  tempoScale:1,
  startMusic(){
    if(!this.ctx||this.musicTimer) return;
    const bass=[0,0,7,0, 5,5,7,7, 3,3,7,3, 5,5,7,12];
    const lead=[0,4,7,12, 7,12,16,12, 10,14,17,14, 12,16,19,24];
    const root=110;
    const playStep=()=>{
      if(this.muted) { this.step=(this.step+1)%16; return; }
      const s=this.step, t=this.ctx.currentTime;
      const bf=root*Math.pow(2,bass[s]/12);
      this.mtone(bf,0.21,"triangle",0.5,t);
      if(s%2===0){
        const lf=root*4*Math.pow(2,lead[s]/12);
        this.mtone(lf,0.16,"square",0.12,t);
      }
      if(s%4===2) this.mtone(root*8,0.05,"square",0.06,t+0.1);
      // hat
      if(s%2===1) this.mhat(t);
      this.step=(this.step+1)%16;
    };
    const interval=()=> 150/this.tempoScale;
    const tick=()=>{ playStep(); this.musicTimer=setTimeout(tick,interval()); };
    tick();
  },
  mtone(freq,dur,type,vol,t){
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t+dur+0.02);
  },
  mhat(t){
    const len=Math.floor(this.ctx.sampleRate*0.04), buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const f=this.ctx.createBiquadFilter(); f.type="highpass"; f.frequency.value=6000;
    const g=this.ctx.createGain(); g.gain.value=0.08;
    s.connect(f); f.connect(g); g.connect(this.musicGain); s.start(t);
  }
};
window.AudioSys = AudioSys;
})();
