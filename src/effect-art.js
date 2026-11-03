// Original 32x32 sprites for objects formerly drawn as smooth shapes.
const runs=new Map();
export const EFFECT_KEYS=['fish','mud-ball','slime-bolt','stone','bomb','flame','shield','bow','arrow'];
export function createEffectArt(scene){
  for(const key of EFFECT_KEYS){
    const t=scene.textures.createCanvas('effect-'+key,32,32),c=t.context;
    const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    if(key==='bow'){
      r('#342e29',8,3,4,26);r('#86613e',12,5,4,22);r('#c49c61',16,9,3,14);r('#86613e',19,12,3,8);
      r('#e5dcb1',9,4,1,24);r('#f2ce87',12,5,2,3);r('#f2ce87',12,24,2,3);
    }else if(key==='arrow'){
      r('#654c33',3,15,23,3);r('#d5b880',3,15,21,1);r('#a9c8c2',23,12,3,9);r('#e2ece0',26,14,3,5);
      r('#64838d',3,12,4,3);r('#64838d',3,18,4,3);
    }else if(key==='fish'){
      r('#234753',6,12,21,9);r('#234753',10,10,13,13);r('#234753',2,9,5,15);
      r('#d68d58',7,13,19,7);r('#eaa86b',11,11,11,10);r('#a66542',3,11,3,11);
      r('#ffddb0',10,18,13,2);r('#f6bd81',12,12,7,2);r('#234753',23,13,2,2);r('#fff0ca',23,12,1,1);
    }else if(key==='flame'){
      r('#b55a39',11,10,11,17);r('#e59145',9,17,15,8);r('#f6bb61',12,9,8,15);
      r('#f6bb61',16,4,4,9);r('#ffe3a0',13,18,7,8);r('#fff0bf',15,19,3,5);r('#d67539',22,13,2,7);
    }else if(key==='shield'){
      r('#304a59',5,4,22,16);r('#304a59',8,20,16,6);r('#304a59',13,26,6,3);
      r('#9bbfc5',7,6,18,13);r('#9bbfc5',10,19,12,6);r('#9bbfc5',14,25,4,2);
      r('#e0e4c9',8,6,2,12);r('#537f93',12,8,10,12);r('#d7c483',15,8,2,15);r('#d7c483',11,13,10,2);
    }else{
      const mud=key==='mud-ball',slime=key==='slime-bolt',bomb=key==='bomb';
      r(mud?'#493d2f':slime?'#24584c':'#293c49',7,9,18,15);r(mud?'#493d2f':slime?'#24584c':'#293c49',10,6,12,21);
      r(mud?'#9a7050':slime?'#67c9a1':bomb?'#424c60':'#8d9c9d',9,9,14,14);
      r(mud?'#bb9566':slime?'#c3f8be':bomb?'#8295a4':'#d0d3b6',11,10,7,3);
      r(mud?'#6c5037':slime?'#469b82':'#526776',17,19,5,3);
      if(bomb){r('#b7ad77',14,4,4,4);r('#efb36c',18,2,3,3);r('#ffe4a0',21,1,2,2);}
    }
    t.refresh();const data=c.getImageData(0,0,32,32).data,rows=[];
    for(let y=0;y<32;y++)for(let x=0;x<32;){
      const i=(y*32+x)*4;if(!data[i+3]){x++;continue;}
      const color=(data[i]<<16)|(data[i+1]<<8)|data[i+2],start=x; x++;
      while(x<32){const j=(y*32+x)*4;if(!data[j+3]||color!==((data[j]<<16)|(data[j+1]<<8)|data[j+2]))break;x++;}
      rows.push([color,start,y,x-start]);
    }
    runs.set(key,rows);
  }
}
export function paintEffect(g,key,x,y,size=32){
  const scale=size/32,left=Math.round(x-size/2),top=Math.round(y-size/2);
  for(const [color,px,py,width]of runs.get(key)||[])g.fillStyle(color).fillRect(left+px*scale,top+py*scale,width*scale,scale);
}

export function paintItemShot(g,p,size=24){
  if(p.kind==='bow'){g.save();g.translateCanvas(p.x,p.y);g.rotateCanvas(Math.atan2(p.vy,p.vx));paintEffect(g,'arrow',0,0,size);g.restore();}
  else paintEffect(g,p.bomb?'bomb':'stone',p.x,p.y,size);
}
