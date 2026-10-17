import { stamp } from './region-art.js';

// The owner-selected sheet applies only to A01's stable 24×18 editing bounds.
// Chamber landscapes do not opt into this map-specific override.
export const usesA01Tiles=(map,x,y)=>map.tilesets?.A01==='topdown'&&x>=0&&x<24&&y>=0&&y<18;
export const A01_TREE={x:48,y:144,width:32,height:48};
export function paintA01Tile(c,map,x,y,size,art){
  const k=`${x},${y}`,paths=map.roads||map.paths;
  c.save();c.translate(x*size,y*size);c.scale(size/16,size/16);c.imageSmoothingEnabled=false;
  stamp(c,art.topdown,6,1);
  if(paths.has(k)){
    const col=!paths.has(`${x-1},${y}`)?8:!paths.has(`${x+1},${y}`)?10:9;
    const row=!paths.has(`${x},${y-1}`)?0:!paths.has(`${x},${y+1}`)?2:1;
    stamp(c,art.topdown,col,row);
  }else if((x*7+y*11)%11===0)stamp(c,art.topdown,2,3);
  if(map.cliffs.has(k))stamp(c,art.topdown,!x?0:1,!y?0:!x?1:2);
  if(map.water.has(k)){
    c.fillStyle='#315b94';c.fillRect(0,0,16,16);c.drawImage(art.water,0,0,16,16,0,0,16,16);
  }else if(!paths.has(k)&&!map.walls.has(k)&&map.flowers.has(k))stamp(c,art.topdown,0,4);
  if(map.bridge.has(k))stamp(c,art.topdown,7,12);
  c.restore();
}
