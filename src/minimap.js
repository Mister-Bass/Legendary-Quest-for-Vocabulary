import { WORLD } from './world.js';

// Exploration is stored per chamber for this page session, never in external storage.
export class Minimap {
  constructor(scene,explored){
    this.scene=scene;this.explored=explored;this.canvas=document.getElementById('minimap');
    this.ctx=this.canvas.getContext('2d');this.lastCell='';this.lastDraw=-1;
  }
  update(clock,force=false){
    const {hero,room,state}=this.scene,x=Math.floor(hero.x/40),y=Math.floor(hero.y/40),cell=`${x},${y}`;
    if(cell!==this.lastCell){
      for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++)if(Math.hypot(ox,oy)<=3.3&&x+ox>=0&&y+oy>=0&&x+ox<WORLD.columns&&y+oy<WORLD.rows)this.explored.add(`${x+ox},${y+oy}`);
      this.lastCell=cell;force=true;
    }
    if(!force&&clock-this.lastDraw<.1)return;this.lastDraw=clock;
    const c=this.ctx;c.fillStyle='#07110f';c.fillRect(0,0,200,140);
    for(const key of this.explored){
      const [tx,ty]=key.split(',').map(Number);
      c.imageSmoothingEnabled=false;c.drawImage(this.scene.chamberGround,tx*16,ty*16,16,16,tx*5,ty*5,5,5);
      if(room.trees.some(p=>p.x===tx&&p.y===ty)){c.fillStyle='#294c39';c.fillRect(tx*5,ty*5,5,5);}
      if(room.bridge.has(key)){c.fillStyle='#d4b486';c.fillRect(tx*5,ty*5,5,5);}
    }
    const marker=(point,color,size=3)=>{if(!this.explored.has(`${point.x},${point.y}`))return;c.fillStyle=color;c.fillRect(point.x*5+2-size/2,point.y*5+2-size/2,size,size);};
    marker(room.guide,'#efe5c8');marker(room.exit,'#dfb268',4);
    room.seals.forEach((p,i)=>marker(p,state.sealed.has(`${state.chapter}:${i}`)?'#f3cc63':'#8ce6fa',4));
    this.scene.shades.filter(e=>e.active&&Math.hypot(e.sprite.x-hero.x,e.sprite.y-hero.y)<132).forEach(e=>marker({x:Math.floor(e.sprite.x/40),y:Math.floor(e.sprite.y/40)},'#fa8f8f'));
    c.fillStyle='#fff2a5';c.beginPath();c.arc(hero.x/8,hero.y/8,2.5,0,Math.PI*2);c.fill();
    this.canvas.dataset.explored=String(this.explored.size);this.canvas.dataset.total=String(WORLD.columns*WORLD.rows);this.canvas.dataset.chapter=String(state.chapter);
    this.canvas.setAttribute('aria-label',`Chamber ${state.chapter+1} minimap: ${this.explored.size} of ${WORLD.columns*WORLD.rows} tiles explored. Unvisited areas are hidden.`);
  }
}
