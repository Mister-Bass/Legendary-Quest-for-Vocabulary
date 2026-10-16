// Original adventure layouts. Coordinates are grid cells; art is rendered by Phaser.
export const WORLD = { columns: 40, rows: 28, tileSize: 40, viewportWidth:800, viewportHeight:560, zoom:1.5 };
const themes = [
  { name: 'Emberwood Court', subtitle: 'Where forgotten words take root', ground: 0x355244, floor: 0x697457, wall: 0x203d35, waterColor: 0x315865, accent: 0xe4bd75 },
  { name: 'The Echo Archive', subtitle: 'Listen for meaning between the lines', ground: 0x41475c, floor: 0x717189, wall: 0x282d43, waterColor: 0x344567, accent: 0x9fcbd0 },
  { name: 'The Astral Vault', subtitle: 'A final passage from shadow to light', ground: 0x494050, floor: 0x817268, wall: 0x302b3e, waterColor: 0x48476b, accent: 0xe6ad9c },
  { name: 'The Forge of Ideas', ground: 0x514b3c, floor: 0x88765b, wall: 0x342f29, waterColor: 0x3c5963, accent: 0xf4b46e },
  { name: 'The Sanctum of Trust', ground: 0x304954, floor: 0x667e82, wall: 0x20313f, waterColor: 0x3b5a75, accent: 0x9fdbd2 },
];

export function makeRoom(index, total) {
  const theme = themes[index % themes.length];
  const walls = new Set();
  const water = new Set();
  for (let y = 0; y < WORLD.rows; y++) for (let x = 0; x < WORLD.columns; x++) {
    if (x === 0 || y === 0 || x === WORLD.columns - 1 || y === WORLD.rows - 1) walls.add(`${x},${y}`);
    // Broad passages leave room to steer a continuously moving character.
    if ((x === 15 && y >= 3 && y <= 10 && (y < 6 || y > 8)) || (y === 18 && x >= 19 && x <= 25 && (x < 21 || x > 23))) walls.add(`${x},${y}`);
    if ((x >= 24 && x <= 30 && y >= 3 && y <= 7) || (x >= 7 && x <= 12 && y >= 15 && y <= 18)) water.add(`${x},${y}`);
  }
  return {
    ...theme,
    name: index < themes.length ? theme.name : `${theme.name} · ${Math.floor(index / themes.length) + 1}`,
    number: index + 1, total,
    spawn: { x: 4, y: 22 },
    exit: { x: 37, y: 14 },
    guide: { x: 5, y: 22 },
    seals: [{ x: 10, y: 6 }, { x: 22, y: 13 }, { x: 34, y: 23 }],
    shades: [{ x: 14, y: 22 }, { x: 30, y: 12 }],
    trees: [[3,4],[6,7],[18,5],[21,9],[33,3],[36,9],[3,16],[17,15],[28,17],[2,25],[17,25],[26,25],[37,21]].map(([x,y],i)=>({x,y,variant:1+(i+index)%4})),
    bridge:new Set(index===0?Array.from({length:4},(_,i)=>`10,${i+15}`):[]),
    walls, water,
  };
}

export function isWalkable(room, x, y) {
  const key = `${x},${y}`;
  return x >= 0 && x < WORLD.columns && y >= 0 && y < WORLD.rows && !room.walls.has(key) && (!room.water.has(key)||room.bridge.has(key)) && !room.trees.some(p=>p.x===x&&p.y===y);
}

export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
