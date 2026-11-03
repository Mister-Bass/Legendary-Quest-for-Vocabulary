import { MARSH_SCENERY } from './marsh-scenery.js';
// Original playable geography assembled from the owner's Lantern Marsh reference.
export const MARSH_SIZE=32;
export const cell=(x,y)=>`${x},${y}`;
export const PAD_SECONDS=2, FLAME_SECONDS=10;
export function makeMarshRoom(total=5){
  const room={marsh:true,columns:32,rows:32,areaId:'A02',name:'Lantern Marsh',number:2,total,
    spawn:{x:15,y:29},arenaSpawn:{x:15,y:16},barrier:{x:14,y:29,width:4},exit:{x:15,y:2},guide:{x:12,y:28},
    seals:[{x:6,y:4},{x:25,y:4},{x:15,y:14}],heart:{x:17,y:16},boss:{x:15,y:11},
    scenery:MARSH_SCENERY.map(p=>({...p})),walls:new Set(),water:new Set(),bridge:new Set(),mud:new Set(),stone:new Set(),trees:[],rocks:[],pillars:[{x:13,y:2},{x:17,y:2}],bushes:[],pads:[],shades:[],ground:0x4c8140,accent:0xd5ac5d};
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const k=cell(x,y),edge=x<2||x>29||y<2||y>29;
    if(edge&&!(x>=14&&x<=17&&y>=29)){room.walls.add(k);room.trees.push({x,y,variant:3});}
    if(((x-15.5)/10)**2+((y-16)/9)**2<1)room.water.add(k);
    if(x>=14&&x<=17&&y>=13&&y<=17)room.water.delete(k);
    if((x>=3&&x<=6||x>=25&&x<=28)&&(y>=8&&y<=11||y>=25&&y<=27))room.mud.add(k);
    if((y>=2&&y<=4&&x>=3&&x<=28)||(y>=26&&x>=14&&x<=17))room.stone.add(k);
  }
  for(const [x,y]of[[3,13],[28,13],[5,24],[28,24],[13,2],[17,2],[7,7],[24,7]]){room.rocks.push({x,y});room.walls.add(cell(x,y));}
  for(const [x,y]of[[3,6],[28,6],[3,17],[28,17],[3,20],[28,20]]){room.bushes.push({x,y});room.walls.add(cell(x,y));}
  for(const [px,py]of[[16,24],[16,23],[15,23],[14,23],[13,23],[13,22],[13,21],[14,21],[14,20],[15,20],[16,20],[16,19],[16,18]])for(const ox of [0,1])for(const oy of [0,1]){
    const x=px+ox,y=py+oy;if(room.water.has(cell(x,y))&&!room.bridge.has(cell(x,y))){room.pads.push({x,y});room.bridge.add(cell(x,y));}
  }
  room.shades=[{type:'wisp',x:5,y:10},{type:'wisp',x:26,y:10},{type:'octorok',x:11,y:11},{type:'octorok',x:9,y:21},{type:'octorok',x:23,y:21},{type:'slurg',x:5,y:26},{type:'slurg',x:26,y:26}];
  return room;
}
export const marshWalkable=(room,x,y)=>x>=0&&x<32&&y>=0&&y<32&&!room.walls.has(cell(x,y))&&(!room.water.has(cell(x,y))||room.bridge.has(cell(x,y)));
export function marshProgress(){return {lit:[false,false,false],primed:[false,false,false],heartTaken:false,bossAwakened:false,bossDefeated:false};}
export const at=p=>({x:p.x*40+20,y:p.y*40+20});
