// Run with: node scripts/emj-puzzle.test.mjs
import assert from 'node:assert/strict';
import * as engine from '../emj-puzzle-engine.js';
const {World, vertices, contact, CONFIG} = engine.default || globalThis.EMJPuzzle;
let passed = 0;
function test(name, run) { run(); console.log(`PASS ${name}`); passed++; }
test('nine evolution stages preserve final size and image paths',()=>{
 assert.equal(CONFIG.pieces.length,9);assert.equal(CONFIG.pieces.at(-1).radius,77);
 assert.equal(CONFIG.pieces[2].name,'Cyborg Grandma');assert.equal(CONFIG.pieces[2].image,'Cyborg Grandma.png');
 assert.equal(CONFIG.pieces[5].name,'Metal Messiah');assert.equal(CONFIG.pieces[5].image,'MetalMessiah.png');
 assert.equal(CONFIG.laserDuration,.22*1.5);
 for(let i=1;i<CONFIG.pieces.length;i++)assert(CONFIG.pieces[i].radius>CONFIG.pieces[i-1].radius);
 for(let i=0;i<CONFIG.pieces.length-1;i++){const w=new World(()=>0);w.merge(w.add(i,180,300),w.add(i,220,300));assert.equal(w.bodies[0].level,i+1);assert.equal(w.bodies[0].r,CONFIG.pieces[i+1].radius);}
});
test('gravity and floor containment', () => {
  const w = new World(() => 0), b = w.add(0, 200, 200);
  for (let i = 0; i < 360; i++) w.step(1/120);
  assert(b.y > 500);
  assert(Math.max(...vertices(b).map(v => v.y)) <= 570.001);
});
test('same pieces merge once and score', () => {
  const w = new World(() => 0); w.add(0,180,400); w.add(0,210,400); w.step(1/120);
  assert.equal(w.bodies.length,1); assert.equal(w.bodies[0].level,1); assert.equal(w.score,10);
});
test('chain produces upper tier and bonus', () => {
  const w = new World(() => 0); w.add(0,190,400); w.add(0,210,400); w.add(1,230,400); w.step(1/120);
  assert.equal(w.bodies.length,1); assert.equal(w.bodies[0].level,2); assert.equal(w.score,50);
});
test('final tier removes both pieces without tier eight', () => {
  const w = new World(() => 0); w.add(8,150,400); w.add(8,250,400); w.step(1/120);
  assert.equal(w.bodies.length,0); assert.equal(w.score,2400);
});
test('rapid input is throttled', () => {
  const w = new World(() => 0); assert(w.drop(200));
  for(let i=0;i<200;i++) assert(!w.drop(200));
  assert.equal(w.bodies.length,1);
});
test('overflow ends game, freezes board, reset clears state', () => {
  const w = new World(() => 0), b = w.add(0,200,20);
  for(let i=0;i<600&&!w.over;i++){ b.y=20; b.vy=0; w.step(1/120); }
  assert(w.over); const state=JSON.stringify(w); w.step(1/60); assert.equal(JSON.stringify(w),state);
  w.reset(); assert(!w.over); assert.equal(w.score,0); assert.equal(w.bodies.length,0);
  assert.equal(w.overflow,0); assert.equal(w.cooldown,0); assert.equal(w.events.length,0);
});
test('seeded play remains finite and contained', () => {
  let seed=1; const rnd=()=>((seed=seed*16807%2147483647)/2147483647), w=new World(rnd);
  for(let i=0;i<3000&&!w.over;i++){
    if(i%65===0) w.drop(rnd()*400); w.step(1/120);
    for(const b of w.bodies){
      assert(Number.isFinite(b.x+b.y+b.vx+b.vy+b.angle));
      assert(b.rock ? b.level===-1 : b.level>=0&&b.level<CONFIG.pieces.length); assert(b.x>=0&&b.x<=400); assert(b.y<=570);
    }
  }
});
test('three stages have distinct containers and reset cleanly', () => {
  let previous=Infinity;
  for(let stage=0;stage<3;stage++){
    const w=new World(()=>0);w.reset(stage);
    const width=w.stage.right.at(-1)[0]-w.stage.left.at(-1)[0];
    assert(width>0&&width<=400); if(stage===0)assert.equal(width,400); if(stage===1)assert.equal(width,100); if(stage===2){assert(w.stage.left.length>20);assert.equal(w.stage.left[1][1],190);} previous=width;
    assert(w.stage.right[0][0]-w.stage.left[0][0]>=width);
    w.add(2,200,300);w.score=50;w.reset();
    assert.equal(w.stageIndex,stage);assert.equal(w.score,0);assert.equal(w.bodies.length,0);
  }
});
test('all tile sizes stay inside sloping walls and floor', () => {
  for(let stage=0;stage<3;stage++)for(let level=0;level<CONFIG.pieces.length;level++)for(const x of [15,200,385]){
    const w=new World(()=>0);w.reset(stage);const b=w.add(level,x,560);b.angle=.3;b.vy=300;
    for(let i=0;i<30;i++)w.step(1/120);
    for(const wall of w.walls)for(const v of vertices(b)){
      assert((v.x-wall.x)*wall.nx+(v.y-wall.y)*wall.ny>=-.05,`stage ${stage}, tile ${level} escaped wall`);
    }
  }
});
test('oval stage squeezes only after a minute',()=>{
  const w=new World(()=>0);w.reset(2);
  assert.deepEqual(w.stage.left,w.baseStage.left);
  w.step(1/120,59.99);assert.equal(w.wallScale,1);
  for(let i=0;i<480;i++)w.step(1/120,60+i/120);
  assert(Math.abs(w.wallScale-.94)<.00001);
  for(let i=0;i<120;i++)w.step(1/120,70);
  assert(Math.abs(w.wallScale-.94)<.00001);
  w.reset();assert.equal(w.wallScale,1);assert.equal(w.wallRate,0);
});
test('moving walls stop exactly at one third of the original board area',()=>{
  const w=new World(()=>0);w.reset(2);
  for(let i=0;i<5000;i++)w.step(1/120,3600);
  assert(Math.abs(w.baseArea*w.wallScale-400*570/3)<.00001);
  const stopped=JSON.stringify(w.stage);w.step(1/120,7200);
  assert.equal(JSON.stringify(w.stage),stopped);assert.equal(w.wallRate,0);
});
test('squeezing walls move resting tiles and keep all corners inside',()=>{
  const w=new World(()=>0);w.reset(2);const b=w.add(3,105,480);
  for(let i=0;i<120;i++)w.step(1/120,10);
  const before={x:b.x,y:b.y};
  for(let i=0;i<480;i++)w.step(1/120,60+i/120);
  assert(Math.hypot(b.x-before.x,b.y-before.y)>.5);
  for(const wall of w.walls)for(const v of vertices(b))assert((v.x-wall.x)*wall.nx+(v.y-wall.y)*wall.ny>=-.05);
  assert(Number.isFinite(b.vx+b.vy));
});

test('true circles and angle independent circle contact',()=>{
 const w=new World(()=>0),a=w.add(0,100,200),b=w.add(1,145,200);
 assert.equal(contact(a,b).depth,0);a.angle=.91;b.angle=2;assert.equal(contact(a,b).depth,0);
 b.x+=.01;assert.equal(contact(a,b),null);
 for(const v of vertices(a))assert(Math.abs(Math.hypot(v.x-a.x,v.y-a.y)-a.r)<1e-9);
});
test('circle rock contact uses closest corner axis',()=>{
 const w=new World(()=>0),a=w.add(-1,200,200),b=w.add(0,200,200);
 assert(contact(a,b));b.x=300;assert.equal(contact(a,b),null);assert.equal(vertices(a).length,8);
});
test('special evolutions expire and reset without changing body positions',()=>{
 for(const level of [5,8]){const w=new World(()=>0);w.merge(w.add(level-1,180,300),w.add(level-1,220,300));
 assert.equal(w.discharges.length,1);assert.equal(w.discharges[0].body.level,level);
 assert.equal(w.discharges[0].final,level===8);
 w.time=1.59;w.step(1/120);assert.equal(w.discharges.length,1);
 w.step(1/120);assert.equal(w.discharges.length,0);w.reset();assert.equal(w.discharges.length,0);}
});
test('combo cue matches actual first shot even when queued',()=>{
 const w=new World(()=>0);w.fireCombo(2);assert.equal(w.comboCue.start,w.lasers[0].start);
 const before=w.lasers.length;w.fireCombo(3);assert.equal(w.lasers.length,before+6);assert.equal(w.comboCue.start,w.lasers[before].start);
 for(let i=0;i<100;i++)w.fireCombo(1);assert.equal(typeof w.comboCue.start,'number');
});
test('off center resting circles slide under load without added forces',()=>{
 const w=new World(()=>0),base=w.add(3,200,527),top=w.add(1,205,458);
 const before=top.x;for(let i=0;i<120;i++)w.step(1/120);
 assert(Math.abs(top.x-before)>5);assert(Number.isFinite(top.vx+top.vy));assert(Math.abs(top.vx)<650);
});

console.log(`${passed} puzzle tests passed.`);
