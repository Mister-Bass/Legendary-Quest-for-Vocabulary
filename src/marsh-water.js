// Kenney RPG Tiles Vector, CC0. See public/assets/kenney-pond/License.txt.
export const POND_TILES=[10,11,12,13,14,28,29,30,31,32,44,45,46];
const key=(x,y)=>`${x},${y}`;
export function pondImages(scene){return Object.fromEntries(POND_TILES.map(n=>[n,scene.textures.get('pond-'+n).getSourceImage()]));}
// Water cells retain their gameplay mask; pad cells are still water underneath.
export function pondTile(room,x,y){
  const wet=(dx,dy)=>room.water.has(key(x+dx,y+dy)),n=wet(0,-1),s=wet(0,1),w=wet(-1,0),e=wet(1,0);
  if(!n&&!w)return 10;if(!n&&!e)return 12;
  if(!s&&!w)return 44;if(!s&&!e)return 46;
  if(!n)return 11;if(!s)return 45;if(!w)return 28;if(!e)return 30;
  if(!wet(-1,-1))return 32;if(!wet(1,-1))return 31;
  if(!wet(-1,1))return 14;if(!wet(1,1))return 13;
  return 29;
}
export class PondLife{
  constructor(room){
    this.room=room;this.open=[];this.sites=[];this.frame=0;this.ripples=0;this.fishJumps=0;this.activeRipples=0;this.activeFish=0;
    for(const k of room.water){
      const [x,y]=k.split(',').map(Number);
      if(room.bridge.has(k)||pondTile(room,x,y)!==29)continue;
      this.open.push({x,y});
      let safe=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!room.water.has(key(x+dx,y+dy))||room.bridge.has(key(x+dx,y+dy)))safe=false;
      if(safe)this.sites.push({x:x*40+20,y:y*40+20});
    }
    // The first quiet fish jump is visible from the southern approach.
    this.sites.sort((a,b)=>Math.hypot(a.x-460,a.y-900)-Math.hypot(b.x-460,b.y-900));
  }
  draw(g,time){
    g.clear();this.frame=Math.floor(time*12);this.activeRipples=0;this.activeFish=0;
    // Short, gently drifting streaks stay inside open water, clear of banks/pads.
    for(const p of this.open){
      const seed=p.x*17+p.y*31;if(seed%3)continue;
      const x=p.x*40+8+(seed+time*9)%19,y=p.y*40+18+Math.sin(time*.9+seed)*3;
      g.lineStyle(2,0xe0fff0,.16+Math.sin(time+seed)*.035).lineBetween(x,y,x+10,y-2);
      g.lineStyle(1,0x3d9baf,.15).lineBetween(x+2,y+4,x+11,y+2);
    }
    if(!this.sites.length)return;
    this.ripples=Math.max(0,Math.floor((time-1.5)/4)+1);
    const rippleAge=time-(1.5+(this.ripples-1)*4);
    if(this.ripples&&rippleAge>=0&&rippleAge<1.8){
      const p=this.sites[(this.ripples*19+7)%this.sites.length],r=4+rippleAge*13;
      g.lineStyle(2,0xedffed,.55*(1-rippleAge/1.8)).strokeEllipse(p.x,p.y,r*2,r);
      if(rippleAge>.3)g.lineStyle(1.5,0xc9f6ec,.25*(1-rippleAge/1.8)).strokeEllipse(p.x,p.y,r*1.3,r*.65);
      this.activeRipples=1;
    }
    this.fishJumps=Math.max(0,Math.floor((time-5.5)/10)+1);
    const age=time-(5.5+(this.fishJumps-1)*10);
    if(this.fishJumps&&age>=0&&age<1.6){
      const p=this.sites[((this.fishJumps-1)*37)%this.sites.length],t=age/1.6,dx=(t-.5)*28,x=p.x+dx,y=p.y-Math.sin(t*Math.PI)*40;
      g.fillStyle(0x286e83,.2).fillEllipse(x,p.y+5,20,6);
      if(t<.98){
        g.fillStyle(0xd68d58).fillTriangle(x-7,y,x-15,y-5,x-15,y+5).fillEllipse(x,y,19,9);
        g.fillStyle(0xffddb0).fillRect(x-4,y+1,10,2.5);g.fillStyle(0x234753).fillRect(x+5,y-2,2.5,2.5);
      }
      if(t<.18||t>.75){const r=t<.18?5+t*30:8+(t-.75)*60;g.lineStyle(2,0xedffef,.65).strokeEllipse(x,p.y+2,r*2,r);}
      this.activeFish=1;
    }
  }
}
