// Original pixel scenery, painted identically in the atlas and the playable world.
// Existing grass/path/water/tree sprites remain the texture sources.
const colors={grass:'#73a955',forest:'#34663c',sand:'#b9a365',highland:'#a8985c',marsh:'#669663',stone:'#9da88a'};
const key=(x,y)=>`${x},${y}`;

export function paintOverworldTile(context,map,x,y,size,art){
  const c=context,k=key(x,y),kind=map.terrain.get(k)||'grass',n=(x*37+y*19)%17;
  c.save();c.translate(x*size,y*size);c.scale(size/16,size/16);c.imageSmoothingEnabled=false;
  c.fillStyle=colors[kind];c.fillRect(0,0,16,16);
  if(art&&kind==='grass'){c.globalAlpha=.35;c.drawImage(art.grass,0,0,16,16,0,0,16,16);c.globalAlpha=1;}
  // A restrained, repeatable pixel grain, rather than flat administrative blocks.
  c.fillStyle=kind==='forest'?'#487a44':kind==='highland'||kind==='sand'?'#cbb778':'#88b861';
  c.fillRect(2+n%9,4+n%7,2,1);c.fillRect(10-n%6,12-n%4,1,1);
  if(map.water.has(k)){
    c.fillStyle='#315b94';c.fillRect(0,0,16,16);
    if(art){c.globalAlpha=.55;c.drawImage(art.water,0,0,16,16,0,0,16,16);c.globalAlpha=1;}
    c.fillStyle='#759fc3';if(n%3===0)c.fillRect(n%7+2,7,5,1);
  }else{
    // Sandy, stepped banks and dark water-facing edges follow the actual collision mask.
    for(const [dx,dy,rx,ry,rw,rh] of [[0,-1,0,0,16,3],[0,1,0,13,16,3],[-1,0,0,0,3,16],[1,0,13,0,3,16]]){
      if(!map.water.has(key(x+dx,y+dy)))continue;
      c.fillStyle='#d2be7e';c.fillRect(rx,ry,rw,rh);c.fillStyle='#716f48';
      c.fillRect(dx===1?15:rx,dy===1?15:ry,dx?1:16,dy?1:16);
    }
  }
  if(map.paths.has(k)&&!map.water.has(k)){
    const col=!map.paths.has(key(x-1,y))?1:!map.paths.has(key(x+1,y))?3:2;
    const row=!map.paths.has(key(x,y-1))?0:!map.paths.has(key(x,y+1))?2:1;
    if(art)c.drawImage(art.terrain,col*16,row*16,16,16,0,0,16,16);
    else{c.fillStyle='#b69b64';c.fillRect(0,0,16,16);}
  }
  if(map.bridge.has(k)){
    c.fillStyle='#b6a17d';c.fillRect(0,0,16,16);c.fillStyle='#e0cda0';c.fillRect(1,0,2,16);c.fillRect(13,0,2,16);
    c.fillStyle='#807656';for(let row=3;row<16;row+=4)c.fillRect(3,row,10,1);
  }
  if(map.gardens.has(k)){
    c.fillStyle='#375d39';c.fillRect(1,1,14,14);c.fillStyle='#9bac70';c.fillRect(1,1,14,1);
    for(let row=3;row<15;row+=4)for(let col=3;col<15;col+=4){c.fillStyle=(row+col)%3?'#d3b164':'#c68167';c.fillRect(col,row,2,2);}
  }
  if(map.cliffs.has(k)){
    c.fillStyle='#564d32';c.fillRect(0,2,16,14);
    c.fillStyle='#82653e';c.fillRect(1,3,14,11);
    c.fillStyle='#a1844d';c.fillRect(2,4,12,7);
    c.fillStyle='#c3ac6b';c.fillRect(0,0,16,3);c.fillRect(1,3,14,1);
    c.fillStyle='#665330';c.fillRect(3,6,1,7);c.fillRect(11,5,1,8);c.fillRect(6,12,5,1);
    c.fillStyle='#557743';c.fillRect(0,0,4,1);c.fillRect(12,0,4,1);
  }
  if((!x||!y||x===71||y===53)&&kind!=='sand'&&kind!=='highland'&&!map.water.has(k)){
    c.fillStyle='#203e2c';c.fillRect(0,0,16,16);c.fillStyle='#426d3d';c.fillRect(2,2,12,10);c.fillStyle='#59894a';c.fillRect(4,2,7,2);
  }
  if(map.fortress.has(k)){
    c.fillStyle='#485a50';c.fillRect(0,1,16,15);c.fillStyle='#d5d6b6';c.fillRect(1,0,14,12);
    c.fillStyle='#fff1ce';c.fillRect(1,0,14,2);c.fillRect(1,0,2,12);
    c.fillStyle='#8f9c87';c.fillRect(2,7,12,1);c.fillRect(7,2,1,5);c.fillRect(4,8,1,4);
    c.fillStyle='#e9e4c2';c.fillRect(0,0,4,4);c.fillRect(6,0,4,4);c.fillRect(12,0,4,4);
  }
  if(map.fields.has(k)){
    c.fillStyle='#846746';c.fillRect(0,0,16,16);
    for(let row=2;row<16;row+=4){c.fillStyle='#4e743b';c.fillRect(1,row,14,2);c.fillStyle='#a7b45f';for(let col=2;col<15;col+=4)c.fillRect(col,row,2,1);}
  }
  const b=map.buildings.get(k);
  if(b){
    if(b.ly<b.h-1){
      c.fillStyle=b.roof;c.fillRect(0,0,16,16);c.fillStyle='#533f33';c.fillRect(0,14,16,2);
      c.fillStyle=b.highlight;for(let row=2;row<15;row+=4)c.fillRect(0,row,16,1);
      c.fillStyle='#463e32';if(b.lx===0)c.fillRect(0,0,2,16);if(b.lx===b.w-1)c.fillRect(14,0,2,16);
    }else{
      c.fillStyle='#584e3e';c.fillRect(0,0,16,15);c.fillStyle='#d0bd86';c.fillRect(1,0,14,11);
      c.fillStyle='#a18e64';c.fillRect(1,8,14,1);
      if(b.lx===Math.floor(b.w/2)){c.fillStyle='#354a44';c.fillRect(4,3,8,12);c.fillStyle='#e4cf8d';c.fillRect(10,8,1,2);}
      else{c.fillStyle='#425e62';c.fillRect(5,2,6,5);c.fillStyle='#ddd29b';c.fillRect(7,2,1,5);c.fillRect(5,4,6,1);}
    }
  }
  if(map.flowers.has(k)&&!map.water.has(k)&&!map.walls.has(k)){
    c.fillStyle='#d2c276';c.fillRect(4,5,2,2);c.fillRect(11,10,2,2);c.fillStyle='#e7dcab';c.fillRect(4,5,1,1);c.fillRect(11,10,1,1);
  }
  c.restore();
}

export function paintAtlasDetails(c,map,sx,sy,art){
  c.imageSmoothingEnabled=false;
  if(art&&!art.forestTree){
    // The supplied oak, tinted to the same woodland palette used by Phaser.
    const canopy=document.createElement('canvas');canopy.width=192;canopy.height=192;
    const cc=canopy.getContext('2d');cc.drawImage(art.tree3,0,0,192,192,0,0,192,192);
    const pixels=cc.getImageData(0,0,192,192),d=pixels.data;
    for(let i=0;i<d.length;i+=4){d[i]*=80/255;d[i+1]*=150/255;d[i+2]*=160/255;}
    cc.putImageData(pixels,0,0);art.forestTree=canopy;
  }
  for(const t of map.trees){
    if(art&&t.forest)c.drawImage(art.forestTree,(t.x-2)*sx,(t.y-3.5)*sy,5*sx,5*sy);
    else if(art)c.drawImage(art[`tree${t.variant}`],0,0,192,t.variant<=2?256:192,(t.x-1)*sx,(t.y-2.2)*sy,3*sx,(t.variant<=2?4:3)*sy);
    else{c.fillStyle='#264f32';c.fillRect((t.x-.5)*sx,(t.y-1)*sy,2*sx,2*sy);}
  }
}
