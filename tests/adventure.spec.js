import { test, expect } from '@playwright/test';
import { chapters, vocabulary, chapterTrials } from '../src/lesson.js';
import { makeRoom, isWalkable, distance } from '../src/world.js';

test.setTimeout(90000);
const game=page=>page.locator('#game');
async function start(page) {
  await page.goto('/');await expect(game(page)).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Begin adventure'}).click();
  await expect(game(page)).toHaveAttribute('data-mode','playing');
}
async function state(page) {return game(page).evaluate(el=>({...el.dataset}));}
async function walkTo(page,target,{allowShade=false,exact=false}={}) {
  const s=await state(page),room=makeRoom(Number(s.chapter),5);
  const blockers=[room.guide,...room.seals,room.exit,...(allowShade?[]:room.shades)];
  const queue=[{x:Number(s.x),y:Number(s.y),path:[]}],visited=new Set();
  while(queue.length) {
    const current=queue.shift(),key=`${current.x},${current.y}`;
    if(visited.has(key))continue;visited.add(key);
    if(distance(current,target)<=(exact?0:1)) {
      for(const key of current.path)await page.keyboard.press(key);
      await expect(game(page)).toHaveAttribute('data-x',String(current.x));
      await expect(game(page)).toHaveAttribute('data-y',String(current.y));return;
    }
    for(const [dx,dy,key]of[[0,-1,'ArrowUp'],[0,1,'ArrowDown'],[-1,0,'ArrowLeft'],[1,0,'ArrowRight']]) {
      const next={x:current.x+dx,y:current.y+dy,path:[...current.path,key]};
      if(isWalkable(room,next.x,next.y)&&!blockers.some(p=>distance(p,next)===0))queue.push(next);
    }
  }
  throw new Error(`No path to ${JSON.stringify(target)}`);
}
async function openTrial(page,index) {
  const s=await state(page);await walkTo(page,makeRoom(Number(s.chapter),5).seals[index]);
  await page.keyboard.press('e');await expect(game(page)).toHaveAttribute('data-mode','puzzle');
}
async function correct(page) {
  const id=Number((await state(page)).quizId);
  const answer=id%3===2?vocabulary[id].definition:vocabulary[id].term;
  await page.getByRole('button').filter({has:page.getByText(answer,{exact:true})}).click();
}
async function finishTrial(page,index) {
  await openTrial(page,index);
  while((await state(page)).mode==='puzzle')await correct(page);
}

test('contains every supplied term exactly once across Level 1',async()=>{
  const ids=chapters.flatMap(c=>c.terms);
  expect(vocabulary).toHaveLength(45);expect(new Set(ids).size).toBe(45);
  expect(ids.toSorted((a,b)=>a-b)).toEqual(Array.from({length:45},(_,i)=>i));
  expect(vocabulary[0].term).toBe('Active Footprint');
  expect(vocabulary[44].term).toBe('Virtual Private Network (VPN)');
  expect(vocabulary[25].definition).not.toContain('Term Definition');
});
test('loads original title, canvas, and game without errors',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto('/');await expect(game(page)).toHaveAttribute('data-ready','true');
  await expect(page.getByRole('heading',{name:'Every word is a key.'})).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();expect(errors).toEqual([]);
});
test('WASD and arrows move while walls and water block passage',async({page})=>{
  await start(page);await page.keyboard.press('a');await page.keyboard.press('ArrowLeft');
  await expect(game(page)).toHaveAttribute('data-x','1');
  await page.keyboard.press('w');await expect(game(page)).toHaveAttribute('data-y','9');
  await page.keyboard.press('s');await page.keyboard.press('d');
  await expect(game(page)).toHaveAttribute('data-x','2');
  const room=makeRoom(0,5);await walkTo(page,room.exit);await page.keyboard.press('e');
  await expect(game(page)).toHaveAttribute('data-chapter','0');
  await expect(page.locator('#feedback')).toContainText('locked');
  // The pool at (12,5) cannot be entered from its southern bank.
  await walkTo(page,{x:12,y:6},{exact:true});
  await page.keyboard.press('ArrowUp'); await expect(game(page)).toHaveAttribute('data-y','6');
});
test('guide, modal keyboard lock, incorrect answers, loss, and checkpoint recovery',async({page})=>{
  await start(page);await page.keyboard.press('e');
  await expect(page.getByRole('heading',{name:'Words open what swords cannot.'})).toBeVisible();
  await page.keyboard.press('Escape');await finishTrial(page,0);
  const learned=Number((await state(page)).learned);
  await expect(game(page)).toHaveAttribute('data-keys','1');
  await openTrial(page,1);const before=await state(page);
  await page.keyboard.press('ArrowLeft');await expect(game(page)).toHaveAttribute('data-x',before.x);
  const id=Number(before.quizId),right=id%3===2?vocabulary[id].definition:vocabulary[id].term;
  for(let i=0;i<5;i++) {
    const wrong=page.locator('#answers button').filter({hasNot:page.getByText(right,{exact:true})}).first();
    await wrong.click();
  }
  await expect(game(page)).toHaveAttribute('data-mode','lost');
  await expect(page.locator('#score')).toHaveText(String(learned*25));
  await page.getByRole('button',{name:'Return to chamber'}).click();
  await expect(game(page)).toHaveAttribute('data-mode','playing');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','5 of 5 hearts');
  await expect(game(page)).toHaveAttribute('data-keys','1');
  await expect(game(page)).toHaveAttribute('data-learned',String(learned));
});
test('journal records learned definitions, closes with Escape, and restart clears progress',async({page})=>{
  await start(page);await openTrial(page,0);await page.keyboard.press('4');await page.keyboard.press('Escape');
  await page.keyboard.press('m');await expect(page.getByRole('heading',{name:'Word journal',exact:true})).toBeVisible();
  await expect(page.locator('#journal-count')).toHaveText('1 / 45 terms recovered');
  await expect(page.locator('#journal-entries')).toContainText('Digital Footprint');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Restart adventure'}).click();
  await expect(game(page)).toHaveAttribute('data-learned','0');
  await expect(page.locator('#score')).toHaveText('0');
  await expect(game(page)).toHaveAttribute('data-x','2');
});
test('lantern ward dispels nearby inkshades without awarding duplicate points',async({page})=>{
  await start(page);await walkTo(page,{x:5,y:9});await page.keyboard.press('j');
  await expect(game(page)).toHaveAttribute('data-shades','1');
  await page.keyboard.press('j');await expect(game(page)).toHaveAttribute('data-shades','1');
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','5 of 5 hearts');
  await walkTo(page,{x:15,y:7},{allowShade:true,exact:true});
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label','4 of 5 hearts');
  await expect(game(page)).toHaveAttribute('data-shades','0');
});
test('all 45 vocabulary puzzles unlock five gates and win; replay resets everything',async({page})=>{
  await start(page);
  for(let chapter=0;chapter<5;chapter++) {
    for(let trial=0;trial<3;trial++)await finishTrial(page,trial);
    await expect(game(page)).toHaveAttribute('data-keys','3');
    await walkTo(page,makeRoom(chapter,5).exit);await page.keyboard.press('e');
    if(chapter<4)await expect(game(page)).toHaveAttribute('data-chapter',String(chapter+1));
  }
  await expect(game(page)).toHaveAttribute('data-mode','won');
  await expect(game(page)).toHaveAttribute('data-learned','45');
  await expect(page.locator('#score')).toHaveText('1125');
  await expect(page.getByRole('heading',{name:'The archive remembers.'})).toBeVisible();
  await page.getByRole('button',{name:'Begin again'}).click();
  await expect(game(page)).toHaveAttribute('data-learned','0');
  await expect(game(page)).toHaveAttribute('data-chapter','0');
});
test('mobile layout fits and touch controls move, interact, and close a dialog',async({page})=>{
  await page.setViewportSize({width:375,height:812});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button',{name:'Move up',exact:true}).click();
  await expect(game(page)).toHaveAttribute('data-y','9');
  await page.getByRole('button',{name:'Move down',exact:true}).click();
  await page.getByRole('button',{name:'Interact',exact:true}).click();
  await expect(page.locator('#puzzle')).toBeVisible();
  await page.getByRole('button',{name:'Close trial',exact:true}).click();
  await expect(game(page)).toHaveAttribute('data-mode','playing');
});
