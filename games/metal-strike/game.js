(()=>{'use strict';
const $=id=>document.getElementById('ms-'+id),canvas=$('canvas'),ctx=canvas.getContext('2d');if(!ctx){$('copy').textContent='Canvas対応ブラウザをご利用ください。';return;}
const KEY='emj.metal-strike.best-rally.v1';let best=0;try{const n=Number(localStorage.getItem(KEY));if(Number.isFinite(n)&&n>=0)best=n;}catch(_){}
const game=new MetalStrike(best);let start=0,w=800,h=500,lastWall=0,feedback='',feedbackAt=-10,milestone=0,milestoneAt=-10,recordAt=-10,seen=new Set(),sparks=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}new ResizeObserver(resize).observe(canvas);
// Perspective makes approaching motion grow faster near the strike line.
// Keep z=0 at the far wall and z=1 at the existing strike line.
function perspectiveDepth(z){return Math.expm1(1.3*z)/Math.expm1(1.3);}
function project(x,z){const depth=perspectiveDepth(z),scale=.12+.88*depth;return {x:w*.5+(x-.5)*w*.88*scale,y:h*.37+h*.44*depth,scale};}
function line(points,color,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function ring(x,y,r,color,width=2){ctx.beginPath();ctx.ellipse(x,y,r,r*.48,0,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function emit(x,y,color){if(reduced)return;for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*170;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,at:game.time,color});}sparks=sparks.slice(-96);}
function hud(){if(game.best>best){best=game.best;try{localStorage.setItem(KEY,String(best));}catch(_){}}const minutes=Math.floor(game.time/60),seconds=Math.floor(game.time%60);for(const [id,value] of Object.entries({rally:game.rallies,best,perfect:game.perfect,good:game.good,'play-time':`${minutes}:${String(seconds).padStart(2,'0')}`}))$(id).textContent=value;$('pause').disabled=!['PLAYING','PAUSED'].includes(game.state);}
function togglePause(){
if(game.state==='PLAYING'){
update(performance.now());if(game.state!=='PLAYING')return;
game.state='PAUSED';$('title').textContent='PAUSED';$('copy').textContent='ひと休み。再開ボタンで続きを遊べます。 / Resume when ready.';$('start').textContent='Resume（再開）';$('result').hidden=true;$('overlay').hidden=false;$('pause').textContent='Resume（再開）';$('pause').setAttribute('aria-pressed','true');$('status').textContent='PAUSED — 一時停止中';$('start').focus();
}else if(game.state==='PAUSED'){
start=performance.now()-game.time*1000;game.state='PLAYING';$('overlay').hidden=true;$('pause').textContent='PAUSE';$('pause').setAttribute('aria-pressed','false');$('status').textContent='PLAYING — 球を追って、ラインで打ち返そう。';canvas.focus();
}}
function finish(){if(game.newBest)try{localStorage.setItem(KEY,String(game.best));}catch(_){}$('title').textContent='GAME OVER';$('copy').textContent=game.newBest?'NEW RECORD! / 自己ベスト更新！':'MISS — RETRY?';$('result').hidden=false;$('result').replaceChildren();for(const [label,value] of [['CURRENT RALLY',game.rallies],['BEST RALLY',game.best]]){const el=document.createElement('div');el.textContent=label;const strong=document.createElement('strong');strong.textContent=value;el.append(strong);$('result').append(el);}$('start').textContent='RETRY';$('overlay').hidden=false;$('start').focus();}
function update(now){const playing=game.state==='PLAYING';if(playing)game.advance((now-start)/1000);hud();for(const e of game.events){if(seen.has(e))continue;seen.add(e);const p=project(e.x,e.z);if(['PERFECT','GOOD','MISS','SWING'].includes(e.type)){feedback=e.type;feedbackAt=e.time;$('status').textContent=e.type==='SWING'?'STRIKE':e.type;emit(p.x,p.y,e.type==='PERFECT'?'#e3faff':'#f3a6d8');}if(e.type==='NEW_RECORD')recordAt=e.time;if(e.type==='MILESTONE'){milestone=e.rallies;milestoneAt=e.time;}}
if(seen.size>64)seen=new Set(game.events);if(playing&&game.state==='GAME_OVER')finish();}
function draw(now){ctx.fillStyle='#08121f';ctx.fillRect(0,0,w,h);const grad=ctx.createRadialGradient(w*.5,h*.37,0,w*.5,h*.4,w*.8);grad.addColorStop(0,'#294e64');grad.addColorStop(.4,'#142638');grad.addColorStop(1,'#060c18');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
const vx=w*.5,vy=h*.37;for(const [x,y] of [[0,0],[w,0],[0,h],[w,h],[w*.18,0],[w*.82,0],[w*.15,h],[w*.85,h]])line([[vx,vy],[x,y]],'#477c96');
const drift=reduced?0:(game.time*.11)%1;for(let i=0;i<12;i++){let z=((i/12+drift)%1);z=z*z;const sx=w*(.06+.44*z),sy=h*(.055+.445*z);ctx.strokeStyle=i%3===0?'#ed9bd4':'#38677f';ctx.lineWidth=i%3===0?2:1;ctx.strokeRect(vx-sx,vy-sy,sx*2,sy*2);}
line([[vx-w*.06,vy+h*.055],[w*.06,h*.87]],'#7cddff',3);line([[vx+w*.06,vy+h*.055],[w*.94,h*.87]],'#7cddff',3);
const y=project(.5,1).y;ctx.save();
const lineGlow=ctx.createLinearGradient(0,y-20,0,y+20);lineGlow.addColorStop(0,'#f3a6d800');lineGlow.addColorStop(.5,'#f3a6d855');lineGlow.addColorStop(1,'#f3a6d800');ctx.fillStyle=lineGlow;ctx.fillRect(w*.06,y-20,w*.88,40);
ctx.shadowColor='#f3a6d8';ctx.shadowBlur=20;line([[w*.06,y],[w*.94,y]],'#f3a6d8',6);ctx.shadowBlur=8;line([[w*.06,y],[w*.94,y]],'#fff4fc',2);
ctx.font='bold '+Math.max(13,Math.min(18,w*.024))+'px sans-serif';ctx.textAlign='left';ctx.fillStyle='#f8fcff';ctx.shadowColor='#7cddff';ctx.shadowBlur=8;ctx.fillText('STRIKE LINE / ストライクライン',w*.07,y+30,w*.86);ctx.restore();
const aim=w*.5+(game.aim-.5)*w*.88;ctx.strokeStyle='#bbecff';ctx.strokeRect(aim-w*.06,y-9,w*.12,18);line([[aim,y-15],[aim,y+15]],'#d7f6ff');
const b=game.state==='READY'?{x:.53,z:.65}:game.ball();const p=project(b.x,b.z),radius=(5+17*Math.max(0,perspectiveDepth(b.z)));if(game.state!=='GAME_OVER'||game.reason==='GAME OVER'){
if(game.state==='PLAYING'&&game.phase!=='miss'){const edge=b.x<.1?0:b.x>.9?1:null;if(edge!==null&&game.time-lastWall>.2){const wall=project(edge,b.z);emit(wall.x,wall.y,'#f3a6d8');lastWall=game.time;}}
for(let i=7;i>=1;i--){const trail=game.state==='READY'?b:game.ball(Math.max(game.phaseAt,game.time-i*.018));const tp=project(trail.x,trail.z);ctx.globalAlpha=(1-i/8)*.22;ctx.fillStyle='#7cddff';ctx.beginPath();ctx.arc(tp.x,tp.y,radius*(1-i/10),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*3);glow.addColorStop(0,'#fff');glow.addColorStop(.18,'#edfbff');glow.addColorStop(.4,'#7cddff');glow.addColorStop(1,'#7cddff00');ctx.fillStyle=glow;ctx.fillRect(p.x-radius*3,p.y-radius*3,radius*6,radius*6);ring(p.x,p.y,radius*1.4,'#c5f3ff');ring(p.x,p.y,radius*1.9,'#f3a6d8');}
for(const s of sparks){const age=game.time-s.at;if(age>.5)continue;ctx.globalAlpha=1-age*2;line([[s.x+s.vx*age,s.y+s.vy*age],[s.x+s.vx*(age+.035),s.y+s.vy*(age+.035)]],s.color,2);}ctx.globalAlpha=1;sparks=sparks.filter(s=>game.time-s.at<=.5);
const milestoneAge=game.time-milestoneAt;if(milestoneAge<1){const pulse=1+Math.sin(milestoneAge*Math.PI)*.08,fontSize=Math.min(w*.075,54)*pulse;ctx.save();ctx.globalAlpha=Math.min(1,(1-milestoneAge)/.25);ctx.textAlign='center';ctx.font='900 '+fontSize+'px sans-serif';ctx.lineWidth=Math.max(2,fontSize*.08);ctx.strokeStyle='#091321';ctx.shadowColor='#ef9bd5';ctx.shadowBlur=fontSize*.55;ctx.strokeText(milestone+' RALLIES!',w*.5,h*.12,w*.94);ctx.fillStyle='#f6d4eb';ctx.fillText(milestone+' RALLIES!',w*.5,h*.12,w*.94);ctx.restore();}
const recordAge=game.time-recordAt;if(recordAge<1){ctx.save();ctx.globalAlpha=Math.min(1,(1-recordAge)/.25);ctx.textAlign='center';ctx.font='bold '+Math.max(15,w*.035)+'px sans-serif';ctx.fillStyle='#8de2ff';ctx.shadowColor='#7cddff';ctx.shadowBlur=12;ctx.fillText('NEW RECORD!',w*.5,h*.2);ctx.restore();}
const age=game.time-feedbackAt;if(age<.45){
const text=feedback==='SWING'?'STRIKE':feedback,fontSize=Math.max(18,w*.035)*1.2,textX=w*.5,textY=h*.28,accent=feedback==='PERFECT'||feedback==='SWING'?'#7cddff':'#f3a6d8';
ctx.save();ctx.textAlign='center';ctx.font='bold '+fontSize+'px sans-serif';
const metrics=ctx.measureText(text),top=textY-(metrics.actualBoundingBoxAscent||fontSize*.75),bottom=textY+(metrics.actualBoundingBoxDescent||fontSize*.05),textGradient=ctx.createLinearGradient(0,top,0,bottom);
textGradient.addColorStop(0,accent);textGradient.addColorStop(.35,'#edfbff');textGradient.addColorStop(.5,'#ffffff');textGradient.addColorStop(.65,'#ffffff');textGradient.addColorStop(1,accent);
ctx.fillStyle=textGradient;ctx.shadowColor=accent;ctx.shadowBlur=fontSize*.5;ctx.fillText(text,textX,textY);ctx.shadowBlur=fontSize*.15;ctx.fillText(text,textX,textY);ctx.restore();
if(feedback==='PERFECT'||feedback==='GOOD')ring(p.x,p.y,25+age*190,'#e5f6ff',2);if(!reduced&&feedback==='MISS'){ctx.fillStyle='#efa1d420';ctx.fillRect(0,0,w,h);}}
}
function frame(now){update(now);draw(now);requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('start').addEventListener('click',()=>{if(game.state==='PAUSED'){togglePause();return;}game.reset();start=performance.now();feedback='';feedbackAt=-10;milestone=0;milestoneAt=-10;recordAt=-10;sparks=[];seen.clear();lastWall=-1;$('overlay').hidden=true;$('result').hidden=true;$('pause').textContent='PAUSE';$('pause').setAttribute('aria-pressed','false');$('status').textContent='PLAYING — 球を追って、ラインで打ち返そう。';canvas.focus();hud();});
$('pause').addEventListener('click',togglePause);
window.addEventListener('blur',()=>{if(game.state==='PLAYING')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='PLAYING')togglePause();});
function aimAt(e){if(game.state!=='PLAYING')return;const r=canvas.getBoundingClientRect();game.aim=Math.max(0,Math.min(1,((e.clientX-r.left)/r.width-.5)/.88+.5));}
canvas.addEventListener('pointermove',aimAt);canvas.addEventListener('pointerdown',e=>{if(game.state!=='PLAYING'||!e.isPrimary||e.button!==0)return;e.preventDefault();canvas.focus();aimAt(e);game.strike((performance.now()-start)/1000,game.aim);});
document.querySelector('.ms-game').addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.repeat){e.preventDefault();togglePause();}});
canvas.addEventListener('keydown',e=>{if(game.state!=='PLAYING')return;if(['Space','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(e.code==='Space'){if(!e.repeat)game.strike((performance.now()-start)/1000,game.aim);}else game.aim=Math.max(0,Math.min(1,game.aim+(e.code==='ArrowLeft'?-.035:.035)));}});hud();
})();
