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
test('drill applies physical impulses, crosses floor, and leaves scoring alone',()=>{
 const w=new World(()=>.5),a=w.add(1,175,400),b=w.add(2,225,400);w.drill={x:200,y:180,width:52,length:260,angle:0};const walls=JSON.stringify(w.walls);w.updateDrill(1/120);assert(a.vx<0);assert(b.vx>0);assert(a.spin<0&&b.spin>0);assert.equal(a.x,175);assert.equal(b.x,225);assert.equal(w.score,0);assert.equal(w.rocksDestroyed,0);assert.equal(JSON.stringify(w.walls),walls);for(let i=0;i<600;i++)w.updateDrill(1/120);assert.equal(w.drill,null);
});
test('game over and stage reset discard all special event state',()=>{
 const w=new World(()=>.5);w.add(6,200,300);w.add(7,200,400);w.drill={x:200,y:0,width:52,length:260,angle:0};w.reset(2);assert.equal(w.activeEffect,null);assert.equal(w.effectQueue.length,0);assert.equal(w.drill,null);const b=w.add(0,200,20);w.add(6,300,300);for(let i=0;i<600&&!w.over;i++){b.y=20;b.vy=0;w.step(1/120);}assert(w.over);assert.equal(w.activeEffect,null);assert.equal(w.effectQueue.length,0);
});
