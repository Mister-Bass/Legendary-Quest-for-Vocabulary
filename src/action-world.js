import { WORLD, isWalkable } from './world.js';
import { Minimap } from './minimap.js';

const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const center=p=>({x:p.x*40+20,y:p.y*40+20});
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// Frame-based kinematic movement; gameplay never depends on OS key-repeat speed.
export class ActionWorld {
  constructor(scene){
    this.scene=scene;this.hero=scene.hero;this.room=scene.room;this.enemies=scene.shades;
    this.keys=new Map();this.taps=new Map();this.vx=0;this.vy=0;this.clock=0;
    this.facing='down';this.attackAt=-10;this.invulnerableUntil=1;
    this.contacts=new Set();this.projectiles=[];this.shots=0;this.mouseAim=null;
    if(!scene.exploration.has(scene.state.chapter))scene.exploration.set(scene.state.chapter,new Set());
    this.minimap=new Minimap(scene,scene.exploration.get(scene.state.chapter));

    this.enemies.forEach(e=>{e.home={x:e.sprite.x,y:e.sprite.y};e.phase='patrol';e.until=0;e.pathAt=0;e.nextShot=1.2;e.warning=scene.add.graphics();});
    scene.cameras.main.setBounds(0,0,WORLD.columns*40,WORLD.rows*40).setZoom(WORLD.zoom).startFollow(this.hero,true,.12,.12);
    scene.cameras.main.centerOn(this.hero.x,this.hero.y);
    this.minimap.update(0,true);
  }
  press(action,id){
    this.keys.set(id,action);
    if(vectors[action])this.taps.set(action,this.clock+.08);
    if(action==='attack')this.attack();
  }
  release(id){this.keys.delete(id);}
  stop(){this.keys.clear();this.taps.clear();this.mouseAim=null;this.vx=0;this.vy=0;}
  attack(){if(this.scene.state.mode!=='playing'||this.clock-this.attackAt<.45)return;this.attackAt=this.clock;}
  aim(x,y){const dx=x-this.hero.x,dy=y-this.hero.y;if(Math.hypot(dx,dy)>8)this.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
  solid(x,y,r=10){
    for(let ty=Math.floor((y-r)/40);ty<=Math.floor((y+r)/40);ty++)for(let tx=Math.floor((x-r)/40);tx<=Math.floor((x+r)/40);tx++)if(!isWalkable(this.room,tx,ty))return true;
    return [this.room.guide,this.room.exit,...this.room.seals].some(p=>Math.abs(x-(p.x*40+20))<r+13&&Math.abs(y-(p.y*40+20))<r+13);
  }
  slide(entity,dx,dy){
    if(!this.solid(entity.x+dx,entity.y))entity.x+=dx;
    if(!this.solid(entity.x,entity.y+dy))entity.y+=dy;
  }
  pathTo(from,to){
    const start={x:Math.floor(from.x/40),y:Math.floor(from.y/40)},goal={x:Math.floor(to.x/40),y:Math.floor(to.y/40)};
    const q=[{...start,first:null}],seen=new Set([`${start.x},${start.y}`]);
    for(let i=0;i<q.length;i++){
      const p=q[i];if(p.x===goal.x&&p.y===goal.y)return p.first?center(p.first):to;
      for(const [dx,dy]of Object.values(vectors)){
        const n={x:p.x+dx,y:p.y+dy},key=`${n.x},${n.y}`;
        if(seen.has(key)||!isWalkable(this.room,n.x,n.y)||this.solid(n.x*40+20,n.y*40+20))continue;
        seen.add(key);q.push({...n,first:p.first||n});
      }
    }
    return from;
  }
  update(delta){
    if(this.scene.state.mode!=='playing'){this.stop();this.paintEquipment(false);this.minimap.update(this.clock);this.telemetry();return;}
    // Preserve elapsed time on slower browsers, with small collision-safe steps.
    const elapsed=Math.min(delta/1000,.25),steps=Math.max(1,Math.ceil(elapsed/(1/60)));
    this.scene.cameras.main.setLerp(1-Math.exp(-9*elapsed));
    for(let i=0;i<steps;i++){this.step(elapsed/steps);if(this.scene.action!==this)return;if(this.scene.state.mode!=='playing')break;}
    this.minimap.update(this.clock);
    this.telemetry();
  }
  step(dt){
    this.clock+=dt;
    const held=new Set(this.keys.values());
    const active=action=>held.has(action)||(this.taps.get(action)||0)>this.clock;
    let dx=Number(active('right'))-Number(active('left')),dy=Number(active('down'))-Number(active('up'));
    const magnitude=Math.hypot(dx,dy);if(magnitude){dx/=magnitude;dy/=magnitude;this.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
    if(this.mouseAim)this.aim(this.mouseAim.x,this.mouseAim.y);
    const speed=170,blend=1-Math.exp(-24*dt);
    this.vx+=(dx*speed-this.vx)*blend;this.vy+=(dy*speed-this.vy)*blend;
    if(!magnitude&&Math.hypot(this.vx,this.vy)<1){this.vx=0;this.vy=0;}
    const next={x:this.hero.x+this.vx*dt,y:this.hero.y+this.vy*dt};
    const contacts=[...this.room.seals.map((p,i)=>({...p,id:`chest:${i}`,index:i})),{...this.room.guide,id:'guide'},{...this.room.exit,id:'gate'}];
    for(const p of contacts){
      const at=center(p);if(length(this.hero,at)>48)this.contacts.delete(p.id);
      if(!this.contacts.has(p.id)&&Math.abs(next.x-at.x)<25&&Math.abs(next.y-at.y)<25&&length(next,at)<length(this.hero,at)-.01){
        this.contacts.add(p.id);
        if(p.id.startsWith('chest')){if(this.scene.state.sealed.has(`${this.scene.state.chapter}:${p.index}`))continue;this.scene.openTrial(p.index);}
        else this.scene.interact();
        this.scene.render();return;
      }
    }
    this.slide(this.hero,this.vx*dt,this.vy*dt);
    Object.assign(this.scene.state,{x:(this.hero.x-20)/40,y:(this.hero.y-20)/40});
    const attacking=this.clock-this.attackAt<.28;
    this.hero.setFlipX(this.facing==='left').play(`hero-${attacking?'attack':magnitude?'run':'idle'}-${this.facing}`,true);
    if(held.has('attack'))this.attack();
    const swing=this.clock-this.attackAt<.28;
    for(const e of this.enemies){
      if(!e.active)continue;
      const distance=length(this.hero,e.sprite),[fx,fy]=vectors[this.facing];
      const frontal=((e.sprite.x-this.hero.x)*fx+(e.sprite.y-this.hero.y)*fy)/Math.max(1,distance);
      if(swing&&distance<72&&frontal>.2){e.active=false;e.sprite.setVisible(false);e.warning.clear();e.sprite.setVisible(true).clearTint().play('slime-death');e.sprite.once('animationcomplete',()=>e.sprite.setVisible(false));this.scene.feedback('Your sword defeats the slime.');continue;}
      this.updateEnemy(e,dt,distance);
      if(this.scene.state.mode!=='playing')break;
    }
    if(this.scene.state.mode==='playing')this.updateProjectiles(dt);
    this.hero.setAlpha(this.clock<this.invulnerableUntil&&Math.floor(this.clock*12)%2?.55:1);
    this.paintEquipment(swing);
  }
  updateEnemy(e,dt,distance){
    const now=this.clock;e.warning.clear();e.sprite.play(e.phase==='windup'?'slime-attack':e.phase==='chase'||e.phase==='patrol'?'slime-run':'slime-idle',true);
    if(e.phase==='cast'){
      e.sprite.setTint(0xc9b6ff);e.warning.lineStyle(2,0xc5a7ff,.9);e.warning.strokeCircle(e.sprite.x,e.sprite.y,28);
      if(now>=e.until){this.fire(e);e.phase='recover';e.until=now+.7;e.nextShot=now+2.3;e.sprite.clearTint();}
      return;
    }
    if(e.phase==='windup'){
      e.sprite.setTint(0xffbd8c);e.warning.lineStyle(2,0xffb875,.9);e.warning.strokeCircle(e.sprite.x,e.sprite.y,27+6*Math.sin(now*14));
      if(now>=e.until){
        e.phase='recover';e.until=now+.85;e.sprite.clearTint();
        if(distance<57){

          if(now>=this.invulnerableUntil){this.invulnerableUntil=now+1.2;this.scene.hurt('A slime struck you. Step aside or use left-click / Space to swing.');this.scene.render();}
        }
      }
      return;
    }
    if(e.phase==='recover'&&now<e.until)return;
    if(distance<49){e.phase='windup';e.until=now+.65;return;}
    if(distance>80&&distance<220&&now>=e.nextShot&&this.clearShot(e.sprite,this.hero)){
      e.phase='cast';e.until=now+.8;e.aim={x:this.hero.x,y:this.hero.y};return;
    }
    if(distance>=80&&distance<=170&&this.clearShot(e.sprite,this.hero)){e.phase='aim';return;}
    e.phase=distance<220?'chase':'patrol';
    const target=e.phase==='chase'?this.hero:{x:e.home.x+Math.sin(now*.45)*45,y:e.home.y};
    if(now>=e.pathAt||!e.target||length(e.sprite,e.target)<5){e.target=this.pathTo(e.sprite,target);e.pathAt=now+.35;}
    const dx=e.target.x-e.sprite.x,dy=e.target.y-e.sprite.y,d=Math.hypot(dx,dy);
    if(d>2){const step=Math.min(d,(e.phase==='chase'?76:24)*dt);this.slide(e.sprite,dx/d*step,dy/d*step);e.sprite.setFlipX(dx<0);}
  }
  clearShot(from,to){
    const d=length(from,to),steps=Math.ceil(d/10);
    for(let i=1;i<steps;i++)if(this.solid(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps,4))return false;
    return true;
  }
  fire(enemy){
    const dx=enemy.aim.x-enemy.sprite.x,dy=enemy.aim.y-enemy.sprite.y,d=Math.max(1,Math.hypot(dx,dy));
    const sprite=this.scene.add.circle(enemy.sprite.x+dx/d*21,enemy.sprite.y+dy/d*21,6,0x67c9a1).setStrokeStyle(2,0xc3f8be);
    this.scene.worldLayer.add(sprite);this.projectiles.push({sprite,vx:dx/d*140,vy:dy/d*140,until:this.clock+3.5});this.shots++;
  }
  updateProjectiles(dt){
    for(const p of this.projectiles){
      if(!p.sprite.active)continue;
      p.sprite.x+=p.vx*dt;p.sprite.y+=p.vy*dt;
      if(this.clock>=p.until||this.solid(p.sprite.x,p.sprite.y,4)){p.sprite.destroy();continue;}
      const d=length(p.sprite,this.hero);
      if(d<18){
        p.sprite.destroy();
        if(this.clock>=this.invulnerableUntil){this.invulnerableUntil=this.clock+1.2;this.scene.hurt('A slime bolt hit you. Watch the casting flash and step aside.');this.scene.render();}
      }
    }
    this.projectiles=this.projectiles.filter(p=>p.sprite.active);
  }
  paintEquipment(swing){
    // The supplied attack frames contain the sword; no idle weapon overlay.
    if(!swing&&this.hero.anims.currentAnim?.key.includes('attack'))this.hero.play(`hero-idle-${this.facing}`);
  }
  telemetry(){
    const s=this.scene.state,c=this.scene.cameras.main;
    Object.assign(document.getElementById('game').dataset,{waterFrame:this.scene.waterSprites[0]?.frame.name,keeperFrame:this.scene.keeper.frame.name,x:s.x.toFixed(2),y:s.y.toFixed(2),px:this.hero.x.toFixed(1),py:this.hero.y.toFixed(1),speed:Math.hypot(this.vx,this.vy).toFixed(1),facing:this.facing,shield:'false',cameraX:c.scrollX.toFixed(1),cameraY:c.scrollY.toFixed(1),zoom:c.zoom,worldWidth:WORLD.columns*40,worldHeight:WORLD.rows*40,shades:this.enemies.filter(e=>e.active).length,enemies:JSON.stringify(this.enemies.map(e=>({x:+e.sprite.x.toFixed(1),y:+e.sprite.y.toFixed(1),active:e.active,phase:e.phase})))});
    const arrow=p=>{const dx=p.x-s.x,dy=p.y-s.y;return Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑';};
    document.getElementById('wayfinder').textContent=this.room.seals.map((p,i)=>`${['I','II','III'][i]} ${s.sealed.has(`${s.chapter}:${i}`)?'✓':arrow(p)}`).join('   ·   ')+`   ·   Gate ${arrow(this.room.exit)}`;
    Object.assign(document.getElementById('game').dataset,{swordVisible:String(this.scene.state.mode==='playing'&&this.clock-this.attackAt<.28),shots:this.shots,projectiles:JSON.stringify(this.projectiles.map(p=>({x:+p.sprite.x.toFixed(1),y:+p.sprite.y.toFixed(1)})))});
    document.getElementById('combat-state').textContent=this.clock-this.attackAt<.45?'Sword recovering':'Left-click / Space Sword · Dodge slime bolts';
  }
}
