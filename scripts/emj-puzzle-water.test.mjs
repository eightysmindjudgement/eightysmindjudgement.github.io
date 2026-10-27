import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World,CONFIG}=engine.default||globalThis.EMJPuzzle;
assert.equal(CONFIG.rainInterval,90);assert.equal(CONFIG.rainDuration,4);assert.equal(CONFIG.drainDuration,120);
for(let stage=0;stage<3;stage++){
 const w=new World(()=>0);w.reset(stage);
 for(const [time,height,rain] of [[89,0,false],[90,0,true],[92,28.5,true],[94,57,false],[154,28.5,false],[180,16.15,true],[184,71.25,false]]){w.updateWater(0,time);assert(Math.abs(w.water.height-height)<1e-6);assert.equal(w.water.raining,rain);}
 const held=w.water.height;w.updateWater(0,184);assert.equal(w.water.height,held);
 // New rain overlaps drainage; it adds water instead of clamping to 57.
 assert(w.water.height>57);assert.equal(w.water.drainRate,71.25/120);
 const capped=new World(()=>0);capped.water.height=185;capped.water.elapsed=90;capped.updateWater(0,94);assert.equal(capped.water.height,CONFIG.height/3);
 capped.updateWater(0,100);assert(capped.water.height<190);
 const long=new World(()=>0);long.updateWater(0,9004);assert(long.water.height<=190);assert(long.water.height>57);
 assert.equal(w.water.target,Math.min(...CONFIG.pieces.map(p=>p.radius))*3);
 w.reset(stage);assert.equal(w.water.height,0);assert.equal(w.water.elapsed,0);
 w.updateWater(0,94);const tile=w.add(0,200,490),rock=w.add(-1,230,490);tile.vy=240;rock.vy=240;let deepest=tile.y;
 for(let i=0;i<1200;i++){w.step(1/120,94+i/120);deepest=Math.max(deepest,tile.y);}
 assert(deepest>tile.y+5);assert(tile.y<540);assert(rock.y>550);assert(w.water.waves.length<=24);
 w.reset(stage);for(let level=0;level<CONFIG.pieces.length;level++){const b=w.add(level,200,550);w.water.height=57;w.applyWater(b,1/120);assert(b.vy<0);}
 for(let level=0;level<9;level++){
  w.reset(stage);w.updateWater(0,94);const b=w.add(level,200,480);w.clearEffects();
  for(let i=0;i<960;i++)w.step(1/120,94);
  const surface=w.waterSurface(b.x);assert(b.y-b.r<surface);assert(b.y+b.r>surface);assert(Math.abs(b.vy)<2);assert(b.y+b.r<CONFIG.height-2);
 }
 w.reset(stage);w.updateWater(0,94);assert.equal(w.water.height,57);
 w.reset(stage);w.updateWater(0,180);assert(w.water.raining);w.reset(stage);assert.equal(w.water.elapsed,0);
 w.stageIndex=3;w.updateWater(0,544);assert.equal(w.water.height,0);assert.equal(w.water.raining,false);
}
console.log('PASS 90-second rain cycle, accumulation, one-third cap, drainage, pause clock, reset and buoyancy');
