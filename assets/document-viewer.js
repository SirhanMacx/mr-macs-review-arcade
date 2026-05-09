(function () {
  "use strict";

  var SELECTOR = [
    "img[src*='regents-gauntlet-stimuli']",
    "img[src*='regents-released-forms']",
    "img[src*='ap-released-forms']",
    "img[data-source-img]",
    "img[data-source-page-img]",
    ".official-page-image",
    ".source-image",
    ".source-panel img",
    ".quest-source img",
    ".doc-card img",
    ".stimulus-grid img",
    ".stimulus-row img",
    ".stimulus-strip img",
    ".stimulus-box img",
    ".intel-source-thumb img",
    "#sourceImage"
  ].join(",");
  var ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5];
  var ZOOM_MIN = 0.5;
  var ZOOM_MAX = 3;
  var state = {
    images: [],
    index: 0,
    zoom: 1,
    fullscreen: false,
    lastFocus: null
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isUsefulImage(img) {
    if (!img || img.dataset.docViewerEnhanced === "1") return false;
    var src = img.currentSrc || img.src || img.getAttribute("src") || "";
    if (!src || src.indexOf("data:image") === 0) return false;
    if (img.closest(".source-inspector") || img.closest(".stimulus-viewer") || img.closest(".mm-doc-viewer")) return false;
    return img.matches(SELECTOR);
  }

  function labelFor(img) {
    var figure = img.closest("figure");
    var caption = figure && figure.querySelector("figcaption");
    return img.getAttribute("alt") || (caption && caption.textContent.trim()) || img.dataset.sourceLabel || "Source document";
  }

  function sourceFor(img) {
    var figure = img.closest("figure");
    var caption = figure && figure.querySelector("figcaption");
    var line = img.closest(".question-card, .work, .panel, article, section")?.querySelector(".source-line, .question-meta, .intel-source-head");
    return (caption && caption.textContent.trim()) || (line && line.textContent.trim()) || "Released source";
  }

  function collectImages() {
    state.images = Array.from(document.querySelectorAll(SELECTOR)).filter(function (img) {
      var src = img.currentSrc || img.src || img.getAttribute("src") || "";
      return src && src.indexOf("data:image") !== 0 && !img.closest(".source-inspector") && !img.closest(".stimulus-viewer") && !img.closest(".mm-doc-viewer");
    }).map(function (img) {
      return { src: img.currentSrc || img.src || img.getAttribute("src"), label: labelFor(img), source: sourceFor(img), element: img };
    });
  }

  function ensureStyles() {
    if (document.getElementById("mmDocViewerStyles")) return;
    var style = document.createElement("style");
    style.id = "mmDocViewerStyles";
    style.textContent = [
      "body.mm-doc-viewer-open{overflow:hidden}",
      ".mm-doc-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}",
      ".mm-doc-expand{min-height:34px;padding:7px 10px;border:1px solid rgba(98,233,255,.48);border-radius:7px;background:linear-gradient(180deg,rgba(98,233,255,.18),rgba(255,255,255,.055)),rgba(8,14,30,.92);color:#f8fbff;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer;text-transform:uppercase;letter-spacing:.02em}",
      ".mm-doc-expand:hover,.mm-doc-expand:focus-visible{outline:none;border-color:rgba(255,209,92,.78);box-shadow:0 0 0 2px rgba(255,209,92,.16)}",
      ".mm-doc-viewer{position:fixed;inset:0;z-index:9999;display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px;padding:12px;background:rgba(2,5,14,.94);backdrop-filter:blur(16px) saturate(1.12)}",
      ".mm-doc-viewer[hidden]{display:none}",
      ".mm-doc-viewer.mm-doc-fullscreen{padding:0;gap:0}",
      ".mm-doc-viewer.mm-doc-fullscreen .mm-doc-bar{border-radius:0;border-left:0;border-right:0;border-top:0}",
      ".mm-doc-viewer.mm-doc-fullscreen .mm-doc-stage{border-radius:0;border-left:0;border-right:0;border-bottom:0}",
      ".mm-doc-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.035)),rgba(7,12,25,.94);box-shadow:0 18px 50px rgba(0,0,0,.38)}",
      ".mm-doc-title strong{display:block;color:#fff;font-size:18px;line-height:1.08}.mm-doc-title span{display:block;margin-top:4px;color:#b8c6dc;font-size:12px;font-weight:850;text-transform:uppercase}",
      ".mm-doc-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.mm-doc-controls button{min-height:38px;padding:8px 10px;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.08);color:#f8fbff;font-weight:900;cursor:pointer}.mm-doc-controls .mm-doc-close{background:linear-gradient(135deg,#ffd15c,#fff0aa);color:#071018}",
      ".mm-doc-controls button:focus-visible{outline:2px solid #ffd15c;outline-offset:2px}",
      ".mm-doc-controls button:disabled{opacity:.45;cursor:not-allowed}",
      ".mm-doc-zoom{min-width:58px;text-align:center;color:#f8fbff;font-weight:900}",
      ".mm-doc-zoom-select{min-height:38px;padding:8px 10px;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.08);color:#f8fbff;font-weight:800;cursor:pointer}",
      ".mm-doc-stage{min-height:0;overflow:auto;display:grid;align-items:start;justify-items:center;padding:18px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#111827}",
      ".mm-doc-stage img{display:block;width:100%;max-width:none;height:auto;background:#fff;border-radius:5px;box-shadow:0 18px 70px rgba(0,0,0,.5)}",
      ".mm-doc-shortcuts{position:absolute;bottom:14px;left:14px;color:rgba(248,251,255,.55);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;pointer-events:none}",
      "@media(max-width:760px){.mm-doc-viewer{grid-template-rows:auto minmax(0,1fr);padding:8px}.mm-doc-bar{display:grid;grid-template-columns:1fr;gap:8px}.mm-doc-controls{justify-content:flex-start;flex-wrap:wrap}.mm-doc-stage{padding:8px}.mm-doc-title strong{font-size:16px}.mm-doc-shortcuts{display:none}}",
      "@media(max-width:520px){.mm-doc-controls button,.mm-doc-zoom-select{min-height:42px;padding:9px 8px;font-size:13px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function enhanceImage(img) {
    if (!isUsefulImage(img)) return;
    img.dataset.docViewerEnhanced = "1";
    var host = img.closest("figure") || img.parentElement;
    if (!host || host.querySelector(":scope > .mm-doc-tools")) return;
    var tools = document.createElement("div");
    tools.className = "mm-doc-tools";
    tools.innerHTML = '<button class="mm-doc-expand" type="button">Expand Source</button>';
    tools.querySelector("button").addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openForImage(img);
    });
    if (host.tagName === "A") host.insertAdjacentElement("afterend", tools);
    else host.appendChild(tools);
  }

  function enhanceAll() {
    ensureStyles();
    Array.from(document.querySelectorAll(SELECTOR)).forEach(enhanceImage);
  }

  function buildZoomOptions() {
    return ZOOM_PRESETS.map(function (z) {
      return '<option value="' + z + '">' + Math.round(z * 100) + '%</option>';
    }).join("");
  }

  function ensureViewer() {
    var existing = document.getElementById("mmDocViewer");
    if (existing) return existing;
    var viewer = document.createElement("section");
    viewer.id = "mmDocViewer";
    viewer.className = "mm-doc-viewer";
    viewer.hidden = true;
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Expanded source document");
    viewer.innerHTML =
      '<header class="mm-doc-bar">' +
        '<div class="mm-doc-title"><strong id="mmDocTitle">Source document</strong><span id="mmDocMeta">Released source</span></div>' +
        '<div class="mm-doc-controls">' +
          '<button type="button" data-doc-prev aria-label="Previous source">Previous</button>' +
          '<button type="button" data-doc-zoom="-1" aria-label="Zoom out">-</button>' +
          '<select class="mm-doc-zoom-select" data-doc-zoom-select aria-label="Zoom level">' + buildZoomOptions() + '</select>' +
          '<span class="mm-doc-zoom" id="mmDocZoom" aria-live="polite">100%</span>' +
          '<button type="button" data-doc-zoom="1" aria-label="Zoom in">+</button>' +
          '<button type="button" data-doc-fit aria-label="Fit to width">Fit</button>' +
          '<button type="button" data-doc-fullscreen aria-label="Toggle full screen">Full</button>' +
          '<button type="button" data-doc-next aria-label="Next source">Next</button>' +
          '<button type="button" class="mm-doc-close" data-doc-close aria-label="Close source viewer">Close</button>' +
        '</div>' +
      '</header>' +
      '<div class="mm-doc-stage"><img id="mmDocImage" alt="Expanded source document"></div>' +
      '<div class="mm-doc-shortcuts" aria-hidden="true">+/- zoom · arrows nav · F full · Esc close</div>';
    document.body.appendChild(viewer);
    viewer.querySelector("[data-doc-close]").addEventListener("click", closeViewer);
    viewer.querySelector("[data-doc-prev]").addEventListener("click", function () { step(-1); });
    viewer.querySelector("[data-doc-next]").addEventListener("click", function () { step(1); });
    viewer.querySelector("[data-doc-fit]").addEventListener("click", function () { setZoom(1); });
    viewer.querySelector("[data-doc-fullscreen]").addEventListener("click", toggleFullscreen);
    viewer.querySelectorAll("[data-doc-zoom]").forEach(function (button) {
      button.addEventListener("click", function () { setZoom(state.zoom + Number(button.dataset.docZoom) * 0.2); });
    });
    var select = viewer.querySelector("[data-doc-zoom-select]");
    if (select) {
      select.addEventListener("change", function () {
        var value = Number(select.value);
        if (Number.isFinite(value)) setZoom(value);
      });
    }
    viewer.addEventListener("keydown", trapFocus);
    // click outside the title-bar / image area closes
    viewer.addEventListener("click", function (event) {
      if (event.target === viewer) closeViewer();
    });
    return viewer;
  }

  function focusableElements(viewer) {
    return Array.from(viewer.querySelectorAll(
      'button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return !el.hasAttribute("hidden") && el.offsetParent !== null;
    });
  }

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    var viewer = document.getElementById("mmDocViewer");
    if (!viewer || viewer.hidden) return;
    var focusables = focusableElements(viewer);
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function syncZoomSelect(viewer) {
    if (!viewer) return;
    var select = viewer.querySelector("[data-doc-zoom-select]");
    if (!select) return;
    var matching = ZOOM_PRESETS.find(function (z) {
      return Math.abs(z - state.zoom) < 0.001;
    });
    if (matching != null) {
      select.value = String(matching);
    } else {
      select.value = "";
    }
  }

  function renderViewer() {
    var viewer = ensureViewer();
    var item = state.images[state.index] || {};
    viewer.querySelector("#mmDocTitle").textContent = item.label || "Source document";
    viewer.querySelector("#mmDocMeta").textContent = (item.source || "Released source") + (state.images.length ? " - " + (state.index + 1) + " of " + state.images.length : "");
    viewer.querySelector("#mmDocZoom").textContent = Math.round(state.zoom * 100) + "%";
    var image = viewer.querySelector("#mmDocImage");
    image.src = item.src || "";
    image.alt = item.label || "Expanded source document";
    image.style.width = Math.round(state.zoom * 100) + "%";
    var prev = viewer.querySelector("[data-doc-prev]");
    var next = viewer.querySelector("[data-doc-next]");
    if (prev) prev.disabled = state.images.length < 2;
    if (next) next.disabled = state.images.length < 2;
    viewer.classList.toggle("mm-doc-fullscreen", !!state.fullscreen);
    var fsBtn = viewer.querySelector("[data-doc-fullscreen]");
    if (fsBtn) {
      fsBtn.setAttribute("aria-pressed", state.fullscreen ? "true" : "false");
      fsBtn.textContent = state.fullscreen ? "Exit" : "Full";
    }
    syncZoomSelect(viewer);
  }

  function openForImage(img) {
    collectImages();
    var src = img.currentSrc || img.src || img.getAttribute("src");
    var found = state.images.findIndex(function (item) { return item.src === src; });
    state.index = found >= 0 ? found : 0;
    state.zoom = 1;
    state.fullscreen = false;
    state.lastFocus = (typeof document !== "undefined") ? document.activeElement : null;
    var viewer = ensureViewer();
    renderViewer();
    viewer.hidden = false;
    document.body.classList.add("mm-doc-viewer-open");
    var closeBtn = viewer.querySelector("[data-doc-close]");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeViewer() {
    var viewer = ensureViewer();
    viewer.hidden = true;
    document.body.classList.remove("mm-doc-viewer-open");
    state.fullscreen = false;
    viewer.classList.remove("mm-doc-fullscreen");
    // restore focus to the trigger image / button
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      try { state.lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    state.lastFocus = null;
  }

  function setZoom(value) {
    state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(value) || 1));
    renderViewer();
  }

  function setZoomPreset(percent) {
    var fraction = Number(percent) / 100;
    if (!Number.isFinite(fraction)) return;
    setZoom(fraction);
  }

  function toggleFullscreen() {
    state.fullscreen = !state.fullscreen;
    renderViewer();
  }

  function step(delta) {
    if (!state.images.length) return;
    state.index = (state.index + delta + state.images.length) % state.images.length;
    state.zoom = 1;
    renderViewer();
  }

  document.addEventListener("keydown", function (event) {
    var viewer = document.getElementById("mmDocViewer");
    if (!viewer || viewer.hidden) return;
    if (event.key === "Escape") {
      if (state.fullscreen) {
        toggleFullscreen();
      } else {
        closeViewer();
      }
      return;
    }
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
    if (event.key === "+" || event.key === "=") setZoom(state.zoom + 0.15);
    if (event.key === "-" || event.key === "_") setZoom(state.zoom - 0.15);
    if (event.key === "0") setZoom(1);
    if (event.key === "f" || event.key === "F") {
      // ignore inside form fields
      var tag = (event.target && event.target.tagName) || "";
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        toggleFullscreen();
      }
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceAll);
  else enhanceAll();
  document.addEventListener("load", function (event) {
    if (event.target instanceof HTMLImageElement) enhanceImage(event.target);
  }, true);
  new MutationObserver(function () { enhanceAll(); }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "data-source-img", "data-source-page-img"] });
  window.MrMacsDocumentViewer = {
    enhance: enhanceAll,
    openForImage: openForImage,
    close: closeViewer,
    setZoom: setZoom,
    setZoomPreset: setZoomPreset,
    toggleFullscreen: toggleFullscreen,
    next: function () { step(1); },
    prev: function () { step(-1); },
    state: function () {
      return {
        open: !document.getElementById("mmDocViewer") || !document.getElementById("mmDocViewer").hidden,
        index: state.index,
        zoom: state.zoom,
        fullscreen: state.fullscreen,
        total: state.images.length
      };
    },
    zoomPresets: ZOOM_PRESETS.slice()
  };
})();
