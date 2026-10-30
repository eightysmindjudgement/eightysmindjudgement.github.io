(() => {
 'use strict';
 const $=id=>document.getElementById(id), effects=window.EFFECTS,categories=window.EFFECT_CATEGORIES;
 let category=0,selected=effects[0],demo=null,visible=false,userPaused=false;
 const stage=$('effects-stage'),list=$('effects-list');
 function stop(){demo?.dispose();demo=null;stage.style.cssText='';}
 function sync(){const pause=userPaused||document.hidden||!visible;demo?.pause(pause);$('effects-pause').textContent=userPaused?'RESUME / 再開':'PAUSE / 停止';$('effects-pause').setAttribute('aria-pressed',String(userPaused));}
 function start(){stop();if(visible&&!document.hidden){demo=window.EffectDemos.create(stage,selected);sync();}}
 function select(effect,focus=false){selected=effect;userPaused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('effects-name').textContent=effect.name;const reading=document.createElement('span');reading.className='effects-name-reading';reading.lang='ja';reading.textContent=effect.reading;$('effects-name').append(' ',reading);$('effects-description').textContent=effect.description;
  $('effects-current').textContent=`${String(effect.category+1).padStart(2,'0')} / ${categories[effect.category][0]} / ${effect.id}`;
  $('effects-difficulty').textContent=effect.difficulty;$('effects-tech').textContent=effect.tech;
  $('effects-method').textContent=EffectDemos.implementation(effect);$('effects-instruction').textContent=EffectDemos.instruction(effect);
  $('effects-simple').hidden=!effect.simplified;
  $('effects-motion').hidden=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===effect.id)));
  history.replaceState(null,'',`#effect-${effect.id}`);start();sync();
  if(focus){$('effects-name').focus({preventScroll:true});$('effects-detail').scrollIntoView({behavior:'instant',block:'start'});}
 }
 function renderList(){const query=$('effects-search').value.trim().toLowerCase();const found=effects.filter(e=>query?(e.name+' '+e.description).toLowerCase().includes(query):e.category===category);list.replaceChildren();
  $('effects-list-title').textContent=query?'SEARCH RESULTS':categories[category][0];$('effects-count').textContent=`${found.length} / 103 EFFECTS`;
  for(const e of found){const b=document.createElement('button');b.type='button';b.dataset.id=e.id;b.setAttribute('aria-pressed',String(selected.id===e.id));b.textContent=e.name;const small=document.createElement('small');small.textContent=e.description;b.append(small);b.addEventListener('click',()=>{category=e.category;renderCategories();select(e,true);});list.append(b);}
  if(!found.length){const p=document.createElement('p');p.textContent='該当する技術はありません。検索語を変更してください。';list.append(p);}
 }
 function renderCategories(){$('effects-categories').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===category)));}
 categories.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${String(i+1).padStart(2,'0')} / ${c[0]}`;const small=document.createElement('small');small.textContent=`${c[1]} · ${c[2].length}`;b.append(small);b.addEventListener('click',()=>{category=i;$('effects-search').value='';renderCategories();select(effects.find(e=>e.category===i));renderList();});$('effects-categories').append(b);});
 $('effects-search').addEventListener('input',renderList);
 $('effects-replay').addEventListener('click',()=>{userPaused=false;start();sync();});
 $('effects-pause').addEventListener('click',()=>{userPaused=!userPaused;sync();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!demo&&visible)start();sync();});
 if(window.IntersectionObserver){const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!demo)start();sync();},{threshold:.05});observer.observe(stage);window.addEventListener('pagehide',()=>{observer.disconnect();stop();},{once:true});}
 else{visible=true;window.addEventListener('pagehide',stop,{once:true});}
 const initial=effects.find(e=>`#effect-${e.id}`===location.hash)||effects[0];category=initial.category;renderCategories();renderList();select(initial);
})();
