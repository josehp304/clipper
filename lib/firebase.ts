import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCrjmRysiv5rPSbc3pNqKJlf-UYKmkWrmA",
    authDomain: "clipper-451e7.firebaseapp.com",
    projectId: "clipper-451e7",
    storageBucket: "clipper-451e7.firebasestorage.app",
    messagingSenderId: "584288260870",
    appId: "1:584288260870:web:27627d36a0340238e60487",
    measurementId: "G-XJMQ10D934"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
