// Tiny isometric toolkit for the v4 line illustrations. World units: x runs down-right, y runs down-left,
// z is up. Everything returns SVG path data so scenes can be composed in Astro without a library.

const C = Math.cos(Math.PI / 6);
const S = 0.5;
type V = [number, number, number];

export const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * C, (x + y) * S - z];
const f = (n: number) => +n.toFixed(1);
const pt = (v: V) => P(...v).map(f).join(' ');

export const quad = (pts: V[]) => 'M' + pts.map(pt).join('L') + 'Z';
export const line = (pts: V[]) => 'M' + pts.map(pt).join('L');

/** Flat horizontal plane at height z. */
export const plane = (x: number, y: number, z: number, w: number, d: number) =>
  quad([
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ]);

/** Corners of a horizontal plane, for the little square handles. */
export const corners = (x: number, y: number, z: number, w: number, d: number) =>
  ([
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ] as V[]).map((v) => P(...v));

/** Upright plane standing along the x axis (a screen facing down-left). */
export const wallX = (x: number, y: number, z: number, w: number, h: number) =>
  quad([
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + h],
    [x, y, z + h],
  ]);

/** Upright plane standing along the y axis (facing down-right). */
export const wallY = (x: number, y: number, z: number, d: number, h: number) =>
  quad([
    [x, y, z],
    [x, y + d, z],
    [x, y + d, z + h],
    [x, y, z + h],
  ]);

/** A solid box: top, and the two faces that face the viewer. */
export const box = (x: number, y: number, z: number, w: number, d: number, h: number) => ({
  top: plane(x, y, z + h, w, d),
  right: wallY(x + w, y, z, d, h),
  left: wallX(x, y + d, z, w, h),
});

/** Floor grid lines across a square of the given half-size. */
export const grid = (half: number, step: number) => {
  let d = '';
  for (let i = -half; i <= half + 0.001; i += step) {
    d += line([
      [i, -half, 0],
      [i, half, 0],
    ]);
    d += line([
      [-half, i, 0],
      [half, i, 0],
    ]);
  }
  return d;
};

/** Iso ellipse for a circle of radius r lying flat at (x, y, z). */
export const disc = (x: number, y: number, z: number, r: number) => {
  const [cx, cy] = P(x, y, z);
  return { cx: f(cx), cy: f(cy), rx: f(r * Math.SQRT2 * C), ry: f(r * Math.SQRT2 * S) };
};

/** Cylinder: top/bottom ellipses plus the two silhouette edges. */
export const cyl = (x: number, y: number, z: number, r: number, h: number) => {
  const top = disc(x, y, z + h, r);
  const bot = disc(x, y, z, r);
  const side = `M${f(bot.cx - bot.rx)} ${bot.cy}V${top.cy}M${f(bot.cx + bot.rx)} ${bot.cy}V${top.cy}`;
  const front = `M${f(bot.cx - bot.rx)} ${bot.cy}A${bot.rx} ${bot.ry} 0 0 0 ${f(bot.cx + bot.rx)} ${bot.cy}`;
  return { top, bot, side, front };
};

/** Smooth dashed connector between two world points, arching up by `lift`. */
export const arc = (a: V, b: V, lift = 40) => {
  const [ax, ay] = P(...a);
  const [bx, by] = P(...b);
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - lift;
  return `M${f(ax)} ${f(ay)}Q${f(mx)} ${f(my)} ${f(bx)} ${f(by)}`;
};
