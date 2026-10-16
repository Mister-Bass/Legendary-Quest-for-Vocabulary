import { test, expect } from '@playwright/test';
import { chapters, vocabulary, chapterTrials } from '../src/lesson.js';
import { SLIME_HEALTH, strikeSlime } from '../src/combat.js';
import { WORLD, makeRoom, isWalkable, distance } from '../src/world.js';

test.setTimeout(360000);
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
  const objects=[room.guide,room.exit,...room.seals],chapter=s.chapter;
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
      const clearance=atGoal||[-1,0,1].every(ox=>[-1,0,1].every(oy=>isWalkable(room,n.x+ox,n.y+oy)));
      const avoidKeeper=distance(target,room.guide)===0||Math.hypot(n.x-room.guide.x,n.y-room.guide.y)>=2;
      if(avoidKeeper&&clearance&&isWalkable(room,n.x,n.y)&&!objects.some(o=>distance(o,n)===0)&&(!avoidEnemies||!room.shades.some(e=>distance(e,n)<=8)))q.push({...n,path:[...p.path,n]});
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
async function finishTrial(page,index){await openTrial(page,index);while((await state(page)).mode==='puzzle')await correct(page);}

test('all 45 terms and expanded chamber objectives are complete and reachable',()=>{
  const ids=chapters.flatMap(c=>c.terms);expect(vocabulary).toHaveLength(45);expect(new Set(ids).size).toBe(45);
  expect(ids.toSorted((a,b)=>a-b)).toEqual(Array.from({length:45},(_,i)=>i));
  expect(chapterTrials(0).flat().length).toBe(chapters[0].terms.length);
  expect(WORLD.columns*WORLD.rows).toBe(1120);
  for(let i=0;i<5;i++){
    const room=makeRoom(i,5);expect(room.trees).toHaveLength(13);for(const tree of room.trees){expect(isWalkable(room,tree.x,tree.y)).toBe(false);expect(room.water.has(`${tree.x},${tree.y}`)).toBe(false);}
    const seen=new Set(),q=[room.spawn];
    for(let k=0;k<q.length;k++){
      const p=q[k],key=`${p.x},${p.y}`;if(seen.has(key))continue;seen.add(key);
      for(const [dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const n={x:p.x+dx,y:p.y+dy};if(isWalkable(room,n.x,n.y)&&!seen.has(`${n.x},${n.y}`))q.push(n);}
    }
    for(const point of [...room.seals,room.exit,room.guide])expect(seen.has(`${point.x},${point.y}`)).toBeTruthy();
  }
});

test('loads the game, local assets, and attribution without errors',async({page})=>{
  const errors=[],art=new Set();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url());if(r.ok()&&(/\/assets\/(mystic|scenery|bridge)\//).test(r.url())&&r.url().endsWith('.png'))art.add(r.url());});
  await page.goto('/');await expect(game(page)).toHaveAttribute('data-ready','true');
  await expect(page.getByRole('heading',{name:'Every word is a key.'})).toBeVisible();
  await expect(page.locator('#game canvas')).toBeVisible();await expect(page.locator('#minimap')).toBeVisible();expect(errors).toEqual([]);expect(art.size).toBe(13);
  await expect(page.getByRole('link',{name:'Mystic Woods by Game Endeavor'})).toBeVisible();
  expect(await (await page.request.get('/assets/mystic/CREDITS.txt')).text()).toContain('Non-commercial');
});

test('held movement is continuous, stops on release, and the closer camera scrolls',async({page})=>{
  await start(page);const before=await state(page);
  await page.keyboard.down('w');await page.waitForTimeout(180);const middle=await state(page);
  expect(Number(middle.py)).toBeLessThan(Number(before.py)-3);expect(Number(middle.speed)).toBeGreaterThan(0);
  await page.waitForFunction(()=>Number(document.getElementById('game').dataset.py)<790);await page.keyboard.up('w');await settle(page);
  const after=await state(page);expect(Number(after.py)).toBeLessThan(Number(before.py)-90);
  expect(Number(after.cameraY)).toBeLessThan(Number(before.cameraY)-20);expect(Number(after.zoom)).toBe(1.5);
  expect(Number(after.worldWidth)).toBe(1600);expect(Number(after.worldHeight)).toBe(1120);
  const stopped=Number(after.py);await page.waitForTimeout(250);expect(Math.abs(Number((await state(page)).py)-stopped)).toBeLessThan(1);
  await moveAxis(page,'py',800); // Move below the pond before checking horizontal scrolling.
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1100);await page.keyboard.up('ArrowRight');await settle(page);
  expect(Number((await state(page)).cameraX)).toBeGreaterThan(Number(before.cameraX)+30);
});

test('terrain and world boundaries block continuous motion',async({page})=>{
  await start(page);await page.keyboard.down('a');await page.waitForFunction(()=>Number(document.getElementById('game').dataset.px)<57);await page.waitForTimeout(200);await page.keyboard.up('a');await settle(page);
  expect(Number((await state(page)).px)).toBeGreaterThanOrEqual(50);
  expect(Number((await state(page)).px)).toBeLessThan(58);
  await walkTo(page,{x:7,y:19},{exact:true});await hold(page,'w',600);await settle(page);
  expect(Number((await state(page)).py)).toBeGreaterThanOrEqual(770);expect(Number((await state(page)).py)).toBeLessThan(783);
});

test('chest contact pauses movement, resumes words, and restart clears progress',async({page})=>{
  await start(page);await openTrial(page,0);const at=await state(page);
  await hold(page,'d',300);expect((await state(page)).px).toBe(at.px);
  await correct(page);await expect(page.locator('#score')).toHaveText('25');const next=(await state(page)).quizId;
  await page.keyboard.press('Escape');await page.keyboard.press('e');await expect(game(page)).toHaveAttribute('data-quiz-id',next);
  while((await state(page)).mode==='puzzle')await correct(page);
  await page.keyboard.press('e');await expect(game(page)).toHaveAttribute('data-mode','playing');
  await expect(page.locator('#feedback')).toContainText('already restored');
  await page.keyboard.press('m');await expect(page.locator('#journal-entries')).toContainText('Digital Footprint');
  await page.keyboard.press('Escape');await page.keyboard.press('r');
  await expect(game(page)).toHaveAttribute('data-learned','0');await expect(page.locator('#score')).toHaveText('0');
  expect(Number((await state(page)).px)).toBe(180);expect(Number((await state(page)).py)).toBe(900);
});

test('mistakes lose hearts and checkpoint retry preserves solved vocabulary',async({page})=>{
  await start(page);await page.keyboard.press('e');await expect(page.getByRole('heading',{name:'Words open what swords cannot.'})).toBeVisible();await page.keyboard.press('Escape');
  await finishTrial(page,0);const learned=(await state(page)).learned;
  await openTrial(page,1);const id=Number((await state(page)).quizId),right=id%3===2?vocabulary[id].definition:vocabulary[id].term;
  const remaining=Number((await page.locator('#hearts').getAttribute('aria-label')).split(' ')[0]);
  for(let i=0;i<remaining;i++)await page.locator('#answers button').filter({hasNot:page.getByText(right,{exact:true})}).first().click();
  await expect(game(page)).toHaveAttribute('data-mode','lost');
  await page.getByRole('button',{name:'Return to chamber'}).click();
  await expect(game(page)).toHaveAttribute('data-learned',learned);await expect(game(page)).toHaveAttribute('data-keys','1');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','5 of 5 hearts');
  expect(Number((await state(page)).px)).toBe(180);
});

test('slime bolts pause, three distinct sword hits kill, and a nearby death burst costs one heart',async({page})=>{
  await start(page);await walkTo(page,{x:10,y:21},{exact:true,avoidEnemies:false});
  await expect.poll(async()=>JSON.parse((await state(page)).projectiles).length,{timeout:12000}).toBeGreaterThan(0);
  await page.keyboard.press('m');const paused=await state(page),hearts=await page.locator('#hearts').getAttribute('aria-label');await page.waitForTimeout(700);
  expect((await state(page)).enemies).toBe(paused.enemies);expect((await state(page)).projectiles).toBe(paused.projectiles);
  await page.keyboard.press('Escape');
  await expect.poll(()=>page.locator('#hearts').getAttribute('aria-label'),{timeout:10000}).not.toBe(hearts);
  await expect(page.locator('#feedback')).toContainText('slime bolt');
  const target=JSON.parse((await state(page)).enemies)[0];await moveAxis(page,'py',target.y);
  await page.keyboard.down('d');
  await page.waitForFunction(()=>{const s=document.getElementById('game').dataset,e=JSON.parse(s.enemies)[0];return Math.hypot(e.x-Number(s.px),e.y-Number(s.py))<43;});
  await page.keyboard.up('d');await settle(page);
  const enemy=()=>state(page).then(s=>JSON.parse(s.enemies)[0]);
  for(const expected of [2,1]){
    const e=await enemy();await clickWorld(page,e.x,e.y);
    await expect.poll(async()=>(await enemy()).hp).toBe(expected);
    await expect(game(page)).toHaveAttribute('data-shades','2');
    await expect(game(page)).toHaveAttribute('data-sword-visible','false');
    expect((await enemy()).hp).toBe(expected); // A long animation is still only one hit.
    await expect(page.locator('#combat-state')).toContainText('Dodge slime bolts');
  }
  const before=Number((await page.locator('#hearts').getAttribute('aria-label')).split(' ')[0]);
  const e=await enemy();await clickWorld(page,e.x,e.y);
  await expect(game(page)).toHaveAttribute('data-shades','1',{timeout:4000});
  expect((await enemy()).hp).toBe(0);await expect(game(page)).toHaveAttribute('data-burst-hits','1');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label',`${before-1} of 5 hearts`);
  await page.waitForTimeout(500);await expect(game(page)).toHaveAttribute('data-burst-hits','1');
  await expect(page.locator('#score')).toHaveText('0');
  await page.keyboard.press('r');await expect(game(page)).toHaveAttribute('data-shades','2');expect((await enemy()).hp).toBe(3);await expect(game(page)).toHaveAttribute('data-burst-hits','0');
});

test('all 45 contact trials unlock the scrolling chambers and win; replay resets',async({page})=>{
  await start(page);
  for(let chapter=0;chapter<5;chapter++){
    for(let trial=0;trial<3;trial++)await finishTrial(page,trial);
    await expect(game(page)).toHaveAttribute('data-keys','3');const gate=makeRoom(chapter,5).exit;await walkTo(page,gate);
    if((await state(page)).chapter===String(chapter)&& (await state(page)).mode==='playing')await contact(page,gate,async()=>{const s=await state(page);return s.chapter!==String(chapter)||s.mode==='won';});
    if(chapter<4)await expect(game(page)).toHaveAttribute('data-chapter',String(chapter+1));
  }
  await expect(game(page)).toHaveAttribute('data-mode','won');await expect(game(page)).toHaveAttribute('data-learned','45');await expect(page.locator('#score')).toHaveText('1125');
  await page.getByRole('button',{name:'Begin again'}).click();await expect(game(page)).toHaveAttribute('data-learned','0');await expect(game(page)).toHaveAttribute('data-chapter','0');
});

test('contact opens Keeper dialogue once until the player leaves and returns',async({page})=>{
  await start(page);await page.keyboard.down('d');await expect(game(page)).toHaveAttribute('data-mode','guide');await page.keyboard.up('d');
  await page.keyboard.press('Escape');await page.waitForTimeout(300);await expect(game(page)).toHaveAttribute('data-mode','playing');
  await hold(page,'a',400);await settle(page);await page.keyboard.down('d');
  await expect(game(page)).toHaveAttribute('data-mode','guide');await page.keyboard.up('d');
});

test('supplied player swings only on attack and the shield is removed',async({page})=>{
  await start(page);await expect(game(page)).toHaveAttribute('data-sword-visible','false');
  await page.keyboard.down('Space');await expect(game(page)).toHaveAttribute('data-sword-visible','true');await page.keyboard.up('Space');
  await expect(game(page)).toHaveAttribute('data-sword-visible','false');
  let s=await state(page);await clickWorld(page,Number(s.px)+80,Number(s.py),'right');await expect(game(page)).toHaveAttribute('data-shield','false');
  await expect(page.getByRole('button',{name:'Shield',exact:true})).toHaveCount(0);
  await expect(page.locator('#combat-state')).toContainText('Dodge slime bolts');await clickWorld(page,Number(s.px)+80,Number(s.py),'left');await expect(game(page)).toHaveAttribute('data-sword-visible','true');
  await expect(game(page)).toHaveAttribute('data-sword-visible','false');await hold(page,'a',180);await settle(page);await expect(game(page)).toHaveAttribute('data-facing','left');
});

test('a chest opens on contact and its actual vocabulary question rises before the dialog',async({page})=>{
  await start(page);await walkTo(page,makeRoom(0,5).seals[0]);
  if((await state(page)).mode==='playing')await contact(page,makeRoom(0,5).seals[0],()=>game(page).getAttribute('data-mode').then(m=>m==='opening'));
  await expect(game(page)).toHaveAttribute('data-mode','opening');await expect(game(page)).toHaveAttribute('data-question-floating','true');
  const at=await state(page);await hold(page,'d',150);expect((await state(page)).px).toBe(at.px);
  await expect(game(page)).toHaveAttribute('data-mode','puzzle');await expect(game(page)).toHaveAttribute('data-question-floating','false');
  const chests=JSON.parse((await state(page)).chests);expect(chests[0].frame).toBe(3);
  expect(await page.locator('#puzzle-prompt').innerText()).not.toBe('');
  while((await state(page)).mode==='puzzle')await correct(page);
  await page.keyboard.press('e');await expect(game(page)).toHaveAttribute('data-mode','playing');await expect(page.locator('#feedback')).toContainText('already restored');
});

test('bottom-right minimap uncovers visited ground, retains it while backtracking, and resets',async({page})=>{
  await start(page);const map=page.locator('#minimap'),initial=Number(await map.getAttribute('data-explored'));
  expect(initial).toBeGreaterThan(0);expect(initial).toBeLessThan(100);
  const fog=()=>map.evaluate(c=>Array.from(c.getContext('2d').getImageData(195,5,1,1).data).slice(0,3));
  expect(await fog()).toEqual([7,17,15]);
  await hold(page,'w',1300);await settle(page);const explored=Number(await map.getAttribute('data-explored'));expect(explored).toBeGreaterThan(initial);
  await hold(page,'s',700);await settle(page);expect(Number(await map.getAttribute('data-explored'))).toBeGreaterThanOrEqual(explored);
  expect(await fog()).toEqual([7,17,15]);
  const box=await map.boundingBox(),stage=await page.locator('.stage').boundingBox();
  expect(box.x+box.width).toBeLessThanOrEqual(stage.x+stage.width);expect(box.y+box.height).toBeLessThanOrEqual(stage.y+stage.height);
  expect(box.x).toBeGreaterThan(stage.x+stage.width/2);expect(box.y).toBeGreaterThan(stage.y+stage.height/2);
  await page.keyboard.press('r');await expect(map).toHaveAttribute('data-explored',String(initial));
});

test('mobile held direction, sword, and dialogs fit the screen',async({page})=>{
  await page.setViewportSize({width:375,height:812});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const up=page.getByRole('button',{name:'Move up',exact:true});await up.scrollIntoViewIfNeeded();const box=await up.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForFunction(()=>Number(document.getElementById('game').dataset.py)<810);await page.mouse.up();await settle(page);
  expect(Number((await state(page)).py)).toBeLessThan(830);
  await page.getByRole('button',{name:'Sword',exact:true}).click();await expect(page.locator('#combat-state')).toContainText('recovering');
  await page.getByRole('button',{name:'Open word journal'}).click();await expect(page.locator('#journal')).toBeVisible();
  await page.getByRole('button',{name:'Close journal',exact:true}).click();await expect(game(page)).toHaveAttribute('data-mode','playing');
});

test('supplied water ripples, the cyan Keeper dances, and scattered tree trunks block movement',async({page})=>{
  await start(page);await expect(game(page)).toHaveAttribute('data-trees','13');
  const initial=await state(page);
  await expect.poll(async()=>(await state(page)).waterFrame).not.toBe(initial.waterFrame);
  await expect.poll(async()=>(await state(page)).keeperFrame).not.toBe(initial.keeperFrame);
  await moveAxis(page,'px',100);await hold(page,'s',1100);await settle(page);
  const at=await state(page);expect(Number(at.py)).toBeGreaterThan(980);expect(Number(at.py)).toBeLessThanOrEqual(990);
  await page.keyboard.press('r');await expect(game(page)).toHaveAttribute('data-py','900.0');
  await page.keyboard.press('e');await expect(game(page)).toHaveAttribute('data-mode','guide');
});

test('a slime takes three separate swings; only a death within its radius costs a heart',()=>{
  for(const distance of [40,56,68]){
    const slime={hp:SLIME_HEALTH,lastHitSwing:null};
    expect(strikeSlime(slime,1,distance)).toEqual({hit:true,dead:false,burstDamage:0});
    for(let frame=0;frame<20;frame++)expect(strikeSlime(slime,1,distance).hit).toBe(false);
    expect(slime.hp).toBe(2);expect(strikeSlime(slime,2,distance).dead).toBe(false);expect(slime.hp).toBe(1);
    expect(strikeSlime(slime,3,distance)).toEqual({hit:true,dead:true,burstDamage:distance<=56?1:0});
    expect(strikeSlime(slime,4,distance)).toEqual({hit:false,dead:false,burstDamage:0});expect(slime.hp).toBe(0);
  }
});

test('the starting pond bridge crosses both ways while adjacent water stays solid',async({page})=>{
  const room=makeRoom(0,5);for(let x=7;x<=12;x++){expect(isWalkable(room,x,17)).toBe(true);expect(isWalkable(room,x,16)).toBe(false);}
  expect(makeRoom(1,5).bridge.size).toBe(0);
  await start(page);await moveAxis(page,'py',700);await hold(page,'d',2300);await settle(page);
  expect(Number((await state(page)).px)).toBeGreaterThan(540);expect(Number((await state(page)).py)).toBeGreaterThan(680);
  expect(Number((await state(page)).py)).toBeLessThan(720);
  await hold(page,'a',2200);await settle(page);expect(Number((await state(page)).px)).toBeLessThan(280);
  const explored=await page.locator('#minimap').evaluate(c=>Array.from(c.getContext('2d').getImageData(9*5+2,17*5+2,1,1).data).slice(0,3));
  expect(explored).toEqual([212,180,134]);
});
