import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBtHsgolNepkZmZs0hLJmR5D02AxrAyjYQ",
  authDomain: "oshop-8dde4.firebaseapp.com",
  databaseURL: "https://oshop-8dde4.firebaseio.com",
  projectId: "oshop-8dde4",
  storageBucket: "oshop-8dde4.appspot.com",
  messagingSenderId: "913427173444",
  appId: "1:913427173444:web:4061eeca1a59915c"
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const fetchToken = (setTokenFound) => {
  return getToken(messaging,
    { vapidKey: 'BMKt8Hv3Vk0wYj1R_Cf5sVSTpYujsOqYkYPtyoABh_GLrCXqFGs-7U3Ckl9rYlL0SEvqNXV3r8o1vPDfE9mKoyU'})
    .then((currentToken) => {
      if (currentToken) {
        console.log('current token for client: ', currentToken);
        localStorage.setItem('pushToken', currentToken);
        setTokenFound(true);
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        console.log('No registration token available. Request permission to generate one.');
        setTokenFound(false);
        // shows on the UI that permission is required
      }
      }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
        // catch error while creating client token
      });
    }

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      debugger
      resolve(payload);
    });
});