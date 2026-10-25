// Pixel art as strings: each char is a palette key, "." is transparent.
export type Palette = Record<string, string>;

export type Sprite = {
  palette: Palette;
  rows: string[];
  // Row overlays while the pet blinks; a space keeps the pixel underneath.
  blink?: Record<number, string>;
  // Animation frames (legendary). `rows` is the resting frame.
  frames?: string[][];
};

export function withBlink(rows: string[], blink: Record<number, string>) {
  return rows.map((row, y) => {
    const over = blink[y];
    return over ? [...row].map((c, x) => (over[x] === " " ? c : over[x])).join("") : row;
  });
}

export function checkRows(rows: string[], palette: Palette, size?: number) {
  const w = rows[0].length;
  if (size !== undefined && (w !== size || rows.length !== size)) {
    throw new Error(`sprite must be ${size}x${size}, got ${w}x${rows.length}`);
  }
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`row ${y} is ${row.length} wide, expected ${w}`);
    for (const c of row) {
      if (c !== "." && !(c in palette)) throw new Error(`row ${y} uses unknown color "${c}"`);
    }
  });
}

// Draws at (ox, oy) on the canvas grid; k > 1 draws each pixel as a k x k block.
export function drawRows(ctx: CanvasRenderingContext2D, rows: string[], palette: Palette, ox = 0, oy = 0, k = 1) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * k, oy + y * k, k, k);
    }
  });
}
