export const SIZE=76;
export const DEFINITIONS={
 shelter:{name:'Timber shelter',wood:18,stone:0,work:20,size:2,description:'A home for three. Rest restores energy faster, and spare homes welcome new settlers.'},
 farm:{name:'Garden plot',wood:10,stone:0,work:14,size:2,description:'A renewable source of food. Settlers tend and harvest it when food is needed.'},
 stockpile:{name:'Storehouse',wood:12,stone:0,work:16,size:2,description:'A local delivery point. Shorter carrying journeys mean more time for productive work.'},
 well:{name:'Stone well',wood:8,stone:9,work:22,size:1,description:'Fresh water close to home. Settlers otherwise walk to the river to drink.'},
 workshop:{name:'Workshop',wood:26,stone:12,work:28,size:2,description:'Tools increase the amount of wood and stone brought back from each gathering trip.'},
 path:{name:'Footpath',wood:0,stone:0,work:0,size:1,description:'Free to lay. People move 45% faster along paths. Drag to draw a route.'}
};
export function rand(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
export function terrain(x,y){if(x<0||y<0||x>=SIZE||y>=SIZE)return 'void';const river=54+Math.sin(y*.12)*4+Math.sin(y*.29)*1.4;let d=Math.abs(x-river);if(d<2.1)return 'water';if(d<3.2)return 'sand';return 'grass';}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export class Simulation{
 constructor(){this.time=0;this.resources={wood:28,food:24,stone:0};this.buildings=[];this.paths=[];this.people=[];this.nodes=[];this.events=[];this.priorities={wood:true,food:true,stone:true,build:true};this.nextId=1;this.arrival=0;this.version=1;this.revision=0;
 for(let y=2;y<SIZE-2;y++)for(let x=2;x<SIZE-2;x++){if(terrain(x,y)!=='grass'||Math.hypot(x-35,y-37)<6)continue;let r=rand(x+y*SIZE);const forest=(Math.sin(x*.23)+Math.cos(y*.26))*.06;if(r<.13+forest)this.nodes.push({id:this.nextId++,x,y,type:'tree',amount:12,variant:Math.floor(rand(x*13+y)*3)});else if(r>.975)this.nodes.push({id:this.nextId++,x,y,type:'stone',amount:24});else if(r>.954)this.nodes.push({id:this.nextId++,x,y,type:'berries',amount:18});}
 for(const [i,name]of ['Alda','Bram','Mira'].entries())this.addPerson(name,34+i,37,i);
 this.log('Three people. An entire world ahead.');this.reindex();}
 addPerson(name,x,y,i=this.people.length){this.people.push({id:this.nextId++,name,x,y,color:i%6,hunger:12,energy:95,thirst:5,task:null,route:[],action:'Finding their feet',timer:0,carrying:null,history:i<3?'One of the three founders.':'Arrived in search of a home.'});}
 reindex(){this.pathSet=new Set(this.paths.map(p=>p.x+','+p.y));this.nodeMap=new Map(this.nodes.filter(n=>n.amount>0).map(n=>[n.x+','+n.y,n]));this.blocked=new Set();for(const b of this.buildings)if(b.type!=='farm'){let z=DEFINITIONS[b.type].size;for(let y=b.y;y<b.y+z;y++)for(let x=b.x;x<b.x+z;x++)this.blocked.add(x+','+y);}}
 log(text){this.events.unshift({day:Math.floor(this.time/120)+1,text});this.events=this.events.slice(0,25);}
 walkable(x,y){return terrain(x,y)!=='water'&&terrain(x,y)!=='void'&&!this.blocked.has(x+','+y)&&!(this.nodeMap.get(x+','+y)?.type==='tree');}
 routeTo(p,target){const sx=Math.round(p.x),sy=Math.round(p.y);let goals=[];if(this.walkable(target.x,target.y))goals.push([target.x,target.y]);const size=target.type&&DEFINITIONS[target.type]?DEFINITIONS[target.type].size:1;for(let y=target.y-1;y<=target.y+size;y++)for(let x=target.x-1;x<=target.x+size;x++)if((x<target.x||x>=target.x+size||y<target.y||y>=target.y+size)&&this.walkable(x,y))goals.push([x,y]);if(!goals.length)return null;
 const goalSet=new Set(goals.map(g=>g.join(','))),start=sx+','+sy;if(goalSet.has(start))return [];const queue=[[sx,sy]],prev=new Map([[start,null]]);let end=null;
 for(let i=0;i<queue.length&&i<7000;i++){const [x,y]=queue[i];for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(prev.has(k)||!this.walkable(nx,ny))continue;prev.set(k,x+','+y);if(goalSet.has(k)){end=k;break;}queue.push([nx,ny]);}if(end)break;}
 if(!end)return null;const result=[];while(end!==start){let [x,y]=end.split(',').map(Number);result.unshift({x,y});end=prev.get(end);}return result;}
 canPlace(type,x,y){const d=DEFINITIONS[type];if(!d)return 'Unknown building.';if(!Number.isInteger(x)||!Number.isInteger(y))return 'Choose a tile.';if(x<1||y<1||x+d.size>=SIZE-1||y+d.size>=SIZE-1)return 'Choose somewhere inside the valley.';
 for(let yy=y;yy<y+d.size;yy++)for(let xx=x;xx<x+d.size;xx++){if(terrain(xx,yy)==='water')return 'Build on dry ground.';if(this.nodes.some(n=>n.amount>0&&n.x===xx&&n.y===yy))return 'Find a clearing or gather these resources first.';if(this.buildings.some(b=>xx>=b.x&&yy>=b.y&&xx<b.x+DEFINITIONS[b.type].size&&yy<b.y+DEFINITIONS[b.type].size))return 'There is already a building here.';if(type!=='path'&&this.people.some(p=>Math.round(p.x)===xx&&Math.round(p.y)===yy))return 'A settler is standing here.';}
 if(type==='path'&&this.pathSet.has(x+','+y))return 'A path is already here.';if(this.resources.wood<d.wood||this.resources.stone<d.stone)return 'Not enough materials yet.';return null;}
 place(type,x,y){const error=this.canPlace(type,x,y);if(error)return {ok:false,error};const d=DEFINITIONS[type];if(type==='path'){this.paths.push({x,y});this.pathSet.add(x+','+y);this.revision++;return {ok:true};}
 const temp={id:this.nextId++,type,x,y,progress:0,complete:false,harvest:24};this.buildings.push(temp);this.reindex();let reachable=this.people.some(p=>this.routeTo(p,temp)!==null);let trapped=this.people.some(p=>!this.walkable(Math.round(p.x),Math.round(p.y)));if(!reachable||trapped){this.buildings.pop();this.reindex();return {ok:false,error:'Leave a route for the settlers to reach it.'};}
 this.resources.wood-=d.wood;this.resources.stone-=d.stone;this.revision++;this.log(`${d.name} planned. Materials reserved.`);return {ok:true,id:temp.id};}
 cancel(id){const b=this.buildings.find(b=>b.id===id);if(!b||b.complete)return false;this.resources.wood+=DEFINITIONS[b.type].wood;this.resources.stone+=DEFINITIONS[b.type].stone;this.buildings=this.buildings.filter(x=>x.id!==id);for(const p of this.people)if(p.task?.id===id){p.task=null;p.route=[];}this.reindex();this.revision++;return true;}
 assign(p,kind,target,action){let route=this.routeTo(p,target);if(route===null)return false;p.task={kind,id:target.id,x:target.x,y:target.y};p.route=route;p.timer=0;p.action=action;return true;}
 nearest(p,items){return [...items].sort((a,b)=>distance(a,p)-distance(b,p));}
 assignNearest(p,kind,items,action){for(const item of this.nearest(p,items).slice(0,12))if(this.assign(p,kind,item,action))return true;return false;}
 storeFor(p){return this.nearest(p,[{x:35,y:37},...this.buildings.filter(b=>b.complete&&b.type==='stockpile')])[0];}
 choose(p){if(p.carrying){this.assign(p,'deliver',this.storeFor(p),'Carrying '+p.carrying.type);return;}
 if(p.hunger>45&&this.resources.food>0){this.assign(p,'eat',this.storeFor(p),'Going to eat');return;}
 if(p.thirst>65){let wells=this.buildings.filter(b=>b.complete&&b.type==='well');if(this.assignNearest(p,'drink',wells,'Fetching water'))return;let banks=[];for(let y=4;y<SIZE-4;y+=4)for(let x=46;x<63;x++)if(terrain(x,y)==='sand')banks.push({x,y});if(this.assignNearest(p,'drink',banks,'Walking to the river'))return;}
 if(p.energy<23){const homes=this.buildings.filter(b=>b.complete&&b.type==='shelter');if(this.assignNearest(p,'rest',homes,'Returning home'))return;this.assign(p,'rest',{x:35,y:37},'Resting by the fire');return;}
 const occupied=new Set(this.people.filter(q=>q.id!==p.id&&q.task).map(q=>q.task.id));
 if(this.priorities.food&&this.resources.food<this.people.length*10){const sources=[...this.nodes.filter(n=>n.type==='berries'&&n.amount>0&&!occupied.has(n.id)),...this.buildings.filter(b=>b.type==='farm'&&b.complete&&b.harvest>=3&&!occupied.has(b.id))];if(this.assignNearest(p,'food',sources,'Gathering food'))return;}
 if(this.priorities.build&&this.assignNearest(p,'build',this.buildings.filter(b=>!b.complete),'Building'))return;
 if(this.priorities.wood&&this.resources.wood<100&&this.assignNearest(p,'wood',this.nodes.filter(n=>n.type==='tree'&&n.amount>0&&!occupied.has(n.id)),'Gathering timber'))return;
 if(this.priorities.stone&&this.resources.stone<50&&this.assignNearest(p,'stone',this.nodes.filter(n=>n.type==='stone'&&n.amount>0&&!occupied.has(n.id)),'Gathering stone'))return;
 p.task={kind:'idle',x:p.x,y:p.y};p.timer=0;p.action='Enjoying the quiet';}
 update(dt){this.time+=dt;for(const b of this.buildings)if(b.type==='farm'&&b.complete)b.harvest=Math.min(30,b.harvest+dt*.22);
 for(const p of this.people){p.hunger=Math.min(100,p.hunger+dt*.14);p.thirst=Math.min(100,p.thirst+dt*.12);p.energy=Math.max(0,p.energy-dt*.10);
 if(!p.task)this.choose(p);if(!p.task)continue;
 if(p.route.length){const t=p.route[0];if(!this.walkable(t.x,t.y)){p.task=null;p.route=[];continue;}const dx=t.x-p.x,dy=t.y-p.y,len=Math.hypot(dx,dy);let step=dt*1.45*(this.pathSet.has(Math.round(p.x)+','+Math.round(p.y))?1.45:1)*(p.hunger>85?.65:1);if(len<=step){p.x=t.x;p.y=t.y;p.route.shift();}else{p.x+=dx/len*step;p.y+=dy/len*step;}continue;}
 p.timer+=dt;const task=p.task;const node=this.nodes.find(n=>n.id===task.id),building=this.buildings.find(b=>b.id===task.id);
 if(task.kind==='build'){if(!building||building.complete){p.task=null;continue;}building.progress+=dt*(p.energy<15?.5:1);p.action='Building '+DEFINITIONS[building.type].name.toLowerCase();if(building.progress>=DEFINITIONS[building.type].work){building.complete=true;this.revision++;this.log(`${DEFINITIONS[building.type].name} completed by ${p.name}.`);p.history=`Helped build a ${DEFINITIONS[building.type].name.toLowerCase()}.`;p.task=null;}}
 else if(['wood','stone','food'].includes(task.kind)){p.action=task.kind==='wood'?'Chopping timber':task.kind==='stone'?'Breaking stone':building?'Tending the garden':'Picking berries';if(p.timer>3.5){let amount=task.kind==='food'?5:this.buildings.some(b=>b.complete&&b.type==='workshop')?5:3;if(building){amount=Math.min(amount,Math.floor(building.harvest));building.harvest-=amount;}else if(node){amount=Math.min(amount,node.amount);node.amount-=amount;if(node.amount===0){this.reindex();this.revision++;}}else amount=0;if(amount>0)p.carrying={type:task.kind==='food'?'food':task.kind,amount};p.task=null;}}
 else if(task.kind==='deliver'&&p.timer>1){if(p.carrying)this.resources[p.carrying.type]+=p.carrying.amount;p.carrying=null;p.task=null;}
 else if(task.kind==='eat'&&p.timer>2){if(this.resources.food>0){this.resources.food--;p.hunger=Math.max(0,p.hunger-65);}p.task=null;}
 else if(task.kind==='drink'&&p.timer>2){p.thirst=0;p.task=null;}
 else if(task.kind==='rest'){p.action='Resting';p.energy=Math.min(100,p.energy+dt*(building?8:3));if(p.energy>=95)p.task=null;}
 else if(task.kind==='idle'&&p.timer>5)p.task=null;
 }
 const capacity=this.buildings.filter(b=>b.type==='shelter'&&b.complete).length*3;
 if(capacity>this.people.length&&this.resources.food>=24&&this.people.length<12){this.arrival+=dt;if(this.arrival>90){const names=['Rowan','Elin','Tomas','Fern','Orin','Lena','Arlen','Iris','Wren'];this.addPerson(names[this.people.length-3]||'Traveller',35,37);this.resources.food-=8;this.arrival=0;this.log(`${this.people.at(-1).name} has joined the settlement.`);}}else this.arrival=0;
 }
 snapshot(){return JSON.parse(JSON.stringify({version:1,time:this.time,resources:this.resources,buildings:this.buildings,paths:this.paths,people:this.people,nodes:this.nodes,events:this.events,priorities:this.priorities,nextId:this.nextId,arrival:this.arrival}));}
 static restore(data){if(!data||data.version!==1||!Array.isArray(data.people)||!data.people.length||!Array.isArray(data.buildings)||!Array.isArray(data.nodes)||!Array.isArray(data.paths)||!data.resources||!Number.isFinite(data.time))throw Error('This save could not be read.');for(const k of ['wood','food','stone'])if(!Number.isFinite(data.resources[k])||data.resources[k]<0)throw Error('Invalid resources.');for(const b of data.buildings)if(!DEFINITIONS[b.type])throw Error('Invalid building.');for(const p of data.people)if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Array.isArray(p.route))throw Error('Invalid settler.');const s=new Simulation();Object.assign(s,JSON.parse(JSON.stringify(data)));s.revision++;s.reindex();return s;}
}
