import { paintOverworldTile, paintAtlasDetails } from './overworld-art.js';
import { regionStyles } from './region-art.js';
// Original geography. Stable IDs are the owner's plain-English editing handles.
export const OVERWORLD = { columns:72, rows:54, tileSize:40, areaWidth:24, areaHeight:18 };
export const areas = [
  {id:'A01',name:'Whisperwood',biome:'forest',color:'#385e40',description:'A dense northern woodland with winding clearings and swaying trees.',landmark:'The Listening Grove'},
  {id:'A02',name:'Mirror Lake',biome:'lake',color:'#47756a',description:'A mountain-fed lake surrounds the Hall of Mirrors. Follow the northern causeway to its island.',landmark:'Hall of Mirrors',chapter:1},
  {id:'A03',name:'Crown Heights',biome:'highlands',color:'#847c65',description:'Tiered stone ridges frame a quiet northeastern lookout.',landmark:'The Crown Lookout'},
  {id:'A04',name:'Citizens’ Commons',biome:'meadow',color:'#688951',description:'Open lawns and stone courtyards around the Citizens’ Court.',landmark:'Citizens’ Court',chapter:2},
  {id:'A05',name:'Lantern Crossroads',biome:'crossroads',color:'#788b51',description:'A white-walled citadel, formal gardens, and a blue moat anchor the heart of the world.',landmark:'The Lantern Citadel'},
  {id:'A06',name:'Ember Quarry',biome:'quarry',color:'#8a7758',description:'Weathered stone terraces surround the Forge of Ideas.',landmark:'Forge of Ideas',chapter:3},
  {id:'A07',name:'Footprint Fields',biome:'garden',color:'#638248',description:'The southern starting fields, with a protected garden and the first vocabulary chamber.',landmark:'Footprint Garden',chapter:0},
  {id:'A08',name:'Willow Marsh',biome:'marsh',color:'#426f59',description:'A winding river runs through low wetlands. Cross north–south over the old stone bridge.',landmark:'The Willow Crossing'},
  {id:'A09',name:'Trust Sanctuary',biome:'sanctuary',color:'#66867c',description:'A sanctuary island rises from a broad southeastern lake. A causeway leads to the final archive entrance.',landmark:'Sanctum of Trust',chapter:4},
].map((area,index)=>({...area,style:regionStyles[area.id],column:index%3,row:Math.floor(index/3),x:(index%3)*24+12,y:Math.floor(index/3)*18+9}));


export const areaAt=(x,y)=>areas[Math.min(2,Math.max(0,Math.floor(y/18)))*3+Math.min(2,Math.max(0,Math.floor(x/24)))];
export const entranceFor=chapter=>areas.find(a=>a.chapter===chapter);
const key=(x,y)=>`${x},${y}`;
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
const segmentDistance=(x,y,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
};
const follows=(x,y,points,radius)=>points.slice(1).some((p,i)=>segmentDistance(x,y,points[i],p)<=radius);
// Roads connect landmarks, but their silhouettes no longer outline the editing grid.
const trails=[
  [[36,6],[36,48]],
  [[5,45],[63,45]],
  [[12,45],[12,48],[29,48],[32,46],[36,45]],
  [[12,9],[9,14],[10,19],[12,23],[12,27],[17,33],[14,39],[12,45]],
  [[4,27],[12,27],[19,26],[23,29],[29,29],[36,27],[43,27],[49,25],[54,28],[60,27]],
  [[12,9],[18,12],[24,14],[29,12],[36,9],[44,12],[49,8],[54,7],[60,9]],
  [[60,9],[56,14],[58,18],[61,22],[60,27],[65,32],[62,38],[60,45]],
];
const roads=new Set(),paths=new Set();
for(let y=1;y<53;y++)for(let x=1;x<71;x++)if(trails.some(p=>follows(x,y,p,1.25)))roads.add(key(x,y));
for(let y=1;y<53;y++)for(let x=1;x<71;x++)if(trails.some(p=>follows(x,y,p,.55)))paths.add(key(x,y));
export const roadAt=(x,y)=>roads.has(key(x,y));
const river=[[66,5],[66,12],[62,16],[55,19],[52,25],[54,31],[50,36],[48,40],[52,44],[58,48]];
const branch=[[49,39],[44,42],[38,43],[29,43],[26,42]];

export function makeOverworld(){
  const map={roads,paths,gardens:new Set(),water:new Set(),walls:new Set(),bridge:new Set(),trees:[],terrain:new Map(),cliffs:new Set(),fortress:new Set(),fields:new Set(),flowers:new Set(),buildings:new Map()};
  map.tilesets={A01:'topdown'};
  const height=(x,y)=>{
    if(x>=25&&y<16+Math.floor(Math.sin(x*.35)*2))return 1+(y<10+Math.floor(Math.sin(x*.28)*2)?1:0)+(y<4?1:0);
    if(x>53&&y>19&&y<36)return x>65?2:1;
    if(x<23&&y>38)return ellipse(x,y,7,50,17,12)?1:0;
    return 0;
  };
  for(let y=0;y<54;y++)for(let x=0;x<72;x++){
    const k=key(x,y),h=height(x,y),forest=ellipse(x,y,9,7,17,14)||ellipse(x,y,23,36,11,6)||ellipse(x,y,4,34,7,5);
    let terrain=h?'highland':forest?'forest':'grass';
    if(x<23&&y>38)terrain='sand';
    if(x>25&&x<48&&y>37)terrain='marsh';
    if(x>29&&x<43&&y>21&&y<33)terrain='stone';
    map.terrain.set(k,terrain);
    const moat=x>=26&&x<=46&&y>=18&&y<=36&&!(x>=29&&x<=43&&y>=21&&y<=33);
    const lake=ellipse(x,y,60,45,10+Math.sin(y*.7),7)&&!ellipse(x,y,60,45,2.6,2.6)&&!ellipse(x,y,65,49,1.4,1.4);
    const northLake=ellipse(x,y,36,10,6,4.5)&&!ellipse(x,y,36,9,2.2,2.2);
    const marsh=(x>=26&&x<=44&&y>=41&&y<=44)||(x>=28&&x<=33&&y===40)||ellipse(x,y,34,50,3,1.8);
    if(moat||lake||northLake||marsh||ellipse(x,y,20,17,2,1.5)||follows(x,y,river,1.35)||follows(x,y,branch,1.2))map.water.add(k);
    // Edge faces are solid; road cuts act as stairs through elevation changes.
    if(!x||!y||x===71||y===53||(h>height(x,y+1)&&!roadAt(x,y)))map.cliffs.add(k);
    if(map.cliffs.has(k)&&!map.water.has(k))map.walls.add(k);
    if(!roadAt(x,y)&&((x===29||x===43)&&y>=21&&y<=33||(y===21||y===33)&&x>=29&&x<=43))map.fortress.add(k);
    if(((x>=3&&x<=7&&y>=40&&y<=43)||(x>=19&&x<=22&&y>=22&&y<=24))&&!roadAt(x,y))map.fields.add(k);
    if(((x>=31&&x<=33)||(x>=39&&x<=41))&&((y>=24&&y<=26)||(y>=29&&y<=31)))map.gardens.add(k);
    if((x*13+y*23)%29===0&&!roadAt(x,y))map.flowers.add(k);
  }
  // Four crenellated corner towers frame the central citadel courtyard.
  for(const [cx,cy]of[[29,21],[43,21],[29,33],[43,33]])for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const k=key(cx+ox,cy+oy);if(!roads.has(k))map.fortress.add(k);
  }
  for(const k of map.fortress){map.water.delete(k);map.walls.add(k);map.cliffs.delete(k);}
  const houses=[
    {x:32,y:23,w:3,h:3,roof:'#acb7a4',highlight:'#e2dec0'},
    {x:38,y:23,w:3,h:3,roof:'#acb7a4',highlight:'#e2dec0'},
    {x:4,y:21,w:5,h:3,roof:'#95624b',highlight:'#bc8664'},
    {x:15,y:21,w:5,h:3,roof:'#647e75',highlight:'#90a28b'},
    {x:4,y:30,w:5,h:3,roof:'#796049',highlight:'#a18158'},
    {x:16,y:30,w:4,h:3,roof:'#a16d4c',highlight:'#c89a65'},
    {x:54,y:23,w:4,h:3,roof:'#78644e',highlight:'#ac9467'},
  ];
  for(const b of houses)for(let ly=0;ly<b.h;ly++)for(let lx=0;lx<b.w;lx++){
    const x=b.x+lx,y=b.y+ly,k=key(x,y);if(roads.has(k))continue;
    map.buildings.set(k,{...b,lx,ly});map.walls.add(k);map.water.delete(k);map.cliffs.delete(k);
  }
  // Every administrative landmark remains at its existing location and accessible.
  for(const a of areas)for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const k=key(a.x+ox,a.y+oy);map.walls.delete(k);map.cliffs.delete(k);map.fortress.delete(k);map.water.delete(k);map.buildings.delete(k);
  }
  for(const k of map.water){map.cliffs.delete(k);if(roads.has(k)){map.bridge.add(k);map.walls.delete(k);}}
  for(let y=3;y<52;y++)for(let x=2;x<70;x++){
    const k=key(x,y),forest=map.terrain.get(k)==='forest';
    const patch=forest?x%2===0&&y%2===0&&(x*11+y*7)%13>2:(x*17+y*31)%47===0;
    const clearRoad=[-1,0,1].some(dx=>[-1,0,1].some(dy=>roads.has(key(x+dx,y+dy))));
    const clearBuilding=[-1,0,1].some(dx=>[-1,0,1].some(dy=>map.buildings.has(key(x+dx,y+dy))||map.fortress.has(key(x+dx,y+dy))));
    if(patch&&!clearRoad&&!clearBuilding&&!map.water.has(k)&&!map.walls.has(k)&&!map.fields.has(k)&&!areas.some(a=>Math.hypot(x-a.x,y-a.y)<4)){
      map.trees.push({x,y,forest,variant:forest?3:1+(x+y)%4});
    }
  }
  return map;
}
export function overworldWalkable(map,x,y){
  const k=key(x,y);
  return x>0&&y>0&&x<71&&y<53&&!map.walls.has(k)&&(!map.water.has(k)||map.bridge.has(k))&&!map.trees.some(t=>t.x===x&&t.y===y);
}

// One painter keeps the atlas, navigation map, and playable terrain in agreement.
export function drawAtlas(canvas,map,{explored=null,position=null,selected=null,art=null}={}){
  const c=canvas.getContext('2d'),sx=canvas.width/72,sy=canvas.height/54;
  c.imageSmoothingEnabled=false;c.fillStyle='#07110f';c.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<54;y++)for(let x=0;x<72;x++){
    if(explored&&!explored.has(key(x,y)))continue;
    c.save();c.scale(sx,sy);paintOverworldTile(c,map,x,y,1,art);c.restore();
  }
  if(!explored)paintAtlasDetails(c,map,sx,sy,art);
  else for(const t of map.trees)if(explored.has(key(t.x,t.y))){c.fillStyle='#264f32';c.fillRect(t.x*sx,t.y*sy,sx,sy);}
  if(!explored)for(const a of areas){
    if(a.id===selected){
      c.strokeStyle='#f5e4ab99';c.lineWidth=2;
      for(const [x,y,dx,dy]of[[a.column*24,a.row*18,1,1],[(a.column+1)*24,a.row*18,-1,1],[a.column*24,(a.row+1)*18,1,-1],[(a.column+1)*24,(a.row+1)*18,-1,-1]]){
        c.beginPath();c.moveTo((x+dx*3)*sx,(y+dy*.4)*sy);c.lineTo((x+dx*.4)*sx,(y+dy*.4)*sy);c.lineTo((x+dx*.4)*sx,(y+dy*3)*sy);c.stroke();
      }
    }
    const x=a.x*sx,y=(a.y+3.8)*sy;
    c.fillStyle='#203e2ee8';c.fillRect(x-2.3*sx,y-sy,4.6*sx,1.9*sy);
    c.strokeStyle='#cebc7c';c.lineWidth=1;c.strokeRect(x-2.3*sx,y-sy,4.6*sx,1.9*sy);
    c.fillStyle='#fff0bd';c.font=`bold ${Math.max(9,sx*1.15)}px Georgia`;c.textAlign='center';c.fillText(a.id,x,y+.4*sy);
  }
  if(position){c.fillStyle='#fff4b5';c.beginPath();c.arc(position.x/40*sx,position.y/40*sy,Math.max(3,sx*.7),0,Math.PI*2);c.fill();}
}
