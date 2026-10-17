// Shade's Puny World: native 16×16 cells, CC0. Coordinates refer to the unmodified sheet.
export const TILE_PIXELS=16;
export const regionStyles={
  A01:{terrain:'forest',ground:'#456a38',wash:'#244d32',wall:[3,5],floor:[0,0],tree:0x70a89a,detail:'TOP-DOWN Adventure Pack woodland: grass, winding dirt paths, earthen ledges, flowers, and broadleaf trees'},
  A02:{terrain:'stone',ground:'#a1ae96',wash:'#92bfd1',wall:[19,27],floor:[20,28],tree:0xb5d5d5,detail:'Lake-blue banks and pale stone terraces around the Hall of Mirrors'},
  A03:{terrain:'highland',ground:'#aa975e',wash:'#b49662',wall:[3,5],floor:[14,1],tree:0xd6ba8a,detail:'Golden highland paths, rock ledges, and sparse evergreens'},
  A04:{terrain:'grass',ground:'#7c9e50',wash:'#759447',wall:[22,27],floor:[20,28],tree:0xb4cc9b,detail:'Village greens, timber boundaries, and paved civic courtyards'},
  A05:{terrain:'stone',ground:'#a3ac8b',wash:'#d0d2ad',wall:[19,27],floor:[20,28],tree:0xc2d2a6,detail:'Pale citadel masonry, formal gardens, and a surrounding moat'},
  A06:{terrain:'highland',ground:'#a58a55',wash:'#a97c48',wall:[3,5],floor:[14,1],tree:0xc5a379,detail:'Ochre quarry terraces, exposed rock, and warm forge paving'},
  A07:{terrain:'sand',ground:'#b7a263',wash:'#bba264',wall:[3,5],floor:[14,1],tree:0xd2c494,detail:'Dry southern fields, planted rows, and sandy garden paths'},
  A08:{terrain:'marsh',ground:'#64875d',wash:'#528878',wall:[3,5],floor:[0,0],tree:0x8fb9ac,detail:'Mossy banks, reed patches, and the north–south marsh crossing'},
  A09:{terrain:'stone',ground:'#92a79d',wash:'#83bec2',wall:[19,27],floor:[20,28],tree:0x9fcac1,detail:'Lake-island gardens, cool archive stone, and sanctuary terraces'},
};
export const chapterAreaIds=['A07','A02','A04','A06','A09'];
export function stamp(c,image,col,row,x=0,y=0,w=16,h=16){
  if(image)c.drawImage(image,col*16,row*16,16,16,x,y,w,h);
}
// Transparent color glazes retain the source tile's pixel detail.
export function groundTile(c,art,kind,x,y){
  if(!art?.puny)return;
  stamp(c,art.puny,kind==='sand'||kind==='highland'?14:0,kind==='sand'||kind==='highland'?1:0);
  if(kind==='stone'){
    // Low paving viewed from above; upright masonry tiles belong on walls only.
    c.globalAlpha=.88;c.fillStyle='#a6b5a2';c.fillRect(0,0,16,16);c.globalAlpha=1;
    c.fillStyle='#788f83';c.fillRect(0,7,16,1);c.fillRect(7,0,1,7);c.fillRect(3,8,1,8);
    c.fillStyle='#c5cdb6';c.fillRect(0,8,16,1);c.fillRect(8,0,1,7);c.fillRect(4,9,1,7);
  }
  if(kind==='forest'||kind==='marsh'||kind==='highland'){
    c.globalAlpha=.28;c.fillStyle=kind==='forest'?'#174f32':kind==='marsh'?'#39766a':'#b17f47';c.fillRect(0,0,16,16);c.globalAlpha=1;
  }
  if(['grass','forest','marsh'].includes(kind)&&(x*7+y*11)%5===0){c.globalAlpha=.7;stamp(c,art.puny,1+(x+y)%2,0);c.globalAlpha=1;}
}
export function makeChamberLandscape(room){
  const style=regionStyles[room.areaId],map={terrain:new Map(),paths:new Set(),water:room.water,walls:room.walls,bridge:room.bridge,cliffs:new Set(),fortress:new Set(),fields:new Set(),gardens:new Set(),flowers:new Set(),buildings:new Map()};
  for(let y=0;y<28;y++)for(let x=0;x<40;x++){
    const k=`${x},${y}`;
    map.terrain.set(k,style.terrain);
    const path=(y>=12&&y<=14&&x>=3&&x<=37)||(x>=9&&x<=11&&y>=5&&y<=23)||(y>=21&&y<=23&&x>=3&&x<=35)||(x>=33&&x<=35&&y>=13&&y<=24);
    if(path)map.paths.add(k);
    if(room.walls.has(k))(style.terrain==='stone'||room.areaId==='A04'?map.fortress:map.cliffs).add(k);
    if(room.areaId==='A07'&&x>=2&&x<=6&&y>=9&&y<=12)map.fields.add(k);
    if((room.areaId==='A02'||room.areaId==='A09')&&x>=18&&x<=21&&y>=4&&y<=7)map.gardens.add(k);
    if(room.areaId==='A04'&&x>=26&&x<=30&&y>=21&&y<=24)map.gardens.add(k);
    if((x*11+y*7)%41===0)map.flowers.add(k);
  }
  return map;
}
