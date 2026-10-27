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
