import { areas, areaAt, entranceFor, makeOverworld, drawAtlas } from './overworld.js';
const $=id=>document.getElementById(id);

export class Atlas {
  constructor(adventure){
    this.adventure=adventure;this.map=makeOverworld();this.selected='A07';
    this.art=Object.fromEntries(['grass','terrain','water','puny','topdown','tree1','tree2','tree3','tree4'].map(key=>[key,adventure.textures.get(key).getSourceImage()]));
    $('overworld-toggle').addEventListener('click',()=>this.toggle());
    $('close-atlas').addEventListener('click',()=>this.close());
    $('atlas').addEventListener('cancel',event=>{event.preventDefault();this.close();});
    $('explore-overworld').addEventListener('click',()=>{this.close();adventure.openOverworld();});
    $('return-to-quest').addEventListener('click',()=>{this.close();if(adventure.state.mode==='overworld')adventure.returnFromOverworld();});
    $('area-buttons').replaceChildren(...areas.map(a=>{
      const button=document.createElement('button');button.type='button';button.dataset.area=a.id;
      button.textContent=`${a.id} · ${a.name}`;button.addEventListener('click',()=>this.select(a.id));return button;
    }));
  }
  toggle(){
    if(this.adventure.state.mode==='atlas'){this.close();return;}
    if(!['playing','overworld'].includes(this.adventure.state.mode))return;
    const a=this.adventure;this.returnMode=a.state.mode;a.action.stop();
    if(this.returnMode==='overworld'&&a.scene.isActive('Overworld'))a.scene.get('Overworld').stop();
    a.state.mode='atlas';a.render();
    const p=a.overworldPosition,current=this.returnMode==='overworld'&&p?areaAt(p.x/40,p.y/40):entranceFor(a.state.chapter);
    $('atlas-location').textContent=`Current location: ${current.id} · ${current.name}${this.returnMode==='playing'?' / vocabulary chamber':''}.`;
    this.select(current.id);$('atlas').showModal();
  }
  select(id){
    this.selected=id;const a=areas.find(a=>a.id===id),chapter=a.chapter;
    drawAtlas($('atlas-map'),this.map,{selected:id,position:this.adventure.overworldPosition,art:this.art});
    $('area-title').textContent=`${a.id} · ${a.name}`;
    $('area-description').textContent=`${a.description} Landmark: ${a.landmark}. 16×16 scenery: ${a.style.detail}.`;
    $('area-status').textContent=chapter===undefined?'Exploration area · available now':this.adventure.roomComplete(chapter)?'Vocabulary chamber restored':chapter<=this.adventure.unlocked?'Vocabulary chamber available':'Vocabulary chamber locked · finish the preceding chambers';
    $('area-request').textContent=`To edit this area, tell me: “In ${a.id} (${a.name}), change … Keep the existing assets.”`;
    for(const b of $('area-buttons').children)b.setAttribute('aria-pressed',String(b.dataset.area===id));
    $('atlas').dataset.selected=id;
  }
  close(){
    if(this.adventure.state.mode!=='atlas')return;
    $('atlas').close();const a=this.adventure;a.state.mode=this.returnMode;
    if(a.state.mode==='playing')a.action.invulnerableUntil=Math.max(a.action.invulnerableUntil,a.action.clock+1.2);
    a.render();
    if(a.state.mode==='playing')a.action.minimap.update(a.action.clock,true);
    else if(a.state.mode==='overworld'&&a.scene.isActive('Overworld'))a.scene.get('Overworld').refresh(true);
  }
}
