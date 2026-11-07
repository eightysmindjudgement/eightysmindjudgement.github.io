/* Pure, elapsed-time game model. All positions are normalized to the canvas. */
(function(root){'use strict';
const CONFIG=Object.freeze({perfectTime:.1,goodTime:.25,perfectX:.06,goodX:.14,initialFlight:1.25,acceleration:.1,missFlight:.6,respawn:.85});
class MetalStrike {
constructor(best=0){this.best=best;this.reset();this.state='READY';}
reset(){Object.assign(this,{state:'PLAYING',time:0,perfect:0,good:0,miss:0,rallies:0,reason:'',events:[],phase:'incoming',phaseAt:0,xOrigin:.5,xVelocity:.15,zOrigin:0,aim:.5,newBest:false});this.flight=CONFIG.initialFlight;this.arrival=this.flight;}
xAt(t){const raw=this.xOrigin+this.xVelocity*(t-this.phaseAt);const q=((raw-.08)%1.68+1.68)%1.68;return .08+(q<=.84?q:1.68-q);}
ball(t=this.time){let z;if(this.phase==='incoming')z=this.zOrigin+(t-this.phaseAt)/this.flight;else if(this.phase==='outgoing')z=this.zOrigin-(t-this.phaseAt)/this.flight;else z=this.zOrigin+(t-this.phaseAt)/CONFIG.missFlight*.6;return {x:this.xAt(t),z};}
event(type){this.events.push({type,time:this.time,rallies:this.rallies,...this.ball()});if(this.events.length>32)this.events.shift();}
transition(phase,at,z){const x=this.xAt(at);const eps=.00001;const velocity=(this.xAt(at+eps)-this.xAt(at-eps))/(2*eps);this.xOrigin=x;this.xVelocity=Math.sign(velocity||1)*(.15+.07*(1-Math.exp(-this.rallies*.08)));this.phaseAt=at;this.zOrigin=z;this.phase=phase;}
advance(t){if(this.state!=='PLAYING')return; t=Math.max(this.time,t);while(this.state==='PLAYING'){
let next=this.phase==='incoming'?this.arrival+CONFIG.goodTime:this.phase==='outgoing'?this.phaseAt+this.zOrigin*this.flight:this.phaseAt+CONFIG.respawn;
if(t<next){this.time=t;break;}this.time=next;
if(this.phase==='incoming'){this.miss++;this.event('MISS');this.transition('miss',next,this.ball().z);this.finish('GAME OVER');break;}
else if(this.phase==='outgoing'){this.transition('incoming',next,0);this.arrival=next+this.flight;this.event('WALL');}
else{this.transition('incoming',next,0);this.arrival=next+this.flight;}
}}
strike(t,aim){this.advance(t);if(this.state!=='PLAYING')return null;this.aim=Math.max(0,Math.min(1,aim));this.event('SWING');if(this.phase!=='incoming'||Math.abs(this.time-this.arrival)>CONFIG.goodTime)return null;
const dx=Math.abs(this.ball().x-this.aim);if(dx>CONFIG.goodX)return null;
const grade=Math.abs(this.time-this.arrival)<=CONFIG.perfectTime&&dx<=CONFIG.perfectX?'PERFECT':'GOOD';this[grade.toLowerCase()]++;this.event(grade);const z=this.ball().z;this.rallies++;this.flight=CONFIG.initialFlight/(1+this.rallies*CONFIG.acceleration);if(this.rallies>this.best){this.best=this.rallies;this.newBest=true;this.event('NEW_RECORD');}if(this.rallies%10===0)this.event('MILESTONE');this.transition('outgoing',this.time,z);return grade;
}
finish(reason){this.state='GAME_OVER';this.reason=reason;this.event(reason);}
}
root.MetalStrike=MetalStrike;root.MetalStrikeConfig=CONFIG;
})(typeof module==='object'?module.exports:globalThis);
