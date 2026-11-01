// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 const hook=`globalThis.test={start,reset,createBoss,updateCrossLasers,player,crossLasers,state:()=>({life,mode,crossLaserWave}),setTime:n=>time=n,enter:()=>midbossDone=true,startLife:()=>life=3,expose:()=>invulnerable=0};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();t.setTime(46);t.updateCrossLasers(0);assert.equal(t.crossLasers.length,0,'no fortress hazard before gatekeeper defeat');
 t.enter();t.updateCrossLasers(0);assert.equal(t.crossLasers.length,1);assert.equal(t.crossLasers[0].mesh.position.y,2);
 t.updateCrossLasers(0);assert.equal(t.crossLasers.length,1,'wave spawns once');
 t.player.position.y=2;t.crossLasers[0].mesh.position.z=4;t.expose();t.updateCrossLasers(.1);assert.equal(t.state().life,2,'crossing the bright horizontal core damages');
 t.updateCrossLasers(1);assert.equal(t.crossLasers.length,0);
 t.setTime(51);t.updateCrossLasers(0);assert.equal(t.crossLasers[0].mesh.position.y,-2);
 t.crossLasers[0].mesh.position.z=4;t.expose();t.updateCrossLasers(.1);assert.equal(t.state().life,2,'opposite lane is safe');
 t.updateCrossLasers(1);t.setTime(56);t.updateCrossLasers(0);assert.equal(t.crossLasers[0].mesh.position.y,2);assert.equal(t.state().crossLaserWave,3);
 t.updateCrossLasers(4);t.setTime(63);t.updateCrossLasers(0);assert.equal(t.crossLasers.length,0,'exactly three waves');
 t.startLife();
 for(const [time,side] of [[80,1],[85,-1],[90,1]]){
 t.setTime(time);t.updateCrossLasers(0);assert.equal(t.crossLasers.length,1);const beam=t.crossLasers[0];assert.equal(beam.axis,'x');assert.equal(Math.sign(beam.mesh.position.x),side);assert.equal(beam.mesh.rotation.z,Math.PI/2);
 t.player.position.x=0;t.player.position.y=0;beam.mesh.position.z=4;t.expose();const life=t.state().life;t.updateCrossLasers(.1);assert.equal(t.state().life,life,'vertical laser leaves the opposite lane safe');
 t.player.position.x=beam.mesh.position.x;beam.mesh.position.z=4;t.expose();t.updateCrossLasers(.1);assert.equal(t.state().life,life-1,'vertical core damages along x');
 t.updateCrossLasers(1);
 // Restore life for testing all three later hazards.
 t.startLife();
 }
 assert.equal(t.state().crossLaserWave,6);
 t.createBoss('raider');assert.equal(t.crossLasers.length,0);t.updateCrossLasers(1);assert.equal(t.crossLasers.length,0);
 t.reset();assert.equal(t.state().crossLaserWave,0);assert.equal(t.crossLasers.length,0);
 console.log('PASS: fortress gate, timed upper/lower/upper sequence, no duplicate waves, swept collision, safe lane, expiry and boss/reset cleanup.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
