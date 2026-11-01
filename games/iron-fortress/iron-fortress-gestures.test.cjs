// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let clock=0;
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},handlers:{},addEventListener(name,fn){(this.handlers[name]??=[]).push(fn)},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance:{now:()=>clock},Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};
 const hook=`globalThis.test={start,toggleStance,startRoll,update,pause,reset,player,keys,shots,state:()=>({mode,roll,bank})};`;
 const code=fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook);
 vm.runInNewContext(code,sandbox);const t=sandbox.test;

 const canvas=el('if-canvas');canvas.setPointerCapture=()=>{};
 const send=(name,x,y,id=1)=>{for(const handler of canvas.handlers[name]||[])handler({pointerId:id,clientX:x,clientY:y})};
 t.start();send('pointerdown',100,100);clock+=50;send('pointerup',100,100);clock+=100;send('pointerdown',102,100);clock+=50;send('pointerup',102,100);
 for(let i=0;i<120;i++)t.update(1/60);assert.ok(Math.abs(t.player.rotation.z-Math.PI/2)<1e-6);
 t.reset();send('pointerdown',200,100);clock+=120;send('pointermove',100,100);send('pointerup',100,100);assert.equal(t.state().roll.direction,1);
 t.reset();send('pointerdown',100,100);clock+=120;send('pointermove',200,100);send('pointerup',200,100);assert.equal(t.state().roll.direction,-1);
 t.reset();send('pointerdown',100,100);clock+=600;send('pointermove',200,100);send('pointerup',200,100);assert.equal(t.state().roll,null);
 t.reset();send('pointerdown',100,100);clock+=100;send('pointercancel',200,100);send('pointerup',200,100);assert.equal(t.state().roll,null);
 console.log('PASS: double tap toggles stance, flicks roll left/right, slow drag does not roll, cancelled gestures do not roll.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
