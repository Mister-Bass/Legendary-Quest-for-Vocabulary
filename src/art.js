// Mystic Woods Free 2.1 by Game Endeavor; see public/assets/mystic/LICENSE.txt.
import { WORLD } from './world.js';
export const directions=['down','up','left','right'];
export function preloadArt(scene){
  const sheet=(key,file,w,h=w)=>scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/mystic/${file}.png`,{frameWidth:w,frameHeight:h});
  sheet('player','player',48);sheet('slime','slime',32);sheet('chest','chest_01',16);
  sheet('terrain','plains',16);sheet('fences','fences',16);sheet('grass','grass',16);
  const scenery=(key,file,w,h=w)=>scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/scenery/${file}.png`,{frameWidth:w,frameHeight:h});
  scenery('guide','mage-cyan',32);scenery('water','water',16);
  for(let i=1;i<=4;i++)scenery(`tree${i}`,`tree${i}`,192,i<=2?256:192);
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
  animate('water-ripple','water',0,7,6);
  for(let i=1;i<=4;i++)animate(`tree${i}-sway`,`tree${i}`,0,7,8);
  scene.anims.create({key:'keeper-dance',frames:[0,1,2,3,4,5,12,13,12,5,4,3,2,1].map(frame=>({key:'guide',frame})),frameRate:7,repeat:-1});
}
export function paintWorld(scene,room){
  const tile=(x,y,key,frame=0)=>scene.add.image(x*40+20,y*40+20,key,frame).setDisplaySize(40,40);
  const path=(x,y)=>(y>=12&&y<=14&&x>=3&&x<=37)||(x>=9&&x<=11&&y>=5&&y<=23)||(y>=21&&y<=23&&x>=3&&x<=35)||(x>=33&&x<=35&&y>=13&&y<=24);
  scene.waterSprites=[];
  for(let y=0;y<WORLD.rows;y++)for(let x=0;x<WORLD.columns;x++){
    const key=`${x},${y}`;tile(x,y,'grass');
    if(path(x,y)){
      const col=!path(x-1,y)?1:!path(x+1,y)?3:2,row=!path(x,y-1)?0:!path(x,y+1)?2:1;
      tile(x,y,'terrain',row*6+col);
    }
    if(room.water.has(key)){
      scene.waterSprites.push(scene.add.sprite(x*40+20,y*40+20,'water').setDisplaySize(40,40).play('water-ripple'));
    }
    if(room.walls.has(key))tile(x,y,'fences',x===0||x===WORLD.columns-1||x===15?4:1);
  }
  scene.treeSprites=room.trees.map(({x,y,variant})=>{
    const height=variant<=2?256:192;
    return scene.add.sprite(x*40+20,y*40+28,`tree${variant}`).setOrigin(.5,variant<=2?.94:.88).setDisplaySize(134,height*.7).play(`tree${variant}-sway`);
  });
  const arch=scene.add.graphics();const x=room.exit.x*40+20,y=room.exit.y*40+20;
  arch.fillStyle(0x344a36).fillRoundedRect(x-35,y-44,70,83,15);
  arch.fillStyle(0xb49a6c).fillRect(x-34,y-25,10,63).fillRect(x+24,y-25,10,63).fillRect(x-34,y-35,68,12);
  return arch;
}
