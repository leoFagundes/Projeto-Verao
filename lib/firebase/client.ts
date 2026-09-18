import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId,
);

function createFirestore(firebaseApp: FirebaseApp): Firestore {
  if (typeof window === "undefined") return getFirestore(firebaseApp);
  try {
    // Persistent (IndexedDB) cache: switching back to a tab, or reopening
    // the app, serves the last-known data instantly from disk while syncing
    // in the background, instead of waiting on a fresh network round-trip
    // every single time — this is most of what made tab switches feel slow.
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialized (e.g. re-evaluated during dev Fast Refresh) or the
    // browser doesn't support IndexedDB (some private-browsing modes) —
    // either way, falling back to the default in-memory cache still works.
    return getFirestore(firebaseApp);
  }
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = createFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, auth, db, storage };
