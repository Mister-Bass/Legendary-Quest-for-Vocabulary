import { expect } from '@playwright/test';
import { makeMarshRoom,marshWalkable,at } from '../src/marsh-map.js';
// Real input route: defeat a Wisp, pick up its drop, and carry it to the lantern.
export async function kindleMarsh(page,index,{state,moveAxis,walkTo,contact}){
  const go=async(x,y)=>walkTo(page,{x,y},{exact:true,avoidEnemies:false,attack:index!==2});
  if(index===0){await go(15,26);await go(4,26);await go(4,13);await go(5,13);}
  if(index===1)await go(26,6);
  const aimAt=async(target,s)=>{
    await page.locator('#game canvas').scrollIntoViewIfNeeded();s=await state(page);const box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom);
    const x=(target.x-Number(s.cameraX)-400)*z+400,y=(target.y-Number(s.cameraY)-280)*z+280;
    await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);
  };
  const clearMelee=async()=>{
    await page.keyboard.down('q');
    try{for(let i=0;i<12;i++){
      const s=await state(page);if(s.mode!=='playing')return;
      const nearby=JSON.parse(s.enemies).filter(e=>e.active&&!e.hidden&&e.type.includes('slurg')&&Math.hypot(e.x-Number(s.px),e.y-Number(s.py))<170).sort((a,b)=>Math.hypot(a.x-Number(s.px),a.y-Number(s.py))-Math.hypot(b.x-Number(s.px),b.y-Number(s.py)));
      if(!nearby.length)return;await aimAt(nearby[0],s);await page.keyboard.down('Space');await page.waitForTimeout(200);
    }}finally{await page.keyboard.up('Space');await page.keyboard.up('q');}
  };
  const defeatCaster=async id=>{
    await page.keyboard.down('q');
    try{for(let i=0;i<8;i++){
      await clearMelee();await page.keyboard.down('q');
      const s=await state(page),enemy=JSON.parse(s.enemies).find(e=>e.id===id);if(s.mode!=='playing')throw Error('Return to the chamber checkpoint before continuing combat.');if(!enemy.active)return;
      await aimAt(enemy,s);await page.keyboard.press('f');await page.waitForTimeout(850);
    }}finally{await page.keyboard.up('q');}
    await expect.poll(async()=>JSON.parse((await state(page)).enemies).find(e=>e.id===id).active).toBe(false);
  };
  if(index===2){
    // Clear the mud-ball crossfire through ordinary combat before the timed run.
    await go(26,6);await go(15,6);await defeatCaster(2);
    await go(26,6);await go(26,20);await defeatCaster(4);
    await go(26,6);await go(5,6);await go(5,20);await defeatCaster(3);await go(5,6);
  }
  const id=index===1?1:0;
  if(index===2){
    // Circle outside the flee radius before approaching from the north.
    await go(12,6);await page.waitForTimeout(4500);
    // Keep the sword sheathed until the Wisp has been herded south.
    await expect.poll(async()=>JSON.parse((await state(page)).enemies).find(e=>e.id===0).active,{timeout:20000}).toBe(true);
    const r=makeMarshRoom(),objects=[r.guide,r.exit,r.heart,...r.seals];
    for(let step=0;step<40;step++){
      const snapshot=await state(page);if(snapshot.mode!=='playing')throw Error(`The marsh encounter requires checkpoint recovery: ${snapshot.mode}`);
      const enemy=JSON.parse(snapshot.enemies).find(e=>e.id===0);if(enemy.y>=930)break;
      // Stay northeast of the Wisp and advance slowly, so terrain cannot leave it behind.
      const candidates=[];
      for(let y=2;y<29;y++)for(let x=2;x<29;x++){
        const dx=x*40+20-enemy.x,dy=enemy.y-(y*40+20);
        if(dx>=25&&dx<=145&&dy>=40&&dy<=140&&marshWalkable(r,x,y)&&!r.water.has(`${x},${y}`)&&!objects.some(p=>Math.hypot(p.x-x,p.y-y)<1.5))candidates.push({x,y,score:Math.hypot(dx-80,dy-80)});
      }
      if(!candidates.length){
        // At the northern wall there is no place to stand behind the Wisp.
        // Retreat through normal controls and let it drift back toward its home.
        await go(12,6);await page.waitForTimeout(4500);continue;
      }
      candidates.sort((a,b)=>a.score-b.score);
      await walkTo(page,candidates[0],{exact:true,avoidEnemies:false,attack:false,guard:true});await page.waitForTimeout(200);
    }
    // Herding only prepares the route. Regardless of where terrain leaves the
    // Wisp, the test must collect its flame and complete the real timed puzzle.
  }
  // Corner the western Wisp near the crossing, then carry its ten-second flame.
  for(let attempt=0;attempt<16;attempt++){
    await clearMelee();
    const s=await state(page);if(s.mode!=='playing')throw Error(`The marsh encounter requires checkpoint recovery: ${s.mode}`);const enemy=JSON.parse(s.enemies).find(e=>e.id===id);if(!enemy.active)break;
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
    await page.keyboard.down('q');try{await page.keyboard.press(index===2?'b':'f');await page.waitForTimeout(400);}finally{await page.keyboard.up('q');}
  }
  const hunt=await state(page);
  await expect.poll(async()=>JSON.parse((await state(page)).enemies).find(e=>e.id===id).active,{timeout:5000,message:JSON.stringify({lantern:index,mode:hunt.mode,hero:[hunt.px,hunt.py],flame:hunt.flameSeconds,wisp:JSON.parse(hunt.enemies).find(e=>e.id===id)})}).toBe(false);
  let s=await state(page),drop=JSON.parse(s.flameDrops).sort((a,b)=>b.until-a.until)[0];
  if(drop){const room=makeMarshRoom(),objects=[room.guide,room.exit,room.heart,...room.seals],candidates=[];
    for(let y=Math.floor(drop.y/40)-1;y<=Math.floor(drop.y/40)+1;y++)for(let x=Math.floor(drop.x/40)-1;x<=Math.floor(drop.x/40)+1;x++)if(marshWalkable(room,x,y)&&!objects.some(p=>p.x===x&&p.y===y)&&Math.hypot(x*40+20-drop.x,y*40+20-drop.y)<32)candidates.push({x,y});
    candidates.sort((a,b)=>Math.hypot(a.x*40+20-drop.x,a.y*40+20-drop.y)-Math.hypot(b.x*40+20-drop.x,b.y*40+20-drop.y));
    expect(candidates.length).toBeGreaterThan(0);await walkTo(page,candidates[0],{exact:true,avoidEnemies:false});
    const remains=async()=>JSON.parse((await state(page)).flameDrops).some(d=>Math.hypot(d.x-drop.x,d.y-drop.y)<1);
    if(await remains()){await page.keyboard.down('q');try{await contact(page,{x:drop.x/40-.5,y:drop.y/40-.5},async()=>!(await remains()));}finally{await page.keyboard.up('q');}}
  }
  if(['opening','puzzle'].includes((await state(page)).mode)){await expect(page.locator('#game')).toHaveAttribute('data-mode','puzzle');return;}
  if(Number((await state(page)).flameSeconds)<=0)throw Object.assign(Error('The dropped Wisp Flame faded before pickup; collect another.'),{marshFlameExpired:true});
  if(index===0){
    await page.getByRole('button',{name:'Marsh map',exact:true}).click();
    const flame=(await state(page)).flameSeconds;expect(Number(flame)).toBeGreaterThan(0);await page.waitForTimeout(350);expect((await state(page)).flameSeconds).toBe(flame);
    await page.getByRole('button',{name:'Close marsh map'}).click();await go(5,6);
  }
  if(index===1)await go(26,6);
  if(index===2)await walkTo(page,{x:15,y:25},{exact:true,avoidEnemies:false});
  const target=[{x:6,y:4},{x:25,y:4},{x:15,y:14}][index];await walkTo(page,target,{avoidEnemies:false});
  const arrival=await state(page);if(arrival.mode==='playing'&&Number(arrival.flameSeconds)<=0)throw Object.assign(Error(`The carried Wisp Flame expired after pickup at ${drop?.x},${drop?.y}; arrival ${arrival.px},${arrival.py}. Collect another through normal play.`),{marshFlameExpired:true});
  if((await state(page)).mode==='playing')await contact(page,target,()=>state(page).then(s=>s.mode==='opening'||s.mode==='puzzle'));
  await expect(page.locator('#game')).toHaveAttribute('data-mode','puzzle');
}

export async function waitForMarshPads(page,state){
  await page.locator('#game canvas').scrollIntoViewIfNeeded();await page.keyboard.down('q');
  const deadline=Date.now()+30000;
  try{while(Date.now()<deadline){
    const s=await state(page);if(s.mode!=='playing')break;if(JSON.parse(s.pads).length===0)break;
    const bolts=JSON.parse(s.projectiles).sort((a,b)=>Math.hypot(a.x-Number(s.px),a.y-Number(s.py))-Math.hypot(b.x-Number(s.px),b.y-Number(s.py)));
    if(bolts.length){const p=bolts[0],box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom),x=(p.x-Number(s.cameraX)-400)*z+400,y=(p.y-Number(s.cameraY)-280)*z+280;await page.mouse.move(box.x+Math.max(5,Math.min(795,x))/800*box.width,box.y+Math.max(5,Math.min(555,y))/560*box.height);}
    await page.waitForTimeout(80);
  }if((await state(page)).mode==='playing')await expect(page.locator('#game')).toHaveAttribute('data-pads','[]');}finally{await page.keyboard.up('q');}
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

async function fightMarshBoss(page,{state,walkTo}){
  const game=page.locator('#game');if((await state(page)).bossPhase==='defeated')return;
  if((await state(page)).mode==='boss-rise'){
    const before=await state(page);await page.keyboard.press('w');expect((await state(page)).px).toBe(before.px);expect((await state(page)).py).toBe(before.py);
    await page.screenshot({path:'test-results/croak-emergence.png'});
  }
  await expect(game).toHaveAttribute('data-mode','playing',{timeout:8000});
  await expect(game).toHaveAttribute('data-arena-gate-lift','1.00');
  await page.getByRole('button',{name:'Overworld atlas'}).click();await page.getByRole('button',{name:'Explore overworld'}).click();
  await expect(game).toHaveAttribute('data-mode','playing');await expect(page.locator('#feedback')).toContainText('arena is sealed');
  await walkTo(page,{x:15,y:13},{exact:true,avoidEnemies:false,guard:true});
  const aim=async()=>{const s=await state(page),box=await page.locator('#game canvas').boundingBox(),z=Number(s.zoom),b=at(makeMarshRoom().boss);await page.mouse.move(box.x+((b.x-Number(s.cameraX)-400)*z+400)/800*box.width,box.y+((b.y-Number(s.cameraY)-280)*z+280)/560*box.height);};
  await page.locator('#game canvas').scrollIntoViewIfNeeded();await aim();await expect(game).toHaveAttribute('data-mode','playing');await page.keyboard.down('q');
  try{
    await expect.poll(async()=>(await state(page)).bossPhase,{timeout:30000,intervals:[30]}).toBe('tongue');
    // Hold the normal throw control until a hit lands during a lash. A single
    // OS key tap can arrive after the short opening on a slow Canvas renderer.
    await page.keyboard.down('f');
    try{await expect(game).toHaveAttribute('data-boss-phase','stunned',{timeout:10000});}finally{await page.keyboard.up('f');}
  }finally{await page.keyboard.up('q');}
  await page.keyboard.down('Space');try{await expect(game).toHaveAttribute('data-boss-phase','defeated',{timeout:6000});}finally{await page.keyboard.up('Space');}
  await expect(game).toHaveAttribute('data-boss-hp','0');await page.screenshot({path:'test-results/croak-defeated.png'});
}

export async function defeatMarshBoss(page,helpers){
  for(let attempt=0;attempt<3;attempt++){
    if((await helpers.state(page)).mode==='lost')await page.getByRole('button',{name:'Return to chamber'}).click();
    try{return await fightMarshBoss(page,helpers);}catch(error){if((await helpers.state(page)).mode!=='lost'||attempt===2)throw error;}
  }
}
