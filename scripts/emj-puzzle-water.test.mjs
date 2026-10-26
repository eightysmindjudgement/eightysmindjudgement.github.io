import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World,CONFIG}=engine.default||globalThis.EMJPuzzle;
for(let stage=0;stage<3;stage++){
 const w=new World(()=>0);w.reset(stage);
 for(const [time,height,rain] of [[119,0,false],[120,0,true],[122,85.5,true],[124,171,false],[154,85.5,false],[184,0,false],[240,0,true],[244,171,false]]){w.updateWater(0,time);assert(Math.abs(w.water.height-height)<1e-6);assert.equal(w.water.raining,rain);}
 assert.equal(w.water.target,Math.min(...CONFIG.pieces.map(p=>p.radius))*9);
 w.reset(stage);assert.equal(w.water.height,0);assert.equal(w.water.elapsed,0);
 w.updateWater(0,124);const tile=w.add(0,200,490),rock=w.add(-1,230,490);tile.vy=240;rock.vy=240;let deepest=tile.y;
 for(let i=0;i<1200;i++){w.step(1/120,124+i/120);deepest=Math.max(deepest,tile.y);}
 assert(deepest>tile.y+5);assert(tile.y<540);assert(rock.y>550);assert(w.water.waves.length<=24);
 w.reset(stage);for(let level=0;level<CONFIG.pieces.length;level++){const b=w.add(level,200,550);w.water.height=171;w.applyWater(b,1/120);assert(b.vy<0);}
 // Hold the play clock at peak water to measure physical equilibrium for every size.
 for(let level=0;level<CONFIG.pieces.length;level++){
  w.reset(stage);w.updateWater(0,124);const b=w.add(level,200,480);w.clearEffects();
  for(let i=0;i<960;i++)w.step(1/120,124);
  const surface=w.waterSurface(b.x);assert(b.y-b.r<surface);assert(b.y+b.r>surface);
  assert(Math.abs(b.vy)<2);assert(b.y+b.r<CONFIG.height-2);
 }
 w.reset(stage);w.updateWater(0,484);assert.equal(w.water.height,171);
 w.updateWater(0,544);assert.equal(w.water.height,0);
 w.reset(stage);w.updateWater(0,120);assert(w.water.raining);w.reset(stage);assert.equal(w.water.elapsed,0);
 w.stageIndex=3;w.updateWater(0,544);assert.equal(w.water.height,0);assert.equal(w.water.raining,false);
}
console.log('PASS rain timing, drainage, reset, tile buoyancy, rock sinking, impacts and level exclusion');
