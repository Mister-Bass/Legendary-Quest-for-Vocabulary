import { at,cell,marshWalkable,marshProgress,FLAME_SECONDS,PAD_SECONDS } from './marsh-map.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),dirs={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
export class MarshModel{
  constructor(room,progress=marshProgress()){
    this.room=room;this.progress=progress;this.clock=0;this.hero={...at(room.spawn),facing:'up'};this.safe={...this.hero};
    this.flameUntil=0;this.slowUntil=0;this.invulnerable=1;this.attackAt=-10;this.rollAt=-10;this.throwAt=-10;this.padTimers=new Map();this.drops=[];this.bolts=[];this.items=[];this.events=[];this.blocks=0;this.falls=0;this.rolls=0;
    this.enemies=room.shades.map((p,i)=>({...at(p),home:at(p),type:p.type,id:i,hp:p.type==='octorok'?2:1,active:true,hidden:p.type==='slurg',next:1+i*.47,lastSwing:-10,respawn:0}));
    this.boss={...at(room.boss),active:progress.heartTaken&&!progress.bossDefeated,hp:progress.bossDefeated?0:6,phase:progress.bossDefeated?'defeated':'sleeping',until:0,nextSlam:0,lastSwing:-10};
    if(this.boss.active){this.boss.phase='watching';this.boss.until=2;}
  }
  emit(type,data={}){this.events.push({type,...data});}
  solid(x,y,r=8){for(const ox of [-r,r])for(const oy of [-r,r]){
    const tx=Math.floor((x+ox)/40),ty=Math.floor((y+oy)/40),k=cell(tx,ty),timer=this.padTimers.get(k);
    if(!marshWalkable(this.room,tx,ty)||(timer&&timer.sunkUntil>this.clock))return true;
  }return [this.room.guide,this.room.exit,this.room.heart,...this.room.seals].some(p=>Math.abs(x-at(p).x)<r+12&&Math.abs(y-at(p).y)<r+12);}
  move(entity,dx,dy){if(!this.solid(entity.x+dx,entity.y))entity.x+=dx;if(!this.solid(entity.x,entity.y+dy))entity.y+=dy;}
  hurt(message){if(this.clock<this.invulnerable||this.clock-this.rollAt<.42)return;this.invulnerable=this.clock+1.2;this.emit('hurt',{message});}
  attack(){if(this.clock-this.attackAt<.45)return;this.attackAt=this.clock;}
  roll(){if(this.clock-this.rollAt<1)return;this.rollAt=this.clock;this.rolls++;}
  throwItem(bomb=false){
    if(this.clock-this.throwAt<(bomb?2: .65))return;this.throwAt=this.clock;
    let [dx,dy]=dirs[this.hero.facing];if(this.aim){const d=dist(this.hero,this.aim);if(d>8){dx=(this.aim.x-this.hero.x)/d;dy=(this.aim.y-this.hero.y)/d;}}this.items.push({x:this.hero.x,y:this.hero.y,vx:dx*340,vy:dy*340,until:this.clock+1.6,bomb});
  }
  light(index){this.progress.lit[index]=true;this.emit('message',{message:`Guardian lantern ${index+1} is lit.`});}
  interactLantern(index){
    if(this.progress.lit[index])return;
    if(!this.progress.primed[index]){
      if(this.flameUntil<=this.clock){this.emit('message',{message:'This lantern needs a Wisp Flame. Corner and strike a pale Gloamwisp, then collect its flame.'});return;}
      this.flameUntil=0;this.progress.primed[index]=true;
    }
    this.emit('lantern',{index});
  }
  openHeart(){if(this.progress.heartTaken)return;this.progress.heartTaken=true;this.boss.active=true;this.boss.phase='watching';this.boss.until=this.clock+2;this.boss.nextSlam=this.clock+3;this.emit('heart');}
  strike(enemy){
    if(!enemy.active||enemy.lastSwing===this.attackAt)return;
    const d=dist(this.hero,enemy),[dx,dy]=dirs[this.hero.facing];if(d>68||((enemy.x-this.hero.x)*dx+(enemy.y-this.hero.y)*dy)/Math.max(1,d)<.15)return;
    enemy.lastSwing=this.attackAt;
    if(enemy.hidden)return;
    if(enemy.type==='slurg'){
      this.split(enemy);return;
    }
    if(--enemy.hp<=0)this.defeat(enemy);
  }
  split(enemy){enemy.active=false;for(const side of [-1,1])this.enemies.push({x:enemy.x+side*12,y:enemy.y,home:{x:enemy.x,y:enemy.y},type:'small-slurg',id:this.enemies.length,hp:1,active:true,next:this.clock+.4,lastSwing:this.attackAt});this.emit('message',{message:'The Slurg split into two small slimes!'});}
  defeat(e){e.active=false;if(e.type==='wisp'){e.respawn=this.clock+6;this.drops.push({x:e.x,y:e.y,until:this.clock+12});this.emit('message',{message:'A Wisp Flame dropped! Walk into it. You have ten seconds after pickup.'});}}
  hitBoss(){if(!this.boss.active||this.boss.phase!=='stunned'||this.boss.lastSwing===this.attackAt||dist(this.hero,this.boss)>100)return;
    this.boss.lastSwing=this.attackAt;if(--this.boss.hp<=0){this.boss.active=false;this.boss.phase='defeated';this.progress.bossDefeated=true;this.emit('message',{message:'Grandfather Croak is defeated. The lily pads settle back to their normal rhythm.'});}}
  tick(dt,input={}){
    this.clock+=dt;const h=this.hero;let dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up),m=Math.hypot(dx,dy);
    if(m){dx/=m;dy/=m;h.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
    if(input.shield&&this.aim){const ax=this.aim.x-h.x,ay=this.aim.y-h.y;h.facing=Math.abs(ax)>Math.abs(ay)?ax<0?'left':'right':ay<0?'up':'down';}
    if(input.attack)this.attack();if(input.roll)this.roll();if(input.throw)this.throwItem();if(input.bomb)this.throwItem(true);
    const rolling=this.clock-this.rollAt<.34,shield=!!input.shield&&!rolling;
    if(rolling)[dx,dy]=dirs[h.facing];
    const muddy=this.room.mud.has(cell(Math.floor(h.x/40),Math.floor(h.y/40))),speed=rolling?340:(muddy||this.slowUntil>this.clock?95:185)*(shield?.55:1);
    this.speed=m||rolling?speed:0;this.shield=shield;this.move(h,dx*speed*dt,dy*speed*dt);
    const k=cell(Math.floor(h.x/40),Math.floor(h.y/40));
    for(const [key,p]of this.padTimers){if(p.deadline<=this.clock&&!p.sunkUntil)p.sunkUntil=this.clock+4;if(p.sunkUntil&&p.sunkUntil<=this.clock)this.padTimers.delete(key);}
    if(this.room.bridge.has(k)&&!this.padTimers.has(k))this.padTimers.set(k,{deadline:this.clock+(this.boss.active?.9:PAD_SECONDS),sunkUntil:0});
    const safeCell={x:(Math.floor(h.x/40)+.5)*40,y:(Math.floor(h.y/40)+.5)*40};
    if(!this.room.water.has(k)&&!this.solid(safeCell.x,safeCell.y))this.safe=safeCell;
    if(this.padTimers.get(k)?.sunkUntil>this.clock){h.x=this.safe.x;h.y=this.safe.y;this.flameUntil=0;this.falls++;this.hurt('The lily pad sank! You return to the last safe bank and lose one heart.');}
    this.drops=this.drops.filter(d=>{if(d.until<=this.clock)return false;if(dist(d,h)<32){this.flameUntil=this.clock+FLAME_SECONDS;this.emit('message',{message:'Wisp Flame carried: 10 seconds. Run to an unlit lantern!'});return false;}return true;});
    if(this.clock-this.attackAt<.28){for(const e of [...this.enemies])this.strike(e);this.hitBoss();}
    for(const e of this.enemies){
      if(!e.active){if(e.type==='wisp'&&this.clock>=e.respawn){e.active=true;e.hp=1;e.x=e.home.x;e.y=e.home.y;}continue;}
      const d=dist(e,h),ex=h.x-e.x,ey=h.y-e.y;
      if(e.type==='wisp'){
        if(d<150){this.move(e,-ex/Math.max(1,d)*210*dt,-ey/Math.max(1,d)*210*dt);}else{const target={x:e.home.x+Math.sin(this.clock*.8+e.id)*20,y:e.home.y},back=dist(e,target);if(back>2)this.move(e,(target.x-e.x)/back*30*dt,(target.y-e.y)/back*30*dt);}
      }else if(e.type==='octorok'){
        if(this.clock>e.next&&d<440){this.bolts.push({x:e.x,y:e.y,vx:ex/Math.max(1,d)*170,vy:ey/Math.max(1,d)*170,until:this.clock+5});e.next=this.clock+2.8;}
      }else{
        if(d<190)e.hidden=false;
        if(!e.hidden&&d>22&&d<330){const hop=this.clock%1.1<.35?150:18;this.move(e,ex/Math.max(1,d)*hop*dt,ey/Math.max(1,d)*hop*dt);}
        if(!e.hidden&&d<24)this.hurt('A Slurg landed on you. Roll or strike its small offspring.');
      }
    }
    this.bolts=this.bolts.filter(p=>{
      p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.until<this.clock||this.room.walls.has(cell(Math.floor(p.x/40),Math.floor(p.y/40))))return false;
      if(dist(p,h)<24){const [fx,fy]=dirs[h.facing],front=((p.x-h.x)*fx+(p.y-h.y)*fy)/Math.max(1,dist(p,h));
        if(shield&&front>0){this.blocks++;this.emit('message',{message:'Mud ball blocked!'});}else if(this.clock-this.rollAt>=.42){this.slowUntil=this.clock+1.8;this.hurt('A mud ball slows you. Shield toward the shot or roll through it.');}return false;}return true;
    });
    this.items=this.items.filter(p=>{
      p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.until<this.clock)return false;
      if(this.boss.active&&dist(p,this.boss)<65){if(p.bomb)this.emit('blast',{x:p.x,y:p.y});if(this.boss.phase==='tongue'){this.boss.phase='stunned';this.boss.until=this.clock+3.2;this.emit('message',{message:'Croak is stunned! Strike its exposed belly.'});}else this.emit('message',{message:'Croak’s hide deflects the hit. Throw during the extended tongue lash.'});return false;}
      const target=this.enemies.find(e=>e.active&&dist(e,p)<(p.bomb?60:30));if(target){if(p.bomb)this.emit('blast',{x:p.x,y:p.y});if(target.type==='slurg')this.split(target);else if(target.type==='wisp')this.defeat(target);else if(--target.hp<=0)this.defeat(target);return false;}return true;
    });
    const b=this.boss;
    if(b.active){
      if(this.clock>=b.nextSlam){b.nextSlam=this.clock+5;for(const p of this.padTimers.values())p.deadline=Math.min(p.deadline,this.clock+.9);this.emit('slam');}
      if(this.clock>=b.until){
        if(b.phase==='watching'||b.phase==='stunned'){b.phase='warning';b.aim={x:h.x,y:h.y};b.until=this.clock+.8;}
        else if(b.phase==='warning'){b.phase='tongue';b.until=this.clock+.9;}
        else {b.phase='watching';b.until=this.clock+1.6;}
      }
      if(b.phase==='tongue'){
        const vx=b.aim.x-b.x,vy=b.aim.y-b.y,t=Math.max(0,Math.min(1,((h.x-b.x)*vx+(h.y-b.y)*vy)/(vx*vx+vy*vy||1)));
        if(Math.hypot(h.x-b.x-t*vx,h.y-b.y-t*vy)<22)this.hurt('Grandfather Croak lashes its tongue. Roll aside, then throw a stone or bomb during the lash.');
      }
    }
  }
}
