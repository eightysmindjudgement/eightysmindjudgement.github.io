/* Original, dependency-free octagonal rigid-body solver. Also usable in Node tests. */
(function (root) {
  'use strict';
  const CONFIG = {
    name: 'EMJ PUZZLE', width: 400, height: 570, deadline: 76,
    pieces: [
      { name: 'Corporate Warrior', image: 'BIO背景.PNG', radius: 19, color: '#b9c9d5', points: 0 },
      { name: 'Cyborg Grandpa', image: 'DISCO背景.PNG', radius: 26, color: '#8bcddd', points: 10 },
      { name: 'EMJ LADY', image: 'LINK背景.PNG', radius: 34, color: '#bda5f5', points: 30 },
      { name: 'HARDROCK OJISAN', image: 'HARDROCKOJISAN.PNG', radius: 43, color: '#e1ad74', points: 80 },
      { name: 'HEART', image: 'MAP背景.PNG', radius: 53, color: '#f37f94', points: 180 },
      { name: 'BRAIN', image: 'BRAIN.PNG', radius: 64, color: '#75ebcc', points: 400 },
      { name: 'METAL SHOGUN', image: 'profile-artwork.JPG', radius: 77, color: '#ffe49b', points: 900 }
    ]
  };
  function vertices(b) {
    const r = b.r, k = r * .45, c = Math.cos(b.angle), s = Math.sin(b.angle);
    return [[-k,-r],[k,-r],[r,-k],[r,k],[k,r],[-k,r],[-r,k],[-r,-k]].map(([x,y]) => ({ x:b.x+x*c-y*s, y:b.y+x*s+y*c }));
  }
  function contact(a,b) {
    if (Math.abs(a.x-b.x)>1.42*(a.r+b.r) || Math.abs(a.y-b.y)>1.42*(a.r+b.r)) return null;
    const av=vertices(a), bv=vertices(b); let depth=Infinity, normal;
    for (const poly of [av,bv]) for(let i=0;i<8;i++) {
      const p=poly[i], q=poly[(i+1)%8], len=Math.hypot(q.x-p.x,q.y-p.y);
      const n={x:-(q.y-p.y)/len,y:(q.x-p.x)/len};
      const ap=av.map(v=>v.x*n.x+v.y*n.y), bp=bv.map(v=>v.x*n.x+v.y*n.y);
      const overlap=Math.min(Math.max(...ap),Math.max(...bp))-Math.max(Math.min(...ap),Math.min(...bp));
      if(overlap<0) return null;
      if(overlap<depth) {depth=overlap;normal=n;}
    }
    if((b.x-a.x)*normal.x+(b.y-a.y)*normal.y<0) {normal.x*=-1;normal.y*=-1;}
    return {...normal,depth};
  }
  class World {
    constructor(random=Math.random) {this.random=random;this.reset();}
    pick() {const n=this.random(); return n<.58?0:n<.88?1:2;}
    reset() {this.bodies=[];this.score=0;this.time=0;this.cooldown=0;this.overflow=0;this.over=false;this.current=this.pick();this.next=this.pick();this.events=[];this.lastMerge=-10;this.combo=0;this.serial=0;}
    add(level,x,y) {const r=CONFIG.pieces[level].radius;const b={id:++this.serial,level,r,x,y,vx:0,vy:0,angle:0,spin:0,born:this.time};this.bodies.push(b);return b;}
    drop(x) {if(this.over||this.cooldown>0||this.bodies.length>=110)return false;const r=CONFIG.pieces[this.current].radius;this.add(this.current,Math.max(r+2,Math.min(CONFIG.width-r-2,x)),r+5);this.current=this.next;this.next=this.pick();this.cooldown=.48;return true;}
    merge(a,b) {
      const level=a.level, x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      this.bodies=this.bodies.filter(v=>v!==a&&v!==b);
      this.combo=this.time-this.lastMerge<1.2?Math.min(this.combo+1,8):1;this.lastMerge=this.time;
      const points=(level===6?2400:CONFIG.pieces[level+1].points)*this.combo;
      this.score+=points;
      if(level<6) {const n=this.add(level+1,x,y);n.vx=(a.vx+b.vx)*.25;n.vy=Math.min(0,(a.vy+b.vy)*.2);n.angle=(a.angle+b.angle)/2;}
      this.events.push({x,y,points,combo:this.combo,final:level>=5,time:this.time});
    }
    bounds(b) {
      const vs=vertices(b), left=Math.min(...vs.map(v=>v.x)),right=Math.max(...vs.map(v=>v.x)),bottom=Math.max(...vs.map(v=>v.y));
      if(left<0){b.x-=left;b.vx=Math.max(0,-b.vx*.12);b.spin*=.75;}
      if(right>CONFIG.width){b.x-=right-CONFIG.width;b.vx=Math.min(0,-b.vx*.12);b.spin*=.75;}
      if(bottom>CONFIG.height){b.y-=bottom-CONFIG.height;b.vy=Math.min(0,-b.vy*.08);b.vx*=.96;b.spin*=.9;}
    }
    step(dt) {
      if(this.over)return;
      dt=Math.min(dt,1/60);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
      for(const b of this.bodies){b.vy=Math.min(b.vy+800*dt,650);b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.spin*dt;b.spin*=.99;b.vx*=.999;this.bounds(b);}
      for(let pass=0;pass<7;pass++) {
        let merged=false;
        outer:for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++) {
          const a=this.bodies[i],b=this.bodies[j],n=contact(a,b);if(!n)continue;
          if(a.level===b.level){this.merge(a,b);merged=true;break outer;}
          const ia=1/(a.r*a.r),ib=1/(b.r*b.r),sum=ia+ib,correction=Math.max(0,n.depth-.015)*.92;
          a.x-=n.x*correction*ia/sum;a.y-=n.y*correction*ia/sum;b.x+=n.x*correction*ib/sum;b.y+=n.y*correction*ib/sum;
          const relative=(b.vx-a.vx)*n.x+(b.vy-a.vy)*n.y;
          if(relative<0){const impulse=-relative*1.08/sum;a.vx-=impulse*n.x*ia;a.vy-=impulse*n.y*ia;b.vx+=impulse*n.x*ib;b.vy+=impulse*n.y*ib;
            const tangent=(b.vx-a.vx)*-n.y+(b.vy-a.vy)*n.x,friction=Math.max(-impulse*.25,Math.min(impulse*.25,-tangent/sum));
            a.vx-=friction*-n.y*ia;a.vy-=friction*n.x*ia;b.vx+=friction*-n.y*ib;b.vy+=friction*n.x*ib;
            a.spin=Math.max(-1.5,Math.min(1.5,a.spin+tangent*.0009));b.spin=Math.max(-1.5,Math.min(1.5,b.spin-tangent*.0009));}
        }
        for(const b of this.bodies)this.bounds(b);
        if(merged)continue;
      }
      const danger=this.bodies.some(b=>this.time-b.born>1.5&&Math.min(...vertices(b).map(v=>v.y))<CONFIG.deadline);
      this.overflow=danger?this.overflow+dt:0;if(this.overflow>=2.5)this.over=true;
      this.events=this.events.filter(e=>this.time-e.time<1);
    }
  }
  const api={CONFIG,World,vertices,contact};
  if(typeof module!=='undefined')module.exports=api;else root.EMJPuzzle=api;
})(typeof window==='undefined'?globalThis:window);
