import { expect } from '@playwright/test';
import { makeMarshRoom,marshWalkable } from '../src/marsh-map.js';
// Real input route: defeat a Wisp, pick up its drop, and carry it to the lantern.
export async function kindleMarsh(page,index,{state,moveAxis,walkTo,contact}){
  const go=async(x,y)=>walkTo(page,{x,y},{exact:true,avoidEnemies:false});
  const dash=async(axis,target)=>{
    const from=Number((await state(page))[axis]),sign=Math.sign(target-from),key=axis==='px'?(sign>0?'ArrowRight':'ArrowLeft'):(sign>0?'ArrowDown':'ArrowUp');let last=0;
    await page.keyboard.down(key);
    try{for(let i=0;i<200;i++){const s=await state(page),remaining=(target-Number(s[axis]))*sign;if(remaining<=7)break;if(remaining>170&&Date.now()-last>1050){await page.keyboard.press('Shift');last=Date.now();}await page.waitForTimeout(60);}}
    finally{await page.keyboard.up(key);}await page.waitForTimeout(40);
  };
  if(index===0){await go(15,26);await go(4,26);await go(4,13);await go(5,13);}
  if(index===1)await go(26,6);
  if(index===2)await go(5,6);
  const aimAt=async(target,s)=>{
    await page.locator('#game canvas').scrollIntoViewIfNeeded();s=await state(page);const box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom);
    const x=(target.x-Number(s.cameraX)-400)*z+400,y=(target.y-Number(s.cameraY)-280)*z+280;
    await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);
  };
  const clearMelee=async()=>{
    try{for(let i=0;i<12;i++){
      const s=await state(page);if(s.mode!=='playing')return;
      const nearby=JSON.parse(s.enemies).filter(e=>e.active&&!e.hidden&&e.type.includes('slurg')&&Math.hypot(e.x-Number(s.px),e.y-Number(s.py))<170).sort((a,b)=>Math.hypot(a.x-Number(s.px),a.y-Number(s.py))-Math.hypot(b.x-Number(s.px),b.y-Number(s.py)));
      if(!nearby.length)return;await aimAt(nearby[0],s);await page.keyboard.down('Space');await page.waitForTimeout(200);
    }}finally{await page.keyboard.up('Space');}
  };
  const id=index===1?1:0;
  // Approach the western Wisp from outside its threat radius. The island trial
  // then exercises a genuine ten-second bank-and-pad run using timed rolls.
  for(let attempt=0;attempt<16;attempt++){
    await clearMelee();
    const s=await state(page),enemy=JSON.parse(s.enemies).find(e=>e.id===id);if(!enemy.active)break;
    if(Math.hypot(enemy.x-Number(s.px),enemy.y-Number(s.py))>180){
      const r=makeMarshRoom(),objects=[r.guide,r.exit,r.heart,...r.seals],near=[];
      for(let y=2;y<30;y++)for(let x=2;x<30;x++)if(marshWalkable(r,x,y)&&!r.water.has(`${x},${y}`)&&!objects.some(p=>Math.hypot(p.x-x,p.y-y)<2)&&Math.hypot(x*40+20-enemy.x,y*40+20-enemy.y)<130)near.push({x,y});
      near.sort((a,b)=>Math.abs(a.x*40+20-Number(s.px))+Math.abs(a.y*40+20-Number(s.py))-Math.abs(b.x*40+20-Number(s.px))-Math.abs(b.y*40+20-Number(s.py)));
      expect(near.length).toBeGreaterThan(0);await go(near[0].x,near[0].y);continue;
    }
    await page.locator('#game canvas').scrollIntoViewIfNeeded();
    const camera=await state(page),box=await page.locator('#game canvas').boundingBox(),z=Number(camera.zoom);
    const sx=(enemy.x-Number(camera.cameraX)-400)*z+400,sy=(enemy.y-Number(camera.cameraY)-280)*z+280;
    await page.mouse.move(box.x+Math.max(5,Math.min(795,sx))/800*box.width,box.y+Math.max(5,Math.min(555,sy))/560*box.height);
    await page.keyboard.press(index===2?'b':'f');await page.waitForTimeout(400);
  }
  await expect.poll(async()=>JSON.parse((await state(page)).enemies).find(e=>e.id===id).active,{timeout:5000}).toBe(false);
  let s=await state(page),drop=JSON.parse(s.flameDrops)[0];
  if(Number(s.flameSeconds)===0){
    expect(drop,'Wisp dropped a flame').toBeTruthy();const room=makeMarshRoom(),objects=[room.guide,room.exit,room.heart,...room.seals],candidates=[];
    for(let y=Math.floor(drop.y/40)-1;y<=Math.floor(drop.y/40)+1;y++)for(let x=Math.floor(drop.x/40)-1;x<=Math.floor(drop.x/40)+1;x++)if(marshWalkable(room,x,y)&&!objects.some(p=>p.x===x&&p.y===y)&&Math.hypot(x*40+20-drop.x,y*40+20-drop.y)<32)candidates.push({x,y});
    candidates.sort((a,b)=>Math.hypot(a.x*40+20-drop.x,a.y*40+20-drop.y)-Math.hypot(b.x*40+20-drop.x,b.y*40+20-drop.y));
    expect(candidates.length).toBeGreaterThan(0);await walkTo(page,candidates[0],{exact:true,avoidEnemies:false});
  }
  if(['opening','puzzle'].includes((await state(page)).mode)){await expect(page.locator('#game')).toHaveAttribute('data-mode','puzzle');return;}
  await expect.poll(async()=>Number((await state(page)).flameSeconds)).toBeGreaterThan(0);
  if(index===0){
    await page.getByRole('button',{name:'Marsh map',exact:true}).click();
    const flame=(await state(page)).flameSeconds;expect(Number(flame)).toBeGreaterThan(0);await page.waitForTimeout(350);expect((await state(page)).flameSeconds).toBe(flame);
    await page.getByRole('button',{name:'Close marsh map'}).click();await go(5,6);
  }
  if(index===1)await go(26,6);
  if(index===2){await go(4,Math.floor(Number((await state(page)).py)/40));await dash('py',1020);await dash('px',660);}
  const target=[{x:6,y:4},{x:25,y:4},{x:15,y:14}][index];await walkTo(page,target,{avoidEnemies:false});
  if((await state(page)).mode==='playing')await contact(page,target,()=>state(page).then(s=>s.mode==='opening'||s.mode==='puzzle'));
  await expect(page.locator('#game')).toHaveAttribute('data-mode','puzzle');
}

export async function waitForMarshPads(page,state){
  await page.locator('#game canvas').scrollIntoViewIfNeeded();await page.keyboard.down('q');
  try{for(let i=0;i<85;i++){
    const s=await state(page);if(s.mode!=='playing')break;if(JSON.parse(s.pads).length===0)break;
    const bolts=JSON.parse(s.projectiles).sort((a,b)=>Math.hypot(a.x-Number(s.px),a.y-Number(s.py))-Math.hypot(b.x-Number(s.px),b.y-Number(s.py)));
    if(bolts.length){const p=bolts[0],box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom),x=(p.x-Number(s.cameraX)-400)*z+400,y=(p.y-Number(s.cameraY)-280)*z+280;await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);}
    await page.waitForTimeout(80);
  }}finally{await page.keyboard.up('q');}
}

export async function guardMarshExit(page,state,walk){
  const attempt=async()=>{
    await page.locator('#game canvas').scrollIntoViewIfNeeded();await page.keyboard.down('q');let running=true;
    const guard=(async()=>{while(running){
      const s=await state(page);if(s.mode!=='playing')break;
      const targets=JSON.parse(s.projectiles).sort((a,b)=>Math.hypot(a.x-Number(s.px),a.y-Number(s.py))-Math.hypot(b.x-Number(s.px),b.y-Number(s.py)));
      if(targets.length){const p=targets[0],box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom),x=(p.x-Number(s.cameraX)-400)*z+400,y=(p.y-Number(s.cameraY)-280)*z+280;await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);}
      await page.waitForTimeout(90);
    }})();
    try{await walk();}finally{running=false;await guard;await page.keyboard.up('q');}
  };
  if((await state(page)).mode==='lost')await page.getByRole('button',{name:'Return to chamber'}).click();
  await attempt();
  if((await state(page)).mode==='lost'){await page.getByRole('button',{name:'Return to chamber'}).click();await expect(page.locator('#game')).toHaveAttribute('data-keys','3');await attempt();}
}
