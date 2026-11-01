// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 const hook=`globalThis.test={start,reset,updateEnergy,createBoss,energyItems,player,ready:()=>{serpentDone=true;time=STAGE.energy},setLife:n=>life=n,state:()=>({life,energySpawned,damageBlink})};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();t.updateEnergy(0);assert.equal(t.energyItems.length,0,'no early pickup');t.ready();t.setLife(2);t.updateEnergy(0);assert.equal(t.energyItems.length,1);
 assert.ok(t.energyItems[0].mesh.userData.orb.material.transparent);assert.ok(t.energyItems[0].mesh.children.some(o=>o.isSprite),'small ENERGY label is billboarded below item');
 const startZ=t.energyItems[0].mesh.position.z;t.player.position.x=5;t.updateEnergy(1);assert.ok(t.energyItems[0].mesh.position.z>startZ);assert.notEqual(t.energyItems[0].mesh.position.y,0);
 t.player.position.x=0;t.energyItems[0].mesh.position.z=4;t.updateEnergy(.2);assert.equal(t.state().life,3);assert.equal(t.state().damageBlink,0);assert.equal(t.energyItems.length,0);
 t.updateEnergy(0);assert.equal(t.energyItems.length,0,'one pickup per run');
 t.start();t.ready();t.updateEnergy(0);t.energyItems[0].mesh.position.z=4;t.updateEnergy(.2);assert.equal(t.state().life,3,'life capped at three');
 t.start();t.ready();t.updateEnergy(0);t.player.position.x=5;t.energyItems[0].mesh.position.z=14;t.updateEnergy(.1);assert.equal(t.energyItems.length,0,'missed pickup expires');
 t.start();t.ready();t.updateEnergy(0);t.createBoss();assert.equal(t.energyItems.length,0,'boss entry clears missed pickup');t.reset();assert.equal(t.state().energySpawned,false);
 console.log('PASS: late one-time spawn, pink transparency/label, float/drift, one-life healing, max-life cap, no damage flash, expiry and reset/boss cleanup.');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1});
