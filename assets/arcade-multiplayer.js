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
    var raw = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (raw.length < 1) raw = "PLR";
    // Use the leaderboards content filter if present
    if (root.MrMacsLeaderboards && root.MrMacsLeaderboards.isBlockedName) {
      if (root.MrMacsLeaderboards.isBlockedName(raw)) return "PLR";
    }
    return raw;
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
        if (typeof opts.onReady === "function") opts.onReady(room);
      });
      conn.on("data", function (raw) {
        var msg = parseMsg(raw);
        if (!msg) return;
        if (msg.type === "host:announceState") {
          var pl = (msg.payload && msg.payload.players) || [];
          room.players = pl.map(function (p) { return { id: p.id, initials: p.initials, score: p.score, isHost: !!p.isHost }; });
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
      ".mmp-fab{position:fixed;right:14px;bottom:60px;z-index:60;padding:10px 14px;background:linear-gradient(135deg,#5de0f0,#3aa7c2);color:#04060f;font:800 12px/1 'Inter',sans-serif;letter-spacing:.05em;border:1px solid rgba(93,224,240,.7);border-radius:999px;box-shadow:0 8px 22px rgba(93,224,240,.32);cursor:pointer;display:inline-flex;align-items:center;gap:8px;}\n" +
      ".mmp-fab:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(93,224,240,.45);}\n" +
      ".mmp-fab .mmp-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff3858;box-shadow:0 0 6px rgba(255,56,88,.9);animation:mmpDot 1.2s ease-in-out infinite;}\n" +
      "@keyframes mmpDot{50%{opacity:0.4;}}\n" +
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
      ".mmp-roster{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;}\n" +
      ".mmp-player{padding:5px 10px;background:rgba(93,224,240,.10);border:1px solid rgba(93,224,240,.30);border-radius:999px;font:700 11px/1 'JetBrains Mono',monospace;letter-spacing:.08em;color:#5de0f0;}\n" +
      ".mmp-player.is-host{background:rgba(255,208,96,.10);border-color:rgba(255,208,96,.35);color:#ffd060;}\n" +
      ".mmp-error{margin-top:10px;padding:8px 12px;background:rgba(255,56,88,.10);border:1px solid rgba(255,56,88,.40);border-radius:8px;color:#ff8a8a;font:600 12px/1.4 'Inter',sans-serif;}\n" +
      ".mmp-hint{font:500 11.5px/1.5 'Inter',sans-serif;color:rgba(216,220,235,.55);font-style:italic;margin-top:6px;}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function mountHubButton() {
    if (!document.body) return;
    // Skip on game pages (game-marquee already mounted; multiplayer is hub-level)
    if (document.body.hasAttribute("data-game-page")) return;
    if (document.getElementById("mmpFab")) return;
    injectStyles();
    var btn = document.createElement("button");
    btn.id = "mmpFab";
    btn.className = "mmp-fab";
    btn.type = "button";
    btn.innerHTML = '<span class="mmp-dot"></span><span>🎮 Multiplayer</span>';
    btn.setAttribute("aria-label", "Open multiplayer lobby");
    btn.addEventListener("click", openLobbyModal);
    document.body.appendChild(btn);
  }

  var _modalOpenRoom = null;
  function openLobbyModal(preset) {
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
          '<p class="mmp-hint">Open a room and share the code with your students. Up to 16 players.</p>' +
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
            '<button class="mmp-btn is-secondary" id="mmpHostClose" type="button">End Room</button>';
          renderRoster(r, document.getElementById("mmpHostRoster"));
          r.onPlayersChange(function () { renderRoster(r, document.getElementById("mmpHostRoster")); });
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
    var html = room.players.map(function (p) {
      return '<span class="mmp-player' + (p.isHost ? ' is-host' : '') + '">' +
                (p.isHost ? '👑 ' : '') + escHtml(p.initials) +
              '</span>';
    }).join("");
    container.innerHTML = html || '<span class="mmp-hint">Waiting for players…</span>';
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

  root.MrMacsMultiplayer = {
    available: available,
    host: host,
    join: join,
    codeFromHash: codeFromHash,
    openLobbyModal: openLobbyModal,
    closeLobbyModal: closeLobbyModal,
    sanitizeInitials: sanitizeInitials
  };
})(typeof window !== "undefined" ? window : globalThis);
