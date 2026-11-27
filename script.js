(() => {
  "use strict";

  const CONFIG = {
    spin: 0.55,
    tilt: 0.3,
    camDist: 4.0,
    popupDelay: 6,
  };

  const TAU = Math.PI * 2,
    PIVOT = 0.22,
    TOP = 1.06,
    AMB = 0.34;
  const SHADE = ".:-=+*%@",
    PS = ".:+*#%";
  const [LX, LY, LZ] = (() => {
    const v = [-0.45, 0.6, 0.66],
      m = Math.hypot(...v);
    return v.map((x) => x / m);
  })();
  const CEN = [0, 0.14, 0],
    DOME = 0.68,
    CORE = 0.5,
    STEM_CUT = 0.24,
    NECK = -0.1;
  const Y0 = -0.3,
    Y1 = 0.3,
    R0 = 0.05,
    R1 = 0.44,
    KC = (R1 - R0) / (Y1 - Y0),
    BY = -0.06;
  const ROSE = 0,
    DAISY = 1,
    TULIP = 2;

  const PAL = {
    rose1: ["#4a0a1c", "#8a1030", "#c4153f", "#ec2a5a", "#ff5c82", "#ffa0b8"],
    rose2: ["#6a2a44", "#a8567a", "#d98aab", "#f4b3cb", "#ffd6e4", "#fff0f5"],
    rose3: ["#7a3a1c", "#b86a3c", "#e89a6a", "#ffb894", "#ffd2b8", "#ffe8dc"],
    rose4: ["#3a2a6a", "#6a54a8", "#9a86d4", "#b8a8ea", "#d6caf8", "#efeaff"],
    daisy: ["#8a90a0", "#b8bdc9", "#dde0e8", "#f2f4f8", "#ffffff"],
    aster: ["#3a2a6a", "#6a54a8", "#9a86d4", "#b8a8ea", "#d6caf8"],
    gold: ["#7a5a08", "#b8860b", "#f0a500", "#ffc83d", "#ffe58a"],
    tulR: ["#5a0a14", "#a01428", "#d82840", "#ff4560", "#ff8a98"],
    tulY: ["#8a6a08", "#d4a010", "#ffc83d", "#ffe066", "#fff0a8"],
    tulP: ["#6a2a6a", "#a050a0", "#d080d0", "#eaa8ea", "#f8d0f8"],
    tulK: ["#8a2a50", "#c8507c", "#f07aa4", "#ffa8c4", "#ffd0e0"],
    green: ["#0e3b1d", "#16572a", "#1f7a39", "#2e9a4d", "#52b96d", "#8ad69b"],
    euc: ["#1c4a3a", "#2e6e58", "#4e9078", "#76b09a", "#a4d0bc"],
    paper: ["#6b3a52", "#a35a7c", "#d98aab", "#f4b3cb", "#ffd6e4"],
    cream: ["#8a7a60", "#c4b498", "#e8dcc4", "#fff4e0", "#ffffff"],
    rib: ["#5a0f1d", "#a0162f", "#d81e44", "#ff4d79", "#ffb3c6"],
    twine: ["#5a4020", "#94703a", "#c4a468", "#e8d098"],
  };
  const HEARTS = ["#e8366b", "#ff4d79", "#ff7a9c", "#ffa0b8", "#ffc8d6"];

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const norm = (v) => {
    const m = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / m, v[1] / m, v[2] / m];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const basis = (ax) => {
    const h = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0],
      u = norm(cross(h, ax));
    return [u, cross(ax, u)];
  };
  const pick = (p, b) => p[clamp(Math.floor(b * p.length), 0, p.length - 1)];
  const easeBack = (x) => {
    x = clamp(x, 0, 1);
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
  };
  const mulberry = (a) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const coneR = (y) => Math.max(R0, R0 + KC * (y - Y0));
  const onCone = (xo, y, lift) => {
    const r = coneR(y),
      phi = clamp(xo / r, -1.5, 1.5),
      sp = Math.sin(phi),
      cp = Math.cos(phi);
    return [r * sp, r * cp + lift, norm([sp, -KC, cp])];
  };

  function buildScene(K) {
    const rnd = mulberry(21),
      R = (a, b) => a + (b - a) * rnd(),
      n1 = (n) => Math.max(3, Math.floor(n * K));
    const pts = [];
    const P = (x, y, z, n, pal, tone = 0, two = true, ov = null, zb = 0) =>
      pts.push([x, y, z, n[0], n[1], n[2], pal, tone, two, ov, zb]);

    const wish = [];
    [
      PAL.rose1,
      PAL.rose2,
      PAL.rose3,
      PAL.rose4,
      PAL.rose1,
      PAL.rose2,
      PAL.rose3,
    ].forEach((p) => wish.push([ROSE, p, 0.18]));
    [PAL.daisy, PAL.daisy, PAL.aster, PAL.daisy, PAL.daisy, PAL.daisy].forEach(
      (p) => wish.push([DAISY, p, 0.13]),
    );
    [PAL.tulR, PAL.tulY, PAL.tulP, PAL.tulK, PAL.tulR].forEach((p) =>
      wish.push([TULIP, p, 0.13]),
    );

    const placed = [],
      slots = [],
      shi = Math.sin((86 * Math.PI) / 180);
    [...wish.keys()]
      .sort((a, b) => wish[b][2] - wish[a][2])
      .forEach((idx) => {
        const [kind, pal, Rr] = wish[idx],
          slo = Math.sin(((kind === TULIP ? 40 : 12) * Math.PI) / 180);
        let factor = 0.82,
          pos,
          d;
        for (let at = 0; at < 480; at++) {
          if (at && at % 80 === 0) factor *= 0.92;
          const s = R(slo, shi),
            c = Math.sqrt(1 - s * s),
            az = R(0, TAU);
          d = [c * Math.cos(az), s, c * Math.sin(az)];
          pos = add(CEN, d, DOME * R(0.97, 1.04));
          if (placed.every(([q, Rq]) => dist(pos, q) >= factor * (Rr + Rq)))
            break;
        }
        placed.push([pos, Rr]);
        slots.push({ kind, pal, R: Rr, pos, d });
      });
    slots.sort((a, b) => a.d[1] - b.d[1]);

    const flowers = slots.map((s, rank) => {
      const axis = norm([
        s.d[0] + R(-0.18, 0.18),
        s.d[1] + R(-0.08, 0.2),
        s.d[2] + R(-0.18, 0.18),
      ]);
      const base = add(s.pos, axis, -0.03);
      if (base[1] > STEM_CUT) {
        const tc = (base[1] - STEM_CUT) / (base[1] - NECK),
          ns = n1(22);
        for (let j = 0; j < ns; j++) {
          const t = (tc * j) / (ns - 1);
          P(
            base[0] * (1 - t),
            base[1] + (NECK - base[1]) * t,
            base[2] * (1 - t),
            [axis[0], 0, axis[2]],
            PAL.green,
            -0.25,
          );
        }
      }
      const [u, v] = basis(axis);
      return {
        ...s,
        axis,
        u,
        v,
        seed: R(0, 6.28),
        delay: 0.45 + rank * 0.12 + R(0, 0.12),
      };
    });

    for (let i = 0; i < n1(900); i++) {
      const el = R(0.2, 1.5),
        az = R(0, TAU),
        d = [
          Math.cos(el) * Math.cos(az),
          Math.sin(el),
          Math.cos(el) * Math.sin(az),
        ];
      const q = add(CEN, d, CORE * 0.98);
      if (q[1] > 0.27) P(q[0], q[1], q[2], d, PAL.green, R(-0.35, -0.1), false);
    }

    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * TAU + R(-0.1, 0.1),
        c = Math.cos(a),
        s = Math.sin(a);
      const base = [0.3 * c, 0.27, 0.3 * s],
        d = norm([c, 0.3 + R(-0.1, 0.15), s]),
        side = [-s, 0, c],
        n = norm(cross(side, d));
      const Ll = R(0.3, 0.4),
        W = 0.075,
        nu = n1(24),
        nv = n1(9) | 1;
      for (let ti = 0; ti < nu; ti++) {
        const t = ti / (nu - 1),
          wid =
            W * Math.sin(Math.PI * t ** 0.85) * (1 + 0.1 * Math.sin(26 * t));
        for (let wi = 0; wi < nv; wi++) {
          const w = (wi / (nv - 1)) * 2 - 1,
            rib = wi === nv >> 1 ? 0.22 : 0;
          P(
            base[0] + d[0] * Ll * t + side[0] * wid * w,
            base[1] + d[1] * Ll * t - 0.16 * t * t,
            base[2] + d[2] * Ll * t + side[2] * wid * w,
            n,
            PAL.green,
            rib - 0.28 - 0.15 * Math.abs(w),
          );
        }
      }
    }

    const rings = n1(52);
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1),
        r = R0 + (R1 - R0) * t,
        cnt = Math.max(10, Math.floor(170 * r * K));
      for (let j = 0; j < cnt; j++) {
        const ph = ((j + rnd() * 0.9) / cnt) * TAU,
          c = Math.cos(ph),
          s = Math.sin(ph),
          cuff = t > 0.9;
        const rr =
          r *
          (1 + 0.05 * (0.3 + 0.7 * t) * Math.sin(7 * ph + 1.3 * t)) *
          (cuff ? 1 + (0.08 * (t - 0.9)) / 0.1 : 1);
        const y =
          Y0 +
          (Y1 - Y0) * t +
          0.045 * (Math.abs(Math.sin(5 * ph + 0.3)) - 0.55) * t ** 4;
        const tone =
          0.3 +
          0.17 * Math.cos(7 * ph + 1.3 * t) -
          0.14 * (1 - t) +
          (cuff ? 0.1 : 0);
        P(
          rr * c,
          y,
          rr * s,
          norm([c, -KC, s]),
          cuff ? PAL.cream : PAL.paper,
          tone,
        );
      }
    }

    const br = coneR(BY) + 0.012,
      nb = n1(110);
    for (let j = 0; j < nb; j++) {
      const ph = (j / nb) * TAU,
        c = Math.cos(ph),
        s = Math.sin(ph);
      for (const dy of [-0.016, -0.005, 0.005, 0.016]) {
        const rr = br + KC * dy;
        P(
          rr * c,
          BY + dy,
          rr * s,
          [c, -0.1, s],
          PAL.rib,
          0.28 + 0.12 * Math.sin(3 * ph) + (dy === 0.005 ? 0.12 : 0),
        );
      }
    }
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++) {
        const [x, z, nn] = onCone(
          ((i / 5) * 2 - 1) * 0.03,
          BY + ((j / 5) * 2 - 1) * 0.026,
          0.03,
        );
        P(
          x,
          BY + ((j / 5) * 2 - 1) * 0.026,
          z,
          nn,
          PAL.rib,
          0.4 - (0.08 * j) / 5,
          true,
          null,
          0.02,
        );
      }

    for (const yy of [-0.43, -0.445])
      for (let j = 0; j < 24; j++) {
        const ph = (j / 24) * TAU;
        P(
          0.055 * Math.cos(ph),
          yy,
          0.055 * Math.sin(ph),
          [Math.cos(ph), 0, Math.sin(ph)],
          PAL.twine,
          0.25,
        );
      }

    const sparkles = Array.from({ length: 44 }, () => {
      const a = R(0, TAU),
        rr = R(0.8, 1.1);
      return [
        rr * Math.cos(a),
        R(-0.3, 1.0),
        rr * Math.sin(a),
        R(0, 6.28),
        R(1.5, 4),
      ];
    });
    const stars = Array.from({ length: 70 }, () => [
      rnd(),
      rnd(),
      R(0, 6.28),
      R(0.6, 2.2),
    ]);
    return { pts, flowers, sparkles, stars, K };
  }

  function tailPoints(t, K) {
    const out = [],
      nu = Math.max(8, Math.floor(24 * K)),
      nv = Math.max(3, Math.floor(5 * K));
    for (const side of [-1, 1])
      for (let i = 0; i < nu; i++) {
        const u = i / (nu - 1),
          sway = 0.035 * Math.sin(t * 1.7 + side * 0.9 + u * 2) * u;
        const xo = side * (0.04 + 0.065 * u) + sway,
          y = BY - 0.045 - 0.3 * u;
        for (let j = 0; j < nv; j++) {
          const v = (j / (nv - 1)) * 2 - 1;
          if (u > 1 - 0.14 * (1 - Math.abs(v))) continue;
          const [x, z, n] = onCone(xo + 0.02 * v, y, 0.016);
          out.push([
            x,
            y,
            z,
            n[0],
            n[1],
            n[2],
            PAL.rib,
            0.28 + 0.2 * Math.sin(5 * u + side),
            true,
            null,
            0.015,
          ]);
        }
      }
    return out;
  }

  const stage = document.getElementById("stage"),
    canvas = document.getElementById("bouquet"),
    ctx = canvas.getContext("2d");
  let cols, rows, cw, chh, fs, scale, scene, sceneK, chars, colors, zbuf;
  const hearts = Array.from({ length: 14 }, () => [
    Math.random(),
    Math.random() * 1.25,
    0.03 + Math.random() * 0.05,
    Math.random() * 6.28,
    HEARTS[(Math.random() * 5) | 0],
  ]);

  function resize() {
    const W = stage.clientWidth,
      H = stage.clientHeight,
      dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fs = clamp(Math.min(W / 100, H / 40 / 1.2), 7, 13);
    ctx.font = `700 ${fs}px "Courier New", ui-monospace, monospace`;
    cw = ctx.measureText("M").width;
    chh = fs * 1.2;
    cols = Math.floor(W / cw);
    rows = Math.floor(H / chh);
    scale = Math.max(1, Math.min((rows - 2) / 1.8, (cols - 2) / 3.5));
    const K = Math.round(clamp(scale / 24, 0.6, 1.6) * 4) / 4;
    if (!scene || K !== sceneK) {
      scene = buildScene(K);
      sceneK = K;
    }
    chars = Array.from({ length: rows }, () => Array(cols).fill(" "));
    colors = Array.from({ length: rows }, () => Array(cols).fill(""));
    zbuf = Array.from({ length: rows }, () => new Float32Array(cols));
  }

  function frame(t, ang) {
    for (let r = 0; r < rows; r++) {
      chars[r].fill(" ");
      zbuf[r].fill(-1e9);
    }
    const tilt = CONFIG.tilt + 0.035 * Math.sin(t * 0.5);
    const cam = {
      ca: Math.cos(ang),
      sa: Math.sin(ang),
      ct: Math.cos(tilt),
      st: Math.sin(tilt),
      cx: cols / 2,
      cy: 1 + (TOP - PIVOT) * scale,
      sxs: (scale * chh) / cw,
      sy: scale,
    };
    const D = CONFIG.camDist;

    const rot = (x, y, z, piv) => {
      const xr = x * cam.ca - z * cam.sa,
        zr = x * cam.sa + z * cam.ca,
        yp = piv ? y - PIVOT : y;
      return [xr, yp * cam.ct - zr * cam.st, yp * cam.st + zr * cam.ct];
    };
    const plot = (c, r, z, ch, color) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols && z > zbuf[r][c]) {
        zbuf[r][c] = z;
        chars[r][c] = ch;
        colors[r][c] = color;
      }
    };
    const project = (x, y, z) => {
      const [xr, yt, zt] = rot(x, y, z, true),
        f = D / (D - zt);
      return [
        Math.floor(cam.cx + xr * f * cam.sxs),
        Math.floor(cam.cy - yt * f * cam.sy),
        zt,
      ];
    };

    for (const [sx, sy, ph, sp] of scene.stars) {
      const tw = Math.sin(t * sp + ph),
        c = Math.floor(sx * cols),
        r = Math.floor(sy * rows);
      if (tw > 0.93) plot(c, r, -80, "+", "#fff");
      else if (tw > 0.5) plot(c, r, -80, "\u00b7", "#a8a0b8");
      else if (tw > 0) plot(c, r, -80, "\u00b7", "#605870");
    }
    for (const h of hearts) {
      h[1] -= h[2] * 0.016;
      if (h[1] < 0) {
        h[0] = Math.random();
        h[1] = 1;
      }
      plot(
        Math.floor((h[0] + 0.015 * Math.sin(t * 1.2 + h[3])) * cols) % cols,
        Math.floor(h[1] * rows),
        -50,
        "\u2665",
        h[4],
      );
    }

    for (const fl of scene.flowers) {
      const g = easeBack((t - fl.delay) / 1.1);
      if (g > 0.02) rasterFlower(fl, g, t, cam, rot, D);
    }

    const drawPts = (list) => {
      for (const [x, y, z, nx, ny, nz, pal, tone, two, ov, zb] of list) {
        const [xr, yt, zt] = rot(x, y, z, true),
          f = D / (D - zt);
        const c = Math.floor(cam.cx + xr * f * cam.sxs),
          r = Math.floor(cam.cy - yt * f * cam.sy);
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const zz = zt + zb;
        if (zz <= zbuf[r][c]) continue;
        const nxr = nx * cam.ca - nz * cam.sa,
          nzr = nx * cam.sa + nz * cam.ca;
        const nyt = ny * cam.ct - nzr * cam.st,
          nzt = ny * cam.st + nzr * cam.ct;
        let dot = nxr * LX + nyt * LY + nzt * LZ;
        if (two && dot < 0) dot = -dot * 0.55;
        const b = clamp(AMB + 0.7 * Math.max(0, dot) + tone, 0, 0.999);
        zbuf[r][c] = zz;
        chars[r][c] = ov || SHADE[Math.floor(b * SHADE.length)];
        colors[r][c] = pick(pal, b);
      }
    };
    drawPts(scene.pts);
    drawPts(tailPoints(t, scene.K));

    for (const [x, y, z, ph, sp] of scene.sparkles) {
      const [c, r, zt] = project(x, y, z),
        tw = Math.sin(t * sp + ph);
      if (tw > 0.85) plot(c, r, zt, "*", "#fff");
      else if (tw > 0.4) plot(c, r, zt, "+", "#ffd6e4");
      else if (tw > 0) plot(c, r, zt, "\u00b7", "#ffa0b8");
    }
    paint();
  }

  function rasterFlower(fl, g, t, cam, rot, D) {
    const [xr, yt, zt] = rot(fl.pos[0], fl.pos[1], fl.pos[2], true),
      f = D / (D - zt);
    const fx = cam.cx + xr * f * cam.sxs,
      fy = cam.cy - yt * f * cam.sy;
    const Rr = fl.R * g * (1 + 0.03 * Math.sin(t * 1.6 + fl.seed));
    const dim = -0.4 * (1 - clamp((zt + 0.6) / 1.2, 0, 1));
    const Rx = Rr * f * cam.sxs,
      Ry = Rr * f * cam.sy,
      pal = fl.pal;
    const put = (row, col, z, b, pl, ch) => {
      zbuf[row][col] = z;
      chars[row][col] = ch ?? PS[Math.floor(b * PS.length)];
      colors[row][col] = pick(pl, b);
    };

    if (fl.kind === TULIP) {
      const rx = Rx * 0.8,
        ry = Ry * 1.35;
      if (ry < 0.5) return;
      for (
        let row = Math.max(0, Math.floor(fy - ry) - 1);
        row < Math.min(rows, Math.floor(fy + ry) + 2);
        row++
      ) {
        const v = (1 - (row + 0.5 - fy) / ry) / 2;
        if (v < 0 || v > 1) continue;
        const hw = 0.62 * Math.sin(Math.PI * 0.5 * Math.min(1, v * 1.5 + 0.05));
        for (
          let col = Math.max(0, Math.floor(fx - rx) - 1);
          col < Math.min(cols, Math.floor(fx + rx) + 2);
          col++
        ) {
          const xn = (col + 0.5 - fx) / rx / hw;
          if (
            Math.abs(xn) > 1 ||
            v > 0.72 + 0.28 * Math.cos(1.5 * Math.PI * xn) ** 2 ||
            zt + 0.03 <= zbuf[row][col]
          )
            continue;
          const seam =
              Math.abs(Math.abs(xn) - 0.33) < 0.12 && v > 0.3 ? -0.25 : 0,
            rim = Math.abs(xn) > 0.84 || v < 0.06 ? -0.25 : 0;
          put(
            row,
            col,
            zt + 0.03,
            clamp(0.52 - 0.3 * xn * hw + 0.1 * v + seam + rim + dim, 0, 0.999),
            pal,
          );
        }
      }
      return;
    }

    const [uxr, uyt, uzt] = rot(...fl.u, false),
      [vxr, vyt, vzt] = rot(...fl.v, false),
      [axr, ayt, azt] = rot(...fl.axis, false);
    const m11 = uxr * Rx,
      m12 = vxr * Rx,
      m21 = -uyt * Ry,
      m22 = -vyt * Ry;
    const big = Math.max(
      Math.abs(m11),
      Math.abs(m12),
      Math.abs(m21),
      Math.abs(m22),
    );
    if (big < 0.55) return;
    let det = m11 * m22 - m12 * m21;
    const thr = 0.55 * big;
    if (Math.abs(det) < thr) det = det >= 0 ? thr : -thr;
    const inv = 1 / det,
      ex = Math.hypot(m11, m12),
      ey = Math.hypot(m21, m22);
    const back = azt < -0.08,
      bl = 0.2 * (axr * LX + ayt * LY + azt * LZ);
    const isRose = fl.kind === ROSE,
      cr = isRose ? 0 : 0.3,
      base = isRose ? 0.5 : 0.62,
      slope = isRose ? 0 : 0.15,
      cup = isRose ? 0.45 : 0.1;
    const kz = Rr * cup * azt,
      off = (fl.seed + t * 0.3 + (1 - Math.min(g, 1)) * 2.5) / TAU;

    for (
      let row = Math.max(0, Math.floor(fy - ey) - 1);
      row < Math.min(rows, Math.floor(fy + ey) + 2);
      row++
    ) {
      const sy = row + 0.5 - fy,
        shy = (-0.26 * sy) / ey;
      for (
        let col = Math.max(0, Math.floor(fx - ex) - 1);
        col < Math.min(cols, Math.floor(fx + ex) + 2);
        col++
      ) {
        const sx = col + 0.5 - fx,
          a = (m22 * sx - m12 * sy) * inv,
          b2 = (m11 * sy - m21 * sx) * inv,
          s2 = a * a + b2 * b2;
        if (s2 > 1) continue;
        const zc = zt + Rr * (a * uzt + b2 * vzt) + kz * (1 - s2);
        if (zc <= zbuf[row][col]) continue;
        const s = Math.sqrt(s2),
          u01 = Math.atan2(b2, a) / TAU + off;
        const reach = isRose
          ? 0.9 + 0.1 * Math.cos(5 * TAU * u01)
          : 0.34 + 0.66 * Math.abs(Math.cos(13 * Math.PI * u01)) ** 1.2;
        if (s > reach) continue;
        const sh = shy - (0.2 * sx) / ex;
        if (back) {
          if (s < 0.5)
            put(
              row,
              col,
              zc,
              clamp(0.3 + sh + dim * 0.5, 0, 0.999),
              PAL.green,
              "%",
            );
          else
            put(
              row,
              col,
              zc,
              clamp(0.3 + sh + dim - (s > reach - 0.1 ? 0.2 : 0), 0, 0.999),
              pal,
            );
        } else if (isRose) {
          const sw = (((s * 2.4 - u01) % 1) + 1) % 1;
          let b = base + sh + bl + dim;
          if (sw < 0.22) b -= 0.3;
          else if (sw > 0.82) b += 0.16;
          if (s < 0.14) b -= 0.22;
          else if (s > reach - 0.1) b -= 0.28;
          put(row, col, zc, clamp(b, 0, 0.999), pal);
        } else if (s < cr) {
          put(
            row,
            col,
            zc,
            clamp(0.55 + 1.5 * sh + dim, 0, 0.999),
            PAL.gold,
            s < cr * 0.55 ? "@" : "o",
          );
        } else {
          put(
            row,
            col,
            zc,
            clamp(
              base +
                sh +
                bl +
                dim +
                slope * (s - 0.5) -
                (s > reach - 0.1 ? 0.25 : 0),
              0,
              0.999,
            ),
            pal,
          );
        }
      }
    }
  }

  function paint() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.font = `700 ${fs}px "Courier New", ui-monospace, monospace`;
    ctx.textBaseline = "top";
    for (let r = 0; r < rows; r++) {
      let run = "",
        last = "",
        start = 0;
      const flush = () => {
        if (run.trim()) {
          ctx.fillStyle = last;
          ctx.fillText(run, start * cw, r * chh);
        }
        run = "";
      };
      for (let c = 0; c < cols; c++) {
        const ch = chars[r][c],
          col = colors[r][c];
        if (ch !== " " && col !== last) {
          flush();
          last = col;
          start = c;
          run = ch;
        } else if (run) run += ch;
      }
      flush();
    }
  }

  const heart = document.getElementById("heart"),
    dlg = document.getElementById("msg");
  let running = false,
    t0 = 0,
    ang = 0,
    dragging = false,
    lastX = 0,
    popup;

  function loop(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    if (!dragging) ang += CONFIG.spin * 0.016;
    frame(t, ang);
    requestAnimationFrame(loop);
  }

  heart.addEventListener("click", () => {
    stage.classList.add("open");
    heart.disabled = true;
    running = true;
    t0 = performance.now();
    requestAnimationFrame(loop);
    popup = setTimeout(() => dlg.showModal(), CONFIG.popupDelay * 1000);
  });

  document.getElementById("close").onclick = () => dlg.close();
  document.getElementById("replay").onclick = () => {
    clearTimeout(popup);
    dlg.close();
    stage.classList.remove("open");
    setTimeout(() => {
      running = false;
    }, 1200);
    heart.disabled = false;
    heart.focus();
  };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      ang += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    }
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });

  new ResizeObserver(resize).observe(stage);
  resize();
})();
