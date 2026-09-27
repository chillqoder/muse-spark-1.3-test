/* Momentum player: accel/friction/slopes/rolling/variable jump/loops. */
(function(){
"use strict";
const GRAV=2300, ACCEL=640, AIR_ACCEL=300, FRICTION=420, ROLL_FRICTION=55,
      BRAKE=1700, MAX_RUN=460, MAX_HARD=740, JUMP_V=700, LOOP_MIN=350, AUTO_ROLL_IN=560, AUTO_ROLL_OUT=400;

const Player = {
  x:120, y:200, vx:0, vy:0, w:26, h:46,
  grounded:false, groundAngle:0, rolling:false, autoRoll:false, runCharge:0, loop:null,
  facing:1, coyote:0, jumpBuf:0, jumpCutDone:false, jumped:false,
  invuln:0, shield:false, boostT:0, skidT:0, animT:0, ballSpin:0,
  lookUp:false, crouch:false, dead:false, deadT:0, win:false,
  rotation:0, respawn:{x:120,y:200}, lastSafe:{x:120,y:300}, runDust:0,

  reset(){
    Object.assign(this,{x:120,y:Level.groundY(120)-23,w:26,h:46,vx:0,vy:0,grounded:true,rolling:false,loop:null,
      loopLock:null,autoRoll:false,runCharge:0,ballSpin:0,wasGrounded:true,jumped:false,jumpCutDone:false,support:null,runDust:0,lookUp:false,crouch:false,
      facing:1,coyote:0,jumpBuf:0,invuln:0,shield:false,boostT:0,skidT:0,animT:0,
      dead:false,deadT:0,win:false,rotation:0,respawn:{x:120,y:Level.groundY(120)-40},lastSafe:{x:120,y:300}});
  },

  get speed(){ return Math.abs(this.vx); },
  get isBall(){ return this.rolling || !!this.loop || (!this.grounded && this.jumped); },

  get fastRoll(){ return this.speed>=AUTO_ROLL_IN || (this.autoRoll && this.speed>=AUTO_ROLL_OUT); },

  update(dt, input, game){
    if(this.win){ this.animT+=dt; this.vx*= (1-2*dt); this.x+=this.vx*dt; return; }
    if(this.dead){ this.deadT-=dt; this.vy+=GRAV*0.7*dt; this.y+=this.vy*dt; return; }
    const E = game.ent;
    this.animT+=dt;
    if(this.invuln>0) this.invuln-=dt;
    if(this.boostT>0){ this.boostT-=dt; if(this.boostT<=0) AudioSys.tempoScale=1; }
    const boostMul = this.boostT>0?1.25:1;

    // look up / crouch
    this.lookUp = input.up && this.grounded && this.speed<40 && !this.rolling;
    this.crouch = input.down && this.grounded && this.speed<40;

    // LOOP MODE
    if(this.loop){ this.updateLoop(dt,input,game); return; }
    if(this.loopLock && Math.abs(this.x-this.loopLock.x)>this.loopLock.R+65) this.loopLock=null;
    // try loop entry
    for(const L of Level.LOOPS){
      const gy = Level.groundY(L.x), cy = gy - L.R;
      if(this.loopLock!==L && this.grounded && Math.abs(this.x-L.x)<Math.max(10,this.speed*dt+2) && Math.abs((this.y+this.h/2)-(gy))<46){
        if(this.vx>LOOP_MIN){ this.h=28; this.loop={L,angle:Math.PI/2,vt:this.vx,total:0,cx:L.x,cy,R:L.R}; this.rolling=true; AudioSys.blip(200,0.4,"sawtooth",0.2,900); return; }
        if(this.vx<-LOOP_MIN){ this.h=28; this.loop={L,angle:Math.PI/2,vt:this.vx,total:0,cx:L.x,cy,R:L.R}; this.rolling=true; AudioSys.blip(200,0.4,"sawtooth",0.2,900); return; }
      }
    }

    const direction=Number(input.right)-Number(input.left);
    const pushing=direction!==0 && direction*this.vx>=0;
    if(pushing && this.speed>350) this.runCharge=Math.min(4,this.runCharge+dt);
    else this.runCharge=Math.max(0,this.runCharge-dt*2);
    const maxRun = Math.min(MAX_HARD,(MAX_RUN+Math.max(0,this.runCharge-1)*60)*boostMul);
    const slope = this.grounded && !this.support? Level.groundAngle(this.x):0;
    this.prevX=this.x; this.prevFeet=this.y+this.h/2; this.attached=this.grounded;
    this.groundAngle = slope;

    // --- horizontal ---
    const L = input.left?1:0, R = input.right?1:0;
    if(this.grounded){
      // Sustained running becomes a full attacking ball; hysteresis prevents flicker.
      const wasAuto=this.autoRoll;
      this.autoRoll=this.fastRoll && !(direction && direction*this.vx<0);
      if(this.autoRoll) this.rolling=true;
      else if(wasAuto && !input.down) this.rolling=false;
      // Manual rolling remains available at lower speeds.
      if(input.down && this.speed>130 && !this.crouch) { if(!this.rolling){this.rolling=true; AudioSys.blip(150,0.15,"square",0.15,90);} }
      else if(this.rolling && !this.autoRoll && (this.speed<70 || input.jumpPressed)) this.rolling=false;
      const feet=this.y+this.h/2;
      if(this.rolling) this.h=28; else this.h = this.crouch?32:46;
      this.y=feet-this.h/2;

      const steer = this.autoRoll?0.75:this.rolling?0.42:1;
      if(L&&!R){
        this.facing=-1;
        if(this.vx>0){ // braking
          this.vx-=BRAKE*steer*dt; this.skidT=0.25;
          if(this.skidT>0&&Math.abs(this.skidT-0.25)<dt*2) AudioSys.skid();
        } else this.vx-=ACCEL*steer*boostMul*dt;
      } else if(R&&!L){
        this.facing=1;
        if(this.vx<0){ this.vx+=BRAKE*steer*dt; this.skidT=0.25; AudioSys.skid(); }
        else this.vx+=ACCEL*steer*boostMul*dt;
      } else {
        // friction / inertia: keep momentum, decay slowly
        const fr = this.autoRoll?240:this.rolling?ROLL_FRICTION:FRICTION;
        if(Math.abs(this.vx)<=fr*dt) this.vx=0; else this.vx-=Math.sign(this.vx)*fr*dt;
      }
      // slope physics: gravity along slope (roller-coaster feel)
      const slopeAcc = 550*Math.sin(slope)*(this.rolling?1.65:0.7);
      this.vx+=slopeAcc*dt;
      // cap soft top speed (slopes/rolls can exceed)
      const cap = this.rolling&&!this.autoRoll?MAX_HARD:(maxRun+Math.min(65,Math.abs(slopeAcc)*0.18));
      if(this.vx>cap) this.vx=Math.max(cap,this.vx-900*dt);
      if(this.vx<-cap) this.vx=Math.min(-cap,this.vx+900*dt);
      if(this.skidT>0) this.skidT-=dt;
      // dust at speed
      if(this.speed>420){ this.runDust-=dt; if(this.runDust<=0){ this.runDust=0.06; E.burst(this.x-Math.sign(this.vx)*10,this.y+this.h/2,1,60,["#fff","#cfe9ff"]); } }
    } else {
      // air control (preserve momentum, weaker steering)
      if(L&&!R){ this.vx-=AIR_ACCEL*boostMul*dt; this.facing=-1; }
      if(R&&!L){ this.vx+=AIR_ACCEL*boostMul*dt; this.facing=1; }
      this.vx*= (1-0.06*dt);
      if(this.vx>MAX_HARD) this.vx=MAX_HARD; if(this.vx<-MAX_HARD) this.vx=-MAX_HARD;
    }

    // --- jumping (buffered + coyote + variable height) ---
    if(this.grounded) this.coyote=0.11; else this.coyote-=dt;
    if(input.jumpPressed) this.jumpBuf=0.13; else this.jumpBuf-=dt;
    if(this.jumpBuf>0 && (this.grounded||this.coyote>0)){
      // Reward a real takeoff while moving, once per jump (never mid-air key spam).
      if(this.speed>120 && (!direction || direction*this.vx>0)){
        this.vx=Math.sign(this.vx)*Math.min(MAX_HARD,this.speed+70);
        this.runCharge=Math.min(4,Math.max(this.runCharge,1+(this.speed-MAX_RUN)/60));
      }
      this.vy=-(JUMP_V+Math.min(160,this.speed*0.22));
      this.grounded=false; this.attached=false; this.coyote=0; this.jumpBuf=0; this.jumped=true; this.jumpCutDone=false;
      this.y+=(this.h-28)/2; this.h=28; this.rolling=true; this.autoRoll=this.fastRoll;
      AudioSys.jump();
      E.burst(this.x,this.y+this.h/2,5,120,["#fff"]);
      // jumping from loop-adjacent n/a
    }
    if(!input.jump && !this.jumpCutDone && !this.grounded && this.vy<-260){
      this.vy*=0.5; this.jumpCutDone=true; // short press = low jump
    }
    // unroll in air keeps ball; rolling flag persists for damage
    if(!this.grounded && this.jumped) this.rolling=true;

    // --- gravity ---
    this.vy+=GRAV*dt;
    if(this.vy>1250) this.vy=1250;

    // --- integrate ---
    this.x+=this.vx*dt;
    this.y+=this.vy*dt;
    if(this.x<20){this.x=20;this.vx=Math.max(0,this.vx);}
    if(this.x>Level.W-20){this.x=Level.W-20;this.vx=Math.min(0,this.vx);}

    // spinning visual speed
    this.ballSpin += dt*(4+this.speed*0.045);

    // --- ground collision: heightfield + platforms ---
    this.collideGround(game, dt);

    // rotation: lean with speed + tilt on slopes
    const targetRot = this.grounded? slope*0.7 + Math.sign(this.vx)*Math.min(0.18,this.speed*0.0002) : 0;
    if(!this.rolling) this.rotation += (targetRot-this.rotation)*Math.min(1,10*dt);
  },

  updateLoop(dt,input,game){
    const lp=this.loop, R=lp.R;
    // tangential gravity + tiny friction; rolling slope bonus
    const at = -420*Math.cos(lp.angle) - Math.sign(lp.vt)*28;
    lp.vt += at*dt;
    if(Math.abs(lp.vt)>MAX_HARD) lp.vt=Math.sign(lp.vt)*MAX_HARD;
    const dA = -(lp.vt/R)*dt;
    lp.angle += dA; lp.total += dA;
    this.ballSpin += dt*(6+Math.abs(lp.vt)*0.05);
    this.grounded=false;
    this.rotation = lp.angle - Math.PI/2;
    // position: feet on track, body toward center
    const sx = lp.cx+Math.cos(lp.angle)*R, sy = lp.cy+Math.sin(lp.angle)*R;
    const nx = -Math.cos(lp.angle), ny=-Math.sin(lp.angle); // toward center
    this.x = sx + nx*(this.h/2-4); this.y = sy + ny*(this.h/2-4) - 0;
    this.vx = Math.sin(lp.angle)*lp.vt; this.vy = -Math.cos(lp.angle)*lp.vt;
    // completed full circle?
    if(Math.abs(lp.total)>=Math.PI*2){
      const dir=Math.sign(lp.vt)||1;
      this.loopLock=lp.L; this.loop=null; this.grounded=true; this.autoRoll=Math.abs(lp.vt)>=AUTO_ROLL_IN || (this.autoRoll && Math.abs(lp.vt)>=AUTO_ROLL_OUT); this.rolling=!!input.down||this.autoRoll; this.h=this.rolling?28:46;
      this.x=lp.cx+dir*4; this.y=(lp.cy+R)-this.h/2-1;
      this.vx=Math.sign(lp.vt)*Math.min(MAX_HARD,Math.abs(lp.vt)*1.02); this.vy=0; this.rotation=0;
      game.ent.burst(this.x,this.y,8,200,["#ffe14d","#fff"]);
      return;
    }
    // fall off if too slow on upper 2/3
    if(Math.abs(lp.vt)<170 && Math.sin(lp.angle)<0.35){
      this.loopLock=lp.L; this.loop=null; this.grounded=false; this.rolling=true;
      // keep current cartesian velocity (already set)
      return;
    }
    // jump exits loop
    if(input.jumpPressed){
      this.loopLock=lp.L; this.loop=null; this.grounded=false;
      this.vy-=420; AudioSys.jump();
    }
  },

  collideGround(game, dt){
    const E=game.ent;
    this.grounded=false;
    const feetY=this.y+this.h/2, prevFeet=this.prevFeet;
    const oldSupport=this.support; this.support=null;
    // crumble removal
    let overHole=false;
    for(const c of E.crumble){ if(c.state===2 && this.x>c.x-8 && this.x<c.x+c.w+8){ overHole=true; break; } }
    // main heightfield
    if(!overHole && Level.hasGround(this.x)){
      const g=Level.groundY(this.x);
      const follows=this.attached && !oldSupport && Math.abs(g-Level.groundY(this.prevX))<36;
      const crosses=this.vy>=0 && prevFeet<=g+Math.max(8,Math.abs(this.vx*dt)*0.6) && feetY>=g;
      if(follows || crosses){
        if(this.jumped){this.autoRoll=this.fastRoll;this.rolling=this.autoRoll;this.h=this.rolling?28:46;}
        this.y=g-this.h/2; this.vy=0; this.grounded=true; this.jumped=false;
        if(!this.wasGrounded && game) {/* landing */}
        this.lastSafe={x:this.x,y:this.y};
      }
    }
    // static one-way platforms
    const landPlat=(top)=>{
      if(this.vy>=0 && prevFeet<=top+12 && feetY>=top){
        if(this.jumped){this.autoRoll=this.fastRoll;this.rolling=this.autoRoll;this.h=this.rolling?28:46;}
        this.y=top-this.h/2; this.vy=0; this.grounded=true; this.jumped=false; this.lastSafe={x:this.x,y:this.y}; this.support=true; return true;
      } return false;
    };
    for(const pl of Level.PLATS){
      if(this.x>pl.x-12 && this.x<pl.x+pl.w+12) landPlat(pl.y);
    }
    // movers (solid tops, carry)
    game.movers.forEach(m=>{
      if(this.x>m.x-14 && this.x<m.x+m.w+14){
        if(landPlat(m.y)){ this.x+=m.dx*dt; }
      }
    });
    // ceilings for tunnel: simple clamp
    for(const t of game.tunnels){
      if(this.x>t.x1&&this.x<t.x2){
        if(this.y-this.h/2 < t.ceil){ this.y=t.ceil+this.h/2; if(this.vy<0)this.vy=0; }
      }
    }
    this.wasGrounded=this.grounded;
    // fell into water/pit
    if(this.y>660){
      game.onPitFall();
    }
  },

  hurt(game, srcX){
    if(this.invuln>0||this.dead||this.win) return false;
    this.runCharge=0; this.autoRoll=false;
    if(this.shield){ this.shield=false; this.invuln=1.5; AudioSys.hurt(); game.ent.burst(this.x,this.y,10,220,["#2de2ff","#fff"]); return true; }
    if(game.rings>0){
      const n=Math.min(game.rings,14);
      for(let i=0;i<n;i++){
        const a=-Math.PI/2+(i/n-0.5)*2.4;
        game.ent.scatter.push({x:this.x,y:this.y-10,vx:Math.cos(a)*(140+Math.random()*160)+(this.vx*0.3),vy:Math.sin(a)*(260+Math.random()*160),t:0});
      }
      game.rings=0; game.score=Math.max(0,game.score-50);
      this.invuln=2; this.vy=-420; this.vx=(this.x<srcX?-1:1)*220; this.grounded=false; this.rolling=false;
      AudioSys.ringLoss(); AudioSys.hurt();
      return true;
    }
    this.die(game);
    return true;
  },
  die(game){
    if(this.dead) return;
    this.dead=true; this.deadT=1.4; this.vy=-650; this.vx=0;
    AudioSys.die();
    game.ent.burst(this.x,this.y,16,260,["#3b6cff","#fff","#ff5b5b"]);
  }
};
window.Player = Player;
})();
