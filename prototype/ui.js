// Interface-only behavior. The scene renderer, artwork and route rules are unchanged.
let uiReady=false,uiCategory='world';
function uiRefresh(){
 if(!uiReady)return;
 $('playBtn').hidden=mode==='walking';$('pauseBtn').hidden=mode!=='walking';
 $('terrainSection').hidden=uiCategory!=='world';
 document.querySelector('.land-materials').hidden=tool!=='sand'||uiCategory!=='world';
 $('assetHeading').textContent={world:'自然与建筑',animals:'动物朋友',people:'途中相遇的人'}[uiCategory];
 uiPositionTalk();
}
function uiPositionTalk(){
 if(!uiReady)return;
 const button=$('talkBtn');button.hidden=!scene.start||!!storyState.active;
 uiPositionStory();
 if(button.hidden||!camera.ready)return;
 const p=point(actor),x=camera.x+p.x*camera.zoom,y=camera.y+p.y*camera.zoom;
 const r=canvas.getBoundingClientRect(),width=152,height=48;
 button.style.left=Math.max(12,Math.min(r.width-width-12,x-width/2))+'px';
 button.style.top=Math.max(80,Math.min(r.height-height-84,y-92))+'px';
}
function uiPositionStory(){
 const dock=$('storyDock');if(!storyState.active||!dock.getBoundingClientRect)return;
 const r=canvas.getBoundingClientRect(),p=point(actor),x=camera.x+p.x*camera.zoom,y=camera.y+p.y*camera.zoom;
 const compact=r.width<680,margin=compact?12:20,width=Math.min(compact?640:430,r.width-margin*2);
 dock.style.width=width+'px';dock.style.maxHeight=(compact?Math.max(200,Math.min(350,r.height*.46)):Math.max(175,r.height-84))+'px';
 let left=compact?(r.width-width)/2:x+36;
 if(!compact&&left+width>r.width-margin)left=x-width-36;
 left=Math.max(margin,Math.min(r.width-width-margin,left));
 const h=dock.getBoundingClientRect().height;
 const top=compact?r.height-h-12:Math.max(70,Math.min(r.height-h-20,y-h*.64));
 dock.style.left=left+'px';dock.style.top=Math.max(56,top)+'px';dock.style.bottom='auto';dock.style.transform='none';
}
function initInterface(){
 uiReady=true;
 for(const b of $('paletteTabs').children)b.addEventListener('click',()=>{uiCategory=b.dataset.category;uiRefresh();});
 for(const id of ['demoBtn','blankBtn','exportBtn'])$(id).addEventListener('click',()=>{$('worldMenu').open=false;});
 // Keep auxiliary settings out of the way while another menu or dialogue is open.
 for(const id of ['cameraMenu','companionSettings','worldMenu'])$(id).addEventListener('toggle',()=>{
  if(!$(id).open)return;
  for(const other of ['cameraMenu','companionSettings','worldMenu'])if(other!==id)$(other).open=false;
 });
 document.addEventListener('pointerdown',e=>{
  for(const id of ['cameraMenu','companionSettings','worldMenu']){
   const menu=$(id);if(menu.open&&!menu.contains(e.target))menu.open=false;
  }
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape')for(const id of ['cameraMenu','companionSettings','worldMenu'])$(id).open=false;
 });
 uiRefresh();
}
