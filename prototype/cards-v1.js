// Intent cards. This file is inserted into the existing game closure.
let cardReady=false,cardCategory='sky',cardActive=null,cardCandidate=null,cardPinned=false,cardCloseTimer=null,cardPreviewBase=null;
let cardPointer=null,cardDragging=false,cardResumeState=null,cardSuppressedClick=null,cardRenderClock=0;
const cardBirths=new Map();
const cardReducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const cardDefaultState=()=>({light:'day',weather:'clear',pace:'normal'});
const cardIllustrations={
 day:'<circle cx="70" cy="34" r="15" fill="#d5b86e"/><path d="M11 90 43 54 70 79 94 62 128 96Z" fill="#8c9d7b"/><path d="M6 100 46 78 75 93 110 81 137 108" fill="#b7bda0"/>',
 dusk:'<circle cx="70" cy="66" r="22" fill="#d6a179"/><path d="M4 92 38 67 68 87 99 69 137 99Z" fill="#7f8a79"/><path d="M5 105 48 88 91 102 139 87" fill="#b4ab90"/><path d="M14 116h113" stroke="#c49572" stroke-width="2"/>',
 fog:'<path d="M12 88 41 47 70 82 99 49 130 91Z" fill="#a1ada1"/><path d="M4 76h88m-62 14h109M8 103h112" stroke="#e2e3d7" stroke-width="10" stroke-linecap="round"/>',
 rain:'<path d="M35 52a17 17 0 1 1 20-22 21 21 0 0 1 35 8 15 15 0 1 1 10 28H35a9 9 0 0 1 0-14" fill="#a3b4ae"/><path d="m37 79-6 14m29-12-6 14m29-15-6 14m29-15-6 14" stroke="#829b9a" stroke-width="3" stroke-linecap="round"/><path d="M11 115q31-24 60-8t58-4" fill="none" stroke="#a8b6a1" stroke-width="6"/>',
 trees:'<path d="M44 83v24m38-33v33m29-16v18" stroke="#857e5d" stroke-width="4"/><path d="m22 84 22-48 21 48Z" fill="#8c9e75"/><path d="m55 79 27-62 26 62Z" fill="#6e876b"/><path d="m92 91 19-43 20 43Z" fill="#a4b18a"/><ellipse cx="76" cy="113" rx="53" ry="7" fill="#c1c5a9"/>',
 fence:'<path d="m20 85 47-24 55 23-49 26Z" fill="#c1c8ad"/><g stroke="#9b8968" stroke-width="3" fill="none"><path d="m20 72 47-24 55 23M20 81l47-24 55 23M20 67v26m24-38v26m23-39v27m27-16v27m28-14v28M20 78l53 24 49-25M20 88l53 24 49-25M46 86v25m27-15v26m25-32v25"/></g>',
 gate:'<path d="M28 109V40m80 69V40" stroke="#8d7c5b" stroke-width="7"/><path d="m33 47 32 9v47l-32-7Z" fill="#b9a47b"/><path d="m33 51 28 47m0-40L34 91" stroke="#8b7858" stroke-width="2"/><path d="M83 67h31m-9-8 9 8-9 8" stroke="#7b9278" fill="none" stroke-width="3"/><path d="M22 112h103" stroke="#b9bca2" stroke-width="3"/>',
 bridge:'<path d="M10 78q26-13 52 0t66 0M10 103q26-13 52 0t66 0" stroke="#a6bdba" stroke-width="6" fill="none"/><path d="M26 80q44-43 88 0v15q-44-30-88 0Z" fill="#c4b18a"/><path d="M26 68q44-42 88 0M26 83q44-36 88 0M26 63v34m22-48v35m22-42v34m22-27v35m22-21v34" fill="none" stroke="#93805b" stroke-width="3"/>',
 slow:'<path d="M18 107q26-46 49-23t54-36" fill="none" stroke="#b8bda3" stroke-width="11" stroke-linecap="round"/><path d="M18 107q26-46 49-23t54-36" fill="none" stroke="#e5dfc8" stroke-width="3" stroke-dasharray="4 6"/><ellipse cx="66" cy="56" rx="7" ry="12" transform="rotate(-25 66 56)" fill="#829578"/><ellipse cx="87" cy="34" rx="7" ry="12" transform="rotate(-25 87 34)" fill="#829578"/>',
 normal:'<path d="M13 109 118 38" stroke="#bcc5aa" stroke-width="13" stroke-linecap="round"/><path d="M17 107 117 39" stroke="#eee5cd" stroke-width="3" stroke-dasharray="5 6"/><path d="m80 26 37 13-3 35" fill="none" stroke="#859879" stroke-width="4" stroke-linecap="round"/>',
 waypoint:'<path d="M15 106q34-50 58-20t51-36" fill="none" stroke="#b5bea4" stroke-width="8" stroke-linecap="round"/><path d="M67 82V31m0 0 34 10-34 10" fill="#b5b8d1" stroke="#86869d" stroke-width="2"/><ellipse cx="67" cy="89" rx="18" ry="6" fill="none" stroke="#9496b4" stroke-width="2" stroke-dasharray="4 4"/>',
 stop:'<ellipse cx="71" cy="110" rx="49" ry="7" fill="#c4c6ad"/><path d="M29 57h79v26H29Z" fill="#c1ad88"/><path d="M24 89h89M36 89v20m65-20v20M44 63h49M44 72h49" stroke="#8a7e60" stroke-width="4"/><path d="M74 18v22m-12-11h24" stroke="#a9b49a" stroke-width="3" stroke-linecap="round"/>'
};
const intentCards=[
 {id:'day',category:'sky',name:'白昼',caption:'让光线清亮一些',scope:'整个沙盘',kind:'global',channel:'light',value:'day'},
 {id:'dusk',category:'sky',name:'黄昏',caption:'给这里一层暮色',scope:'整个沙盘',kind:'global',channel:'light',value:'dusk'},
 {id:'fog',category:'sky',name:'薄雾',caption:'让远处隐入雾中',scope:'整个沙盘',kind:'global',channel:'weather',value:'fog'},
 {id:'rain',category:'sky',name:'细雨',caption:'让雨轻轻落下来',scope:'整个沙盘',kind:'global',channel:'weather',value:'rain'},
 {id:'trees',category:'space',name:'添一片树',caption:'在空地添几棵树',scope:'一处陆地',kind:'local'},
 {id:'fence',category:'space',name:'围一处',caption:'在附近围出小空间',scope:'一处陆地',kind:'local'},
 {id:'gate',category:'space',name:'留个入口',caption:'在围栏上打开一道门',scope:'围栏或小门',kind:'local'},
 {id:'bridge',category:'space',name:'架一座桥',caption:'把水的两岸连起来',scope:'两岸之间的水面',kind:'local'},
 {id:'slow',category:'journey',name:'慢慢走',caption:'让旅人的步子放慢',scope:'行走节奏',kind:'global',channel:'pace',value:'slow'},
 {id:'normal',category:'journey',name:'照常走',caption:'回到平常的步调',scope:'行走节奏',kind:'global',channel:'pace',value:'normal'},
 {id:'waypoint',category:'journey',name:'经过这里',caption:'让这一段路经过此处',scope:'设置途经点',kind:'local'},
 {id:'stop',category:'journey',name:'在此停留',caption:'把这里设为本段终点',scope:'设置终点',kind:'local'}
];
function cardState(s=scene){return {...cardDefaultState(),...(s.cardState||{})};}
function cardOpen(open){
 if(!cardReady)return;clearTimeout(cardCloseTimer);
 const expanded=!!(open||cardActive||cardPinned);$('cardDock').classList.toggle('is-open',expanded);
 $('cardToggle').setAttribute('aria-expanded',String(expanded));
 $('cardToggle').textContent=cardPinned?'收起手牌':expanded?'保持展开':'展开手牌';
}
function cardHint(text){if(cardReady&&$('cardHint').textContent!==text)$('cardHint').textContent=text;}
function cardRenderHand(){
 const cards=intentCards.filter(c=>c.category===cardCategory),n=cards.length;
 $('cardHand').replaceChildren();
 cards.forEach((c,i)=>{
  const b=document.createElement('button');b.type='button';b.className='intent-card';b.dataset.cardId=c.id;
  const offset=i-(n-1)/2;
  b.style.setProperty('--card-x',(offset*108)+'px');b.style.setProperty('--card-angle',(offset*8)+'deg');b.style.setProperty('--card-y',(Math.abs(offset)*9)+'px');
  b.setAttribute('aria-label',c.name+'：'+c.caption+'。'+c.scope);b.setAttribute('aria-pressed',String(cardActive?.id===c.id));
  b.innerHTML='<span class="card-number">'+String(intentCards.indexOf(c)+1).padStart(2,'0')+'</span><span class="card-art"><svg viewBox="0 0 140 130" aria-hidden="true">'+cardIllustrations[c.id]+'</svg></span><span class="card-name">'+c.name+'</span><span class="card-caption">'+c.caption+'</span><span class="card-scope">'+c.scope+'</span>';
  b.addEventListener('pointerenter',()=>{b.classList.add('is-lifted');cardOpen(true);});
  b.addEventListener('pointerleave',()=>b.classList.remove('is-lifted'));
  b.addEventListener('focus',()=>{b.classList.add('is-lifted');cardOpen(true);});
  b.addEventListener('blur',()=>b.classList.remove('is-lifted'));
  b.addEventListener('pointerdown',e=>cardPointerDown(c,b,e));
  b.addEventListener('lostpointercapture',()=>{if(cardPointer?.source===b)cardFinishPointer(null,false);});
  b.addEventListener('dragstart',e=>e.preventDefault());
  b.addEventListener('click',e=>{if(cardSuppressedClick?.id===c.id&&performance.now()<cardSuppressedClick.until){e.preventDefault();return;}cardSelect(c);});$('cardHand').appendChild(b);
 });
 for(const b of $('cardTabs').querySelectorAll('[data-card-category]')){
  const on=b.dataset.cardCategory===cardCategory;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
 }
 cardRefresh();
}
function cardRefresh(){
 if(!cardReady)return;
 const state=cardState(),preview=cardActive?.kind==='global'&&(!cardDragging||cardPointer?.overBoard),display=preview?{...state,[cardActive.channel]:cardActive.value}:state;
 const board=document.querySelector('.board-card');board.dataset.cardLight=display.light;board.dataset.cardWeather=display.weather;
 speed=state.pace==='slow'?1.2:3;
 if($('speed'))$('speed').value=String(Math.round(speed));
 if($('speedLabel'))$('speedLabel').textContent=state.pace==='slow'?'慢慢走':'照常走';
 for(const b of $('cardHand').children){const on=b.dataset.cardId===cardActive?.id;b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));}
 $('cardDock').classList.toggle('has-selection',!!cardActive);
 $('cardSelection').hidden=!cardActive||cardDragging;
 if(cardActive){
  $('cardSelectionName').textContent=cardActive.name+' · 预览';
  $('cardSelectionHelp').textContent=cardActive.kind==='global'?(cardActive.channel==='pace'?'确认后会改变行走速度。':'确认前只预览天色，取消即可恢复。'):cardCandidate?.message||cardLocalInstruction(cardActive.id);
  $('cardApply').disabled=cardActive.kind==='local'&&!cardCandidate?.valid;
  $('cardApply').textContent=cardActive.kind==='global'?'就这样':'放在这里';
 }
 const signature=JSON.stringify(state);
 if($('cardEffects').dataset.signature!==signature){
  $('cardEffects').dataset.signature=signature;$('cardEffects').replaceChildren();
  const effects=[];if(state.light==='dusk')effects.push(['light','黄昏']);if(state.weather!=='clear')effects.push(['weather',state.weather==='fog'?'薄雾':'细雨']);if(state.pace==='slow')effects.push(['pace','慢慢走']);
  effects.forEach(([channel,label])=>{const b=document.createElement('button');b.type='button';b.className='effect-chip';b.dataset.effect=channel;b.textContent=label+' ×';b.setAttribute('aria-label','移除'+label);b.addEventListener('click',()=>cardRemoveEffect(channel));$('cardEffects').appendChild(b);});
 }
 dirty=true;
}
function cardLocalInstruction(id){return {trees:'点击一处空地，先看看几棵树放在哪里。',fence:'点击一处陆地，预览周围一圈围栏；会避开现有物件与标记。',gate:'点击已有围栏或关闭的小门，预览一个打开的入口。',bridge:'点击两岸之间的水面，预览横向或纵向的短桥。',waypoint:'点击可通行的位置，预览新的途经点。',stop:'点击空地、长椅或角色，把这里设为这一段路的终点。'}[id]||'';}
function cardRememberJourney(){
 if(mode!=='walking')return;
 cardResumeState={actor:clone(actor),route:clone(route),runIndex,travel,phase,seatT,seatFrom:seatFrom?clone(seatFrom):null,completedWaypoints,search:search?clone(search):null};pause();
}
function cardRestoreJourney(){
 const remembered=cardResumeState;cardResumeState=null;if(!remembered)return;
 ({actor,route,runIndex,travel,phase,seatT,seatFrom,completedWaypoints,search}=remembered);mode='walking';dirty=true;updateUI();
}
function cardSelect(c){
 if(cardResumeState)cardRestoreJourney();
 if(c.kind==='local')cardRememberJourney();
 if(storyState.active)storyClose(false);
 cardActive=c;cardCandidate=null;cardPreviewBase=JSON.stringify(scene);setTool('select');cardOpen(true);cardRefresh();
 cardHint(cardDragging?'拖到地图上看看；松手使用，拖回下方取消。':c.kind==='global'?'确认可以保留；下次也可以直接把卡拖到地图。':cardLocalInstruction(c.id));
}
function cardCancel(announce=true,resume=true){
 const unchanged=cardPreviewBase===JSON.stringify(scene);
 cardActive=null;cardCandidate=null;cardPreviewBase=null;cardRefresh();
 if(resume&&unchanged)cardRestoreJourney();else cardResumeState=null;
 if(announce)cardHint('把一个想法，轻轻放进这里。');cardOpen(cardPinned);dirty=true;
}
function cardRemoveEffect(channel){
 cardCancel(false);cardClearEffects();
 const before=clone(scene);scene.cardState={...cardState(),[channel]:cardDefaultState()[channel]};
 if(commit(before,'已移除这处变化。',true))cardHint('已恢复，可以继续试试别的安排。');
 cardRefresh();
}
function cardMakeCandidate(c,p){
 const invalid=message=>({valid:false,message,changes:[],point:p});
 if(!p||!inside(p.x,p.y))return invalid('这里超出了可摆放范围，换一处试试。');
 const next=clone(scene),changes=[],i=key(p);
 const free=q=>inside(q.x,q.y)&&next.terrain[key(q)]===0&&!next.objects[key(q)]&&!protectedCell(q);
 const add=(q,o)=>{next.objects[key(q)]=o;changes.push({p:{...q},object:o});};
 if(c.id==='trees'){
  if(scene.terrain[i]!==0)return invalid('树需要一处陆地，先换到岛上的空地。');
  for(const [dx,dy]of [[0,0],[-1,0],[1,1],[0,-1]]){const q={x:p.x+dx,y:p.y+dy};if(free(q))add(q,{type:'tree'});}
  if(!changes.length)return invalid('这里没有可摆放树木的空地，换一处试试。');
 }else if(c.id==='fence'){
  if(scene.terrain[i]!==0)return invalid('围栏需要一处陆地。');
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(Math.abs(dx)===1||Math.abs(dy)===1){const q={x:p.x+dx,y:p.y+dy};if(free(q))add(q,{type:'fence'});}
  if(!changes.length)return invalid('周围没有可放围栏的空格，换一处试试。');
 }else if(c.id==='gate'){
  const o=scene.objects[i];if(!o||!['fence','gate'].includes(o.type))return invalid('请点已有的围栏或关闭的小门。');
  if(o.type==='gate'&&o.open)return invalid('这道门已经打开了，可以选择另一处围栏。');
  if(protectedCell(p))return invalid('这里有路线标记，请先移动标记。');add(p,{type:'gate',open:true});
 }else if(c.id==='bridge'){
  if(scene.terrain[i]!==1)return invalid('请点击两岸之间的水面。');
  const spans=[];
  for(const [dx,dy,dir]of [[1,0,'h'],[0,1,'v']]){
   const cells=[{...p}];let valid=true;
   for(const sign of [-1,1]){
    let q={x:p.x+dx*sign,y:p.y+dy*sign},guard=0;
    while(inside(q.x,q.y)&&scene.terrain[key(q)]===1&&guard++<Math.max(COLS,ROWS)){
     cells.push({...q});q={x:q.x+dx*sign,y:q.y+dy*sign};
    }
    if(!inside(q.x,q.y)||!canEnter(scene,q))valid=false;
   }
   if(cells.some(q=>{const o=scene.objects[key(q)];return o&&(o.type!=='bridge'||o.dir!==dir)||protectedCell(q)&&!(o?.type==='bridge'&&o.dir===dir);}))valid=false;
   if(valid)spans.push({cells,dir});
  }
  spans.sort((a,b)=>a.cells.length-b.cells.length);const best=spans[0];
  if(!best)return invalid('这里暂时找不到两端可通行的岸边；换一段较窄的水面。');
  for(const q of best.cells)if(scene.objects[key(q)]?.type!=='bridge')add(q,{type:'bridge',dir:best.dir});
  if(!changes.length)return invalid('这里已经有一座桥了。');
 }else if(c.id==='waypoint'||c.id==='stop'){
  const kind=c.id==='waypoint'?'waypoint':'goal';
  if(!canEnter(scene,p)&&!(kind==='goal'&&isMeetingGoal(scene,p)))return invalid(kind==='goal'?'请选择空地、长椅或角色。':'途经点需要放在可通行的陆地或桥上。');
  const occupied=markerKindAt(p);if(occupied&&occupied!==kind)return invalid('这里已经有另一个路线标记，请换一格。');
  if(kind==='waypoint'){if(same(scene.waypoints[0],p))return invalid('途经点已经在这里了。');next.waypoints=[{...p}];}
  else{if(same(scene.goal,p))return invalid('终点已经在这里了。');next.goal={...p};}
  changes.push({p:{...p},marker:kind});
 }
 const text=c.id==='trees'?'将添上 '+changes.length+' 棵树。':c.id==='fence'?'将放下 '+changes.length+' 段围栏，现有物件与标记会保留。':c.id==='bridge'?'将连接 '+changes.length+' 格水面。':c.id==='gate'?'这里会成为一道打开的入口。':c.id==='waypoint'?'这一段路将先经过这里。':'这里将成为本段终点。';
 return {valid:true,next,changes,point:{...p},message:text+' 确认后才会保留。'};
}
function cardApply(drop=null){
 if(!cardActive)return false;
 if(cardPreviewBase!==JSON.stringify(scene)){cardCancel(false,false);cardHint('沙盘刚刚有了变化，请重新选择卡牌。');return false;}
 const c=cardActive,before=clone(scene),candidate=cardCandidate;
 if(c.kind==='global'&&cardState()[c.channel]===c.value){cardCancel(false);cardHint('这里已经是这样的状态了，可以再试一张。');return false;}
 if(c.kind==='global')scene.cardState={...cardState(),[c.channel]:c.value};
 else{if(!cardCandidate?.valid)return false;scene=cardCandidate.next;}
 cardActive=null;cardCandidate=null;cardPreviewBase=null;
 cardResumeState=null;
 const changed=commit(before,'已使用「'+c.name+'」。可以撤销，也可以再换一种安排。',c.kind==='global');
 if(changed)cardLaunchEffect(c,candidate,drop);
 if(!changed)cardHint('这里已经是这样的状态了。');else cardHint('「'+c.name+'」已留下。还可以继续改变，或撤销这一步。');
 cardRefresh();cardOpen(cardPinned);
 return changed;
}
function cardDrawPreview(){
 if(!cardReady||!cardActive||!cardCandidate?.valid)return;
 ctx.save();ctx.translate(camera.x,camera.y);ctx.scale(camera.zoom,camera.zoom);
 for(const item of cardCandidate.changes){
  polygon(diamond(item.p.x,item.p.y,LAND+2),'#e9e7ae44','#f4e5a6',1.5/camera.zoom);
  if(item.object)drawObject(item.object,item.p,.6);
  if(item.marker)marker(item.p,item.marker==='goal'?'终':'经',item.marker==='goal'?'#e5c47e':'#acbbff');
 }
 ctx.restore();
}
// Pointer gestures preview without writing to the scene. A valid release is one commit.
function cardPointerDown(c,source,e){
 if(e.button!==0||e.isPrimary===false||e.altKey||cardPointer)return;
 cardPointer={id:e.pointerId,card:c,source,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,dragging:false,overBoard:false,valid:false,ghost:null,target:null};
 source.setPointerCapture(e.pointerId);
}
function cardStartPointer(g){
 g.dragging=true;cardDragging=true;cardSelect(g.card);
 const ghost=document.createElement('div');ghost.className='intent-card card-drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.innerHTML=g.source.innerHTML+'<span class="card-drag-status">拖向地图</span>';
 document.body.appendChild(ghost);g.ghost=ghost;g.source.classList.add('is-drag-source');
 document.body.classList.add('card-is-dragging');$('cardDock').classList.add('is-dragging');cardRefresh();
}
function cardDropTarget(c,e){
 const r=canvas.getBoundingClientRect(),margin=22;
 const near=e.clientX>=r.left-margin&&e.clientX<=r.right+margin&&e.clientY>=r.top-margin&&e.clientY<=r.bottom+margin;
 const hit=document.elementFromPoint?.(e.clientX,e.clientY);
 const control=hit?.closest?.('button,summary,input,select,textarea,dialog,.camera-panel,.card-selection,.card-dock');
 if(!near||control)return {overBoard:false,valid:false,message:'拖回下方或在地图外松手，就会放回手牌。'};
 if(c.kind==='global')return {overBoard:true,valid:true,message:c.channel==='pace'?'松手，改变旅人的步调。':'松手，让「'+c.name+'」落进这片天地。'};
 const within=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 const p=within?cellAt(boardPoint(e),c.id==='gate'||c.id==='stop'):null,candidate=cardMakeCandidate(c,p);
 return {overBoard:true,valid:candidate.valid,candidate,message:candidate.valid?candidate.message.replace('确认后才会保留。','松手即可放下。'):candidate.message};
}
function cardMovePointer(e){
 const g=cardPointer;if(!g||e.pointerId!==g.id)return;
 if(!g.dragging&&Math.hypot(e.clientX-g.startX,e.clientY-g.startY)<8)return;
 e.preventDefault();e.stopImmediatePropagation();if(!g.dragging)cardStartPointer(g);
 cardUpdatePointer(e);
}
function cardUpdatePointer(e){
 const g=cardPointer;if(!g?.dragging)return;
 const target=cardDropTarget(g.card,e);g.target=target;g.overBoard=target.overBoard;g.valid=target.valid;g.x=e.clientX;g.y=e.clientY;
 cardCandidate=target.candidate||null;
 const tilt=clamp((e.clientX-g.startX)*.035,-9,9);
 g.ghost.style.transform='translate('+(e.clientX-54)+'px,'+(e.clientY-72)+'px) rotate('+tilt+'deg) scale(.82)';
 g.ghost.classList.toggle('is-drop-valid',target.valid);g.ghost.classList.toggle('is-drop-invalid',target.overBoard&&!target.valid);
 g.ghost.querySelector('.card-drag-status').textContent=target.valid?'松手使用':target.overBoard?'换一处位置':'拖向地图';
 const board=document.querySelector('.board-card');board.classList.toggle('is-card-dropzone',target.overBoard);board.classList.toggle('is-card-drop-invalid',target.overBoard&&!target.valid);board.dataset.dropReady=String(target.valid);
 const guide=$('cardDropGuide');guide.hidden=!target.overBoard;guide.textContent=target.valid?'松手 · '+g.card.name:'这里暂时放不下';
 cardRefresh();cardHint(target.message);dirty=true;
}
function cardFinishPointer(e,allowDrop=true){
 const g=cardPointer;if(!g||e&&e.pointerId!==g.id)return false;
 if(!g.dragging){cardPointer=null;if(g.source.hasPointerCapture(g.id))g.source.releasePointerCapture(g.id);return false;}
 if(e){e.preventDefault();e.stopImmediatePropagation();if(allowDrop)cardUpdatePointer(e);}
 const valid=!!(allowDrop&&e&&g.valid),reason=g.target?.message;
 cardPointer=null;cardDragging=false;cardSuppressedClick={id:g.card.id,until:performance.now()+450};
 if(g.source.hasPointerCapture(g.id))g.source.releasePointerCapture(g.id);
 g.source.classList.remove('is-drag-source');document.body.classList.remove('card-is-dragging');$('cardDock').classList.remove('is-dragging');
 const board=document.querySelector('.board-card');board.classList.remove('is-card-dropzone','is-card-drop-invalid');board.dataset.dropReady='false';$('cardDropGuide').hidden=true;
 const applied=valid&&cardApply({fromDrag:true,clientX:e.clientX,clientY:e.clientY});
 if(!valid){cardCancel(false);cardHint(allowDrop&&g.overBoard?reason:'已放回手牌，沙盘保持原样。');}
 cardReturnGhost(g,applied);cardRefresh();cardOpen(cardPinned);return true;
}
function cardReturnGhost(g,applied){
 const ghost=g.ghost;if(!ghost)return;
 if(!cardReducedMotion()&&typeof ghost.animate==='function'){
  const origin=g.source.getBoundingClientRect(),destination=applied?'translate('+(g.x-54)+'px,'+(g.y-72)+'px) scale(.15) rotate(12deg)':'translate('+(origin.left+origin.width/2-71)+'px,'+(origin.top+origin.height/2-100)+'px) scale(.65) rotate(0deg)';
  ghost.animate([{transform:ghost.style.transform,opacity:1},{transform:destination,opacity:0}],{duration:applied?250:230,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).finished.then(()=>ghost.remove(),()=>ghost.remove());
 }else ghost.remove();
}
function cardLaunchEffect(c,candidate,drop){
 const board=document.querySelector('.board-card');board.dataset.lastCardAction=c.id;
 if(cardReducedMotion())return;
 const now=performance.now(),items=(candidate?.changes||[]).filter(item=>item.object);
 if(c.id==='bridge')items.sort((a,b)=>a.p.y-b.p.y||a.p.x-b.p.x);
 const stagger=Math.min(65,650/Math.max(1,items.length));
 items.forEach((item,i)=>cardBirths.set(key(item.p),{object:scene.objects[key(item.p)],start:now+i*stagger,duration:c.id==='gate'?700:550}));
 const r=canvas.getBoundingClientRect();let at={x:r.width/2,y:r.height/2};
 if(drop?.fromDrag)at={x:clamp(drop.clientX-r.left,0,r.width),y:clamp(drop.clientY-r.top,0,r.height)};
 else if(candidate?.point){const p=point(candidate.point);at={x:p.x*camera.zoom+camera.x,y:p.y*camera.zoom+camera.y};}
 const layer=$('cardAtmosphere'),wave=document.createElement('div');wave.className='card-change-wave '+(c.kind==='global'?'is-world-change':'is-local-change');wave.dataset.card=c.id;wave.style.left=at.x+'px';wave.style.top=at.y+'px';wave.style.setProperty('--wave-scale',String(Math.max(r.width,r.height)/32+4));layer.appendChild(wave);
 for(let i=0;i<7;i++){const spark=document.createElement('i'),angle=i*Math.PI*2/7;spark.className='card-change-spark';spark.style.left=at.x+'px';spark.style.top=at.y+'px';spark.style.setProperty('--spark-x',Math.cos(angle)*(35+i%3*12)+'px');spark.style.setProperty('--spark-y',(Math.sin(angle)*36-24)+'px');layer.appendChild(spark);setTimeout(()=>spark.remove(),950);}
 setTimeout(()=>wave.remove(),1250);dirty=true;
}
function cardObjectBirth(o,p){
 const i=key(p),entry=cardBirths.get(i);if(!entry||entry.object!==o||cardReducedMotion())return 1;
 const progress=clamp((cardRenderClock-entry.start)/entry.duration,0,1);if(progress>=1)cardBirths.delete(i);
 return 1-Math.pow(1-progress,3);
}
function cardNeedsFrame(time){
 let active=false;for(const[i,entry]of cardBirths){if(entry.object!==scene.objects[i]||time>entry.start+entry.duration)cardBirths.delete(i);else active=true;}return active;
}
function cardClearEffects(){
 cardBirths.clear();if(!cardReady)return;
 for(const el of $('cardAtmosphere')?.querySelectorAll('.card-change-wave,.card-change-spark')||[])el.remove();
 dirty=true;
}
function initCardPrototype(){
 cardReady=true;
 const wrap=canvas.closest('.canvas-wrap');
 if(!$('cardAtmosphere')){const atmosphere=document.createElement('div');atmosphere.id='cardAtmosphere';atmosphere.className='card-atmosphere';atmosphere.setAttribute('aria-hidden','true');atmosphere.innerHTML='<div class="card-fog"></div><div class="card-rain"></div>';wrap.appendChild(atmosphere);}
 if(!$('cardDropGuide')){const guide=document.createElement('div');guide.id='cardDropGuide';guide.className='card-drop-guide';guide.hidden=true;guide.setAttribute('aria-hidden','true');document.querySelector('.board-card').appendChild(guide);}
 const dock=$('cardDock');
 dock.addEventListener('pointerenter',()=>cardOpen(true));
 dock.addEventListener('pointerleave',()=>{clearTimeout(cardCloseTimer);cardCloseTimer=setTimeout(()=>{if(!dock.querySelector(':focus-visible'))cardOpen(false);},450);});
 dock.addEventListener('focusin',()=>cardOpen(true));
 dock.addEventListener('focusout',()=>{clearTimeout(cardCloseTimer);cardCloseTimer=setTimeout(()=>{if(!dock.contains(document.activeElement))cardOpen(false);},450);});
 $('cardToggle').addEventListener('click',()=>{if(cardActive)cardCancel(false);cardPinned=!cardPinned;cardOpen(cardPinned);});
 for(const b of $('cardTabs').querySelectorAll('[data-card-category]'))b.addEventListener('click',()=>{cardCancel(false);cardCategory=b.dataset.cardCategory;cardRenderHand();cardOpen(true);});
 $('cardApply').addEventListener('click',()=>cardApply());$('cardCancel').addEventListener('click',()=>cardCancel());
 document.addEventListener('pointermove',cardMovePointer,{capture:true,passive:false});
 document.addEventListener('pointerup',e=>cardFinishPointer(e,true),true);
 document.addEventListener('pointercancel',e=>cardFinishPointer(e,false),true);
 window.addEventListener('blur',()=>cardFinishPointer(null,false));
 const panels=[['libraryToggle','library-open'],['routePanelToggle','route-open']];
 for(const[id,cls]of panels)$(id)?.addEventListener('click',()=>{cardCancel(false);const on=document.body.classList.toggle(cls);$(id).setAttribute('aria-expanded',String(on));dirty=true;});
 let blockedPointer=null;
 canvas.addEventListener('pointerdown',e=>{
  if(!cardActive||cardActive.kind!=='local'||e.button!==0||e.altKey)return;
  e.preventDefault();e.stopImmediatePropagation();blockedPointer=e.pointerId;canvas.focus({preventScroll:true});
  const p=cellAt(boardPoint(e),cardActive.id==='gate'||cardActive.id==='stop');cardCandidate=cardMakeCandidate(cardActive,p);cardRefresh();cardHint(cardCandidate.message);
 },true);
 canvas.addEventListener('pointerup',e=>{if(e.pointerId===blockedPointer){e.preventDefault();e.stopImmediatePropagation();blockedPointer=null;}},true);
 canvas.addEventListener('pointercancel',e=>{if(e.pointerId===blockedPointer){e.stopImmediatePropagation();blockedPointer=null;}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cardPointer){e.preventDefault();e.stopImmediatePropagation();cardFinishPointer(null,false);}else if(e.key==='Escape'&&cardActive){e.preventDefault();e.stopImmediatePropagation();cardCancel();}else if(cardActive&&['1','2','3','4','5','6','7','8','9','e','f','r',' '].includes(e.key.toLowerCase())&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.stopImmediatePropagation();}},true);
 // Existing controls invalidate any preview before mutating the scene.
 for(const id of ['undoBtn','redoBtn','demoBtn','blankBtn','playBtn','pauseBtn','homeBtn'])$(id)?.addEventListener('click',()=>cardCancel(false,false),true);
 document.querySelector('.tools')?.addEventListener('click',()=>{if(cardActive)cardCancel(false);},true);
 cardRenderHand();cardHint('拿起一张卡，拖向地图，让变化发生。');cardOpen(false);cardRefresh();
 globalThis.CardPrototype={getState:()=>({category:cardCategory,selected:cardActive?.id||null,effects:clone(cardState()),candidate:cardCandidate?{valid:cardCandidate.valid,point:cardCandidate.point,count:cardCandidate.changes.length,message:cardCandidate.message}:null})};
}
