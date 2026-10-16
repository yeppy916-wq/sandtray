// Static 2x cached sprites: simple authored silhouettes, no external art or AI.
function paintAnimal(g,type){
 contactShadow(g,2,3,type==='deer'?25:24,9);
 const deer=type==='deer',wolf=type==='wolf',cat=type==='cat';
 const fur=deer?['#cfaa80','#947e66']:wolf?['#9caeb2','#657e89']:cat?['#e1bd91','#b78f6d']:['#d8b480','#ae8a60'];
 const body=deer?[[-17,-31],[4,-33],[16,-23],[14,-13],[-14,-12],[-21,-20]]:cat?[[-12,-27],[7,-29],[16,-17],[10,-8],[-13,-8],[-19,-17]]:[[-19,-29],[7,-31],[20,-22],[16,-11],[-17,-11],[-23,-20]];
 for(const x of [-13,10]){
  strokeLine(g,x,deer?-20:-16,x-2,deer?-2:-1,fur[1],deer?4:6);
  shape(g,[[x-5,-3],[x+2,-4],[x+3,1],[x-5,1]],'#79796d',.22);
 }
 if(cat){g.beginPath();g.moveTo(-12,-14);g.bezierCurveTo(-34,-10,-30,-35,-24,-37);g.strokeStyle=fur[1];g.lineWidth=6;g.stroke();}
 else shape(g,[[-19,-24],[-30,-35],[-31,-28],[-25,-15],[-18,-13]],fur[0],.18);
 shape(g,body,toneGradient(g,-17,-34,34,...fur),.19);
 shape(g,[[-11,-29],[5,-29],[12,-23],[2,-22],[-11,-24]],fur[0],.22);
 const hx=deer?12:13,hy=deer?-42:cat?-33:-34;
 if(deer){
  shape(g,[[4,-23],[5,-44],[11,-51],[20,-42],[18,-23]],toneGradient(g,5,-49,33,...fur),.17);
  for(const s of [-1,1]){const x=hx+s*5;strokeLine(g,x,hy-9,x+s*4,hy-28,'#8b8874',2.5);strokeLine(g,x+s*3,hy-20,x+s*11,hy-24,'#8b8874',2);strokeLine(g,x+s*4,hy-25,x+s*2,hy-32,'#9a9780',2);}
 }
 shape(g,[[hx-11,hy-1],[hx-13,hy-17],[hx-4,hy-11],[hx+2,hy-14],[hx+7,hy-22],[hx+11,hy-5]],fur[1],.09);
 if(!deer&&!cat&&!wolf){shape(g,[[hx-12,hy-8],[hx-17,hy-3],[hx-17,hy+9],[hx-11,hy+11],[hx-6,hy-1]],'#977858',.23);}
 shape(g,[[hx-9,hy-8],[hx+5,hy-9],[hx+13,hy+1],[hx+8,hy+12],[hx-8,hy+10],[hx-13,hy]],toneGradient(g,hx-8,hy-10,25,...fur),.2);
 shape(g,[[hx+4,hy+2],[hx+16,hy+4],[hx+17,hy+10],[hx+7,hy+13],[hx+1,hy+8]],cat?'#f0d5ad':'#d9cfb7',.2);
 shape(g,[[hx+12,hy+3],[hx+18,hy+4],[hx+16,hy+8],[hx+12,hy+7]],'#52616a',.25);
 g.fillStyle='#41545b';g.beginPath();g.ellipse(hx+4,hy-1,1.4,2,0,0,Math.PI*2);g.fill();
 if(type==='dog')strokeLine(g,hx-9,hy+11,hx+1,hy+13,'#b77663',3);
 if(wolf)shape(g,[[-4,-29],[3,-41],[10,-33],[6,-20],[-3,-16]],'#b6c0b7',.1);
 if(deer){for(const [x,y]of [[-11,-26],[-3,-28],[2,-21]]){g.fillStyle='#e8cfab';g.beginPath();g.ellipse(x,y,1.7,2.2,-.4,0,Math.PI*2);g.fill();}}
 if(cat){for(const y of [hy+5,hy+8])strokeLine(g,hx+10,y,hx+24,y-1,'#998d79',.65);}
}
function paintPerson(g,type){
 const child=type==='child',elder=type==='elder',woman=type==='woman',scholar=type==='scholar';
 const palettes={scholar:['#aabac1','#748e9c'],elder:['#b2b5a2','#7d9189'],woman:['#c2a6a3','#927e8e'],man:['#8aa9ad','#5d8391'],child:['#d8bd84','#b4996d']};
 const [light,dark]=palettes[type],s=child?.78:1;
 contactShadow(g,2,3,18*s,7*s);g.save();g.scale(s,s);
 for(const [x,col]of [[-6,'#596d74'],[5,'#465e68']]){strokeLine(g,x,-16,x-1,-2,col,6);shape(g,[[x-5,-3],[x+3,-3],[x+5,1],[x-5,2]],'#6d7169',.16);}
 const cloak=woman?[[-10,-41],[8,-41],[16,-10],[-15,-10]]:[[-11,-40],[8,-41],[14,-16],[7,-11],[-13,-14]];
 shape(g,cloak,toneGradient(g,-12,-41,32,light,dark),.16);
 shape(g,[[-10,-39],[-2,-39],[-2,-15],[-13,-14]],dark,.12);
 strokeLine(g,-11,-33,-16,-20,dark,7);strokeLine(g,9,-34,14,-22,light,7);
 for(const x of [-16,14]){g.fillStyle='#d9bb98';g.beginPath();g.ellipse(x,-20,3.2,4,.2,0,Math.PI*2);g.fill();}
 if(woman){shape(g,[[-10,-53],[-12,-35],[-6,-30],[7,-36],[11,-54],[2,-61]],'#746b65',.15);}
 shape(g,[[-9,-56],[4,-59],[11,-50],[9,-40],[-5,-39],[-11,-45]],toneGradient(g,-8,-57,23,'#ead0ab','#cda989'),.22);
 shape(g,[[-11,-51],[-10,-59],[1,-64],[10,-59],[13,-50],[5,-53],[-4,-54]],elder?'#d9d9c9':'#6f7169',.13);
 g.fillStyle='#526372';g.beginPath();g.ellipse(7,-48,1.1,1.6,0,0,Math.PI*2);g.fill();strokeLine(g,5,-42,8,-42,'#ac8e77',.8);
 shape(g,[[-8,-40],[6,-40],[10,-34],[-9,-34]],'#d5caa7',.15);
 if(elder){
  shape(g,[[-5,-44],[9,-44],[5,-35],[-3,-36]],'#e1dfce',.18);strokeLine(g,20,-35,19,2,'#8c8b75',3);strokeLine(g,20,-35,23,-38,'#a5a087',3);
 }else if(scholar){
  shape(g,[[2,-31],[17,-33],[20,-20],[4,-18]],'#f0e7c9',.09,'#b6b19b',.8);strokeLine(g,9,-31,12,-19,'#b9bbab',1);strokeLine(g,4,-28,8,-28,'#bdc0b0',1);
 }else if(child){
  shape(g,[[-13,-58],[-2,-66],[9,-62],[14,-55],[-1,-52]],'#be8e63',.14);strokeLine(g,-5,-24,6,-24,'#e4d2aa',2);
 }
 g.restore();
}
function npcSprite(c,type){stampAsset(assetSprite('npc-'+type,0,g=>['dog','deer','wolf','cat'].includes(type)?paintAnimal(g,type):paintPerson(g,type)),c)}
function drawStoryMarker(time){
 const active=storyState.active;if(!active?.location)return;
 const p=active.location,c=point(p),s=Math.max(.85,1/camera.zoom*.7),h=active.kind==='encounter'?(active.type==='deer'?80:76):70;
 ctx.save();ctx.translate(c.x,c.y-h-Math.sin(time*.002)*2);ctx.scale(s,s);
 roundRect(-15,-11,30,21,7,'#f8fbff','#c9d7e8',1);poly([[-4,9],[0,14],[4,9]],'#f8fbff');ctx.fillStyle='#8aa6ca';for(const x of [-6,0,6]){ctx.beginPath();ctx.arc(x,-1,1.5,0,Math.PI*2);ctx.fill();}ctx.restore();
}
