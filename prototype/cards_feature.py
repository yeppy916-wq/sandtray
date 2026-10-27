from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent

def take_element(source, element_id):
    match = re.search(r'<([\w-]+)\b[^>]*\bid="' + re.escape(element_id) + r'"[^>]*>', source)
    if not match:
        raise ValueError("Missing element: " + element_id)
    tag, depth = match[1], 0
    for token in re.finditer(r'</?' + tag + r'\b[^>]*>', source[match.start():]):
        depth += -1 if token[0].startswith('</') else 1
        if depth == 0:
            end = match.start() + token.end()
            return source[match.start():end], source[:match.start()] + source[end:]
    raise ValueError("Unclosed element: " + element_id)


def augment_cards(source):
    source = source.replace('<body>', '<body class="cards-prototype">', 1)
    source = re.sub(r'<title>.*?</title>', '<title>一隅 · 自由沙盘</title>', source, count=1)
    source = source.replace('沙盘 · 同行</span>', '自由沙盘</span>', 1)
    source = source.replace("yiyu-sandtray-irregular-route-v2", "yiyu-sandtray-cards-experiment-v1")
    # The experiment has a separate save slot and starts with an open gate.
    source = source.replace('scene=demoScene(),tool=', 'scene=storyDemoScene(),tool=', 1)
    controls = {}
    for name in ['undoBtn', 'redoBtn', 'playBtn', 'pauseBtn', 'homeBtn']:
        controls[name], source = take_element(source, name)
    source = source.replace('<div class="world-menu-content">', '<div class="world-menu-content">' + controls['homeBtn'].replace('重新出发', '旅人回到起点'), 1)
    toolbar = '''
<div class="prototype-toolbar" id="prototypeToolbar">
 <div class="prototype-tools"><button class="button" id="libraryToggle" aria-expanded="false" aria-controls="cardLibrary">物件与地形</button><button class="button" id="routePanelToggle" aria-pressed="false" aria-controls="board">查看路线</button></div>
 <div class="prototype-actions">''' + controls['undoBtn'] + controls['redoBtn'] + '<span class="toolbar-divider" aria-hidden="true"></span>' + controls['playBtn'] + controls['pauseBtn'] + '''</div>
</div>'''
    source = source.replace('</header>', '</header>' + toolbar, 1)
    source = source.replace('<aside class="tools"', '<aside id="cardLibrary" class="tools"', 1)
    source = source.replace('<section class="journey-panel"', '<section id="cardRoutePanel" class="journey-panel"', 1)
    source = source.replace('我的一方天地</h2>', '我的一隅</h2>', 1)
    source = source.replace("idle:'等待出发'", "idle:'自由摆放'", 1)
    dock = '''
<section class="card-dock" id="cardDock" aria-label="表达卡牌">
 <div class="card-effects" id="cardEffects" aria-label="当前生效的环境"></div>
 <div class="card-controls">
 <div class="card-tabs" id="cardTabs" role="group" aria-label="卡牌分类">
  <button type="button" data-card-category="sky" class="active" aria-pressed="true">天色 <span class="card-category-count">8</span></button>
  <button type="button" data-card-category="company" aria-pressed="false">相处 <span class="card-category-count">6</span></button>
  <button type="button" data-card-category="journey" aria-pressed="false">旅程 <span class="card-category-count">6</span></button>
 </div>
 <div class="card-pager" aria-label="切换当前分类的卡牌"><button id="cardPrev" type="button" aria-label="上一组卡牌">‹</button><span id="cardPage" aria-live="polite">1 / 2</span><button id="cardNext" type="button" aria-label="下一组卡牌">›</button></div>
 <button class="card-toggle" id="cardToggle" type="button" aria-expanded="false" aria-controls="cardHand">展开手牌</button>
 </div>
 <div class="card-selection" id="cardSelection" hidden>
  <div class="card-selection-copy"><strong id="cardSelectionName"></strong><p id="cardSelectionHelp"></p></div>
  <div class="card-selection-actions"><button class="button primary" type="button" id="cardApply">使用这张</button><button class="button" type="button" id="cardCancel">放回</button></div>
 </div>
 <div class="card-hand" id="cardHand" role="group" aria-label="可选择的卡牌"></div>
 <p class="card-hint" id="cardHint" role="status" aria-live="polite">移到下方，看看手里的可能。</p>
</section>
'''
    source = source.replace('<dialog class="journal-dialog"', dock + '<dialog class="journal-dialog"', 1)
    # Fixed preview/effect controls must not be children of the transformed hand.
    floating = []
    for name in ['cardEffects', 'cardSelection']:
        markup, source = take_element(source, name)
        floating.append(markup)
    source = source.replace('<section class="card-dock"', '\n'.join(floating) + '\n<section class="card-dock"', 1)
    old_help, _ = take_element(source, 'help')
    help_intro = '''<dialog id="help"><div class="dialog-top"><h2>把一个想法，放进这里</h2><button class="button" id="closeHelp">关闭 ×</button></div><p>底部有天色、相处、旅程三组卡，共 20 张。移入手牌展开，按住卡片拖向地图，松手保留变化；在地图外松手或按 Esc 取消。每次显示四张，箭头切换同类的另一组。也可以点击卡牌、选择位置后确认。</p><p>光线、天气、风与秋色可以组合；同一通道的新效果替换旧效果。点击生效标签旁的 × 可恢复该通道的原貌，不必寻找“恢复”卡。</p><p>相处卡只调整已有动物或人物的位置与同行方式，不会新增角色。拖到角色上，箭头与半透明身影会显示它们准备走向哪里；不覆盖已有物件，不穿越障碍。</p><p>建造和资产摆放在上方“物件与地形”中操作；门可直接点击开关。地图空白处拖动平移，滚轮缩放。“查看路线”只切换路线显示。</p><p>旅程卡可以设置起点、一个必经点与终点，也可以换个方向。点击开始即可同行；默认轻声描述风景，不再重复询问节奏。取消局部预览会恢复原来的行走，确认调整后可继续同行。没有通路时旅人停下，你也可以只摆沙盘。</p><p>卡牌都可重复使用，每一步可撤销、重做。天气目前是视觉效果；保存基础画面不包含天气遮罩。沿途记录可自行导出，场景自动保存在本机。</p></dialog>'''
    source = source.replace(old_help, help_intro, 1)
    source = source.replace('保存图片</button>', '保存基础画面</button>', 1)
    source = source.replace('</head>', '<style id="cards-style">\n' + (ROOT / 'cards-v1.css').read_text(encoding='utf-8') + '\n</style>\n</head>', 1)
    insertion = 'for(const [id,label,shortcut] of toolDefs){'
    assert source.count(insertion) == 1
    source = source.replace(insertion, (ROOT / 'card-actions.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'cards-v1.js').read_text(encoding='utf-8') + '\n' + insertion, 1)
    source = source.replace("if(typeof uiRefresh==='function')uiRefresh();", "if(typeof uiRefresh==='function')uiRefresh();\n if(typeof cardRefresh==='function')cardRefresh();", 1)
    source = source.replace('draw(time);uiPositionTalk();lastDraw=time;', 'draw(time);cardDrawPreview(time);uiPositionTalk();lastDraw=time;', 1)
    # Global ambience commits preserve the current walk; spatial commits use the original pause rules.
    source = source.replace('function commit(before,text){', 'function commit(before,text,preserveJourney=false){', 1)
    source = source.replace("if(mode!=='paused')clearRun();else storyReconcile();refreshSearch();save();if(text)message(text);updateUI();return true;", "if(!preserveJourney){if(mode!=='paused')clearRun();else storyReconcile();}refreshSearch();save();if(text)message(text);updateUI();return true;", 1)
    source = source.replace("function historyStep(back){\n if(mode==='walking')return;", "function historyStep(back){\n if(mode==='walking')return;cardCancel(false,false);cardClearEffects();", 1)
    source = source.replace("function loadScene(next,label){if(mode==='walking')return;", "function loadScene(next,label){if(mode==='walking')return;cardCancel(false,false);cardClearEffects();", 1)
    source = source.replace("if(dirty||mode==='walking'||time-lastDraw>110)", "if(dirty||mode==='walking'||cardNeedsFrame(time)||time-lastDraw>110)", 1)
    source = source.replace('function draw(time){', 'function draw(time){\n cardRenderClock=time;', 1)
    source = source.replace('const c=point(p),seed=hash(p.x,p.y);ctx.save();ctx.globalAlpha=alpha;', 'const c=point(p),seed=hash(p.x,p.y);ctx.save();ctx.globalAlpha=alpha;\n const birth=cardObjectBirth(o,p),moving=cardBirths.get(key(p));if(birth<1&&moving?.from&&moving.object===o){const from=point(moving.from);ctx.translate((from.x-c.x)*(1-birth),(from.y-c.y)*(1-birth));ctx.globalAlpha*=.6+.4*birth;}', 1)
    source = source.replace('initNarrative();initInterface();refreshSearch();', 'initNarrative();initInterface();initCardPrototype();refreshSearch();', 1)
    source = source.replace("else message('点开庭院小门，开始这一段路。也可以重新安排三个路线点。');", "else message('自由摆放，或拖一张卡到地图上。');", 1)
    # Pace selection lives in cards; starting a walk no longer repeats an introduction dialog.
    intro_begin = source.index('function storyStart(){')
    intro_open = source.index(" storyOpen({kind:'intro'", intro_begin)
    intro_end = source.index('function storyAfterPlay(', intro_open)
    source = source[:intro_open] + ' return false;\n}\n' + source[intro_end:]
    source = source.replace("else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();cameraUI();}", "else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){const wasFar=camera.zoom/camera.fit<1.2;camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();if(wasFar)setView('far',false);else cameraUI();}", 1)
    source = source.replace('(W-72)/(b.right-b.left),(H-190)/(b.bottom-b.top)', '(W-44)/(b.right-b.left),(H-96)/(b.bottom-b.top)', 1)
    return source

