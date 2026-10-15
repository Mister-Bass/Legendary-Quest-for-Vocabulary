// TOP-DOWN Adventure Pack by o_lobster, CC BY 4.0. See public/assets/topdown/CREDITS.txt.
export const directions = ['down', 'up', 'left', 'right'];

export function preloadArt(scene) {
  const sheet = (key, file) => scene.load.spritesheet(key, `${import.meta.env.BASE_URL}assets/topdown/${file}.png`, { frameWidth:16, frameHeight:16 });
  sheet('terrain', 'overworld');
  for (const direction of directions) for (const action of ['idle', 'run']) {
    sheet(`hero-${action}-${direction}`, `hero-${action}-${direction}`);
  }
  for (const name of ['phantom', 'crystal', 'key', 'water']) sheet(name, name);
}

export function createArt(scene) {
  const animate = (key, frames, frameRate=8) => scene.anims.create({key, frames:scene.anims.generateFrameNumbers(key,{start:0,end:frames-1}), frameRate, repeat:-1});
  for (const direction of directions) for (const action of ['idle', 'run']) animate(`hero-${action}-${direction}`, 6, action==='run'?14:6);
  animate('phantom',4); animate('crystal',6); animate('key',6); animate('water',8,5);
  const terrain=scene.textures.get('terrain');
  terrain.add('tree',0,48,144,32,48);
  terrain.add('gate',0,112,144,48,32);
  // The Keeper and rune bases remain original game artwork.
  const g=scene.make.graphics({x:0,y:0},false);
  const p=(x,y,w,h,color)=>{g.fillStyle(color);g.fillRect(x,y,w,h);};
  p(4,13,9,3,0x2a343d);p(3,8,11,6,0x9a7960);p(5,2,7,7,0xd4ba94);
  p(4,1,9,3,0xb4c7b0);p(4,4,2,4,0xc9d5c1);p(11,4,2,4,0xc9d5c1);
  p(6,6,5,4,0xf1e8ce);p(8,4,1,1,0x344a46);p(11,4,1,1,0x344a46);
  p(13,8,1,8,0xd7b87b);p(12,9,3,3,0xf1d585);
  g.generateTexture('guide',16,16);g.destroy();
}

export function paintWorld(scene, room, chapter) {
  const tint=[0xd8e6bf,0xb9bcdd,0xc7dbb5,0xe8c69c,0xa8d2d7][chapter];
  const tile=(x,y,frame)=>scene.add.image(x*40+20,y*40+20,'terrain',frame).setDisplaySize(40,40).setTint(tint);
  for(let y=0;y<14;y++)for(let x=0;x<20;x++){
    const key=`${x},${y}`;
    const path=(x>=2&&x<=17&&y>=6&&y<=8)||(x>=4&&x<=6&&y>=3&&y<=11)||(x>=9&&x<=11&&y>=3&&y<=11)||(x>=15&&x<=17&&y>=10&&y<=11);
    tile(x,y,path?54:24);
    if(room.water.has(key))scene.add.sprite(x*40+20,y*40+20,'water').setDisplaySize(40,40).play('water');
    if(room.walls.has(key)){
      if(x===7||y===9&&x>10)tile(x,y,7*18+8);
      else scene.add.image(x*40+20,y*40+6,'terrain','tree').setDisplaySize(52,72).setTint(tint);
    }
  }
  scene.add.image(740,286,'terrain','gate').setDisplaySize(120,80).setTint(tint);
  for(const [x,y]of[[2,3],[8,11],[17,3],[11,2]])tile(x,y,4*18+1);
  const g=scene.add.graphics();
  for(const point of room.seals){g.fillStyle(0x34484d);g.fillEllipse(point.x*40+20,point.y*40+34,34,12);g.lineStyle(2,0xb7bda0);g.strokeEllipse(point.x*40+20,point.y*40+34,34,12);}
  return g;
}
