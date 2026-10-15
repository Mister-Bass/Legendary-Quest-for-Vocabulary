import Phaser from 'phaser';
import { chapters, chapterTrials, vocabulary, makeQuestion } from './lesson.js';
import { WORLD, makeRoom } from './world.js';
import { ActionWorld } from './action-world.js';
import { preloadArt, createArt, paintWorld } from './art.js';
import './adventure.css';

const $ = id => document.getElementById(id);
const objects = ['The Root Seal', 'The Echo Seal', 'The Lantern Seal'];
const tilePosition = ({x,y}) => ({x:x*40+20,y:y*40+20});

class Adventure extends Phaser.Scene {
  constructor() { super('Adventure'); }
  preload() { preloadArt(this); }
  create() {
    createArt(this);
    this.exploration=new Map();
    this.state = { mode:'title', chapter:0, ...makeRoom(0,5).spawn, hearts:5, score:0, learned:new Set(), sealed:new Set() };
    this.loadRoom();
    this.keyHandler = event => {
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      if (event.target instanceof HTMLButtonElement && ['Enter',' '].includes(key)) return;
      const action={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',e:'interact',' ':'attack',k:'shield',Shift:'shield',r:'restart',Enter:'start',Escape:'close',m:'journal'}[key];
      if(this.state.mode==='puzzle'&&['1','2','3','4'].includes(key)) {event.preventDefault();this.answer(Number(key)-1);return;}
      if(action) {
        event.preventDefault();
        if(['up','down','left','right','attack','shield'].includes(action)) {if(this.state.mode==='playing'&&!event.repeat){if(action==='attack')this.action.touchShield=false;this.action.press(action,event.code);}}
        else if(!event.repeat)this.act(action);
      }
    };
    window.addEventListener('keydown',this.keyHandler);
    this.keyUp=event=>this.action.release(event.code);this.unfocus=()=>this.action.stop();
    window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.unfocus);
    this.visibility=()=>{if(document.hidden)this.unfocus();};document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{window.removeEventListener('keydown',this.keyHandler);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.unfocus);document.removeEventListener('visibilitychange',this.visibility);});
    const canvas=this.game.canvas;
    const point=event=>{const r=canvas.getBoundingClientRect();return this.cameras.main.getWorldPoint((event.clientX-r.left)*WORLD.viewportWidth/r.width,(event.clientY-r.top)*WORLD.viewportHeight/r.height);};
    this.mouseDown=event=>{
      if(this.state.mode!=='playing'||![0,2].includes(event.button))return;
      event.preventDefault();const at=point(event);this.action.aim(at.x,at.y);this.action.mouseAim=at;
      if(event.button===2){this.action.touchShield=!this.action.touchShield;if(!this.action.touchShield)this.action.mouseAim=null;}
      else{this.action.touchShield=false;canvas.setPointerCapture(event.pointerId);this.action.press('attack',`mouse:${event.pointerId}`);}
    };
    this.mouseMove=event=>{if(this.state.mode==='playing'&&(event.buttons===1||this.action.touchShield))this.action.mouseAim=point(event);};
    this.mouseUp=event=>{this.action.release(`mouse:${event.pointerId}`);if(!this.action.touchShield)this.action.mouseAim=null;};
    this.contextMenu=event=>event.preventDefault();
    canvas.addEventListener('pointerdown',this.mouseDown);canvas.addEventListener('pointermove',this.mouseMove);canvas.addEventListener('pointerup',this.mouseUp);canvas.addEventListener('pointercancel',this.mouseUp);canvas.addEventListener('contextmenu',this.contextMenu);
    this.events.once('shutdown',()=>{canvas.removeEventListener('pointerdown',this.mouseDown);canvas.removeEventListener('pointermove',this.mouseMove);canvas.removeEventListener('pointerup',this.mouseUp);canvas.removeEventListener('pointercancel',this.mouseUp);canvas.removeEventListener('contextmenu',this.contextMenu);});
    $('play').addEventListener('click',()=>this.act('start'));
    $('restart').addEventListener('click',()=>this.act('restart'));
    $('close-puzzle').addEventListener('click',()=>this.act('close'));
    $('puzzle').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    $('journal-toggle').addEventListener('click',()=>this.act('journal'));
    $('close-journal').addEventListener('click',()=>this.act('close'));
    $('journal').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    document.querySelectorAll('[data-action]').forEach(button=>{
      const action=button.dataset.action,continuous=['up','down','left','right','attack'].includes(action);
      if(continuous){
        button.addEventListener('pointerdown',event=>{if(this.state.mode!=='playing')return;button.setPointerCapture(event.pointerId);this.action.press(action,`pointer:${event.pointerId}`);});
        for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>this.action.release(`pointer:${event.pointerId}`));
      }
      button.addEventListener('click',event=>{if(!continuous||event.detail===0)this.act(action);button.blur();});
    });
    this.feedback('A forgotten archive. Forty-five words. One way home.');
    this.render();
  }
  loadRoom() {
    if(this.worldLayer) {this.worldLayer.removeAll(true);this.tweens.killAll();}
    this.worldLayer=this.add.container();
    const before=new Set(this.children.list);
    this.room=makeRoom(this.state.chapter,chapters.length);
    paintWorld(this,this.room,this.state.chapter);
    this.stationSprites=this.room.seals.map((point,index)=>{
      const {x,y}=tilePosition(point);
      const lit=this.state.sealed.has(`${this.state.chapter}:${index}`);
      const sprite=this.add.sprite(x,y-2,lit?'key':'crystal').setDisplaySize(40,40).play(lit?'key':'crystal');
      this.add.text(x,y+25,['I','II','III'][index],{fontFamily:'Georgia',fontSize:14,color:'#e8d7a6'}).setOrigin(.5);
      return sprite;
    });
    const guide=tilePosition(this.room.guide);
    this.add.image(guide.x,guide.y-4,'guide').setDisplaySize(35,40);
    this.add.text(guide.x,guide.y-33,'KEEPER',{fontFamily:'Arial',fontSize:8,color:'#e9d49b',letterSpacing:1}).setOrigin(.5);
    this.shades=this.room.shades.map(point=>{
      const at=tilePosition(point);
      return {...point,active:true,sprite:this.add.sprite(at.x,at.y,'phantom').setDisplaySize(40,40).play('phantom')};
    });
    const hero=tilePosition(this.state);
    this.facing='down';
    this.hero=this.add.sprite(hero.x,hero.y,'hero-idle-down').setDisplaySize(40,40).setDepth(20).play('hero-idle-down');
    this.gateBars=this.add.graphics();
    this.action=new ActionWorld(this);
    const added=this.children.list.filter(item=>!before.has(item));
    this.worldLayer.add(added);
    this.worldLayer.setDepth(1);
    this.drawGate();
  }
  feedback(message) {$('feedback').textContent=message;}
  update(time,delta){this.action?.update(delta);}
  near(point){return Math.hypot(this.state.x-point.x,this.state.y-point.y)<1.65;}
  roomKeys() {return [0,1,2].filter(i=>this.state.sealed.has(`${this.state.chapter}:${i}`)).length;}
  drawGate() {
    this.gateBars.clear();
    const open=this.roomKeys()===3;
    this.gateBars.fillStyle(open?0x8bcbb4:0xd9b56f,open?.25:1);
    const at=tilePosition(this.room.exit);
    if(open)this.gateBars.fillRect(at.x-18,at.y-24,36,60);
    else for(let i=0;i<3;i++)this.gateBars.fillRect(at.x-13+i*11,at.y-24,4,60);
  }
  reset() {
    $('puzzle').close();$('journal').close();
    this.exploration=new Map();
    this.state={mode:'playing',chapter:0,...makeRoom(0,5).spawn,hearts:5,score:0,learned:new Set(),sealed:new Set()};
    this.loadRoom();this.feedback('Walk into a glowing crystal to begin its vocabulary trial.');
    $('play').blur();$('restart').blur();
  }
  act(action) {
    const s=this.state;
    if(action==='restart')this.reset();
    else if(action==='start'&&s.mode!=='playing') {
      if(s.mode==='lost') {s.mode='playing';s.hearts=5;Object.assign(s,this.room.spawn);this.loadRoom();this.feedback('The Keeper restores your courage at the entrance. Completed seals and learned words are kept.');}
      else this.reset();
      $('play').blur();
    } else if(action==='close') {
      if(s.mode==='puzzle'||s.mode==='guide'){$('puzzle').close();s.mode='playing';}
      if(s.mode==='journal'){$('journal').close();s.mode=this.journalReturn;}
    } else if(action==='journal'&&['playing','journal'].includes(s.mode)) {
      if(s.mode==='journal')this.act('close');
      else {this.journalReturn=s.mode;s.mode='journal';this.renderJournal();$('journal').showModal();}
    } else if(s.mode==='playing') {
      if(['up','down','left','right'].includes(action)){this.action.press(action,'tap');this.action.release('tap');}
      else if(action==='interact')this.interact();
      else if(action==='attack'){this.action.touchShield=false;this.action.attack();}
      else if(action==='shield')this.action.touchShield=!this.action.touchShield;
    }
    this.render();
  }
  nearbyHint() {
    if(this.near(this.room.exit))return this.roomKeys()===3?'The gate is open. Walk into it to continue.':'The gate needs all three rune keys from this chamber.';
    const index=this.room.seals.findIndex(p=>this.near(p));
    if(index>=0)return this.state.sealed.has(`${this.state.chapter}:${index}`)?'This seal is restored. Its words are in your journal.':`${objects[index]} is within reach. Walk into its crystal to begin, or press E.`;
    if(this.near(this.room.guide))return 'The Keeper has advice. Walk into the Keeper to speak.';
    return 'Explore the chamber. Restore three seals to open the eastern gate.';
  }
  interact() {
    const s=this.state;
    if(this.near(this.room.exit)) {
      if(this.roomKeys()<3){this.feedback('The gate is locked. Restore all three seals to earn its keys.');return;}
      if(s.chapter===chapters.length-1){s.mode='won';this.feedback('The archive remembers. You have mastered all 45 words.');return;}
      s.chapter++;Object.assign(s,this.room.spawn);s.hearts=Math.min(5,s.hearts+1);
      this.loadRoom();this.feedback('A new chamber opens. One heart restored. Find its three seals.');return;
    }
    const index=this.room.seals.findIndex(point=>this.near(point));
    if(index>=0){this.openTrial(index);return;}
    if(this.near(this.room.guide)) {
      s.mode='guide';$('puzzle-label').textContent='THE KEEPER';$('puzzle-title').textContent='Words open what swords cannot.';
      $('puzzle-prompt').textContent='Walk into crystals, the Keeper, and gates to interact. Use 1–4 or the answer buttons in trials. Wrong answers cost a heart and reveal a hint. Hold arrows or WASD to move. Left-click inside the world or press Space to draw and swing your sword. Right-click toggles your shield; point toward incoming magic to block it. Ghosts flash violet before firing. Combat pauses while you read. The bottom-right minimap reveals places you explore. After three keys, walk into the eastern gate.';
      $('answers').replaceChildren();$('puzzle-feedback').textContent='Your journal (M) keeps every word you learn.';$('puzzle-progress').textContent=chapters[s.chapter].name;$('puzzle').showModal();return;
    }
    this.feedback('Walk into a crystal, the Keeper, or the gate to interact. E also works beside them.');
  }
  openTrial(index) {
    const s=this.state;
    if(s.sealed.has(`${s.chapter}:${index}`)){this.feedback('This seal is already restored. Continue to another seal or the gate.');return;}
    this.activeTrial=index;this.trialFeedback='';s.mode='puzzle';this.renderPuzzle();$('puzzle').showModal();
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
    $('puzzle-title').textContent=objects[this.activeTrial];
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
      this.stationSprites[this.activeTrial].play('key');this.drawGate();
      this.state.mode='playing';$('puzzle').close();
      this.feedback(`${objects[this.activeTrial]} restored! Rune key ${this.roomKeys()} of 3 earned. ${this.question.explanation}`);
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
    $('hearts').textContent='♥'.repeat(Math.max(0,s.hearts))+'♡'.repeat(5-Math.max(0,s.hearts));
    $('hearts').setAttribute('aria-label',`${s.hearts} of 5 hearts`);
    $('score').textContent=s.score;$('word-count').textContent=`${s.learned.size} / 45`;
    $('key-count').textContent=`${this.roomKeys()} / 3`;
    $('chapter-number').textContent=`CHAMBER ${s.chapter+1} / 5`;
    $('chapter-title').textContent=chapters[s.chapter].name;$('chapter-subtitle').textContent=chapters[s.chapter].subtitle;
    $('objective').textContent=this.roomKeys()===3?(s.chapter===4?'Enter the eastern gate and restore the archive.':'Enter the eastern gate to reach the next chamber.'):'Restore the three rune seals to unlock the eastern gate.';
    $('seal-list').replaceChildren(...[0,1,2].map(index=>{
      const item=document.createElement('li'),solved=s.sealed.has(`${s.chapter}:${index}`);
      item.className=solved?'complete':'';item.textContent=`${solved?'✦':'◇'} ${objects[index]}${solved?' · restored':''}`;return item;
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
    }
    Object.assign($('game').dataset,{ready:'true',mode:s.mode,chapter:s.chapter,learned:s.learned.size,keys:this.roomKeys(),quizId:s.mode==='puzzle'?this.currentId():'',shades:this.shades.filter(shade=>shade.active).length});
    this.action.telemetry();
  }
}

new Phaser.Game({type:Phaser.AUTO,parent:'game',width:WORLD.viewportWidth,height:WORLD.viewportHeight,backgroundColor:'#233d36',pixelArt:true,roundPixels:true,fps:{smoothStep:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Adventure});
