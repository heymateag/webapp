import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDWkIIlLSGKRkE-ctg1pD-Nnr-2X1FVgB0",
  authDomain: "heymate-telegram.firebaseapp.com",
  projectId: "heymate-telegram",
  storageBucket: "heymate-telegram.appspot.com",
  messagingSenderId: "312331163563",
  appId: "1:312331163563:web:9cd209c922f91781c224ee",
  measurementId: "G-8T8TYXBFW6"
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const fetchToken = (setTokenFound) => {
  return getToken(messaging,
    { vapidKey: 'BJPY050QzdXTdDQDg6ZByNcZIqyrZkmbVpHdYA1mUMgjRk2JDi8tuRmKNAyMkU0VWawVu_QGQzaT1jTAdIJEUWY'})
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