// Original 32x32 lantern portal: stone rim, three runes, and a pixel vortex.
export const portalReady=lit=>lit.length===3&&lit.every(Boolean);
export function portalTexture(lit,clock=0){return portalReady(lit)?`marsh-portal-open-${Math.floor(clock*8)%6}`:`marsh-portal-dormant-${lit.filter(Boolean).length}`;}
export function paintPortal(c,{lit=0,frame=0}={}){
  c.clearRect(0,0,32,32);c.imageSmoothingEnabled=false;
  const colors=['#21465f','#326b91','#6289c2','#8cdaca','#c6eab4','#69b6ba'];
  for(let y=1;y<29;y++)for(let x=2;x<30;x++){
    const dx=(x-15.5)/11,dy=(y-14)/12,r=Math.hypot(dx,dy);if(r>1.16)continue;
    let color=r>1.04?'#263c43':r>.92?((x+y)%5<2?'#a49bb7':'#665b82'):'#1c253a';
    if(r<.91&&lit===3){const angle=Math.atan2(dy,dx);color=colors[((Math.floor(angle*3/Math.PI+r*7)-frame)%6+6)%6];if(r<.18)color='#e5f4c5';}
    else if(r<.91&&(x*11+y*7)%47===0)color='#57466c';
    c.fillStyle=color;c.fillRect(x,y,1,1);
  }
  c.fillStyle='#35464c';c.fillRect(3,27,26,4);c.fillStyle='#8a889c';c.fillRect(4,27,24,1);
  for(let i=0;i<3;i++){const x=7+i*8;c.fillStyle='#202937';c.fillRect(x-1,27,4,4);c.fillStyle=i<lit?'#f2cf7c':'#655b78';c.fillRect(x,28,2,2);}
  if(lit===3){c.fillStyle='#d9edb9';for(const [x,y]of[[4+(frame*3)%23,3],[2,10+frame*2],[28,6+frame*3]])c.fillRect(x,y,1,1);}
}
export function createPortalArt(scene){
  for(let lit=0;lit<3;lit++){
    const t=scene.textures.createCanvas(`marsh-portal-dormant-${lit}`,32,32);paintPortal(t.context,{lit});t.refresh();
  }
  for(let frame=0;frame<6;frame++){
    const t=scene.textures.createCanvas(`marsh-portal-open-${frame}`,32,32);paintPortal(t.context,{lit:3,frame});t.refresh();
  }
}
