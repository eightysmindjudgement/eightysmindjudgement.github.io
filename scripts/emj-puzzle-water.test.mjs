import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World,CONFIG}=engine.default||globalThis.EMJPuzzle;
assert.equal(CONFIG.rainInterval,30);assert.equal(CONFIG.rainDuration,4);assert.equal(CONFIG.drainDuration,180);
for(let stage=0;stage<3;stage++){
 const w=new World(()=>0);w.reset(stage);
 assert.equal(CONFIG.rainAmount,80);
 for(const [time,height,rain] of [[29,0,false],[30,0,true],[32,40,true],[34,80,false],[60,80*(1-26/180),true],[64,80+80*5/6,false],[94,190,false],[300,190*(1-26/180),true],[304,190,false],[600,190*(1-26/180),true],[604,190,false]]){w.updateWater(0,time);assert(Math.abs(w.water.height-height)<1e-6);assert.equal(w.water.raining,rain);}
 const held=w.water.height;w.updateWater(0,604);assert.equal(w.water.height,held);
 assert.equal(w.water.drainRate,190/180);
 // Split updates and delayed frames must produce the same water level.
 const stepped=new World(()=>0);stepped.reset(stage);for(let i=1;i<=6000;i++)stepped.updateWater(0,i/10);
 assert(Math.abs(stepped.water.height-190*(1-26/180))<1e-6);
 const capped=new World(()=>0);capped.water.height=185;capped.water.elapsed=30;capped.updateWater(0,34);assert.equal(capped.water.height,CONFIG.height/3);
 capped.updateWater(0,40);assert(capped.water.height<190);
 assert.equal(w.water.target,Math.min(...CONFIG.pieces.map(p=>p.radius))*3);
 w.reset(stage);assert.equal(w.water.height,0);assert.equal(w.water.elapsed,0);
 w.updateWater(0,94);w.water.height=57;const tile=w.add(0,200,490),rock=w.add(-1,230,490);tile.vy=240;rock.vy=240;let deepest=tile.y;
 for(let i=0;i<1200;i++){w.step(1/120,94+i/120);deepest=Math.max(deepest,tile.y);}
 assert(deepest>tile.y+5);assert(tile.y<540);assert(rock.y>550);assert(w.water.waves.length<=24);
 w.reset(stage);for(let level=0;level<CONFIG.pieces.length;level++){const b=w.add(level,200,550);w.water.height=57;w.applyWater(b,1/120);assert(b.vy<0);}
 for(let level=0;level<9;level++){
  w.reset(stage);w.updateWater(0,94);w.water.height=57;const b=w.add(level,200,480);w.clearEffects();
  for(let i=0;i<960;i++)w.step(1/120,94);
  const surface=w.waterSurface(b.x);assert(b.y-b.r<surface);assert(b.y+b.r>surface);assert(Math.abs(b.vy)<2);assert(b.y+b.r<CONFIG.height-2);
 }
 w.reset(stage);w.updateWater(0,34);assert.equal(w.water.height,80);
 w.reset(stage);w.updateWater(0,180);assert(w.water.raining);w.reset(stage);assert.equal(w.water.elapsed,0);
 w.stageIndex=3;w.updateWater(0,544);assert.equal(w.water.height,0);assert.equal(w.water.raining,false);
}
console.log('PASS 30-second rain cycle, 80-unit supply, 180-second drainage, 5/10-minute levels, cap, reset and buoyancy');
