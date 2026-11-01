import { test,expect } from '@playwright/test';
for(const area of ['A07','A02'])test(`32px runtime frames and terrain load in ${area}`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?area='+area);const game=page.locator('#game');await expect(game).toHaveAttribute('data-ready','true');
  await expect(game).toHaveAttribute('data-art-format','32x32-16bit');
  const art=JSON.parse(await game.getAttribute('data-art-frames'));
  expect(art.length).toBeGreaterThanOrEqual(55);
  expect(art.map(a=>a.key)).toEqual(expect.arrayContaining(['player','slime','chest','guide','terrain','puny','topdown','water','pond-10','marsh-grass','marsh-mud-tile','effect-fish']));
  for(const {key,frames} of art){expect(frames.length,key).toBeGreaterThan(0);for(const size of frames)expect(size,key).toEqual([32,32]);}
  await page.getByRole('button',{name:'Begin adventure'}).click();
  await expect(game).toHaveAttribute('data-tile-pixels','32');
  await page.keyboard.press('Space');await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
  await page.getByRole('button',{name:'Restart adventure'}).click();await expect(game).toHaveAttribute('data-mode','playing');
  await page.locator('#game canvas').screenshot({path:test.info().outputPath(area+'-32px.png')});
  expect(errors).toEqual([]);
});
