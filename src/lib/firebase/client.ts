import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Firebase client config.
// Saat Next.js build/prerendering di CI/Vercel tanpa env variables, berikan fallback placeholder
// agar initializeApp() tidak melempar auth/invalid-api-key saat modul dievaluasi secara statis.
const isBuilding = typeof window === "undefined" && process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (isBuilding ? "AIzaSy_dummy_build_key_placeholder" : ""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "felys-build.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "felys-build",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

if (!firebaseConfig.apiKey && typeof window !== "undefined") {
  console.error(
    "FELYS: NEXT_PUBLIC_FIREBASE_* belum dikonfigurasi. Isi .env.local — tidak ada fallback kredensial."
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export default app;
