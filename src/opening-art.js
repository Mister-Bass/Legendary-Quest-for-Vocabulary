// Original opening-stage scenery, drawn directly on a 32px pixel grid.
// Integer rectangles and a small shared palette keep the 16-bit look crisp.
export const OPENING_ART=['opening-tree','opening-water','opening-chest','opening-door','opening-door-open'];
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
const grain=(c,x,y,colors,count=12)=>{
  for(let i=0;i<count;i++)rect(c,colors[i%colors.length],(x*17+y*23+i*13+i*i)%30+1,(x*11+y*7+i*19)%30+1,i%3===0?2:1,1);
};
export function createOpeningArt(scene){
  const sheet=(key,count,draw)=>{
    const t=scene.textures.createCanvas(key,count*32,32),c=t.context;c.imageSmoothingEnabled=false;
    for(let f=0;f<count;f++){c.save();c.translate(f*32,0);draw(c,f);c.restore();t.add(f,0,f*32,0,32,32);}t.refresh();
  };
  sheet('opening-tree',4,(c,f)=>{
    const sway=[0,1,0,-1][f];
    rect(c,'#263d35',6,28,22,3);rect(c,'#463c2c',14,20,6,11);rect(c,'#95734a',15,21,2,9);rect(c,'#b4975c',15,22,1,5);
    c.save();c.translate(sway,0);
    for(const [x,y,w,h]of[[11,1,12,4],[6,5,21,5],[3,10,27,11],[6,21,22,5],[10,26,13,2]])rect(c,'#183d37',x,y,w,h);
    for(const [x,y,w,h]of[[10,4,13,5],[6,9,20,6],[5,15,23,6],[9,21,15,3]])rect(c,'#2c6150',x,y,w,h);
    for(const [x,y,w,h]of[[11,4,8,3],[7,9,11,4],[6,16,8,3],[18,11,6,3],[16,20,8,2]])rect(c,'#4b865a',x,y,w,h);
    for(const [x,y,w]of[[12,4,4],[8,10,5],[6,16,4],[19,11,3],[17,20,3]])rect(c,'#88a966',x,y,w,1);
    rect(c,'#213f37',13,15,6,2);rect(c,'#213f37',23,18,4,2);rect(c,'#aec477',10,9,2,1);c.restore();
  });
  sheet('opening-water',8,(c,f)=>{
    rect(c,'#254e68',0,0,32,32);
    for(let row=0;row<4;row++){
      const y=row*8,offset=(f+row*5)%16;
      rect(c,'#30647d',0,y+2,32,4);rect(c,'#407e91',offset,y+2,8,1);
      rect(c,'#73a9ac',(offset+4)%25,y+1,5,1);rect(c,'#1e425e',(offset+11)%26,y+6,6,1);
    }
    rect(c,'#a5c9b7',(f*3+7)%28,13,3,1);
  });
  for(const open of [false,true])sheet(open?'opening-door-open':'opening-door',1,c=>{
    rect(c,'#203e39',3,3,26,29);rect(c,'#747b66',3,4,26,27);
    rect(c,'#a9ae85',5,2,22,3);rect(c,'#d4cca0',7,1,18,2);
    rect(c,'#b8ba92',3,5,3,25);rect(c,'#596858',26,5,3,25);
    rect(c,'#e0d4a5',4,6,1,22);rect(c,'#2a443d',6,6,20,24);
    for(let row=9;row<29;row+=6){rect(c,'#576958',3,row,3,1);rect(c,'#899578',26,row,3,1);}
    if(open){
      rect(c,'#32666a',8,8,16,21);rect(c,'#60958b',11,10,10,19);rect(c,'#b7c794',14,13,4,16);
      rect(c,'#4b5041',6,6,3,24);rect(c,'#4b5041',23,6,3,24);
    }else{
      rect(c,'#6b5041',7,7,18,22);rect(c,'#987351',8,7,7,22);rect(c,'#815d43',17,7,7,22);
      for(const x of [10,13,18,21]){rect(c,'#624c3b',x,8,1,20);rect(c,'#b38a5b',x-1,9,1,8);}
      rect(c,'#3b4a40',7,11,18,2);rect(c,'#b19e6c',7,11,18,1);rect(c,'#b19e6c',7,24,18,2);
      // Slot centers match the existing three-key cutscene's 16px coordinates.
      for(const x of [8,16,22]){rect(c,'#d1ba7b',x-1,13,3,8);rect(c,'#253e39',x,14,1,6);}
    }
    rect(c,'#c5ba8b',3,30,26,2);rect(c,'#f1d9a1',5,30,22,1);
  });
  // Preserve the supplied chest silhouettes/opening frames, adding 1px metal
  // bevels and timber grain at the final resolution rather than enlarging them.
  const chest=scene.textures.get('chest').getSourceImage();
  sheet('opening-chest',4,(c,f)=>{
    c.drawImage(chest,f*32,0,32,32,0,0,32,32);
    const image=c.getImageData(f*32,0,32,32),d=image.data;
    for(let y=1;y<31;y++)for(let x=1;x<31;x++){
      const i=(y*32+x)*4;if(!d[i+3])continue;
      if(d[i]>80&&d[i]>d[i+2]*1.3&&(x+y*3)%11===0){d[i]=Math.min(255,d[i]+22);d[i+1]=Math.min(255,d[i+1]+16);}
    }
    c.putImageData(image,f*32,0);
  });
  scene.anims.create({key:'opening-tree-sway',frames:scene.anims.generateFrameNumbers('opening-tree',{start:0,end:3}),frameRate:3,repeat:-1});
  scene.anims.create({key:'opening-water-ripple',frames:scene.anims.generateFrameNumbers('opening-water',{start:0,end:7}),frameRate:6,repeat:-1});
  scene.anims.create({key:'opening-chest-open',frames:scene.anims.generateFrameNumbers('opening-chest',{start:0,end:3}),frameRate:8,repeat:0});
}
export function paintOpeningTile(c,map,x,y){
  const k=`${x},${y}`,water=map.water.has(k),path=map.paths.has(k);
  c.save();c.translate(x*32,y*32);
  rect(c,water?'#254e68':path?'#aa9060':'#4b7047',0,0,32,32);
  grain(c,x,y,water?['#30647d']:path?['#bda575','#967d51','#c7b582']:['#557e4b','#648b50','#416640'],path?18:14);
  if(path&&!water){
    for(const [dx,dy,rx,ry,w,h]of[[0,-1,0,0,32,2],[0,1,0,30,32,2],[-1,0,0,0,2,32],[1,0,30,0,2,32]])
      if(!map.paths.has(`${x+dx},${y+dy}`)){rect(c,'#6e744a',rx,ry,w,h);}
  }
  if(!water)for(const [dx,dy,rx,ry,w,h]of[[0,-1,0,0,32,3],[0,1,0,29,32,3],[-1,0,0,0,3,32],[1,0,29,0,3,32]])
    if(map.water.has(`${x+dx},${y+dy}`)){rect(c,'#cab785',rx,ry,w,h);rect(c,'#64785a',rx,ry,w===3?1:w,h===3?1:h);}
  if(map.cliffs.has(k)){
    rect(c,'#33463b',0,2,32,30);rect(c,'#6f7052',1,4,30,26);rect(c,'#98926b',2,5,28,15);
    rect(c,'#bac18a',0,0,32,3);rect(c,'#526947',0,3,32,2);rect(c,'#535943',3,23,26,2);
    for(const [rx,ry,w,h]of[[8,8,1,10],[21,12,1,11],[12,19,7,1]])rect(c,'#777755',rx,ry,w,h);
    grain(c,x,y,['#a6a67a','#7c805a'],10);
  }
  if(map.fields.has(k)&&!water&&!map.walls.has(k))for(let row=4;row<32;row+=8){
    rect(c,'#3b593b',2,row,28,3);for(let col=4;col<30;col+=6){rect(c,'#91a56a',col,row-2,2,3);rect(c,'#bfbc79',col,row-2,1,1);}
  }
  if(map.flowers.has(k)&&!water&&!path&&!map.walls.has(k))for(const [fx,fy]of[[7,9],[22,23]]){rect(c,'#2e573d',fx,fy,1,5);rect(c,'#d9c98b',fx-1,fy,3,2);rect(c,'#f2dfab',fx,fy,1,1);}
  if(map.bridge.has(k)){
    rect(c,'#3b463c',3,0,26,32);rect(c,'#ad9263',5,0,22,32);
    for(let row=0;row<32;row+=8){rect(c,'#d3b47e',5,row,22,1);rect(c,'#736344',5,row+7,22,1);rect(c,'#96794e',10+(row%3),row+3,7,1);}
    for(const col of [2,27]){rect(c,'#5d6048',col,0,3,32);rect(c,'#d2c294',col,0,1,32);}
  }
  c.restore();
}
