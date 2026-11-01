// The supplied strip is retained unchanged; cutouts are transient game textures.
export function createOctorotArt(scene){
  if(scene.textures.exists('marsh-octorok'))return;
  const source=scene.textures.get('octorot-source').getSourceImage();
  const sheet=scene.textures.createCanvas('marsh-octorok',640,80);
  const frame=document.createElement('canvas');frame.width=frame.height=80;
  const c=frame.getContext('2d');c.imageSmoothingEnabled=false;
  for(let n=0;n<8;n++){
    c.clearRect(0,0,80,80);c.drawImage(source,12+n*77,0,77,78,1,1,77,78);
    const pixels=c.getImageData(0,0,80,80),d=pixels.data,seen=new Uint8Array(6400),queue=new Uint16Array(6400);let head=0,tail=0;
    // Flood only edge-connected backing colors, retaining enclosed dark details.
    const visit=i=>{if(seen[i])return;seen[i]=1;const j=i*4,r=d[j],g=d[j+1],b=d[j+2];
      const navy=b>20&&b>r+12&&b>g+12&&r<70&&g<85,gray=Math.abs(r-32)<7&&Math.abs(g-32)<7&&Math.abs(b-32)<7;
      if(d[j+3]===0||navy||gray){d[j+3]=0;queue[tail++]=i;}
    };
    for(let i=0;i<80;i++){visit(i);visit(6320+i);visit(i*80);visit(i*80+79);}
    while(head<tail){const i=queue[head++],x=i%80,y=Math.floor(i/80);if(x)visit(i-1);if(x<79)visit(i+1);if(y)visit(i-80);if(y<79)visit(i+80);}
    sheet.context.putImageData(pixels,n*80,0);sheet.add(n,0,n*80,0,80,80);
  }
  sheet.refresh();
}
export function octorotPose(enemy,hero,clock){
  const dx=hero.x-enemy.x,dy=hero.y-enemy.y,beat=Math.floor(clock*4+enemy.id)%4;
  if(Math.abs(dx)>Math.abs(dy))return {frame:[0,1,2,1][beat],flipX:dx>0};
  return {frame:dy<0?[6,7,6,7][beat]:[3,4,3,5][beat],flipX:false};
}
