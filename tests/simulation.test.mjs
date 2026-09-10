import assert from 'node:assert/strict';
import {Simulation,terrain,SIZE,DEFINITIONS,TRAITS} from '../dist/simulation.mjs';
const tick=(s,seconds)=>{for(let i=0;i<seconds*20;i++)s.update(.05);};
const s=new Simulation();assert.equal(s.people.length,3);
const original=s.resources.wood;
assert.equal(s.place('shelter',32,34).ok,true);assert.equal(s.resources.wood,original-18);
assert.equal(s.place('shelter',32,34).ok,false);
const invalid=s.place('well',54,0);assert.equal(invalid.ok,false);
tick(s,100);assert.ok(s.buildings[0].complete,'settlers construct shelter');assert.ok(s.resources.wood>10,'settlers deliver gathered timber');
const findSpot=(type)=>{for(let y=30;y<45;y++)for(let x=27;x<43;x++)if(!s.canPlace(type,x,y))return {x,y};throw Error('no spot');};
s.resources.wood=100;s.resources.stone=40;
for(const type of ['farm','stockpile','well','workshop','shelter']){let p=findSpot(type);assert.equal(s.place(type,p.x,p.y).ok,true);}
tick(s,150);assert.ok(s.buildings.every(b=>b.complete),'all planned buildings finish');
s.resources.food=60;tick(s,100);assert.ok(s.people.length>3,'spare housing and food support growth');
const farm=s.buildings.find(b=>b.type==='farm');farm.harvest=0;tick(s,30);assert.ok(farm.harvest>0,'gardens replenish food');
const snap=s.snapshot(),restored=Simulation.restore(snap);assert.deepEqual(restored.snapshot(),snap,'save round trip preserves simulation');tick(restored,180);assert.ok(restored.people.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'loaded simulation continues');
const c=new Simulation();const planned=c.place('shelter',32,34),wood=c.resources.wood;assert.ok(c.cancel(planned.id));assert.equal(c.resources.wood,wood+18);assert.equal(c.buildings.length,0);
assert.throws(()=>Simulation.restore({version:9}),/could not be read/,'rejects a save from another version');
assert.throws(()=>Simulation.restore({version:2}),/could not be read/,'rejects a malformed save of the current version');
const p=new Simulation();p.priorities={wood:false,food:false,stone:false,build:false};const count=p.resources.wood;tick(p,20);assert.ok(p.resources.wood<=count,'disabled gathering brings nothing new home');assert.ok(p.people.every(q=>!/Gathering|Chopping|Breaking/.test(q.action)),'disabled priorities stop gathering work');
assert.equal(p.place('path',32,34).ok,true);assert.ok(p.pathSet.has('32,34'));assert.equal(p.place('path',32,34).ok,false);
console.log('PASS: placement, construction, delivery, all buildings, growth, renewable food, save/load, cancellation, priorities, paths.');
console.log(JSON.stringify({day:Math.floor(s.time/120)+1,population:s.people.length,buildings:s.buildings.length,resources:s.resources}));

// --- Consumption: hearths burn timber, buildings wear out, and settlers see to both. ---
const u=new Simulation();u.resources.wood=60;const startWood=u.resources.wood;tick(u,40);
assert.ok(u.resources.wood<startWood+400,'hearths draw on the woodpile');
const w=new Simulation();w.people=w.people.slice(0,1);w.resources.wood=10;w.priorities={wood:false,food:false,stone:false,build:false};
tick(w,300);assert.equal(w.resources.wood,0,'an unsupplied settlement burns its timber down to nothing');
assert.ok(w.events.some(e=>/fires are out/i.test(e.text)),'a cold hearth is reported in the chronicle');
const r=new Simulation();r.resources.wood=200;r.resources.stone=60;
const spot=(()=>{for(let y=30;y<45;y++)for(let x=27;x<43;x++)if(!r.canPlace('shelter',x,y))return {x,y};throw Error('no spot');})();
assert.equal(r.place('shelter',spot.x,spot.y).ok,true);tick(r,120);
const house=r.buildings[0];assert.ok(house.complete,'shelter is built');
house.condition=20;const beforeRepair=r.resources.wood;tick(r,200);
assert.ok(house.condition>60,'settlers repair a building that has fallen into disrepair');
assert.ok(r.resources.wood<beforeRepair+500,'repairs consume materials');
// A settled valley never runs out of things to do.
const busy=new Simulation();busy.resources.wood=300;busy.resources.stone=90;
for(const type of ['shelter','farm','stockpile','well']){const p=(()=>{for(let y=28;y<46;y++)for(let x=25;x<45;x++)if(!busy.canPlace(type,x,y))return {x,y};throw Error('no spot');})();busy.place(type,p.x,p.y);}
tick(busy,400);let working=0,samples=0;
for(let i=0;i<600*20;i++){busy.update(.05);if(i%200===0)for(const p of busy.people){samples++;if(!/quiet/.test(p.action))working++;}}
assert.equal(working,samples,'nobody is left standing with nothing to do');
assert.ok(busy.people.some(p=>/fire|Talking|Sitting/.test(p.action)||p.morale<100),'settlers spend their spare time together');

// --- Individuals: the founders differ, and they get better at what they do. ---
const f=new Simulation();
assert.deepEqual(f.people.map(p=>p.trait),['food','wood','build'],'the three founders have different trades');
assert.ok(new Set(f.people.map(p=>p.speed)).size>1,'the founders walk at different paces');
for(const p of f.people)assert.ok(TRAITS[p.trait],'every settler has a recognised trade');
for(const p of f.people)assert.equal(p.skills[p.trait],1.35,'a settler starts ahead in their own trade');
const skilled=f.people[1],was=skilled.skills.wood;tick(f,400);
assert.ok(f.people.some(p=>p.skills[p.trait]>1.35),'settlers improve with practice');
assert.ok(skilled.skills.wood>=was,'skill never goes backwards');
assert.ok(f.people.every(p=>p.skills.wood<=2.2),'skill is capped');

// --- Clearing: the player can take land back from the wilderness. ---
const c2=new Simulation();
const tree=c2.nodes.find(n=>n.type==='tree'&&n.amount>0&&Math.hypot(n.x-35,n.y-37)<11);
assert.equal(c2.canPlace('clear',tree.x,tree.y),null,'standing timber can be marked');
assert.ok(/nothing here/i.test(c2.canPlace('clear',35,37)),'empty ground cannot be cleared');
assert.equal(c2.place('clear',tree.x,tree.y).ok,true);assert.equal(c2.nodes.find(n=>n.id===tree.id).marked,true);
assert.equal(c2.place('clear',tree.x,tree.y).ok,false,'the same ground is not marked twice');
assert.ok(!c2.walkable(tree.x,tree.y),'a standing tree blocks the ground');
assert.ok(c2.canPlace('shelter',tree.x,tree.y),'a standing tree blocks building');
tick(c2,240);
assert.ok(!c2.nodes.some(n=>n.id===tree.id),'the marked tree is felled');
assert.ok(c2.walkable(tree.x,tree.y),'cleared ground is walkable');
assert.ok(c2.resources.wood>28,'felled timber is carried home');
const c3=new Simulation();const t3=c3.nodes.find(n=>n.type==='tree'&&n.amount>0);
c3.place('clear',t3.x,t3.y);assert.equal(c3.unmark(t3.id),true);assert.ok(!c3.nodes.find(n=>n.id===t3.id).marked,'a clearing order can be called off');
assert.equal(c3.unmark(t3.id),false,'calling off an order twice does nothing');
// The forest is alive: it slowly comes back where nobody is building.
const g=new Simulation();const trees0=g.nodes.filter(n=>n.type==='tree').length;tick(g,1200);
assert.ok(g.nodes.filter(n=>n.type==='tree').length>trees0,'woodland regrows over time');
const near=g.nodes.filter(n=>n.type==='tree'&&Math.hypot(n.x-35,n.y-37)<6).length;
assert.equal(near,0,'the founding clearing does not grow over');

// --- Save and load survive the new state. ---
const sv=new Simulation();sv.resources.wood=120;sv.place('clear',c2.nodes[0].x,c2.nodes[0].y);tick(sv,150);
const round=Simulation.restore(sv.snapshot());
assert.deepEqual(round.snapshot(),sv.snapshot(),'the new state round-trips');
assert.ok(round.people.every(p=>TRAITS[p.trait]&&Number.isFinite(p.morale)&&p.skills),'settlers keep who they are');
assert.ok(round.buildings.every(b=>Number.isFinite(b.condition)),'buildings keep their condition');
console.log('PASS: hearth consumption, disrepair and repair, no idle settlers, founder traits and learned skill, land clearing and regrowth, extended save/load.');
