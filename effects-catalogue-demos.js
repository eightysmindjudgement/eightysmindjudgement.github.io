/* Each renderer receives a disposable scope: listeners, animations, observers and
   GPU resources belong to that selection and are released on every switch. */
window.EffectDemos = (() => {
 'use strict';
 const art=(hue=195)=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue},55%,70%)"/><stop offset="1" stop-color="hsl(${hue+50},45%,15%)"/></linearGradient></defs><path fill="url(#g)" d="M0 0h600v400H0z"/><circle cx="430" cy="95" r="55" fill="#f7e6ba"/><path d="M0 370 180 105 310 280 420 150 600 370v30H0" fill="#10223c"/><path d="m130 180 50-75 65 87-60-24z" fill="#d4e8ea"/></svg>`);
 function scope(stage){
  const cleanups=[], animations=[], loops=[];let paused=false,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s={stage,reduced,animations,
   el(tag='div',cls='',text='',parent=stage){const e=document.createElement(tag);e.className=cls;e.textContent=text;parent.append(e);return e;},
   tile(text='MOVE / 01',parent=stage){return s.el('div','fx-tile',text,parent);},
   image(parent=stage,hue=195){const e=s.el('img','fx-art','',parent);e.src=art(hue);e.alt='山並みと太陽のデモ画像';return e;},
   on(e,event,fn,opts){e.addEventListener(event,fn,opts);cleanups.push(()=>e.removeEventListener(event,fn,opts));},
   cleanup(fn){cleanups.push(fn);},
   // Resolve reduced-motion previews before the controller pauses the demo.
   animate(e,frames,options={}){const a=e.animate(frames,{duration:reduced?1:1300,fill:'both',easing:'ease-in-out',...options,...(reduced?{duration:1,iterations:1,delay:0}:{})});animations.push(a);if(reduced)a.finish();else if(paused)a.pause();return a;},
   loop(fn){let frame=0,id=null;const tick=t=>{id=null;if(disposed||paused)return;fn(t,frame++);if(!reduced)id=requestAnimationFrame(tick);};const loop={stop(){if(id!==null)cancelAnimationFrame(id);id=null;},start(){if(id===null&&!disposed){if(reduced)tick(0);else id=requestAnimationFrame(tick);}}};loops.push(loop);loop.start();cleanups.push(()=>loop.stop());},
   observer(o){cleanups.push(()=>o.disconnect());return o;},
   pause(value){paused=value;animations.forEach(a=>{if(a.playState!=='finished'&&a.playState!=='idle')value?a.pause():a.play();});loops.forEach(l=>value?l.stop():l.start());},
   dispose(){disposed=true;cleanups.reverse().forEach(fn=>fn());animations.forEach(a=>a.cancel());stage.replaceChildren();},
   get paused(){return paused;}
  };return s;
 }
 const basic={
  'FADE IN':[{opacity:0},{opacity:1}], 'FADE OUT':[{opacity:1},{opacity:0}], 'FADE IN / OUT':[{opacity:0},{opacity:1,offset:.5},{opacity:0}],
  'SLIDE IN':[{transform:'translateX(-330px)',opacity:0},{transform:'translateX(0)',opacity:1}], 'SLIDE OUT':[{transform:'translateX(0)',opacity:1},{transform:'translateX(330px)',opacity:0}],
  'ZOOM IN':[{transform:'scale(.1)',opacity:0},{transform:'scale(1)',opacity:1}], 'ZOOM OUT':[{transform:'scale(3)',opacity:0},{transform:'scale(1)',opacity:1}],
  'SCALE TRANSFORM':[{transform:'scale(.65)'},{transform:'scale(1.25)'},{transform:'scale(1)'}], 'ROTATE IN':[{transform:'rotate(-140deg) scale(.2)',opacity:0},{transform:'rotate(0) scale(1)',opacity:1}],
  'FLIP IN':[{transform:'rotateY(110deg)',opacity:0},{transform:'rotateY(0)',opacity:1}], 'BOUNCE':[{transform:'translateY(-110px)'},{transform:'translateY(0)',offset:.45},{transform:'translateY(-55px)',offset:.65},{transform:'translateY(0)',offset:.8},{transform:'translateY(-20px)',offset:.9},{transform:'translateY(0)'}],
  'ELASTIC':[{transform:'scaleX(.3)'},{transform:'scaleX(1.35)',offset:.45},{transform:'scaleX(.8)',offset:.65},{transform:'scaleX(1.1)',offset:.85},{transform:'scaleX(1)'}], 'BLUR IN':[{filter:'blur(25px)',opacity:0},{filter:'blur(0)',opacity:1}],
  'CLIP-PATH REVEAL':[{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)'}], 'WIPE TRANSITION':[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}]
 };
 const recipes={
  'FADE IN':'opacity を 0 → 1 に補間します。レイアウトを動かさず表示できます。',
  'FADE OUT':'opacity を 1 → 0 に補間します。実際のUIでは完了後に要素を除去します。',
  'CLIP-PATH REVEAL':'clip-path の円の半径を補間し、要素の表示領域を広げます。',
  'DRAG & DROP':'Pointer Events と pointer capture でマウス・タッチを共通処理し、受け取り枠との交差を判定します。',
  'VARIABLE FONT ANIMATION':'この簡易デモはシステムフォントの font-weight を変化させます。滑らかな軸補間には wght 軸を持つ可変フォントが必要です。',
  'VIEW TRANSITIONS':'同じページの状態変更を document.startViewTransition() で包みます。非対応時はクロスフェードへ切り替えます。',
  'WEBGL EFFECTS':'フラグメントシェーダーの sin 関数と時刻 uniform で色の波を生成します。切り替え時に GPU リソースを削除します。',
  'LAZY LOADING':'IntersectionObserver の交差時にだけ画像の src を設定します。表示済みの要素は監視を終了します。',
  'SHATTER EFFECT':'元画像と同じ座標のタイルを作り、それぞれを回転・移動して一枚の図形が砕ける動きを作ります。',
  'LIQUID TRANSITION':'簡易デモ：border-radius と scale の変形を組み合わせます。流体シミュレーションは使用していません。',
  'MOTION BLUR':'簡易デモ：移動中に CSS filter: blur() を加えます。物理的な方向性モーションブラーではありません。',
  'SHARED ELEMENT TRANSITION':'簡易デモ：一つの共通カードの位置・サイズを補間します。ページ間の遷移は行いません。',
  'CUBE TRANSITION':'簡易デモ：一つのパネルをY軸で90度回転させ、立方体の面が切り替わる印象を表現します。',
  'ROUTE TRANSITION':'簡易デモ：同一ページ内で退場 → 内容の更新 → 登場を実行します。ルーターは使用しません。',
  'MORPH TRANSITION':'簡易デモ：画面を表すパネルの輪郭・色・サイズを補間します。任意パスの補間ではありません。',
  'SCENE TRANSITION':'簡易デモ：CSS の translateZ と背景色を変え、場面の奥行きを切り替えます。'
 };
 function renderScroll(s,e){
  const box=s.el('div','fx-scroll');box.tabIndex=0;box.setAttribute('aria-label','デモ専用スクロール領域');
  const progress=s.el('div','fx-progress','',box);const content=s.el('div','fx-scroll-content','',box);
  s.el('p','','↓ この枠の中をスクロール',content);
  const name=e.name;
  if(['SMOOTH SCROLL','BACK TO TOP'].includes(name)){
   const top=s.el('button','','下の目印へ ↓',content);const marker=s.el('div','','目的地 / DESTINATION',content);marker.style.marginTop='600px';const back=s.el('button','','先頭へ ↑',content);
   s.on(top,'click',()=>box.scrollTo({top:550,behavior:s.reduced?'instant':'smooth'}));s.on(back,'click',()=>box.scrollTo({top:0,behavior:s.reduced?'instant':'smooth'}));return;
  }
  if(['STICKY SCROLLING','PINNED SECTION','STICKY NAVIGATION'].includes(name)){
   s.el('div','fx-sticky',name==='STICKY NAVIGATION'?'01 / INTRO     02 / STORY     03 / END':'PINNED / この区間では固定',content);
   ['INTRO','STORY','END'].forEach(t=>s.tile(t,content));return;
  }
  if(name==='LAZY LOADING'){
   s.el('p','','画像は下へ進むと読み込まれます。',content);const img=s.el('img','fx-art','',content);img.alt='スクロールして読み込む山並み';img.style.cssText='display:block;margin:380px auto 0';
   const status=s.el('p','','未読込 / WAITING',content);
   if(!window.IntersectionObserver){img.src=art();status.textContent='代替表示：監視API非対応のため即時読み込み';return;}
   const ob=s.observer(new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){img.src=art();status.textContent='読み込み済み / LOADED';ob.disconnect();}},{root:box}));ob.observe(img);return;
  }
  const target=name.includes('IMAGE')?s.image(content):s.tile(name==='TEXT REVEAL ON SCROLL'?'SCROLL TO READ':'SCROLL / 02',content);
  target.style.cssText+=';position:sticky;top:105px;margin:190px auto 0;display:grid';
  const background=s.el('div','fx-dot','',content);background.style.cssText='position:absolute;left:15%;top:220px;width:80px;height:80px;opacity:.5';
  if(name==='SCROLL REVEAL'||name==='SCROLL-TRIGGERED ANIMATION'){
   target.style.opacity=0;
   if(window.IntersectionObserver){const ob=s.observer(new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){s.animate(target,name==='SCROLL REVEAL'?basic['FADE IN']:basic['ROTATE IN']);ob.unobserve(target);} }),{root:box,threshold:.5}));ob.observe(target);}else{target.style.opacity=1;s.el('p','','代替表示：IntersectionObserver 非対応',content);}return;
  }
  const update=()=>{const p=Math.min(1,box.scrollTop/(content.scrollHeight-box.clientHeight));progress.style.transform=`scaleX(${p})`;
   if(name==='HORIZONTAL SCROLL')target.style.transform=`translateX(${(p-.5)*400}px)`;
   else if(name==='ZOOM ON SCROLL')target.style.transform=`scale(${.5+p*1.3})`;
   else if(name.includes('REVEAL'))target.style.clipPath=`inset(0 ${100-p*100}% 0 0)`;
   else if(name==='PARALLAX SCROLLING'){background.style.transform=`translateY(${p*350}px)`;target.style.transform=`translateY(${p*80}px)`;}
   else if(name!=='SCROLL PROGRESS BAR')target.style.transform=`rotate(${p*360}deg)`;
  };s.on(box,'scroll',update,{passive:true});update();
 }
 function renderTransition(s,e){
  const tile=s.tile('VIEW / A');tile.style.position='absolute';let next=false;
  const button=s.el('button','','切り替える / CHANGE');button.style.cssText='position:absolute;bottom:20px';
  s.on(button,'click',()=>{next=!next;const update=()=>{tile.textContent=next?'VIEW / B':'VIEW / A';tile.style.background=next?'linear-gradient(135deg,#f0d6ac,#b96e67)':'';};
   if(e.name==='VIEW TRANSITIONS'&&document.startViewTransition&&!s.reduced){const t=document.startViewTransition(update);s.cleanup(()=>t.skipTransition());return;}
   update();
   const frames={
    'CROSSFADE':[{opacity:0},{opacity:1}], 'VIEW TRANSITIONS':[{opacity:0},{opacity:1}],
    'MORPH TRANSITION':[{borderRadius:'50%',transform:'scale(.3)'},{borderRadius:'12px',transform:'scale(1)'}],
    'SHARED ELEMENT TRANSITION':[{transform:next?'translate(-90px,-55px) scale(.5)':'translate(90px,55px) scale(.5)'},{transform:'translate(0,0) scale(1)'}],
    'PAGE WIPE':basic['WIPE TRANSITION'],'CURTAIN TRANSITION':[{clipPath:'inset(0 50%)'},{clipPath:'inset(0 0)'}],
    'CUBE TRANSITION':[{transform:'rotateY(-90deg) translateZ(90px)'},{transform:'rotateY(0) translateZ(0)'}],
    'ROUTE TRANSITION':[{transform:'translateX(0)',opacity:1},{transform:'translateX(-150px)',opacity:0,offset:.45},{transform:'translateX(150px)',opacity:0,offset:.5},{transform:'translateX(0)',opacity:1}]
   };s.animate(tile,frames[e.name]);
  });
  if(e.name==='VIEW TRANSITIONS'&&!document.startViewTransition)s.el('p','fx-scroll-hint','このブラウザではクロスフェードを代替表示');
 }
 function renderInteraction(s,e){
  const n=e.name;
  if(n==='ACCORDION'){const d=s.el('details');s.el('summary','','クリックして説明を開く',d);s.el('p','','必要な内容だけを表示することで情報を整理できます。',d);return;}
  if(n==='MODAL / LIGHTBOX'){
   const b=s.el('button','','詳細を開く');const d=s.el('dialog');s.el('p','','LIGHTBOX / 詳細表示',d);s.image(d);const close=s.el('button','','閉じる',d);s.on(b,'click',()=>d.showModal());s.on(close,'click',()=>d.close());s.cleanup(()=>d.close());return;
  }
  if(n==='TOGGLE SWITCH'){const b=s.el('button','fx-switch');b.setAttribute('role','switch');b.setAttribute('aria-checked','false');b.setAttribute('aria-label','デモの設定');s.el('span','','',b);s.on(b,'click',()=>b.setAttribute('aria-checked',String(b.getAttribute('aria-checked')!=='true')));return;}
  const tile=n==='IMAGE ZOOM HOVER'?s.image():s.el('button','fx-tile','TRY ME');
  if(n==='DRAG & DROP'){
   s.stage.style.gap='35px';tile.style.touchAction='none';tile.setAttribute('aria-label','ドラッグ、またはクリックで右の枠へ移動');const drop=s.el('div','fx-drop','DROP HERE');let start=null,moved=false;
   s.on(tile,'pointerdown',ev=>{start={x:ev.clientX,y:ev.clientY};moved=false;tile.setPointerCapture(ev.pointerId);});
   s.on(tile,'pointermove',ev=>{if(!start)return;const x=ev.clientX-start.x,y=ev.clientY-start.y;moved=Math.abs(x)+Math.abs(y)>5;tile.style.transform=`translate(${x}px,${y}px)`;});
   const finish=ev=>{if(!start)return;start=null;const r=drop.getBoundingClientRect();const ok=ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom;tile.style.transform='';if(ok){drop.textContent='DROPPED ✓';tile.textContent='DONE';}};
   s.on(tile,'pointerup',finish);s.on(tile,'pointercancel',()=>{start=null;tile.style.transform='';});s.on(tile,'click',()=>{if(!moved){drop.textContent='DROPPED ✓';tile.textContent='DONE';}});return;
  }
  if(n==='RIPPLE EFFECT'){s.on(tile,'click',ev=>{const r=tile.getBoundingClientRect();const wave=s.el('span','','',tile);tile.style.cssText+=';position:relative;overflow:hidden';wave.style.cssText=`position:absolute;left:${ev.detail?ev.clientX-r.left:r.width/2}px;top:${ev.detail?ev.clientY-r.top:r.height/2}px;width:10px;height:10px;border-radius:50%;background:#fff9;pointer-events:none`;
   const a=s.animate(wave,[{transform:'translate(-50%,-50%) scale(0)',opacity:1},{transform:'translate(-50%,-50%) scale(40)',opacity:0}],{duration:800});a.finished.then(()=>wave.remove()).catch(()=>{});});return;}
  let cursor;if(n==='CURSOR FOLLOW'||n==='CUSTOM CURSOR'){cursor=s.el('div','fx-cursor');if(n==='CUSTOM CURSOR')s.stage.style.cursor='none';}
  const move=ev=>{const r=s.stage.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;
   if(cursor){cursor.style.left=`${ev.clientX-r.left}px`;cursor.style.top=`${ev.clientY-r.top}px`;}
   if(n==='MAGNETIC BUTTON')tile.style.transform=`translate(${x*90}px,${y*70}px)`;
   if(n==='TILT EFFECT')tile.style.transform=`rotateX(${-y*45}deg) rotateY(${x*45}deg)`;
  };s.on(s.stage,'pointermove',move);s.on(s.stage,'pointerdown',move);s.on(s.stage,'pointerleave',()=>tile.style.transform='');
  const frames={ 'HOVER EFFECT':[{background:'#487b9d'},{background:'#e4bf90'}],'HOVER LIFT':[{transform:'translateY(0)',boxShadow:'0 0 0 #0000'},{transform:'translateY(-18px)',boxShadow:'0 30px 35px #0009'}],'HOVER GLOW':[{boxShadow:'0 0 0 #9de4ff00'},{boxShadow:'0 0 55px #9de4ff'}],'HOVER SCALE':[{transform:'scale(1)'},{transform:'scale(1.18)'}],'IMAGE ZOOM HOVER':[{transform:'scale(1)'},{transform:'scale(1.3)'}] };
  if(frames[n]){const run=()=>s.animate(tile,frames[n],{duration:350});s.on(tile,'pointerenter',run);s.on(tile,'focus',run);s.on(tile,'click',run);s.on(tile,'pointerleave',()=>s.animate(tile,[frames[n][1],frames[n][0]],{duration:350}));}
 }
 function renderText(s,e){const n=e.name;const text=s.el('div','fx-type','MOTION');
  const frames={
   'TEXT REVEAL':basic['WIPE TRANSITION'],'KINETIC TYPOGRAPHY':[{transform:'rotate(-8deg) translateY(-35px)'},{transform:'rotate(8deg) translateY(35px)'},{transform:'rotate(-8deg) translateY(-35px)'}],
   'TEXT GRADIENT':[{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%'}], 'TEXT GLOW':[{textShadow:'0 0 0 #80dfff'},{textShadow:'0 0 30px #80dfff,0 0 70px #80dfff'},{textShadow:'0 0 0 #80dfff'}],
   'TEXT STROKE':[{webkitTextStrokeWidth:'1px'},{webkitTextStrokeWidth:'3px'},{webkitTextStrokeWidth:'1px'}], 'TEXT SHADOW':[{textShadow:'0 0 #5983a6'},{textShadow:'10px 10px #5983a6'},{textShadow:'0 0 #5983a6'}],
   'MARQUEE':[{transform:'translateX(450px)'},{transform:'translateX(-450px)'}],'VARIABLE FONT ANIMATION':[{fontWeight:100},{fontWeight:900},{fontWeight:100}]
  };
  if(n==='TYPEWRITER EFFECT'||n==='SPLIT TEXT ANIMATION'){
   text.textContent='';[...'MOTION'].forEach((ch,i)=>{const span=s.el('span','',ch,text);span.style.display='inline-block';s.animate(span,n==='TYPEWRITER EFFECT'?[{opacity:0},{opacity:1}]:[{transform:'translateY(75px) rotate(30deg)',opacity:0},{transform:'translateY(0) rotate(0)',opacity:1}],{duration:n==='TYPEWRITER EFFECT'?1:600,delay:i*180});});return;
  }
  if(n==='TEXT GRADIENT')text.style.cssText='background:linear-gradient(90deg,#a4e5ff,#f1b9a5,#a4e5ff);background-size:250%;background-clip:text;color:transparent';
  if(n==='TEXT STROKE')text.style.cssText='color:transparent;-webkit-text-stroke:1px #c3ecff';
  s.animate(text,frames[n],{duration:n==='MARQUEE'?5500:2200,iterations:Infinity});
 }
 function renderImages(s,e){const n=e.name;
  if(n==='PARTICLE EFFECT')return renderCanvas(s,true);
  if(n==='IMAGE SLIDER'||n==='IMAGE CAROUSEL'){
   const row=s.el('div','fx-row');let index=0;const prev=s.el('button','','←',row);prev.setAttribute('aria-label','前の画像');const image=s.image(row);const next=s.el('button','','→',row);next.setAttribute('aria-label','次の画像');image.style.width='min(45vw,240px)';
   const change=delta=>{index=(index+delta+3)%3;image.src=art(195+index*65);image.alt=`風景 ${index+1} / 3`;s.animate(image,n==='IMAGE SLIDER'?[{opacity:0},{opacity:1}]:[{transform:`translateX(${delta*100}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:650});};s.on(prev,'click',()=>change(-1));s.on(next,'click',()=>change(1));return;
  }
  if(n==='GRADIENT ANIMATION'){const tile=s.tile('GRADIENT');tile.style.cssText+=';width:80%;height:70%;background:linear-gradient(110deg,#214a83,#dcabac,#247e7b);background-size:300%';s.animate(tile,[{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%'},{backgroundPosition:'0% 50%'}],{duration:5000,iterations:Infinity});return;}
  if(n==='SHIMMER EFFECT'){const tile=s.tile('LOADING');tile.style.cssText+=';background:linear-gradient(110deg,#2f4256 25%,#c3deeb 50%,#2f4256 75%);background-size:300%';s.animate(tile,[{backgroundPosition:'150% 0'},{backgroundPosition:'-50% 0'}],{duration:1800,iterations:Infinity});return;}
  if(n==='NOISE TEXTURE'){s.tile('GRAIN');const svg=s.el('img','fx-noise');svg.alt='ノイズテクスチャ';svg.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="350" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/></filter><path fill="#fff" filter="url(#n)" d="M0 0h350v300H0z"/></svg>');const b=s.el('button','','質感 ON / OFF');b.style.cssText='position:absolute;bottom:20px';s.on(b,'click',()=>svg.hidden=!svg.hidden);return;}
  if(n==='BLEND MODE'){const row=s.el('div','fx-row');['#ff8888','#66ddff'].forEach((color,i)=>{const dot=s.el('div','fx-dot','',row);dot.style.cssText=`width:140px;height:140px;background:${color};mix-blend-mode:screen;margin-left:${i?-65:0}px`;s.animate(dot,[{transform:'translateX(-30px)'},{transform:'translateX(30px)'},{transform:'translateX(-30px)'}],{duration:2500,iterations:Infinity});});return;}
  const image=s.image();
  if(n==='IMAGE MASKING')s.animate(image,[{clipPath:'circle(15%)'},{clipPath:'circle(48%)'},{clipPath:'circle(15%)'}],{duration:3000,iterations:Infinity});
  if(n==='KEN BURNS EFFECT')s.animate(image,[{transform:'scale(1) translateX(-10px)'},{transform:'scale(1.5) translateX(20px)'}],{duration:6500,iterations:Infinity,direction:'alternate'});
  if(n==='DUOTONE EFFECT'){image.style.filter='grayscale(1) sepia(1) hue-rotate(150deg) saturate(2)';const b=s.el('button','','原画 / DUOTONE');b.style.cssText='position:absolute;bottom:20px';s.on(b,'click',()=>image.style.filter=image.style.filter?'':'grayscale(1) sepia(1) hue-rotate(150deg) saturate(2)');}
  if(n==='BLUR BACKGROUND'){image.style.cssText+=';width:100%;height:100%;position:absolute;filter:blur(10px)';const tile=s.tile('FOCUS');tile.style.zIndex=1;s.animate(image,[{filter:'blur(0)'},{filter:'blur(14px)'}],{duration:2500,iterations:Infinity,direction:'alternate'});}
  if(n==='IMAGE PARALLAX')s.on(s.stage,'pointermove',ev=>{const r=s.stage.getBoundingClientRect();image.style.transform=`translate(${((ev.clientX-r.left)/r.width-.5)*70}px,${((ev.clientY-r.top)/r.height-.5)*50}px)`;});
 }
 function renderDepth(s,e){const n=e.name;
  if(n==='3D CARD FLIP'){const wrap=s.el('button','fx-flipper');wrap.setAttribute('aria-label','カードを反転');s.el('span','fx-tile fx-front','FRONT',wrap);s.el('span','fx-tile fx-back','BACK',wrap);let flip=false;s.on(wrap,'click',()=>{flip=!flip;s.animate(wrap,[{transform:`rotateY(${flip?0:180}deg)`},{transform:`rotateY(${flip?180:0}deg)`}],{duration:850});});return;}
  if(n==='3D CAROUSEL'){const wrap=s.el('div');wrap.style.cssText='width:120px;height:100px;transform-style:preserve-3d';for(let i=0;i<5;i++){const t=s.tile(String(i+1),wrap);t.style.cssText+=`;position:absolute;width:120px;height:100px;transform:rotateY(${i*72}deg) translateZ(125px);backface-visibility:hidden`;}s.animate(wrap,[{transform:'rotateY(0)'},{transform:'rotateY(-360deg)'}],{duration:10000,iterations:Infinity});return;}
  if(n==='DEPTH OF FIELD'){const row=s.el('div','fx-row');for(let i=0;i<3;i++){const tile=s.tile(String(i+1),row);tile.style.cssText+=';width:85px;height:110px';s.animate(tile,[{filter:`blur(${i*3}px)`,transform:`translateZ(${-i*70}px)`},{filter:`blur(${(2-i)*3}px)`,transform:`translateZ(${-(2-i)*70}px)`}],{duration:2500,iterations:Infinity,direction:'alternate'});}return;}
  if(n==='PARALLAX LAYERS'){const layers=[];for(let i=0;i<3;i++){const t=s.tile(`LAYER ${i+1}`);t.style.cssText+=`;position:absolute;opacity:${.4+i*.25};transform:translate(${i*30-30}px,${i*30-30}px);width:${220-i*35}px`;layers.push(t);}s.on(s.stage,'pointermove',ev=>{const r=s.stage.getBoundingClientRect();layers.forEach((t,i)=>t.style.transform=`translate(${(ev.clientX-r.left-r.width/2)*(i+1)*.13}px,${(ev.clientY-r.top-r.height/2)*(i+1)*.13}px)`);});return;}
  if(n==='INFINITE ZOOM'){for(let i=0;i<5;i++){const t=s.tile('');t.style.cssText+=';position:absolute;background:transparent;box-shadow:none;width:140px;height:140px';s.animate(t,[{transform:'scale(.05)',opacity:0},{opacity:1,offset:.25},{transform:'scale(4)',opacity:0}],{duration:5000,delay:-i*1000,iterations:Infinity});}return;}
  const tile=s.tile('DEPTH');const frames=n==='PERSPECTIVE EFFECT'?[{transform:'rotateX(60deg) translateY(80px)'},{transform:'rotateX(0) translateY(0)'}]:n==='SCENE TRANSITION'?[{transform:'translateZ(-500px)',background:'#284d74'},{transform:'translateZ(150px)',background:'#d7ad8c'}]:[{transform:'rotateX(-25deg) rotateY(0)'},{transform:'rotateX(25deg) rotateY(360deg)'}];s.animate(tile,frames,{duration:4000,iterations:Infinity,direction:'alternate'});
 }
 function renderUI(s,e){const n=e.name;
  if(['SMOOTH SCROLL','BACK TO TOP','STICKY NAVIGATION','LAZY LOADING'].includes(n))return renderScroll(s,e);
  if(n==='LOADING ANIMATION'){s.animate(s.el('div','fx-spinner'),[{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:1100,iterations:Infinity,easing:'linear'});return;}
  if(n==='PROGRESS INDICATOR'){const wrap=s.el('div');const bar=s.el('progress','','',wrap);bar.max=100;const label=s.el('p','','0%',wrap);let t=0;s.loop(()=>{if(s.reduced)t=100;else t=Math.min(100,t+.35);bar.value=t;label.textContent=Math.round(t)+'%';});return;}
  if(n==='SKELETON SCREEN'){const wrap=s.el('div','fx-skeleton');for(let i=0;i<4;i++){const line=s.el('i','','',wrap);s.animate(line,[{backgroundPosition:'100% 0'},{backgroundPosition:'-100% 0'}],{duration:1500,iterations:Infinity});}const b=s.el('button','','読み込み完了',wrap);s.on(b,'click',()=>{s.animations.forEach(a=>a.cancel());wrap.replaceChildren();s.el('p','','CONTENT LOADED ✓',wrap);s.image(wrap);});return;}
  if(n==='TOOLTIP'){const b=s.el('button','','ホバー・フォーカス・タップ');const tip=s.el('div','fx-tip','補足情報 / TOOLTIP');tip.id='fx-tooltip';tip.setAttribute('role','tooltip');b.setAttribute('aria-describedby',tip.id);tip.hidden=true;['pointerenter','focus'].forEach(ev=>s.on(b,ev,()=>tip.hidden=false));['pointerleave','blur'].forEach(ev=>s.on(b,ev,()=>tip.hidden=true));s.on(b,'click',()=>tip.hidden=!tip.hidden);s.on(b,'keydown',ev=>{if(ev.key==='Escape')tip.hidden=true;});return;}
  if(n==='HAMBURGER MENU'){const b=s.el('button','','☰ MENU');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','fx-menu');const menu=s.el('div','fx-menu');menu.id='fx-menu';menu.hidden=true;['INTRO','STORY','CONTACT'].forEach(t=>{const a=s.el('button','',t,menu);s.on(a,'click',()=>{b.textContent='☰ '+t;menu.hidden=true;b.setAttribute('aria-expanded','false');});});s.on(b,'click',()=>{menu.hidden=!menu.hidden;b.setAttribute('aria-expanded',String(!menu.hidden));});s.on(menu,'keydown',ev=>{if(ev.key==='Escape'){menu.hidden=true;b.setAttribute('aria-expanded','false');b.focus();}});return;}
  if(n==='NOTIFICATION TOAST'){const b=s.el('button','','通知を表示');const toast=s.el('div','fx-toast','保存しました ✓');toast.setAttribute('role','status');toast.hidden=true;s.on(b,'click',()=>{toast.hidden=false;s.animate(toast,[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)',offset:.15},{opacity:1,offset:.8},{opacity:0}],{duration:3000});});return;}
  if(n==='BUTTON STATE TRANSITION'){const b=s.el('button','','保存する');s.on(b,'click',()=>{b.disabled=true;b.textContent='保存中…';const a=s.animate(b,[{opacity:.4},{opacity:1}],{duration:1200});a.finished.then(()=>{b.disabled=false;b.textContent='保存完了 ✓';}).catch(()=>{});});return;}
  if(n==='SCROLL INDICATOR'){s.animate(s.el('div','fx-type','↓'),[{transform:'translateY(-15px)',opacity:.3},{transform:'translateY(15px)',opacity:1}],{duration:1000,iterations:Infinity,direction:'alternate'});}
 }
 function renderCanvas(s,particles=false){const canvas=s.el('canvas');const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(s.stage.clientWidth*ratio);canvas.height=Math.round(s.stage.clientHeight*ratio);const ctx=canvas.getContext('2d');if(!ctx){s.el('p','','Canvas が利用できません。粒子の位置を毎フレーム更新する技術です。');return;}
  const count=particles?(innerWidth<760?22:45):1;let clock=0;const dots=Array.from({length:count},()=>({x:Math.random(),y:Math.random(),r:2+Math.random()*4,v:.2+Math.random()}));
  s.loop(()=>{clock+=.016;if(s.reduced)clock=1;ctx.clearRect(0,0,canvas.width,canvas.height);dots.forEach((p,i)=>{const x=particles?(p.x+clock*p.v*.04)%1:.5+Math.sin(clock)*.3;const y=particles?(p.y-clock*p.v*.07+10)%1:.5+Math.cos(clock*1.4)*.25;ctx.beginPath();ctx.fillStyle=particles?'#b9e8fc':'#f1c1a4';ctx.arc(x*canvas.width,y*canvas.height,particles?p.r:28,0,Math.PI*2);ctx.fill();});});s.cleanup(()=>{canvas.width=0;canvas.height=0;});
 }
 function renderWebGL(s){const canvas=s.el('canvas');canvas.width=Math.min(800,s.stage.clientWidth);canvas.height=330;const gl=canvas.getContext('webgl',{antialias:false});if(!gl){canvas.remove();s.el('p','','WebGL が利用できません。代替：CSSの色の波を表示します。');const tile=s.tile('COLOR WAVE');s.animate(tile,[{filter:'hue-rotate(0deg)'},{filter:'hue-rotate(360deg)'}],{duration:4000,iterations:Infinity});return;}
  s.on(canvas,'webglcontextlost',ev=>{ev.preventDefault();s.pause(true);s.el('p','fx-scroll-hint','GPU接続が失われました。REPLAYで再初期化できます。');});
  const shader=(type,source)=>{const v=gl.createShader(type);gl.shaderSource(v,source);gl.compileShader(v);if(!gl.getShaderParameter(v,gl.COMPILE_STATUS))throw Error('Shader compilation failed');s.cleanup(()=>gl.deleteShader(v));return v;};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform float t;void main(){vec3 c=.5+.5*cos(t+uv.xyx*4.+vec3(0.,2.,4.));float w=.5+.5*sin(uv.x*12.+uv.y*8.+t);gl_FragColor=vec4(c*(.35+w*.65),1.);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link failed');gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);const t=gl.getUniformLocation(program,'t');let time=0;s.loop(()=>{time+=.016;gl.uniform1f(t,s.reduced?0:time);gl.viewport(0,0,canvas.width,canvas.height);gl.drawArrays(gl.TRIANGLES,0,6);});s.cleanup(()=>{gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();});
 }
 function renderAdvanced(s,e){const n=e.name;
  if(n==='WEBGL EFFECTS')return renderWebGL(s);if(n==='CANVAS ANIMATION')return renderCanvas(s);
  if(n==='SVG ANIMATION'){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 300 180');svg.style.width='80%';const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M20 90 L75 20 135 150 190 20 250 150 280 90');path.setAttribute('fill','none');path.setAttribute('stroke','#bdeaff');path.setAttribute('stroke-width','5');path.setAttribute('pathLength','1');path.style.strokeDasharray='1';svg.append(path);s.stage.append(svg);s.animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:2500,iterations:Infinity});return;}
  if(['STAGGER ANIMATION','SEQUENCE ANIMATION','CHOREOGRAPHED ANIMATION'].includes(n)){const row=s.el('div','fx-row');for(let i=0;i<5;i++){const dot=s.el('span','fx-dot','',row);s.animate(dot,n==='CHOREOGRAPHED ANIMATION'?[{transform:'translateY(60px) scale(.3)',opacity:0},{transform:'translateY(-40px) scale(1)',opacity:1,offset:.5},{transform:'translateY(0) scale(.8)',opacity:1}]:[{transform:'translateY(50px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:n==='SEQUENCE ANIMATION'?500:1400,delay:i*(n==='SEQUENCE ANIMATION'?500:160)});}return;}
  if(n==='SHATTER EFFECT'||n==='EXPLOSION TRANSITION'){for(let y=0;y<4;y++)for(let x=0;x<5;x++){const piece=s.el('div','fx-piece');piece.style.left=`calc(50% + ${(x-2.5)*35}px)`;piece.style.top=`calc(50% + ${(y-2)*35}px)`;piece.style.backgroundImage=`url("${art()}")`;piece.style.backgroundSize='175px 140px';piece.style.backgroundPosition=`${-x*35}px ${-y*35}px`;const dx=n==='SHATTER EFFECT'?(x-2)*95:(x-2)*160,dy=n==='SHATTER EFFECT'?100+Math.random()*200:(y-1.5)*160;s.animate(piece,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${(x+y)*60}deg)`,opacity:0}],{duration:1800,delay:600});}return;}
  if(n==='GLITCH EFFECT'){const text=s.el('div','fx-type','SIGNAL');s.animate(text,[{transform:'translate(0)',textShadow:'-3px 0 #f46,3px 0 #4ef'},{transform:'translate(8px,-2px)',clipPath:'inset(10% 0 30%)'},{transform:'translate(-5px,3px)',clipPath:'inset(40% 0 0)'},{transform:'translate(0)',clipPath:'inset(0)'}],{duration:650,iterations:Infinity,easing:'steps(1)'});return;}
  const tile=s.tile(n==='MOTION BLUR'?'SPEED':'FLOW');const frames=n==='MOTION BLUR'?[{transform:'translateX(-170px)',filter:'blur(0)'},{transform:'translateX(0)',filter:'blur(9px)',offset:.5},{transform:'translateX(170px)',filter:'blur(0)'}]:n==='INFINITE LOOP ANIMATION'?[{transform:'rotate(0)'},{transform:'rotate(360deg)'}]:[{borderRadius:'15% 65% 30% 55%',transform:'rotate(0) scale(.8)'},{borderRadius:'65% 20% 55% 25%',transform:'rotate(180deg) scale(1.3)'},{borderRadius:'15% 65% 30% 55%',transform:'rotate(360deg) scale(.8)'}];s.animate(tile,frames,{duration:3500,iterations:Infinity});
 }
 const renderers=[(s,e)=>s.animate(s.tile(),basic[e.name]),renderScroll,renderTransition,renderInteraction,renderText,renderImages,renderDepth,renderUI,renderAdvanced];
 return {create(stage,e){const s=scope(stage);try{renderers[e.category](s,e);}catch(err){s.dispose();const p=document.createElement('p');p.textContent='この環境ではデモを開始できません。REPLAYで再試行してください。';stage.append(p);console.error(err);}return s;},
  implementation(e){return recipes[e.name]||(e.category===1?'デモ枠内の scrollTop を進行率へ変換します。出現検知には IntersectionObserver を使い、監視は切り替え時に解除します。':e.category===3?'Pointer Events・click・focus で操作を受け取り、要素の状態を更新します。イベントは選択を切り替える際に解除します。':e.category===4?'文字または文字単位の span に CSS プロパティの変化を適用します。Web Animations API で再生・一時停止を制御します。':'CSS の transform・opacity・filter などを Web Animations API で補間します。描画対象は選択中のデモだけです。');},
  instruction(e){return e.category===1||['SMOOTH SCROLL','BACK TO TOP','STICKY NAVIGATION','LAZY LOADING'].includes(e.name)?'枠内をスクロールしてください。キーボードでは枠を選び、矢印キーで操作できます。':e.category===2?'「切り替える」を押してください。':e.name==='DRAG & DROP'?'カードを右の枠へドラッグ。クリック・Enterでも移動できます。':e.category===3||['IMAGE PARALLAX','PARALLAX LAYERS'].includes(e.name)?'ホバー・ポインター移動、またはボタンをタップして操作してください。':/SLIDER|CAROUSEL|FLIP|TOOLTIP|MENU|TOAST|BUTTON STATE|SKELETON|DUOTONE|NOISE/.test(e.name)?'デモ内のボタンを操作してください。':'選択すると再生します。REPLAYで最初から、PAUSEで一時停止できます。';}
 };
})();
