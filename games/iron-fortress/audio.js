export class Audio {
 constructor(){this.muted=false;this.context=null}
 unlock(){try{this.context ||= new (window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{})}catch{}}
 play(kind){if(this.muted||!this.context)return;try{const c=this.context,o=c.createOscillator(),g=c.createGain();const f={laser:640,hit:120,damage:65,boss:42,clear:880,over:90}[kind]||180;const duration=kind==='laser'?.07:kind==='boss'?.8:.25;o.type=kind==='clear'?'sine':'sawtooth';o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,f/3),c.currentTime+duration);g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect()}}catch{}}
 dispose(){this.context?.close().catch(()=>{})}
}
