// Mystic Woods Free 2.1 by Game Endeavor; see public/assets/mystic/LICENSE.txt.
import { WORLD } from './world.js';
export const directions=['down','up','left','right'];
export function preloadArt(scene){
  const sheet=(key,file,w,h=w)=>scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/mystic/${file}.png`,{frameWidth:w,frameHeight:h});
  sheet('player','player',48);sheet('slime','slime',32);sheet('chest','chest_01',16);
  sheet('terrain','plains',16);sheet('fences','fences',16);sheet('grass','grass',16);
}
export function createArt(scene){
  const animate=(key,texture,start,end,frameRate=8,repeat=-1)=>scene.anims.create({key,frames:scene.anims.generateFrameNumbers(texture,{start,end}),frameRate,repeat});
  for(const direction of directions){
    const row=direction==='up'?2:direction==='down'?0:1;
    animate(`hero-idle-${direction}`,'player',row*6,row*6+5,6);
    animate(`hero-run-${direction}`,'player',(row+3)*6,(row+3)*6+5,12);
    animate(`hero-attack-${direction}`,'player',(row+6)*6,(row+6)*6+3,14,0);
  }
  animate('slime-idle','slime',0,3,5);animate('slime-run','slime',7,13,9);
  animate('slime-attack','slime',14,20,10);animate('slime-death','slime',28,32,10,0);
  animate('chest-open','chest',0,3,8,0);
  // Original Keeper; no copied character art from other packs.
  const g=scene.make.graphics({x:0,y:0},false),p=(x,y,w,h,color)=>{g.fillStyle(color);g.fillRect(x,y,w,h);};
  p(4,13,9,3,0x2a343d);p(3,8,11,6,0x9a7960);p(5,2,7,7,0xd4ba94);
  p(4,1,9,3,0xb4c7b0);p(4,4,2,4,0xc9d5c1);p(11,4,2,4,0xc9d5c1);
  p(6,6,5,4,0xf1e8ce);p(8,4,1,1,0x344a46);p(11,4,1,1,0x344a46);
  p(13,8,1,8,0xd7b87b);p(12,9,3,3,0xf1d585);g.generateTexture('guide',16,16);g.destroy();
}
export function paintWorld(scene,room){
  const tile=(x,y,key,frame=0)=>scene.add.image(x*40+20,y*40+20,key,frame).setDisplaySize(40,40);
  const path=(x,y)=>(y>=12&&y<=14&&x>=3&&x<=37)||(x>=9&&x<=11&&y>=5&&y<=23)||(y>=21&&y<=23&&x>=3&&x<=35)||(x>=33&&x<=35&&y>=13&&y<=24);
  const water=scene.add.graphics();
  for(let y=0;y<WORLD.rows;y++)for(let x=0;x<WORLD.columns;x++){
    const key=`${x},${y}`;tile(x,y,'grass');
    if(path(x,y)){
      const col=!path(x-1,y)?1:!path(x+1,y)?3:2,row=!path(x,y-1)?0:!path(x,y+1)?2:1;
      tile(x,y,'terrain',row*6+col);
    }
    if(room.water.has(key)){
      water.fillStyle(0x426c87).fillRect(x*40,y*40,40,40);
      water.lineStyle(1,0x73a2b4,.55).lineBetween(x*40+9,y*40+22,x*40+28,y*40+22);
      if(!room.water.has(`${x},${y-1}`))water.fillStyle(0x263e43).fillRect(x*40,y*40,40,5);
    }
    if(room.walls.has(key))tile(x,y,'fences',x===0||x===WORLD.columns-1||x===15?4:1);
  }
  // Water above the grass layer; terrain collision still follows the room grid.
  scene.children.bringToTop(water);
  const arch=scene.add.graphics();const x=room.exit.x*40+20,y=room.exit.y*40+20;
  arch.fillStyle(0x344a36).fillRoundedRect(x-35,y-44,70,83,15);
  arch.fillStyle(0xb49a6c).fillRect(x-34,y-25,10,63).fillRect(x+24,y-25,10,63).fillRect(x-34,y-35,68,12);
  return arch;
}
