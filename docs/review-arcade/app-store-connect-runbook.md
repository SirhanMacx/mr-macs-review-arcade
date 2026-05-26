# Review Arcade App Store Connect Runbook

Generated: 2026-05-26T00:22:44.186Z

This runbook is generated from the current Review Arcade mobile release artifacts. It is meant for App Store Connect entry and pre-submission review. It does not claim the app is production-ready.

## Current Status

- Prototype ready: yes
- Production ready: no
- Monetization ready: no
- Bundle ID: com.reviewarcade.app
- Native gate: passed
- Selected games: Snake, Snake Pit, Tetris, Block Breaker, 2048
- Review Boards: 568

## App Information

- Name: Review Arcade
- Subtitle: Arcade review games for school
- Primary category: Education
- Secondary category: Games
- Privacy Policy URL candidate: https://sirhanmacx.github.io/mr-macs-review-arcade/docs/review-arcade/privacy.html
- Support URL candidate: https://sirhanmacx.github.io/mr-macs-review-arcade/docs/review-arcade/support.html

## Promotional Text

Play classic arcade games and Review Boards tuned to the course, unit, and question mix you want to practice.

## Description

Review Arcade is a mobile-first study arcade built around quick, repeatable review. Choose a course, unit, and question set before each play, then practice through classic games or competitive Review Boards.

The prototype includes Snake, Snake Pit, Tetris, Block Breaker, 2048, all bundled Review Boards, profile switching, earned shards, daily rewards, cosmetic loot, cabinet skins, score-font rewards, local rankings, optional global leaderboards, and friend-code or random-match multiplayer flows.

Cosmetic crates use earned gameplay shards only. Purchases, paid random loot, third-party tracking, and live ad SDKs are disabled in this prototype.

## Keywords

review, arcade, study, school, quiz, flashcards, jeopardy, leaderboard, multiplayer, education

## Review Notes

- Prototype purchases are disabled.
- Prototype rewarded ads are simulated and off by default.
- Cosmetic crates use earned gameplay shards only; no paid random loot is enabled.
- Profiles are local to the device unless a leaderboard endpoint is configured.
- Review Board competitive scoring uses Auto Score only.

## Age Rating Notes

- Recommended: 4+ pending App Store questionnaire
- Rationale: School review content, no realistic violence, no gambling, no paid random loot, no user-generated public chat.

- Confirm child-directed status.
- Confirm leaderboard/public-handle treatment.
- Confirm ad and purchase decisions before enabling revenue.

## Screenshots

| Slot | Path | Caption | Size |
| --- | --- | --- | --- |
| 1 | test-results/review-arcade-app-store-screenshots/01-play.png | Pick a course and launch a late-80s arcade cabinet built for review. | 1290x2796 |
| 2 | test-results/review-arcade-app-store-screenshots/02-play.png | Tune each game by mode, course, unit, and question set before play. | 1290x2796 |
| 3 | test-results/review-arcade-app-store-screenshots/03-boards.png | Play all Review Boards with competitive Auto Score. | 1290x2796 |
| 4 | test-results/review-arcade-app-store-screenshots/04-rooms.png | Host rooms, join friends, or prepare random-match review sessions. | 1290x2796 |
| 5 | test-results/review-arcade-app-store-screenshots/05-locker.png | Earn shards, open school-safe cosmetic crates, and customize avatars, cabinets, items, and score fonts. | 1290x2796 |

## Privacy Nutrition Draft

Legal/privacy review is still required. Revisit this section after any account sync, purchase SDK, ad SDK, analytics SDK, or leaderboard production change.

| Data Type | Collected | Linked | Tracking | Purposes |
| --- | --- | --- | --- | --- |
| Identifiers | yes | no | no | App Functionality, Fraud Prevention |
| User Content | yes | no | no | App Functionality |
| Usage Data | yes | no | no | App Functionality, Analytics |
| Diagnostics | yes | no | no | Analytics, App Functionality |
| Purchases | no | no | no | none |

Not collected: Contact Info, Location, Contacts, Browsing History, Search History, Sensitive Info, Financial Info, Health and Fitness

## Planned Products

StoreKit remains disabled. These products are fixed or subscriptions only; paid random loot remains disabled.

| Product | Product ID | Kind | Status | Random Reward | Restore |
| --- | --- | --- | --- | --- | --- |
| Teacher Pro | com.reviewarcade.teacherpro.monthly | auto-renewable-subscription | planned-not-created | no | yes |
| Founder Cabinet Pack | com.reviewarcade.founder.cabinetpack | non-consumable | planned-not-created | no | yes |
| Study Boost Pass | com.reviewarcade.studyboost.pass | non-consumable-or-season-pass | planned-not-created | no | yes |

## Revenue Path

- Target ARR: $2500
- Launch principle: Launch free first so product quality and classroom/student privacy can be validated.
- Conservative path: Combines a modest teacher subscription base with optional non-random cosmetics.

## Required Before Submission

- hosted privacy URL: Publish docs/review-arcade to GitHub Pages or another stable HTTPS URL, verify the live privacy page over HTTPS, and enter the privacy URL in App Store Connect.
- hosted support URL: Publish docs/review-arcade to GitHub Pages or another stable HTTPS URL, verify the live support page over HTTPS, and enter the support URL in App Store Connect.
- StoreKit product setup: Create real products in App Store Connect and update statuses from planned-not-created.
- server receipt validation: Configure the real App Store receipt/API validator URL, token, and Apple credentials before enabling purchases.
- server-owned entitlements: Enable entitlement sync only after real App Store receipt/API validation is live.
- purchase-linked inventory ownership: Enable server-owned purchase inventory only after real StoreKit receipt validation and entitlement sync are live.
- legal/privacy review: Complete COPPA/FERPA-adjacent, ads, purchases, and leaderboard privacy review.

## Verification Commands

- npm run mobile:release-check:native
- npm run mobile:production-readiness
- npm run mobile:submission-package

