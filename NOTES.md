# Bee Post — build notes

The bee from Carnet, three weeks after France, sending post to Amsterdam for
three days. One traveller this time, and the bee stays home — which is the
better joke: it has been exactly two places in its life and now somebody is
going somewhere without it.

## Layout

| Path | What |
|---|---|
| `site/bee.js` | The bee, drawn. A unit-for-unit port of Carnet's `BeeDrawing`, `BeeSouvenirs` and `BeeGlyph`, plus two Dutch souvenirs |
| `site/trip.js` | The itinerary: every leg a real timetable, end to end, and `check()` |
| `site/voice.js` | Everything it says, in the Carnet voice |
| `site/postcard.js` | Card fronts and backs, stamps and postmarks, the keepsake sheet |
| `site/icon.js` | The app icon, the way Carnet's script draws its stamp |
| `site/app.js` | The page: bee, tracker, shelf, a card opened, the door |
| `site/sw.js` | Offline shell, the buzz, the icon badge |
| `scripts/buzz.mjs` | Sends the push for whatever card is due |
| `.github/workflows/` | Pages deploy (refuses a broken schedule), quarter-hourly buzz |

## The schedule is real, and the bee is one bee

Every departure in `trip.js` is a timetable that exists — KL1036 leaves
Terminal 2 at 17:25, the 11:04 from St Pancras is under the sea twenty minutes
before noon — and the legs run end to end so the bee is never in two places.
The first idea was a flat "post at 08:00 every morning" with the transport
worked backwards as flavour; it was thrown out, rightly, because a card that
came by Eurostar should land when the Eurostar lands. The cost is that the
cron has to know the schedule, which is twenty lines, and that the return
legs constrain the outbound ones: the bee cannot leave Manchester until it is
back, which is why Thursday night is spent in a bee hotel rather than on a
plane home, and why the Hull ferry never fitted.

`check()` is the same idea as Carnet's `ContentTests`: a leg that starts
somewhere the last one did not end, or a card delivered where the bee is not,
fails the deploy rather than being found by somebody watching the map.

## Souvenirs, continued

Carnet dressed the bee once per base leg. Here there is one base and four
visits, so a souvenir marks a visit instead: it arrives still in the Nice
sunglasses, picks up a stroopwafel at Schiphol on Thursday evening (worn
where the beret went, because it is the same shape and the bee noticed), and
a wooden tulip at the Bloemenmarkt on Friday (behind the head, where the
lavender was — in September the real ones are bulbs in paper bags).

The other dials carry on too. Plumpness starts at 0.8, a fortnight of pastry
minus three weeks of hedge, and the 490 km flight takes it to 0.16 by
Centraal — "lean as a wasp" — before stroopwafels put some back. Weariness
climbs to 1 over the sea and resets at the bee hotel; on easy legs it is kept
under 0.2, because at 0.2 the half-mast lids come in and the bee looks cross
for a whole train ride. Tan fades slowly. Asleep, the eyes are shut outright,
which `BeeDrawing` never needed because Carnet's bee was never asleep on
screen.

## The buzz

A static site cannot send a push. The workflow runs every fifteen minutes and
sends anything delivered in the last half hour, with the notification tag set
to the card, so a late cron and an on-time one cannot double up — the same
trick as Carnet's single notification identifier. GitHub's cron for a new
workflow can take a long time to start; the first night it had not fired an
hour in, so the buzz was also fired by hand from a laptop kept awake with
`caffeinate`, on the same tags. One card (Friday's) is delivered at 06:00 and
buzzed at 07:30, so `buzzAt` is separate from `deliveredAt`.

iOS only delivers web push to a home-screen app, and the subscription has to
reach the sender somehow: the page produces it and hands it to the share sheet,
and it is pasted into a secret. Each carries a label, so one phone can be
buzzed for testing without bothering the other.

## Things learned the hard way

- **`classList.toggle('hidden', undefined)` toggles.** `a || b` where `b` is
  an undefined property is undefined, not false, and the bee flickered in and
  out of existence once a second. Coerce the force argument.
- **A canvas `filter` blur is in device pixels**, so the radius has to be
  multiplied by the unit scale or the bee's cheeks are crisp at one size and a
  smear at another. Engines without `filter` get a crisp bee, not no bee.
- **Home-screen apps on iOS have their own storage.** A label put in
  `localStorage` from Safari did not follow the app to the home screen. The
  label is set by hand on the sender's side instead.
- **zsh does not word-split `$var`.** A loop that passed `"02 2026-…"` as one
  argument fired five safety nets at once, at the wrong card, and they all
  failed harmlessly because the card id did not exist. The tag would have
  saved the phone even if it had not.
- **Headless Chrome will not go narrower than about 500 px** on a Mac, so a
  phone-width screenshot is an iframe inside a wider page.
- **A service worker's cache name has to change per deploy** or every phone
  keeps the shell it first saw. The deploy rewrites it to the commit, and the
  new worker reloads any open page so the placeholder becomes the post on the
  first open rather than the second.
