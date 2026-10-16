const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Path2D}=require('@napi-rs/canvas');
const artifactDir=path.join(__dirname,'../.artifacts');fs.mkdirSync(artifactDir,{recursive:true});
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
let js=html.match(/<script id="game">([\s\S]*?)<\/script>/)[1];
js=js.replace(/\}\)\(\);\s*$/, 'globalThis.__view={camera,scene,draw,setView,point,cellAt,play,pause,update,place,commit,historyStep,refreshSearch,preview,setTool,storyState,storyChoose,storyClose,storyManual,clearRun,loadScene,storyDemoScene,storyReconcile,getScene:()=>scene,getMode:()=>mode,getActor:()=>actor,getCompleted:()=>completedWaypoints,getSearch:()=>search,setMaterial:m=>landMaterial=m};})();');
class Node{
 constructor(id=''){this.id=id;this.dataset={};this.style={};this.children=[];this.events={};this.checked=false;this.open=false;this.value='';this.textContent='';this.classList={toggle(){},add(){},remove(){}};this.sub={};}
 addEventListener(t,f){(this.events[t]??=[]).push(f)}
 appendChild(c){this.children.push(c)}
 append(...c){this.children.push(...c)}
 replaceChildren(...c){this.children=c}
 showModal(){this.open=true}
 close(){this.open=false}
 setAttribute(){}
 querySelector(s){return this.sub[s]??=new Node()}
 matches(){return false}
 focus(){}
 setPointerCapture(){}
 hasPointerCapture(){return false}
 releasePointerCapture(){}
}
const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Node(m[1])]));
const native=createCanvas(1280,820),board=nodes.get('board');
Object.defineProperties(board,{width:{get:()=>native.width,set:v=>native.width=v},height:{get:()=>native.height,set:v=>native.height=v}});
board.getContext=()=>native.getContext('2d');board.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:820});
const doc={getElementById:id=>nodes.get(id),querySelector:()=>new Node(),querySelectorAll:s=>s==='[data-tool]'?nodes.get('palette').children:[],createElement:()=>new Node(),addEventListener(){}};
const env={document:doc,Path2D,OffscreenCanvas:class{constructor(w,h){return createCanvas(w,h)}},window:{devicePixelRatio:1,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},performance:{now:()=>0},console};
vm.createContext(env);vm.runInContext(js,env);const v=env.__view;
v.draw(0);v.setView('far',false);v.draw(0);fs.writeFileSync(path.join(artifactDir,'far-scene.png'),native.toBuffer('image/png'));
v.setView('close',false);v.draw(0);fs.writeFileSync(path.join(artifactDir,'close-scene.png'),native.toBuffer('image/png'));
for(const angle of [-18,0,18])for(const z of [.5,1,1.8]){v.camera.angle=angle;v.camera.zoom=z;v.camera.x=220;v.camera.y=120;for(const p of [{x:4,y:9},{x:17,y:6},{x:10,y:7},{x:3,y:12}]){const w=v.point(p),s={x:w.x*z+220,y:w.y*z+120},q=v.cellAt(s,false);assert.equal(q.x,p.x);assert.equal(q.y,p.y);}}
v.camera.angle=18;v.setView('far',false);v.draw(0);fs.writeFileSync(path.join(artifactDir,'rotated-scene.png'),native.toBuffer('image/png'));
v.loadScene(v.storyDemoScene(),'narrative test fixture');v.storyState.enabled=false;v.play();for(let t=0;t<500;t++)v.update(.04);assert.equal(v.getMode(),'arrived');
v.clearRun();v.storyState.enabled=true;v.play();assert.equal(v.storyState.active.kind,'intro');assert.equal(v.getMode(),'paused');
v.storyChoose(0);v.storyClose(true);const encountered=[];
for(let t=0;t<1100;t++){
 const a=v.storyState.active;
 if(a){if(a.kind==='encounter'){encountered.push(a.type);v.storyChoose(0);nodes.get('storyNote').value='这是测试留白与继续的记录';}v.storyClose(true);}
 if(v.getMode()==='arrived')break;v.update(.04);
}
assert.equal(v.getMode(),'arrived','dialogue resumes into a complete walk');assert.ok(encountered.includes('dog'));assert.ok(encountered.length>=3);
assert.ok(v.storyState.log.some(e=>e.note==='这是测试留白与继续的记录'));
v.clearRun();v.storyState.pace='scenery';v.play();v.storyClose(true);for(let t=0;t<700;t++)v.update(.04);assert.equal(v.getMode(),'arrived');assert.equal(v.storyState.active,null,'scenery mode does not interrupt walking');
v.clearRun();v.storyState.pace='quiet';v.play();v.storyClose(true);for(let t=0;t<700;t++)v.update(.04);assert.equal(v.getMode(),'arrived');assert.equal(v.storyState.active,null);
// All placed characters can be a destination without making their occupied cell walkable.
for(const type of env.SandtrayCore.NPC_TYPES){const s=env.SandtrayCore.storyDemoScene();s.objects[s.goal.y*22+s.goal.x]={type};assert.ok(env.SandtrayCore.validScene(s));const p=env.SandtrayCore.findPath(s).path.at(-1);assert.equal(Math.abs(p.x-s.goal.x)+Math.abs(p.y-s.goal.y),1);}
v.clearRun();v.play();v.storyClose(true);v.storyManual();const a=v.storyState.active;if(a?.object){const i=v.getScene().objects.indexOf(a.object);v.getScene().objects[i]=null;v.storyReconcile();assert.equal(v.storyState.active,null);}
// A new ocean scene supports constructing land and setting all three route points.
const c=env.SandtrayCore;v.storyState.enabled=false;v.loadScene(c.emptyScene(),'ocean');v.draw(1000);v.setView('close',false);v.draw(1000);
assert.equal(v.getScene().terrain.filter(t=>t===0).length,0);assert.equal(v.getSearch().reason,'markers');
for(let x=2;x<=8;x++)assert.ok(v.place({x,y:5},'sand'));
for(let y=2;y<=5;y++)v.place({x:4,y},'sand');
assert.ok(v.place({x:2,y:5},'start'));assert.ok(v.place({x:4,y:2},'waypoint'));assert.ok(v.place({x:8,y:5},'goal'));
assert.equal(v.place({x:2,y:5},'waypoint'),false,'markers must be distinct');
const scene=v.getScene(),before=JSON.parse(JSON.stringify(scene));v.setMaterial('soil');v.place({x:5,y:5},'tree');v.place({x:5,y:5},'sand');
assert.equal(scene.objects[5*22+5].type,'tree','repainting retains objects');assert.equal(scene.materials[5*22+5],'soil');
v.place({x:5,y:5},'erase');v.commit(before,'paint');v.historyStep(true);assert.equal(v.getScene().materials[5*22+5],'grass');v.historyStep(false);assert.equal(v.getScene().materials[5*22+5],'soil');
v.refreshSearch();const detourPath=v.getSearch().path;assert.ok(detourPath.some(p=>p.x===4&&p.y===2),'route visits the detour');assert.equal(detourPath.length-1,12);
// Resume after the waypoint must not return to an already visited waypoint.
v.play();for(let t=0;t<500&&v.getCompleted()===0;t++)v.update(.04);assert.equal(v.getCompleted(),1);v.update(.2);v.pause();v.play();assert.equal(v.getSearch().path.some(p=>p.x===4&&p.y===2),false);
for(let t=0;t<500;t++)v.update(.04);assert.equal(v.getMode(),'arrived');
// Dragging each marker uses the same pointer path as the visible canvas.
v.clearRun();v.setTool('select');v.setView('far',false);v.draw(2000);
function screen(p){const q=v.point(p);return {clientX:q.x*v.camera.zoom+v.camera.x,clientY:q.y*v.camera.zoom+v.camera.y,pointerId:1,pointerType:'mouse',button:0,preventDefault(){}};}
for(const[from,to]of [[{x:2,y:5},{x:3,y:5}],[{x:4,y:2},{x:4,y:3}],[{x:8,y:5},{x:7,y:5}]]){
 board.events.pointerdown[0](screen(from));board.events.pointermove[0](screen(to));board.events.pointerup[0](screen(to));
}
assert.equal(v.getScene().start.x,3);assert.equal(v.getScene().waypoints[0].y,3);assert.equal(v.getScene().goal.x,7);
assert.equal(v.place(v.getScene().waypoints[0],'water'),false,'waypoint terrain is protected');
v.setMaterial('stone');v.place({x:4,y:3},'sand');assert.equal(v.getScene().materials[3*22+4],'stone');
v.draw(3000);fs.writeFileSync(path.join(artifactDir,'terrain-edit-scene.png'),native.toBuffer('image/png'));
console.log('Rendering, marker dragging, required waypoint detours, pause/resume progress, ocean building, materials, undo/redo, narrative and character destinations passed. Encounters: '+encountered.join(', '));
