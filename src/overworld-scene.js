import Phaser from 'phaser';
import { areas, areaAt, entranceFor, makeOverworld, roadAt, overworldWalkable, drawAtlas } from './overworld.js';

const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const $=id=>document.getElementById(id);

export class OverworldScene extends Phaser.Scene {
  constructor(){super('Overworld');}
  init({adventure}){this.adventure=adventure;this.keys=adventure.overworldInput;this.vx=0;this.vy=0;this.facing='down';this.contact=null;this.lastCell='';}
  create(){
    this.map=makeOverworld();const tile=(x,y,key,frame=0)=>this.add.image(x*40+20,y*40+20,key,frame).setDisplaySize(40,40);
    for(let y=0;y<54;y++)for(let x=0;x<72;x++){
      const key=`${x},${y}`,area=areaAt(x,y);
      const tint=area.biome==='forest'?0xc9e2c2:['quarry','highlands'].includes(area.biome)?0xe2d2b5:area.biome==='marsh'?0xc2ded7:0xffffff;
      tile(x,y,'grass').setTint(tint);
      if(roadAt(x,y)){
        const col=!roadAt(x-1,y)?1:!roadAt(x+1,y)?3:2,row=!roadAt(x,y-1)?0:!roadAt(x,y+1)?2:1;
        tile(x,y,'terrain',row*6+col);
      }
      if(this.map.water.has(key))this.add.sprite(x*40+20,y*40+20,'water').setDisplaySize(40,40).play('water-ripple');
      if(this.map.walls.has(key))tile(x,y,'fences',4);
      if(this.map.bridge.has(key))tile(x,y,'terrain',8).setTint(0xe4c58b);
    }
    // Existing bridge artwork at the wetland crossing, oriented north–south.
    this.add.image(36*40+2,42*40,'bridge').setDisplaySize(272,200).setAngle(90);
    this.map.trees.forEach(t=>this.add.sprite(t.x*40+20,t.y*40+28,`tree${t.variant}`).setOrigin(.5,t.variant<=2?.94:.88).setDisplaySize(134,(t.variant<=2?256:192)*.7).setDepth(t.y*40+28).play(`tree${t.variant}-sway`));
    for(const a of areas){
      const x=a.x*40+20,y=a.y*40+20,g=this.add.graphics();
      g.fillStyle(0x293d35).fillRoundedRect(x-48,y-58,96,80,8);
      g.lineStyle(5,a.chapter===undefined?0xaaba94:0xe2c17d).strokeRoundedRect(x-48,y-58,96,80,8);
      if(a.chapter!==undefined){
        this.add.sprite(x,y-22,'chest',this.adventure.roomComplete(a.chapter)?3:0).setDisplaySize(48,48);
      }else this.add.sprite(x,y-22,'guide').setDisplaySize(64,64).play('keeper-dance');
      this.add.text(x,y-100,`${a.id} · ${a.name}`,{fontFamily:'Georgia',fontSize:19,color:'#fff0bd',backgroundColor:'#172d28',padding:{x:9,y:5}}).setOrigin(.5);
      this.add.text(x,y+30,a.chapter===undefined?a.landmark:a.chapter>this.adventure.unlocked?'CHAMBER LOCKED':`ENTER · ${a.landmark}`,{fontFamily:'Arial',fontSize:12,color:'#f7e9c2',backgroundColor:'#20372f',padding:{x:6,y:4}}).setOrigin(.5);
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
      this.lastCell=cell;drawAtlas($('minimap'),this.map,{explored:this.explored,position:this.hero});
      $('minimap').dataset.explored=String(this.explored.size);$('minimap').dataset.total='3888';$('minimap').dataset.chapter='overworld';$('minimap').setAttribute('aria-label',`Overworld exploration minimap. ${a.id} ${a.name}. Unvisited terrain is hidden.`);
      $('game').setAttribute('aria-label',`Explorable Lanternlands overworld. ${a.id} ${a.name}. Roads connect nine named areas and five vocabulary chamber entrances.`);document.querySelector('.caption-direction').textContent='N ↑ · ATLAS O';
      $('chapter-number').textContent=`OVERWORLD / ${a.id}`;$('chapter-title').textContent=a.name;$('chapter-subtitle').textContent=a.description;
      $('wayfinder').textContent=`${a.id} · ${a.name} · O: atlas · Enter a marked chamber on contact`;$('combat-state').textContent='Peaceful overworld';
    }
    Object.assign($('game').dataset,{area:a.id,overworldX:this.hero.x.toFixed(1),overworldY:this.hero.y.toFixed(1),overworldCameraX:this.cameras.main.scrollX.toFixed(1),overworldExplored:this.explored.size});
  }
}
