// Bundle the fixed local module graph for file:// use, without external tools.
// Run after changing the game's JavaScript: node scripts/build-iron-fortress.cjs
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const graph=[
 ['core','vendor/three.core.min.js',{}],
 ['three','vendor/three.module.min.js',{'./three.core.min.js':'core'}],
 ['config','games/iron-fortress/config.js',{}],
 ['audio','games/iron-fortress/audio.js',{}],
 ['scene','games/iron-fortress/scene.js',{'../../vendor/three.module.min.js':'three'}],
 ['main','games/iron-fortress/main.js',{'./config.js':'config','./scene.js':'scene','./audio.js':'audio'}]
];
const output=['/* IRON FORTRESS browser bundle. Three.js r180, MIT; see ../../vendor/THREE-LICENSE.txt. */','(()=>{"use strict";'];
for(const [id,file,deps] of graph){
 let source=fs.readFileSync(path.join(root,file),'utf8');const exports=[];
 source=source.replace(/import\s*(\*\s+as\s+\w+|\{[^}]+\})\s*from\s*(['"])([^'"]+)\2\s*;?/g,(_,names,q,spec)=>{
  if(!deps[spec])throw Error('Unknown import: '+spec);
  if(names.startsWith('*'))return 'const '+names.match(/as\s+(\w+)/)[1]+'=__'+deps[spec]+';';
  return 'const {'+names.slice(1,-1).replace(/\s+as\s+/g,':')+'}=__'+deps[spec]+';';
 });
 source=source.replace(/export\s*\{([^}]+)\}\s*from\s*(['"])([^'"]+)\2\s*;?/g,(_,list,q,spec)=>{if(!deps[spec])throw Error('Unknown re-export: '+spec);for(const entry of list.split(',')){const [local,external]=entry.trim().split(/\s+as\s+/);exports.push((external||local)+':__'+deps[spec]+'.'+local)}return ''});
 source=source.replace(/export\s*\{([^}]+)\}\s*;?/g,(_,list)=>{for(const entry of list.split(',')){const [local,external]=entry.trim().split(/\s+as\s+/);exports.push((external||local)+':'+local)}return ''});
 source=source.replace(/export\s+(const|let|class|function)\s+(\w+)/g,(_,kind,name)=>{exports.push(name);return kind+' '+name});
 output.push('const __'+id+'=(()=>{\n'+source+(id==='main'?'\n/* IRON_FORTRESS_TEST_POINT */':'')+'\nreturn {'+exports.join(',')+'};\n})();');
}
output.push('})();');
const target=path.join(root,'games/iron-fortress/game.js');fs.writeFileSync(target,output.join('\n'));console.log('Built '+target);
