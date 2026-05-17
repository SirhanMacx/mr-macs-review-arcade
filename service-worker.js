const CACHE_NAME = "v69-43-practice-exams-french-italian-complete-world-lang";
// Use relative paths so the SW works on GitHub Pages subpath
// (https://sirhanmacx.github.io/mr-macs-review-arcade/) AND local dev AND
// any future custom domain. The SW's scope is set at register-time to
// `./` so these resolve relative to the registration root.
const CACHE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./games.json",
  "./games/generated-jeopardy/",
  "./games/generated-jeopardy/index.html",
  "./games/generated-practice-exam/",
  "./games/generated-practice-exam/index.html",
  "./games/regents-global-2/",
  "./games/regents-global-2/practice-exam.html",
  "./data/all-subject-course-taxonomy.json",
  "./data/released-assessment-source-catalog.json",
  "./data/generated-jeopardy-index.json",
  "./data/generated-practice-exam-blueprints.json",
  // ALL 55 asset modules (auto-generated from assets/*.js + assets/*.css).
  // True offline-PWA: every feature works without network after first load.
  "./assets/arcade-a11y-quicktoggle.js",
  "./assets/arcade-a11y.css",
  "./assets/arcade-analytics.js",
  "./assets/arcade-cabinet-fx.js",
  "./assets/arcade-celebration.js",
  "./assets/arcade-changelog-entries.js",
  "./assets/arcade-changelog.js",
  "./assets/arcade-classroom.js",
  "./assets/arcade-cram-mode.js",
  "./assets/arcade-cross-device.css",
  "./assets/arcade-deeplinks.js",
  "./assets/arcade-dev-tools.js",
  "./assets/arcade-difficulty.js",
  "./assets/arcade-end-recap.js",
  "./assets/arcade-friday-practice.js",
  "./assets/arcade-heatmap.js",
  "./assets/arcade-help-overlay.js",
  "./assets/arcade-icons.js",
  "./assets/arcade-import-export.js",
  "./assets/arcade-keyboard-remap.js",
  "./assets/arcade-leaderboard-globe.js",
  "./assets/arcade-leaderboards.js",
  "./assets/arcade-mascot-dialog.js",
  "./assets/arcade-mascot.js",
  "./assets/arcade-multiplayer.js",
  "./assets/arcade-name-safety.js",
  "./assets/arcade-music.js",
  "./assets/arcade-news-ticker.js",
  "./assets/arcade-notification-center.js",
  "./assets/arcade-onboarding-flow.js",
  "./assets/arcade-pedagogy-callout.js",
  "./assets/arcade-perf.js",
  "./assets/arcade-print-mode.js",
  "./assets/arcade-profile.js",
  "./assets/arcade-progress-extras.js",
  "./assets/arcade-quick-launcher.js",
  "./assets/arcade-quick-stats-panel.js",
  "./assets/arcade-recommender.js",
  "./assets/arcade-quiz-gauntlet.js",
  "./assets/arcade-review-mix.js",
  "./assets/arcade-replay.js",
  "./assets/arcade-resume-chip.js",
  "./assets/arcade-retro-theme.css",
  "./assets/arcade-screenshot.js",
  "./assets/arcade-search-helpers.js",
  "./assets/arcade-session-timer.js",
  "./assets/arcade-sessions.js",
  "./assets/arcade-sfx.js",
  "./assets/arcade-skeleton-loader.js",
  "./assets/arcade-streak-indicator.js",
  "./assets/arcade-toast.js",
  "./assets/arcade-tour.js",
  "./assets/arcade-tutorial.js",
  "./assets/arcade-week-summary.js",
  "./assets/document-viewer.js",
  "./assets/mastery-engine.js",
  "./assets/shared-question-bank.js",
  "./assets/source-bank.js",
  "./assets/cabinet/arcade-marquee.webp",
  "./assets/cabinet/attract-mode-board.webp",
  "./assets/cabinet/card-frame.webp",
  "./assets/cabinet/category-tile-arcade.webp",
  "./assets/cabinet/category-tile-daily.webp",
  "./assets/cabinet/category-tile-jeopardy.webp",
  "./assets/cabinet/category-tile-practice.webp",
  "./assets/cabinet/coin-slot.webp",
  "./assets/cabinet/control-panel.webp",
  "./assets/cabinet/crt-bezel.webp",
  "./assets/cabinet/featured-key-art-strip.webp",
  "./assets/cabinet/game-backdrop-archive.webp",
  "./assets/cabinet/game-backdrop-battlefield.webp",
  "./assets/cabinet/game-backdrop-ruins.webp",
  "./assets/cabinet/game-backdrop-source-desk.webp",
  "./assets/cabinet/game-launch-console.webp",
  "./assets/cabinet/hud-frame.webp",
  "./assets/cabinet/in-game-panel.webp",
  "./assets/cabinet/joystick-panel.webp",
  "./assets/cabinet/main-menu-cabinet.webp",
  "./assets/cabinet/main-menu-screen.webp",
  "./assets/cabinet/modal-frame.webp",
  "./assets/cabinet/question-panel.webp",
  "./assets/cabinet/answer-panel.webp",
  "./assets/cabinet/scanline-overlay.svg",
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
