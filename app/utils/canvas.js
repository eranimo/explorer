export function darken(_color, percent) {
  let color = _color.split(',');
  _.map(color, (c) => parseInt(c, 10));
  color[0] = color[0] - (color[0] * (percent/100));
  color[1] = color[1] - (color[1] * (percent/100));
  color[2] = color[2] - (color[2] * (percent/100));
  const r = Math.round(Math.max(Math.min(color[0], 255), 0));
  const g = Math.round(Math.max(Math.min(color[1], 255), 0));
  const b = Math.round(Math.max(Math.min(color[2], 255), 0));
  return `${r},${g},${b}`;
}

export function midPoint(coords) {
  let tx = 0;
  let ty = 0;
  coords.forEach(coord => {
    tx += coord[0];
    ty += coord[1];
  })
  return [
    Math.round(tx / coords.length),
    Math.round(ty / coords.length)
  ]
}


export function drawStar(ctx, cx, cy, color='black', outerRadius=15, innerRadius=6, spikes=5) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius)
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
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
