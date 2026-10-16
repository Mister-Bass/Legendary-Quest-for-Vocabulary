// Mystic Woods Free 2.1 by Game Endeavor; see public/assets/mystic/LICENSE.txt.
import { WORLD } from './world.js';
import { makeChamberLandscape, regionStyles, TILE_PIXELS } from './region-art.js';
import { paintOverworldTile } from './overworld-art.js';
export const directions=['down','up','left','right'];
export function preloadArt(scene){
  const sheet=(key,file,w,h=w)=>scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/mystic/${file}.png`,{frameWidth:w,frameHeight:h});
  sheet('player','player',48);sheet('slime','slime',32);sheet('chest','chest_01',16);
  sheet('terrain','plains',16);sheet('fences','fences',16);sheet('grass','grass',16);
  const scenery=(key,file,w,h=w)=>scene.load.spritesheet(key,`${import.meta.env.BASE_URL}assets/scenery/${file}.png`,{frameWidth:w,frameHeight:h});
  scene.load.image('bridge',`${import.meta.env.BASE_URL}assets/bridge/pontev2.png`);
  scene.load.image('puny',`${import.meta.env.BASE_URL}assets/puny/punyworld.png`);
  for(const [key,file]of[['rune-door','door'],['rune-door-open','door-open'],['rune-key','key']])scene.load.image(key,`${import.meta.env.BASE_URL}assets/gate/${file}.svg`);
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
  const art=Object.fromEntries(['grass','terrain','water','puny'].map(key=>[key,scene.textures.get(key).getSourceImage()]));
  const landscape=makeChamberLandscape(room),id='chamber-ground';
  if(scene.textures.exists(id))scene.textures.remove(id);
  // Author at native 16×16 resolution, then scale with nearest-neighbor sampling.
  const texture=scene.textures.createCanvas(id,WORLD.columns*TILE_PIXELS,WORLD.rows*TILE_PIXELS),c=texture.context;
  for(let y=0;y<WORLD.rows;y++)for(let x=0;x<WORLD.columns;x++)paintOverworldTile(c,landscape,x,y,TILE_PIXELS,art);
  texture.refresh();scene.add.image(0,0,id).setOrigin(0).setDisplaySize(WORLD.columns*40,WORLD.rows*40);
  scene.chamberLandscape=landscape;scene.chamberArt=art;scene.chamberGround=texture.getSourceImage();
  Object.assign(document.getElementById('game').dataset,{artArea:room.areaId,tilePixels:TILE_PIXELS,tileset:'puny-world',terrainTheme:regionStyles[room.areaId].terrain});
  scene.waterSprites=[];
  for(let y=0;y<WORLD.rows;y++)for(let x=0;x<WORLD.columns;x++){
    const key=`${x},${y}`;
    if(room.water.has(key)){
      scene.waterSprites.push(scene.add.sprite(x*40+20,y*40+20,'water').setDisplaySize(40,40).play('water-ripple'));
    }
  }
  if(room.bridge.size)scene.add.image(402,680,'bridge').setDisplaySize(272,200).setAngle(90);
  scene.treeSprites=room.trees.map(({x,y,variant})=>{
    const height=variant<=2?256:192;
    return scene.add.sprite(x*40+20,y*40+28,`tree${variant}`).setOrigin(.5,variant<=2?.94:.88).setDisplaySize(134,height*.7).setTint(regionStyles[room.areaId].tree).play(`tree${variant}-sway`);
  });
  const x=room.exit.x*40+20,y=room.exit.y*40+20;
  scene.doorSprite=scene.add.image(x,y,'rune-door').setDisplaySize(80,80).setOrigin(.5,.65);
  return scene.doorSprite;
}
