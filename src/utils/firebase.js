import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyA3NsMLi-R8d8S-F__VusmYGONkKTk9xr8",
  authDomain: "chatham-room.firebaseapp.com",
  projectId: "chatham-room",
  storageBucket: "chatham-room.appspot.com",
  messagingSenderId: "678062458841",
  appId: "1:678062458841:web:337f7c4b77bc78e062bbc8",
  measurementId: "G-G77SP8E9K7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

