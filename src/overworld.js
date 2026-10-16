// Original geography. Stable IDs are the owner's plain-English editing handles.
export const OVERWORLD = { columns:72, rows:54, tileSize:40, areaWidth:24, areaHeight:18 };
export const areas = [
  {id:'A01',name:'Whisperwood',biome:'forest',color:'#385e40',description:'A dense northern woodland with winding clearings and swaying trees.',landmark:'The Listening Grove'},
  {id:'A02',name:'Mirror Lake',biome:'lake',color:'#47756a',description:'Blue water surrounds the Hall of Mirrors. A stone causeway carries the north road over the lake.',landmark:'Hall of Mirrors',chapter:1},
  {id:'A03',name:'Crown Heights',biome:'highlands',color:'#847c65',description:'Tiered stone ridges frame a quiet northeastern lookout.',landmark:'The Crown Lookout'},
  {id:'A04',name:'Citizens’ Commons',biome:'meadow',color:'#688951',description:'Open lawns and stone courtyards around the Citizens’ Court.',landmark:'Citizens’ Court',chapter:2},
  {id:'A05',name:'Lantern Crossroads',biome:'crossroads',color:'#788b51',description:'The central meeting place where every major road connects.',landmark:'The Lantern Monument'},
  {id:'A06',name:'Ember Quarry',biome:'quarry',color:'#8a7758',description:'Weathered stone terraces surround the Forge of Ideas.',landmark:'Forge of Ideas',chapter:3},
  {id:'A07',name:'Footprint Fields',biome:'garden',color:'#638248',description:'The southern starting fields, with a protected garden and the first vocabulary chamber.',landmark:'Footprint Garden',chapter:0},
  {id:'A08',name:'Willow Marsh',biome:'marsh',color:'#426f59',description:'A winding river runs through low wetlands. Cross north–south over the old stone bridge.',landmark:'The Willow Crossing'},
  {id:'A09',name:'Trust Sanctuary',biome:'sanctuary',color:'#66867c',description:'A walled eastern sanctuary and the final archive entrance.',landmark:'Sanctum of Trust',chapter:4},
].map((area,index)=>({...area,column:index%3,row:Math.floor(index/3),x:(index%3)*24+12,y:Math.floor(index/3)*18+9}));

export const areaAt=(x,y)=>areas[Math.min(2,Math.max(0,Math.floor(y/18)))*3+Math.min(2,Math.max(0,Math.floor(x/24)))];
export const entranceFor=chapter=>areas.find(a=>a.chapter===chapter);
export const roadAt=(x,y)=>[12,36,60].some(n=>Math.abs(x-n)<=1)||[9,27,45].some(n=>Math.abs(y-n)<=1)||(x>3&&x<22&&y<18&&Math.abs(y-(6+Math.sin(x/4)*3))<1);

export function makeOverworld(){
  const water=new Set(),walls=new Set(),bridge=new Set(),trees=[];
  for(let y=0;y<54;y++)for(let x=0;x<72;x++){
    const key=`${x},${y}`,area=areaAt(x,y),lx=x%24,ly=y%18;
    if(!x||!y||x===71||y===53)walls.add(key);
    // Lakes and the southern river retain a continuous three-tile-wide road deck.
    if((area.id==='A02'&&((lx-12)/9)**2+((ly-9)/7)**2<1)||(area.id==='A08'&&ly>=5&&ly<=8)){
      water.add(key);if(roadAt(x,y))bridge.add(key);
    }
    if((area.id==='A03'||area.id==='A06')&&!roadAt(x,y)&&((ly===4||ly===13)&&lx>3&&lx<21))walls.add(key);
    if(area.id==='A09'&&!roadAt(x,y)&&((lx===4||lx===20)&&ly>3&&ly<15))walls.add(key);
    // Deterministic decoration: editing another area cannot move this area's trees.
    const forest=area.id==='A01',spacing=forest?3:6;
    if(x>1&&y>2&&x<70&&y<52&&lx%spacing===2&&ly%spacing===2&&!roadAt(x,y)&&!water.has(key)&&!walls.has(key)&&Math.hypot(lx-12,ly-9)>4){
      trees.push({x,y,variant:1+(x+y)%4});
    }
  }
  return {water,walls,bridge,trees};
}
export function overworldWalkable(map,x,y){
  const key=`${x},${y}`;
  return x>0&&y>0&&x<71&&y<53&&!map.walls.has(key)&&(!map.water.has(key)||map.bridge.has(key))&&!map.trees.some(t=>t.x===x&&t.y===y);
}

// Both the atlas and the exploration minimap use the same geography as the world.
export function drawAtlas(canvas,map,{explored=null,position=null,selected=null,art=null}={}){
  const c=canvas.getContext('2d'),sx=canvas.width/72,sy=canvas.height/54;
  c.fillStyle='#07110f';c.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<54;y++)for(let x=0;x<72;x++){
    const key=`${x},${y}`;if(explored&&!explored.has(key))continue;
    c.fillStyle=map.bridge.has(key)?'#d4b486':map.water.has(key)?'#517ca3':map.walls.has(key)?'#aaa18a':roadAt(x,y)?'#c4ad77':areaAt(x,y).color;
    c.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
    if(art){
      const wet=map.water.has(key)&&!map.bridge.has(key),road=roadAt(x,y)||map.bridge.has(key);
      const source=wet?art.water:road?art.terrain:art.grass;
      c.drawImage(source,road?32:0,road?16:0,16,16,x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
      if(!wet&&!road){c.globalAlpha=.25;c.fillStyle=areaAt(x,y).color;c.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));c.globalAlpha=1;}
      if(map.walls.has(key)){c.fillStyle='#b0a48b';c.fillRect(x*sx,y*sy,sx,sy*.7);}
    }
  }
  for(const t of map.trees){
    if(explored&&!explored.has(`${t.x},${t.y}`))continue;
    if(art)c.drawImage(art[`tree${t.variant}`],0,0,192,t.variant<=2?256:192,(t.x-1)*sx,(t.y-2)*sy,3*sx,(t.variant<=2?4:3)*sy);
    else{c.fillStyle='#254c39';c.fillRect((t.x-.6)*sx,(t.y-1)*sy,sx*2,sy*2);}
  }
  if(!explored)for(const a of areas){
    c.strokeStyle=a.id===selected?'#fff2ad':'#e8d9a466';c.lineWidth=a.id===selected?4:1;c.strokeRect(a.column*24*sx+2,a.row*18*sy+2,24*sx-4,18*sy-4);
    c.fillStyle='#172d28';c.fillRect((a.x-4)*sx,(a.y-2)*sy,8*sx,4*sy);
    c.fillStyle='#f0d69a';c.font=`bold ${Math.max(12,sx*1.6)}px Georgia`;c.textAlign='center';c.fillText(a.id,a.x*sx,(a.y+.6)*sy);
  }
  if(position){c.fillStyle='#fff4b5';c.beginPath();c.arc(position.x/40*sx,position.y/40*sy,Math.max(3,sx*.7),0,Math.PI*2);c.fill();}
}
