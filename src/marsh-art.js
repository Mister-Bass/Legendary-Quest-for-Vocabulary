import { pondImages,pondTile,PondLife } from './marsh-water.js';
import { marshPlantImages,paintMarshSceneryCell } from './marsh-scenery.js';
import { cell,makeMarshRoom } from './marsh-map.js';
// Supplied forest terrain and original 16-pixel creatures; see assets/forest/CREDITS.txt.
export function createMarshArt(scene){
  const texture=(key,paint)=>{if(scene.textures.exists(key))return;const t=scene.textures.createCanvas(key,16,16);paint(t.context);t.refresh();};
  const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  // Keep the supplied sheet intact; native-size frames are shared by all map views.
  const forest=scene.textures.get('marsh-forest').getSourceImage();
  texture('marsh-grass',c=>c.drawImage(forest,128,32,16,16,0,0,16,16));
  const tree=scene.textures.createCanvas('marsh-tree',48,64);
  tree.context.drawImage(forest,160,48,48,64,0,0,48,64);tree.refresh();
  texture('marsh-lantern',c=>{rect(c,'#435653',6,7,4,9);rect(c,'#252e32',3,2,10,9);rect(c,'#b28a48',4,1,8,2);rect(c,'#806744',5,4,6,5);rect(c,'#d5ab58',6,4,3,3);});
  texture('marsh-lantern-lit',c=>{rect(c,'#435653',6,7,4,9);rect(c,'#493f32',3,2,10,9);rect(c,'#e9b452',4,1,8,2);rect(c,'#ffda75',5,3,6,6);rect(c,'#fff4b0',7,3,2,4);});
  texture('marsh-wisp',c=>{rect(c,'#657e85',5,5,7,9);rect(c,'#a5c7c2',4,4,8,8);rect(c,'#e8f1d6',6,2,4,7);rect(c,'#fff3aa',7,5,2,4);rect(c,'#455364',6,10,1,1);rect(c,'#455364',10,10,1,1);});
  texture('marsh-octorok',c=>{rect(c,'#643e3d',2,10,12,4);rect(c,'#a43f3f',3,5,10,7);rect(c,'#df6456',5,3,6,7);rect(c,'#ffe4c3',5,6,2,2);rect(c,'#ffe4c3',10,6,2,2);rect(c,'#482f31',6,10,4,3);rect(c,'#e8a477',7,11,2,1);});
  texture('marsh-slurg',c=>{rect(c,'#3c2b55',2,9,12,5);rect(c,'#7f4a9a',3,6,10,7);rect(c,'#ac72bb',5,4,6,6);rect(c,'#eee3b3',5,9,2,2);rect(c,'#eee3b3',10,9,2,2);});
  texture('marsh-toad',c=>{rect(c,'#264c31',1,5,14,10);rect(c,'#497839',2,3,12,10);rect(c,'#8dab54',4,6,8,7);rect(c,'#577d36',2,1,4,5);rect(c,'#577d36',10,1,4,5);rect(c,'#f1d879',3,2,2,2);rect(c,'#f1d879',11,2,2,2);rect(c,'#283d28',4,9,8,1);rect(c,'#d7ce88',5,11,6,3);});
  texture('marsh-door',c=>{rect(c,'#6c777d',1,1,14,15);rect(c,'#a8afb0',2,0,12,3);rect(c,'#37254e',4,3,8,12);rect(c,'#67458c',5,4,6,11);rect(c,'#ab83c0',7,5,2,9);for(const x of [4,8,11])rect(c,'#251e38',x,7,1,3);});
  texture('marsh-door-open',c=>{rect(c,'#6c777d',1,1,14,15);rect(c,'#a8afb0',2,0,12,3);rect(c,'#271e3b',4,3,8,12);rect(c,'#6e7297',5,4,6,11);rect(c,'#e6e0ac',7,5,2,10);});
  const preview=scene.textures.createCanvas('marsh-preview',512,512),c=preview.context,room=makeMarshRoom(),art=marshTerrainArt(scene);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)paintMarshTile(c,room,x,y,16,art);
  for(const p of room.seals)c.drawImage(scene.textures.get('marsh-lantern').getSourceImage(),p.x*16,p.y*16,16,16);
  c.drawImage(scene.textures.get('marsh-door').getSourceImage(),15*16,1*16,32,32);
  c.drawImage(scene.textures.get('chest').getSourceImage(),0,0,16,16,room.heart.x*16,room.heart.y*16,16,16);
  for(const e of room.shades)c.drawImage(scene.textures.get(e.type==='wisp'?'marsh-wisp':e.type==='octorok'?'marsh-octorok':'marsh-slurg').getSourceImage(),e.x*16,e.y*16,16,16);
  c.drawImage(scene.textures.get('marsh-toad').getSourceImage(),room.boss.x*16-8,room.boss.y*16-8,32,32);
  c.fillStyle='#9ac96e';c.beginPath();c.moveTo(248,464);c.lineTo(240,480);c.lineTo(256,480);c.closePath();c.fill();
  preview.refresh();
}
export function paintMarshTile(c,room,x,y,size=16,art=null){
  const k=cell(x,y);c.save();c.translate(x*size,y*size);c.scale(size/16,size/16);c.imageSmoothingEnabled=false;
  if(art?.grass)c.drawImage(art.grass,0,0,16,16);else{c.fillStyle='#187454';c.fillRect(0,0,16,16);}
  if(room.mud.has(k))paintMud(c,room,x,y,art?.mud);
  if(room.stone.has(k)){c.fillStyle='#8f958d';c.fillRect(0,0,16,16);c.fillStyle='#aeb1a2';c.fillRect(1,1,6,12);c.fillRect(9,1,6,6);c.fillRect(9,9,6,5);c.fillStyle='#737e76';c.fillRect(0,15,16,1);}
  if(room.water.has(k)){const image=art?.pond?.[pondTile(room,x,y)];if(image)c.drawImage(image,0,0,image.width,image.height,0,0,16,16);else{c.fillStyle='#6abdc5';c.fillRect(0,0,16,16);}}
  if(room.bridge.has(k))paintPad(c,false);
  if(room.walls.has(k)){
    if(art?.props&&room.scenery?.some(p=>p.x===x&&p.y===y)&&(room.bushes?.some(p=>p.x===x&&p.y===y)||room.rocks.some(p=>p.x===x&&p.y===y))){/* supplied prop painted below */}
    else if(room.pillars?.some(p=>p.x===x&&p.y===y)){c.fillStyle='#53636a';c.fillRect(2,13,12,3);c.fillStyle='#959e9b';c.fillRect(4,3,8,10);c.fillStyle='#c0c5b5';c.fillRect(5,4,2,8);c.fillStyle='#aeb8ab';c.fillRect(2,1,12,3);}
    else if(room.bushes?.some(p=>p.x===x&&p.y===y)){c.fillStyle='#244e31';c.fillRect(2,6,12,9);c.fillStyle='#3e8347';c.fillRect(3,3,10,10);c.fillStyle='#72a451';c.fillRect(5,4,5,4);c.fillStyle='#d0a063';c.fillRect(4,8,1,1);c.fillRect(11,6,1,1);}
    else if(room.rocks.some(p=>p.x===x&&p.y===y)){c.fillStyle='#53636a';c.fillRect(2,5,12,10);c.fillStyle='#8e999c';c.fillRect(4,2,8,11);c.fillStyle='#b4bbab';c.fillRect(5,3,3,6);}
    else if(art?.tree)paintForestEdge(c,room,x,y,art.tree);else{c.fillStyle='#234f32';c.fillRect(0,0,16,16);c.fillStyle='#357643';c.fillRect(3,2,11,11);}
  }
  paintMarshSceneryCell(c,room,x,y,art?.props);
  c.restore();
}
// A 48x64 tree spans 3x4 native tiles rather than being squeezed into one.
// Crop only the existing forest collision band, leaving the southern entrance open.
function paintForestEdge(c,room,x,y,tree){
  const b=room.forestBounds||{x:0,y:0,width:32,height:32},u=x-b.x,v=y-b.y;
  // A canopy tile underneath joins neighboring trees without passable-looking gaps.
  c.drawImage(tree,16,16,16,16,0,0,16,16);
  let col,row;
  if(u<2){col=u+1;row=v%4;}
  else if(u>=b.width-2){col=u-(b.width-2);row=v%4;}
  else if(v<2){col=u%3;row=v+2;}
  else if(v>=b.height-2){col=u%3;row=v-(b.height-2);}
  else{col=u%3;row=v%3;}
  c.drawImage(tree,col*16,row*16,16,16,0,0,16,16);
}
function marshTerrainArt(scene){return {pond:pondImages(scene),props:marshPlantImages(scene),tree:scene.textures.get('marsh-tree').getSourceImage(),grass:scene.textures.get('marsh-grass').getSourceImage(),mud:scene.textures.get('marsh-mud').getSourceImage()};}
// Sample the supplied mud interior so transparent padding and square tile rims
// do not repeat inside each connected patch. Only exposed shores receive a rim.
function paintMud(c,room,x,y,image){
  c.fillStyle='#755e2c';c.fillRect(0,0,16,16);
  if(image)c.drawImage(image,72,72,112,112,0,0,16,16);
  const top=!room.mud.has(cell(x,y-1)),bottom=!room.mud.has(cell(x,y+1)),left=!room.mud.has(cell(x-1,y)),right=!room.mud.has(cell(x+1,y));
  c.fillStyle='#39351d';
  for(let i=0;i<16;i++){
    const dip=(i+((x+y)%3))%7<3?1:0;
    if(top)c.fillRect(i,0,1,1+dip);if(bottom)c.fillRect(i,15-dip,1,1+dip);
    if(left)c.fillRect(0,i,1+dip,1);if(right)c.fillRect(15-dip,i,1+dip,1);
  }
  c.fillStyle='#ac914d';
  if(top)c.fillRect(4,2,6,1);if(left)c.fillRect(2,5,1,5);
  c.fillStyle='#514020';if(bottom)c.fillRect(4,13,8,1);if(right)c.fillRect(13,4,1,8);
}
// Pixel bubbles expand and pop out of phase. This clock pauses with gameplay.
export function paintMarshOoze(g,room,clock){
  g.clear();
  for(const k of room.mud){
    const [x,y]=k.split(',').map(Number);if((x*3+y*5)%4!==0)continue;
    const phase=Math.floor((clock+(x*7+y*11)%23*.17)*3)%9;
    const px=x*40+10+(x*7%16),py=y*40+12+(y*5%14);
    // Broad dark pools and broken highlights read as a thick wet surface.
    g.fillStyle(0x3b321f,.45).fillRect(px-12.5,py,25,7.5).fillRect(px-7.5,py-2.5,15,12.5);
    g.fillStyle(0xc0a15b,.5).fillRect(px-7.5,py-2.5,10,2.5);
    if(phase<5){
      const r=phase<2?5:7.5;
      g.fillStyle(0x49391e).fillRect(px-r-2.5,py-r,r*2+5,r*2);
      g.fillStyle(0x8c7437).fillRect(px-r,py-r-2.5,r*2,r*2);
      g.fillStyle(0xc0a15b,.8).fillRect(px-r,py-r-2.5,r,2.5);
    }else if(phase<7){
      g.fillStyle(0x4f4122,.8).fillRect(px-7.5,py,15,2.5);
      g.fillStyle(0xb09a58,.6).fillRect(px-5,py-2.5,5,2.5);
    }
  }
}
export function paintPad(c,sinking){c.fillStyle=sinking?'#4a7d54':'#80b75a';c.beginPath();c.moveTo(8,1);c.lineTo(14,4);c.lineTo(8,8);c.lineTo(14,12);c.lineTo(9,15);c.lineTo(3,13);c.lineTo(1,8);c.lineTo(3,3);c.closePath();c.fill();c.fillStyle='#a1ca70';c.fillRect(4,4,4,1);}
export function paintMarshWorld(scene,room){
  const id='chamber-ground';if(scene.textures.exists(id))scene.textures.remove(id);
  const texture=scene.textures.createCanvas(id,512,512),c=texture.context,art=marshTerrainArt(scene);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)paintMarshTile(c,room,x,y,16,art);
  texture.refresh();scene.add.image(0,0,id).setOrigin(0).setDisplaySize(1280,1280);scene.chamberGround=texture.getSourceImage();scene.waterSprites=[];scene.treeSprites=[];
  scene.mudEffects=scene.add.graphics();
  scene.pondEffects=scene.add.graphics();scene.pondLife=new PondLife(room);
  scene.doorSprite=scene.add.image(620,100,'marsh-door').setDisplaySize(100,100).setOrigin(.5,.65);
  scene.heartChest=scene.add.sprite(room.heart.x*40+20,room.heart.y*40+20,'chest').setDisplaySize(40,40).setFrame(scene.marshProgress.heartTaken?3:0);
  Object.assign(document.getElementById('game').dataset,{artArea:'A02',tilePixels:16,tileset:'lantern-marsh',terrainTheme:'marsh'});
}
