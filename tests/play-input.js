import { expect } from '@playwright/test';
import { vocabulary } from '../src/lesson.js';
import { makeRoom,isWalkable,distance } from '../src/world.js';
import { kindleMarsh,waitForMarshPads } from './marsh-journey.js';
const game=page=>page.locator('#game');
const state=page=>game(page).evaluate(el=>({...el.dataset}));
async function start(page){
  await page.goto('/');await expect(game(page)).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Begin adventure'}).click();
  await expect(game(page)).toHaveAttribute('data-mode','playing');
}
async function hold(page,key,ms){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}
async function settle(page){await expect.poll(async()=>Number((await state(page)).speed),{timeout:6000}).toBeLessThan(1);}
async function moveAxis(page,axis,target,nearGoal=null){
  const s=await state(page),from=Number(s[axis]),sign=Math.sign(target-from);
  if(Math.abs(target-from)<6)return;
  const key=axis==='px'?(sign>0?'ArrowRight':'ArrowLeft'):(sign>0?'ArrowDown':'ArrowUp');
  await page.keyboard.down(key);
  try {await page.waitForFunction(({axis,target,sign,nearGoal,chapter})=>{
    const el=document.getElementById('game');return el.dataset.chapter!==chapter||el.dataset.mode!=='playing'||(Number(el.dataset[axis])-target)*sign>=-7||(nearGoal&&Math.hypot(Number(el.dataset.px)-nearGoal.x,Number(el.dataset.py)-nearGoal.y)<60);
  },{axis,target,sign,nearGoal,chapter:s.chapter},{timeout:Math.abs(target-from)/100*1000+10000});}
  finally {await page.keyboard.up(key);}
  await settle(page);
  // Contact can open a trial during the final segment, especially at lower frame rates.
}
async function walkMarshPath(page,path,chapter,origin){
  // Sprint along straight runs; shield-walk at corners and against incoming mud.
  // Every action below is normal keyboard/mouse input; game state is read only.
  const held=new Set(),turns=[];let previous=origin,blocking=false;
  for(let i=0;i<path.length;i++){const p=path[i],dx=p.x-previous.x,dy=p.y-previous.y,next=path[i+1];if(!next||next.x-p.x!==dx||next.y-p.y!==dy)turns.push({...p,horizontal:dx!==0});previous=p;}
  await page.locator('#game canvas').scrollIntoViewIfNeeded();const box=await page.locator('#game canvas').boundingBox();
  await page.keyboard.up('q');await page.keyboard.down('Space');
  const position=()=>game(page).evaluate(el=>({mode:el.dataset.mode,chapter:el.dataset.chapter,px:Number(el.dataset.px),py:Number(el.dataset.py),falls:el.dataset.falls,cameraX:Number(el.dataset.cameraX),cameraY:Number(el.dataset.cameraY),zoom:Number(el.dataset.zoom),bolts:JSON.parse(el.dataset.projectiles||'[]')}));
  const initialFalls=(await position()).falls;
  try{for(const point of turns){
    const target={px:point.x*40+20,py:point.y*40+20},started=Date.now();let progressed=started,last=null;
    for(;;){
      const s=await position();if(s.mode!=='playing'||s.chapter!==chapter)return;
      if(s.falls!==initialFalls)throw Object.assign(Error('A sinking pad rescued the traveler; replan from the safe bank.'),{marshFall:true});
      const dx=target.px-s.px,dy=target.py-s.py;if(Math.hypot(dx,dy)<=14)break;
      if(!last||Math.hypot(s.px-last.px,s.py-last.py)>3){last=s;progressed=Date.now();}
      if(Date.now()-progressed>4000||Date.now()-started>60000){const diagnostic=await game(page).evaluate(el=>({visibility:document.visibilityState,focused:document.hasFocus(),position:{x:el.dataset.px,y:el.dataset.py,speed:el.dataset.speed}}));throw Error(`Marsh steering stalled at ${s.px},${s.py} toward ${target.px},${target.py}; falls=${s.falls}; ${JSON.stringify(diagnostic)}`);}
      const incoming=s.bolts.filter(p=>p.vx*(s.px-p.x)+p.vy*(s.py-p.y)>0&&Math.hypot(p.x-s.px,p.y-s.py)<260).sort((a,b)=>Math.hypot(a.x-s.px,a.y-s.py)-Math.hypot(b.x-s.px,b.y-s.py));
      const precision=Math.hypot(dx,dy)<=45||Math.abs(point.horizontal?dy:dx)>10||incoming.length>0;if(precision!==blocking){blocking=precision;if(blocking)await page.keyboard.down('q');else await page.keyboard.up('q');}
      if(incoming.length){const p=incoming[0],x=(p.x-s.cameraX-400)*s.zoom+400,y=(p.y-s.cameraY-280)*s.zoom+280;await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);}
      const next=new Set();if(Math.abs(dx)>5)next.add(dx>0?'ArrowRight':'ArrowLeft');if(Math.abs(dy)>5)next.add(dy>0?'ArrowDown':'ArrowUp');
      for(const key of [...held])if(!next.has(key)){await page.keyboard.up(key);held.delete(key);}
      for(const key of next)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
      await page.waitForTimeout(35);
    }
  }}finally{for(const key of held)await page.keyboard.up(key);await page.keyboard.up('Space');await page.keyboard.up('q');}
  await settle(page);
}
async function walkTo(page,target,{exact=false,avoidEnemies=true,rescues=0}={}){
  const s=await state(page),room=makeRoom(Number(s.chapter),5),origin={x:Math.floor(Number(s.px)/40),y:Math.floor(Number(s.py)/40)};
  const objects=[room.guide,room.exit,...room.seals,...(room.heart?[room.heart]:[])],chapter=s.chapter;
  const q=[{...origin,path:[]}],seen=new Set();let path;
  for(let i=0;i<q.length;i++){
    const p=q[i],key=`${p.x},${p.y}`;if(seen.has(key))continue;seen.add(key);
    if(distance(p,target)<=(exact?0:1)){path=p.path;break;}
    for(const [dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){
      const n={x:p.x+dx,y:p.y+dy};
      // Leave steering room at corners: WebKit can render another frame between
      // observing a position and releasing a key. Use open corridors for the tour;
      // dedicated collision tests exercise the narrow terrain edges separately.
      const atGoal=distance(n,target)<=(exact?0:1);
      const clearance=room.marsh||atGoal||[-1,0,1].every(ox=>[-1,0,1].every(oy=>isWalkable(room,n.x+ox,n.y+oy)));
      const avoidKeeper=distance(target,room.guide)===0||Math.hypot(n.x-room.guide.x,n.y-room.guide.y)>=2;
      const avoidHeart=!room.heart||s.heartPiece==='true'||distance(target,room.heart)===0||distance(n,room.heart)>1.3;
      if(avoidHeart&&avoidKeeper&&clearance&&isWalkable(room,n.x,n.y)&&!objects.some(o=>distance(o,n)===0)&&(room.marsh||!avoidEnemies||!room.shades.some(e=>distance(e,n)<=8)))q.push({...n,path:[...p.path,n]});
    }
  }
  if(!path)throw Error(`No path to ${JSON.stringify(target)}`);
  // Hold keys along straight segments instead of simulating frame-sized key taps.
  if(room.marsh){
    try{await walkMarshPath(page,path,chapter,origin);return;}
    catch(error){
      if(!error.marshFall||rescues>=2||Number(s.flameSeconds)>0)throw error;
      await waitForMarshPads(page,state);return walkTo(page,target,{exact,avoidEnemies,rescues:rescues+1});
    }
  }
  let previous=origin;
  for(let i=0;i<path.length;){
    const at=await state(page);
    if(at.chapter!==chapter||at.mode!=='playing'||(!exact&&Math.hypot(Number(at.px)-(target.x*40+20),Number(at.py)-(target.y*40+20))<60))return;
    const dx=path[i].x-previous.x,dy=path[i].y-previous.y;let end=i;
    while(end+1<path.length&&path[end+1].x-path[end].x===dx&&path[end+1].y-path[end].y===dy)end++;
    await moveAxis(page,dx?'px':'py',(dx?path[end].x:path[end].y)*40+20,exact?null:{x:target.x*40+20,y:target.y*40+20});
    previous=path[end];i=end+1;
  }
}
async function openTrial(page,index){
  if((await state(page)).chapter==='1'){await kindleMarsh(page,index,{state,moveAxis,walkTo,contact});return;}
  const s=await state(page),target=makeRoom(Number(s.chapter),5).seals[index];await walkTo(page,target);
  if((await state(page)).mode==='opening'){await expect(game(page)).toHaveAttribute('data-mode','puzzle');return;}
  if((await state(page)).mode==='puzzle')return;
  await contact(page,target,()=>game(page).getAttribute('data-mode').then(mode=>mode==='opening'||mode==='puzzle'));
  await expect(game(page)).toHaveAttribute('data-mode','puzzle');
}
async function contact(page,target,done){
  let at=await state(page),dx=target.x*40+20-Number(at.px),dy=target.y*40+20-Number(at.py);
  // Align the approach so continuous steering makes actual contact, not just proximity.
  const horizontal=Math.abs(dx)>Math.abs(dy),minor=horizontal?dy:dx;
  if(Math.abs(minor)>18){
    await moveAxis(page,horizontal?'py':'px',(horizontal?target.y:target.x)*40+20);
  }
  // Correct any key-release latency with bounded taps before the contact run.
  for(let i=0;i<6;i++){
    if(await done())return;
    const aligned=await state(page),error=(horizontal?target.y:target.x)*40+20-Number(aligned[horizontal?'py':'px']);
    if(Math.abs(error)<=12)break;
    const key=horizontal?(error>0?'ArrowDown':'ArrowUp'):(error>0?'ArrowRight':'ArrowLeft');
    await page.keyboard.press(key,{delay:Math.min(120,Math.max(25,(Math.abs(error)-8)/170*1000))});await settle(page);
  }
  if(await done())return;
  at=await state(page);dx=target.x*40+20-Number(at.px);dy=target.y*40+20-Number(at.py);
  const key=Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp';
  await page.keyboard.down(key);
  try{await expect.poll(done,{timeout:5000}).toBeTruthy();}finally{await page.keyboard.up(key);}
}
async function clickWorld(page,x,y,button='left'){
  const s=await state(page),box=await page.locator('#game canvas').boundingBox(),zoom=Number(s.zoom);
  const sx=(x-Number(s.cameraX)-400)*zoom+400,sy=(y-Number(s.cameraY)-280)*zoom+280;
  await page.mouse.click(box.x+Math.max(5,Math.min(795,sx))/800*box.width,box.y+Math.max(5,Math.min(555,sy))/560*box.height,{button});
}
async function correct(page){
  const id=Number((await state(page)).quizId),answer=id%3===2?vocabulary[id].definition:vocabulary[id].term;
  await page.locator('#answers button').filter({has:page.getByText(answer,{exact:true})}).click();
}
async function finishTrial(page,index){
  for(let attempt=0;attempt<4;attempt++){
    try{await openTrial(page,index);while((await state(page)).mode==='puzzle')await correct(page);return;}
    catch(error){
      // The full quest can arrive with fewer hearts than the isolated practice run.
      // Recover through the actual checkpoint UI; never inject progress or health.
      const current=await state(page);if(attempt===3)throw error;
      console.log(`Marsh trial ${index+1} recovery ${attempt+1}: ${String(error.message).split('\n')[0]}; mode=${current.mode}, flame=${current.flameSeconds}`);
      if(current.mode==='lost')await page.getByRole('button',{name:'Return to chamber'}).click();
      else if(current.chapter==='1'&&(error.marshFall||error.marshFlameExpired))await waitForMarshPads(page,state);
      else throw error;
    }
  }
}


export {game,state,start,hold,settle,moveAxis,walkTo,openTrial,contact,clickWorld,correct,finishTrial};
