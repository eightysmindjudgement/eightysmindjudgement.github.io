// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};
 const hook=`globalThis.test={start,toggleStance,startRoll,update,pause,reset,player,keys,shots,state:()=>({mode,roll,bank})};`;
 const code=fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook);
 vm.runInNewContext(code,sandbox);const t=sandbox.test;
 t.startRoll(1);assert.equal(t.state().roll,null);
 t.start();t.keys.add('Space');t.keys.add('KeyD');t.startRoll(1);t.update(.35);
 assert.ok(Math.abs(t.player.rotation.z-t.state().bank-Math.PI)<1e-8);assert.ok(t.player.position.x>0);assert.ok(t.shots.length>0);
 t.startRoll(-1);assert.equal(t.state().roll.direction,1);
 t.pause();const elapsed=t.state().roll.elapsed;assert.equal(t.state().mode,'paused');t.startRoll(-1);assert.equal(t.state().roll.elapsed,elapsed);
 t.pause();t.update(.35);assert.equal(t.state().roll,null);assert.equal(t.player.rotation.z,t.state().bank);
 t.startRoll(-1);t.update(.35);assert.ok(Math.abs(t.player.rotation.z-t.state().bank+Math.PI)<1e-8);
 t.reset();assert.equal(t.state().roll,null);assert.equal(t.player.rotation.z,0);
 t.toggleStance();for(let i=0;i<120;i++)t.update(1/60);
 assert.ok(Math.abs(t.player.rotation.z-Math.PI/2)<1e-6);
 t.keys.add('KeyD');t.keys.add('Space');for(let i=0;i<30;i++)t.update(1/60);
 assert.ok(Math.abs(t.player.rotation.z-Math.PI/2)<1e-6);assert.ok(t.shots.length>0);
 t.startRoll(1);t.update(.35);assert.ok(Math.abs(t.player.rotation.z-3*Math.PI/2)<1e-6);
 t.update(.35);assert.ok(Math.abs(t.player.rotation.z-Math.PI/2)<1e-6);
 t.keys.clear();t.toggleStance();for(let i=0;i<120;i++)t.update(1/60);assert.ok(Math.abs(t.player.rotation.z)<1e-5);
 t.reset();assert.equal(t.player.rotation.z,0);
 console.log('PASS: held 90-degree stance, movement/fire, roll from held stance, return and reset.'); 
 console.log('PASS: full rolls in both directions, movement and fire during roll, no overlapping rolls, pause and retry.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
