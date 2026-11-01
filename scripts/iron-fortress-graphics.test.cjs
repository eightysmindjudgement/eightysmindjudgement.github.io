// Check the exact shipped HTML/bundle, using real Three.js without a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'games/iron-fortress');
const bundle=fs.readFileSync(path.join(dir,'game.js'),'utf8'),html=fs.readFileSync(path.join(dir,'iron-fortness.html'),'utf8');
new vm.Script(bundle);
const revision=crypto.createHash('sha256').update(bundle).digest('hex').slice(0,12);
assert.ok(html.includes('src="game.js?v='+revision+'"'),'HTML must load the current bundle revision');
for(const file of ['scene.js','main.js']){const source=fs.readFileSync(path.join(dir,file),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export\s*\{[^}]+\};?/g,'').replace(/export\s+(const|let|class|function)\s+/g,'$1 ');assert.ok(bundle.includes(source.trim()),file+' is stale in game.js; rebuild it');}
const sandbox={console,AbortController};vm.runInNewContext(bundle.slice(0,bundle.indexOf('const __main='))+'globalThis.models=__scene;})();',sandbox);
const {T,ship,bossModel,finalBossModel,laserModel,obstacle,bolt}=sandbox.models;
for(const model of [ship(),ship(0xe16c56,0),ship(0xc28ce9,1),ship(0xbda274,2),bossModel(),finalBossModel(),laserModel(0xff40c5),obstacle(),bolt(0x64f6ff),bolt(0xff6658,.3)]){model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);assert.ok(Number.isFinite(bounds.min.x)&&!bounds.isEmpty());let triangles=0;model.traverse(o=>{if(!o.geometry)return;const pos=o.geometry.attributes.position;for(const value of pos.array)assert.ok(Number.isFinite(value));const normal=o.geometry.attributes.normal;if(normal)for(const value of normal.array)assert.ok(Number.isFinite(value));triangles+=(o.geometry.index?.count??pos.count)/3});assert.ok(triangles>0&&triangles<16000,'bounded geometry complexity');}
const boss=bossModel();assert.ok(boss.children[0].material.emissive,'warning-light integration');assert.ok(boss.userData.core.material.emissive,'core-light integration');
const approvedBytes=fs.readFileSync(path.join(dir,'boss-face-approved.png'));
assert.equal(approvedBytes.readUInt32BE(0),0x89504e47,'approved face is a PNG');
assert.ok(fs.readFileSync(path.join(dir,'boss-face.js'),'utf8').includes(approvedBytes.toString('base64')),'embedded artwork matches approved asset');
const texture=new T.Texture(),texturedFace=finalBossModel(texture);
assert.equal(texturedFace.userData.portrait.material.map,texture,'approved artwork reaches face material');
assert.ok(texturedFace.userData.portrait.material.alphaTest>0,'transparent silhouette');
const rotorBounds=new T.Box3().setFromObject(texturedFace.userData.rotor).getSize(new T.Vector3());
assert.ok(rotorBounds.x<1.5,'propeller stays small');
const face=finalBossModel();assert.equal(face.userData.eyes.length,2);assert.equal(face.userData.ports.nose.length,1);assert.ok(face.userData.jaw);assert.ok(face.userData.core.material.emissive);
console.log('PASS: HTML revision, source/bundle consistency, real Three.js model construction, finite geometry, polygon budgets and boss warning/core interfaces.');
