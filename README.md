<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/33e815fe-e079-4945-9e1c-9c95151d3098

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Brevo lead sync

Form submissions are synced to Brevo through the Vercel endpoint at `/api/lead`.

Required environment variables:

- `BREVO_API_KEY`
- `BREVO_LIST_ID_WEDDINGS`
- `BREVO_LIST_ID_PORTRAITS_WEDDING`
- `BREVO_LIST_ID_PORTRAITS_BOOTH`

Supported `formType` values:

- `weddings`
- `portraits_wedding`
- `portraits_booth`

Brevo template personalization:

- `{{ contact.FULLNAME }}`
- `{{ contact.FIRSTNAME }}`
- `{{ contact.LASTNAME }}`

Mapped Brevo attributes:

- `FULLNAME`
- `FIRSTNAME`
- `LASTNAME`
- `PHONE`
- `WEDDING_DATE`
- `VENUE`
- `SERVICE_TYPE`
- `MESSAGE`

Additional optional attributes:

- `COMPANY`
- `GUEST_COUNT`
