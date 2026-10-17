# Wedding offer versioning — user-approved rule

The six direct wedding offers are one versioned release, in Polish and English:

- `/oferta-150`, `/oferta-250`, `/oferta-350`
- `/offer-en-150`, `/offer-en-250`, `/offer-en-350`

They are version **V1**, established on 2026-10-15. Their published HTML, styles,
scripts, images and videos are frozen under `public/offers/v1/`.

Before making ANY later change to these offers (including copy, prices, scope,
layout, styles, media or forms), ask the user whether to create **V2 for all six
links**, in both languages. After V2 exists, ask about the next version number.
Do not infer approval to change a frozen version from an ordinary edit request.

After the user approves a new release, create NEW short links for all three tiers
in both languages. Use an independently random four-character lowercase
alphanumeric suffix for each link (for example `/oferta-k7m4`; example only),
never a version number such as `v2` or an incrementing identifier. Check for
collisions against all existing links and never reuse a suffix.
Keep V1 URLs, their prices, content and dependencies unchanged and accessible.
Never repoint an already-shared version URL to newer content.

For new releases, show the actual version number in a small, subtle but readable
footer at the end of the offer. Keep version metadata and enquiry notifications
explicit. Do not expose a client-readable index of previous offer URLs or use
predictable version-number archive page routes for new releases. Keep the
release-to-link mapping private. Random short links are not access control.

Include the version, snapshot ID, archived URL and both displayed package prices
in availability-enquiry notifications. Do not send test emails; intercept the
request locally when checking forms.

See `docs/offer-versioning.md` for the archive and verification workflow.
The personalized Warszawianka corporate offer is separate from this six-link
wedding release and keeps its existing expiry rules.

V1 is already established. Recording future policy does not authorize creating
V2 or modifying V1; ask before the next actual offer change.
