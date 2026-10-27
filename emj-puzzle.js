(() => {
  'use strict';
  const { CONFIG:C, World, vertices }=window.EMJPuzzle;
  const $=id=>document.getElementById(id), canvas=$('puzzle-canvas'),ctx=canvas.getContext('2d');
  if(!ctx){$('puzzle-status').textContent='このブラウザではゲームを表示できません。 / This browser cannot display the game.';return;}
  document.title=C.name+" | Eighty's Mind Judgement";
  document.querySelectorAll('[data-puzzle-name]').forEach(el=>el.textContent=C.name);
  const world=new World(),images=[],motion=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=motion.matches;motion.addEventListener('change',e=>{reduced=e.matches;});
  let running=false,paused=false,aim=200,last=0,accumulator=0,best=0,drawnScore=-1,lastEvent=null;
  let playMs=0,clockStarted=null;
  let clearCount=0,clearAge=0,clearLast=null,clearDone=false,secretRevealed=false;
  try{const n=Number(localStorage.getItem("emj-puzzle-clears"));if(Number.isSafeInteger(n)&&n>=0)clearCount=n;}catch{}
  $("puzzle-clears").textContent=clearCount;
  function updateTime(){
    const seconds=Math.floor((playMs+(clockStarted===null?0:performance.now()-clockStarted))/1000);
    const text=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    if($('puzzle-time').textContent!==text)$('puzzle-time').textContent=text;
  }
  function stopClock(){if(clockStarted!==null){playMs+=performance.now()-clockStarted;clockStarted=null;}updateTime();}
  try{const n=Number(localStorage.getItem('emj-puzzle-best'));if(Number.isFinite(n)&&n>=0)best=n;}catch{}
  $('puzzle-best').textContent=best;
  function tile(level){if(level===-2){const el=document.createElement("span");el.className="puzzle-bomb-preview";el.setAttribute("aria-label","爆弾 / Bomb");return el;}if(level===-1){const el=document.createElement('span');el.className='puzzle-rock-preview';el.setAttribute('aria-label','岩');return el;}const spec=C.pieces[level],el=document.createElement('span');el.className='puzzle-tile';el.style.setProperty('--tile',spec.color);const img=new Image();img.alt=spec.name;img.src=spec.image;img.onerror=()=>{img.remove();el.textContent=String(level+1);};el.append(img);return el;}
  C.pieces.forEach((spec,i)=>{if(i===9){const li=document.createElement('li'),silhouette=document.createElement('span'),label=document.createElement('span');li.id='puzzle-secret';silhouette.className='puzzle-tile puzzle-secret-silhouette';silhouette.setAttribute('aria-hidden','true');label.textContent='10. Secret';li.append(silhouette,label);$('puzzle-evolution').append(li);return;}const img=new Image();images[i]=img;img.onload=()=>paint();img.onerror=()=>{statusText('一部の画像は番号タイルで表示しています。','Some images are shown as numbered tiles.');images[i]=null;paint();};img.src=spec.image;const li=document.createElement('li'),label=document.createElement('span'),reading=document.createElement('small');reading.className='puzzle-reading';reading.lang='ja';reading.textContent=`（${spec.reading}）`;label.append(document.createTextNode(`${i+1}. ${spec.name}`),reading);li.append(tile(i),label);$('puzzle-evolution').append(li);});
  function previews(){const next=$('puzzle-next');next.replaceChildren(tile(world.next),document.createTextNode((world.next===-2?'爆弾 / Bomb':world.next===-1?'岩 / Rock':C.pieces[world.next].name)));$('puzzle-current').textContent=(world.current===-2?'爆弾 / Bomb':world.current===-1?'岩':C.pieces[world.current].name);}
  function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
  function circle(b){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);}
  function drawTile(b,alpha=1){if(b.bomb){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(b.x-b.r*.3,b.y-b.r*.35,1,b.x,b.y,b.r);g.addColorStop(0,"#fff");g.addColorStop(.3,"#ffb8b8");g.addColorStop(.7,"#f33");g.addColorStop(1,"#720012");circle(b);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText(String(Math.max(0,Math.ceil(C.bombDuration-(world.time-(b.born??world.time))))),b.x,b.y+4);ctx.restore();return;}if(b.rock){if(alpha<1){ctx.save();ctx.globalAlpha=alpha;polygon(vertices(b));ctx.fillStyle='#89929e';ctx.fill();ctx.restore();}return;}const spec=C.pieces[b.level];ctx.save();ctx.globalAlpha=alpha;circle(b);ctx.shadowColor=b.level>=8?'#ffe18a':'#000';ctx.shadowBlur=b.level>=8?16:7;ctx.shadowOffsetY=3;ctx.fillStyle=spec.color;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.save();ctx.clip();ctx.translate(b.x,b.y);ctx.rotate(b.angle);const r=b.r,img=images[b.level];
    if(img&&img.complete&&img.naturalWidth){const size=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,-r,-r,2*r,2*r);}else{ctx.fillStyle='#263544';ctx.fillRect(-r,-r,2*r,2*r);ctx.fillStyle=spec.color;ctx.font=`bold ${r}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.level+1,0,0);}
    ctx.restore();circle(b);ctx.lineWidth=b.level>=5?4:2.5;ctx.strokeStyle=spec.color;ctx.stroke();
    ctx.beginPath();ctx.arc(b.x,b.y,b.r-2,Math.PI*1.1,Math.PI*1.8);ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.stroke();ctx.restore();}

  const comboText=document.createElement('div');comboText.className='puzzle-combo';comboText.hidden=true;
  comboText.setAttribute('aria-hidden','true');comboText.innerHTML='<strong>COMBO!</strong><span>LASERS FIRED!!</span>';canvas.after(comboText);
  let shownCue=null;
  function syncCombo(){
    if(world.clear){comboText.hidden=true;return;}
    const cue=world.comboCue,active=cue&&world.time>=cue.start&&world.time-cue.start<1.5;
    if(!active){comboText.hidden=true;return;}
    if(shownCue!==cue){shownCue=cue;comboText.hidden=false;comboText.querySelector('strong').textContent=cue.combo+' COMBO!';comboText.querySelector('span').hidden=cue.combo===1;comboText.style.setProperty('--combo-size',(22+cue.combo*4)+'px');comboText.classList.remove('is-active');void comboText.offsetWidth;comboText.classList.add('is-active');}
  }
  function paintDischarges(){
    ctx.save();
    for(const e of world.discharges){
      const elapsed=world.time-e.time,b=e.body;
      if(e.final){paintFinalDischarge(e,elapsed);continue;}
      if(elapsed<.8){const img=images[e.body.level];if(img&&img.complete&&img.naturalWidth){ctx.save();ctx.globalAlpha=.5;const scale=Math.max(C.width/img.naturalWidth,C.height/img.naturalHeight);ctx.drawImage(img,(C.width-img.naturalWidth*scale)/2,(C.height-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);ctx.restore();}continue;}
      const age=elapsed-.8;
      const pulse=reduced?1:age<.17?1:age<.3?.2:age<.41?.7:age<.51?.15:.45;
      ctx.globalAlpha=(1-age/.8)*pulse*(reduced?.35:1);
      ctx.shadowColor=e.final?'#ffc400':'#459bff';ctx.shadowBlur=reduced?3:16;
      ctx.strokeStyle='#fff4ab';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(b.x,b.y,b.r+2,0,Math.PI*2);ctx.stroke();
      const noise=n=>{const v=Math.sin(n*127.1+e.seed*311.7)*43758.5453;return v-Math.floor(v);};
      for(let i=0;i<(reduced?8:e.final?28:18);i++){
        const angle=i/(reduced?8:e.final?28:18)*Math.PI*2+(noise(i)-.5)*.18;
        const length=Math.hypot(C.width,C.height),points=[{x:b.x,y:b.y}];
        for(let k=1;k<=6;k++){const d=length*k/6,offset=k===6?0:(noise(i*7+k)-.5)*26;points.push({x:b.x+Math.cos(angle)*d-Math.sin(angle)*offset,y:b.y+Math.sin(angle)*d+Math.cos(angle)*offset});}
        const stroke=(color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();};
        const gradient=ctx.createLinearGradient(b.x,b.y,points.at(-1).x,points.at(-1).y);gradient.addColorStop(0,e.final?'#fffbd3':'#fff');gradient.addColorStop(1,e.final?'#ffd000':'#2684ff');stroke(gradient,(e.final?5:2)+noise(i+80)*2);stroke(e.final?'#fffbd3':'#e6f6ff',1.3);
        if(i%3===0){const p=points[3];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(angle+.5)*18,p.y+Math.sin(angle+.5)*18);ctx.lineTo(p.x+Math.cos(angle+.8)*42,p.y+Math.sin(angle+.8)*42);ctx.stroke();}
      }
    }
    ctx.restore();
  }
  function paintFinalDischarge(e,age){
    const b=e.body,burst=Math.floor(age/.32),phase=age% .32;
    const pulse=Math.exp(-phase*22)*Math.max(0,1-age/e.duration);
    const noise=n=>{const v=Math.sin(n*127.1+(e.seed+burst*37)*311.7)*43758.5453;return v-Math.floor(v);};
    ctx.save();ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=pulse*(reduced?.12:.7);ctx.fillStyle='#fff4bb';ctx.fillRect(0,0,C.width,C.height);
    ctx.globalAlpha=(.25+.75*pulse)*(1-age/e.duration)*(reduced?.4:1);
    const glow=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,650);
    glow.addColorStop(0,'#fffbdac0');glow.addColorStop(.35,'#ffd21c60');glow.addColorStop(1,'#ffbf0000');
    ctx.fillStyle=glow;ctx.fillRect(0,0,C.width,C.height);
    const stroke=(points,width,color)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();};
    const count=reduced?12:32;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2+(noise(i)-.5)*.3,points=[{x:b.x,y:b.y}];
      for(let k=1;k<=12;k++){const distance=720*k/12,jitter=(noise(i*19+k)-.5)*65;points.push({x:b.x+Math.cos(a)*distance-Math.sin(a)*jitter,y:b.y+Math.sin(a)*distance+Math.cos(a)*jitter});}
      ctx.shadowColor='#ffbc00';ctx.shadowBlur=reduced?4:28;
      stroke(points,10+noise(i+80)*5,'#eeb800');stroke(points,5,'#ffe63a');stroke(points,1.8,'#fffde2');
      for(const k of [3,6,9]){const p=points[k],angle=a+(noise(i+k)>.5?1:-1)*.65,branch=[p];for(let j=1;j<=4;j++)branch.push({x:p.x+Math.cos(angle)*j*38+(noise(i*43+j)-.5)*30,y:p.y+Math.sin(angle)*j*38+(noise(i*53+j)-.5)*30});stroke(branch,4,'#ffd931');stroke(branch,1,'#fffde2');}
    }
    ctx.restore();
  }
  const rockLayer=document.createElement('div'),rockNodes=new Map();rockLayer.className='puzzle-rock-layer';rockLayer.setAttribute('aria-hidden','true');canvas.after(rockLayer);
  function syncRocks(){const live=new Set();for(const b of world.bodies){if(!b.rock)continue;live.add(b.id);let el=rockNodes.get(b.id);if(!el){el=document.createElement('span');el.className='puzzle-rock';rockLayer.append(el);rockNodes.set(b.id,el);}el.style.filter=world.water.height&&b.y+b.r>C.height-world.water.height?'sepia(.25) saturate(1.4) hue-rotate(140deg)':'';el.style.left=b.x/4+'%';el.style.top=b.y/5.7+'%';el.style.width=b.r/2+'%';el.style.height=b.r/2.85+'%';el.style.transform='translate(-50%,-50%) rotate('+b.angle+'rad)';}for(const [id,el] of rockNodes)if(!live.has(id)){el.remove();rockNodes.delete(id);}}
  let audio=null,lastLaserSound=-1,lastBreakSound=-1;
  function enableAudio(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
  function sound(crash){if(!audio||audio.state!=='running')return;const now=audio.currentTime;if(now-(crash?lastBreakSound:lastLaserSound)<(crash?.085:.045))return;if(crash)lastBreakSound=now;else lastLaserSound=now;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=crash?'triangle':'sawtooth';osc.frequency.setValueAtTime(crash?190:1500,now);osc.frequency.exponentialRampToValueAtTime(crash?35:180,now+.13);gain.gain.setValueAtTime(crash?.065:.025,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.16);osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.17);}
  function paintAttacks(){ctx.save();for(const l of world.lasers){const age=world.time-l.start;if(age<0)continue;if(!l.sounded){l.sounded=true;sound(false);}const x=l.direction===1?-65+530*Math.min(1,age/C.laserDuration):465-530*Math.min(1,age/C.laserDuration),tail=x-l.direction*85;ctx.shadowColor='#ff159d';ctx.shadowBlur=16;const g=ctx.createLinearGradient(tail,0,x,0);g.addColorStop(0,'#ff149300');g.addColorStop(.65,'#ff23b8');g.addColorStop(1,'#fff');ctx.strokeStyle=g;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(tail,l.y);ctx.lineTo(x,l.y);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x-l.direction*48,l.y);ctx.lineTo(x,l.y);ctx.stroke();}ctx.shadowBlur=0;
  for(const e of world.shatters){const age=world.time-e.time,life=1-age/C.shatterDuration;if(!e.sounded){e.sounded=true;sound(true);}ctx.globalAlpha=Math.max(0,life);if(age<.12){ctx.fillStyle='#fff';ctx.shadowColor='#ff159d';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(e.x,e.y,4+age*110,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}const count=reduced?8:22;for(let i=0;i<count;i++){const n=((Math.sin((i+1)*127.1+e.seed*311.7)*43758.5453)%1+1)%1,a=i/count*Math.PI*2+n*.4,speed=55+n*110,x=e.x+Math.cos(a)*speed*age,y=e.y+Math.sin(a)*speed*age+110*age*age,size=(2+n*4)*life;ctx.save();ctx.translate(x,y);ctx.rotate(a+age*(n-.5)*18);ctx.fillStyle=i%5===0?'#ffb5e5':['#414b58','#a0adbb','#e4edf7'][i%3];ctx.beginPath();ctx.moveTo(-size,-size*.5);ctx.lineTo(size*.3,-size);ctx.lineTo(size,size*.3);ctx.lineTo(-size*.4,size);ctx.closePath();ctx.fill();ctx.restore();}}ctx.restore();}
  let specialCue=null,heartbeatNodes=[];
  function stopHeartbeat(){for(const n of heartbeatNodes){try{n.stop();}catch{}}heartbeatNodes=[];}
  function syncSpecial(){const e=world.activeEffect,board=canvas.parentElement;
    if(e!==specialCue){stopHeartbeat();specialCue=e;if(e?.kind==='heart'&&audio?.state==='running'&&running){try{const base=audio.currentTime-(world.time-e.time);for(const delay of [0,.18,.8,.98,1.6,1.78]){const t=base+delay;if(t<audio.currentTime)continue;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(80,t);osc.frequency.exponentialRampToValueAtTime(35,t+.14);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.1,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+.17);heartbeatNodes.push(osc);}}catch{stopHeartbeat();}}}
    board.style.transform='';board.style.transformOrigin='';if(!e||reduced||!running)return;const age=world.time-e.time;
    if(e.kind==='brain')board.style.transform='translateX('+Math.sin(age*90)*12+'px)';
    if(e.kind==='heart'){const beat=age%.8,pulse=Math.exp(-beat*24)+(beat>=.18?.65*Math.exp(-(beat-.18)*28):0);board.style.transform='translateY('+(-pulse*5)+'px) scale('+(1+pulse*.012)+')';board.style.transformOrigin=e.body.x/4+'% '+e.body.y/5.7+'%';}
  }
  function paintSpecial(){const e=world.activeEffect;if(!e||e.kind==='discharge')return;const img=images[e.body.level];if(!img?.complete||!img.naturalWidth)return;ctx.save();ctx.globalAlpha=.5;const scale=Math.max(C.width/img.naturalWidth,C.height/img.naturalHeight);ctx.drawImage(img,(C.width-img.naturalWidth*scale)/2,(C.height-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);ctx.restore();}
  function paintDrill(){const d=world.drill;if(!d)return;ctx.save();ctx.beginPath();ctx.rect(0,0,C.width,C.height);ctx.clip();ctx.translate(d.x,d.y);ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(26,0);ctx.lineTo(26,208);ctx.lineTo(0,260);ctx.lineTo(-26,208);ctx.closePath();ctx.clip();const metal=ctx.createLinearGradient(-26,0,26,0);for(const [p,c] of [[0,'#343e49'],[.3,'#b4bfca'],[.46,'#fff'],[.65,'#aab5c0'],[1,'#343e49']])metal.addColorStop(p,c);ctx.fillStyle=metal;ctx.fillRect(-26,0,52,260);for(let y=-40;y<300;y+=32){const phase=(d.angle/(Math.PI*2)%1)*32;ctx.beginPath();ctx.moveTo(-26,y+phase);ctx.lineTo(26,y+22+phase);ctx.lineWidth=9;ctx.strokeStyle='#38434f';ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#eef5ff';ctx.stroke();}ctx.restore();}
  function paintWater(){
    const w=world.water;if(world.stageIndex>2||(!w.height&&!w.raining))return;
    ctx.save();polygon([...world.stage.left,...world.stage.right.slice().reverse()].map(([x,y])=>({x,y})));ctx.clip();
    if(w.height){
      const fill=ctx.createLinearGradient(0,C.height-w.height,0,C.height);fill.addColorStop(0,'#8cdeff30');fill.addColorStop(1,'#237fa653');
      ctx.beginPath();ctx.moveTo(0,C.height);for(let x=0;x<=C.width;x+=5)ctx.lineTo(x,world.waterSurface(x));ctx.lineTo(C.width,C.height);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      ctx.beginPath();for(let x=0;x<=C.width;x+=5){if(x)ctx.lineTo(x,world.waterSurface(x));else ctx.moveTo(x,world.waterSurface(x));}ctx.lineWidth=1.5;ctx.strokeStyle='#b9efffb0';ctx.stroke();
    }
    if(w.raining){ctx.strokeStyle='#b6e4ff99';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<65;i++){const x=(i*73.7+w.elapsed*28)%C.width,y=(i*97+w.elapsed*510)%C.height;ctx.moveTo(x,y);ctx.lineTo(x-2,y+11);}ctx.stroke();}
    ctx.restore();
    if(w.height&&!w.raining){ctx.save();ctx.strokeStyle='#82cce94a';ctx.globalAlpha=Math.min(1,w.height/8);ctx.lineWidth=1;ctx.beginPath();for(const side of [world.stage.left,world.stage.right])for(let i=1;i<side.length;i++){const a=side[i-1],b=side[i],y=C.height-w.height*.55;if(y<a[1]||y>b[1])continue;const x=a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]),sign=side===world.stage.left?-1:1;for(let j=0;j<3;j++){const fall=(w.elapsed*9+j*8)%24;ctx.moveTo(x+sign*(2+j*2),y+fall);ctx.lineTo(x+sign*(3+j*2),y+fall+4);}}ctx.stroke();ctx.restore();}
  }
  let heardExplosions=0;
  function blastSound(){if(!audio||audio.state!=='running')return;const now=audio.currentTime,buffer=audio.createBuffer(1,audio.sampleRate*.65,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1800,now);filter.frequency.exponentialRampToValueAtTime(180,now+.65);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.035);gain.gain.exponentialRampToValueAtTime(.0001,now+.65);source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();}
  function paintBlasts(){
    if(world.explosions<heardExplosions)heardExplosions=0;
    if(world.explosions>heardExplosions){heardExplosions=world.explosions;blastSound();}
    ctx.save();ctx.beginPath();world.stage.left.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));world.stage.right.slice().reverse().forEach(([x,y])=>ctx.lineTo(x,y));ctx.closePath();ctx.clip();
    for(const e of world.blasts){const age=world.time-e.time,reach=age*530/C.laserDuration/2;ctx.globalAlpha=Math.min(1,Math.max(0,(1.22-age)*4));
      for(const vertical of [false,true]){const g=vertical?ctx.createLinearGradient(e.x-e.r,0,e.x+e.r,0):ctx.createLinearGradient(0,e.y-e.r,0,e.y+e.r);g.addColorStop(0,'#ff1620');g.addColorStop(.35,'#ffbaba');g.addColorStop(.5,'#fff');g.addColorStop(.65,'#ffbaba');g.addColorStop(1,'#ff1620');ctx.fillStyle=g;if(vertical)ctx.fillRect(e.x-e.r,Math.max(0,e.y-reach),2*e.r,Math.min(C.height,e.y+reach)-Math.max(0,e.y-reach));else ctx.fillRect(Math.max(0,e.x-reach),e.y-e.r,Math.min(C.width,e.x+reach)-Math.max(0,e.x-reach),2*e.r);}}
    ctx.restore();
  }
  function paint(){syncSpecial();ctx.clearRect(0,0,C.width,C.height);ctx.fillStyle='#101923';ctx.fillRect(0,0,C.width,C.height);ctx.strokeStyle='#ffffff07';ctx.lineWidth=1;for(let x=20;x<C.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,C.height);ctx.stroke();}
    // Render the exact same polylines used by collision detection.
    ctx.save();const shake=world.activeEffect?.kind==='discharge'?world.activeEffect:null;if(shake&&!reduced)ctx.translate(Math.sin(world.time*85)*2.5,Math.cos(world.time*97)*1.5);
    for(const [side,edge] of [[world.stage.left,0],[world.stage.right,C.width]]){
      polygon([{x:edge,y:0},...side.map(([x,y])=>({x,y})),{x:edge,y:C.height}]);ctx.fillStyle='#303c49';ctx.fill();
      ctx.beginPath();side.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#99adbd';ctx.lineWidth=3;ctx.stroke();
    }
    ctx.restore();ctx.setLineDash([6,5]);ctx.strokeStyle=world.overflow?'#ff8c88':'#93a4b65c';ctx.beginPath();ctx.moveTo(0,C.deadline);ctx.lineTo(C.width,C.deadline);ctx.stroke();ctx.setLineDash([]);ctx.font='11px Arial';ctx.fillStyle='#a5b4c4';ctx.fillText(world.overflow?`あと ${Math.max(0,2.5-world.overflow).toFixed(1)} 秒 / seconds`:'ここまで積むとピンチ！',10,C.deadline-15);ctx.font='9px Arial';ctx.fillText(world.overflow?'Clear the top line!':'Danger: keep tiles below this line',10,C.deadline-3);
    if(running&&!world.over&&!world.clear){const r=world.current<0?C.pieces[0].radius*2/3:C.pieces[world.current].radius,x=world.aimX(aim,r);ctx.setLineDash([4,6]);ctx.strokeStyle='#b8d9ee55';ctx.beginPath();ctx.moveTo(x,r*2+8);ctx.lineTo(x,C.height);ctx.stroke();ctx.setLineDash([]);drawTile({level:world.current,rock:world.current===-1,bomb:world.current===-2,r,x,y:r+5,angle:0},.6);}
    world.bodies.forEach(b=>drawTile(b));paintWater();paintBlasts();paintDischarges();paintAttacks();paintSpecial();paintDrill();syncRocks();syncCombo();paintClear();
    for(const e of world.events){const age=world.time-e.time;ctx.save();ctx.globalAlpha=1-age;ctx.fillStyle=e.final?'#ffe49b':'#b8ffe8';ctx.textAlign='center';ctx.font=`bold ${e.final?22:16}px Arial`;ctx.fillText(`+${e.points}${e.combo>1?' ×'+e.combo:''}`,e.x,e.y-(reduced?0:age*40));if(e.final&&!reduced){ctx.beginPath();ctx.arc(e.x,e.y,30+age*100,0,Math.PI*2);ctx.strokeStyle='#ffe49b';ctx.lineWidth=3;ctx.stroke();}ctx.restore();}
  }
  function statusText(ja,en){const el=$('puzzle-status'),small=document.createElement('small');small.className='puzzle-translation';small.lang='en';small.textContent=en;el.replaceChildren(document.createTextNode(ja),small);}
  function score(){if(drawnScore===world.score)return;drawnScore=world.score;$('puzzle-score').textContent=world.score;if(world.score>best){best=world.score;$('puzzle-best').textContent=best;try{localStorage.setItem('emj-puzzle-best',String(best));}catch{}}}
  function overlay(title,text,button,english=''){$('puzzle-overlay').hidden=false;$('puzzle-overlay-title').textContent=title;$('puzzle-overlay-copy').textContent=text;if(english){const en=document.createElement('small');en.lang='en';en.className='puzzle-translation';en.textContent=english;$('puzzle-overlay-copy').append(en);}const parts=button.split(' / ');$('puzzle-start').textContent=parts[0];if(parts[1]){const en=document.createElement('small');en.lang='en';en.className='puzzle-translation';en.textContent=parts[1];$('puzzle-start').append(en);}}
  function start(){if(running||(world.clear&&!clearDone))return;enableAudio();specialCue=null;if(paused){paused=false;}else{world.reset();resetClear();playMs=0;drawnScore=-1;aim=200;$('puzzle-aim').value=200;lastEvent=null;score();previews();}clockStarted=performance.now();updateTime();running=true;last=0;accumulator=0;$('puzzle-overlay').hidden=true;$('puzzle-pause').disabled=false;$('puzzle-status').textContent='同じタイルをくっつけよう！';const en=document.createElement('small');en.className='puzzle-translation';en.lang='en';en.textContent='Merge matching tiles!';$('puzzle-status').append(en);canvas.focus();paint();}
  function drop(){if(!running||paused||world.clear)return;if(world.drop(aim))previews();paint();}
  function pause(){if(!running||world.over||world.clear)return;stopHeartbeat();stopClock();running=false;paused=true;syncSpecial();overlay('ひとやすみ','つづきから遊べるよ。','つづける / Resume','Take a break. Resume whenever you like.');}
  $('puzzle-start').addEventListener('click',start);$('puzzle-drop').addEventListener('click',drop);$('puzzle-pause').addEventListener('click',pause);
  $('puzzle-aim').addEventListener('input',e=>{aim=Number(e.target.value);paint();});
  function point(e){const rect=canvas.getBoundingClientRect();aim=Math.max(0,Math.min(C.width,(e.clientX-rect.left)*C.width/rect.width));$('puzzle-aim').value=aim;paint();}
  let pointer=null;
  let stageAnimation=null;
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.stage);if(index===world.stageIndex||(world.clear&&!clearDone))return;
    const direction=index>world.stageIndex?1:-1;
    running=false;paused=false;pointer=null;last=0;accumulator=0;lastEvent=null;
    world.reset(index);resetClear();playMs=0;clockStarted=null;updateTime();drawnScore=-1;aim=200;$('puzzle-aim').value=200;score();previews();
    $('puzzle-pause').disabled=true;
    stageLabel();
    $('puzzle-status').textContent='';
    overlay(world.stage.name,`${world.stage.description}。同じタイルをくっつけよう！`,'PLAY',world.stage.descriptionEn+' Merge two matching tiles!');
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
  document.addEventListener('visibilitychange',()=>{if(world.clear)clearLast=null;else if(document.hidden)pause();});
  const fireworksCanvas=document.createElement('canvas');fireworksCanvas.width=C.width;fireworksCanvas.height=C.height;fireworksCanvas.className='puzzle-fireworks';fireworksCanvas.setAttribute('aria-hidden','true');canvas.after(fireworksCanvas);const fireworksContext=fireworksCanvas.getContext('2d');
  const clearText=document.createElement('div');clearText.className='puzzle-combo puzzle-clear';clearText.hidden=true;clearText.setAttribute('role','status');clearText.innerHTML='<strong>CONGRATULATIONS!!</strong><span>GAME CLEAR!!</span>';canvas.after(clearText);
  function resetClear(){clearAge=0;clearLast=null;clearDone=false;clearText.hidden=true;}
  function revealSecret(){
    if(secretRevealed)return;secretRevealed=true;
    const img=new Image();images[9]=img;img.onload=()=>paint();img.src=C.pieces[9].image;
    const label=document.createElement('span');label.textContent='10. '+C.pieces[9].name;
    $('puzzle-secret').replaceChildren(tile(9),label);
  }
  function advanceClear(now){
    if(clearDone)return;
    if(clearLast===null){stopClock();stopHeartbeat();syncSpecial();pointer=null;revealSecret();clearLast=now;$('puzzle-pause').disabled=true;statusText('ゲームクリア！','Game clear!');}
    if(!document.hidden)clearAge+=Math.max(0,(now-clearLast)/1000);
    clearLast=now;clearText.hidden=false;paint();
    if(clearAge>=5){
      clearDone=true;clearCount++;$('puzzle-clears').textContent=clearCount;
      try{localStorage.setItem('emj-puzzle-clears',String(clearCount));}catch{}
      running=false;paused=false;world.over=true;clearText.hidden=true;
      overlay('GAME CLEAR', 'スコア '+world.score+' / CLEAR '+clearCount,'もういちど / Play again','Score '+world.score+' / CLEAR '+clearCount);
      paint();
    }
  }
  function paintClear(){
    const ctx=fireworksContext;if(!ctx)return;ctx.clearRect(0,0,C.width,C.height);
    if(!world.clear||clearDone)return;
    // Fireworks use only the presentation clock, never bodies or scoring.
    ctx.save();ctx.globalCompositeOperation='screen';
    const colors=['#fff','#ffe75b','#ff28b3','#65edff'];
    for(let i=0;i<12;i++){
      const t=clearAge-i*.32;if(t<0||t>2)continue;
      const x=45+(i*137%310),y=90+(i*79%240),color=colors[i%4];ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
      if(t<.55){const py=C.height-(C.height-y)*t/.55;ctx.beginPath();ctx.moveTo(x,py+24);ctx.lineTo(x,py);ctx.stroke();continue;}
      const age=t-.55;ctx.globalAlpha=Math.max(0,1-age/1.45);
      for(let j=0;j<(reduced?20:40);j++){
        const angle=j/(reduced?20:40)*Math.PI*2,speed=65+(j%5)*13;
        const px=x+Math.cos(angle)*speed*age,py=y+Math.sin(angle)*speed*age+age*age*28;
        ctx.beginPath();ctx.moveTo(px-Math.cos(angle)*7,py-Math.sin(angle)*7);ctx.lineTo(px,py);ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function frame(now){if(world.clear){advanceClear(now);last=now;requestAnimationFrame(frame);return;}if(running){updateTime();if(last)accumulator+=Math.min((now-last)/1000,.08);while(accumulator>=1/120){world.step(1/120,(playMs+(clockStarted===null?0:performance.now()-clockStarted))/1000);accumulator-=1/120;if(world.clear)break;}score();if(world.clear){advanceClear(now);last=now;requestAnimationFrame(frame);return;}const event=world.events.at(-1);if(event&&event!==lastEvent){lastEvent=event;statusText(event.final?'METAL SHOGUN！ メタルの頂点！':event.combo>1?`${event.combo}連鎖！ +${event.points}`:`合体！ +${event.points}`,event.final?'The pinnacle of metal!':`${event.combo>1?event.combo+' combo!':'Merged!'} +${event.points}`);}if(world.over){world.clearEffects();syncSpecial();world.comboCue=null;stopClock();running=false;paused=false;pointer=null;$('puzzle-pause').disabled=true;overlay('GAME OVER',`スコア ${world.score} / 自己ベスト ${best}`,'もういちど / Play again', `Score ${world.score} / Personal best ${best}`);$('puzzle-start').focus();}paint();}last=now;requestAnimationFrame(frame);}
  function stageLabel(){const el=$('puzzle-stage-label'),en=document.createElement('small');en.className='puzzle-translation';en.lang='en';en.textContent='Level '+(world.stageIndex+1)+' · '+world.stage.descriptionEn;el.replaceChildren(document.createTextNode(world.stage.name+' · '+world.stage.description),en);}
  stageLabel();previews();paint();requestAnimationFrame(frame);
})();
