const crypto=require('node:crypto');
const rooms=new Map();
const moods={vibe:[3,1,4],party:[2,4,0],chill:[5,0,3],focus:[0,5,4],dream:[1,3,5],drive:[4,2,3],glow:[3,2,1]};
const token=()=>crypto.randomBytes(18).toString('hex');
const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
function queue(r){const lists=r.members.map(m=>moods[m.mood]||moods.vibe);const mixed=[];for(let i=0;i<3;i++)for(const list of lists)mixed.push(list[i]);return [...new Set(mixed)]}
function snapshot(r,viewer){let friend=0;return {inviteOrigin:r.inviteOrigin,members:r.members.map(m=>({id:m.id===viewer?m.id:`friend-${++friend}`,mood:m.mood})),queue:queue(r),song:r.song,playing:r.playing,seconds:r.seconds+(r.playing?(Date.now()-r.started)/1000:0),revision:r.revision,reaction:r.reaction?{...r.reaction,from:r.reaction.from===viewer?viewer:"friend"}:null}}
setInterval(()=>{for(const [id,r]of rooms)if(Date.now()-r.touched>6*3600000)rooms.delete(id)},60000).unref();
module.exports=async function(req,res,url){
 if(!url.pathname.startsWith('/api/rooms'))return false;
 try{
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`){reply(res,403,{error:'Недопустимый источник'});return true}
 let body={};if(req.method==='POST'){let chunks='',size=0;for await(const c of req){size+=c.length;if(size>4096){reply(res,413,{error:'Слишком большой запрос'});return true}chunks+=c}try{body=JSON.parse(chunks||'{}')}catch{reply(res,400,{error:'Неверный запрос'});return true}}
 if(url.pathname==='/api/rooms'&&req.method==='POST'){
 if(rooms.size>=500){reply(res,503,{error:'Все комнаты заняты. Попробуй позже.'});return true}
 const id=token(),client=token(),mood=moods[body.mood]?body.mood:'vibe';
 const addresses=Object.values(require('node:os').networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal);const lan=addresses.find(x=>x.address.startsWith('192.168.'))||addresses.find(x=>x.address.startsWith('10.'));const host=/^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host||'')&&lan?lan.address+':5173':req.headers.host;const r={inviteOrigin:'http://'+host,members:[{id:client,mood}],song:moods[mood][0],seconds:0,started:Date.now(),playing:false,revision:0,reaction:null,touched:Date.now()};rooms.set(id,r);reply(res,200,{room:id,client,...snapshot(r,client)});return true}
 const match=url.pathname.match(/^\/api\/rooms\/([a-f0-9]{36})(?:\/(join|action))?$/);const r=match&&rooms.get(match[1]);if(!r){reply(res,404,{error:'Комната закрыта или срок приглашения истёк.'});return true}
 if(match[2]==='join'&&req.method==='POST'){
 const known=r.members.find(m=>m.id===body.client);if(known){reply(res,200,{client:known.id,...snapshot(r,known.id)});return true}
 if(r.members.length>=8){reply(res,409,{error:'В пространстве уже 8 слушателей.'});return true}const client=token();r.members.push({id:client,mood:moods[body.mood]?body.mood:'chill'});r.revision++;r.touched=Date.now();reply(res,200,{client,...snapshot(r,client)});return true}
 const client=req.method==='GET'?url.searchParams.get('client'):body.client;const member=r.members.find(m=>m.id===client);if(!member){reply(res,403,{error:'Сначала присоединись к волне.'});return true}r.touched=Date.now();
 if(req.method==='GET'&&!match[2]){reply(res,200,snapshot(r,client));return true}
 if(req.method==='POST'&&match[2]==='action'){
 if(body.type==='mood'&&moods[body.mood]){member.mood=body.mood;r.song=queue(r)[0];r.seconds=0;r.started=Date.now()}
 else if(body.type==='play'){r.seconds=snapshot(r,client).seconds;r.started=Date.now();r.playing=true}
 else if(body.type==='pause'){r.seconds=snapshot(r,client).seconds;r.playing=false}
 else if(body.type==='next'){if(body.revision!==r.revision){reply(res,200,snapshot(r,client));return true}const q=queue(r);r.song=q[(q.indexOf(r.song)+1)%q.length];r.seconds=0;r.started=Date.now()}
 else if(body.type==='reaction'&&['♡','✦','☾'].includes(body.value)){r.reaction={value:body.value,from:client,id:token()}}
 else if(body.type==='leave'){r.members=r.members.filter(m=>m.id!==client);if(!r.members.length)rooms.delete(match[1])}
 else{reply(res,400,{error:'Неизвестное действие'});return true}r.revision++;reply(res,200,snapshot(r,client));return true}
 reply(res,405,{error:'Метод недоступен'});return true;
 }catch{if(!res.headersSent)reply(res,500,{error:'Не удалось обновить волну.'});return true}
};

