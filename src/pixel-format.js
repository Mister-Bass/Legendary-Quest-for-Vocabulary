// Runtime art contract. Keep supplied files intact; render converted frames only.
export const ART_PIXELS=32;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function convertTexture(scene,key,w,h=w,{grid=false,contain=false,anchor='bottom'}={}){
  const texture=scene.textures.get(key),source=texture.getSourceImage();
  const columns=Math.floor(source.width/w),rows=Math.floor(source.height/h);
  if(w===32&&h===32)return;
  const out=canvas((grid?columns:columns*rows)*32,grid?rows*32:32),c=out.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const dx=(grid?x:y*columns+x)*32,dy=grid?y*32:0;
    const scale=contain?32/Math.max(w,h):1,dw=contain?Math.round(w*scale):32,dh=contain?Math.round(h*scale):32;
    c.drawImage(source,x*w,y*h,w,h,dx+Math.floor((32-dw)/2),dy+(anchor==='center'?Math.floor((32-dh)/2):32-dh),dw,dh);
  }
  scene.textures.addImage('source-'+key,source);scene.textures.remove(key);
  const result=scene.textures.addCanvas(key,out);
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)result.add(y*columns+x,0,(grid?x:y*columns+x)*32,grid?y*32:0,32,32);
}
export function preparePixelArt(scene){
  convertTexture(scene,'player',48);convertTexture(scene,'chest',16);
  for(const key of ['terrain','fences','grass','puny','topdown'])convertTexture(scene,key,16,16,{grid:true});
  convertTexture(scene,'water',16);
  for(let i=1;i<=4;i++)convertTexture(scene,'tree'+i,192,i<=2?256:192,{contain:true});
  for(const key of ['bridge','rune-door','rune-door-open','rune-key']){
    const image=scene.textures.get(key).getSourceImage();convertTexture(scene,key,image.width,image.height,{contain:true,anchor:key==='bridge'?'center':'bottom'});
  }
  for(const key of scene.textures.getTextureKeys().filter(k=>/^pond-\d+$/.test(k)))convertTexture(scene,key,64);
  const source=scene.textures.get('source-topdown').getSourceImage(),out=canvas(32,32),c=out.getContext('2d');c.imageSmoothingEnabled=false;
  c.drawImage(source,48,144,32,48,5,0,22,32);scene.textures.addCanvas('a01-tree',out);
  const mud=scene.textures.get('marsh-mud').getSourceImage(),tile=canvas(32,32),mc=tile.getContext('2d');mc.imageSmoothingEnabled=false;
  mc.fillStyle='#755e2c';mc.fillRect(0,0,32,32);mc.drawImage(mud,72,72,112,112,0,0,32,32);scene.textures.addCanvas('marsh-mud-tile',tile);
  document.getElementById('game').dataset.artFormat='32x32-16bit';
}
// Add single-pixel bevels to newly enlarged procedural sprites. Existing 32px
// artwork is never passed here, preserving the author's original pixels.
export function pixelBevel(c){
  const image=c.getImageData(0,0,32,32),d=image.data,copy=new Uint8ClampedArray(d);
  for(let y=1;y<31;y++)for(let x=1;x<31;x++){
    const i=(y*32+x)*4;if(!copy[i+3])continue;
    const edge=!copy[i-128+3]?1:!copy[i+128+3]?-1:0;
    if(edge)for(let ch=0;ch<3;ch++)d[i+ch]=Math.max(0,Math.min(255,copy[i+ch]+edge*12));
  }
  c.putImageData(image,0,0);
}
