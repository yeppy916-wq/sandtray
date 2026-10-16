// Authored event triggers and dialogue branches. No model, request or remote data.
const storyState={enabled:true,pace:'guided',active:null,seen:new Set(),landscapes:new Set(),log:[],journey:0,journeyActive:false,steps:0,lastEventStep:-10,encounters:0,caption:null};
function storyLog(entry){
 const item={journey:storyState.journey,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),...entry};
 storyState.log.push(item);$('journalCount').textContent=storyState.log.length;return item;
}
function storyReset(){
 if(storyState.active)storyClose(false);
 storyState.journeyActive=false;storyState.seen.clear();storyState.landscapes.clear();storyState.steps=0;storyState.encounters=0;storyState.lastEventStep=-10;storyState.caption=null;$('storyCaption').hidden=true;
}
function storyContext(p){
 const nearby=new Set();
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  if(Math.abs(dx)+Math.abs(dy)>2||!inside(p.x+dx,p.y+dy))continue;
  const i=key({x:p.x+dx,y:p.y+dy});if(scene.terrain[i]===1)nearby.add('water');const t=scene.objects[i]?.type;if(t)nearby.add(t);
 }
 const pieces=[];
 if(nearby.has('water'))pieces.push('水面也在不远处');
 if(nearby.has('house'))pieces.push('你放置的小屋留在一旁');
 else if(nearby.has('tree'))pieces.push('你安排的树木也进入了视野');
 else if(nearby.has('flower'))pieces.push('你种下的花丛留在路边');
 return pieces.length?pieces.join('，')+'。':'';
}
function storyOpen(event){
 if(storyState.active)storyClose(false);
 const wasWalking=mode==='walking';if(wasWalking)pause();
 const canResume=wasWalking||mode==='paused';
 storyState.active={...event,canResume,revealed:0,elapsed:0,answered:false};
 const a=storyState.active;
 a.entry=storyLog({kind:a.kind,title:a.title,narration:a.narration,prompt:a.prompt,location:a.location?{...a.location}:null});
 $('storyDock').hidden=false;document.querySelector('.board-card').classList.add('story-open');$('storyTitle').textContent=a.title;
 $('storyPlace').textContent=a.kind==='intro'?'在出发之前':a.kind==='arrival'?'你安排的终点':a.location?'停在这处相遇旁':'此刻所在的地方';
 $('storyNarration').textContent='';$('storyPrompt').textContent=a.prompt||'';$('storyPrompt').hidden=!a.prompt;
 $('storyReply').hidden=true;$('storyReply').textContent='';$('storyChoices').replaceChildren();$('storyNote').value='';
 $('storyNoteWrap').hidden=a.kind==='intro';$('storyContinue').textContent=a.kind==='intro'?'按当前节奏出发':canResume?'继续走':'收起这一刻';
 $('storyStay').hidden=!canResume||a.kind==='intro';
 for(const [i,c]of (a.choices||[]).entries()){
  const b=document.createElement('button');b.type='button';b.className='story-choice';b.textContent=c.label;b.addEventListener('click',()=>storyChoose(i));$('storyChoices').appendChild(b);
 }
 $('storyBody').scrollTop=0;storyRenderText();dirty=true;
 message(a.kind==='intro'?'选一种同行节奏，也可以直接出发。':a.kind==='arrival'?'这一段路暂时结束。可以记下一句话，也可以直接收起。':'旅人在这里停了一下。回应、留白或继续走，都可以。');
}
function storyRenderText(){
 const a=storyState.active;if(!a)return;
 const n=Math.min(a.narration.length,Math.max(1,Math.floor(a.revealed)));
 $('storyNarration').textContent=a.narration.slice(0,n);$('storyReveal').hidden=n>=a.narration.length;
}
function storyChoose(index){
 const a=storyState.active,c=a?.choices?.[index];if(!c||a.answered)return;
 a.answered=true;a.entry.choice=c.label;a.entry.reply=c.reply||'';a.entry.followup=c.question||'';
 a.revealed=a.narration.length;storyRenderText();
 for(const [i,b]of [...$('storyChoices').children].entries()){b.disabled=true;b.classList.toggle('selected',i===index)}
 if(c.pace){storyState.pace=c.pace;storyUpdatePace();}
 $('storyReply').textContent=[c.reply,c.question].filter(Boolean).join('\n');$('storyReply').hidden=!$('storyReply').textContent;
 $('storyContinue').textContent=a.kind==='intro'?'出发，开始同行':a.canResume?'带着这一刻，继续走':'收起这一刻';
}
function storyClose(resume=false){
 const a=storyState.active;if(!a)return;
 const note=$('storyNote').value.trim().slice(0,1200);if(note)a.entry.note=note;
 if(!a.answered)a.entry.choice=a.kind==='intro'?'采用当前节奏':'留白';
 storyState.active=null;$('storyDock').hidden=true;document.querySelector('.board-card').classList.remove('story-open');dirty=true;
 if(resume&&a.canResume)play();
 else if(mode==='paused')message('旅人停在这里。可以看看周围、改摆场景，或点击“继续同行”。');
}
function storyUpdatePace(){
 const labels={guided:'相遇时停留',scenery:'轻声描述',quiet:'安静同行'};
 $('paceBtn').textContent=labels[storyState.pace];$('paceBtn').title='切换节奏：相遇时停留 / 轻声描述 / 安静同行';
}
function storyStart(){
 if(!storyState.enabled)return false;
 storyState.journey++;storyState.journeyActive=true;storyState.seen.clear();storyState.landscapes.clear();storyState.steps=0;storyState.encounters=0;storyState.lastEventStep=-10;storyState.caption=null;$('storyCaption').hidden=true;
 storyOpen({kind:'intro',title:'这一段路，怎样陪你走？',narration:'你摆放的风景，正成为旅人要走过的世界。同行者会留意沿途的小事，把感受和故事的解释留给你。',prompt:'这次想用哪一种节奏？之后也能随时切换。',choices:[
  {label:'遇见动物或人物时，停下来聊聊',pace:'guided',reply:'遇到附近的角色时，我们会停一下。你可以回应，也可以不作回答。'},
  {label:'先描述风景，不打断行走',pace:'scenery',reply:'沿途的片段会以短字幕出现。想停下来时，可以点“此刻聊聊”。'},
  {label:'安静同行，让我自己看',pace:'quiet',reply:'沿途不自动弹出文字。需要时，你仍可以主动聊聊。'}
 ]});return true;
}
function storyAfterPlay(fresh){
 if(!storyState.enabled)return false;
 if(fresh)return storyStart();
 if(!storyState.journeyActive){storyState.journeyActive=true;storyState.journey++;}
 return storyEncounter();
}
function storyNearbyNPC(){
 // Reachable neighboring cells prevent encounters through a wall or across water.
 const reachable=[actor.cell,...neighbors(actor.cell).filter(p=>canStep(scene,actor.cell,p))],candidates=[];
 for(const r of reachable)for(const p of neighbors(r)){
  const o=scene.objects[key(p)];if(!o||!NPC_TYPES.includes(o.type))continue;
  const id=key(p)+':'+o.type;if(storyState.seen.has(id)||candidates.some(c=>c.id===id))continue;
  candidates.push({id,object:o,type:o.type,location:{...p},distance:Math.abs(p.x-actor.cell.x)+Math.abs(p.y-actor.cell.y)});
 }
 candidates.sort((a,b)=>Number(same(b.location,scene.goal))-Number(same(a.location,scene.goal))||a.distance-b.distance||key(a.location)-key(b.location));return candidates[0]||null;
}
function storyEncounter(force=false){
 if(!storyState.enabled||storyState.active||storyState.pace==='quiet'||mode!=='walking')return false;
 const npc=storyNearbyNPC();if(!npc)return false;
 const atDestination=same(npc.location,scene.goal)&&runIndex>=route.length-1;
 if(!force&&!atDestination&&(storyState.steps-storyState.lastEventStep<3||storyState.encounters>=6))return false;
 const data=STORY_DATA.encounters[npc.type];storyState.seen.add(npc.id);storyState.lastEventStep=storyState.steps;storyState.encounters++;
 const context=storyContext(npc.location),narration=data.narration+(context?'\n'+context:'');
 if(storyState.pace==='scenery'){
  storyCaption(data.title,narration);storyLog({kind:'encounter',title:data.title,narration,location:npc.location});return false;
 }
 actor.x=actor.cell.x;actor.y=actor.cell.y;travel=0;
 storyOpen({kind:'encounter',...npc,title:data.title,narration,prompt:data.prompt,choices:data.choices});return true;
}
function storyLandscape(){
 if(storyState.pace==='quiet'||storyState.steps-storyState.lastEventStep<3)return;
 const p=actor.cell,o=scene.objects[key(p)],ns=neighbors(p);
 const kind=o?.type==='bridge'?'bridge':o?.type==='gate'?'gate':ns.some(q=>scene.terrain[key(q)]===1)?'water':ns.some(q=>scene.objects[key(q)]?.type==='tree')?'trees':null;
 if(!kind||storyState.landscapes.has(kind))return;
 storyState.landscapes.add(kind);storyState.lastEventStep=storyState.steps;
 const data=STORY_DATA.landscape[kind];storyCaption(data.title,data.text);storyLog({kind:'landscape',title:data.title,narration:data.text,location:{...p}});
}
function storyStep(){
 if(!storyState.enabled)return false;
 storyState.steps++;
 if(storyEncounter())return true;
 storyLandscape();return false;
}
function storyCaption(title,text){
 storyState.caption={title,text,remaining:Math.max(5,Math.min(10,text.length/9))};$('storyCaptionTitle').textContent=title;$('storyCaptionText').textContent=text;$('storyCaption').hidden=false;
}
function storyTick(dt){
 const a=storyState.active;if(a){a.elapsed+=dt;const n=Math.min(a.narration.length,a.elapsed*27);if(Math.floor(n)!==Math.floor(a.revealed)&&a.revealed<a.narration.length){a.revealed=n;storyRenderText();}}
 const c=storyState.caption;if(c&&!a){c.remaining-=dt;if(c.remaining<=0){storyState.caption=null;$('storyCaption').hidden=true;}}
}
function storyArrival(){
 if(!storyState.enabled||!storyState.journeyActive||storyState.pace==='quiet')return;
 if(storyState.pace==='scenery'){storyCaption('走到这一处','旅人抵达你安排的终点。想停一会儿或记下一句话，可以点“此刻聊聊”。');return;}
 const met=storyState.log.filter(e=>e.journey===storyState.journey&&e.kind==='encounter').length;
 storyOpen({kind:'arrival',title:'走到这里，先停一会儿',narration:(actor.seated?'旅人在你放置的长椅上坐了下来。':'旅人到了你安排的位置。')+(met?'这一路，有 '+met+' 次相遇进入了故事。':'这一路，眼前的风景来自你的安排。')+'你可以保留这个世界，也可以再改动一处。',prompt:'现在回看这片场景，你最想留下哪一个片刻？',choices:[
  {label:'留意一处自己喜欢的安排',reply:'可以是一个物件、一段距离，也可以是刚才停下来的那个位置。',question:'如果愿意，在下面用自己的话记下来。'},
  {label:'想回去改动一处',reply:'你可以收起这段话，回到起点，重新摆置，再走一次。',question:'不用把第一次的安排当作最终答案。'},
  {label:'暂时没有想说的',reply:'这一段可以先留白。',question:'你可以只看看眼前的场景。'}
 ]});
}
function storyManual(){
 if(storyState.active){$('storyDock').hidden=false;return;}
 if(!storyState.enabled){storyState.enabled=true;$('storyToggle').checked=true;}
 const npc=storyNearbyNPC();
 if(npc){const d=STORY_DATA.encounters[npc.type];storyState.seen.add(npc.id);storyState.lastEventStep=storyState.steps;storyOpen({kind:'encounter',...npc,title:d.title,narration:d.narration,prompt:d.prompt,choices:d.choices});return;}
 const context=storyContext(actor.cell);
 storyOpen({kind:'reflection',title:'看看此刻的这一处',location:{...actor.cell},narration:'我们先在这里停一下。'+(context||'眼前这片空间，保留着你刚才的摆置。')+'你可以把注意力放在一个很小的细节上。',prompt:'如果愿意，这一刻想从哪里说起？',choices:[
  {label:'我注意到一个物件',reply:'可以看一看它的位置，以及它与周围物件之间的距离。',question:'你想怎样介绍这个物件？'},
  {label:'我有一点感受想留下',reply:'可以用自己的词写下来，长短都可以。',question:'不需要把感受解释清楚，记下一句话就够了。'},
  {label:'先不说，只在这里看看',reply:'我们把文字放轻一点，把时间留在这里。',question:'随时可以收起对话，继续看或继续走。'}
 ]});
}
function storyReconcile(){
 const a=storyState.active;if(a?.kind!=='encounter')return;
 const i=scene.objects.indexOf(a.object);
 if(i<0){storyClose(false);message('这处相遇的物件已被替换或移除。故事先停在这里，你可以继续改摆。');}
 else{a.location={x:i%COLS,y:Math.floor(i/COLS)};a.entry.location={...a.location};storyState.seen.add(i+':'+a.type);}
}
function storyJournal(){
 const list=$('journalList');list.replaceChildren();
 if(!storyState.log.length){const e=document.createElement('p');e.className='journal-empty';e.textContent='还没有沿途记录。摆置一处风景，开始同行吧。';list.appendChild(e);}
 for(const item of storyState.log){
  const el=document.createElement('article');el.className='journal-entry';
  const small=document.createElement('small');small.textContent=(item.journey?'第 '+item.journey+' 次同行':'自由停留')+' · '+item.time;
  const title=document.createElement('h3');title.textContent=item.title;el.append(small,title);
  for(const text of [item.narration,item.choice?'我的选择：'+item.choice:'',item.reply,item.followup])if(text){const p=document.createElement('p');p.textContent=text;el.appendChild(p)}
  if(item.note){const p=document.createElement('p');p.className='journal-note';p.textContent='我留下的话：'+item.note;el.appendChild(p)}list.appendChild(el);
 }
 $('journalDialog').showModal();
}
function storyExport(){
 if(storyState.active){const note=$('storyNote').value.trim();if(note)storyState.active.entry.note=note.slice(0,1200);}
 if(!storyState.log.length){toast('还没有可以导出的沿途记录。');return;}
 const text='一隅 · 我的沿途记录\n'+new Date().toLocaleString('zh-CN')+'\n\n'+storyState.log.map(e=>[(e.journey?'第 '+e.journey+' 次同行':'自由停留')+' · '+e.time+' / '+e.title,e.narration,e.choice?'我的选择：'+e.choice:'',e.reply,e.followup,e.note?'我留下的话：'+e.note:''].filter(Boolean).join('\n')).join('\n\n——\n\n');
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='一隅_我的沿途记录.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('沿途记录已导出。');
}
function storyCategory(category){
 for(const b of $('paletteTabs').children)b.classList.toggle('active',b.dataset.category===category);
 for(const b of $('palette').children){const t=b.dataset.tool;b.hidden=!['select','erase'].includes(t)&&(NPC_TYPES.includes(t)?(['dog','deer','wolf','cat'].includes(t)?'animals':'people'):'world')!==category;}
}
function initNarrative(){
 for(const b of $('paletteTabs').children)b.addEventListener('click',()=>storyCategory(b.dataset.category));
 $('storyContinue').addEventListener('click',()=>storyClose(true));$('storyStay').addEventListener('click',()=>storyClose(false));$('storyDismiss').addEventListener('click',()=>storyClose(false));
 $('storyReveal').addEventListener('click',()=>{const a=storyState.active;if(a){a.revealed=a.narration.length;storyRenderText();}});
 $('talkBtn').addEventListener('click',storyManual);$('journalBtn').addEventListener('click',()=>{if(storyState.active){const a=storyState.active,note=$('storyNote').value.trim();if(note)a.entry.note=note.slice(0,1200);}if(mode==='walking')pause();storyJournal()});
 $('closeJournal').addEventListener('click',()=>$('journalDialog').close());$('exportJournal').addEventListener('click',storyExport);
 $('clearJournal').addEventListener('click',()=>{if(storyState.active)storyClose(false);storyState.log=[];$('journalCount').textContent='0';$('journalDialog').close();toast('本次打开页面的沿途记录已清空。');});
 $('paceBtn').addEventListener('click',()=>{const list=['guided','scenery','quiet'];storyState.pace=list[(list.indexOf(storyState.pace)+1)%3];storyUpdatePace();toast('同行节奏：'+$('paceBtn').textContent);});
 $('storyToggle').addEventListener('change',e=>{storyState.enabled=e.target.checked;if(!storyState.enabled){const resume=!!storyState.active?.canResume;storyClose(resume);storyState.caption=null;$('storyCaption').hidden=true;}toast(storyState.enabled?'同行叙事已开启。':'同行叙事已关闭。');});
 $('storyNote').addEventListener('input',()=>{if(storyState.active)storyState.active.entry.note=$('storyNote').value.trim().slice(0,1200);});
 storyUpdatePace();storyCategory('world');
}
