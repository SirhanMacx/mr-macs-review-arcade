# Google Classroom Integration — Teacher Setup

Mr. Mac's Review Arcade is **client-side only** — it has no servers, no
backend database, no analytics pipeline. That privacy posture protects
students but means features that need cross-device or cross-class data
(per-student dashboards, real-time roster sync across browsers, etc.)
can't ship out of the box.

The platform has a **planned integration with Google Classroom** that
lets a teacher import their class roster and post assignments. **This
integration requires the teacher to perform a one-time Google Cloud
setup** because Google requires per-app credentials.

---

## Why teacher-side setup?

Google's API terms require that each app using Google Classroom obtain
its own OAuth client credentials. Anthropic / Mr. Mac's Arcade can't
distribute a single shared credential to all teachers (it would
violate Google's TOS, and a leak would compromise every user). The
result: each teacher (or school) provisions their own credentials.

The good news: once set up, it works for unlimited classes and
unlimited students at zero cost. Google's API is free for non-profit
educational use.

---

## Step-by-step Google Cloud setup

### 1. Create a Google Cloud project (5 min, free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/).
2. Sign in with your school Google account (or personal Google).
3. Click the project dropdown at the top → **New Project**.
4. Name it `Mr Mac Arcade Classroom` (anything works).
5. Click **Create** and wait ~30 seconds for the project to provision.

### 2. Enable the Classroom API

1. In the left sidebar: **APIs & Services** → **Library**.
2. Search for "Google Classroom API". Click it.
3. Click **Enable**.

### 3. Configure the OAuth consent screen

1. Left sidebar: **APIs & Services** → **OAuth consent screen**.
2. Choose **External** (unless your school has a Workspace plan with
   Internal). Click **Create**.
3. Fill in:
   - **App name**: `Mr. Mac's Review Arcade`
   - **User support email**: your school email
   - **Developer contact information**: your school email
4. Click **Save and Continue**.
5. On the **Scopes** step, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.me`
6. Click **Save and Continue**.
7. On the **Test users** step, add yourself + any other teacher who
   should test the integration. **You don't need to publish the app**
   — running in "Testing" mode is fine for up to 100 test users.

### 4. Create the OAuth Client ID

1. Left sidebar: **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Mr Mac Arcade Web Client`.
5. **Authorized JavaScript origins**: add
   `https://sirhanmacx.github.io` (the GitHub Pages host).
6. **Authorized redirect URIs**: add
   `https://sirhanmacx.github.io/mr-macs-review-arcade/teacher/google-callback`.
7. Click **Create**.
8. Google shows you a **Client ID** (long string ending in
   `.apps.googleusercontent.com`) and a **Client Secret**. **Copy the
   Client ID. Ignore the Client Secret** — the arcade uses a
   public-client OAuth flow that doesn't need it.

### 5. Wire your Client ID into the arcade

1. Open `teacher/index.html` in this repo.
2. Find the line:
   ```js
   var GOOGLE_CLIENT_ID = "REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com";
   ```
3. Replace with your actual Client ID.
4. Commit + push. GitHub Pages will redeploy in ~1 minute.

### 6. Use the integration

1. Visit `/teacher/` on your published site.
2. Click **"Connect Google Classroom"** (button appears when the
   Client ID is configured).
3. Approve the OAuth consent screen the first time.
4. The dashboard now shows your courses, rosters, and lets you post
   the arcade as an assignment.

---

## Privacy notes (read before going live)

- **No student data leaves their browser** unless they themselves
  authenticate to Classroom from their device. Even then, only
  Google's API talks to Google's servers.
- **The Client ID is public-by-design.** It's safe to commit to the
  repository — it identifies the *app*, not the *user*. The user's
  actual access tokens are scoped to their browser session.
- **Tokens expire.** Google OAuth tokens auto-expire after ~1 hour.
  No long-term credentials are stored.
- **You can revoke at any time.** A teacher revoking access in their
  Google Account settings instantly de-authorizes the arcade.

---

## Cost

**$0.** The Google Classroom API is free for all educational use,
classroom-bound or not. The Google Cloud project itself is free up to
the limits the API enforces (Classroom doesn't have a paid tier).

---

## What if I don't want to do this?

You don't have to. **All teacher tools work without Google Classroom**
on a single shared device:

- The **Teacher Dashboard** (`/teacher/`) shows local progress for any
  browser the teacher uses to demo.
- **Multiplayer rooms** let a teacher host a live class session — students
  join with a 6-letter code from any device, no logins needed.
- **"Save as Class"** in the multiplayer lobby persists a roster
  snapshot to the teacher's device.
- **Friday Practice PDF export** generates printable worksheets from
  the local wrong-answer queue.

The Classroom integration is an *enhancement* for teachers who want
cross-device sync — not a requirement.

---

## Troubleshooting

**"This app isn't verified" warning at OAuth approval**

This is expected while your app is in Google's "Testing" mode. Click
**Advanced** → **Go to Mr. Mac's Review Arcade (unsafe)**. You can
publish for verification later if you want to remove the warning, but
it's optional for personal use.

**"redirect_uri_mismatch"**

The redirect URI in your OAuth Client ID must exactly match the URL
the arcade redirects to. Double-check trailing slashes and the path
`/mr-macs-review-arcade/teacher/google-callback`.

**Rate limit errors**

The Classroom API allows ~600 reads per minute per user. If you hit
this, wait 60 seconds. Real classroom use never approaches this limit.

---

## Status

🚧 **The arcade UI for this integration ships in `v6.13`+.** Until
then, the Teacher Dashboard works with local data and the multiplayer
"Save as Class" feature for roster persistence.

The full Google Classroom UI is the natural next milestone once the
client-side foundations (which shipped in `v6.11` and `v6.12`) have
been used in real classrooms long enough to validate the design.
