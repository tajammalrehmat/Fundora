/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC7ZQUo7hq9ZY7K-vk2j8o6M_5wcslHL38",
  authDomain: "gen-lang-client-0327121259.firebaseapp.com",
  projectId: "gen-lang-client-0327121259",
  storageBucket: "gen-lang-client-0327121259.firebasestorage.app",
  messagingSenderId: "1005239416050",
  appId: "1:1005239416050:web:5e46ce99441b9248facc6b"
};

// Lazy initialization pattern to avoid crashing if Firebase configuration is missing or invalid
let app;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, "ai-studio-investyarealesta-ac1ea9f8-3719-4f80-acc1-938a72544e51");
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase failed to initialize:", error);
}

export { app, db, auth };
