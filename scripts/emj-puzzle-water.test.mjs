import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World,CONFIG}=engine.default||globalThis.EMJPuzzle;
for(let stage=0;stage<3;stage++){
 const w=new World(()=>0);w.reset(stage);
 for(const [time,height,rain] of [[59,0,false],[60,0,true],[62,28.5,true],[64,57,true],[120,380,true],[150,380,true]]){w.updateWater(0,time);assert(Math.abs(w.water.height-height)<1e-6);assert.equal(w.water.raining,rain);}
 assert.equal(w.water.drainRate,380/60);assert.equal(w.water.drainEnd,210);
 const held=w.water.height;w.updateWater(0,150);assert.equal(w.water.height,held);
 w.updateWater(0,210);assert.equal(w.water.drainEnd,270);
 w.updateWater(0,600);assert(w.water.height<=CONFIG.height*2/3);
 const single=new World(()=>0);single.updateWater(0,600);assert(Math.abs(single.water.height-w.water.height)<1e-6);
 const draining=new World(()=>0);draining.water.height=100;draining.water.drainRate=1;draining.water.drainEnd=60;draining.updateWater(0,30);assert.equal(draining.water.height,70);
 w.reset(stage);assert.equal(w.water.height,0);assert.equal(w.water.elapsed,0);
 for(let level=0;level<CONFIG.pieces.length;level++){const b=w.add(level,200,550);w.water.height=57;w.applyWater(b,1/120);assert(b.vy<0);}
 const rock=w.add(-1,200,550);w.applyWater(rock,1/120);assert.equal(rock.vy,0);
 w.stageIndex=3;w.updateWater(0,600);assert.equal(w.water.height,0);assert.equal(w.water.raining,false);
}
console.log('PASS rain renewal, 90-second session ends, 60-second drainage, water cap, elapsed clock, buoyancy and reset');
