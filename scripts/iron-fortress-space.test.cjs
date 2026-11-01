// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 const hook=`globalThis.test={start,reset,update,createBoss,spaceScenery:__scene.spaceScenery,enemies,shield:()=>invulnerable=999,enter:()=>{midbossDone=true;time=36}};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();t.shield();
 for(let i=0;i<370;i++)t.update(1/60);assert.ok(t.enemies.some(e=>e.spaceRock),'approach spawns collidable rocks');
 const rock=t.enemies.find(e=>e.spaceRock);assert.equal(rock.type,3);assert.equal(rock.hp,Infinity);assert.ok(rock.mesh.rotation.x>0);
 t.createBoss('mid');assert.ok(!t.enemies.some(e=>e.spaceRock),'gatekeeper arrival clears rocks');
 for(let i=0;i<420;i++)t.update(1/60);assert.ok(!t.enemies.some(e=>e.spaceRock),'no space rock spawns during boss fight');
 t.start();t.shield();t.enter();for(let i=0;i<420;i++)t.update(1/60);assert.ok(!t.enemies.some(e=>e.spaceRock),'space rocks stop inside fortress');
 const scenery=t.spaceScenery(true);scenery.userData.update(0,0,false);const first=scenery.children[0],z=first.position.z;
 scenery.userData.update(1,1,false);assert.ok(first.position.z>z);assert.ok(scenery.visible);
 const count=scenery.children.length;scenery.userData.update(1,40,true);assert.equal(scenery.visible,false);assert.equal(scenery.children.length,count,'background reuses geometry');
 scenery.userData.update(0,0,false);assert.ok(scenery.visible);assert.equal(first.position.z,z,'retry resets background');
 console.log('PASS: approach rock spawning/rotation, boss/fortress exclusion, scenery movement, fortress hiding, bounded reuse and retry reset.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
