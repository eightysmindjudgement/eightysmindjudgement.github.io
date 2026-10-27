import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const engine=fs.readFileSync(new URL('../emj-puzzle-engine.js',import.meta.url),'utf8');
const view=fs.readFileSync(new URL('../emj-puzzle.js',import.meta.url),'utf8');
for(const viewportWidth of [320,400])for(const reduced of [false,true]){
 const saved=new Map(),writes=[];
 const nodes=new Map(),buttons=[],frames=[],audioStarts=[],imageDraws=[];
 const gradient={addColorStop(){}};
 const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,drawImage(){imageDraws.push(this.globalAlpha);}},{get:(o,k)=>o[k]||(()=>{})});
 class Element{
  constructor(){this.style={setProperty(){}};this.dataset={};this.listeners={};this.classList={remove(){},add(){}};}
  querySelector(k){this.children ||= new Map();if(!this.children.has(k))this.children.set(k,new Element());return this.children.get(k);} addEventListener(k,f){this.listeners[k]=f;} setAttribute(){} append(){} after(){} remove(){} replaceChildren(){} focus(){} setPointerCapture(){}
  get parentElement(){return get("board");} getContext(){return context;} getBoundingClientRect(){return {left:0,width:viewportWidth};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 for(let i=0;i<3;i++){const el=new Element();el.dataset.stage=String(i);buttons.push(el);}
 const document={querySelector:get,getElementById:get,querySelectorAll:s=>s==='[data-stage]'?buttons:[],createElement:()=>new Element(),createTextNode:x=>x,addEventListener(){}};
 let world;
 const env={document,matchMedia:()=>({matches:reduced,addEventListener(){}}),Image:class extends Element{complete=true;naturalWidth=400;naturalHeight=570;},AudioContext:class{state='running';currentTime=10;destination={};resume(){return Promise.resolve();}createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(t){audioStarts.push(t);},stop(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}},localStorage:{getItem:k=>saved.get(k)||0,setItem(k,v){saved.set(k,v);writes.push(k);}},performance:{now:()=>1000},requestAnimationFrame:f=>frames.push(f)};
 env.window=env;vm.createContext(env);vm.runInContext(engine,env);
 const Original=env.EMJPuzzle.World;env.EMJPuzzle.World=class extends Original{constructor(){super();world=this;}};
 vm.runInContext(view,env);get('puzzle-start').listeners.click();
 world.add(6,200,300);world.add(7,200,400);get('puzzle-canvas').listeners.pointermove({pointerType:'mouse',clientX:viewportWidth/2});assert.equal(audioStarts.length,6);assert(imageDraws.includes(.5));assert.equal(!!get('board').style.transform,!reduced);
 world.time=2;world.updateEffects();get('puzzle-canvas').listeners.pointermove({pointerType:'mouse',clientX:viewportWidth/2});assert.equal(world.activeEffect.kind,'brain');if(!reduced)assert(get('board').style.transform.startsWith('translateX'));world.time=4;world.updateEffects();get('puzzle-canvas').listeners.pointermove({pointerType:'mouse',clientX:viewportWidth/2});assert.equal(get('board').style.transform,'');assert.equal(get('board').style.transformOrigin,'');world.reset();
 const a=world.add(7,170,350),b=world.add(7,230,350);world.clearEffects();world.merge(a,b);
 frames.shift()(1000);frames.shift()(1017);
 assert.equal(world.discharges.length,1);assert.equal(world.shotsFired,0);
 // Exercise both image and lightning phases, including missing-image fallback.
 const created=world.discharges[0].time;
 for(const age of [.4,.81,1.2,1.59]){world.time=created+age;frames.shift()(1017);}
 world.clearEffects();world.merge(world.add(4,170,350),world.add(4,230,350));
 for(const age of [.4,.81,1.2]){world.time=world.discharges.at(-1).time+age;frames.shift()(1017);}

 get('puzzle-pause').listeners.click();get('puzzle-start').listeners.click();
 for(const b of [buttons[1],buttons[2],buttons[0]]){b.listeners.click();assert.equal(world.stageIndex,Number(b.dataset.stage));assert.equal(world.discharges.length,0);}
 get('puzzle-start').listeners.click();
 world.merge(world.add(8,150,400),world.add(8,250,400));assert(world.clear);
 const frozen=JSON.stringify(world.bodies),finalScore=world.score;
 frames.shift()(2000);assert.equal(get('puzzle-clears').textContent,0);
 get('puzzle-canvas').listeners.keydown({key:'Enter',preventDefault(){}});assert.equal(JSON.stringify(world.bodies),frozen);
 frames.shift()(6999);assert.equal(get('puzzle-clears').textContent,0);assert(!world.over);
 frames.shift()(7000);assert.equal(get('puzzle-clears').textContent,1);assert(world.over);
 assert.equal(world.score,finalScore);assert.equal(JSON.stringify(world.bodies),frozen);
 frames.shift()(8000);assert.equal(writes.filter(k=>k==='emj-puzzle-clears').length,1);
 assert.equal(saved.get('emj-puzzle-clears'),'1');
 get('puzzle-start').listeners.click();assert.equal(world.clear,null);assert(!world.over);assert.equal(get('puzzle-clears').textContent,1);
 console.log('PASS clear timing, frozen physics, one-time count, storage and restart');
 console.log('PASS view smoke: start, merge, effects, pause/resume, stage reset; reduced='+reduced+' width='+viewportWidth);
}
