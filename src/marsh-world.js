import { itemAction } from './equipment.js';
import { portalReady,portalTexture } from './portal-art.js';
import { paintEffect,paintItemShot } from './effect-art.js';
import { drawFrogEncounter } from './frog-art.js';
import { wispTexture,paintWispAura } from './wisp-art.js';
import { lanternTexture,paintLanternGlow } from './lantern-art.js';
import { octorotPose } from './octorot-art.js';
import { paintMarshOoze } from './marsh-art.js';
import { MarshModel,bossTongue } from './marsh-model.js';
import { at,cell } from './marsh-map.js';
import { Minimap } from './minimap.js';
export class MarshWorld{
  constructor(scene){
    this.scene=scene;this.hero=scene.hero;this.room=scene.room;this.model=new MarshModel(this.room,scene.marshProgress,scene.state.item);this.model.hero.x=this.hero.x;this.model.hero.y=this.hero.y;
    this.clock=0;this.attackAt=-10;this.facing='up';this.invulnerableUntil=1;this.vx=0;this.vy=0;this.keys=new Map();this.taps=new Map();this.sprites=new Map();this.contacts=new Set();this.mouseAim=null;
    this.bossWater=scene.add.graphics();this.arenaGate=scene.add.image(0,0,'marsh-arena-gate').setDisplaySize(160,80).setOrigin(.5,1);this.bossSprite=scene.add.image(this.model.boss.x,this.model.boss.y,'marsh-toad').setDisplaySize(128,128).setOrigin(.5);
    this.bossLabel=scene.add.text(this.model.boss.x,this.model.boss.y-85,'GRANDFATHER CROAK',{fontFamily:'monospace',fontSize:12,color:'#e4e9b6',backgroundColor:'#203f32',padding:{x:5,y:3}}).setOrigin(.5);this.effects=scene.add.graphics();
    this.minimap=new Minimap(scene,scene.exploration.get(1)||new Set());scene.exploration.set(1,this.minimap.explored);
    scene.cameras.main.setBounds(0,0,1280,1280).setZoom(1.1).startFollow(this.hero,true,.12,.12).centerOn(this.hero.x,this.hero.y);
    this.initializing=true;this.sync();this.initializing=false;this.minimap.update(0,true);
  }
  press(action,id){if(['item','shield','throw','bomb'].includes(action)){if(!itemAction(this.scene.state.item,action))return;action='item';this.model.useItem();}this.keys.set(id,action);if(['up','down','left','right'].includes(action))this.taps.set(action,this.clock+.08);if(action==='attack')this.attack();if(action==='roll')this.model.roll();}
  release(id){this.keys.delete(id);}
  stop(){this.keys.clear();this.taps.clear();this.vx=0;this.vy=0;if(this.model){this.model.shield=false;this.model.speed=0;this.model.aim=null;}this.mouseAim=null;}
  attack(){this.model.attack();this.attackAt=this.model.attackAt;}
  aim(x,y){const dx=x-this.hero.x,dy=y-this.hero.y;this.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';this.model.hero.facing=this.facing;this.model.aim={x,y};}
  interact(){
    const m=this.model,h=m.hero;
    const lamp=this.room.seals.findIndex(p=>Math.hypot(h.x-at(p).x,h.y-at(p).y)<66);
    if(lamp>=0){m.interactLantern(lamp);this.events();return true;}
    if(Math.hypot(h.x-at(this.room.heart).x,h.y-at(this.room.heart).y)<58){m.openHeart();this.events();return true;}
    return false;
  }
  update(delta){
    if(this.scene.state.mode==='boss-rise'){this.model.tick(Math.min(.25,delta/1000));this.clock=this.model.clock;this.events();this.sync();this.telemetry();return;}
    if(this.scene.state.mode!=='playing'){this.stop();this.telemetry();return;}
    const elapsed=Math.min(.25,delta/1000),steps=Math.ceil(elapsed/(1/60));
    for(let i=0;i<steps;i++){
      const active=new Set(this.keys.values());for(const [key,until]of this.taps)if(until>this.clock)active.add(key);
      this.model.invulnerable=Math.max(this.model.invulnerable,this.invulnerableUntil);
      this.model.tick(elapsed/steps,Object.fromEntries([...active].map(k=>[k,true])));
      this.clock=this.model.clock;this.attackAt=this.model.attackAt;this.invulnerableUntil=this.model.invulnerable;this.hero.setPosition(this.model.hero.x,this.model.hero.y);this.facing=this.model.hero.facing;
      Object.assign(this.scene.state,{x:(this.hero.x-20)/40,y:(this.hero.y-20)/40});
      this.events();if(this.scene.state.mode!=='playing')break;
      for(const [id,p]of [...this.room.seals.map((p,i)=>['lamp'+i,p]),['heart',this.room.heart],['gate',this.room.exit],['guide',this.room.guide]]){
        const d=Math.hypot(this.hero.x-at(p).x,this.hero.y-at(p).y);
        if(d>65)this.contacts.delete(id);
        const lampIndex=id.startsWith('lamp')?Number(id.slice(4)):-1,readyFlame=lampIndex>=0&&!this.model.progress.primed[lampIndex]&&!this.model.progress.lit[lampIndex]&&this.model.flameUntil>this.clock;
        if(d<42&&(!this.contacts.has(id)||readyFlame)){this.contacts.add(id);if(id==='gate'||id==='guide'){this.scene.interact();this.scene.render();}else this.interact();}
      }
      if(this.scene.state.mode!=='playing')break;
    }
    this.hero.setFlipX(this.facing==='left').play(`hero-${this.clock-this.attackAt<.28?'attack':this.model.speed?'run':'idle'}-${this.facing}`,true);
    this.sync();this.minimap.update(this.clock);this.telemetry();
  }
  events(){
    for(const e of this.model.events.splice(0)){
      if(e.type==='boss-awakened'){this.stop();this.scene.state.mode='boss-rise';this.scene.cameras.main.stopFollow();this.scene.feedback('The two bank flames awaken Grandfather Croak. The southern gate rises!');this.scene.render();}
      if(e.type==='boss-ready'){this.scene.state.mode='playing';this.invulnerableUntil=this.clock+1.2;this.scene.cameras.main.setZoom(1.1).startFollow(this.hero,true,.12,.12).centerOn(this.hero.x,this.hero.y);this.scene.feedback('Croak holds the final Gloamwisp. Use your earned item during his tongue lash, then strike his stunned belly to release it.');this.scene.render();}
      if(e.type==='boss-defeated'){this.scene.drawGate();this.scene.render();}

      if(e.type==='hurt'){this.scene.hurt(e.message);this.scene.render();}
      if(e.type==='message')this.scene.feedback(e.message);
      if(e.type==='lantern')this.scene.openTrial(e.index);
      if(e.type==='heart'){this.scene.state.hearts=Math.min(5,this.scene.state.hearts+1);this.scene.heartChest.play('chest-open');this.scene.feedback('Heart Piece found (1 of 4). One heart restored.');this.scene.render();}
      if(e.type==='slam')this.scene.cameras.main.shake(130,.002);
      if(e.type==='blast'){const g=this.scene.add.graphics({x:e.x,y:e.y});g.fillStyle(0xffbc76,.45).fillCircle(0,0,38);g.lineStyle(3,0xffdf9e).strokeCircle(0,0,38);this.scene.worldLayer.add(g);this.scene.tweens.add({targets:g,alpha:0,duration:350,onComplete:()=>g.destroy()});}
    }
  }
  sync(){
    const m=this.model;this.scene.shades=[];
    paintMarshOoze(this.scene.mudEffects,this.room,this.clock);
    this.scene.pondLife.draw(this.scene.pondEffects,this.clock);
    paintWispAura(this.scene.wispGlow,m.enemies,this.clock);
    for(const e of m.enemies){
      if(!this.sprites.has(e.id)){const texture=e.type==='wisp'?'marsh-wisp':e.type==='octorok'?'marsh-octorok':'marsh-slurg';const s=this.scene.add.sprite(e.x,e.y,texture,e.type==='octorok'?3:e.type==='slurg'||e.type==='small-slurg'?0:undefined).setDisplaySize(e.type==='small-slurg'?48:e.type==='slurg'?80:e.type==='wisp'?64:44,e.type==='small-slurg'?48:e.type==='slurg'?80:e.type==='wisp'?64:44);if(!this.initializing)this.scene.worldLayer.add(s);this.sprites.set(e.id,s);}
      const hop=(e.type==='slurg'||e.type==='small-slurg')&&this.clock%1.1<.35?Math.sin(this.clock%1.1/.35*Math.PI)*12:0;
      const sprite=this.sprites.get(e.id);sprite.setPosition(e.x,e.y+(e.type==='wisp'?Math.sin(this.clock*4+e.id)*5:-hop)).setVisible(e.active&&!e.hidden).setAlpha(e.type==='octorok'&&e.next-this.clock>1.4?.35:1).setTint(e.type==='octorok'&&e.next-this.clock<.4?0xffc994:0xffffff);
      if(e.type==='slurg'||e.type==='small-slurg')sprite.play(e.hidden?'mud-slime-idle':'mud-slime-run',true).setFlipX(m.hero.x<e.x);
      if(e.type==='wisp')sprite.setTexture(wispTexture(this.clock,e.id));
      if(e.type==='octorok'){const pose=octorotPose(e,m.hero,this.clock);sprite.setFrame(pose.frame).setFlipX(pose.flipX);}
      this.scene.shades.push({...e,sprite});
    }
    this.scene.doorSprite.setTexture(portalTexture(m.progress.lit,this.clock));
    drawFrogEncounter(this);
    const g=this.effects;g.clear();
    this.padRipples=0;
    for(const p of this.room.pads){
      const key=cell(p.x,p.y),timer=m.padTimers.get(key),sunk=!!timer&&timer.sunkUntil>this.clock;
      this.scene.padSprites.get(key).setVisible(!sunk);
      if(!sunk)continue;
      const age=this.clock-(timer.sunkAt??timer.sunkUntil-4);
      if(age>=0&&age<1.2){
        const radius=5+age*14,alpha=.65*(1-age/1.2);
        g.lineStyle(2,0xe1f5dd,alpha).strokeEllipse(p.x*40+20,p.y*40+20,radius*2,radius);
        this.padRipples++;
      }
    }
    for(const d of m.drops){g.fillStyle(0xffcc76,.3).fillCircle(d.x,d.y,18);paintEffect(g,'flame',d.x,d.y,32);}
    for(const p of m.bolts)paintEffect(g,'mud-ball',p.x,p.y,20);
    for(const p of m.items)paintItemShot(g,p);
    if(m.item==='bow'&&this.clock-m.throwAt<.2)paintEffect(g,'bow',this.hero.x+14,this.hero.y,32);
    if(m.flameUntil>this.clock){g.fillStyle(0xffcc76,.25).fillCircle(this.hero.x,this.hero.y-18,24);paintEffect(g,'flame',this.hero.x,this.hero.y-25,26);}
    if(m.shield){const dir={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[this.facing];paintEffect(g,'shield',this.hero.x+dir[0]*18,this.hero.y+dir[1]*18,34);}
    const b=m.boss;if(b.active){
      if(b.phase==='warning'||b.phase==='tongue'){
        const tongue=bossTongue(b,this.clock);
        if(b.phase==='warning')g.lineStyle(2,0xe6c585,.65).lineBetween(b.x,b.y,tongue.tipX,tongue.tipY);
        else{g.lineStyle(13,0x793f58).lineBetween(b.x,b.y,tongue.tipX,tongue.tipY);g.lineStyle(8,0xd98798).lineBetween(b.x,b.y,tongue.tipX,tongue.tipY);g.lineStyle(2,0xffc0b0).lineBetween(b.x,b.y-2,tongue.tipX,tongue.tipY-2);g.fillStyle(0xefaaac).fillEllipse(tongue.tipX,tongue.tipY,13,10);}
      }
      for(let i=0;i<6;i++)g.fillStyle(i<b.hp?0xa8d57b:0x284d38).fillRect(b.x-33+i*11,b.y-70,8,5);
    }
    // Low, translucent mist drifts over the water without concealing the pads.
    for(let i=0;i<5;i++)g.fillStyle(0xb7d2c3,.035).fillEllipse(360+i*125+Math.sin(this.clock*.1+i)*30,380+i%3*180,220,55);
    paintLanternGlow(this.scene.lanternGlow,this.room.seals,m.progress.lit,this.clock);
    this.scene.stationSprites.forEach((s,i)=>s.setTexture(lanternTexture(m.progress.lit[i],this.clock,i)));
  }
  telemetry(){
    const m=this.model,s=this.scene.state,c=this.scene.cameras.main;
    Object.assign(document.getElementById('game').dataset,{marsh:'true',portalOpen:String(portalReady(m.progress.lit)),finalWispReleased:String(m.progress.bossDefeated),finalWispEmerging:String(m.enemies.some(e=>e.finalWisp&&e.active&&this.clock<e.emergingUntil)),finalFlameUsed:String(m.progress.primed[2]),flameSource:this.clock<m.flameUntil?(m.flameSource||''):'',portalFrame:this.scene.doorSprite.texture.key,flameSeconds:Math.max(0,m.flameUntil-m.clock).toFixed(1),flameDrops:JSON.stringify(m.drops),lanterns:JSON.stringify(m.progress.lit),pads:JSON.stringify([...m.padTimers]),visiblePads:[...this.scene.padSprites.values()].filter(s=>s.visible).length,padRipples:this.padRipples||0,arenaGateClosed:String(m.gateClosed),arenaGateLift:(this.scene.arenaGateLift||0).toFixed(2),bossRise:(m.boss.phase==='rising'?Math.max(0,Math.min(1,(this.clock-m.boss.riseAt)/1.8)):m.progress.bossAwakened?1:0).toFixed(2),tongueLength:(m.boss.phase==='tongue'?bossTongue(m.boss,this.clock).length:0).toFixed(1),bossPhase:m.boss.phase,bossHp:m.boss.hp,heartPiece:String(m.progress.heartTaken),blocks:m.blocks,falls:m.falls,rolls:m.rolls,shield:String(!!m.shield),waterFrame:this.scene.pondLife.frame,pondClock:this.clock.toFixed(2),waterRipples:this.scene.pondLife.ripples,fishJumps:this.scene.pondLife.fishJumps,activeFish:this.scene.pondLife.activeFish,activeRipples:this.scene.pondLife.activeRipples,keeperFrame:this.scene.keeper.frame.name,px:this.hero.x.toFixed(1),py:this.hero.y.toFixed(1),x:s.x.toFixed(2),y:s.y.toFixed(2),speed:m.speed||0,facing:this.facing,cameraX:c.scrollX.toFixed(1),cameraY:c.scrollY.toFixed(1),zoom:c.zoom,worldWidth:1280,worldHeight:1280,enemies:JSON.stringify(m.enemies),swordVisible:String(s.mode==='playing'&&this.clock-this.attackAt<.28),itemProjectiles:JSON.stringify(m.items.map(p=>({kind:p.kind,x:p.x,y:p.y}))),projectiles:JSON.stringify(m.bolts)});
    document.getElementById('wayfinder').textContent=`Lanterns ${m.progress.lit.filter(Boolean).length}/3 · Wisp Flame ${Math.max(0,m.flameUntil-m.clock).toFixed(1)}s · Heart Piece ${m.progress.heartTaken?'1/4':'0/4'}`;
    document.getElementById('combat-state').textContent=`Space Sword · Shift Roll${this.scene.state.item?' · F/Right-click '+this.scene.state.item:''}`;
  }
}
