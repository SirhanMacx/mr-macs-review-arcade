const CACHE_NAME = "mr-macs-arcade-v11-2026-05-11-cabinet-keyboard";
// Use relative paths so the SW works on GitHub Pages subpath
// (https://sirhanmacx.github.io/mr-macs-review-arcade/) AND local dev AND
// any future custom domain. The SW's scope is set at register-time to
// `./` so these resolve relative to the registration root.
const CACHE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./games.json",
  // Core helper modules loaded on every game
  "./assets/arcade-profile.js",
  "./assets/arcade-icons.js",
  "./assets/arcade-toast.js",
  "./assets/arcade-celebration.js",
  "./assets/arcade-progress-extras.js",
  "./assets/arcade-music.js",
  "./assets/arcade-tour.js",
  "./assets/arcade-help-overlay.js",
  "./assets/arcade-a11y-quicktoggle.js",
  "./assets/arcade-difficulty.js",
  "./assets/arcade-end-recap.js",
  "./assets/arcade-leaderboards.js",
  "./assets/arcade-sessions.js",
  "./assets/arcade-changelog.js",
  "./assets/arcade-changelog-entries.js",
  // Cabinet UX layer — 8-bit SFX + flash/score-pulse FX
  "./assets/arcade-sfx.js",
  "./assets/arcade-cabinet-fx.js",
  // Shared question bank — 896KB, ~1937 questions, used by 57 games
  "./assets/shared-question-bank.js",
  // CSS
  "./assets/arcade-a11y.css",
  "./assets/arcade-cross-device.css",
  "./assets/arcade-retro-theme.css",
  // Critical fonts
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,700;1,9..144,900;0,9..144,400&family=JetBrains+Mono:wght@700;800&family=Inter:wght@400;600;700;800;900&display=swap"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Add files but don't fail install if some fail
      return Promise.all(CACHE_FILES.map(function(url) {
        return cache.add(url).catch(function(err) {
          console.warn("[sw] failed to cache:", url, err);
        });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  // Clean old caches
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  // Network-first for HTML/JSON, cache-first for everything else
  var url = new URL(e.request.url);
  var isHtml = e.request.headers.get("accept") && e.request.headers.get("accept").includes("text/html");
  var isJson = url.pathname.endsWith(".json");

  if (isHtml || isJson) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        // Update cache in background
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    // Cache-first
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(resp) {
          // Cache successful responses for future
          if (resp && resp.status === 200 && resp.type === "basic") {
            var clone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          }
          return resp;
        });
      })
    );
  }
});
