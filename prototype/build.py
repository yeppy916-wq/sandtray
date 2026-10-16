from pathlib import Path
from story_feature import augment_story
from route_feature import augment_route
from ui_feature import augment_ui

root=Path(__file__).resolve().parent
source=(root/'base-template.html').read_text(encoding='utf8')
style=(root/'style-v2.css').read_text(encoding='utf8')+'\n'+(root/'style-v3.css').read_text(encoding='utf8')
renderer=(root/'renderer-v2.js').read_text(encoding='utf8')
# Replaced art is omitted from the shipped file; only one active renderer remains.
start=renderer.index('function treeSprite(');end=renderer.index('function drawObject(',start)
renderer=renderer[:start]+renderer[end:]
start=renderer.index('function drawActor(');end=renderer.index('function draw(time)',start)
renderer=renderer[:start]+renderer[end:]
start=renderer.index('function landColor(');end=renderer.index('function drawObject(',start)
renderer=renderer[:start]+renderer[end:]
renderer+='\n'+(root/'art-softcel.js').read_text(encoding='utf8')
source=source.replace('</style>',style+'\n</style>',1)
source=source.replace('一隅 · 沙盘游戏原型','一隅 · 岛屿沙盘')
source=source.replace('沙盘游戏 / MVP 0.1','SOFT-CEL DIORAMA / 0.5')
source=source.replace('我的沙盘</h2>','我的一方天地</h2>')
source=source.replace('const W=1100,H=750,CELL=42,LEFT=88,TOP=66,BW=COLS*CELL,BH=ROWS*CELL,STORAGE=', 'let W=1400,H=900;const STORAGE=')
source=source.replace("const types=['bridge','fence','gate','tree','stone','bench'];", "const types=['bridge','fence','gate','tree','stone','bench','house','flower'];")
source=source.replace("return !o||o.type==='bridge'||o.type==='gate'&&o.open;", "return !o||o.type==='flower'||o.type==='bridge'||o.type==='gate'&&o.open;")
source=source.replace("return s;\n}\nfunction canEnter", "s.objects[4*COLS+17]={type:'house'};s.objects[3*COLS+6]={type:'house'};\n for(const[x,y]of [[16,7],[17,7],[18,7],[5,7],[6,7],[7,7],[15,4],[15,5],[18,6]])s.objects[y*COLS+x]={type:'flower'};\n return s;\n}\nfunction canEnter",1)
source=source.replace(" erase:'<path", " erase:'<path")
source=source.replace("stone:'<path d=\"m3 17", "house:'<path d=\"m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7\"/>',flower:'<path d=\"M12 13v9m0-4-6-4m6 2 5-4\"/><circle cx=\"12\" cy=\"8\" r=\"3\"/><path d=\"M12 3V1m0 14v-2M7 8H5m14 0h-2M8 4 6 2m10 2 2-2\"/>',stone:'<path d=\"m3 17")
source=source.replace("['sand','沙地','0','点击或按住拖动铺设沙地。会移除该格的物件。']", "['sand','陆地','0','恢复为陆地；草地与沙地的外观随区域变化。会移除该格物件。']")
source=source.replace("['erase','橡皮','E'", "['house','房屋','9','点击放一间小屋。房屋会占据所在格子，旅人会绕行。'],['flower','花丛','F','点击种下花丛。花丛是装饰，可以从这里走过。'],['erase','橡皮','E'")
source=source.replace("stone:'石头'};", "stone:'石头',house:'房屋',flower:'花丛'};")
source=source.replace("右键或橡皮可移除。", "Delete 键或橡皮可移除。")
source=source.replace("canvas.style.cursor=isRun?'default':tool==='select'?'grab':'crosshair';", "canvas.style.cursor=panGesture?'grabbing':tool==='select'?'grab':'crosshair';")
source=source.replace("function boardPoint(e)","function boardPoint(e)",1)
begin=source.index('function boardPoint(e)')
end=source.index('for(const [id,label,shortcut] of toolDefs)',begin)
source=source[:begin]+renderer+'\n'+source[end:]
source=source.replace("if(e.code==='Space'){e.preventDefault();mode==='walking'?pause():play();return;}","if(e.code==='Space'){e.preventDefault();if(!e.repeat)mode==='walking'?pause():play();return;}")
source=source.replace("'8':'stone','e':'erase'", "'8':'stone','9':'house','f':'flower','e':'erase'")
source=source.replace('空格：试走 / 暂停　·　Ctrl+Z：撤销　·　R：旋转桥　·　右键：移除物件','滚轮：缩放　·　右键拖动：平移　·　Home：远景　·　Delete：移除物件')
source=source.replace('右键：移除物件','Delete：移除物件')
source=source.replace('点击门可开关；拖动物件可移动。也可以拖动起点和终点。','点击门可开关；拖动物件可移动。空地拖动平移，滚轮缩放。')
source=source.replace('需要放在沙地上','需要放在陆地上')
camera='''<div class="camera-panel" aria-label="摄像机控制"><div class="camera-views"><button id="farView" class="active">远景</button><button id="closeView">近景</button><button id="followBtn">跟随旅人</button></div><div class="camera-zoom"><button id="zoomOut" title="缩小" aria-label="缩小">−</button><span class="zoom-value" id="zoomValue">100%</span><button id="zoomIn" title="放大" aria-label="放大">＋</button><button class="fit-button" id="fitBtn" title="恢复完整视野">归位</button></div><p class="camera-tip">滚轮缩放 · 右键拖动平移<br>触屏双指缩放与移动</p></div><div class="camera-compass" aria-hidden="true"><span>NORTH</span></div><div class="scene-caption"><p class="chapter">01 / A SMALL WORLD</p><h3>山海之间，留一隅。</h3><p>拉近一点，看看自己的安排。</p></div>'''
camera=camera.replace('<p class="camera-tip">','<div class="camera-rotate" aria-label="三个固定观察角度"><button id="rotateLeft" title="左前观察角度">左前</button><button class="front-button active" id="frontView" title="正面观察角度">正面</button><button id="rotateRight" title="右前观察角度">右前</button><span class="angle-value" id="angleValue" hidden>正面</span></div><p class="camera-tip">')
camera=camera.replace('滚轮缩放 · 右键拖动平移<br>触屏双指缩放与移动','滚轮缩放 · 右键平移<br>三个观察角度 · 保持清晰构图')
style_patch='''<style>.camera-rotate button{font-size:10px;min-width:48px;padding:6px 10px}.camera-rotate .front-button{border:0;border-radius:3px;margin:0;min-width:48px}.camera-rotate button.active{background:#e7effe;color:#6b8abb}@media(max-width:760px){.camera-rotate button,.camera-rotate .front-button{min-width:37px;padding:4px 7px;font-size:9px}}</style>'''
source=source.replace('</head>',style_patch+'</head>',1)
source=source.replace('<div class="board-toolbar">',camera+'\n   <div class="board-toolbar">',1)
source=source.replace('<div class="divider"></div><p class="selection"', '<p class="scene-legend">滚轮拉近细节，右键拖动视野。<br><b>远景看整体 · 近景看互动</b></p><div class="divider"></div><p class="selection"',1)
source=source.replace('<ol><li>使用“查看 / 移动”','<p class="help-camera">远景查看完整岛屿，近景观察旅人和物件。滚轮围绕指针缩放；右键拖动平移；空地也可拖动；触屏使用双指。点击“归位”恢复完整视野，“跟随旅人”让镜头随角色移动。</p><ol><li>使用“查看 / 移动”',1)
source=source.replace('也可以按住拖动擦除。','也可以按住拖动擦除。')
source=source.replace('手动','手动')
source=source.replace('沙地、水域、围栏、橡皮支持','陆地、水域、围栏、橡皮支持')
source=source.replace('沙地、水域两种','陆地、水域两种')
source=source.replace('示例里有一道关闭的小门。用“查看 / 移动”点开它，再让旅人走到长椅。','先点“近景”看清庭院，再点开带“门”标记的小门，开始试走。')
source=source.replace('沙盘画布。选择左侧工具后点击放置；查看工具下可拖动物件、点击小门开关。','不规则轮廓沙盘，提供正面、左前、右前三个观察角度。滚轮缩放、右键拖动平移。选择工具后点击放置，查看模式下可移动物件、开关小门。')
source=source.replace('远景查看完整岛屿，近景观察旅人和物件。','默认使用正面视角，仅提供“正面 / 左前 / 右前”三个稳定观察角度。点击对应按钮切换；Home 恢复正面远景，[ / ] 在三个角度间切换。外形为不规则基底，实际编辑区域仍有限；勾选“显示网格”可查看可编辑范围。远景查看完整岛屿，近景观察旅人和物件。')
source=source.replace("if(restored)message('上次的沙盘已恢复。可以继续摆置；想体验首次示例，可点右上角“示例沙盘”。');", "if(restored)message('上次的沙盘已恢复。滚轮缩放、右键平移；想看新版场景，可点“示例沙盘”。');")
source=augment_story(source)
source=augment_route(source)
source=augment_ui(source)
source='\n'.join(line.rstrip() for line in source.splitlines())+'\n'
out=root.parent/'index.html'
out.write_text(source,encoding='utf8',newline='\n')
print('Built index.html')
