// Original native 32x32 giant frog and 64x32 arena gate pixel art.
export function paintFrog(c,pose='idle'){
  c.clearRect(0,0,32,32);c.imageSmoothingEnabled=false;
  const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  r('#172f25',3,18,26,10);r('#172f25',6,10,20,17);r('#294b2d',4,18,24,9);
  r('#365c31',2,22,7,6);r('#365c31',23,22,7,6);r('#688e42',3,20,6,6);r('#688e42',23,20,6,6);
  r(pose==='stunned'?'#9cb960':'#719b49',7,9,18,15);r('#96b85e',9,9,14,8);r('#48753c',6,14,3,10);r('#48753c',23,14,3,10);
  r('#b3c87b',11,11,10,3);r('#5a843c',9,12,2,2);r('#5a843c',21,13,2,2);
  r('#21412b',6,4,8,8);r('#21412b',19,4,8,8);r('#91b254',7,3,6,8);r('#91b254',20,3,6,8);
  r('#d9cf74',8,5,4,4);r('#d9cf74',21,5,4,4);
  if(pose==='stunned'){
    for(const x of [8,21]){r('#28392b',x,5,1,1);r('#28392b',x+3,5,1,1);r('#28392b',x+1,6,2,1);r('#28392b',x,7,1,1);r('#28392b',x+3,7,1,1);}
  }else{r('#172a24',10,5,2,3);r('#172a24',21,5,2,3);r('#fff3b0',8,5,1,1);r('#fff3b0',24,5,1,1);}
  r('#bfc789',10,20,12,7);r('#e1d7a0',12,21,8,6);r('#efe5b3',13,21,5,2);r('#879b64',10,26,12,1);
  const open=pose==='open'||pose==='stunned';
  r('#1d3528',9,16,14,open?5:2);r('#b3c474',8,15,16,1);
  if(open){r('#5b3440',10,17,12,3);r('#bc7c80',12,19,8,1);r('#ebaf9d',15,18,3,2);}else r('#d6d899',11,18,10,1);
  for(const [x,y]of[[5,21],[24,22],[8,13],[22,11],[10,10]])r('#365c32',x,y,2,2);
  r('#284f2b',5,27,7,3);r('#284f2b',20,27,7,3);r('#9eaf68',6,27,6,1);r('#9eaf68',20,27,6,1);
  for(const x of [5,8,11,20,23,26])r('#d6cf94',x,29,1,1);
  if(pose==='breathe')r('#f0e5b7',13,24,6,1);
}
export function createFrogArt(scene){
  for(const [key,pose]of[['marsh-toad','idle'],['marsh-toad-breathe','breathe'],['marsh-toad-open','open'],['marsh-toad-stunned','stunned']]){
    if(scene.textures.exists(key))continue;const t=scene.textures.createCanvas(key,32,32);paintFrog(t.context,pose);t.refresh();
  }
  if(scene.textures.exists('marsh-arena-gate'))return;
  const t=scene.textures.createCanvas('marsh-arena-gate',64,32),c=t.context,r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  for(const x of [0,58]){r('#1e3339',x,0,6,32);r('#60766f',x+1,1,4,30);r('#a5afa0',x+1,2,2,28);r('#253e40',x,13,6,1);r('#253e40',x,24,6,1);}
  r('#1c3135',5,2,54,6);r('#8b8e65',6,3,52,2);r('#c2b67c',7,3,50,1);
  for(let x=10;x<58;x+=7){r('#1c3135',x,7,4,24);r('#667b6c',x+1,7,2,23);r('#b5b98b',x+1,8,1,19);r('#cfbd7f',x+1,30,2,1);}
  r('#293e3e',6,17,52,3);r('#829478',6,17,52,1);t.refresh();
}
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawFrogEncounter(world){
  const {scene,model:m,clock}=world,b=m.boss,age=clock-b.riseAt;
  const sinking=b.phase==='defeated'&&b.defeatedAt>=0&&clock-b.defeatedAt<1.1;
  const rise=b.phase==='rising'?clamp(age/1.8):sinking?clamp(1-(clock-b.defeatedAt)/1.1):1;
  const texture=b.phase==='stunned'?'marsh-toad-stunned':['warning','tongue'].includes(b.phase)?'marsh-toad-open':Math.floor(clock*2)%2?'marsh-toad-breathe':'marsh-toad';
  world.bossSprite.setTexture(texture).setVisible(b.active||sinking).setPosition(b.x,b.y+(1-rise)*128).setCrop(0,0,32,32*rise);
  world.bossLabel.setVisible(b.active&&rise>.5);
  const lift=b.phase==='rising'?clamp((age-1.8)/1.4):m.gateClosed?1:b.defeatedAt>=0?clamp(1-(clock-b.defeatedAt)/1.1):0;
  scene.arenaGateLift=lift;const gate=m.room.barrier;
  world.arenaGate.setVisible(lift>0).setPosition((gate.x+gate.width/2)*40,gate.y*40+28+(1-lift)*80).setCrop(0,0,64,32*lift);
  const g=world.bossWater;g.clear();
  if(b.active||sinking){g.fillStyle(0x2c7483,.18).fillEllipse(b.x,b.y+54,118,30);g.lineStyle(2,0xbfe9d2,.55).strokeEllipse(b.x,b.y+52,108+Math.sin(clock*4)*7,22);}
  if(b.phase==='rising'||sinking){const radius=55+Math.sin(clock*7)*10;g.lineStyle(3,0xe0f5d8,.7).strokeEllipse(b.x,b.y+50,radius*2,30);}
  if(scene.state.mode==='boss-rise'){
    const camera=scene.cameras.main,gateY=gate.y*40+20;
    let y=b.y,zoom=1.35;
    if(age>=1.8&&age<2.7)y=b.y+(gateY-b.y)*clamp((age-1.8)/.9);
    else if(age>=2.7&&age<3.7)y=gateY;
    else if(age>=3.7){const t=clamp((age-3.7)/.9);y=gateY+(world.hero.y-gateY)*t;zoom=1.35+(1.1-1.35)*t;}
    camera.setZoom(zoom).centerOn(b.x+(world.hero.x-b.x)*clamp((age-3.7)/.9),y);
  }
}
