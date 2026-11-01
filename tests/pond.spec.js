import { test,expect } from '@playwright/test';

test('pond wind, ripples, and fish animate, pause for maps, and reset on restart',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?area=A02');const game=page.locator('#game');
  await expect(game).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Begin adventure'}).click();
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
  await page.getByRole('button',{name:'Restart adventure'}).click();
  await expect(game).toHaveAttribute('data-fish-jumps','0');await expect(game).toHaveAttribute('data-water-ripples','0');
  expect(Number(await game.getAttribute('data-pond-clock'))).toBeLessThan(1);
  expect(errors).toEqual([]);
});
