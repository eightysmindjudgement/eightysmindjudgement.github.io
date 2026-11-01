// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const backgroundCalls=[];const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(...args){backgroundCalls.push(args)}})};

 const hook=`globalThis.test={STAGE,start,update,updateLasers,createBoss,faceAttack,bossHit,updateBoss,reset,pause,player,lasers,beginEnding,dismiss:()=>{bossIntro=midbossNotice=0;presentationTick=false},state:()=>({mode,time,boss,midbossDone,fortressBossDone,serpentDone,bullets:bullets.length,score,kills,life}),setTime:n=>time=n,shield:()=>invulnerable=999,expose:()=>invulnerable=0,strike:()=>{bossIntro=midbossNotice=0;presentationTick=false;shoot();for(const s of shots)s.mesh.position.copy(boss.mesh.position);update(.001)},kill:()=>{bossIntro=midbossNotice=0;presentationTick=false;boss.hp=1;shoot();for(const s of shots)s.mesh.position.copy(boss.mesh.position);update(.001)}};`;
 const code=fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook);
 vm.runInNewContext(code,sandbox);const t=sandbox.test;assert.deepEqual(Array.from([t.STAGE.midboss,t.STAGE.fortressBoss-t.STAGE.midboss,t.STAGE.serpent-t.STAGE.fortressBoss,t.STAGE.boss-t.STAGE.serpent]),[36,36,36,36],'boss encounters are evenly spaced in stage time');assert.equal(t.STAGE.serpent-t.STAGE.interior,18,'deep area has a proper approach before its boss');t.start();t.shield();t.setTime(36);t.update(.01);
 assert.equal(t.state().boss.kind,'mid');assert.equal(backgroundCalls.at(-1)[2],false,'fortress remains closed during gatekeeper fight');const time=t.state().time;
 t.update(1);assert.equal(t.state().time,time);
 t.state().boss.elapsed=2.5;t.updateBoss(0,1);
 assert.ok(Math.abs(Math.abs(t.state().boss.mesh.rotation.z)-Math.PI/2)<1e-8,'gatekeeper holds a vertical bank');
 assert.ok(t.state().boss.hitX<1.2&&t.state().boss.hitY>4,'bank changes the shot target shape');
 t.state().boss.elapsed=4;t.updateBoss(0,1);assert.equal(t.state().boss.mesh.rotation.z,0,'gatekeeper returns to level flight');
 t.kill();assert.equal(t.state().boss,null);
 assert.equal(t.state().mode,'playing');assert.equal(t.state().midbossDone,true);assert.equal(backgroundCalls.at(-1)[2],true,'fortress opens only after defeat');assert.equal(el('if-sector').textContent,'02 / FORTRESS');assert.ok(el('if-announcement-text').textContent.includes('FORTRESS ENTRY'));assert.equal(t.state().score,3000);
 t.update(2);t.update(3);assert.ok(t.state().time>time);assert.equal(t.state().boss,null);
 t.setTime(72);t.update(.01);assert.equal(t.state().boss.kind,'raider');assert.equal(t.state().boss.hp,5,'fortress boss takes five one-damage hits');assert.equal(t.state().boss.max,5);assert.equal(el('if-sector').textContent,'FORTRESS BOSS');
 t.strike();assert.equal(t.state().boss.hp,5,'arrival is protected from preemptive shots');
 const fortressTime=t.state().time;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let i=0;i<600;i++){t.update(1/60);const p=t.state().boss.mesh.position;minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}
 assert.equal(t.state().time,fortressTime,'stage clock waits for fortress boss defeat');
 assert.ok(maxX-minX>9&&maxY-minY>5,'fast wide movement across both axes');
 assert.ok(t.state().bullets>0&&t.state().bullets<=3,'sparse single shots');
 assert.equal(t.state().boss.radius,1.3,'small target');
 t.strike();assert.equal(t.state().boss.hp,4,'two simultaneous projectiles count as one hit');
 t.strike();assert.equal(t.state().boss.hp,4,'rapid follow-up shots cannot bypass the hit interval');
 for(let hit=2;hit<=4;hit++){t.updateBoss(.46,1);t.strike();assert.equal(t.state().boss.hp,5-hit,'boss survives until the fifth distinct hit')}
 t.updateBoss(.46,1);t.strike();assert.equal(t.state().boss,null);assert.equal(t.state().fortressBossDone,true);assert.equal(t.state().mode,'playing');assert.equal(t.state().score,6600);assert.ok(el('if-announcement-text').textContent.includes('SILVER WISP DOWN'));
 t.update(2);t.update(.1);assert.equal(t.state().boss,null,'fortress boss does not respawn');assert.ok(t.state().time>fortressTime);
 t.update(2);t.setTime(108);t.update(.01);assert.equal(t.state().boss.kind,'serpent');assert.equal(el('if-boss-intro-en').textContent,'JADE SERPENT');
 const serpentTime=t.state().time;t.state().boss.mesh.position.set(0,0,-26);t.update(3);t.update(.02);
 assert.equal(t.state().time,serpentTime,'clock waits for serpent defeat');assert.equal(t.state().boss.hitTargets.length,1);
 const segment=t.state().boss.mesh.userData.segments[5].mesh;const oldX=segment.position.x;t.updateBoss(.2,1);assert.notEqual(segment.position.x,oldX,'body snakes through space');
 t.state().boss.attack=0;t.updateBoss(.01,1);assert.equal(t.state().bullets,3,'serpent fires a three-shot fan');
 t.state().boss.hitCooldown=0;t.kill();assert.equal(t.state().boss,null);assert.equal(t.state().serpentDone,true);assert.equal(t.state().mode,'playing');assert.ok(el('if-announcement-text').textContent.includes('JADE SERPENT DOWN'));
 t.update(.1);assert.equal(t.state().boss,null,'serpent stays defeated');
 t.update(2);t.setTime(144);t.update(.01);assert.equal(t.state().boss.kind,'final');
 t.dismiss();t.state().boss.mesh.position.set(0,0,-26);
 for(const [index,kind,count] of [[0,'eyes',2],[1,'nose',3],[2,'mouth',1]]){
  t.faceAttack();assert.equal(t.lasers.length,count);assert.equal(t.lasers[0].kind,kind);
  const beam=t.lasers[0],q=(t.player.position.z-beam.origin.z)/(beam.end.z-beam.origin.z);
  t.player.position.x=beam.origin.x+(beam.end.x-beam.origin.x)*q;t.player.position.y=beam.origin.y+(beam.end.y-beam.origin.y)*q;
  t.expose();const life=t.state().life;assert.equal(beam.charge,.2,'target lock has a 0.2-second firing delay');t.updateLasers(.199);assert.equal(t.state().life,life,'beams are harmless before 0.2 seconds');t.updateLasers(.002);assert.equal(t.state().life,life-1,'beams damage after the 0.2-second delay');assert.equal(beam.marker.material.opacity,.95,'target marker becomes active on firing');t.shield();
  if(index<2){t.state().boss.pattern=index+1;t.updateLasers(3);assert.equal(t.lasers.length,0)}
 }
 // Last hit may end the game; restarting must remove every beam and restore stage flags.
 t.reset();assert.equal(t.lasers.length,0);assert.equal(t.state().midbossDone,false);assert.equal(t.state().fortressBossDone,false);assert.equal(t.state().serpentDone,false);
 
 t.start();t.createBoss();t.dismiss();t.shield();t.state().boss.mesh.position.set(0,0,-26);
 t.bossHit(t.player.position);assert.ok(t.state().boss.hitFlash>0);assert.equal(t.state().boss.hitMaterials[0].material.emissive.getHex(),0xffd9a3);
 t.updateBoss(.3,1);assert.equal(t.state().boss.hitFlash,0);assert.equal(t.state().boss.hitMaterials[0].material.emissive.getHex(),t.state().boss.hitMaterials[0].color.getHex());
 t.state().boss.pattern=2;t.faceAttack();const fading=t.lasers[0];fading.age=fading.charge+fading.duration+.2;
 t.expose();const lives=t.state().life;t.updateLasers(0);assert.equal(t.state().life,lives,'fading light is harmless');
 assert.ok(fading.mesh.userData.segments[15].core.material.opacity<fading.mesh.userData.segments[5].core.material.opacity,'distant tail fades');
 assert.equal(fading.marker.material.opacity,0);t.updateLasers(.3);assert.equal(t.lasers.length,0);
 t.start();t.createBoss();t.shield();t.state().boss.mesh.position.set(0,0,-26);t.kill();assert.equal(t.state().mode,'ending');assert.equal(t.state().score,6000);assert.equal(t.lasers.length,0);
 console.log('PASS: gatekeeper and fast fortress boss timing, sparse fire, defeat/resume, paused stage clock, midboss defeat/resume, final spawn, three distinct laser patterns, 0.2-second target-lock delay, beam damage/expiry, reset and final ending.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
