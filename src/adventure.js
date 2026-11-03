import { portalReady,portalTexture } from './portal-art.js';
import Phaser from 'phaser';
import { chapters, chapterTrials, vocabulary, makeQuestion } from './lesson.js';
import { WORLD, makeRoom } from './world.js';
import { ActionWorld } from './action-world.js';
import { preloadArt, createArt, paintWorld } from './art.js';
import { Atlas } from './atlas.js';
import { OverworldScene } from './overworld-scene.js';
import { GateCutscene } from './gate.js';
import { MarshWorld } from './marsh-world.js';
import { marshProgress } from './marsh-map.js';
import './adventure.css';

const $ = id => document.getElementById(id);
const objects = ['The Root Seal', 'The Echo Seal', 'The Lantern Seal'];
const tilePosition = ({x,y}) => ({x:x*40+20,y:y*40+20});

class Adventure extends Phaser.Scene {
  constructor() { super('Adventure'); }
  preload() { preloadArt(this); }
  create() {
    createArt(this);
    this.marshProgress=marshProgress();
    this.startChapter=new URLSearchParams(location.search).get('area')==='A02'?1:0;
    this.gateCutscene=new GateCutscene(this);
    // Camera follow updates during rendering, after the simulation telemetry.
    this.renderedCameraMetadata=()=>{if(this.room?.marsh&&!this.scene.isActive('Overworld')){const c=this.cameras.main;Object.assign($('game').dataset,{cameraX:c.scrollX.toFixed(1),cameraY:c.scrollY.toFixed(1)});}};
    this.events.on(Phaser.Scenes.Events.RENDER,this.renderedCameraMetadata);
    this.events.once('shutdown',()=>this.events.off(Phaser.Scenes.Events.RENDER,this.renderedCameraMetadata));
    this.exploration=new Map();this.unlocked=this.startChapter;this.overworldExplored=new Set();this.overworldPosition=null;
    this.state = { mode:'title', chapter:this.startChapter, ...makeRoom(this.startChapter,5).spawn, hearts:5, score:0, learned:new Set(), sealed:new Set() };
    this.loadRoom();
    this.atlas=new Atlas(this);
    this.keyHandler = event => {
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      if (event.target instanceof HTMLButtonElement && ['Enter',' '].includes(key)) return;
      const action={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',e:'interact',' ':'attack',q:'shield',Shift:'roll',f:'throw',b:'bomb',r:'restart',Enter:'start',Escape:'close',m:'journal',o:'atlas'}[key];
      if(this.state.mode==='puzzle'&&['1','2','3','4'].includes(key)) {event.preventDefault();this.answer(Number(key)-1);return;}
      if(action) {
        event.preventDefault();
        if(this.state.mode==='overworld'&&['up','down','left','right','interact'].includes(action)){if(!event.repeat)this.pressOverworld(action,event.code);return;}
        if(['up','down','left','right','attack','shield','roll','throw','bomb'].includes(action)) {if(this.state.mode==='playing'&&!event.repeat){if(action==='attack'){this.action.mouseAim=null;}this.action.press(action,event.code);}}
        else if(!event.repeat)this.act(action);
      }
    };
    window.addEventListener('keydown',this.keyHandler);
    this.keyUp=event=>{this.action.release(event.code);this.overworldInput?.delete(event.code);if(this.scene.isActive('Overworld'))this.scene.get('Overworld').release(event.code);};this.unfocus=()=>{this.action.stop();this.overworldInput?.clear();this.overworldTaps?.clear();if(this.scene.isActive('Overworld'))this.scene.get('Overworld').stop();};
    window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.unfocus);
    this.visibility=()=>{if(document.hidden)this.unfocus();};document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{window.removeEventListener('keydown',this.keyHandler);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.unfocus);document.removeEventListener('visibilitychange',this.visibility);});
    const canvas=this.game.canvas;
    const point=event=>{const r=canvas.getBoundingClientRect();return this.cameras.main.getWorldPoint((event.clientX-r.left)*WORLD.viewportWidth/r.width,(event.clientY-r.top)*WORLD.viewportHeight/r.height);};
    this.mouseDown=event=>{
      if(this.state.mode!=='playing'||(event.button!==0&&!(event.button===2&&this.room.marsh)))return;
      event.preventDefault();const at=point(event);this.action.aim(at.x,at.y);this.action.mouseAim=at;
      canvas.setPointerCapture(event.pointerId);this.action.press(event.button===2?'shield':'attack',`mouse:${event.pointerId}`);
    };
    this.mouseMove=event=>{if(this.state.mode==='playing'&&(event.buttons===1||this.room.marsh)){const p=point(event);this.action.mouseAim=p;if(this.room.marsh)this.action.aim(p.x,p.y);}};
    this.mouseUp=event=>{this.action.release(`mouse:${event.pointerId}`);this.action.mouseAim=null;};
    this.contextMenu=event=>event.preventDefault();
    canvas.addEventListener('pointerdown',this.mouseDown);canvas.addEventListener('pointermove',this.mouseMove);canvas.addEventListener('pointerup',this.mouseUp);canvas.addEventListener('pointercancel',this.mouseUp);canvas.addEventListener('contextmenu',this.contextMenu);
    this.events.once('shutdown',()=>{canvas.removeEventListener('pointerdown',this.mouseDown);canvas.removeEventListener('pointermove',this.mouseMove);canvas.removeEventListener('pointerup',this.mouseUp);canvas.removeEventListener('pointercancel',this.mouseUp);canvas.removeEventListener('contextmenu',this.contextMenu);});
    $('play').addEventListener('click',()=>this.act('start'));
    $('restart').addEventListener('click',()=>this.act('restart'));
    document.querySelector('.arena').append($('marsh-controls'));
    const mapButton=document.createElement('button');mapButton.textContent='Marsh map';mapButton.addEventListener('click',()=>{if(this.state.mode!=='playing')return;this.state.mode='marsh-map';this.render();const c=$('marsh-layout').getContext('2d');c.drawImage(this.textures.get('marsh-preview').getSourceImage(),0,0);c.drawImage(this.textures.get(portalTexture(this.marshProgress.lit,this.action.clock)).getSourceImage(),480,32,64,64);$('marsh-map').showModal();});$('marsh-controls').prepend(mapButton);
    $('close-marsh-map').addEventListener('click',()=>this.act('close'));$('marsh-map').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    $('close-puzzle').addEventListener('click',()=>this.act('close'));
    $('puzzle').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    $('journal-toggle').addEventListener('click',()=>this.act('journal'));
    $('close-journal').addEventListener('click',()=>this.act('close'));
    $('journal').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    document.querySelectorAll('[data-action]').forEach(button=>{
      const action=button.dataset.action,continuous=['up','down','left','right','attack','shield'].includes(action);
      if(continuous){
        button.addEventListener('pointerdown',event=>{if(this.state.mode==='overworld'){button.setPointerCapture(event.pointerId);this.pressOverworld(action,`pointer:${event.pointerId}`);return;}if(this.state.mode!=='playing')return;if(action==='attack'){this.action.mouseAim=null;}button.setPointerCapture(event.pointerId);this.action.press(action,`pointer:${event.pointerId}`);});
        for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{this.action.release(`pointer:${event.pointerId}`);this.overworldInput?.delete(`pointer:${event.pointerId}`);if(this.scene.isActive('Overworld'))this.scene.get('Overworld').release(`pointer:${event.pointerId}`);});
      }
      button.addEventListener('click',event=>{if(!continuous||event.detail===0)this.act(action);button.blur();});
    });
    this.feedback('A forgotten archive. Forty-five words. One way home.');
    this.render();
  }
  loadRoom() {
    if(this.worldLayer) {this.tweens.killAll();this.time.removeAllEvents();this.worldLayer.removeAll(true);this.floatingQuestion=null;}
    this.worldLayer=this.add.container();
    const before=new Set(this.children.list);
    this.room=makeRoom(this.state.chapter,chapters.length);
    if(this.room.marsh&&this.marshProgress.bossAwakened&&!this.marshProgress.bossDefeated&&this.state.y>=28.5)Object.assign(this.state,this.room.arenaSpawn);
    paintWorld(this,this.room,this.state.chapter);
    this.stationSprites=this.room.seals.map((point,index)=>{
      const {x,y}=tilePosition(point);
      const lit=this.state.sealed.has(`${this.state.chapter}:${index}`);
      const sprite=this.room.marsh?this.add.sprite(x,y-2,lit?'marsh-lantern-lit':'marsh-lantern').setDisplaySize(80,80).setOrigin(.5,.875):this.add.sprite(x,y-2,'chest').setDisplaySize(40,40).setFrame(lit?3:0);
      this.add.text(x,y+25,['I','II','III'][index],{fontFamily:'Georgia',fontSize:14,color:'#e8d7a6'}).setOrigin(.5);
      return sprite;
    });
    const guide=tilePosition(this.room.guide);
    this.keeper=this.add.sprite(guide.x,guide.y,'guide').setDisplaySize(80,80).setOrigin(.5,.65).play('keeper-dance');
    this.add.text(guide.x,guide.y-48,'KEEPER',{fontFamily:'Arial',fontSize:8,color:'#e9d49b',letterSpacing:1}).setOrigin(.5);
    this.shades=this.room.marsh?[]:this.room.shades.map(point=>{
      const at=tilePosition(point);
      return {...point,active:true,sprite:this.add.sprite(at.x,at.y,'slime').setDisplaySize(80,80).play('slime-idle')};
    });
    const hero=tilePosition(this.state);
    this.facing='down';
    this.hero=this.add.sprite(hero.x,hero.y,'player').setDisplaySize(120,120).setOrigin(.5,2/3).setDepth(20).play('hero-idle-down');
    this.action=this.room.marsh?new MarshWorld(this):new ActionWorld(this);
    const added=this.children.list.filter(item=>!before.has(item));
    this.worldLayer.add(added);
    this.worldLayer.setDepth(1);
    this.drawGate();
  }
  feedback(message) {$('feedback').textContent=message;}
  update(time,delta){if(!this.scene.isActive('Overworld'))this.action?.update(delta);}
  roomComplete(chapter){return [0,1,2].every(i=>this.state.sealed.has(`${chapter}:${i}`))&&(chapter!==1||portalReady(this.marshProgress.lit));}
  pressOverworld(action,id){
    if(['up','down','left','right'].includes(action)){this.overworldInput?.set(id,action);this.overworldTaps?.set(action,this.overworldClock+.08);}
    else if(action==='interact'&&this.scene.isActive('Overworld'))this.scene.get('Overworld').enter();
  }
  openOverworld(){
    if(!['playing','overworld'].includes(this.state.mode))return;
    if(this.state.mode==='overworld')return;
    if(this.room.marsh&&this.action.model.gateClosed){this.feedback('The arena is sealed. Defeat Grandfather Croak before leaving the marsh.');return;}
    this.action.stop();this.overworldInput=new Map();this.overworldTaps=new Map();this.overworldClock=0;this.state.mode='overworld';this.render();
    this.scene.launch('Overworld',{adventure:this});
    this.feedback('Explore nine regions. Touch a chamber entrance to enter. O opens the labeled atlas; Return to quest resumes your chamber.');
  }
  returnFromOverworld(chapter=this.state.chapter){
    if(chapter>this.unlocked)return;
    this.overworldInput?.clear();this.scene.stop('Overworld');this.state.mode='playing';
    if(chapter!==this.state.chapter){this.state.chapter=chapter;Object.assign(this.state,makeRoom(chapter,5).spawn);this.loadRoom();}
    this.action.stop();this.action.invulnerableUntil=Math.max(this.action.invulnerableUntil,this.action.clock+1.2);this.action.minimap.lastCell='';this.action.minimap.update(this.action.clock,true);
    this.feedback('Back in the archive. Your learned words, keys, score, and hearts are preserved.');this.render();
  }
  near(point){return Math.hypot(this.state.x-point.x,this.state.y-point.y)<1.65;}
  roomKeys() {return [0,1,2].filter(i=>this.state.sealed.has(`${this.state.chapter}:${i}`)).length;}
  drawGate() {
    this.doorSprite.setTexture(this.room.marsh?portalTexture(this.marshProgress.lit,this.action?.clock||0):'rune-door');
    document.getElementById('game').dataset.portalOpen=String(!!this.room.marsh&&portalReady(this.marshProgress.lit));
    document.getElementById('game').dataset.doorReady=String(this.roomKeys()===3&&(!this.room.marsh||portalReady(this.marshProgress.lit)));
  }
  reset() {
    this.gateCutscene.cancel();
    $('marsh-map').close();
    this.marshProgress=marshProgress();
    $('puzzle').close();$('journal').close();$('atlas').close();this.scene.stop('Overworld');
    this.exploration=new Map();this.unlocked=this.startChapter;this.overworldExplored=new Set();this.overworldPosition=null;
    this.state={mode:'playing',chapter:this.startChapter,...makeRoom(this.startChapter,5).spawn,hearts:5,score:0,learned:new Set(),sealed:new Set()};
    this.loadRoom();this.feedback(this.room.marsh?'Find a pale Gloamwisp, collect its flame, and carry it to a guardian lantern. Open Marsh map to plan your route.':'Walk into a treasure chest to begin its vocabulary trial.');
    $('play').blur();$('restart').blur();
  }
  act(action) {
    const s=this.state;
    if(action==='atlas'){this.atlas.toggle();return;}
    if(action==='close'&&s.mode==='atlas'){this.atlas.close();return;}
    if(action==='interact'&&s.mode==='overworld'){this.pressOverworld('interact','button');return;}
    if(action==='restart')this.reset();
    else if(action==='start'&&['title','lost','won'].includes(s.mode)) {
      if(s.mode==='lost') {s.mode='playing';s.hearts=5;Object.assign(s,this.room.spawn);this.loadRoom();this.feedback('The Keeper restores your courage at the entrance. Completed seals and learned words are kept.');}
      else this.reset();
      $('play').blur();
    } else if(action==='close') {
      if(s.mode==='marsh-map'){$('marsh-map').close();document.activeElement?.blur();s.mode='playing';this.action.invulnerableUntil=Math.max(this.action.invulnerableUntil,this.action.clock+1.2);}
      const reading=['puzzle','guide','journal'].includes(s.mode);
      if(s.mode==='puzzle'||s.mode==='guide'){$('puzzle').close();s.mode='playing';}
      if(s.mode==='journal'){$('journal').close();s.mode=this.journalReturn;}
      if(reading&&s.mode==='playing')this.action.invulnerableUntil=Math.max(this.action.invulnerableUntil,this.action.clock+1.2);
    } else if(action==='journal'&&['playing','overworld','journal'].includes(s.mode)) {
      if(s.mode==='journal')this.act('close');
      else {this.journalReturn=s.mode;s.mode='journal';this.renderJournal();$('journal').showModal();}
    } else if(s.mode==='playing') {
      if(['up','down','left','right'].includes(action)){this.action.press(action,'tap');this.action.release('tap');}
      else if(action==='interact')this.interact();
      else if(action==='attack'){this.action.mouseAim=null;this.action.attack();}
      else if(this.room.marsh&&['roll','throw','bomb'].includes(action)){this.action.model[action==='throw'?'throwItem':action==='bomb'?'throwItem':'roll'](action==='bomb');}
    }
    this.render();
  }
  nearbyHint() {
    if(this.room.marsh)return this.roomKeys()===3?('The northern portal is open. Enter it to continue.'):'Light both bank lanterns, defeat Croak, and carry the released final Gloamwisp’s flame to the island lantern.';
    if(this.near(this.room.exit))return this.roomKeys()===3?'All three keys are ready. Touch the door or press E to unlock it.':'The door has three empty key slots. Restore all three seals to earn its keys.';
    const index=this.room.seals.findIndex(p=>this.near(p));
    if(index>=0)return this.state.sealed.has(`${this.state.chapter}:${index}`)?'This seal is restored. Its words are in your journal.':`${objects[index]} is within reach. Walk into its chest to begin, or press E.`;
    if(this.near(this.room.guide))return 'The Keeper has advice. Walk into the Keeper to speak.';
    return 'Explore the chamber. Restore three seals to open the eastern gate.';
  }
  interact() {
    const s=this.state;
    if(this.room.marsh&&this.action.interact())return;
    if(this.near(this.room.exit)) {
      if(this.roomKeys()<3){
        if(this.room.marsh){
          s.mode='guide';this.action.stop();
          $('puzzle-label').textContent='THE LANTERN PORTAL';$('puzzle-title').textContent='Three lights will open the way';
          $('puzzle-prompt').textContent='Light all three guardian lanterns to awaken this portal. Gather Wisp Flames to kindle the northwest, northeast, and island lanterns, then complete each lantern’s vocabulary trial. Return here when all three flames are burning.';
          $('puzzle-progress').textContent=`${this.roomKeys()} of 3 guardian lanterns lit`;
          $('answers').replaceChildren();$('puzzle-feedback').textContent='Open the Marsh map to find the three lanterns.';
          $('puzzle').showModal();this.render();return;
        }
        this.feedback('The gate is locked. Restore all three seals to earn its keys.');return;
      }
      if(s.mode!=='playing')return;
      s.mode='gate-opening';this.action.stop();this.feedback(this.room.marsh?'The three lanterns power the portal. Stepping through…':'Three keys. Three locks. The way forward awakens.');this.render();
      this.gateCutscene.start(()=>{
        if(this.state!==s||s.mode!=='gate-opening')return;
        if(s.chapter===chapters.length-1){s.mode='won';this.feedback('The archive remembers. You have mastered all 45 words.');this.render();return;}
        s.chapter++;s.mode='playing';const firstVisit=s.chapter>this.unlocked;this.unlocked=Math.max(this.unlocked,s.chapter);Object.assign(s,makeRoom(s.chapter,5).spawn);if(firstVisit)s.hearts=Math.min(5,s.hearts+1);
        this.loadRoom();this.feedback(this.room.marsh?'Lantern Marsh: carry a Gloamwisp’s flame to the three guardian lanterns. Open Marsh map and speak to the Keeper for help.':firstVisit?'A new chamber opens. One heart restored. Find its three seals.':'You return to an unlocked chamber. Your completed seals are preserved.');this.render();
      });return;
    }
    const index=this.room.seals.findIndex(point=>this.near(point));
    if(index>=0){this.openTrial(index);return;}
    if(this.near(this.room.guide)) {
      s.mode='guide';$('puzzle-label').textContent='THE KEEPER';$('puzzle-title').textContent='Words open what swords cannot.';
      $('puzzle-prompt').textContent=this.room.marsh?'Corner a pale Gloamwisp and strike it, or throw a stone with F. Pick up its Wisp Flame and carry it to a lantern within 10 seconds. Answer the lantern’s vocabulary questions to finish lighting it. Circle the pond for the corner lanterns; take the winding lily-pad route to the island lantern. Pads sink two seconds after you step on them and regrow after four seconds. Mud slows you. Hold Q or right-click toward mud balls to shield, and use Shift to roll. Lighting both bank lanterns wakes Grandfather Croak and raises a gate across the southern entrance. The Heart Piece chest is optional. Defeat Croak to release the final Gloamwisp. Use its flame for the island lantern, which opens the northern portal. To defeat Croak: throw a stone (F) or bomb (B) while its tongue is extended, then strike its stunned belly. Awake Croak shortens pad time to 0.9 seconds. Reading pauses all timers. Light both bank lanterns, defeat Croak, use the final Gloamwisp’s flame for the island lantern, then touch the northern portal or press E beside it to travel onward.': 'Walk into chests, the Keeper, and gates to interact. Use 1–4 or the answer buttons in trials. Wrong answers cost a heart and reveal a hint. Hold arrows or WASD to move. Left-click inside the world or press Space to draw and swing your sword. There is no shield. Slimes take three sword hits. Their final hit releases a death burst: stand outside the red ring to avoid losing one heart. Slimes flash violet before firing; step aside to dodge their slime bolts. A stone bridge crosses the first pond from south to north. Combat pauses while you read. The bottom-right minimap reveals places you explore. Open the overworld atlas with O to explore nine named regions and find chamber entrances. After three keys, walk into the eastern gate.';
      $('answers').replaceChildren();$('puzzle-feedback').textContent='Your journal (M) keeps every word you learn.';$('puzzle-progress').textContent=chapters[s.chapter].name;$('puzzle').showModal();return;
    }
    this.feedback(this.room.marsh?'Touch lanterns, the Heart Piece chest, the Keeper, or the northern portal to interact. E also works nearby.':'Walk into a chest, the Keeper, or the gate to interact. E also works beside them.');
  }
  openTrial(index) {
    const s=this.state;
    if(s.sealed.has(`${s.chapter}:${index}`)){this.feedback('This seal is already restored. Continue to another seal or the gate.');return;}
    if(s.mode==='opening')return;
    this.activeTrial=index;this.trialFeedback='';s.mode='opening';this.renderPuzzle();
    const chest=this.stationSprites[index];if(!this.room.marsh)chest.clearTint().play('chest-open');
    this.feedback(this.room.marsh?'The Wisp Flame kindles the guardian lantern. Its vocabulary trial rises…':'The chest opens. A vocabulary question rises from within…');
    const text=this.add.text(chest.x,chest.y-12,this.question.prompt,{fontFamily:'Georgia',fontSize:12,color:'#fff4cf',backgroundColor:'#21372f',padding:{x:10,y:8},wordWrap:{width:205},align:'center'}).setOrigin(.5,1).setDepth(100).setAlpha(0);
    this.worldLayer.add(text);this.floatingQuestion=text;this.render();
    this.tweens.add({targets:text,y:chest.y-65,alpha:1,delay:280,duration:700,ease:'Cubic.easeOut',onComplete:()=>{
      this.time.delayedCall(500,()=>{text.destroy();this.floatingQuestion=null;if(this.state!==s||s.mode!=='opening')return;s.mode='puzzle';$('puzzle').showModal();this.render();});
    }});
  }
  hurt(message) {
    this.state.hearts--;this.feedback(message);
    if(this.state.hearts<=0){this.state.mode='lost';$('puzzle').close();}
  }
  trialTerms() {return chapterTrials(this.state.chapter)[this.activeTrial];}
  currentId() {return this.trialTerms().find(id=>!this.state.learned.has(id));}
  renderPuzzle() {
    const ids=this.trialTerms(),id=this.currentId();
    this.question=makeQuestion(id);
    $('puzzle-label').textContent=`RUNE TRIAL / ${this.question.type.toUpperCase()}`;
    $('puzzle-title').textContent=this.room.marsh?['Northwest Guardian','Northeast Guardian','Island Guardian'][this.activeTrial]:objects[this.activeTrial];
    $('puzzle-prompt').textContent=this.question.prompt;
    $('puzzle-progress').textContent=`Word ${ids.indexOf(id)+1} of ${ids.length} · ${chapters[this.state.chapter].name}`;
    $('answers').replaceChildren(...this.question.options.map((option,index)=>{
      const button=document.createElement('button');button.type='button';
      const number=document.createElement('span');number.className='answer-number';number.textContent=index+1;
      const label=document.createElement('span');label.textContent=option.text;
      button.append(number,label);button.addEventListener('click',()=>this.answer(index));return button;
    }));
    $('puzzle-feedback').textContent=this.trialFeedback||'Choose carefully. A wrong answer costs one heart.';
    $('puzzle-feedback').classList.remove('incorrect');
  }
  answer(index) {
    if(this.state.mode!=='puzzle'||!this.question.options[index])return;
    const id=this.currentId();
    if(this.question.options[index].id!==id) {
      this.hurt('A wrong answer costs one heart. Read the hint and try again.');
      $('puzzle-feedback').textContent=`Not quite. ${this.question.explanation} Try again.`;
      $('puzzle-feedback').classList.add('incorrect');
      this.render();return;
    }
    this.state.learned.add(id);this.state.score+=25;
    this.trialFeedback=`Correct! ${this.question.explanation} +25 insight.`;
    if(this.currentId()===undefined) {
      this.state.sealed.add(`${this.state.chapter}:${this.activeTrial}`);
      if(this.room.marsh){this.action.model.light(this.activeTrial);this.stationSprites[this.activeTrial].setTexture('marsh-lantern-lit');}
      else this.stationSprites[this.activeTrial].stop().setFrame(3).setTint(0xffe6a0);this.drawGate();
      this.state.mode='playing';$('puzzle').close();this.action.invulnerableUntil=Math.max(this.action.invulnerableUntil,this.action.clock+1.2);
      this.feedback(this.room.marsh?`Guardian lantern ${this.roomKeys()} of 3 is lit! ${this.question.explanation}`:`${objects[this.activeTrial]} restored! Rune key ${this.roomKeys()} of 3 earned. ${this.question.explanation}`);
    } else this.renderPuzzle();
    this.render();
  }
  renderJournal() {
    $('journal-count').textContent=`${this.state.learned.size} / 45 terms recovered`;
    const entries=vocabulary.filter(entry=>this.state.learned.has(entry.id));
    $('journal-entries').replaceChildren(...entries.map(entry=>{
      const row=document.createElement('article'),title=document.createElement('h3'),definition=document.createElement('p');
      title.textContent=entry.term;definition.textContent=entry.definition;row.append(title,definition);return row;
    }));
    if(!entries.length)$('journal-entries').textContent='Your journal is waiting for its first word. Visit a rune seal to begin.';
  }
  render() {
    const s=this.state;
    if(s.mode!=='playing')this.action.stop();
    if(s.mode!=='overworld'){this.overworldInput?.clear();this.overworldTaps?.clear();}
    $('hearts').textContent='♥'.repeat(Math.max(0,s.hearts))+'♡'.repeat(5-Math.max(0,s.hearts));
    $('hearts').setAttribute('aria-label',`${s.hearts} of 5 hearts`);
    $('score').textContent=s.score;$('word-count').textContent=`${s.learned.size} / 45`;
    $('key-count').textContent=`${this.roomKeys()} / 3`;
    $('key-count').nextElementSibling.textContent=this.room.marsh?'GUARDIAN LANTERNS':'RUNE KEYS';
    $('chapter-number').textContent=`CHAMBER ${s.chapter+1} / 5`;
    $('chapter-title').textContent=chapters[s.chapter].name;$('chapter-subtitle').textContent=chapters[s.chapter].subtitle;
    $('marsh-controls').hidden=!this.room.marsh;
    $('objective').textContent=this.roomKeys()===3?(s.chapter===4?'Enter the eastern gate and restore the archive.':'Enter the eastern gate to reach the next chamber.'):'Restore the three rune seals to unlock the eastern gate.';
    if(this.room.marsh)$('objective').textContent=this.roomKeys()===3?'The northern portal is open. Enter it to continue.':'Light the two bank lanterns to awaken Croak. Defeat him, then use the final Gloamwisp’s flame for the island lantern.';
    $('seal-list').replaceChildren(...[0,1,2].map(index=>{
      const item=document.createElement('li'),solved=s.sealed.has(`${s.chapter}:${index}`);
      item.className=solved?'complete':'';item.textContent=`${solved?'✦':'◇'} ${this.room.marsh?['Northwest lantern','Northeast lantern','Island lantern'][index]:objects[index]}${solved?' · restored':''}`;return item;
    }));
    $('map-list').replaceChildren(...chapters.map((chapter,index)=>{
      const item=document.createElement('li');item.textContent=`${index<s.chapter?'✓':index===s.chapter?'→':'·'} ${chapter.name}`;item.className=index===s.chapter?'current':'';return item;
    }));
    const overlay=['title','won','lost'].includes(s.mode);$('overlay').hidden=!overlay;
    if(overlay) {
      $('screen-label').textContent=s.mode==='won'?'LEVEL 1 COMPLETE':s.mode==='lost'?'THE LANTERN FADES':'A NEW CHAPTER AWAITS';
      $('screen-title').textContent=s.mode==='won'?'The archive remembers.':s.mode==='lost'?'Even heroes need another try.':'Every word is a key.';
      $('screen-copy').textContent=s.mode==='won'?`All 45 words recovered. Five chambers restored. ${s.score} insight earned. Your knowledge has brought the archive back to life.`:s.mode==='lost'?'The Keeper can restore your hearts. Your learned words and completed seals will remain. Take a breath, then return to the adventure.':'Carry your lantern into a forgotten archive. Decode its inscriptions, outwit its illusions, and recover 45 words about life in the digital world.';
      $('play').textContent=s.mode==='won'?'Begin again ↗':s.mode==='lost'?'Return to chamber ↗':'Begin adventure ↗';
      if(this.startChapter===1){$('screen-label').textContent=s.mode==='title'?'AREA A02 · PRACTICE RUN':$('screen-label').textContent;if(s.mode==='title'){$('screen-title').textContent='Lantern Marsh';$('screen-copy').textContent='Practice the marsh directly. Carry Wisp Flames, cross sinking lily pads, and restore three guardian lanterns. This run begins at A02; use the normal game URL for the full 45-word adventure.';}if(s.mode==='won')$('screen-copy').textContent=`Practice run complete. ${s.learned.size} words recovered and ${s.score} insight earned. Play from the normal URL to include the opening chapter.`;}
    }
    Object.assign($('game').dataset,{marsh:String(!!this.room.marsh),artArea:this.room.areaId,ready:'true',trees:this.room.trees.length,mode:s.mode,chapter:s.chapter,learned:s.learned.size,keys:this.roomKeys(),quizId:s.mode==='puzzle'?this.currentId():'',shades:this.shades.filter(shade=>shade.active).length,questionFloating:String(!!this.floatingQuestion),chests:JSON.stringify(this.stationSprites.map(c=>({frame:c.frame.name,animation:c.anims.currentAnim?.key})))});
    document.querySelector('.caption-direction').textContent=this.room.marsh?'PORTAL ↑ NORTH':'EAST →';
    document.querySelector('.level-badge').textContent=this.startChapter===1?'AREA PRACTICE':'LEVEL 01';
    $('game').setAttribute('aria-label',this.room.marsh?'Lantern Marsh: a central pond, sinking lily pads, three guardian lanterns, a Heart Piece chest, marsh enemies, and a northern lantern portal':'Top-down archive chamber with a traveler, Keeper, three treasure chests, slimes, and an eastern gate');
    $('overworld-toggle').disabled=!['playing','atlas','overworld'].includes(s.mode);
    if(!this.scene.isActive('Overworld'))this.action.telemetry();
    else if(s.mode==='overworld')this.scene.get('Overworld').refresh(true);
  }
}

new Phaser.Game({type:Phaser.AUTO,parent:'game',width:WORLD.viewportWidth,height:WORLD.viewportHeight,backgroundColor:'#233d36',pixelArt:true,roundPixels:true,fps:{smoothStep:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Adventure,OverworldScene]});
