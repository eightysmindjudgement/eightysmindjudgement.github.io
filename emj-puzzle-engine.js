/* Original, dependency-free circle / rock rigid-body solver. Also usable in Node tests. */
(function (root) {
  'use strict';
  // Open upper third, followed by the lower arc of an ellipse (380px high).
  function ovalSide(right) {
    return [[right?400:0,0], ...Array.from({length:25},(_,i)=>{
      const t=i/24*.95;
      const half=200*Math.sqrt(1-t*t);
      return [200+(right?half:-half),190+i/24*380];
    })];
  }
  const CONFIG = {
    name: 'EMJ PUZZLE', width: 400, height: 570, deadline: 76, laserDuration: .33, bombDuration: 20, rainDuration: 4, rainInterval: 180, drainDuration: 120, shatterDuration: 1.1,
    // Walls widen toward the top. Unequal segment lengths make each side distinct.
    stages: [
      { name: 'レベル1', description: '四角い器の基本ステージ', descriptionEn: 'A rectangular container: the basic stage.', left: [[0,0],[0,570]], right: [[400,0],[400,570]] },
      { name: 'レベル2', description: '急斜面と狭い底。配置と安定性がカギ', descriptionEn: 'Steep slopes and a narrow base challenge placement and balance.', left: [[0,0],[0,60],[20,180],[61,330],[155,570]], right: [[400,0],[400,85],[372,205],[329,350],[255,570]] },
      { name: 'レベル3', description: '下側約3分の2が楕円。転がりと積み方が変化／1分ごとに壁が縮小', descriptionEn: 'An oval lower two-thirds changes rolling and stacking. Walls squeeze each minute.', moving: true, left: ovalSide(false), right: ovalSide(true) }
    ],
    pieces: [
      { name: 'Corporate Warrior', reading: 'コーポレート ウォリア', image: 'BIO背景.PNG', radius: 19, color: '#b9c9d5', points: 0 },
      { name: 'Cyborg Grandpa', reading: 'サイボーグ グランパ', image: 'DISCO背景.PNG', radius: 26, color: '#8bcddd', points: 10 },
      { name: 'Cyborg Grandma', reading: 'サイボーグ グランマ', image: 'Cyborg Grandma.png', radius: 32, color: '#a8d8ec', points: 20 },
      { name: 'EMJ LADY', reading: 'イーエムジェイ レディ', image: 'LINK背景.PNG', radius: 39, color: '#bda5f5', points: 30 },
      { name: 'HARDROCK OJISAN', reading: 'ハードロックおじさん', image: 'HARDROCKOJISAN.PNG', radius: 46, color: '#e1ad74', points: 80 },
      { name: 'Metal Messiah', reading: 'メタルメサイア', image: 'MetalMessiah.png', radius: 53, color: '#9fdfff', points: 120 },
      { name: 'HEART', reading: 'ハート', image: 'MAP背景.PNG', radius: 61, color: '#f37f94', points: 180 },
      { name: 'BRAIN', reading: 'ブレイン', image: 'BRAIN.PNG', radius: 69, color: '#75ebcc', points: 400 },
      { name: 'METAL SHOGUN', reading: 'メタルショウグン', image: 'profile-artwork.JPG', radius: 77, color: '#ffe49b', points: 900 },
      { name: 'メタル大将軍', reading: 'メタルだいしょうぐん', image: 'MARKET背景.JPEG', radius: 77*1.5, color: '#ffe49b', points: 2400 }
    ]
  };
  function vertices(b) {
    if(b.drillShape)return b.drillShape;
    if(!b.rock)return Array.from({length:64},(_,i)=>({x:b.x+b.r*Math.cos(i*Math.PI/32),y:b.y+b.r*Math.sin(i*Math.PI/32)}));
    const r = b.r, k = r * .45, c = Math.cos(b.angle), s = Math.sin(b.angle);
    return (b.rock?[[-k,-r],[k,-r*.88],[r,-k],[r*.85,k],[k,r],[-k,r*.82],[-r,k],[-r*.9,-k]]:[[-k,-r],[k,-r],[r,-k],[r,k],[k,r],[-k,r],[-r,k],[-r,-k]]).map(([x,y]) => ({ x:b.x+x*c-y*s, y:b.y+x*s+y*c }));
  }
  function contact(a,b) {
    if (Math.abs(a.x-b.x)>1.42*(a.r+b.r) || Math.abs(a.y-b.y)>1.42*(a.r+b.r)) return null;
    if(!a.rock&&!b.rock){
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),depth=a.r+b.r-d;
      return depth<0?null:{x:d?dx/d:1,y:d?dy/d:0,depth};
    }
    const av=a.rock?vertices(a):null, bv=b.rock?vertices(b):null;
    let depth=Infinity, normal;
    const axes=[];
    for(const poly of [av,bv].filter(Boolean))for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length],len=Math.hypot(q.x-p.x,q.y-p.y);
      axes.push({x:-(q.y-p.y)/len,y:(q.x-p.x)/len});
    }
    if(!av||!bv){
      const circle=av?b:a,poly=av||bv;
      const closest=poly.reduce((p,q)=>Math.hypot(q.x-circle.x,q.y-circle.y)<Math.hypot(p.x-circle.x,p.y-circle.y)?q:p);
      const dx=closest.x-circle.x,dy=closest.y-circle.y,len=Math.hypot(dx,dy);
      if(len)axes.push({x:dx/len,y:dy/len});
    }
    for (const n of axes) {
      const project=(poly,body)=>poly?poly.map(v=>v.x*n.x+v.y*n.y):[body.x*n.x+body.y*n.y-body.r,body.x*n.x+body.y*n.y+body.r];
      const ap=project(av,a), bp=project(bv,b);
      const overlap=Math.min(Math.max(...ap),Math.max(...bp))-Math.max(Math.min(...ap),Math.min(...bp));
      if(overlap<0) return null;
      if(overlap<depth) {depth=overlap;normal=n;}
    }
    if((b.x-a.x)*normal.x+(b.y-a.y)*normal.y<0) {normal.x*=-1;normal.y*=-1;}
    return {...normal,depth};
  }
  class World {
    constructor(random=Math.random) {this.random=random;this.reset();}
    pick() {const n=this.random(); return n>=.9?-1:n>=.85?-2:n/.85<.58?0:n/.85<.88?1:2;}
    reset(stage=this.stageIndex || 0) {
      this.clear=null;
      this.water={height:0,target:Math.min(...CONFIG.pieces.map(p=>p.radius))*3,raining:false,elapsed:0,drainRate:0,waves:[]};
      this.stageIndex=Number.isInteger(stage)&&CONFIG.stages[stage]?stage:0;
      this.baseStage=CONFIG.stages[this.stageIndex];
      const integral=side=>side.slice(1).reduce((sum,p,i)=>sum+(p[0]+side[i][0])*.5*(p[1]-side[i][1]),0);
      this.baseArea=integral(this.baseStage.right)-integral(this.baseStage.left);
      this.minWallScale=Math.min(1,(CONFIG.width*CONFIG.height/3)/this.baseArea);
      this.wallScale=1;this.wallRate=0;this.buildWalls();
      this.effectQueue=[];this.activeEffect=null;this.drill=null;this.discharges=[];this.comboCue=null;this.lasers=[];this.shatters=[];this.blasts=[];this.explosions=0;this.shotsFired=0;this.rocksDestroyed=0;this.bodies=[];this.score=0;this.time=0;this.cooldown=0;this.overflow=0;this.over=false;this.current=this.pick();this.next=this.pick();this.events=[];this.lastMerge=-10;this.combo=0;this.serial=0;
    }
    buildWalls(){
      const transform=side=>side.map(([x,y])=>[CONFIG.width/2+(x-CONFIG.width/2)*this.wallScale,y]);
      this.stage={...this.baseStage,left:transform(this.baseStage.left),right:transform(this.baseStage.right)};
      this.walls=[];
      for(const [side,sign] of [[this.stage.left,1],[this.stage.right,-1]])for(let i=1;i<side.length;i++){
        const [x,y]=side[i-1],dx=side[i][0]-x,dy=side[i][1]-y,len=Math.hypot(dx,dy);
        this.walls.push({x,y,nx:sign*dy/len,ny:-sign*dx/len});
      }
      this.walls.push({x:0,y:CONFIG.height,nx:0,ny:-1});
    }
    updateWalls(dt,elapsed){
      this.wallRate=0;
      if(!this.baseStage.moving)return;
      // Each minute starts a four-second squeeze; clamp by actual polygon area.
      const target=Math.max(this.minWallScale,1-Math.floor(Math.max(0,elapsed)/60)*.06);
      const previous=this.wallScale;
      this.wallScale=Math.max(target,previous-.015*dt);
      if(this.wallScale!==previous){this.wallRate=(this.wallScale-previous)/dt;this.buildWalls();}
    }
    aimX(x,r){return Math.max(this.stage.left[0][0]+r+2,Math.min(this.stage.right[0][0]-r-2,x));}
    add(level,x,y) {const r=level<0?CONFIG.pieces[0].radius*2/3:CONFIG.pieces[level].radius;const b={bomb:level===-2,rock:level===-1,id:++this.serial,level,r,x,y,vx:0,vy:0,angle:0,spin:0,born:this.time};this.bodies.push(b);if([5,6,7,8].includes(level))this.enqueueEffect(b);return b;}
    drop(x) {if(this.over||this.clear||this.cooldown>0||this.bodies.length>=110)return false;const r=this.current<0?CONFIG.pieces[0].radius*2/3:CONFIG.pieces[this.current].radius;this.add(this.current,this.aimX(x,r),r+5);if(this.current>=0&&!this.drill&&this.random()<.03)this.drill={x:this.aimX(x,26),y:-260,width:52,length:260,angle:0};this.current=this.next;this.next=this.pick();this.cooldown=.48;return true;}
    merge(a,b) {
      if(this.clear||a.level>=9)return;
      const level=a.level, x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      this.bodies=this.bodies.filter(v=>v!==a&&v!==b);
      this.combo=this.time-this.lastMerge<1.2?Math.min(this.combo+1,8):1;this.lastMerge=this.time;
      const points=(level===8?2400:CONFIG.pieces[level+1].points)*this.combo;
      this.score+=points;
      if(level<CONFIG.pieces.length-1) {const n=this.add(level+1,x,y);n.vx=(a.vx+b.vx)*.25;n.vy=Math.min(0,(a.vy+b.vy)*.2);n.angle=(a.angle+b.angle)/2;}
      if(level===8){this.clearEffects();this.comboCue=null;this.lasers=[];this.clear={body:this.bodies.at(-1)};return;}
      this.fireCombo(this.combo);this.events.push({x,y,points,combo:this.combo,final:level>=7,time:this.time});
    }

    // One presentation owns the screen; waiting events retain their insertion order.
    enqueueEffect(body){this.effectQueue.push({body,seed:body.id,final:body.level===8,kind:body.level===6?'heart':body.level===7?'brain':'discharge',duration:[6,7].includes(body.level)?2:1.6});this.updateEffects();}
    clearEffects(){this.effectQueue=[];this.activeEffect=null;this.discharges=[];this.drill=null;}
    updateEffects(){if(this.activeEffect&&this.time-this.activeEffect.time>=this.activeEffect.duration-1e-9){this.activeEffect=null;this.discharges=[];}if(!this.activeEffect&&this.effectQueue.length){this.activeEffect=this.effectQueue.shift();this.activeEffect.time=this.time;this.discharges=this.activeEffect.kind==='discharge'?[this.activeEffect]:[];}}
    // A kinematic metal polygon: tile contacts share the rigid-body solver,
    // but the drill itself ignores container walls, scoring and laser targeting.
    updateDrill(dt){const d=this.drill;if(!d)return;d.y+=220*dt;d.angle+=3*dt;if(d.y>=CONFIG.height)this.drill=null;}
    resolveDrill(b){
      const d=this.drill;if(!d)return;
      const h=d.width/2,shoulder=d.y+d.length-d.width;
      const shape={rock:true,x:d.x,y:d.y+d.length/2,r:d.length,
        drillShape:[{x:d.x-h,y:d.y},{x:d.x+h,y:d.y},{x:d.x+h,y:shoulder},{x:d.x,y:d.y+d.length},{x:d.x-h,y:shoulder}]};
      const n=contact(shape,b);if(!n)return;
      // At the bottom a tile cannot descend any farther: let it escape sideways
      // around the bit rather than trapping it between two infinite-mass bodies.
      if(n.y>0&&b.y+b.r+n.y*n.depth>CONFIG.height){
        n.x=b.x===d.x?(b.id%2?1:-1):Math.sign(b.x-d.x);n.y=0;
        n.depth=Math.max(0,h+b.r-Math.abs(b.x-d.x));
      }
      b.x+=n.x*(n.depth+.01);b.y+=n.y*(n.depth+.01);
      const relative=b.vx*n.x+(b.vy-220)*n.y;
      if(relative<0){b.vx-=relative*n.x;b.vy-=relative*n.y;}
      b.spin=Math.max(-1.5,Math.min(1.5,b.spin+n.x*.08));
    }
    fireCombo(combo){if(combo===1){this.comboCue={start:this.time,combo};return;}const rocks=this.bodies.filter(b=>b.rock),count=combo*2,start=Math.max(this.time,...this.lasers.map(l=>l.start+.055)),offset=this.random();for(let i=0;i<count;i++)this.lasers.push({start:start+i*.055,y:30+((offset+i*.61803398875)%1)*510,direction:(this.shotsFired+i)%2?-1:1,previous:null,targetId:rocks[i%Math.max(1,rocks.length)]?.id});this.shotsFired+=count;this.comboCue={start,combo};}
    updateLasers(){for(const l of this.lasers){const age=this.time-l.start;if(age<0)continue;
      // Track a rock until the beam reaches it; swept polygon collision remains authoritative.
      const target=this.bodies.find(b=>b.rock&&b.id===l.targetId);
      if(target)l.y=target.y;
      const x=l.direction===1?-65+530*Math.min(1,age/CONFIG.laserDuration):465-530*Math.min(1,age/CONFIG.laserDuration),prev=l.previous===null?(l.direction===1?-65:465):l.previous;for(const b of this.bodies.slice()){if(!b.rock||b.destroyed)continue;const v=vertices(b),hits=[];for(let i=0;i<8;i++){const a=v[i],c=v[(i+1)%8];if((a.y<=l.y&&c.y>=l.y)||(c.y<=l.y&&a.y>=l.y)){if(a.y===c.y)hits.push(a.x,c.x);else hits.push(a.x+(c.x-a.x)*(l.y-a.y)/(c.y-a.y));}}if(hits.length&&Math.max(prev,x)>=Math.min(...hits)&&Math.min(prev,x)<=Math.max(...hits)){b.destroyed=true;this.bodies.splice(this.bodies.indexOf(b),1);this.rocksDestroyed++;this.shatters.push({x:b.x,y:b.y,time:this.time,seed:this.random()});}}l.previous=x;}this.lasers=this.lasers.filter(l=>this.time-l.start<CONFIG.laserDuration);this.shatters=this.shatters.filter(e=>this.time-e.time<CONFIG.shatterDuration).slice(-24);}
    bounds(b) {
      // Project all eight corners against the actual sloping walls, never a bounding box.
      for(let pass=0;pass<5;pass++){
        let corrected=false;
        for(const w of this.walls){
          const distance=b.rock?Math.min(...vertices(b).map(v=>(v.x-w.x)*w.nx+(v.y-w.y)*w.ny)):(b.x-w.x)*w.nx+(b.y-w.y)*w.ny-b.r;
          if(distance>=-.001)continue;
          corrected=true;b.x-=distance*w.nx;b.y-=distance*w.ny;
          const wallX=w.nx===0?CONFIG.width/2:w.x-(b.y-w.y)*w.ny/w.nx;
          const wallVx=(wallX-CONFIG.width/2)*this.wallRate/this.wallScale;
          const normalSpeed=(b.vx-wallVx)*w.nx+b.vy*w.ny;
          if(normalSpeed<0){b.vx-=normalSpeed*1.08*w.nx;b.vy-=normalSpeed*1.08*w.ny;}
          const tangent=b.vx*-w.ny+b.vy*w.nx;
          if(b.rock){b.vx-=tangent*.025*-w.ny;b.vy-=tangent*.025*w.nx;b.spin*=.9;}
          else {
            const slip=tangent-b.spin*b.r,change=Math.max(-Math.abs(normalSpeed)*.06,Math.min(Math.abs(normalSpeed)*.06,slip/3));
            b.vx-=change*-w.ny;b.vy-=change*w.nx;b.spin+=2*change/b.r;
          }
        }
        if(!corrected)break;
      }
    }
    // Split the pause-aware play clock at rain boundaries, including delayed frames.
    updateWater(dt,elapsed){
      const w=this.water;if(this.stageIndex>2){w.height=0;w.raining=false;w.waves=[];return;}
      const end=Math.max(w.elapsed,elapsed);let t=w.elapsed;
      while(t<end-1e-9){
        const cycle=Math.floor((t+1e-9)/CONFIG.rainInterval),phase=t-cycle*CONFIG.rainInterval,rain=cycle>=1&&phase<CONFIG.rainDuration;
        const boundary=rain?cycle*CONFIG.rainInterval+CONFIG.rainDuration:(cycle+1)*CONFIG.rainInterval,span=Math.min(end,boundary)-t;if(span<=0)break;
        w.height=Math.max(0,Math.min(w.target,CONFIG.height*2/3,w.height+span*((rain?w.target/CONFIG.rainDuration:0)-w.drainRate)));t+=span;
        if(rain&&t>=boundary-1e-9)w.drainRate=w.height/CONFIG.drainDuration;
        if(w.height===0&&!rain)w.drainRate=0;
      }
      w.elapsed=end;w.raining=end>=CONFIG.rainInterval&&end%CONFIG.rainInterval<CONFIG.rainDuration;if(w.height<1e-8)w.height=0;
      w.waves=w.waves.filter(v=>end-v.time<3);
    }
    updateBombs(){
      for(const b of this.bodies.slice())if(b.bomb){
        const age=this.time-b.born;
        b.r=CONFIG.pieces[0].radius*2/3+(CONFIG.pieces[1].radius-CONFIG.pieces[0].radius*2/3)*Math.min(1,age/CONFIG.bombDuration);
        if(age>=CONFIG.bombDuration){
          this.bodies.splice(this.bodies.indexOf(b),1);this.explosions++;
          const wet=this.water.height>0&&b.y>=this.waterSurface(b.x);
          this.blasts.push({x:b.x,y:b.y,r:b.r,angle:this.random()*Math.PI/2,time:this.time,hits:new Set(),wet});
          if(wet){this.water.waves.push({x:b.x,time:this.water.elapsed,strength:36,blast:true});
            for(const v of this.bodies)if(v.y+v.r>this.waterSurface(v.x)-v.r){const f=Math.exp(-Math.abs(v.x-b.x)/180);v.vy-=180*f;v.vx+=Math.sign(v.x-b.x)*90*f;v.spin+=Math.sign(v.x-b.x)*3*f;}}
        }
      }
      for(const e of this.blasts){const reach=(this.time-e.time)*530/CONFIG.laserDuration/2,c=Math.cos(e.angle||0),s=Math.sin(e.angle||0);
        for(const b of this.bodies){if(e.hits.has(b.id))continue;const dx=b.x-e.x,dy=b.y-e.y;
          const localX=dx*c+dy*s,localY=-dx*s+dy*c;
          const horizontal=Math.abs(localY)<e.r+b.r&&Math.abs(localX)<reach+b.r,vertical=Math.abs(localX)<e.r+b.r&&Math.abs(localY)<reach+b.r;
          if(!horizontal&&!vertical)continue;e.hits.add(b.id);
          const pushX=horizontal?(Math.sign(localX)||1)*320:Math.sign(localX)*75,pushY=vertical?(Math.sign(localY)||-1)*350:-130;
          b.vx+=pushX*c-pushY*s;b.vy+=pushX*s+pushY*c;b.spin+=(Math.sign(localX)||1)*8;
        }
      }
      this.blasts=this.blasts.filter(e=>this.time-e.time<Math.hypot(CONFIG.width,CONFIG.height)/(530/CONFIG.laserDuration/2)+.35);
    }
    waterSurface(x){
      const w=this.water;if(!w.height)return CONFIG.height;
      let offset=Math.sin(x*.035+w.elapsed*2.1)*.8+Math.sin(x*.067-w.elapsed*1.6)*.5;
      let blastOffset=0;
      for(const v of w.waves){const age=w.elapsed-v.time,value=v.strength*Math.exp(-age*1.8-Math.abs(x-v.x)/100)*Math.sin(Math.abs(x-v.x)*.07-age*9);if(v.blast)blastOffset+=value;else offset+=value;}
      return CONFIG.height-w.height+(Math.max(-3,Math.min(3,offset))+Math.max(-37,Math.min(37,blastOffset)))*Math.min(1,w.height/5);
    }
    applyWater(b,dt){
      const w=this.water;if(!w.height||this.stageIndex>2)return;
      const depth=b.y+b.r-this.waterSurface(b.x);
      if(depth>0&&b.waterDepth!==undefined&&b.waterDepth<=0&&Math.abs(b.vy)>25){w.waves.push({x:b.x,time:w.elapsed,strength:Math.min(3,Math.abs(b.vy)/150)});if(w.waves.length>24)w.waves.shift();}
      b.waterDepth=depth;const fraction=Math.max(0,Math.min(1,depth/Math.min(2*b.r,w.target)));if(!fraction)return;
      // Scale effective displacement to the shallow basin so even large tiles
      // float without requiring more water. Drag damps surface oscillation.
      // Rocks retain gravity and sink.
      if(!b.rock)b.vy-=800*2.4*fraction*dt;
      b.vy*=Math.exp(-(b.rock?.9:7)*fraction*dt);b.vx*=Math.exp(-1.5*fraction*dt);b.spin*=Math.exp(-fraction*dt);
    }
    // Break only near-motionless, centered single-point balances. All bodies remain
    // dynamic; gravity and the existing contact solver carry the resulting motion.
    releaseUnstableContacts(dt){
      for(const a of this.bodies){
        if(a.rock||Math.abs(a.vx)>2||Math.abs(a.vy)>10)continue;
        if(this.water.height&&a.y+a.r>CONFIG.height-this.water.height)continue;
        const supported=this.walls.some(w=>w.ny<-.15&&(a.x-w.x)*w.nx+(a.y-w.y)*w.ny-a.r<.15);
        if(supported)continue;
        const below=this.bodies.filter(b=>b!==a&&b.y>a.y&&Math.hypot(b.x-a.x,b.y-a.y)<a.r+b.r+.2);
        if(below.length!==1||below[0].rock)continue;
        const b=below[0];if(Math.abs(a.x-b.x)>1)continue;
        const direction=Math.sign(a.x-b.x)||(a.id%2?1:-1),dv=direction*18*dt;
        a.vx+=dv;b.vx-=dv*a.r*a.r/(b.r*b.r);
      }
    }
    step(dt,elapsed) {
      if(this.over||this.clear)return;
      dt=Math.min(dt,1/60);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
      this.updateWalls(dt,elapsed===undefined?this.time:elapsed);
      this.updateDrill(dt);
      this.releaseUnstableContacts(dt);
      this.updateWater(dt,elapsed===undefined?this.time:elapsed);
      this.updateBombs();
      for(const b of this.bodies){b.vy=Math.min(b.vy+800*dt,650);this.applyWater(b,dt);b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.spin*dt;b.spin*=.99;b.vx*=.999;this.bounds(b);}
      for(let pass=0;pass<(this.drill?18:7);pass++) {
        for(const b of this.bodies)this.resolveDrill(b);
        let merged=false;
        outer:for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++) {
          const a=this.bodies[i],b=this.bodies[j],n=contact(a,b);if(!n)continue;
          if(!a.rock&&!b.rock&&!a.bomb&&!b.bomb&&a.level===b.level){this.merge(a,b);if(this.clear)return;merged=true;break outer;}
          const ia=1/(a.r*a.r),ib=1/(b.r*b.r),sum=ia+ib,correction=Math.max(0,n.depth-.015)*.92;
          a.x-=n.x*correction*ia/sum;a.y-=n.y*correction*ia/sum;b.x+=n.x*correction*ib/sum;b.y+=n.y*correction*ib/sum;
          const relative=(b.vx-a.vx)*n.x+(b.vy-a.vy)*n.y;
          if(relative<0){const impulse=-relative*1.08/sum;a.vx-=impulse*n.x*ia;a.vy-=impulse*n.y*ia;b.vx+=impulse*n.x*ib;b.vy+=impulse*n.y*ib;
            const tangent=(b.vx-a.vx)*-n.y+(b.vy-a.vy)*n.x-a.spin*a.r-b.spin*b.r,mu=a.rock||b.rock?.25:.06,friction=Math.max(-impulse*mu,Math.min(impulse*mu,-tangent/(3*sum)));
            a.vx-=friction*-n.y*ia;a.vy-=friction*n.x*ia;b.vx+=friction*-n.y*ib;b.vy+=friction*n.x*ib;
            a.spin-=2*friction*ia/a.r;b.spin-=2*friction*ib/b.r;}
        }
        for(const b of this.bodies)this.bounds(b);
        if(merged)continue;
      }
      this.updateLasers();const danger=this.bodies.some(b=>this.time-b.born>1.5&&Math.min(...vertices(b).map(v=>v.y))<CONFIG.deadline);
      this.overflow=danger?this.overflow+dt:0;if(this.overflow>=2.5)this.over=true;
      if(this.over)this.clearEffects();else this.updateEffects();
      this.events=this.events.filter(e=>this.time-e.time<1);
    }
  }
  const api={CONFIG,World,vertices,contact};
  if(typeof module!=='undefined')module.exports=api;else root.EMJPuzzle=api;
})(typeof window==='undefined'?globalThis:window);
