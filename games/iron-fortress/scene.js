import * as T from '../../vendor/three.module.min.js';
export {T};
function part(geometry,color){return new T.Mesh(geometry,new T.MeshStandardMaterial({color,flatShading:true,metalness:.5,roughness:.6}))}
export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 const scene=new T.Scene();scene.background=new T.Color(0x020611);scene.fog=new T.Fog(0x020611,35,130);
 const camera=new T.PerspectiveCamera(58,1,.1,180);camera.position.set(0,2,17);camera.lookAt(0,0,-35);
 scene.add(new T.HemisphereLight(0xa5dfff,0x202035,2));const sun=new T.DirectionalLight(0xffffff,2.5);sun.position.set(-4,9,8);scene.add(sun);
 const stars=[];for(let i=0;i<180;i++)stars.push((Math.random()-.5)*90,(Math.random()-.5)*65,-Math.random()*150);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(geo,new T.PointsMaterial({color:0xb6cedc,size:.13})));
 const frames=new T.Group();frames.visible=false;scene.add(frames);for(let i=0;i<18;i++){const g=new T.Group();for(const x of [-10,10]){const m=part(new T.BoxGeometry(1,15,2),0x35465a);m.position.x=x;g.add(m)}for(const y of [-7.5,7.5]){const m=part(new T.BoxGeometry(21,1,2),0x536579);m.position.y=y;g.add(m)}g.position.z=-i*9;frames.add(g)}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
 function background(dt,time){const a=geo.attributes.position;for(let i=2;i<a.array.length;i+=3){a.array[i]+=dt*18;if(a.array[i]>15)a.array[i]=-145}a.needsUpdate=true;frames.visible=time>=30;for(const f of frames.children){f.position.z+=dt*16;if(f.position.z>15)f.position.z-=162}}
 return {scene,camera,renderer,resize,background};
}
export function ship(color=0xb9d1df,type=0){const g=new T.Group();const body=part(new T.ConeGeometry(.6,3.3,5),color);body.rotation.x=-Math.PI/2;g.add(body);const wing=part(new T.ConeGeometry(1.8,1.4,3),color);wing.rotation.x=Math.PI/2;wing.scale.z=.2;wing.position.z=.35;g.add(wing);for(const x of [-.7,.7]){const engine=part(new T.CylinderGeometry(.25,.35,1.3,6),0x344154);engine.rotation.x=Math.PI/2;engine.position.set(x,-.15,.9);g.add(engine);const glow=new T.Mesh(new T.SphereGeometry(.22,5,4),new T.MeshBasicMaterial({color:0x55ecff}));glow.position.set(x,-.15,1.6);g.add(glow)}const cockpit=part(new T.OctahedronGeometry(.42),0x37c5ec);cockpit.position.set(0,.4,0);g.add(cockpit);if(type===2){g.scale.set(1.5,1.3,1.3);for(const x of [-1,1]){const a=part(new T.BoxGeometry(.6,.6,2),0x777c82);a.position.x=x;g.add(a)}}return g}
export function bossModel(){const g=ship(0x8795a6,2);g.scale.set(3,2.5,2.5);for(const x of [-1.4,1.4]){const gun=part(new T.CylinderGeometry(.3,.4,3,6),0xae6455);gun.rotation.x=Math.PI/2;gun.position.set(x,0,-.6);g.add(gun)}return g}
export function markPlayer(model){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#102332';ctx.font='900 124px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('EMJ',256,84);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const marking=new T.Mesh(new T.PlaneGeometry(.9,.3),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
 marking.name='EMJ rear marking';marking.position.set(0,0,1.662);model.add(marking);
}
export function obstacle(){const g=new T.Group();g.add(part(new T.BoxGeometry(2.3,3.5,2.3),0x677581));const cap=part(new T.OctahedronGeometry(1.6),0xa6b1b8);cap.scale.y=.5;g.add(cap);return g}
export function bolt(color,r=.12){return new T.Mesh(new T.BoxGeometry(r,r,1.8),new T.MeshBasicMaterial({color}))}
export function spark(){return new T.Mesh(new T.OctahedronGeometry(.3),new T.MeshBasicMaterial({color:0xffb054}))}
