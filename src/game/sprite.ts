// Pixel art as strings: each char is a palette key, "." is transparent.
export type Palette = Record<string, string>;

export type Sprite = {
  palette: Palette;
  rows: string[];
  // Row overrides swapped in while the pet blinks.
  blink?: Record<number, string>;
};

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

export function drawRows(ctx: CanvasRenderingContext2D, rows: string[], palette: Palette) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}
