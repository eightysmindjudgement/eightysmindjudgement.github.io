import {DIFFICULTIES,ENEMIES,WEAPON,STAGE,clamp,readBest,saveBest} from './config.js';
import {T,createScene,ship,markPlayer,bossModel,obstacle,bolt,spark} from './scene.js';
import {Audio} from './audio.js';

const root=document.querySelector('#iron-fortress');
const ui=id=>root.querySelector('#'+id);
const canvas=ui('if-canvas'),audio=new Audio(),events=new AbortController();
const on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:events.signal});
let view,player,raf,last=0,mode='title',level='NORMAL',cfg=DIFFICULTIES.NORMAL;
let time=0,score=0,kills=0,life=3,best=0,invulnerable=0,shot=0,spawn=0,rocks=0,wave=0,boss=null;
const enemies=[],shots=[],bullets=[],particles=[],keys=new Set();
let firePointer=null,drag=null,target=new T.Vector2(),bounds={x:7,y:5};
function remove(list,item){const i=list.indexOf(item);if(i<0)return;list.splice(i,1);view.scene.remove(item.mesh);item.mesh.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose()})}
function clearInput(){keys.clear();firePointer=null;drag=null;ui('if-fire').classList.remove('active')}
function hud(){ui('if-score').textContent=score;ui('if-best').textContent=best;ui('if-kills').textContent=kills;ui('if-life').textContent='♥'.repeat(Math.max(0,life));ui('if-sector').textContent=boss?'BOSS':time>=STAGE.interior?'03 / CORE':time>=STAGE.fortress?'02 / FORTRESS':'01 / APPROACH';ui('if-progress').value=Math.min(100,time);ui('if-boss').hidden=!boss;if(boss)ui('if-boss-hp').value=boss.hp/boss.max}
function show(title,copy){ui('if-overlay').hidden=false;ui('if-title').textContent=title;ui('if-copy').textContent=copy;ui('if-difficulty').hidden=mode!=='title';ui('if-start').textContent=mode==='title'?'START':mode==='paused'?'RESUME':'RETRY';ui('if-home').hidden=mode==='title';ui('if-pause').disabled=mode!=='playing'&&mode!=='paused';if(view)resize()}
function record(){if(score>best){best=score;saveBest(level,best)}}
function reset(){clearInput();for(const list of [enemies,shots,bullets,particles])for(const e of [...list])remove(list,e);if(boss){remove([boss],boss);boss=null}time=score=kills=invulnerable=shot=wave=0;life=3;spawn=1;rocks=5;target.set(0,0);player.position.set(0,0,5);player.rotation.set(0,0,0);player.visible=true;ui('if-warning').textContent='';view.background(0,0);root.classList.remove('damaged');best=readBest(level);hud()}
function start(){audio.unlock();reset();mode='playing';ui('if-overlay').hidden=true;ui('if-pause').disabled=false;resize();canvas.focus()}
function finish(clear){mode=clear?'clear':'over';record();clearInput();audio.play(clear?'clear':'over');hud();show(clear?'STAGE CLEAR':'GAME OVER',`SCORE ${score}  ·  BEST ${best}  ·  DESTROYED ${kills}`)}
function pause(){if(mode==='playing'){mode='paused';clearInput();show('PAUSED','ひと休み。RESUMEで再開 / Resume when ready.')}else if(mode==='paused'){mode='playing';ui('if-overlay').hidden=true;resize();canvas.focus()}}
function damage(){if(invulnerable>0||mode!=='playing')return;life--;invulnerable=1.6;audio.play('damage');root.classList.add('damaged');if(life<=0)finish(false)}
function burst(pos,count=12){audio.play('hit');for(let i=0;i<count&&particles.length<100;i++){const mesh=spark();mesh.position.copy(pos);view.scene.add(mesh);particles.push({mesh,ttl:.65,velocity:new T.Vector3((Math.random()-.5)*10,(Math.random()-.5)*10,(Math.random()-.5)*10)})}}
function addEnemy(){if(enemies.length>=20)return;const type=wave++%3,data=ENEMIES[type],mesh=ship(data.color,type);mesh.rotation.y=Math.PI;const x=Math.sin(wave*2.4)*bounds.x*.8,y=Math.cos(wave*1.7)*3.5;mesh.position.set(x,y,-100);view.scene.add(mesh);enemies.push({mesh,type,hp:Math.max(1,Math.ceil(data.hp*cfg.hp)),radius:data.radius,score:data.score,baseX:x,phase:wave,attack:cfg.attack})}
function addRock(){if(enemies.length>=20)return;const mesh=obstacle();mesh.position.set(Math.sin(wave*1.6)*bounds.x*.8,Math.cos(wave*2.1)*3.5,-100);view.scene.add(mesh);enemies.push({mesh,type:3,radius:1.65,hp:Infinity})}
function enemyBullet(pos,aim){if(bullets.length>=90)return;const mesh=bolt(0xff6658,.3);mesh.position.copy(pos);view.scene.add(mesh);const velocity=aim.clone().sub(pos).normalize().multiplyScalar(cfg.bullet);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),velocity.clone().normalize());bullets.push({mesh,velocity})}
function shoot(){if(shots.length>=70)return;audio.play('laser');for(const x of [-.35,.35]){const mesh=bolt(0x64f6ff);mesh.position.copy(player.position);mesh.position.x+=x;mesh.position.z-=2;view.scene.add(mesh);shots.push({mesh})}}
function createBoss(){const mesh=bossModel();mesh.rotation.y=Math.PI;mesh.position.set(0,0,-65);view.scene.add(mesh);const hp=Math.ceil(100*cfg.hp);boss={mesh,hp,max:hp,radius:3.2,attack:3,pattern:0};ui('if-warning').textContent='WARNING · IRON WARDEN';audio.play('damage')}
function hit(a,b,r){return Math.abs(a.x-b.x)<r&&Math.abs(a.y-b.y)<r&&Math.abs(a.z-b.z)<2}
function update(dt){
 time+=dt;shot-=dt;invulnerable=Math.max(0,invulnerable-dt);player.visible=invulnerable===0||Math.floor(invulnerable*12)%2===0;if(invulnerable<1.3)root.classList.remove('damaged');
 const dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),dy=Number(keys.has('ArrowUp')||keys.has('KeyW'))-Number(keys.has('ArrowDown')||keys.has('KeyS'));
 target.x=clamp(target.x+dx*dt*9,-bounds.x,bounds.x);target.y=clamp(target.y+dy*dt*9,-bounds.y,bounds.y);const previous=player.position.x;player.position.x=T.MathUtils.damp(player.position.x,target.x,12,dt);player.position.y=T.MathUtils.damp(player.position.y,target.y,12,dt);player.rotation.z=T.MathUtils.damp(player.rotation.z,-(player.position.x-previous)/Math.max(dt,.001)*.055,8,dt);
 if((firePointer!==null||keys.has('Space'))&&shot<=0){shoot();shot=WEAPON.interval}
 if(time<STAGE.boss){spawn-=dt;if(spawn<=0){addEnemy();spawn=cfg.spawn}if(time>STAGE.fortress){rocks-=dt;if(rocks<=0){addRock();rocks=cfg.obstacle}}}else if(!boss)createBoss();
 for(const e of [...enemies]){e.mesh.position.z+=dt*cfg.speed;if(e.type===1)e.mesh.position.x=clamp(e.baseX+Math.sin(time*2+e.phase)*2,-bounds.x,bounds.x);if(e.type<3){e.attack-=dt;if(e.attack<=0&&e.mesh.position.z<0){enemyBullet(e.mesh.position,player.position);e.attack=cfg.attack}}if(hit(e.mesh.position,player.position,e.radius+.45)){damage();remove(enemies,e);if(mode!=='playing')return}else if(e.mesh.position.z>12)remove(enemies,e)}
 if(boss){boss.mesh.position.z=Math.min(-26,boss.mesh.position.z+dt*8);boss.mesh.position.x=Math.sin(time*.65)*bounds.x*.65;boss.mesh.position.y=Math.cos(time*.8)*2.7;boss.attack-=dt;const warning=boss.attack<1;ui('if-warning').textContent=warning?(boss.pattern%2?'WARNING · FAN SHOT':'WARNING · TARGET LOCK'):'';boss.mesh.children[0].material.emissive.setHex(warning?0x662211:0x000000);if(boss.attack<=0){const p=boss.mesh.position;const aim=player.position.clone();if(boss.pattern++%2){for(let i=-2;i<=2;i++)enemyBullet(p,new T.Vector3(i*3,aim.y,5))}else{for(const x of [-3,0,3])enemyBullet(p,new T.Vector3(aim.x+x,aim.y,5))}boss.attack=cfg.attack+1}}
 for(const s of [...shots]){const oldZ=s.mesh.position.z;s.mesh.position.z-=WEAPON.speed*dt;let victim=null;for(const e of [...enemies,...(boss?[boss]:[])]){const p=e.mesh.position;if(Math.abs(s.mesh.position.x-p.x)<e.radius&&Math.abs(s.mesh.position.y-p.y)<e.radius&&p.z<=oldZ+2&&p.z>=s.mesh.position.z-2){victim=e;break}}if(victim){remove(shots,s);victim.hp-=WEAPON.damage;if(victim.hp<=0){const p=victim.mesh.position.clone();burst(p,victim===boss?50:12);score+=Math.round((victim===boss?3000:victim.score)*cfg.multiplier);kills++;record();if(victim===boss){remove([boss],boss);boss=null;audio.play('boss');finish(true);return}else remove(enemies,victim)}}else if(s.mesh.position.z< -130)remove(shots,s)}
 for(const b of [...bullets]){b.mesh.position.addScaledVector(b.velocity,dt);if(hit(b.mesh.position,player.position,.65)){damage();remove(bullets,b);if(mode!=='playing')return}else if(b.mesh.position.z>14||Math.abs(b.mesh.position.x)>40||Math.abs(b.mesh.position.y)>30)remove(bullets,b)}
 animateParticles(dt);
 view.background(dt,time);hud();
}
function resize(){view.resize();const aspect=canvas.clientWidth/canvas.clientHeight;bounds.x=Math.min(7,aspect*6.2);target.x=clamp(target.x,-bounds.x,bounds.x)}
function animateParticles(dt){for(const p of [...particles]){p.ttl-=dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.scale.setScalar(Math.max(.01,p.ttl*2));if(p.ttl<=0)remove(particles,p)}}
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;try{if(mode==='playing')update(dt);else if(mode==='clear'||mode==='over')animateParticles(dt);view.renderer.render(view.scene,view.camera);raf=requestAnimationFrame(frame)}catch(e){fail(e)}}
function fail(error){mode='error';clearInput();cancelAnimationFrame(raf);ui('if-start').hidden=true;ui('if-home').hidden=true;ui('if-pause').disabled=true;show('起動できませんでした','WebGL対応のブラウザで再読み込みしてください。 / Please reload in a WebGL-capable browser.');console.error('IRON FORTRESS',error)}
try{
 view=createScene(canvas);player=ship();markPlayer(player);player.position.z=5;view.scene.add(player);resize();best=readBest(level);hud();show('IRON FORTRESS','宇宙を抜け、機械要塞の核を撃て。 / Break through the fleet. Destroy the fortress core.');
 on(ui('if-start'),'click',()=>mode==='paused'?pause():start());on(ui('if-home'),'click',()=>{mode='title';reset();show('IRON FORTRESS','難易度を選んで出撃 / Choose your difficulty and launch.')});
 for(const b of root.querySelectorAll('[data-difficulty]'))on(b,'click',()=>{level=b.dataset.difficulty;cfg=DIFFICULTIES[level];for(const other of root.querySelectorAll('[data-difficulty]'))other.setAttribute('aria-pressed',String(other===b));best=readBest(level);hud()});
 on(ui('if-pause'),'click',pause);on(ui('if-mute'),'click',()=>{audio.unlock();audio.muted=!audio.muted;ui('if-mute').textContent=audio.muted?'SOUND OFF':'SOUND ON';ui('if-mute').setAttribute('aria-pressed',String(audio.muted))});
 on(canvas,'pointerdown',e=>{if(mode!=='playing'||drag)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx:target.x,ty:target.y}});
 on(canvas,'pointermove',e=>{if(!drag||e.pointerId!==drag.id||mode!=='playing')return;target.x=clamp(drag.tx+(e.clientX-drag.x)/canvas.clientWidth*bounds.x*2.4,-bounds.x,bounds.x);target.y=clamp(drag.ty-(e.clientY-drag.y)/canvas.clientHeight*12,-bounds.y,bounds.y)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])on(canvas,name,e=>{if(drag?.id===e.pointerId)drag=null});
 on(ui('if-fire'),'pointerdown',e=>{if(mode!=='playing'||firePointer!==null)return;e.preventDefault();firePointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.classList.add('active');audio.unlock()});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])on(ui('if-fire'),name,e=>{if(e.pointerId===firePointer){firePointer=null;ui('if-fire').classList.remove('active')}});
 on(root,'keydown',e=>{if(e.target!==canvas)return;if(e.code==='Escape'){e.preventDefault();pause();return}if(mode==='playing'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)){e.preventDefault();keys.add(e.code)}});on(window,'keyup',e=>keys.delete(e.code));on(canvas,'blur',()=>keys.clear());
 on(window,'resize',resize);on(window,'blur',()=>{if(mode==='playing')pause();clearInput()});on(document,'visibilitychange',()=>{if(document.hidden){if(mode==='playing')pause();clearInput()}});
 on(canvas,'webglcontextlost',e=>{e.preventDefault();fail(new Error('WebGL context lost'))});
 on(window,'pagehide',e=>{clearInput();if(mode==='playing')pause();if(!e.persisted){cancelAnimationFrame(raf);events.abort();view.scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat()){m.map?.dispose();m.dispose()}});view.renderer.dispose();audio.dispose()}});
 raf=requestAnimationFrame(frame);
}catch(error){fail(error)}
