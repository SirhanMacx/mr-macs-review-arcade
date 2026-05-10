/* arcade-screenshot.js -- Run-summary screenshots for Mr. Mac's Arcade.
 * Pure Canvas2D, no external libraries. Mounts window.MrMacsScreenshot with:
 *   generateRunSummary(opts) -> Promise<Blob>
 *   showShareModal(opts)     -> Promise<{ saved, shared }>
 *   captureAndDownload(opts) -> Promise<{ filename }>
 *   revokeAll(), on(e,h), off(e,h)
 */
(function (root) {
  'use strict';
  if (root && root.MrMacsScreenshot) return; // idempotent

  // --- Design tokens --------------------------------------------------------
  var CANVAS_SIZE = 1080;
  var FOOTER_TEXT = "Mr. Mac's Arcade  ·  sirhanmacx.github.io/mr-macs-review-arcade";
  var DEFAULT_ACCENT = '#5cf2ff';
  var FONT_DISPLAY = '"Iowan Old Style", "Georgia", "Times New Roman", serif';
  var FONT_SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
  var FONT_MONO = '"JetBrains Mono", "Fira Code", Menlo, Consolas, monospace';
  var COLOR_BG_TOP = '#0b1020', COLOR_BG_BOTTOM = '#1c0c2c';
  var COLOR_TEXT = '#f5f7ff';
  var COLOR_DIM = 'rgba(245, 247, 255, 0.62)';
  var COLOR_FAINT = 'rgba(245, 247, 255, 0.18)';
  var COLOR_PANEL = 'rgba(255, 255, 255, 0.04)';
  var COLOR_PANEL_BORDER = 'rgba(255, 255, 255, 0.08)';

  // --- Event bus ------------------------------------------------------------
  var listeners = Object.create(null);
  function on(event, handler) {
    if (typeof event !== 'string' || typeof handler !== 'function') return;
    (listeners[event] = listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    if (!listeners[event]) return;
    if (!handler) { listeners[event] = []; return; }
    listeners[event] = listeners[event].filter(function (h) { return h !== handler; });
  }
  function emit(event, payload) {
    var arr = listeners[event]; if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); }
      catch (err) { if (root && root.console) root.console.warn('[MrMacsScreenshot]', err); }
    }
  }

  // --- Object-URL tracking --------------------------------------------------
  var liveUrls = [];
  function trackUrl(url) {
    if (typeof url === 'string' && url.indexOf('blob:') === 0) liveUrls.push(url);
    return url;
  }
  function revokeAll() {
    if (root && root.URL && typeof root.URL.revokeObjectURL === 'function') {
      for (var i = 0; i < liveUrls.length; i++) {
        try { root.URL.revokeObjectURL(liveUrls[i]); } catch (_) {}
      }
    }
    liveUrls.length = 0;
  }

  // --- Utilities ------------------------------------------------------------
  function safeNumber(n, fallback) {
    if (typeof n === 'number' && isFinite(n)) return n;
    var p = parseFloat(n);
    return isFinite(p) ? p : (fallback || 0);
  }

  function formatNumber(n) {
    var v = safeNumber(n, 0);
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function formatDuration(ms) {
    var total = Math.max(0, Math.round(safeNumber(ms, 0) / 1000));
    var h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return (h > 0 ? h + ':' + pad2(m) : '' + m) + ':' + pad2(s);
  }
  function todayStamp() {
    var d = new Date();
    return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }
  function slugify(s) {
    return ('' + (s || 'arcade')).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'arcade';
  }
  function escapeText(s) { return ('' + (s == null ? '' : s)).replace(/\s+/g, ' ').trim(); }
  function prefersReducedMotion() {
    try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (_) { return false; }
  }
  function hexToRgb(hex) {
    var h = ('' + hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6) return { r: 92, g: 242, b: 255 };
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
  }

  // --- Canvas primitives ----------------------------------------------------
  function makeCanvas(w, h) {
    var c = root.document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function roundedRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }
  function drawBackground(ctx, w, h, accent) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, COLOR_BG_TOP); g.addColorStop(1, COLOR_BG_BOTTOM);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var rg = ctx.createRadialGradient(w * 0.18, h * 0.18, 10, w * 0.18, h * 0.18, w * 0.6);
    rg.addColorStop(0, rgba(accent, 0.22)); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    var rg2 = ctx.createRadialGradient(w * 0.85, h * 0.9, 10, w * 0.85, h * 0.9, w * 0.55);
    rg2.addColorStop(0, 'rgba(255, 122, 89, 0.16)'); rg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg2; ctx.fillRect(0, 0, w, h);
  }
  function drawScanlines(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
    for (var y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.restore();
    ctx.save();
    var vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawProfileChip(ctx, x, y, name, avatar, accent) {
    var size = 64;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    var ag = ctx.createLinearGradient(x, y, x + size, y + size);
    ag.addColorStop(0, rgba(accent, 0.9)); ag.addColorStop(1, rgba(accent, 0.45));
    ctx.fillStyle = ag; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
    var glyph = avatar && ('' + avatar).trim()
      ? ('' + avatar).trim()
      : (name ? name.charAt(0).toUpperCase() : '?');
    ctx.fillStyle = '#0b1020';
    ctx.font = '600 32px ' + FONT_SANS;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(glyph.slice(0, 2), x + size / 2, y + size / 2 + 2);
    ctx.restore();
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '500 26px ' + FONT_SANS;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(escapeText(name) || 'Player', x + size + 18, y + size / 2 - 9);
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '400 18px ' + FONT_SANS;
    ctx.fillText('PLAYER', x + size + 18, y + size / 2 + 16);
  }
  function fitText(ctx, text, maxWidth, startSize, minSize) {
    var size = startSize;
    while (size > minSize) {
      ctx.font = '700 ' + size + 'px ' + FONT_DISPLAY;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    if (ctx.measureText(text).width > maxWidth) {
      var t = text;
      while (t.length > 4 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
      text = t + '…';
    }
    return { text: text, size: size };
  }
  function drawTitleBar(ctx, x, y, w, gameName, score, accent) {
    ctx.fillStyle = rgba(accent, 0.95);
    ctx.font = '700 22px ' + FONT_SANS;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var eyebrow = 'RUN SUMMARY';
    ctx.fillText(eyebrow, x, y);
    var ulW = ctx.measureText(eyebrow).width;
    ctx.fillStyle = rgba(accent, 0.4);
    ctx.fillRect(x, y + 8, ulW, 2);
    ctx.fillStyle = COLOR_TEXT;
    var name = escapeText(gameName) || 'Mr. Mac’s Game';
    var fitted = fitText(ctx, name, w * 0.62, 64, 36);
    ctx.font = '700 ' + fitted.size + 'px ' + FONT_DISPLAY;
    ctx.fillText(fitted.text, x, y + 75);
    ctx.font = '700 96px ' + FONT_MONO;
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(score), x + w, y + 78);
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '500 18px ' + FONT_SANS;
    ctx.fillText('FINAL SCORE', x + w, y + 8);
  }
  function drawStatGrid(ctx, x, y, w, h, cells, accent) {
    var cols = 2, rows = Math.ceil(cells.length / cols), gap = 22;
    var cellW = (w - gap * (cols - 1)) / cols;
    var cellH = (h - gap * (rows - 1)) / rows;
    for (var i = 0; i < cells.length; i++) {
      var col = i % cols, rowI = Math.floor(i / cols);
      drawStatCell(ctx, x + col * (cellW + gap), y + rowI * (cellH + gap), cellW, cellH, cells[i], accent);
    }
  }
  function drawStatCell(ctx, x, y, w, h, cell, accent) {
    roundedRect(ctx, x, y, w, h, 22);
    ctx.fillStyle = COLOR_PANEL; ctx.fill();
    ctx.strokeStyle = COLOR_PANEL_BORDER; ctx.lineWidth = 1; ctx.stroke();
    roundedRect(ctx, x, y, w, 4, 2);
    ctx.fillStyle = rgba(accent, 0.7); ctx.fill();
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '600 18px ' + FONT_SANS;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(('' + cell.label).toUpperCase(), x + 28, y + 50);
    ctx.fillStyle = COLOR_TEXT;
    var raw = '' + cell.value;
    var mono = cell.mono !== false;
    var face = mono ? FONT_MONO : FONT_SANS;
    var size = 56;
    ctx.font = '700 ' + size + 'px ' + face;
    var maxW = w - 56;
    while (ctx.measureText(raw).width > maxW && size > 26) {
      size -= 4;
      ctx.font = '700 ' + size + 'px ' + face;
    }
    ctx.fillText(raw, x + 28, y + h - 32);
  }

  function drawAchievementIcon(ctx, x, y, size, ach, accent) {
    var label = '', glyph = '';
    if (typeof ach === 'string') { glyph = ach.slice(0, 2); label = ach; }
    else if (ach && typeof ach === 'object') {
      glyph = ach.icon || ach.emoji || (ach.name ? ach.name.charAt(0) : '*');
      label = ach.name || ach.label || '';
    }
    roundedRect(ctx, x, y, size, size, 16);
    var bg = ctx.createLinearGradient(x, y, x + size, y + size);
    bg.addColorStop(0, rgba(accent, 0.55)); bg.addColorStop(1, rgba(accent, 0.18));
    ctx.fillStyle = bg; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(accent, 0.65); ctx.stroke();
    ctx.fillStyle = '#0b1020';
    ctx.font = '700 30px ' + FONT_SANS;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(('' + glyph).slice(0, 2), x + size / 2, y + size / 2 + 1);
    if (label) {
      ctx.fillStyle = COLOR_DIM;
      ctx.font = '500 14px ' + FONT_SANS;
      ctx.textBaseline = 'top';
      var trimmed = label.length > 14 ? label.slice(0, 13) + '…' : label;
      ctx.fillText(trimmed, x + size / 2, y + size + 8);
    }
  }
  function drawAchievementsRow(ctx, x, y, w, achievements, accent) {
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '600 18px ' + FONT_SANS;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('ACHIEVEMENTS UNLOCKED', x, y);
    var list = Array.isArray(achievements) ? achievements : [];
    if (list.length === 0) {
      ctx.fillStyle = COLOR_FAINT;
      ctx.font = '500 22px ' + FONT_SANS;
      ctx.fillText('No new badges this run', x, y + 56);
      return;
    }
    var iconSize = 64, gap = 18;
    var maxIcons = Math.floor((w + gap) / (iconSize + gap));
    var visible = list.slice(0, maxIcons);
    var hidden = list.length - visible.length;
    for (var i = 0; i < visible.length; i++) {
      drawAchievementIcon(ctx, x + i * (iconSize + gap), y + 24, iconSize, visible[i], accent);
    }
    if (hidden > 0) {
      var bx = x + visible.length * (iconSize + gap), by = y + 24;
      roundedRect(ctx, bx, by, iconSize, iconSize, iconSize / 2);
      ctx.fillStyle = COLOR_PANEL; ctx.fill();
      ctx.strokeStyle = COLOR_PANEL_BORDER; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = COLOR_TEXT;
      ctx.font = '700 22px ' + FONT_MONO;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + hidden, bx + iconSize / 2, by + iconSize / 2);
    }
  }
  function drawFooter(ctx, w, h, accent) {
    var fy = h - 60;
    ctx.fillStyle = rgba(accent, 0.35);
    ctx.fillRect(72, fy, w - 144, 1);
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '500 20px ' + FONT_SANS;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(FOOTER_TEXT, 72, fy + 28);
    ctx.fillStyle = COLOR_FAINT;
    ctx.font = '500 18px ' + FONT_MONO;
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toISOString().slice(0, 10), w - 72, fy + 28);
  }

  // --- Main render ----------------------------------------------------------
  function buildStatCells(opts) {
    var cells = [
      { label: 'Score', value: formatNumber(opts.score), mono: true },
      { label: 'Level', value: opts.level != null ? '' + opts.level : '—', mono: true },
      { label: 'Time', value: formatDuration(opts.durationMs), mono: true },
      { label: 'Scholar Hits', value: formatNumber(opts.scholarHits || 0), mono: true }
    ];
    if (Array.isArray(opts.extras)) {
      for (var i = 0; i < opts.extras.length && cells.length < 8; i++) {
        var e = opts.extras[i];
        if (e && e.label != null) {
          cells.push({
            label: '' + e.label,
            value: '' + (e.value == null ? '—' : e.value),
            mono: e.mono !== false
          });
        }
      }
    }
    return cells;
  }
  function renderToCanvas(opts) {
    var accent = (opts && opts.accentColor) || DEFAULT_ACCENT;
    var canvas = makeCanvas(CANVAS_SIZE, CANVAS_SIZE);
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas2D context unavailable');
    drawBackground(ctx, CANVAS_SIZE, CANVAS_SIZE, accent);
    drawProfileChip(ctx, 72, 72, opts.profileName, opts.profileAvatar, accent);
    drawTitleBar(ctx, 72, 220, CANVAS_SIZE - 144, opts.gameName, opts.score, accent);
    drawStatGrid(ctx, 72, 380, CANVAS_SIZE - 144, 380, buildStatCells(opts), accent);
    drawAchievementsRow(ctx, 72, 800, CANVAS_SIZE - 144, opts.achievements, accent);
    drawScanlines(ctx, CANVAS_SIZE, CANVAS_SIZE);
    drawFooter(ctx, CANVAS_SIZE, CANVAS_SIZE, accent);
    return canvas;
  }
  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      try {
        if (canvas.toBlob) {
          canvas.toBlob(function (blob) {
            if (!blob) return reject(new Error('canvas.toBlob returned null'));
            resolve(blob);
          }, 'image/png');
        } else {
          var dataUrl = canvas.toDataURL('image/png');
          var bin = atob(dataUrl.split(',')[1]);
          var bytes = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          resolve(new Blob([bytes], { type: 'image/png' }));
        }
      } catch (err) { reject(err); }
    });
  }
  function generateRunSummary(opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      try {
        var canvas = renderToCanvas(opts);
        emit('rendered', { width: canvas.width, height: canvas.height });
        canvasToBlob(canvas).then(function (blob) {
          emit('blob', { size: blob.size });
          resolve(blob);
        }, reject);
      } catch (err) {
        emit('error', { error: err });
        reject(err);
      }
    });
  }

  // --- Filename / download / clipboard helpers ----------------------------
  function makeFilename(opts) {
    var gid = slugify(opts && opts.gameId);
    var score = Math.round(safeNumber(opts && opts.score, 0));
    return 'mr-macs-arcade-' + gid + '-' + todayStamp() + '-' + score + '.png';
  }
  function triggerDownload(blob, filename) {
    if (!root || !root.URL || typeof root.URL.createObjectURL !== 'function') return false;
    var url = trackUrl(root.URL.createObjectURL(blob));
    var a = root.document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    root.document.body.appendChild(a);
    try { a.click(); } catch (_) {}
    setTimeout(function () {
      try { root.document.body.removeChild(a); } catch (_) {}
    }, 100);
    return true;
  }
  function captureAndDownload(opts) {
    return generateRunSummary(opts).then(function (blob) {
      var filename = makeFilename(opts);
      triggerDownload(blob, filename);
      emit('downloaded', { filename: filename });
      return { filename: filename };
    });
  }
  function copyBlobToClipboard(blob) {
    return new Promise(function (resolve) {
      try {
        if (!root.navigator || !root.navigator.clipboard || typeof root.ClipboardItem !== 'function') {
          return resolve({ ok: false, reason: 'unsupported' });
        }
        var item = new root.ClipboardItem({ 'image/png': blob });
        root.navigator.clipboard.write([item]).then(
          function () { resolve({ ok: true }); },
          function (err) { resolve({ ok: false, reason: 'denied', error: err }); }
        );
      } catch (err) { resolve({ ok: false, reason: 'threw', error: err }); }
    });
  }

  // ---------------------------------------------------------------------------
  // Modal: showShareModal
  // ---------------------------------------------------------------------------
  var MODAL_STYLE_ID = 'mrmacs-screenshot-modal-style';

  function injectModalStyles() {
    var doc = root.document;
    if (doc.getElementById(MODAL_STYLE_ID)) return;
    var style = doc.createElement('style');
    style.id = MODAL_STYLE_ID;
    style.textContent = [
      '.mms-overlay{position:fixed;inset:0;background:rgba(6,8,18,0.78);display:flex;',
      'align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity .18s ease;',
      'font-family:' + FONT_SANS + ';color:' + COLOR_TEXT + ';}',
      '.mms-overlay.mms-show{opacity:1;}',
      '.mms-overlay.mms-instant{transition:none;}',
      '.mms-card{background:linear-gradient(160deg,#161a30,#0c0f24);border:1px solid rgba(255,255,255,0.08);',
      'border-radius:24px;padding:28px;max-width:620px;width:calc(100% - 48px);box-shadow:0 30px 80px rgba(0,0,0,0.55);',
      'transform:scale(0.96);transition:transform .18s ease;}',
      '.mms-overlay.mms-show .mms-card{transform:scale(1);}',
      '.mms-overlay.mms-instant .mms-card{transition:none;}',
      '.mms-title{font-size:20px;font-weight:700;margin:0 0 4px;}',
      '.mms-sub{font-size:14px;color:' + COLOR_DIM + ';margin:0 0 18px;}',
      '.mms-preview{width:540px;max-width:100%;aspect-ratio:1/1;border-radius:18px;overflow:hidden;',
      'background:#000;display:block;margin:0 auto 18px;border:1px solid rgba(255,255,255,0.06);}',
      '.mms-preview img{width:100%;height:100%;display:block;object-fit:cover;}',
      '.mms-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;}',
      '.mms-btn{appearance:none;border:0;cursor:pointer;font-family:inherit;font-weight:600;',
      'padding:12px 18px;border-radius:12px;font-size:15px;transition:transform .12s ease, background .12s ease;}',
      '.mms-btn:active{transform:translateY(1px);}',
      '.mms-btn-primary{background:#5cf2ff;color:#06121a;}',
      '.mms-btn-primary:hover{background:#7af6ff;}',
      '.mms-btn-secondary{background:rgba(255,255,255,0.08);color:#f5f7ff;}',
      '.mms-btn-secondary:hover{background:rgba(255,255,255,0.14);}',
      '.mms-btn-ghost{background:transparent;color:' + COLOR_DIM + ';}',
      '.mms-btn-ghost:hover{color:#f5f7ff;}',
      '.mms-toast{margin-top:12px;font-size:13px;color:' + COLOR_DIM + ';min-height:18px;text-align:right;}',
      '@media (max-width:600px){.mms-preview{width:100%;}.mms-row{justify-content:stretch;}.mms-btn{flex:1 1 auto;text-align:center;}}'
    ].join('');
    doc.head.appendChild(style);
  }

  function elt(doc, tag, cls, text) {
    var el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function showShareModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var doc = root.document;
      if (!doc || !doc.body) { resolve({ saved: false, shared: false, error: 'no-document' }); return; }
      injectModalStyles();
      var saved = false, shared = false, instant = prefersReducedMotion();
      var overlay = elt(doc, 'div', 'mms-overlay' + (instant ? ' mms-instant' : ''));
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Share run summary');
      var card = elt(doc, 'div', 'mms-card');
      card.appendChild(elt(doc, 'h2', 'mms-title', 'Share your run'));
      card.appendChild(elt(doc, 'p', 'mms-sub', escapeText(opts.gameName) || 'Mr. Mac’s Arcade'));
      var preview = elt(doc, 'div', 'mms-preview');
      var img = elt(doc, 'img');
      img.alt = 'Run summary preview';
      preview.appendChild(img);
      card.appendChild(preview);
      var row = elt(doc, 'div', 'mms-row');
      var btnDownload = elt(doc, 'button', 'mms-btn mms-btn-primary', 'Download PNG');
      var btnCopy = elt(doc, 'button', 'mms-btn mms-btn-secondary', 'Copy Image');
      var btnClose = elt(doc, 'button', 'mms-btn mms-btn-ghost', 'Close');
      btnDownload.type = btnCopy.type = btnClose.type = 'button';
      row.appendChild(btnDownload); row.appendChild(btnCopy); row.appendChild(btnClose);
      card.appendChild(row);
      var toast = elt(doc, 'div', 'mms-toast');
      toast.setAttribute('aria-live', 'polite');
      card.appendChild(toast);
      overlay.appendChild(card);

      var blobRef = null, previewUrl = null, closed = false;
      function setToast(msg) { toast.textContent = msg || ''; }
      function close() {
        if (closed) return;
        closed = true;
        overlay.classList.remove('mms-show');
        var done = function () {
          try { doc.body.removeChild(overlay); } catch (_) {}
          if (previewUrl && root.URL && root.URL.revokeObjectURL) {
            try { root.URL.revokeObjectURL(previewUrl); } catch (_) {}
          }
          doc.removeEventListener('keydown', onKey, true);
          resolve({ saved: saved, shared: shared });
        };
        if (instant) done(); else setTimeout(done, 180);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }

      btnDownload.addEventListener('click', function () {
        if (!blobRef) return;
        var filename = makeFilename(opts);
        if (triggerDownload(blobRef, filename)) {
          saved = true;
          setToast('Saved as ' + filename);
          emit('downloaded', { filename: filename });
        } else setToast('Could not start download');
      });
      btnCopy.addEventListener('click', function () {
        if (!blobRef) return;
        setToast('Copying…');
        copyBlobToClipboard(blobRef).then(function (res) {
          if (res.ok) { shared = true; setToast('Image copied to clipboard'); emit('copied', {}); }
          else setToast('Clipboard not available — try Download');
        });
      });
      btnClose.addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      doc.addEventListener('keydown', onKey, true);

      doc.body.appendChild(overlay);
      // eslint-disable-next-line no-unused-expressions
      overlay.offsetWidth; // force reflow so the show transition fires
      overlay.classList.add('mms-show');

      generateRunSummary(opts).then(function (blob) {
        if (closed) return;
        blobRef = blob;
        if (root.URL && root.URL.createObjectURL) {
          previewUrl = root.URL.createObjectURL(blob);
          trackUrl(previewUrl);
          img.src = previewUrl;
        }
        emit('modal-ready', { size: blob.size });
      }, function (err) {
        if (closed) return;
        setToast('Could not render image');
        emit('error', { error: err });
      });
    });
  }

  // --- Mount ---------------------------------------------------------------
  if (root) root.MrMacsScreenshot = {
    generateRunSummary: generateRunSummary,
    showShareModal: showShareModal,
    captureAndDownload: captureAndDownload,
    revokeAll: revokeAll,
    on: on,
    off: off,
    _internals: {
      makeFilename: makeFilename,
      formatNumber: formatNumber,
      formatDuration: formatDuration,
      slugify: slugify,
      CANVAS_SIZE: CANVAS_SIZE
    }
  };
})(typeof window !== 'undefined' ? window : this);
