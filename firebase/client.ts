// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEV18_kez9DybK0tR6gVYiL7MP4_Wrd4g",
  authDomain: "interview-b3909.firebaseapp.com",
  projectId: "interview-b3909",
  storageBucket: "interview-b3909.firebasestorage.app",
  messagingSenderId: "785505927563",
  appId: "1:785505927563:web:f6bff2a206d81c8e7eef8e",
  measurementId: "G-72FZLESWTK"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
