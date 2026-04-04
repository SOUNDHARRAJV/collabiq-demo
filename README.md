# CollabIQ AI Studio

CollabIQ is a collaborative workspace app with:
- React + TypeScript frontend (Vite)
- Node.js + Socket.io backend
- Firebase Authentication + Firestore
- Gemini AI task/insight extraction

## Required Services

1. Firebase project
2. Firebase Authentication enabled (Google provider recommended)
3. Firestore database created
4. Google AI Studio API key (Gemini)
5. Node.js 20+ and npm

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create local env file

```bash
cp .env.example .env.local
```

3. Fill all required values in .env.local

Required values:
- VITE_GEMINI_API_KEY
- VITE_FIREBASE_APIKEY
- VITE_FIREBASE_AUTHDOMAIN
- VITE_FIREBASE_PROJECTID
- VITE_FIREBASE_STORAGEBUCKET
- VITE_FIREBASE_MESSAGINGSENDERID
- VITE_FIREBASE_APPID

Optional values:
- VITE_SOCKET_URL
- VITE_GOOGLE_CLIENT_ID

4. Start development server

```bash
npm run dev
```

## Build and Test

Run these before deployment:

```bash
npm run lint
npm run build
npm run preview
```

What each command does:
- npm run lint: TypeScript type checking without emit
- npm run build: Production bundle generation
- npm run preview: Local preview of production output

## Firebase Hosting Deployment

1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

2. Login to Firebase

```bash
firebase login
```

3. Initialize hosting (if not already initialized)

```bash
firebase init hosting
```

Recommended answers:
- Public directory: dist
- Single-page app rewrite: yes
- Auto-build and deploy with GitHub: optional

4. Build production app

```bash
npm run build
```

5. Deploy

```bash
firebase deploy --only hosting
```

## Troubleshooting

1. App fails to start with env errors
- Check .env.local exists in project root
- Verify all VITE_ variables are present and not blank
- Restart dev server after env changes

2. Firebase auth or Firestore permission errors
- Confirm project id and api key match same Firebase project
- Verify Authentication provider is enabled
- Verify Firestore rules allow expected operations

3. Socket presence not updating
- Confirm server is running (npm run dev)
- If using hosted backend, set VITE_SOCKET_URL to that backend
- Inspect browser console for [Trace][Socket] logs

4. Build fails
- Run npm run lint first to identify type errors
- Ensure Node version is modern (Node 20+)
- Remove stale build output and retry

## Production Notes

- Keep secrets out of source control
- Use Firebase Hosting environment management or CI secret store
- Restrict Firestore rules before going public
- Monitor Gemini usage quotas and rate limits
