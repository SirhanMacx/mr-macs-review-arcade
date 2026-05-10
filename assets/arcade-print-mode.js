/* arcade-print-mode.js -- "Print this passage" feature for Mr. Mac's Arcade.
 * Generates a clean, print-friendly version of any stimulus document so
 * students can highlight, annotate, and study on paper.
 *
 * Public API (window.MrMacsPrintMode):
 *   mountButton(container, stimulusData) -> { unmount }
 *     Attaches a small 🖨 icon button to the given container element.
 *   printDocument(stimulusData) -> void
 *     Immediately prints a single document.
 *   printPacket({ title, course, source, documents, question }) -> void
 *     Prints a multi-document packet with a question prompt header.
 *   on(event, handler) / off(event, handler)
 *
 * Events: "print-start", "print-ready", "print-error"
 *
 * Defensive throughout: popup blockers, missing images, missing DOM, and
 * localStorage failures all degrade silently — print is non-critical.
 */
(function (root) {
  'use strict';
  if (root && root.MrMacsPrintMode) return; // idempotent

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var FOOTER_TEXT =
    "Mr. Mac’s Arcade · sirhanmacx.github.io/mr-macs-review-arcade";
  var IFRAME_ID_PREFIX = 'mr-macs-print-frame-';
  var BUTTON_CLASS = 'mr-macs-print-btn';
  var TOOLTIP_TEXT = 'Print this passage';

  // ---------------------------------------------------------------------------
  // Event bus
  // ---------------------------------------------------------------------------
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
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) { /* swallow */ }
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** Return today's date as a human-readable string, e.g. "May 10, 2026". */
  function todayLabel() {
    try {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  /** Safely remove a node from the DOM. */
  function removeNode(node) {
    try {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    } catch (e) { /* swallow */ }
  }

  /**
   * Normalise stimulusData into a consistent internal shape.
   * Accepts loose fields so callers don't have to be precise.
   */
  function normalise(data) {
    if (!data || typeof data !== 'object') return {};
    return {
      title:    data.title    || data.name     || '',
      course:   data.course   || data.subject  || '',
      source:   data.source   || data.citation || '',
      caption:  data.caption  || '',
      images:   toArray(data.images  || data.image  || data.src  || []),
      text:     data.text     || data.content  || data.body      || '',
      question: data.question || data.prompt   || ''
    };
  }

  function toArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return [v];
    return [];
  }

  // ---------------------------------------------------------------------------
  // Print CSS (embedded verbatim in the iframe)
  // ---------------------------------------------------------------------------
  var PRINT_CSS = [
    '@page { size: letter; margin: 0.75in; }',
    'body { font-family: Georgia, serif; line-height: 1.6; color: #000; background: #fff; margin: 0; }',
    '.doc-header { border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }',
    '.doc-header h1 { font-size: 18px; margin: 0 0 4px 0; }',
    '.doc-header .meta { font-size: 12px; color: #555; margin: 0; }',
    '.doc-question { background: #f7f7f7; border-left: 4px solid #333; padding: 10px 14px;',
    '  margin-bottom: 20px; font-size: 14px; }',
    '.doc-caption { font-size: 12px; color: #444; font-style: italic; margin: 4px 0 12px 0; text-align: center; }',
    '.doc-text { font-size: 13px; margin-bottom: 16px; }',
    '.doc-image { max-width: 100%; height: auto; display: block; margin: 12px auto;',
    '  page-break-inside: avoid; }',
    '.doc-divider { border: none; border-top: 1px solid #ccc; margin: 24px 0; }',
    '.doc-footer { border-top: 1px solid #999; padding-top: 8px; margin-top: 24px;',
    '  font-size: 10px; color: #666; display: flex; justify-content: space-between; }',
    '@media screen { body { max-width: 720px; margin: 32px auto; padding: 0 24px; } }'
  ].join('\n');

  // ---------------------------------------------------------------------------
  // HTML builder
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /** Build the <img> tags for a list of image URLs. */
  function buildImages(images) {
    if (!images || !images.length) return '';
    return images.map(function (src) {
      if (!src) return '';
      return '<img class="doc-image" src="' + escapeHtml(src) + '" alt="Document image" loading="eager">';
    }).join('\n');
  }

  /** Build a single document block (header + images + text). */
  function buildDocBlock(doc, index, total) {
    var d = normalise(doc);
    var label = '';
    if (total > 1) label = 'Document ' + (index + 1) + ' of ' + total;

    var metaParts = [];
    if (d.course)  metaParts.push(escapeHtml(d.course));
    if (d.source)  metaParts.push(escapeHtml(d.source));
    if (label)     metaParts.push(label);

    var html = '';
    if (index > 0) html += '<hr class="doc-divider">';
    html += '<div class="doc-header">';
    if (d.title) {
      html += '<h1>' + escapeHtml(d.title) + '</h1>';
    }
    if (metaParts.length) {
      html += '<p class="meta">' + metaParts.join(' &nbsp;&bull;&nbsp; ') + '</p>';
    }
    html += '</div>';

    if (d.text) {
      html += '<div class="doc-text">' + escapeHtml(d.text) + '</div>';
    }

    html += buildImages(d.images);

    if (d.caption) {
      html += '<p class="doc-caption">' + escapeHtml(d.caption) + '</p>';
    }

    return html;
  }

  /** Assemble the full HTML page to load in the iframe. */
  function buildPageHtml(opts) {
    // opts: { title, course, source, documents:[], question, generatedDate }
    var title = opts.title || 'Passage';
    var date  = opts.generatedDate || todayLabel();
    var docs  = opts.documents || [];
    var question = opts.question || '';

    var bodyHtml = '';

    // Top-level header (for single-doc or packet)
    var topMetaParts = [];
    if (opts.course)  topMetaParts.push(escapeHtml(opts.course));
    if (opts.source)  topMetaParts.push(escapeHtml(opts.source));
    if (date)         topMetaParts.push(escapeHtml(date));

    bodyHtml += '<div class="doc-header">';
    bodyHtml += '<h1>' + escapeHtml(title) + '</h1>';
    if (topMetaParts.length) {
      bodyHtml += '<p class="meta">' + topMetaParts.join(' &nbsp;&bull;&nbsp; ') + '</p>';
    }
    bodyHtml += '</div>';

    if (question) {
      bodyHtml += '<div class="doc-question"><strong>Question:</strong> ' + escapeHtml(question) + '</div>';
    }

    for (var i = 0; i < docs.length; i++) {
      bodyHtml += buildDocBlock(docs[i], i, docs.length);
    }

    bodyHtml += '<div class="doc-footer">';
    bodyHtml +=   '<span>' + escapeHtml(FOOTER_TEXT) + '</span>';
    bodyHtml +=   '<span>Generated ' + escapeHtml(date) + '</span>';
    bodyHtml += '</div>';

    return (
      '<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escapeHtml(title) + '</title>' +
      '<style>' + PRINT_CSS + '</style>' +
      '</head><body>' +
      bodyHtml +
      '</body></html>'
    );
  }

  // ---------------------------------------------------------------------------
  // Core print engine
  // ---------------------------------------------------------------------------

  /**
   * Write HTML into a hidden iframe and trigger print once all images load.
   * Falls back gracefully if the iframe can't be created.
   */
  function printViaIframe(html, onDone) {
    try {
      if (!root.document || !root.document.body) return;

      var frameId = IFRAME_ID_PREFIX + Date.now();
      var frame = root.document.createElement('iframe');
      frame.id = frameId;
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';

      root.document.body.appendChild(frame);

      var cleanup = function () {
        try {
          setTimeout(function () { removeNode(frame); }, 2000);
        } catch (e) { /* swallow */ }
      };

      frame.onload = function () {
        try {
          var cw = frame.contentWindow;
          if (!cw) { cleanup(); return; }

          var images = frame.contentDocument
            ? frame.contentDocument.querySelectorAll('img')
            : [];

          var pending = images.length;

          var proceed = function () {
            try {
              emit('print-ready', { frameId: frameId });
              cw.focus();
              cw.print();
              if (typeof onDone === 'function') onDone();
              cleanup();
            } catch (e) {
              emit('print-error', { error: e });
              cleanup();
            }
          };

          if (!pending) {
            proceed();
            return;
          }

          var resolved = 0;
          var onImgDone = function () {
            resolved++;
            if (resolved >= pending) proceed();
          };

          for (var i = 0; i < images.length; i++) {
            var img = images[i];
            if (img.complete) {
              onImgDone();
            } else {
              img.addEventListener('load',  onImgDone);
              img.addEventListener('error', onImgDone); // still proceed on broken img
            }
          }
        } catch (e) {
          emit('print-error', { error: e });
          cleanup();
        }
      };

      // Write content after attaching onload to avoid race
      try {
        var doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      } catch (e) {
        // Some browsers restrict contentDocument access — fall through
        frame.src = 'about:blank';
        emit('print-error', { error: e });
        cleanup();
      }

    } catch (e) {
      emit('print-error', { error: e });
    }
  }

  /**
   * Attempt window.open first; if popup blocker prevents it, fall back
   * to the hidden iframe approach.
   */
  function printHtml(html) {
    emit('print-start', {});
    var usedWindowOpen = false;

    try {
      var win = root.open('', '_blank', 'width=800,height=600,menubar=yes,toolbar=yes,scrollbars=yes');
      if (win) {
        usedWindowOpen = true;
        win.document.open();
        win.document.write(html);
        win.document.close();

        var imgs = win.document.querySelectorAll('img');
        var pending = imgs.length;

        var triggerPrint = function () {
          try {
            win.focus();
            win.print();
            emit('print-ready', { method: 'window.open' });
          } catch (e) {
            emit('print-error', { error: e });
          }
        };

        if (!pending) {
          triggerPrint();
          return;
        }

        var resolved = 0;
        var onImgDone = function () {
          resolved++;
          if (resolved >= pending) triggerPrint();
        };
        for (var i = 0; i < imgs.length; i++) {
          var img = imgs[i];
          if (img.complete) { onImgDone(); }
          else {
            img.addEventListener('load',  onImgDone);
            img.addEventListener('error', onImgDone);
          }
        }
        return;
      }
    } catch (e) {
      // Popup blocked or security error — fall through to iframe
    }

    if (!usedWindowOpen) {
      printViaIframe(html);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API methods
  // ---------------------------------------------------------------------------

  /**
   * Print a single stimulus document.
   * stimulusData: { title, course, source, images[], text, caption, question }
   */
  function printDocument(stimulusData) {
    try {
      var d = normalise(stimulusData);
      var html = buildPageHtml({
        title:     d.title || 'Document',
        course:    d.course,
        source:    d.source,
        question:  d.question,
        documents: [stimulusData],
        generatedDate: todayLabel()
      });
      printHtml(html);
    } catch (e) {
      emit('print-error', { error: e });
    }
  }

  /**
   * Print a multi-document packet with an optional question prompt.
   * opts: { title, course, source, documents:[], question }
   */
  function printPacket(opts) {
    try {
      if (!opts || typeof opts !== 'object') return;
      var docs = toArray(opts.documents);
      if (!docs.length && opts.document) docs = [opts.document];

      var html = buildPageHtml({
        title:     opts.title    || 'Document Packet',
        course:    opts.course   || '',
        source:    opts.source   || '',
        question:  opts.question || '',
        documents: docs,
        generatedDate: todayLabel()
      });
      printHtml(html);
    } catch (e) {
      emit('print-error', { error: e });
    }
  }

  /**
   * Mount a small "🖨" button onto a container element.
   * Returns { unmount } so callers can clean up.
   */
  function mountButton(container, stimulusData) {
    var result = { unmount: function () {} };

    try {
      if (!container || !container.appendChild) return result;

      // Inject button styles once per page
      if (!root.document.getElementById('mr-macs-print-btn-style')) {
        var style = root.document.createElement('style');
        style.id = 'mr-macs-print-btn-style';
        style.textContent = [
          '.' + BUTTON_CLASS + ' {',
          '  display: inline-flex; align-items: center; justify-content: center;',
          '  width: 32px; height: 32px; padding: 0; margin: 0 4px;',
          '  background: transparent; border: 1px solid rgba(255,255,255,0.2);',
          '  border-radius: 6px; cursor: pointer; font-size: 16px;',
          '  color: inherit; opacity: 0.75; transition: opacity 0.15s, background 0.15s;',
          '  position: relative; vertical-align: middle;',
          '}',
          '.' + BUTTON_CLASS + ':hover { opacity: 1; background: rgba(255,255,255,0.1); }',
          '.' + BUTTON_CLASS + ':active { transform: scale(0.92); }',
          '.' + BUTTON_CLASS + '[title]:hover::after {',
          '  content: attr(title);',
          '  position: absolute; bottom: calc(100% + 6px); left: 50%;',
          '  transform: translateX(-50%);',
          '  background: #1a1a2e; color: #fff; font-size: 11px;',
          '  white-space: nowrap; padding: 3px 8px; border-radius: 4px;',
          '  pointer-events: none; z-index: 9999;',
          '}'
        ].join('\n');
        try { root.document.head.appendChild(style); } catch (e) { /* swallow */ }
      }

      var btn = root.document.createElement('button');
      btn.type = 'button';
      btn.className = BUTTON_CLASS;
      btn.setAttribute('title', TOOLTIP_TEXT);
      btn.setAttribute('aria-label', TOOLTIP_TEXT);
      btn.textContent = '🖨'; // 🖨

      btn.addEventListener('click', function (e) {
        try { e.stopPropagation(); } catch (err) { /* swallow */ }
        printDocument(stimulusData);
      });

      container.appendChild(btn);

      result.unmount = function () {
        try {
          btn.removeEventListener('click', btn._clickHandler);
          removeNode(btn);
        } catch (e) { /* swallow */ }
      };

    } catch (e) {
      emit('print-error', { error: e });
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Expose public API
  // ---------------------------------------------------------------------------
  root.MrMacsPrintMode = {
    mountButton:   mountButton,
    printDocument: printDocument,
    printPacket:   printPacket,
    on:            on,
    off:           off
  };

}(typeof window !== 'undefined' ? window : this));
