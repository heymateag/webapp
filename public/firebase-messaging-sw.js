// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");


const firebaseConfig = {
  apiKey: "AIzaSyDWkIIlLSGKRkE-ctg1pD-Nnr-2X1FVgB0",
  authDomain: "heymate-telegram.firebaseapp.com",
  projectId: "heymate-telegram",
  storageBucket: "heymate-telegram.appspot.com",
  messagingSenderId: "312331163563",
  appId: "1:312331163563:web:9cd209c922f91781c224ee",
  measurementId: "G-8T8TYXBFW6"
};

firebase.initializeApp(firebaseConfig);

 // Retrieve firebase messaging
 const messaging = firebase.messaging();

 messaging.onBackgroundMessage(function(payload) {
   console.log("Received background message ", payload);
debugger
   const notificationTitle = payload.data.title;
   const notificationOptions = {
     body: payload.data.body,
   };

   self.registration.showNotification(notificationTitle, notificationOptions);
 });