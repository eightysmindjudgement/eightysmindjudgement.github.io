import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World}=engine.default||globalThis.EMJPuzzle;
function test(name,run){run();console.log('PASS '+name);}
test('all four effects preserve creation order and full duration',()=>{
 const w=new World(()=>.5);for(const level of [6,7,5,8])w.add(level,200,300);
 const seen=[];for(const level of [6,7,5,8]){const e=w.activeEffect;seen.push(e.body.level);assert.equal(e.body.level,level);assert.equal(w.discharges.length,e.kind==='discharge'?1:0);w.time=e.time+e.duration-.001;w.updateEffects();assert.equal(w.activeEffect,e);w.time=e.time+e.duration;w.updateEffects();}
 assert.deepEqual(seen,[6,7,5,8]);assert.equal(w.activeEffect,null);assert.equal(w.effectQueue.length,0);assert.equal(w.discharges.length,0);
});
test('drill probability boundary and no draws on rejected or rock drops',()=>{
 for(const [chance,expected] of [[.029999,true],[.03,false],[.5,false]]){const w=new World(()=>.5);w.random=()=>chance;assert(w.drop(200));assert.equal(!!w.drill,expected);}
 const w=new World(()=>.5);let draws=0;w.random=()=>{draws++;return 0;};w.drop(200);assert(w.drill);const first=w.drill;const count=draws;assert(!w.drop(200));assert.equal(draws,count);w.cooldown=0;w.drop(200);assert.equal(draws,count+1);assert.equal(w.drill,first);w.clearEffects();w.cooldown=0;w.current=-1;const before=draws;w.drop(200);assert.equal(draws,before+1);assert.equal(w.drill,null);w.over=true;const end=draws;assert(!w.drop(200));assert.equal(draws,end);
});
test('drill contacts displace tiles in all stages and exits through floor',()=>{
 for(let stage=0;stage<3;stage++){
 const w=new World(()=>.5);w.reset(stage);const a=w.add(1,200,300);
 w.drill={x:200,y:50,width:52,length:260,angle:0};
 const before=a.y;w.step(1/120);assert(a.y>before+1);assert(a.vy>0);assert.equal(w.score,0);
 const left=w.add(2,175,430),right=w.add(3,225,430);
 w.drill.y=240;w.step(1/120);assert(left.x<175);assert(right.x>225);
 for(let i=0;i<600&&w.drill;i++)w.step(1/120);
 assert.equal(w.drill,null);assert.equal(w.rocksDestroyed,0);
 }
});

test('game over and stage reset discard all special event state',()=>{
 const w=new World(()=>.5);w.add(6,200,300);w.add(7,200,400);w.drill={x:200,y:0,width:52,length:260,angle:0};w.reset(2);assert.equal(w.activeEffect,null);assert.equal(w.effectQueue.length,0);assert.equal(w.drill,null);const b=w.add(0,200,20);w.add(6,300,300);for(let i=0;i<600&&!w.over;i++){b.y=20;b.vy=0;w.step(1/120);}assert(w.over);assert.equal(w.activeEffect,null);assert.equal(w.effectQueue.length,0);
});


test('unsupported aligned circles fall and break unstable point balance',()=>{
 const w=new World(()=>.5),lower=w.add(3,200,300),upper=w.add(1,200,235);
 for(let i=0;i<30;i++)w.step(1/120);
 assert(lower.y>310);assert(upper.y>245);assert(Math.abs(upper.x-lower.x)>.05);
 for(let i=0;i<600;i++)w.step(1/120);
 assert(Math.abs(upper.x-lower.x)>20);assert(Number.isFinite(upper.angle+lower.angle));
});
test('drill releases a mixed stack and contacts transfer motion',()=>{
 const w=new World(()=>.5),a=w.add(3,200,480),b=w.add(2,201,408),c=w.add(1,200,350);
 w.drill={x:200,y:70,width:52,length:260,angle:0};
 const initial=[a,b,c].map(v=>({x:v.x,y:v.y}));
 for(let i=0;i<480;i++)w.step(1/120);
 for(const [i,v] of [a,b,c].entries()){
  assert(Math.hypot(v.x-initial[i].x,v.y-initial[i].y)>10);
  assert(Number.isFinite(v.x+v.y+v.angle));
  for(const wall of w.walls)assert((v.x-wall.x)*wall.nx+(v.y-wall.y)*wall.ny-v.r>-.05);
 }
 assert([a,b,c].some(v=>Math.abs(v.angle)>.01));assert.equal(w.score,0);
});
