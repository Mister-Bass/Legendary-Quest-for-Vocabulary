import { test, expect } from '@playwright/test';
import { chapters, vocabulary, chapterTrials } from '../src/lesson.js';
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
async function moveAxis(page,axis,target){
  const s=await state(page),from=Number(s[axis]),sign=Math.sign(target-from);
  if(Math.abs(target-from)<6)return;
  const key=axis==='px'?(sign>0?'ArrowRight':'ArrowLeft'):(sign>0?'ArrowDown':'ArrowUp');
  await page.keyboard.down(key);
  try {await page.waitForFunction(({axis,target,sign})=>{
    const el=document.getElementById('game');return el.dataset.mode!=='playing'||(Number(el.dataset[axis])-target)*sign>=-7;
  },{axis,target,sign},{timeout:Math.abs(target-from)/100*1000+10000});}
  finally {await page.keyboard.up(key);}
  await settle(page);
  // Contact can open a trial during the final segment, especially at lower frame rates.
}
async function walkTo(page,target,{exact=false,avoidEnemies=true}={}){
  const s=await state(page),room=makeRoom(Number(s.chapter),5),origin={x:Math.floor(Number(s.px)/40),y:Math.floor(Number(s.py)/40)};
  const objects=[room.guide,room.exit,...room.seals];
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
      if(clearance&&isWalkable(room,n.x,n.y)&&!objects.some(o=>distance(o,n)===0)&&(!avoidEnemies||!room.shades.some(e=>distance(e,n)<=8)))q.push({...n,path:[...p.path,n]});
    }
  }
  if(!path)throw Error(`No path to ${JSON.stringify(target)}`);
  // Hold keys along straight segments instead of simulating frame-sized key taps.
  let previous=origin;
  for(let i=0;i<path.length;){
    if((await state(page)).mode!=='playing')return;
    const dx=path[i].x-previous.x,dy=path[i].y-previous.y;let end=i;
    while(end+1<path.length&&path[end+1].x-path[end].x===dx&&path[end+1].y-path[end].y===dy)end++;
    await moveAxis(page,dx?'px':'py',(dx?path[end].x:path[end].y)*40+20);
    previous=path[end];i=end+1;
  }
}
async function openTrial(page,index){
  const s=await state(page),target=makeRoom(Number(s.chapter),5).seals[index];await walkTo(page,target);
  if((await state(page)).mode==='puzzle')return;
  const at=await state(page),dx=target.x*40+20-Number(at.px),dy=target.y*40+20-Number(at.py);
  const key=Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp';
  await page.keyboard.down(key);
  try{await expect(game(page)).toHaveAttribute('data-mode','puzzle',{timeout:5000});}finally{await page.keyboard.up(key);}
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
    const room=makeRoom(i,5),seen=new Set(),q=[room.spawn];
    for(let k=0;k<q.length;k++){
      const p=q[k],key=`${p.x},${p.y}`;if(seen.has(key))continue;seen.add(key);
      for(const [dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const n={x:p.x+dx,y:p.y+dy};if(isWalkable(room,n.x,n.y)&&!seen.has(`${n.x},${n.y}`))q.push(n);}
    }
    for(const point of [...room.seals,room.exit,room.guide])expect(seen.has(`${point.x},${point.y}`)).toBeTruthy();
  }
});

test('loads the game, local assets, and attribution without errors',async({page})=>{
  const errors=[],art=new Set();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url());if(r.ok()&&r.url().includes('/assets/topdown/')&&r.url().endsWith('.png'))art.add(r.url());});
  await page.goto('/');await expect(game(page)).toHaveAttribute('data-ready','true');
  await expect(page.getByRole('heading',{name:'Every word is a key.'})).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();expect(errors).toEqual([]);expect(art.size).toBe(13);
  await expect(page.getByRole('link',{name:'TOP-DOWN Adventure Pack by o_lobster'})).toBeVisible();
  expect(await (await page.request.get('/assets/topdown/CREDITS.txt')).text()).toContain('CC BY 4.0');
});

test('held movement is continuous, stops on release, and the closer camera scrolls',async({page})=>{
  await start(page);const before=await state(page);
  await page.keyboard.down('w');await page.waitForTimeout(180);const middle=await state(page);
  expect(Number(middle.py)).toBeLessThan(Number(before.py)-3);expect(Number(middle.py)).toBeGreaterThan(Number(before.py)-100);
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

test('crystal contact pauses movement, resumes words, and restart clears progress',async({page})=>{
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
  for(let i=0;i<5;i++)await page.locator('#answers button').filter({hasNot:page.getByText(right,{exact:true})}).first().click();
  await expect(game(page)).toHaveAttribute('data-mode','lost');
  await page.getByRole('button',{name:'Return to chamber'}).click();
  await expect(game(page)).toHaveAttribute('data-learned',learned);await expect(game(page)).toHaveAttribute('data-keys','1');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','5 of 5 hearts');
  expect(Number((await state(page)).px)).toBe(180);
});

test('enemies chase and strike; a facing shield blocks and a sword defeats them',async({page})=>{
  await start(page);const initial=JSON.parse((await state(page)).enemies)[0];
  await walkTo(page,{x:10,y:21},{exact:true,avoidEnemies:false});
  await hold(page,'ArrowRight',80);await settle(page);await page.keyboard.down('k');
  await expect(game(page)).toHaveAttribute('data-shield','true');
  await expect.poll(async()=>Number((await state(page)).blocks),{timeout:12000}).toBeGreaterThan(0);
  const blocked=await state(page);expect(JSON.parse(blocked.enemies)[0].x).toBeLessThan(initial.x-20);
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','5 of 5 hearts');
  await page.keyboard.press('m');const paused=await state(page);await page.waitForTimeout(700);
  expect((await state(page)).enemies).toBe(paused.enemies);await page.keyboard.press('Escape');
  // The journal releases held controls; fresh input is required on return.
  await page.keyboard.up('k');await expect(game(page)).toHaveAttribute('data-shield','false');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','4 of 5 hearts',{timeout:6000});
  await page.keyboard.down('j');
  try{await expect(game(page)).toHaveAttribute('data-shades','1',{timeout:4000});}finally{await page.keyboard.up('j');}
  await expect(page.locator('#score')).toHaveText('0');await hold(page,'j',550);await expect(page.locator('#score')).toHaveText('0');
  await page.keyboard.press('r');await expect(game(page)).toHaveAttribute('data-shades','2');await expect(game(page)).toHaveAttribute('data-blocks','0');
});

test('all 45 contact trials unlock the scrolling chambers and win; replay resets',async({page})=>{
  await start(page);
  for(let chapter=0;chapter<5;chapter++){
    for(let trial=0;trial<3;trial++)await finishTrial(page,trial);
    await expect(game(page)).toHaveAttribute('data-keys','3');await walkTo(page,makeRoom(chapter,5).exit);await page.keyboard.press('e');
    if(chapter<4)await expect(game(page)).toHaveAttribute('data-chapter',String(chapter+1));
  }
  await expect(game(page)).toHaveAttribute('data-mode','won');await expect(game(page)).toHaveAttribute('data-learned','45');await expect(page.locator('#score')).toHaveText('1125');
  await page.getByRole('button',{name:'Begin again'}).click();await expect(game(page)).toHaveAttribute('data-learned','0');await expect(game(page)).toHaveAttribute('data-chapter','0');
});

test('mobile held direction, sword, shield toggle, and dialogs fit the screen',async({page})=>{
  await page.setViewportSize({width:375,height:812});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const up=page.getByRole('button',{name:'Move up',exact:true});await up.scrollIntoViewIfNeeded();const box=await up.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForFunction(()=>Number(document.getElementById('game').dataset.py)<810);await page.mouse.up();await settle(page);
  expect(Number((await state(page)).py)).toBeLessThan(830);
  await page.getByRole('button',{name:'Shield',exact:true}).click();await expect(game(page)).toHaveAttribute('data-shield','true');
  await page.getByRole('button',{name:'Shield',exact:true}).click();await expect(game(page)).toHaveAttribute('data-shield','false');
  await page.getByRole('button',{name:'Sword',exact:true}).click();await expect(page.locator('#combat-state')).toContainText('recovering');
  await page.getByRole('button',{name:'Open word journal'}).click();await expect(page.locator('#journal')).toBeVisible();
  await page.getByRole('button',{name:'Close journal',exact:true}).click();await expect(game(page)).toHaveAttribute('data-mode','playing');
});
