const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);

// Foot targets are distances on the stage, not a free-running pose clock.
// During stance the anchor is fixed while the body moves past it.
export function groundedFoot(travel, routeLength, stride, stepHeight, side) {
  const d = clamp(travel, 0, routeLength);
  const cycle = d / stride;
  const phase = cycle + (side ? .5 : 0);
  const turn = Math.floor(phase);
  const f = phase - turn;
  const from = Math.max(0, (turn - (side ? .5 : 0)) * stride);
  const to = Math.min(routeLength, (turn + 1 - (side ? .5 : 0)) * stride);
  const swing = clamp((f - .48) / .52, 0, 1);
  let anchor = from + (to - from) * ease(swing);
  let lift = (to > from) ? Math.sin(Math.PI * swing) ** 2 * stepHeight : 0;
  // Share the final short weight transfer if the route ends between steps.
  const settle = ease(clamp((routeLength - d) / (.28 * stride), 0, 1));
  anchor = d + (anchor - d) * settle;
  lift *= settle;
  return { offset: anchor - d, lift };
}
