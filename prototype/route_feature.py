"""Three route markers and an editable ocean-based terrain, after story assembly."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def augment_route(source):
    def rep(old, new, count=1):
        nonlocal source
        if source.count(old) < count:
            raise ValueError(f'Route patch missing: {old[:110]!r}')
        source = source.replace(old, new, count)

    def function(name, replacement):
        nonlocal source
        begin = source.index('function ' + name + '(')
        body = source.index('{', begin)
        depth = 1
        end = body + 1
        quote = None
        escaped = False
        while depth:
            char = source[end]
            if quote:
                if escaped:
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char == quote:
                    quote = None
            elif char in "'\"`":
                quote = char
            elif char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
            end += 1
        source = source[:begin] + replacement.strip() + '\n' + source[end:]

    rep('SCRIPTED COMPANION / 0.6', 'IRREGULAR SANDBOX / 0.7')
    # Keep the supplied map and original flag artwork. Only add route/editor behavior.
    rep('<button class="button" id="goalTool">', '<button class="button" id="waypointTool"><span class="marker-symbol waypoint">经</span>设置途经点</button><button class="button" id="goalTool">')
    rep('<div class="marker-buttons">', '<div class="marker-buttons" aria-label="依次设置起点、途经点和终点">')
    rep('<p class="scene-legend">', '<p id="routeSummary" class="route-summary" aria-live="polite"></p><details class="route-explainer"><summary>途经点怎样随沙盘大小变化？</summary><p>本示例固定 1 个途经点，依次走过起点 → 途经点 → 终点。后续可按沙盘的可编辑面积，建议小型 1 个、中型 2–3 个、大型 4–6 个；再结合已创建的陆地面积与连通情况调整。数量建议随场景变化更新，已放置的点保留，由玩家确认增减和顺序。缩放镜头不改变数量。</p></details>\n   <p class="scene-legend">')
    rep('<p class="tool-note" id="toolNote">', '<div class="land-materials" role="group" aria-label="陆地材质"><span>陆地材质 · 选择后涂绘</span><div>'+''.join(f'<button class="material-button" data-material="{key}" aria-pressed="false"><i class="material-dot {key}"></i>{label}</button>' for key,label in [('grass','草地'),('sand','沙地'),('soil','泥土'),('stone','石地')])+'</div></div><p class="tool-note" id="toolNote">')
    rep('</head>', '<style>'+(ROOT/'route-style.css').read_text(encoding='utf8')+'</style></head>')
    rep('改变一条路、一道门或一个停留点，看看旅人会怎样走。', '以大海为底，绘出陆地，安排起点、途经点与终点。')
    rep('第一轮小实验：进入庭院，在长椅停留', '这一段路：先到途经点，再去长椅')
    rep('<span><i>1</i>点击庭院左侧小门</span><span><i>2</i>开始同行</span><span><i>3</i>再关门或移走一段桥</span>', '<span><i>1</i>设置起点 / 途经点 / 终点</span><span><i>2</i>预览完整路线</span><span><i>3</i>开始同行</span>')
    rep('水、树、石头、围栏会挡路；', '空白沙盘是一片大海；选择陆地材质后拖动绘出岛屿，也可重涂已有陆地。水域工具或橡皮可把陆地还原为海。三个路线点需分别设置，途经点必须经过；水、树、石头、围栏会挡路；')
    rep('选择“设置起点 / 终点”，点击沙盘。', '选择“设置起点 / 途经点 / 终点”，点击沙盘，三个点需分开放置。途经点放在可通行的陆地或桥上；旅人先经过它，再走向终点。')
    rep('<p class="help-camera">', '<p>沙盘的基底是大海。“空白沙盘”会清空为海面，先选择草地、沙地、泥土或石地，按住拖动创建陆地；在现有陆地上涂绘仅更换材质，保留物件。再设置三个路线点。当前示例只提供一个途经点，自适应数量仍为后续设计，详见左侧说明。</p><p class="help-camera">')
    rep("function emptyScene(){return {version:1,terrain:Array(N).fill(0),objects:Array(N).fill(null),start:{x:4,y:9},goal:{x:17,y:5}}}", "function emptyScene(){return {version:2,oceanOnly:true,terrain:Array(N).fill(1),materials:Array(N).fill(null),objects:Array(N).fill(null),start:null,waypoints:[],goal:null}}")
    rep('const s=emptyScene();', "const s=emptyScene();s.oceanOnly=false;s.terrain.fill(0);s.start={x:4,y:9};s.waypoints=[{x:8,y:5}];s.goal={x:17,y:5};", 1)
    rep('if(!inside(p.x,p.y))return false;', 'if(!p||!inside(p.x,p.y))return false;')
    function('findPath', r'''
function findLeg(s,from,target,meeting=false){
 if(!canEnter(s,from))return {path:null,visited:[],reason:'start'};
 const ends=meeting?neighbors(target).filter(p=>canEnter(s,p)):[target].filter(p=>canEnter(s,p));
 const targets=new Set(ends.map(key)),queue=[{...from}],previous=new Map([[key(from),null]]);let found=null;
 for(let head=0;head<queue.length;head++){
  const p=queue[head];if(targets.has(key(p))){found=p;break;}
  for(const q of neighbors(p))if(!previous.has(key(q))&&canStep(s,p,q)){previous.set(key(q),p);queue.push(q);}
 }
 if(!found)return {path:null,visited:queue,reason:'unreachable'};
 const path=[];for(let p=found;p;p=previous.get(key(p)))path.push(p);path.reverse();return {path,visited:queue,reason:null};
}
function findPath(s,from=s.start,completed=0){
 const points=s.waypoints||[];
 if(!s.start||!s.goal||!points.length)return {path:null,visited:[],reason:'markers',message:'请先创建陆地，再分别设置起点、途经点和终点。'};
 if(!canEnter(s,from))return {path:null,visited:[],reason:'start',message:'出发位置无法通行，请检查陆地或木桥。'};
 const targets=[...points.slice(completed),s.goal],path=[{...from}],waypointSteps=[];let at=from;
 for(let i=0;i<targets.length;i++){
  const final=i===targets.length-1,leg=findLeg(s,at,targets[i],final&&isMeetingGoal(s,targets[i]));
  if(!leg.path)return {...leg,failedLeg:completed+i,message:final?'途经点 → 终点之间没有通路，请检查门、桥或障碍。':(completed+i===0?'起点 / 当前位置':'上一途经点')+' → 途经点之间没有通路，请检查陆地、桥或障碍。'};
  path.push(...leg.path.slice(1));at=leg.path.at(-1);if(!final)waypointSteps.push({index:completed+i,step:path.length-1});
 }
 return {path,visited:[],reason:null,waypointSteps};
}
''')
    function('validScene', r'''
function validScene(s){
 const types=['bridge','fence','gate','tree','stone','bench','house','flower',...NPC_TYPES];
 const pos=p=>p&&inside(p.x,p.y),validMarker=p=>p===null||pos(p);
 if(![1,2].includes(s?.version)||!Array.isArray(s.terrain)||s.terrain.length!==N||!s.terrain.every(v=>v===0||v===1)||!Array.isArray(s.objects)||s.objects.length!==N||!s.objects.every(o=>o===null||o&&types.includes(o.type)&&(o.type!=='bridge'||['h','v'].includes(o.dir))))return false;
 if(!validMarker(s.start)||!validMarker(s.goal)||s.start&&!canEnter(s,s.start)||s.goal&&!canEnter(s,s.goal)&&!isMeetingGoal(s,s.goal))return false;
 if(s.materials!==undefined&&(!Array.isArray(s.materials)||s.materials.length!==N||!s.materials.every(m=>m===null||['grass','sand','soil','stone'].includes(m))))return false;
 if(s.waypoints!==undefined&&(!Array.isArray(s.waypoints)||s.waypoints.length>1||!s.waypoints.every(p=>pos(p)&&canEnter(s,p))))return false;
 const markers=[s.start,...(s.waypoints||[]),s.goal].filter(Boolean);return new Set(markers.map(key)).size===markers.length;
}
function migrateScene(s){
 if(!validScene(s))return null;
 s=clone(s);s.version=2;s.materials??=Array(N).fill(null);
 if(!s.waypoints){const path=s.start&&s.goal?findLeg(s,s.start,s.goal,isMeetingGoal(s,s.goal)).path:null;s.waypoints=[];
  const candidate=path?.slice(1,-1).find((p,i,list)=>i>=Math.floor(list.length/2)&&!same(p,s.goal));
  if(candidate)s.waypoints=[{...candidate}];
 }
 return s;
}
''')
    rep('storyDemoScene,NPC_TYPES,canEnter', 'storyDemoScene,NPC_TYPES,migrateScene,findLeg,canEnter')
    rep("let scene=storyDemoScene(),tool='select'", "let landMaterial='grass',completedWaypoints=0;\nlet scene=demoScene(),tool='select'")
    rep("STORAGE='yiyu-sandtray-mvp-v1'", "STORAGE='yiyu-sandtray-irregular-route-v2'")
    rep('if(validScene(saved)){scene=saved;restored=true}', 'const migrated=migrateScene(saved);if(migrated){scene=migrated;restored=true}')
    rep('...scene.start,cell:{...scene.start}', '...(scene.start||{x:11,y:7}),cell:{...(scene.start||{x:11,y:7})}', 3)
    rep("function clearRun(){storyReset();mode=", "function clearRun(){completedWaypoints=0;storyReset();mode=")
    rep('function refreshSearch(){search=findPath(scene,origin());dirty=true}', "function refreshSearch(){search=findPath(scene,origin(),mode==='paused'?completedWaypoints:0);dirty=true}")
    rep("$('startTool').classList.toggle", "updateRouteUI();\n $('startTool').classList.toggle")
    rep("t==='goal'?'点击空地", "t==='waypoint'?'点击可通行的陆地或桥设置途经点；旅人必须先经过这里，再走向终点。':t==='goal'?'点击空地")
    rep("function protectedCell(p){return same(p,scene.start)||same(p,scene.goal)", "function protectedCell(p){return same(p,scene.start)||(scene.waypoints||[]).some(q=>same(p,q))||same(p,scene.goal)")
    function('place', r'''
function markerKindAt(p){return same(p,scene.start)?'start':scene.waypoints.some(q=>same(p,q))?'waypoint':same(p,scene.goal)?'goal':null}
function place(p,t){
 if(!p||!inside(p.x,p.y))return false;
 const i=key(p),old=scene.objects[i];
 if(['start','waypoint','goal'].includes(t)){
  if(!canEnter(scene,p)&&(t!=='goal'||!isMeetingGoal(scene,p)))return fail(t==='goal'?'终点请选择可通行的陆地、长椅或动物 / 人物。':'起点与途经点需要放在可通行的陆地或桥上。');
  const occupied=markerKindAt(p);if(occupied&&occupied!==t)return fail('起点、途经点和终点需要分开放置，请换一格。');
  if(t==='waypoint'){if(same(scene.waypoints[0],p))return false;scene.waypoints=[{...p}];completedWaypoints=0;}
  else{if(same(scene[t],p))return false;scene[t]={...p};}
  return true;
 }
 if(t==='sand'){
  if(scene.terrain[i]===0&&scene.materials[i]===landMaterial)return false;
  scene.terrain[i]=0;scene.materials[i]=landMaterial;return true;
 }
 if(protectedCell(p))return fail('这里有路线标记或暂停的旅人，请先移开，再改变地形或物件。');
 if(t==='erase'){
  if(old){scene.objects[i]=null;return true;}
  if(scene.terrain[i]===0){scene.terrain[i]=1;scene.materials[i]=null;return true;}return false;
 }
 if(t==='water'){
  if(scene.terrain[i]===1&&!old)return false;scene.terrain[i]=1;scene.materials[i]=null;scene.objects[i]=null;return true;
 }
 if(t==='bridge'){
  if(scene.terrain[i]!==1)return fail('木桥需要放在水面上；宽河可连续铺设多段桥。');
  const o={type:'bridge',dir:bridgeDir};if(JSON.stringify(old)===JSON.stringify(o))return false;scene.objects[i]=o;return true;
 }
 if(scene.terrain[i]===1)return fail('先创建陆地，再放置物件；水面可以铺设木桥。');
 const o=t==='gate'?{type:t,open:false}:t==='bench'?{type:t,dir:'h'}:{type:t};
 if(JSON.stringify(old)===JSON.stringify(o))return false;scene.objects[i]=o;return true;
}
''')
    rep('起点、终点或旅人占用', '起点、途经点、终点或旅人占用')
    rep("message('目前没有可通行路线。浅绿色是可达区域，可以检查门、桥和围栏。',true)", "message(search.message||'目前没有可通行路线。浅绿色是可达区域，可以检查门、桥和围栏。',true)")
    rep("'找到一条 '+(search.path.length-1)+' 步的路线。", "'找到一条 '+(search.path.length-1)+' 步的路线，按起点 → 途经点 → 终点依次行走。")
    rep("const from=mode==='paused'?{...actor.cell}:{...scene.start};search=findPath(scene,from);", "if(fresh)completedWaypoints=0;\n const from=mode==='paused'?{...actor.cell}:{...(scene.start||{x:11,y:7})};search=findPath(scene,from,completedWaypoints);")
    rep("message('目前没有可通行路线。旅人留在原地；请检查小门、木桥或障碍。',true)", "message(search.message||'目前没有可通行路线。旅人留在原地；请检查小门、木桥或障碍。',true)")
    rep("message('旅人正在按当前布局行走。需要改摆时，先点击“暂停”。');updateUI();", "markWaypointProgress();message(completedWaypoints?'途经点已到达，接下来前往终点。':'旅人先前往途经点，再走向终点。需要改摆时，先点击“暂停”。');updateUI();")
    rep("if(mode!=='walking')return;\n const at=route", "if(mode!=='walking')return;\n const at=route")
    rep("travel=0;refreshSearch();\n message('已暂停", "travel=0;markWaypointProgress();refreshSearch();\n message('已暂停")
    rep('actor.y=actor.cell.y;if(storyStep())return;', 'actor.y=actor.cell.y;markWaypointProgress();if(storyStep())return;')
    # Insert runtime helpers before the existing clearRun function.
    rep('function clearRun(){', r'''
function markWaypointProgress(){
 while(completedWaypoints<scene.waypoints.length&&same(actor.cell,scene.waypoints[completedWaypoints])){
  completedWaypoints++;message('已到达途经点，接下来前往终点。');updateRouteUI();
 }
}
function updateRouteUI(){
 const running=mode==='walking';
 const waypoint=$('waypointTool');waypoint.disabled=running;waypoint.classList.toggle('active',tool==='waypoint');
 for(const [id,kind]of [['startTool','start'],['waypointTool','waypoint'],['goalTool','goal']])$(id).setAttribute('aria-pressed',String(tool===kind));
 const label=p=>p?'已设置':'待设置';
 $('routeSummary').textContent='起点 '+label(scene.start)+' → 途经点 '+(scene.waypoints.length?(completedWaypoints?'已到达':'已设置'):'待设置')+' → 终点 '+label(scene.goal);
 document.querySelectorAll('[data-material]').forEach(b=>{b.disabled=running;b.classList.toggle('active',b.dataset.material===landMaterial);b.setAttribute('aria-pressed',String(b.dataset.material===landMaterial));});
}
function clearRun(){''')
    # Marker dragging, including bridges or other traversable objects beneath a marker.
    rep("&&!same(p,scene.start)&&!same(p,scene.goal)", "&&!markerKindAt(p)")
    rep("kind=o?'object':same(p,scene.start)?'start':same(p,scene.goal)?'goal':null", "kind=markerKindAt(p)||(o?'object':null)")
    rep("single:['gate','start','goal']", "single:['gate','start','waypoint','goal']")
    rep("tool==='goal'?'终点已更新。'", "tool==='waypoint'?'途经点已更新。':tool==='goal'?'终点已更新。'")
    rep("g.moveKind==='start'||g.moveKind==='goal'", "['start','waypoint','goal'].includes(g.moveKind)")
    rep("g.moveKind==='start'?'起点已移动。':'终点已移动。'", "g.moveKind==='start'?'起点已移动。':g.moveKind==='waypoint'?'途经点已移动。':'终点已移动。'")
    rep("else if(scene.objects[key(p)]||same(p,scene.start)||same(p,scene.goal)", "else if(scene.objects[key(p)]||markerKindAt(p)")
    # The supplied irregular map retains its coast, mountains, outer land and vegetation.
    # Only a deliberately new blank-ocean scene suppresses that template decoration.
    rep('if(inside(x,y))return scene.terrain[y*COLS+x]===0;', 'if(inside(x,y))return scene.terrain[y*COLS+x]===0;\n if(scene.oceanOnly)return false;')
    rep("focus=point(mode==='walking'||mode==='paused'?actor:(selected||scene.goal))", "focus=point(mode==='walking'||mode==='paused'?actor:(selected||scene.goal||scene.start||{x:11,y:7}))")
    rep("items.push({depth:depthAt(scene.start)", "if(scene.start)items.push({depth:depthAt(scene.start)")
    rep("items.push({depth:depthAt(scene.goal)", "scene.waypoints.forEach((p,i)=>items.push({depth:depthAt(p)-.05,order:-1,draw:()=>marker(p,'经',completedWaypoints>i?'#a2d9bb':'#acbbff')}));\n if(scene.goal)items.push({depth:depthAt(scene.goal)")
    rep('items.push({depth:depthAt(actor)', 'if(scene.start)items.push({depth:depthAt(actor)')
    rep(' const mountains=[[', ' if(!scene.oceanOnly){\n const mountains=[[')
    rep(' if(selected&&scene.objects[key(selected)])items.push', ' }\n if(selected&&scene.objects[key(selected)])items.push')
    # Material appearance participates in the surface cache key.
    rep("scene.terrain.join('')", "scene.terrain.join('')+'|'+scene.materials.join(',')", 2)
    rep(' for(let i=0;i<650;i++){', r'''
 const materialColors={grass:['#94b77b','#557e5638'],sand:['#dfc794','#ac926744'],soil:['#ad896c','#75583d44'],stone:['#a9b3b5','#697e8544']};
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const material=scene.materials[y*COLS+x];if(!material||!isLand(x,y))continue;
  const [base,detail]=materialColors[material];g.fillStyle=base;g.fillRect(x*TILE-.3,y*TILE-.3,TILE+.6,TILE+.6);
  for(let k=0;k<9;k++){const px=(x+hash(x,y,k)*.9+.05)*TILE,py=(y+hash(y,x,k+13)*.9+.05)*TILE;strokeLine(g,px,py,px+(material==='grass'?2:4),py+(material==='grass'?-5:1),detail,material==='stone'?1.5:1);}
 }
 for(let i=0;i<650;i++){''')
    rep("['sand','陆地','0','恢复为陆地；草地与沙地的外观随区域变化。会移除该格物件。']", "['sand','创建 / 涂绘陆地','0','海面上拖动创建陆地；已有陆地上涂绘更换材质，保留物件。上方可选择草地、沙地、泥土、石地。']")
    rep('移除物件；空水面恢复为沙地。也可以按住拖动擦除。', '移除物件；空陆地还原为海面。也可以按住拖动擦除。')
    rep("$('startTool').addEventListener", "$('waypointTool').addEventListener('click',()=>setTool('waypoint'));\n document.querySelectorAll('[data-material]').forEach(b=>b.addEventListener('click',()=>{if(mode==='walking')return;landMaterial=b.dataset.material;setTool('sand');}));\n $('startTool').addEventListener")
    rep("'s':'start','g':'goal'", "'s':'start','w':'waypoint','g':'goal'")
    rep('空白沙盘已准备好。可以先铺一条河，再试着连接两边。撤销可恢复刚才的场景。', '空白沙盘是一片大海。先选择材质创建陆地，再分别设置起点、途经点和终点。撤销可恢复刚才的场景。')
    rep("loadScene(storyDemoScene(),'同行示例已载入：沿途有动物和人物，小门已打开。点击“开始同行”。')", "loadScene(demoScene(),'原版不规则沙盘已载入。先用“查看 / 移动”打开庭院小门，再沿起点 → 途经点 → 终点行走。')")
    rep('点击“开始同行”，沿着你摆放的风景走一段。动物和人物可以在左侧分类中添加。', '原版不规则沙盘已保留。先打开庭院小门，再预览起点 → 途经点 → 终点的路线。')
    return source
