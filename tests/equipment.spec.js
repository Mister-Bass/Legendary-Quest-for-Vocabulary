import {test,expect} from '@playwright/test';
import {ITEM_IDS,rollItem,itemShot,itemAction} from '../src/equipment.js';
import {MarshModel} from '../src/marsh-model.js';import {makeMarshRoom} from '../src/marsh-map.js';
import {start,state,finishTrial,walkTo,contact,completeReward} from './play-input.js';
test('four equally sized reward ranges and ownership prevent unearned equipment',()=>{
  expect(ITEM_IDS.map((_,i)=>rollItem(()=>i/4+.125))).toEqual(ITEM_IDS);
  for(const action of ['item','shield','throw','bomb'])expect(itemAction(null,action)).toBe(false);
  expect(itemShot(null,{x:0,y:0,facing:'up'},null,1,-10)).toBe(null);
  const m=new MarshModel(makeMarshRoom());m.throwItem();m.throwItem(true);m.tick(.01,{item:true,shield:true});expect(m.items).toHaveLength(0);expect(m.shield).toBe(false);
});
for(const item of ITEM_IDS)test(`${item} can expose Croak and release the final Gloamwisp`,()=>{
  const m=new MarshModel(makeMarshRoom(),undefined,item);m.light(0);m.light(1);for(let i=0;i<300;i++)m.tick(1/60);
  Object.assign(m.hero,{x:m.boss.x,y:m.boss.y+80,facing:'up'});Object.assign(m.boss,{phase:'tongue',phaseAt:m.clock-.3,until:m.clock+1,aim:{...m.hero}});
  for(let i=0;i<20&&m.boss.phase!=='stunned';i++)m.tick(.02,{item:true});expect(m.boss.phase).toBe('stunned');
  for(let i=0;i<6;i++){m.attack();m.tick(.01);for(let n=0;n<28;n++)m.tick(1/60);}
  expect(m.progress.bossDefeated).toBe(true);expect(m.enemies.filter(e=>e.finalWisp)).toHaveLength(1);
});
test('first door spins one item, keeps it through exploration, and restart clears it',async({page})=>{
  test.setTimeout(180000);await start(page);const game=page.locator('#game');await expect(game).toHaveAttribute('data-item','');await expect(page.locator('#use-item')).toBeHidden();
  await page.keyboard.press('f');await page.keyboard.press('b');await page.keyboard.down('q');await expect(game).toHaveAttribute('data-shield','false');await page.keyboard.up('q');expect(JSON.parse((await state(page)).itemProjectiles)).toEqual([]);
  for(let i=0;i<3;i++)await finishTrial(page,i);
  // Use the authored exit rather than a test-only state transition.
  const {makeRoom}=await import('../src/world.js');const gate=makeRoom(0,5).exit;await walkTo(page,gate);if((await state(page)).mode==='playing')await contact(page,gate,async()=>(await state(page)).mode==='gate-opening');
  const reward=page.locator('#item-reward');await expect(reward).toBeVisible();await expect(reward).toHaveAttribute('data-phase','spinning');await expect(page.getByRole('button',{name:'Continue adventure',exact:true})).toBeDisabled();
  const before=await state(page);await page.keyboard.press('d');await page.keyboard.press('Escape');expect((await state(page)).px).toBe(before.px);await expect(reward).toBeVisible();
  await expect(reward).toHaveAttribute('data-phase','ready',{timeout:6000});const earned=await reward.getAttribute('data-item');expect(ITEM_IDS).toContain(earned);
  await page.screenshot({path:test.info().outputPath('journey-item-reward.png')});await completeReward(page);await expect(game).toHaveAttribute('data-chapter','1');await expect(game).toHaveAttribute('data-item',earned);await expect(page.locator('#use-item')).toBeVisible();
  await page.getByRole('button',{name:'Overworld atlas'}).click();await page.getByRole('button',{name:'Explore overworld'}).click();await expect(game).toHaveAttribute('data-item',earned);await page.keyboard.press('o');await page.getByRole('button',{name:'Return to quest',exact:true}).click();await expect(game).toHaveAttribute('data-item',earned);
  await page.getByRole('button',{name:'Restart adventure'}).click();await expect(game).toHaveAttribute('data-chapter','0');await expect(game).toHaveAttribute('data-item','');await expect(reward).not.toBeVisible();
});

for(const [i,item] of ITEM_IDS.entries())test(`${item} reel outcome enables only its owned controls`,async({page})=>{
  // Seed randomness, not progress or equipment: accept the actual practice reel.
  await page.addInitScript(value=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=value;return array;}return original(array);};},Math.floor((i+.5)/4*4294967296));
  await page.goto('/?area=A02');const game=page.locator('#game');await expect(game).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Begin adventure'}).click();await expect(page.locator('#item-reward')).toHaveAttribute('data-phase','ready',{timeout:6000});
  await expect(page.locator('#item-reward')).toHaveAttribute('data-item',item);
  if(item==='bow'){await page.setViewportSize({width:390,height:844});const box=await page.locator('#item-reward').boundingBox();expect(box.width).toBeLessThanOrEqual(390);await page.screenshot({path:test.info().outputPath('mobile-reward.png')});}
  await completeReward(page);await expect(game).toHaveAttribute('data-item',item);
  expect(await page.locator('[data-action="throw"],[data-action="bomb"],[data-action="shield"]').count()).toBe(0);
  if(item==='shield'){
    await page.keyboard.down('f');await expect(game).toHaveAttribute('data-shield','true');await page.keyboard.up('f');await expect(game).toHaveAttribute('data-shield','false');
    expect(JSON.parse((await state(page)).itemProjectiles)).toEqual([]);
  }else{
    await page.keyboard.press('f');await expect.poll(async()=>JSON.parse((await state(page)).itemProjectiles).some(p=>p.kind===item)).toBe(true);
    await page.keyboard.down('q');await expect(game).toHaveAttribute('data-shield','false');await page.keyboard.up('q');
    if(item!=='bomb'){await page.keyboard.press('b');expect(JSON.parse((await state(page)).itemProjectiles).every(p=>p.kind===item)).toBe(true);}
  }
});

test('earned shield blocks Slurg contact only from the front',()=>{
  for(const facing of ['up','down']){
    const m=new MarshModel(makeMarshRoom(),undefined,'shield');m.clock=2;m.invulnerable=0;
    Object.assign(m.hero,{x:220,y:1060,facing});
    m.enemies=[{type:'slurg',active:true,hidden:false,x:220,y:1040}];
    m.tick(.01,{shield:true});
    expect(m.events.some(e=>e.type==='hurt')).toBe(facing==='down');
    expect(m.blocks).toBe(facing==='up'?1:0);
    if(facing==='up'){m.tick(.01,{shield:true});expect(m.blocks).toBe(1);}
  }
});
