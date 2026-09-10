// Optional WebMCP integration. Browsers without this proposal keep the same game.
export function registerGameTools(api){
 const context=globalThis.document?.modelContext;
 if(!context?.registerTool)return false;
 const lifecycle=new AbortController();
 const definitions=[
  {name:'read_settlement',title:'Inspect settlement',description:'Read resources, settlers, buildings, and simulation speed in the current valley.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>api.read()},
  {name:'place_settlement_building',title:'Place a building',description:'Reserve resources and place one building, path or clearing order at integer world coordinates. Settlers perform the work.',inputSchema:{type:'object',properties:{type:{type:'string',enum:['shelter','farm','stockpile','well','workshop','path','clear']},x:{type:'integer',minimum:1,maximum:74},y:{type:'integer',minimum:1,maximum:74}},required:['type','x','y'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!['shelter','farm','stockpile','well','workshop','path','clear'].includes(input.type)||!Number.isInteger(input.x)||!Number.isInteger(input.y))throw Error('Supply a valid building type and integer x/y coordinates.');return api.place(input.type,input.x,input.y);}},
  {name:'set_simulation_speed',title:'Set time speed',description:'Pause the valley or run it at normal or triple speed.',inputSchema:{type:'object',properties:{speed:{type:'number',enum:[0,1,3]}},required:['speed'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||![0,1,3].includes(input.speed))throw Error('Speed must be 0, 1, or 3.');return api.speed(input.speed);}}
 ];
 for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional integration never blocks play. */}}
 globalThis.addEventListener?.('pagehide',()=>lifecycle.abort(),{once:true});
 return true;
}
