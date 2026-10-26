import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const engine=fs.readFileSync(new URL('../emj-puzzle-engine.js',import.meta.url),'utf8');
const view=fs.readFileSync(new URL('../emj-puzzle.js',import.meta.url),'utf8');
for(const reduced of [false,true]){
 const nodes=new Map(),buttons=[],frames=[];
 const gradient={addColorStop(){}};
 const context=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 class Element{
  constructor(){this.style={setProperty(){}};this.dataset={};this.listeners={};this.classList={remove(){},add(){}};}
  addEventListener(k,f){this.listeners[k]=f;} setAttribute(){} append(){} after(){} remove(){} replaceChildren(){} focus(){} setPointerCapture(){}
  getContext(){return context;} getBoundingClientRect(){return {left:0,width:400};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 for(let i=0;i<3;i++){const el=new Element();el.dataset.stage=String(i);buttons.push(el);}
 const document={getElementById:get,querySelectorAll:s=>s==='[data-stage]'?buttons:[],createElement:()=>new Element(),createTextNode:x=>x,addEventListener(){}};
 let world;
 const env={document,matchMedia:()=>({matches:reduced,addEventListener(){}}),Image:class extends Element{},localStorage:{getItem:()=>0,setItem(){}},performance:{now:()=>1000},requestAnimationFrame:f=>frames.push(f)};
 env.window=env;vm.createContext(env);vm.runInContext(engine,env);
 const Original=env.EMJPuzzle.World;env.EMJPuzzle.World=class extends Original{constructor(){super();world=this;}};
 vm.runInContext(view,env);get('puzzle-start').listeners.click();
 world.merge(world.add(5,170,350),world.add(5,230,350));
 frames.shift()(1000);frames.shift()(1017);
 assert.equal(world.discharges.length,1);assert(world.shotsFired>0);
 get('puzzle-pause').listeners.click();get('puzzle-start').listeners.click();
 for(const b of [buttons[1],buttons[2],buttons[0]]){b.listeners.click();assert.equal(world.stageIndex,Number(b.dataset.stage));assert.equal(world.discharges.length,0);}
 console.log('PASS view smoke: start, merge, effects, pause/resume, stage reset; reduced='+reduced);
}
