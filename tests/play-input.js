import { expect } from '@playwright/test';
import { vocabulary } from '../src/lesson.js';
import { makeRoom,isWalkable,distance } from '../src/world.js';
import { kindleMarsh } from './marsh-journey.js';
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
async function walkTo(page,target,{exact=false,avoidEnemies=true}={}){
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
      if(avoidKeeper&&clearance&&isWalkable(room,n.x,n.y)&&!objects.some(o=>distance(o,n)===0)&&(room.marsh||!avoidEnemies||!room.shades.some(e=>distance(e,n)<=8)))q.push({...n,path:[...p.path,n]});
    }
  }
  if(!path)throw Error(`No path to ${JSON.stringify(target)}`);
  // Hold keys along straight segments instead of simulating frame-sized key taps.
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
  for(let attempt=0;attempt<3;attempt++){
    try{await openTrial(page,index);while((await state(page)).mode==='puzzle')await correct(page);return;}
    catch(error){
      // The full quest can arrive with fewer hearts than the isolated practice run.
      // Recover through the actual checkpoint UI; never inject progress or health.
      if((await state(page)).mode!=='lost'||attempt===2)throw error;
      await page.getByRole('button',{name:'Return to chamber'}).click();
    }
  }
}


export {game,state,start,hold,settle,moveAxis,walkTo,openTrial,contact,clickWorld,correct,finishTrial};
