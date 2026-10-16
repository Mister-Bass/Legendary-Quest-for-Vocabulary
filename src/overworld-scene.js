import Phaser from 'phaser';
import { areas, areaAt, entranceFor, makeOverworld, overworldWalkable, drawAtlas } from './overworld.js';
import { paintOverworldTile } from './overworld-art.js';

const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const $=id=>document.getElementById(id);

export class OverworldScene extends Phaser.Scene {
  constructor(){super('Overworld');}
  init({adventure}){this.adventure=adventure;this.keys=adventure.overworldInput;this.vx=0;this.vy=0;this.facing='down';this.contact=null;this.lastCell='';}
  create(){
    this.map=makeOverworld();
    const art=Object.fromEntries(['grass','terrain','water','puny'].map(key=>[key,this.textures.get(key).getSourceImage()]));
    this.art=art;
    // Bake static scenery into small chunks. Only trees and water need per-frame animation.
    const chunkKeys=[];
    for(let cy=0;cy<54;cy+=12)for(let cx=0;cx<72;cx+=12){
      const id=`overworld-ground-${cx}-${cy}`,w=Math.min(12,72-cx),h=Math.min(12,54-cy);
      const texture=this.textures.createCanvas(id,w*16,h*16),c=texture.context;chunkKeys.push(id);
      c.translate(-cx*16,-cy*16);
      for(let y=cy;y<cy+h;y++)for(let x=cx;x<cx+w;x++)paintOverworldTile(c,this.map,x,y,16,art);
      texture.refresh();this.add.image(cx*40,cy*40,id).setOrigin(0).setDisplaySize(w*40,h*40).setDepth(-10);
    }
    this.events.once('shutdown',()=>chunkKeys.forEach(id=>this.textures.remove(id)));
    for(const k of this.map.water){
      if(this.map.bridge.has(k))continue;
      const [x,y]=k.split(',').map(Number);
      this.add.sprite(x*40+20,y*40+20,'water').setDisplaySize(40,40).setDepth(-5).setAlpha(.5).setTint(0x93b7d9).play('water-ripple');
    }
    this.add.image(36*40+2,43*40,'bridge').setDisplaySize(272,200).setAngle(90).setDepth(-2);
    this.map.trees.forEach(t=>{
      const size=t.forest?200:134,height=t.forest?200:(t.variant<=2?256:192)*.7;
      const sprite=this.add.sprite(t.x*40+20,t.y*40+28,`tree${t.variant}`).setOrigin(.5,t.variant<=2?.94:.88).setDisplaySize(size,height).setDepth(t.y*40+28).play(`tree${t.variant}-sway`);
      if(t.forest)sprite.setTint(0x5096a0);
    });
    this.areaLabels=[];
    for(const a of areas){
      const x=a.x*40+20,y=a.y*40+20,g=this.add.graphics().setDepth(y-8);
      g.fillStyle(0x526b52).fillRect(x-35,y+8,70,12);
      g.fillStyle(0xb0b995).fillRect(x-31,y+5,62,10);
      g.fillStyle(0xe7d7a3).fillRect(x-28,y+5,56,2);
      if(a.chapter!==undefined){
        this.add.sprite(x,y-8,'chest',this.adventure.roomComplete(a.chapter)?3:0).setDisplaySize(40,40).setDepth(y);
      }else this.add.sprite(x,y-10,'guide').setDisplaySize(64,64).setDepth(y).play('keeper-dance');
      this.add.text(x,y-65,a.id,{fontFamily:'Arial',fontSize:10,color:'#f0dc9e',backgroundColor:'#264732',padding:{x:5,y:3}}).setOrigin(.5).setDepth(10000);
      const label=this.add.text(x,y+35,a.chapter===undefined?a.landmark:a.chapter>this.adventure.unlocked?`${a.landmark} · LOCKED`:`${a.landmark} · ENTER`,{fontFamily:'Georgia',fontSize:13,color:'#fff0bf',backgroundColor:'#243f30',padding:{x:6,y:4}}).setOrigin(.5).setDepth(10000);
      this.areaLabels.push({a,label});
    }
    const entry=entranceFor(this.adventure.state.chapter),saved=this.adventure.overworldPosition;
    this.hero=this.add.sprite(saved?.x??entry.x*40+20,saved?.y??(entry.y+3)*40+20,'player').setDisplaySize(120,120).setOrigin(.5,2/3).play('hero-idle-down');
    this.contact=areas.find(a=>Math.hypot(this.hero.x-(a.x*40+20),this.hero.y-(a.y*40+20))<64)?.id??null;
    this.cameras.main.setBounds(0,0,72*40,54*40).setZoom(1.5).startFollow(this.hero,true,.12,.12).centerOn(this.hero.x,this.hero.y);
    this.explored=this.adventure.overworldExplored;this.refresh(true);
  }
  press(action,id){if(vectors[action])this.keys.set(id,action);else if(action==='interact')this.enter();}
  release(id){this.keys.delete(id);}
  stop(){this.keys?.clear();this.adventure.overworldTaps?.clear();this.vx=0;this.vy=0;}
  solid(x,y){for(const ox of [-10,10])for(const oy of [-10,10])if(!overworldWalkable(this.map,Math.floor((x+ox)/40),Math.floor((y+oy)/40)))return true;return false;}
  enter(){
    const a=areas.find(a=>Math.hypot(this.hero.x-(a.x*40+20),this.hero.y-(a.y*40+20))<64);
    if(!a)return;
    if(a.chapter===undefined){this.adventure.feedback(`${a.id} · ${a.landmark}. Open the atlas (O) to select this area and plan a change.`);return;}
    if(a.chapter>this.adventure.unlocked){this.adventure.feedback(`${a.id} is locked. Finish the earlier vocabulary chambers to unlock ${a.landmark}.`);return;}
    this.adventure.returnFromOverworld(a.chapter);
  }
  update(time,delta){
    if(this.adventure.state.mode!=='overworld'){this.stop();return;}
    const held=new Set(this.keys.values());
    // Keep brief press/release pairs until a simulation frame consumes them.
    for(const [action,until] of this.adventure.overworldTaps)if(until>this.adventure.overworldClock)held.add(action);
    let dx=Number(held.has('right'))-Number(held.has('left')),dy=Number(held.has('down'))-Number(held.has('up')),m=Math.hypot(dx,dy);
    if(m){dx/=m;dy/=m;this.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
    const dt=Math.min(delta/1000,.1);this.adventure.overworldClock+=dt;const blend=1-Math.exp(-24*dt);this.vx+=(dx*220-this.vx)*blend;this.vy+=(dy*220-this.vy)*blend;
    const steps=Math.ceil(dt*120)||1;
    for(let i=0;i<steps;i++){if(!this.solid(this.hero.x+this.vx*dt/steps,this.hero.y))this.hero.x+=this.vx*dt/steps;if(!this.solid(this.hero.x,this.hero.y+this.vy*dt/steps))this.hero.y+=this.vy*dt/steps;}
    this.areaLabels.forEach(({a,label})=>label.setVisible(Math.hypot(this.hero.x-(a.x*40+20),this.hero.y-(a.y*40+20))<320));
    this.hero.setDepth(this.hero.y).setFlipX(this.facing==='left').play(`hero-${m?'run':'idle'}-${this.facing}`,true);
    this.adventure.overworldPosition={x:this.hero.x,y:this.hero.y};
    const nearby=areas.find(a=>Math.hypot(this.hero.x-(a.x*40+20),this.hero.y-(a.y*40+20))<35);
    if(!nearby)this.contact=null;
    if(nearby&&this.contact!==nearby.id){this.contact=nearby.id;this.enter();if(this.adventure.state.mode!=='overworld')return;}
    this.refresh();
  }
  refresh(force=false){
    const x=Math.floor(this.hero.x/40),y=Math.floor(this.hero.y/40),cell=`${x},${y}`,a=areaAt(x,y);
    if(cell!==this.lastCell||force){
      for(let oy=-4;oy<=4;oy++)for(let ox=-4;ox<=4;ox++)if(Math.hypot(ox,oy)<=4.3&&x+ox>=0&&x+ox<72&&y+oy>=0&&y+oy<54)this.explored.add(`${x+ox},${y+oy}`);
      this.lastCell=cell;drawAtlas($('minimap'),this.map,{explored:this.explored,position:this.hero,art:this.art});
      $('minimap').dataset.explored=String(this.explored.size);$('minimap').dataset.total='3888';$('minimap').dataset.chapter='overworld';$('minimap').setAttribute('aria-label',`Overworld exploration minimap. ${a.id} ${a.name}. Unvisited terrain is hidden.`);
      $('game').setAttribute('aria-label',`Explorable Lanternlands overworld. ${a.id} ${a.name}. Roads connect nine named areas and five vocabulary chamber entrances.`);document.querySelector('.caption-direction').textContent='N ↑ · ATLAS O';
      $('chapter-number').textContent=`OVERWORLD / ${a.id}`;$('chapter-title').textContent=a.name;$('chapter-subtitle').textContent=a.description;
      $('wayfinder').textContent=`${a.id} · ${a.name} · O: atlas · Enter a marked chamber on contact`;$('combat-state').textContent='Peaceful overworld';
    }
    Object.assign($('game').dataset,{area:a.id,artArea:a.id,tilePixels:16,tileset:'puny-world',overworldX:this.hero.x.toFixed(1),overworldY:this.hero.y.toFixed(1),overworldCameraX:this.cameras.main.scrollX.toFixed(1),overworldExplored:this.explored.size});
  }
}
