export const SIZE=76;
export const DEFINITIONS={
 shelter:{name:'Timber shelter',wood:18,stone:0,work:20,size:2,upkeep:{wood:4,stone:0},decay:.052,description:'A home for three. Rest restores energy faster, and spare homes welcome new settlers.'},
 farm:{name:'Garden plot',wood:10,stone:0,work:14,size:2,upkeep:{wood:3,stone:0},decay:.082,description:'A renewable source of food. Settlers tend and harvest it when food is needed.'},
 stockpile:{name:'Storehouse',wood:12,stone:0,work:16,size:2,upkeep:{wood:3,stone:0},decay:.048,description:'A local delivery point. Shorter carrying journeys mean more time for productive work.'},
 well:{name:'Stone well',wood:8,stone:9,work:22,size:1,upkeep:{wood:1,stone:2},decay:.040,description:'Fresh water close to home. Settlers otherwise walk to the river to drink.'},
 workshop:{name:'Workshop',wood:26,stone:12,work:28,size:2,upkeep:{wood:5,stone:3},decay:.072,description:'Tools increase the amount of wood and stone brought back from each gathering trip.'},
 path:{name:'Footpath',wood:0,stone:0,work:0,size:1,order:true,description:'Free to lay. People move 45% faster along paths. Drag to draw a route.'},
 clear:{name:'Clear land',wood:0,stone:0,work:0,size:1,order:true,description:'Mark trees, rock or scrub to be felled. Everything standing there is carried home, and the ground is yours to build on. Drag to mark a stretch.'}
};
export const TRAITS={
 wood:{name:'Forester',blurb:'At home among the trees.'},
 food:{name:'Grower',blurb:'Has a way with growing things.'},
 stone:{name:'Mason',blurb:'Reads stone like a page.'},
 build:{name:'Builder',blurb:'Happiest with a frame going up.'}
};
const TRAIT_KEYS=Object.keys(TRAITS);
export const BURN_P=.040,BURN_B=.016;
export const CAMP={x:35,y:37};
export function rand(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
export function terrain(x,y){if(x<0||y<0||x>=SIZE||y>=SIZE)return 'void';const river=54+Math.sin(y*.12)*4+Math.sin(y*.29)*1.4;let d=Math.abs(x-river);if(d<2.1)return 'water';if(d<3.2)return 'sand';return 'grass';}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const upkeepOf=type=>DEFINITIONS[type].upkeep||{wood:0,stone:0};
export class Simulation{
 constructor(){this.time=0;this.resources={wood:28,food:24,stone:0};this.buildings=[];this.paths=[];this.people=[];this.nodes=[];this.events=[];this.bonds=[];this.priorities={wood:true,food:true,stone:true,build:true};this.nextId=1;this.arrival=0;this.regrow=0;this.warm=true;this.version=2;this.revision=0;
 for(let y=2;y<SIZE-2;y++)for(let x=2;x<SIZE-2;x++){if(terrain(x,y)!=='grass'||Math.hypot(x-CAMP.x,y-CAMP.y)<6)continue;let r=rand(x+y*SIZE);const forest=(Math.sin(x*.23)+Math.cos(y*.26))*.06;if(r<.13+forest)this.nodes.push({id:this.nextId++,x,y,type:'tree',amount:12,variant:Math.floor(rand(x*13+y)*3)});else if(r>.975)this.nodes.push({id:this.nextId++,x,y,type:'stone',amount:24});else if(r>.954)this.nodes.push({id:this.nextId++,x,y,type:'berries',amount:18});}
 // The founders are deliberately unalike; watching them is meant to be worth doing.
 for(const [i,[name,trait]]of [['Alda','food'],['Bram','wood'],['Mira','build']].entries())this.addPerson(name,34+i,37,i,trait);
 this.log('Three people. An entire world ahead.');this.reindex();}
 addPerson(name,x,y,i=this.people.length,trait){const seed=this.nextId*17+i*7;const key=trait||TRAIT_KEYS[Math.floor(rand(seed)*TRAIT_KEYS.length)%TRAIT_KEYS.length];
 const skills={wood:1,stone:1,food:1,build:1};skills[key]=1.35;
 this.people.push({id:this.nextId++,name,x,y,color:i%6,trait:key,speed:.86+rand(seed*3+11)*.30,skills,hunger:12,energy:95,thirst:5,morale:72,task:null,route:[],action:'Finding their feet',timer:0,carrying:null,history:i<3?'One of the three founders.':'Arrived in search of a home.'});}
 reindex(){this.pathSet=new Set(this.paths.map(p=>p.x+','+p.y));this.nodeMap=new Map(this.nodes.filter(n=>n.amount>0).map(n=>[n.x+','+n.y,n]));this.blocked=new Set();for(const b of this.buildings)if(b.type!=='farm'){let z=DEFINITIONS[b.type].size;for(let y=b.y;y<b.y+z;y++)for(let x=b.x;x<b.x+z;x++)this.blocked.add(x+','+y);}}
 log(text){this.events.unshift({day:Math.floor(this.time/120)+1,text});this.events=this.events.slice(0,25);}
 // Stock is a buffer against demand, not a number to reach and stop at.
 targets(){const built=this.buildings.filter(b=>b.complete);let stone=14+this.people.length*2;for(const b of built)stone+=upkeepOf(b.type).stone*3;
 return {wood:34+this.people.length*5+built.length*7,stone,food:this.people.length*12};}
 open(n){return [[1,0],[0,1],[-1,0],[0,-1]].some(([dx,dy])=>this.walkable(n.x+dx,n.y+dy));}
 walkable(x,y){return terrain(x,y)!=='water'&&terrain(x,y)!=='void'&&!this.blocked.has(x+','+y)&&!(this.nodeMap.get(x+','+y)?.type==='tree');}
 routeTo(p,target){const sx=Math.round(p.x),sy=Math.round(p.y);let goals=[];if(this.walkable(target.x,target.y))goals.push([target.x,target.y]);const size=target.type&&DEFINITIONS[target.type]?DEFINITIONS[target.type].size:1;for(let y=target.y-1;y<=target.y+size;y++)for(let x=target.x-1;x<=target.x+size;x++)if((x<target.x||x>=target.x+size||y<target.y||y>=target.y+size)&&this.walkable(x,y))goals.push([x,y]);if(!goals.length)return null;
 const goalSet=new Set(goals.map(g=>g.join(','))),start=sx+','+sy;if(goalSet.has(start))return [];const queue=[[sx,sy]],prev=new Map([[start,null]]);let end=null;
 for(let i=0;i<queue.length&&i<7000;i++){const [x,y]=queue[i];for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(prev.has(k)||!this.walkable(nx,ny))continue;prev.set(k,x+','+y);if(goalSet.has(k)){end=k;break;}queue.push([nx,ny]);}if(end)break;}
 if(!end)return null;const result=[];while(end!==start){let [x,y]=end.split(',').map(Number);result.unshift({x,y});end=prev.get(end);}return result;}
 canPlace(type,x,y){const d=DEFINITIONS[type];if(!d)return 'Unknown building.';if(!Number.isInteger(x)||!Number.isInteger(y))return 'Choose a tile.';
 if(type==='clear'){if(x<1||y<1||x>=SIZE-1||y>=SIZE-1)return 'Choose somewhere inside the valley.';const n=this.nodeMap.get(x+','+y);if(!n)return 'There is nothing here to clear.';if(n.marked)return 'This is already marked for clearing.';return null;}
 if(x<1||y<1||x+d.size>=SIZE-1||y+d.size>=SIZE-1)return 'Choose somewhere inside the valley.';
 for(let yy=y;yy<y+d.size;yy++)for(let xx=x;xx<x+d.size;xx++){if(terrain(xx,yy)==='water')return 'Build on dry ground.';if(this.nodes.some(n=>n.amount>0&&n.x===xx&&n.y===yy))return 'Clear this ground first.';if(this.buildings.some(b=>xx>=b.x&&yy>=b.y&&xx<b.x+DEFINITIONS[b.type].size&&yy<b.y+DEFINITIONS[b.type].size))return 'There is already a building here.';if(type!=='path'&&this.people.some(p=>Math.round(p.x)===xx&&Math.round(p.y)===yy))return 'A settler is standing here.';}
 if(type==='path'&&this.pathSet.has(x+','+y))return 'A path is already here.';if(this.resources.wood<d.wood||this.resources.stone<d.stone)return 'Not enough materials yet.';return null;}
 place(type,x,y){const error=this.canPlace(type,x,y);if(error)return {ok:false,error};const d=DEFINITIONS[type];
 if(type==='clear'){const n=this.nodeMap.get(x+','+y);n.marked=true;this.revision++;return {ok:true,id:n.id};}
 if(type==='path'){this.paths.push({x,y});this.pathSet.add(x+','+y);this.revision++;return {ok:true};}
 const temp={id:this.nextId++,type,x,y,progress:0,complete:false,condition:100,harvest:24};this.buildings.push(temp);this.reindex();let reachable=this.people.some(p=>this.routeTo(p,temp)!==null);let trapped=this.people.some(p=>!this.walkable(Math.round(p.x),Math.round(p.y)));if(!reachable||trapped){this.buildings.pop();this.reindex();return {ok:false,error:'Leave a route for the settlers to reach it.'};}
 this.resources.wood-=d.wood;this.resources.stone-=d.stone;this.revision++;this.log(`${d.name} planned. Materials reserved.`);return {ok:true,id:temp.id};}
 cancel(id){const b=this.buildings.find(b=>b.id===id);if(!b||b.complete)return false;this.resources.wood+=DEFINITIONS[b.type].wood;this.resources.stone+=DEFINITIONS[b.type].stone;this.buildings=this.buildings.filter(x=>x.id!==id);for(const p of this.people)if(p.task?.id===id){p.task=null;p.route=[];}this.reindex();this.revision++;return true;}
 unmark(id){const n=this.nodes.find(n=>n.id===id);if(!n||!n.marked)return false;delete n.marked;for(const p of this.people)if(p.task?.kind==='fell'&&p.task.id===id){p.task=null;p.route=[];}this.revision++;return true;}
 assign(p,kind,target,action){let route=this.routeTo(p,target);if(route===null)return false;p.task={kind,id:target.id,x:target.x,y:target.y};p.route=route;p.timer=0;p.action=action;return true;}
 nearest(p,items){return [...items].sort((a,b)=>distance(a,p)-distance(b,p));}
 assignNearest(p,kind,items,action,open){let tried=0;for(const item of this.nearest(p,items)){if(open&&!this.open(item))continue;if(this.assign(p,kind,item,action))return true;if(++tried>=30)break;}return false;}
 storeFor(p){return this.nearest(p,[CAMP,...this.buildings.filter(b=>b.complete&&b.type==='stockpile'&&b.condition>30)])[0];}
 hasWorkshop(){return this.buildings.some(b=>b.complete&&b.type==='workshop'&&b.condition>50);}
 choose(p){const t=this.targets();
 if(p.carrying){this.assign(p,'deliver',this.storeFor(p),'Carrying '+p.carrying.type);return;}
 if(p.hunger>45&&this.resources.food>=4){this.assign(p,'eat',this.storeFor(p),'Going to eat');return;}
 if(p.thirst>65){let wells=this.buildings.filter(b=>b.complete&&b.type==='well'&&b.condition>30);if(this.assignNearest(p,'drink',wells,'Fetching water'))return;let banks=[];for(let y=4;y<SIZE-4;y+=4)for(let x=46;x<63;x++)if(terrain(x,y)==='sand')banks.push({x,y});if(this.assignNearest(p,'drink',banks,'Walking to the river'))return;}
 if(p.energy<23){const homes=this.buildings.filter(b=>b.complete&&b.type==='shelter');if(this.assignNearest(p,'rest',homes,'Returning home'))return;this.assign(p,'rest',CAMP,'Resting by the fire');return;}
 if(p.morale<28&&this.resources.wood>12){this.assign(p,'socialise',CAMP,'Walking to the fire');return;}
 const occupied=new Set(this.people.filter(q=>q.id!==p.id&&q.task).map(q=>q.task.id));
 // Marked ground is an explicit order from the player, so it outranks the priority toggles.
 if(this.assignNearest(p,'fell',this.nodes.filter(n=>n.marked&&n.amount>0&&!occupied.has(n.id)),'Clearing land',true))return;
 if(this.priorities.build){const repairs=this.buildings.filter(b=>b.complete&&b.condition<62&&!occupied.has(b.id)&&this.resources.wood>=upkeepOf(b.type).wood&&this.resources.stone>=upkeepOf(b.type).stone);if(this.assignNearest(p,'repair',repairs,'Going to make repairs'))return;}
 // A settler reaches for their own trade first, then whatever else the settlement needs.
 for(const job of [p.trait,...['food','build','wood','stone'].filter(k=>k!==p.trait)]){
  if(job==='food'&&this.priorities.food&&this.resources.food<t.food){const sources=[...this.nodes.filter(n=>n.type==='berries'&&n.amount>0&&!occupied.has(n.id)),...this.buildings.filter(b=>b.type==='farm'&&b.complete&&b.harvest>=3&&!occupied.has(b.id))];if(this.assignNearest(p,'food',sources,'Gathering food',true))return;}
  if(job==='build'&&this.priorities.build&&this.assignNearest(p,'build',this.buildings.filter(b=>!b.complete),'Building'))return;
  if(job==='wood'&&this.priorities.wood&&this.resources.wood<t.wood&&this.assignNearest(p,'wood',this.nodes.filter(n=>n.type==='tree'&&n.amount>0&&!n.marked&&!occupied.has(n.id)),'Gathering timber',true))return;
  if(job==='stone'&&this.priorities.stone&&this.resources.stone<t.stone&&this.assignNearest(p,'stone',this.nodes.filter(n=>n.type==='stone'&&n.amount>0&&!n.marked&&!occupied.has(n.id)),'Gathering stone',true))return;
 }
 // Nothing pressing. People are not statues: they go and sit with each other.
 if(this.assign(p,'socialise',CAMP,'Walking to the fire'))return;
 p.task={kind:'idle',x:p.x,y:p.y};p.timer=0;p.action='Enjoying the quiet';}
 bond(a,b){const key=[a.id,b.id].sort((x,y)=>x-y).join('-');if(this.bonds.includes(key))return;this.bonds.push(key);this.log(`${a.name} and ${b.name} sat together by the fire.`);a.history=`Keeps company with ${b.name}.`;b.history=`Keeps company with ${a.name}.`;}
 growForest(){const grown=this.nodes.filter(n=>n.type==='tree'&&n.amount>0);if(!grown.length)return;const parent=grown[Math.floor(rand(this.time*3.7)*grown.length)%grown.length];
 const [dx,dy]=[[1,0],[0,1],[-1,0],[0,-1]][Math.floor(rand(this.time*9.1)*4)%4],x=parent.x+dx,y=parent.y+dy;
 if(x<2||y<2||x>=SIZE-2||y>=SIZE-2||terrain(x,y)!=='grass')return;
 if(this.nodeMap.has(x+','+y)||this.pathSet.has(x+','+y)||this.blocked.has(x+','+y))return;
 if(Math.hypot(x-CAMP.x,y-CAMP.y)<7)return;
 if(this.people.some(p=>Math.round(p.x)===x&&Math.round(p.y)===y))return;
 for(const b of this.buildings){const z=DEFINITIONS[b.type].size;if(x>b.x-4&&x<b.x+z+4&&y>b.y-4&&y<b.y+z+4)return;}
 this.nodes.push({id:this.nextId++,x,y,type:'tree',amount:12,variant:Math.floor(rand(x*13+y)*3)});this.reindex();this.revision++;}
 update(dt){this.time+=dt;
 for(const b of this.buildings){if(!b.complete)continue;const d=DEFINITIONS[b.type];b.condition=Math.max(0,(b.condition??100)-dt*d.decay);
  if(b.type==='farm')b.harvest=Math.min(30,b.harvest+dt*.22*(.35+.65*b.condition/100));}
 this.regrow+=dt;if(this.regrow>15){this.regrow=0;this.growForest();}
 // Hearths and cooking burn timber continuously, so a larger settlement is a larger appetite.
 const burn=dt*(BURN_P*this.people.length+BURN_B*this.buildings.filter(b=>b.complete).length);const lit=this.resources.wood>0;this.resources.wood=Math.max(0,this.resources.wood-burn);
 if(lit&&this.resources.wood<=0)this.log("The fires are out. Bring timber home.");
 this.warm=this.resources.wood>0;
 for(const p of this.people){p.hunger=Math.min(100,p.hunger+dt*.17);p.thirst=Math.min(100,p.thirst+dt*.12);p.energy=Math.max(0,p.energy-dt*.10);p.morale=Math.max(0,p.morale-dt*(this.warm===false?.14:.06));
 if(!p.task)this.choose(p);if(!p.task)continue;
 if(p.route.length){const t=p.route[0];if(!this.walkable(t.x,t.y)){p.task=null;p.route=[];continue;}const dx=t.x-p.x,dy=t.y-p.y,len=Math.hypot(dx,dy);let step=dt*1.45*p.speed*(this.pathSet.has(Math.round(p.x)+','+Math.round(p.y))?1.45:1)*(p.hunger>85?.65:1);if(len<=step){p.x=t.x;p.y=t.y;p.route.shift();}else{p.x+=dx/len*step;p.y+=dy/len*step;}continue;}
 p.timer+=dt;const task=p.task;const node=this.nodes.find(n=>n.id===task.id),building=this.buildings.find(b=>b.id===task.id);
 const vigour=(p.energy<15?.5:1)*(p.morale<30?.75:1);
 if(task.kind==='build'){if(!building||building.complete){p.task=null;continue;}building.progress+=dt*vigour*p.skills.build;p.action='Building '+DEFINITIONS[building.type].name.toLowerCase();if(building.progress>=DEFINITIONS[building.type].work){building.complete=true;building.condition=100;this.revision++;this.log(`${DEFINITIONS[building.type].name} completed by ${p.name}.`);p.history=`Helped build a ${DEFINITIONS[building.type].name.toLowerCase()}.`;this.learn(p,'build');p.task=null;}}
 else if(task.kind==='repair'){if(!building||!building.complete){p.task=null;continue;}const u=upkeepOf(building.type);
  if(!task.paid){if(this.resources.wood<u.wood||this.resources.stone<u.stone){p.task=null;continue;}this.resources.wood-=u.wood;this.resources.stone-=u.stone;task.paid=true;task.wasFailing=building.condition<25;}
  p.action='Repairing the '+DEFINITIONS[building.type].name.toLowerCase();building.condition=Math.min(100,building.condition+dt*13*vigour*p.skills.build);
  if(building.condition>=100){if(task.wasFailing)this.log(`${p.name} put the ${DEFINITIONS[building.type].name.toLowerCase()} back in order.`);this.learn(p,'build');this.revision++;p.task=null;}}
 else if(task.kind==='fell'){if(!node||node.amount<=0){p.task=null;continue;}p.action=node.type==='tree'?'Felling a tree':node.type==='stone'?'Breaking up the outcrop':'Clearing the scrub';
  if(p.timer>3.5+node.amount*.35){const kind=node.type==='tree'?'wood':node.type==='stone'?'stone':'food';p.carrying={type:kind,amount:node.amount};node.amount=0;this.nodes=this.nodes.filter(n=>n.id!==node.id);this.learn(p,kind==='food'?'food':kind);this.reindex();this.revision++;p.task=null;}}
 else if(['wood','stone','food'].includes(task.kind)){p.action=task.kind==='wood'?'Chopping timber':task.kind==='stone'?'Breaking stone':building?'Tending the garden':'Picking berries';
  if(p.timer>3.5){let base=task.kind==='food'?5:this.hasWorkshop()?5:3;let amount=Math.max(1,Math.round(base*p.skills[task.kind]));
   if(building){amount=Math.min(amount,Math.floor(building.harvest));building.harvest-=amount;}else if(node){amount=Math.min(amount,node.amount);node.amount-=amount;if(node.amount===0){this.reindex();this.revision++;}}else amount=0;
   if(amount>0){p.carrying={type:task.kind==='food'?'food':task.kind,amount};this.learn(p,task.kind);}p.task=null;}}
 else if(task.kind==='deliver'&&p.timer>1){if(p.carrying)this.resources[p.carrying.type]+=p.carrying.amount;p.carrying=null;p.task=null;}
 else if(task.kind==='eat'&&p.timer>2){if(this.resources.food>=4){this.resources.food-=4;p.hunger=Math.max(0,p.hunger-58);p.morale=Math.min(100,p.morale+4);}p.task=null;}
 else if(task.kind==='drink'&&p.timer>2){p.thirst=0;p.task=null;}
 else if(task.kind==='rest'){p.action='Resting';p.energy=Math.min(100,p.energy+dt*(building?8*(.5+.5*building.condition/100):this.warm===false?1.4:3));if(p.energy>=95)p.task=null;}
 else if(task.kind==='socialise'){const friend=this.nearest(p,this.people.filter(q=>q.id!==p.id&&q.task?.kind==='socialise'&&!q.route.length&&Math.hypot(q.x-p.x,q.y-p.y)<3))[0];
  p.action=friend?`Talking with ${friend.name}`:'Sitting by the fire';p.morale=Math.min(100,p.morale+dt*(friend?6:2));
  if(friend&&p.timer>6)this.bond(p,friend);
  if(p.timer>5&&(p.morale>=96||p.timer>26))p.task=null;}
 else if(task.kind==='idle'&&p.timer>5)p.task=null;
 }
 const capacity=this.buildings.filter(b=>b.type==='shelter'&&b.complete).length*3;
 if(capacity>this.people.length&&this.resources.food>=24&&this.people.length<12){this.arrival+=dt;if(this.arrival>90){const names=['Rowan','Elin','Tomas','Fern','Orin','Lena','Arlen','Iris','Wren'];this.addPerson(names[this.people.length-3]||'Traveller',CAMP.x,CAMP.y);this.resources.food-=8;this.arrival=0;this.log(`${this.people.at(-1).name} has joined the settlement.`);}}else this.arrival=0;
 }
 learn(p,skill){if(p.skills[skill]!==undefined)p.skills[skill]=Math.min(2.2,p.skills[skill]+.012);}
 snapshot(){return JSON.parse(JSON.stringify({version:2,time:this.time,resources:this.resources,buildings:this.buildings,paths:this.paths,people:this.people,nodes:this.nodes,events:this.events,bonds:this.bonds,priorities:this.priorities,nextId:this.nextId,arrival:this.arrival,regrow:this.regrow}));}
 static restore(data){if(!data||data.version!==2||!Array.isArray(data.people)||!data.people.length||!Array.isArray(data.buildings)||!Array.isArray(data.nodes)||!Array.isArray(data.paths)||!data.resources||!Number.isFinite(data.time))throw Error('This save could not be read.');for(const k of ['wood','food','stone'])if(!Number.isFinite(data.resources[k])||data.resources[k]<0)throw Error('Invalid resources.');for(const b of data.buildings)if(!DEFINITIONS[b.type]||DEFINITIONS[b.type].order)throw Error('Invalid building.');for(const p of data.people)if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Array.isArray(p.route))throw Error('Invalid settler.');const s=new Simulation();Object.assign(s,JSON.parse(JSON.stringify(data)));s.bonds=Array.isArray(s.bonds)?s.bonds:[];s.regrow=Number.isFinite(s.regrow)?s.regrow:0;
 for(const b of s.buildings)if(!Number.isFinite(b.condition))b.condition=100;
 for(const [i,p]of s.people.entries()){if(!TRAITS[p.trait])p.trait=TRAIT_KEYS[i%TRAIT_KEYS.length];if(!Number.isFinite(p.speed))p.speed=1;if(!Number.isFinite(p.morale))p.morale=72;if(!p.skills)p.skills={wood:1,stone:1,food:1,build:1};for(const k of TRAIT_KEYS)if(!Number.isFinite(p.skills[k]))p.skills[k]=1;}
 s.revision++;s.reindex();return s;}
}
