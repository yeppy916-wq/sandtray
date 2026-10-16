// Soft-cel art: cached continuous surfaces and a small reusable sprite library.
const surfaceCache={key:'',water:null,land:null,loops:[],lastBuild:-1000};
const spriteLibrary=new Map();
const BASE_POINTS=[[-4.2,-3],[-1.4,-4.7],[3.2,-4.6],[8.5,-3.7],[13.5,-4.5],[18.3,-3.8],[23.2,-2.4],[26.1,1.3],[25,6.8],[26,10.8],[23.3,15.3],[18.4,17.7],[13.7,16.4],[9,18],[3.8,17.2],[-1.7,15.2],[-4,11],[-3,6.4],[-4.6,2]];
const WORLD_BASE=BASE_POINTS.flatMap((p,i)=>{const q=BASE_POINTS[(i+1)%BASE_POINTS.length];return [[p[0]*.84+q[0]*.16,p[1]*.84+q[1]*.16],[p[0]*.16+q[0]*.84,p[1]*.16+q[1]*.84]]});
function baseOutline(){return WORLD_BASE}
function withinWorldBase(x,y){let inside=false;for(let i=0,j=WORLD_BASE.length-1;i<WORLD_BASE.length;j=i++){const a=WORLD_BASE[i],b=WORLD_BASE[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside}
function worldBasePath(){const p=new Path2D();WORLD_BASE.forEach((q,i)=>i?p.lineTo(q[0]*TILE,q[1]*TILE):p.moveTo(q[0]*TILE,q[1]*TILE));p.closePath();return p}
function drawWorldBase(){
 const b=basis(),edges=[];polygon(WORLD_BASE.map(([x,y])=>project(x,y,4)),'#4e8e8e');
 for(let i=0;i<WORLD_BASE.length;i++){
  const a=WORLD_BASE[i],c=WORLD_BASE[(i+1)%WORLD_BASE.length],dx=c[0]-a[0],dy=c[1]-a[1],len=Math.hypot(dx,dy),m=[(a[0]+c[0])/2,(a[1]+c[1])/2];let nx=dy/len,ny=-dx/len;
  if(withinWorldBase(m[0]+nx*.1,m[1]+ny*.1)){nx=-nx;ny=-ny;}
  if(nx*b.x.y+ny*b.y.y<.01)continue;const p=project(a[0],a[1],4),q=project(c[0],c[1],4);edges.push({p,q,depth:(p.y+q.y)/2});
 }
 edges.sort((a,b)=>a.depth-b.depth);for(const{p,q}of edges){const g=ctx.createLinearGradient(p.x,p.y,p.x,p.y+31);g.addColorStop(0,'#537f78');g.addColorStop(1,'#3a6664');polygon([p,q,{x:q.x,y:q.y+31},{x:p.x,y:p.y+31}],g);line(p.x,p.y+1,q.x,q.y+1,'#a0c8af55',1);}
}
function layerCanvas(w,h){
 const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');c.width=w;c.height=h;return c;
}
function softPath(g,points,round=.13,close=true){
 g.beginPath();
 if(!close){g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);return;}
 for(let i=0;i<points.length;i++){
  const prev=points[(i+points.length-1)%points.length],p=points[i],next=points[(i+1)%points.length];
  const a=[p[0]+(prev[0]-p[0])*round,p[1]+(prev[1]-p[1])*round],b=[p[0]+(next[0]-p[0])*round,p[1]+(next[1]-p[1])*round];
  i?g.lineTo(...a):g.moveTo(...a);g.quadraticCurveTo(p[0],p[1],b[0],b[1]);
 }g.closePath();
}
function shape(g,points,fill,round=.13,stroke=null,width=1){softPath(g,points,round);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}}
function strokeLine(g,x1,y1,x2,y2,color,width=1){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke()}
function toneGradient(g,x,y,h,light,shade){const f=g.createLinearGradient(x,y,x+h*.25,y+h);f.addColorStop(0,light);f.addColorStop(1,shade);return f}
function contactShadow(g,x=4,y=4,rx=26,ry=10){g.save();g.translate(x,y);g.scale(1,ry/rx);const f=g.createRadialGradient(0,0,1,0,0,rx);f.addColorStop(0,'#253d3d38');f.addColorStop(.65,'#28454119');f.addColorStop(1,'#29494200');g.fillStyle=f;g.beginPath();g.arc(0,0,rx,0,Math.PI*2);g.fill();g.restore()}
function fieldAt(x,y){
 const ix=Math.floor(x-.5),iy=Math.floor(y-.5),a=x-.5-ix,b=y-.5-iy;
 return Number(isLand(ix,iy))*(1-a)*(1-b)+Number(isLand(ix+1,iy))*a*(1-b)+Number(isLand(ix+1,iy+1))*a*b+Number(isLand(ix,iy+1))*(1-a)*b;
}
function coastlineLoops(){
 const cases=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],[[2,3]],[[0,2]],[[0,1],[2,3]],[[1,2]],[[1,3]],[[0,1]],[[0,3]],[]];
 const segments=[],links=new Map(),key=p=>p[0]+','+p[1];
 for(let y=-6;y<ROWS+6;y++)for(let x=-6;x<COLS+6;x++){
  const mask=Number(isLand(x,y))+Number(isLand(x+1,y))*2+Number(isLand(x+1,y+1))*4+Number(isLand(x,y+1))*8;
  const e=[[x+1,y+.5],[x+1.5,y+1],[x+1,y+1.5],[x+.5,y+1]];
  for(const[a,b]of cases[mask]){const id=segments.length;segments.push([e[a],e[b]]);for(const p of [e[a],e[b]]){const k=key(p);if(!links.has(k))links.set(k,[]);links.get(k).push(id)}}
 }
 const used=new Set(),loops=[];
 for(let id=0;id<segments.length;id++){
  if(used.has(id))continue;const loop=[],start=segments[id][0];let point=start,edge=id;
  for(let guard=0;guard<=segments.length;guard++){
   used.add(edge);loop.push(point);const s=segments[edge],next=key(s[0])===key(point)?s[1]:s[0];point=next;if(key(point)===key(start))break;
   edge=links.get(key(point))?.find(i=>!used.has(i));if(edge===undefined)break;
  }
  if(loop.length<4)continue;
  const simple=loop.filter((p,i)=>{const a=loop[(i+loop.length-1)%loop.length],b=loop[(i+1)%loop.length];return Math.abs((p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0]))>.0001});
  const smooth=[];for(let i=0;i<simple.length;i++){const p=simple[i],q=simple[(i+1)%simple.length];smooth.push([p[0]*.85+q[0]*.15,p[1]*.85+q[1]*.15],[p[0]*.15+q[0]*.85,p[1]*.15+q[1]*.85]);}
  loops.push(smooth);
 }return loops;
}
function planarLandPath(loops){const p=new Path2D();for(const loop of loops){loop.forEach((q,i)=>i?p.lineTo(q[0]*TILE,q[1]*TILE):p.moveTo(q[0]*TILE,q[1]*TILE));p.closePath()}return p}
const SURFACE={left:-6*TILE,top:-6*TILE,width:(COLS+12)*TILE,height:(ROWS+12)*TILE,resolution:1.35};
function buildSurfaceCache(time){
 const loops=coastlineLoops(),path=planarLandPath(loops),s=SURFACE;
 const water=layerCanvas(Math.ceil(s.width*s.resolution),Math.ceil(s.height*s.resolution)),land=layerCanvas(water.width,water.height);
 const w=water.getContext('2d'),g=land.getContext('2d');
 for(const c of [w,g]){c.scale(s.resolution,s.resolution);c.translate(-s.left,-s.top);c.lineJoin='round';c.lineCap='round';}
 w.save();w.clip(worldBasePath());
 const waterTone=w.createLinearGradient(0,-200,800,1000);waterTone.addColorStop(0,'#427f88');waterTone.addColorStop(.5,'#60aaa7');waterTone.addColorStop(1,'#35777f');w.fillStyle=waterTone;w.fillRect(s.left,s.top,s.width,s.height);
 w.strokeStyle='#89cebf6b';w.lineWidth=35;w.stroke(path);w.strokeStyle='#c2e5ca38';w.lineWidth=10;w.stroke(path);
 for(let i=0;i<230;i++){
  const x=(hash(i,4)*(COLS+9)-5)*TILE,y=(hash(i,17)*(ROWS+9)-5)*TILE,r=14+hash(i,33)*36;
  const pts=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2,rr=r*(.75+hash(i,k)*.4);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*.68]);}
  shape(w,pts,null,.2,'#b8ead31d',1.2);
 }
 for(let i=0;i<95;i++){const x=(hash(i,8)*(COLS+8)-4)*TILE,y=(hash(i,9)*(ROWS+8)-4)*TILE;strokeLine(w,x,y,x+6+hash(i,3)*16,y-2,'#b0dfce23',1.3)}w.restore();
 g.save();g.clip(path,'evenodd');
 const grass=g.createLinearGradient(-100,-200,900,1000);grass.addColorStop(0,'#a4bc82');grass.addColorStop(.46,'#93b77b');grass.addColorStop(1,'#688f72');g.fillStyle=grass;g.fillRect(s.left,s.top,s.width,s.height);
 const sand=g.createRadialGradient(4*TILE,14*TILE,60,6*TILE,15*TILE,590);sand.addColorStop(0,'#ead6a9');sand.addColorStop(.6,'#ddc793ed');sand.addColorStop(1,'#ddc79300');g.fillStyle=sand;g.fillRect(s.left,s.top,s.width,s.height);
 const woods=g.createRadialGradient(22*TILE,12*TILE,0,22*TILE,12*TILE,520);woods.addColorStop(0,'#376e696b');woods.addColorStop(1,'#376e6900');g.fillStyle=woods;g.fillRect(s.left,s.top,s.width,s.height);
 for(let i=0;i<120;i++){
  const x=(hash(i,2)*(COLS+6)-3)*TILE,y=(hash(i,6)*(ROWS+6)-3)*TILE,r=12+hash(i,12)*70,pts=[];
  for(let k=0;k<7;k++){const a=k/7*Math.PI*2,rr=r*(.7+hash(i,k,3)*.4);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*.7]);}
  shape(g,pts,i%3===0?'#edf0b91c':i%3===1?'#467d6220':'#a7c16c24',.17);
 }
 const paths=[[[4.5,9.5],[6.7,9.6],[8.5,9.5],[8.5,7.5],[11.5,7.5],[14.5,7.5],[14.5,6.5],[17.5,6.5]],[[6.5,3.9],[6.4,5.7],[6.5,7.5],[8.5,7.5]]];
 for(const pts of paths){
  g.beginPath();g.moveTo(pts[0][0]*TILE,pts[0][1]*TILE);
  for(let i=1;i<pts.length-1;i++)g.quadraticCurveTo(pts[i][0]*TILE,pts[i][1]*TILE,(pts[i][0]+pts[i+1][0])*.5*TILE,(pts[i][1]+pts[i+1][1])*.5*TILE);
  g.lineTo(pts.at(-1)[0]*TILE,pts.at(-1)[1]*TILE);g.strokeStyle='#52755c20';g.lineWidth=38;g.stroke();g.strokeStyle='#d6c89f';g.lineWidth=30;g.stroke();g.strokeStyle='#e3d8b52c';g.lineWidth=20;g.stroke();
 }
 for(let i=0;i<650;i++){
  const x=(hash(i,18)*(COLS+7)-3)*TILE,y=(hash(i,29)*(ROWS+7)-3)*TILE;
  if(!isLand(Math.floor(x/TILE),Math.floor(y/TILE)))continue;
  if(y>10*TILE&&x<13*TILE){shape(g,[[x-3,y],[x,y-2],[x+5,y],[x+1,y+2]],'#a79e7c23',.12);continue;}
  const shade=i%3===0?'#e8ebbc44':'#436f5a38';strokeLine(g,x-3,y+2,x-5,y-4,shade,.9);strokeLine(g,x,y+2,x+1,y-6,shade,1);strokeLine(g,x+2,y+2,x+6,y-2,shade,.9);
 }
 g.strokeStyle='#d9e4ad99';g.lineWidth=2.7;g.stroke(path);g.restore();
 surfaceCache.water=water;surfaceCache.land=land;surfaceCache.loops=loops;surfaceCache.key=scene.terrain.join('');surfaceCache.lastBuild=time;
}
function ensureSurfaceCache(time){const key=scene.terrain.join('');if(!surfaceCache.water||key!==surfaceCache.key&&(time-surfaceCache.lastBuild>65||!gesture))buildSurfaceCache(time)}
function drawSurfaceImage(image,z){const b=basis(),s=SURFACE;ctx.save();ctx.transform(b.x.x/TILE,b.x.y/TILE,b.y.x/TILE,b.y.y/TILE,0,-z);ctx.drawImage(image,s.left,s.top,s.width,s.height);ctx.restore()}
function drawContinuousTerrain(time){
 ensureSurfaceCache(time);drawSurfaceImage(surfaceCache.water,5);
 const edges=[],b=basis();
 for(const loop of surfaceCache.loops)for(let i=0;i<loop.length;i++){
  const a=loop[i],c=loop[(i+1)%loop.length],dx=c[0]-a[0],dy=c[1]-a[1],len=Math.hypot(dx,dy);if(len<.001)continue;
  const mid=[(a[0]+c[0])*.5,(a[1]+c[1])*.5];let nx=dy/len,ny=-dx/len;
  if(fieldAt(mid[0]+nx*.2,mid[1]+ny*.2)>fieldAt(mid[0]-nx*.2,mid[1]-ny*.2)){nx=-nx;ny=-ny;}
  if(nx*b.x.y+ny*b.y.y<.01)continue;
  const p=project(a[0],a[1],LAND),q=project(c[0],c[1],LAND);edges.push({p,q,nx,ny,depth:(p.y+q.y)/2});
 }
 edges.sort((a,b)=>a.depth-b.depth);
 for(const {p,q,nx,ny}of edges){
  const lit=nx*b.x.x+ny*b.y.x<0;
  const shade=ctx.createLinearGradient(p.x,p.y,p.x+5,p.y+42);shade.addColorStop(0,lit?'#8d9b87':'#748e83');shade.addColorStop(1,lit?'#657e77':'#4f7272');
  polygon([p,q,{x:q.x,y:q.y+41},{x:p.x,y:p.y+41}],shade);
  polygon([p,q,{x:q.x,y:q.y+6},{x:p.x,y:p.y+6}],lit?'#b8c297':'#9aac8f');
  line(p.x,p.y+26,q.x,q.y+26,'#304e4d13',1);
 }
 drawSurfaceImage(surfaceCache.land,LAND);
 for(let i=0;i<25;i++){
  const x=hash(i,21)*(COLS+6)-3,y=hash(i,31)*(ROWS+6)-3;if(!withinWorldBase(x,y)||fieldAt(x,y)>.25)continue;
  const c=project(x,y,7),a=Math.sin(time*.0009+i)*3;
  ctx.beginPath();ctx.moveTo(c.x-9+a,c.y);ctx.quadraticCurveTo(c.x,c.y-2,c.x+9+a,c.y);ctx.strokeStyle='#d2f1dc38';ctx.lineWidth=1;ctx.stroke();
 }
 if(showGrid)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)polygon(diamond(x,y,scene.terrain[y*COLS+x]?6:LAND+1),null,'#f1efd62a',.7);
}
function assetSprite(kind,variant,paint,width=154,height=164,bottom=22){
 const key=kind+':'+variant;if(spriteLibrary.has(key))return spriteLibrary.get(key);
 const scale=2,c=layerCanvas(width*scale,height*scale),g=c.getContext('2d'),ax=width/2,ay=height-bottom;g.scale(scale,scale);g.translate(ax,ay);g.lineJoin='round';g.lineCap='round';paint(g,variant);
 const a={canvas:c,x:ax,y:ay,width,height};spriteLibrary.set(key,a);return a;
}
function stampAsset(a,c,scale=1){ctx.drawImage(a.canvas,c.x-a.x*scale,c.y-a.y*scale,a.width*scale,a.height*scale)}
function paintTree(g,variant,pine){
 contactShadow(g,9,4,34,12);
 shape(g,[[-7,1],[-6,-43],[1,-53],[7,-40],[8,1]],toneGradient(g,-6,-50,55,'#9a8c69','#6c7160'),.1);
 strokeLine(g,0,-25,-13,-50,'#7e8162',4);strokeLine(g,2,-38,16,-61,'#777e60',3);
 if(pine){
  const outline=[[-6,-91],[4,-96],[13,-77],[10,-73],[24,-57],[19,-54],[34,-34],[27,-31],[38,-15],[15,-9],[0,-10],[-27,-18],[-19,-25],[-30,-37],[-17,-40],[-24,-56],[-11,-58],[-16,-73]];
  shape(g,outline,toneGradient(g,-25,-96,95,'#749d87','#3f746d'),.12);
  shape(g,[[-6,-88],[4,-91],[8,-76],[3,-69],[-9,-68],[-11,-72]],'#a2bc96',.11);
  shape(g,[[-17,-60],[-8,-69],[1,-71],[13,-57],[9,-51],[-10,-49],[-20,-54]],'#83aa8a',.12);
  shape(g,[[-23,-38],[-12,-49],[0,-48],[23,-32],[14,-25],[-4,-27],[-24,-31]],'#7da489',.11);
  shape(g,[[3,-85],[13,-77],[10,-73],[24,-57],[19,-54],[34,-34],[27,-31],[38,-15],[15,-9],[6,-15],[17,-30],[9,-45],[12,-56],[3,-69]],'#3b6b663a',.1);
 }else{
  const palettes=[['#b0c68b','#6c9b78','#88ad7e'],['#b3c38b','#6a9577','#89a77c'],['#b9ca92','#709f7b','#97b483'],['#9fbe8c','#64917b','#83aa81'],['#c0cb91','#739d74','#9bb581']],p=palettes[variant%5];
  const outline=[[-34,-28],[-42,-44],[-38,-64],[-27,-70],[-20,-87],[-3,-96],[17,-90],[25,-77],[38,-68],[43,-48],[34,-30],[12,-22],[-9,-25]];
  shape(g,outline,toneGradient(g,-30,-96,85,p[0],p[1]),.12);
  shape(g,[[-35,-48],[-34,-64],[-24,-69],[-17,-83],[-2,-91],[12,-86],[18,-74],[9,-65],[-9,-64],[-17,-51]],'#cfdaa44a',.15);
  shape(g,[[5,-65],[20,-77],[36,-66],[40,-49],[29,-35],[10,-30],[-3,-36]],p[2],.12);
  shape(g,[[-36,-46],[-20,-50],[-8,-42],[12,-38],[31,-36],[22,-26],[3,-25],[-10,-28],[-27,-28]],'#4b806449',.12);
  shape(g,[[-17,-77],[-4,-84],[6,-81],[9,-76],[-4,-72]],'#d8e2ad52',.14);
  shape(g,[[14,-54],[25,-59],[32,-53],[27,-46],[16,-47]],'#c4d79c48',.1);
 }
}
function treeSprite(c,seed=0,pine=false,scale=1){const variant=Math.floor(seed*5)%5;stampAsset(assetSprite(pine?'pine':'tree',variant,(g,v)=>paintTree(g,v,pine)),c,scale)}
function paintHouse(g,variant){
 contactShadow(g,8,5,49,16);
 shape(g,[[-34,-33],[-30,-37],[0,-25],[2,10],[-4,14],[-32,1]],toneGradient(g,-28,-37,51,'#e1d7b6','#b7b79b'),.09);
 shape(g,[[0,-25],[31,-38],[36,-33],[35,-3],[29,2],[1,14]],toneGradient(g,1,-35,45,'#b5baa3','#8d9d91'),.08);
 shape(g,[[-44,-39],[-37,-48],[-18,-73],[-10,-78],[17,-62],[7,-31],[0,-25],[-35,-34]],toneGradient(g,-25,-78,53,'#d1b17d','#a18162'),.08);
 shape(g,[[0,-25],[7,-31],[17,-62],[23,-57],[48,-40],[42,-33],[8,-23]],toneGradient(g,8,-62,42,'#b49370','#857365'),.09);
 shape(g,[[-44,-39],[-37,-48],[-18,-73],[-10,-78],[-6,-70],[-27,-42],[-34,-36]],'#e0c492',.08);
 shape(g,[[-35,-34],[0,-25],[8,-23],[7,-18],[-1,-19],[-34,-29]],'#8b8069',.07);
 for(let i=0;i<4;i++){const x=-29+i*8,y=-43-i*3;strokeLine(g,x,y,x+13,y-18,'#9e82684d',1.5);strokeLine(g,x+1,y-1,x+5,y-4,'#ecd2a352',1);}
 shape(g,[[11,5],[11,-13],[14,-21],[22,-25],[27,-21],[27,-2],[23,1]],toneGradient(g,11,-25,30,'#6c776b','#7b8069'),.11);
 shape(g,[[14,3],[14,-13],[18,-20],[22,-22],[24,-19],[24,-3]],'#8f896d',.11);strokeLine(g,17,-16,17,-1,'#b2a381',1);strokeLine(g,21,-18,21,-3,'#6d7565',.8);
 shape(g,[[-24,-26],[-12,-22],[-10,-19],[-10,-10],[-13,-9],[-24,-14]],'#b9cfbe',.08);
 strokeLine(g,-18,-23,-18,-11,'#e6e2c5',1.7);strokeLine(g,-23,-19,-11,-15,'#e7e2c4',1.5);
 shape(g,[[17,-62],[17,-80],[20,-86],[27,-85],[30,-79],[30,-61],[26,-59]],toneGradient(g,17,-86,30,'#bdbaa0','#8d9889'),.1);
 shape(g,[[19,-84],[23,-87],[29,-84],[26,-81]],'#d4cfb2',.12);
 strokeLine(g,-30,0,-2,11,'#8b9a8244',2);strokeLine(g,3,12,31,0,'#73897666',2);
}
function houseSprite(c,seed=0){stampAsset(assetSprite('house',Math.floor(seed*3),(g,v)=>paintHouse(g,v)),c)}
function paintStone(g,variant){
 contactShadow(g,5,5,30,11);
 const dx=(variant%3)-1;
 shape(g,[[-24,-5],[-21,-16],[-10,-27],[8,-30],[20,-22],[27,-6],[21,6],[4,12],[-13,8]],toneGradient(g,-20,-30,44,'#bec5b4','#829c96'),.12);
 shape(g,[[-21,-16],[-10,-27],[8,-30],[18,-22],[10,-13],[-10,-10]],'#d2d4bd',.12);
 shape(g,[[10,-13],[18,-22],[27,-6],[21,6],[4,12],[-1,3]],'#6b8c8a',.12);
 shape(g,[[-23,-4],[-10,-10],[10,-13],[-1,3],[-13,8],[-20,4]],'#a3b5a6',.1);
 shape(g,[[-10+dx,-25],[-1,-28],[5,-25],[0,-23]],'#e1e0c733',.1);
}
function stoneSprite(c,seed=0){stampAsset(assetSprite('stone',Math.floor(seed*4),(g,v)=>paintStone(g,v)),c)}
function paintFlowers(g,variant){
 contactShadow(g,1,4,28,8);
 for(let i=0;i<5;i++){
  const x=-18+hash(i,variant,1)*37,y=hash(i,variant,4)*9-4,h=12+hash(i,variant,8)*9;
  strokeLine(g,x,y,x-2,y-h,'#6c967b',1.4);shape(g,[[x,y-4],[x-9,y-10],[x-7,y-4]],'#8bb08a',.2);shape(g,[[x-1,y-8],[x+7,y-15],[x+6,y-8]],'#a3bf8c',.15);
  const color=['#e6c58f','#d9aa9d','#c8c2b5','#ebd9ab'][(i+variant)%4],cx=x-2,cy=y-h;
  for(let n=0;n<5;n++){const a=n/5*Math.PI*2,c=Math.cos(a),s=Math.sin(a);shape(g,[[cx,cy],[cx+c*4-s*2,cy+s*4+c*2],[cx+c*7,cy+s*7],[cx+c*4+s*2,cy+s*4-c*2]],color,.23);}
  shape(g,[[cx-2,cy],[cx,cy-2],[cx+2,cy],[cx,cy+2]],'#f1e3bb',.2);
 }
}
function flowerSprite(c,seed=0){stampAsset(assetSprite('flowers',Math.floor(seed*4),(g,v)=>paintFlowers(g,v)),c)}
function paintMountain(g,variant,volcano){
 const h=volcano?202:194+variant*9;contactShadow(g,15,9,112,34);
 const peak=[[-112,10],[-113,-17],[-92,-51],[-79,-72],[-65,-126],[-44,-144],[-28,-h+13],[-10,-h],[10,-h+5],[28,-h+28],[39,-126],[58,-90],[68,-45],[91,-22],[108,8],[84,31],[34,38],[-36,34],[-82,27]];
 shape(g,peak,toneGradient(g,-90,-h,h+30,volcano?'#9e917a':'#b7c3bf',volcano?'#6f7b70':'#738f93'),.07);
 shape(g,[[-112,10],[-113,-17],[-92,-51],[-79,-72],[-65,-126],[-44,-144],[-28,-h+13],[-10,-h],[-19,-130],[-38,-88],[-42,-37],[-23,29],[-82,27]],volcano?'#b09c7b':'#bac8c1',.06);
 shape(g,[[-10,-h],[10,-h+5],[28,-h+28],[39,-126],[58,-90],[68,-45],[91,-22],[108,8],[84,31],[34,38],[18,-6],[29,-65],[4,-114]],volcano?'#667166':'#6f8c93',.07);
 shape(g,[[-19,-130],[-38,-88],[-42,-37],[-23,29],[18,-6],[29,-65],[4,-114],[-10,-h]],volcano?'#8c8d76':'#9fb4b0',.07);
 if(volcano){
  shape(g,[[-29,-h+12],[-16,-h],[9,-h+4],[25,-h+22],[10,-h+29],[-14,-h+26]],'#c4a080',.1);
  shape(g,[[-21,-h+14],[-12,-h+7],[6,-h+10],[17,-h+21],[7,-h+25],[-12,-h+22]],'#d88f6e',.1);
  shape(g,[[-12,-h+14],[1,-h+14],[9,-h+21],[-2,-h+23],[-11,-h+20]],'#efbe88',.1);
  shape(g,[[7,-h+26],[-2,-142],[8,-112],[-3,-82],[4,-55],[-6,-32],[6,-25],[11,-56],[8,-81],[19,-113],[10,-146],[15,-h+24]],'#d59877',.12);
 }else{
  shape(g,[[-44,-144],[-28,-h+13],[-10,-h],[10,-h+5],[28,-h+28],[37,-136],[24,-143],[17,-134],[8,-150],[-3,-140],[-9,-158],[-20,-141],[-28,-150]],toneGradient(g,-20,-h,80,'#ecedda','#c9d9d0'),.07);
  shape(g,[[-10,-h],[-8,-165],[1,-157],[8,-150],[-3,-140],[-9,-158],[-20,-141]],'#b3cbc5',.08);
 }
 shape(g,[[-87,-22],[-68,-38],[-39,-34],[-47,-24],[-69,-18]],'#e6e3cc19',.1);
}
function mountainSprite(c,seed=0,volcano=false){stampAsset(assetSprite(volcano?'volcano':'mountain',Math.floor(seed*3),(g,v)=>paintMountain(g,v,volcano),276,324,48),c)}
function drawActor(time){
 const c=point(actor),moving=mode==='walking'&&phase==='walk',bob=moving?Math.sin(time*.018)*1.2:0;
 ctx.save();ctx.translate(c.x,c.y+bob);const next=route?.[Math.min(runIndex+1,(route?.length||1)-1)];contactShadow(ctx,3,4,18,7);if(next&&point(next).x<c.x)ctx.scale(-1,1);
 const stride=moving?Math.sin(time*.02)*4:0;
 if(actor.seated){shape(ctx,[[-8,-12],[-8,-3],[-14,0],[-14,5],[-7,6],[-1,-3]],'#718f8b',.15);shape(ctx,[[4,-12],[11,-6],[13,2],[7,5],[3,-3]],'#5b7b7c',.15);}
 else{strokeLine(ctx,-5,-13,-6-stride*.45,-1+stride,'#6e8a83',6);strokeLine(ctx,5,-13,6+stride*.45,-1-stride,'#577779',6);shape(ctx,[[-11-stride*.45,-3+stride],[-4-stride*.45,-4+stride],[-2-stride*.45,1+stride],[-10-stride*.45,2+stride]],'#8a8069',.15);shape(ctx,[[3+stride*.45,-3-stride],[10+stride*.45,-4-stride],[12+stride*.45,1-stride],[4+stride*.45,2-stride]],'#787761',.15);}
 shape(ctx,[[-11,-36],[4,-39],[10,-33],[13,-18],[8,-10],[-11,-12],[-15,-23]],toneGradient(ctx,-10,-37,27,'#dce0bd','#a4bba5'),.15);
 shape(ctx,[[-13,-34],[-18,-29],[-17,-18],[-11,-17],[-8,-28]],'#82a18b',.15);strokeLine(ctx,9,-30,14,-21-stride*.4,'#bfccb0',5);
 shape(ctx,[[-8,-38],[7,-38],[11,-31],[1,-28],[-9,-31]],'#cf9f80',.16);shape(ctx,[[7,-33],[18,-28],[12,-23],[4,-29]],'#e1b48a',.13);
 shape(ctx,[[-7,-47],[-4,-52],[6,-52],[11,-46],[10,-38],[4,-34],[-3,-37]],'#e1c9a0',.2);
 shape(ctx,[[-8,-51],[-4,-55],[7,-54],[12,-49],[9,-45],[-6,-44]],'#8b987a',.14);
 shape(ctx,[[-14,-48],[-6,-53],[9,-52],[18,-46],[11,-43],[-8,-44]],'#b0bb8e',.13);shape(ctx,[[-6,-56],[7,-56],[11,-49],[-9,-49]],toneGradient(ctx,-4,-56,12,'#ccd2a2','#9ba77d'),.13);
 strokeLine(ctx,8,-43,8,-41,'#6c7a68',1.5);strokeLine(ctx,3,-37,6,-37,'#b49679',1);ctx.restore();
}
