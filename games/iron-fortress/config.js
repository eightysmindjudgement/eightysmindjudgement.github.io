export const STAGE={fortress:36,interior:65,boss:100};
export const DIFFICULTIES={EASY:{hp:.7,speed:13,spawn:2.5,bullet:12,attack:4.5,obstacle:6,multiplier:1},NORMAL:{hp:1,speed:16,spawn:1.9,bullet:16,attack:3.3,obstacle:4.5,multiplier:1.5},HARD:{hp:1.5,speed:20,spawn:1.4,bullet:20,attack:2.5,obstacle:3.4,multiplier:2}};
export const ENEMIES=[{hp:1,score:100,radius:.85,color:0xe16c56},{hp:2,score:180,radius:.85,color:0xc28ce9},{hp:5,score:350,radius:1.3,color:0xbda274}];
export const WEAPON={interval:.16,speed:85,damage:1};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function readBest(level){try{const n=Number(localStorage.getItem('emj-iron-fortress-'+level));return Number.isFinite(n)?Math.max(0,n):0}catch{return 0}}
export function saveBest(level,score){try{localStorage.setItem('emj-iron-fortress-'+level,String(score))}catch{}}
