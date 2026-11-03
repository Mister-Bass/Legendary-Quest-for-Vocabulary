// Original 32x32 pixel art, styled after 16-bit adventure scenery.
export function paintLantern(c,lit=false,frame=0){
  const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  c.clearRect(0,0,32,32);c.imageSmoothingEnabled=false;
  // Chipped stone footing and a narrow carved pedestal.
  r('#172e2d',7,28,19,3);r('#3d5551',8,27,17,3);r('#79958a',10,27,13,1);
  r('#233b3a',12,21,9,7);r('#58756b',13,22,7,6);r('#91a296',13,23,2,4);
  r('#304e49',17,24,3,3);r('#b0b9a0',10,28,5,1);r('#1d3432',22,29,3,1);
  // Hanging ring, stepped roof, copper corners and dark iron outline.
  r('#192e2f',13,1,6,4);r('#a28c5c',14,1,4,1);r('#334841',14,2,1,3);r('#b7a16b',17,2,1,3);
  r('#172a2c',11,5,10,2);r('#172a2c',7,7,18,3);r('#172a2c',5,9,22,2);
  r(lit?'#d6b45f':'#8c8056',11,6,10,2);r(lit?'#f5d58a':'#b5a373',8,8,16,1);
  r(lit?'#a8793f':'#59614c',7,9,18,1);r('#283936',7,10,18,1);
  r('#182b2e',7,11,18,11);r('#182b2e',9,22,14,2);
  // Four glass facets: teal and reflective while dark, amber when kindled.
  r(lit?'#9e542c':'#243d40',9,11,14,10);
  r(lit?'#d78a38':'#345454',10,12,11,8);
  r(lit?'#f6bc54':'#48665f',11,12,4,7);r(lit?'#e3a247':'#2d4749',17,12,4,7);
  if(lit){
    const sway=[0,1,0,-1][frame%4];
    r('#f58137',13+sway,15,6,5);r('#ffd26b',14+sway,13,4,7);
    r('#fff0a5',15+sway,12+(frame%2),2,7);r('#fffbd2',15+sway,16,2,3);
    r('#ffd47e',10,13,1,5);r('#ffe7a1',20,14,1,4);
  }else{
    r('#a2bbb0',11,13,1,3);r('#718f83',12,12,2,1);r('#718f83',18,14,1,2);
    r('#172c2d',14,19,5,1);r('#594c3c',16,17,1,2);
  }
  // Metal mullions and dimensional lower rim frame the flame rather than hiding it.
  r('#34483e',8,11,2,10);r(lit?'#e5b75d':'#a08c5c',9,11,1,10);
  r('#5c5038',21,11,2,10);r(lit?'#f3cb76':'#b4a270',21,12,1,8);
  r(lit?'#a77e42':'#69704f',15,11,1,10);
  r('#192f2d',8,21,16,2);r(lit?'#d7a451':'#9a8857',9,21,14,1);
  r('#79816a',10,23,12,1);r('#243d37',12,24,9,1);
  for(const x of [8,22]){r(lit?'#ffe3a0':'#c5b782',x,10,1,1);r('#1b302e',x,22,1,1);}
}
export function createLanternArt(scene){
  for(let frame=-1;frame<4;frame++){
    const key=frame<0?'marsh-lantern':frame===0?'marsh-lantern-lit':`marsh-lantern-lit-${frame}`;
    if(scene.textures.exists(key))continue;
    const texture=scene.textures.createCanvas(key,32,32);paintLantern(texture.context,frame>=0,Math.max(0,frame));texture.refresh();
  }
}
export function lanternTexture(lit,clock,index=0){
  if(!lit)return 'marsh-lantern';
  const frame=Math.floor(clock*4+index)%4;return frame?`marsh-lantern-lit-${frame}`:'marsh-lantern-lit';
}
export function paintLanternGlow(g,seals,lit,clock){
  g.clear();
  seals.forEach((p,i)=>{if(!lit[i])return;const x=p.x*40+20,y=p.y*40-9,pulse=1+Math.sin(clock*4+i)*.07;
    g.fillStyle(0xffc365,.065).fillCircle(x,y,42*pulse);
    g.fillStyle(0xffce76,.09).fillCircle(x,y,27*pulse);
    g.fillStyle(0xffde8c,.1).fillCircle(x,y,15*pulse);
  });
}
