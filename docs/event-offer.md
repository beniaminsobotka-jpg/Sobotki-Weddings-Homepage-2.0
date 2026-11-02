# Event offer V1 — 17 October 2026

Client URL: `/event-21aa/`. The random suffix does not disclose the version.
This is a separate event offer, not a revision of the six frozen wedding offers.
Keep this published V1 URL, HTML, pricing module, scripts and styles unchanged
when making a later release; ask the owner before creating another version.

Explicit exception approved by the owner on 17 October 2026: keep V1 and its
existing URL for the cosmetic calculator revision (rounded green-glow numeric
fields, hidden spinner buttons, and collapsed minimalist pricing tiers).
This exception changes no prices and does not authorize editing wedding V1.
The owner also requested hiding the version/ID line in the enquiry form's visible
quote summary. Keep both in the email payload; this is another cosmetic V1 edit.

The page uses the frozen wedding V1 design and media, without modifying them.
The generic gallery/hero/video behaviour is copied into `visuals.js` to avoid
running wedding forms or enrolling event enquiries in wedding automations.

## Pricing

Boundary ranges were clarified to avoid overlapping endpoints:

| Participants | Base price | Photographers |
| --- | --- | --- |
| 20–45 (2h) | PLN 2,800 | 2 |
| 46–60 (3h) | PLN 3,200 | 2 |
| 61–150 | PLN 3,500 | 2 |
| 151–250 | PLN 3,800 | 2 |
| 251–400 | PLN 4,100 | 2 |
| 401+ | PLN 5,000 | 3 |

Owner explicitly approved updating existing V1 on 2 November 2026: the 20–45
participant tier now includes 2 hours for PLN 2,800. All other tiers stay unchanged.
An optional additional hour still costs PLN 500: 3h total for the smallest tier,
4h total for the other tiers. The public URL and V1 designation are unchanged.

Base prices include 2 hours for 20–45 participants or 3 hours from 46, setup outside the working time, studio,
200 prints (10×15 cm) and unlimited digital photos with QR gallery access.
Extras: cinematic circle PLN 300; guestbook PLN 600; additional hour PLN 500.
Above 250 participants the fourth hour is recommended, never selected or charged
automatically. Extra prints cost PLN 1.75 each. The calculator estimates these,
but final settlement uses actual additional prints. Transport is separate at
PLN 1/km from Gliwice, confirmed once the location is known.

Enquiries use `event_offer_portraits`, include the exact selected quote, participant
count, extras, version and URL, and notify the owner via the existing email
endpoint. They do not sync Brevo contacts or emit wedding automation events.
No PDF is sent. Existing wedding API behaviour remains unchanged.

## Three location variants — approved 2 November 2026

All three are V1 offers, not changes to the six wedding offers. Existing base URL
and its prices remain untouched. Only base package prices increase; transport
is still additional at PLN 1/km from Gliwice, and extras keep the same prices.
The variants do not add client-facing distance labels or automatically select a
location band. The owner chooses which link to share, as with the wedding offers.

| Variant | URL | Base price uplift | 20–45 participants / 2h |
| --- | --- | --- | --- |
| Base | `/event-21aa/` | PLN 0 | PLN 2,800 |
| II | `/event-6f82/` | PLN 300 | PLN 3,100 |
| III | `/event-5990/` | PLN 600 | PLN 3,400 |

Each variant has independent HTML, calculator, form script and CSS copies, and
its own snapshot ID/link in the owner's notification. The same frozen wedding
media are reused. The public enquiry summary still hides version and snapshot ID.
The one-time generator `scripts/generate-event-location-offers.mjs` refuses to
overwrite any existing variant directory. Keep this URL mapping private.

### Verification

`node --test tests/event-offer.test.mjs tests/offer-versioning.test.mjs`
checks every pricing boundary, extras, validation, unchanged wedding snapshots,
and owner-only event notifications with mocked network calls (no real emails).
Browser QA also checks 320, 390, 900 and 1440px layouts and intercepts submissions.
