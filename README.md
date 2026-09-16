# Bee Post

Postcards from a bee in Manchester to someone in Amsterdam, for a few days in
September. A static site on GitHub Pages; the buzz is a scheduled Action.

- `site/` — the app. `schedule.json` is when each card arrives and how it travelled.
- `scripts/buzz.mjs` — sends the push for whatever is due.
- `.github/workflows/` — Pages deploy, and the quarter-hourly buzz.

Secrets: `VAPID_PRIVATE_KEY` (pair with `site/push.json`), `PUSH_SUBS` (a JSON
array of push subscriptions, straight from the phone).
