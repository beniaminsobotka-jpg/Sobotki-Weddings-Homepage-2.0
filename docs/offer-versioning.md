# Frozen wedding offers

## V1 — 15 October 2026

| Polish URL | English URL | Essential | Exclusive |
| --- | --- | --- | --- |
| `/oferta-150` | `/offer-en-150` | PLN 3,200 | PLN 4,200 |
| `/oferta-250` | `/offer-en-250` | PLN 3,500 | PLN 4,500 |
| `/oferta-350` | `/offer-en-350` | PLN 3,800 | PLN 4,800 |

These URLs stay V1 permanently. They can be bookmarked and shared with planners.
Receiving the offer does not reserve a date; the existing enquiry form sends the
selected packages, contact details and a versioned offer reference to the owner.

## Archive

`public/offers/v1/manifest.json` records all six snapshots and SHA-256 hashes of
their HTML and local dependencies. Complete page copies live in
`public/offers/v1/pages/`; their images, videos, CSS and scripts also use V1 paths.
Adobe and Google fonts remain loaded from their licensed external providers.

Availability enquiries contain V1, a snapshot ID such as `v1-pl-150`, the archive
URL, the originally opened URL and both displayed package prices. An anonymous
visit cannot identify a person; the version is associated with their email when
they submit an enquiry.

## Future changes require an explicit user choice

For ANY future edit, first ask whether to make V2 for ALL six variants, in Polish
and English. The user explicitly requested this question, including for small
copy or design changes. Future versions use their own new short URLs and their
own dependency directories. Do not overwrite or redirect existing V1 URLs.

### Opaque links and discreet version labels

Starting with the next approved release, use independent random four-character
lowercase alphanumeric suffixes for all six new short links. For example,
`/oferta-k7m4` is an illustrative format, not an existing published link. Never
put `v2`, `v3` or a sequential release identifier in a client-facing URL. Check
all historical routes for collisions and never reuse an existing link.

Put the actual version (for example "Wersja oferty: V2" / "Offer version: V2")
in small, subtle but readable type at the end of each new offer. This is visible
to clients too, but should not compete with the offer or booking call to action.
Keep the actual version, snapshot reference and displayed prices in enquiries.

New archive page routes must also be opaque: do not make earlier offers
discoverable by changing a version number in the URL. Keep release-to-link
mappings outside public files, and do not publish a client-readable manifest or
index listing historical offer links. Short random identifiers discourage simple
guessing; they are not authentication or a confidentiality guarantee.

This policy does not create V2 now or change any frozen V1 page, URL or archive.

The existing generation scripts now refuse to overwrite marked, frozen pages.
To prepare V2 after approval, use new release records/slugs and a new archive
directory, rather than bypassing this protection. Draft generation must finish
before freezing the new release. Never run the V1 initialization script to alter
an existing archive.

## Verification

Run `node --test tests/offer-versioning.test.mjs` to verify the six snapshots,
dependency hashes, version-aware notifications and overwrite protection.
Production verification must inspect metadata and links without sending emails.
