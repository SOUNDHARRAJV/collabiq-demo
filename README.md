# COLLABIQ

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9dca97c2-82a7-4d94-822f-870cd1589133

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set these values in [.env.local](.env.local):
   `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
3. Run the app:
   `npm run dev`

## Google Login Notes

- `GOOGLE_CLIENT_ID` is used by the frontend login flow.
- `GOOGLE_CLIENT_SECRET` is server-side only and should never be committed.
- Check status at `/api/auth/google/status` during local development.
