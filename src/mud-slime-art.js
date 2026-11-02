// Palette swap of the same Mystic Woods 32px slime frames used in Level 1.
// Preserve source files, alpha, facial details, frame order, and animation poses.
export const MUD_SLIME_PALETTE={
  '#1d235d':'#39351d', '#33418a':'#514020', '#425b9e':'#755e2c',
  '#4d8ab3':'#8c7437', '#65b1b8':'#ac914d'
};
export function createMudSlimeArt(scene){
  if(scene.textures.exists('marsh-slurg'))return;
  const original=scene.textures.get('slime'),source=original.getSourceImage();
  const texture=scene.textures.createCanvas('marsh-slurg',source.width,source.height),c=texture.context;
  c.imageSmoothingEnabled=false;c.drawImage(source,0,0);
  const pixels=c.getImageData(0,0,source.width,source.height),d=pixels.data;
  const palette=new Map(Object.entries(MUD_SLIME_PALETTE).map(([from,to])=>[parseInt(from.slice(1),16),parseInt(to.slice(1),16)]));
  for(let i=0;i<d.length;i+=4){
    if(!d[i+3])continue;const color=palette.get((d[i]<<16)|(d[i+1]<<8)|d[i+2]);
    if(color!==undefined){d[i]=color>>16;d[i+1]=(color>>8)&255;d[i+2]=color&255;}
  }
  c.putImageData(pixels,0,0);
  for(const name of original.getFrameNames()){
    const f=original.get(name);texture.add(name,0,f.cutX,f.cutY,f.cutWidth,f.cutHeight);
  }
  texture.refresh();
}
