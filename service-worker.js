const CACHE_NAME = "v126-practice-exam-style-tag-fix";
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
  "./games/schoolcraft/",
  "./games/schoolcraft/index.html",
  "./games/schoolcraft/game.js",
  "./games/schoolcraft/styles.css",
  "./games/claim-evidence/",
  "./games/claim-evidence/index.html",
  "./games/claim-evidence/game.js",
  "./games/claim-evidence/styles.css",
  "./games/source-sorter/",
  "./games/source-sorter/index.html",
  "./games/source-sorter/game.js",
  "./games/source-sorter/styles.css",
  "./games/concept-combo/",
  "./games/concept-combo/index.html",
  "./games/concept-combo/game.js",
  "./games/concept-combo/styles.css",
  "./games/timeline-stack/",
  "./games/timeline-stack/index.html",
  "./games/timeline-stack/game.js",
  "./games/timeline-stack/styles.css",
  "./games/regents-global-2/",
  "./games/regents-global-2/practice-exam.html",
  "./data/all-subject-course-taxonomy.json",
  "./data/released-assessment-source-catalog.json",
  "./data/generated-jeopardy-index.json",
  "./data/generated-practice-exam-blueprints.json",
  "./data/public-exam-library.json",
  // PERF 2026-05-22: `data/regents-gauntlet-bank.json` (~930 kB) was
  // precached eagerly but only one game (regents-gauntlet) ever loads
  // it. Runtime cache-first picks it up on demand instead. Saves ~12 %
  // off the install footprint without breaking offline play for that
  // game (first launch reaches network, subsequent launches hit cache).
  // ALL 55 asset modules (auto-generated from assets/*.js + assets/*.css).
  // True offline-PWA: every feature works without network after first load.
  "./assets/arcade-a11y-quicktoggle.js",
  "./assets/arcade-a11y.css",
  "./assets/arcade-card-blue.webp",
  "./assets/arcade-analytics.js",
  "./assets/arcade-practice-exam-analytics.js",
  "./analytics/",
  "./analytics/index.html",
  "./assets/arcade-lobby-v3.webp",
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
  "./assets/arcade-bank-loader.js",
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
  "./assets/arcade-past-exam-library.js",
  "./assets/arcade-pedagogy-callout.js",
  "./assets/arcade-perf.js",
  "./assets/arcade-practice-fallback.js",
  "./assets/arcade-print-mode.js",
  "./assets/arcade-profile.js",
  "./assets/arcade-progress-extras.js",
  "./assets/arcade-quick-launcher.js",
  "./assets/arcade-quick-stats-panel.js",
  "./assets/arcade-recommender.js",
  "./assets/arcade-question-validator.js",
  "./assets/arcade-quiz-gauntlet.js",
  "./assets/arcade-review-mix.js",
  "./assets/arcade-replay.js",
  "./assets/arcade-resume-chip.js",
  "./assets/arcade-retro-theme.css",
  "./assets/arcade-screenshot.js",
  "./assets/arcade-scanline-tile.webp",
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
  "./assets/portal-card.webp",
  "./assets/source-bank.js",
  // Extracted-from-index hub assets (perf split, May 22 2026). These must
  // precache so the hub renders correctly offline — they carry every CSS
  // rule and every JS routine that used to be inline in index.html.
  "./assets/arcade-hub-styles.css",
  "./assets/arcade-hub-bootstrap.js",
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
  "./assets/game-thumbnails/schoolcraft.webp",
  "./assets/game-card-art/schoolcraft.webp",
  "./assets/game-marquees/schoolcraft.webp",
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
  // PERF 2026-05-22: stale-while-revalidate for HTML/JSON instead of
  // network-first. The previous strategy made every hub/page load
  // round-trip to the network even when a fresh-enough copy was already
  // cached, which on 3G added ~400-800 ms to perceived navigation. Now
  // we return the cached copy immediately (zero RTT) and refresh in the
  // background, so the next navigation always picks up the latest copy.
  // Only navigations to fresh (un-cached) URLs still hit the network.
  // Cache-first behavior for everything else (JS, CSS, images, fonts)
  // is unchanged — those resources are content-hashed via ?v= query
  // strings so changing them naturally invalidates the cache entry.
  var url = new URL(e.request.url);
  var isHtml = e.request.headers.get("accept") && e.request.headers.get("accept").includes("text/html");
  var isJson = url.pathname.endsWith(".json");

  if (isHtml || isJson) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          var network = fetch(e.request).then(function (resp) {
            // Only cache 200 OK; skip 4xx/5xx so a transient outage
            // doesn't poison the cache with an error page.
            if (resp && resp.status === 200) {
              try { cache.put(e.request, resp.clone()); } catch (_) {}
            }
            return resp;
          }).catch(function () {
            // Network failed; if we have a cached copy already returned
            // below, that's the user's response. Otherwise propagate.
            return cached || Response.error();
          });
          // Return cached immediately if present; otherwise wait for network.
          return cached || network;
        });
      })
    );
  } else {
    // Cache-first for static assets.
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(resp) {
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
