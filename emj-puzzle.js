(() => {
  'use strict';
  const { CONFIG:C, World, vertices }=window.EMJPuzzle;
  const $=id=>document.getElementById(id), canvas=$('puzzle-canvas'),ctx=canvas.getContext('2d');
  if(!ctx){$('puzzle-status').textContent='このブラウザではゲームを表示できません。';return;}
  document.title=C.name+" | Eighty's Mind Judgement";
  document.querySelectorAll('[data-puzzle-name]').forEach(el=>el.textContent=C.name);
  const world=new World(),images=[],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running=false,paused=false,aim=200,last=0,accumulator=0,best=0,drawnScore=-1,lastEvent=null;
  try{const n=Number(localStorage.getItem('emj-puzzle-best'));if(Number.isFinite(n)&&n>=0)best=n;}catch{}
  $('puzzle-best').textContent=best;
  function tile(level){const spec=C.pieces[level],el=document.createElement('span');el.className='puzzle-tile';el.style.setProperty('--tile',spec.color);const img=new Image();img.alt=spec.name;img.src=spec.image;img.onerror=()=>{img.remove();el.textContent=String(level+1);};el.append(img);return el;}
  C.pieces.forEach((spec,i)=>{const img=new Image();images[i]=img;img.onload=()=>paint();img.onerror=()=>{$('puzzle-status').textContent='一部の画像は番号タイルで表示しています。';images[i]=null;paint();};img.src=spec.image;const li=document.createElement('li'),label=document.createElement('span'),reading=document.createElement('small');reading.className='puzzle-reading';reading.lang='ja';reading.textContent=`（${spec.reading}）`;label.append(document.createTextNode(`${i+1}. ${spec.name}`),reading);li.append(tile(i),label);$('puzzle-evolution').append(li);});
  function previews(){const next=$('puzzle-next');next.replaceChildren(tile(world.next),document.createTextNode(C.pieces[world.next].name));$('puzzle-current').textContent=C.pieces[world.current].name;}
  function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
  function drawTile(b,alpha=1){const spec=C.pieces[b.level],v=vertices(b);ctx.save();ctx.globalAlpha=alpha;polygon(v);ctx.shadowColor=b.level===6?'#ffe18a':'#000';ctx.shadowBlur=b.level===6?16:7;ctx.shadowOffsetY=3;ctx.fillStyle=spec.color;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.save();ctx.clip();ctx.translate(b.x,b.y);ctx.rotate(b.angle);const r=b.r,img=images[b.level];
    if(img&&img.complete&&img.naturalWidth){const size=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,-r,-r,2*r,2*r);}else{ctx.fillStyle='#263544';ctx.fillRect(-r,-r,2*r,2*r);ctx.fillStyle=spec.color;ctx.font=`bold ${r}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.level+1,0,0);}
    ctx.restore();polygon(v);ctx.lineWidth=b.level>=5?4:2.5;ctx.strokeStyle=spec.color;ctx.stroke();
    ctx.beginPath();ctx.moveTo(v[7].x,v[7].y);[v[0],v[1],v[2]].forEach(p=>ctx.lineTo(p.x,p.y));ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(v[3].x,v[3].y);[v[4],v[5],v[6]].forEach(p=>ctx.lineTo(p.x,p.y));ctx.strokeStyle='#000a';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
  function paint(){ctx.clearRect(0,0,C.width,C.height);ctx.fillStyle='#101923';ctx.fillRect(0,0,C.width,C.height);ctx.strokeStyle='#ffffff07';ctx.lineWidth=1;for(let x=20;x<C.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,C.height);ctx.stroke();}
    // Render the exact same polylines used by collision detection.
    for(const [side,edge] of [[world.stage.left,0],[world.stage.right,C.width]]){
      polygon([{x:edge,y:0},...side.map(([x,y])=>({x,y})),{x:edge,y:C.height}]);ctx.fillStyle='#303c49';ctx.fill();
      ctx.beginPath();side.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#99adbd';ctx.lineWidth=3;ctx.stroke();
    }
    ctx.setLineDash([6,5]);ctx.strokeStyle=world.overflow?'#ff8c88':'#93a4b65c';ctx.beginPath();ctx.moveTo(0,C.deadline);ctx.lineTo(C.width,C.deadline);ctx.stroke();ctx.setLineDash([]);ctx.font='11px Arial';ctx.fillStyle='#a5b4c4';ctx.fillText(world.overflow?`あと ${Math.max(0,2.5-world.overflow).toFixed(1)} 秒`:'ここまで積むとピンチ！',10,C.deadline-7);
    if(running&&!world.over){const r=C.pieces[world.current].radius,x=Math.max(r+2,Math.min(C.width-r-2,aim));ctx.setLineDash([4,6]);ctx.strokeStyle='#b8d9ee55';ctx.beginPath();ctx.moveTo(x,r*2+8);ctx.lineTo(x,C.height);ctx.stroke();ctx.setLineDash([]);drawTile({level:world.current,r,x,y:r+5,angle:0},.6);}
    world.bodies.forEach(b=>drawTile(b));
    for(const e of world.events){const age=world.time-e.time;ctx.save();ctx.globalAlpha=1-age;ctx.fillStyle=e.final?'#ffe49b':'#b8ffe8';ctx.textAlign='center';ctx.font=`bold ${e.final?22:16}px Arial`;ctx.fillText(`+${e.points}${e.combo>1?' ×'+e.combo:''}`,e.x,e.y-(reduced?0:age*40));if(e.final&&!reduced){ctx.beginPath();ctx.arc(e.x,e.y,30+age*100,0,Math.PI*2);ctx.strokeStyle='#ffe49b';ctx.lineWidth=3;ctx.stroke();}ctx.restore();}
  }
  function score(){if(drawnScore===world.score)return;drawnScore=world.score;$('puzzle-score').textContent=world.score;if(world.score>best){best=world.score;$('puzzle-best').textContent=best;try{localStorage.setItem('emj-puzzle-best',String(best));}catch{}}}
  function overlay(title,text,button){$('puzzle-overlay').hidden=false;$('puzzle-overlay-title').textContent=title;$('puzzle-overlay-copy').textContent=text;$('puzzle-start').textContent=button;}
  function start(){if(paused){paused=false;}else{world.reset();drawnScore=-1;aim=200;$('puzzle-aim').value=200;lastEvent=null;score();previews();}running=true;last=0;accumulator=0;$('puzzle-overlay').hidden=true;$('puzzle-pause').disabled=false;$('puzzle-status').textContent='同じタイルをくっつけよう！';canvas.focus();paint();}
  function drop(){if(!running||paused)return;if(world.drop(aim))previews();paint();}
  function pause(){if(!running||world.over)return;running=false;paused=true;overlay('ひとやすみ','つづきから遊べるよ。','つづける');}
  $('puzzle-start').addEventListener('click',start);$('puzzle-drop').addEventListener('click',drop);$('puzzle-pause').addEventListener('click',pause);
  $('puzzle-aim').addEventListener('input',e=>{aim=Number(e.target.value);paint();});
  function point(e){const rect=canvas.getBoundingClientRect();aim=Math.max(0,Math.min(C.width,(e.clientX-rect.left)*C.width/rect.width));$('puzzle-aim').value=aim;paint();}
  let pointer=null;
  let stageAnimation=null;
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.stage);if(index===world.stageIndex)return;
    const direction=index>world.stageIndex?1:-1;
    running=false;paused=false;pointer=null;last=0;accumulator=0;lastEvent=null;
    world.reset(index);drawnScore=-1;aim=200;$('puzzle-aim').value=200;score();previews();
    $('puzzle-pause').disabled=true;
    $('puzzle-stage-label').textContent=`${world.stage.name} · ${world.stage.description}`;
    $('puzzle-status').textContent='';
    overlay(world.stage.name,`${world.stage.description}。同じタイルをくっつけよう！`,'あそぶ');
    document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===index)));
    if(stageAnimation)stageAnimation.cancel();
    if(!reduced&&typeof $('puzzle-stage').animate==='function')stageAnimation=$('puzzle-stage').animate([
      {transform:`translateX(${direction*100}%)`,opacity:.25},
      {transform:'translateX(0)',opacity:1}
    ],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});
    paint();
  }));
  canvas.addEventListener('pointerdown',e=>{if(!running||pointer!==null||e.button>0)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);point(e);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.pointerId===pointer)point(e);});
  canvas.addEventListener('pointerup',e=>{if(e.pointerId!==pointer)return;point(e);pointer=null;drop();});
  canvas.addEventListener('pointercancel',()=>{pointer=null;});canvas.addEventListener('lostpointercapture',()=>{pointer=null;});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')aim=Math.max(0,aim-12);else if(e.key==='ArrowRight')aim=Math.min(400,aim+12);else drop();$('puzzle-aim').value=aim;paint();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  function frame(now){if(running){if(last)accumulator+=Math.min((now-last)/1000,.08);while(accumulator>=1/120){world.step(1/120);accumulator-=1/120;}score();const event=world.events.at(-1);if(event&&event!==lastEvent){lastEvent=event;$('puzzle-status').textContent=event.final?'METAL SHOGUN！ メタルの頂点！':event.combo>1?`${event.combo}連鎖！ +${event.points}`:`合体！ +${event.points}`;}if(world.over){running=false;paused=false;pointer=null;$('puzzle-pause').disabled=true;overlay('GAME OVER',`スコア ${world.score} / 自己ベスト ${best}`,'もういちど');$('puzzle-start').focus();}paint();}last=now;requestAnimationFrame(frame);}
  previews();paint();requestAnimationFrame(frame);
})();
