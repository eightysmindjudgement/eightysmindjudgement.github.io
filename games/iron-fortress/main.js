import {DIFFICULTIES,BOSS_NAMES,ENEMIES,EXTRA_ENEMIES,GATE_WAVES,gateGap,SHOTGUN_ENEMY,SHOTGUN_SPREAD,enemyType,FORTRESS_LASER_WAVES,WEAPON,STAGE,clamp,readBest,saveBest,LASER_FADE,laserRadius,laserDanger} from './config.js';
import {T,createScene,ship,markPlayer,bossModel,fortressBossModel,serpentBossModel,finalBossModel,laserModel,obstacle,bolt,pellet,crossLaser,energyModel,asteroidModel,shurikenModel,gateModel,poseGate,spark} from './scene.js';
import {Audio} from './audio.js';

const root=document.querySelector('#iron-fortress');
const ui=id=>root.querySelector('#'+id);
const canvas=ui('if-canvas'),audio=new Audio(),events=new AbortController();
const on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:events.signal});
let view,player,raf,last=0,mode='title',level='NORMAL',cfg=DIFFICULTIES.NORMAL;
let time=0,score=0,kills=0,life=3,best=0,invulnerable=0,damageBlink=0,shot=0,spawn=0,rocks=0,spaceRockTimer=6,wave=0,boss=null;
const enemies=[],shots=[],bullets=[],particles=[],keys=new Set();
let ending=null,midbossDone=false,fortressBossDone=false,serpentDone=false,midbossNotice=0,bossIntro=0,coreNoticeDone=false,presentationTick=false;
function presentationActive(){return bossIntro>0||midbossNotice>0||presentationTick}
function quietCombat(){for(const list of [shots,bullets])for(const item of [...list])remove(list,item);clearLasers();clearCrossLasers()}
const lasers=[],crossLasers=[],energyItems=[];
let energySpawned=false;
function clearEnergy(){for(const item of [...energyItems])remove(energyItems,item)}
function updateEnergy(dt){
 if(!energySpawned&&serpentDone&&!boss&&!presentationActive()&&time>=STAGE.energy&&time<STAGE.boss){
  const mesh=energyModel();mesh.position.set(0,0,-60);view.scene.add(mesh);energyItems.push({mesh,age:0});energySpawned=true;
 }
 for(const item of [...energyItems]){
  item.age+=dt;const previousZ=item.mesh.position.z;item.mesh.position.z+=dt*10;item.mesh.position.y=Math.sin(item.age*1.6)*.45;item.mesh.rotation.y+=dt*.8;
  item.mesh.userData.orb.material.opacity=.18+.07*Math.sin(item.age*4);
  if(!presentationActive()&&item.mesh.position.z>=player.position.z-1&&previousZ<=player.position.z+1&&Math.hypot(player.position.x-item.mesh.position.x,player.position.y-item.mesh.position.y)<1.1){
   life=Math.min(3,life+1);effect(item.mesh.position,'cure',6,.3);audio.play('cure');remove(energyItems,item);hud();
  }else if(item.mesh.position.z>14)remove(energyItems,item);
 }
}

let crossLaserWave=0,gateWave=0;
const gates=[];
function clearGates(){for(const gate of [...gates])remove(gates,gate)}
function updateGates(dt){
 if(midbossDone&&!boss){
  while(gateWave<GATE_WAVES.length&&time>=GATE_WAVES[gateWave].time){
   const wave=GATE_WAVES[gateWave++],mesh=gateModel(wave.axis);mesh.position.z=-70;view.scene.add(mesh);gates.push({mesh,axis:wave.axis,age:0,gap:gateGap(0)});
  }
 }
 for(const gate of [...gates]){
  gate.age+=dt;gate.gap=gateGap(gate.age);poseGate(gate.mesh,gate.gap);
  const oldZ=gate.mesh.position.z;gate.mesh.position.z+=dt*18;
  if(gate.mesh.position.z>=player.position.z-.8&&oldZ<=player.position.z+.8&&Math.abs(player.position[gate.axis])+.45>gate.gap){damage();if(mode!=='playing')return}
  if(gate.mesh.position.z>14)remove(gates,gate);
 }
}

function clearCrossLasers(){for(const beam of [...crossLasers])remove(crossLasers,beam)}
function updateCrossLasers(dt){
 if(!presentationActive()&&!boss&&midbossDone&&time<STAGE.serpent){
  while(crossLaserWave<FORTRESS_LASER_WAVES.length&&time>=FORTRESS_LASER_WAVES[crossLaserWave].time){
   const wave=FORTRESS_LASER_WAVES[crossLaserWave++],axis=wave.axis??'y',mesh=crossLaser(axis);mesh.position.set(axis==='x'?wave.side*bounds.x*.45:0,axis==='y'?wave.y:0,-65);view.scene.add(mesh);crossLasers.push({mesh,axis});
  }
 }
 if(!boss){
  if(crossLasers.length){const beam=crossLasers[0];ui('if-warning').textContent=beam.axis==='x'?(beam.mesh.position.x>0?'PINK LASER · 右列 → 左へ回避':'PINK LASER · 左列 → 右へ回避'):(beam.mesh.position.y>0?'PINK LASER · 上段 → 下へ回避':'PINK LASER · 下段 → 上へ回避')}
  else if(ui('if-warning').textContent.startsWith('PINK LASER'))ui('if-warning').textContent='';
 }
 for(const beam of [...crossLasers]){
  const oldZ=beam.mesh.position.z;beam.mesh.position.z+=dt*22;
  const z=beam.mesh.position.z;
  beam.mesh.children[1].material.opacity=.2+.06*Math.sin(time*12);
  if(z>=player.position.z-.65&&oldZ<=player.position.z+.65&&Math.abs(player.position[beam.axis]-beam.mesh.position[beam.axis])<.56&&Math.abs(player.position[beam.axis==='x'?'y':'x'])<12.32){
   damage();if(mode!=='playing')return;
  }
  if(z>13)remove(crossLasers,beam);
 }
}

function clearLasers(){for(const beam of [...lasers]){view.scene.remove(beam.marker);beam.marker?.geometry.dispose();beam.marker?.material.dispose();remove(lasers,beam)}}
const ROLL_DURATION=.7;
let roll=null,bank=0,knifeEdge=false,stance=0;
function toggleStance(){if(mode!=='playing')return;knifeEdge=!knifeEdge;}

function startRoll(direction){if(mode!=='playing'||roll)return;roll={direction,elapsed:0}}
let lastTap=null;
let firePointer=null,drag=null,target=new T.Vector2(),bounds={x:7,y:5};
function remove(list,item){const i=list.indexOf(item);if(i<0)return;list.splice(i,1);view.scene.remove(item.mesh);const geometries=new Set(),materials=new Set();item.mesh.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [o.material].flat())materials.add(m)});for(const geo of geometries)geo.dispose();for(const m of materials){m.map?.dispose();m.dispose()}}
function clearInput(){keys.clear();firePointer=null;drag=null;lastTap=null;ui('if-fire').classList.remove('active')}
function hud(){ui('if-score').textContent=score;ui('if-best').textContent=best;ui('if-kills').textContent=kills;ui('if-life').textContent='♥'.repeat(Math.max(0,life));ui('if-sector').textContent=boss?(boss.kind==='final'?'FINAL BOSS':boss.kind==='raider'?'FORTRESS BOSS':boss.kind==='serpent'?'CORE GUARDIAN':'MID BOSS'):midbossDone&&time>=STAGE.interior?'03 / CORE':midbossDone?'02 / FORTRESS':'01 / APPROACH';ui('if-progress').value=Math.min(100,time/STAGE.boss*100);ui('if-boss').hidden=!boss;if(boss){ui('if-boss-hp').value=boss.hp/boss.max;ui('if-boss-hit').textContent=(boss.hitFlash>0?'HIT! −1 · ':'')+'HP '+boss.hp+' / '+boss.max;ui('if-boss-name').textContent=BOSS_NAMES[boss.kind].en;ui('if-boss-reading').textContent=BOSS_NAMES[boss.kind].ja}}
function show(title,copy){ui('if-overlay').hidden=false;ui('if-title').textContent=title;ui('if-copy').textContent=copy;ui('if-difficulty').hidden=mode!=='title';ui('if-start').textContent=mode==='title'?'START':mode==='paused'?'Resume（再開）':'RETRY';ui('if-home').hidden=mode==='title';ui('if-pause').disabled=mode!=='playing'&&mode!=='paused';if(view)resize()}
function record(){if(score>best){best=score;saveBest(level,best)}}
function reset(){view.camera.position.set(0,2,17);ending=null;clearEnergy();energySpawned=false;midbossDone=false;fortressBossDone=false;serpentDone=false;midbossNotice=0;bossIntro=0;coreNoticeDone=false;presentationTick=false;ui('if-boss-intro').hidden=true;crossLaserWave=gateWave=0;clearGates();clearCrossLasers();clearLasers();ui('if-announcement').hidden=true;clearInput();for(const list of [enemies,shots,bullets,particles])for(const e of [...list])remove(list,e);if(boss){remove([boss],boss);boss=null}time=score=kills=invulnerable=damageBlink=shot=wave=0;life=3;spawn=1;rocks=5;spaceRockTimer=6;target.set(0,0);player.position.set(0,0,5);player.rotation.set(0,0,0);roll=null;bank=0;knifeEdge=false;stance=0;player.visible=true;ui('if-warning').textContent='';view.background(0,0,false);root.classList.remove('damaged');best=readBest(level);hud()}
function start(){audio.unlock().then(c=>{if(c&&mode==='playing')audio.play('start')});reset();mode='playing';ui('if-overlay').hidden=true;ui('if-pause').disabled=false;resize();canvas.focus()}
function finish(clear){mode=clear?'clear':'over';record();clearInput();hud();show(clear?'STAGE CLEAR':'GAME OVER',`SCORE ${score}  ·  BEST ${best}  ·  DESTROYED ${kills}`)}
function pause(){if(mode==='playing'){mode='paused';clearInput();show('PAUSED','ひと休み。RESUMEで再開 / Resume when ready.')}else if(mode==='paused'){audio.unlock();mode='playing';ui('if-overlay').hidden=true;resize();canvas.focus()}}
function damage(){if(invulnerable>0||mode!=='playing'||presentationActive())return;life--;invulnerable=1.6;damageBlink=1.6;audio.play('damage');root.classList.add('damaged');if(life<=0)beginEnding(false)}
function burst(pos,count=12){audio.play('hit');const scale=count/12;effect(pos,'flash',1,scale*.35);effect(pos,'flame',view.compact?5:9,scale*.45);effect(pos,'smoke',3,scale*.35);effect(pos,'metal',view.compact?4:7,scale*.4);effect(pos,'spark',view.compact?5:9,scale*.5)}
function addEnemy(){if(enemies.length>=20)return;const type=enemyType(wave++),data=type===4?SHOTGUN_ENEMY:EXTRA_ENEMIES[type]??ENEMIES[type],mesh=type===6?shurikenModel():ship(data.color,type,true);mesh.rotation.y=Math.PI;const x=Math.sin(wave*2.4)*bounds.x*.8,y=Math.cos(wave*1.7)*3.5;mesh.position.set(x,y,-100);view.scene.add(mesh);enemies.push({mesh,type,hp:Math.max(1,Math.ceil(data.hp*cfg.hp)),radius:data.radius,shotRadius:data.shotRadius,score:data.score,baseX:x,baseY:y,aimX:player.position.x,aimY:player.position.y,vx:wave%2?3.4:-3.4,vy:wave%3?2.1:-2.1,phase:wave,attack:cfg.attack*(type===4?1.4:1)})}
function moveEnemy(e,dt,motion){
 if(e.spaceRock){e.mesh.rotation.x+=dt*.45;e.mesh.rotation.y+=dt*.3;}
 e.mesh.position.z+=dt*cfg.speed*(e.type===6?1.35:1);
 if(e.type===1)e.mesh.position.x=clamp(e.baseX+Math.sin(time*2*motion+e.phase)*2,-bounds.x,bounds.x);
 if(e.type===5){
  e.mesh.position.x+=e.vx*dt*motion;e.mesh.position.y+=e.vy*dt*motion;
  if(Math.abs(e.mesh.position.x)>=bounds.x){e.mesh.position.x=clamp(e.mesh.position.x,-bounds.x,bounds.x);e.vx=-Math.sign(e.mesh.position.x)*Math.abs(e.vx)}
  if(Math.abs(e.mesh.position.y)>=4.2){e.mesh.position.y=clamp(e.mesh.position.y,-4.2,4.2);e.vy=-Math.sign(e.mesh.position.y)*Math.abs(e.vy)}
  e.mesh.rotation.z=-e.vx*.1;
 }
 if(e.type===6){
  const approach=clamp((e.mesh.position.z+100)/105,0,1);
  e.mesh.position.x=T.MathUtils.lerp(e.baseX,e.aimX,approach);e.mesh.position.y=T.MathUtils.lerp(e.baseY,e.aimY,approach);
  e.mesh.rotation.z+=dt*9*motion;
 }
}
function addSpaceRock(){
 if(enemies.length>=20)return;
 const mesh=asteroidModel();mesh.scale.setScalar(1.05);mesh.position.set(Math.sin(wave*1.9+time)*bounds.x*.8,Math.cos(wave*1.3-time)*3.3,-100);view.scene.add(mesh);
 enemies.push({mesh,type:3,spaceRock:true,radius:1.15,hp:Infinity});
}
function addRock(){if(enemies.length>=20)return;const mesh=obstacle();mesh.position.set(Math.sin(wave*1.6)*bounds.x*.8,Math.cos(wave*2.1)*3.5,-100);view.scene.add(mesh);enemies.push({mesh,type:3,radius:1.65,hp:Infinity})}
function enemyBullet(pos,aim,speedScale=1,scatter=false,palette=null){if(presentationActive()||bullets.length>=90)return;const mesh=scatter?pellet(palette?.core,palette?.halo):bolt(0xff6658,.3);mesh.position.copy(pos);view.scene.add(mesh);const velocity=aim.clone().sub(pos).normalize().multiplyScalar(cfg.bullet*speedScale);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),velocity.clone().normalize());bullets.push({mesh,velocity})}
function fireEnemy(e){
 if(e.type===4){
  if(bullets.length>86)return;
  for(const [x,y] of SHOTGUN_SPREAD)enemyBullet(e.mesh.position,new T.Vector3(player.position.x+x,player.position.y+y,player.position.z),.9,true);
 }else enemyBullet(e.mesh.position,player.position);
}
function shoot(){if(presentationActive()||shots.length>=70)return;audio.play('laser');for(const x of [-.35,.35]){const mesh=bolt(0x64f6ff);mesh.position.copy(player.position);mesh.position.x+=x;mesh.position.z-=2;view.scene.add(mesh);shots.push({mesh})}}
function createBoss(kind='final'){
 clearEnergy();clearGates();clearCrossLasers();clearLasers();for(const list of [enemies,bullets])for(const e of [...list])remove(list,e);
 const mesh=kind==='mid'?bossModel():kind==='raider'?fortressBossModel():kind==='serpent'?serpentBossModel():finalBossModel(view.bossTexture);if(kind==='mid'||kind==='raider')mesh.rotation.y=Math.PI;
 mesh.position.set(0,0,-65);view.scene.add(mesh);
 const hp=kind==='raider'?5:Math.ceil((kind==='mid'?40:kind==='serpent'?18:130)*cfg.hp);
 boss={mesh,kind,hp,max:hp,radius:kind==='mid'?3.2:kind==='raider'?1.3:kind==='serpent'?1.5:2.72,attack:3,pattern:0,elapsed:0,hitFlash:0,hitCooldown:0,hitMaterials:[]};
 const seen=new Set();mesh.traverse(o=>{for(const m of [o.material].flat()){if(m?.emissive&&!seen.has(m)&&(kind!=='serpent'||o.parent===mesh.userData.head)){seen.add(m);boss.hitMaterials.push({material:m,color:m.emissive.clone(),intensity:m.emissiveIntensity})}}});
 ui('if-warning').textContent='WARNING · '+BOSS_NAMES[kind].en;
 bossIntro=3;quietCombat();ui('if-boss-intro-en').textContent=BOSS_NAMES[kind].en;ui('if-boss-intro-ja').textContent=BOSS_NAMES[kind].ja;ui('if-boss-intro').hidden=false;audio.play('damage');hud();
}
function faceAttack(){
 if(presentationActive())return;
 const kind=['eyes','nose','mouth'][boss.pattern++%3],ports=boss.mesh.userData.ports[kind],color={eyes:0x35dcff,nose:0xffb32c,mouth:0xff40c5}[kind];
 boss.mesh.updateMatrixWorld(true);audio.play('boss');
 for(let i=0;i<(kind==='nose'?3:ports.length);i++){
  const origin=boss.mesh.localToWorld(ports[kind==='nose'?0:i].clone()),aim=player.position.clone();
  if(kind==='eyes')aim.x+=i===0?-.7:.7;
  if(kind==='nose'){aim.x+=(i-1)*2.5;aim.y+=Math.abs(i-1)*.4}
  const lock=aim.clone(),direction=aim.sub(origin).normalize(),end=origin.clone().addScaledVector(direction,(22-origin.z)/direction.z);
  const mesh=laserModel(color),t=(5-origin.z)/(end.z-origin.z),radius=laserRadius(kind,t);
  const marker=new T.Mesh(new T.RingGeometry(radius+.29,radius+.35,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide}));
  marker.position.copy(origin).lerp(end,t);marker.position.z=5.2;view.scene.add(mesh,marker);
  lasers.push({mesh,marker,kind,origin,end,lock,localPort:ports[kind==='nose'?0:i].clone(),radius,age:0,charge:.2,duration:kind==='mouth'?1.35:.85});
 }
}
function updateLasers(dt){
 for(const beam of [...lasers]){
  if(boss?.kind==='final'){
   const local=beam.localPort.clone();if(beam.kind==='mouth'){local.y=beam.localPort.y+(boss.mesh.userData.jaw.position.y+2);local.z=beam.localPort.z}
   boss.mesh.updateMatrixWorld(true);beam.origin.copy(boss.mesh.localToWorld(local));
   const direction=beam.lock.clone().sub(beam.origin).normalize();beam.end.copy(beam.origin).addScaledVector(direction,(22-beam.origin.z)/direction.z);
  }
  beam.age+=dt;const elapsed=beam.age-beam.charge,active=elapsed>=0&&elapsed<beam.duration,fading=elapsed>=beam.duration;
  if(elapsed>=beam.duration+LASER_FADE){view.scene.remove(beam.marker);beam.marker.geometry.dispose();beam.marker.material.dispose();remove(lasers,beam);continue}
  const direction=beam.end.clone().sub(beam.origin),length=direction.length(),opacity=fading?Math.max(0,1-(elapsed-beam.duration)/LASER_FADE):1;
  beam.mesh.position.copy(beam.origin);beam.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.normalize());
  for(let i=0;i<beam.mesh.userData.segments.length;i++){
   const {core,halo}=beam.mesh.userData.segments[i],t=(i+.5)/16,r=laserRadius(beam.kind,t),tail=t>.72?Math.max(0,(1-t)/.28):1;
   core.position.z=halo.position.z=length*t;
   core.scale.set(active||fading?r:.025,active||fading?r:.025,length/16*1.015);
   halo.scale.set(r*2.1,r*2.1,length/16*1.02);
   core.material.opacity=(active||fading?tail*(laserDanger(t)?1:.18):.3+.15*Math.sin(beam.age*20))*opacity;
   halo.material.opacity=(active||fading?.13:.025)*tail*opacity;
  }
  beam.marker.material.opacity=(active?.95:fading?0:.45+.3*Math.sin(beam.age*15))*opacity;
  if(active){
   const t=(player.position.z-beam.origin.z)/(beam.end.z-beam.origin.z);
   if(laserDanger(t)){
    const x=beam.origin.x+(beam.end.x-beam.origin.x)*t,y=beam.origin.y+(beam.end.y-beam.origin.y)*t;
    if(Math.hypot(player.position.x-x,player.position.y-y)<laserRadius(beam.kind,t)+.32)damage();
   }
  }
 }
}
function applyShotDamage(victim,position){
 if(presentationActive())return false;
 if(victim.kind==='raider'||victim.kind==='serpent'){
  if(victim.mesh.position.z< -27||victim.hitCooldown>0)return false;
  victim.hitCooldown=victim.kind==='raider'?.45:.2;
 }
 if(victim===boss)bossHit(position);
 victim.hp-=WEAPON.damage;return true;
}
function bossHit(position){
 if(!boss)return;boss.hitFlash=.18;
 const impact=position.clone();impact.z=boss.mesh.position.z+(boss.kind==='final'?2.465:boss.kind==='serpent'?1.8:4.3);effect(impact,'spark',view.compact?4:7,.35);effect(impact,'flash',1,.22);
 for(const entry of boss.hitMaterials){entry.material.emissive.setHex(0xffd9a3);entry.material.emissiveIntensity=1.8}
}
function updateBoss(dt,motion){
 boss.hitFlash=Math.max(0,boss.hitFlash-dt);boss.hitCooldown=Math.max(0,boss.hitCooldown-dt);
 for(const entry of boss.hitMaterials){entry.material.emissive.copy(entry.color);entry.material.emissiveIntensity=entry.intensity;if(boss.hitFlash>0){entry.material.emissive.setHex(0xffd9a3);entry.material.emissiveIntensity=1.8}}
 boss.elapsed+=dt;const clock=boss.kind!=='final'?time+boss.elapsed:time;
 const p=boss.mesh.position;
 p.z=Math.min(boss.kind==='serpent'?-18:-26,p.z+dt*8*motion);
 if(boss.kind==='serpent'){
  const t=boss.elapsed*motion,limit=Math.max(.35,Math.min(bounds.x-1.65,5.35)),coil=.5-.5*Math.cos(t*.45);
  boss.mesh.userData.coilMix=coil;
  p.x=T.MathUtils.lerp(Math.sin(t*.75)*limit,Math.sin(t*.9)*limit*.9,coil);
  p.y=T.MathUtils.lerp(Math.cos(t*.62)*2.8,Math.cos(t*.9)*2.7,coil);
 }else if(boss.kind==='raider'){
  p.x=Math.sin(boss.elapsed*1.785*motion)*bounds.x*.82;p.y=Math.sin(boss.elapsed*2.38*motion+.7)*3.2;
  boss.mesh.rotation.z=Math.cos(boss.elapsed*2.1*motion)*.42;
 }else if(!lasers.length){p.x=Math.sin(clock*.65*motion)*bounds.x*.65;p.y=Math.cos(clock*.8*motion)*2.7}
 boss.attack=presentationActive()?Math.max(.8,boss.attack):boss.attack-dt;
 if(boss.kind==='serpent'){
  const data=boss.mesh.userData;
  data.tongue.scale.z=.7+.3*Math.sin(boss.elapsed*12);data.head.rotation.z=Math.sin(boss.elapsed*1.1)*.13;
  const phase=boss.elapsed*motion,coil=data.coilMix,limit=Math.max(.35,Math.min(bounds.x-1.65,5.35));
  data.segments.forEach((segment,i)=>{
   const u=(i+1)/data.segments.length,lag=u*4,angle=phase*.9-u*Math.PI*2.6,taper=1-u*.72;
   const x=T.MathUtils.lerp(Math.sin(phase*.75-lag)*limit,Math.sin(angle)*limit*.9*taper,coil);
   const y=T.MathUtils.lerp(Math.cos(phase*.62-lag*.85)*2.8,Math.cos(angle)*2.7*taper,coil);
   segment.mesh.position.x=x-p.x;segment.mesh.position.y=y-p.y;
   segment.mesh.rotation.y=Math.cos(phase*.75-lag)*.2;
  });
  boss.mesh.updateMatrixWorld(true);boss.hitTargets=[{position:p.clone(),radius:1.5}];

  ui('if-warning').textContent=boss.attack<.8?'JADE SERPENT · VENOM FAN':'';
  if(!presentationActive()&&boss.attack<=0&&p.z>=-27){if(bullets.length<=85){const origin=p.clone().add(new T.Vector3(0,-.25,1.9));for(const offset of [-5,-2.5,0,2.5,5])enemyBullet(origin,new T.Vector3(player.position.x+offset,player.position.y,5),.7,true,{core:0xd8d8b1,halo:0x6e9680})}boss.attack=cfg.attack+1.8}
 }else if(boss.kind==='raider'){
  ui('if-warning').textContent=boss.attack<.6?'SILVER WISP · SINGLE SHOT':'';
  if(boss.attack<=0&&p.z>=-27){enemyBullet(p,player.position,.65);boss.attack=Math.max(3.8,cfg.attack+2)}
 }else if(boss.kind==='mid'){
  // Bank into a knife-edge stance, hold briefly, then level out.
  const phase=boss.elapsed%6,entry=clamp((phase-1.8)/.45,0,1),exit=clamp((phase-3.15)/.45,0,1);
  const ease=t=>t*t*(3-2*t),bankAmount=ease(entry)*(1-ease(exit));
  const angle=bankAmount*Math.PI/2*(Math.floor(boss.elapsed/6)%2? -1:1);
  boss.mesh.rotation.z=angle;
  const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  boss.hitX=3.2*c+1.15*s;boss.hitY=3.2*c+4.4*s;
  const warning=boss.attack<1;ui('if-warning').textContent=warning?(boss.pattern%2?'WARNING · FAN SHOT':'WARNING · TARGET LOCK'):'';
  boss.mesh.children[0].material.emissive.setHex(warning?0x662211:0x000000);
  if(!presentationActive()&&boss.attack<=0){const aim=player.position.clone();if(boss.pattern++%2){for(let i=-2;i<=2;i++)enemyBullet(p,new T.Vector3(i*3,aim.y,5))}else{for(const x of [-3,0,3])enemyBullet(p,new T.Vector3(aim.x+x,aim.y,5))}boss.attack=cfg.attack+1}
 }else{
  // Eyebrows, quivering nostrils and a chattering jaw sell the ridiculous face.
  const data=boss.mesh.userData,kind=lasers[0]?.kind;
  data.rotor.rotation.y+=dt*22;
  boss.mesh.rotation.z=Math.sin(time*2)*.055;boss.mesh.rotation.y=boss.hitFlash>0?Math.sin(boss.hitFlash*100)*.065:0;
  data.jaw.position.y=-2-(kind==='mouth'?.12+Math.abs(Math.sin(time*15))*.16:Math.sin(time*3)*.045);
  for(const eye of data.eyes)eye.material.emissiveIntensity=kind==='eyes'?2.8:1.2;
  for(const port of data.nosePorts)port.scale.setScalar(kind==='nose'?1+Math.sin(time*22)*.18:1);
  const warning=lasers[0];
  ui('if-warning').textContent=warning?({eyes:'目ビーム！ · DOUBLE EYE LASER',nose:'ハックション！ · SNEEZE LASER',mouth:'喝ーーッ！ · MEGA MOUTH LASER'}[warning.kind]):boss.attack<1?'次はどこから？ · CHARGING…':'';
  if(boss.attack<=0&&p.z>=-27&&!lasers.length){faceAttack();boss.attack=cfg.attack+3}
 }
}
function hit(a,b,r){return Math.abs(a.x-b.x)<r&&Math.abs(a.y-b.y)<r&&Math.abs(a.z-b.z)<2}
function update(dt){
 const motion=cfg.motion??1;
 presentationTick=bossIntro>0||midbossNotice>0;
 if(bossIntro>0){bossIntro=Math.max(0,bossIntro-dt);if(bossIntro===0)ui('if-boss-intro').hidden=true}
 if(midbossNotice>0){midbossNotice=Math.max(0,midbossNotice-dt);if(midbossNotice===0)ui('if-announcement').hidden=true}
 if(!boss||boss.kind==='final')time+=dt;shot-=dt;invulnerable=Math.max(0,invulnerable-dt);damageBlink=Math.max(0,damageBlink-dt);player.visible=presentationActive()||damageBlink===0||Math.floor(damageBlink*12)%2===0;if(damageBlink<1.3)root.classList.remove('damaged');
 const dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),dy=Number(keys.has('ArrowUp')||keys.has('KeyW'))-Number(keys.has('ArrowDown')||keys.has('KeyS'));
 target.x=clamp(target.x+dx*dt*9,-bounds.x,bounds.x);target.y=clamp(target.y+dy*dt*9,-bounds.y,bounds.y);const previous=player.position.x,previousY=player.position.y;player.position.x=T.MathUtils.damp(player.position.x,target.x,12,dt);player.position.y=T.MathUtils.damp(player.position.y,target.y,12,dt);bank=T.MathUtils.damp(bank,-(player.position.x-previous)/Math.max(dt,.001)*.055,8,dt);
 let rollAngle=0;
 if(roll){roll.elapsed=Math.min(ROLL_DURATION,roll.elapsed+dt);const t=roll.elapsed/ROLL_DURATION;rollAngle=roll.direction*Math.PI*2*(t*t*(3-2*t));if(t>=1){roll=null;rollAngle=0}}
 stance=T.MathUtils.damp(stance,knifeEdge?Math.PI/2:0,10,dt);
 player.rotation.z=(knifeEdge?0:bank)+stance+rollAngle;
 player.rotation.x=T.MathUtils.damp(player.rotation.x,(player.position.y-previousY)/Math.max(dt,.001)*.025,8,dt);
 if(!presentationActive()&&(firePointer!==null||keys.has('Space'))&&shot<=0){shoot();shot=WEAPON.interval}
 if(!boss){
  if(!midbossDone&&time>=STAGE.midboss)createBoss('mid');
  else if(midbossDone&&!fortressBossDone&&time>=STAGE.fortressBoss)createBoss('raider');
  else if(fortressBossDone&&!serpentDone&&time>=STAGE.serpent)createBoss('serpent');
  else if(time>=STAGE.boss)createBoss();
  else{spawn-=dt;if(spawn<=0){addEnemy();spawn=cfg.spawn}if(midbossDone){rocks-=dt;if(rocks<=0){addRock();rocks=cfg.obstacle}}else{spaceRockTimer-=dt;if(spaceRockTimer<=0){addSpaceRock();spaceRockTimer=5.5}}}
 }
 if(presentationActive())quietCombat();
 if(!boss&&midbossDone&&!coreNoticeDone&&time>=STAGE.interior){
  coreNoticeDone=true;midbossNotice=2;ui('if-announcement-text').textContent='最深部へ · CORE APPROACH';ui('if-announcement').dataset.result='mid';ui('if-announcement').hidden=false;quietCombat();hud();
 }
 for(const e of [...enemies]){moveEnemy(e,dt,motion);if(e.type!==3&&e.type!==6){e.attack=presentationActive()?Math.max(.8,e.attack):e.attack-dt;if(e.attack<=0&&e.mesh.position.z<0){fireEnemy(e);e.attack=cfg.attack*(e.type===4?1.4:1)}}if(hit(e.mesh.position,player.position,e.radius+.45)){damage();remove(enemies,e);if(mode!=='playing')return}else if(e.mesh.position.z>12)remove(enemies,e)}
 if(boss)updateBoss(dt,motion);
 updateLasers(dt);if(mode!=='playing')return;
 updateCrossLasers(dt);if(mode!=='playing')return;
 updateGates(dt);if(mode!=='playing')return;
 for(const s of [...shots]){const oldZ=s.mesh.position.z;s.mesh.position.z-=WEAPON.speed*dt;let victim=null;for(const e of [...enemies,...(boss?[boss]:[])]){const r=e.shotRadius??e.radius,targets=e.kind==='serpent'&&e.hitTargets?e.hitTargets:[{position:e.mesh.position,radius:r}];if(targets.some(t=>Math.abs(s.mesh.position.x-t.position.x)<(e.hitX??t.radius)&&Math.abs(s.mesh.position.y-t.position.y)<(e.hitY??t.radius)&&t.position.z<=oldZ+2&&t.position.z>=s.mesh.position.z-2)){victim=e;break}}if(victim){const accepted=applyShotDamage(victim,s.mesh.position);if(accepted)effect(s.mesh.position,'spark',view.compact?2:3,.16);remove(shots,s);if(victim.hp<=0){const p=victim.mesh.position.clone();if(victim!==boss)burst(p,victim.type===2?18:12);score+=Math.round((victim===boss?(boss.kind==='mid'?1500:boss.kind==='raider'?1800:boss.kind==='serpent'?2200:3000):victim.score)*cfg.multiplier);kills++;record();if(victim===boss){if(boss.kind!=='final'){
 const gatekeeper=boss.kind==='mid',defeatedName=BOSS_NAMES[boss.kind].en;if(gatekeeper)midbossDone=true;else if(boss.kind==='raider')fortressBossDone=true;else serpentDone=true;
 explode(p,1.7);remove([boss],boss);boss=null;clearLasers();
 for(const bullet of [...bullets])remove(bullets,bullet);
 invulnerable=Math.max(invulnerable,1.6);damageBlink=0;player.visible=true;root.classList.remove('damaged');spawn=2;rocks=3;midbossNotice=2;quietCombat();ui('if-warning').textContent='';
 ui('if-announcement-text').textContent=gatekeeper?'要塞突入！ · FORTRESS ENTRY':'突破！ · '+defeatedName+' DOWN';ui('if-announcement').dataset.result='mid';ui('if-announcement').hidden=false;
 }else{beginEnding(true);return}}else remove(enemies,victim)}}else if(s.mesh.position.z< -130)remove(shots,s)}
 if(presentationActive())quietCombat();
 for(const b of [...bullets]){b.mesh.position.addScaledVector(b.velocity,dt);if(hit(b.mesh.position,player.position,.65)){damage();remove(bullets,b);if(mode!=='playing')return}else if(b.mesh.position.z>14||Math.abs(b.mesh.position.x)>40||Math.abs(b.mesh.position.y)>30)remove(bullets,b)}
 animateParticles(dt);
 updateEnergy(dt);
 view.background(dt,time,midbossDone);hud();
}

// Ending phases use the render loop, never detached timers or combat updates.
function effect(pos,kind,count,scale=1){
 for(let i=0;i<count&&particles.length<(view.particleLimit??240);i++){
  const metal=kind==='metal',smoke=kind==='smoke',flash=kind==='flash';
  const geometry=metal?new T.BoxGeometry(.25+Math.random()*.5,.08+Math.random()*.2,.2+Math.random()*.6):new T.SphereGeometry(flash?.9:smoke?.65:kind==='spark'?.09:.3,view.compact?8:12,view.compact?6:8);
  const material=metal?new T.MeshStandardMaterial({color:0x8795a6,metalness:.8,roughness:.4,transparent:true}):new T.MeshBasicMaterial({color:kind==='cure'?0xff71d1:flash?0xffffff:smoke?0x45505d:i%2?0xff6319:0xffce56,transparent:true,depthWrite:false,blending:smoke?T.NormalBlending:T.AdditiveBlending,toneMapped:false});
  const mesh=new T.Mesh(geometry,material);mesh.position.copy(pos);mesh.position.x+=(Math.random()-.5)*scale*2;mesh.position.y+=(Math.random()-.5)*scale;mesh.position.z+=(Math.random()-.5)*scale;mesh.scale.setScalar(scale);view.scene.add(mesh);
  particles.push({mesh,effect:kind,ttl:flash?.22:metal?5:smoke?3:1.2,spin:new T.Vector3(Math.random()*6,Math.random()*8,Math.random()*5),velocity:new T.Vector3((Math.random()-.5)*scale*15,smoke?scale*2:(Math.random()-.3)*scale*12,(Math.random()-.3)*scale*17)});
 }
}
function explode(pos,scale){audio.play('explosion');effect(pos,'flash',1,scale);effect(pos,'flame',view.compact?20:32,scale);effect(pos,'metal',view.compact?24:40,scale);effect(pos,'spark',view.compact?12:24,scale);effect(pos,'smoke',view.compact?10:18,scale)}
function beginEnding(clear){
 if(mode!=='playing'||ending)return;
 mode='ending';clearEnergy();bossIntro=0;ui('if-boss-intro').hidden=true;clearGates();clearCrossLasers();clearLasers();midbossNotice=0;ui('if-announcement').hidden=true;clearInput();ui('if-pause').disabled=true;ui('if-warning').textContent='';root.classList.remove('damaged');
 for(const list of [enemies,shots,bullets])for(const e of [...list])remove(list,e);
 ending={clear,phase:clear?'burn':'blast',elapsed:0,emission:0,pos:(clear?boss.mesh.position:player.position).clone()};
 if(clear){boss.hp=0;boss.mesh.traverse(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x772000)});audio.play('boss')}
 else{player.visible=false;explode(ending.pos,1.1)}
 hud();
}
function updateEnding(dt){
 const e=ending;if(!e)return;e.elapsed+=dt;animateParticles(dt);view.background(dt,time,midbossDone);
 if(e.clear){player.visible=true;player.rotation.z=T.MathUtils.damp(player.rotation.z,0,5,dt);player.rotation.x=T.MathUtils.damp(player.rotation.x,0,5,dt)}
 if(e.phase==='burn'){
  e.emission-=dt;if(e.emission<=0){const hotspot=e.pos.clone().add(new T.Vector3(Math.sin(e.elapsed*19)*3,Math.cos(e.elapsed*13)*1.4,Math.sin(e.elapsed*11)*2));effect(hotspot,'flame',view.compact?3:6,1.1);effect(hotspot,'smoke',2,1);effect(hotspot,'spark',2,.8);e.emission=.09}
  boss.mesh.rotation.z+=dt*.18;
  if(e.elapsed>=1.2){explode(e.pos,2.8);remove([boss],boss);boss=null;ui('if-boss').hidden=true;e.phase='blast';e.elapsed=0}
 }else if(e.phase==='blast'&&e.elapsed>=.4){
  e.phase='banner';e.elapsed=0;ui('if-announcement-text').textContent=e.clear?'STAGE CLEAR':'GAME OVER';ui('if-announcement').dataset.result=e.clear?'clear':'over';ui('if-announcement').hidden=false;audio.play(e.clear?'clear':'over');
 }else if(e.phase==='banner'){
  if(e.clear){player.position.z-=dt*10;view.camera.position.z-=dt*10}
  if(e.elapsed>=3){ui('if-announcement').hidden=true;view.camera.position.set(0,2,17);ending=null;finish(e.clear)}
 }
}

function resize(){view.resize();const aspect=canvas.clientWidth/canvas.clientHeight;bounds.x=Math.min(7,aspect*6.2);target.x=clamp(target.x,-bounds.x,bounds.x)}
function animateParticles(dt){for(const p of [...particles]){p.ttl-=dt;p.mesh.position.addScaledVector(p.velocity,dt);if(p.spin){p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;p.mesh.rotation.z+=p.spin.z*dt;p.mesh.material.opacity=Math.min(1,p.ttl);if(p.effect==='smoke')p.mesh.scale.multiplyScalar(1+dt*.7)}else p.mesh.scale.setScalar(Math.max(.01,p.ttl*2));if(p.ttl<=0)remove(particles,p)}}
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;try{if(mode==='playing')update(dt);else if(mode==='ending')updateEnding(dt);else if(mode==='clear'||mode==='over')animateParticles(dt);view.renderer.render(view.scene,view.camera);raf=requestAnimationFrame(frame)}catch(e){fail(e)}}
function fail(error){mode='error';clearInput();cancelAnimationFrame(raf);ui('if-start').hidden=true;ui('if-home').hidden=true;ui('if-pause').disabled=true;show('起動できませんでした','WebGL対応のブラウザで再読み込みしてください。 / Please reload in a WebGL-capable browser.');console.error('IRON FORTRESS',error)}
try{
 view=createScene(canvas);player=ship();markPlayer(player);player.position.z=5;view.scene.add(player);resize();best=readBest(level);hud();show('IRON FORTRESS','宇宙を抜け、機械要塞の核を撃て。 / Break through the fleet. Destroy the fortress core.');
 on(ui('if-start'),'click',()=>mode==='paused'?pause():start());on(ui('if-home'),'click',()=>{mode='title';reset();show('IRON FORTRESS','難易度を選んで出撃 / Choose your difficulty and launch.')});
 for(const b of root.querySelectorAll('[data-difficulty]'))on(b,'click',()=>{level=b.dataset.difficulty;cfg=DIFFICULTIES[level];for(const other of root.querySelectorAll('[data-difficulty]'))other.setAttribute('aria-pressed',String(other===b));best=readBest(level);hud()});

 on(ui('if-pause'),'click',pause);on(ui('if-mute'),'click',()=>{audio.unlock();audio.muted=!audio.muted;ui('if-mute').textContent=audio.muted?'SOUND OFF':'SOUND ON';ui('if-mute').setAttribute('aria-pressed',String(audio.muted))});
 on(canvas,'pointerdown',e=>{if(mode!=='playing'||drag)return;audio.unlock();canvas.focus();canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx:target.x,ty:target.y,started:performance.now(),maxTravel:0}});
 on(canvas,'pointermove',e=>{if(!drag||e.pointerId!==drag.id||mode!=='playing')return;drag.maxTravel=Math.max(drag.maxTravel,Math.hypot(e.clientX-drag.x,e.clientY-drag.y));target.x=clamp(drag.tx+(e.clientX-drag.x)/canvas.clientWidth*bounds.x*2.4,-bounds.x,bounds.x);target.y=clamp(drag.ty-(e.clientY-drag.y)/canvas.clientHeight*12,-bounds.y,bounds.y)});
 on(canvas,'pointerup',e=>{
  if(drag?.id!==e.pointerId)return;
  const gesture=drag;drag=null;
  if(mode!=='playing')return;
  const now=performance.now(),elapsed=now-gesture.started,dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  const travel=Math.max(gesture.maxTravel,Math.hypot(dx,dy));
  if(elapsed<=250&&travel<=12){
   if(lastTap&&now-lastTap.time<=320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<=28){toggleStance();lastTap=null}
   else lastTap={time:now,x:e.clientX,y:e.clientY};
  }else{
   lastTap=null;
   if(elapsed<=280&&Math.abs(dx)>=Math.max(55,canvas.clientWidth*.12)&&Math.abs(dx)>Math.abs(dy)*1.8&&Math.abs(dx)/Math.max(1,elapsed)>=.5)startRoll(dx<0?1:-1);
  }
 });
 for(const name of ['pointercancel','lostpointercapture'])on(canvas,name,e=>{if(drag?.id===e.pointerId){drag=null;lastTap=null}});
 on(ui('if-fire'),'pointerdown',e=>{if(mode!=='playing'||firePointer!==null)return;e.preventDefault();firePointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.classList.add('active');audio.unlock()});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])on(ui('if-fire'),name,e=>{if(e.pointerId===firePointer){firePointer=null;ui('if-fire').classList.remove('active')}});
 on(root,'keydown',e=>{if(e.target!==canvas)return;if(mode==='playing'&&e.code==='KeyR'){e.preventDefault();if(!e.repeat)toggleStance();return}if(mode==='playing'&&['KeyQ','KeyE'].includes(e.code)){e.preventDefault();if(!e.repeat)startRoll(e.code==='KeyQ'?1:-1);return}if(e.code==='Escape'){e.preventDefault();pause();return}if(mode==='playing'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)){e.preventDefault();if(audio.context?.state!=='running')audio.unlock();keys.add(e.code)}});on(window,'keyup',e=>keys.delete(e.code));on(canvas,'blur',()=>keys.clear());
 on(window,'resize',resize);on(window,'blur',()=>{if(mode==='playing')pause();clearInput()});on(document,'visibilitychange',()=>{if(document.hidden){if(mode==='playing')pause();clearInput()}});
 on(canvas,'webglcontextlost',e=>{e.preventDefault();fail(new Error('WebGL context lost'))});
 on(window,'pagehide',e=>{clearInput();if(mode==='playing')pause();if(!e.persisted){cancelAnimationFrame(raf);events.abort();view.scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat()){m.map?.dispose();m.dispose()}});view.renderer.dispose();audio.dispose()}});

 raf=requestAnimationFrame(frame);
}catch(error){fail(error)}
