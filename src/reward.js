import {ITEMS,ITEM_IDS,rollItem} from './equipment.js';
export class ItemReward{
  constructor(scene){
    this.scene=scene;this.dialog=document.getElementById('item-reward');this.button=document.getElementById('keep-item');
    this.dialog.addEventListener('cancel',e=>e.preventDefault());
    this.button.addEventListener('click',()=>{if(this.button.disabled||!this.done)return;const done=this.done,item=this.item;this.done=null;this.dialog.close();done(item);});
  }
  cancel(){this.tween?.stop();this.tween=null;this.done=null;this.dialog.close();}
  start(done,practice=false){
    this.cancel();this.item=rollItem();this.done=done;this.button.disabled=true;
    document.getElementById('reward-label').textContent=practice?'A02 PRACTICE / JOURNEY ITEM':'THE FIRST DOOR / JOURNEY ITEM';
    document.getElementById('reward-result').textContent='The reels are spinning…';
    document.getElementById('reward-description').textContent='One gift. Yours for the rest of this adventure.';
    this.dialog.dataset.phase='spinning';this.dialog.dataset.item='';this.draw(0);this.dialog.showModal();
    this.tween=this.scene.tweens.addCounter({from:0,to:2800,duration:2800,onUpdate:t=>this.draw(t.getValue()),onComplete:()=>{
      this.tween=null;this.draw(2800);this.dialog.dataset.phase='ready';this.dialog.dataset.item=this.item;
      document.getElementById('reward-result').textContent=`You received the ${ITEMS[this.item].name}!`;
      document.getElementById('reward-description').textContent=ITEMS[this.item].hint+' Keep it through every remaining chamber and checkpoint. Restart begins a new run.';
      this.button.disabled=false;this.button.focus({preventScroll:true});
    }});
  }
  draw(ms){
    const target=ITEM_IDS.indexOf(this.item);
    document.querySelectorAll('.reward-reel').forEach((reel,i)=>{
      const stop=1700+i*550,t=Math.min(1,ms/stop),turns=12+i*4+((target-i*3)%4+4)%4,travel=turns*(1-(1-t)**3);
      const index=ms>=stop?target:(Math.floor(travel)+i*3)%4,key=ITEM_IDS[index],offset=ms>=stop?0:-Math.floor(travel%1*32);
      const c=reel.querySelector('canvas').getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,32,32);
      c.drawImage(this.scene.textures.get('effect-'+key).getSourceImage(),0,offset,32,32);
      if(offset)c.drawImage(this.scene.textures.get('effect-'+ITEM_IDS[(index+1)%4]).getSourceImage(),0,offset+32,32,32);
      reel.querySelector('span').textContent=ITEMS[key].name;reel.classList.toggle('reel-stopped',ms>=stop);
    });
  }
}
