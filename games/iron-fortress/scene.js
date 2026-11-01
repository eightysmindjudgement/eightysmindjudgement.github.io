import * as T from '../../vendor/three.module.min.js';
import {BOSS_FACE_DATA} from './boss-face.js';
export {T};
// Resources belong to each model; repeated parts within a model share materials.
function metal(color=0x687785,roughness=.38){return new T.MeshStandardMaterial({color,metalness:.72,roughness})}
function light(color){return new T.MeshBasicMaterial({color,toneMapped:false})}
function put(g,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m}
function box(g,mat,w,h,d,x=0,y=0,z=0){return put(g,new T.BoxGeometry(w,h,d),mat,x,y,z)}
function hull(g,mat,rings){const vertices=[],indices=[],n=16;for(const [z,w,h,y] of rings)for(let i=0;i<n;i++){const a=i/n*Math.PI*2;vertices.push(Math.cos(a)*w,Math.sin(a)*h+y,z)}for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,c,b,b,c,d)}indices.push(...Array.from({length:n-2},(_,i)=>[0,i+2,i+1]).flat());const end=(rings.length-1)*n;indices.push(...Array.from({length:n-2},(_,i)=>[end,end+i+1,end+i+2]).flat());const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return put(g,geo,mat)}
function wing(g,mat,side,type){const shape=new T.Shape();shape.moveTo(.28,-.9);shape.lineTo(type===1?1.15:1.6,type===1?-1.3:.4);shape.lineTo(type===1?1.4:1.8,1.05);shape.lineTo(.35,.75);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.04});geo.rotateX(Math.PI/2);geo.scale(side,1,1);if(side<0){const index=geo.index;if(index){for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a)}}else{const pos=geo.attributes.position;const normal=geo.attributes.normal;for(let i=0;i<pos.count;i+=3)for(const attr of [pos,normal]){const a=[attr.getX(i),attr.getY(i),attr.getZ(i)];attr.setXYZ(i,attr.getX(i+2),attr.getY(i+2),attr.getZ(i+2));attr.setXYZ(i+2,...a)}}geo.computeVertexNormals()}return put(g,geo,mat,0,-.05,0)}
export function ship(color=0xb9d1df,type=0,enemy=false){const g=new T.Group(),body=metal(color),dark=metal(0x202c3a),silver=metal(0x9baab5,.28),glow=light(color===0xb9d1df?0x44dbff:0xff5544);hull(g,body,[[-1.8,.035,.04,0],[-1.15,.26,.15,0],[-.3,.49,.29,0],[.85,.46,.3,0],[1.55,.28,.2,0]]);for(const side of [-1,1]){wing(g,type===1?dark:body,side,type);box(g,silver,.12,.1,1.3,side*.52,.16,.25);box(g,dark,.13,.16,1.4,side*(type===1?1.13:1.45),-.03,.2);const nozzle=put(g,new T.CylinderGeometry(.24,.3,.8,20,1,true),dark,side*.65,-.08,1.02);nozzle.rotation.x=Math.PI/2;const ring=put(g,new T.TorusGeometry(.24,.065,6,20),silver,side*.65,-.08,1.45);put(g,new T.CircleGeometry(.19,20),glow,side*.65,-.08,1.49);const exhaust=put(g,new T.ConeGeometry(.17,.65,12),new T.MeshBasicMaterial({color:glow.color,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending}),side*.65,-.08,1.8);exhaust.rotation.x=Math.PI/2;exhaust.name='engine plume';box(g,glow,.055,.035,.5,side*.98,.04,.4)}const cockpit=put(g,new T.SphereGeometry(1,20,12),new T.MeshPhysicalMaterial({color:0x16465c,metalness:.45,roughness:.18,clearcoat:1,emissive:0x082b38,emissiveIntensity:.7}),0,.25,-.25);cockpit.scale.set(.27,.23,.62);box(g,dark,.1,.1,1.15,0,.28,.55);if(type===1){g.scale.set(.82,.85,1.1);box(g,silver,.08,.45,.5,0,.4,.9)}if(type===2){g.scale.set(1.5,1.3,1.3);for(const side of [-1,1]){box(g,dark,.65,.55,1.65,side*.85,0,.2);box(g,body,.7,.18,1.2,side*.85,.33,.3);const gun=put(g,new T.CylinderGeometry(.13,.17,1.8,16),silver,side*.95,-.1,-.7);gun.rotation.x=Math.PI/2;box(g,glow,.3,.08,.05,side*.85,.3,-.35)}}if(type===4){
 g.name='SCATTER GUNNER';g.scale.set(1.15,1.2,1);
 box(g,dark,1.15,.65,1.1,0,0,-.8);
 const copper=metal(0xc78d58);
 for(const [x,y] of [[-.42,.18],[-.15,-.1],[.18,.26],[.46,-.18]]){
  const barrel=put(g,new T.CylinderGeometry(.1,.14,1.1,12),copper,x,y,-1.35);barrel.rotation.x=Math.PI/2;
  const muzzle=put(g,new T.CircleGeometry(.075,10),light(0xffa548),x,y,-1.91);muzzle.rotation.y=Math.PI;
 }
 }if(type===5){g.scale.set(1.05,.9,1.2);const fin=box(g,silver,.1,.7,1.1,0,.45,.45);fin.rotation.x=.3;g.name='DIAGONAL RAIDER'}if(enemy){
 // Armored fuselage and side pods give approaching enemies a thicker silhouette.
 hull(g,body,[[-1.65,.09,.12,0],[-.9,.46,.42,0],[.1,.64,.53,0],[1.1,.52,.45,0],[1.5,.32,.28,0]]);
 for(const side of [-1,1]){box(g,body,.46,.48,1.25,side*.85,0,.2);box(g,silver,.48,.12,.95,side*.85,.28,.2)}
 g.scale.x*=1.12;g.scale.y*=1.55;
 }return g}
export function bossModel(){const g=new T.Group(),armor=metal(0x75828f),dark=metal(0x202b39),silver=metal(0xa3adb2),red=light(0xff4930);const main=hull(g,armor,[[-1.7,.8,.65,0],[-.8,1.6,.9,0],[1.4,1.3,.8,0],[2,.75,.5,0]]);for(const side of [-1,1]){box(g,dark,1.1,1.2,2.8,side*1.8,0,.2);box(g,armor,1.25,.3,2,side*1.8,.7,.2);box(g,silver,.7,.4,1.1,side*1.8,-.7,.65);for(let i=0;i<3;i++){box(g,dark,.85,.12,.14,side*1.8,.88,-.5+i*.4);const barrel=put(g,new T.CylinderGeometry(.12,.17,1.6,16),silver,side*(1.2+i*.3),-.15,-1.5);barrel.rotation.x=Math.PI/2}box(g,red,.08,.65,.1,side*2.36,0,-.5);box(g,armor,.4,.8,1,side*2.5,.25,side>0?.3:-.3)}const rim=put(g,new T.TorusGeometry(.6,.14,8,32),silver,0,0,-1.7);const core=put(g,new T.SphereGeometry(.5,24,16),new T.MeshStandardMaterial({color:0xe34b27,emissive:0xff3510,emissiveIntensity:2,metalness:.3,roughness:.3}),0,0,-1.75);core.scale.z=.4;g.userData.core=core;g.scale.set(2,2,2);return g}


export function serpentBossModel(){
 const g=new T.Group(),green=new T.MeshStandardMaterial({color:0x29463e,metalness:.38,roughness:.52}),white=new T.MeshStandardMaterial({color:0xaaa99a,metalness:.12,roughness:.65}),dark=metal(0x141e1c),red=new T.MeshStandardMaterial({color:0x6e263b,emissive:0x351019,emissiveIntensity:.12,roughness:.5}),gold=light(0xb49b67);
 const headGreen=green.clone(),headWhite=white.clone();
 const head=new T.Group();g.add(head);
 const skull=put(head,new T.SphereGeometry(1,20,12),headGreen,0,.25,.15);skull.scale.set(1.4,.9,1.65);
 const jaw=put(head,new T.SphereGeometry(1,16,10),headWhite,0,-.48,.65);jaw.scale.set(1.15,.35,1.35);
 box(head,dark,1.75,.13,1.5,0,-.21,1);
 for(const side of [-1,1]){
  const eye=put(head,new T.SphereGeometry(.25,12,8),gold,side*1.05,.52,1.04);eye.scale.z=.5;
  box(head,dark,.07,.34,.08,side*1.05,.52,1.2);
  for(const x of [.5,.86]){const fang=put(head,new T.ConeGeometry(.1,.45,8),headWhite,side*x,-.38,1.42);fang.rotation.z=Math.PI}
  put(head,new T.SphereGeometry(.09,8,6),dark,side*.45,.28,1.7);
 }
 const tongue=new T.Group();tongue.position.set(0,-.28,1.8);head.add(tongue);box(tongue,red,.16,.065,1,0,0,.4);
 for(const side of [-1,1]){const fork=box(tongue,red,.085,.055,.55,side*.15,0,1.1);fork.rotation.y=side*.48}
 const segments=[],scaleShade=green.clone();scaleShade.color.setHex(0x354b42);
 const bodyGeometry=new T.SphereGeometry(1,8,6),bellyGeometry=new T.SphereGeometry(1,8,6);
 for(let i=1;i<=72;i++){
  const segment=new T.Group(),radius=1.15-i*.009;
  const body=put(segment,bodyGeometry,i%3===0?scaleShade:green);body.scale.set(radius,radius*.88,1.05);
  const belly=put(segment,bellyGeometry,white,0,-radius*.59,.08);belly.scale.set(radius*.82,radius*.34,.99);
  segment.position.z=-i*.1;g.add(segment);segments.push({mesh:segment,radius});
 }
 g.userData={head,tongue,segments,core:skull};g.name='JADE SERPENT';return g;
}
export function fortressBossModel(){
 const g=new T.Group(),silver=metal(0xb9cbdc,.24),dark=metal(0x1d3047),cyan=light(0x58ecff);
 hull(g,silver,[[-2,.02,.03,0],[-1,.38,.28,0],[.35,.65,.42,0],[1.3,.35,.26,0]]);
 for(const side of [-1,1]){
  const fin=box(g,silver,1.4,.16,1.3,side*.95,0,.45);fin.rotation.y=side*.45;
  box(g,dark,.4,.5,1.65,side*.9,0,.85);
  put(g,new T.CircleGeometry(.19,14),cyan,side*.9,0,1.69);
  const glow=put(g,new T.ConeGeometry(.16,.95,10),new T.MeshBasicMaterial({color:0x58ecff,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false}),side*.9,0,2.05);glow.rotation.x=Math.PI/2;
 }
 const core=put(g,new T.SphereGeometry(.28,12,8),new T.MeshStandardMaterial({color:0x247eac,emissive:0x27cfff,emissiveIntensity:1.4}),0,.24,-.3);
 g.userData.core=core;g.name='SILVER WISP';return g;
}
export function finalBossModel(faceTexture=null){
 const g=new T.Group();
 // The approved painted face preserves the agreed nose and cheek anatomy.
 const portraitMaterial=new T.MeshStandardMaterial({map:faceTexture,color:0xffffff,emissive:0x000000,metalness:.05,roughness:1,transparent:true,alphaTest:.04,side:T.DoubleSide});
 const portrait=put(g,new T.PlaneGeometry(8.1,7.35),portraitMaterial,0,.4,2.2);portrait.name='approved human face';
 const rotor=new T.Group();rotor.position.set(0,4.24,0);rotor.name='small head propeller';g.add(rotor);
 const gold=metal(0xe9bd56,.3);put(g,new T.CylinderGeometry(.075,.09,.5,12),gold,0,3.94,0);
 put(rotor,new T.SphereGeometry(.14,12,8),gold);
 for(const side of [-1,1]){const blade=box(rotor,gold,.57,.04,.17,side*.36,0,0);blade.rotation.x=side*.18;blade.name='propeller blade'}
 // Lighting anchors match the eyes, nostrils and mouth in the approved portrait.
 // They stay hidden: the artwork already contains the complete facial features.
 const anchor=(x,y)=>{const mesh=put(g,new T.SphereGeometry(.02,6,4),new T.MeshStandardMaterial({emissive:0x000000}),x,y,2.22);mesh.visible=false;return mesh};
 const eyes=[anchor(-.9,.47),anchor(.9,.47)],nosePorts=[anchor(-.15,-.65),anchor(.15,-.65)];
 const jaw=new T.Group();jaw.position.set(0,-2,2.2);g.add(jaw);const core=anchor(0,-1.75);
 g.userData={core,jaw,rotor,eyes,nosePorts,portrait,ports:{eyes:[new T.Vector3(-.9,.47,2.24),new T.Vector3(.9,.47,2.24)],nose:[new T.Vector3(0,-.65,2.24)],mouth:[new T.Vector3(0,-1.75,2.24)]}};
 g.name='HARD ROCK OJISAN X';g.scale.setScalar(.935);return g;
}
export function laserModel(color){
 const g=new T.Group(),segments=[];
 // Each section has its own opacity: exhausted light dissolves at the far end.
 for(let i=0;i<16;i++){
  const core=put(g,new T.CylinderGeometry(1,1,1,12),new T.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}));
  core.geometry.rotateX(Math.PI/2);
  const halo=put(g,new T.CylinderGeometry(1,1,1,12),new T.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false,blending:T.AdditiveBlending}));
  halo.geometry.rotateX(Math.PI/2);segments.push({core,halo});
 }
 g.userData.segments=segments;return g;
}
export function markPlayer(model){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#d4f4ff';ctx.font='900 124px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('EMJ',256,84);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const marking=new T.Mesh(new T.PlaneGeometry(.65,.22),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));marking.name='EMJ rear marking';marking.position.set(0,0,1.565);model.add(marking)}
export function obstacle(){const g=new T.Group(),dark=metal(0x303d49),armor=metal(0x87939d),warning=light(0xffb84e);box(g,dark,2.3,3.5,2.3);for(const y of [-1.4,0,1.4]){box(g,armor,2.45,.18,2.45,0,y);for(const x of [-1.18,1.18])box(g,warning,.06,.4,1.8,x,y+.3)}for(const x of [-.8,.8])box(g,armor,.2,3.5,2.4,x);return g}
export function bolt(color,r=.12){const core=new T.Mesh(new T.CylinderGeometry(r*.32,r*.32,1.8,8),light(r>.2?0xffb28a:0xe4fbff));core.geometry.rotateX(Math.PI/2);const halo=put(core,new T.CylinderGeometry(r*.85,r*.85,2,8),new T.MeshBasicMaterial({color,transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false}));halo.geometry.rotateX(Math.PI/2);return core}
export function energyModel(){
 const g=new T.Group(),pink=new T.MeshBasicMaterial({color:0xff68ce,transparent:true,opacity:.82,toneMapped:false});
 const orb=put(g,new T.SphereGeometry(.64,20,12),new T.MeshBasicMaterial({color:0xff55ca,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
 const ring=put(g,new T.TorusGeometry(.69,.045,8,28),pink);ring.rotation.x=.35;
 box(g,pink,.18,.72,.18);box(g,pink,.66,.18,.18);
 let texture=null;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');
  ctx.font='700 34px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffe3f7';ctx.fillText('ENERGY',128,32);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 }
 const label=new T.Sprite(new T.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,toneMapped:false}));label.position.y=-1.02;label.scale.set(1.65,.41,1);g.add(label);
 g.userData.orb=orb;g.name='pink ENERGY cure';return g;
}
export function asteroidModel(){
 const geometry=new T.IcosahedronGeometry(1,1),vertices=geometry.attributes.position;
 for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),r=1+.14*Math.sin(x*9+y*5)+.1*Math.cos(z*8-x*3);vertices.setXYZ(i,x*r,y*r*.83,z*r)}
 geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0x81766e,metalness:.12,roughness:.95,flatShading:true}));
 mesh.name='floating space rock';return mesh;
}
export function spaceScenery(compact=false){
 const group=new T.Group(),rocks=[],meteors=[];
 for(let i=0;i<(compact?8:14);i++){
  const mesh=asteroidModel(),side=i%2?1:-1;mesh.position.set(side*(13+i%4*5),Math.sin(i*2.3)*13,-20-i*11);mesh.scale.setScalar(.8+i%3*.65);group.add(mesh);rocks.push(mesh);
 }
 for(let i=0;i<(compact?2:3);i++){
  const mesh=new T.Group(),velocity=new T.Vector3(20,-12,8),back=velocity.clone().normalize().negate();
  put(mesh,new T.SphereGeometry(.13,8,6),light(0xeaf9ff));
  for(let j=0;j<7;j++){const trail=put(mesh,new T.CylinderGeometry(.075,.11,.85,6),new T.MeshBasicMaterial({color:j<3?0x86ddff:0xffb982,transparent:true,opacity:.35*(1-j/7),blending:T.AdditiveBlending,depthWrite:false}));trail.position.copy(back).multiplyScalar(.6+j*.8);trail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),back)}
  mesh.position.set(-38-i*16,16+i*5,-45-i*28);group.add(mesh);meteors.push({mesh,velocity,index:i});
 }
 group.userData.update=(dt,time,entered)=>{
  group.visible=!entered;if(entered)return;
  for(let i=0;i<rocks.length;i++){const mesh=rocks[i];if(time===0){mesh.position.z=-20-i*11;mesh.rotation.set(0,0,0)}mesh.position.z+=dt*(18+i%3*5);mesh.rotation.x+=dt*.3;mesh.rotation.y+=dt*.42;if(mesh.position.z>12)mesh.position.z=-175}
  for(const m of meteors){if(time===0)m.mesh.position.set(-38-m.index*16,16+m.index*5,-45-m.index*28);m.mesh.position.addScaledVector(m.velocity,dt);if(m.mesh.position.x>50||m.mesh.position.y< -28)m.mesh.position.set(-45-m.index*10,22+m.index*4,-70-m.index*28)}
 };
 group.name='space rocks and meteor trails';return group;
}
export function shurikenModel(){
 const g=new T.Group(),steel=metal(0x98a8bd,.24),dark=metal(0x263044);
 const star=new T.Shape();
 for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=i%2?.65:2;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y)}star.closePath();
 const blade=put(g,new T.ExtrudeGeometry(star,{depth:.22,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.05}),steel);blade.position.z=-.11;
 put(g,new T.CylinderGeometry(.52,.52,.45,12),dark).rotation.x=Math.PI/2;
 put(g,new T.IcosahedronGeometry(.32,1),light(0xff7f46));
 g.name='SHURIKEN';g.scale.setScalar(.9);return g;
}
export function gateModel(axis){
 const g=new T.Group(),steel=metal(0x8294a6,.32),dark=metal(0x28394a),edge=light(0x4bd6df),panels=[];
 for(const side of [-1,1]){
  const panel=new T.Group();g.add(panel);panels.push(panel);
  const w=axis==='y'?22:9,h=axis==='y'?5:14;
  for(let x=-w/2+.35;x<w/2;x+=.7){const bar=put(panel,new T.CylinderGeometry(.11,.11,h,8),steel,x);bar.name='iron bar'}
  for(const y of [-h/2,h/2]){box(panel,dark,w,.25,.65,0,y);box(panel,edge,w,.06,.08,0,y,.36)}
  for(const y of [-h*.25,h*.25])box(panel,steel,w,.12,.3,0,y);
 }
 g.userData={panels,axis};g.name=axis==='y'?'vertical sliding gate':'horizontal sliding gate';return g;
}
export function poseGate(model,gap){
 model.userData.panels.forEach((panel,i)=>{panel.position[model.userData.axis]=(i===0?-1:1)*(gap+(model.userData.axis==='y'?2.625:4.5))});
}
export function crossLaser(axis='y'){
 const g=new T.Group();
 const core=put(g,new T.CylinderGeometry(.24,.24,24,12),new T.MeshBasicMaterial({color:0xffb8ec,toneMapped:false}));core.rotation.z=Math.PI/2;
 const glow=put(g,new T.CylinderGeometry(.6,.6,24,12),new T.MeshBasicMaterial({color:0xff29c2,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.rotation.z=Math.PI/2;
 if(axis==='x')g.rotation.z=Math.PI/2;g.name=axis==='x'?'pink vertical laser':'pink horizontal laser';return g;
}
export function pellet(coreColor=0xffd998,haloColor=0xff8b35){
 const mesh=new T.Mesh(new T.SphereGeometry(.16,10,6),light(coreColor));
 put(mesh,new T.SphereGeometry(.28,10,6),new T.MeshBasicMaterial({color:haloColor,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false}));
 return mesh;
}
export function spark(){const m=new T.Mesh(new T.SphereGeometry(.16,8,6),light(0xffb054));m.scale.set(1,1,2.5);return m}
export function createScene(canvas){
 const compact=matchMedia('(pointer: coarse)').matches||navigator.hardwareConcurrency<=4;const renderer=new T.WebGLRenderer({canvas,antialias:!compact,powerPreference:'high-performance'});let pixelRatio=Math.min(devicePixelRatio,compact?1.15:1.75);renderer.setPixelRatio(pixelRatio);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const bossTexture=new T.TextureLoader().load(BOSS_FACE_DATA);bossTexture.colorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color(0x020611);scene.fog=new T.Fog(0x020611,38,150);const camera=new T.PerspectiveCamera(58,1,.1,220);camera.position.set(0,2,17);camera.lookAt(0,0,-35);scene.add(new T.HemisphereLight(0xb1ddff,0x182333,2));const sun=new T.DirectionalLight(0xffe0c7,3.2);sun.position.set(-7,9,7);scene.add(sun);const rim=new T.DirectionalLight(0x4bbfff,2.8);rim.position.set(8,2,-12);scene.add(rim);
 const starLayers=[];for(let layer=0;layer<3;layer++){const points=[];for(let i=0;i<(compact?85:140);i++)points.push((Math.random()-.5)*150,(Math.random()-.5)*100,-Math.random()*190);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));const stars=new T.Points(geo,new T.PointsMaterial({color:[0x56738e,0x9daebf,0xd1e6ff][layer],size:.09+layer*.055}));scene.add(stars);starLayers.push(geo)}
 const space=spaceScenery(compact);scene.add(space);
 const fortress=new T.Group(),bgMetal=metal(0x26384b,.6),panel=metal(0x4a5b6d,.5),cyan=light(0x26788a),amber=light(0xb36528);for(const side of [-1,1]){box(fortress,bgMetal,11,20,20,side*15,0,0);box(fortress,panel,5,13,24,side*9,0,3);for(let i=0;i<5;i++)box(fortress,cyan,.2,9,.2,side*(8+i*2),0,15)}box(fortress,panel,44,3,12,0,12,0);fortress.position.z=-155;scene.add(fortress);
 const frames=new T.Group();frames.visible=false;scene.add(frames);const frameCount=compact?12:16,spacing=12;const structure=new T.BoxGeometry(1,15,1.5),beam=new T.BoxGeometry(21,1,1.5),plate=new T.BoxGeometry(.3,12,9),pipe=new T.CylinderGeometry(.12,.12,11,8),vent=new T.BoxGeometry(.12,.18,1.6);for(let i=0;i<frameCount;i++){const g=new T.Group();for(const x of [-10,10]){put(g,structure,panel,x);put(g,plate,bgMetal,x*1.07,0,-5);const cable=put(g,pipe,panel,x*.94,4,-5);cable.rotation.x=Math.PI/2;box(g,i%3?cyan:amber,.08,5,.12,x*.94,0,.9);for(let j=0;j<4;j++)put(g,vent,panel,x*.98,-2+j*.45,-4)}for(const y of [-7.5,7.5])put(g,beam,panel,0,y);g.position.z=-i*spacing;frames.add(g)}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix()}
 let slow=0,samples=0,elapsed=0;function quality(dt){if(dt<=0)return;elapsed+=dt;samples++;if(dt>.028)slow++;if(elapsed>4){if(slow/samples>.45&&pixelRatio>.85){pixelRatio=Math.max(.85,pixelRatio-.15);renderer.setPixelRatio(pixelRatio);resize()}elapsed=slow=samples=0}}
 function background(dt,time,entered=false){quality(dt);space.userData.update(dt,time,entered);for(let layer=0;layer<starLayers.length;layer++){const a=starLayers[layer].attributes.position;for(let i=2;i<a.array.length;i+=3){a.array[i]+=dt*(entered?8+layer*8:20+layer*16);if(a.array[i]>18)a.array[i]=-190}a.needsUpdate=true}fortress.visible=!entered;fortress.position.z=-155+Math.min(time,36)*1.35;frames.visible=entered;for(const f of frames.children){f.position.z+=dt*16;if(f.position.z>15)f.position.z-=frameCount*spacing}}
 return {scene,camera,renderer,resize,background,compact,bossTexture,particleLimit:compact?140:240};
}
