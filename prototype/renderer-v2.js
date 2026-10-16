// Three curated orthographic views keep the 2.5D sprites readable.
const TILE=48,LAND=26,PITCH=.72,IX=TILE/Math.SQRT2,IY=TILE*PITCH/Math.SQRT2;
const OBSERVATION_VIEWS=[{name:'左前',angle:-18},{name:'正面',angle:0},{name:'右前',angle:18}];
const camera={x:0,y:0,zoom:.5,angle:0,ready:false,fit:.5,target:null,follow:false};
let objectHits=[],panGesture=null,pinchGesture=null,touchLock=false;
const pointers=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function basis(){const a=camera.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:{x:c*TILE,y:s*TILE*PITCH},y:{x:-s*TILE,y:c*TILE*PITCH}}}
function project(x,y,z=LAND){const b=basis();return {x:x*b.x.x+y*b.y.x,y:x*b.x.y+y*b.y.y-z}}
function unproject(p,z=LAND){const a=camera.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=p.x/TILE,y=(p.y+z)/(TILE*PITCH);return {x:x*c+y*s,y:-x*s+y*c}}
function depthAt(p){return project(p.x+.5,p.y+.5,0).y}
function point(p){return project(p.x+.5,p.y+.5,LAND)}
function boardPoint(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function screenToWorld(p){return {x:(p.x-camera.x)/camera.zoom,y:(p.y-camera.y)/camera.zoom}}
function worldBounds(){
 const p=baseOutline().map(([x,y])=>project(x,y,-7));
 for(const[x,y,h]of [[-1,-2,228],[3,-3,240],[6,-3,220],[COLS+1,1,220]]){const q=project(x,y,LAND);p.push({x:q.x-120,y:q.y-h},{x:q.x+120,y:q.y+40});}
 return {left:Math.min(...p.map(q=>q.x)),right:Math.max(...p.map(q=>q.x)),top:Math.min(...p.map(q=>q.y)),bottom:Math.max(...p.map(q=>q.y))+35};
}
function fitZoom(){const b=worldBounds();return Math.max(.11,Math.min((W-72)/(b.right-b.left),(H-190)/(b.bottom-b.top)))}
function cameraUI(){
 const ratio=camera.zoom/camera.fit;
 $('zoomValue').textContent=Math.round(ratio*100)+'%';
 $('farView').classList.toggle('active',ratio<1.35);
 $('closeView').classList.toggle('active',ratio>=1.8);
 $('followBtn').classList.toggle('active',camera.follow);
 $('followBtn').textContent=camera.follow?'跟随 ✓':'跟随旅人';
 document.querySelector('.scene-caption')?.classList.toggle('hidden',ratio>1.8);
 const current=OBSERVATION_VIEWS.reduce((a,b)=>Math.abs(b.angle-camera.angle)<Math.abs(a.angle-camera.angle)?b:a);
 $('angleValue').textContent=current.name;
 $('frontView').classList.toggle('active',current.angle===0);
 $('rotateLeft').classList.toggle('active',current.angle===-18);
 $('rotateRight').classList.toggle('active',current.angle===18);
 const compass=document.querySelector('.camera-compass');if(compass?.style.setProperty)compass.style.setProperty('--heading',camera.angle+'deg');
}
function setObservation(angle){
 const anchor={x:W/2,y:H*.47},focus=unproject(screenToWorld(anchor),0),wasFar=camera.zoom/camera.fit<1.2;
 camera.target=null;camera.follow=false;camera.angle=OBSERVATION_VIEWS.find(v=>v.angle===angle)?.angle||0;camera.fit=fitZoom();
 const p=project(focus.x,focus.y,0);camera.x=anchor.x-p.x*camera.zoom;camera.y=anchor.y-p.y*camera.zoom;
 if(wasFar)setView('far',false);objectHits=[];dirty=true;cameraUI();
}
function rotateView(delta){const i=OBSERVATION_VIEWS.findIndex(v=>v.angle===camera.angle),j=clamp(i+(delta<0?-1:1),0,OBSERVATION_VIEWS.length-1);setObservation(OBSERVATION_VIEWS[j].angle)}
function frontView(){camera.angle=0;objectHits=[];setView('far')}
function setView(which,animate=true){
 camera.fit=fitZoom();camera.follow=false;
 const bounds=worldBounds(),center={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2};
 let zoom=camera.fit,focus=center;
 if(which==='close'){zoom=clamp(Math.max(.95,camera.fit*2.45),camera.fit*.62,2.4);focus=point(mode==='walking'||mode==='paused'?actor:(selected||scene.goal));focus.y-=25;}
 const target={zoom,x:W/2-focus.x*zoom,y:H*.47-focus.y*zoom};
 if(animate&&camera.ready)camera.target=target;else{Object.assign(camera,target);camera.target=null;}
 camera.ready=true;dirty=true;cameraUI();
}
function zoomAt(mult,anchor={x:W/2,y:H/2}){
 const world=screenToWorld(anchor),zoom=clamp(camera.zoom*mult,camera.fit*.62,2.4);
 camera.target=null;camera.follow=false;camera.zoom=zoom;camera.x=anchor.x-world.x*zoom;camera.y=anchor.y-world.y*zoom;dirty=true;cameraUI();
}
function cellAt(screen,pickObject=true){
 const w=screenToWorld(screen);
 if(pickObject&&!gesture&&['select','goal','erase','gate'].includes(tool)){
  for(let i=objectHits.length-1;i>=0;i--){const hit=objectHits[i];if(w.x>=hit.x1&&w.x<=hit.x2&&w.y>=hit.y1&&w.y<=hit.y2)return {...hit.cell};}
 }
 const ground=unproject(w,LAND),x=Math.floor(ground.x),y=Math.floor(ground.y);
 const candidates=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const q={x:x+dx,y:y+dy};if(!inside(q.x,q.y))continue;
  const z=scene.terrain[key(q)]===1&&scene.objects[key(q)]?.type!=='bridge'?5:LAND;
  const local=unproject(w,z),distance=Math.max(Math.abs(local.x-q.x-.5),Math.abs(local.y-q.y-.5));
  if(distance<=.53)candidates.push({q,distance,depth:depthAt(q)});
 }
 candidates.sort((a,b)=>a.distance-b.distance||b.depth-a.depth);return candidates[0]?.q||null;
}
function canEdit(){if(mode!=='walking')return true;toast('先暂停旅人再编辑；缩放和拖动画面可以随时进行。');return false}
function endStroke(text){
 if(!gesture)return;const g=gesture;gesture=null;
 if(g.kind==='paint'&&g.changed)commit(g.before,text||'场景已调整，可以预览路线或开始试走。');
}
function cancelForCamera(){
 if(gesture?.kind==='paint'&&gesture.changed){scene=gesture.before;refreshSearch();}
 gesture=null;dirty=true;
}
canvas.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-clamp(e.deltaY,-120,120)*.0016),boardPoint(e))},{passive:false});
canvas.addEventListener('pointerdown',e=>{
 const screen=boardPoint(e);pointers.set(e.pointerId,{...screen,touch:e.pointerType==='touch'});
 if(e.pointerType==='touch'&&[...pointers.values()].filter(p=>p.touch).length>=2){
  e.preventDefault();canvas.setPointerCapture(e.pointerId);cancelForCamera();panGesture=null;touchLock=true;
  const [a,b]=[...pointers.values()].filter(p=>p.touch),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  pinchGesture={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:camera.zoom,world:screenToWorld(mid)};camera.target=null;camera.follow=false;return;
 }
 if(e.button===2||e.button===1||e.altKey){
  e.preventDefault();canvas.setPointerCapture(e.pointerId);camera.follow=false;camera.target=null;panGesture={id:e.pointerId,screen,x:camera.x,y:camera.y};canvas.style.cursor='grabbing';cameraUI();return;
 }
 if(e.button!==0||touchLock)return;
 const p=cellAt(screen);
 if(tool==='select'&&(!p||!scene.objects[key(p)]&&!same(p,scene.start)&&!same(p,scene.goal))){
  e.preventDefault();canvas.setPointerCapture(e.pointerId);selected=null;panGesture={id:e.pointerId,screen,x:camera.x,y:camera.y};camera.target=null;camera.follow=false;canvas.style.cursor='grabbing';updateUI();return;
 }
 if(!p||!canEdit())return;e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
 if(tool==='select'){
  const o=scene.objects[key(p)],kind=o?'object':same(p,scene.start)?'start':same(p,scene.goal)?'goal':null;
  selected=o?{...p}:null;gesture={kind:'select',moveKind:kind,from:{...p},point:screen,before:clone(scene),moved:false,object:o?clone(o):null};updateUI();
 }else{
  gesture={kind:'paint',before:clone(scene),last:key(p),changed:false,single:['gate','start','goal'].includes(tool)};
  if(tool==='gate'&&scene.objects[key(p)]?.type==='gate'){gesture=null;toggleGate(p);return;}
  gesture.changed=place(p,tool);dirty=true;
 }
});
canvas.addEventListener('pointermove',e=>{
 const screen=boardPoint(e);if(pointers.has(e.pointerId))pointers.set(e.pointerId,{...screen,touch:e.pointerType==='touch'});
 if(pinchGesture){
  const t=[...pointers.values()].filter(p=>p.touch);if(t.length>=2){const[a,b]=t,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};camera.zoom=clamp(pinchGesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinchGesture.distance,camera.fit*.62,2.4);camera.x=mid.x-pinchGesture.world.x*camera.zoom;camera.y=mid.y-pinchGesture.world.y*camera.zoom;dirty=true;cameraUI();}return;
 }
 if(panGesture?.id===e.pointerId){camera.x=panGesture.x+screen.x-panGesture.screen.x;camera.y=panGesture.y+screen.y-panGesture.screen.y;dirty=true;return;}
 if(touchLock)return;
 const p=cellAt(screen,!gesture);hover=p;
 if(gesture){
  if(gesture.kind==='select'&&Math.hypot(screen.x-gesture.point.x,screen.y-gesture.point.y)>5)gesture.moved=true;
  if(gesture.kind==='paint'&&p&&!gesture.single&&key(p)!==gesture.last){gesture.last=key(p);gesture.changed=place(p,tool)||gesture.changed;}
 }
 dirty=true;
});
function endPointer(e,cancel=false){
 pointers.delete(e.pointerId);
 if(pinchGesture||touchLock){if([...pointers.values()].filter(p=>p.touch).length<2)pinchGesture=null;if(!pointers.size)touchLock=false;releasePointer(e);return;}
 if(panGesture?.id===e.pointerId){panGesture=null;releasePointer(e);updateUI();return;}
 if(!gesture){releasePointer(e);return;}
 const p=cellAt(boardPoint(e),false),g=gesture;gesture=null;
 if(g.kind==='paint'){
  if(g.changed)commit(g.before,tool==='start'?'起点已更新。':tool==='goal'?'终点已更新。':mode==='paused'?'场景已调整。继续试走时会重新计算路线。':'场景已调整，可以预览路线或开始试走。');
 }else if(!cancel&&g.moved&&g.moveKind&&p&&!same(p,g.from)){
  if(g.moveKind==='start'||g.moveKind==='goal'){
   if(place(p,g.moveKind))commit(g.before,g.moveKind==='start'?'起点已移动。':'终点已移动。');
  }else{
   const o=scene.objects[key(g.from)];
   if(same(g.from,scene.start)||mode==='paused'&&same(g.from,actor.cell))fail('这个位置被起点或旅人占用，请先移开。');
   else if(scene.objects[key(p)]||same(p,scene.start)||same(p,scene.goal)||mode==='paused'&&same(p,actor.cell))fail('这个位置已被占用，请换一处。');
   else if(o.type==='bridge'?scene.terrain[key(p)]!==1:scene.terrain[key(p)]===1)fail(o.type==='bridge'?'桥需要移动到水面上。':'这个物件需要放在陆地上。');
   else{scene.objects[key(p)]=o;scene.objects[key(g.from)]=null;if(same(scene.goal,g.from))scene.goal={...p};selected={...p};commit(g.before,names[o.type]+'已移动。');}
  }
 }else if(!cancel&&!g.moved&&g.kind==='select'){
  if(scene.objects[key(g.from)]?.type==='gate')toggleGate(g.from);else if(selected)updateUI();
 }
 releasePointer(e);dirty=true;
}
function releasePointer(e){if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}
canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('pointerleave',()=>{if(!gesture&&!panGesture)hover=null;dirty=true});canvas.addEventListener('contextmenu',e=>e.preventDefault());
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function line(x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function polygon(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function poly(points,fill,stroke,width=1){polygon(points.map(p=>({x:p[0],y:p[1]})),fill,stroke,width)}
function hash(x,y,n=0){const v=Math.sin(x*127.1+y*311.7+n*71.3)*43758.5453;return v-Math.floor(v)}
function objectAt(x,y){return inside(x,y)?scene.objects[y*COLS+x]:null}
function isLand(x,y){
 if(inside(x,y))return scene.terrain[y*COLS+x]===0;
 if(!withinWorldBase(x,y)||!withinWorldBase(x+1,y)||!withinWorldBase(x+1,y+1)||!withinWorldBase(x,y+1))return false;
 const ox=Math.max(0,-x,x-COLS+1),oy=Math.max(0,-y,y-ROWS+1);
 return Math.max(ox,oy)<1.7+hash(x,y)*1.4&&ox+oy<3.4;
}
function level(x,y){return isLand(x,y)?LAND:5}
function diamond(x,y,z=LAND){return [project(x,y,z),project(x+1,y,z),project(x+1,y+1,z),project(x,y+1,z)]}
function trail(x,y){return y===9&&x>=4&&x<=8||x===8&&y>=7&&y<=9||y===7&&x>=8&&x<=14||x===14&&y===6||y===6&&x>=14&&x<=17||x===6&&y>=3&&y<=7}
function landColor(x,y){
 const h=Math.floor(hash(x,y)*5);
 if(y>9&&x<15)return ['#dfc17c','#d8b972','#e4c984','#ccae67','#d8bd77'][h];
 if(x>16&&y<3)return ['#6f7e59','#81916a','#788461','#8c986e','#6e8059'][h];
 if(x>16&&y>8)return ['#52754b','#5c7e4f','#64834d','#56774b','#6b854e'][h];
 if(inside(x,y)&&trail(x,y))return ['#c8bb88','#d1c594','#cfc18c','#bfb37f','#d4c899'][h];
 return ['#78934d','#839d50','#8ba557','#769449','#92aa5c'][h];
}
function drawTile(x,y,time){
 const land=isLand(x,y),z=land?LAND:5,v=diamond(x,y,z),seed=hash(x,y);
 if(land){
  const rock=y>8&&x<15?'#a98545':'#697159',light=y>8&&x<15?'#b99a57':'#858b65';
  const b=basis(),sx=b.x.y>=0?1:-1,sy=b.y.y>=0?1:-1;
  if(!isLand(x+sx,y)){const edge=sx===1?[1,2]:[3,0],a=v[edge[0]],c=v[edge[1]],d={x:c.x,y:c.y+LAND+15},e={x:a.x,y:a.y+LAND+15};polygon([a,c,d,e],rock);polygon([a,d,e],light);}
  if(!isLand(x,y+sy)){const edge=sy===1?[2,3]:[0,1],a=v[edge[0]],c=v[edge[1]],d={x:c.x,y:c.y+LAND+15},e={x:a.x,y:a.y+LAND+15};polygon([a,c,d,e],light);polygon([c,d,e],'#5e68454a');}
  const color=landColor(x,y);polygon(v,color);
  polygon([v[0],v[1],{x:v[2].x-IX*.25,y:v[2].y-IY*.5}],seed>.5?'#b7c77a19':'#3f633411');
  if(seed>.72&&!trail(x,y)){
   const c=project(x+.2+seed*.45,y+.45,LAND+.2);poly([[c.x-7,c.y],[c.x-2,c.y-3],[c.x+8,c.y-1],[c.x+5,c.y+3],[c.x-5,c.y+2]],y>9&&x<15?'#b89b5c33':'#436f393d');
  }
  if(seed<.43&&!trail(x,y)&&!(y>9&&x<15)){
   const c=project(x+.25+seed,y+.55,LAND+1);line(c.x-2,c.y,c.x-4,c.y-4,'#a6b96b',1);line(c.x,c.y,c.x+1,c.y-5,'#536f37aa',1);line(c.x+2,c.y,c.x+5,c.y-3,'#acbd72aa',1);
  }
 }else{
  const shallow=[[-1,0],[1,0],[0,1],[0,-1]].some(([dx,dy])=>isLand(x+dx,y+dy));
  polygon(v,shallow?['#4ba9a7','#51b1ad','#5bbab3'][Math.floor(seed*3)]:['#327f8e','#358b97','#398e98'][Math.floor(seed*3)]);
  const c=project(x+.5,y+.5,7),wave=Math.sin(time*.0007+x*.7+y*.4)*3;
  if(seed<.65){ctx.save();ctx.globalAlpha=shallow?.48:.23;poly([[c.x-17+wave,c.y],[c.x-7+wave,c.y-3],[c.x+8+wave,c.y-2],[c.x+17+wave,c.y+1]],null,'#a0e7cd',1.4);ctx.restore();}
  if(shallow&&seed>.5){poly([[c.x-7,c.y-4],[c.x+1,c.y-7],[c.x+9,c.y-3],[c.x+2,c.y+1]],null,'#d2f0cf44',.8);}
 }
 if(inside(x,y)&&showGrid)polygon(v,null,land?'#e9f0cf35':'#d5f1dc33',.7);
}
function treeSprite(c,seed=0,pine=false,scale=1){
 ctx.save();ctx.translate(c.x,c.y);ctx.scale(scale,scale);ellipse(10,4,25,11,'#142a1840');
 poly([[-5,-5],[-5,-41],[3,-48],[7,-3]],'#655838');poly([[1,-6],[1,-41],[6,-45],[7,-3]],'#9a8050');
 if(pine){
  poly([[-31,-22],[-18,-40],[-23,-40],[-10,-58],[-14,-58],[0,-86],[15,-58],[11,-58],[25,-40],[19,-40],[33,-22],[4,-8]],'#385b42');
  poly([[-31,-22],[-18,-40],[-23,-40],[-10,-58],[-14,-58],[0,-86],[0,-13]],'#58764d');
  poly([[-16,-42],[-7,-52],[-10,-52],[0,-72],[5,-52],[1,-52],[14,-38],[0,-31]],'#739253');
 }else{
  const clusters=[[-19,-38,25], [15,-39,26],[-3,-63,28],[-20,-59,19],[18,-60,20],[0,-40,25]];
  for(let k=0;k<clusters.length;k++){
   const[x,y,r]=clusters[k],verts=[];for(let j=0;j<9;j++){const a=j/9*Math.PI*2,rr=r*(.86+hash(k,seed,j)*.22);verts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*.76]);}
   poly(verts,['#5b7942','#506d3b','#7d9850','#718b46','#6b8845','#668441'][k]);
   poly([[x-r*.6,y-3],[x-r*.25,y-r*.45],[x+r*.25,y-r*.42],[x+r*.4,y-r*.12],[x-r*.05,y+1]],'#a0b76544');
  }
  for(let i=0;i<12;i++){const x=(hash(i,seed)-.5)*56,y=-29-hash(seed,i,4)*47;poly([[x,y],[x+5,y-3],[x+8,y],[x+4,y+3]],'#c3d17e44');}
 }
 ctx.restore();
}
function mountainSprite(c,seed=0,volcano=false){
 ctx.save();ctx.translate(c.x,c.y);const h=volcano?205:190+seed*34;
 ellipse(22,9,106,34,'#10231e40');
 const rim=volcano?[[-25,-h],[-3,-h-8],[22,-h+4]]:[[-7,-h],[4,-h-9],[16,-h+17]];
 poly([[-119,18],[-94,-32],[-71,-40],[-53,-107],...rim,[43,-h*.62],[64,-91],[86,-54],[109,10],[48,37],[-30,40]],volcano?'#594c3a':'#657c7c');
 poly([[-119,18],[-94,-32],[-71,-40],[-53,-107],rim[0],[-25,-90],[-7,-61],[-27,-20],[-31,40]],volcano?'#89724d':'#9aa7a2');
 poly([rim[0],rim[1],[-25,-90],[-7,-61],[-27,-20],[-31,40],[7,24],[30,-20],[17,-96]],volcano?'#6d5a3f':'#809390');
 poly([rim[1],rim[2],[43,-h*.62],[64,-91],[86,-54],[109,10],[48,37],[7,24],[30,-20],[17,-96]],volcano?'#3f4134':'#4e6972');
 for(let i=0;i<5;i++)poly([[-105+i*34,10],[-80+i*30,-15-hash(i,seed)*35],[-53+i*29,22]],volcano?'#a386472e':'#c4d1b52b');
 if(volcano){
  poly([[-25,-h],[-3,-h-8],[22,-h+4],[13,-h+16],[-12,-h+14]],'#ca7843');poly([[-17,-h+3],[-2,-h+1],[14,-h+6],[7,-h+12],[-9,-h+10]],'#ffc47b');
  poly([[4,-h+14],[-6,-147],[5,-121],[-10,-85],[-2,-65],[-14,-31],[7,-23],[4,-62],[17,-98],[8,-121],[13,-151]],'#d7773d');line(2,-h+15,0,-147,'#f5b65b',3);
 }else{
  poly([rim[0],rim[1],rim[2],[34,-h*.69],[22,-h*.72],[11,-h*.64],[6,-h*.79],[-6,-h*.71],[-12,-h*.85],[-30,-h*.62],[-28,-h*.77]],'#e1e6d5');
  poly([rim[1],[4,-h*.81],[15,-h*.77],[11,-h*.64],[6,-h*.79],[-6,-h*.71]],'#a9c4c1');
 }
 ctx.restore();
}
function houseSprite(c,seed=0){
 ctx.save();ctx.translate(c.x,c.y);ellipse(8,9,44,15,'#26361933');
 poly([[-33,-36],[0,-24],[0,13],[-33,-1]],'#c1b484');poly([[0,-24],[33,-38],[33,-2],[0,13]],'#96885d');
 poly([[-44,-39],[-15,-72],[16,-58],[1,-22]],'#b49854');poly([[1,-22],[16,-58],[46,-41],[10,-25]],'#8b713f');
 poly([[-44,-39],[-15,-72],[-11,-63],[-34,-35]],'#cfb46d');
 for(let i=0;i<4;i++)line(-32+i*8,-42-i*3,-12+i*5,-64+i*2,'#94794088',2);
 line(-31,-1,0,12,'#6c674c',4);line(0,12,32,-2,'#696143',4);
 poly([[10,-16],[22,-22],[22,-1],[10,5]],'#554c35');poly([[12,-15],[19,-19],[19,-1],[12,2]],'#776340');
 poly([[-23,-28],[-10,-23],[-10,-11],[-23,-16]],'#637c6b');line(-17,-25,-17,-13,'#d9d1a2',2);line(-22,-22,-11,-18,'#d9d1a2',1.5);
 poly([[17,-60],[17,-82],[25,-85],[25,-62]],'#8e8566');poly([[25,-85],[30,-81],[30,-64],[25,-62]],'#645e47');
 ctx.restore();
}
function drawObject(o,p,alpha=1){
 const c=point(p),seed=hash(p.x,p.y);ctx.save();ctx.globalAlpha=alpha;
 if(o.type==='tree')treeSprite(c,seed,p.x>15);
 else if(o.type==='house')houseSprite(c,seed);
 else if(o.type==='stone')stoneSprite(c,seed);
 else if(o.type==='flower')flowerSprite(c,seed);
 else{
  ctx.translate(c.x,c.y);
  if(o.type==='stone'){
   ellipse(5,5,23,10,'#24331b29');poly([[-22,-4],[-13,-23],[6,-28],[24,-9],[16,9],[-9,12]],'#7d866d');poly([[-22,-4],[-13,-23],[6,-28],[1,-8],[-9,12]],'#b0b294');poly([[6,-28],[24,-9],[1,-8]],'#989e7e');poly([[1,-8],[24,-9],[16,9],[-9,12]],'#67745c');
  }else if(o.type==='flower'){
   ellipse(1,3,24,8,'#537b3933');for(let i=0;i<6;i++){const x=(i-2.5)*6,y=(i%2)*5;line(x,y,x-2,y-14,'#587a3d',2);poly([[x,y-4],[x-8,y-10],[x-7,y-4]],'#6e913f');const col=['#e6c867','#d49c86','#bdc893'][i%3];for(let n=0;n<4;n++){const a=n*Math.PI/2;roundRect(x-4+Math.cos(a)*3,y-17+Math.sin(a)*3,5,5,1,col)}roundRect(x-3,y-16,3,3,0,'#f0dfaa');}
  }else if(o.type==='bridge'){
   const axes=basis(),a=o.dir==='v'?axes.y:axes.x,side=o.dir==='v'?axes.x:axes.y,b={x:side.x*.61,y:side.y*.61};
   const corners=[{x:-a.x*.54-b.x*.5,y:-a.y*.54-b.y*.5-3},{x:a.x*.54-b.x*.5,y:a.y*.54-b.y*.5-3},{x:a.x*.54+b.x*.5,y:a.y*.54+b.y*.5-3},{x:-a.x*.54+b.x*.5,y:-a.y*.54+b.y*.5-3}];
   polygon(corners,toneGradient(ctx,-20,-20,45,'#d0bfa0','#ad9d83'),'#9e9681',.8);polygon([corners[2],corners[3],{x:corners[3].x,y:corners[3].y+6},{x:corners[2].x,y:corners[2].y+6}],'#8a8d7b');
   for(let t=-.4;t<=.5;t+=.18)line(a.x*t-b.x*.46,a.y*t-b.y*.46-3,a.x*t+b.x*.46,a.y*t+b.y*.46-3,'#ddc38c',1.4);
   for(const side of [-1,1]){
    const aa={x:-a.x*.49+b.x*.52*side,y:-a.y*.49+b.y*.52*side},bb={x:a.x*.49+b.x*.52*side,y:a.y*.49+b.y*.52*side};
    line(aa.x,aa.y,aa.x,aa.y-19,'#705d3b',3);line(bb.x,bb.y,bb.x,bb.y-19,'#705d3b',3);line(aa.x,aa.y-14,bb.x,bb.y-14,'#c5a773',3);line(aa.x,aa.y-16,bb.x,bb.y-16,'#e4cc9a',1);
   }
  }else if(o.type==='fence'||o.type==='gate'){
   const vertical=[objectAt(p.x,p.y-1),objectAt(p.x,p.y+1)].filter(n=>n&&['fence','gate'].includes(n.type)).length>[objectAt(p.x-1,p.y),objectAt(p.x+1,p.y)].filter(n=>n&&['fence','gate'].includes(n.type)).length;
   const axes=basis(),axis=vertical?axes.y:axes.x,a={x:axis.x*.88,y:axis.y*.88};
   for(const t of [-.5,.5]){line(a.x*t,a.y*t+1,a.x*t,a.y*t-30,'#79633e',5);line(a.x*t-1,a.y*t-28,a.x*t-1,a.y*t-34,'#b69a63',3);}
   if(o.type==='gate'){
    const b=o.open?{x:a.x*.16-a.y*.65,y:a.y*.18-9}:{x:a.x,y:a.y};
    const x=-a.x*.45,y=-a.y*.45;
    poly([[x,y-24],[x+b.x*.9,y+b.y*.9-24],[x+b.x*.9,y+b.y*.9-5],[x,y-5]],o.open?'#b8a16d':'#a1824d','#7b693f',1);
    line(x,y-23,x+b.x*.9,y+b.y*.9-5,'#d4ba7a',2);line(x,y-5,x+b.x*.9,y+b.y*.9-23,'#7d693d',1.4);
   }else for(const h of [9,23]){line(-a.x*.55,-a.y*.55-h,a.x*.55,a.y*.55-h,'#9c8352',4);line(-a.x*.55,-a.y*.55-h-1,a.x*.55,a.y*.55-h-1,'#c7ad75',1);}
  }else if(o.type==='bench'){
   const axes=basis(),aa=o.dir==='v'?axes.y:axes.x,bb=o.dir==='v'?axes.x:axes.y,a={x:aa.x/TILE,y:aa.y/TILE},b={x:bb.x/TILE,y:bb.y/TILE};
   ellipse(3,5,27,9,'#28331b30');
   for(const t of [-19,19])line(a.x*t,a.y*t-5,a.x*t,a.y*t+4,'#5c5d43',4);
   const seat=(t,s,h)=>({x:a.x*t+b.x*s,y:a.y*t+b.y*s-h});
   polygon([seat(-27,-8,11),seat(27,-8,11),seat(27,8,11),seat(-27,8,11)],toneGradient(ctx,-20,-35,40,'#d1bc99','#a6947b'),'#928e77',.8);
   const e1=seat(-25,-8,28),e2=seat(25,-8,28),f1=seat(-25,-8,9),f2=seat(25,-8,9);
   line(f1.x,f1.y,e1.x,e1.y,'#6c6240',3);line(f2.x,f2.y,e2.x,e2.y,'#6c6240',3);line(e1.x,e1.y,e2.x,e2.y,'#9d8350',9);line(e1.x,e1.y-3,e2.x,e2.y-3,'#d0b274',1.5);
  }
 }
 ctx.restore();
 if(alpha===1){
  const sizes={tree:[42,98,11],house:[46,88,16],stone:[27,31,13],bridge:[42,40,37],fence:[32,51,18],gate:[32,55,18],bench:[38,49,26],flower:[25,39,10]};let s=sizes[o.type]||[25,45,10];
  if(o.type==='fence'||o.type==='gate'){
   const vertical=[objectAt(p.x,p.y-1),objectAt(p.x,p.y+1)].filter(n=>n&&['fence','gate'].includes(n.type)).length>[objectAt(p.x-1,p.y),objectAt(p.x+1,p.y)].filter(n=>n&&['fence','gate'].includes(n.type)).length,b=basis(),a=vertical?b.y:b.x;
   s=[Math.max(o.type==='gate'?13:6,Math.abs(a.x)*.51+5),Math.max(o.type==='gate'?55:0,Math.abs(a.y)*.5+34),Math.abs(a.y)*.5+4];
  }
  objectHits.push({cell:{...p},x1:c.x-s[0],x2:c.x+s[0],y1:c.y-s[1],y2:c.y+s[2]});
 }
}
function marker(p,label,color){
 const c=point(p);ctx.save();ctx.setLineDash([3,4]);polygon(diamond(p.x,p.y,LAND+1),null,color,1.8);ctx.setLineDash([]);
 const fx=c.x-24,fy=c.y-6;line(fx,fy,fx,fy-28,'#5d613e',1.5);poly([[fx,fy-29],[fx+17,fy-25],[fx,fy-20]],color);ctx.restore();
}
function drawActor(time){
 const c=point(actor),moving=mode==='walking'&&phase==='walk',bob=moving?Math.sin(time*.018)*1.5:0;
 ctx.save();ctx.translate(c.x,c.y+bob);const next=route?.[Math.min(runIndex+1,(route?.length||1)-1)],facingLeft=next?point(next).x<c.x:false;
 ellipse(3,4,14,7,'#1c311b42');if(facingLeft)ctx.scale(-1,1);
 const stride=moving?Math.sin(time*.02)*4:0;
 if(actor.seated){poly([[-8,-10],[-8,-2],[-14,1],[-15,5],[-6,6],[-1,-3]],'#485f54');poly([[4,-10],[11,-5],[13,3],[6,5],[3,-2]],'#3f534b');}
 else{line(-5,-13,-6-stride*.45,-1+stride,'#42544a',6);line(5,-13,6+stride*.45,-1-stride,'#354a42',6);roundRect(-11-stride*.45,-3+stride,9,5,1,'#654e32');roundRect(3+stride*.45,-3-stride,9,5,1,'#5b482e');}
 poly([[-11,-36],[6,-38],[13,-17],[7,-10],[-13,-13]],'#c7c59a');poly([[-11,-36],[-3,-35],[-4,-14],[-13,-13]],'#a4ad83');
 poly([[-13,-33],[-17,-29],[-16,-18],[-10,-17],[-8,-29]],'#6d7b52');line(9,-31,14,-21-stride*.4,'#b4ad7f',6);
 poly([[-7,-38],[7,-38],[10,-31],[-8,-30]],'#bd7746');poly([[7,-34],[17,-28],[11,-24],[4,-30]],'#d49454');
 roundRect(-6,-50,15,14,4,'#d6bb83');roundRect(-7,-53,17,9,3,'#755b37');
 poly([[-13,-48],[-5,-53],[11,-52],[17,-46],[10,-43],[-8,-44]],'#a68d51');poly([[-6,-55],[7,-55],[10,-48],[-9,-48]],'#8b7544');line(-5,-55,6,-55,'#b5a166',2);
 roundRect(7,-44,2,3,0,'#514d32');line(2,-38,6,-38,'#8c754d',1);
 ctx.restore();
}
function draw(time){
 const r=canvas.getBoundingClientRect(),oldW=W,oldH=H;
 W=Math.max(1,r.width);H=Math.max(1,r.height);const dpr=Math.min(window.devicePixelRatio||1,2),pw=Math.round(W*dpr),ph=Math.round(H*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}
 if(!camera.ready)setView('far',false);else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();cameraUI();}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#243d44');sky.addColorStop(.52,'#345658');sky.addColorStop(1,'#29474b');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(W*.45,H*.43,30,W*.5,H*.5,Math.max(W,H)*.7);glow.addColorStop(0,'#58775830');glow.addColorStop(1,'#091a1710');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 for(let i=0;i<13;i++){const x=hash(i,1)*W+Math.sin(time*.00014+i)*5,y=hash(i,8)*H;ellipse(x,y,1,1,'#d7d6a31b');}
 ctx.save();ctx.translate(camera.x,camera.y);ctx.scale(camera.zoom,camera.zoom);
 drawWorldBase();
 drawContinuousTerrain(time);
 if((mode==='blocked'||mode==='paused'&&search&&!search.path)&&search?.visited){for(const p of search.visited)polygon(diamond(p.x,p.y,LAND+1),'#d5e7a22b');}
 const path=mode==='walking'||mode==='arrived'?route:search?.path;
 if(path&&showRoute&&path.length){ctx.save();ctx.beginPath();path.forEach((p,i)=>{const c=point(p);i?ctx.lineTo(c.x,c.y-2):ctx.moveTo(c.x,c.y-2)});ctx.strokeStyle='#f4eac475';ctx.lineWidth=6;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();ctx.setLineDash([3,8]);ctx.strokeStyle='#faf0ba';ctx.lineWidth=2.3;ctx.stroke();ctx.restore();}
 const items=[];objectHits=[];
 for(let y=-3;y<ROWS+3;y++)for(let x=-3;x<COLS+3;x++){
  if(inside(x,y)){const o=scene.objects[y*COLS+x];if(o)items.push({depth:depthAt({x,y}),order:0,draw:()=>drawObject(o,{x,y})});}
  else if(isLand(x,y)&&hash(x,y,3)<.39){const c=project(x+.5,y+.5,LAND),seed=hash(x,y,5);items.push({depth:depthAt({x,y}),order:0,draw:()=>treeSprite(c,seed,x>15,.78+seed*.25)});}
 }
 const mountains=[[-1,-2,.8],[3,-3,1.1],[6,-3,.5]];
 for(const[x,y,seed]of mountains){const c=project(x,y,LAND);items.push({depth:project(x,y,0).y,order:-1,draw:()=>mountainSprite(c,seed,false)});}
 const volcano=project(COLS+1,1,LAND);items.push({depth:project(COLS+1,1,0).y,order:-1,draw:()=>mountainSprite(volcano,.5,true)});
 if(selected&&scene.objects[key(selected)])items.push({depth:depthAt(selected)-.05,order:-1,draw:()=>polygon(diamond(selected.x,selected.y,LAND+1),'#f0e5a62c','#eed79a',1.6)});
 items.push({depth:depthAt(scene.start)-.05,order:-1,draw:()=>marker(scene.start,'起','#bfd390')});
 items.push({depth:depthAt(scene.goal)-.05,order:-1,draw:()=>marker(scene.goal,'终','#e5c47e')});
 items.push({depth:depthAt(actor)+.1,order:1,draw:()=>drawActor(time)});
 items.sort((a,b)=>a.depth-b.depth||a.order-b.order);items.forEach(item=>item.draw());
 const gate=scene.objects[6*COLS+14];
 if(gate?.type==='gate'){
  const c=point({x:14,y:6}),z=1/camera.zoom;
  ctx.save();ctx.translate(c.x,c.y-51);ctx.scale(Math.max(1,z*.8),Math.max(1,z*.8));roundRect(-11,-8,22,16,3,gate.open?'#647b47':'#ad8547','#e5d7a566');ctx.font='9px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f7f2d6';ctx.fillText(gate.open?'开':'门',0,0);ctx.restore();
 }
 if(hover&&mode!=='walking'&&!panGesture&&!pinchGesture){
  polygon(diamond(hover.x,hover.y,LAND+2),tool==='erase'?'#edb08933':'#eff0b32a',tool==='erase'?'#e7b88a':'#efdf9b',1.5/camera.zoom);
  if(gesture?.kind==='select'&&gesture.moved&&gesture.object)drawObject(gesture.object,hover,.55);
 }
 ctx.restore();
 // Vignette stays in screen space so the island reads as a small world.
 const vignette=ctx.createRadialGradient(W/2,H*.47,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.7);vignette.addColorStop(0,'#17393d00');vignette.addColorStop(1,'#17393d35');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
}
function frame(time){
 const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;update(dt);
 if(camera.target){const t=camera.target,k=Math.min(1,dt*9);for(const p of ['x','y','zoom'])camera[p]+=(t[p]-camera[p])*k;if(Math.abs(camera.zoom-t.zoom)<.002&&Math.abs(camera.x-t.x)<.3&&Math.abs(camera.y-t.y)<.3){Object.assign(camera,t);camera.target=null;}dirty=true;cameraUI();}
 if(camera.follow&&!camera.target&&!panGesture&&!pinchGesture){const p=point(actor),x=W*.5-p.x*camera.zoom,y=H*.48-(p.y-24)*camera.zoom,k=Math.min(1,dt*5);camera.x+=(x-camera.x)*k;camera.y+=(y-camera.y)*k;dirty=true;}
 if(dirty||mode==='walking'||time-lastDraw>110){draw(time);lastDraw=time;dirty=false;}requestAnimationFrame(frame);
}
$('farView').addEventListener('click',()=>setView('far'));$('closeView').addEventListener('click',()=>setView('close'));$('fitBtn').addEventListener('click',()=>setView('far'));
$('rotateLeft').addEventListener('click',()=>setObservation(-18));$('rotateRight').addEventListener('click',()=>setObservation(18));$('frontView').addEventListener('click',frontView);
$('zoomIn').addEventListener('click',()=>zoomAt(1.22));$('zoomOut').addEventListener('click',()=>zoomAt(1/1.22));
$('followBtn').addEventListener('click',()=>{camera.follow=!camera.follow;camera.target=null;if(camera.follow)camera.zoom=Math.max(camera.zoom,Math.min(1.05,camera.fit*3));cameraUI();dirty=true;});
document.addEventListener('keydown',e=>{
 if($('help').open||e.target.matches('input,textarea,select'))return;
 if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.18)}else if(e.key==='-'||e.key==='_'){e.preventDefault();zoomAt(1/1.18)}else if(e.key==='Home'){e.preventDefault();frontView()}
 else if(e.key==='['){e.preventDefault();rotateView(-15)}else if(e.key===']'){e.preventDefault();rotateView(15)}
 else if(e.key==='Delete'&&selected&&canEdit()){const before=clone(scene);if(place(selected,'erase'))commit(before,'已移除选中的物件。');}
});
