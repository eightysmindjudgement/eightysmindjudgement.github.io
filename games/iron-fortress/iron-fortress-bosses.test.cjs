// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const backgroundCalls=[];const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(...args){backgroundCalls.push(args)}})};

 const hook=`globalThis.test={start,update,updateLasers,createBoss,faceAttack,bossHit,updateBoss,reset,pause,player,lasers,beginEnding,state:()=>({mode,time,boss,midbossDone,score,kills,life}),setTime:n=>time=n,shield:()=>invulnerable=999,expose:()=>invulnerable=0,kill:()=>{boss.hp=1;shoot();for(const s of shots)s.mesh.position.copy(boss.mesh.position);update(.001)}};`;
 const code=fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook);
 vm.runInNewContext(code,sandbox);const t=sandbox.test;t.start();t.shield();t.setTime(36);t.update(.01);
 assert.equal(t.state().boss.kind,'mid');assert.equal(backgroundCalls.at(-1)[2],false,'fortress remains closed during gatekeeper fight');const time=t.state().time;
 t.update(1);assert.equal(t.state().time,time);t.kill();assert.equal(t.state().boss,null);
 assert.equal(t.state().mode,'playing');assert.equal(t.state().midbossDone,true);assert.equal(backgroundCalls.at(-1)[2],true,'fortress opens only after defeat');assert.equal(el('if-sector').textContent,'02 / FORTRESS');assert.ok(el('if-announcement').textContent.includes('FORTRESS ENTRY'));assert.equal(t.state().score,3000);
 t.update(3);assert.ok(t.state().time>time);assert.equal(t.state().boss,null);
 t.setTime(100);t.update(.01);assert.equal(t.state().boss.kind,'final');
 t.state().boss.mesh.position.set(0,0,-26);
 for(const [index,kind,count] of [[0,'eyes',2],[1,'nose',3],[2,'mouth',1]]){
  t.faceAttack();assert.equal(t.lasers.length,count);assert.equal(t.lasers[0].kind,kind);
  const beam=t.lasers[0],q=(t.player.position.z-beam.origin.z)/(beam.end.z-beam.origin.z);
  t.player.position.x=beam.origin.x+(beam.end.x-beam.origin.x)*q;t.player.position.y=beam.origin.y+(beam.end.y-beam.origin.y)*q;
  t.expose();const life=t.state().life;t.updateLasers(.5);assert.equal(t.state().life,life,'charging beams are harmless');
  t.updateLasers(.76);assert.equal(t.state().life,life-1,'active beams damage');t.shield();
  if(index<2){t.state().boss.pattern=index+1;t.updateLasers(3);assert.equal(t.lasers.length,0)}
 }
 // Last hit may end the game; restarting must remove every beam and restore stage flags.
 t.reset();assert.equal(t.lasers.length,0);assert.equal(t.state().midbossDone,false);
 
 t.start();t.createBoss();t.shield();t.state().boss.mesh.position.set(0,0,-26);
 t.bossHit(t.player.position);assert.ok(t.state().boss.hitFlash>0);assert.equal(t.state().boss.hitMaterials[0].material.emissive.getHex(),0xffd9a3);
 t.updateBoss(.3,1);assert.equal(t.state().boss.hitFlash,0);assert.equal(t.state().boss.hitMaterials[0].material.emissive.getHex(),t.state().boss.hitMaterials[0].color.getHex());
 t.state().boss.pattern=2;t.faceAttack();const fading=t.lasers[0];fading.age=fading.charge+fading.duration+.2;
 t.expose();const lives=t.state().life;t.updateLasers(0);assert.equal(t.state().life,lives,'fading light is harmless');
 assert.ok(fading.mesh.userData.segments[15].core.material.opacity<fading.mesh.userData.segments[5].core.material.opacity,'distant tail fades');
 assert.equal(fading.marker.material.opacity,0);t.updateLasers(.3);assert.equal(t.lasers.length,0);
 t.start();t.createBoss();t.shield();t.state().boss.mesh.position.set(0,0,-26);t.kill();assert.equal(t.state().mode,'ending');assert.equal(t.state().score,6000);assert.equal(t.lasers.length,0);
 console.log('PASS: midboss timing, paused stage clock, midboss defeat/resume, final spawn, three distinct laser patterns, charge safety, beam damage/expiry, reset and final ending.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
