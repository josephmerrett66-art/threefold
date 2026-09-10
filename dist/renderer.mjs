import {SIZE,terrain,rand,river,brook,elevation,CAMP,DEFINITIONS} from './simulation.mjs';
export const OVERVIEW=.3,FAR=.62;
export const TX=24,TY=12;
export function iso(x,y){return {x:(x-y)*TX,y:(x+y)*TY};}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
function line(c,x,y,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(a),Math.round(b));c.stroke();}
function diamond(c,x,y,w,h,color){poly(c,[[x,y-h],[x+w,y],[x,y+h],[x-w,y]],color);}
function box(c,x,y,w,d,h,top,left,right){poly(c,[[x,y-h],[x+w,y+d-h],[x,y+2*d-h],[x-w,y+d-h]],top);poly(c,[[x-w,y+d-h],[x,y+2*d-h],[x,y+2*d],[x-w,y+d]],left);poly(c,[[x,y+2*d-h],[x+w,y+d-h],[x+w,y+d],[x,y+2*d]],right);}
export class Renderer{
 constructor(canvas,mini){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.mini=mini;this.mc=mini.getContext('2d');this.camera={x:0,y:0,zoom:.92};this.center=iso(CAMP.x,CAMP.y);this.camera.x=this.center.x;this.camera.y=this.center.y;this.hover=null;this.selected=null;this.tool='inspect';this.sprites={};this.ready=this.loadSprites();this.bakeGround();this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.w=this.canvas.width=Math.ceil(r.width);this.h=this.canvas.height=Math.ceil(r.height);this.ratio=r.width/this.w;this.cy=(this.h-(this.w<680?142:190))*.52+38;this.ctx.imageSmoothingEnabled=false;}
 screen(x,y){let p=iso(x,y);return {x:(p.x-this.camera.x)*this.camera.zoom+this.w*.5,y:(p.y-this.camera.y)*this.camera.zoom+this.cy};}
 tile(clientX,clientY){const r=this.canvas.getBoundingClientRect(),sx=(clientX-r.left)/this.ratio,sy=(clientY-r.top)/this.ratio;const x=(sx-this.w*.5)/this.camera.zoom+this.camera.x,y=(sy-this.cy)/this.camera.zoom+this.camera.y;return {x:Math.round((x/TX+y/TY)/2),y:Math.round((y/TY-x/TX)/2)};}
 zoom(factor,clientX,clientY){let ax=this.w*.5,ay=this.cy;if(clientX!==undefined){const r=this.canvas.getBoundingClientRect();ax=(clientX-r.left)/this.ratio;ay=(clientY-r.top)/this.ratio;}const old=this.camera.zoom,next=Math.max(.18,Math.min(2.6,old*factor));this.camera.x+=(ax-this.w*.5)*(1/old-1/next);this.camera.y+=(ay-this.cy)*(1/old-1/next);this.camera.zoom=next;}
 async loadSprites(){
  try{const atlas=new Image();atlas.src='./assets/retro-atlas.png';await atlas.decode();
   for(const [i,name] of ['shelter','stockpile','workshop','well','oak','pine'].entries()){
    const rects=[[0,0,512,465],[512,0,512,465],[1024,0,512,465],[0,512,512,512],[512,465,512,559],[1024,465,512,559]],rect=rects[i];const [sx,sy,cw,ch]=rect.map((v,j)=>v*(j%2?atlas.height/1024:atlas.width/1536));const cell=document.createElement('canvas');cell.width=cw;cell.height=ch;const c=cell.getContext('2d');c.drawImage(atlas,sx,sy,cw,ch,0,0,cw,ch);
    const pixels=c.getImageData(0,0,cw,ch).data;let l=cw,r=0,t=ch,b=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pixels[(y*cw+x)*4+3]>28){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    if(r<=l)continue;const widths={shelter:108,stockpile:108,workshop:116,well:43,oak:62,pine:49};const out=document.createElement('canvas');out.width=widths[name];out.height=Math.round((b-t+1)/(r-l+1)*out.width);const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';oc.drawImage(cell,l,t,r-l+1,b-t+1,0,0,out.width,out.height);this.sprites[name]=out;
   }
  }catch(error){console.warn('Sprite atlas unavailable; using built-in art.',error);}
 }
 sprite(c,name,x,y,scale=1){const a=this.sprites[name];if(!a)return false;c.drawImage(a,Math.round(x-a.width*scale/2),Math.round(y-a.height*scale),Math.round(a.width*scale),Math.round(a.height*scale));return true;}
 icon(type){const out=document.createElement('canvas');out.width=80;out.height=58;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.save();c.translate(40,40);c.scale(.64,.64);if(type==='path'){diamond(c,0,0,38,19,'#a48c5e');for(let i=0;i<25;i++){c.fillStyle=i%2?'#c5ad77':'#776a45';c.fillRect(rand(i)*50-25,rand(i+50)*16-8,2,1);}}else if(type==='clear'){diamond(c,0,6,34,17,'#7d6f4a');poly(c,[[-14,10],[-10,10],[6,-22],[2,-24]],'#8a6b40');poly(c,[[0,-30],[14,-24],[10,-13],[-2,-18]],'#c3c7bd');poly(c,[[0,-30],[6,-27],[2,-16],[-2,-18]],'#e6e9df');for(let i=0;i<9;i++){c.fillStyle='#4d5b34';c.fillRect(rand(i*4)*44-22,rand(i*9+3)*16+2,3,2);}}else this.building(c,0,0,{type,complete:true,harvest:28},0);c.restore();return out.toDataURL();}
 textures(){const out={};for(const kind of ['grass','sand','water','scree','rock']){const tex=document.createElement('canvas');tex.width=128;tex.height=128;const tc=tex.getContext('2d'),im=tc.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;let hash=(Math.imul(x+19,374761393)+Math.imul(y+7,668265263))|0;hash=Math.imul(hash^(hash>>>13),1274126177);const n=((hash>>>0)%1000)/1000;const wave=Math.sin(x*.098)*Math.cos(y*.098);
   const v=(n-.5)*(kind==='water'?24:kind==='rock'?52:44)+wave*7;
   let base=kind==='grass'?[89,111,40]:kind==='sand'?[163,145,96]:kind==='scree'?[122,118,96]:kind==='rock'?[139,134,120]:[30,68,119];
   if(kind==='water')base=[28+Math.sin(y*.6+x*.07)*2,67+Math.sin(y*.6+x*.07)*3,117+Math.sin(y*.6+x*.07)*5];
   for(let j=0;j<3;j++)im.data[i+j]=base[j]+v;im.data[i+3]=255;}
  tc.putImageData(im,0,0);out[kind]=tex;}return out;}
 // Ground is drawn from a small set of baked tile stamps, so the world can be any size.
 bakeGround(){const tex=this.textures();this.tiles={};const W=TX*2+2,H=TY*2+2;
  for(const kind of ['grass','scree','rock','sand']){const set=[];
   for(let shade=0;shade<5;shade++)for(let v=0;v<8;v++){
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.translate(W/2,H/2);
    c.save();c.translate(-v*37%128,-v*53%128);const pat=c.createPattern(tex[kind],'repeat');c.restore();
    c.save();c.translate(v*37%128,v*53%128);diamond(c,-(v*37%128),-(v*53%128),TX+.5,TY+.5,pat);c.restore();
    const lift=(shade-2)/2;
    if(lift>0)diamond(c,0,0,TX+.5,TY+.5,`rgba(193,166,79,${lift*.13})`);else if(lift<0)diamond(c,0,0,TX+.5,TY+.5,`rgba(24,55,19,${-lift*.15})`);
    if(kind==='grass')for(let k=0;k<14;k++){const dx=(rand(v*211+k)-.5)*42,dy=(rand(v*97+k+1)-.5)*20;if(Math.abs(dx)/TX+Math.abs(dy)/TY>.9)continue;c.fillStyle=k%3?'#a1aa554f':'#344c2480';c.fillRect(dx|0,dy|0,1,2);}
    if(kind==='scree'||kind==='rock')for(let k=0;k<11;k++){const dx=(rand(v*173+k)-.5)*40,dy=(rand(v*61+k+3)-.5)*19;if(Math.abs(dx)/TX+Math.abs(dy)/TY>.85)continue;c.fillStyle=k%2?'#b9b49c66':'#4a4a3d70';c.fillRect(dx|0,dy|0,2,1);}
    if(kind==='sand')for(let k=0;k<18;k++){const dx=(rand(v*131+k)-.5)*44,dy=(rand(v*43+k)-.5)*21;if(Math.abs(dx)/TX+Math.abs(dy)/TY>.9)continue;c.fillStyle=k%3?'#cbb98485':'#72724577';c.fillRect(dx|0,dy|0,2,1);}
    set.push(cv);}
   this.tiles[kind]=set;}
  this.waterPattern=tex.water;this.sandPattern=tex.sand;this.bakeOverview();}
 // One small image of the whole valley, for when the camera pulls right back.
 bakeOverview(){const c=document.createElement('canvas');c.width=Math.ceil((SIZE*TX*2+80)*OVERVIEW);c.height=Math.ceil((SIZE*TY*2+80)*OVERVIEW);
  const ctx=c.getContext('2d');ctx.scale(OVERVIEW,OVERVIEW);ctx.translate(SIZE*TX+40,40);
  const tint={grass:'#5c6f2f',scree:'#7a7660',rock:'#8b8678',sand:'#a39160',water:'#1e4477'};
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const k=terrain(x,y);if(k==='void')continue;const p=iso(x,y);
   let fill=tint[k];if(k==='grass'){const e=elevation(x,y);fill=e>.42?'#65742f':'#54692c';}
   diamond(ctx,p.x,p.y,TX+.6,TY+.6,fill);}
  this.overview=c;this.overviewOrigin={x:-SIZE*TX-40,y:-40};}
 // The two watercourses keep their soft curved banks; only the visible span is drawn.
 waterway(c,y0,y1){for(const [fn,width] of [[river,4.1],[brook,2.8]])for(const [w,style] of [[width,this.sandPattern],[width-1.4,this.waterPattern]]){
   const pts=[];for(let y=y0;y<=y1;y+=.2){const p=iso(fn(y)-w+Math.sin(y*2.6)*.09,y);pts.push([p.x,p.y]);}
   for(let y=y1;y>=y0;y-=.2){const p=iso(fn(y)+w+Math.sin(y*2.9)*.09,y);pts.push([p.x,p.y]);}
   if(pts.length>2){c.save();c.translate(0,0);const pat=c.createPattern(style,'repeat');poly(c,pts,pat);c.restore();}}
  for(let y=Math.max(.2,y0);y<Math.min(SIZE-.5,y1);y+=.06)for(const fn of [river,brook])for(const side of [-1,1]){const p=iso(fn(y)+side*(fn===river?2.7:1.5)+side*rand(y*80)*.1,y);c.fillStyle=rand(y*300)>.5?'#c6c09c90':'#769f9e75';c.fillRect(p.x|0,p.y|0,1+rand(y)*3,1);}}
 visibleTiles(){const cor=[[0,0],[this.w,0],[0,this.h],[this.w,this.h]].map(([sx,sy])=>{const wx=(sx-this.w*.5)/this.camera.zoom+this.camera.x,wy=(sy-this.cy)/this.camera.zoom+this.camera.y;return [(wx/TX+wy/TY)/2,(wy/TY-wx/TX)/2];});
  const xs=cor.map(p=>p[0]),ys=cor.map(p=>p[1]);
  return {x0:Math.max(0,Math.floor(Math.min(...xs))-3),x1:Math.min(SIZE-1,Math.ceil(Math.max(...xs))+3),y0:Math.max(0,Math.floor(Math.min(...ys))-3),y1:Math.min(SIZE-1,Math.ceil(Math.max(...ys))+4)};}
 drawGround(c){if(this.camera.zoom<FAR){c.drawImage(this.overview,this.overviewOrigin.x,this.overviewOrigin.y,SIZE*TX*2+80,SIZE*TY*2+80);return;}
  const r=this.visibleTiles(),W=TX*2+2,H=TY*2+2;
  for(let y=r.y0;y<=r.y1;y++)for(let x=r.x0;x<=r.x1;x++){const k=terrain(x,y);if(k==='water'||k==='sand'||k==='void')continue;
   const set=this.tiles[k];if(!set)continue;const p=iso(x,y);
   const shade=Math.max(0,Math.min(4,Math.round((Math.sin(x*.35)+Math.cos(y*.21)+Math.sin((x+y)*.14))/3*2+2)));
   const v=(Math.imul(x+7,73856093)^Math.imul(y+13,19349663))>>>0;
   c.drawImage(set[shade*8+v%8],Math.round(p.x-W/2),Math.round(p.y-H/2));}
  this.waterway(c,Math.max(0,r.y0-6),Math.min(SIZE,r.y1+6));}
 draw(sim,now){const c=this.ctx;c.fillStyle='#18271b';c.fillRect(0,0,this.w,this.h);c.save();c.translate(this.w*.5,this.cy);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);this.drawGround(c);const vis=this.visibleTiles();
 for(const p of sim.paths){if(p.x<vis.x0||p.x>vis.x1||p.y<vis.y0||p.y>vis.y1)continue;const q=iso(p.x,p.y);diamond(c,q.x,q.y,24,12,'#948a64');for(let k=0;k<4;k++){c.fillStyle='#b3a17b77';c.fillRect(q.x-12+k*7,q.y-1+(k%2)*3,3,1);}}
 // The initial fire is the only mark the founders have made on the land.
 const camp=iso(CAMP.x,CAMP.y);diamond(c,camp.x,camp.y,19,9,'#766e50');for(let k=0;k<8;k++){let a=k*Math.PI/4;c.fillStyle=k<4?'#9d9b80':'#6b6e58';c.fillRect(camp.x+Math.cos(a)*7-2,camp.y+Math.sin(a)*3-1,4,3);}line(c,camp.x-4,camp.y,camp.x+4,camp.y-3,'#3f3529',2);poly(c,[[camp.x-3,camp.y],[camp.x-1,camp.y-8-Math.sin(now*8)*2],[camp.x+1,camp.y-4],[camp.x+4,camp.y-1]],'#c5934f');c.fillStyle='#e4b767';c.fillRect(camp.x-1,camp.y-4,2,3);
 if(this.camera.zoom<FAR){this.drawDistant(c,sim,vis);c.restore();const ph=sim.time%120/120;if(ph>.72){c.fillStyle=`rgba(16,28,52,${Math.sin((ph-.72)/.28*Math.PI)*.15})`;c.fillRect(0,0,this.w,this.h);}return;}
 const objs=[...sim.nodes.filter(n=>n.amount>0&&n.x>=vis.x0&&n.x<=vis.x1&&n.y>=vis.y0&&n.y<=vis.y1),...sim.buildings,...sim.people.map(p=>({...p,type:'person'}))].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
 for(const obj of objs){const q=this.screen(obj.x,obj.y);if(q.x<-140||q.x>this.w+140||q.y<-30||q.y>this.h+150)continue;const p=iso(obj.x,obj.y);if(this.selected?.id===obj.id)diamond(c,p.x,p.y,20,10,'#d5d99c77');if(obj.type==='tree')this.tree(c,p.x,p.y,obj.variant,rand(obj.id));else if(obj.type==='stone')this.rock(c,p.x,p.y,obj.id);else if(obj.type==='berries')this.berries(c,p.x,p.y,obj.id);else if(obj.type==='person')this.person(c,p.x,p.y,obj,now);else this.building(c,p.x,p.y,obj,now);
  if(obj.marked)this.markedFor(c,p.x,p.y,now);
  else if(obj.complete&&obj.condition<62)this.disrepair(c,p.x,p.y,obj.condition);}
 if(this.hover&&this.tool!=='inspect'){let d=DEFINITIONS[this.tool],p=iso(this.hover.x,this.hover.y),ok=!sim.canPlace(this.tool,this.hover.x,this.hover.y);for(let y=0;y<d.size;y++)for(let x=0;x<d.size;x++){const t=iso(this.hover.x+x,this.hover.y+y);diamond(c,t.x,t.y,23,11,ok?'#cbdaa170':'#ce806070');}if(!d.order){c.globalAlpha=.55;this.building(c,p.x,p.y,{type:this.tool,complete:true,harvest:20},now);c.globalAlpha=1;}c.strokeStyle=ok?'#e7e9b4':'#eda790';c.lineWidth=1.5;const a=iso(this.hover.x-.5,this.hover.y-.5),b=iso(this.hover.x+d.size-.5,this.hover.y-.5),e=iso(this.hover.x+d.size-.5,this.hover.y+d.size-.5),f=iso(this.hover.x-.5,this.hover.y+d.size-.5);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(e.x,e.y);c.lineTo(f.x,f.y);c.closePath();c.stroke();}
 c.restore();
 const phase=sim.time%120/120;if(phase>.72){c.fillStyle=`rgba(16,28,52,${Math.sin((phase-.72)/.28*Math.PI)*.15})`;c.fillRect(0,0,this.w,this.h);}

 }
 // The far view: canopy, roofs and moving specks, drawn unsorted because nothing overlaps meaningfully.
 drawDistant(c,sim,vis){const z=this.camera.zoom;
  for(const n of sim.nodes){if(n.amount<=0||n.x<vis.x0||n.x>vis.x1||n.y<vis.y0||n.y>vis.y1)continue;const p=iso(n.x,n.y);
   c.fillStyle=n.type==='tree'?(n.variant===0?'#33452f':n.variant===2?'#4d6134':'#42563a'):n.type==='stone'?'#8e8d78':'#6d7a3e';
   const r=n.type==='tree'?9:6;c.fillRect(p.x-r|0,p.y-r*.6-4|0,r*2,r*1.5|0);}
  for(const n of sim.nodes)if(n.marked){const p=iso(n.x,n.y);c.fillStyle='#d9866099';c.fillRect(p.x-8|0,p.y-6|0,16,10);}
  for(const b of sim.buildings){const d=DEFINITIONS[b.type],p=iso(b.x,b.y);const w=d.size*22,h=d.size*11;
   diamond(c,p.x+(d.size-1)*0,p.y,w,h,b.complete?'#c6b184':'#8f8865');
   if(b.complete)diamond(c,p.x,p.y-5,w*.8,h*.8,'#9d7f56');}
  for(const p of sim.paths){const q=iso(p.x,p.y);diamond(c,q.x,q.y,22,11,'#9c9269');}
  for(const p of sim.people){const q=iso(p.x,p.y);c.fillStyle='#f4e7c0';c.fillRect(q.x-2|0,q.y-8|0,4,8);}
  const camp=iso(CAMP.x,CAMP.y);c.fillStyle='#e0b767';c.fillRect(camp.x-3|0,camp.y-4|0,6,6);}
 markedFor(c,x,y,now){const pulse=.45+Math.sin(now*3)*.18;c.strokeStyle=`rgba(226,150,116,${pulse})`;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-11);c.lineTo(x+22,y);c.lineTo(x,y+11);c.lineTo(x-22,y);c.closePath();c.stroke();c.strokeStyle=`rgba(243,206,167,${pulse+.2})`;c.lineWidth=2;c.beginPath();c.moveTo(x-6,y-5);c.lineTo(x+6,y+5);c.moveTo(x+6,y-5);c.lineTo(x-6,y+5);c.stroke();}
 disrepair(c,x,y,condition){const bad=1-condition/62,r=3+bad*2;c.fillStyle=`rgba(24,20,14,.45)`;c.beginPath();c.arc(x,y-52,r+2,0,7);c.fill();c.fillStyle=condition<28?'#d98a6c':'#d9c07a';c.beginPath();c.arc(x,y-52,r,0,7);c.fill();}
 tree(c,x,y,variant,seed){if(this.sprite(c,variant===0?'pine':'oak',x,y+4,(variant===1?.78:.9)+seed*.3))return;const h=34+seed*18;poly(c,[[x-5,y+1],[x+18,y+9],[x+37,y+2],[x+8,y-4]],'#243b2948');line(c,x,y,x,y-h*.8,'#55452f',4);line(c,x-1,y-2,x-1,y-h*.78,'#927253');if(variant===0){for(let j=0;j<4;j++){let top=y-h+j*7,w=10+j*3;poly(c,[[x,top],[x+w*.7,top+8],[x+w,top+15],[x+2,top+13],[x-w,top+15],[x-w*.65,top+7]],['#344b39','#3b533c','#405a3c','#476040'][j]);poly(c,[[x,top],[x+3,top+11],[x-w,top+15],[x-w*.65,top+7]],['#536b45','#58724a','#5d754a','#627b4f'][j]);for(let k=0;k<5;k++){let dx=rand(j*8+k+seed*99)*w-w/2;c.fillStyle='#94a06738';c.fillRect(x+dx|0,top+7+rand(k+seed)*6|0,3,1);}}}else{const clusters=[[-9,-h+11,13],[4,-h+5,15],[12,-h+16,13],[-1,-h+22,17]];for(let j=0;j<clusters.length;j++){let [dx,dy,r]=clusters[j];poly(c,[[x+dx-r,y+dy],[x+dx-r+4,y+dy-9],[x+dx-2,y+dy-r],[x+dx+8,y+dy-r+4],[x+dx+r,y+dy-3],[x+dx+r-3,y+dy+6],[x+dx,y+dy+10],[x+dx-r+1,y+dy+4]],['#66764b','#718051','#5b7047','#52663e'][j]);for(let k=0;k<14;k++){let ox=rand(k+j*21+seed)*r*1.5-r*.75,oy=rand(k*3+seed)*r-r*.5;c.fillStyle=k%2?'#a3aa693a':'#344a352b';c.fillRect(x+dx+ox|0,y+dy+oy|0,3,2);}}}}
 rock(c,x,y,id){diamond(c,x+3,y+1,15,6,'#27311b40');for(let j=0;j<3;j++){const xx=x+j*7-7,yy=y+(j%2)*3;poly(c,[[xx-7,yy],[xx-5,yy-6],[xx+1,yy-10],[xx+7,yy-5],[xx+8,yy+1],[xx,yy+4]],'#777967');poly(c,[[xx-5,yy-6],[xx+1,yy-10],[xx+7,yy-5],[xx,yy-2],[xx-7,yy]],'#a5a48b');poly(c,[[xx,yy-2],[xx+7,yy-5],[xx+8,yy+1],[xx,yy+4]],'#656954');for(let k=0;k<38;k++){const dx=rand(id+j*80+k)*12-6,dy=rand(id+k*7+j)*9-6;if(Math.abs(dx)+Math.abs(dy)<8){c.fillStyle=k%3?'#d0c7a16b':'#434c3666';c.fillRect(xx+dx|0,yy+dy|0,1,1);}}}}
 berries(c,x,y,id){diamond(c,x,y+1,12,5,'#27371c44');for(let k=0;k<65;k++){const angle=rand(id+k)*Math.PI*2,r=rand(id+k*9);const dx=Math.cos(angle)*11*r,dy=Math.sin(angle)*6*r-3;c.fillStyle=['#385022','#637535','#859449','#a2a65c'][k%4];c.fillRect(x+dx|0,y+dy|0,2,2);if(k%9===0){c.fillStyle='#a3392b';c.fillRect(x+dx|0,y+dy|0,1,1);}}}
 person(c,x,y,p,now){const walk=p.route.length>0,frame=Math.floor(now*9+p.id)%6,bob=walk&&frame%3===0?-1:0;
  const next=p.route[0],face=next?(next.x-p.x)-(next.y-p.y):1,dir=face<0?-1:1;
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);diamond(c,3,1,6,2,'#1d241c55');const stride=walk?[-2,-1,1,2,1,-1][frame]:0;
  line(c,-1,-6,-2+stride,-1,'#c4b393',2);line(c,2,-6,3-stride,0,'#8b785b',2);line(c,-2+stride,-1,-1+stride,-1,'#403b27',2);line(c,3-stride,0,5-stride,0,'#3e3929',2);
  poly(c,[[-3,-13+bob],[1,-14+bob],[4,-10+bob],[3,-5],[-2,-5]],'#d2c6a2');line(c,-2,-12+bob,-2,-6,'#f0e0b3',2);c.fillStyle='#3459b0';c.fillRect(-2,-8,6,3);c.fillStyle='#213b77';c.fillRect(2,-8,2,4);c.fillStyle='#e0b990';c.fillRect(-1,-18+bob,4,4);c.fillStyle='#9c7651';c.fillRect(2,-17+bob,2,3);c.fillStyle='#554630';c.fillRect(-1,-19+bob,4,2);c.fillStyle='#ead0a3';c.fillRect(2,-16+bob,2,1);
  const working=!walk&&['wood','stone','build','food'].includes(p.task?.kind),arm=working?[-3,-1,2,4,2,0][frame]:walk?stride:0;
  line(c,-3,-12+bob,-4,-8+arm,'#b59972',2);line(c,3,-12+bob,5,-8-arm,'#dec39a',2);
  if(working&&p.task.kind!=='food'){line(c,5,-8-arm,8,-15-arm,'#80643c',1);poly(c,[[7,-16-arm],[11,-16-arm],[11,-13-arm],[8,-14-arm]],'#b7bbb1');}
  if(p.carrying){if(p.carrying.type==='wood'){for(let k=0;k<3;k++)line(c,-7+k,-9,-3+k,-3,'#a47f47',2);}else{poly(c,[[-7,-9],[-3,-10],[-2,-4],[-7,-4]],p.carrying.type==='food'?'#bba270':'#a2a292');}}
  c.restore();}

 building(c,x,y,b,now){if(b.complete&&this.sprite(c,b.type,x,y+(b.type==='well'?12:34))){if(b.type==='workshop'){for(let k=0;k<4;k++){const phase=(now*.25+k*.25)%1;c.fillStyle=`rgba(216,211,185,${(1-phase)*.26})`;c.fillRect(x+20+phase*8,y-62-phase*22,4+phase*6,3+phase*5);}}return;}const size=DEFINITIONS[b.type].size,ox=x,oy=y;if(size===2)y+=10;diamond(c,x+8,y+16,size*24,size*10,'#23322545');
 if(!b.complete){diamond(c,x,y,24*size-4,12*size-2,'#8f8865');const fraction=b.progress/DEFINITIONS[b.type].work;for(const [dx,dy]of [[-23,0],[0,-12],[23,0],[0,12]]){line(c,x+dx,y+dy,x+dx,y+dy-20,'#ac9670',2);}line(c,x-23,y-20,x,y-32,'#aa9975');line(c,x,y-32,x+23,y-20,'#aa9975');line(c,x-23,y-10,x,y-22,'#695b42');line(c,x,y-22,x+23,y-10,'#695b42');for(let k=0;k<5;k++){line(c,x-14,y+6-k*2,x-4,y+11-k*2,'#bfaa7b',2);}if(fraction>.5)box(c,x,y-10,22,11,10,'#aa9470','#8a7c5c','#6a6b50');c.fillStyle='#18291fd0';c.fillRect(x-19,y+21,38,3);c.fillStyle='#d1c088';c.fillRect(x-19,y+21,38*fraction,3);return;}
 if(b.type==='farm'){diamond(c,x,y,43,21,'#78633b');for(let i=0;i<200;i++){const dx=rand(i*3)*82-41,dy=rand(i*9+2)*40-20;if(Math.abs(dx)/43+Math.abs(dy)/21<1){c.fillStyle=i%3?'#b0915866':'#483f2d99';c.fillRect(x+dx|0,y+dy|0,2,1);}}for(let k=-3;k<=3;k++){line(c,x-26+k*4,y-12-k*2,x+3+k*4,y+3-k*2,'#4e4934',3);for(let j=0;j<7;j++){let xx=x-24+k*4+j*4,yy=y-12-k*2+j*2;line(c,xx,yy,xx,yy-(b.harvest>10?5:2),'#82904d');if(b.harvest>18){c.fillStyle='#b9ad62';c.fillRect(xx-1,yy-6,2,2);}}}for(const [dx,dy]of [[-42,0],[0,-21],[42,0],[0,21]])line(c,x+dx,y+dy,x+dx,y+dy-6,'#a0956c',2);line(c,x-42,y-5,x,y+16,'#a0956c');line(c,x,y+16,x+42,y-5,'#a0956c');return;}
 if(b.type==='well'){box(c,x,y-3,12,6,9,'#b0b09a','#858c7b','#63796a');diamond(c,x,y-3,7,3,'#263c36');line(c,x-10,y-6,x-10,y-28,'#887757',2);line(c,x+10,y-6,x+10,y-28,'#887757',2);line(c,x-12,y-28,x+12,y-28,'#b1a17b',2);line(c,x,y-27,x,y-5,'#c7b99b');c.fillStyle='#716344';c.fillRect(x+13,y-3,5,5);return;}
 const workshop=b.type==='workshop',store=b.type==='stockpile';const w=store?28:29,d=14,h=store?15:22;
 box(c,x,y-13,w,d,h,'#b4a17a','#a08c68','#77785a');for(let j=0;j<4;j++){line(c,x-w,y-13+d-h+j*5,x,y-13+2*d-h+j*5,'#6d674a');line(c,x,y-13+2*d-h+j*5,x+w,y-13+d-h+j*5,'#626749');}for(const dx of [-w,0,w]){let dy=dx===0?2*d:d;line(c,x+dx,y-13+dy-h,x+dx,y-13+dy,'#5c5841',2);}
 // A steep shingled roof, with individually articulated rows.
 const ridgeY=y-13-h-13,baseY=y-13+d-h;
 poly(c,[[x-w-4,baseY],[x-4,ridgeY],[x+w+4,baseY],[x+3,baseY+17]],'#64664c');poly(c,[[x-w-4,baseY],[x-4,ridgeY],[x+2,ridgeY+3],[x+3,baseY+17]],store?'#9e8e60':'#9b8760');poly(c,[[x+3,baseY+17],[x+2,ridgeY+3],[x+w+4,baseY],[x+w+4,baseY+3]],'#686c4e');
 for(let row=1;row<=6;row++){let t=row/7,ax=x-w-4+(w)*t,ay=baseY+(ridgeY-baseY)*t,bx=x+3+(x+2-(x+3))*t,by=baseY+17+(ridgeY+3-baseY-17)*t;line(c,ax,ay,bx,by,row%2?'#685f45':'#b1a071');for(let k=1;k<6;k++){let q=k/6;line(c,ax+(bx-ax)*q,ay+(by-ay)*q,ax+(bx-ax)*q+3,ay+(by-ay)*q-2,'#756d4f');}}
 line(c,x-w-4,baseY,x+3,baseY+17,'#c1aa79',2);line(c,x+3,baseY+17,x+w+4,baseY,'#89906a',2);
 // Door, glazing, stoop, stacked timber and domestic objects.
 poly(c,[[x-19,y-2],[x-10,y+2],[x-10,y+13],[x-19,y+8]],'#3c4535');line(c,x-18,y-1,x-18,y+7,'#b09a70');c.fillStyle='#d2b871';c.fillRect(x-12,y+6,1,1);poly(c,[[x+8,y],[x+17,y-4],[x+17,y+3],[x+8,y+7]],'#344b40');line(c,x+12,y-2,x+12,y+5,'#b0a17c');line(c,x+8,y+3,x+17,y-1,'#9b906e');diamond(c,x-14,y+13,9,4,'#99967a');
 for(let k=0;k<4;k++)line(c,x+25,y+9-k*2,x+34,y+4-k*2,'#ba9d6e',2);
 if(store){box(c,x-32,y+10,6,3,6,'#b3a174','#8c7a51','#756746');box(c,x-24,y+15,5,3,7,'#aa936a','#8e7c54','#706143');}else{c.fillStyle='#8f865c';c.fillRect(x+17,y+9,5,5);c.fillStyle='#74925a';c.fillRect(x+16,y+6,6,4);}
 if(workshop){box(c,x+16,y-28,5,3,25,'#a3aa97','#8b9180','#6b7b6d');for(let k=0;k<4;k++){let t=(now*.4+k*.24)%1;c.fillStyle=`rgba(194,199,178,${(1-t)*.35})`;c.fillRect(x+16+t*10|0,y-54-t*25|0,4+t*7,3+t*5);}box(c,x-29,y+19,10,5,7,'#b2a079','#847555','#665f42');}
 }
 miniScale(){const h=this.mini.height,scale=(h-4)/SIZE;return {scale,offX:(this.mini.width-SIZE*scale)/2,offY:2};}
 bakeMini(){const {scale,offX,offY}=this.miniScale();const c=document.createElement('canvas');c.width=this.mini.width;c.height=this.mini.height;const x2=c.getContext('2d');x2.fillStyle='#1d2b22';x2.fillRect(0,0,c.width,c.height);
  const tint={water:'#204477',sand:'#b4a575',scree:'#7e7a63',rock:'#928d7d'};
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const t=terrain(x,y);if(t==='void')continue;x2.fillStyle=tint[t]||(elevation(x,y)>.42?'#6b7c33':'#59702c');x2.fillRect(offX+x*scale,offY+y*scale,Math.ceil(scale),Math.ceil(scale));}
  this.miniGround=c;return c;}
 drawMini(sim){const c=this.mc;const {scale,offX,offY}=this.miniScale();c.drawImage(this.miniGround||this.bakeMini(),0,0);for(const n of sim.nodes)if(n.type==='tree'&&n.amount>0){c.fillStyle='#2c4430';c.fillRect(offX+n.x*scale,offY+n.y*scale,1,1);}for(const b of sim.buildings){c.fillStyle='#d6c691';c.fillRect(offX+b.x*scale-1,offY+b.y*scale-1,3,3);}for(const p of sim.people){c.fillStyle='#f3e0b2';c.fillRect(offX+p.x*scale,offY+p.y*scale,2,2);}const centerX=(this.camera.x/TX+this.camera.y/TY)/2,centerY=(this.camera.y/TY-this.camera.x/TX)/2;c.strokeStyle='#e1dcab9c';c.lineWidth=1;const dx=this.w/this.camera.zoom/2,dy=this.h/this.camera.zoom/2;let corners=[[-dx,-dy],[dx,-dy],[dx,dy],[-dx,dy]].map(([x,y])=>[offX+(centerX+(x/TX+y/TY)/2)*scale,offY+(centerY+(y/TY-x/TX)/2)*scale]);c.beginPath();corners.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();}
}
