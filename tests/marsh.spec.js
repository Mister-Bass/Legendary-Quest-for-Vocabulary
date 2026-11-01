import { test,expect } from '@playwright/test';
import { makeMarshRoom,at,cell,marshWalkable } from '../src/marsh-map.js';
import { MarshModel,bossTongue } from '../src/marsh-model.js';
import { state,finishTrial,walkTo,moveAxis,contact } from './play-input.js';
import { waitForMarshPads,guardMarshExit,defeatMarshBoss } from './marsh-journey.js';
const advance=(m,seconds,input={})=>{for(let t=0;t<seconds;t+=1/60)m.tick(Math.min(1/60,seconds-t),input);};
test('marsh layout preserves all bank and island routes around deep water',()=>{
  const r=makeMarshRoom(),q=[r.spawn],seen=new Set();
  for(let i=0;i<q.length;i++){const p=q[i],k=cell(p.x,p.y);if(seen.has(k))continue;seen.add(k);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(marshWalkable(r,p.x+dx,p.y+dy))q.push({x:p.x+dx,y:p.y+dy});}
  for(const p of [r.exit,r.guide,r.heart,...r.seals])expect(seen.has(cell(p.x,p.y))).toBe(true);
  expect(r.water.size).toBeGreaterThan(200);expect(r.pads.length).toBeGreaterThan(8);expect(r.shades.map(e=>e.type).filter(t=>t==='octorok')).toHaveLength(3);
  expect(marshWalkable(r,15,10)).toBe(false);
});
test('marsh Wisp Flames expire, respawn, and are required once per vocabulary lantern',()=>{
  const nearby=new MarshModel(makeMarshRoom()),pale=nearby.enemies[0];Object.assign(nearby.hero,{x:pale.x,y:pale.y-240});advance(nearby,.2);expect(Math.abs(pale.y-pale.home.y)).toBeLessThan(10);nearby.hero.y=pale.y-80;const before=pale.y;advance(nearby,.1);expect(pale.y).toBeGreaterThan(before);
  const m=new MarshModel(makeMarshRoom());m.interactLantern(0);expect(m.progress.primed[0]).toBe(false);
  const w=m.enemies[0];m.hero.x=w.x;m.hero.y=w.y;m.defeat(w);advance(m,.02);expect(m.flameUntil-m.clock).toBeCloseTo(10,1);
  m.interactLantern(0);expect(m.progress.primed[0]).toBe(true);expect(m.progress.lit[0]).toBe(false);expect(m.flameUntil).toBe(0);
  m.light(0);expect(m.progress.lit[0]).toBe(true);advance(m,6.1);expect(w.active).toBe(true);
  m.flameUntil=m.clock+10;advance(m,10.1);expect(m.flameUntil).toBeLessThan(m.clock);
});
test('marsh pads sink after two seconds, rescue the player, and regrow',()=>{
  const m=new MarshModel(makeMarshRoom()),pad=m.room.pads[0];Object.assign(m.hero,at(pad));advance(m,1.8);expect(m.falls).toBe(0);
  advance(m,.3);expect(m.falls).toBe(1);expect(m.flameUntil).toBe(0);expect(m.padTimers.get(cell(pad.x,pad.y)).sunkUntil).toBeGreaterThan(m.clock);
  advance(m,4.1);expect(m.padTimers.has(cell(pad.x,pad.y))).toBe(false);
  const edge=new MarshModel(makeMarshRoom()),pair=edge.room.pads.find(p=>edge.room.bridge.has(cell(p.x+1,p.y)));Object.assign(edge.hero,{x:(pair.x+1)*40+2,y:pair.y*40+20});edge.padTimers.set(cell(pair.x,pair.y),{deadline:0,sunkUntil:0});edge.tick(.02);expect(edge.falls).toBe(1);expect(edge.hero.x).toBe(edge.safe.x);expect(edge.hero.y).toBe(edge.safe.y);
});
test('marsh mud slows movement; facing shields and rolls avoid mud balls',()=>{
  const r=makeMarshRoom(),m=new MarshModel(r);Object.assign(m.hero,at({x:5,y:25}));advance(m,.1,{up:true});expect(m.speed).toBe(95);
  Object.assign(m.hero,at({x:8,y:27}),{facing:'up'});m.clock=3;m.bolts=[{x:m.hero.x,y:m.hero.y-15,vx:0,vy:0,until:10}];m.tick(.01,{shield:true});expect(m.blocks).toBe(1);expect(m.slowUntil).toBe(0);
  m.bolts=[{x:m.hero.x,y:m.hero.y-15,vx:0,vy:0,until:10}];m.tick(.01,{roll:true});expect(m.rolls).toBe(1);expect(m.slowUntil).toBe(0);
});
test('marsh Slurg splits into two smaller sword targets',()=>{
  const m=new MarshModel(makeMarshRoom()),s=m.enemies.find(e=>e.type==='slurg');s.hidden=false;Object.assign(m.hero,{x:s.x-48,y:s.y,facing:'right'});m.attack();m.tick(.01);
  expect(s.active).toBe(false);expect(m.enemies.filter(e=>e.type==='small-slurg'&&e.active)).toHaveLength(2);
});
test('final lantern awakens Croak; the optional Heart Piece does not',()=>{
  const m=new MarshModel(makeMarshRoom());m.openHeart();expect(m.progress.heartTaken).toBe(true);expect(m.boss.active).toBe(false);
  m.light(0);m.light(1);expect(m.boss.phase).toBe('sleeping');m.light(2);expect(m.boss.phase).toBe('rising');expect(m.gateClosed).toBe(true);
  const position={...m.hero};advance(m,4,{up:true,attack:true});expect(m.hero).toEqual(position);expect(m.boss.phase).toBe('rising');advance(m,.7);expect(m.boss.phase).toBe('watching');
  const b=m.boss;m.items.push({x:b.x,y:b.y,vx:0,vy:0,until:10});m.tick(.01);expect(b.phase).not.toBe('stunned');
  b.phase='tongue';b.until=m.clock+1;b.aim={x:b.x+200,y:b.y};m.items.push({x:b.x,y:b.y,vx:0,vy:0,until:10});m.tick(.01);expect(b.phase).toBe('stunned');
  Object.assign(m.hero,{x:b.x,y:b.y+80,facing:'up'});
  for(let i=0;i<6;i++){m.attack();m.tick(.01);advance(m,.45);}
  expect(m.progress.bossDefeated).toBe(true);expect(b.active).toBe(false);
});
test('marsh practice loads, pauses timers for its map, and exposes responsive controls',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?area=A02');
  await expect(page.locator('#game')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Begin adventure'}).click();
  await expect(page.locator('#chapter-title')).toHaveText('Lantern Marsh');await expect(page.locator('#game')).toHaveAttribute('data-marsh','true');
  await page.keyboard.down('q');await expect(page.locator('#game')).toHaveAttribute('data-shield','true');await page.keyboard.up('q');await expect(page.locator('#game')).toHaveAttribute('data-shield','false');
  await page.keyboard.press('Shift');await expect(page.locator('#game')).toHaveAttribute('data-rolls','1');
  await page.getByRole('button',{name:'Marsh map',exact:true}).click();await expect(page.locator('#marsh-map')).toBeVisible();
  // Compare clear terrain cells with the supplied images, including mud alpha.
  expect(await page.locator('#marsh-layout').evaluate(async canvas=>{
    for(const [file,rect,tile,base]of[
      ['forest/top-down-forest-tileset.png',[128,32,16,16],[10,26],null],
      ['marsh/wet-mud-tile.png',[72,72,112,112],[4,9],'#755e2c'],
      ['kenney-pond/rpgTile010.png',[0,0,64,64],[11,8],null]
    ]){
      const image=new Image();image.src='/assets/'+file;await image.decode();
      const sample=document.createElement('canvas');sample.width=sample.height=16;
      const c=sample.getContext('2d');c.imageSmoothingEnabled=false;
      if(base){c.fillStyle=base;c.fillRect(0,0,16,16);}c.drawImage(image,...rect,0,0,16,16);
      const expected=c.getImageData(0,0,16,16).data,actual=canvas.getContext('2d').getImageData(tile[0]*16,tile[1]*16,16,16).data;
      if(!expected.every((value,i)=>value===actual[i]))return false;
    }
    return true;
  })).toBe(true);
  await page.locator('#marsh-layout').screenshot({path:test.info().outputPath('lantern-marsh-layout.png')});
  const seconds=await page.locator('#game').getAttribute('data-flame-seconds');await page.waitForTimeout(500);expect(await page.locator('#game').getAttribute('data-flame-seconds')).toBe(seconds);
  await page.getByRole('button',{name:'Close marsh map'}).click();await page.keyboard.press('Space');await expect(page.locator('#game')).toHaveAttribute('data-mode','playing');await expect(page.locator('#marsh-map')).not.toBeVisible();await page.locator('#game canvas').scrollIntoViewIfNeeded();await page.screenshot({path:test.info().outputPath('lantern-marsh-play.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});const box=await page.locator('#marsh-controls').boundingBox();expect(box.width).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
test('marsh real-input mission restores all ten words and three lanterns',async({page})=>{
  test.setTimeout(360000);
  if(process.env.GAME_TEST_PROGRESS){
    const timer=setInterval(async()=>{try{
      const s=await state(page),enemies=JSON.parse(s.enemies||'[]');
      console.log('Marsh progress',JSON.stringify({mode:s.mode,keys:s.keys,words:s.learned,position:[s.px,s.py],flame:s.flameSeconds,pads:s.pads,health:await page.locator('#hearts').getAttribute('aria-label'),wisp:enemies.find(e=>e.id===0),threats:enemies.filter(e=>e.active&&e.type!=='wisp').map(e=>({id:e.id,type:e.type,x:e.x,y:e.y}))}));
    }catch{}},10000);timer.unref();page.once('close',()=>clearInterval(timer));
    page.on('pageerror',error=>console.error('Game error',error.stack));
  }
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?area=A02');await expect(page.locator('#game')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Begin adventure'}).click();
  let cpuSession;
  for(let i=0;i<3;i++){
    if(i===2&&process.env.GAME_TEST_CPU_RATE&&test.info().project.name==='chromium'){
      cpuSession=await page.context().newCDPSession(page);
      await cpuSession.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.GAME_TEST_CPU_RATE)});
    }
    await finishTrial(page,i);await expect(page.locator('#game')).toHaveAttribute('data-keys',String(i+1));
  }
  if(cpuSession)await cpuSession.send('Emulation.setCPUThrottlingRate',{rate:1});
  await expect(page.locator('#game')).toHaveAttribute('data-learned','10');await expect(page.locator('#game')).toHaveAttribute('data-lanterns','[true,true,true]');
  await page.screenshot({path:test.info().outputPath('lantern-marsh-island-restored.png')});
  await expect(page.locator('#game')).toHaveAttribute('data-arena-gate-closed','true');
  await expect(page.locator('#game')).toHaveAttribute('data-door-ready','false');
  await expect(page.locator('#game')).toHaveAttribute('data-mode','boss-rise');
  const frozen=await state(page);await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');expect((await state(page)).px).toBe(frozen.px);expect((await state(page)).py).toBe(frozen.py);
  await page.waitForTimeout(400);await page.screenshot({path:test.info().outputPath('croak-rising.png')});
  await expect.poll(async()=>Number((await state(page)).arenaGateLift),{timeout:5000}).toBeGreaterThan(.9);
  await page.screenshot({path:test.info().outputPath('arena-gate-rising.png')});
  await expect(page.locator('#game')).toHaveAttribute('data-mode','playing',{timeout:8000});
  // Lose through actual enemy attacks, then verify the sealed-arena checkpoint.
  await walkTo(page,{x:15,y:13},{exact:true,avoidEnemies:false,attack:false});
  await expect.poll(async()=>(await state(page)).bossPhase,{timeout:20000,intervals:[30]}).toBe('tongue');
  await expect.poll(async()=>Number((await state(page)).tongueLength),{timeout:2000,intervals:[20]}).toBeGreaterThan(45);
  await page.screenshot({path:test.info().outputPath('frog-tongue.png')});
  await expect(page.locator('#game')).toHaveAttribute('data-mode','lost',{timeout:45000});
  await page.getByRole('button',{name:'Return to chamber'}).click();
  await expect(page.locator('#game')).toHaveAttribute('data-keys','3');await expect(page.locator('#game')).toHaveAttribute('data-learned','10');await expect(page.locator('#game')).toHaveAttribute('data-arena-gate-closed','true');
  expect(Number((await state(page)).y)).toBeCloseTo(16,0);
  await defeatMarshBoss(page,{state,walkTo});
  await expect(page.locator('#game')).toHaveAttribute('data-arena-gate-closed','false');
  await expect(page.locator('#game')).toHaveAttribute('data-door-ready','true');
  await waitForMarshPads(page,state);
  await guardMarshExit(page,state,()=>walkTo(page,makeMarshRoom().exit,{avoidEnemies:false}));await page.keyboard.press('e');
  await expect(page.locator('#game')).toHaveAttribute('data-mode','gate-opening');await expect(page.locator('#game')).toHaveAttribute('data-chapter','2',{timeout:8000});expect(errors).toEqual([]);
});


test('optional island chest heals without waking the frog and restart resets it',async({page})=>{
  test.setTimeout(180000);await page.goto('/?area=A02');await expect(page.locator('#game')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Begin adventure'}).click();
  const room=makeMarshRoom();await walkTo(page,{x:16,y:26},{exact:true,avoidEnemies:false});await walkTo(page,room.heart,{avoidEnemies:false});
  if((await state(page)).heartPiece!=='true')await contact(page,room.heart,async()=>(await state(page)).heartPiece==='true');
  await expect(page.locator('#game')).toHaveAttribute('data-heart-piece','true');await expect(page.locator('#game')).toHaveAttribute('data-boss-phase','sleeping');await expect(page.locator('#game')).toHaveAttribute('data-arena-gate-closed','false');
  await page.getByRole('button',{name:'Restart adventure'}).click();await expect(page.locator('#game')).toHaveAttribute('data-heart-piece','false');await expect(page.locator('#game')).toHaveAttribute('data-boss-phase','sleeping');
});

test('raised arena gate survives checkpoint recovery and lowers after Croak falls',()=>{
  const r=makeMarshRoom(),m=new MarshModel(r);for(let i=0;i<3;i++)m.light(i);
  expect(m.events.filter(e=>e.type==='boss-awakened')).toHaveLength(1);m.light(2);expect(m.events.filter(e=>e.type==='boss-awakened')).toHaveLength(1);
  const retry=new MarshModel(r,m.progress);expect(retry.gateClosed).toBe(true);expect(retry.hero).toMatchObject(at(r.arenaSpawn));expect(retry.solid(retry.hero.x,retry.hero.y)).toBe(false);
  Object.assign(retry.hero,at({x:15,y:28}));advance(retry,1.2,{down:true});expect(retry.hero.y).toBeLessThan(r.barrier.y*40);
  Object.assign(retry.hero,{x:retry.boss.x,y:retry.boss.y+80,facing:'up'});retry.boss.phase='stunned';retry.boss.until=retry.clock+4;
  for(let i=0;i<6;i++){retry.attack();retry.tick(.01);advance(retry,.45);}
  expect(retry.progress.bossDefeated).toBe(true);expect(retry.gateClosed).toBe(false);expect(retry.solid(620,r.barrier.y*40+20)).toBe(false);
  const done=new MarshModel(r,retry.progress);expect(done.boss.active).toBe(false);expect(done.gateClosed).toBe(false);
});

test('frog tongue damage follows its extending and retracting tip',()=>{
  const m=new MarshModel(makeMarshRoom());for(let i=0;i<3;i++)m.light(i);advance(m,4.7);
  const b=m.boss;Object.assign(b,{phase:'tongue',phaseAt:m.clock,until:m.clock+.9,aim:{x:b.x+200,y:b.y},nextSlam:m.clock+20});Object.assign(m.hero,{x:b.x+100,y:b.y});m.invulnerable=0;
  m.tick(.01);expect(bossTongue(b,m.clock).length).toBeLessThan(20);expect(m.events.filter(e=>e.type==='hurt')).toHaveLength(0);
  advance(m,.25);expect(bossTongue(b,m.clock).length).toBeGreaterThan(150);expect(m.events.filter(e=>e.type==='hurt')).toHaveLength(1);
  m.events=[];m.invulnerable=0;b.phaseAt=m.clock-.87;m.tick(.01);expect(bossTongue(b,m.clock).length).toBeLessThan(25);expect(m.events.filter(e=>e.type==='hurt')).toHaveLength(0);
});
