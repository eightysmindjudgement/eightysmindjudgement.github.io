export const STAGE={midboss:36,fortress:36,interior:90,fortressBoss:72,serpent:108,energy:132,boss:144};
export const DIFFICULTIES={EASY:{hp:.7,speed:13,spawn:2.5,bullet:12,attack:4.5,obstacle:6,multiplier:1},NORMAL:{hp:1.5,speed:20,spawn:1.4,bullet:20,attack:2.5,obstacle:3.4,multiplier:2},HARD:{hp:1.5,speed:30,motion:1.5,spawn:1.4,bullet:30,attack:2.5,obstacle:3.4,multiplier:2}};
export const ENEMIES=[{hp:1,score:100,radius:.85,shotRadius:1.15,color:0xe16c56},{hp:2,score:180,radius:.85,shotRadius:1.15,color:0xc28ce9},{hp:5,score:350,radius:1.3,shotRadius:1.7,color:0xbda274}];
export const WEAPON={interval:.16,speed:85,damage:1};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function readBest(level){try{const n=Number(localStorage.getItem('emj-iron-fortress-'+level));return Number.isFinite(n)?Math.max(0,n):0}catch{return 0}}
export function saveBest(level,score){try{localStorage.setItem('emj-iron-fortress-'+level,String(score))}catch{}}

// The colored core is dangerous; outer glow and the fading tail are visual only.
export const LASER_FADE=.4;
export function laserRadius(kind,t){return ({eyes:.22,nose:.17,mouth:.7}[kind]??.22)+({eyes:.03,nose:.52,mouth:.45}[kind]??0)*t}
export function laserDanger(t){return t>=0&&t<=.82}

export const SHOTGUN_ENEMY={hp:3,score:450,radius:1.15,shotRadius:1.5,color:0x78a77a};
export const SHOTGUN_SPREAD=[[-3.8,-.6],[-.9,1.5],[1.5,-1.2],[4.7,.7]];
export function enemyType(index,roll=Math.random()){return index<3?index%3:roll<.08?4:roll<.26?5:roll<.4?6:index%3}

export const FORTRESS_LASER_WAVES=[{time:46,y:2},{time:51,y:-2},{time:56,y:2},{time:80,axis:'x',side:1},{time:85,axis:'x',side:-1},{time:90,axis:'x',side:1}];

export const EXTRA_ENEMIES={5:{hp:2,score:240,radius:.95,shotRadius:1.25,color:0x7e9eee},6:{hp:2,score:300,radius:1.25,shotRadius:1.5,color:0xa9b4c4}};
export const GATE_WAVES=[{time:42,axis:'y'},{time:61,axis:'x'},{time:78,axis:'y'},{time:88,axis:'x'}];
export function gateGap(age){return 2.3+2.2*(.5+.5*Math.sin(age*1.7))}

export const BOSS_NAMES={mid:{en:'IRON WARDEN',ja:'アイアン・ウォーデン'},raider:{en:'SILVER WISP',ja:'シルバー・ウィスプ'},serpent:{en:'JADE SERPENT',ja:'ジェイド・サーペント'},final:{en:'HARD ROCK OJISAN X',ja:'ハードロックおじさんエックス'}};
