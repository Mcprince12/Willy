
  import firebase from 'firebase' 
  require('@firebase/firestore') 
  const firebaseConfig = {  apiKey: "AIzaSyAMUXvIpiD_3ozosf3NjZ-Fxj7fgRNN1LQ",
  authDomain: "willy-app-608ab.firebaseapp.com",
  projectId: "willy-app-608ab",
  storageBucket: "willy-app-608ab.appspot.com",
  messagingSenderId: "730052214679",
  appId: "1:730052214679:web:75b2d2c46425b5a6f70ed2" }; 
    // Initialize Firebase 
    firebase.initializeApp(firebaseConfig); 
  export default firebase.firestore();