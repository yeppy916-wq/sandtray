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
    source = re.sub(r'<title>.*?</title>', '<title>一隅 · 卡牌沙盘 · 拖拽方案</title>', source, count=1)
    source = source.replace('沙盘 · 同行</span>', '沙盘 · 拖拽表达</span>', 1)
    source = source.replace("yiyu-sandtray-irregular-route-v2", "yiyu-sandtray-cards-experiment-v1")
    # The experiment has a separate save slot and starts with an open gate.
    source = source.replace('scene=demoScene(),tool=', 'scene=storyDemoScene(),tool=', 1)
    controls = {}
    for name in ['undoBtn', 'redoBtn', 'playBtn', 'pauseBtn']:
        controls[name], source = take_element(source, name)
    toolbar = '''
<div class="prototype-toolbar" id="prototypeToolbar">
 <div class="prototype-tools"><button class="button" id="libraryToggle" aria-expanded="false" aria-controls="cardLibrary">＋ 摆件与地形</button><button class="button" id="routePanelToggle" aria-expanded="false" aria-controls="cardRoutePanel">安排路线</button><span class="prototype-version">拖拽方案 · 02</span></div>
 <div class="prototype-actions">''' + controls['undoBtn'] + controls['redoBtn'] + '<span class="toolbar-divider" aria-hidden="true"></span>' + controls['playBtn'] + controls['pauseBtn'] + '''</div>
</div>'''
    source = source.replace('</header>', '</header>' + toolbar, 1)
    source = source.replace('<aside class="tools"', '<aside id="cardLibrary" class="tools"', 1)
    source = source.replace('<section class="journey-panel"', '<section id="cardRoutePanel" class="journey-panel"', 1)
    source = source.replace('我的一方天地</h2>', '给这里，一个小小的改变。</h2>', 1)
    dock = '''
<section class="card-dock" id="cardDock" aria-label="表达卡牌">
 <div class="card-effects" id="cardEffects" aria-label="当前生效的环境"></div>
 <div class="card-tabs" id="cardTabs" role="group" aria-label="卡牌分类">
  <button type="button" data-card-category="sky" class="active" aria-pressed="true">天色</button>
  <button type="button" data-card-category="space" aria-pressed="false">空间</button>
  <button type="button" data-card-category="journey" aria-pressed="false">旅程</button>
 </div>
 <div class="card-selection" id="cardSelection" hidden>
  <div class="card-selection-copy"><strong id="cardSelectionName"></strong><p id="cardSelectionHelp"></p></div>
  <div class="card-selection-actions"><button class="button primary" type="button" id="cardApply">使用这张</button><button class="button" type="button" id="cardCancel">放回</button></div>
 </div>
 <div class="card-hand" id="cardHand" role="group" aria-label="可选择的卡牌"></div>
 <p class="card-hint" id="cardHint" role="status" aria-live="polite">移到下方，看看手里的可能。</p>
 <button class="card-toggle" id="cardToggle" type="button" aria-expanded="false" aria-controls="cardHand">展开手牌 <span aria-hidden="true">⌃</span></button>
</section>
'''
    source = source.replace('<dialog class="journal-dialog"', dock + '<dialog class="journal-dialog"', 1)
    # Fixed preview/effect controls must not be children of the transformed hand.
    floating = []
    for name in ['cardEffects', 'cardSelection']:
        markup, source = take_element(source, name)
        floating.append(markup)
    source = source.replace('<section class="card-dock"', '\n'.join(floating) + '\n<section class="card-dock"', 1)
    help_start = '<div class="dialog-top"><h2>给空间一个小小的变化</h2><button class="button" id="closeHelp">关闭 ×</button></div>'
    help_intro = '''<div class="dialog-top"><h2>把一个想法，放进这片天地</h2><button class="button" id="closeHelp">关闭 ×</button></div><p>鼠标移向底部，手牌会扇形展开。按住一张卡拖向地图：天色卡在地图附近预览整个世界；空间和路线卡会显示具体落点与范围。看到“松手”提示后放开，变化就会留下。</p><p>在地图外松手、拖回手牌区或按 Esc，就会取消。所有卡牌可重复使用，每次正式变化都能整步撤销、重做。触屏同样支持拖拽；也可点击卡牌，再点击位置并确认。</p><p>天色变化可以在行走时使用。空间与路线预览会暂时停住旅人；取消后恢复原来的行走，放下后可点击“继续同行”。黄昏、雾和雨暂为视觉效果；图片导出仅保存基础沙盘画面。以下是原有沙盘操作说明。</p>'''
    source = source.replace(help_start, help_intro, 1)
    source = source.replace('保存图片</button>', '保存基础画面</button>', 1)
    source = source.replace('</head>', '<style id="cards-style">\n' + (ROOT / 'cards-v1.css').read_text(encoding='utf-8') + '\n</style>\n</head>', 1)
    insertion = 'for(const [id,label,shortcut] of toolDefs){'
    assert source.count(insertion) == 1
    source = source.replace(insertion, (ROOT / 'cards-v1.js').read_text(encoding='utf-8') + '\n' + insertion, 1)
    source = source.replace("if(typeof uiRefresh==='function')uiRefresh();", "if(typeof uiRefresh==='function')uiRefresh();\n if(typeof cardRefresh==='function')cardRefresh();", 1)
    source = source.replace('draw(time);uiPositionTalk();lastDraw=time;', 'draw(time);cardDrawPreview(time);uiPositionTalk();lastDraw=time;', 1)
    # Global ambience commits preserve the current walk; spatial commits use the original pause rules.
    source = source.replace('function commit(before,text){', 'function commit(before,text,preserveJourney=false){', 1)
    source = source.replace("if(mode!=='paused')clearRun();else storyReconcile();refreshSearch();save();if(text)message(text);updateUI();return true;", "if(!preserveJourney){if(mode!=='paused')clearRun();else storyReconcile();}refreshSearch();save();if(text)message(text);updateUI();return true;", 1)
    source = source.replace("function historyStep(back){\n if(mode==='walking')return;", "function historyStep(back){\n if(mode==='walking')return;cardCancel(false,false);cardClearEffects();", 1)
    source = source.replace("function loadScene(next,label){if(mode==='walking')return;", "function loadScene(next,label){if(mode==='walking')return;cardCancel(false,false);cardClearEffects();", 1)
    source = source.replace("if(dirty||mode==='walking'||time-lastDraw>110)", "if(dirty||mode==='walking'||cardNeedsFrame(time)||time-lastDraw>110)", 1)
    source = source.replace('function draw(time){', 'function draw(time){\n cardRenderClock=time;', 1)
    source = source.replace('const c=point(p),seed=hash(p.x,p.y);ctx.save();ctx.globalAlpha=alpha;', 'const c=point(p),seed=hash(p.x,p.y);ctx.save();ctx.globalAlpha=alpha;\n const birth=cardObjectBirth(o,p);if(birth<1&&o.type!==\'gate\'){ctx.globalAlpha*=.2+.8*birth;ctx.translate(c.x,c.y);ctx.scale(.72+.28*birth,.15+.85*birth);ctx.translate(-c.x,-c.y);}', 1)
    source = source.replace("const b=o.open?{x:a.x*.16-a.y*.65,y:a.y*.18-9}:{x:a.x,y:a.y};", "const opening=o.open?cardObjectBirth(o,p):0,b={x:a.x+(a.x*.16-a.y*.65-a.x)*opening,y:a.y+(a.y*.18-9-a.y)*opening};", 1)
    source = source.replace('initNarrative();initInterface();refreshSearch();', 'initNarrative();initInterface();initCardPrototype();refreshSearch();', 1)
    source = source.replace("else message('点开庭院小门，开始这一段路。也可以重新安排三个路线点。');", "else message('先试一张天色卡，或到空间里添一片树。');", 1)
    source = source.replace("else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();cameraUI();}", "else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){const wasFar=camera.zoom/camera.fit<1.2;camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();if(wasFar)setView('far',false);else cameraUI();}", 1)
    source = source.replace('(W-72)/(b.right-b.left),(H-190)/(b.bottom-b.top)', '(W-44)/(b.right-b.left),(H-96)/(b.bottom-b.top)', 1)
    return source

