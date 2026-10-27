"""Reorganize interface controls without changing the scene, artwork or navigation."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def augment_ui(source):
    def element(needle):
        at = source.index(needle)
        begin = source.rfind('<', 0, at + 1)
        tag = re.match(r'<([\w-]+)\b', source[begin:])[1]
        depth = 0
        for match in re.finditer(r'</?' + re.escape(tag) + r'\b[^>]*>', source[begin:]):
            depth += -1 if match[0].startswith('</') else 1
            if depth == 0:
                return source[begin:begin + match.end()]
        raise ValueError('Unclosed UI element: ' + needle)

    def by_id(name):
        return element('id="' + name + '"')

    def rep(old, new):
        nonlocal source
        if old not in source:
            raise ValueError('UI patch missing: ' + old[:100])
        source = source.replace(old, new, 1)

    # Retain every existing control ID so the underlying game rules remain intact.
    tabs = by_id('paletteTabs')
    palette = by_id('palette')
    materials = element('class="land-materials"')
    edit_note = by_id('toolNote')
    bridge = by_id('bridgeOptions')
    selection = by_id('selection')
    markers = element('class="marker-buttons"')
    summary = by_id('routeSummary')
    adaptive = element('class="route-explainer"')
    story = by_id('storyDock')
    caption = by_id('storyCaption')
    canvas = element('class="board-scroll"')
    camera = element('class="camera-panel"')
    view = element('class="view-controls"')
    story_toggle = element('class="story-toggle"')
    view = view.replace(story_toggle, '')
    camera = camera.replace('<p class="camera-tip">滚轮缩放 · 右键平移<br>三个观察角度 · 保持清晰构图</p>', '')
    camera = camera.replace('<div class="camera-panel" aria-label="摄像机控制">', '<div class="camera-content" aria-label="摄像机控制">', 1)
    pace = '<label class="pace-label" for="paceBtn">同行节奏</label><select id="paceBtn" aria-label="同行节奏"><option value="guided">相遇时停留</option><option value="scenery">轻声描述</option><option value="quiet">安静同行</option></select>'
    note = by_id('storyNoteWrap')
    note_markup = note.replace('<div id="storyNoteWrap">', '<details id="storyNoteWrap"><summary>留一句话 · 可选</summary>', 1)[:-6] + '</details>'
    story = story.replace(note, note_markup)
    story = story.replace('同行者 · 预写片段', '此刻，在旅人身旁')
    story = story.replace('文字显全', '显示全文')
    prose = f'''<div class="story-body" id="storyBody"><div class="story-prose">{by_id('storyPlace')}{by_id('storyNarration')}{by_id('storyPrompt')}{by_id('storyReply')}{note_markup}</div>{by_id('storyChoices')}</div>'''
    story = story.replace(by_id('storyBody').replace(note, note_markup), prose, 1)
    talk = by_id('talkBtn').replace('class="button"', 'class="talk-anchor"')
    talk = talk.replace('此刻聊聊', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H5l-3 3v-7a8 8 0 1 1 18-4Z"/><path d="M7 10h8M7 14h5"/></svg><span>聊聊</span>')
    play = by_id('playBtn')
    pause = by_id('pauseBtn')
    home = by_id('homeBtn').replace('回到起点', '重新出发')
    preview = by_id('previewBtn')
    speed = element('class="speed"')
    feedback = by_id('feedback')
    help_button = by_id('helpBtn').replace('怎么玩', '玩法说明')
    demo = by_id('demoBtn').replace('同行示例', '载入示例')
    blank = by_id('blankBtn')
    export = by_id('exportBtn')
    journal = by_id('journalBtn')
    undo = by_id('undoBtn')
    redo = by_id('redoBtn')

    header = f'''<header class="header">
 <div class="brand"><span class="brand-mark" aria-hidden="true">隅</span><strong>一隅</strong><span class="header-note">沙盘 · 同行</span></div>
 <div class="header-actions">{help_button}<details class="world-menu" id="worldMenu"><summary>沙盘选项 <span aria-hidden="true">⌄</span></summary><div class="world-menu-content">{demo}{blank}{export}<p>场景自动保存在当前浏览器</p></div></details></div>
</header>'''
    workspace = f'''<main class="workspace">
 <aside class="tools" aria-label="物件库">
  <div class="library-heading"><p class="ui-eyebrow">摆放</p><h2>为这里添一件</h2><p>选择物件，再点击沙盘放置。</p></div>
  {tabs}
  <div class="library-content">
   <section class="terrain-section" id="terrainSection" aria-label="地形编辑"><h3>地形</h3><div class="terrain-tools" id="terrainTools"></div>{materials}</section>
   <section class="asset-section" aria-label="场景物件"><h3 id="assetHeading">自然与建筑</h3>{palette}</section>
  </div>
  <div class="library-editor" aria-label="物件编辑"><div class="edit-tools" id="editTools"></div>{bridge}{edit_note}<div class="edit-history">{undo}{redo}</div>{selection}</div>
 </aside>
 <div class="play-space">
  <section class="board-card" aria-label="沙盘场景">
   <div class="board-head"><div class="board-title"><h2>我的一方天地</h2>{by_id('statusBadge')}</div></div>
   {canvas}
   <details class="camera-panel" id="cameraMenu"><summary>视角与显示 <span aria-hidden="true">⌄</span></summary><div class="camera-settings">{camera}{view}<p class="camera-hint">滚轮缩放 · 右键拖动平移</p></div></details>
  </section>
  <section class="narrative-rail" id="narrativeRail" aria-label="沿途叙述">
   <div class="narrative-bar"><div class="narrative-copy"><p class="narrative-hint">沿途的故事，慢慢发生。</p>{caption}</div><div class="narrative-actions">{talk}<div class="companion-controls" aria-label="沙盘同行">{journal}<details class="companion-settings" id="companionSettings"><summary>同行设置 <span aria-hidden="true">⌄</span></summary><div class="companion-settings-content">{story_toggle}{pace}</div></details></div></div></div>
   {story}
  </section>
  <section class="journey-panel" aria-label="旅程与路线">
   <div class="route-plan"><div class="journey-label"><p class="ui-eyebrow">路线</p><h2>安排这一段路</h2></div><div class="route-fields">{markers}{summary}</div></div>
   <div class="journey-actions"><div class="journey-play">{play}{pause}{preview}{home}</div>{speed}</div>
   {feedback}
  </section>
 </div>
</main>'''
    rep(element('class="header"'), header)
    rep(element('class="workspace"'), workspace)
    help_markup = by_id('help')
    rep(help_markup, help_markup[:-9] + adaptive + '</dialog>')
    rep('</head>', '<style>' + (ROOT/'ui-style.css').read_text(encoding='utf8') + '</style></head>')
    # Only button placement, interface state and dialogue styling are changed here.
    rep("$('palette').appendChild(b)", "(id==='select'||id==='erase'?$('editTools'):id==='sand'||id==='water'?$('terrainTools'):$('palette')).appendChild(b)")
    rep("function updateUI(){\n const isRun=", "function updateUI(){\n if(typeof uiRefresh==='function')uiRefresh();\n const isRun=")
    rep("draw(time);lastDraw=time;", "draw(time);uiPositionTalk();lastDraw=time;")
    rep("$('paceBtn').textContent=labels[storyState.pace];", "$('paceBtn').value=storyState.pace;")
    rep("$('storyBody').scrollTop=0;", "$('storyBody').scrollTop=0;document.querySelector('.story-prose').scrollTop=0;$('storyChoices').scrollTop=0;$('storyNoteWrap').open=false;")
    rep("$('paceBtn').addEventListener('click',()=>{const list=['guided','scenery','quiet'];storyState.pace=list[(list.indexOf(storyState.pace)+1)%3];storyUpdatePace();toast('同行节奏：'+$('paceBtn').textContent);});", "$('paceBtn').addEventListener('change',e=>{storyState.pace=e.target.value;storyUpdatePace();toast('同行节奏已更新。');});")
    rep("for(const [id,label,shortcut] of toolDefs){", (ROOT/'ui.js').read_text(encoding='utf8') + '\nfor(const [id,label,shortcut] of toolDefs){')
    rep('initNarrative();refreshSearch();', 'initNarrative();initInterface();refreshSearch();')
    # Preserve shortcut handling after the library has been divided into groups.
    rep("['sand','创建 / 涂绘陆地','0'", "['sand','绘制陆地','0'")
    source = source.replace('详见左侧说明', '详见玩法说明')
    source = source.replace('原版不规则沙盘已保留。先打开庭院小门，再预览起点 → 途经点 → 终点的路线。', '点开庭院小门，开始这一段路。也可以重新安排三个路线点。')
    source = source.replace('上次的沙盘已恢复。想体验动物与人物的沿途故事，请点击右上角“同行示例”。', '上次的沙盘已恢复。可以继续摆放，或在“沙盘选项”中载入示例。')
    source = source.replace('原版不规则沙盘已载入。先用“查看 / 移动”打开庭院小门，再沿起点 → 途经点 → 终点行走。', '示例已载入。点开庭院小门，再按起点 → 途经点 → 终点行走。')
    source = source.replace("a.location?'停在这处相遇旁':'此刻所在的地方'", "a.kind==='encounter'?'停在这处相遇旁':'旅人此刻所在的地方'")
    source = source.replace('IRREGULAR SANDBOX / 0.7', 'IRREGULAR SANDBOX / 0.8.1')
    source = source.replace('此刻，在旅人身旁', '沿途 · 同行')
    return source
