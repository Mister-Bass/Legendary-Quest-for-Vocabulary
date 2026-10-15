import Phaser from 'phaser';
import { chapters, chapterTrials, vocabulary, makeQuestion } from './lesson.js';
import { WORLD, makeRoom, isWalkable, distance } from './world.js';
import { createArt, paintWorld } from './art.js';
import './adventure.css';

const $ = id => document.getElementById(id);
const objects = ['The Root Seal', 'The Echo Seal', 'The Lantern Seal'];
const tilePosition = ({x,y}) => ({x:x*40+20,y:y*40+20});

class Adventure extends Phaser.Scene {
  constructor() { super('Adventure'); }
  create() {
    createArt(this);
    this.state = { mode:'title', chapter:0, x:2, y:10, hearts:5, score:0, learned:new Set(), sealed:new Set() };
    this.loadRoom();
    this.keyHandler = event => {
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      if (event.target instanceof HTMLButtonElement && ['Enter',' '].includes(key)) return;
      const action={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',e:'interact',' ':'interact',j:'ward',z:'ward',r:'restart',Enter:'start',Escape:'close',m:'journal'}[key];
      if(this.state.mode==='puzzle'&&['1','2','3','4'].includes(key)) {event.preventDefault();this.answer(Number(key)-1);return;}
      if(action) {event.preventDefault();this.act(action);}
    };
    window.addEventListener('keydown',this.keyHandler);
    this.events.once('shutdown',()=>window.removeEventListener('keydown',this.keyHandler));
    $('play').addEventListener('click',()=>this.act('start'));
    $('restart').addEventListener('click',()=>this.act('restart'));
    $('close-puzzle').addEventListener('click',()=>this.act('close'));
    $('puzzle').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    $('journal-toggle').addEventListener('click',()=>this.act('journal'));
    $('close-journal').addEventListener('click',()=>this.act('close'));
    $('journal').addEventListener('cancel',event=>{event.preventDefault();this.act('close');});
    document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{this.act(button.dataset.action);button.blur();}));
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
      const sprite=this.add.image(x,y-2,lit?'seal-lit':'seal').setDisplaySize(40,44);
      this.add.text(x,y+25,['I','II','III'][index],{fontFamily:'Georgia',fontSize:14,color:'#e8d7a6'}).setOrigin(.5);
      return sprite;
    });
    const guide=tilePosition(this.room.guide);
    this.add.image(guide.x,guide.y-4,'guide').setDisplaySize(35,40);
    this.add.text(guide.x,guide.y-33,'KEEPER',{fontFamily:'Arial',fontSize:8,color:'#e9d49b',letterSpacing:1}).setOrigin(.5);
    this.shades=this.room.shades.map(point=>{
      const at=tilePosition(point);
      return {...point,active:true,sprite:this.add.image(at.x,at.y,'shade').setDisplaySize(34,36)};
    });
    this.shades.forEach(shade=>this.tweens.add({targets:shade.sprite,y:shade.sprite.y-4,duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'}));
    const hero=tilePosition(this.state);
    this.hero=this.add.image(hero.x,hero.y-3,'traveler').setDisplaySize(34,38).setDepth(20);
    this.gateBars=this.add.graphics();
    this.wardRing=this.add.circle(hero.x,hero.y,36,0xe8d49d,.35).setStrokeStyle(3,0xf6dc96).setVisible(false).setDepth(30);
    const added=this.children.list.filter(item=>!before.has(item));
    this.worldLayer.add(added);
    this.worldLayer.setDepth(1);
    this.drawGate();
  }
  feedback(message) {$('feedback').textContent=message;}
  roomKeys() {return [0,1,2].filter(i=>this.state.sealed.has(`${this.state.chapter}:${i}`)).length;}
  drawGate() {
    this.gateBars.clear();
    const open=this.roomKeys()===3;
    this.gateBars.fillStyle(open?0x8bcbb4:0xd9b56f,open?.25:1);
    if(open)this.gateBars.fillRect(722,256,36,70);
    else for(let i=0;i<3;i++)this.gateBars.fillRect(727+i*11,255,4,72);
  }
  reset() {
    $('puzzle').close();$('journal').close();
    this.state={mode:'playing',chapter:0,x:2,y:10,hearts:5,score:0,learned:new Set(),sealed:new Set()};
    this.loadRoom();this.feedback('Find the three rune seals. Stand beside one and press E to begin a trial.');
    $('play').blur();$('restart').blur();
  }
  act(action) {
    const s=this.state;
    if(action==='restart')this.reset();
    else if(action==='start'&&s.mode!=='playing') {
      if(s.mode==='lost') {s.mode='playing';s.hearts=5;this.feedback('The Keeper restores your courage. Completed seals and learned words are kept.');}
      else this.reset();
      $('play').blur();
    } else if(action==='close') {
      if(s.mode==='puzzle'||s.mode==='guide'){$('puzzle').close();s.mode='playing';}
      if(s.mode==='journal'){$('journal').close();s.mode=this.journalReturn;}
    } else if(action==='journal'&&['playing','journal'].includes(s.mode)) {
      if(s.mode==='journal')this.act('close');
      else {this.journalReturn=s.mode;s.mode='journal';this.renderJournal();$('journal').showModal();}
    } else if(s.mode==='playing') {
      const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[action];
      if(delta)this.move(...delta);
      else if(action==='interact')this.interact();
      else if(action==='ward')this.ward();
    }
    this.render();
  }
  move(dx,dy) {
    const s=this.state,next={x:s.x+dx,y:s.y+dy};
    const solid=[this.room.guide,...this.room.seals,this.room.exit].some(point=>distance(point,next)===0);
    if(!isWalkable(this.room,next.x,next.y)||solid){this.feedback('Stone, water, and ancient roots block the way. Find another path.');return;}
    s.x=next.x;s.y=next.y;
    this.tweens.killTweensOf(this.hero);
    const at=tilePosition(s);
    this.tweens.add({targets:this.hero,x:at.x,y:at.y-3,duration:85,ease:'Sine.easeOut'});
    if(dx)this.hero.setFlipX(dx<0);
    const hit=this.shades.find(shade=>shade.active&&distance(shade,s)===0);
    if(hit){hit.active=false;hit.sprite.setVisible(false);this.hurt('An inkshade stole one heart. Press J near a shade to dispel it before you step on it.');}
    else this.feedback(this.nearbyHint());
  }
  nearbyHint() {
    if(distance(this.state,this.room.exit)<=1)return this.roomKeys()===3?'The gate is open. Press E to continue.':'The gate needs all three rune keys from this chamber.';
    const index=this.room.seals.findIndex(p=>distance(this.state,p)<=1);
    if(index>=0)return this.state.sealed.has(`${this.state.chapter}:${index}`)?'This seal is restored. Its words are in your journal.':`${objects[index]} is within reach. Press E to read it.`;
    if(distance(this.state,this.room.guide)<=1)return 'The Keeper has advice. Press E to speak.';
    return 'Explore the chamber. Restore three seals to open the eastern gate.';
  }
  interact() {
    const s=this.state;
    if(distance(s,this.room.exit)<=1) {
      if(this.roomKeys()<3){this.feedback('The gate is locked. Restore all three seals to earn its keys.');return;}
      if(s.chapter===chapters.length-1){s.mode='won';this.feedback('The archive remembers. You have mastered all 45 words.');return;}
      s.chapter++;s.x=2;s.y=10;s.hearts=Math.min(5,s.hearts+1);
      this.loadRoom();this.feedback('A new chamber opens. One heart restored. Find its three seals.');return;
    }
    const index=this.room.seals.findIndex(point=>distance(s,point)<=1);
    if(index>=0) {
      if(s.sealed.has(`${s.chapter}:${index}`)){this.feedback('This seal is already restored. Continue to another seal or the gate.');return;}
      this.activeTrial=index;this.trialFeedback='';s.mode='puzzle';this.renderPuzzle();$('puzzle').showModal();return;
    }
    if(distance(s,this.room.guide)<=1) {
      s.mode='guide';$('puzzle-label').textContent='THE KEEPER';$('puzzle-title').textContent='Words open what swords cannot.';
      $('puzzle-prompt').textContent='Restore all three numbered seals by solving their vocabulary trials. Read carefully: some inscriptions ask for a term, some for its meaning. Use 1–4 or the answer buttons. Wrong answers cost a heart and reveal a hint. J dispels nearby inkshades. The eastern gate opens after all three keys are earned.';
      $('answers').replaceChildren();$('puzzle-feedback').textContent='Your journal (M) keeps every word you learn.';$('puzzle-progress').textContent=chapters[s.chapter].name;$('puzzle').showModal();return;
    }
    this.feedback('Move beside a numbered seal, the Keeper, or the eastern gate to interact.');
  }
  ward() {
    const center=tilePosition(this.state);this.wardRing.setPosition(center.x,center.y).setVisible(true).setAlpha(.8);
    this.tweens.killTweensOf(this.wardRing);this.tweens.add({targets:this.wardRing,alpha:0,duration:320,onComplete:()=>this.wardRing.setVisible(false)});
    let cleared=0;
    this.shades.forEach(shade=>{if(shade.active&&distance(shade,this.state)<=2){shade.active=false;shade.sprite.setVisible(false);cleared++;}});
    this.feedback(cleared?'Your lantern disperses the inkshade. The path is safe.':'Your lantern sends out a protective pulse. Move within two tiles of an inkshade to dispel it.');
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
      this.stationSprites[this.activeTrial].setTexture('seal-lit');this.drawGate();
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
    Object.assign($('game').dataset,{ready:'true',mode:s.mode,x:s.x,y:s.y,chapter:s.chapter,learned:s.learned.size,keys:this.roomKeys(),quizId:s.mode==='puzzle'?this.currentId():'',shades:this.shades.filter(shade=>shade.active).length});
  }
}

new Phaser.Game({type:Phaser.AUTO,parent:'game',width:WORLD.columns*WORLD.tileSize,height:WORLD.rows*WORLD.tileSize,backgroundColor:'#233d36',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Adventure});
