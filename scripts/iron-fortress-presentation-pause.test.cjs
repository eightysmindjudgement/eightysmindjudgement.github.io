// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const backgroundTicks=[];const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(dt){backgroundTicks.push(dt)}})};

 const hook=`globalThis.test={start,reset,update,updateBoss,createBoss,shoot,shots,bullets,particles,keys,player,enemyBullet,state:()=>({boss,bossIntro,midbossNotice,time}),notice:()=>{midbossNotice=2;quietCombat();ui('if-announcement').hidden=false},dismiss:()=>{bossIntro=midbossNotice=0;presentationTick=false},shield:()=>invulnerable=999,shotAt:p=>{shoot();for(const shot of shots)shot.mesh.position.copy(p);update(.001)}};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();t.shield();t.shoot();t.enemyBullet(t.player.position.clone(),t.player.position.clone().setZ(20));t.createBoss('serpent');
 assert.equal(t.shots.length,0);assert.equal(t.bullets.length,0,'entry clears existing fire');
 const z=t.state().boss.mesh.position.z;t.keys.add('Space');t.keys.add('KeyD');t.shoot();assert.equal(t.shots.length,0);
 t.update(1);assert.ok(t.state().boss.mesh.position.z>z,'boss keeps approaching during title');assert.ok(t.player.position.x>0,'player keeps moving');assert.ok(backgroundTicks.at(-1)>0,'background keeps advancing');assert.equal(t.shots.length,0);assert.equal(t.bullets.length,0);
 t.update(2.01);t.update(.02);assert.ok(t.shots.length>0,'fire resumes after title');t.keys.clear();
 t.start();t.shield();t.shoot();t.enemyBullet(t.player.position.clone(),t.player.position.clone().setZ(20));t.notice();assert.equal(t.shots.length,0);assert.equal(t.bullets.length,0);
 const clock=t.state().time;t.keys.add('Space');t.update(1);assert.ok(t.state().time>clock,'stage banner does not freeze progress');assert.ok(backgroundTicks.at(-1)>0);assert.equal(t.shots.length,0);assert.equal(t.bullets.length,0);t.keys.clear();
 t.start();t.shield();t.createBoss('serpent');t.dismiss();t.state().boss.mesh.position.z=-18;
 let maxCoil=0,minCoil=1;
 for(let i=0;i<600;i++){t.updateBoss(.025,1);const boss=t.state().boss;maxCoil=Math.max(maxCoil,boss.mesh.userData.coilMix);minCoil=Math.min(minCoil,boss.mesh.userData.coilMix);for(const seg of boss.mesh.userData.segments){const p=boss.mesh.localToWorld(seg.mesh.position.clone());assert.ok(Math.abs(p.x)+seg.radius<=7+.001,'body stays inside course width');assert.ok(Math.abs(p.y)+seg.radius<=5+.001,'body stays inside course height')}}
 assert.ok(maxCoil>.99&&minCoil<.01,'movement blends between snake and coiled poses');assert.equal(t.state().boss.hitTargets.length,1);
 const boss=t.state().boss,body=boss.mesh.userData.segments[20].mesh,bodyPoint=boss.mesh.localToWorld(body.position.clone()),hp=boss.hp,particles=t.particles.length;
 t.shotAt(bodyPoint);assert.equal(boss.hp,hp);assert.equal(boss.hitFlash,0);assert.equal(t.particles.length,particles);
 const bodyMaterial=body.children[0].material,bodyEmissive=bodyMaterial.emissive.getHex();boss.hitCooldown=0;t.shotAt(boss.mesh.position.clone());assert.equal(boss.hp,hp-1);assert.ok(boss.hitFlash>0);assert.equal(bodyMaterial.emissive.getHex(),bodyEmissive);
 console.log('PASS: moving noncombat titles, cleared fire, firing resumes, stage progress and background continue, serpent stays in course and coils, head-only damage/effects.');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1});
