// Original pixel artwork drawn locally; no external artwork or game assets are used.
export function createArt(scene) {
  const texture = (name, paint, size = 16) => {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const p = (x, y, w, h, color) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
    paint(p); g.generateTexture(name, size, size); g.destroy();
  };
  texture('traveler', p => {
    p(3,14,11,2,0x172c29); p(5,12,3,3,0x323645); p(10,12,3,3,0x323645);
    p(4,7,10,6,0x428d8c); p(3,9,2,4,0xdab795); p(13,9,2,4,0xdab795);
    p(5,2,8,7,0x326f79); p(7,4,6,5,0xe1bca0); p(11,5,1,2,0x25363b);
    p(4,1,8,3,0x438e95); p(4,3,3,5,0x438e95); p(7,9,6,2,0xe4a56a);
    p(3,10,3,4,0x365773); p(8,12,5,1,0xd4bc84); p(14,7,1,5,0xe2d9aa);
  });
  texture('tree', p => {
    p(6,11,4,5,0x62513c); p(3,4,11,8,0x1e3d34); p(1,5,14,5,0x234a3b);
    p(4,1,8,4,0x2d6247); p(2,4,11,4,0x397854); p(4,3,5,3,0x4b8960);
    p(3,8,4,2,0x2f6547); p(10,6,3,3,0x306148); p(5,2,2,1,0x72a272);
  });
  texture('seal', p => {
    p(2,13,12,3,0x364945); p(4,4,8,10,0x8c9d8d); p(3,3,10,3,0xabb7a0);
    p(5,6,6,6,0x384d4d); p(7,6,2,2,0xf1cf83); p(6,8,4,1,0xf1cf83); p(7,9,2,2,0xf1cf83);
    p(4,2,8,1,0xd2c6a0); p(2,14,12,1,0xa8a78b);
  });
  texture('seal-lit', p => {
    p(2,13,12,3,0x3c6258); p(4,4,8,10,0x99b8a0); p(3,3,10,3,0xc8d8b5);
    p(6,6,4,6,0x8aebce); p(5,8,6,2,0xb5ffe1); p(7,5,2,1,0xedf9b7);
    p(4,2,8,1,0xeee0b1);
  });
  texture('shade', p => {
    p(3,12,11,3,0x202638); p(4,3,8,10,0x5a5278); p(2,6,12,5,0x726487);
    p(4,2,3,3,0x8b749a); p(4,7,2,2,0xf4c19c); p(10,7,2,2,0xf4c19c);
    p(6,11,3,1,0x332c49); p(3,12,2,3,0x726487); p(11,12,2,3,0x726487);
  });
  texture('guide', p => {
    p(4,13,9,3,0x2a343d); p(3,8,11,6,0x9a7960); p(5,2,7,7,0xd4ba94);
    p(4,1,9,3,0xb4c7b0); p(4,4,2,4,0xc9d5c1); p(11,4,2,4,0xc9d5c1);
    p(6,6,5,4,0xf1e8ce); p(8,4,1,1,0x344a46); p(11,4,1,1,0x344a46);
    p(13,8,1,8,0xd7b87b); p(12,9,3,3,0xf1d585);
  });
}

export function paintWorld(scene, room, chapter) {
  const g = scene.add.graphics();
  const square = (x,y,w,h,color,alpha=1) => { g.fillStyle(color,alpha); g.fillRect(x,y,w,h); };
  for (let y=0;y<14;y++) for(let x=0;x<20;x++) {
    const px=x*40,py=y*40,key=`${x},${y}`,seed=(x*13+y*7)%11;
    square(px,py,40,40,room.ground);
    const path=(x>=2&&x<=17&&y>=6&&y<=8)||(x>=4&&x<=6&&y>=3&&y<=11)||(x>=9&&x<=11&&y>=3&&y<=11)||(x>=15&&x<=17&&y>=10&&y<=11);
    if(path) {square(px+1,py+1,38,38,room.floor);square(px+2,py+37,35,2,0x18272c,.13); if(seed<4)square(px+9,py+8,16,2,0xc7c3a0,.17);}
    else {square(px+seed*2+4,py+9,3,5,0x91ab70,.18);square(px+21,py+25+seed,5,2,0xc3bb7f,.12);}
    if(room.water.has(key)) {square(px,py,40,40,room.waterColor);square(px+5,py+11,19,2,0x8eb9bb,.25);square(px+19,py+29,15,2,0xb1d3c3,.16);}
    if(room.walls.has(key)) {
      if(x===7||y===9&&x>10) {square(px+1,py+4,38,35,room.wall);square(px+2,py+2,36,7,room.floor);square(px+5,py+13,12,3,0xb5b69a,.2);square(px+21,py+27,16,2,0x101a26,.3);}
      else scene.add.image(px+20,py+15,'tree').setDisplaySize(52,56).setTint(chapter===0?0xffffff:chapter===1?0xb2b9db:chapter===2?0xb9c5a7:chapter===3?0xe5bf94:0x9fc1ca);
    }
  }
  // Stone gate, warm torches, low ruins, flowers, and a reflected pool.
  square(706,241,68,96,0x263d3b);square(713,247,54,80,room.floor);square(720,254,40,73,0x182e30);
  square(716,241,48,12,0xa5a48b);square(704,253,10,82,0x7b887a);square(766,253,10,82,0x7b887a);
  for(const x of [690,786]) {square(x-3,280,6,17,0x514f45);square(x-4,268,8,13,0xe5ab62);square(x-2,270,4,8,0xffe7a3);}
  for(const [x,y] of [[2,3],[8,11],[17,3],[11,2]]) {square(x*40+7,y*40+23,10,3,0x8b9b70);square(x*40+12,y*40+16,3,9,0x768d62);square(x*40+10,y*40+14,7,5,chapter%2?0xc4a0b2:0xddbd84);}
  return g;
}
