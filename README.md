# Bee Post

A bee from Manchester, back from a fortnight in France, sends postcards to
somebody in Amsterdam for three days in September. A static PWA on GitHub
Pages; the buzz is a scheduled Action.

- `site/` — the app. `trip.js` is the itinerary (every leg a real timetable,
  end to end, checked so the bee is never in two places), `voice.js` is
  everything it says, `bee.js` draws it exactly as Carnet does, `postcard.js`
  draws the cards, `icon.js` the icon.
- `scripts/buzz.mjs` — sends the push for whatever card is due.
- `.github/workflows/` — Pages deploy (with the schedule check), and the
  quarter-hourly buzz.

Secrets: `VAPID_PRIVATE_KEY` (pair with `site/push.json`) and `PUSH_SUBS`, a
JSON array of push subscriptions straight from the phone, each with a `label`.

`?at=2026-09-18T15:00:00Z` moves the app's clock; `#04` opens a card;
`&turned=1` opens it on its back.
