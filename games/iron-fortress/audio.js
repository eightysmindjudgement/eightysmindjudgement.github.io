export class Audio {
 constructor(){this.muted=false;this.context=null;this.ready=null;this.error=null}
 unlock(){
  try{
   if(!this.context||this.context.state==='closed')this.context=new (window.AudioContext||window.webkitAudioContext)();
   const c=this.context;
   // Resume synchronously inside the user gesture, then wait before scheduling sound.
   this.ready=(c.state==='running'?Promise.resolve():c.resume()).then(()=>{if(c.state!=='running')throw new Error('AudioContext is '+c.state);this.error=null;return c}).catch(e=>{this.error=e;console.warn('IRON FORTRESS audio:',e);return null});
   return this.ready;
  }catch(e){this.error=e;console.warn('IRON FORTRESS audio:',e);return Promise.resolve(null)}
 }
 play(kind){
  if(this.muted||!this.context)return;
  if(this.context.state!=='running'){const requested=performance.now();this.ready?.then(c=>{if(c?.state==='running'&&performance.now()-requested<250)this.play(kind)});return}
  try{
   const c=this.context,o=c.createOscillator(),g=c.createGain(),now=c.currentTime;
   const f={start:440,laser:640,hit:120,damage:65,boss:42,explosion:48,clear:880,over:90}[kind]||180;
   const duration=kind==='laser'?.07:['boss','explosion'].includes(kind)?.8:.25;
   o.type=kind==='clear'||kind==='start'?'sine':'sawtooth';o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(Math.max(25,f/3),now+duration);
   g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+duration);o.onended=()=>{o.disconnect();g.disconnect()};
  }catch(e){this.error=e;console.warn('IRON FORTRESS audio:',e)}
 }
 dispose(){this.context?.close().catch(()=>{});this.context=null;this.ready=null}
}
