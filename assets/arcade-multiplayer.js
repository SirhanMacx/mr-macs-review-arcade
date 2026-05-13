/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Live Multiplayer rooms (WebRTC via PeerJS)
   No backend. No accounts. No passwords. The free PeerJS public
   signaling server (peerjs.com/peerserver) brokers WebRTC handshakes;
   everything after that is peer-to-peer DataChannel.

   Model:
     · A HOST creates a room with a 4-letter code (e.g. "ARC-DEF").
     · Up to 16 JOINERS connect by entering the same code.
     · Joiners pick 3-char initials (run through the leaderboards
       content filter so inappropriate initials become "PLR").
     · Messages flow JSON-encoded through DataChannel:
         { type, from, payload }
       Built-in types:
         host:announceState        host → all
         host:playerScoreSync      host → all
         host:gameOver             host → all
         host:kick                 host → one
         joiner:buzz               joiner → host
         joiner:answer             joiner → host
         joiner:leave              joiner → host

   Public API: window.MrMacsMultiplayer
     .available()                          → bool (peer lib loaded?)
     .host(opts) → Room                    create + announce a room
     .join(code, initials) → Room          join an existing room
     .codeFromHash() → string|null         e.g. "#room=ARC-DEF"
   Room instance methods:
     .code, .role ("host"|"joiner"), .self, .players[]
     .send(type, payload, toId?)           queues + broadcasts/unicasts
     .onMessage(handler)                   handler(msg, fromId)
     .onPlayersChange(handler)             handler(players[])
     .leave()                              tear down
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsMultiplayer) return;

  // Room-code alphabet — uppercase, no 0/O/1/I/L confusion
  var ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  var ROOM_PREFIX = "mrmac";  // PeerID = mrmac-XXXX-YYYY to avoid collisions with public PeerJS namespace
  // Max players per room (Jon: support full classroom — at least 30).
  // 40 leaves headroom for two teachers + 38 students. PeerJS DataChannels
  // scale fine to this size on modern devices.
  var MAX_PLAYERS = 40;
  var ACTIVE_ROOM_KEY = "arcade.mp.activeRoom.v1";

  function makeCode() {
    var s = "";
    for (var i = 0; i < 6; i++) {
      s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (i === 2) s += "-";
    }
    return s; // "ABC-DEF"
  }

  function peerIdFor(roomCode) {
    return ROOM_PREFIX + "-" + roomCode.replace(/[^A-Z0-9]/g, "");
  }

  function available() {
    return typeof root.Peer === "function";
  }

  function codeFromHash() {
    try {
      var h = String(location.hash || "");
      var m = h.match(/room=([A-Z]{3}-[A-Z]{3})/i);
      return m ? m[1].toUpperCase() : null;
    } catch (e) { return null; }
  }

  function sanitizeInitials(s) {
    if (root.MrMacsNameSafety && typeof root.MrMacsNameSafety.sanitizeInitials === "function") {
      return root.MrMacsNameSafety.sanitizeInitials(s, "PLR");
    }
    var raw = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (raw.length < 1) raw = "PLR";
    if (root.MrMacsLeaderboards && root.MrMacsLeaderboards.isBlockedName && root.MrMacsLeaderboards.isBlockedName(raw)) return "PLR";
    return raw;
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function safeSessionRemove(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }

  function rememberActiveRoom(room) {
    if (!room || !room.code || !room.role || !room.self) return false;
    return safeSessionSet(ACTIVE_ROOM_KEY, JSON.stringify({
      code: room.code,
      role: room.role,
      initials: sanitizeInitials(room.self.initials),
      savedAt: Date.now()
    }));
  }

  function activeDescriptor() {
    try {
      var raw = safeSessionGet(ACTIVE_ROOM_KEY);
      var desc = raw ? JSON.parse(raw) : null;
      if (!desc || !desc.code || !desc.role) return null;
      if (Date.now() - Number(desc.savedAt || 0) > 4 * 60 * 60 * 1000) {
        safeSessionRemove(ACTIVE_ROOM_KEY);
        return null;
      }
      return {
        code: String(desc.code).toUpperCase(),
        role: desc.role === "host" ? "host" : "joiner",
        initials: sanitizeInitials(desc.initials || (desc.role === "host" ? "HST" : "PLR"))
      };
    } catch (e) {
      return null;
    }
  }

  function clearActiveRoom(code) {
    var desc = activeDescriptor();
    if (!code || (desc && desc.code === code)) safeSessionRemove(ACTIVE_ROOM_KEY);
  }

  // ─── Room class ──────────────────────────────────────────────────────
  function Room(opts) {
    this.code = opts.code;
    this.role = opts.role;        // "host" | "joiner"
    this.self = opts.self;        // { id: peerId, initials }
    this.players = [];            // [{ id, initials, score, isHost, conn }]
    this._peer = null;
    this._connections = {};       // peerId → DataConnection (host only)
    this._hostConn = null;        // DataConnection (joiner only)
    this._messageHandlers = [];
    this._playersHandlers = [];
    this._destroyed = false;
  }
  Room.prototype.onMessage = function (h) {
    if (typeof h === "function") this._messageHandlers.push(h);
  };
  Room.prototype.onPlayersChange = function (h) {
    if (typeof h === "function") this._playersHandlers.push(h);
  };
  Room.prototype._fireMessage = function (msg, fromId) {
    for (var i = 0; i < this._messageHandlers.length; i++) {
      try { this._messageHandlers[i](msg, fromId); } catch (e) {}
    }
  };
  Room.prototype._firePlayers = function () {
    var copy = this.players.map(function (p) {
      return { id: p.id, initials: p.initials, score: p.score, isHost: !!p.isHost };
    });
    for (var i = 0; i < this._playersHandlers.length; i++) {
      try { this._playersHandlers[i](copy); } catch (e) {}
    }
  };

  Room.prototype.updateScore = function (score, meta) {
    var n = Number(score);
    if (!isFinite(n)) return false;
    n = Math.round(n);
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id === this.self.id) {
        this.players[i].score = Math.max(Number(this.players[i].score || 0), n);
        break;
      }
    }
    if (this.role === "host") {
      this._firePlayers();
      this.send("host:playerScoreSync", { players: serializablePlayers(this) });
      this.send("host:announceState", { players: serializablePlayers(this) });
    } else {
      this.send("joiner:score", { score: n, meta: meta || {} });
    }
    return true;
  };

  Room.prototype.send = function (type, payload, toId) {
    var msg = { type: type, from: this.self.id, payload: payload || null };
    var data = JSON.stringify(msg);
    try {
      if (this.role === "host") {
        if (toId) {
          var c = this._connections[toId];
          if (c && c.open) c.send(data);
        } else {
          // broadcast
          Object.keys(this._connections).forEach(function (pid) {
            var c2 = this._connections[pid];
            if (c2 && c2.open) c2.send(data);
          }.bind(this));
        }
      } else {
        if (this._hostConn && this._hostConn.open) this._hostConn.send(data);
      }
    } catch (e) {}
  };

  Room.prototype.leave = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    try {
      if (this.role === "joiner" && this._hostConn) {
        try { this.send("joiner:leave", { id: this.self.id }); } catch (e) {}
      }
    } catch (e) {}
    try { if (this._peer) this._peer.destroy(); } catch (e) {}
    clearActiveRoom(this.code);
  };

  // ─── host() ───────────────────────────────────────────────────────────
  function host(opts) {
    if (!available()) throw new Error("PeerJS not loaded");
    opts = opts || {};
    var code = (opts.code || makeCode()).toUpperCase();
    var initials = sanitizeInitials(opts.initials || "HST");
    var peerId = peerIdFor(code);
    var room = new Room({ code: code, role: "host", self: { id: peerId, initials: initials } });

    var peer = new root.Peer(peerId, { debug: 1 });
    room._peer = peer;
    // Host is the first player (themselves)
    room.players.push({ id: peerId, initials: initials, score: 0, isHost: true });

    peer.on("open", function () {
      rememberActiveRoom(room);
      if (typeof opts.onReady === "function") opts.onReady(room);
    });
    peer.on("error", function (err) {
      if (typeof opts.onError === "function") opts.onError(err);
    });
    peer.on("connection", function (conn) {
      conn.on("open", function () {
        room._connections[conn.peer] = conn;
        // Ask joiner for their initials
        try { conn.send(JSON.stringify({ type: "host:handshake", from: peerId, payload: { code: code } })); } catch (e) {}
      });
      conn.on("data", function (raw) {
        var msg = parseMsg(raw);
        if (!msg) return;
        if (msg.type === "joiner:hello") {
          // Cap enforcement: kindly reject if room is full
          if (room.players.length >= MAX_PLAYERS) {
            try {
              conn.send(JSON.stringify({
                type: "host:full",
                from: peerId,
                payload: { capacity: MAX_PLAYERS, message: "Room is full (" + MAX_PLAYERS + " players max)." }
              }));
              setTimeout(function () { try { conn.close(); } catch (e) {} }, 200);
            } catch (e) {}
            return;
          }
          var ini = sanitizeInitials(msg.payload && msg.payload.initials);
          // Prevent duplicate initials by appending an incrementing suffix
          var taken = new Set(room.players.map(function (p) { return p.initials; }));
          if (taken.has(ini)) {
            for (var n = 2; n < 99; n++) {
              var candidate = ini.slice(0, 2) + n;
              if (!taken.has(candidate)) { ini = candidate; break; }
            }
          }
          room.players.push({ id: conn.peer, initials: ini, score: 0, isHost: false });
          room._firePlayers();
          // Echo updated roster to everyone
          room.send("host:announceState", { players: serializablePlayers(room) });
        } else if (msg.type === "joiner:leave") {
          room.players = room.players.filter(function (p) { return p.id !== conn.peer; });
          room._firePlayers();
          room.send("host:announceState", { players: serializablePlayers(room) });
        } else if (msg.type === "joiner:score") {
          var score = Number(msg.payload && msg.payload.score);
          if (isFinite(score)) {
            for (var pi = 0; pi < room.players.length; pi++) {
              if (room.players[pi].id === conn.peer) {
                room.players[pi].score = Math.max(Number(room.players[pi].score || 0), Math.round(score));
                break;
              }
            }
            room._firePlayers();
            room.send("host:playerScoreSync", { players: serializablePlayers(room) });
          }
        } else {
          // Bubble up
          room._fireMessage(msg, conn.peer);
        }
      });
      conn.on("close", function () {
        delete room._connections[conn.peer];
        room.players = room.players.filter(function (p) { return p.id !== conn.peer; });
        room._firePlayers();
        room.send("host:announceState", { players: serializablePlayers(room) });
      });
    });

    room._firePlayers();
    return room;
  }

  function serializablePlayers(room) {
    return room.players.map(function (p) {
      return { id: p.id, initials: p.initials, score: p.score, isHost: !!p.isHost };
    });
  }

  // ─── join() ───────────────────────────────────────────────────────────
  function join(code, initials, opts) {
    if (!available()) throw new Error("PeerJS not loaded");
    opts = opts || {};
    var clean = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 6) throw new Error("Invalid room code (must be 6 alphanumeric chars).");
    var normalizedCode = clean.slice(0, 3) + "-" + clean.slice(3);
    var hostId = peerIdFor(normalizedCode);
    var myInitials = sanitizeInitials(initials);
    var myId = "mrmac-j-" + Math.random().toString(36).slice(2, 10);
    var room = new Room({ code: normalizedCode, role: "joiner", self: { id: myId, initials: myInitials } });

    var peer = new root.Peer(myId, { debug: 1 });
    room._peer = peer;

    peer.on("open", function () {
      var conn = peer.connect(hostId, { reliable: true });
      room._hostConn = conn;
      conn.on("open", function () {
        // Announce ourselves
        try { conn.send(JSON.stringify({ type: "joiner:hello", from: myId, payload: { initials: myInitials } })); } catch (e) {}
        rememberActiveRoom(room);
        if (typeof opts.onReady === "function") opts.onReady(room);
      });
      conn.on("data", function (raw) {
        var msg = parseMsg(raw);
        if (!msg) return;
        if (msg.type === "host:announceState") {
          var pl = (msg.payload && msg.payload.players) || [];
          room.players = pl.map(function (p) { return { id: p.id, initials: p.initials, score: p.score, isHost: !!p.isHost }; });
          room._firePlayers();
        } else if (msg.type === "host:playerScoreSync") {
          var sync = (msg.payload && msg.payload.players) || [];
          room.players = sync.map(function (p) { return { id: p.id, initials: p.initials, score: p.score, isHost: !!p.isHost }; });
          room._firePlayers();
        } else {
          room._fireMessage(msg, hostId);
        }
      });
      conn.on("close", function () {
        room._fireMessage({ type: "host:disconnected", from: hostId, payload: null }, hostId);
      });
    });

    peer.on("error", function (err) {
      var msg = (err && err.type === "peer-unavailable") ?
                "No room with that code. Check with your teacher." :
                "Connection error. Try again.";
      if (typeof opts.onError === "function") opts.onError({ err: err, friendly: msg });
    });

    return room;
  }

  function parseMsg(raw) {
    try {
      var m = JSON.parse(raw);
      if (m && typeof m === "object" && m.type) return m;
    } catch (e) {}
    return null;
  }

  // ─── Hub UI: floating "🎮 Multiplayer" button + room modal ────────────
  // Auto-mounts on hub (anywhere the body lacks data-game-page). Shows
  // a small button that opens a panel to host/join. Per-game pages can
  // wire their own controls via the public API.
  var STYLE_ID = "arcade-mp-styles";
  function injectStyles() {
    if (!document.head || document.getElementById(STYLE_ID)) return;
    var css =
      /* Multiplayer link — small, quiet, topnav-level. Solo play is primary. */
      ".mmp-nav-link{appearance:none;background:transparent;border:1px solid rgba(93,224,240,.20);color:rgba(216,220,235,.75);padding:6px 10px;border-radius:6px;font:600 12px/1 'Inter',sans-serif;letter-spacing:.02em;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:color 150ms,border-color 150ms,background 150ms;}\n" +
      ".mmp-nav-link:hover,.mmp-nav-link:focus-visible{color:#5de0f0;border-color:rgba(93,224,240,.5);background:rgba(93,224,240,.08);outline:none;}\n" +
      ".mmp-nav-link .mmp-icon{font-size:13px;line-height:1;opacity:.85;}\n" +
      "@media (max-width:720px){.mmp-nav-link .mmp-label{display:none;}}\n" +
      ".mmp-modal-bg{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:grid;place-items:center;padding:20px;}\n" +
      ".mmp-modal{width:min(420px,100%);background:linear-gradient(180deg,#11151f,#06070d);color:#f0f3fa;border:1px solid rgba(93,224,240,.32);border-radius:14px;padding:22px;box-shadow:0 32px 80px rgba(0,0,0,.7);}\n" +
      ".mmp-modal h2{margin:0 0 4px;font:900 22px/1.1 'Fraunces',serif;font-style:italic;}\n" +
      ".mmp-modal .mmp-sub{margin:0 0 16px;font:500 12.5px/1.45 'Inter',sans-serif;color:rgba(216,220,235,.7);}\n" +
      ".mmp-tabs{display:flex;gap:6px;margin-bottom:14px;}\n" +
      ".mmp-tab{flex:1;padding:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(216,220,235,.7);font:700 11px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.12em;cursor:pointer;}\n" +
      ".mmp-tab.is-active{background:rgba(93,224,240,.15);border-color:rgba(93,224,240,.5);color:#5de0f0;}\n" +
      ".mmp-pane{display:none;}\n" +
      ".mmp-pane.is-active{display:block;}\n" +
      ".mmp-label{display:block;font:700 10.5px/1 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(216,220,235,.6);margin:10px 0 6px;}\n" +
      ".mmp-input{width:100%;padding:10px 12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.10);border-radius:8px;color:#f0f3fa;font:700 16px/1.2 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.10em;text-align:center;}\n" +
      ".mmp-input:focus{outline:none;border-color:#5de0f0;box-shadow:0 0 0 3px rgba(93,224,240,.18);}\n" +
      ".mmp-btn{display:block;width:100%;margin-top:14px;padding:12px 16px;background:linear-gradient(135deg,#5de0f0,#3aa7c2);color:#04060f;border:0;border-radius:10px;font:800 13.5px/1 'Inter',sans-serif;cursor:pointer;}\n" +
      ".mmp-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(93,224,240,.4);}\n" +
      ".mmp-btn.is-secondary{background:rgba(255,255,255,.06);color:#f0f3fa;}\n" +
      ".mmp-close{position:absolute;top:14px;right:14px;background:transparent;border:0;color:rgba(255,255,255,.7);font-size:22px;cursor:pointer;line-height:1;}\n" +
      ".mmp-code{font:900 36px/1 'Press Start 2P',monospace;letter-spacing:.18em;color:#ffd060;text-shadow:0 0 14px rgba(255,208,96,.55);text-align:center;margin:14px 0;padding:14px;background:rgba(0,0,0,.5);border:2px dashed rgba(255,208,96,.5);border-radius:10px;}\n" +
      /* Roster: counter + scrollable wrap-grid that scales to 30+ chips */
      ".mmp-roster{margin-top:10px;}\n" +
      ".mmp-roster-counter{display:flex;align-items:baseline;gap:8px;margin:6px 0 8px;font-family:'JetBrains Mono',monospace;}\n" +
      ".mmp-roster-counter .mmp-roster-count{font-size:20px;font-weight:800;color:#5de0f0;text-shadow:0 0 8px rgba(93,224,240,.55);}\n" +
      ".mmp-roster-counter .mmp-roster-label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(216,220,235,.55);}\n" +
      ".mmp-roster-grid{display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;padding:8px;background:rgba(0,0,0,.30);border:1px solid rgba(255,255,255,.06);border-radius:6px;}\n" +
      ".mmp-roster-grid::-webkit-scrollbar{width:6px;}\n" +
      ".mmp-roster-grid::-webkit-scrollbar-track{background:rgba(0,0,0,.2);border-radius:3px;}\n" +
      ".mmp-roster-grid::-webkit-scrollbar-thumb{background:rgba(93,224,240,.35);border-radius:3px;}\n" +
      ".mmp-player{padding:5px 10px;background:rgba(93,224,240,.10);border:1px solid rgba(93,224,240,.30);border-radius:999px;font:700 11px/1 'JetBrains Mono',monospace;letter-spacing:.08em;color:#5de0f0;}\n" +
      ".mmp-player.is-host{background:rgba(255,208,96,.10);border-color:rgba(255,208,96,.35);color:#ffd060;}\n" +
      ".mmp-error{margin-top:10px;padding:8px 12px;background:rgba(255,56,88,.10);border:1px solid rgba(255,56,88,.40);border-radius:8px;color:#ff8a8a;font:600 12px/1.4 'Inter',sans-serif;}\n" +
      ".mmp-hint{font:500 11.5px/1.5 'Inter',sans-serif;color:rgba(216,220,235,.55);font-style:italic;margin-top:6px;}\n" +
      ".mmp-game-strip{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:8000;display:flex;align-items:center;gap:9px;max-width:calc(100vw - 20px);padding:8px 10px;background:rgba(4,6,15,.88);border:1px solid rgba(93,224,240,.42);border-radius:9px;box-shadow:0 10px 28px rgba(0,0,0,.45);color:#f0f5ff;font:700 11px/1.2 'Inter',sans-serif;backdrop-filter:blur(6px);}\n" +
      ".mmp-game-strip strong{font-family:'JetBrains Mono',monospace;color:#7af0ff;letter-spacing:.08em;}\n" +
      ".mmp-game-strip em{font-style:normal;color:rgba(240,245,255,.72);}\n" +
      ".mmp-game-strip button{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#f0f5ff;border-radius:6px;padding:5px 7px;font:800 10px/1 'Inter',sans-serif;cursor:pointer;}\n" +
      ".mmp-game-strip.is-error{border-color:rgba(255,56,88,.5);}\n" +
      ".mmp-game-dot{width:8px;height:8px;border-radius:999px;background:#7af0ff;box-shadow:0 0 10px rgba(122,240,255,.8);flex:0 0 auto;}\n" +
      "@media(max-width:560px){.mmp-game-strip{font-size:10px;padding:7px 8px;}.mmp-game-strip button{padding:5px 6px;}}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function mountHubButton() {
    if (!document.body) return;
    // Skip on game pages (multiplayer entry-point is hub-only)
    if (document.body.hasAttribute("data-game-page")) return;
    if (document.getElementById("mmpNavLink")) return;
    injectStyles();
    // Mount as a quiet topnav link next to SFX toggle. Solo play is the
    // primary mode — multiplayer is one feature among many, not the
    // showcase. (Jon: "this should be a solo forward review app first.")
    var topnav = document.querySelector(".topbar .topnav") || document.querySelector(".topnav");
    if (!topnav) return;
    var link = document.createElement("button");
    link.id = "mmpNavLink";
    link.className = "mmp-nav-link";
    link.type = "button";
    link.innerHTML = '<span class="mmp-icon" aria-hidden="true">🎮</span><span class="mmp-label">Multiplayer</span>';
    link.setAttribute("aria-label", "Open multiplayer lobby — optional feature");
    // Wrap so the click event isn't passed as the `preset` argument.
    // Before this wrap, the click Event became preset, rendering as
    // "[object PointerEvent]" in the room-code input and auto-switching
    // to the Join tab — which made the host flow unreachable.
    link.addEventListener("click", function () { openLobbyModal(); });
    // Insert before profile pill if present (otherwise append)
    var sfxToggle = topnav.querySelector("#sfxToggle");
    if (sfxToggle && sfxToggle.parentNode === topnav) {
      topnav.insertBefore(link, sfxToggle);
    } else {
      topnav.appendChild(link);
    }
  }

  var _modalOpenRoom = null;
  function openLobbyModal(preset) {
    // Defense-in-depth: only treat preset as a real room code if it's a
    // plain non-empty string. Guards against accidental Event objects
    // (the bug that broke multiplayer when the nav-link click handler
    // forwarded its MouseEvent as preset).
    if (preset && typeof preset !== "string") preset = null;
    if (preset) preset = String(preset).trim().toUpperCase();
    injectStyles();
    var existing = document.getElementById("mmpModalBg");
    if (existing) existing.remove();
    var bg = document.createElement("div");
    bg.id = "mmpModalBg";
    bg.className = "mmp-modal-bg";
    bg.innerHTML =
      '<div class="mmp-modal" role="dialog" aria-modal="true" aria-labelledby="mmpModalTitle" style="position:relative;">' +
        '<button class="mmp-close" id="mmpClose" aria-label="Close">×</button>' +
        '<h2 id="mmpModalTitle">Live Multiplayer</h2>' +
        '<p class="mmp-sub">Set up a real-time room for in-class competition. No accounts, no logins.</p>' +
        '<div class="mmp-tabs" role="tablist">' +
          '<button class="mmp-tab is-active" id="mmpTabHost" role="tab">Host a Room</button>' +
          '<button class="mmp-tab" id="mmpTabJoin" role="tab">Join a Room</button>' +
        '</div>' +
        '<div class="mmp-pane is-active" id="mmpPaneHost">' +
          '<p class="mmp-hint">Open a room and share the code with your students. Up to 40 players.</p>' +
          '<button class="mmp-btn" id="mmpHostStart" type="button">Start Hosting</button>' +
          '<div id="mmpHostStatus"></div>' +
        '</div>' +
        '<div class="mmp-pane" id="mmpPaneJoin">' +
          '<label class="mmp-label" for="mmpJoinCode">Room Code</label>' +
          '<input class="mmp-input" id="mmpJoinCode" maxlength="7" placeholder="ABC-DEF" value="' + (preset || "") + '" autocapitalize="characters">' +
          '<label class="mmp-label" for="mmpJoinInitials">Your Initials (3 char)</label>' +
          '<input class="mmp-input" id="mmpJoinInitials" maxlength="3" placeholder="ABC" autocapitalize="characters">' +
          '<button class="mmp-btn" id="mmpJoinStart" type="button">Join Room</button>' +
          '<div id="mmpJoinStatus"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);
    document.getElementById("mmpClose").addEventListener("click", closeLobbyModal);
    bg.addEventListener("click", function (e) { if (e.target === bg) closeLobbyModal(); });

    document.getElementById("mmpTabHost").addEventListener("click", function () {
      document.getElementById("mmpTabHost").classList.add("is-active");
      document.getElementById("mmpTabJoin").classList.remove("is-active");
      document.getElementById("mmpPaneHost").classList.add("is-active");
      document.getElementById("mmpPaneJoin").classList.remove("is-active");
    });
    document.getElementById("mmpTabJoin").addEventListener("click", function () {
      document.getElementById("mmpTabJoin").classList.add("is-active");
      document.getElementById("mmpTabHost").classList.remove("is-active");
      document.getElementById("mmpPaneJoin").classList.add("is-active");
      document.getElementById("mmpPaneHost").classList.remove("is-active");
    });

    document.getElementById("mmpHostStart").addEventListener("click", function () {
      if (!available()) {
        document.getElementById("mmpHostStatus").innerHTML = '<div class="mmp-error">Multiplayer library not loaded. Check your internet connection and reload.</div>';
        return;
      }
      var statusEl = document.getElementById("mmpHostStatus");
      statusEl.innerHTML = '<p class="mmp-hint">Opening room…</p>';
      var room = host({
        initials: "HST",
        onReady: function (r) {
          _modalOpenRoom = r;
          statusEl.innerHTML =
            '<p class="mmp-hint">Share this code with your students:</p>' +
            '<div class="mmp-code">' + r.code + '</div>' +
            '<p class="mmp-hint">Players join by entering this code on the same arcade hub.</p>' +
            '<div class="mmp-label">Players in room</div>' +
            '<div class="mmp-roster" id="mmpHostRoster"></div>' +
            '<button class="mmp-btn" id="mmpHostSaveClass" type="button" style="background:linear-gradient(135deg,#ffd060,#f5c451);color:#14100a;">📋 Save as Class</button>' +
            '<button class="mmp-btn is-secondary" id="mmpHostClose" type="button">End Room</button>';
          renderRoster(r, document.getElementById("mmpHostRoster"));
          r.onPlayersChange(function () { renderRoster(r, document.getElementById("mmpHostRoster")); });
          document.getElementById("mmpHostSaveClass").addEventListener("click", function () {
            var name = window.prompt("Save this roster as a class. What's the class name? (e.g. 'Period 3 · AP Psych')");
            if (!name) return;
            var ok = saveRoomAsClass(r, name);
            if (ok) {
              alert("Saved \"" + name + "\" — " + r.players.length + " players. View saved classes in /teacher dashboard.");
            } else {
              alert("Save failed. localStorage may be full or disabled.");
            }
          });
          document.getElementById("mmpHostClose").addEventListener("click", function () {
            r.leave();
            _modalOpenRoom = null;
            closeLobbyModal();
          });
        },
        onError: function (err) {
          statusEl.innerHTML = '<div class="mmp-error">Could not start room. ' +
            'Network signaling server unreachable. Try again in a moment.</div>';
        }
      });
    });

    document.getElementById("mmpJoinStart").addEventListener("click", function () {
      var code = document.getElementById("mmpJoinCode").value.toUpperCase().trim();
      var initials = document.getElementById("mmpJoinInitials").value.toUpperCase().trim();
      var statusEl = document.getElementById("mmpJoinStatus");
      if (!code || code.length < 6) {
        statusEl.innerHTML = '<div class="mmp-error">Enter the 6-letter room code your teacher shared.</div>';
        return;
      }
      if (!initials) {
        statusEl.innerHTML = '<div class="mmp-error">Pick 3 initials for the leaderboard.</div>';
        return;
      }
      if (!available()) {
        statusEl.innerHTML = '<div class="mmp-error">Multiplayer library not loaded. Check your internet connection and reload.</div>';
        return;
      }
      statusEl.innerHTML = '<p class="mmp-hint">Connecting…</p>';
      try {
        var room = join(code, initials, {
          onReady: function (r) {
            _modalOpenRoom = r;
            statusEl.innerHTML =
              '<p class="mmp-hint">Joined room <strong>' + r.code + '</strong> as <strong>' + r.self.initials + '</strong>.</p>' +
              '<div class="mmp-label">Players in room</div>' +
              '<div class="mmp-roster" id="mmpJoinRoster"></div>' +
              '<button class="mmp-btn is-secondary" id="mmpJoinClose" type="button">Leave Room</button>';
            renderRoster(r, document.getElementById("mmpJoinRoster"));
            r.onPlayersChange(function () { renderRoster(r, document.getElementById("mmpJoinRoster")); });
            r.onMessage(function (msg) {
              if (msg.type === "host:disconnected") {
                statusEl.innerHTML = '<div class="mmp-error">Host left the room.</div>';
              } else if (msg.type === "host:full") {
                var pl = msg.payload || {};
                statusEl.innerHTML = '<div class="mmp-error">' +
                  escHtml(pl.message || ("Room is full (" + (pl.capacity || 40) + " players max)."))
                  + '</div>';
              }
            });
            document.getElementById("mmpJoinClose").addEventListener("click", function () {
              r.leave();
              _modalOpenRoom = null;
              closeLobbyModal();
            });
          },
          onError: function (e) {
            statusEl.innerHTML = '<div class="mmp-error">' + (e.friendly || "Could not connect.") + '</div>';
          }
        });
      } catch (e) {
        statusEl.innerHTML = '<div class="mmp-error">' + e.message + '</div>';
      }
    });

    // Auto-open the Join tab + preset code if URL hash has one
    if (preset) {
      document.getElementById("mmpTabJoin").click();
    }
  }

  function renderRoster(room, container) {
    if (!container) return;
    var students = room.players.filter(function (p) { return !p.isHost; });
    var n = students.length;
    var cap = MAX_PLAYERS;
    var counter = '<div class="mmp-roster-counter">' +
                    '<span class="mmp-roster-count">' + n + ' / ' + cap + '</span>' +
                    '<span class="mmp-roster-label">students joined</span>' +
                  '</div>';
    var chips = room.players.map(function (p) {
      var score = Number(p.score || 0);
      return '<span class="mmp-player' + (p.isHost ? ' is-host' : '') + '">' +
                (p.isHost ? '👑 ' : '') + escHtml(p.initials) +
                (score > 0 ? ' · ' + score.toLocaleString() : '') +
              '</span>';
    }).join("");
    var grid = '<div class="mmp-roster-grid">' +
                 (chips || '<span class="mmp-hint">Waiting for players…</span>') +
               '</div>';
    container.innerHTML = counter + grid;
  }

  var _gameRoom = null;
  function restoreActiveRoom(opts) {
    opts = opts || {};
    var desc = activeDescriptor();
    if (!desc) return null;
    try {
      if (desc.role === "host") {
        return host({
          code: desc.code,
          initials: desc.initials || "HST",
          onReady: function (room) {
            _gameRoom = room;
            rememberActiveRoom(room);
            if (typeof opts.onReady === "function") opts.onReady(room);
          },
          onError: opts.onError
        });
      }
      return join(desc.code, desc.initials || "PLR", {
        onReady: function (room) {
          _gameRoom = room;
          rememberActiveRoom(room);
          if (typeof opts.onReady === "function") opts.onReady(room);
        },
        onError: opts.onError
      });
    } catch (e) {
      if (typeof opts.onError === "function") opts.onError({ err: e, friendly: e.message || "Could not restore room." });
      return null;
    }
  }

  function mountGameRoomStrip() {
    if (!document.body || !document.body.hasAttribute("data-game-page")) return;
    var desc = activeDescriptor();
    if (!desc || document.getElementById("mmpGameStrip")) return;
    injectStyles();
    var strip = document.createElement("div");
    strip.id = "mmpGameStrip";
    strip.className = "mmp-game-strip";
    strip.setAttribute("role", "status");
    strip.innerHTML =
      '<span class="mmp-game-dot" aria-hidden="true"></span>' +
      '<span><strong>Room ' + escHtml(desc.code) + '</strong><em id="mmpGameStripStatus"> reconnecting...</em></span>' +
      '<button type="button" id="mmpGameStripLeave">Leave</button>';
    document.body.appendChild(strip);
    var status = document.getElementById("mmpGameStripStatus");
    var leave = document.getElementById("mmpGameStripLeave");
    var restored = restoreActiveRoom({
      onReady: function (room) {
        _gameRoom = room;
        if (status) status.textContent = " score sync on";
        room.onPlayersChange(function (players) {
          var students = players.filter(function (p) { return !p.isHost; }).length;
          if (status) status.textContent = " " + students + "/" + MAX_PLAYERS + " students";
        });
      },
      onError: function (error) {
        if (status) status.textContent = " " + ((error && error.friendly) || "room unavailable");
        strip.classList.add("is-error");
      }
    });
    if (leave) {
      leave.addEventListener("click", function () {
        try { if (_gameRoom) _gameRoom.leave(); else if (restored) restored.leave(); } catch (e) {}
        clearActiveRoom(desc.code);
        strip.remove();
      });
    }
    root.addEventListener("mrmacs:score-submit", function (event) {
      var detail = event && event.detail;
      if (!_gameRoom || !detail) return;
      _gameRoom.updateScore(detail.score, detail.meta || {});
    });
  }

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function closeLobbyModal() {
    var bg = document.getElementById("mmpModalBg");
    if (bg) bg.remove();
  }

  function init() {
    mountHubButton();
    mountGameRoomStrip();
    // Auto-open join modal if URL hash carries a room code
    var preset = codeFromHash();
    if (preset) {
      setTimeout(function () { openLobbyModal(preset); }, 800);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // ── Class roster persistence ─────────────────────────────────────────
  // Saves a snapshot of the current room's players (with their final
  // scores) as a "class" in localStorage. Teachers can use this to
  // remember their period 3 vs period 7 rosters without any backend.
  //
  // Storage shape:
  //   key: arcade.mp.classes
  //   value: { [className]: { savedAt, code, players: [{initials, score}] } }
  function saveRoomAsClass(room, className) {
    if (!room || !room.players || !className) return false;
    var name = String(className).trim().slice(0, 60);
    if (!name) return false;
    try {
      var raw = localStorage.getItem("arcade.mp.classes") || "{}";
      var classes = JSON.parse(raw);
      classes[name] = {
        savedAt: Date.now(),
        code: room.code,
        players: room.players.map(function (p) {
          return { initials: p.initials, score: p.score || 0, isHost: !!p.isHost };
        })
      };
      // Keep most-recent 20 classes
      var keys = Object.keys(classes).sort(function (a, b) {
        return (classes[b].savedAt || 0) - (classes[a].savedAt || 0);
      });
      if (keys.length > 20) {
        keys.slice(20).forEach(function (k) { delete classes[k]; });
      }
      localStorage.setItem("arcade.mp.classes", JSON.stringify(classes));
      return true;
    } catch (e) { return false; }
  }

  function listClasses() {
    try {
      var raw = localStorage.getItem("arcade.mp.classes") || "{}";
      var c = JSON.parse(raw);
      return Object.keys(c).map(function (name) {
        return { name: name, savedAt: c[name].savedAt, code: c[name].code, playerCount: (c[name].players || []).length };
      }).sort(function (a, b) { return b.savedAt - a.savedAt; });
    } catch (e) { return []; }
  }

  function getClass(name) {
    try {
      var raw = localStorage.getItem("arcade.mp.classes") || "{}";
      return JSON.parse(raw)[name] || null;
    } catch (e) { return null; }
  }

  function deleteClass(name) {
    try {
      var raw = localStorage.getItem("arcade.mp.classes") || "{}";
      var c = JSON.parse(raw);
      if (c[name]) { delete c[name]; localStorage.setItem("arcade.mp.classes", JSON.stringify(c)); return true; }
    } catch (e) {}
    return false;
  }

  root.MrMacsMultiplayer = {
    available: available,
    host: host,
    join: join,
    codeFromHash: codeFromHash,
    openLobbyModal: openLobbyModal,
    closeLobbyModal: closeLobbyModal,
    sanitizeInitials: sanitizeInitials,
    activeDescriptor: activeDescriptor,
    rememberActiveRoom: rememberActiveRoom,
    clearActiveRoom: clearActiveRoom,
    restoreActiveRoom: restoreActiveRoom,
    mountGameRoomStrip: mountGameRoomStrip,
    // Class roster persistence (local — no backend)
    saveRoomAsClass: saveRoomAsClass,
    listClasses: listClasses,
    getClass: getClass,
    deleteClass: deleteClass
  };
})(typeof window !== "undefined" ? window : globalThis);
