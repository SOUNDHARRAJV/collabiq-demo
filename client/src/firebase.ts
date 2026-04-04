import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const envFirebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
	appId: import.meta.env.VITE_FIREBASE_APPID,
};

const hasEnvFirebaseConfig = Object.values(envFirebaseConfig).every(Boolean);
const selectedFirebaseConfig = hasEnvFirebaseConfig ? envFirebaseConfig : firebaseConfig;

if (hasEnvFirebaseConfig) {
	console.log('[Trace][Firebase] using environment firebase config');
} else {
	console.log('[Trace][Firebase] using firebase-applet-config.json fallback');
}

const app = initializeApp(selectedFirebaseConfig);
const firestoreDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
export const auth = getAuth(app);

export default app;
