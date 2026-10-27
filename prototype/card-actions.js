// Cards may change existing arrangements; creation remains in the object library.
function cardTargetCell(c,screen){
 if(c.category==='company'){
  const w=screenToWorld(screen);
  for(let i=objectHits.length-1;i>=0;i--){const hit=objectHits[i];if(NPC_TYPES.includes(scene.objects[key(hit.cell)]?.type)&&w.x>=hit.x1&&w.x<=hit.x2&&w.y>=hit.y1&&w.y<=hit.y2)return {...hit.cell};}
  return cellAt(screen,false);
 }
 return cellAt(screen,c.id==='stop');
}
function cardNpcOptions(next,from,reference,toward){
 const free=p=>inside(p.x,p.y)&&next.terrain[key(p)]===0&&!next.objects[key(p)]&&!protectedCell(p);
 const distance=p=>Math.abs(p.x-reference.x)+Math.abs(p.y-reference.y),original=distance(from),queue=[{p:from,steps:0}],seen=new Set([key(from)]),choices=[];
 for(let head=0;head<queue.length;head++){
  const entry=queue[head];if(entry.steps>=2)continue;
  for(const p of neighbors(entry.p)){if(seen.has(key(p))||!free(p))continue;seen.add(key(p));const steps=entry.steps+1;queue.push({p,steps});const d=distance(p);if(toward?d<original:d>original)choices.push({p,steps,d});}
 }
 choices.sort((a,b)=>(toward?a.d-b.d:b.d-a.d)||a.steps-b.steps||key(a.p)-key(b.p));return choices;
}
function cardRelocateCandidate(c,p){
 const invalid=message=>({valid:false,message,changes:[],point:p});
 if(!p||!inside(p.x,p.y)||!NPC_TYPES.includes(scene.objects[key(p)]?.type))return invalid('请把卡放到已有的动物或人物上。');
 const next=clone(scene),changes=[],members=[];
 for(let i=0;i<scene.objects.length;i++)if(NPC_TYPES.includes(scene.objects[i]?.type)){const at={x:i%COLS,y:Math.floor(i/COLS)},distance=Math.abs(at.x-p.x)+Math.abs(at.y-p.y);if(distance<=5)members.push({p:at,distance});}
 members.sort((a,b)=>a.distance-b.distance||key(a.p)-key(b.p));
 let moving,reference,toward;
 if(c.id==='near'||c.id==='far'){moving=[{p}];reference=scene.start&&(actor.cell||scene.start);if(!reference)return invalid('先安排一个旅人的起点，再尝试改变距离。');toward=c.id==='near';}
 else if(c.id==='gather'){moving=members.filter(m=>!same(m.p,p)).slice(0,4);reference=p;toward=true;}
 else{moving=members.slice(0,4);if(moving.length<2)return invalid('附近还没有其他角色，可以先在物件库安排一次相遇。');reference={x:moving.reduce((n,m)=>n+m.p.x,0)/moving.length,y:moving.reduce((n,m)=>n+m.p.y,0)/moving.length};toward=false;}
 if(!moving.length)return invalid('附近还没有其他角色；这张卡不会新增角色。');
 for(const member of moving){
  const from=member.p,option=cardNpcOptions(next,from,reference,toward)[0];if(!option)continue;
  const o=next.objects[key(from)];next.objects[key(from)]=null;next.objects[key(option.p)]=o;
  changes.push({p:{...option.p},from:{...from},object:o});
  if(same(next.goal,from)){next.goal={...option.p};changes.push({p:{...option.p},marker:'goal'});}
 }
 const count=changes.filter(item=>item.object).length;
 if(!count)return invalid(toward?'已经很近了，或周围暂时没有可走近的空位。':'周围没有能留出更多距离的空位。');
 return {valid:true,next,changes,point:{...p},message:'将移动 '+count+' 个已有角色，不新增物件。确认后才会保留。'};
}
function cardReverseCandidate(){
 const invalid=message=>({valid:false,message,changes:[],point:scene.goal});
 if(!scene.start||!scene.goal)return invalid('先设置起点和终点，再换个方向。');
 const next=clone(scene),available=p=>canEnter(scene,p)&&!same(p,scene.start)&&!scene.waypoints.some(q=>same(p,q));
 const start=available(scene.goal)?scene.goal:neighbors(scene.goal).filter(available)[0];
 if(!start)return invalid('原终点附近没有可出发的位置，可以先调整角色或障碍。');
 next.start={...start};next.goal={...scene.start};
 return {valid:true,next,changes:[{p:{...start},marker:'start'},{p:{...next.goal},marker:'goal'}],point:{...start},message:'起终点将交换方向，已有途经点保留。确认后才会保留。'};
}
