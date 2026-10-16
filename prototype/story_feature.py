"""Add the authored companion layer to the existing offline prototype."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def augment_story(source):
    def rep(old, new, count=1):
        nonlocal source
        found = source.count(old)
        if found < count:
            raise ValueError(f'Story patch missing: {old[:100]!r} (found {found})')
        source = source.replace(old, new, count)

    core = """
const NPC_TYPES=['dog','deer','wolf','cat','scholar','elder','woman','man','child'];
const isMeetingGoal=(s,p)=>['bench',...NPC_TYPES].includes(s.objects[key(p)]?.type);
function storyDemoScene(){
 const s=demoScene();s.objects[6*COLS+14].open=true;
 for(const [type,x,y]of [['dog',5,10],['cat',8,8],['deer',9,6],['wolf',12,8],['scholar',13,5],['elder',16,6]])s.objects[y*COLS+x]={type};
 return s;
}
"""
    rep('function emptyScene()', core+'\nfunction emptyScene()')
    rep("const isBench=s.objects[key(s.goal)]?.type==='bench';", "const isBench=isMeetingGoal(s,s.goal);")
    rep("const types=['bridge','fence','gate','tree','stone','bench','house','flower'];", "const types=['bridge','fence','gate','tree','stone','bench','house','flower',...NPC_TYPES];")
    rep("(canEnter(s,s.goal)||s.objects[key(s.goal)]?.type==='bench')", "(canEnter(s,s.goal)||isMeetingGoal(s,s.goal))")
    rep('emptyScene,demoScene,canEnter', 'emptyScene,demoScene,storyDemoScene,NPC_TYPES,canEnter')
    rep("let scene=demoScene(),tool=", "let scene=storyDemoScene(),tool=")
    rep("const icons={", """const icons={
 dog:'<path d="m4 9-2-5 6 2h8l6-2-2 5v8l-6 4h-4l-6-4zM8 12h.01M16 12h.01M10 16h4l-2 2z"/>',
 deer:'<path d="m8 8-3-4V1M5 4 2 2m14 6 3-4V1m0 3 3-2M8 8l-4 1 3 4 1 6 4 3 4-3 1-6 3-4-4-1zM9 14h.01M15 14h.01"/>',
 wolf:'<path d="m4 12 1-9 6 6h2l6-6 1 9-3 7-5 3-5-3zM8 13h.01M16 13h.01m-6 4 2 2 2-2"/>',
 cat:'<path d="M4 13V3l7 5h2l7-5v10c0 6-4 8-8 8s-8-2-8-8M8 12h.01M16 12h.01M10 16h4M6 16H1m17 0h5"/>',
 scholar:'<circle cx="12" cy="6" r="4"/><path d="M4 21v-7l8 2 8-2v7l-8 2zM12 16v7M6 11l-2 3m14-3 2 3"/>',
 elder:'<circle cx="11" cy="6" r="4"/><path d="M4 21 7 12h8l3 9M8 6h6M9 9l2 3 2-3m7 13V12q0-3 3-2"/>',
 woman:'<circle cx="12" cy="6" r="4"/><path d="m8 12-4 8h16l-4-8M9 20v3m6-3v3M8 4 6 12m10-8 2 8"/>',
 man:'<circle cx="12" cy="6" r="4"/><path d="m4 18 3-6h10l3 6M9 12v10m6-10v10M8 4h8"/>',
 child:'<circle cx="12" cy="8" r="4"/><path d="m6 19 2-5h8l2 5M10 17v6m4-6v6M7 5l5-3 5 3"/>',""")
    newtools = """
['dog','小狗','','放置小狗。旅人走近时会触发预写的相遇片段，也可以把终点设在它身上。'],
['deer','鹿','','放置鹿。角色保留在你安排的位置，故事含义由你决定。'],
['wolf','灰狼','','放置灰狼。不会自动设为敌人，也不预设它的心理含义。'],
['cat','小猫','','放置小猫。旅人经过附近时，会有一个可以回应或跳过的小片段。'],
['scholar','学者','','放置带着书的学者。靠近时可以围绕眼前的道路和场景交谈。'],
['elder','长者','','放置长者。相遇会邀请你描述自己的安排，不替你解释。'],
['woman','青年女性','','放置青年女性。人物的身份和关系可以由你在回应中补充。'],
['man','青年男性','','放置青年男性。人物的身份和关系可以由你在回应中补充。'],
['child','小孩','','放置小孩。相遇片段会邀请你留意细小的场景。'],
"""
    rep("['erase','橡皮','E'", newtools+"['erase','橡皮','E'")
    rep("stone:'石头',house:'房屋',flower:'花丛'};", "stone:'石头',house:'房屋',flower:'花丛',dog:'小狗',deer:'鹿',wolf:'灰狼',cat:'小猫',scholar:'学者',elder:'长者',woman:'青年女性',man:'青年男性',child:'小孩'};")
    rep("function clearRun(){mode=", "function clearRun(){storyReset();mode=")
    rep("mode==='paused'?'继续试走':mode==='arrived'?'再走一次':'开始试走'", "mode==='paused'?'继续同行':mode==='arrived'?'再走一次':'开始同行'")
    rep("idle:'等待试走'", "idle:'等待出发'")
    rep("'点击可通行的空地或长椅设置终点。'", "'点击空地、长椅或动物 / 人物设置终点；遇见角色时会停在其旁边。'")
    rep("if(mode!=='paused')clearRun();refreshSearch();save();", "if(mode!=='paused')clearRun();else storyReconcile();refreshSearch();save();")
    rep("!canEnter(scene,p)&&old?.type!=='bench'", "!canEnter(scene,p)&&!isMeetingGoal(scene,p)")
    rep("'终点请选择可通行的空地或长椅。'", "'终点请选择空地、长椅或动物 / 人物。'")
    rep("function play(){\n if(mode==='walking')return;", "function play(){\n if(mode==='walking')return;\n if(storyState.active)storyClose(false);const fresh=mode!=='paused';")
    rep("if(route.length===1)beginArrival();", "if(storyAfterPlay(fresh))return;\n if(route.length===1)beginArrival();")
    rep("function arrive(){mode='arrived';", "function arrive(){mode='arrived';")
    rep("function update(dt){", "function update(dt){")
    # Only arrival needs this tail hook; match its complete function tail.
    rep("'旅人已到达你指定的位置。可以保留这个安排，或改动场景再试一次。');updateUI();}", "'旅人已到达你指定的位置。可以保留这个安排，或改动场景再试一次。');updateUI();storyArrival();}")
    rep("while(travel>=1&&runIndex<route.length-1){travel--;runIndex++;actor.cell={...route[runIndex]};}", "while(travel>=1&&runIndex<route.length-1){travel--;runIndex++;actor.cell={...route[runIndex]};actor.x=actor.cell.x;actor.y=actor.cell.y;if(storyStep())return;}")
    rep("else if(o.type==='flower')flowerSprite(c,seed);", "else if(o.type==='flower')flowerSprite(c,seed);\n else if(NPC_TYPES.includes(o.type))npcSprite(c,o.type);")
    rep("let s=sizes[o.type]||[25,45,10];", "let s=NPC_TYPES.includes(o.type)?[o.type==='deer'?31:30,o.type==='deer'?78:70,8]:sizes[o.type]||[25,45,10];")
    rep("items.forEach(item=>item.draw());", "items.forEach(item=>item.draw());drawStoryMarker(time);")
    rep("lastTime=time;update(dt);", "lastTime=time;update(dt);storyTick(dt);")
    rep("if($('help').open||e.target.matches('input,textarea,select'))return;", "if($('help').open||$('journalDialog').open||e.target.matches('input,textarea,select,button'))return;", 2)
    rep("if(k==='r'){rotate();return;}if(k==='escape'){setTool('select');return;}", "if(k==='r'){rotate();return;}if(k==='escape'){if(storyState.active)storyClose(false);else setTool('select');return;}")
    rep("loadScene(demoScene(),'示例已载入：点开庭院左侧的小门，让旅人走到长椅。')", "loadScene(storyDemoScene(),'同行示例已载入：沿途有动物和人物，小门已打开。点击“开始同行”。')")
    # Embedded data keeps the delivered HTML usable with file:// and offline.
    data = json.loads((ROOT/'story-data.json').read_text(encoding='utf8'))
    feature = 'const STORY_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
    feature += (ROOT/'narrative-sprites.js').read_text(encoding='utf8')+'\n'
    feature += (ROOT/'narrative.js').read_text(encoding='utf8')+'\n'
    rep('for(const [id,label,shortcut] of toolDefs){', feature+'\nfor(const [id,label,shortcut] of toolDefs){')
    rep("b.title=label+' · '+shortcut;", "b.title=label+(shortcut?' · '+shortcut:'');if(NPC_TYPES.includes(id))b.className+=' tool-npc';")
    rep("refreshSearch();save();updateUI();if(restored)", "initNarrative();refreshSearch();save();updateUI();if(restored)")
    rep("if(restored)message('上次的沙盘已恢复。滚轮缩放、右键平移；想看新版场景，可点“示例沙盘”。');", "if(restored)message('上次的沙盘已恢复。想体验动物与人物的沿途故事，请点击右上角“同行示例”。');else message('点击“开始同行”，沿着你摆放的风景走一段。动物和人物可以在左侧分类中添加。');")
    rep('</head>', '<style>'+(ROOT/'story-style.css').read_text(encoding='utf8')+'</style>\n</head>')
    rep('SOFT-CEL DIORAMA / 0.5', 'SCRIPTED COMPANION / 0.6')
    rep('id="demoBtn">示例沙盘', 'id="demoBtn">同行示例')
    rep('<button class="button subtle" id="helpBtn">', '<button class="button" id="journalBtn">沿途记录 <span class="journal-count" id="journalCount">0</span></button><button class="button subtle" id="helpBtn">')
    rep('<p class="section-label">地形与物件</p>', '<p class="section-label">构建你的沿途风景</p><div class="palette-tabs" id="paletteTabs" aria-label="物件分类"><button data-category="world" class="active">环境</button><button data-category="animals">动物</button><button data-category="people">人物</button></div>')
    rep('<div class="view-controls">', '<div class="view-controls"><label class="story-toggle"><input type="checkbox" id="storyToggle" checked>同行叙事</label>')
    rep('<span>开始试走</span>', '<span>开始同行</span>')
    rep('<button class="button" id="previewBtn">', '<button class="button" id="talkBtn">此刻聊聊</button><button class="button" id="previewBtn">')
    rep('<p class="scene-legend">', '<div class="divider"></div><p class="section-label">同行节奏</p><button class="button pace-button" id="paceBtn">相遇时停留</button><p class="tool-note">靠近角色时触发预写片段。<br>可以回应、留白，或安静同行。</p><p class="scene-legend">')
    panel = """
<div class="story-caption" id="storyCaption" role="status" hidden><strong id="storyCaptionTitle"></strong><span id="storyCaptionText"></span></div>
<section class="story-dock" id="storyDock" aria-label="同行者对话" hidden>
 <div class="story-top"><span class="companion-avatar" aria-hidden="true">◌</span><div><p class="story-eyebrow">同行者 · 预写片段</p><h3 id="storyTitle">沿途的一次相遇</h3></div><button class="story-dismiss" id="storyDismiss" aria-label="收起对话，留在原地" title="收起，留在这里">×</button></div>
 <div class="story-body" id="storyBody"><p class="story-place" id="storyPlace"></p><p class="story-narration" id="storyNarration"></p><p class="story-prompt" id="storyPrompt"></p><div class="story-choices" id="storyChoices"></div><p class="story-reply" id="storyReply" hidden></p><div id="storyNoteWrap"><label class="story-note-label" for="storyNote">我想留下的话 · 可不填</label><textarea class="story-note" id="storyNote" maxlength="1200" rows="2" placeholder="这里对你意味着什么，或只是此刻注意到的一件小事……"></textarea><p class="story-small">文字仅保留在本次打开的页面中；需要留存时，可在“沿途记录”导出。</p></div></div>
 <div class="story-foot"><button class="button subtle" id="storyReveal">文字显全</button><div class="story-secondary-actions"><button class="button" id="storyStay">停在这里</button><button class="button primary" id="storyContinue">继续走</button></div></div>
</section>
"""
    rep('<div class="camera-panel"', panel+'\n<div class="camera-panel"')
    journal = """
<dialog class="journal-dialog" id="journalDialog"><div class="dialog-top"><h2>我的沿途记录</h2><button class="button" id="closeJournal">关闭 ×</button></div><p class="journal-intro">这里记下经过的片段、你的选择和留给自己的话。</p><div class="journal-actions"><button class="button" id="exportJournal">导出文字记录</button><button class="button subtle" id="clearJournal">清空本页记录</button></div><div class="journal-list" id="journalList"></div><p class="journal-hint">场景布局仍保存在本机。对话与感受只保留在当前页面内，刷新或关闭前请自行导出；不上传、不自动分析。</p></dialog>
"""
    rep('<dialog id="help">', journal+'\n<dialog id="help">')
    rep('<ol><li>使用“查看 / 移动”', '<p>本版新增“同行者”：使用环境、动物、人物三个分类摆置场景，点击“开始同行”。靠近动物和人物时，会触发预写片段与三个回应选项。可以跳过回应，或留一句话后继续。选择“轻声描述”只显示沿途字幕；“安静同行”不自动弹出文字；“此刻聊聊”可主动停下来。</p><p>动物和人物可作为终点，旅人会走到角色旁边。自动相遇有三个行走格的间隔，每次旅程最多六次，避免文字过密。故事只依据实际放置的物件触发，不会自动分析物件的心理含义。所有片段使用本地规则与预写对话，不接入 AI。</p><ol><li>使用“查看 / 移动”')
    rep('终点可以是可通行的空地，也可以是长椅。', '终点可以是空地、长椅，也可以是动物或人物；遇见角色时会停在其旁边。')
    source = source.replace('继续试走', '继续同行').replace('开始试走', '开始同行')
    return source
