// Original 32x32 floating-flame sprites in a limited 16-bit-style palette.
export function paintWisp(c,frame=0){
  c.clearRect(0,0,32,32);c.imageSmoothingEnabled=false;
  const mask=new Uint8Array(1024),sway=[0,1,0,-1][frame%4];
  const row=(y,x,w)=>{for(let i=x;i<x+w;i++)if(i>=0&&i<32&&y>=0&&y<32)mask[y*32+i]=1;};
  // A curling crown and two smaller flame tongues merge into a tapered body.
  for(const [y,x,w]of[[2,17,2],[3,17,2],[4,16,3],[5,15,4],[6,15,4],[7,14,5],[8,13,6],[9,12,7]])row(y,x+sway,w);
  for(const [y,x,w]of[[10,11,9],[11,10,11],[12,9,13],[13,8,15],[14,8,16],[15,7,17],[16,7,18],[17,7,18],[18,8,17],[19,8,16],[20,9,15],[21,10,13],[22,10,12],[23,11,10],[24,12,8],[25,13,6],[26,14,4],[27,15,2]])row(y,x,w);
  for(const [y,x,w]of[[9,7,2],[10,7,3],[11,7,4],[12,8,4],[7,23,2],[8,22,3],[9,22,3],[10,22,3],[11,21,4],[12,21,4],[13,20,5]])row(y+(frame%2),x-sway,w);
  const r=(color,x,y,w,h=1)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(mask[y*32+x]){
    const edge=!mask[y*32+x-1]||!mask[y*32+x+1]||!mask[(y-1)*32+x]||!mask[(y+1)*32+x];
    r(edge?'#377789':x<12?'#65bdc5':x>20?'#4d9da9':'#96e2cf',x,y,1);
  }
  for(const [y,x,w]of[[10,15,2],[11,14,4],[12,13,6],[13,12,8],[14,11,10],[15,11,11],[16,10,12],[17,10,12],[18,11,11],[19,11,10],[20,12,9],[21,12,8],[22,13,6],[23,14,4],[24,15,2]])r('#c7f3d6',x,y,w);
  // The hot core leans with the crown; no face or solid lantern body.
  for(const [y,x,w]of[[12,17,1],[13,16,2],[14,15,4],[15,14,5],[16,13,6],[17,13,7],[18,13,7],[19,13,6],[20,14,5],[21,14,5],[22,15,3],[23,16,1]])r('#ffdb85',x+(y<16?sway:0),y,w);
  for(const [y,x,w]of[[15,16,2],[16,15,3],[17,15,3],[18,14,4],[19,15,3],[20,15,3],[21,16,1]])r('#fff8ca',x,y,w);
  r('#edfff0',16,16+(frame%2),1,3);r('#e2ffec',11,15,1,3);r('#8bdfd2',19+sway,5,1,2);
  r('#8de2d3',4,21-frame,1,2);r('#d1f7d9',26,23-(frame*2)%7,2,1);r('#b6edcf',12+sway,3+(frame%2),1,1);
}
export function createWispArt(scene){
  for(let frame=0;frame<4;frame++){
    const key=frame?`marsh-wisp-${frame}`:'marsh-wisp';if(scene.textures.exists(key))continue;
    const texture=scene.textures.createCanvas(key,32,32);paintWisp(texture.context,frame);texture.refresh();
  }
}
export function wispTexture(clock,index=0){const frame=Math.floor(clock*6+index)%4;return frame?`marsh-wisp-${frame}`:'marsh-wisp';}
export function paintWispAura(g,enemies,clock){
  g.clear();
  for(const e of enemies){if(e.type!=='wisp'||!e.active)continue;
    const y=e.y+Math.sin(clock*4+e.id)*5,pulse=1+Math.sin(clock*5+e.id)*.08;
    g.fillStyle(0x183c3b,.2).fillEllipse(e.x,e.y+29,27,7);
    g.fillStyle(0x92e9d5,.055).fillCircle(e.x,y,35*pulse);
    g.fillStyle(0xd8f7d1,.075).fillCircle(e.x,y+4,23*pulse);
  }
}
