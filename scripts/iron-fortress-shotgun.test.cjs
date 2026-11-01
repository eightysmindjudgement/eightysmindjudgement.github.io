// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 sandbox.Math=Object.create(Math);sandbox.Math.random=()=>.01;
 const hook=`globalThis.test={start,addEnemy,enemyType,fireEnemy,enemies,bullets,player};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;t.start();
 for(let i=0;i<3;i++){t.addEnemy();assert.notEqual(t.enemies.at(-1).type,4,'opening three enemies remain regular')}
 t.addEnemy();const shotgun=t.enemies.at(-1);assert.equal(shotgun.type,4);
 let rare=0;for(let i=0;i<1000;i++)if(t.enemyType(10,i/1000)===4)rare++;assert.equal(rare,80,'8 percent spawn probability');
 t.fireEnemy(shotgun);assert.equal(t.bullets.length,4);
 const expected=[[-3.8,-.6],[-.9,1.5],[1.5,-1.2],[4.7,.7]];
 t.bullets.forEach((b,i)=>{
  const seconds=(t.player.position.z-b.mesh.position.z)/b.velocity.z;
  const x=b.mesh.position.x+b.velocity.x*seconds-t.player.position.x,y=b.mesh.position.y+b.velocity.y*seconds-t.player.position.y;
  assert.ok(Math.abs(x-expected[i][0])<1e-8&&Math.abs(y-expected[i][1])<1e-8,'asymmetric target offsets');
  assert.equal(b.mesh.geometry.type,'SphereGeometry');assert.ok(Math.abs(b.velocity.length()-18)<1e-8);
 });
 while(t.bullets.length<88)t.bullets.push(t.bullets[0]);t.fireEnemy(shotgun);assert.equal(t.bullets.length,88,'skip a burst rather than emitting fewer than four pellets');
 console.log('PASS: rare spawn probability, safe opening, four simultaneous spherical pellets, asymmetric directions, speed and all-or-nothing bullet cap.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
