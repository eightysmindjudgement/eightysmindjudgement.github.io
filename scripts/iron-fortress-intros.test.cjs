// Deterministic logic checks with real Three.js objects and mocked DOM/audio devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
async function run(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},clientWidth:720,clientHeight:510});return elements.get(id)};
 const root=el('root');root.querySelector=s=>el(s.slice(1));root.querySelectorAll=()=>[];
 const sounds=[];class AudioContext{constructor(){this.state='suspended';this.currentTime=0;this.destination={}}resume(){this.state='running';return Promise.resolve()}createOscillator(){return {type:'',frequency:{setValueAtTime(f){sounds.push(f)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}close(){this.state='closed';return Promise.resolve()}}
 const sandbox={console,AbortController,performance,Math,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},window:{AudioContext,addEventListener(){}},document:{querySelector:()=>root,addEventListener(){},createElement:()=>({getContext:()=>({fillText(){}})})},makeView:T=>({scene:new T.Scene(),camera:new T.PerspectiveCamera(),renderer:{render(){}},resize(){},background(){}})};

 const hook=`globalThis.test={start,reset,update,updateBoss,createBoss,pause,state:()=>({boss,bossIntro,mode}),shield:()=>invulnerable=999};`;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../games/iron-fortress/game.js'),'utf8').replace('view=createScene(canvas)','view=globalThis.makeView(T)').replace('/* IRON_FORTRESS_TEST_POINT */',hook),sandbox);
 const t=sandbox.test;
 for(const [kind,en,ja] of [['mid','IRON WARDEN','アイアン・ウォーデン'],['raider','SILVER WISP','シルバー・ウィスプ'],['serpent','JADE SERPENT','ジェイド・サーペント'],['final','HARD ROCK OJISAN X','ハードロックおじさんエックス']]){
  t.start();t.shield();t.createBoss(kind);assert.equal(el('if-boss-intro').hidden,false);assert.equal(t.state().bossIntro,3);
  assert.equal(el('if-boss-intro-en').textContent,en);assert.equal(el('if-boss-intro-ja').textContent,ja);
  t.update(2.99);assert.equal(el('if-boss-intro').hidden,false);t.update(.011);assert.equal(el('if-boss-intro').hidden,true);
  assert.equal(el('if-boss-name').textContent,en);assert.equal(el('if-boss-reading').textContent,ja);
 }
 t.start();t.createBoss('raider');t.updateBoss(.02,1);
 for(let i=0;i<400;i++){const old=t.state().boss.mesh.position.clone();t.updateBoss(.02,1);const p=t.state().boss.mesh.position;assert.ok(Math.abs(p.x-old.x)/.02<10.26);assert.ok(Math.abs(p.y-old.y)/.02<7.62)}
 t.reset();assert.equal(el('if-boss-intro').hidden,true);assert.equal(t.state().bossIntro,0);
 console.log('PASS: all four bilingual boss intros last 3 seconds, HUD readings/final name, slower raider movement and reset cleanup.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
