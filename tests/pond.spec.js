import {begin,restart} from './play-input.js';
import { test,expect } from '@playwright/test';
import { walkTo } from './play-input.js';

test('pond wind, ripples, and fish animate, pause for maps, and reset on restart',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?area=A02');const game=page.locator('#game');
  await expect(game).toHaveAttribute('data-ready','true');await begin(page);
  const frame=await game.getAttribute('data-water-frame');
  await expect.poll(()=>game.getAttribute('data-water-frame')).not.toBe(frame);
  await expect(game).toHaveAttribute('data-active-ripples','1',{timeout:4000});
  await expect(game).toHaveAttribute('data-active-fish','1',{timeout:7000});
  await page.locator('#game canvas').screenshot({path:test.info().outputPath('pond-fish-jump.png')});
  await page.getByRole('button',{name:'Marsh map',exact:true}).click();
  const before=await game.evaluate(e=>({clock:e.dataset.pondClock,fish:e.dataset.fishJumps,frame:e.dataset.waterFrame}));
  await page.waitForTimeout(700);
  expect(await game.evaluate(e=>({clock:e.dataset.pondClock,fish:e.dataset.fishJumps,frame:e.dataset.waterFrame}))).toEqual(before);
  await page.getByRole('button',{name:'Close marsh map'}).click();
  await expect.poll(async()=>Number(await game.getAttribute('data-pond-clock'))).toBeGreaterThan(Number(before.clock));
  await restart(page);
  await expect(game).toHaveAttribute('data-fish-jumps','0');await expect(game).toHaveAttribute('data-water-ripples','0');
  expect(Number(await game.getAttribute('data-pond-clock'))).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('pond lily pads disappear into water, leave ripples, and regrow without countdown circles',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?area=A02');const game=page.locator('#game');await expect(game).toHaveAttribute('data-ready','true');await begin(page);
  const count=Number(await game.getAttribute('data-visible-pads'));expect(count).toBeGreaterThan(0);
  await walkTo(page,{x:16,y:24},{exact:true,avoidEnemies:false,attack:false});
  // The route helper stops within a steering tolerance; step fully onto the leaf.
  await page.keyboard.down('w');try{await expect.poll(async()=>Number(await game.getAttribute('data-py')),{intervals:[20]}).toBeLessThan(990);}finally{await page.keyboard.up('w');}
  await page.keyboard.down('q');
  try{
    await expect(game).toHaveAttribute('data-falls','1',{timeout:5000});
    await expect.poll(async()=>Number(await game.getAttribute('data-visible-pads'))).toBeLessThan(count);
    await expect.poll(async()=>Number(await game.getAttribute('data-pad-ripples'))).toBeGreaterThan(0);
    await page.locator('#game canvas').screenshot({path:test.info().outputPath('pad-water-ripple.png')});
    await expect(game).toHaveAttribute('data-visible-pads',String(count),{timeout:6000});
    await expect(game).toHaveAttribute('data-pad-ripples','0');
  }finally{await page.keyboard.up('q');}
  await restart(page);await expect(game).toHaveAttribute('data-falls','0');await expect(game).toHaveAttribute('data-visible-pads',String(count));expect(errors).toEqual([]);
});
