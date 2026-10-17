// One sword swing can damage a slime only once, even across many render frames.
export const SLIME_HEALTH=3;
export const SLIME_BURST_RADIUS=56;
export function strikeSlime(enemy,swing,distance){
  if(enemy.hp<=0||enemy.lastHitSwing===swing)return {hit:false,dead:false,burstDamage:0};
  enemy.lastHitSwing=swing;enemy.hp--;
  const dead=enemy.hp===0;
  return {hit:true,dead,burstDamage:dead&&distance<=SLIME_BURST_RADIUS?1:0};
}
