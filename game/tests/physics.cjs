const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const noop=()=>{};
global.window=global;global.addEventListener=noop;global.requestAnimationFrame=noop;
global.document={getElementById:()=>({getContext:()=>({}),addEventListener:noop})};
global.AudioSys=new Proxy({},{get:(o,k)=>o[k]??noop});
for(const file of ['level','entities','player','game']) vm.runInThisContext(fs.readFileSync(`js/${file}.js`,'utf8'));
const input={left:false,right:true,up:false,down:false,jump:false,jumpPressed:false};
function reset(){Game.reset(true);Game.state='play';Object.assign(Game.input,input);}
function step(n){for(let i=0;i<n;i++){Game.update(1/120);Game.input.jumpPressed=false;}}
reset();step(150);
assert(Player.x>450 && Player.x<650,`readable run speed: ${Player.x}`);
assert(Game.rings>=3,`running must collect ground rings: ${Game.rings}`);
assert(Player.speed<510,`cruising too fast: ${Player.speed}`);
const first={x:Math.round(Player.x),rings:Game.rings,speed:Math.round(Player.speed)};
let loopSeen=false,loopExited=false,maxStep=0,prev=Player.x;
for(let i=0;i<1300 && Player.x<3500;i++){
 Game.update(1/120);maxStep=Math.max(maxStep,Math.abs(Player.x-prev));prev=Player.x;
 if(Player.loop)loopSeen=true;if(loopSeen&&!Player.loop&&Player.x>3120)loopExited=true;
}
assert(loopSeen,'main route should enter loop');assert(loopExited,'normal running should finish loop');assert(maxStep<35,`no loop teleport: ${maxStep}`);
const loop={x:Math.round(Player.x),rings:Game.rings,maxStep:Math.round(maxStep)};
reset();step(80);const vx=Player.vx;
Game.input.jump=true;Game.input.jumpPressed=true;step(1);
assert(!Player.grounded && Player.vy<0,'jump leaves ground');assert(Player.vx>=vx-5,'jump preserves momentum');
const initialY=Player.y;step(16);const heldVy=Player.vy;Game.input.jump=false;step(1);assert(Player.vy>heldVy,'release shortens jump');
reset();Player.x=1500;Player.y=Level.groundY(1500)-23;Player.vx=400;
for(let i=0;i<120;i++){Player.update(1/120,input,Game);assert(Player.grounded,'downhill stays attached');assert(Math.abs(Player.y+Player.h/2-Level.groundY(Player.x))<.01);}
reset();Object.assign(Player,{x:8550,y:357,vx:0,vy:0,grounded:true,support:true});
Game.movers=[{x:8500,y:380,w:100,dx:120}];Player.prevFeet=380;
Player.update(1/120,{...input,right:false},Game);assert(Math.abs(Player.x-8551)<.01,'platform carries distance, not velocity');
reset();Player.x=Level.FINISH_X;Player.y=Level.groundY(Player.x)-23;step(1);assert.equal(Game.state,'win');
reset();assert(!Player.win && Player.h===46 && Player.grounded,'restart restores full state');
console.log(JSON.stringify({opening:first,loop,checks:'rings, tempo, loop, jump, slopes, mover, finish, restart passed'},null,2));

// Isolate the new momentum rules on flat ground, independently of level slopes.
const terrain={groundY:Level.groundY,groundAngle:Level.groundAngle,hasGround:Level.hasGround,LOOPS:Level.LOOPS};
try {
 Level.groundY=()=>432;Level.groundAngle=()=>0;Level.hasGround=()=>true;Level.LOOPS=[];
 const tick=(controls,n=1)=>{for(let i=0;i<n;i++)Player.update(1/120,{...input,...controls,jumpPressed:i===0&&!!controls.jumpPressed},Game);};
 reset();tick({},540);
 assert(Player.rolling && Player.autoRoll && Player.h===28,'sustained run must become a full ball without DOWN');
 assert(Player.speed>=560 && Player.speed<=740,'auto roll uses bounded speed');
 const runSpeed=Player.speed;
 tick({right:false},210);
 assert(!Player.autoRoll && !Player.rolling && Player.h===46,'slowing down must leave ball mode');
 reset();tick({},100);const beforeJump=Player.speed;
 tick({jump:true,jumpPressed:true});
 assert(Player.speed>=beforeJump+65,'takeoff must add horizontal speed');
 const boosted=Player.speed;
 tick({jump:true,jumpPressed:true});
 assert(Player.speed< boosted+4,'airborne jump presses cannot repeatedly boost');
 for(let i=0;i<240&&!Player.grounded;i++)tick({jump:true});
 assert(Player.grounded && Player.rolling && Player.autoRoll,'fast landing keeps full ball form');
 assert(Player.speed>=boosted,'landing preserves the earned speed');
 tick({left:true,right:false},120);
 assert(Player.vx<100 && !Player.autoRoll,'opposite input brakes out of auto roll');
 reset();tick({right:false,jump:true,jumpPressed:true});
 assert.equal(Player.vx,0,'stationary jumping must not launch sideways');
 reset();Player.vx=-420;tick({left:true,right:false,jump:true,jumpPressed:true});
 assert(Player.vx<-485,'jump boost works in both directions');
 reset();Player.vx=725;tick({jump:true,jumpPressed:true});
 assert(Player.speed<=740,'jump boosts respect the hard speed limit');
 reset();assert.equal(Player.runCharge,0);assert.equal(Player.autoRoll,false);
 console.log(`Momentum checks passed: full auto roll at ${Math.round(runSpeed)} px/s, jump boost, airborne spam, landing, braking, both directions, speed cap, reset.`);
} finally {Object.assign(Level,terrain);}

function contactSetup(){
 reset();Game.rings=12;
 Object.assign(Player,{x:120,y:Level.groundY(120)-14,h:28,vx:600,rolling:true,autoRoll:true,runCharge:4});
 Game.ent.enemies=[{type:'walker',x:120,y:Level.groundY(120)-16,w:30,h:24,vx:0,dir:1,minX:100,maxX:140,alive:true,anim:0}];
}
contactSetup();step(1);
assert(!Game.ent.enemies[0].alive,'automatic ball destroys enemy on contact');
assert.equal(Game.rings,12,'ball contact does not lose rings');assert(!Player.dead && Player.invuln===0,'ball contact causes no damage');
contactSetup();Object.assign(Player,{vx:250,autoRoll:false});step(1);
assert(!Game.ent.enemies[0].alive && Game.rings===12,'manual rolling also defeats enemies');
contactSetup();Object.assign(Player,{grounded:false,jumped:true,vy:0});step(1);
assert(!Game.ent.enemies[0].alive && Game.rings===12,'jumping ball defeats enemies');
contactSetup();Game.ent.enemies=[];
Game.ent.projectiles=[{x:125,y:Player.y,vx:0,vy:0,life:3}];step(1);
assert.equal(Game.ent.projectiles[0].life,0,'ball destroys enemy projectile');assert.equal(Game.rings,12);
contactSetup();Object.assign(Player,{rolling:false,autoRoll:false,vx:0,h:46,y:Level.groundY(120)-23});step(1);
assert(Game.ent.enemies[0].alive && Game.rings===0,'ordinary running contact still causes damage');
console.log('Combat checks passed: auto ball, manual roll, jumping ball, projectile immunity, ordinary contact damage.');
