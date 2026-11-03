export const ITEMS={
  shield:{name:'Shield',hint:'Hold Q, F, or right-click to block. Block Croak’s tongue to stun him.'},
  bow:{name:'Bow',hint:'F or right-click fires an arrow toward your aim.'},
  bomb:{name:'Bomb',hint:'F, B, or right-click throws a bomb.'},
  stone:{name:'Stone',hint:'F or right-click throws a stone.'}
};
export const ITEM_IDS=Object.keys(ITEMS);
export const rollItem=(random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296)=>ITEM_IDS[Math.min(3,Math.max(0,Math.floor(random()*4)))];
export const itemAction=(item,action)=>!!ITEMS[item]&&(action==='item'||action==='shield'&&item==='shield'||action==='throw'&&item==='stone'||action==='bomb'&&item==='bomb');
export function itemShot(item,hero,aim,clock,last){
  if(!ITEMS[item]||item==='shield'||clock-last<({bow:.45,bomb:2,stone:.65}[item]))return null;
  const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};let [dx,dy]=vectors[hero.facing]||vectors.down;
  if(aim){const d=Math.hypot(aim.x-hero.x,aim.y-hero.y);if(d>8){dx=(aim.x-hero.x)/d;dy=(aim.y-hero.y)/d;}}
  const speed=item==='bow'?560:340;
  return {x:hero.x,y:hero.y,vx:dx*speed,vy:dy*speed,until:clock+(item==='bow'?2:1.6),bomb:item==='bomb',kind:item,id:clock};
}
