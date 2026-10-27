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
