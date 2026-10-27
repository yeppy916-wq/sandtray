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
    source = source.replace('<title>一隅 · 岛屿沙盘</title>', '<title>一隅 · 卡牌沙盘初版</title>', 1)
    source = re.sub(r'<title>.*?</title>', '<title>一隅 · 卡牌沙盘初版</title>', source, count=1)
    source = source.replace('沙盘 · 同行</span>', '沙盘 · 卡牌试验</span>', 1)
    source = source.replace("yiyu-sandtray-irregular-route-v2", "yiyu-sandtray-cards-experiment-v1")
    # The experiment has a separate save slot and starts with an open gate.
    source = source.replace('scene=demoScene(),tool=', 'scene=storyDemoScene(),tool=', 1)
    controls = {}
    for name in ['undoBtn', 'redoBtn', 'playBtn', 'pauseBtn']:
        controls[name], source = take_element(source, name)
    toolbar = '''
<div class="prototype-toolbar" id="prototypeToolbar">
 <div class="prototype-tools"><button class="button" id="libraryToggle" aria-expanded="false" aria-controls="cardLibrary">＋ 摆件与地形</button><button class="button" id="routePanelToggle" aria-expanded="false" aria-controls="cardRoutePanel">安排路线</button><span class="prototype-version">形式试验 · 01</span></div>
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
    help_intro = '''<div class="dialog-top"><h2>从一张卡开始</h2><button class="button" id="closeHelp">关闭 ×</button></div><p>把鼠标移向底部中心，手牌会扇形展开。点击卡牌查看效果；天色卡会临时预览，空间和路线卡需要再点击沙盘上的位置，最后点“使用这张”保留。点“放回”或按 Esc 可取消。</p><p>天色、空间、旅程共有 12 张卡，可重复使用。使用后的变化可以撤销、重做。生效的天色和天气标签可以点击移除。“摆件与地形”保留原来的自由摆放；“安排路线”显示三点路线设置。</p><p>这一版用于体验卡牌的形式和操作，黄昏、雾和雨为视觉效果，暂未加入环境声音。图片导出保留沙盘基础画面。以下是原有沙盘操作说明。</p>'''
    source = source.replace(help_start, help_intro, 1)
    source = source.replace('保存图片</button>', '保存基础画面</button>', 1)
    source = source.replace('</head>', '<style id="cards-style">\n' + (ROOT / 'cards-v1.css').read_text(encoding='utf-8') + '\n</style>\n</head>', 1)
    insertion = 'for(const [id,label,shortcut] of toolDefs){'
    assert source.count(insertion) == 1
    source = source.replace(insertion, (ROOT / 'cards-v1.js').read_text(encoding='utf-8') + '\n' + insertion, 1)
    source = source.replace("if(typeof uiRefresh==='function')uiRefresh();", "if(typeof uiRefresh==='function')uiRefresh();\n if(typeof cardRefresh==='function')cardRefresh();", 1)
    source = source.replace('draw(time);uiPositionTalk();lastDraw=time;', 'draw(time);cardDrawPreview(time);uiPositionTalk();lastDraw=time;', 1)
    source = source.replace('initNarrative();initInterface();refreshSearch();', 'initNarrative();initInterface();initCardPrototype();refreshSearch();', 1)
    source = source.replace("else message('点开庭院小门，开始这一段路。也可以重新安排三个路线点。');", "else message('先试一张天色卡，或到空间里添一片树。');", 1)
    source = source.replace("else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();cameraUI();}", "else if(Math.abs(oldW-W)>1||Math.abs(oldH-H)>1){const wasFar=camera.zoom/camera.fit<1.2;camera.x+=(W-oldW)/2;camera.y+=(H-oldH)/2;camera.fit=fitZoom();if(wasFar)setView('far',false);else cameraUI();}", 1)
    source = source.replace('(W-72)/(b.right-b.left),(H-190)/(b.bottom-b.top)', '(W-44)/(b.right-b.left),(H-96)/(b.bottom-b.top)', 1)
    return source

