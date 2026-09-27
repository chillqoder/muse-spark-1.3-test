/* Main game: loop, camera, interactions, pixel-art rendering, HUD/screens. */
(function(){
"use strict";
const cv=document.getElementById("game"), ctx=cv.getContext("2d");
ctx.imageSmoothingEnabled=false;

const Game = {
  state:"title", rings:0, score:0, time:0, lives:3,
  cam:{x:0,y:60}, movers:[], tunnels:[{x1:4280,x2:4720,ceil:336}],
  msg:"", msgT:0, shake:0,
  init(){
    this.player=Player; this.ent=Entities;
    this.reset(true);
    this.bindInput();
    requestAnimationFrame(t=>this.frame(t));
  },
  reset(full){
    if(full){ this.rings=0; this.score=0; this.time=0; this.lives=3; }
    Entities.reset(); Player.reset();
    Player.respawn={x:120,y:Level.groundY(120)-40};
    this.movers=Level.MOVERS.map(m=>({...m,x:(m.x1+m.x2)/2,y:m.y,t:(m.phase||0)*m.period,dx:0}));
    this.cam.x=0; this.cam.y=60; this.msg=""; this.state="title";
  },
  startLevel(){
    this.state="play"; AudioSys.resume(); AudioSys.startMusic();
  },
  // ---- input ----
  keys:{},
  bindInput(){
    this.input={left:false,right:false,up:false,down:false,jump:false,jumpPressed:false};
    addEventListener("keydown",e=>{
      if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code)) e.preventDefault();
      AudioSys.resume();
      const k=e.code;
      if(k==="ArrowLeft"||k==="KeyA") this.input.left=true;
      if(k==="ArrowRight"||k==="KeyD") this.input.right=true;
      if(k==="ArrowUp"||k==="KeyW") this.input.up=true;
      if(k==="ArrowDown"||k==="KeyS") this.input.down=true;
      if(k==="Space"&&!e.repeat){ this.input.jump=true; this.input.jumpPressed=true; }
      if(k==="Enter"&&this.state==="title") this.startLevel();
      if(k==="Enter"&&(this.state==="win"||this.state==="over")){ this.reset(true); this.startLevel(); }
      if(k==="KeyR"){ this.reset(true); this.startLevel(); }
      if(k==="Escape"||k==="KeyP"){ if(this.state==="play")this.state="pause"; else if(this.state==="pause")this.state="play"; }
      if(k==="KeyM"){ const m=AudioSys.toggleMute(); this.flash(m?"MUTED":"SOUND ON"); }
    });
    addEventListener("blur",()=>{ for(const k in this.input) this.input[k]=false; if(this.state==="play") this.state="pause"; });
    cv.addEventListener("pointerdown",()=>{ if(this.state==="title") this.startLevel(); });
    addEventListener("keyup",e=>{
      const k=e.code;
      if(k==="ArrowLeft"||k==="KeyA") this.input.left=false;
      if(k==="ArrowRight"||k==="KeyD") this.input.right=false;
      if(k==="ArrowUp"||k==="KeyW") this.input.up=false;
      if(k==="ArrowDown"||k==="KeyS") this.input.down=false;
      if(k==="Space") this.input.jump=false;
    });
  },
  flash(m){ this.msg=m; this.msgT=1.4; },
  softReset(){ // respawn at checkpoint, keep score-ish
    const r=Player.respawn;
    Player.x=r.x; Player.y=r.y-20; Player.vx=0; Player.vy=0; Player.dead=false; Player.invuln=2; Player.loop=null; Player.rolling=false; Player.win=false; Player.h=46; Player.grounded=false; Player.jumped=false; Player.loopLock=null; Player.support=null; Player.autoRoll=false; Player.runCharge=0;
    if(this.state!=="play") this.state="play";
  },
  onPitFall(){
    AudioSys.splash();
    const p=Player;
    p.autoRoll=false; p.runCharge=0; p.rolling=false; p.h=46; p.grounded=false; p.jumped=false;
    if(this.rings>0){
      // drop rings at last safe, respawn there
      for(let i=0;i<Math.min(10,this.rings);i++) this.ent.scatter.push({x:p.lastSafe.x,y:p.lastSafe.y-30,vx:(Math.random()-0.5)*300,vy:-300-Math.random()*200,t:0});
      this.rings=0; p.x=p.lastSafe.x; p.y=p.lastSafe.y-30; p.vx=0; p.vy=0; p.invuln=2; p.loop=null;
    } else {
      this.lives--;
      if(this.lives<0){ this.state="over"; AudioSys.die(); }
      else { p.x=p.respawn.x; p.y=p.respawn.y-20; p.vx=0; p.vy=0; p.invuln=2; p.loop=null; this.flash("TRY AGAIN!"); }
    }
  },
  // ---- update ----
  last:0,
  frame(t){
    requestAnimationFrame(tt=>this.frame(tt));
    const dt=Math.min(0.1,(t-this.last)/1000||0.016); this.last=t;
    this.accumulator=(this.accumulator||0)+dt;
    while(this.accumulator>=1/120){
      if(this.state==="play") this.update(1/120);
      this.input.jumpPressed=false;
      this.accumulator-=1/120;
    }
    this.render(dt);
  },
  update(dt){
    this.time+=dt;
    const p=Player, E=this.ent;
    // movers
    for(const m of this.movers){
      const prev=m.x;
      m.t+=dt; const ph=(m.t % m.period)/m.period;
      m.x=m.x1+(m.x2-m.x1)*(0.5-0.5*Math.cos(ph*Math.PI*2));
      m.dx=(m.x-prev)/dt;
    }
    const prevX=p.x, prevY=p.y;
    p.update(dt,this.input,this);
    E.update(dt,this);
    if(p.dead){ if(p.deadT<=0){ this.lives--; if(this.lives<0){this.state="over";} else { this.softReset(); } } return; }
    const px=p.x, py=p.y;
    const overlap=(x,y,w,h)=> Math.abs(px-x)<(w+p.w)/2 && Math.abs(py-y)<(h+p.h)/2;

    // rings
    for(const r of Level.rings){
      if(r.taken) continue;
      const dx=px-prevX, dy=py-prevY, length=dx*dx+dy*dy;
      const t=length?Math.max(0,Math.min(1,((r.x-prevX)*dx+(r.y-prevY)*dy)/length)):0;
      const rx=Math.abs(r.x-(prevX+dx*t)), ry=Math.abs(r.y-(prevY+dy*t));
      if(rx<p.w/2+10 && ry<p.h/2+10){ r.taken=true; this.rings++; this.score+=100; AudioSys.ring();
        E.burst(r.x,r.y,3,90,["#ffe14d","#fff"]); }
    }
    // scattered rings recollect
    for(const r of E.scatter){
      if(r.t<=0.4) continue;
      if(Math.hypot(r.x-px,r.y-py)<26 && p.invuln<=1.2){ r.t=99; this.rings++; this.score+=50; AudioSys.ring(); }
    }
    // springs
    for(const s of E.springs){
      if(s.anim<=0 && Math.abs(s.x-px)<34 && Math.abs((s.y-6)-py)<44){
        const n=Math.hypot(s.dx,s.dy);
        p.vx=Math.abs(s.dx)<0.3?p.vx+s.dx/n*s.power:s.dx/n*Math.max(s.power,Math.abs(p.vx)); p.vy=s.dy/n*s.power;
        p.grounded=false; p.rolling=false; p.jumped=true; p.jumpCutDone=true; p.coyote=0; p.loop=null;
        s.anim=1; AudioSys.spring(); E.burst(s.x,s.y-10,8,200,["#ff5b5b","#ffe14d"]);
      }
    }
    // spikes
    for(const s of E.spikes){
      if(px>s.x-6&&px<s.x+s.w+6){
        const g=s.y;
        if(Math.abs((py+p.h/2)-g)<22){ if(p.hurt(this,px+10)) this.flash("OUCH!"); }
      }
    }
    // boxes
    for(const b of E.boxes){
      if(b.used) continue;
      if(overlap(b.x,b.y,40,40)){
        const spinning=p.rolling||!p.grounded;
        if(spinning||p.speed>200){
          b.used=true; b.bump=1; AudioSys.item(); AudioSys.breakBox();
          E.burst(b.x,b.y,12,220,["#c98a4b","#ffe14d","#fff"]);
          if(b.kind==="rings"){ this.rings+=10; this.score+=500; this.flash("+10 RINGS"); }
          if(b.kind==="shield"){ p.shield=true; this.flash("SHIELD!"); }
          if(b.kind==="speed"){ p.boostT=8; AudioSys.tempoScale=1.35; AudioSys.boost(); this.flash("SPEED UP!"); }
          if(b.kind==="life"){ this.lives++; this.score+=1000; this.flash("EXTRA LIFE!"); }
          if(!p.grounded) p.vy=Math.min(p.vy,-260);
        }
      }
    }
    // checkpoints
    for(const c of E.checkpoints){
      if(!c.active && px>=c.x){ c.active=true; p.respawn={x:c.x,y:c.y-40}; AudioSys.checkpoint(); this.flash("CHECKPOINT!"); E.burst(c.x,c.y-60,10,180,["#2de2ff","#ffe14d"]); }
    }
    // enemies: stomp/roll kills vs damage
    for(const e of E.enemies){
      if(!e.alive) continue;
      if(Math.abs(e.x-px)>60||Math.abs(e.y-py)>70) continue;
      if(overlap(e.x,e.y,e.w,e.h)){
        const dangerous = !p.isBall;
        if(p.invuln>0 && dangerous){ continue; }
        if(p.isBall){
          e.alive=false; this.score+=200; AudioSys.stomp();
          E.burst(e.x,e.y,12,220,["#9aa3b2","#ff5b5b","#ffe14d"]);
          if(!p.grounded && p.vy>0){ p.vy=-560; } // bounce
          else { p.vx=Math.sign(p.vx)*Math.min(740,Math.abs(p.vx)*1.05); }
        } else {
          if(p.hurt(this,e.x)) this.flash("OUCH!");
        }
      }
    }
    // projectiles
    for(const s of E.projectiles){
      if(s.life>0 && Math.hypot(s.x-px,s.y-py)<24){
        s.life=0;
        if(p.isBall){ E.burst(s.x,s.y,4,90,["#fff","#ffe14d"]); }
        else if(p.hurt(this,s.x)) this.flash("OUCH!");
      }
    }
    // finish
    if(px>=Level.FINISH_X && !p.win){
      p.win=true; this.state="win"; this.winT=0;
      const timeBonus=Math.max(0,Math.round(120000-this.time*900));
      const ringBonus=this.rings*200;
      this.score+=timeBonus+ringBonus; this._tb=timeBonus; this._rb=ringBonus;
      AudioSys.win();
    }
    // camera
    const look = Math.max(-140,Math.min(160,p.vx*0.32));
    const tx = Math.max(0,Math.min(Level.W-960, px-380+look));
    this.cam.x += (tx-this.cam.x)*Math.min(1,6*dt);
    const ty = Math.max(-40,Math.min(200, py-300));
    this.cam.y += (ty-this.cam.y)*Math.min(1,4*dt);
    if(this.msgT>0) this.msgT-=dt;
  },

  // ================= RENDER =================
  render(dt){
    const p=Player, cx=this.cam.x, cy=this.cam.y;
    // sky
    const g=ctx.createLinearGradient(0,0,0,540);
    g.addColorStop(0,"#3fa9f5"); g.addColorStop(0.6,"#7fd4ff"); g.addColorStop(0.75,"#bfeaff"); g.addColorStop(1,"#8fd694");
    ctx.fillStyle=g; ctx.fillRect(0,0,960,540);
    this.parallax(cx,cy,dt);
    // world transform
    ctx.save(); ctx.translate(-Math.round(cx),-Math.round(cy));
    this.drawDecor(cx);
    this.drawWater(cx);
    this.drawTerrain(cx);
    this.drawLoops();
    this.drawTunnel();
    this.drawPlats();
    this.drawCheckpoints();
    this.drawSprings();
    this.drawSpikes();
    this.drawBoxes();
    this.drawRings();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawScatter();
    this.drawParticles();
    if(this.state!=="over") this.drawPlayer();
    this.drawFinish();
    ctx.restore();
    this.drawHUD();
    if(this.state==="title") this.drawTitle();
    if(this.state==="pause") this.centerBox("PAUSED","Press ESC to resume");
    if(this.state==="over") this.centerBox("GAME OVER","Press ENTER to retry");
    if(this.state==="win") this.drawWin();
    if(this.msgT>0&&this.state==="play"){ ctx.fillStyle="#fff"; ctx.font="bold 20px monospace"; ctx.textAlign="center"; ctx.strokeStyle="#000"; ctx.lineWidth=4; const m=this.msg; ctx.strokeText(m,480,120); ctx.fillText(m,480,120); }
  },
  parallax(cx,cy){
    // sun
    ctx.fillStyle="#fff6c9"; ctx.fillRect(790-cx*0.02,50-cy*0.02,64,64);
    ctx.fillStyle="#ffe14d"; ctx.fillRect(798-cx*0.02,58-cy*0.02,48,48);
    // clouds L1
    ctx.fillStyle="#ffffff";
    for(let i=0;i<14;i++){ const x=((i*480+120)%2200)- (cx*0.1%2200); const y=40+(i*67)%140 - cy*0.05; const w=60+(i*37)%70;
      ctx.fillRect(x,y,w,14); ctx.fillRect(x+10,y-8,w-30,10); }
    // mountains L2
    ctx.fillStyle="#5b7fd6";
    for(let i=0;i<10;i++){ const x=i*700-cx*0.25; const bx=x%7000; const h=120+((i*53)%60);
      ctx.beginPath(); ctx.moveTo(bx,330-cy*0.2); ctx.lineTo(bx+180,330-h-cy*0.2); ctx.lineTo(bx+360,330-cy*0.2); ctx.fill(); }
    ctx.fillStyle="#7b93e0";
    for(let i=0;i<10;i++){ const x=i*700+300-cx*0.25; const bx=x%7000; const h=90+((i*31)%50);
      ctx.beginPath(); ctx.moveTo(bx,340-cy*0.2); ctx.lineTo(bx+180,340-h-cy*0.2); ctx.lineTo(bx+360,340-cy*0.2); ctx.fill(); }
    // ocean + islands L3
    ctx.fillStyle="#2b7fd6"; ctx.fillRect(0,330-cy*0.3,960,60);
    ctx.fillStyle="#7fd4ff"; ctx.fillRect(0,330-cy*0.3,960,6);
    ctx.fillStyle="#3fae5a";
    for(let i=0;i<6;i++){ const x=((i*1500+400)-cx*0.4)%9000; ctx.fillRect(x,318-cy*0.3,180,14); ctx.fillRect(x+70,290-cy*0.3,40,30); }
    // near palms silhouettes L4
    ctx.fillStyle="#2e8b4f";
    for(let i=0;i<12;i++){ const x=((i*900+200)-cx*0.65)%11000; const y=400-cy*0.5;
      ctx.fillRect(x,y-70,10,70); ctx.fillRect(x-30,y-80,70,12); }
  },
  drawWater(cx){
    ctx.fillStyle="#2b9fe0";
    for(const gp of Level.GAPS){
      const wl=472;
      ctx.fillRect(gp.x1,wl,gp.x2-gp.x1,220);
      ctx.fillStyle="#7fd4ff";
      const off=Math.floor(performance.now()/200)%2;
      for(let x=gp.x1;x<gp.x2;x+=24) ctx.fillRect(x+((off*8)),wl+4+((x/24)%2)*8,12,3);
      ctx.fillStyle="#2b9fe0";
    }
  },
  drawTerrain(cx){
    const start=Math.max(0,Math.floor(cx/32)*32-32), end=Math.min(Level.W,cx+1000);
    for(let x=start;x<end;x+=8){
      if(!Level.hasGround(x+4)) continue;
      const y=Math.round(Level.groundY(x+4));
      ctx.fillStyle="#a54f26"; ctx.fillRect(x,y,8,740-y);
      for(let row=Math.floor(y/32);row<24;row++){
        const top=Math.max(y+12,row*32), bottom=(row+1)*32;
        if(bottom<=top) continue;
        ctx.fillStyle=(Math.floor(x/32)+row)%2?"#bf6932":"#8b3e23";
        ctx.fillRect(x,top,8,bottom-top);
        ctx.fillStyle=(Math.floor(x/32)+row)%2?"#d57e3e":"#9b4a28";
        if(x%32===0) ctx.fillRect(x,top,2,bottom-top);
      }
      ctx.fillStyle="#653c24"; ctx.fillRect(x,y+10,8,8);
      ctx.fillStyle="#168648"; ctx.fillRect(x,y,8,12);
      ctx.fillStyle="#46cb43"; ctx.fillRect(x,y-2,8,8);
      ctx.fillStyle="#beef57"; ctx.fillRect(x,y-3,8,3);
      if(x%24===0){ctx.fillStyle="#46cb43"; ctx.fillRect(x,y+6,4,10);}
    }
  },
  drawLoops(){
    for(const L of Level.LOOPS){
      const gy=Level.groundY(L.x), cy=gy-L.R;
      ctx.lineWidth=16; ctx.strokeStyle="#b06a32";
      ctx.beginPath(); ctx.arc(L.x,cy,L.R,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth=8; ctx.strokeStyle="#37c24a";
      ctx.beginPath(); ctx.arc(L.x,cy,L.R,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth=3; ctx.strokeStyle="#7dff6a";
      ctx.beginPath(); ctx.arc(L.x,cy,L.R-4,0,Math.PI*2); ctx.stroke();
    }
  },
  drawTunnel(){
    for(const t of this.tunnels){
      const y1=t.ceil;
      ctx.fillStyle="#7a5230"; ctx.fillRect(t.x1,y1-26,t.x2-t.x1,30);
      ctx.fillStyle="#37c24a"; ctx.fillRect(t.x1,y1+2,t.x2-t.x1,6);
      ctx.fillStyle="#4a3018";
      for(let x=t.x1;x<t.x2;x+=40) ctx.fillRect(x,y1-26,6,30);
    }
  },
  drawPlats(){
    const drawOne=(x,y,w,mover)=>{
      ctx.fillStyle=mover?"#e8b93d":"#a5672f"; ctx.fillRect(x,y,w,14);
      ctx.fillStyle="#37c24a"; ctx.fillRect(x,y-4,w,6);
      ctx.fillStyle="#5b3413";
      for(let i=0;i<w;i+=24) ctx.fillRect(x+i,y+4,4,10);
      if(mover){ ctx.fillStyle="#222"; for(let i=0;i<w;i+=24) ctx.fillRect(x+i,y+6,12,4); }
    };
    for(const pl of Level.PLATS) drawOne(pl.x,pl.y,pl.w,false);
    for(const m of this.movers) drawOne(m.x,m.y,m.w,true);
    for(const c of this.ent.crumble){
      if(c.state===2) continue;
      const wob = c.state===1? Math.sin(performance.now()/30)*2:0;
      ctx.fillStyle=c.state===1?"#d98a4b":"#a5672f";
      ctx.fillRect(c.x,c.y+wob,c.w,12);
      ctx.fillStyle="#37c24a"; ctx.fillRect(c.x,c.y-4+wob,c.w,6);
      ctx.fillStyle="#3a2410";
      for(let x=c.x+6;x<c.x+c.w;x+=22) ctx.fillRect(x,c.y+2+wob,3,8);
    }
  },
  drawCheckpoints(){
    for(const c of this.ent.checkpoints){
      ctx.fillStyle="#555"; ctx.fillRect(c.x-3,c.y-90,6,90);
      ctx.fillStyle=c.active?"#ffe14d":"#9aa3b2";
      const wv=c.active?Math.sin(performance.now()/150)*3:0;
      ctx.fillRect(c.x,c.y-86+wv,34,22);
      ctx.fillStyle="#000"; ctx.font="10px monospace"; ctx.fillText(c.active?"GO!":"CK",c.x+6,c.y-70+wv);
    }
  },
  drawSprings(){
    for(const s of this.ent.springs){
      const comp=s.anim>0?8:0;
      ctx.fillStyle="#666"; ctx.fillRect(s.x-14,s.y-6,28,20);
      ctx.fillStyle="#e33"; ctx.fillRect(s.x-14,s.y-12-comp,28,8);
      ctx.fillStyle="#fff"; ctx.fillRect(s.x-14,s.y-12-comp,28,3);
      ctx.fillStyle="#999";
      for(let i=0;i<3;i++) ctx.fillRect(s.x-8,s.y-8+i*5-comp*0.3,16,2);
    }
  },
  drawSpikes(){
    for(const s of this.ent.spikes){
      const n=Math.max(2,Math.round(s.w/14));
      for(let i=0;i<n;i++){ const x=s.x+i*(s.w/n);
        ctx.fillStyle="#e5f4ff"; ctx.beginPath();ctx.moveTo(x,s.y);ctx.lineTo(x+s.w/n/2,s.y-22);ctx.lineTo(x+s.w/n-2,s.y);ctx.fill();
        ctx.fillStyle="#5a6572"; ctx.fillRect(x,s.y-6,s.w/n-2,6);
      }
    }
  },
  drawBoxes(){
    for(const b of this.ent.boxes){
      if(b.used){ ctx.fillStyle="#5a4128"; ctx.fillRect(b.x-15,b.y-15+b.bump*6,30,6); continue; }
      const bob=Math.sin(performance.now()/400+b.x)*2;
      ctx.fillStyle="#c98a4b"; ctx.fillRect(b.x-16,b.y-16+bob,32,32);
      ctx.fillStyle="#8a5a24"; ctx.fillRect(b.x-16,b.y-16+bob,32,5); ctx.fillRect(b.x-16,b.y+11+bob,32,5);
      ctx.fillStyle="#ffe14d"; ctx.font="bold 14px monospace"; ctx.textAlign="center";
      const ch=b.kind==="rings"?"O":b.kind==="shield"?"S":b.kind==="speed"?"»":"1";
      ctx.fillText(ch,b.x,b.y+5+bob);
      ctx.fillStyle="#fff"; ctx.fillRect(b.x-16,b.y-16+bob,32,2);
    }
  },
  drawRing(x,y,phase=0){
    // Transparent centre: an actual golden hoop, never a filled coin.
    const w= Math.max(3,Math.abs(Math.cos(performance.now()/280+phase))*9);
    ctx.save(); ctx.translate(Math.round(x),Math.round(y));
    ctx.strokeStyle="#855000"; ctx.lineWidth=5;
    ctx.beginPath(); ctx.ellipse(0,0,w,11,0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle="#ffd633"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(0,-1,w,10,0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle="#fff6af"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(0,-1,w,10,0,Math.PI,Math.PI*1.7); ctx.stroke();
    ctx.restore();
  },
  drawRings(){
    for(const r of Level.rings){
      if(!r.taken && Math.abs(r.x-this.cam.x-480)<560) this.drawRing(r.x,r.y,r.x*0.002);
    }
  },
  drawEnemies(){
    for(const e of this.ent.enemies){
      if(!e.alive) continue;
      if(Math.abs(e.x-this.cam.x-480)>560) continue;
      const f=Math.sin(e.anim*2)>0;
      if(e.type==="walker"){
        ctx.fillStyle="#c33"; ctx.fillRect(e.x-15,e.y-12,30,24);
        ctx.fillStyle="#eee"; ctx.fillRect(e.x+(e.dir>0?2:-10),e.y-8,8,8);
        ctx.fillStyle="#222"; ctx.fillRect(e.x+(e.dir>0?4:-8),e.y-6,4,4);
        ctx.fillStyle="#555"; const lo=f?0:3; ctx.fillRect(e.x-12,e.y+10-lo,8,4); ctx.fillRect(e.x+4,e.y+10-(3-lo),8,4);
      } else if(e.type==="flyer"){
        const flap=f?-6:6;
        ctx.fillStyle="#888"; ctx.fillRect(e.x-20,e.y-8+flap,14,4); ctx.fillRect(e.x+6,e.y-8-flap,14,4);
        ctx.fillStyle="#4ad"; ctx.fillRect(e.x-10,e.y-8,20,16);
        ctx.fillStyle="#fff"; ctx.fillRect(e.x-2,e.y-4,8,6);
      } else if(e.type==="crab"){
        ctx.fillStyle="#d63"; ctx.fillRect(e.x-17,e.y-10,34,20);
        ctx.fillStyle="#fff"; ctx.fillRect(e.x-10,e.y-16,8,8); ctx.fillRect(e.x+2,e.y-16,8,8);
        ctx.fillStyle="#222"; ctx.fillRect(e.x-8,e.y-14,4,4); ctx.fillRect(e.x+4,e.y-14,4,4);
        ctx.fillStyle="#922"; ctx.fillRect(e.x+(e.dir>0?12:-18),e.y-4,8,6);
      } else if(e.type==="wasp"){
        ctx.fillStyle="#ec3"; ctx.fillRect(e.x-11,e.y-10,22,20);
        ctx.fillStyle="#222"; ctx.fillRect(e.x-11,e.y-4,22,4); ctx.fillRect(e.x-11,e.y+3,22,4);
        ctx.fillStyle="#cfc"; const w2=f?4:-4; ctx.fillRect(e.x-16,e.y-16+w2,10,8); ctx.fillRect(e.x+6,e.y-16-w2,10,8);
      }
    }
  },
  drawProjectiles(){
    ctx.fillStyle="#ff5b5b";
    for(const s of this.ent.projectiles){ ctx.fillRect(s.x-4,s.y-4,8,8); ctx.fillStyle="#fff"; ctx.fillRect(s.x-2,s.y-2,4,4); ctx.fillStyle="#ff5b5b"; }
  },
  drawScatter(){
    for(const r of this.ent.scatter){
      if(r.t>5) { ctx.globalAlpha=Math.max(0,1-(r.t-5)); }
      this.drawRing(r.x,r.y);
      ctx.globalAlpha=1;
    }
  },
  drawParticles(){
    for(const q of this.ent.particles){
      ctx.globalAlpha=Math.max(0,1-q.t/q.life);
      ctx.fillStyle=q.color; ctx.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);
    }
    ctx.globalAlpha=1;
  },
  px(x){ return Math.round(x); },
  drawPlayer(){
    const p=Player;
    if(p.invuln>0 && Math.floor(performance.now()/80)%2===0 && !p.dead) return;
    ctx.save(); ctx.translate(Math.round(p.x),Math.round(p.y));
    if(p.grounded){ ctx.fillStyle="rgba(12,44,57,.2)"; ctx.beginPath(); ctx.ellipse(0,p.h/2,19,4,0,0,Math.PI*2); ctx.fill(); }
    if(p.shield){ctx.strokeStyle="#a0ffff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,32,0,Math.PI*2);ctx.stroke();}
    const poly=(color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
    if(p.isBall){
      ctx.rotate(p.ballSpin);
      poly("#123289",[[-16,-6],[-10,-15],[0,-17],[12,-13],[17,-4],[14,10],[4,16],[-10,13],[-17,4]]);
      poly("#2260e8",[[-13,-8],[0,-14],[12,-9],[8,0],[13,7],[2,13],[-9,9],[-4,1]]);
      poly("#59b0ff",[[-12,-5],[-4,-12],[7,-10],[0,-6],[-4,4],[-10,7]]);
      poly("#effaff",[[4,-12],[11,-9],[14,-2],[9,0]]);
      poly("#ef4545",[[1,8],[9,5],[11,9],[4,13],[-3,12]]);
    } else {
      ctx.rotate(p.rotation); ctx.scale(p.facing,1);
      const speed=Math.abs(p.vx), step=speed<15?0:Math.sin(p.ballSpin*2)*9;
      ctx.translate(0,p.crouch?10:0); if(p.crouch) ctx.scale(1,.65);
      // Blend into the classic circular running animation before cruising speed.
      const spinRun=p.grounded && !p.crouch && !p.lookUp && p.skidT<=0
        ? Math.max(0,Math.min(1,(speed-300)/90)) : 0;
      ctx.save(); ctx.globalAlpha=1-spinRun;
      // Feet meet the collision surface. Shoe motion is driven by distance/speed.
      for(const side of [-1,1]){
        const foot=side*step, y=17-Math.max(0,side*step)*.55;
        poly("#174bc2",[[side*4,0],[side*5+foot,y-3],[side*5+foot+4,y],[side*4+5,0]]);
        poly("#8d203e",[[foot-9,y-3],[foot+3,y-4],[foot+12,y+1],[foot+12,y+5],[foot-9,y+5]]);
        ctx.fillStyle="#f44848";ctx.fillRect(foot-8,y-3,13,5);
        ctx.fillStyle="#fff4de";ctx.fillRect(foot-1,y-3,4,6);ctx.fillRect(foot-9,y+4,21,2);
      }
      ctx.restore();
      if(spinRun>0){
        ctx.save(); ctx.globalAlpha=spinRun; ctx.translate(0,10);
        // Two shoes chase each other around a readable red-and-white wheel.
        ctx.strokeStyle="#a62d42"; ctx.lineWidth=5;
        ctx.beginPath(); ctx.ellipse(0,0,17,10,0,0,Math.PI*2); ctx.stroke();
        const phase=p.ballSpin*1.7;
        for(let i=0;i<4;i++){
          const angle=phase+i*Math.PI/2;
          ctx.strokeStyle=i%2?"#fff4de":"#ff5550"; ctx.lineWidth=i%2?3:5;
          ctx.beginPath(); ctx.ellipse(0,0,17,10,0,angle,angle+1.0); ctx.stroke();
        }
        for(const side of [0,Math.PI]){
          const angle=phase+side, x=Math.cos(angle)*15, y=Math.sin(angle)*9;
          ctx.save(); ctx.translate(x,y); ctx.rotate(angle+Math.PI/2);
          ctx.fillStyle="#f44848";ctx.fillRect(-6,-3,12,6);
          ctx.fillStyle="#fff4de";ctx.fillRect(-1,-3,3,6);ctx.fillRect(-6,3,12,2);
          ctx.restore();
        }
        ctx.restore();
      }
      poly("#123289",[[-10,-15],[6,-16],[12,-6],[9,6],[-7,7],[-13,-3]]);
      poly("#2769ec",[[-9,-15],[5,-14],[8,-3],[4,4],[-7,3]]);
      poly("#f3c394",[[0,-12],[7,-9],[8,0],[3,4],[-1,0]]);
      // Swept blue quills, ears and a readable face.
      poly("#123289",[[-5,-30],[-20,-26],[-14,-21],[-25,-16],[-17,-12],[-23,-5],[-11,-6],[-8,0],[1,-13],[15,-17],[16,-26],[9,-33],[2,-37],[-1,-29],[-10,-36]]);
      poly("#2769ec",[[-7,-29],[-17,-26],[-10,-22],[-21,-17],[-11,-15],[-18,-8],[-6,-11],[3,-17],[13,-20],[12,-28],[6,-31]]);
      poly("#58a5ff",[[-10,-27],[-3,-31],[6,-30],[10,-27],[0,-27],[-6,-23]]);
      poly("#f3c394",[[-8,-33],[-6,-27],[-2,-28]]);
      poly("#f3c394",[[3,-20],[12,-22],[18,-18],[15,-12],[5,-11],[0,-15]]);
      poly("#f4fcff",[[1,-27],[7,-28],[11,-25],[12,-20],[3,-18],[0,-21]]);
      ctx.fillStyle="#163347";ctx.fillRect(7,p.lookUp?-27:-24,3,6);ctx.fillRect(15,-20,5,4);
      ctx.fillStyle="#8d533e";ctx.fillRect(8,-14,6,1);
      const arm=p.skidT>0?-7:-step*.4;
      poly("#ecc095",[[-7,-11],[-13,-8],[-14+arm,1],[-10+arm,3],[-8,-6]]);
      ctx.fillStyle="#b9dce9";ctx.fillRect(-17+arm,-1,10,8);ctx.fillStyle="#fff";ctx.fillRect(-17+arm,-2,8,6);
    }
    ctx.restore();
    if(p.speed>550){ctx.fillStyle="rgba(232,255,255,.5)";for(let i=0;i<3;i++)ctx.fillRect(p.x-p.facing*(32+i*17),p.y-7+i*9,15,2);}
  },
  drawFinish(){
    const fx=Level.FINISH_X, gy=Level.groundY(fx);
    ctx.fillStyle="#8a5a24"; ctx.fillRect(fx,gy-190,12,190);
    const wv=Math.sin(performance.now()/250)*2;
    for(let i=0;i<5;i++) for(let j=0;j<3;j++){ ctx.fillStyle=(i+j)%2?"#222":"#fff"; ctx.fillRect(fx+12+j*16,gy-190+wv+i*16,16,16); }
    ctx.fillStyle="#ffe14d"; ctx.font="bold 14px monospace"; ctx.textAlign="center"; ctx.fillText("GOAL",fx+36,gy-200+wv);
  },
  drawDecor(){
    for(let x=240;x<Level.W;x+=530){
      if(!Level.hasGround(x)||Math.abs(x-this.cam.x-480)>620) continue;
      const y=Level.groundY(x), top=y-108;
      for(let j=0;j<13;j++){
        ctx.fillStyle=j%2?"#be843e":"#865131";ctx.fillRect(x+j*.7,y-j*8-8,11,8);
        ctx.fillStyle="#dfac58";ctx.fillRect(x+j*.7,y-j*8-8,3,7);
      }
      for(const side of [-1,1]) for(let leaf=0;leaf<3;leaf++){
        ctx.strokeStyle=leaf%2?"#137a4a":"#279943";ctx.lineWidth=9;
        ctx.beginPath();ctx.moveTo(x+10,top);ctx.lineTo(x+10+side*(25+leaf*9),top-24+leaf*14);ctx.lineTo(x+10+side*(42+leaf*10),top-8+leaf*18);ctx.stroke();
        ctx.strokeStyle="#88d952";ctx.lineWidth=2;ctx.stroke();
      }
      ctx.fillStyle="#855031";ctx.fillRect(x+4,top,9,9);ctx.fillRect(x+14,top-3,8,8);
      for(let f=0;f<3;f++){
        const fx=x+90+f*22, fy=Level.groundY(fx);
        ctx.fillStyle="#228549";ctx.fillRect(fx,fy-19,3,19);
        ctx.fillStyle=f%2?"#fff0b0":"#f285b9";ctx.fillRect(fx-4,fy-24,11,5);ctx.fillRect(fx-1,fy-27,5,11);
        ctx.fillStyle="#ffe04b";ctx.fillRect(fx-1,fy-23,5,4);
      }
    }
    // Trail signs introduce the next movement before an obstacle appears.
    for(const [x,label] of [[460,"BUILD SPEED →"],[1770,"↓ ROLL"],[2720,"LOOP AHEAD →"],[3660,"SPACE • HIGH ROUTE"],[8140,"JUMP →"],[10500,"JUMP →"],[12700,"JUMP →"]]){
      if(Math.abs(x-this.cam.x-480)>600)continue;
      const y=Level.groundY(x);ctx.fillStyle="#795331";ctx.fillRect(x,y-70,5,70);
      ctx.fillStyle="#143d50";ctx.fillRect(x-12,y-87,155,28);ctx.fillStyle="#d9f6bd";ctx.font="bold 12px monospace";ctx.textAlign="left";ctx.fillText(label,x-5,y-69);
    }
  },
  drawHUD(){
    ctx.fillStyle="rgba(0,0,0,0.55)"; ctx.fillRect(8,8,290,64);
    ctx.fillStyle="#ffe14d"; ctx.font="bold 15px monospace"; ctx.textAlign="left";
    const t=Math.floor(this.time);
    ctx.fillText("RINGS "+String(this.rings).padStart(3,"0"),16,28);
    ctx.fillStyle="#fff"; ctx.fillText("SCORE "+String(this.score).padStart(6,"0"),16,46);
    ctx.fillStyle="#7dff6a"; ctx.fillText("TIME "+Math.floor(t/60)+":"+String(t%60).padStart(2,"0")+"  LIVES "+this.lives,16,63);
    if(Player.boostT>0){ ctx.fillStyle="#ff9b3d"; ctx.fillText("SPEED!",310,30); }
    if(Player.shield){ ctx.fillStyle="#2de2ff"; ctx.fillText("SHIELD",310,48); }
  },
  centerBox(a,b){
    ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(230,170,500,180);
    ctx.strokeStyle="#2de2ff"; ctx.lineWidth=3; ctx.strokeRect(230,170,500,180);
    ctx.textAlign="center"; ctx.fillStyle="#ffe14d"; ctx.font="bold 34px monospace"; ctx.fillText(a,480,240);
    ctx.fillStyle="#fff"; ctx.font="15px monospace"; ctx.fillText(b,480,275);
  },
  drawTitle(){
    ctx.fillStyle="rgba(0,0,20,0.72)"; ctx.fillRect(0,0,960,540);
    ctx.textAlign="center";
    ctx.fillStyle="#ffe14d"; ctx.font="bold 64px monospace";
    ctx.fillText("TURBO SPIKE",480,170);
    ctx.fillStyle="#2de2ff"; ctx.font="bold 20px monospace";
    ctx.fillText("A 16-BIT MOMENTUM PLATFORMER",480,210);
    ctx.fillStyle="#fff"; ctx.font="15px monospace";
    ctx.fillText("Keep running to build speed and curl into a spinning ball.",480,265);
    ctx.fillText("SPACE jumps and adds speed on takeoff. Hold for a higher jump.",480,288);
    ctx.fillText("Hit loops FAST or you will fall. Rings protect you.",480,311);
    ctx.fillStyle="#7dff6a"; ctx.font="bold 20px monospace";
    if(((performance.now()/500)|0)%2===0) ctx.fillText("ENTER / CLICK TO START",480,370);
    ctx.fillStyle="#9fe8ff"; ctx.font="13px monospace";
    ctx.fillText("3 routes: LOW (danger) / MAIN (easy) / HIGH (fast, needs speed)",480,410);
  },
  drawWin(){
    this.winT=(this.winT||0)+0.016;
    ctx.fillStyle="rgba(0,0,20,0.75)"; ctx.fillRect(0,0,960,540);
    ctx.textAlign="center";
    ctx.fillStyle="#ffe14d"; ctx.font="bold 44px monospace"; ctx.fillText("LEVEL COMPLETE!",480,170);
    ctx.fillStyle="#fff"; ctx.font="bold 20px monospace";
    const t=Math.floor(this.time);
    ctx.fillText("TIME  "+Math.floor(t/60)+":"+String(t%60).padStart(2,"0"),480,230);
    ctx.fillText("TIME BONUS   "+this._tb,480,265);
    ctx.fillText("RING BONUS   "+this._rb+"  ("+this.rings+" rings)",480,295);
    ctx.fillStyle="#7dff6a"; ctx.fillText("TOTAL SCORE  "+this.score,480,330);
    ctx.fillStyle="#9fe8ff"; ctx.font="15px monospace";
    if(this.winT>1) ctx.fillText("Press ENTER to play again  (R to restart anytime)",480,380);
  }
};
window.Game=Game;
Game.init();
})();
