// Supplied 32x32 props; original files and provenance: assets/marsh-plants/.
export const MARSH_PLANTS=['WillowTree','OakTree','DeadTree','DenseBush','FernBush','RoundBush','MossyStump','TreeStump'];
// Roots occupy existing solid cells. No bank, entrance, or puzzle route is narrowed.
export const MARSH_SCENERY=[
  {x:3,y:6,asset:'WillowTree'},{x:28,y:6,asset:'OakTree'},
  {x:3,y:17,asset:'DeadTree'},{x:28,y:17,asset:'WillowTree'},
  {x:3,y:20,asset:'DenseBush'},{x:28,y:20,asset:'FernBush'},
  {x:3,y:13,asset:'MossyStump'},{x:28,y:13,asset:'TreeStump'},
  {x:5,y:24,asset:'RoundBush'},{x:28,y:24,asset:'MossyStump'},
  {x:1,y:10,asset:'WillowTree'},{x:30,y:14,asset:'OakTree'},
  {x:1,y:22,asset:'DeadTree'},{x:30,y:24,asset:'WillowTree'}
].sort((a,b)=>a.y-b.y||a.x-b.x);
export function marshPlantImages(scene){return Object.fromEntries(MARSH_PLANTS.map(name=>[name,scene.textures.get('marsh-plant-'+name).getSourceImage()]));}
// Each full-size prop spans neighboring 16px terrain cells. Clipping each slice
// keeps chunked overworld rendering and the playable/map canvases identical.
export function paintMarshSceneryCell(c,room,x,y,images){
  if(!images)return;
  for(const p of room.scenery||[]){
    const image=images[p.asset],dx=(p.x-x)*16-8,dy=(p.y-y)*16-16;
    if(!image||dx>=16||dx+32<=0||dy>=16||dy+32<=0)continue;
    c.save();c.beginPath();c.rect(0,0,16,16);c.clip();
    c.drawImage(image,dx,dy,32,32);c.restore();
  }
}
