# Event offer V1 — 17 October 2026

Client URL: `/event-21aa/`. The random suffix does not disclose the version.
This is a separate event offer, not a revision of the six frozen wedding offers.
Keep this published V1 URL, HTML, pricing module, scripts and styles unchanged
when making a later release; ask the owner before creating another version.

Explicit exception approved by the owner on 17 October 2026: keep V1 and its
existing URL for the cosmetic calculator revision (rounded green-glow numeric
fields, hidden spinner buttons, and collapsed minimalist pricing tiers).
This exception changes no prices and does not authorize editing wedding V1.

The page uses the frozen wedding V1 design and media, without modifying them.
The generic gallery/hero/video behaviour is copied into `visuals.js` to avoid
running wedding forms or enrolling event enquiries in wedding automations.

## Pricing

Boundary ranges were clarified to avoid overlapping endpoints:

| Participants | Base price | Photographers |
| --- | --- | --- |
| 20–60 | PLN 3,200 | 2 |
| 61–150 | PLN 3,500 | 2 |
| 151–250 | PLN 3,800 | 2 |
| 251–400 | PLN 4,100 | 2 |
| 401+ | PLN 5,000 | 3 |

All base prices include 3 hours, setup outside the working time, studio,
200 prints (10×15 cm) and unlimited digital photos with QR gallery access.
Extras: cinematic circle PLN 300; guestbook PLN 600; fourth hour PLN 500.
Above 250 participants the fourth hour is recommended, never selected or charged
automatically. Extra prints cost PLN 1.75 each. The calculator estimates these,
but final settlement uses actual additional prints. Transport is separate at
PLN 1/km from Gliwice, confirmed once the location is known.

Enquiries use `event_offer_portraits`, include the exact selected quote, participant
count, extras, version and URL, and notify the owner via the existing email
endpoint. They do not sync Brevo contacts or emit wedding automation events.
No PDF is sent. Existing wedding API behaviour remains unchanged.

## Verification

`node --test tests/event-offer.test.mjs tests/offer-versioning.test.mjs`
checks every pricing boundary, extras, validation, unchanged wedding snapshots,
and owner-only event notifications with mocked network calls (no real emails).
Browser QA also checks 320, 390, 900 and 1440px layouts and intercepts submissions.
