// Native 16-pixel artwork; the cutscene also paints on an integer pixel grid.
export const GATE_DURATION=3900;
export function gateFrame(ms){
  const inserted=Math.min(3,Math.max(0,Math.floor((ms-550)/800)+1));
  const phase=ms<800?'key-1':ms<1600?'key-2':ms<2400?'key-3':ms<2800?'unlocking':ms<3500?'opening':'open';
  return {inserted,phase,opening:Math.max(0,Math.min(1,(ms-2800)/700))};
}
export class GateCutscene {
  constructor(scene){
    this.scene=scene;this.dialog=document.getElementById('gate-cutscene');this.canvas=document.getElementById('gate-film');
    this.dialog.addEventListener('cancel',e=>e.preventDefault());
  }
  cancel(){this.tween?.stop();this.tween=null;this.dialog.close();}
  start(done){
    this.cancel();this.phase='';this.draw(0);this.dialog.showModal();this.canvas.focus({preventScroll:true});
    this.tween=this.scene.tweens.addCounter({from:0,to:GATE_DURATION,duration:GATE_DURATION,onUpdate:t=>this.draw(t.getValue()),onComplete:()=>{this.tween=null;this.dialog.close();done();}});
  }
  draw(ms){
    const {inserted,phase,opening}=gateFrame(ms),c=this.canvas.getContext('2d'),image=key=>this.scene.textures.get(key).getSourceImage();
    c.imageSmoothingEnabled=false;c.fillStyle='#122b29';c.fillRect(0,0,128,80);
    // Stone alcove and floor remain deliberately chunky at every display size.
    for(let y=4;y<72;y+=8)for(let x=8;x<120;x+=16){c.fillStyle=(x+y)%3?'#29443c':'#314e42';c.fillRect(x+(y%16?4:0),y,14,6);}
    c.fillStyle='#19332c';c.fillRect(0,64,128,16);
    const x=40,y=12,scale=3,slots=[4,8,11];
    c.drawImage(image('rune-door'),x,y,48,48);
    for(let i=0;i<inserted;i++){c.fillStyle=['#f2cb70','#9ddae0','#d0c3fb'][i];c.fillRect(x+slots[i]*scale,y+7*scale,scale,3*scale);}
    if(ms<2400){
      const i=Math.min(2,Math.floor(ms/800)),t=Math.min(1,(ms-i*800)/550),target=x+slots[i]*scale-12;
      const start=8,kx=Math.round(start+(target-start)*(1-(1-t)**3));
      c.drawImage(image('rune-key'),kx,29,16,16);
    }
    if(phase==='unlocking'){
      c.fillStyle='#ffed9b';for(const [sx,sy]of[[28,18],[96,24],[32,53],[93,48]]){c.fillRect(sx,sy,1,5);c.fillRect(sx-2,sy+2,5,1);}
    }
    if(opening>0){
      // Reveal the lit passage from the center as both leaves slide outwards.
      const w=Math.round(24*opening);c.save();c.beginPath();c.rect(64-w/2,21,w,36);c.clip();c.drawImage(image('rune-door-open'),x,y,48,48);c.restore();
    }
    if(phase==='open')this.scene.doorSprite.setTexture('rune-door-open');
    Object.assign(this.dialog.dataset,{phase,inserted:String(inserted)});
    if(this.phase!==phase){
      this.phase=phase;
      const status=phase.startsWith('key-')?`Inserting key ${phase.at(-1)} of 3…`:phase==='unlocking'?'All three keys are seated. The lock releases…':phase==='opening'?'The door is opening…':'The doorway is open. Continue your adventure.';
      document.getElementById('gate-status').textContent=status;this.canvas.setAttribute('aria-label',status);
    }
  }
}
