/* SchoolCraft - voxel study builder for Mr. Mac's Review Arcade */
(function () {
  "use strict";

  var GAME_ID = "schoolcraft";
  var GAME_TITLE = "SchoolCraft";
  var SAVE_KEY = "schoolcraft.save.v1";
  var BEST_KEY = "schoolcraft.best.v1";
  var TILE_W = 72;
  var TILE_H = 36;
  var VOXEL_H = 18;
  var VIEW_PAD = 18;

  var BLOCKS = [
    { id: "road", label: "Road", color: "#8a7d64", side: "#5d5143", cost: { stone: 1 }, score: 8, h: 0.35 },
    { id: "timber", label: "Timber", color: "#a87445", side: "#6b432c", cost: { wood: 2 }, score: 12, h: 1 },
    { id: "brick", label: "Brick", color: "#c66c49", side: "#884430", cost: { clay: 2 }, score: 18, h: 1.1 },
    { id: "marble", label: "Marble", color: "#d7d2bd", side: "#9b9586", cost: { stone: 2 }, score: 24, h: 1.25 },
    { id: "column", label: "Column", color: "#efe1b5", side: "#b79b65", cost: { stone: 3, insight: 1 }, score: 38, h: 1.8 },
    { id: "glass", label: "Glass", color: "#73d6e8", side: "#3c8ea0", cost: { glass: 2 }, score: 28, h: 1.05 },
    { id: "roof", label: "Roof", color: "#8f4b76", side: "#5e304f", cost: { wood: 1, clay: 1 }, score: 22, h: 1.45 },
    { id: "scholar", label: "Scholar", color: "#f4c75f", side: "#a56f29", cost: { insight: 3, glass: 1 }, score: 65, h: 1.6 }
  ];

  var BLOCK_BY_ID = {};
  BLOCKS.forEach(function (b) { BLOCK_BY_ID[b.id] = b; });

  var BLUEPRINTS = [
    {
      id: "agora",
      label: "Ancient Agora",
      unlockAt: 1,
      note: "Columns, roads, and civic marble.",
      cost: { stone: 10, clay: 6, insight: 2 },
      pattern: [
        [-2, -1, "column"], [-1, -1, "marble"], [0, -1, "marble"], [1, -1, "marble"], [2, -1, "column"],
        [-2, 0, "road"], [-1, 0, "road"], [0, 0, "scholar"], [1, 0, "road"], [2, 0, "road"],
        [-2, 1, "column"], [-1, 1, "marble"], [0, 1, "marble"], [1, 1, "marble"], [2, 1, "column"]
      ]
    },
    {
      id: "aqueduct",
      label: "Aqueduct Line",
      unlockAt: 3,
      note: "Roman-style public works spine.",
      cost: { stone: 16, glass: 4, insight: 3 },
      pattern: [
        [-3, 0, "column"], [-2, 0, "marble"], [-1, 0, "column"], [0, 0, "marble"],
        [1, 0, "column"], [2, 0, "marble"], [3, 0, "column"],
        [-2, -1, "glass"], [0, -1, "glass"], [2, -1, "glass"]
      ]
    },
    {
      id: "library",
      label: "Library Quarter",
      unlockAt: 5,
      note: "Stacks, reading rooms, and archive roof.",
      cost: { wood: 16, clay: 10, insight: 5 },
      pattern: [
        [-2, -2, "timber"], [-1, -2, "timber"], [0, -2, "roof"], [1, -2, "timber"], [2, -2, "timber"],
        [-2, -1, "brick"], [-1, -1, "scholar"], [0, -1, "brick"], [1, -1, "scholar"], [2, -1, "brick"],
        [-2, 0, "road"], [-1, 0, "road"], [0, 0, "road"], [1, 0, "road"], [2, 0, "road"]
      ]
    },
    {
      id: "observatory",
      label: "Observatory Hill",
      unlockAt: 7,
      note: "Science glass, marble base, scholar core.",
      cost: { stone: 18, glass: 12, insight: 7 },
      pattern: [
        [-1, -1, "marble"], [0, -1, "glass"], [1, -1, "marble"],
        [-1, 0, "glass"], [0, 0, "scholar"], [1, 0, "glass"],
        [-1, 1, "marble"], [0, 1, "glass"], [1, 1, "marble"],
        [0, -2, "column"], [0, 2, "column"]
      ]
    }
  ];

  var FALLBACK_QUESTIONS = [
    {
      course: "Global History",
      prompt: "Which river valley civilization developed cuneiform writing?",
      choices: ["Sumer", "Han China", "Mali", "Inca"],
      correctText: "Sumer",
      explanation: "Sumerian city-states in Mesopotamia used cuneiform on clay tablets."
    },
    {
      course: "Global History",
      prompt: "The Code of Hammurabi is best known as an early example of:",
      choices: ["Written law", "A democratic constitution", "A feudal contract", "A factory system"],
      correctText: "Written law",
      explanation: "Hammurabi's Code publicly recorded laws and punishments in ancient Babylon."
    },
    {
      course: "Global History",
      prompt: "Which feature helped classical Greek city-states develop independently?",
      choices: ["Mountainous terrain", "Large deserts", "Monsoon winds", "A single empire-wide language"],
      correctText: "Mountainous terrain",
      explanation: "Mountains and islands encouraged separate polis development."
    },
    {
      course: "Global History",
      prompt: "The Roman aqueducts are mainly evidence of Roman achievement in:",
      choices: ["Engineering", "Buddhist philosophy", "Printing", "Ocean navigation"],
      correctText: "Engineering",
      explanation: "Aqueducts moved water into cities through durable public infrastructure."
    },
    {
      course: "U.S. History",
      prompt: "The Declaration of Independence was most directly influenced by which Enlightenment idea?",
      choices: ["Natural rights", "Mercantilism", "Divine right", "Appeasement"],
      correctText: "Natural rights",
      explanation: "Locke's natural rights theory shaped the argument for independence."
    },
    {
      course: "U.S. History",
      prompt: "The system of checks and balances was designed to:",
      choices: ["Limit the power of each branch", "End judicial review", "Create a monarchy", "Eliminate federalism"],
      correctText: "Limit the power of each branch",
      explanation: "Each branch can restrain the others so no single branch dominates."
    },
    {
      course: "Civics",
      prompt: "A citizen voting in a local school board election is practicing:",
      choices: ["Civic participation", "Judicial review", "Due process", "Imperialism"],
      correctText: "Civic participation",
      explanation: "Voting is a direct way citizens participate in public decision making."
    },
    {
      course: "Economics",
      prompt: "When demand rises and supply stays the same, the usual market result is:",
      choices: ["Higher price", "Lower price", "No scarcity", "A command economy"],
      correctText: "Higher price",
      explanation: "More demand competing for the same supply tends to push prices upward."
    },
    {
      course: "Earth Science",
      prompt: "Most earthquakes and volcanoes occur near:",
      choices: ["Plate boundaries", "The centers of continents", "Only deserts", "Only polar regions"],
      correctText: "Plate boundaries",
      explanation: "Plate interactions produce many earthquakes and volcanoes."
    },
    {
      course: "Living Environment",
      prompt: "Photosynthesis converts light energy into chemical energy stored mainly in:",
      choices: ["Glucose", "Carbon dioxide", "Oxygen gas", "DNA"],
      correctText: "Glucose",
      explanation: "Plants use light, carbon dioxide, and water to make glucose."
    },
    {
      course: "ELA",
      prompt: "A claim in an argument is strongest when it is supported by:",
      choices: ["Relevant evidence", "A larger font", "A longer title", "Unrelated examples"],
      correctText: "Relevant evidence",
      explanation: "Evidence must connect directly to the claim."
    },
    {
      course: "Math",
      prompt: "The slope of a line represents its:",
      choices: ["Rate of change", "Y-intercept only", "Total area", "Random error"],
      correctText: "Rate of change",
      explanation: "Slope measures how much y changes for each 1-unit change in x."
    }
  ];

  function $(id) { return document.getElementById(id); }
  function key(x, y) { return Math.round(x) + "," + Math.round(y); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function fmt(n) {
    try { return Math.round(Number(n) || 0).toLocaleString(); } catch (e) { return String(Math.round(Number(n) || 0)); }
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&#39;";
    });
  }
  function hash2(x, y, seed) {
    var n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  var canvas = $("worldCanvas");
  var ctx = canvas.getContext("2d");
  var dpr = 1;
  var view = { w: 0, h: 0 };
  var lastFrame = 0;
  var raf = 0;
  var soundOn = true;
  var questionPool = [];
  var activeQuestion = null;
  var toastTimer = 0;

  var dom = {
    setupScreen: $("setupScreen"),
    questionScreen: $("questionScreen"),
    pauseScreen: $("pauseScreen"),
    endScreen: $("endScreen"),
    startBtn: $("startBtn"),
    saveBtn: $("saveBtn"),
    finishBtn: $("finishBtn"),
    pauseBtn: $("pauseBtn"),
    exitBtn: $("exitBtn"),
    resumeBtn: $("resumeBtn"),
    newCityBtn: $("newCityBtn"),
    pauseExitBtn: $("pauseExitBtn"),
    returnBuildBtn: $("returnBuildBtn"),
    againBtn: $("againBtn"),
    soundBtn: $("soundBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    theme: $("worldTheme"),
    palette: $("paletteGrid"),
    resources: $("resourcesGrid"),
    charter: $("charterLines"),
    blueprints: $("blueprintList"),
    resumeCard: $("resumeCard"),
    leaderboardPanel: $("leaderboardPanel"),
    toast: $("toastLine"),
    questionMeta: $("questionMeta"),
    questionPrompt: $("questionPrompt"),
    choiceGrid: $("choiceGrid"),
    explanation: $("explanation"),
    questionCloseBtn: $("questionCloseBtn"),
    endGrid: $("endGrid"),
    hudScore: $("hudScore"),
    hudBlocks: $("hudBlocks"),
    hudInsight: $("hudInsight"),
    hudBiome: $("hudBiome"),
    hudCoords: $("hudCoords")
  };

  var state = freshState();

  function freshState() {
    return {
      phase: "setup",
      seed: Math.floor(Math.random() * 999999) + 1000,
      theme: "global",
      player: { x: 0, y: 0 },
      angle: -Math.PI / 4,
      pitch: -0.22,
      camera: { x: 0, y: 0 },
      selected: "road",
      mode: "build",
      placed: {},
      harvested: {},
      inventory: { wood: 24, stone: 22, clay: 14, glass: 8, insight: 0 },
      score: 0,
      answered: 0,
      correct: 0,
      blueprints: {},
      builtBlueprints: 0,
      startedAt: Date.now(),
      hover: null,
      message: "Build a study city. Gather resources and answer content challenges for upgrades."
    };
  }

  function startLoop() {
    if (raf) return;
    lastFrame = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(48, now - lastFrame);
    lastFrame = now;
    if (state.phase === "playing") {
      state.camera.x += (state.player.x - state.camera.x) * Math.min(1, dt / 120);
      state.camera.y += (state.player.y - state.camera.y) * Math.min(1, dt / 120);
    }
    render();
  }

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(view.w * dpr));
    canvas.height = Math.max(1, Math.floor(view.h * dpr));
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function baseTile(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    var n = hash2(x, y, state.seed);
    var m = hash2(Math.floor(x / 4), Math.floor(y / 4), state.seed + 17);
    if (Math.abs(((x * 7 + y * 11) % 37)) < 2 && m > 0.38) return { id: "river", label: "River", color: "#2e7ca7", edge: "#1f536f", resource: "glass" };
    if (n < 0.12) return { id: "forest", label: "Forest", color: "#2f7c4f", edge: "#1f5338", resource: "wood" };
    if (n < 0.22) return { id: "quarry", label: "Quarry", color: "#7d7b73", edge: "#55534d", resource: "stone" };
    if (n < 0.31) return { id: "clay", label: "Clay", color: "#a86145", edge: "#75412f", resource: "clay" };
    if (n < 0.38) return { id: "ruin", label: "Ruin", color: "#8d7a5b", edge: "#5d503d", resource: "stone" };
    if (m > 0.78) return { id: "meadow", label: "Meadow", color: "#6f9b55", edge: "#506f3f", resource: "wood" };
    if (m < 0.18) return { id: "sand", label: "Sand", color: "#b69b61", edge: "#7c6942", resource: "glass" };
    return { id: "plains", label: "Plains", color: "#4f8a55", edge: "#36613c", resource: null };
  }

  function placedCount() {
    return Object.keys(state.placed).length;
  }

  function playerCell() {
    return { x: Math.round(state.player.x), y: Math.round(state.player.y) };
  }

  function targetCell(distance) {
    var d = distance || 2.4;
    return {
      x: Math.round(state.player.x + Math.cos(state.angle) * d),
      y: Math.round(state.player.y + Math.sin(state.angle) * d)
    };
  }

  function worldToScreen(x, y, z) {
    var dx = x - state.camera.x;
    var dy = y - state.camera.y;
    return {
      x: view.w / 2 + (dx - dy) * (TILE_W / 2),
      y: view.h / 2 + 64 + (dx + dy) * (TILE_H / 2) - (z || 0) * VOXEL_H
    };
  }

  function screenToWorld(px, py) {
    var sx = px - view.w / 2;
    var sy = py - (view.h / 2 + 64);
    var rx = sx / (TILE_W / 2);
    var ry = sy / (TILE_H / 2);
    return {
      x: Math.round((ry + rx) / 2 + state.camera.x),
      y: Math.round((ry - rx) / 2 + state.camera.y)
    };
  }

  function drawDiamond(cx, cy, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke || "rgba(0,0,0,.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function shade(hex, amt) {
    var h = String(hex || "#888888").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = clamp(parseInt(h.slice(0, 2), 16) + amt, 0, 255);
    var g = clamp(parseInt(h.slice(2, 4), 16) + amt, 0, 255);
    var b = clamp(parseInt(h.slice(4, 6), 16) + amt, 0, 255);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function drawVoxel(cx, cy, block) {
    var h = Math.max(0.25, block.h || 1) * VOXEL_H;
    var topY = cy - h;
    var color = block.color;
    var side = block.side || shade(color, -45);
    ctx.beginPath();
    ctx.moveTo(cx - TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, topY + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, topY);
    ctx.closePath();
    ctx.fillStyle = shade(side, -20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, topY + TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, topY);
    ctx.closePath();
    ctx.fillStyle = side;
    ctx.fill();
    drawDiamond(cx, topY, color, "rgba(255,255,255,.22)");
    if (block.id === "scholar") {
      ctx.strokeStyle = "rgba(255,242,165,.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 10, topY - 12, 20, 20);
    }
  }

  function render() {
    ctx.clearRect(0, 0, view.w, view.h);
    drawMinecraftSky();
    drawVoxelWorld();
    drawCrosshair();
    drawHeldBlock();
  }

  function drawMinecraftSky() {
    var horizon = Math.round(view.h * 0.46);
    var sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#7fb7ef");
    sky.addColorStop(0.72, "#bde3ff");
    sky.addColorStop(1, "#e8f6ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, horizon);
    ctx.fillStyle = "#f2d15d";
    ctx.fillRect(Math.round(view.w * 0.76), Math.round(view.h * 0.1), 56, 56);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    for (var c = 0; c < 4; c++) {
      var bx = (c * 230 + state.seed % 140) % (view.w + 180) - 90;
      var by = 60 + c * 28;
      ctx.fillRect(bx, by, 54, 18);
      ctx.fillRect(bx + 32, by - 14, 70, 18);
      ctx.fillRect(bx + 88, by + 2, 58, 18);
    }
    var ground = ctx.createLinearGradient(0, horizon, 0, view.h);
    ground.addColorStop(0, "#6ba052");
    ground.addColorStop(0.55, "#477d3f");
    ground.addColorStop(1, "#2b5730");
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, view.w, view.h - horizon);
  }

  function cameraProject(x, y, z) {
    var dx = x - state.player.x;
    var dy = y - state.player.y;
    var dz = z - 1.62;
    var cos = Math.cos(state.angle);
    var sin = Math.sin(state.angle);
    var forward = dx * cos + dy * sin;
    var side = -dx * sin + dy * cos;
    var pitch = typeof state.pitch === "number" ? state.pitch : -0.22;
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    var depth = forward * cp - dz * sp;
    var vertical = forward * sp + dz * cp;
    if (depth <= 0.12) return null;
    var focal = Math.max(360, Math.min(620, view.w * 0.52));
    var scale = focal / depth;
    return {
      x: view.w / 2 + side * scale,
      y: view.h * 0.49 - vertical * scale,
      depth: depth,
      scale: scale,
      side: side
    };
  }

  function drawVoxelWorld() {
    var center = playerCell();
    var faces = [];
    var radius = view.w < 700 ? 7 : 10;
    var target = targetCell();
    for (var x = center.x - radius; x <= center.x + radius; x++) {
      for (var y = center.y - radius; y <= center.y + radius; y++) {
        var base = baseTile(x, y);
        var terrain = terrainBlockFor(base);
        var isTarget = target.x === x && target.y === y;
        addCube(faces, x, y, -0.45, x + 1, y + 1, base.id === "river" ? -0.06 : 0, terrain, { target: isTarget && !state.placed[key(x, y)], terrain: true });
        drawTerrainFeature(faces, x, y, base, isTarget);
        var built = state.placed[key(x, y)];
        if (built && BLOCK_BY_ID[built.id]) {
          var block = BLOCK_BY_ID[built.id];
          addCube(faces, x + 0.04, y + 0.04, 0, x + 0.96, y + 0.96, Math.max(0.22, block.h || 1), block, { target: isTarget, built: true });
        }
      }
    }
    faces.sort(function (a, b) { return b.depth - a.depth; });
    for (var i = 0; i < faces.length; i++) drawFace(faces[i]);
  }

  function terrainBlockFor(base) {
    if (base.id === "river") return { id: "water", color: "#2c84bd", side: "#1f5d85", top: "#49a8dd" };
    if (base.id === "sand") return { id: "sand", color: "#bba15f", side: "#866f3d", top: "#d6c174" };
    if (base.id === "quarry") return { id: "stone-node", color: "#7d7b73", side: "#56544e", top: "#9a978a" };
    if (base.id === "clay") return { id: "clay-node", color: "#a86145", side: "#74402e", top: "#c57555" };
    if (base.id === "ruin") return { id: "ruin-node", color: "#8d7a5b", side: "#5c4e3b", top: "#b09a70" };
    if (base.id === "forest" || base.id === "meadow") return { id: "grass", color: "#4f8a55", side: "#3b6b39", top: "#69a64e" };
    return { id: "grass", color: base.color, side: base.edge, top: "#67a84a" };
  }

  function drawTerrainFeature(faces, x, y, base, target) {
    var n = hash2(x, y, state.seed + 91);
    if (base.id === "forest") {
      addCube(faces, x + 0.38, y + 0.38, 0, x + 0.62, y + 0.62, 0.9, { color: "#7a4f2b", side: "#54331f", top: "#95633a" }, { feature: true });
      addCube(faces, x + 0.18, y + 0.18, 0.72, x + 0.82, y + 0.82, 1.45, { color: "#2f7c4f", side: "#1f5338", top: "#3f9a62" }, { target: target, feature: true });
    } else if (base.id === "quarry") {
      addCube(faces, x + 0.18, y + 0.18, 0, x + 0.82, y + 0.82, 0.42 + n * 0.18, { color: "#858279", side: "#5a5751", top: "#aaa69a" }, { target: target, feature: true });
    } else if (base.id === "clay") {
      addCube(faces, x + 0.16, y + 0.18, 0, x + 0.84, y + 0.82, 0.34, { color: "#b76748", side: "#7b432f", top: "#d48965" }, { target: target, feature: true });
    } else if (base.id === "ruin") {
      addCube(faces, x + 0.12, y + 0.18, 0, x + 0.46, y + 0.82, 0.75, { color: "#b8a06e", side: "#746145", top: "#dbc48c" }, { target: target, feature: true });
      addCube(faces, x + 0.56, y + 0.24, 0, x + 0.82, y + 0.76, 0.52, { color: "#b8a06e", side: "#746145", top: "#dbc48c" }, { feature: true });
    } else if (base.id === "river") {
      addCube(faces, x + 0.06, y + 0.06, -0.04, x + 0.94, y + 0.94, 0.04, { color: "#2c84bd", side: "#1f5d85", top: "#5fc4f2" }, { target: target, feature: true, alpha: 0.84 });
    }
  }

  function addCube(faces, x1, y1, z1, x2, y2, z2, block, opts) {
    opts = opts || {};
    var top = block.top || shade(block.color, 28);
    var side = block.side || shade(block.color, -42);
    var dark = shade(side, -30);
    var p = {
      a: { x: x1, y: y1, z: z1 }, b: { x: x2, y: y1, z: z1 }, c: { x: x2, y: y2, z: z1 }, d: { x: x1, y: y2, z: z1 },
      e: { x: x1, y: y1, z: z2 }, f: { x: x2, y: y1, z: z2 }, g: { x: x2, y: y2, z: z2 }, h: { x: x1, y: y2, z: z2 }
    };
    addFace(faces, [p.e, p.f, p.g, p.h], top, opts);
    addFace(faces, [p.a, p.b, p.f, p.e], side, opts);
    addFace(faces, [p.b, p.c, p.g, p.f], shade(side, -8), opts);
    addFace(faces, [p.c, p.d, p.h, p.g], dark, opts);
    addFace(faces, [p.d, p.a, p.e, p.h], shade(side, 8), opts);
  }

  function addFace(faces, points, color, opts) {
    var projected = [];
    var depth = 0;
    for (var i = 0; i < points.length; i++) {
      var p = cameraProject(points[i].x, points[i].y, points[i].z);
      if (!p) return;
      projected.push(p);
      depth += p.depth;
    }
    if (!faceInView(projected)) return;
    faces.push({
      points: projected,
      color: color,
      depth: depth / points.length,
      target: !!opts.target,
      alpha: opts.alpha || 1,
      built: !!opts.built
    });
  }

  function faceInView(points) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      minX = Math.min(minX, points[i].x);
      maxX = Math.max(maxX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxY = Math.max(maxY, points[i].y);
    }
    return maxX > -120 && minX < view.w + 120 && maxY > -120 && minY < view.h + 160;
  }

  function drawFace(face) {
    var pts = face.points;
    ctx.save();
    ctx.globalAlpha = face.alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
    ctx.strokeStyle = face.target ? "rgba(255,255,255,.9)" : (face.built ? "rgba(0,0,0,.38)" : "rgba(0,0,0,.18)");
    ctx.lineWidth = face.target ? 3 : 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawCrosshair() {
    if (state.phase !== "playing") return;
    var x = view.w / 2;
    var y = view.h / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeldBlock() {
    if (state.phase !== "playing") return;
    var block = selectedBlock();
    var size = Math.min(120, Math.max(78, view.w * 0.1));
    var x = view.w - size * 1.24;
    var y = view.h - size * 0.52;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = shade(block.side || block.color, -28);
    ctx.fillRect(0, size * 0.22, size * 0.28, size * 0.74);
    ctx.fillStyle = block.side || shade(block.color, -44);
    ctx.fillRect(size * 0.72, size * 0.22, size * 0.28, size * 0.74);
    ctx.fillStyle = block.color;
    ctx.fillRect(size * 0.12, 0, size * 0.78, size * 0.78);
    ctx.fillStyle = shade(block.color, 36);
    ctx.fillRect(size * 0.12, 0, size * 0.78, size * 0.16);
    ctx.strokeStyle = "rgba(0,0,0,.48)";
    ctx.lineWidth = 3;
    ctx.strokeRect(size * 0.12, 0, size * 0.78, size * 0.78);
    ctx.restore();
  }

  function drawTile(x, y) {
    var p = worldToScreen(x, y, 0);
    if (p.x < -TILE_W || p.x > view.w + TILE_W || p.y < -TILE_H || p.y > view.h + TILE_H * 3) return;
    var base = baseTile(x, y);
    drawDiamond(p.x, p.y, base.color, base.edge);
    if (base.id === "forest") {
      ctx.fillStyle = "rgba(8, 46, 28, 0.5)";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (base.id === "ruin") {
      ctx.fillStyle = "rgba(238, 222, 176, 0.5)";
      ctx.fillRect(p.x - 12, p.y - 8, 24, 5);
    }
    var built = state.placed[key(x, y)];
    if (built && BLOCK_BY_ID[built.id]) drawVoxel(p.x, p.y, BLOCK_BY_ID[built.id]);
    if (state.hover && state.hover.x === x && state.hover.y === y && state.phase === "playing") {
      ctx.save();
      ctx.strokeStyle = state.mode === "erase" ? "rgba(255,117,91,.9)" : "rgba(244,199,95,.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - TILE_H / 2);
      ctx.lineTo(p.x + TILE_W / 2, p.y);
      ctx.lineTo(p.x, p.y + TILE_H / 2);
      ctx.lineTo(p.x - TILE_W / 2, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlayer() {
    var p = worldToScreen(state.player.x, state.player.y, 1.4);
    ctx.save();
    ctx.shadowColor = "rgba(244,199,95,.65)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#f4c75f";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2f3845";
    ctx.fillRect(p.x - 6, p.y, 12, 18);
    ctx.restore();
  }

  function drawMinimap() {
    var size = 104;
    var x0 = view.w - size - 18;
    var y0 = view.h - size - 18;
    if (view.w < 920) return;
    ctx.save();
    ctx.fillStyle = "rgba(5,10,14,.58)";
    ctx.strokeStyle = "rgba(245,241,223,.18)";
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeRect(x0, y0, size, size);
    var keys = Object.keys(state.placed);
    for (var i = 0; i < keys.length; i++) {
      var parts = keys[i].split(",");
      var x = Number(parts[0]);
      var y = Number(parts[1]);
      var mx = x0 + size / 2 + (x - state.player.x) * 2;
      var my = y0 + size / 2 + (y - state.player.y) * 2;
      if (mx < x0 || mx > x0 + size || my < y0 || my > y0 + size) continue;
      var block = BLOCK_BY_ID[state.placed[keys[i]].id] || BLOCKS[0];
      ctx.fillStyle = block.color;
      ctx.fillRect(mx, my, 3, 3);
    }
    ctx.fillStyle = "#f4c75f";
    ctx.fillRect(x0 + size / 2 - 2, y0 + size / 2 - 2, 5, 5);
    ctx.restore();
  }

  function canAfford(cost) {
    var names = Object.keys(cost || {});
    for (var i = 0; i < names.length; i++) {
      if ((state.inventory[names[i]] || 0) < cost[names[i]]) return false;
    }
    return true;
  }

  function spend(cost) {
    var names = Object.keys(cost || {});
    for (var i = 0; i < names.length; i++) state.inventory[names[i]] -= cost[names[i]];
  }

  function grant(resource, amount) {
    state.inventory[resource] = (state.inventory[resource] || 0) + amount;
  }

  function selectedBlock() {
    return BLOCK_BY_ID[state.selected] || BLOCKS[0];
  }

  function buildAt(x, y, id, free) {
    if (typeof x !== "number" || typeof y !== "number") {
      var target = targetCell();
      x = target.x;
      y = target.y;
    }
    x = Math.round(x);
    y = Math.round(y);
    var block = BLOCK_BY_ID[id || state.selected];
    if (!block) return false;
    var k = key(x, y);
    if (baseTile(x, y).id === "river" && block.id !== "road" && block.id !== "glass") {
      toast("Use road or glass blocks to bridge river tiles.");
      return false;
    }
    if (!free && !canAfford(block.cost)) {
      toast("Need " + costText(block.cost) + " for " + block.label + ".");
      return false;
    }
    if (!free) spend(block.cost);
    state.placed[k] = { id: block.id, t: Date.now() };
    state.score += block.score;
    updateHud();
    scheduleSave();
    toast(block.label + " placed.");
    return true;
  }

  function eraseAt(x, y) {
    if (typeof x !== "number" || typeof y !== "number") {
      var target = targetCell();
      x = target.x;
      y = target.y;
    }
    x = Math.round(x);
    y = Math.round(y);
    var k = key(x, y);
    var built = state.placed[k];
    if (!built) {
      toast("No placed block on this tile.");
      return false;
    }
    var block = BLOCK_BY_ID[built.id];
    if (block && block.cost) {
      Object.keys(block.cost).forEach(function (r) {
        grant(r, Math.max(0, Math.floor(block.cost[r] / 2)));
      });
    }
    delete state.placed[k];
    state.score = Math.max(0, state.score - 4);
    updateHud();
    scheduleSave();
    toast((block ? block.label : "Block") + " removed.");
    return true;
  }

  function gatherAtPlayer() {
    var cell = targetCell(1.6);
    var tile = baseTile(cell.x, cell.y);
    if (!tile.resource) {
      cell = playerCell();
      tile = baseTile(cell.x, cell.y);
    }
    var k = key(cell.x, cell.y);
    if (state.harvested[k]) {
      toast("This block has already been mined.");
      return;
    }
    var resource = tile.resource;
    if (!resource) {
      toast("Aim at forest, quarry, clay, sand, river, or ruin blocks to gather.");
      return;
    }
    var amount = tile.id === "ruin" ? 4 : 3;
    state.harvested[k] = true;
    grant(resource, amount);
    state.score += 10;
    toast("Gathered " + amount + " " + resource + " from " + tile.label + ".");
    updateHud();
    scheduleSave();
  }

  function placeBlueprint(bp) {
    if (!bp) return;
    var center = playerCell();
    if (state.correct < bp.unlockAt) {
      toast("Answer " + bp.unlockAt + " content challenges to unlock " + bp.label + ".");
      openQuestion();
      return;
    }
    if (!canAfford(bp.cost)) {
      toast("Need " + costText(bp.cost) + " for " + bp.label + ".");
      return;
    }
    spend(bp.cost);
    for (var i = 0; i < bp.pattern.length; i++) {
      var item = bp.pattern[i];
      buildAt(center.x + item[0], center.y + item[1], item[2], true);
    }
    state.blueprints[bp.id] = true;
    state.builtBlueprints = Object.keys(state.blueprints).length;
    state.score += 900 + bp.pattern.length * 20;
    toast(bp.label + " placed.");
    updateHud();
    scheduleSave();
  }

  function costText(cost) {
    return Object.keys(cost || {}).map(function (k) { return cost[k] + " " + k; }).join(", ");
  }

  function move(dx, dy) {
    if (state.phase !== "playing") return;
    state.player.x += dx;
    state.player.y += dy;
    var cell = playerCell();
    var tile = baseTile(cell.x, cell.y);
    if (tile.id === "ruin" && !state.harvested[key(cell.x, cell.y)]) {
      toast("Ancient ruin found. Gather or answer a challenge for scholar blocks.");
    }
    updatePositionHud();
  }

  function moveLocal(forward, strafe) {
    var cos = Math.cos(state.angle);
    var sin = Math.sin(state.angle);
    move(cos * forward + -sin * strafe, sin * forward + cos * strafe);
  }

  function turn(delta) {
    if (state.phase !== "playing") return;
    state.angle += delta;
    while (state.angle > Math.PI) state.angle -= Math.PI * 2;
    while (state.angle < -Math.PI) state.angle += Math.PI * 2;
    updatePositionHud();
  }

  function look(delta) {
    if (state.phase !== "playing") return;
    state.pitch = clamp((state.pitch || -0.22) + delta, -0.48, 0.08);
  }

  function updatePositionHud() {
    var cell = playerCell();
    var target = targetCell();
    var aimed = baseTile(target.x, target.y);
    dom.hudBiome.textContent = aimed.label.toUpperCase().slice(0, 8);
    dom.hudCoords.textContent = cell.x + "," + cell.y;
  }

  function updateHud() {
    dom.hudScore.textContent = fmt(cityScore());
    dom.hudBlocks.textContent = fmt(placedCount());
    dom.hudInsight.textContent = fmt(state.inventory.insight || 0);
    updatePositionHud();
    renderPalette();
    renderResources();
    renderCharter();
    renderBlueprints();
  }

  function cityScore() {
    return state.score + placedCount() * 12 + state.correct * 240 + state.builtBlueprints * 1200;
  }

  function charterProgress() {
    var counts = countBlocks();
    return [
      { label: "Build roads", have: counts.road || 0, need: 10 },
      { label: "Raise columns", have: counts.column || 0, need: 6 },
      { label: "Answer challenges", have: state.correct, need: 5 },
      { label: "Place blueprints", have: state.builtBlueprints, need: 2 },
      { label: "Use scholar blocks", have: counts.scholar || 0, need: 2 }
    ];
  }

  function countBlocks() {
    var out = {};
    Object.keys(state.placed).forEach(function (k) {
      var id = state.placed[k].id;
      out[id] = (out[id] || 0) + 1;
    });
    return out;
  }

  function renderPalette() {
    var html = "";
    for (var i = 0; i < BLOCKS.length; i++) {
      var b = BLOCKS[i];
      html += '<button class="palette-btn' + (state.selected === b.id ? " active" : "") + '" type="button" data-block="' + esc(b.id) + '" title="' + esc(costText(b.cost)) + '">' +
        '<span class="swatch" style="background:' + esc(b.color) + '"></span><span>' + (i + 1) + " " + esc(b.label) + "</span></button>";
    }
    dom.palette.innerHTML = html;
    Array.from(dom.palette.querySelectorAll("[data-block]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.selected = btn.getAttribute("data-block");
        state.mode = "build";
        updateHud();
      });
    });
  }

  function renderResources() {
    var names = ["wood", "stone", "clay", "glass", "insight"];
    dom.resources.innerHTML = names.map(function (name) {
      return '<div class="resource-chip"><strong>' + fmt(state.inventory[name] || 0) + '</strong><span>' + esc(name) + '</span></div>';
    }).join("");
  }

  function renderCharter() {
    dom.charter.innerHTML = charterProgress().map(function (row) {
      var done = row.have >= row.need;
      return '<div class="charter-line' + (done ? " done" : "") + '"><span>' + esc(row.label) + '</span><strong>' + fmt(row.have) + "/" + fmt(row.need) + "</strong></div>";
    }).join("");
  }

  function renderBlueprints() {
    dom.blueprints.innerHTML = BLUEPRINTS.map(function (bp) {
      var unlocked = state.correct >= bp.unlockAt;
      var affordable = canAfford(bp.cost);
      var placed = !!state.blueprints[bp.id];
      return '<button class="blueprint-btn" type="button" data-bp="' + esc(bp.id) + '"' + ((!unlocked || !affordable) ? " disabled" : "") + '>' +
        '<strong>' + esc(bp.label) + (placed ? " built" : "") + '</strong>' +
        '<span>' + esc(bp.note) + '</span>' +
        '<span>' + (unlocked ? esc(costText(bp.cost)) : "Unlock: " + bp.unlockAt + " correct challenges") + '</span>' +
        '</button>';
    }).join("");
    Array.from(dom.blueprints.querySelectorAll("[data-bp]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-bp");
        var bp = BLUEPRINTS.filter(function (b) { return b.id === id; })[0];
        placeBlueprint(bp);
      });
    });
  }

  function normalizeQuestion(q) {
    if (!q) return null;
    var prompt = q.prompt || q.clue || q.question || "";
    var choices = Array.isArray(q.choices) ? q.choices.slice(0, 4) : [];
    var correct = q.correctText || q.answer || q.correct || "";
    if (!prompt || !correct) return null;
    if (!choices.length && Array.isArray(q.options)) choices = q.options.slice(0, 4);
    if (!choices.length) return null;
    var hasCorrect = choices.some(function (c) { return String(c).trim() === String(correct).trim(); });
    if (!hasCorrect) choices[0] = correct;
    choices = shuffle(choices).slice(0, 4);
    var item = {
      course: q.course || q.set || q.category || "Course Content",
      prompt: prompt,
      choices: choices,
      correctText: correct,
      explanation: q.explanation || q.sourceExplanation || ""
    };
    try {
      if (window.MrMacsValidQuestion && !window.MrMacsValidQuestion(item)) return null;
    } catch (e) {}
    return item;
  }

  function refreshQuestionPool() {
    var out = [];
    try {
      var bank = window.DIAG_BANK_BY_COURSE || {};
      Object.keys(bank).forEach(function (course) {
        if (!courseMatchesTheme(course)) return;
        var arr = bank[course] || [];
        for (var i = 0; i < arr.length && out.length < 300; i++) {
          var n = normalizeQuestion(Object.assign({ course: course }, arr[i]));
          if (n) out.push(n);
        }
      });
    } catch (e) {}
    questionPool = out.length ? out : FALLBACK_QUESTIONS.map(normalizeQuestion).filter(Boolean);
  }

  function courseMatchesTheme(course) {
    var c = String(course || "").toLowerCase();
    if (state.theme === "mixed") return true;
    if (state.theme === "ush") return /u\.?s|us history|apush|government|civics/.test(c);
    if (state.theme === "civics") return /civic|government|economics|pig|ap-us-government/.test(c);
    if (state.theme === "science") return /science|biology|earth|chem|physics|environment|living/.test(c);
    return /global|world|euro|history|social|ancient|regents/.test(c);
  }

  function openQuestion() {
    if (state.phase !== "playing") return;
    state.phase = "question";
    showScreen("question");
    if (window.MrMacsQuestionBank && !window.MrMacsQuestionBank.isLoaded()) {
      try {
        window.MrMacsQuestionBank.load({ priority: true }).then(function () {
          refreshQuestionPool();
        }).catch(function () {});
      } catch (e) {}
    }
    refreshQuestionPool();
    activeQuestion = questionPool[Math.floor(Math.random() * questionPool.length)] || FALLBACK_QUESTIONS[0];
    dom.questionMeta.textContent = (activeQuestion.course || "Course Content") + " Upgrade";
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.choiceGrid.innerHTML = activeQuestion.choices.map(function (choice) {
      return '<button type="button" data-choice="' + esc(choice) + '">' + esc(choice) + "</button>";
    }).join("");
    Array.from(dom.choiceGrid.querySelectorAll("button")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        answerQuestion(btn.getAttribute("data-choice"), btn);
      });
    });
  }

  function answerQuestion(choice, button) {
    if (!activeQuestion) return;
    var correct = String(choice).trim() === String(activeQuestion.correctText).trim();
    state.answered += 1;
    if (correct) {
      state.correct += 1;
      grant("insight", 2 + Math.floor(state.correct / 3));
      grant("stone", 2);
      grant("wood", 2);
      state.score += 420;
      button.classList.add("correct");
      dom.explanation.textContent = activeQuestion.explanation || "Correct. Upgrade resources added.";
      toast("Upgrade earned: insight and build resources added.");
    } else {
      state.score = Math.max(0, state.score - 40);
      button.classList.add("wrong");
      dom.explanation.textContent = "Correct answer: " + activeQuestion.correctText + ". " + (activeQuestion.explanation || "");
    }
    recordAnswer(activeQuestion, correct);
    Array.from(dom.choiceGrid.querySelectorAll("button")).forEach(function (btn) { btn.disabled = true; });
    updateHud();
    scheduleSave();
    window.setTimeout(function () {
      activeQuestion = null;
      if (state.phase === "question") {
        state.phase = "playing";
        showScreen(null);
      }
    }, correct ? 900 : 1500);
  }

  function recordAnswer(q, correct) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          gameId: GAME_ID,
          course: q.course || "All Courses",
          topic: "SchoolCraft Upgrade",
          prompt: q.prompt,
          correct: !!correct
        });
      }
    } catch (e) {}
    try {
      if (window.MrMacsReviewMix && window.MrMacsReviewMix.gradeIfResurfaced) {
        window.MrMacsReviewMix.gradeIfResurfaced(q, !!correct);
      }
    } catch (e) {}
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function showScreen(name) {
    document.body.classList.toggle("schoolcraft-menu-open", !!name);
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  function startGame(resume) {
    if (!resume) {
      var theme = dom.theme ? dom.theme.value : "global";
      state = freshState();
      state.theme = theme;
    }
    state.phase = "playing";
    state.camera.x = state.player.x;
    state.camera.y = state.player.y;
    showScreen(null);
    updateHud();
    startLoop();
    try { canvas.focus(); } catch (e) {}
    try { if (window.MrMacsArcadeMusic && soundOn) window.MrMacsArcadeMusic.start("empire-strategic", { volume: 0.42 }); } catch (e) {}
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({ id: GAME_ID, title: GAME_TITLE, course: "All Courses", file: "games/schoolcraft/index.html" });
      }
    } catch (e) {}
    toast("SchoolCraft world ready.");
  }

  function togglePause() {
    if (state.phase === "playing") {
      state.phase = "paused";
      saveGame();
      showScreen("pause");
      try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck) window.MrMacsArcadeMusic.duck(0.1, 180); } catch (e) {}
    } else if (state.phase === "paused") {
      state.phase = "playing";
      showScreen(null);
      try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore) window.MrMacsArcadeMusic.restore(180); } catch (e) {}
    }
  }

  function publishCity() {
    saveGame();
    state.phase = "ended";
    var score = cityScore();
    writeBest(score);
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit({ gameId: GAME_ID, score: score, meta: { blocks: placedCount(), correct: state.correct, blueprints: state.builtBlueprints } });
      }
    } catch (e) {}
    dom.endGrid.innerHTML = [
      ["Score", fmt(score)],
      ["Blocks", fmt(placedCount())],
      ["Correct", fmt(state.correct) + "/" + fmt(state.answered)],
      ["Blueprints", fmt(state.builtBlueprints)]
    ].map(function (row) {
      return '<div class="end-stat"><strong>' + esc(row[1]) + '</strong><span>' + esc(row[0]) + '</span></div>';
    }).join("");
    showScreen("end");
  }

  function savePayload() {
    return {
      version: 1,
      ts: Date.now(),
      seed: state.seed,
      theme: state.theme,
      player: state.player,
      angle: state.angle,
      pitch: state.pitch,
      selected: state.selected,
      placed: state.placed,
      harvested: state.harvested,
      inventory: state.inventory,
      score: state.score,
      answered: state.answered,
      correct: state.correct,
      blueprints: state.blueprints,
      builtBlueprints: state.builtBlueprints,
      startedAt: state.startedAt
    };
  }

  function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(savePayload())); } catch (e) {}
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, { score: cityScore(), blocks: placedCount(), correct: state.correct, ts: Date.now() });
      }
    } catch (e) {}
  }

  var saveTimer = 0;
  function scheduleSave() {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveGame, 450);
  }

  function loadGame() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      var next = freshState();
      Object.keys(next).forEach(function (k) {
      if (data[k] !== undefined) next[k] = data[k];
      });
      next.phase = "setup";
      next.angle = typeof next.angle === "number" ? next.angle : -Math.PI / 4;
      next.pitch = typeof next.pitch === "number" ? next.pitch : -0.22;
      next.camera = { x: next.player.x || 0, y: next.player.y || 0 };
      return next;
    } catch (e) {
      return null;
    }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    try { if (window.MrMacsSessions && window.MrMacsSessions.clear) window.MrMacsSessions.clear(GAME_ID); } catch (e) {}
  }

  function readBest() {
    try { return Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch (e) { return 0; }
  }

  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, String(Math.max(readBest(), Math.floor(v)))); } catch (e) {}
  }

  function renderSetupExtras() {
    var saved = loadGame();
    if (saved && placedCountFor(saved) > 0) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<strong>Resume saved city</strong><div>Score ' + fmt(saved.score || 0) + " - " + fmt(placedCountFor(saved)) + ' blocks - ' + fmt(saved.correct || 0) + ' correct</div>' +
        '<div class="setup-actions" style="justify-content:flex-start;margin-top:8px">' +
        '<button class="btn glass-pill" id="resumeSavedBtn" type="button">Resume City</button>' +
        '<button class="btn glass-pill" id="discardSavedBtn" type="button">Clear Save</button></div>';
      $("resumeSavedBtn").addEventListener("click", function () {
        state = saved;
        startGame(true);
      });
      $("discardSavedBtn").addEventListener("click", function () {
        clearSave();
        renderSetupExtras();
      });
    } else {
      dom.resumeCard.hidden = true;
      dom.resumeCard.innerHTML = "";
    }
    renderLeaderboard();
  }

  function placedCountFor(obj) {
    return obj && obj.placed ? Object.keys(obj.placed).length : 0;
  }

  function renderLeaderboard() {
    if (!dom.leaderboardPanel) return;
    try {
      var top = window.MrMacsLeaderboards && window.MrMacsLeaderboards.top ? window.MrMacsLeaderboards.top(GAME_ID, 5) : [];
      if (!top || !top.length) {
        var best = readBest();
        if (!best) {
          dom.leaderboardPanel.hidden = true;
          return;
        }
        dom.leaderboardPanel.hidden = false;
        dom.leaderboardPanel.innerHTML = "<strong>Best city score</strong><div>" + fmt(best) + "</div>";
        return;
      }
      dom.leaderboardPanel.hidden = false;
      dom.leaderboardPanel.innerHTML = '<strong>Top SchoolCraft Cities</strong>' + top.map(function (row, i) {
        return '<div class="charter-line"><span>#' + (i + 1) + " " + esc(row.name || row.displayName || "PLAYER") + '</span><strong>' + fmt(row.score) + "</strong></div>";
      }).join("");
    } catch (e) {
      dom.leaderboardPanel.hidden = true;
    }
  }

  function toast(message) {
    state.message = message;
    if (window.MrMacsToast && window.MrMacsToast.show) {
      try { window.MrMacsToast.show(message); } catch (e) {}
    }
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { dom.toast.classList.remove("show"); }, 2200);
  }

  function bindInput() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (state.phase === "question") {
          skipQuestion();
        } else if (state.phase === "playing" || state.phase === "paused") {
          togglePause();
        }
        e.preventDefault();
        return;
      }
      if (state.phase !== "playing") return;
      var k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") { moveLocal(0.56, 0); e.preventDefault(); return; }
      if (k === "ArrowDown" || k === "s" || k === "S") { moveLocal(-0.56, 0); e.preventDefault(); return; }
      if (k === "a" || k === "A") { moveLocal(0, -0.56); e.preventDefault(); return; }
      if (k === "d" || k === "D") { moveLocal(0, 0.56); e.preventDefault(); return; }
      if (k === "ArrowLeft" || k === "," || k === "[") { turn(-0.18); e.preventDefault(); return; }
      if (k === "ArrowRight" || k === "." || k === "]") { turn(0.18); e.preventDefault(); return; }
      if (k === "PageUp") { look(-0.08); e.preventDefault(); return; }
      if (k === "PageDown") { look(0.08); e.preventDefault(); return; }
      if (k >= "1" && k <= "8") {
        state.selected = BLOCKS[Number(k) - 1].id;
        state.mode = "build";
        updateHud();
        e.preventDefault();
        return;
      }
      if (k === " " || k === "Enter") { buildAt(); e.preventDefault(); return; }
      if (k === "e" || k === "E") { gatherAtPlayer(); e.preventDefault(); return; }
      if (k === "q" || k === "Q") { openQuestion(); e.preventDefault(); return; }
      if (k === "x" || k === "X" || k === "Backspace") { eraseAt(); e.preventDefault(); return; }
      if (k === "p" || k === "P") { togglePause(); e.preventDefault(); }
    });

    var pointer = { active: false, x: 0, y: 0, moved: 0, button: 0 };
    canvas.addEventListener("pointerdown", function (e) {
      if (state.phase !== "playing") return;
      pointer.active = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = 0;
      pointer.button = e.button || 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      try {
        if (document.pointerLockElement !== canvas && e.pointerType === "mouse") canvas.requestPointerLock();
      } catch (err) {}
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if ((!pointer.active && document.pointerLockElement !== canvas) || state.phase !== "playing") return;
      var dx = e.clientX - pointer.x;
      var dy = e.clientY - pointer.y;
      if (document.pointerLockElement === canvas) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      if (Math.abs(dx) > 0) turn(dx * 0.0065);
      if (Math.abs(dy) > 0) look(dy * 0.0035);
      e.preventDefault();
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!pointer.active) return;
      var shouldPlace = state.phase === "playing" && pointer.moved < 10 && pointer.button !== 2;
      pointer.active = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      if (shouldPlace) buildAt();
      e.preventDefault();
    });
    canvas.addEventListener("pointercancel", function () { pointer.active = false; });
    document.addEventListener("mousemove", function (e) {
      if (document.pointerLockElement !== canvas || state.phase !== "playing") return;
      turn((e.movementX || 0) * 0.0065);
      look((e.movementY || 0) * 0.0035);
    });
    canvas.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      if (state.phase !== "playing") return;
      eraseAt();
    });

    Array.from(document.querySelectorAll("[data-move]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.getAttribute("data-move").split(",");
        moveLocal(Number(parts[0]), Number(parts[1]));
      });
    });
    Array.from(document.querySelectorAll("[data-turn]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        turn(Number(btn.getAttribute("data-turn")));
      });
    });
    $("touchBuild").addEventListener("click", function () { buildAt(); });
    $("touchGather").addEventListener("click", gatherAtPlayer);
    $("touchQuiz").addEventListener("click", openQuestion);
    $("touchErase").addEventListener("click", function () { eraseAt(); });
  }

  function bindUi() {
    dom.startBtn.addEventListener("click", function () {
      clearSave();
      startGame(false);
    });
    dom.saveBtn.addEventListener("click", function () {
      saveGame();
      toast("SchoolCraft city saved on this device.");
    });
    dom.finishBtn.addEventListener("click", publishCity);
    dom.pauseBtn.addEventListener("click", togglePause);
    dom.exitBtn.addEventListener("click", exitToArcade);
    dom.resumeBtn.addEventListener("click", togglePause);
    dom.newCityBtn.addEventListener("click", function () {
      clearSave();
      state = freshState();
      state.theme = dom.theme ? dom.theme.value : "global";
      startGame(true);
    });
    dom.pauseExitBtn.addEventListener("click", exitToArcade);
    dom.returnBuildBtn.addEventListener("click", function () {
      state.phase = "playing";
      showScreen(null);
    });
    dom.againBtn.addEventListener("click", function () {
      clearSave();
      startGame(false);
    });
    dom.questionCloseBtn.addEventListener("click", skipQuestion);
    dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      try {
        if (!soundOn && window.MrMacsArcadeMusic) window.MrMacsArcadeMusic.stop();
        else if (soundOn && state.phase === "playing" && window.MrMacsArcadeMusic) window.MrMacsArcadeMusic.start("empire-strategic", { volume: 0.42 });
      } catch (e) {}
    });
    dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
  }

  function skipQuestion() {
    activeQuestion = null;
    if (state.phase === "question") {
      state.phase = "playing";
      showScreen(null);
    }
  }

  function exitToArcade() {
    saveGame();
    try { if (window.MrMacsArcadeMusic) window.MrMacsArcadeMusic.stop(); } catch (e) {}
    window.location.href = "../../index.html";
  }

  function mountHelp() {
    try {
      if (!window.MrMacsHelpOverlay) return;
      window.MrMacsHelpOverlay.register(GAME_ID, {
        title: "SchoolCraft",
        goal: "Explore a first-person block world, mine resources, place study blocks, and answer course-content challenges to unlock upgrades.",
        controls: [
          { key: "W/S", action: "Walk forward and backward" },
          { key: "A/D", action: "Strafe left and right" },
          { key: "Arrow left/right", action: "Look around" },
          { key: "1-8", action: "Select a block" },
          { key: "Space", action: "Place the selected block at the crosshair" },
          { key: "E", action: "Mine the block at the crosshair" },
          { key: "Q", action: "Answer a content challenge" },
          { key: "X", action: "Remove the placed block at the crosshair" }
        ],
        tips: [
          "Forests, quarries, clay, sand, rivers, and ruins provide different resources.",
          "Correct content answers add insight, which unlocks stronger civic and scholar blocks.",
          "Blueprints place complete districts near your current coordinate.",
          "Publish saves a city score to the arcade leaderboard."
        ]
      });
      window.MrMacsHelpOverlay.mountButton("#setupScreen .setup-actions", GAME_ID);
    } catch (e) {}
  }

  function boot() {
    resize();
    bindInput();
    bindUi();
    mountHelp();
    renderSetupExtras();
    showScreen("setup");
    updateHud();
    startLoop();
    window.addEventListener("resize", resize);
    window.addEventListener("mrmacs:question-bank-ready", refreshQuestionPool);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
