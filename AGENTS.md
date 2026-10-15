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

After the user approves a new release, create NEW short links, for example
`/oferta-150-v2` and `/offer-en-150-v2`, for all three tiers in both languages.
Keep V1 URLs, their prices, content and dependencies unchanged and accessible.
Never repoint an already-shared version URL to newer content.

Include the version, snapshot ID, archived URL and both displayed package prices
in availability-enquiry notifications. Do not send test emails; intercept the
request locally when checking forms.

See `docs/offer-versioning.md` for the archive and verification workflow.
The personalized Warszawianka corporate offer is separate from this six-link
wedding release and keeps its existing expiry rules.

The current one-time establishment of V1 and its archive is already authorized.
