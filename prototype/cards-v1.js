// Intent cards. This file is inserted into the existing game closure.
let cardReady=false,cardCategory='sky',cardActive=null,cardCandidate=null,cardPinned=false,cardCloseTimer=null,cardPreviewBase=null;
let cardPointer=null,cardDragging=false,cardResumeState=null,cardSuppressedClick=null,cardRenderClock=0;
const cardPages={sky:0,company:0,journey:0},CARD_PAGE_SIZE=4;
const cardBirths=new Map();
const cardReducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const cardDefaultState=()=>({light:'day',weather:'clear',wind:'still',season:'green',pace:'normal',narration:'scenery'});
const cardIllustrations={
 day:'<circle cx="70" cy="34" r="15" fill="#d5b86e"/><path d="M11 90 43 54 70 79 94 62 128 96Z" fill="#8c9d7b"/><path d="M6 100 46 78 75 93 110 81 137 108" fill="#b7bda0"/>',
 dusk:'<circle cx="70" cy="66" r="22" fill="#d6a179"/><path d="M4 92 38 67 68 87 99 69 137 99Z" fill="#7f8a79"/><path d="M5 105 48 88 91 102 139 87" fill="#b4ab90"/><path d="M14 116h113" stroke="#c49572" stroke-width="2"/>',
 fog:'<path d="M12 88 41 47 70 82 99 49 130 91Z" fill="#a1ada1"/><path d="M4 76h88m-62 14h109M8 103h112" stroke="#e2e3d7" stroke-width="10" stroke-linecap="round"/>',
 rain:'<path d="M35 52a17 17 0 1 1 20-22 21 21 0 0 1 35 8 15 15 0 1 1 10 28H35a9 9 0 0 1 0-14" fill="#a3b4ae"/><path d="m37 79-6 14m29-12-6 14m29-15-6 14m29-15-6 14" stroke="#829b9a" stroke-width="3" stroke-linecap="round"/><path d="M11 115q31-24 60-8t58-4" fill="none" stroke="#a8b6a1" stroke-width="6"/>',
 slow:'<path d="M18 107q26-46 49-23t54-36" fill="none" stroke="#b8bda3" stroke-width="11" stroke-linecap="round"/><path d="M18 107q26-46 49-23t54-36" fill="none" stroke="#e5dfc8" stroke-width="3" stroke-dasharray="4 6"/><ellipse cx="66" cy="56" rx="7" ry="12" transform="rotate(-25 66 56)" fill="#829578"/><ellipse cx="87" cy="34" rx="7" ry="12" transform="rotate(-25 87 34)" fill="#829578"/>',
 normal:'<path d="M13 109 118 38" stroke="#bcc5aa" stroke-width="13" stroke-linecap="round"/><path d="M17 107 117 39" stroke="#eee5cd" stroke-width="3" stroke-dasharray="5 6"/><path d="m80 26 37 13-3 35" fill="none" stroke="#859879" stroke-width="4" stroke-linecap="round"/>',
 waypoint:'<path d="M15 106q34-50 58-20t51-36" fill="none" stroke="#b5bea4" stroke-width="8" stroke-linecap="round"/><path d="M67 82V31m0 0 34 10-34 10" fill="#b5b8d1" stroke="#86869d" stroke-width="2"/><ellipse cx="67" cy="89" rx="18" ry="6" fill="none" stroke="#9496b4" stroke-width="2" stroke-dasharray="4 4"/>',
 stop:'<ellipse cx="71" cy="110" rx="49" ry="7" fill="#c4c6ad"/><path d="M29 57h79v26H29Z" fill="#c1ad88"/><path d="M24 89h89M36 89v20m65-20v20M44 63h49M44 72h49" stroke="#8a7e60" stroke-width="4"/><path d="M74 18v22m-12-11h24" stroke="#a9b49a" stroke-width="3" stroke-linecap="round"/>'
};
Object.assign(cardIllustrations,{
 dawn:cardIllustrations.day.replace('#d5b86e','#e7bc93'),
 night:'<path d="M87 18a29 29 0 1 0 26 42 28 28 0 0 1-26-42" fill="#c5c5a0"/><path d="m28 30 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm23 25 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#c1cdbb"/><path d="M6 109 38 78 72 100 105 79 137 111" fill="#83948d"/>',
 snow:'<path d="M34 50a18 18 0 0 1 32-15 21 21 0 0 1 34 13 13 13 0 0 1 0 25H34a12 12 0 0 1 0-23" fill="#b0c4bf"/><g stroke="#86a5a4" stroke-width="2"><path d="M44 84v24m-10-18 20 12m0-12-20 12M87 87v24m-10-18 20 12m0-12-20 12"/></g>',
 breeze:'<g fill="none" stroke="#91aa9a" stroke-width="3" stroke-linecap="round"><path d="M14 47h73q22 0 18-17t-20-1M27 68h87q19 0 14 14t-17 1M13 88h59"/></g><path d="M40 101q20-13 37 0-18 22-37 0" fill="#a7ba8a"/>',
 autumn:'<path d="M70 116V29" stroke="#9b8869" stroke-width="3"/><path d="m70 97-37-18 11-10-16-21 25 4 17-28 17 28 25-4-16 21 11 10Z" fill="#cead7d"/><path d="m70 97-18-31m18 22 21-25" stroke="#b2946d" fill="none" stroke-width="2"/>',
 near:'<circle cx="31" cy="41" r="11" fill="#a7b99a"/><path d="M18 94V61h26v33" fill="#a7b99a"/><circle cx="109" cy="41" r="11" fill="#b7adc2"/><path d="M96 94V61h26v33" fill="#b7adc2"/><path d="M53 74h32m-8-8 8 8-8 8M61 66l-8 8 8 8" fill="none" stroke="#84977c" stroke-width="3"/>',
 far:'<circle cx="31" cy="41" r="11" fill="#a7b99a"/><path d="M18 94V61h26v33" fill="#a7b99a"/><circle cx="109" cy="41" r="11" fill="#b7adc2"/><path d="M96 94V61h26v33" fill="#b7adc2"/><path d="M52 74h35m-27-8-8 8 8 8m19-16 8 8-8 8" fill="none" stroke="#84977c" stroke-width="3"/>',
 gather:'<g fill="#a2b38e"><circle cx="31" cy="41" r="10"/><path d="M20 80V57h22v23"/><circle cx="108" cy="41" r="10"/><path d="M97 80V57h22v23"/></g><circle cx="70" cy="78" r="11" fill="#bca787"/><path d="M58 118V94h24v24" fill="#bca787"/><path d="m46 77 12 8m37-8-12 8" stroke="#8e9e84" stroke-width="3"/>',
 scatter:'<circle cx="70" cy="64" r="14" fill="#bca787"/><path d="M55 106V83h30v23" fill="#bca787"/><g fill="none" stroke="#94a88a" stroke-width="3"><path d="M45 64H17m8-8-8 8 8 8m70-8h28m-8-8 8 8-8 8M70 42V18m-8 8 8-8 8 8"/></g>',
 quiet:'<path d="M24 88h38l29 24V23L62 47H24Z" fill="#b5bea5"/><path d="M108 44v43" stroke="#9aaa8c" stroke-width="4" stroke-linecap="round"/><path d="M119 55v22" stroke="#9aaa8c" stroke-width="3" stroke-linecap="round"/>',
 chat:'<path d="M19 29h102v63H74l-27 24V92H19Z" fill="#b4c4ad"/><circle cx="45" cy="61" r="4" fill="#768d76"/><circle cx="70" cy="61" r="4" fill="#768d76"/><circle cx="95" cy="61" r="4" fill="#768d76"/>',
 brisk:cardIllustrations.normal,
 start:'<path d="M35 113V24m0 2 65 20-65 20" fill="#9cb490" stroke="#7f9977" stroke-width="3"/><ellipse cx="35" cy="116" rx="20" ry="6" fill="#c3cbb1"/>',
 reverse:'<g fill="none" stroke="#9aab8a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M27 45h84l-14-14m14 14-14 14M113 92H29l14-14M29 92l14 14"/></g><circle cx="25" cy="45" r="6" fill="#b7c6ab"/><circle cx="115" cy="92" r="6" fill="#c4b294"/>'
});
const intentCards=[
 {id:'dawn',category:'sky',name:'晨光',caption:'让天色慢慢亮起来',scope:'光线 · 可叠加天气',kind:'global',channel:'light',value:'dawn'},
 {id:'dusk',category:'sky',name:'黄昏',caption:'给这里一层暮色',scope:'整个沙盘',kind:'global',channel:'light',value:'dusk'},
 {id:'night',category:'sky',name:'月夜',caption:'把这一刻留给夜色',scope:'光线 · 可叠加天气',kind:'global',channel:'light',value:'night'},
 {id:'fog',category:'sky',name:'薄雾',caption:'让远处隐入雾中',scope:'整个沙盘',kind:'global',channel:'weather',value:'fog'},
 {id:'rain',category:'sky',name:'细雨',caption:'让雨轻轻落下来',scope:'整个沙盘',kind:'global',channel:'weather',value:'rain'},
 {id:'snow',category:'sky',name:'飘雪',caption:'让雪花缓缓落下',scope:'天气 · 可叠加光线',kind:'global',channel:'weather',value:'snow'},
 {id:'breeze',category:'sky',name:'微风',caption:'让风带过几片叶子',scope:'风 · 独立叠加',kind:'global',channel:'wind',value:'breeze'},
 {id:'autumn',category:'sky',name:'秋色',caption:'给风景一点秋意',scope:'色彩 · 独立叠加',kind:'global',channel:'season',value:'autumn'},
 {id:'near',category:'company',name:'靠近一点',caption:'请这个角色走近旅人',scope:'已有角色 · 移近',kind:'local'},
 {id:'far',category:'company',name:'留点距离',caption:'为彼此多留一点空间',scope:'已有角色 · 移远',kind:'local'},
 {id:'gather',category:'company',name:'聚在一起',caption:'让附近的角色走近它',scope:'已有角色 · 成组移动',kind:'local'},
 {id:'scatter',category:'company',name:'各留一隅',caption:'让附近的角色散开些',scope:'已有角色 · 成组移动',kind:'local'},
 {id:'quiet',category:'company',name:'安静相处',caption:'沿途不主动展开对话',scope:'同行方式',kind:'global',channel:'narration',value:'quiet'},
 {id:'chat',category:'company',name:'相遇聊聊',caption:'遇见角色时停下来聊聊',scope:'同行方式',kind:'global',channel:'narration',value:'guided'},
 {id:'slow',category:'journey',name:'慢慢走',caption:'让旅人的步子放慢',scope:'行走节奏',kind:'global',channel:'pace',value:'slow'},
 {id:'brisk',category:'journey',name:'轻快些',caption:'换成更轻快的步调',scope:'行走节奏',kind:'global',channel:'pace',value:'brisk'},
 {id:'start',category:'journey',name:'从这里出发',caption:'把这一处设为起点',scope:'设置起点',kind:'local'},
 {id:'waypoint',category:'journey',name:'经过这里',caption:'让这一段路经过此处',scope:'设置途经点',kind:'local'},
 {id:'stop',category:'journey',name:'在此停留',caption:'把这里设为本段终点',scope:'设置终点',kind:'local'},
 {id:'reverse',category:'journey',name:'换个方向',caption:'从原来的终点往回走',scope:'反转整段路线',kind:'route'}
];
const cardEffectLabels={light:{dawn:'晨光',dusk:'黄昏',night:'月夜'},weather:{fog:'薄雾',rain:'细雨',snow:'飘雪'},wind:{breeze:'微风'},season:{autumn:'秋色'},pace:{slow:'慢慢走',brisk:'轻快些'},narration:{quiet:'安静相处',guided:'相遇聊聊'}};
function cardState(s=scene){return {...cardDefaultState(),...(s.cardState||{})};}
function cardOpen(open){
 if(!cardReady)return;clearTimeout(cardCloseTimer);
 const expanded=!!(open||cardActive||cardPinned);$('cardDock').classList.toggle('is-open',expanded);
 $('cardToggle').setAttribute('aria-expanded',String(expanded));
 $('cardToggle').textContent=cardPinned?'收起手牌':expanded?'保持展开':'展开手牌';
}
function cardHint(text){if(cardReady&&$('cardHint').textContent!==text)$('cardHint').textContent=text;}
function cardRenderHand(){
 const group=intentCards.filter(c=>c.category===cardCategory),pages=Math.ceil(group.length/CARD_PAGE_SIZE);
 cardPages[cardCategory]=clamp(cardPages[cardCategory],0,pages-1);
 const cards=group.slice(cardPages[cardCategory]*CARD_PAGE_SIZE,(cardPages[cardCategory]+1)*CARD_PAGE_SIZE),n=cards.length;
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
  const count=b.querySelector('.card-category-count');if(count)count.textContent=String(intentCards.filter(c=>c.category===b.dataset.cardCategory).length);
 }
 $('cardPage').textContent=(cardPages[cardCategory]+1)+' / '+pages;
 $('cardPrev').disabled=cardPages[cardCategory]===0;$('cardNext').disabled=cardPages[cardCategory]===pages-1;
 cardRefresh();
}
function cardRefresh(){
 if(!cardReady)return;
 const state=cardState(),preview=cardActive?.kind==='global'&&(!cardDragging||cardPointer?.overBoard),display=preview?{...state,[cardActive.channel]:cardActive.value}:state;
 const board=document.querySelector('.board-card');board.dataset.cardLight=display.light;board.dataset.cardWeather=display.weather;board.dataset.cardWind=display.wind;board.dataset.cardSeason=display.season;
 $('routePanelToggle').setAttribute('aria-pressed',String(showRoute));
 speed=state.pace==='slow'?1.2:state.pace==='brisk'?4.2:3;
 if(storyState.pace!==state.narration){storyState.pace=state.narration;storyUpdatePace();}
 if($('speed'))$('speed').value=String(Math.round(speed));
 if($('speedLabel'))$('speedLabel').textContent=state.pace==='slow'?'慢慢走':state.pace==='brisk'?'轻快些':'平常步调';
 for(const b of $('cardHand').children){const on=b.dataset.cardId===cardActive?.id,c=intentCards.find(c=>c.id===b.dataset.cardId);b.classList.toggle('is-selected',on);b.classList.toggle('is-applied',c?.kind==='global'&&state[c.channel]===c.value);b.setAttribute('aria-pressed',String(on));}
 $('cardDock').classList.toggle('has-selection',!!cardActive);
 $('cardSelection').hidden=!cardActive||cardDragging;
 if(cardActive){
  $('cardSelectionName').textContent=cardActive.name+' · 预览';
  $('cardSelectionHelp').textContent=cardActive.kind==='global'?(['pace','narration'].includes(cardActive.channel)?'确认后会更新同行方式，场景摆放保留。':'确认前只预览环境，取消即可恢复。'):cardCandidate?.message||cardLocalInstruction(cardActive.id);
  $('cardApply').disabled=cardActive.kind!=='global'&&!cardCandidate?.valid;
  $('cardApply').textContent=cardActive.kind==='global'?'就这样':'放在这里';
 }
 const signature=JSON.stringify(state);
 if($('cardEffects').dataset.signature!==signature){
  $('cardEffects').dataset.signature=signature;$('cardEffects').replaceChildren();
  const effects=Object.entries(cardEffectLabels).flatMap(([channel,labels])=>labels[state[channel]]?[[channel,labels[state[channel]]]]:[]);
  effects.forEach(([channel,label])=>{const b=document.createElement('button');b.type='button';b.className='effect-chip';b.dataset.effect=channel;b.textContent=label+' ×';b.setAttribute('aria-label','移除'+label);b.addEventListener('click',()=>cardRemoveEffect(channel));$('cardEffects').appendChild(b);});
 }
 dirty=true;
}
function cardLocalInstruction(id){return {near:'选择已有的动物或人物，看看它能怎样走近旅人。',far:'选择已有的动物或人物，预览它与旅人之间的新距离。',gather:'选择一个已有角色，让附近的角色向它走近。',scatter:'选择一组角色中的一个，为彼此留出空间。',start:'选择可通行的位置，预览新的起点。',waypoint:'选择可通行的位置，预览新的途经点。',stop:'选择空地、长椅或角色，把这里设为本段终点。',reverse:'原来的终点将变成出发方向，途经点继续保留。'}[id]||'';}
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
 if(c.kind!=='global')cardRememberJourney();
 if(storyState.active)storyClose(false);
 cardActive=c;cardCandidate=c.kind==='route'?cardReverseCandidate():null;cardPreviewBase=JSON.stringify(scene);setTool('select');cardOpen(true);cardRefresh();
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
 if(c.kind==='route')return cardReverseCandidate();
 if(c.category==='company')return cardRelocateCandidate(c,p);
 const invalid=message=>({valid:false,message,changes:[],point:p});
 if(!p||!inside(p.x,p.y))return invalid('请选择地图内的位置。');
 const next=clone(scene),kind=c.id==='start'?'start':c.id==='waypoint'?'waypoint':'goal';
 if(!canEnter(scene,p)&&!(kind==='goal'&&isMeetingGoal(scene,p)))return invalid(kind==='goal'?'终点可放在空地、长椅或角色上。':'起点和途经点需要可通行的陆地或桥。');
 const occupied=markerKindAt(p);if(occupied&&occupied!==kind)return invalid('这里已经有另一个路线标记，请换一处。');
 if(kind==='waypoint'){if(same(scene.waypoints[0],p))return invalid('途经点已经在这里。');next.waypoints=[{...p}];}
 else{if(same(scene[kind],p))return invalid('标记已经在这里。');next[kind]={...p};}
 return {valid:true,next,changes:[{p:{...p},marker:kind}],point:{...p},message:'将更新'+({start:'起点',waypoint:'途经点',goal:'终点'}[kind])+'。确认后才会保留。'};
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
  if(item.from){const a=point(item.from),b=point(item.p),angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.setLineDash([5,4]);line(a.x,a.y-5,b.x,b.y-5,'#f1e9c4',2/camera.zoom);ctx.setLineDash([]);for(const sign of [-1,1])line(b.x,b.y-5,b.x-10*Math.cos(angle+sign*.5),b.y-5-10*Math.sin(angle+sign*.5),'#f1e9c4',2/camera.zoom);}
  if(item.object)drawObject(item.object,item.p,.6);
  if(item.marker)marker(item.p,{start:'起',goal:'终',waypoint:'经'}[item.marker],{start:'#b8d4a2',goal:'#e5c47e',waypoint:'#acbbff'}[item.marker]);
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
 if(c.kind==='global')return {overBoard:true,valid:true,message:['pace','narration'].includes(c.channel)?'松手，更新这一段同行的方式。':'松手，让「'+c.name+'」落进这片天地。'};
 if(c.kind==='route'){const candidate=cardReverseCandidate();return {overBoard:true,valid:candidate.valid,candidate,message:candidate.message.replace('确认后才会保留。','松手即可保留。')};}
 const within=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 const p=within?cardTargetCell(c,boardPoint(e)):null,candidate=cardMakeCandidate(c,p);
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
 const viewW=document.documentElement?.clientWidth||window.innerWidth||W,viewH=window.innerHeight||H+300;
 const ghostX=e.clientX+145>viewW?e.clientX-126:e.clientX+18,ghostY=clamp(e.clientY-95,8,viewH-180);
 g.ghost.style.transform='translate('+ghostX+'px,'+ghostY+'px) rotate('+tilt+'deg) scale(.8)';
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
 const stagger=Math.min(65,650/Math.max(1,items.length));
 items.forEach((item,i)=>cardBirths.set(key(item.p),{object:scene.objects[key(item.p)],from:item.from,start:now+i*stagger,duration:650}));
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
 if(!$('cardAtmosphere')){const atmosphere=document.createElement('div');atmosphere.id='cardAtmosphere';atmosphere.className='card-atmosphere';atmosphere.setAttribute('aria-hidden','true');atmosphere.innerHTML='<div class="card-fog"></div><div class="card-rain"></div><div class="card-snow"></div><div class="card-breeze">'+Array.from({length:7},(_,i)=>'<i style="--leaf:'+i+'"></i>').join('')+'</div><div class="card-stars"></div>';wrap.appendChild(atmosphere);}
 if(!$('cardDropGuide')){const guide=document.createElement('div');guide.id='cardDropGuide';guide.className='card-drop-guide';guide.hidden=true;guide.setAttribute('aria-hidden','true');document.querySelector('.board-card').appendChild(guide);}
 const dock=$('cardDock');
 dock.addEventListener('pointerenter',()=>cardOpen(true));
 dock.addEventListener('pointerleave',()=>{clearTimeout(cardCloseTimer);cardCloseTimer=setTimeout(()=>{if(!dock.querySelector(':focus-visible'))cardOpen(false);},450);});
 dock.addEventListener('focusin',()=>cardOpen(true));
 dock.addEventListener('focusout',()=>{clearTimeout(cardCloseTimer);cardCloseTimer=setTimeout(()=>{if(!dock.contains(document.activeElement))cardOpen(false);},450);});
 $('cardToggle').addEventListener('click',()=>{if(cardActive)cardCancel(false);cardPinned=!cardPinned;cardOpen(cardPinned);});
 for(const b of $('cardTabs').querySelectorAll('[data-card-category]'))b.addEventListener('click',()=>{cardCancel(false);cardCategory=b.dataset.cardCategory;cardRenderHand();cardOpen(true);});
 for(const[id,delta]of [['cardPrev',-1],['cardNext',1]])$(id).addEventListener('click',()=>{cardCancel(false);cardPages[cardCategory]+=delta;cardRenderHand();cardOpen(true);});
 $('cardApply').addEventListener('click',()=>cardApply());$('cardCancel').addEventListener('click',()=>cardCancel());
 document.addEventListener('pointermove',cardMovePointer,{capture:true,passive:false});
 document.addEventListener('pointerup',e=>cardFinishPointer(e,true),true);
 document.addEventListener('pointercancel',e=>cardFinishPointer(e,false),true);
 window.addEventListener('blur',()=>cardFinishPointer(null,false));
 const panels=[['libraryToggle','library-open']];
 for(const[id,cls]of panels)$(id)?.addEventListener('click',()=>{cardCancel(false);const on=document.body.classList.toggle(cls);$(id).setAttribute('aria-expanded',String(on));dirty=true;});
 $('routePanelToggle').addEventListener('click',()=>{cardCancel(false);showRoute=!showRoute;$('routeToggle').checked=showRoute;$('routePanelToggle').setAttribute('aria-pressed',String(showRoute));refreshSearch();updateUI();});
 $('homeBtn').addEventListener('click',()=>{$('worldMenu').open=false;});
 let blockedPointer=null;
 canvas.addEventListener('pointerdown',e=>{
  if(!cardActive||cardActive.kind!=='local'||e.button!==0||e.altKey)return;
  e.preventDefault();e.stopImmediatePropagation();blockedPointer=e.pointerId;canvas.focus({preventScroll:true});
  const p=cardTargetCell(cardActive,boardPoint(e));cardCandidate=cardMakeCandidate(cardActive,p);cardRefresh();cardHint(cardCandidate.message);
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
