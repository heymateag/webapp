// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");


var firebaseConfig = {
  apiKey: "AIzaSyBtHsgolNepkZmZs0hLJmR5D02AxrAyjYQ",
  authDomain: "oshop-8dde4.firebaseapp.com",
  projectId: "oshop-8dde4",
  storageBucket: "oshop-8dde4.appspot.com",
  messagingSenderId: "913427173444",
  appId: "1:913427173444:web:4061eeca1a59915c"
};

firebase.initializeApp(firebaseConfig);

 // Retrieve firebase messaging
 const messaging = firebase.messaging();

 messaging.onBackgroundMessage(function(payload) {
   console.log("Received background message ", payload);

   const notificationTitle = payload.notification.title;
   const notificationOptions = {
     body: payload.notification.body,
   };

   self.registration.showNotification(notificationTitle, notificationOptions);
 });