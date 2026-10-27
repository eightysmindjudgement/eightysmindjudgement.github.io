import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World,CONFIG:C}=engine.default||globalThis.EMJPuzzle;
let rocks=0,bombs=0;
for(let i=0;i<10000;i++){const w=new World(()=>(i+.5)/10000);rocks+=w.current===-1;bombs+=w.current===-2;}
assert.equal(rocks,1000);assert.equal(bombs,500);
for(let stage=0;stage<3;stage++)for(const wet of [false,true]){
 const w=new World(()=>0);w.reset(stage);const b=w.add(-2,200,450);
 assert.equal(b.r,C.pieces[0].radius*2/3);
 w.time=10;w.updateBombs();assert(Math.abs(b.r-(C.pieces[0].radius*2/3+C.pieces[1].radius)/2)<1e-6);
 const held=b.r;w.updateBombs();assert.equal(b.r,held);
 if(wet)w.water.height=200;
 const right=w.add(3,300,450),above=w.add(2,200,320);
 w.time=20;w.updateBombs();assert.equal(w.blasts.length,1);assert.equal(w.blasts[0].r,C.pieces[1].radius);assert.equal(w.blasts[0].wet,wet);
 w.time=20.15;w.updateBombs();assert(right.vx>0);assert(right.spin!==0);
 w.time=20.2;w.updateBombs();assert(above.vy<0);
 assert.equal(w.score,0);assert.equal(w.shotsFired,0);
 if(wet){assert(w.water.waves.some(v=>v.blast));const y=w.waterSurface(200);w.water.elapsed=.15;assert.notEqual(w.waterSurface(200),y);}
 w.reset();assert.equal(w.blasts.length,0);assert.equal(w.explosions,0);
}
console.log('PASS bomb probability, stages, growth, pause clock, impulses, underwater waves and reset');
for(const angle of [0,Math.PI/12,Math.PI/4,Math.PI*.49]){
 const w=new World(()=>angle/(Math.PI/2));
 w.add(-2,200,280);w.time=20;w.updateBombs();
 const blast=w.blasts[0];assert(Math.abs(blast.angle-angle)<1e-9);
 const targets=[];
 for(let i=0;i<4;i++){const a=angle+i*Math.PI/2;targets.push(w.add(0,200+Math.cos(a)*120,280+Math.sin(a)*120));}
 const gap=w.add(0,200+Math.cos(angle+Math.PI/4)*140,280+Math.sin(angle+Math.PI/4)*140);
 w.time=20.05;w.updateBombs();assert(targets.every(b=>!blast.hits.has(b.id)));
 w.time=20.2;w.updateBombs();
 targets.forEach((b,i)=>{assert(blast.hits.has(b.id));const a=angle+i*Math.PI/2;assert(b.vx*Math.cos(a)+b.vy*Math.sin(a)>0);});
 assert(!blast.hits.has(gap.id));
 const frozen=JSON.stringify(targets);w.updateBombs();assert.equal(JSON.stringify(targets),frozen);assert.equal(blast.angle,angle);
 w.time=22;w.updateBombs();assert.equal(w.blasts.length,0);
}
console.log('PASS random fixed angles, four perpendicular arms, travel, diagonal impulses, gaps and cleanup');
