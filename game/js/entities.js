/* Enemies, projectiles, particles, scattered rings, box/checkpoint runtime state. */
(function(){
"use strict";
function mkEnemies(){
  return Level.ENEMIES.map(e=>{
    const gy = Level.groundY(e.x);
    if(e.type==="walker") return {type:e.type,x:e.x,y:gy-16,w:30,h:24,vx:60,dir:-1,minX:e.x-90,maxX:e.x+90,alive:true,t:Math.random()*5,anim:0};
    if(e.type==="flyer") return {type:e.type,x:e.x,y:e.y||gy-140,w:30,h:22,baseY:e.y||gy-140,t:Math.random()*6,range:120,speed:1.6+Math.random(),alive:true,anim:0};
    if(e.type==="crab") return {type:e.type,x:e.x,y:gy-16,w:34,h:26,vx:25,dir:-1,minX:e.x-60,maxX:e.x+60,alive:true,t:1+Math.random()*2,anim:0,shootT:2};
    if(e.type==="wasp") return {type:e.type,x:e.x,y:e.y||gy-120,w:26,h:24,baseY:e.y||gy-120,cx:e.x,t:Math.random()*6,alive:true,anim:0};
    return null;
  }).filter(Boolean);
}
function mkBoxes(){
  return Level.BOXES.map(b=>{
    const y = (b.py!==undefined)? b.py : Level.groundY(b.x)-46;
    return {x:b.x,y,kind:b.kind,used:false,bump:0};
  });
}
function mkSprings(){
  return Level.SPRINGS.map(s=>({x:s.x, y:Level.groundY(s.x)-14, dx:s.dx, dy:s.dy, power:s.power, anim:0}));
}
function mkSpikes(){
  return Level.SPIKES.map(s=>({x:s.x, y:Level.groundY(s.x), w:s.w}));
}
function mkCrumble(){
  return Level.CRUMBLE.map(c=>({x:c.x, w:c.w, y:Level.groundY(c.x+c.w/2), state:0, timer:0, respawn:0}));
}
function mkCheckpoints(){
  return Level.CHECKPOINTS.map(x=>({x, y:Level.groundY(x), active:false}));
}
const Entities = {
  enemies:mkEnemies(), boxes:mkBoxes(), springs:mkSprings(), spikes:mkSpikes(),
  crumble:mkCrumble(), checkpoints:mkCheckpoints(),
  projectiles:[], particles:[], scatter:[],
  reset(){
    this.enemies=mkEnemies(); this.boxes=mkBoxes(); this.springs=mkSprings();
    this.spikes=mkSpikes(); this.crumble=mkCrumble(); this.checkpoints=mkCheckpoints();
    this.projectiles=[]; this.particles=[]; this.scatter=[];
    Level.reset();
  },
  burst(x,y,n,spread,colors){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, sp=(spread||180)*(0.4+Math.random()*0.8);
      this.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,life:0.5+Math.random()*0.5,t:0,
        color:colors?colors[(Math.random()*colors.length)|0]:["#fff","#ffe14d","#ff9b3d"][(Math.random()*3)|0],size:2+((Math.random()*3)|0)});
    }
  },
  update(dt, game){
    const p = game.player;
    // enemies
    for(const e of this.enemies){
      if(!e.alive) continue;
      e.anim+=dt*6;
      if(Math.abs(e.x-p.x)>900) continue;
      if(e.type==="walker"||e.type==="crab"){
        e.x += e.vx*e.dir*dt;
        if(e.x<e.minX){e.x=e.minX;e.dir=1;} if(e.x>e.maxX){e.x=e.maxX;e.dir=-1;}
        if(Level.hasGround(e.x)) e.y = Level.groundY(e.x)-e.h/2-4;
        if(e.type==="crab"){
          e.shootT-=dt;
          if(e.shootT<=0 && Math.abs(e.x-p.x)<420 && Math.abs(e.y-p.y)<160){
            this.projectiles.push({x:e.x,y:e.y-8,vx:(p.x>e.x?170:-170),vy:0,life:3});
            e.shootT=2.4; AudioSys.blip(220,0.12,"square",0.15,140);
          }
        }
      } else if(e.type==="flyer"){
        e.t+=dt*e.speed; e.x+=Math.cos(e.t*0.5)*60*dt; e.y=e.baseY+Math.sin(e.t)*26;
      } else if(e.type==="wasp"){
        e.t+=dt; e.y=e.baseY+Math.sin(e.t*2)*60; e.x=e.cx+Math.sin(e.t*0.9)*70;
      }
    }
    // projectiles
    for(const s of this.projectiles){ s.x+=s.vx*dt; s.life-=dt; }
    this.projectiles=this.projectiles.filter(s=>s.life>0 && Math.abs(s.x-p.x)<900);
    // crumble
    for(const c of this.crumble){
      if(c.state===0 && p.grounded && p.x>c.x && p.x<c.x+c.w && Math.abs((p.y+p.h/2)-c.y)<26){ c.state=1; c.timer=0.45; }
      else if(c.state===1){ c.timer-=dt; if(c.timer<=0){c.state=2;c.respawn=4;} }
      else if(c.state===2){ c.respawn-=dt; if(c.respawn<=0) c.state=0; }
    }
    // box bump anim, spring anim
    for(const b of this.boxes) if(b.bump>0) b.bump-=dt*4;
    for(const s of this.springs) if(s.anim>0) s.anim-=dt*3;
    // particles
    for(const q of this.particles){ q.t+=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vy+=900*dt; }
    this.particles=this.particles.filter(q=>q.t<q.life);
    // scattered rings physics
    for(const r of this.scatter){
      r.t+=dt; r.vy+=1400*dt; r.x+=r.vx*dt; r.y+=r.vy*dt;
      const g = Level.hasGround(r.x)?Level.groundY(r.x):null;
      if(g!==null && r.y>g-8){ r.y=g-8; r.vy*=-0.6; r.vx*=0.9; }
    }
    this.scatter=this.scatter.filter(r=>r.t<6);
  }
};
window.Entities = Entities;
})();
