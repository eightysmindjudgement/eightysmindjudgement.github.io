// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 const hook=`globalThis.test={start,reset,enemyType,addEnemy,moveEnemy,updateGates,gates,enemies,player,gateGap,createBoss,state:()=>({life,gateWave}),enter:()=>{midbossDone=true;time=42},expose:()=>invulnerable=0};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();assert.equal(t.enemyType(8,.15),5);assert.equal(t.enemyType(8,.3),6);
 t.addEnemy();const e=t.enemies[0];e.type=5;const initial=e.mesh.position.clone();t.moveEnemy(e,.2,1);assert.ok(e.mesh.position.x!==initial.x&&e.mesh.position.y!==initial.y,'diagonal movement uses both axes');
 for(let i=0;i<1000;i++){t.moveEnemy(e,.02,1);assert.ok(Math.abs(e.mesh.position.x)<=7&&Math.abs(e.mesh.position.y)<=4.2,'diagonal bounces remain bounded')}
 e.type=6;e.mesh.position.z=-100;e.baseX=5;e.baseY=-3;e.aimX=0;e.aimY=1;const spin=e.mesh.rotation.z;t.moveEnemy(e,105/27,1);
 assert.ok(Math.abs(e.mesh.position.x)<1e-8&&Math.abs(e.mesh.position.y-1)<1e-8,'shuriken approaches locked player position');assert.notEqual(e.mesh.rotation.z,spin);
 t.updateGates(0);assert.equal(t.gates.length,0,'gates stay inside fortress');t.enter();t.updateGates(0);assert.equal(t.gates[0].axis,'y');
 const gate=t.gates[0];
 for(const axis of ['x','y']){gate.axis=axis;gate.mesh.userData.axis=axis;for(let i=0;i<180;i++){gate.age=i*.1;gate.mesh.position.z=5;t.player.position.set(0,0,5);t.expose();const life=t.state().life;t.updateGates(0);assert.equal(t.state().life,life,'center is always safe through both gate orientations');assert.ok(gate.gap>=2.3-1e-8)}}
 gate.axis='x';gate.mesh.userData.axis='x';gate.age=3*Math.PI/2/1.7;gate.mesh.position.z=4;t.player.position.x=4;t.expose();t.updateGates(.1);assert.equal(t.state().life,2,'closed panel damages outside central gap');
 t.createBoss('raider');assert.equal(t.gates.length,0);t.reset();assert.equal(t.gates.length,0);assert.equal(t.state().gateWave,0);
 console.log('PASS: new enemy selection, diagonal movement/bounces, spinning aimed rush, fortress-only gates, guaranteed central passage over full cycles, panel collision and cleanup.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
