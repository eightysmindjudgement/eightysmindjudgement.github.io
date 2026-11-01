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
export function ship(color=0xb9d1df,type=0,enemy=false){const g=new T.Group(),body=metal(color),dark=metal(0x202c3a),silver=metal(0x9baab5,.28),glow=light(color===0xb9d1df?0x44dbff:0xff5544);hull(g,body,[[-1.8,.035,.04,0],[-1.15,.26,.15,0],[-.3,.49,.29,0],[.85,.46,.3,0],[1.55,.28,.2,0]]);for(const side of [-1,1]){wing(g,type===1?dark:body,side,type);box(g,silver,.12,.1,1.3,side*.52,.16,.25);box(g,dark,.13,.16,1.4,side*(type===1?1.13:1.45),-.03,.2);const nozzle=put(g,new T.CylinderGeometry(.24,.3,.8,20,1,true),dark,side*.65,-.08,1.02);nozzle.rotation.x=Math.PI/2;const ring=put(g,new T.TorusGeometry(.24,.065,6,20),silver,side*.65,-.08,1.45);put(g,new T.CircleGeometry(.19,20),glow,side*.65,-.08,1.49);const exhaust=put(g,new T.ConeGeometry(.17,.65,12),new T.MeshBasicMaterial({color:glow.color,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending}),side*.65,-.08,1.8);exhaust.rotation.x=Math.PI/2;exhaust.name='engine plume';box(g,glow,.055,.035,.5,side*.98,.04,.4)}const cockpit=put(g,new T.SphereGeometry(1,20,12),new T.MeshPhysicalMaterial({color:0x16465c,metalness:.45,roughness:.18,clearcoat:1,emissive:0x082b38,emissiveIntensity:.7}),0,.25,-.25);cockpit.scale.set(.27,.23,.62);box(g,dark,.1,.1,1.15,0,.28,.55);if(type===1){g.scale.set(.82,.85,1.1);box(g,silver,.08,.45,.5,0,.4,.9)}if(type===2){g.scale.set(1.5,1.3,1.3);for(const side of [-1,1]){box(g,dark,.65,.55,1.65,side*.85,0,.2);box(g,body,.7,.18,1.2,side*.85,.33,.3);const gun=put(g,new T.CylinderGeometry(.13,.17,1.8,16),silver,side*.95,-.1,-.7);gun.rotation.x=Math.PI/2;box(g,glow,.3,.08,.05,side*.85,.3,-.35)}}if(enemy){
 // Armored fuselage and side pods give approaching enemies a thicker silhouette.
 hull(g,body,[[-1.65,.09,.12,0],[-.9,.46,.42,0],[.1,.64,.53,0],[1.1,.52,.45,0],[1.5,.32,.28,0]]);
 for(const side of [-1,1]){box(g,body,.46,.48,1.25,side*.85,0,.2);box(g,silver,.48,.12,.95,side*.85,.28,.2)}
 g.scale.x*=1.12;g.scale.y*=1.55;
 }return g}
export function bossModel(){const g=new T.Group(),armor=metal(0x75828f),dark=metal(0x202b39),silver=metal(0xa3adb2),red=light(0xff4930);const main=hull(g,armor,[[-1.7,.8,.65,0],[-.8,1.6,.9,0],[1.4,1.3,.8,0],[2,.75,.5,0]]);for(const side of [-1,1]){box(g,dark,1.1,1.2,2.8,side*1.8,0,.2);box(g,armor,1.25,.3,2,side*1.8,.7,.2);box(g,silver,.7,.4,1.1,side*1.8,-.7,.65);for(let i=0;i<3;i++){box(g,dark,.85,.12,.14,side*1.8,.88,-.5+i*.4);const barrel=put(g,new T.CylinderGeometry(.12,.17,1.6,16),silver,side*(1.2+i*.3),-.15,-1.5);barrel.rotation.x=Math.PI/2}box(g,red,.08,.65,.1,side*2.36,0,-.5);box(g,armor,.4,.8,1,side*2.5,.25,side>0?.3:-.3)}const rim=put(g,new T.TorusGeometry(.6,.14,8,32),silver,0,0,-1.7);const core=put(g,new T.SphereGeometry(.5,24,16),new T.MeshStandardMaterial({color:0xe34b27,emissive:0xff3510,emissiveIntensity:2,metalness:.3,roughness:.3}),0,0,-1.75);core.scale.z=.4;g.userData.core=core;g.scale.set(2,2,2);return g}


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
 g.name='HARD ROCK OJISAN';g.scale.setScalar(1.1);return g;
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
export function spark(){const m=new T.Mesh(new T.SphereGeometry(.16,8,6),light(0xffb054));m.scale.set(1,1,2.5);return m}
export function createScene(canvas){
 const compact=matchMedia('(pointer: coarse)').matches||navigator.hardwareConcurrency<=4;const renderer=new T.WebGLRenderer({canvas,antialias:!compact,powerPreference:'high-performance'});let pixelRatio=Math.min(devicePixelRatio,compact?1.15:1.75);renderer.setPixelRatio(pixelRatio);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const bossTexture=new T.TextureLoader().load(BOSS_FACE_DATA);bossTexture.colorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color(0x020611);scene.fog=new T.Fog(0x020611,38,150);const camera=new T.PerspectiveCamera(58,1,.1,220);camera.position.set(0,2,17);camera.lookAt(0,0,-35);scene.add(new T.HemisphereLight(0xb1ddff,0x182333,2));const sun=new T.DirectionalLight(0xffe0c7,3.2);sun.position.set(-7,9,7);scene.add(sun);const rim=new T.DirectionalLight(0x4bbfff,2.8);rim.position.set(8,2,-12);scene.add(rim);
 const starLayers=[];for(let layer=0;layer<3;layer++){const points=[];for(let i=0;i<(compact?85:140);i++)points.push((Math.random()-.5)*150,(Math.random()-.5)*100,-Math.random()*190);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));const stars=new T.Points(geo,new T.PointsMaterial({color:[0x56738e,0x9daebf,0xd1e6ff][layer],size:.09+layer*.055}));scene.add(stars);starLayers.push(geo)}
 const fortress=new T.Group(),bgMetal=metal(0x26384b,.6),panel=metal(0x4a5b6d,.5),cyan=light(0x26788a),amber=light(0xb36528);for(const side of [-1,1]){box(fortress,bgMetal,11,20,20,side*15,0,0);box(fortress,panel,5,13,24,side*9,0,3);for(let i=0;i<5;i++)box(fortress,cyan,.2,9,.2,side*(8+i*2),0,15)}box(fortress,panel,44,3,12,0,12,0);fortress.position.z=-155;scene.add(fortress);
 const frames=new T.Group();frames.visible=false;scene.add(frames);const frameCount=compact?12:16,spacing=12;const structure=new T.BoxGeometry(1,15,1.5),beam=new T.BoxGeometry(21,1,1.5),plate=new T.BoxGeometry(.3,12,9),pipe=new T.CylinderGeometry(.12,.12,11,8),vent=new T.BoxGeometry(.12,.18,1.6);for(let i=0;i<frameCount;i++){const g=new T.Group();for(const x of [-10,10]){put(g,structure,panel,x);put(g,plate,bgMetal,x*1.07,0,-5);const cable=put(g,pipe,panel,x*.94,4,-5);cable.rotation.x=Math.PI/2;box(g,i%3?cyan:amber,.08,5,.12,x*.94,0,.9);for(let j=0;j<4;j++)put(g,vent,panel,x*.98,-2+j*.45,-4)}for(const y of [-7.5,7.5])put(g,beam,panel,0,y);g.position.z=-i*spacing;frames.add(g)}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix()}
 let slow=0,samples=0,elapsed=0;function quality(dt){if(dt<=0)return;elapsed+=dt;samples++;if(dt>.028)slow++;if(elapsed>4){if(slow/samples>.45&&pixelRatio>.85){pixelRatio=Math.max(.85,pixelRatio-.15);renderer.setPixelRatio(pixelRatio);resize()}elapsed=slow=samples=0}}
 function background(dt,time,entered=false){quality(dt);for(let layer=0;layer<starLayers.length;layer++){const a=starLayers[layer].attributes.position;for(let i=2;i<a.array.length;i+=3){a.array[i]+=dt*(8+layer*8);if(a.array[i]>18)a.array[i]=-190}a.needsUpdate=true}fortress.visible=!entered;fortress.position.z=-155+Math.min(time,36)*1.35;frames.visible=entered;for(const f of frames.children){f.position.z+=dt*16;if(f.position.z>15)f.position.z-=frameCount*spacing}}
 return {scene,camera,renderer,resize,background,compact,bossTexture,particleLimit:compact?140:240};
}
