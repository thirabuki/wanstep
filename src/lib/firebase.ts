import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCq7C9rs-mboIVDao7TnW-BX2FbAmTHjy0",
  authDomain: "takeshipro3-eb635.firebaseapp.com",
  projectId: "takeshipro3-eb635",
  storageBucket: "takeshipro3-eb635.firebasestorage.app",
  messagingSenderId: "178647206972",
  appId: "1:178647206972:web:c36add9b0fc3d222abc739",
  measurementId: "G-Y1K4Y6269C"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };
