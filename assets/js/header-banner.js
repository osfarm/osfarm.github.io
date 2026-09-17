// Animated header mark: the three OSFarm planets, with the projects, data and
// people of the farming world orbiting around them.
//
// The centrepiece is assets/img/logo_white.png itself, so the branding stays
// pixel-identical to the logo; only the orbits are drawn. Orbit geometry is
// expressed in the logo's own pixel space (measured from the PNG) and the whole
// scene is scaled to fit its container.
//
// Satellite labels come from _data via the JSON emitted in the header include,
// so the banner stays data-driven like the rest of the site.

import {
  Application,
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from 'https://cdn.jsdelivr.net/npm/pixi.js@8.20.1/dist/pixi.min.mjs';

// Natural size of logo_white.png and the centres/radius of its three discs.
const LOGO = { w: 419, h: 256, discY: 91, discR: 58, discX: [84.5, 209, 329.5] };

// Logical design space; the scene is uniformly scaled to fit the container.
const DESIGN = { w: 980, h: 480 };
const LOGO_X = (DESIGN.w - LOGO.w) / 2;
const LOGO_Y = 95;

// The three disc centres in scene space, used both to place the orbits and to
// keep satellite labels from being written across a planet.
const DISCS = LOGO.discX.map((x) => ({ x: LOGO_X + x, y: LOGO_Y + LOGO.discY }));

// Wide layouts show the whole composition. Narrow ones crop to the mark and its
// orbits: at phone widths the labels would scale down past legibility, so they
// are hidden and the reclaimed margins go to the planets instead.
const VIEW_FULL = { x: 0, y: 0, w: DESIGN.w, h: DESIGN.h };
// The extra room under the wordmark is for its blurred shadow, which would
// otherwise be cut by the bottom edge of the canvas into a visible band.
const VIEW_COMPACT = { x: 245, y: 66, w: 490, h: 330 };
const COMPACT_MAX_WIDTH = 560;

const ORBIT = {
  rx: 112,
  // The discs are 124.5 apart for a radius of 58, so the 8.5px gap between two
  // planets is far too narrow for anything to thread through: no ellipse
  // centred on a disc can clear its own planet and miss its neighbours. The
  // reference deck settles it — there the planets carry overlapping
  // translucent halos, so rings that cross are the brand language, and
  // legibility is handled per-label in layout() instead.
  //
  // ry is what buys that legibility: at 104 the top and bottom of every ring
  // sit well clear of all three discs, which is where the labels surface.
  ry: 104,
  // Each planet leans differently so the overlapping orbits read as depth
  // rather than clutter.
  tilt: [-0.3, 0.18, -0.12],
  // Radians per second. Alternating directions keep the motion from looking
  // like a single rigid object.
  speed: [0.22, -0.17, 0.2],
};

// Each planet's translucent atmosphere, as on page 1 of the reference deck:
// a soft disc a little over 1.5x the planet, free to overlap its neighbours.
const HALO_R = 90;
const HALO_ALPHA = 0.16;

// The discs in logo_white.png are opaque but the wordmark is only ~62% white,
// which is why it sinks into the photo. The reference deck shows it solid, so
// the sprite is drawn three times: compositing the same texture over itself
// lifts 0.62 to 1-0.38^3 ≈ 0.95 and leaves the already-opaque discs untouched.
const LOGO_PASSES = 3;

// A label is fully hidden once it reaches a disc's edge and fades in over the
// next few pixels, so text never lands on a planet.
const LABEL_FADE = 26;

// The wordmark's own box inside the logo, measured from the PNG. Labels keep
// clear of it for the same reason they keep clear of the discs.
const WORDMARK = {
  x0: LOGO_X + 47,
  x1: LOGO_X + 370,
  y0: LOGO_Y + 192,
  y1: LOGO_Y + 255,
};

// Labels closer than this print into each other; the further one drops out.
const LABEL_PAD = 10;

const DOT_R = 6;

const MAX_SATELLITES = 4;
const MAX_LABEL_CHARS = 18;

// Orbit labels have to stay readable while they move. A list curated in
// _data/header_orbits.yml is taken as given, in its own order; a list pulled
// from another data file prefers the shortest names rather than truncating long
// ones into nonsense, keeping the file's order for the names that make the cut.
function pickLabels(group) {
  const names = (group.items || []).filter((name) => typeof name === 'string' && name.trim());
  const keep = new Set(
    group.curated
      ? names.slice(0, MAX_SATELLITES)
      : [...names].sort((a, b) => a.length - b.length).slice(0, MAX_SATELLITES),
  );
  return names
    .filter((name) => keep.has(name))
    .map((name) => (name.length > MAX_LABEL_CHARS ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…` : name));
}

function readGroups() {
  const el = document.getElementById('osfarm-orbit-data');
  if (!el) return null;
  try {
    const groups = JSON.parse(el.textContent).groups;
    return Array.isArray(groups) && groups.length === 3 ? groups : null;
  } catch {
    return null;
  }
}

// Spread n items over the ellipse, offset so neighbouring planets are out of phase.
function seedAngles(n, planetIndex) {
  const step = (Math.PI * 2) / n;
  const offset = (planetIndex * Math.PI * 2) / 3;
  return Array.from({ length: n }, (_, i) => i * step + offset);
}

function makeTextStyle(size, weight) {
  return new TextStyle({
    fontFamily: ['Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
    fontSize: size,
    fontWeight: weight,
    fill: 0xffffff,
    // The header sits on a photo, so every label carries its own contrast: the
    // stroke holds the letterforms against grass, the shadow lifts them off it.
    stroke: { color: 0x0b2010, width: 3, join: 'round', alpha: 0.55 },
    dropShadow: { color: 0x0b2010, alpha: 0.85, blur: 6, distance: 1, angle: Math.PI / 2 },
  });
}

function buildScene(logoTexture, groups) {
  const root = new Container();
  root.sortableChildren = true;

  // A blurred black copy of the mark, under the mark itself: it hugs the
  // letterforms, so the white wordmark holds against a pale sky without
  // darkening the area around it.
  const shadow = new Sprite(logoTexture);
  shadow.position.set(LOGO_X, LOGO_Y + 4);
  shadow.setSize(LOGO.w, LOGO.h);
  shadow.tint = 0x000000;
  shadow.alpha = 0.45;
  shadow.filters = [new BlurFilter({ strength: 10 })];
  shadow.zIndex = -1;
  root.addChild(shadow);

  for (let pass = 0; pass < LOGO_PASSES; pass += 1) {
    const logo = new Sprite(logoTexture);
    logo.position.set(LOGO_X, LOGO_Y);
    logo.setSize(LOGO.w, LOGO.h);
    logo.zIndex = 0;
    root.addChild(logo);
  }

  const satelliteStyle = makeTextStyle(15, 400);
  const satellites = [];
  const captions = [];

  groups.forEach((group, i) => {
    const { x: cx, y: cy } = DISCS[i];
    const tilt = ORBIT.tilt[i];

    const halo = new Graphics();
    halo.circle(cx, cy, HALO_R).fill({ color: group.color, alpha: HALO_ALPHA });
    halo.zIndex = -3;
    root.addChild(halo);

    const ring = new Graphics();
    ring.ellipse(0, 0, ORBIT.rx, ORBIT.ry).stroke({ width: 1.5, color: 0xffffff, alpha: 0.28 });
    ring.position.set(cx, cy);
    ring.rotation = tilt;
    ring.zIndex = -2;
    root.addChild(ring);


    const names = pickLabels(group);
    const angles = seedAngles(names.length || 1, i);

    names.forEach((name, j) => {
      const node = new Container();

      const dot = new Graphics();
      dot.circle(0, 0, DOT_R).fill(group.color).stroke({ width: 2, color: 0xffffff, alpha: 0.75 });
      node.addChild(dot);

      const label = new Text({ text: name, style: satelliteStyle });
      label.anchor.set(0.5, 0);
      node.addChild(label);
      captions.push(label);

      root.addChild(node);
      satellites.push({ node, label, cx, cy, tilt, angle: angles[j], speed: ORBIT.speed[i], depth: 0 });
    });
  });

  return { root, satellites, captions };
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// The box a label actually paints into, in scene space. The node carries a
// depth scale and the label hangs off it, so neither can be ignored here.
function labelBox(sat) {
  const scale = sat.node.scale.x;
  const halfWidth = (sat.label.width * scale) / 2;
  const height = sat.label.height * scale;
  const y = sat.node.y + sat.label.y * scale;
  const above = sat.label.anchor.y === 1;
  return {
    x0: sat.node.x - halfWidth,
    x1: sat.node.x + halfWidth,
    y0: above ? y - height : y,
    y1: above ? y : y + height,
  };
}

function pointGap(box, x, y) {
  return Math.hypot(Math.max(box.x0 - x, x - box.x1, 0), Math.max(box.y0 - y, y - box.y1, 0));
}

function boxGap(a, b) {
  return Math.hypot(Math.max(a.x0 - b.x1, b.x0 - a.x1, 0), Math.max(a.y0 - b.y1, b.y0 - a.y1, 0));
}

// Rings centred on discs only 8.5px apart necessarily cross their neighbours,
// so a satellite may pass in front of any planet — that transit is the point.
// Its *label* may not: text written across a disc, across the wordmark, or over
// another label or dot is unreadable. Geometry cannot prevent any of it, so all
// four cases are resolved here, on the boxes the text really occupies.
function placeLabels(satellites) {
  const boxes = satellites.map(labelBox);

  satellites.forEach((sat, i) => {
    let clear = boxGap(boxes[i], WORDMARK);
    for (const disc of DISCS) {
      clear = Math.min(clear, pointGap(boxes[i], disc.x, disc.y) - LOGO.discR);
    }
    // Only the near half of an orbit carries readable text, and it fades out
    // over LABEL_FADE as it approaches whatever it would otherwise cover.
    sat.label.alpha = sat.depth * sat.depth * clamp01(clear / LABEL_FADE);
  });

  for (let i = 0; i < satellites.length; i += 1) {
    const a = satellites[i];
    if (a.label.alpha <= 0) continue;

    for (let j = 0; j < satellites.length; j += 1) {
      if (i === j) continue;
      const b = satellites[j];

      // A dot always wins over someone else's label: it is the thing orbiting.
      if (pointGap(boxes[i], b.node.x, b.node.y) < DOT_R + 4) {
        a.label.alpha = 0;
        break;
      }

      // Of two labels that meet, the one further from the viewer gives way.
      if (b.label.alpha > 0 && boxGap(boxes[i], boxes[j]) < LABEL_PAD && a.depth < b.depth) {
        a.label.alpha = 0;
        break;
      }
    }
  }
}

// Places every satellite for a given time; also used for the single static
// frame drawn when the visitor prefers reduced motion.
function layout(satellites, elapsedSeconds) {
  for (const sat of satellites) {
    const a = sat.angle + sat.speed * elapsedSeconds;
    const ox = Math.cos(a) * ORBIT.rx;
    const oy = Math.sin(a) * ORBIT.ry;
    const cos = Math.cos(sat.tilt);
    const sin = Math.sin(sat.tilt);
    const y = sat.cy + ox * sin + oy * cos;

    sat.node.position.set(sat.cx + ox * cos - oy * sin, y);

    // Keep the label on the outside of the ring: below the dot on the lower arc,
    // above it on the upper arc, so it never lies across the planet.
    const above = y < sat.cy;
    sat.label.anchor.set(0.5, above ? 1 : 0);
    sat.label.y = above ? -10 : 10;

    // The near side of every orbit is the upper arc, so the system reads as
    // seen slightly from below. That is not a cosmetic choice: only 43px
    // separate the discs from the top of the wordmark, so the lower arc has no
    // room for text. Putting the near — and therefore brightest — side where
    // the clear space is, is what lets the labels be read at all.
    sat.depth = (1 - Math.sin(a)) / 2;
    sat.node.zIndex = Math.sin(a) < 0 ? 10 : -10;
    sat.node.scale.set(0.8 + 0.2 * sat.depth);
    sat.node.alpha = 0.45 + 0.55 * sat.depth;
  }

  placeLabels(satellites);
}

function fit(scene, host, link) {
  const w = host.clientWidth;
  const h = host.clientHeight;
  if (!w || !h) return;

  const compact = w < COMPACT_MAX_WIDTH;
  const view = compact ? VIEW_COMPACT : VIEW_FULL;
  const scale = Math.min(w / view.w, h / view.h);
  const originX = (w - view.w * scale) / 2 - view.x * scale;
  const originY = (h - view.h * scale) / 2 - view.y * scale;

  scene.root.scale.set(scale);
  scene.root.position.set(originX, originY);

  for (const caption of scene.captions) caption.visible = !compact;

  // Park the home link exactly over the logo PixiJS just drew, so the click
  // target follows the artwork at every size.
  link.style.left = `${originX + LOGO_X * scale}px`;
  link.style.top = `${originY + LOGO_Y * scale}px`;
  link.style.width = `${LOGO.w * scale}px`;
  link.style.height = `${LOGO.h * scale}px`;
}

async function mount() {
  const host = document.querySelector('.logo-stage');
  if (!host) return;

  const link = host.querySelector('.logo-link');
  // The fallback <img> is the single source of truth for the logo URL, so the
  // Liquid `relative_url` filter keeps working under a baseurl.
  const fallback = host.querySelector('.logo');
  const groups = readGroups();
  if (!link || !fallback || !groups) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const app = new Application();
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoStart: !reduceMotion,
  });

  // Roboto has to resolve before the first Text is measured, otherwise the
  // labels are laid out against fallback metrics and never re-measured.
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* font loading is best-effort */
    }
  }

  const scene = buildScene(await Assets.load(fallback.src), groups);
  app.stage.addChild(scene.root);

  host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');
  host.classList.add('is-live');

  fit(scene, host, link);
  app.renderer.on('resize', () => fit(scene, host, link));

  if (reduceMotion) {
    layout(scene.satellites, 0);
    app.render();
    return;
  }

  let elapsed = 0;
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS / 1000;
    layout(scene.satellites, elapsed);
  });

  // Decorative only: stop burning frames once the header scrolls away.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? app.start() : app.stop()),
      { threshold: 0 },
    ).observe(host);
  }
}

mount().catch(() => {
  // WebGL unavailable, CDN blocked, whatever: the static logo stays in place.
});
