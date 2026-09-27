/* Level data: heightfield terrain, loops, routes, objects. Original geometry. */
(function(){
"use strict";
// Ground control points [x, y] — y grows downward. Smooth roller-coaster profile.
const PTS = [
  [0,432],[650,432],[1150,465],[1700,515],[2150,520],
  [2500,445],[2720,380],[2900,430],[3100,470],[3320,470],
  [3600,390],[3850,320],[4150,400],[4700,424],
  [5100,455],[5500,390],[5900,400],[6400,470],[6900,500],
  [7300,440],[7700,390],[8100,430],[8450,430],[8800,430],
  [9150,390],[9450,345],[9650,400],[9850,460],[10100,460],
  [10500,440],[10850,440],[11200,410],[11500,360],
  [11800,340],[12150,380],[12500,430],[12900,440],
  [13300,430],[13700,428],[14500,428]
];
// Gaps in main ground (pits / water). Player must use platforms or jump.
const GAPS = [
  {x1:8460, x2:8780},   // water + moving platforms
  {x1:10860, x2:11200}, // spike pit lower route w/ platforms above
  {x1:12960, x2:13120}  // late pit
];
const LOOP_R = 100;
const LOOPS = [
  {x:3100, R:LOOP_R},   // loop 1 after first downhill
  {x:9850, R:105}       // loop 2 / curved tunnel zone
];
// Static platforms: high route + alternates {x,y,w}
const PLATS = [
  // high route after ramp at ~3600
  {x:3820,y:260,w:300},{x:4180,y:225,w:200},{x:4440,y:180,w:220},{x:4720,y:180,w:200},
  {x:4980,y:200,w:180},{x:5220,y:230,w:220},{x:5500,y:280,w:200},{x:5760,y:330,w:180},
  // mid alternates
  {x:6200,y:330,w:160},{x:6450,y:300,w:160},{x:7000,y:360,w:180},{x:7300,y:300,w:160},
  {x:7600,y:280,w:200},{x:9200,y:280,w:200},{x:9480,y:240,w:180},
  // over water gap
  {x:8480,y:360,w:120},{x:8620,y:330,w:120},
  // over spike pit
  {x:10880,y:330,w:140},{x:11040,y:290,w:140},
  // late high route
  {x:11400,y:250,w:180},{x:11640,y:220,w:180},{x:11860,y:220,w:200},{x:12120,y:260,w:180},
  {x:12360,y:320,w:180},
  // final staircase
  {x:13380,y:360,w:140},{x:13560,y:300,w:140}
];
// Moving platforms {x1,x2,y,w,period,phase}
const MOVERS = [
  {x1:8460,x2:8720,y:380,w:90,period:3.2,phase:0},
  {x1:8500,x2:8760,y:380,w:90,period:3.8,phase:1.5},
  {x1:12960,x2:13080,y:370,w:80,period:2.6,phase:0}
];
// Collapsing ledges {x,w} sit on ground level (thin)
const CRUMBLE = [
  {x:6400,w:170},{x:7440,w:150},{x:10600,w:180}
];
// Springs {x,y,dx,dy,power} dy negative = up
const SPRINGS = [
  {x:4900,y:0,dx:0.15,dy:-1,power:1050},   // vertical after tunnel (y auto-ground)
  {x:5750,y:0,dx:0.7,dy:-0.7,power:950},    // diagonal to high route
  {x:9050,y:0,dx:1,dy:-0.15,power:900},     // horizontal booster
  {x:11280,y:0,dx:0.4,dy:-1,power:1050},    // up to late high route
  {x:13180,y:0,dx:0.3,dy:-1,power:1000}
];
// Spikes {x,w}
const SPIKES = [
  {x:6600,w:70},{x:11230,w:55},{x:12600,w:80}
];
// Item boxes {x,y,kind} y auto = ground-40 unless plat specified
const BOXES = [
  {x:1000,kind:"rings"},{x:2400,kind:"rings"},{x:4550,kind:"shield",py:140},
  {x:5350,kind:"speed"},{x:7700,kind:"rings"},{x:9600,kind:"shield"},
  {x:11700,kind:"life",py:180},{x:12400,kind:"speed"}
];
// Checkpoints
const CHECKPOINTS = [2000, 4800, 7500, 10200, 12400];
// Enemy spawns {type,x,y?} y auto
const ENEMIES = [
  {type:"walker",x:5050},{type:"walker",x:5400},{type:"walker",x:6300},
  {type:"flyer",x:5600,y:280},{type:"flyer",x:7400,y:260},{type:"flyer",x:9400,y:240},
  {type:"flyer",x:12000,y:220},
  {type:"crab",x:6700},{type:"crab",x:10300},{type:"crab",x:12650},
  {type:"wasp",x:7000,y:300},{type:"wasp",x:9300,y:250},{type:"wasp",x:11900,y:230},
  {type:"walker",x:8100},{type:"walker",x:12300},{type:"walker",x:13400}
];
const FINISH_X = 14000;

// ---- terrain sampling (catmull-rom) ----
function segIndex(x){
  let i=0;
  while(i<PTS.length-2 && PTS[i+1][0]<x) i++;
  return Math.max(0,Math.min(PTS.length-2,i));
}
function groundY(x){
  if(x<=PTS[0][0]) return PTS[0][1];
  if(x>=PTS[PTS.length-1][0]) return PTS[PTS.length-1][1];
  const i=segIndex(x);
  const p0=PTS[Math.max(0,i-1)], p1=PTS[i], p2=PTS[i+1], p3=PTS[Math.min(PTS.length-1,i+2)];
  const t=(x-p1[0])/(p2[0]-p1[0]);
  const t2=t*t, t3=t2*t;
  return 0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3);
}
function hasGround(x){
  for(const g of GAPS) if(x>g.x1 && x<g.x2) return false;
  return true;
}
function groundAngle(x){
  const e=6, a=groundY(x-e), b=groundY(x+e);
  return Math.atan2(b-a, 2*e); // radians, + = downhill to the right
}
// Rings: lines + arcs guiding jumps/routes
function buildRings(){
  const R=[];
  const line=(x1,y1,x2,y2,n)=>{ for(let i=0;i<n;i++){ const t=n===1?0.5:i/(n-1); R.push({x:x1+(x2-x1)*t, y:y1+(y2-y1)*t, taken:false}); } };
  const arc=(cx,cy,r,a0,a1,n)=>{ for(let i=0;i<n;i++){ const a=a0+(a1-a0)*(i/(n-1)); R.push({x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r, taken:false}); } };
  const G=(x,dy)=>({x, y:groundY(x)+(dy||-60)});
  // Rings follow the actual running surface, including rolling body height.
  for(let x=300;x<14000;x+=64){
    if(!hasGround(x) || SPIKES.some(s=>x>s.x-60&&x<s.x+s.w+60) ||
       LOOPS.some(l=>Math.abs(x-l.x)<120)) continue;
    if(Math.floor(x/640)%4===3) continue;
    R.push({x,y:groundY(x)-25,taken:false});
  }
  for(const p of PLATS) line(p.x+22,p.y-25,p.x+p.w-22,p.y-25,Math.max(2,Math.floor(p.w/55)));
  for(const l of LOOPS){
    const radius=l.R-12;
    for(let i=0;i<16;i++){
      const a=Math.PI/2-i*Math.PI*2/16;
      R.push({x:l.x+Math.cos(a)*radius,y:groundY(l.x)-l.R+Math.sin(a)*radius,taken:false});
    }
  }
  // Readable jump arcs over the water; main route remains forgiving.
  for(const g of GAPS){
    const start=g.x1-90, end=g.x2+90;
    for(let i=0;i<9;i++){
      const t=i/8, x=start+(end-start)*t;
      R.push({x,y:groundY(x)-25-125*4*t*(1-t),taken:false});
    }
  }
  return R;
}

const Level = {
  W:14500, PTS, GAPS, LOOPS, PLATS, MOVERS, CRUMBLE, SPRINGS, SPIKES, BOXES,
  CHECKPOINTS, ENEMIES, FINISH_X,
  groundY, hasGround, groundAngle,
  rings: buildRings(),
  reset(){ this.rings = buildRings(); }
};
window.Level = Level;
})();
