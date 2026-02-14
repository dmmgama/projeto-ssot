// Firebase Configuration
// SSOT JSJ Template v11.0 - Backend Integration
const firebaseConfig = {
  apiKey: "AIzaSyC9bB2ALUZEdH0iWTqGmEI_GAj2fBT3s6U",
  authDomain: "jsj-ssot-template.firebaseapp.com",
  projectId: "jsj-ssot-template",
  storageBucket: "jsj-ssot-template.firebasestorage.app",
  messagingSenderId: "514380761065",
  appId: "1:514380761065:web:11fa7fddc71128aa0fad78"
};

// JSJ Email Whitelist
// Only users with @jsj.pt emails or explicitly listed emails can access the system
const JSJ_EMAIL_WHITELIST = [
  "david@jsj.pt",
  "outro@jsj.pt"
  // Add more emails as needed
];

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Helper: Check if email is authorized
function isJSJEmail(email) {
  return email.endsWith('@jsj.pt') || 
         JSJ_EMAIL_WHITELIST.includes(email.toLowerCase());
}
