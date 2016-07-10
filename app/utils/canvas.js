
/**
 * darken - Darkens a color by an amount
 *
 * @param  {Array} _color   color array
 * @param  {Number} percent Percent (in range 0.0 - 1.0)
 * @return {type}           Color string in form R,G,B
 */
export function darken(_color, percent) {
  const color = _color.split(',');
  _.map(color, (c) => parseInt(c, 10));
  color[0] = color[0] - (color[0] * (percent / 100));
  color[1] = color[1] - (color[1] * (percent / 100));
  color[2] = color[2] - (color[2] * (percent / 100));
  const r = Math.round(Math.max(Math.min(color[0], 255), 0));
  const g = Math.round(Math.max(Math.min(color[1], 255), 0));
  const b = Math.round(Math.max(Math.min(color[2], 255), 0));
  return `${r},${g},${b}`;
}


/**
 * midPoint - Mid point of array of tuple coordinates
 *
 * @param  {type} coords Array of [x, y] tuples
 * @return {type}        Midpoint tuple
 */
export function midPoint(coords) {
  let tx = 0;
  let ty = 0;
  coords.forEach(coord => {
    tx += coord[0];
    ty += coord[1];
  });
  return [
    Math.round(tx / coords.length),
    Math.round(ty / coords.length)
  ];
}


/**
 * drawStar - Draw a star in a Canvas context
 *
 * @param  {Object} ctx              Canvas context
 * @param  {Number} cx               X coordinate
 * @param  {Number} cy               Y coordinate
 * @param  {String} color = 'black'  canvas color string
 * @param  {Number} outerRadius = 15 Radius of the star
 * @param  {Number} innerRadius = 6  How skinny the star should be
 * @param  {Number} spikes = 5       Number of points
 */
export function drawStar(ctx, cx, cy, color = 'black', outerRadius = 15, innerRadius = 6, spikes = 5) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}


export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


/**
 * pointInTriangle - Finds out if a point is inside a triangle area
 *
 * @param  {type} p  Point to find out about
 * @param  {type} p0 First point
 * @param  {type} p1 Second point
 * @param  {type} p2 Third point
 * @return {type}    Whether or not it's in the triangle
 */
export function pointInTriangle(p, p0, p1, p2) {
  const A = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
  const sign = A < 0 ? -1 : 1;
  const s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
  const t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

  return s > 0 && t > 0 && (s + t) < 2 * A * sign;
}
