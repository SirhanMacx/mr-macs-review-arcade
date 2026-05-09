/* arcade-onboarding-flow.js
 * Mr. Mac's Review Arcade - First-time player onboarding (4-step flow)
 *
 * Public API: window.MrMacsOnboarding
 *   start(opts)    - show flow if not complete
 *   replay()       - force-replay even if complete
 *   markComplete() - mark as seen (skip)
 *   reset()        - clear state (QA)
 *   isComplete()   - boolean
 *   on/off(event, handler) - subscribe to events
 *
 * Events: 'start', 'step', 'profile', 'complete', 'skip', 'launch'
 */
(function (root) {
  'use strict';
  if (root.MrMacsOnboarding) return;

  // ---------- Constants ----------
  var STORAGE_KEY = 'mr-macs-arcade-onboarding-v1';
  var STYLE_ID = 'arcade-onboarding-styles';
  var ROOT_ID = 'mo-onboarding-root';
  var TOTAL_STEPS = 4;

  var AVATARS = ['\u{1F393}', '\u{1F9ED}', '\u{1F4DC}', '\u{1F9D9}',
                 '\u{1F989}', '\u{1F98A}', '\u{1F981}', '\u{1F409}'];

  var COURSES = [
    'AP Psychology',
    'Grade 10 Global History II',
    'Grade 8 U.S. History',
    'AP World History',
    'Other / All Courses'
  ];

  var TOUR_CARDS = [
    { icon: '\u{1F525}', title: 'Daily Challenge',
      desc: 'Play one curated game per day. Build a streak, earn shards.' },
    { icon: '\u{1F48E}', title: 'Power-Up Shop',
      desc: 'Spend shards on hints, score doubles, and lucky charms.' },
    { icon: '\u{1F3C6}', title: 'Achievement Trail',
      desc: 'Unlock 85+ badges as you master units and conquer streaks.' }
  ];

  var FALLBACK_GAMES = [
    { id: 'citadel',     title: 'Citadel Defense',
      subtitle: 'Defend the gates with primary-source rounds.',
      file: 'games/citadel/index.html' },
    { id: 'rumor-whack', title: 'Rumor Whack',
      subtitle: 'Smash misinformation as fast as it pops up.',
      file: 'games/rumor-whack/index.html' },
    { id: 'step-pyramid', title: 'Step Pyramid Climb',
      subtitle: 'Climb tiers by ordering events on the timeline.',
      file: 'games/step-pyramid/index.html' }
  ];

  // ---------- State ----------
  var listeners = {};
  var session = null;   // active flow state when modal is open
  var stylesInjected = false;

  // ---------- Utilities ----------
  function reducedMotion() {
    try {
      return root.matchMedia &&
             root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_e) { return false; }
  }

  function lsGet(k) { try { return root.localStorage ? root.localStorage.getItem(k) : null; } catch (_e) { return null; } }
  function lsSet(k, v) { try { if (root.localStorage) root.localStorage.setItem(k, v); } catch (_e) {} }
  function lsDel(k) { try { if (root.localStorage) root.localStorage.removeItem(k); } catch (_e) {} }

  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) { try { arr[i](payload); } catch (_e) {} }
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (k === 'className') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.substring(2), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
    if (children) for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function getCuratedGames() {
    var pool = root.GAMES;
    if (pool && typeof pool === 'object') {
      var ids = ['citadel', 'rumor-whack', 'step-pyramid'];
      var arr = Array.isArray(pool) ? pool : Object.values(pool);
      var picked = [];
      for (var i = 0; i < ids.length; i++) {
        for (var j = 0; j < arr.length; j++) {
          if (arr[j] && (arr[j].id === ids[i] || arr[j].slug === ids[i])) { picked.push(arr[j]); break; }
        }
      }
      if (picked.length >= 3) return picked.slice(0, 3);
    }
    return FALLBACK_GAMES.slice();
  }

  // ---------- Styles ----------
  function injectStyles() {
    if (stylesInjected || document.getElementById(STYLE_ID)) {
      stylesInjected = true;
      return;
    }
    var rm = reducedMotion();
    var anim = rm ? '' : 'animation:mo-fade .25s ease-out;';
    var slide = rm ? '' : 'animation:mo-slide .3s ease-out;';
    var css =
      ':root{--mo-paper:var(--paper,#f5ecd9);--mo-bronze:var(--bronze,#b8884a);' +
      '--mo-cyan:var(--cyan,#3fb8c8);--mo-card:#1c1612;--mo-line:rgba(184,136,74,.35);}' +
      '.mo-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;padding:16px;' +
      'font-family:Inter,system-ui,sans-serif;color:var(--mo-paper);' + anim + '}' +
      '@keyframes mo-fade{from{opacity:0}to{opacity:1}}' +
      '@keyframes mo-slide{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}' +
      '.mo-card{background:var(--mo-card);border:1px solid var(--mo-line);border-radius:14px;' +
      'width:100%;max-width:480px;max-height:90vh;overflow-y:auto;position:relative;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.6);' + slide + '}' +
      '.mo-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px 0;}' +
      '.mo-dots{display:flex;gap:6px;}' +
      '.mo-dot{width:8px;height:8px;border-radius:50%;background:rgba(245,236,217,.2);}' +
      '.mo-dot.is-active{background:var(--mo-cyan);width:22px;border-radius:4px;}' +
      '.mo-skip{background:none;border:none;color:rgba(245,236,217,.55);font-size:12px;' +
      'cursor:pointer;text-decoration:underline;padding:4px;font-family:inherit;}' +
      '.mo-skip:hover{color:var(--mo-paper);}' +
      '.mo-body{padding:14px 28px 28px;}' +
      '.mo-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:26px;' +
      'line-height:1.18;margin:8px 0 10px;color:var(--mo-paper);}' +
      '.mo-tagline{color:rgba(245,236,217,.78);font-size:14px;line-height:1.55;margin:0 0 18px;}' +
      '.mo-glyph{font-size:56px;text-align:center;margin:6px 0 4px;' +
      'filter:drop-shadow(0 4px 18px rgba(63,184,200,.35));}' +
      '.mo-btn{display:block;width:100%;padding:13px 18px;background:var(--mo-cyan);' +
      'color:#08222a;border:none;border-radius:10px;font-family:Inter,system-ui,sans-serif;' +
      'font-weight:600;font-size:15px;cursor:pointer;margin-top:8px;' +
      'transition:transform .12s ease,filter .12s ease;}' +
      '.mo-btn:hover{filter:brightness(1.08);}.mo-btn:active{transform:translateY(1px);}' +
      '.mo-btn--ghost{background:transparent;color:var(--mo-paper);border:1px solid var(--mo-line);}' +
      '.mo-btn--ghost:hover{background:rgba(184,136,74,.1);}' +
      '.mo-field{margin-bottom:14px;}' +
      '.mo-label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;' +
      'color:rgba(245,236,217,.6);margin-bottom:6px;font-weight:600;}' +
      '.mo-input,.mo-select{width:100%;padding:11px 12px;background:#0e0a08;' +
      'border:1px solid var(--mo-line);color:var(--mo-paper);border-radius:8px;' +
      'font-family:inherit;font-size:14px;box-sizing:border-box;}' +
      '.mo-input:focus,.mo-select:focus{outline:none;border-color:var(--mo-cyan);}' +
      '.mo-error{color:#ff8a7a;font-size:12px;margin-top:4px;display:none;}' +
      '.mo-error.is-visible{display:block;}' +
      '.mo-avatars{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}' +
      '.mo-avatar{font-size:26px;padding:10px 0;background:#0e0a08;border:1px solid var(--mo-line);' +
      'border-radius:8px;cursor:pointer;text-align:center;transition:border-color .12s,background .12s;}' +
      '.mo-avatar:hover{border-color:var(--mo-bronze);}' +
      '.mo-avatar.is-selected{border-color:var(--mo-cyan);background:rgba(63,184,200,.12);}' +
      '.mo-tour{display:flex;flex-direction:column;gap:10px;margin:12px 0 18px;}' +
      '@media(min-width:640px){.mo-tour{flex-direction:row;}.mo-tour-card{flex:1;}}' +
      '.mo-tour-card{background:#0e0a08;border:1px solid var(--mo-line);border-radius:10px;padding:14px;}' +
      '.mo-tour-icon{font-size:24px;margin-bottom:6px;}' +
      '.mo-tour-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:15px;' +
      'color:var(--mo-paper);margin:0 0 4px;}' +
      '.mo-tour-desc{font-size:12px;color:rgba(245,236,217,.7);line-height:1.45;margin:0;}' +
      '.mo-games{display:flex;flex-direction:column;gap:10px;margin:12px 0 14px;}' +
      '.mo-game{background:#0e0a08;border:1px solid var(--mo-line);border-radius:10px;' +
      'padding:14px;display:flex;align-items:center;gap:12px;}' +
      '.mo-game-text{flex:1;min-width:0;}' +
      '.mo-game-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:14px;' +
      'color:var(--mo-paper);margin:0 0 3px;}' +
      '.mo-game-sub{font-size:12px;color:rgba(245,236,217,.65);margin:0;line-height:1.4;}' +
      '.mo-game-play{padding:8px 14px;background:var(--mo-bronze);color:#1a1410;border:none;' +
      'border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;font-family:inherit;}' +
      '.mo-game-play:hover{filter:brightness(1.08);}';
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
    stylesInjected = true;
  }

  // ---------- Rendering ----------
  function renderHeader(step, onSkip) {
    var dots = [];
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      dots.push(el('div', {
        className: 'mo-dot' + (i === step ? ' is-active' : ''),
        'aria-current': i === step ? 'step' : null
      }));
    }
    return el('div', { className: 'mo-head' }, [
      el('div', { className: 'mo-dots',
                  role: 'progressbar',
                  'aria-valuenow': step,
                  'aria-valuemin': 1,
                  'aria-valuemax': TOTAL_STEPS,
                  'aria-label': 'Onboarding step ' + step + ' of ' + TOTAL_STEPS
                }, dots),
      el('button', { className: 'mo-skip', type: 'button',
                     'aria-label': 'Skip onboarding',
                     onclick: onSkip }, ['Skip onboarding'])
    ]);
  }

  function renderStep1() {
    var body = el('div', { className: 'mo-body' }, [
      el('div', { className: 'mo-glyph', 'aria-hidden': 'true' },
         ['\u{1F3AE}']),
      el('h2', { className: 'mo-title' },
         ["Welcome to Mr. Mac's Arcade"]),
      el('p', { className: 'mo-tagline' }, [
        '199 social-studies review games. Pick a profile and start playing.'
      ]),
      el('button', {
        className: 'mo-btn', type: 'button',
        onclick: function () { goTo(2); }
      }, ['Get Started →'])
    ]);
    return body;
  }

  function renderStep2() {
    var nameInput, errorEl, courseSel;
    var avatarBtns = [];

    function selectAvatar(idx) {
      session.profile.avatar = AVATARS[idx];
      for (var i = 0; i < avatarBtns.length; i++) {
        avatarBtns[i].classList.toggle('is-selected', i === idx);
        avatarBtns[i].setAttribute('aria-pressed', i === idx ? 'true' : 'false');
      }
    }

    function onContinue() {
      var name = (nameInput.value || '').trim();
      if (name.length < 1 || name.length > 30) {
        errorEl.textContent = 'Please enter a name (1-30 characters).';
        errorEl.classList.add('is-visible');
        nameInput.focus();
        return;
      }
      errorEl.classList.remove('is-visible');
      session.profile.name = name;
      session.profile.course = courseSel.value;
      saveProfile(session.profile);
      emit('profile', Object.assign({}, session.profile));
      goTo(3);
    }

    var grid = [];
    for (var i = 0; i < AVATARS.length; i++) {
      (function (idx) {
        var b = el('button', {
          className: 'mo-avatar' +
            (session.profile.avatar === AVATARS[idx] ? ' is-selected' : ''),
          type: 'button',
          'aria-label': 'Avatar ' + (idx + 1),
          'aria-pressed': session.profile.avatar === AVATARS[idx]
            ? 'true' : 'false',
          onclick: function () { selectAvatar(idx); }
        }, [AVATARS[idx]]);
        avatarBtns.push(b);
        grid.push(b);
      })(i);
    }

    var courseOpts = [];
    for (var c = 0; c < COURSES.length; c++) {
      courseOpts.push(el('option', { value: COURSES[c] }, [COURSES[c]]));
    }

    nameInput = el('input', {
      className: 'mo-input', type: 'text', maxlength: '30',
      placeholder: 'Your name', id: 'mo-name',
      value: session.profile.name || ''
    });
    errorEl = el('div', { className: 'mo-error', role: 'alert' }, []);
    courseSel = el('select', { className: 'mo-select', id: 'mo-course' },
                   courseOpts);
    if (session.profile.course) courseSel.value = session.profile.course;

    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); onContinue(); }
    });

    return el('div', { className: 'mo-body' }, [
      el('h2', { className: 'mo-title' }, ['Build your profile']),
      el('p', { className: 'mo-tagline' }, [
        'A name and an avatar so the leaderboard knows who to cheer for.'
      ]),
      el('div', { className: 'mo-field' }, [
        el('label', { className: 'mo-label', 'for': 'mo-name' }, ['Name']),
        nameInput, errorEl
      ]),
      el('div', { className: 'mo-field' }, [
        el('label', { className: 'mo-label' }, ['Avatar']),
        el('div', { className: 'mo-avatars', role: 'group',
                    'aria-label': 'Choose an avatar' }, grid)
      ]),
      el('div', { className: 'mo-field' }, [
        el('label', { className: 'mo-label', 'for': 'mo-course' }, ['Course']),
        courseSel
      ]),
      el('button', {
        className: 'mo-btn', type: 'button', onclick: onContinue
      }, ['Continue →'])
    ]);
  }

  function renderStep3() {
    var cards = [];
    for (var i = 0; i < TOUR_CARDS.length; i++) {
      var t = TOUR_CARDS[i];
      cards.push(el('div', { className: 'mo-tour-card' }, [
        el('div', { className: 'mo-tour-icon', 'aria-hidden': 'true' },
           [t.icon]),
        el('h3', { className: 'mo-tour-title' }, [t.title]),
        el('p',  { className: 'mo-tour-desc' },  [t.desc])
      ]));
    }
    return el('div', { className: 'mo-body' }, [
      el('h2', { className: 'mo-title' }, ['Three rooms in the arcade']),
      el('p', { className: 'mo-tagline' }, [
        'Quick tour of what you can do once you start playing.'
      ]),
      el('div', { className: 'mo-tour' }, cards),
      el('button', {
        className: 'mo-btn', type: 'button',
        onclick: function () { goTo(4); }
      }, ['Continue →'])
    ]);
  }

  function renderStep4() {
    var games = getCuratedGames();
    var rows = [];
    for (var i = 0; i < games.length; i++) {
      (function (g) {
        rows.push(el('div', { className: 'mo-game' }, [
          el('div', { className: 'mo-game-text' }, [
            el('h3', { className: 'mo-game-title' },
               [g.title || g.name || g.id]),
            el('p',  { className: 'mo-game-sub' },
               [g.subtitle || g.description || 'Tap Play to start.'])
          ]),
          el('button', {
            className: 'mo-game-play', type: 'button',
            onclick: function () { launchGame(g); }
          }, ['Play ▶'])
        ]));
      })(games[i]);
    }

    return el('div', { className: 'mo-body' }, [
      el('h2', { className: 'mo-title' }, ['Pick your first game']),
      el('p', { className: 'mo-tagline' }, [
        'Three crowd-pleasers to get you started. You can always browse the full library.'
      ]),
      el('div', { className: 'mo-games' }, rows),
      el('button', {
        className: 'mo-btn mo-btn--ghost', type: 'button',
        onclick: function () { finishAndBrowse(); }
      }, ['Skip — show me everything'])
    ]);
  }

  // ---------- Flow control ----------
  function render() {
    if (!session) return;
    var card = session.card;
    while (card.firstChild) card.removeChild(card.firstChild);

    card.appendChild(renderHeader(session.step, function () {
      skip();
    }));

    var bodyFn = [renderStep1, renderStep2, renderStep3, renderStep4]
      [session.step - 1];
    card.appendChild(bodyFn());

    var firstFocus = card.querySelector(
      'input,select,button:not(.mo-skip)');
    if (firstFocus) {
      try { firstFocus.focus({ preventScroll: true }); } catch (_e) {}
    }
  }

  function goTo(step) {
    if (!session) return;
    if (step < 1 || step > TOTAL_STEPS) return;
    session.step = step;
    emit('step', { step: step });
    render();
  }

  function saveProfile(profile) {
    var data = { name: profile.name, avatar: profile.avatar, course: profile.course };
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.create === 'function') {
        root.MrMacsProfile.create(data);
        return;
      }
    } catch (_e) {}
    try {
      data.createdAt = Date.now();
      lsSet('mr-macs-arcade-profile', JSON.stringify(data));
    } catch (_e) {}
  }

  function open(opts) {
    if (session) return;
    injectStyles();
    var prevFocus = document.activeElement;
    var backdrop = el('div', {
      className: 'mo-backdrop', id: ROOT_ID,
      role: 'dialog', 'aria-modal': 'true',
      'aria-label': "Mr. Mac's Arcade onboarding"
    });
    var card = el('div', { className: 'mo-card' });
    backdrop.appendChild(card);
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); skip(); } }
    document.addEventListener('keydown', onKey);
    session = {
      backdrop: backdrop, card: card, step: 1,
      profile: { name: '', avatar: AVATARS[0], course: COURSES[0] },
      onKey: onKey, prevFocus: prevFocus, opts: opts || {}
    };
    document.body.appendChild(backdrop);
    emit('start', { opts: session.opts });
    render();
  }

  function close() {
    if (!session) return;
    document.removeEventListener('keydown', session.onKey);
    if (session.backdrop && session.backdrop.parentNode) {
      session.backdrop.parentNode.removeChild(session.backdrop);
    }
    var prev = session.prevFocus;
    session = null;
    if (prev && typeof prev.focus === 'function') {
      try { prev.focus({ preventScroll: true }); } catch (_e) {}
    }
  }

  function skip() {
    if (!session) return;
    emit('skip', { step: session.step });
    markCompleteInternal();
    close();
  }

  function markCompleteInternal() {
    lsSet(STORAGE_KEY, 'complete');
    emit('complete', { reason: 'finished' });
  }

  function finishAndBrowse() {
    markCompleteInternal();
    close();
    try {
      var lib = document.getElementById('library') ||
                document.querySelector('[data-library]') ||
                document.querySelector('main');
      if (lib && lib.scrollIntoView) {
        lib.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth',
                             block: 'start' });
      }
    } catch (_e) {}
  }

  function launchGame(game) {
    markCompleteInternal();
    emit('launch', { game: game });
    close();
    try {
      if (typeof root.openGame === 'function') {
        root.openGame(game);
        return;
      }
    } catch (_e) {}
    if (game && game.file) {
      try { root.location.href = game.file; } catch (_e) {}
    }
  }

  // ---------- Public API ----------
  function start(opts) {
    if (isComplete()) return;
    open(opts);
  }
  function replay() {
    lsDel(STORAGE_KEY);
    if (session) close();
    open({ replay: true });
  }
  function markComplete() {
    markCompleteInternal();
  }
  function reset() {
    lsDel(STORAGE_KEY);
    if (session) close();
  }
  function isComplete() {
    return lsGet(STORAGE_KEY) === 'complete';
  }
  function on(event, handler) {
    if (typeof handler !== 'function') return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }
  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === handler) arr.splice(i, 1);
    }
  }

  root.MrMacsOnboarding = {
    start: start,
    replay: replay,
    markComplete: markComplete,
    reset: reset,
    isComplete: isComplete,
    on: on,
    off: off
  };
})(typeof window !== 'undefined' ? window : this);
